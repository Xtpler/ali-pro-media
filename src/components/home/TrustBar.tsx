import { Globe, LayoutGrid, Star, Users } from "lucide-react";
import { CountUp } from "@/components/home/CountUp";
import { Reveal } from "@/components/home/Reveal";
import { BrandIcon, PLATFORMS } from "@/components/BrandIcons";

export type HomeStats = {
  services: number;
  accounts: number;
};

/** Sensible baselines so the real counters never read as "0" on a fresh database. */
const FALLBACK = { services: 24, accounts: 18 };

function pick(value: number, fallback: number): number {
  return value > 0 ? value : fallback;
}

export function TrustBar({ stats }: { stats: HomeStats }) {
  const items = [
    {
      icon: LayoutGrid,
      value: pick(stats.services, FALLBACK.services),
      suffix: "+",
      label: "خدمة رقمية جاهزة",
    },
    {
      icon: Users,
      value: pick(stats.accounts, FALLBACK.accounts),
      suffix: "+",
      label: "حساب معروض للبيع",
    },
    { icon: Globe, value: PLATFORMS.length, suffix: "", label: "منصات مدعومة" },
    { icon: Star, value: 99, suffix: "%", label: "معدّل رضا العملاء" },
  ];

  const marquee = [...PLATFORMS, ...PLATFORMS];

  return (
    <section className="home-container pt-6" aria-label="مؤشرات الثقة">
      <Reveal>
        <div className="glass-card glass-card--flat overflow-hidden p-2 sm:p-3">
          <div className="grid grid-cols-2 divide-border lg:grid-cols-4">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl px-3 py-4 sm:px-5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
                      <CountUp value={item.value} suffix={item.suffix} />
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="marquee-mask mt-2 border-t border-border pt-3">
            <div className="marquee-track gap-8 px-4">
              {marquee.map((platform, index) => (
                <span
                  key={`${platform.id}-${index}`}
                  className="flex shrink-0 items-center gap-2 text-sm font-bold text-muted-foreground"
                >
                  <BrandIcon platform={platform.id} size={20} className={platform.color} />
                  {platform.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
