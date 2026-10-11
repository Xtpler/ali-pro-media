import {
  ArrowLeft,
  Check,
  CreditCard,
  Instagram,
  LifeBuoy,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";
import { TiltCard } from "@/components/home/motion/TiltCard";

export type HomeTab = "social_media" | "accounts" | "digital_cards" | "unban";

const PILLARS: {
  id: HomeTab;
  title: string;
  description: string;
  icon: LucideIcon;
  bullets: string[];
}[] = [
  {
    id: "social_media",
    title: "خدمات السوشيال ميديا",
    description: "نمِّ حضورك على كل المنصات بمتابعين ومشاهدات وتفاعل حقيقي.",
    icon: Instagram,
    bullets: ["متابعون حقيقيون", "مشاهدات وإعجابات", "تعليقات تفاعلية"],
  },
  {
    id: "accounts",
    title: "بيع وشراء الحسابات",
    description: "سوق حسابات موثّق بضمان الوسيط وتسليم فوري لبيانات الدخول.",
    icon: Users2,
    bullets: ["حسابات موثّقة", "ضمان الوسيط", "تسليم فوري"],
  },
  {
    id: "digital_cards",
    title: "الكارتات الإلكترونية",
    description: "شحن الألعاب وأرصدة التطبيقات بأفضل الأسعار وبأمان تام.",
    icon: CreditCard,
    bullets: ["شحن الألعاب", "أرصدة التطبيقات", "أسعار تنافسية"],
  },
  {
    id: "unban",
    title: "قسم فتح الباند",
    description: "استعد حساباتك الموقوفة عبر مراجعة احترافية وسرّية تامة.",
    icon: LifeBuoy,
    bullets: ["مراجعة احترافية", "دعم مباشر", "سرّية تامة"],
  },
];

export function ServicesShowcase({ onSelect }: { onSelect: (tab: HomeTab) => void }) {
  return (
    <section className="home-section home-container" aria-label="خدماتنا">
      <SectionHeading
        eyebrow="ماذا نقدّم"
        title="خدمات رقمية متكاملة تحت سقف واحد"
        subtitle="اختر القسم الذي تحتاجه وتنقّل بين آلاف الخدمات الجاهزة للتنفيذ — كلها بمحفظة واحدة."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((pillar, index) => {
          const Icon = pillar.icon;
          return (
            <Reveal key={pillar.id} delay={index * 0.08} className="h-full">
              <TiltCard className="h-full" max={5}>
                <article className="glass-card group flex h-full flex-col p-6">
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary transition duration-300 group-hover:scale-105 group-hover:shadow-[0_0_26px_-6px_var(--color-primary)]">
                      <Icon size={22} />
                    </span>
                    <span className="font-display text-xs font-bold text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-lg font-extrabold text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {pillar.description}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {pillar.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground"
                      >
                        <Check size={13} className="shrink-0 text-primary" />
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => onSelect(pillar.id)}
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-extrabold text-primary transition group-hover:gap-2.5"
                  >
                    استعراض الخدمات <ArrowLeft size={14} />
                  </button>
                </article>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
