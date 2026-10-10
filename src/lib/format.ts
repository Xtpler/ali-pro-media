export function formatIQD(value: number): string {
  return `${new Intl.NumberFormat("ar-IQ").format(value)} د.ع`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function normalizePhone(value: string): string {
  const trimmed = value.trim().replace(/\s/g, "");
  if (trimmed.startsWith("+964")) return trimmed;
  if (trimmed.startsWith("07")) return `+964${trimmed.slice(1)}`;
  return trimmed;
}

export function isPhone(value: string): boolean {
  return /^(\+964|07)7?\d{9}$/.test(value.trim().replace(/\s/g, ""));
}
