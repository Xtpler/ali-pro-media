import { useMemo, useState } from "react";
import { Check, Copy, Hash, Link2, Loader2, ShoppingCart, Wallet, X } from "lucide-react";
import type { Product } from "@/types";
import { formatIQD } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { purchaseWithWallet, notifyAdmin } from "@/lib/store";
import { isSafeLink, sanitizeUrl } from "@/lib/sanitize";
import { BrandIcon, detectPlatform } from "@/components/BrandIcons";

export function PaymentModal({
  product,
  onClose,
  onDone,
}: {
  product: Product;
  onClose: () => void;
  onDone: () => void;
}) {
  const { profile, user, refreshProfile } = useAuth();
  const isSocial = product.category === "social_media";
  const platform = useMemo(
    () => detectPlatform(`${product.name} ${product.name_ar} ${product.icon}`),
    [product],
  );
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const total = product.price_iqd * Math.max(1, quantity);
  const balance = profile?.wallet_balance_iqd ?? 0;

  const validate = () => {
    if (isSocial && link.trim().length < 5) {
      setError("يرجى إدخال رابط الحساب أو المنشور المطلوب.");
      return false;
    }
    if (isSocial && !isSafeLink(link.trim())) {
      setError("الرابط المدخل غير صالح أو غير آمن.");
      return false;
    }
    if (!isSocial && link.trim().length < 2) {
      setError("يرجى إدخال معرف الحساب أو رقم اللاعب لاستلام البطاقة.");
      return false;
    }
    if (quantity < 1) {
      setError("الكمية يجب أن تكون 1 على الأقل.");
      return false;
    }
    if (balance < total) {
      toast.error("رصيدك غير كافٍ لإتمام هذه العملية");
      setError("رصيدك غير كافٍ لإتمام هذه العملية");
      return false;
    }
    return true;
  };

  const askConfirm = () => {
    setError("");
    if (!validate()) return;
    setConfirming(true);
  };

  const submit = async () => {
    setError("");
    if (!validate()) return;
    setConfirming(false);
    setBusy(true);
    try {
      const targetLink = isSocial ? sanitizeUrl(link.trim()) : link.trim();
      const order = await purchaseWithWallet({
        productId: product.id.startsWith("fallback") ? null : product.id,
        productName: product.name_ar || product.name,
        category: product.category,
        kind: "service",
        targetLink,
        quantity,
        unitPrice: product.price_iqd,
        buyerName: profile?.full_name || "",
        buyerPhone: profile?.phone || "",
        buyerEmail: profile?.email || user?.email || "",
      });
      await notifyAdmin(
        isSocial ? "طلب خدمة سوشيال ميديا جديد" : "طلب بطاقة جديد",
        `${product.name_ar || product.name} · الكمية ${quantity} · ${formatIQD(total)} · ${profile?.full_name || profile?.email || "مستخدم"}${isSocial ? ` · ${targetLink}` : ""}`,
      );
      toast.success("تم إرسال طلبك وخصم المبلغ من محفظتك");
      await refreshProfile();
      setCode(order.code || "");
      setRemaining(Math.max(0, balance - total));
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذر إتمام العملية";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex animate-fade-up items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            {platform && (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[.06] text-emerald-300">
                <BrandIcon platform={platform} size={22} />
              </span>
            )}
            <div>
              <p className="text-xs text-emerald-400">
                {isSocial ? "طلب خدمة سوشيال ميديا" : "طلب بطاقة إلكترونية"}
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                {product.name_ar || product.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        {code || remaining !== null ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
              <Check size={32} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">تم إرسال طلبك بنجاح</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              تم خصم المبلغ من محفظتك، وسيتم تنفيذ طلبك من قبل فريق الدعم.
            </p>
            {code && (
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3">
                <code
                  dir="ltr"
                  className="font-mono text-lg font-bold tracking-widest text-emerald-300"
                >
                  {code}
                </code>
                <button
                  onClick={copy}
                  className="flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "تم النسخ" : "نسخ الكود"}
                </button>
              </div>
            )}
            {remaining !== null && (
              <p className="mt-4 text-xs text-slate-400">
                رصيدك المتبقي: <b className="text-emerald-300">{formatIQD(remaining)}</b>
              </p>
            )}
            <button
              onClick={onDone}
              className="mt-7 w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/15"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <div className="space-y-5 px-6 py-6">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                <Link2 size={16} className="text-emerald-400" />
                {isSocial ? "رابط الحساب أو المنشور" : "معرف الحساب / رقم اللاعب"}
              </label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                dir="ltr"
                placeholder={
                  isSocial ? "https://instagram.com/username" : "ID أو البريد المرتبط بالحساب"
                }
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
              />
              <p className="mt-2 text-[11px] text-slate-500">
                {isSocial
                  ? "تأكد أن الحساب عام (Public) حتى تتم المعالجة بنجاح."
                  : "سيتم تسليم كود البطاقة إلى حسابك بعد موافقة الإدارة."}
              </p>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                <Hash size={16} className="text-emerald-400" /> الكمية
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-11 w-11 rounded-xl border border-white/10 bg-white/[.05] text-lg text-white"
                >
                  −
                </button>
                <input
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))
                  }
                  dir="ltr"
                  className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[.04] text-center text-sm font-bold text-white outline-none focus:border-emerald-400/50"
                />
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="h-11 w-11 rounded-xl border border-white/10 bg-white/[.05] text-lg text-white"
                >
                  +
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] p-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>سعر الوحدة</span>
                <span>{formatIQD(product.price_iqd)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                <span>الكمية</span>
                <span dir="ltr">× {quantity}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-sm font-bold text-white">الإجمالي</span>
                <strong className="text-xl text-emerald-300">{formatIQD(total)}</strong>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                <Wallet size={13} /> رصيدك الحالي: {formatIQD(balance)}
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-400/10 px-3 py-2 text-xs text-red-300">{error}</p>
            )}

            <button
              onClick={askConfirm}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 text-sm font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : <ShoppingCart size={18} />}{" "}
              إرسال الطلب وخصم المبلغ
            </button>
            <p className="text-center text-[11px] leading-5 text-slate-500">
              يتم خصم المبلغ من محفظتك فور تأكيد الطلب.
            </p>
          </div>
        )}
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/85 p-4"
          dir="rtl"
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 text-center">
            <h3 className="text-base font-bold text-white">تأكيد الطلب</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              سيتم إرسال طلب «{product.name_ar || product.name}» بكمية {quantity} بقيمة{" "}
              <b className="text-emerald-300">{formatIQD(total)}</b> وخصمها من محفظتك فوراً. هل تريد
              المتابعة؟
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={submit}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
              >
                {busy ? <Loader2 className="animate-spin" size={17} /> : <Check size={17} />} تأكيد
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-bold text-white"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
