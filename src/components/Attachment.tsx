import { useEffect, useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import { fileUrl } from "@/lib/store";

type AttachmentProps = {
  url?: string | undefined;
  stored?: string | undefined;
  className?: string;
  label?: string;
};

const isImagePath = (value: string) =>
  value.startsWith("data:image") || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(value);

/** معاينة مصغّرة قابلة للنقر لمرفق (تذكرة/رد) مع فتح معاينة بملء الشاشة */
export function Attachment({ url, stored, className = "", label = "مرفق" }: AttachmentProps) {
  const ref = stored ?? url ?? "";
  const [resolved, setResolved] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!ref) {
      setResolved("");
      return;
    }
    setLoading(true);
    fileUrl(ref)
      .then((u) => {
        if (alive) setResolved(u);
      })
      .catch(() => {
        if (alive) setResolved("");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [ref]);

  if (!ref) return null;

  if (loading) {
    return (
      <div
        className={`mt-3 flex h-24 w-24 items-center justify-center rounded-xl border border-white/10 bg-white/[.03] ${className}`}
      >
        <Loader2 className="animate-spin text-slate-500" size={18} />
      </div>
    );
  }

  if (!resolved) return null;

  const isImage = isImagePath(resolved) || isImagePath(ref);

  if (!isImage) {
    return (
      <a
        href={resolved}
        target="_blank"
        rel="noreferrer"
        className={`mt-3 inline-flex items-center gap-2 rounded-xl bg-white/[.06] px-3 py-2 text-[11px] font-bold text-emerald-300 ${className}`}
      >
        <Paperclip size={13} /> فتح المرفق
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mt-3 block overflow-hidden rounded-xl border border-white/10 transition hover:border-emerald-400/50 ${className}`}
      >
        <img src={resolved} alt={label} className="h-24 w-24 object-cover" />
      </button>
      {open && <ImageLightbox url={resolved} onClose={() => setOpen(false)} />}
    </>
  );
}

/** عارض الصورة بملء الشاشة مع دعم الإغلاق بالخلفية أو زر Escape */
export function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/92 p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute left-5 top-5 rounded-xl bg-white/10 p-2 text-white"
        aria-label="إغلاق"
      >
        <X size={20} />
      </button>
      <img
        src={url}
        alt="مرفق"
        className="max-h-[88vh] max-w-full rounded-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <a
        href={url}
        download
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-6 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950"
      >
        تحميل
      </a>
    </div>
  );
}
