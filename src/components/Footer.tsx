import { Mail, Orbit } from "lucide-react";
export function Footer() {
  return (
    <footer className="border-t border-white/[.07] bg-slate-950/70">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-5 px-5 py-8 text-center sm:flex-row sm:text-right lg:px-10">
        <div className="flex items-center gap-3 text-slate-500">
          <Orbit size={18} className="text-emerald-400" />
          <span className="text-xs">جميع الحقوق محفوظة © 2026 Ali Pro Media</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Mail size={14} />
          <span>Development by Hussian Ahmed</span>
          <span className="text-slate-700">|</span>
          <span>ha1900612@gmail.com</span>
        </div>
      </div>
    </footer>
  );
}
