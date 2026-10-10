import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PushInput = { userIds?: string[]; toAdmins?: boolean; title: string; message: string };

/**
 * إرسال إشعار فوري عبر OneSignal (يعمل حتى لو كان الموقع أو المتصفح مغلقاً).
 * إذا لم تُضبط مفاتيح OneSignal بعد، يتم تجاهل الإرسال بهدوء.
 */
export const sendPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: PushInput) => ({
    userIds: (input.userIds ?? []).filter((id) => typeof id === "string").slice(0, 200),
    toAdmins: Boolean(input.toAdmins),
    title: String(input.title ?? "").slice(0, 120),
    message: String(input.message ?? "").slice(0, 400),
  }))
  .handler(async ({ data, context }) => {
    const appId = process.env["ONESIGNAL_APP_ID"];
    const apiKey = process.env["ONESIGNAL_REST_API_KEY"];
    if (!appId || !apiKey) return { sent: false, reason: "not-configured" as const };

    let targets = data.userIds;
    if (data.toAdmins) {
      const { data: admins } = await context.supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      targets = [
        ...targets,
        ...(admins ?? []).map((row) => row.user_id).filter((id): id is string => !!id),
      ];
    }
    targets = [...new Set(targets)];
    if (!targets.length) return { sent: false, reason: "no-targets" as const };

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: targets },
        target_channel: "push",
        headings: { en: data.title, ar: data.title },
        contents: { en: data.message, ar: data.message },
        url: process.env["PUBLIC_APP_URL"] || "https://alipromedia4.com",
      }),
    });

    if (!response.ok) {
      console.error("onesignal error", response.status, await response.text());
      return { sent: false, reason: "provider-error" as const };
    }
    return { sent: true };
  });
