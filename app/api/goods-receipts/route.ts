import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const receipts = await prisma.goodsReceipt.findMany({
      include: {
        purchaseOrder: {
          select: { code: true, supplier: { select: { name: true } } },
        },
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Error fetching goods receipts:", error);
    return NextResponse.json(
      { error: "Erro ao buscar recebimentos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { purchaseOrderId, notes, items } = body;

    if (!purchaseOrderId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Ordem de compra e itens são obrigatórios" },
        { status: 400 },
      );
    }

    // Fetch the PO with items
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

    if (po.status !== "EM_TRANSITO" && po.status !== "APROVADA") {
      return NextResponse.json(
        {
          error: `Ordem de compra com status "${po.status}" não pode ser recebida`,
        },
        { status: 400 },
      );
    }

    // Build a map of ordered quantities
    const orderedMap = new Map(po.items.map((item) => [item.productId, item]));

    // Process received items
    const receiptItems: Array<{
      productId: string;
      receivedQty: number;
      hasDivergence: boolean;
    }> = [];

    const stockUpdates: Array<{
      productId: string;
      receivedQty: number;
    }> = [];

    for (const receivedItem of items as Array<{
      productId: string;
      receivedQty: number;
    }>) {
      const ordered = orderedMap.get(receivedItem.productId);
      const hasDivergence = ordered
        ? receivedItem.receivedQty !== ordered.quantity
        : true;

      receiptItems.push({
        productId: receivedItem.productId,
        receivedQty: receivedItem.receivedQty,
        hasDivergence,
      });

      stockUpdates.push({
        productId: receivedItem.productId,
        receivedQty: receivedItem.receivedQty,
      });
    }

    // Calculate actual received total for accounts payable
    let actualTotal = 0;
    for (const receivedItem of items as Array<{
      productId: string;
      receivedQty: number;
    }>) {
      const ordered = orderedMap.get(receivedItem.productId);
      if (ordered) {
        actualTotal += receivedItem.receivedQty * ordered.unitPrice;
      }
    }

    // Execute all in a transaction
    const operations = [];

    // 1. Create the goods receipt
    operations.push(
      prisma.goodsReceipt.create({
        data: {
          purchaseOrderId,
          notes: notes || null,
          items: {
            create: receiptItems,
          },
        },
        include: {
          items: {
            include: { product: { select: { name: true, sku: true } } },
          },
        },
      }),
    );

    // 2. Update PO status to RECEBIDA
    operations.push(
      prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: "RECEBIDA" },
      }),
    );

    // 3. Update receivedQty on PO items
    for (const receivedItem of items as Array<{
      productId: string;
      receivedQty: number;
    }>) {
      const poItem = orderedMap.get(receivedItem.productId);
      if (poItem) {
        operations.push(
          prisma.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: receivedItem.receivedQty },
          }),
        );
      }
    }

    // 4. Update product stock and create stock movements
    for (const upd of stockUpdates) {
      if (upd.receivedQty > 0) {
        operations.push(
          prisma.product.update({
            where: { id: upd.productId },
            data: { quantity: { increment: upd.receivedQty } },
          }),
        );
        operations.push(
          prisma.stockMovement.create({
            data: {
              productId: upd.productId,
              type: "IN",
              quantity: upd.receivedQty,
              reason: `Recebimento PO ${po.code}`,
            },
          }),
        );
      }
    }

    // 5. Create accounts payable
    operations.push(
      prisma.accountsPayable.create({
        data: {
          purchaseOrderId,
          amount: actualTotal,
        },
      }),
    );

    const results = await prisma.$transaction(operations);
    const goodsReceipt = results[0];

    return NextResponse.json(
      {
        receipt: goodsReceipt,
        divergences: receiptItems.filter((i) => i.hasDivergence),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating goods receipt:", error);
    return NextResponse.json(
      { error: "Erro ao registrar recebimento" },
      { status: 500 },
    );
  }
}
