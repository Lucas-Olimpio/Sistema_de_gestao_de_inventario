"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { goodsReceiptSchema } from "@/lib/schemas";

export type State = {
  errors?: {
    [key: string]: string[];
  };
  message?: string | null;
  success?: boolean;
};

// --- Goods Receipt (Recebimento) ---

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
    const receiptItems: any[] = [];
    const stockUpdates: any[] = [];
    let actualTotal = 0;

    for (const item of items) {
      const ordered = orderedMap.get(item.productId);
      const hasDivergence = ordered
        ? item.receivedQty !== ordered.quantity
        : true;

      if (ordered) {
        actualTotal += item.receivedQty * ordered.unitPrice;
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
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create Goods Receipt
      await tx.goodsReceipt.create({
        data: {
          purchaseOrderId,
          notes: notes || null,
          items: { create: receiptItems },
        },
      });

      // 2. Update PO Status
      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: "RECEBIDA" },
      });

      // 3. Update PO Items receivedQty
      for (const item of items) {
        const poItem = orderedMap.get(item.productId);
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: item.receivedQty },
          });
        }
      }

      // 4. Update Stock & Create Movements
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.productId },
          data: { quantity: { increment: update.receivedQty } },
        });

        await tx.stockMovement.create({
          data: {
            productId: update.productId,
            type: "IN",
            quantity: update.receivedQty,
            reason: update.reason,
          },
        });
      }

      // 5. Create Payable
      await tx.accountsPayable.create({
        data: {
          purchaseOrderId,
          amount: actualTotal,
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
