import { Logo } from "@/components/Logo";

export function SupportWaiting({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`support-wait ${compact ? "py-8" : "min-h-[320px] py-14"}`}
      style={{ backgroundColor: "#0d131f" }}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        <Logo compact={compact} />
        <div className="clock-ring mt-8">
          <div className="clock-face">
            <span className="clock-hand clock-hour" />
            <span className="clock-hand clock-minute" />
            <span className="clock-center" />
          </div>
        </div>
        <p className="mt-6 text-sm font-bold text-white drop-shadow">جاري توجيهك إلى الدعم الفني</p>
        <p className="mt-2 max-w-xs text-xs leading-6 text-slate-300/80">
          فريق Ali Pro Media يستلم تذكرتك الآن. ابقَ في هذه الصفحة وسيصلك الرد داخل صندوق الإشعارات
          فور المعالجة.
        </p>
        <div className="mt-6 flex items-center gap-1.5">
          <span className="size-1.5 animate-bounce rounded-full bg-emerald-400" />
          <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:.3s]" />
        </div>
      </div>
    </div>
  );
}
