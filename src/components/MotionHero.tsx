import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Heart,
  MessageCircle,
  Play,
  Share2,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";

const ORBIT = [Heart, Eye, UserPlus, Play, MessageCircle, Share2] as const;
const WORDS = ["سناب شات", "إنستغرام", "تيك توك", "الخدمات الرقمية"] as const;
const PERKS = [
  [Wallet, "محفظة آمنة"],
  [TrendingUp, "تنفيذ سريع"],
  [ShieldCheck, "دعم مباشر"],
] as const;

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

export function MotionHero({
  onCta,
}: {
  banners?: unknown[] | undefined;
  onCta?: (() => void) | undefined;
}) {
  const [word, setWord] = useState(0);
  const followers = useCountUp(12400);

  useEffect(() => {
    const id = window.setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      dir="rtl"
      aria-label="الواجهة الرئيسية"
      className="mx-auto max-w-[1440px] px-4 pt-2 sm:px-6 lg:px-10"
    >
      <div className="mh px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
        <div className="mh-aurora" aria-hidden />
        <div className="mh-grid" aria-hidden />
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> منصة رقمية أبسط
              وأسرع
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.25] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              مو مجرد خدمات رقمية.
              <span className="mt-2 block text-2xl font-bold text-muted-foreground sm:text-3xl">
                نمو حسابك على{" "}
                <span key={word} className="mh-word">
                  {WORDS[word] ?? ""}
                </span>
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              نحن نسهّل عليك الطريق: خدمات سوشيال ميديا، سوق حسابات، بطاقات إلكترونية وفتح باند،
              كلها في مكان واحد وبمحفظة واحدة.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onCta}
                className="hero-cta inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground shadow-[0_14px_45px_color-mix(in_oklab,var(--primary)_30%,transparent)] hover:-translate-y-0.5 hover:brightness-110"
              >
                ابدأ الآن <ArrowLeft size={17} />
              </button>
              <ul className="flex flex-wrap gap-2">
                {PERKS.map(([Icon, label]) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-2 text-xs font-bold text-muted-foreground"
                  >
                    <Icon size={14} className="text-primary" /> {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mh-scene" aria-hidden>
            <span className="mh-ring a" />
            <span className="mh-ring b" />
            <div className="mh-orbit">
              {ORBIT.map((Icon, i) => (
                <span
                  key={i}
                  className="mh-orbit-item"
                  style={{ "--a": `${i * 60}deg` } as CSSProperties}
                >
                  <span
                    className="mh-chip"
                    style={{ "--a": `${i * 60}deg`, "--d": `${i * 0.45}s` } as CSSProperties}
                  >
                    <Icon size={20} />
                  </span>
                </span>
              ))}
            </div>
            <div className="mh-core">
              <p className="text-[10px] font-bold text-muted-foreground">نمو المتابعين</p>
              <p className="font-display text-2xl font-extrabold text-foreground">
                +{followers.toLocaleString("en-US")}
              </p>
              <svg viewBox="0 0 200 90" className="mt-2 w-full overflow-visible">
                <defs>
                  <linearGradient id="mhFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--primary)" stopOpacity=".5" />
                    <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="mh-area" d="M4 80 C40 70 60 76 90 52 S150 40 196 10 V90 H4Z" />
                <path className="mh-line" d="M4 80 C40 70 60 76 90 52 S150 40 196 10" />
                <circle className="mh-dot" cx="196" cy="10" r="5" />
              </svg>
              <div className="mt-3 space-y-2">
                <div className="mh-bar">
                  <i />
                </div>
                <div className="mh-bar w-2/3">
                  <i style={{ animationDelay: ".4s" }} />
                </div>
              </div>
            </div>
            <div className="mh-badges">
              <span className="mh-badge">
                <CheckCircle2 size={15} /> تم التسليم
              </span>
              <span className="mh-badge">
                <Wallet size={15} /> تم شحن الرصيد
              </span>
              <span className="mh-badge">
                <ShieldCheck size={15} /> دفع آمن
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
