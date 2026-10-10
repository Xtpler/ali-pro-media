import { useEffect, useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

export function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, user } = useAuth();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const code = (profile?.id || user?.id || "guest").replace(/-/g, "").slice(0, 8).toUpperCase();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLink(`${window.location.origin}/?ref=${code}`);
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    toast.success("تم نسخ الرابط بنجاح", { description: "شاركه مع أصدقائك واحصل على مكافأتك." });
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Ali Pro Media",
          text: "انضم إلى Ali Pro Media واحصل على مكافأة",
          url: link,
        });
        return;
      } catch {
        /* المستخدم أغلق نافذة المشاركة */
      }
    }
    copy();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        dir="rtl"
        className="z-[220] max-h-[85vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-3xl border-white/10 bg-slate-900 p-0 text-right"
      >
        <div className="px-6 pb-6 pt-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-400">
            <Gift size={30} />
          </div>
          <h2 className="mt-5 text-lg font-bold text-white">ادعُ صديقك واحصل على مكافأة</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            شارك رابط الدعوة الخاص بك، وعند أول عملية شراء لصديقك تُضاف المكافأة تلقائياً إلى
            محفظتك.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-400/[.07] p-4 text-right">
            <p className="text-[11px] text-slate-400">رابط الدعوة الخاص بك</p>
            <code
              dir="ltr"
              className="mt-2 block truncate font-mono text-xs font-bold text-emerald-300"
            >
              {link}
            </code>
          </div>

          <button
            onClick={copy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
          >
            {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "تم النسخ" : "نسخ الرابط"}
          </button>
          <button
            onClick={share}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10"
          >
            <Share2 size={16} /> مشاركة
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
