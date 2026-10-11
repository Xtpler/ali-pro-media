import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Gift, Home, Info, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { applyReferral, storePendingReferral, type ApplyReferralResult } from "@/lib/store";

export const Route = createFileRoute("/ref/$userId")({
  head: () => ({
    meta: [
      { title: "دعوة Ali Pro Media 🎁" },
      {
        name: "description",
        content: "انضم إلى Ali Pro Media عبر دعوة صديق واحصل على مكافأة عند أول إيداع معتمد.",
      },
    ],
  }),
  component: ReferralRoute,
});

const KNOWN_MESSAGES: Record<string, { title: string; body: string; ok: boolean }> = {
  ok: {
    title: "تم تفعيل دعوتك بنجاح 🎉",
    body: "شكراً لانضمامك عبر دعوة صديق. عند أول إيداع معتمد لك، سيحصل صديقك على مكافأته تلقائياً.",
    ok: true,
  },
  already: {
    title: "أنت مسجّل في نظام الإحالة مسبقاً",
    body: "تم ربط دعوتك من قبل — لن تتغير المكافآت المرتبطة بحسابك.",
    ok: true,
  },
  self: {
    title: "لا يمكنك استخدام رابط دعوتك الخاص",
    body: "شارك رابط دعوتك مع أصدقائك الجدد بدلاً من ذلك.",
    ok: false,
  },
  invalid: {
    title: "رابط الدعوة غير صالح",
    body: "تأكد من نسخ الرابط كاملاً من صفحة الدعوة الخاصة بك.",
    ok: false,
  },
  needs_auth: {
    title: "سجّل الدخول لتفعيل الدعوة",
    body: "بعد تسجيل الدخول أو إنشاء حساب جديد سيتم ربط دعوتك تلقائياً.",
    ok: false,
  },
  not_ready: {
    title: "خدمة الإحالة قيد التهيئة",
    body: "لم تُفعّل ميزة الدعوات على الخادم بعد. يرجى المحاولة لاحقاً أو التواصل مع الدعم.",
    ok: false,
  },
};

function ReferralRoute() {
  const userId = Route.useParams().userId;
  const [state, setState] = useState<
    { phase: "loading" } | { phase: "done"; result: ApplyReferralResult } | { phase: "deferred" }
  >({ phase: "loading" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session?.user) {
        const result = await applyReferral(userId);
        if (mounted) setState({ phase: "done", result });
      } else {
        storePendingReferral(userId);
        if (mounted) setState({ phase: "deferred" });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const info = (message: string | undefined) => KNOWN_MESSAGES[message ?? ""];

  let title = "جاري تفعيل دعوتك...";
  let body = "سنقوم بربطك برابط الدعوة وحساب مكافأتك تلقائياً.";
  let ok = true;
  let showLoader = true;

  if (state.phase === "deferred") {
    title = "سجّل الدخول لتفعيل الدعوة";
    body = "حفظنا دعوة صديقك، وعند تسجيل الدخول أو إنشاء حساب جديد سيتم ربطها تلقائياً بحسابك.";
    showLoader = false;
  } else if (state.phase === "done") {
    const known = info(state.result.message);
    if (known) {
      title = known.title;
      body = known.body;
      ok = known.ok;
    } else if (!state.result.ok && state.result.message && state.result.message !== "error") {
      title = "تعذّر تفعيل الدعوة حالياً";
      body = state.result.message;
      ok = false;
    } else if (!state.result.ok) {
      title = "تعذّر تفعيل الدعوة حالياً";
      body = "يرجى المحاولة مرة أخرى بعد قليل، أو تأكد من صحة الرابط.";
      ok = false;
    }
    showLoader = false;
  }

  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-screen items-center justify-center bg-slate-950 px-4"
    >
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
            showLoader
              ? "bg-emerald-400/15 text-emerald-400"
              : ok
                ? "bg-emerald-400/15 text-emerald-400"
                : "bg-amber-400/15 text-amber-300"
          }`}
        >
          {showLoader ? (
            <Loader2 size={30} className="animate-spin" />
          ) : ok ? (
            <CheckCircle2 size={30} />
          ) : (
            <Info size={30} />
          )}
        </div>

        <h1 className="mt-6 text-lg font-bold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.06] px-4 py-3 text-[11px] text-emerald-300">
          <Gift size={14} className="shrink-0" />
          <span>عند أول إيداع معتمد لصديقك، يحصل الداعي على مكافأة تلقائياً في محفظته</span>
        </div>

        <Link
          to="/"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
        >
          <Home size={16} /> العودة إلى المتجر
        </Link>
      </div>
    </div>
  );
}
