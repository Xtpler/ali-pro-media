import { useState } from "react";
import { Headphones, MessageCircle, Phone, Send, X } from "lucide-react";
import { SUPPORT_LINKS } from "@/lib/site";

export function FloatingSupport() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-24 right-4 z-[90] flex flex-col items-end gap-3 sm:right-6"
      dir="rtl"
    >
      {open && (
        <>
          <a
            href={SUPPORT_LINKS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/30 transition hover:brightness-110"
          >
            <MessageCircle size={17} /> واتساب
          </a>
          <a
            href={SUPPORT_LINKS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-[#229ED9] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/30 transition hover:brightness-110"
          >
            <Send size={17} /> تيليجرام
          </a>
          <a
            href={SUPPORT_LINKS.phone}
            className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-black/30 transition hover:brightness-110"
          >
            <Phone size={17} /> اتصال هاتفي
          </a>
        </>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="اختصارات الدعم"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-300"
      >
        {open ? <X size={20} /> : <Headphones size={20} />}
      </button>
    </div>
  );
}
