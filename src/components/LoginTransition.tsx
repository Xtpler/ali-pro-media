import { useEffect } from "react";
import { Logo } from "@/components/Logo";

export function LoginTransition({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1600);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="login-transition" dir="rtl">
      <div className="splash-grid" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="login-burst" />
        <Logo />
        <p className="text-sm font-medium text-emerald-300">تم تسجيل الدخول بنجاح</p>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="login-progress h-full rounded-full bg-emerald-400" />
        </div>
      </div>
    </div>
  );
}
