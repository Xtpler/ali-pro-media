import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { Banner } from "@/types";

export function BannerSlider({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;
  const banner = (banners[active] ?? banners[0])!;

  return (
    <section className="relative mx-auto max-w-[1440px] overflow-hidden px-4 pt-5 sm:px-5 lg:px-10">
      <div className="banner-frame relative min-h-[270px] overflow-hidden rounded-[28px] border border-emerald-300/20">
        <img
          src={banner.image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/75 to-transparent" />

        <div className="relative z-10 flex min-h-[270px] items-center justify-between px-7 py-10 sm:px-12">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
              <Sparkles size={13} /> عرض مميز
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight text-white sm:text-4xl">
              {banner.title}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">{banner.subtitle}</p>
            <button className="mt-6 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">
              {banner.cta_text || "اطلب الآن"} <ArrowLeft className="mr-2 inline" size={16} />
            </button>
          </div>

          <div className="hidden w-48 animate-float rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl lg:block">
            <div className="mb-4 h-2 w-16 rounded-full bg-emerald-400" />
            <div className="h-3 w-28 rounded-full bg-white/20" />
            <div className="mt-3 h-3 w-20 rounded-full bg-white/10" />
            <div className="mt-7 flex justify-between">
              <div className="h-10 w-10 rounded-xl bg-emerald-400/30" />
              <div className="h-10 w-20 rounded-xl bg-white/10" />
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-5 right-7 z-10 flex items-center gap-2">
          {banners.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(banners.indexOf(item))}
              className={`h-1.5 rounded-full transition-all ${item.id === banner.id ? "w-8 bg-emerald-400" : "w-2 bg-white/30"}`}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="absolute bottom-5 left-7 z-10 flex gap-2">
          <button
            onClick={() => setActive((active - 1 + banners.length) % banners.length)}
            className="rounded-full border border-white/15 bg-slate-950/40 p-2 text-white backdrop-blur transition hover:bg-white/10"
          >
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => setActive((active + 1) % banners.length)}
            className="rounded-full border border-white/15 bg-slate-950/40 p-2 text-white backdrop-blur transition hover:bg-white/10"
          >
            <ArrowLeft size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
