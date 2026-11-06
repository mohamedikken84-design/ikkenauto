export function formatEur(value: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("nl-BE").format(value);
}

export function formatKm(value: number) {
  return `${formatNumber(value)} km`;
}

export function formatCount(value: number) {
  return value === 1 ? "1 auto" : `${formatNumber(value)} auto's`;
}

export function formatRegistration(isoMonth: string) {
  const [year, month] = isoMonth.split("-");
  return `${month}/${year}`;
}

export function registrationYear(isoMonth: string) {
  return Number(isoMonth.slice(0, 4));
}

export function powerHp(powerKw: number) {
  return Math.round(powerKw * 1.35962);
}
