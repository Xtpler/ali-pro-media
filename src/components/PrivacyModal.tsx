import { ShieldCheck, X } from "lucide-react";
import { SUPPORT_PHONE } from "@/lib/site";

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "البيانات التي نجمعها",
    items: [
      "الاسم الكامل والبريد الإلكتروني ورقم الهاتف عند إنشاء الحساب.",
      "وصولات الإيداع وتفاصيل الطلبات التي تقوم بإرسالها عبر المنصة.",
      "بيانات الحساب المستهدف (رابط أو معرف) اللازمة لتنفيذ الخدمة المطلوبة.",
    ],
  },
  {
    title: "كيفية استخدام بياناتك",
    items: [
      "تنفيذ الطلبات وإدارة المحفظة والإيداعات الخاصة بك.",
      "التواصل معك بخصوص حالة الطلب أو الدعم الفني عند الحاجة.",
      "تحسين جودة الخدمة وتحليل الاستخدام العام للمنصة دون كشف هويتك.",
    ],
  },
  {
    title: "أمان التخزين",
    items: [
      "تُخزَّن بياناتك في قواعد بيانات محمية بصلاحيات وصول مشفّرة.",
      "الصور والوصولات تُحفظ في تخزين خاص لا يمكن الوصول إليه إلا من صاحبها أو الإدارة.",
      "نطبّق إجراءات حماية مستمرة لمنع أي وصول غير مصرح به.",
    ],
  },
  {
    title: "عدم بيع البيانات",
    items: [
      "لا تقوم Ali Pro Media ببيع أو مشاركة بياناتك مع أي طرف ثالث لأغراض تسويقية.",
      "تُستخدم بوابات الدفع الخارجية فقط لإتمام عمليات الإيداع، ولا تُشارك بياناتك الشخصية معها إلا بالقدر اللازم لإتمام العملية.",
    ],
  },
  {
    title: "الإشعارات وحذف الحساب",
    items: [
      "قد نطلب إذن الإشعارات لإعلامك بحالة الطلبات والعروض، ويمكنك تعطيلها في أي وقت.",
      "يمكنك طلب حذف حسابك وبياناتك بشكل نهائي عبر التواصل مع الدعم الفني.",
    ],
  },
];

export function PrivacyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
              <ShieldCheck size={18} />
            </span>
            <h2 className="text-base font-bold text-white">سياسة الخصوصية</h2>
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
            لأي استفسار حول خصوصية بياناتك تواصل مع الدعم الفني على الرقم {SUPPORT_PHONE}.
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
