import { useState } from "react";
import { ScrollText, ShieldCheck } from "lucide-react";
import { Page } from "@/pages/OrdersPage";
import { TermsModal } from "@/components/TermsModal";
import { PrivacyModal } from "@/components/PrivacyModal";

export function SettingsPage() {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  return (
    <Page title="الإعدادات" subtitle="اطّلع على شروط الاستخدام وسياسة الخصوصية">
      <section className="rounded-3xl border border-white/[.08] bg-white/[.035] p-6">
        <h2 className="font-bold text-white">السياسات والشروط</h2>
        <p className="mt-1 text-xs text-slate-400">
          اقرأ شروط استخدام المنصة وسياسة الخصوصية الخاصة بنا.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setTerms(true)}
            className="flex items-center gap-3 rounded-2xl border border-white/[.08] bg-white/[.03] p-4 text-right transition hover:border-emerald-400/30 hover:bg-white/[.05]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
              <ScrollText size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-white">شروط الاستخدام</p>
              <p className="mt-1 text-xs text-slate-400">الشروط والأحكام وسياسة الاسترجاع</p>
            </div>
          </button>

          <button
            onClick={() => setPrivacy(true)}
            className="flex items-center gap-3 rounded-2xl border border-white/[.08] bg-white/[.03] p-4 text-right transition hover:border-emerald-400/30 hover:bg-white/[.05]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-white">سياسة الخصوصية</p>
              <p className="mt-1 text-xs text-slate-400">كيفية جمع بياناتك واستخدامها وحمايتها</p>
            </div>
          </button>
        </div>
      </section>

      <TermsModal open={terms} onClose={() => setTerms(false)} />
      <PrivacyModal open={privacy} onClose={() => setPrivacy(false)} />
    </Page>
  );
}
