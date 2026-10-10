import { useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { logError, submitUnbanAppeal, uploadAttachment } from "@/lib/store";

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

export function UnbanAppealModal({
  open,
  onClose,
  userId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  onDone?: () => void;
}) {
  const [reason, setReason] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  if (!open) return null;

  const pickFile = (selected: File | undefined) => {
    if (!selected) return;
    if (selected.size > MAX_ATTACHMENT_BYTES) {
      toast.error("الحد الأقصى لحجم المرفق 8 ميغابايت");
      if (ref.current) ref.current.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const submit = async () => {
    if (!reason.trim() || !phone.trim()) {
      toast.error("أدخل سبب الاعتراض ورقم الهاتف أو واتساب");
      return;
    }
    setBusy(true);
    try {
      // المرفق اختياري: عند فشل الرفع يُسجَّل الطلب مع رابط فارغ دون تعطيله
      let attachmentUrl = "";
      try {
        attachmentUrl = await uploadAttachment(userId, file);
      } catch (uploadError) {
        logError("unbanModal.upload", uploadError);
        attachmentUrl = "";
      }
      await submitUnbanAppeal({
        userId,
        reason: reason.trim(),
        contactPhone: phone.trim(),
        attachmentUrl,
      });
      toast.success("تم تقديم الطلب بنجاح");
      setReason("");
      setPhone("");
      setFile(null);
      onDone?.();
      onClose();
    } catch (submitError) {
      logError("unbanModal.submit", submitError);
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "تعذر إرسال الطلب، يرجى المحاولة مرة أخرى",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="motion-pop w-full max-w-lg rounded-3xl border border-primary/30 bg-card/95 p-6 text-foreground shadow-[0_0_60px_-14px_color-mix(in_oklab,var(--primary)_55%,transparent)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">قسم فتح الباند</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              أرسل اعتراضك وسيراجعه فريق الإدارة.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="سبب الاعتراض"
            maxLength={1800}
            className="min-h-28 w-full rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-4 focus:ring-primary/15"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الهاتف / واتساب"
            dir="ltr"
            maxLength={30}
            className="h-12 w-full rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/70 focus:ring-4 focus:ring-primary/15"
          />
          <input
            ref={ref}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            hidden
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="glow-ring flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-4 text-xs font-bold text-primary"
          >
            <FileUp size={17} />
            {file ? file.name : "إرفاق مستند أو صورة (اختياري)"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="motion-press flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />} إرسال الطلب
          </button>
        </div>
      </div>
    </div>
  );
}
