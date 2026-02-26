"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/schemas";
import { z } from "zod";
import { auth } from "@/lib/auth";

export type State = {
  errors?: {
    name?: string[];
    sku?: string[];
    description?: string[];
    price?: string[];
    quantity?: string[];
    minStock?: string[];
    categoryId?: string[];
  };
  message?: string | null;
  success?: boolean;
};

export async function createProduct(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const session = await auth();
  if (session?.user?.role === "VISUALIZADOR") {
    return {
      success: false,
      message: "Acesso negado: Visualizadores não podem criar produtos.",
    };
  }

  const validatedFields = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    description: formData.get("description"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    minStock: formData.get("minStock"),
    categoryId: formData.get("categoryId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Campos inválidos. Por favor, verifique os erros.",
    };
  }

  const { name, sku, description, price, quantity, minStock, categoryId } =
    validatedFields.data;

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return {
        message: "SKU já existe.",
      };
    }

    await prisma.product.create({
      data: {
        name,
        sku,
        description,
        price,
        quantity,
        minStock,
        categoryId,
      },
    });
  } catch (error) {
    return {
      message: "Erro ao criar produto no banco de dados.",
    };
  }

  revalidatePath("/produtos");
  return {
    success: true,
    message: "Produto criado com sucesso!",
  };
}

export async function updateProduct(
  id: string,
  prevState: State,
  formData: FormData,
): Promise<State> {
  const session = await auth();
  if (session?.user?.role === "VISUALIZADOR") {
    return {
      success: false,
      message: "Acesso negado: Visualizadores não podem editar produtos.",
    };
  }

  const validatedFields = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    description: formData.get("description"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    minStock: formData.get("minStock"),
    categoryId: formData.get("categoryId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Campos inválidos. Por favor, verifique os erros.",
    };
  }

  const { name, sku, description, price, quantity, minStock, categoryId } =
    validatedFields.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Check SKU uniqueness atomically within the transaction
      const existingProduct = await tx.product.findFirst({
        where: {
          sku,
          NOT: { id },
        },
      });

      if (existingProduct) {
        throw new Error("SKU_DUPLICATE");
      }

      // Get current product to detect quantity changes
      const current = await tx.product.findUnique({ where: { id } });
      if (!current) throw new Error("PRODUCT_NOT_FOUND");

      // Update product
      await tx.product.update({
        where: { id },
        data: {
          name,
          sku,
          description,
          price,
          quantity,
          minStock,
          categoryId,
        },
      });

      // If quantity changed, create a stock adjustment movement for traceability
      const diff = quantity - current.quantity;
      if (diff !== 0) {
        await tx.stockMovement.create({
          data: {
            productId: id,
            type: diff > 0 ? "IN" : "OUT",
            quantity: Math.abs(diff),
            reason: "Ajuste manual de estoque",
          },
        });
      }
    });
  } catch (error: any) {
    if (error.message === "SKU_DUPLICATE") {
      return { message: "SKU já existe em outro produto." };
    }
    if (error.message === "PRODUCT_NOT_FOUND") {
      return { message: "Produto não encontrado." };
    }
    return {
      message: "Erro ao atualizar produto.",
    };
  }

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function deleteProduct(id: string) {
  const session = await auth();
  if (session?.user?.role === "VISUALIZADOR") {
    return {
      success: false,
      message: "Acesso negado: Visualizadores não podem remover produtos.",
    };
  }

  try {
    // Atomic soft-delete: read + update in a single transaction
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) throw new Error("NOT_FOUND");

      await tx.product.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          sku: `${product.sku}-DELETED-${Date.now()}`,
        },
      });
    });
    revalidatePath("/produtos");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Erro ao deletar produto." };
  }
}
