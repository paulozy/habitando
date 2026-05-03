const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const brlPreciso = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const monthShort = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
});

export function formatBRL(value: number): string {
  return brl.format(Math.round(value));
}

export function formatBRLPreciso(value: number): string {
  return brlPreciso.format(value);
}

export function formatBRLSinal(value: number): string {
  if (value >= 0) return formatBRL(value);
  return "–" + formatBRL(Math.abs(value));
}

export function formatPercent(decimal: number): string {
  return percent.format(decimal);
}

export function formatPercentDe100(value: number): string {
  return percent.format(value / 100);
}

/** Recebe um Date e devolve "mai/26" */
export function formatMesAno(date: Date): string {
  return monthShort.format(date).replace(".", "").replace(" de ", "/");
}

/** Mês 1-based + data inicial → "mai/26" */
export function formatMesNome(mes: number, dataInicio: Date): string {
  const d = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + (mes - 1), 1);
  return formatMesAno(d);
}
