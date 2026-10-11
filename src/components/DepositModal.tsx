import { useRef, useState } from "react";
import { Check, Copy, Loader2, Upload, Wallet, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DEPOSIT_GATEWAYS, type DepositGateway } from "@/types";
import { formatIQD } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { createDeposit, errorMessage, notifyAdmin, uploadReceipt } from "@/lib/store";
import { sanitizeText } from "@/lib/sanitize";

export function DepositModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { profile, user } = useAuth();
  const [gateway, setGateway] = useState<DepositGateway>("super_qi");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = DEPOSIT_GATEWAYS.find((g) => g.id === gateway)!;

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const copyTarget = async () => {
    await navigator.clipboard.writeText(active.target_value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const submit = async () => {
    if (busy) return;
    setError("");
    const value = Number(amount.replace(/\D/g, ""));
    if (!value || value < 1000) {
      setError("يرجى إدخال مبلغ صحيح (1000 د.ع كحد أدنى).");
      return;
    }
    const userId = profile?.id || user?.id;
    if (!userId) {
      setError("يجب تسجيل الدخول أولاً.");
      return;
    }
    setBusy(true);
    try {
      // رفع الوصل اختياري: إن لم يُختر ملف أو فشل الرفع يُسجَّل الطلب بدون رابط صورة
      let receiptUrl = "";
      if (file) {
        try {
          receiptUrl = await uploadReceipt(userId, file);
        } catch {
          receiptUrl = "";
        }
      }
      await createDeposit({
        userId,
        userName: profile?.full_name || "",
        userEmail: profile?.email || user?.email || "",
        userPhone: profile?.phone || "",
        gateway,
        gatewayLabel: active.label_ar,
        amount: value,
        receiptUrl,
        senderNote: sanitizeText(note, 500),
      });
      try {
        await notifyAdmin(
          "طلب إيداع جديد",
          `${profile?.full_name || profile?.email || "مستخدم"} · ${active.label_ar} · ${formatIQD(value)}`,
        );
      } catch {
        /* الإشعار الإداري ليس شرطاً لنجاح الطلب */
      }
      toast.success("تم إرسال الطلب بنجاح 🎉", {
        description: "سيتم مراجعته من الإدارة وإشعارك بالنتيجة.",
      });
      setDone(true);
    } catch (err) {
      // عرض الخطأ الحقيقي كما أرجعته قاعدة البيانات لتسهيل التشخيص
      const message = errorMessage(err);
      console.error("[deposit] submission failed:", err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        dir="rtl"
        className="z-[220] max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-2xl border-white/10 bg-slate-900 p-0 text-right shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900 px-6 py-5">
          <div>
            <p className="text-xs text-emerald-400">بوابات الإيداع</p>
            <h2 className="mt-1 text-lg font-bold text-white">إضافة رصيد إلى المحفظة</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
              <Check size={32} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">تم إرسال طلب الإيداع</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              سيتم مراجعة وصل التحويل من قبل الإدارة وإضافة الرصيد إلى محفظتك بعد الموافقة.
            </p>
            <button
              onClick={onDone}
              className="mt-7 w-full rounded-xl bg-emerald-400 py-3 text-sm font-bold text-slate-950"
            >
              حسناً
            </button>
          </div>
        ) : (
          <div className="space-y-5 px-6 py-6">
            <div>
              <label className="mb-3 block text-sm font-bold text-white">اختر بوابة الإيداع</label>
              <div className="grid grid-cols-2 gap-2">
                {DEPOSIT_GATEWAYS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGateway(g.id)}
                    disabled={busy}
                    className={`rounded-xl border p-3 text-right text-xs font-bold transition disabled:opacity-50 ${gateway === g.id ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[.03] text-slate-400 hover:border-white/20"}`}
                  >
                    {g.label_ar}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[.07] p-4">
              <p className="text-[11px] text-slate-400">
                {active.target_type === "account" ? "رقم الحساب" : "رقم الهاتف"}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <code
                  dir="ltr"
                  className="font-mono text-lg font-bold tracking-wider text-emerald-300"
                >
                  {active.target_value}
                </code>
                <button
                  onClick={copyTarget}
                  className="flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "تم النسخ" : "نسخ"}
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-slate-400">{active.hint}</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white">
                المبلغ المحوّل (دينار عراقي)
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                disabled={busy}
                dir="ltr"
                placeholder="25000"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
              />
              {!!amount && (
                <p className="mt-2 text-xs text-emerald-300">{formatIQD(Number(amount))}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white">
                وصل التحويل (مستحسن)
              </label>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[.03] px-4 py-6 text-slate-400 hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-50"
              >
                <Upload size={22} />
                <span className="text-xs font-bold">
                  {file ? file.name : "اضغط لرفع صورة وصل التحويل"}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={pick}
                className="hidden"
              />
              {preview && (
                <img
                  src={preview}
                  alt="وصل التحويل"
                  className="mt-3 max-h-52 w-full rounded-2xl object-contain"
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white">ملاحظة (اختياري)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="رقم العملية أو أي تفاصيل إضافية"
                className="min-h-20 w-full rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm text-white outline-none focus:border-emerald-400/40"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-400/10 px-3 py-2 text-xs text-red-300">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={busy || Number(amount) <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : <Wallet size={18} />} إرسال
              طلب الإيداع للمراجعة
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
