import { ArrowLeft, Headphones, ShieldCheck, Zap } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";

export function FinalCta({ onStart, onSupport }: { onStart: () => void; onSupport: () => void }) {
  return (
    <section className="home-container pb-20 pt-4" aria-label="ابدأ الآن">
      <Reveal>
        <div className="glass-card relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <span className="eyebrow mx-auto">
              <Zap size={13} />
              جاهز للانطلاق؟
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-extrabold leading-[1.3] text-foreground sm:text-4xl">
              ابدأ اليوم وانمُ حضورك الرقمي <span className="gradient-text">باحترافية.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              أنشئ حسابك مجاناً، اشحن محفظتك، واطلب أول خدمة خلال دقائق.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStart}
                className="btn-glow inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-4 text-sm font-extrabold text-primary-foreground"
              >
                ابدأ الآن <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={onSupport}
                className="btn-outline-glass inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold text-foreground"
              >
                <Headphones size={17} /> تواصل مع الدعم
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary" /> دفع آمن ومشفّر
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap size={14} className="text-primary" /> تنفيذ فوري
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Headphones size={14} className="text-primary" /> دعم ٢٤/٧
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
