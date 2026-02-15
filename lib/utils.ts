export function formatCurrency(value: number | string | any): string {
  const numberValue = Number(value);
  if (isNaN(numberValue))
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDayMonth(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [, m, d] = parts;
    return `${d}/${m}`;
  }
  return dateStr;
}
