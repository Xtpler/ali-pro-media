import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

export function SplashScreen({ onDone, ready = true }: { onDone: () => void; ready?: boolean }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!ready || leaving) return;
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(onDone, 700);
    }, 1600);
    return () => clearTimeout(timer);
  }, [onDone, ready, leaving]);

  return (
    <div className={`splash-screen ${leaving ? "splash-leaving" : ""}`}>
      <div className="splash-grid" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <div className="splash-scan" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="splash-logo-wrap">
          <Logo />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium tracking-[.35em] text-emerald-300">ALI PRO MEDIA</p>
          <p className="mt-2 text-xs text-slate-400">سوقك الرقمي الموثوق</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:180ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:360ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
