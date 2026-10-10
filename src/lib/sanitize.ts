/* تنظيف المدخلات من أكواد HTML/JS ومنع الروابط الخطرة */

const TAG_RE = /<[^>]*>/g;

export function sanitizeText(value: string, maxLength = 2000): string {
  return (
    value
      .replace(TAG_RE, "")
      // Strip ASCII control characters (intentional, for input hardening).
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on[a-z]+\s*=/gi, "")
      .trim()
      .slice(0, maxLength)
  );
}

export function sanitizeUrl(value: string): string {
  const clean = sanitizeText(value, 500);
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  if (/^@?[\w.-]{2,60}$/.test(clean)) return clean; // اسم مستخدم أو معرف
  return clean.replace(/^[^\w@]+/, "");
}

export function isSafeLink(value: string): boolean {
  const clean = value.trim();
  if (!clean) return false;
  if (/^https?:\/\//i.test(clean)) {
    try {
      new URL(clean);
      return true;
    } catch {
      return false;
    }
  }
  return /^@?[\w.-]{2,60}$/.test(clean);
}
