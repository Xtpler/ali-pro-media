import { Orbit } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" dir="ltr">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,.35)]">
        <Orbit size={25} strokeWidth={2.4} />
        <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-white" />
      </div>
      {!compact && (
        <div className="text-right" dir="rtl">
          <div className="font-display text-xl font-bold tracking-tight text-white">
            Ali Pro <span className="text-emerald-400">Media</span>
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[.28em] text-slate-400">
            Digital Commerce
          </div>
        </div>
      )}
    </div>
  );
}
