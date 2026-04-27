import { describe, it, expect } from "vitest";
import {
  productSchema,
  purchaseOrderSchema,
  salesOrderSchema,
  goodsReceiptSchema,
} from "@/lib/schemas";

// ─── productSchema ──────────────────────────────────────

describe("productSchema", () => {
  it("accepts valid product data", () => {
    const result = productSchema.safeParse({
      name: "Teclado Mecânico",
      sku: "TEC-001",
      price: 299.9,
      quantity: 50,
      minStock: 5,
      categoryId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = productSchema.safeParse({
      sku: "TEC-001",
      price: 100,
      quantity: 10,
      minStock: 5,
      categoryId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing SKU", () => {
    const result = productSchema.safeParse({
      name: "Teclado",
      price: 100,
      quantity: 10,
      minStock: 5,
      categoryId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects price of zero", () => {
    const result = productSchema.safeParse({
      name: "Teclado",
      sku: "TEC-001",
      price: 0,
      quantity: 10,
      minStock: 5,
      categoryId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = productSchema.safeParse({
      name: "Teclado",
      sku: "TEC-001",
      price: 100,
      quantity: -1,
      minStock: 5,
      categoryId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid categoryId (not UUID)", () => {
    const result = productSchema.safeParse({
      name: "Teclado",
      sku: "TEC-001",
      price: 100,
      quantity: 10,
      minStock: 5,
      categoryId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string numbers correctly", () => {
    const result = productSchema.safeParse({
      name: "Teclado",
      sku: "TEC-001",
      price: "299.90",
      quantity: "50",
      minStock: "5",
      categoryId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(299.9);
      expect(result.data.quantity).toBe(50);
      expect(result.data.minStock).toBe(5);
    }
  });

  it("accepts optional description", () => {
    const result = productSchema.safeParse({
      name: "Teclado",
      description: "Teclado mecânico RGB",
      sku: "TEC-001",
      price: 100,
      quantity: 10,
      minStock: 5,
      categoryId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
    expect(result.success).toBe(true);
  });
});

// ─── purchaseOrderSchema ────────────────────────────────

describe("purchaseOrderSchema", () => {
  const validItem = {
    productId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    quantity: 10,
    unitPrice: 50.0,
  };

  it("accepts valid purchase order", () => {
    const result = purchaseOrderSchema.safeParse({
      supplierId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items array", () => {
    const result = purchaseOrderSchema.safeParse({
      supplierId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid supplierId", () => {
    const result = purchaseOrderSchema.safeParse({
      supplierId: "invalid",
      items: [validItem],
    });
    expect(result.success).toBe(false);
  });

  it("rejects item with zero quantity", () => {
    const result = purchaseOrderSchema.safeParse({
      supplierId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [{ ...validItem, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects item with zero unitPrice", () => {
    const result = purchaseOrderSchema.safeParse({
      supplierId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [{ ...validItem, unitPrice: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional notes", () => {
    const result = purchaseOrderSchema.safeParse({
      supplierId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [validItem],
      notes: "Entrega urgente",
    });
    expect(result.success).toBe(true);
  });
});

// ─── salesOrderSchema ───────────────────────────────────

describe("salesOrderSchema", () => {
  const validItem = {
    productId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    quantity: 2,
    unitPrice: 149.9,
  };

  it("accepts valid sales order", () => {
    const result = salesOrderSchema.safeParse({
      customerId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing customerId", () => {
    const result = salesOrderSchema.safeParse({
      items: [validItem],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty items", () => {
    const result = salesOrderSchema.safeParse({
      customerId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts with installments", () => {
    const result = salesOrderSchema.safeParse({
      customerId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [validItem],
      installments: [{ number: 1, amount: 149.9, dueDate: "2026-04-01" }],
    });
    expect(result.success).toBe(true);
  });
});

// ─── goodsReceiptSchema ─────────────────────────────────

describe("goodsReceiptSchema", () => {
  it("accepts valid goods receipt", () => {
    const result = goodsReceiptSchema.safeParse({
      purchaseOrderId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [
        {
          productId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          receivedQty: 10,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items", () => {
    const result = goodsReceiptSchema.safeParse({
      purchaseOrderId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid purchaseOrderId", () => {
    const result = goodsReceiptSchema.safeParse({
      purchaseOrderId: "not-valid",
      items: [
        {
          productId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          receivedQty: 5,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative receivedQty", () => {
    const result = goodsReceiptSchema.safeParse({
      purchaseOrderId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [
        {
          productId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          receivedQty: -1,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero receivedQty", () => {
    const result = goodsReceiptSchema.safeParse({
      purchaseOrderId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [
        {
          productId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          receivedQty: 0,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional notes", () => {
    const result = goodsReceiptSchema.safeParse({
      purchaseOrderId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      items: [
        {
          productId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          receivedQty: 10,
        },
      ],
      notes: "Entrega parcial",
    });
    expect(result.success).toBe(true);
  });
});
