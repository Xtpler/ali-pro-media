import { CheckCircle2, X } from "lucide-react";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[140] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-400/30 bg-slate-900/95 px-5 py-3 text-sm text-white shadow-2xl backdrop-blur-xl">
      <CheckCircle2 className="text-emerald-400" size={19} />
      <span>{message}</span>
      <button onClick={onClose} className="mr-2 text-slate-400 transition hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}
