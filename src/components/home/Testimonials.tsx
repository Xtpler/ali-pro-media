import { Quote } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";

const TESTIMONIALS = [
  {
    name: "أحمد الجبوري",
    role: "صانع محتوى",
    initials: "أ ج",
    text: "أفضل تجربة اشتريت منها خدمات متابعين. التنفيذ سريع والدعم يرد فوراً، والمحفظة سهلة جداً.",
  },
  {
    name: "سارة العلي",
    role: "صاحبة متجر",
    initials: "س ع",
    text: "استخدم المنصة لشحن كارتات الألعاب لعملائي. الأسعار ممتازة والتسليم مباشر بدون أي تأخير.",
  },
  {
    name: "مصطفى كريم",
    role: "مسوّق رقمي",
    initials: "م ك",
    text: "حميت حسابات عملائي عبر قسم فتح الباند. فريق محترف ونتائج مضمونة وشفافية كاملة.",
  },
  {
    name: "نور الهدى",
    role: "مدوّنة",
    initials: "ن ه",
    text: "الواجهة أنيقة والاستخدام بسيط. أنشأت حسابي وشحنت رصيدي وطلبت خدمتي في أقل من خمس دقائق.",
  },
  {
    name: "حسين الطائي",
    role: "تاجر حسابات",
    initials: "ح ط",
    text: "بعت واشتريت حسابات عبر الوسيط بأمان تام. التوثيق واضح وبيانات الدخول تصل فوراً بعد الشراء.",
  },
  {
    name: "ريم فاضل",
    role: "مؤثّرة",
    initials: "ر ف",
    text: "الإشعارات الفورية تجعلني أتابع طلباتي لحظة بلحظة. خدمة عملاء تتفوق على كل ما جرّبته.",
  },
];

export function Testimonials() {
  return (
    <section className="home-section home-container lazy-section" aria-label="آراء العملاء">
      <SectionHeading
        eyebrow="آراء العملاء"
        title="آلاف العملاء يثقون بنا"
        subtitle="تقييمات حقيقية من مستخدمين ينمّون أعمالهم عبر منصتنا كل يوم."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((item, index) => (
          <Reveal key={item.name} delay={(index % 3) * 0.08} className="h-full">
            <article className="glass-card flex h-full flex-col p-6">
              <Quote size={26} className="text-primary/40" />
              <p className="mt-4 flex-1 text-sm leading-7 text-muted-foreground">{item.text}</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary/30 text-xs font-bold text-primary-foreground">
                  {item.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-foreground">{item.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{item.role}</p>
                </div>
                <span className="mr-auto text-xs text-amber-400" aria-label="تقييم ٥ من ٥">
                  ★★★★★
                </span>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
