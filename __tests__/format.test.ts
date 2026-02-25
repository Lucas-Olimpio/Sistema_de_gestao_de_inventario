import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  parseCurrency,
  formatCentsToFloat,
} from "@/lib/format";

describe("format.ts - formatCurrency", () => {
  it("formats cents to BRL string", () => {
    expect(formatCurrency(1000)).toBe("R$\u00A010,00");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("R$\u00A00,00");
  });

  it("handles large values", () => {
    const result = formatCurrency(1000000);
    expect(result).toContain("10.000,00");
  });
});

describe("format.ts - parseCurrency", () => {
  it("parses BRL string to cents", () => {
    expect(parseCurrency("R$ 25,50")).toBe(2550);
  });

  it("handles empty string", () => {
    expect(parseCurrency("")).toBe(0);
  });
});

describe("format.ts - formatCentsToFloat", () => {
  it("converts 1000 cents to 10.00", () => {
    expect(formatCentsToFloat(1000)).toBe(10);
  });

  it("converts 0 to 0", () => {
    expect(formatCentsToFloat(0)).toBe(0);
  });

  it("converts 999 cents to 9.99", () => {
    expect(formatCentsToFloat(999)).toBe(9.99);
  });
});
