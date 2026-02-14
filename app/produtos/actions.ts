"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/schemas";
import { z } from "zod";

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
};

export async function createProduct(prevState: State, formData: FormData) {
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
  redirect("/produtos");
}

export async function updateProduct(
  id: string,
  prevState: State,
  formData: FormData,
) {
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
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku,
        NOT: {
          id: id,
        },
      },
    });

    if (existingProduct) {
      return {
        message: "SKU já existe em outro produto.",
      };
    }

    await prisma.product.update({
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
  } catch (error) {
    return {
      message: "Erro ao atualizar produto.",
    };
  }

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/produtos");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Erro ao deletar produto." };
  }
}
