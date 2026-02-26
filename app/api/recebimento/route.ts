import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import Decimal from "decimal.js";

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
      unitPrice: Decimal;
    };

    const receiptItems: ReceiptItem[] = [];
    const stockUpdates: StockUpdate[] = [];
    let runningTotal = new Decimal(0);

    for (const item of items) {
      const productId = item.productId;
      const receivedQty = Number(item.receivedQty);
      const expectedQty = Number(item.expectedQty);

      const ordered = orderedMap.get(productId);

      const hasDivergence = ordered ? receivedQty !== ordered.quantity : true;

      if (ordered) {
        const unitPrice = new Decimal(String((ordered as any).unitPrice ?? 0));
        const lineTotal = unitPrice.mul(receivedQty);
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
          unitPrice: ordered
            ? new Decimal(String((ordered as any).unitPrice ?? 0))
            : new Decimal(0),
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
          // Weighted average cost using decimal.js
          const currentTotalValue = new Decimal(String(product.quantity)).mul(
            new Decimal(String(product.costPrice)),
          );
          const newItemsValue = new Decimal(update.receivedQty).mul(
            new Decimal(String(update.unitPrice)),
          );
          const newTotalQty = new Decimal(String(product.quantity)).add(
            new Decimal(update.receivedQty),
          );

          const averageCost = newTotalQty.gt(0)
            ? currentTotalValue.add(newItemsValue).div(newTotalQty)
            : new Decimal(String(update.unitPrice));

          await tx.product.update({
            where: { id: update.productId },
            data: {
              quantity: { increment: update.receivedQty },
              costPrice: averageCost.toString(),
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
              amount: { increment: runningTotal.toString() },
            },
          });
        } else {
          await tx.accountsPayable.create({
            data: {
              purchaseOrderId,
              amount: runningTotal.toString(),
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
