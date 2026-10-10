/**
 * تصنيف الإشعارات + الإشعارات الفورية داخل المتصفح.
 * التصنيف يتم من نص الإشعار حتى لا نحتاج تغييراً في قاعدة البيانات.
 */
import type { AppNotification } from "@/types";

export type NotificationCategory = "deposits" | "orders" | "tickets" | "system";

export const NOTIFICATION_CATEGORIES: { id: NotificationCategory | "all"; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "deposits", label: "الإيداعات" },
  { id: "orders", label: "الطلبات" },
  { id: "tickets", label: "التذاكر" },
  { id: "system", label: "تنبيهات النظام" },
];

export function categoryOf(n: Pick<AppNotification, "title" | "message">): NotificationCategory {
  const text = `${n.title} ${n.message}`;
  if (/إيداع|شحن الرصيد|المحفظة|رصيد|كارت|كود الشحن/.test(text)) return "deposits";
  if (/طلب|الطلب|تسليم|شراء|حساب من السوق/.test(text)) return "orders";
  if (/تذكرة|التذكرة|الدعم|محادثة|رد جديد/.test(text)) return "tickets";
  return "system";
}

export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  deposits: "الإيداعات",
  orders: "الطلبات",
  tickets: "التذاكر",
  system: "تنبيهات النظام",
};

/* --------------------------- إشعارات المتصفح --------------------------- */

export function browserPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestBrowserPush(): Promise<boolean> {
  if (!browserPushSupported()) return false;
  try {
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export function showBrowserPush(title: string, body: string): void {
  if (!browserPushSupported() || Notification.permission !== "granted") return;
  try {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      lang: "ar",
      dir: "rtl",
    });
    window.setTimeout(() => notification.close(), 8000);
  } catch {
    /* المتصفح لا يدعم الإشعارات */
  }
}
