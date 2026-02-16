"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { salesOrderSchema } from "@/lib/schemas";

// --- Sales Order (Vendas) ---

export async function createSalesOrderAction(
  data: z.infer<typeof salesOrderSchema>,
) {
  const validatedFields = salesOrderSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Erro de validação",
    };
  }

  const { customerId, items, notes } = validatedFields.data;

  try {
    // Generate Code
    const lastOrder = await prisma.salesOrder.findFirst({
      orderBy: { code: "desc" },
      select: { code: true },
    });

    let nextNumber = 1;
    if (lastOrder) {
      const match = lastOrder.code.match(/VD-(\d+)/);
      if (match) nextNumber = parseInt(match[1]) + 1;
    }
    const code = `VD-${String(nextNumber).padStart(4, "0")}`;

    // Calculate Total
    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    await prisma.salesOrder.create({
      data: {
        code,
        customerId,
        notes: notes || null,
        totalValue,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
    });

    revalidatePath("/pedidos");
    return { success: true, message: "Pedido criado com sucesso" };
  } catch (error) {
    console.error("Error creating sales order:", error);
    return { success: false, message: "Erro ao criar pedido" };
  }
}

export async function updateSalesOrderStatusAction(id: string, status: string) {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return { success: false, message: "Pedido não encontrado" };
    }

    const validTransitions: Record<string, string[]> = {
      PENDENTE: ["APROVADA", "CANCELADA"],
      APROVADA: ["FATURADA", "CANCELADA"],
    };

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      return {
        success: false,
        message: `Transição inválida de ${order.status} para ${status}`,
      };
    }

    // Special logic for FATURADA (Stock deduction + Receivable)
    if (status === "FATURADA") {
      await prisma.$transaction(async (tx) => {
        // Check stock
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!product || product.quantity < item.quantity) {
            throw new Error(
              `Estoque insuficiente para produto ${product?.name || item.productId}`,
            );
          }
        }

        // Update status
        await tx.salesOrder.update({
          where: { id },
          data: { status: "FATURADA" },
        });

        // Deduct Stock & Create Movements
        for (const item of order.items) {
          await tx.product.update({
            where: {
              id: item.productId,
              quantity: { gte: item.quantity },
            },
            data: { quantity: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "OUT",
              quantity: item.quantity,
              reason: `Venda ${order.code}`,
            },
          });
        }

        // Create Receivable
        await tx.accountsReceivable.create({
          data: {
            salesOrderId: id,
            amount: order.totalValue,
          },
        });
      });
    } else {
      // Simple update
      await prisma.salesOrder.update({
        where: { id },
        data: { status },
      });
    }

    revalidatePath("/pedidos");
    return { success: true, message: "Status atualizado com sucesso" };
  } catch (error: any) {
    console.error("Error updating sales order:", error);
    return {
      success: false,
      message: error.message || "Erro ao atualizar pedido",
    };
  }
}

export async function deleteSalesOrderAction(id: string) {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!order) return { success: false, message: "Pedido não encontrado" };
    if (order.status !== "PENDENTE") {
      return {
        success: false,
        message: "Apenas pedidos pendentes podem ser excluídos",
      };
    }

    await prisma.salesOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/pedidos");
    return { success: true, message: "Pedido excluído" };
  } catch (error) {
    return { success: false, message: "Erro ao excluir pedido" };
  }
}
