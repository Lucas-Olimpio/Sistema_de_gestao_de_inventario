import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  parseCurrency,
  formatDateShort,
  formatDayMonth,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats integer cents to BRL string", () => {
    expect(formatCurrency(1000)).toBe("R$\u00A010,00");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("R$\u00A00,00");
  });

  it("handles string input", () => {
    expect(formatCurrency("2500")).toBe("R$\u00A025,00");
  });

  it("returns R$ 0,00 for NaN input", () => {
    expect(formatCurrency("abc")).toBe("R$\u00A00,00");
  });

  it("handles negative values", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("5,00");
  });
});

describe("parseCurrency", () => {
  it("parses simple BRL string to cents", () => {
    expect(parseCurrency("R$ 10,00")).toBe(1000);
  });

  it("parses value with thousands separator", () => {
    expect(parseCurrency("R$ 1.234,56")).toBe(123456);
  });

  it("returns 0 for empty string", () => {
    expect(parseCurrency("")).toBe(0);
  });
});

describe("formatDateShort", () => {
  it("formats ISO date to dd/mm/yyyy", () => {
    const result = formatDateShort("2025-01-15T10:00:00Z");
    expect(result).toMatch(/15\/01\/2025/);
  });
});

describe("formatDayMonth", () => {
  it("extracts day/month from YYYY-MM-DD", () => {
    expect(formatDayMonth("2025-03-20")).toBe("20/03");
  });

  it("returns original string if not in expected format", () => {
    expect(formatDayMonth("invalid")).toBe("invalid");
  });
});
