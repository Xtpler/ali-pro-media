import { createHash, randomInt } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/**
 * Password reset via a 6-digit OTP.
 * Codes are hashed and stored in-memory plus (when available) a Supabase table
 * so the flow survives multi-instance production deploys.
 */

type OtpEntry = { hash: string; expires: number; attempts: number; verified: boolean };

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 6;
const store = new Map<string, OtpEntry>();

function normalizeEmail(email: string): string {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

function otpEmailHtml(code: string): string {
  const origin = process.env["PUBLIC_APP_URL"] || "https://alipromedia4.com";
  const logo = `${origin}/apple-icon.png`;
  const digits = code
    .split("")
    .map(
      (d) =>
        `<td style="padding:0 4px;"><span style="display:inline-block;min-width:42px;padding:12px 0;border-radius:12px;background:#ecfdf5;border:1px solid rgba(16,185,129,.35);color:#047857;font-size:26px;font-weight:800;font-family:'Courier New',monospace;">${d}</span></td>`,
    )
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:28px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="text-align:center;margin-bottom:22px;">
        <tr>
          <td>
            <img src="${logo}" alt="Ali Pro Media" width="56" height="56" style="border-radius:16px;display:block;margin:0 auto 10px;" />
            <div style="font-size:22px;font-weight:800;color:#0f172a;">Ali Pro Media</div>
            <div style="color:#059669;font-size:12px;letter-spacing:2px;margin-top:4px;">DIGITAL COMMERCE</div>
          </td>
        </tr>
      </table>
      <div style="background:#ffffff;border:1px solid rgba(15,23,42,.08);border-radius:24px;padding:28px 24px;">
        <h1 style="margin:0 0 8px;color:#0f172a;font-size:20px;">رمز التحقق لاستعادة كلمة المرور</h1>
        <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.9;">
          أهلاً بك في <b style="color:#0f172a;">Ali Pro Media</b>. استخدم الرمز التالي لإكمال إعادة التعيين. صلاحية الرمز <b style="color:#047857;">10 دقائق</b>.
        </p>
        <table align="center" cellpadding="0" cellspacing="0" dir="ltr" style="margin:8px auto 20px;">
          <tr>${digits}</tr>
        </table>
        <p style="margin:0;color:#64748b;font-size:12px;line-height:1.8;">
          إذا لم تطلب هذا الرمز، تجاهل الرسالة. حسابك يبقى آمناً ولن يتغيّر شيء.
        </p>
      </div>
      <p style="text-align:center;margin:20px 0 0;color:#64748b;font-size:11px;">
        © ${new Date().getFullYear()} Ali Pro Media — جميع الحقوق محفوظة
      </p>
    </div>
  </body>
</html>`;
}

async function sendResendEmail(
  to: string,
  code: string,
): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return { ok: false, reason: "not-configured" };
  const from = process.env["RESEND_FROM"] || "Ali Pro Media <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `رمز استعادة كلمة المرور: ${code}`,
      html: otpEmailHtml(code),
    }),
  });
  if (!response.ok) {
    console.error("[reset] resend error", response.status, await response.text().catch(() => ""));
    return { ok: false, reason: "provider-error" };
  }
  return { ok: true };
}

function serviceClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function anonClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function persistOtp(email: string, entry: OtpEntry) {
  store.set(email, entry);
  const admin = serviceClient();
  if (!admin) return;
  await admin
    .from("password_reset_otps")
    .upsert({
      email,
      code_hash: entry.hash,
      expires_at: new Date(entry.expires).toISOString(),
      attempts: entry.attempts,
      verified: entry.verified,
    })
    .then(({ error }) => {
      if (error) console.error("[reset] otp persist", error.message);
    });
}

async function readOtp(email: string): Promise<OtpEntry | null> {
  const local = store.get(email);
  if (local) return local;
  const admin = serviceClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("password_reset_otps")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error || !data) return null;
  const entry: OtpEntry = {
    hash: data.code_hash,
    expires: new Date(data.expires_at).getTime(),
    attempts: data.attempts ?? 0,
    verified: Boolean(data.verified),
  };
  store.set(email, entry);
  return entry;
}

async function clearOtp(email: string) {
  store.delete(email);
  const admin = serviceClient();
  if (!admin) return;
  await admin.from("password_reset_otps").delete().eq("email", email);
}

export const requestPasswordOtp = createServerFn({ method: "POST" })
  .validator((input: { email: string }) => ({ email: normalizeEmail(input.email) }))
  .handler(async ({ data }) => {
    if (!data.email.includes("@")) return { ok: false as const, reason: "invalid-email" as const };
    const code = generateCode();
    const entry: OtpEntry = {
      hash: hashCode(data.email, code),
      expires: Date.now() + OTP_TTL_MS,
      attempts: 0,
      verified: false,
    };
    await persistOtp(data.email, entry);
    const result = await sendResendEmail(data.email, code);
    if (!result.ok) {
      await clearOtp(data.email);
      return { ok: false as const, reason: result.reason ?? "send-failed" };
    }
    return { ok: true as const };
  });

export const verifyPasswordOtp = createServerFn({ method: "POST" })
  .validator((input: { email: string; code: string }) => ({
    email: normalizeEmail(input.email),
    code: String(input.code ?? "")
      .replace(/\D/g, "")
      .slice(0, 6),
  }))
  .handler(async ({ data }) => {
    const entry = await readOtp(data.email);
    if (!entry) return { ok: false as const, reason: "not-found" as const };
    if (Date.now() > entry.expires) {
      await clearOtp(data.email);
      return { ok: false as const, reason: "expired" as const };
    }
    entry.attempts += 1;
    if (entry.attempts > MAX_ATTEMPTS) {
      await clearOtp(data.email);
      return { ok: false as const, reason: "too-many" as const };
    }
    if (entry.hash !== hashCode(data.email, data.code)) {
      await persistOtp(data.email, entry);
      return { ok: false as const, reason: "mismatch" as const };
    }
    entry.verified = true;
    await persistOtp(data.email, entry);
    return { ok: true as const };
  });

export const confirmPasswordReset = createServerFn({ method: "POST" })
  .validator((input: { email: string; code: string; password: string }) => ({
    email: normalizeEmail(input.email),
    code: String(input.code ?? "")
      .replace(/\D/g, "")
      .slice(0, 6),
    password: String(input.password ?? ""),
  }))
  .handler(async ({ data }) => {
    if (data.password.length < 6) return { ok: false as const, reason: "weak" as const };
    const entry = await readOtp(data.email);
    if (!entry || Date.now() > entry.expires) {
      await clearOtp(data.email);
      return { ok: false as const, reason: "expired" as const };
    }
    if (entry.hash !== hashCode(data.email, data.code) && !entry.verified) {
      return { ok: false as const, reason: "mismatch" as const };
    }

    const admin = serviceClient();
    if (admin) {
      const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) return { ok: false as const, reason: "lookup-failed" as const };
      const target = list.users.find((u) => (u.email ?? "").toLowerCase() === data.email);
      if (!target) return { ok: false as const, reason: "no-user" as const };
      const { error: updateError } = await admin.auth.admin.updateUserById(target.id, {
        password: data.password,
      });
      if (updateError) return { ok: false as const, reason: "update-failed" as const };
      await clearOtp(data.email);
      return { ok: true as const, mode: "direct" as const };
    }

    const anon = anonClient();
    if (anon) {
      await anon.auth.resetPasswordForEmail(data.email).catch(() => undefined);
      await clearOtp(data.email);
      return { ok: true as const, mode: "fallback" as const };
    }
    return { ok: false as const, reason: "not-configured" as const };
  });
