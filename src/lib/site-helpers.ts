export { sanitizeText } from "@/lib/sanitize";

export function translateVoucherError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("used")) return "هذا الكود مستخدم مسبقاً.";
  if (m.includes("not found") || m.includes("invalid")) return "الكود غير صحيح أو غير موجود.";
  if (m.includes("rate")) return "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.";
  return "تعذّر استخدام هذا الكود. تأكد من صحته.";
}
