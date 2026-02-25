import { describe, it, expect } from "vitest";

// Test the safeStringify logic directly (extracted for testability)
function safeStringify(data: unknown): string | null {
  if (data == null) return null;
  try {
    return JSON.stringify(data, (_key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (value instanceof Date) return value.toISOString();
      if (
        value &&
        typeof value === "object" &&
        typeof value.toFixed === "function"
      ) {
        return value.toString();
      }
      return value;
    });
  } catch {
    return null;
  }
}

describe("safeStringify", () => {
  it("returns null for null input", () => {
    expect(safeStringify(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(safeStringify(undefined)).toBeNull();
  });

  it("serializes plain objects", () => {
    const result = safeStringify({ name: "Test", price: 100 });
    expect(JSON.parse(result!)).toEqual({ name: "Test", price: 100 });
  });

  it("converts Date objects to ISO strings", () => {
    const date = new Date("2025-01-15T10:30:00Z");
    const result = safeStringify({ createdAt: date });
    const parsed = JSON.parse(result!);
    expect(parsed.createdAt).toBe("2025-01-15T10:30:00.000Z");
  });

  it("converts BigInt to string", () => {
    const result = safeStringify({ id: BigInt(123456789) });
    const parsed = JSON.parse(result!);
    expect(parsed.id).toBe("123456789");
  });

  it("converts Decimal-like objects to string", () => {
    // Simulate Prisma Decimal
    const fakeDecimal = {
      toFixed: (n: number) => "99.99",
      toString: () => "99.99",
    };
    const result = safeStringify({ price: fakeDecimal });
    const parsed = JSON.parse(result!);
    expect(parsed.price).toBe("99.99");
  });

  it("handles nested objects", () => {
    const data = {
      order: {
        id: "abc",
        total: 5000,
        items: [{ name: "A" }, { name: "B" }],
      },
    };
    const result = safeStringify(data);
    expect(JSON.parse(result!)).toEqual(data);
  });
});
