import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Banner } from "@/types";

const SLIDE_MS = 6500;
const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(url);
const WHITE = "text-[#ffffff]";

/** Professional ad board: image/video slides, progress dots, swipe, keyboard, pause on hover. */
export function AdBoard({
  banners = [],
  onCta,
}: {
  banners?: Banner[];
  onCta?: (() => void) | undefined;
}) {
  const slides = useMemo(
    () =>
      (banners ?? [])
        .filter((b) => b && b.active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [banners],
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (i: number) => {
      setIndex(((i % count) + count) % count);
      setTick((t) => t + 1);
    },
    [count],
  );

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (count < 2 || paused || userPaused) return;
    const id = window.setTimeout(() => go(index + 1), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, count, paused, userPaused, tick, go]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!count) return null;
  const running = count > 1 && !paused && !userPaused;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="لوحة الإعلانات"
      dir="rtl"
      tabIndex={0}
      className="mx-auto max-w-[1440px] px-4 outline-none sm:px-6 lg:px-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index + 1);
        if (e.key === "ArrowRight") go(index - 1);
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        const end = e.changedTouches[0]?.clientX;
        if (start == null || end == null || Math.abs(end - start) < 45) return;
        go(end < start ? index + 1 : index - 1);
      }}
    >
      <div className="relative isolate aspect-[16/11] overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-25px_color-mix(in_oklab,var(--primary)_55%,transparent)] sm:aspect-[16/6]">
        {slides.map((slide, i) => {
          const active = i === index;
          const link = slide.link_url?.trim();
          const media = slide.image_url;
          return (
            <article
              key={slide.id}
              aria-hidden={!active}
              className={`absolute inset-0 transition-all duration-700 ease-out ${active ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}
            >
              {media &&
                (isVideo(media) ? (
                  <video
                    src={media}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={media}
                    alt={slide.title}
                    loading={i === 0 ? "eager" : "lazy"}
                    className={`h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${active ? "scale-105" : "scale-100"}`}
                  />
                ))}
              {!media && (
                <div className="h-full w-full bg-gradient-to-br from-primary/40 via-card to-card" />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/45 to-black/10"
                aria-hidden
              />
              <div className="absolute inset-0 flex flex-col justify-end gap-3 p-5 sm:justify-center sm:p-12 lg:p-16">
                {slide.badge_text && (
                  <span
                    className={`w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-bold backdrop-blur ${WHITE}`}
                  >
                    {slide.badge_text}
                  </span>
                )}
                <h2
                  className={`max-w-2xl font-display text-2xl font-extrabold leading-tight sm:text-4xl lg:text-5xl ${WHITE}`}
                >
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="max-w-xl text-sm leading-7 text-[#e5e7eb] sm:text-base">
                    {slide.subtitle}
                  </p>
                )}
                {(slide.cta_text || link) &&
                  (link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:brightness-110"
                    >
                      {slide.cta_text || "اكتشف المزيد"} <ArrowLeft size={16} />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={onCta}
                      className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:brightness-110"
                    >
                      {slide.cta_text} <ArrowLeft size={16} />
                    </button>
                  ))}
              </div>
            </article>
          );
        })}

        {count > 1 && (
          <>
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8 sm:px-8">
              <div className="flex flex-1 items-center gap-1.5" role="tablist">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`الإعلان ${i + 1}`}
                    onClick={() => go(i)}
                    className="h-1.5 max-w-16 flex-1 overflow-hidden rounded-full bg-white/30"
                  >
                    <span
                      key={i === index ? `a-${tick}-${index}` : `i-${i}`}
                      className="block h-full origin-right rounded-full bg-primary"
                      style={
                        i === index
                          ? {
                              animation: running
                                ? `adProgress ${SLIDE_MS}ms linear forwards`
                                : undefined,
                              transform: running ? undefined : "scaleX(1)",
                            }
                          : { transform: i < index ? "scaleX(1)" : "scaleX(0)" }
                      }
                    />
                  </button>
                ))}
              </div>
              <div className={`flex items-center gap-1 ${WHITE}`}>
                <button
                  onClick={() => setUserPaused((v) => !v)}
                  aria-label={userPaused ? "تشغيل" : "إيقاف مؤقت"}
                  className="rounded-full bg-white/15 p-2 backdrop-blur hover:bg-white/25"
                >
                  {userPaused ? <Play size={14} /> : <Pause size={14} />}
                </button>
                <button
                  onClick={() => go(index - 1)}
                  aria-label="السابق"
                  className="hidden rounded-full bg-white/15 p-2 backdrop-blur hover:bg-white/25 sm:block"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => go(index + 1)}
                  aria-label="التالي"
                  className="hidden rounded-full bg-white/15 p-2 backdrop-blur hover:bg-white/25 sm:block"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
