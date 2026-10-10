import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MASTER_ADMIN_EMAIL } from "@/lib/constants";

type RoleInput = { userId: string; grant: boolean };

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: RoleInput) => ({
    userId: String(input.userId ?? ""),
    grant: Boolean(input.grant),
  }))
  .handler(async ({ data, context }) => {
    const { data: actor } = await context.supabase
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();
    const claimEmail =
      typeof context.claims === "object" && context.claims && "email" in context.claims
        ? String((context.claims as { email?: string }).email ?? "")
        : "";
    const actorEmail = String(actor?.email ?? claimEmail).toLowerCase();
    if (actorEmail !== MASTER_ADMIN_EMAIL) {
      return { ok: false as const, reason: "forbidden" as const };
    }
    if (!data.userId) return { ok: false as const, reason: "invalid" as const };

    const { data: target } = await context.supabase
      .from("profiles")
      .select("id, email")
      .eq("id", data.userId)
      .maybeSingle();

    if (!target) return { ok: false as const, reason: "no-user" as const };
    if ((target.email ?? "").toLowerCase() === MASTER_ADMIN_EMAIL) {
      return { ok: false as const, reason: "protected" as const };
    }

    if (data.grant) {
      const { error } = await context.supabase
        .from("user_roles")
        .insert({ user_id: data.userId, role: "admin" });
      if (error && !/duplicate|unique/i.test(error.message)) {
        return { ok: false as const, reason: "update-failed" as const };
      }
    } else {
      const { error } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) return { ok: false as const, reason: "update-failed" as const };
    }
    return { ok: true as const };
  });
