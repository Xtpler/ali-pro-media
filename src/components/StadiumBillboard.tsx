import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Banner } from "@/types";

const FALLBACK_SLIDE: Banner = {
  id: "stadium-welcome",
  title: "مو مجرد خدمات رقمية",
  subtitle: "نحن نسهّل عليك الطريق بخدمات موثوقة وسريعة في مكان واحد.",
  image_url: "",
  cta_text: "ابدأ الآن",
  badge_text: "ALI PRO MEDIA · LIVE",
  active: true,
  sort_order: 0,
  created_at: "",
};

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(url);
}

export function StadiumBillboard({
  banners = [],
  onCta,
}: {
  banners?: Banner[];
  onCta?: () => void;
}) {
  const slides = useMemo(() => {
    const active = (banners ?? []).filter((banner) => banner?.active !== false);
    return active.length ? active : [FALLBACK_SLIDE];
  }, [banners]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const goTo = (index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  };

  return (
    <section
      aria-label="العروض المميزة"
      className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10"
      dir="rtl"
    >
      <div className="stadium-shell relative">
        <div className="stadium-truss" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="stadium-billboard relative isolate aspect-[16/12] overflow-hidden rounded-lg border border-primary/70 bg-card sm:aspect-[16/7] lg:aspect-[16/6]">
          <div className="stadium-led-grid absolute inset-0 z-20 pointer-events-none" aria-hidden />
          {slides.map((slide, index) => {
            const visible = index === activeIndex;
            return (
              <div
                key={slide.id}
                aria-hidden={!visible}
                className={`absolute inset-0 transition duration-700 motion-reduce:transition-none ${visible ? "z-10 opacity-100" : "z-0 opacity-0"}`}
              >
                {slide.image_url ? (
                  isVideo(slide.image_url) ? (
                    <video
                      src={slide.image_url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={slide.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  )
                ) : (
                  <div className="stadium-fallback h-full w-full" aria-hidden>
                    <div className="stadium-field-lines" />
                  </div>
                )}
                <div className="stadium-vignette absolute inset-0" />
                <div className="absolute inset-0 flex items-end p-6 sm:items-center sm:p-10 lg:p-16">
                  <div className="max-w-2xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/50 bg-background/80 px-3 py-1.5 text-[10px] font-bold text-primary backdrop-blur-md sm:text-xs">
                      <Radio size={13} className="stadium-live-dot" />
                      {slide.badge_text || "عرض الملعب الرقمي"}
                    </div>
                    <h1 className="font-display text-3xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                      {slide.title || FALLBACK_SLIDE.title}
                    </h1>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base lg:text-lg">
                      {slide.subtitle || FALLBACK_SLIDE.subtitle}
                    </p>
                    <Button
                      onClick={onCta}
                      size="lg"
                      className="mt-5 h-11 rounded-md px-5 font-extrabold sm:mt-7"
                    >
                      {slide.cta_text || "ابدأ الآن"}
                      <ChevronLeft />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {slides.length > 1 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="العرض السابق"
                onClick={() => goTo(activeIndex - 1)}
                className="absolute right-3 top-1/2 z-30 -translate-y-1/2 border-primary/40 bg-background/70 text-foreground backdrop-blur-md hover:bg-primary hover:text-primary-foreground sm:right-5"
              >
                <ChevronRight />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="العرض التالي"
                onClick={() => goTo(activeIndex + 1)}
                className="absolute left-3 top-1/2 z-30 -translate-y-1/2 border-primary/40 bg-background/70 text-foreground backdrop-blur-md hover:bg-primary hover:text-primary-foreground sm:left-5"
              >
                <ChevronLeft />
              </Button>
              <div
                className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2"
                dir="ltr"
              >
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`الانتقال إلى العرض ${index + 1}`}
                    aria-current={index === activeIndex}
                    onClick={() => goTo(index)}
                    className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-primary" : "w-3 bg-foreground/35 hover:bg-foreground/70"}`}
                  />
                ))}
              </div>
            </>
          )}
          <div
            className="stadium-scanline absolute inset-x-0 top-0 z-20 h-px bg-primary/70"
            aria-hidden
          />
          <Play
            className="absolute bottom-4 right-4 z-20 hidden text-primary/50 sm:block"
            size={14}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
