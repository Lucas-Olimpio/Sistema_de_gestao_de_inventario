import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("nfeFile") as File | null;
    let nfePath: string | null = null;

    if (file && file.size > 0) {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Apenas arquivos PDF são permitidos." },
          { status: 400 },
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `${uniqueSuffix}-${file.name.replace(/\s/g, "-")}`;
      const uploadDir = join(process.cwd(), "public/uploads");
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      nfePath = `/uploads/${filename}`;
    }

    const purchaseOrderId = formData.get("purchaseOrderId") as string;
    const itemsRaw = formData.get("items") as string;

    if (!purchaseOrderId || !itemsRaw) {
      return NextResponse.json(
        { error: "Dados incompletos (ID do Pedido ou Itens faltando)." },
        { status: 400 },
      );
    }

    const items = JSON.parse(itemsRaw);

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });

    if (!po) {
      return NextResponse.json(
        { error: "Ordem de compra não encontrada" },
        { status: 404 },
      );
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
      const productId = item.productId;
      const receivedQty = Number(item.receivedQty);
      const expectedQty = Number(item.expectedQty);

      const ordered = orderedMap.get(productId);

      const hasDivergence = ordered ? receivedQty !== ordered.quantity : true;

      if (ordered) {
        const lineTotal = ordered.unitPrice.mul(receivedQty);
        runningTotal = runningTotal.add(lineTotal);
      }

      receiptItems.push({
        productId,
        receivedQty,
        hasDivergence,
      });

      if (receivedQty > 0) {
        stockUpdates.push({
          productId,
          receivedQty,
          reason: `Recebimento PO ${po.code}`,
          unitPrice: ordered ? ordered.unitPrice : new Prisma.Decimal(0),
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.create({
        data: {
          purchaseOrderId,
          nfePath,
          notes: (formData.get("notes") as string) || null,
          items: {
            create: receiptItems,
          },
        },
      });

      // Update PO Items — increment receivedQty (supports partial receipts)
      for (const item of items) {
        const poItem = orderedMap.get(item.productId);
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: { increment: Number(item.receivedQty) } },
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

      for (const update of stockUpdates) {
        const product = await tx.product.findUnique({
          where: { id: update.productId },
        });

        if (product) {
          // Weighted average cost
          const currentTotalValue =
            Number(product.quantity) * Number(product.costPrice);
          const newItemsValue = update.receivedQty * Number(update.unitPrice);
          const newTotalQty = Number(product.quantity) + update.receivedQty;

          const averageCost =
            newTotalQty > 0
              ? (currentTotalValue + newItemsValue) / newTotalQty
              : Number(update.unitPrice);

          await tx.product.update({
            where: { id: update.productId },
            data: {
              quantity: { increment: update.receivedQty },
              costPrice: new Prisma.Decimal(averageCost),
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            productId: update.productId,
            type: "IN",
            quantity: update.receivedQty,
            reason: update.reason,
          },
        });
      }

      // Upsert payable (1-to-1 with PO)
      if (runningTotal.gt(0)) {
        const existing = await tx.accountsPayable.findUnique({
          where: { purchaseOrderId },
        });

        if (existing) {
          await tx.accountsPayable.update({
            where: { id: existing.id },
            data: {
              amount: { increment: runningTotal },
            },
          });
        } else {
          await tx.accountsPayable.create({
            data: {
              purchaseOrderId,
              amount: runningTotal,
            },
          });
        }
      }

      return receipt;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Erro no processamento do recebimento:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor: " + error.message },
      { status: 500 },
    );
  }
}
