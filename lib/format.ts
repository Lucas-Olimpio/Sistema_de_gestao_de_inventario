export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove currency symbol, dots and replace comma with dot
  const cleanValue = value.replace(/[^\d,]/g, "").replace(",", ".");
  const floatValue = parseFloat(cleanValue);
  return Math.round(floatValue * 100);
};

export const formatCentsToFloat = (value: number): number => {
  return value / 100;
};
