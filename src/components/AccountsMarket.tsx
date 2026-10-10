import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Eye,
  Facebook,
  Gamepad2,
  Instagram,
  Music2,
  Send,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Twitter,
  Users,
  X,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIQD } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import {
  getMarketCredentials,
  notifyAdmin,
  purchaseWithWallet,
  type MarketAccount,
} from "@/lib/store";
import {
  PLATFORM_LABEL,
  PLATFORM_IDS,
  isAccountPlatform,
  type AccountPlatform,
} from "@/lib/accounts";
import { useAccounts } from "@/hooks/useAccounts";

const PLATFORM_ICON: Record<AccountPlatform, LucideIcon> = {
  instagram: Instagram,
  tiktok: Music2,
  telegram: Send,
  youtube: Youtube,
  facebook: Facebook,
  twitter: Twitter,
  gaming: Gamepad2,
};

function iconFor(platform: string): LucideIcon {
  return isAccountPlatform(platform) ? PLATFORM_ICON[platform] : Instagram;
}

function labelFor(platform: string): string {
  return isAccountPlatform(platform) ? PLATFORM_LABEL[platform] : platform;
}

type Filter = "all" | AccountPlatform;

export function AccountsMarket({
  search,
  onSellRequest,
}: {
  search: string;
  onSellRequest: () => void;
}) {
  const { user, profile, refreshProfile } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const [preview, setPreview] = useState<MarketAccount | null>(null);
  const { accounts, loading, reload: load } = useAccounts();
  const [busy, setBusy] = useState("");
  const [confirming, setConfirming] = useState<MarketAccount | null>(null);
  const [purchased, setPurchased] = useState<{ title: string; credentials: string } | null>(null);

  const balance = profile?.wallet_balance_iqd ?? 0;

  const listings = useMemo(
    () =>
      (accounts ?? []).filter(
        (a) =>
          (filter === "all" || a.platform === filter) &&
          `${a.title} ${labelFor(a.platform)}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [accounts, filter, search],
  );

  const askBuy = (account: MarketAccount) => {
    if (!profile) return;
    if (account.sold) {
      toast.error("هذا الحساب غير متاح للشراء حالياً");
      return;
    }
    if (balance < account.price_iqd) {
      toast.error("رصيدك غير كافٍ");
      return;
    }
    setConfirming(account);
  };

  const buy = async (account: MarketAccount) => {
    if (!profile || !user) return;
    if (account.sold) {
      toast.error("هذا الحساب غير متاح للشراء حالياً");
      return;
    }
    if (balance < account.price_iqd) {
      toast.error("رصيدك غير كافٍ");
      return;
    }
    setBusy(account.id);
    setConfirming(null);
    try {
      await purchaseWithWallet({
        productId: null,
        productName: `شراء حساب: ${account.title}`,
        category: "digital_cards",
        kind: "account",
        marketAccountId: account.id,
        unitPrice: account.price_iqd,
        buyerName: profile.full_name,
        buyerPhone: profile.phone,
        buyerEmail: profile.email,
      });
      const credentials = await getMarketCredentials(account.id).catch(() => "");
      await notifyAdmin(
        "عملية شراء حساب جديدة",
        `${account.title} · ${formatIQD(account.price_iqd)} · ${profile.full_name || profile.email}`,
      );
      await refreshProfile();
      await load();
      setPreview(null);
      setPurchased({ title: account.title, credentials });
      toast.success("تم خصم المبلغ وتأكيد الشراء", {
        description: credentials
          ? "تم عرض بيانات الدخول الخاصة بك."
          : "ستستلم بيانات الحساب من فريق الدعم خلال دقائق.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر إتمام عملية الشراء");
    } finally {
      setBusy("");
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-emerald-400/15 bg-emerald-400/[.05] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-emerald-400">سوق الحسابات</p>
          <h3 className="mt-1 font-display text-lg font-bold text-white">
            بيع وشراء الحسابات بضمان الوسيط
          </h3>
          <p className="mt-1 text-xs leading-6 text-slate-400">
            كل حساب معروض تم توثيقه من فريقنا. يُخصم السعر من محفظتك مباشرة عند الشراء، ورصيدك
            الحالي <b className="text-emerald-300">{formatIQD(balance)}</b>.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onSellRequest}
          className="h-auto shrink-0 border-primary/40 px-4 py-3 text-xs font-bold text-primary hover:bg-primary/10"
        >
          أريد عرض حسابي للبيع
        </Button>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {(["all", ...PLATFORM_IDS] as Filter[]).map((id) => (
          <Button
            type="button"
            variant={filter === id ? "default" : "ghost"}
            size="sm"
            key={id}
            onClick={() => setFilter(id)}
            className="whitespace-nowrap px-3.5 text-[11px] font-bold"
          >
            {id === "all" ? "كل المنصات" : PLATFORM_LABEL[id]}
          </Button>
        ))}
      </div>

      {loading ? (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="جارٍ تحميل الحسابات"
          aria-busy="true"
        >
          {[0, 1, 2].map((item) => (
            <div key={item} className="border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="size-12" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="mt-5 h-5 w-2/3" />
              <Skeleton className="mt-3 h-4 w-1/3" />
              <div className="mt-6 flex justify-between">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings?.map((account) => {
            const Icon = iconFor(account.platform);
            return (
              <article
                key={account.id}
                className="flex flex-col rounded-2xl border border-white/[.08] bg-white/[.035] p-4 transition hover:-translate-y-1 hover:border-emerald-400/35"
              >
                <div className="flex items-start justify-between gap-3">
                  {account.image_url ? (
                    <img
                      src={account.image_url}
                      alt={account.title}
                      className="h-12 w-12 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/25 to-sky-400/10 text-emerald-300">
                      <Icon size={22} />
                    </div>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      account.sold
                        ? "bg-red-400/10 text-red-300"
                        : "bg-emerald-400/10 text-emerald-300"
                    }`}
                  >
                    {account.sold ? "تم البيع" : "متاح للبيع"}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-white">
                  {account.title}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  {labelFor(account.platform)}
                  <BadgeCheck size={13} className="text-sky-300 opacity-0" />
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <Meta
                    icon={<Users size={13} />}
                    text={`${(account.followers ?? 0).toLocaleString("en-US")} متابع`}
                  />
                  <Meta icon={<ShieldCheck size={13} />} text="ضمان الوسيط" />
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] pt-4">
                  <div>
                    <p className="text-[10px] text-slate-500">السعر</p>
                    <p className="mt-0.5 text-base font-bold text-emerald-300">
                      {formatIQD(account.price_iqd)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreview(account)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[.05] px-3 py-2.5 text-xs font-bold text-slate-200 hover:border-emerald-400/30 hover:text-emerald-300"
                    >
                      <Eye size={14} /> عرض
                    </button>
                    <button
                      disabled={account.sold || busy === account.id}
                      onClick={() => askBuy(account)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ShoppingCart size={14} /> {busy === account.id ? "جارٍ الشراء" : "شراء"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-500">
          {accounts.length === 0
            ? "لا توجد حسابات معروضة حالياً"
            : "لا توجد حسابات مطابقة لبحثك حالياً"}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
          dir="rtl"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-emerald-400">{labelFor(preview.platform)}</p>
                <h2 className="mt-1 text-lg font-bold text-white">{preview.title}</h2>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-300">
              <Box label="المتابعون" value={(preview.followers ?? 0).toLocaleString("en-US")} />
              <Box label="المنصة" value={labelFor(preview.platform)} />
            </div>
            {preview.description && (
              <p className="mt-5 rounded-xl bg-white/[.04] px-3 py-2.5 text-xs leading-6 text-slate-300">
                {preview.description}
              </p>
            )}
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-[11px] text-slate-400">
              تظهر بيانات الدخول بعد إتمام الشراء
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-emerald-300">{formatIQD(preview.price_iqd)}</p>
                <p className="mt-1 text-[11px] text-slate-500">رصيدك: {formatIQD(balance)}</p>
              </div>
              <button
                disabled={preview.sold || busy === preview.id}
                onClick={() => askBuy(preview)}
                className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-40"
              >
                <ShoppingCart size={16} /> شراء الحساب الآن
              </button>
            </div>
          </div>
        </div>
      )}
      {confirming && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/90 p-4"
          dir="rtl"
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 text-center">
            <h3 className="text-base font-bold text-white">تأكيد شراء الحساب</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              سيتم خصم <b className="text-emerald-300">{formatIQD(confirming.price_iqd)}</b> من
              محفظتك مقابل «{confirming.title}». هل تريد المتابعة؟
            </p>
            <div className="mt-6 flex gap-2">
              <button
                disabled={!!busy}
                onClick={() => buy(confirming)}
                className="flex-1 rounded-xl bg-emerald-400 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
              >
                {busy ? "جارٍ التنفيذ..." : "تأكيد الشراء"}
              </button>
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-bold text-white"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {purchased && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/90 p-4"
          dir="rtl"
        >
          <div className="w-full max-w-md rounded-3xl border border-emerald-400/25 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">تمت عملية الشراء</h3>
              <button
                onClick={() => setPurchased(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">{purchased.title}</p>
            <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/[.07] p-4">
              <p className="text-[11px] text-slate-400">بيانات الدخول الخاصة بك</p>
              {purchased.credentials ? (
                <code
                  dir="ltr"
                  className="mt-2 block whitespace-pre-wrap break-all font-mono text-sm text-emerald-300"
                >
                  {purchased.credentials}
                </code>
              ) : (
                <p className="mt-2 text-sm text-slate-300">
                  سيرسل فريق الدعم بيانات الدخول إلى حسابك خلال دقائق.
                </p>
              )}
            </div>
            <button
              onClick={() => setPurchased(null)}
              className="mt-5 w-full rounded-xl bg-emerald-400 py-3 text-sm font-bold text-slate-950"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-emerald-400">{icon}</span>
      {text}
    </span>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[.07] bg-white/[.03] px-3 py-2.5">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}
