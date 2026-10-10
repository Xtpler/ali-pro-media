import { ScrollText, X } from "lucide-react";

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "الشروط العامة",
    items: [
      "استخدام المنصة يعني موافقتك الكاملة على الشروط والأحكام الموضحة في هذه الصفحة.",
      "يجب أن تكون البيانات المدخلة (الرابط، معرف الحساب، رقم الهاتف) صحيحة ودقيقة.",
      "يمنع استخدام المنصة لأي غرض مخالف للقوانين أو لسياسات المنصات الاجتماعية.",
    ],
  },
  {
    title: "الطلبات والتنفيذ",
    items: [
      "يبدأ تنفيذ الطلب بعد موافقة الإدارة وخصم المبلغ من رصيد المحفظة.",
      "مدة التنفيذ تختلف حسب نوع الخدمة وقد تستغرق من دقائق إلى عدة ساعات.",
      "يجب أن يكون الحساب عاماً (Public) أثناء تنفيذ خدمات السوشيال ميديا.",
    ],
  },
  {
    title: "سياسة الاسترجاع",
    items: [
      "يتم إرجاع المبلغ كاملاً إلى المحفظة في حال تعذّر تنفيذ الطلب من طرفنا.",
      "لا يمكن الاسترجاع بعد تسليم بطاقة رقمية أو بيانات دخول حساب بشكل صحيح.",
      "الطلبات التي تفشل بسبب رابط خاطئ أو حساب خاص لا تُسترجع.",
      "يتم رد الرصيد إلى المحفظة داخل المنصة ولا يُحوَّل نقداً خارجها.",
    ],
  },
  {
    title: "الإيداع والمحفظة",
    items: [
      "يتم اعتماد الإيداع بعد مراجعة وصل التحويل من قبل الإدارة.",
      "كارت الشحن يُستخدم مرة واحدة فقط ولا يمكن استرجاعه بعد الاستخدام.",
      "أي محاولة تلاعب أو وصل مزوّر تؤدي إلى إيقاف الحساب نهائياً.",
    ],
  },
];

export function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-slate-900 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-400/15 p-2 text-emerald-400">
              <ScrollText size={18} />
            </span>
            <h2 className="text-base font-bold text-white">الشروط والأحكام وسياسة الاسترجاع</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-5 px-6 py-6">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-white/[.08] bg-white/[.03] p-4"
            >
              <h3 className="text-sm font-bold text-emerald-300">{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2 text-xs leading-6 text-slate-300">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="text-center text-[11px] text-slate-500">
            لأي استفسار إضافي تواصل مع الدعم الفني داخل التطبيق.
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-bold text-slate-950"
          >
            تم الاطلاع
          </button>
        </div>
      </div>
    </div>
  );
}
