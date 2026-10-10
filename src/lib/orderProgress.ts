import type { Order } from "@/types";

export const ORDER_STEPS = [
  { id: "received", label: "تم الاستلام" },
  { id: "review", label: "المراجعة" },
  { id: "processing", label: "قيد التنفيذ" },
  { id: "done", label: "مكتمل" },
] as const;

type OrderLike = Pick<Order, "status" | "category" | "quantity" | "created_at"> &
  Partial<Pick<Order, "estimated_minutes" | "started_at" | "kind">>;

/** Default expected duration (minutes) when the admin has not set one. */
export function expectedMinutes(o: OrderLike): number {
  if (o.estimated_minutes && o.estimated_minutes > 0) return o.estimated_minutes;
  if ((o as { kind?: string }).kind === "account") return 30;
  if (o.category === "digital_cards") return 15;
  return 60 + Math.min(11, Math.floor((o.quantity || 0) / 1000)) * 60;
}

export const isFailed = (status: string) => status === "cancelled" || status === "rejected";

/** Index of the current step (0-3). */
export function currentStep(status: string): number {
  if (status === "completed") return 3;
  if (status === "processing") return 2;
  if (status === "approved") return 2;
  return 1;
}

export function progressPercent(o: OrderLike, now = Date.now()): number {
  if (o.status === "completed") return 100;
  if (isFailed(o.status)) return 0;
  if (o.status === "pending") return 12;
  if (o.status === "approved") return 30;
  const start = new Date(o.started_at || o.created_at).getTime();
  const elapsed = Math.max(0, (now - start) / 60000);
  return Math.round(35 + Math.min(60, (60 * elapsed) / expectedMinutes(o)));
}

export function remainingMinutes(o: OrderLike, now = Date.now()): number {
  if (o.status === "completed" || isFailed(o.status)) return 0;
  const start = new Date(
    o.status === "processing" ? o.started_at || o.created_at : o.created_at,
  ).getTime();
  const elapsed = Math.max(0, (now - start) / 60000);
  return Math.max(0, Math.ceil(expectedMinutes(o) - (o.status === "processing" ? elapsed : 0)));
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "خلال لحظات";
  if (minutes < 60) return `${minutes} دقيقة`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ساعة و${m} دقيقة` : `${h} ساعة`;
}
