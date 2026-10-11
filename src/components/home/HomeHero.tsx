import { m } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Headphones,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { CountUp } from "@/components/home/CountUp";
import { MagneticButton } from "@/components/home/motion/MagneticButton";
import { OrbitIcons } from "@/components/home/motion/OrbitIcons";
import { Parallax } from "@/components/home/motion/Parallax";
import { TiltCard } from "@/components/home/motion/TiltCard";
import { formatIQD } from "@/lib/format";

const AVATARS = ["ع ح", "م ك", "س أ", "ر ط"] as const;
const FEED: { name: string; label: string; status: string; cls: string }[] = [
  { name: "متابعون إنستغرام", label: "١٠٠٠ متابع", status: "مكتمل", cls: "order-status-completed" },
  {
    name: "مشاهدات تيك توك",
    label: "٥٠٠٠ مشاهدة",
    status: "قيد التنفيذ",
    cls: "order-status-processing",
  },
  { name: "حساب موثّق", label: "يوتيوب", status: "قيد الانتظار", cls: "order-status-pending" },
];

const CHART_LINE = "M0 92 L40 76 L80 84 L120 56 L160 64 L200 38 L240 46 L280 20 L320 28";
const CHART_AREA = `${CHART_LINE} L320 104 L0 104 Z`;
const CHART_DOTS: [number, number][] = [
  [120, 56],
  [200, 38],
  [280, 20],
];

export function HomeHero({ onStart, onBrowse }: { onStart: () => void; onBrowse: () => void }) {
  return (
    <section className="home-container pb-4 pt-10 sm:pt-14" aria-label="الواجهة الرئيسية">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-12">
        <div className="text-center lg:text-right">
          <span className="eyebrow mx-auto lg:mx-0">
            <Sparkles size={13} />
            منصة رقمية بمعيار عالمي
          </span>

          <h1 className="mt-6 font-display text-[2.1rem] font-extrabold leading-[1.24] text-foreground sm:text-5xl lg:text-[3.5rem]">
            كل خدماتك الرقمية
            <span className="shimmer-text"> في مكان واحد.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg lg:mx-0">
            سوشيال ميديا، حسابات موثّقة، كارتات إلكترونية وفتح باند — بمحفظة واحدة، تنفيذ فوري ودعم
            مباشر على مدار الساعة.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <MagneticButton className="inline-flex" strength={0.16}>
              <button
                type="button"
                onClick={onStart}
                className="btn-glow inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-4 text-sm font-extrabold text-primary-foreground"
              >
                ابدأ الآن <ArrowLeft size={18} />
              </button>
            </MagneticButton>
            <button
              type="button"
              onClick={onBrowse}
              className="btn-outline-glass inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold text-foreground"
            >
              تصفّح الخدمات
            </button>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-4 lg:justify-start">
            <div className="flex items-center">
              {AVATARS.map((initials, index) => (
                <span
                  key={initials}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary/80 to-primary/30 text-[10px] font-bold text-primary-foreground"
                  style={{ marginRight: index ? "-0.7rem" : 0 }}
                >
                  {initials}
                </span>
              ))}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-0.5 text-amber-400" aria-label="تقييم ٥ من ٥">
                {"★★★★★".split("").map((star, index) => (
                  <span key={index}>{star}</span>
                ))}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                أكثر من{" "}
                <b className="text-foreground">
                  <CountUp value={12400} prefix="+" />
                </b>{" "}
                عميل يثق بنا
              </p>
            </div>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {[
              [ShieldCheck, "دفع آمن"],
              [Zap, "تنفيذ فوري"],
              [Headphones, "دعم مباشر"],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as typeof ShieldCheck;
              return (
                <li
                  key={label as string}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
                >
                  <ItemIcon size={13} className="text-primary" />
                  {label as string}
                </li>
              );
            })}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <Parallax offset={26} className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-primary/20 blur-3xl"
        aria-hidden
      />
      <OrbitIcons className="pointer-events-none absolute -top-12 -right-8 z-0 hidden lg:block" />

      <TiltCard className="glass-card glass-card--flat relative z-10 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_14px_var(--color-primary)]" />
            <span className="text-xs font-extrabold text-foreground">لوحة التحكم</span>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
            مباشر
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">رصيد المحفظة</p>
            <Wallet size={15} className="text-primary" />
          </div>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-foreground">
            {formatIQD(1250000)}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary">
            <TrendingUp size={13} /> +18% هذا الشهر
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">نمو الطلبات</p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary">
              <TrendingUp size={13} /> +38%
            </span>
          </div>
          <RevenueChart />
        </div>

        <div className="mt-4 space-y-2">
          {FEED.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/30 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-foreground">{row.name}</p>
                <p className="text-[10px] text-muted-foreground">{row.label}</p>
              </div>
              <span className={`status-badge ${row.cls}`}>{row.status}</span>
            </div>
          ))}
        </div>
      </TiltCard>

      <span className="glass-card glass-card--flat fx-float absolute -right-2 top-20 z-20 hidden items-center gap-2 px-3 py-2 text-[11px] font-bold text-foreground lg:flex">
        <ShieldCheck size={15} className="text-primary" /> دفع آمن
      </span>
      <span
        className="glass-card glass-card--flat fx-float absolute -left-2 bottom-24 z-20 hidden items-center gap-2 px-3 py-2 text-[11px] font-bold text-foreground lg:flex"
        style={{ animationDelay: "-2.4s" }}
      >
        <BadgeCheck size={15} className="text-primary" /> تسليم مضمون
      </span>
    </Parallax>
  );
}

function RevenueChart() {
  return (
    <svg viewBox="0 0 320 104" className="mt-1 h-24 w-full" aria-hidden>
      <defs>
        <linearGradient id="homeChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--color-primary)", stopOpacity: 0.34 }} />
          <stop offset="100%" style={{ stopColor: "var(--color-primary)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <line className="chart-grid-h" x1="0" y1="26" x2="320" y2="26" />
      <line className="chart-grid-h" x1="0" y1="60" x2="320" y2="60" />
      <line className="chart-grid-h" x1="0" y1="92" x2="320" y2="92" />
      <m.path
        className="chart-area"
        d={CHART_AREA}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.9 }}
      />
      <m.path
        className="chart-line"
        style={{ strokeWidth: 3 }}
        d={CHART_LINE}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />
      {CHART_DOTS.map(([cx, cy], index) => (
        <m.circle
          key={index}
          className="chart-dot"
          cx={cx}
          cy={cy}
          r={3.5}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.55 + index * 0.22,
            type: "spring",
            stiffness: 400,
            damping: 18,
          }}
        />
      ))}
    </svg>
  );
}
