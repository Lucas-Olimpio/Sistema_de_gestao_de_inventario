import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  description: z.string().optional(),
  sku: z.string().min(1, "O SKU é obrigatório"),
  price: z.coerce
    .number()
    .min(0.01, "O preço deve ser maior que 0")
    .transform((val) => Math.round(val * 100)),
  quantity: z.coerce
    .number()
    .int()
    .min(0, "A quantidade não pode ser negativa"),
  minStock: z.coerce
    .number()
    .int()
    .min(0, "O estoque mínimo não pode ser negativo"),
  categoryId: z.string().uuid("Selecione uma categoria válida"),
});

export const goodsReceiptLoadSchema = z.object({
  productId: z.string().uuid(),
  receivedQty: z.coerce.number().int().min(0),
});

export const goodsReceiptSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  items: z.array(goodsReceiptLoadSchema).min(1, "Adicione pelo menos um item"),
  notes: z.string().optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1, "Quantidade deve ser pelo menos 1"),
  unitPrice: z.coerce
    .number()
    .min(0.01, "Preço unitário inválido")
    .transform((val) => Math.round(val * 100)),
});

export const salesOrderSchema = z.object({
  customerId: z.string().uuid("Selecione um cliente"),
  items: z.array(orderItemSchema).min(1, "Adicione pelo menos um item"),
  notes: z.string().optional(),
});

export type ProductSchema = z.infer<typeof productSchema>;

export const purchaseOrderSchema = z.object({
  supplierId: z.string().uuid("Selecione um fornecedor"),
  items: z.array(orderItemSchema).min(1, "Adicione pelo menos um item"),
  notes: z.string().optional(),
});
