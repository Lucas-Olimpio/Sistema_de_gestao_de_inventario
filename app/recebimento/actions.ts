"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { goodsReceiptSchema } from "@/lib/schemas";
import { Prisma } from "@prisma/client";

export type State = {
  errors?: {
    [key: string]: string[];
  };
  message?: string | null;
  success?: boolean;
};

export async function createGoodsReceipt(
  prevState: State,
  formData: FormData,
): Promise<State> {
  return { message: "Use direct call signature", success: false };
}

export async function createGoodsReceiptAction(
  data: z.infer<typeof goodsReceiptSchema>,
) {
  const validatedFields = goodsReceiptSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Erro de validação",
    };
  }

  const { purchaseOrderId, items, notes } = validatedFields.data;

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });

    if (!po) {
      return { success: false, message: "Ordem de compra não encontrada" };
    }

    if (po.status !== "EM_TRANSITO" && po.status !== "APROVADA") {
      return {
        success: false,
        message: `Ordem com status "${po.status}" não pode ser recebida`,
      };
    }

    const orderedMap = new Map(po.items.map((item) => [item.productId, item]));

    type ReceiptItem = {
      productId: string;
      receivedQty: number;
      hasDivergence: boolean;
    };

    type StockUpdate = {
      productId: string;
      receivedQty: number;
      reason: string;
      unitPrice: Prisma.Decimal;
    };

    const receiptItems: ReceiptItem[] = [];
    const stockUpdates: StockUpdate[] = [];

    let runningTotal = new Prisma.Decimal(0);

    for (const item of items) {
      const ordered = orderedMap.get(item.productId);
      const hasDivergence = ordered
        ? item.receivedQty !== ordered.quantity
        : true;

      if (ordered) {
        const lineTotal = ordered.unitPrice.mul(item.receivedQty);
        runningTotal = runningTotal.add(lineTotal);
      }

      receiptItems.push({
        productId: item.productId,
        receivedQty: item.receivedQty,
        hasDivergence,
      });

      if (item.receivedQty > 0) {
        stockUpdates.push({
          productId: item.productId,
          receivedQty: item.receivedQty,
          reason: `Recebimento PO ${po.code}`,
          unitPrice: ordered ? ordered.unitPrice : new Prisma.Decimal(0),
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.goodsReceipt.create({
        data: {
          purchaseOrderId,
          notes: notes || null,
          items: { create: receiptItems },
        },
      });

      // Update PO Items receivedQty
      for (const item of items) {
        const poItem = orderedMap.get(item.productId);
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: item.receivedQty },
          });
        }
      }

      const updatedPO = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: { items: true },
      });

      const isFullyReceived = updatedPO?.items.every(
        (item) => item.receivedQty >= item.quantity,
      );

      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: isFullyReceived ? "RECEBIDA" : "EM_TRANSITO" },
      });

      // Update stock atomically via raw SQL (weighted average cost)
      for (const update of stockUpdates) {
        const unitPriceNum = Number(update.unitPrice);
        const qty = update.receivedQty;

        await tx.$executeRaw`
          UPDATE "Product" SET
            "quantity" = "quantity" + ${qty},
            "costPrice" = CASE
              WHEN "quantity" + ${qty} > 0
              THEN ("quantity" * "costPrice" + ${qty} * ${unitPriceNum}) / ("quantity" + ${qty})
              ELSE ${unitPriceNum}
            END,
            "updatedAt" = ${new Date().toISOString()}
          WHERE "id" = ${update.productId}
        `;

        await tx.stockMovement.create({
          data: {
            productId: update.productId,
            type: "IN",
            quantity: update.receivedQty,
            reason: update.reason,
          },
        });
      }

      await tx.accountsPayable.create({
        data: {
          purchaseOrderId,
          amount: runningTotal,
        },
      });
    });

    revalidatePath("/recebimento");
    revalidatePath("/produtos");
    revalidatePath("/compras");
    return { success: true, message: "Recebimento registrado com sucesso" };
  } catch (error) {
    console.error("Error creating goods receipt:", error);
    return { success: false, message: "Erro interno no servidor" };
  }
}
