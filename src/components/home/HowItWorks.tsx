import { Rocket, UserPlus, Wallet } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";

const STEPS = [
  {
    icon: UserPlus,
    title: "أنشئ حسابك",
    text: "سجّل مجاناً في ثوانٍ، واختر من آلاف الخدمات ما يناسب هدفك.",
  },
  {
    icon: Wallet,
    title: "اشحن محفظتك",
    text: "أضف رصيدك عبر سوبر كي، زين كاش، FIB أو آسيا باي بأمان تام.",
  },
  {
    icon: Rocket,
    title: "اطلب واستلم",
    text: "نفّذ طلبك وتابعه لحظياً مع إشعارات فورية حتى اكتمال التسليم.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="home-section home-container" aria-label="كيف تعمل المنصة">
      <SectionHeading
        eyebrow="خطوات بسيطة"
        title="ابدأ في ثلاث خطوات فقط"
        subtitle="تجربة سلسة من التسجيل حتى التسليم — بدون تعقيد وبدون انتظار."
      />

      <div className="relative mt-14">
        <div
          className="step-connector pointer-events-none absolute inset-x-[16%] top-[3.25rem] hidden h-px lg:block"
          aria-hidden
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={index * 0.12} className="h-full">
                <article className="glass-card relative flex h-full flex-col items-center p-7 text-center">
                  <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-background text-primary shadow-[0_0_30px_-10px_var(--color-primary)]">
                    <Icon size={26} />
                  </span>
                  <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-[10px] font-extrabold text-muted-foreground">
                    الخطوة {index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-extrabold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-xs leading-6 text-muted-foreground">
                    {step.text}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
