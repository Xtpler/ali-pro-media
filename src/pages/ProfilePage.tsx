import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Gift,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  Upload,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { formatIQD } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { getTickets, uploadAvatar } from "@/lib/data";
import {
  fileUrl,
  listDeposits,
  listOrders,
  listReferrals,
  listWalletTransactions,
} from "@/lib/store";
import { formatDate } from "@/lib/format";
import { redeemVoucher } from "@/lib/site";
import { REFERRAL_BONUS_PERCENT, referralLink } from "@/lib/constants";
import { useWalletRealtime } from "@/hooks/useWallet";
import { Page, StatusPill } from "@/pages/OrdersPage";
import type { Deposit, Referral } from "@/types";
import { DepositModal } from "@/components/DepositModal";
import { UnbanAppealModal } from "@/components/UnbanAppealModal";

type WalletTx = {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
};

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [deposit, setDeposit] = useState(false);
  const [name, setName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [appealOpen, setAppealOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({ orders: 0, active: 0, tickets: 0 });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [refCopied, setRefCopied] = useState(false);

  const myReferralLink = referralLink(profile?.id || user?.id);
  const earnedBonus = referrals.reduce(
    (sum, r) => sum + (r.status === "rewarded" ? r.reward_amount_iqd : 0),
    0,
  );

  useEffect(() => {
    if (!user) return;
    listReferrals(user.id)
      .then(setReferrals)
      .catch(() => undefined);
  }, [user]);

  const copyReferralLink = async () => {
    if (!myReferralLink) return;
    try {
      await navigator.clipboard.writeText(myReferralLink);
    } catch {
      const el = document.createElement("textarea");
      el.value = myReferralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setRefCopied(true);
    toast.success("تم نسخ رابط الدعوة", {
      description: "شاركه مع أصدقائك واحصل على المكافأة.",
    });
    setTimeout(() => setRefCopied(false), 1800);
  };

  useEffect(() => {
    let active = true;
    if (profile?.avatar_url) {
      fileUrl(profile.avatar_url)
        .then((url) => {
          if (active) setAvatarUrl(url);
        })
        .catch(() => undefined);
    } else {
      setAvatarUrl("");
    }
    return () => {
      active = false;
    };
  }, [profile?.avatar_url]);

  useEffect(() => {
    if (!user) return;
    listWalletTransactions(user.id).then((rows) => setTransactions(rows as unknown as WalletTx[]));
  }, [user, profile?.wallet_balance_iqd]);

  useEffect(() => {
    if (!user) return;
    Promise.all([listOrders(user.id).catch(() => []), getTickets(user.id).catch(() => [])]).then(
      ([o, t]) =>
        setStats({
          orders: o.length,
          active: o.filter(
            (x) => x.status === "pending" || x.status === "approved" || x.status === "processing",
          ).length,
          tickets: t.filter((x) => x.status !== "closed").length,
        }),
    );
  }, [user]);

  const completeness = Math.round(
    ([name, phone, profile?.email, avatarUrl].filter(Boolean).length / 4) * 100,
  );

  const reloadDeposits = () => {
    if (!user) return;
    listDeposits(user.id)
      .then((rows) => setPendingDeposits(rows.filter((d) => d.status === "pending")))
      .catch(() => undefined);
  };

  useEffect(reloadDeposits, [user]);
  useWalletRealtime(reloadDeposits);

  const save = async () => {
    if (!profile) return;
    await supabase.from("profiles").update({ full_name: name, phone }).eq("id", profile.id);
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const stored = await uploadAvatar(profile.id, file);
      await supabase.from("profiles").update({ avatar_url: stored }).eq("id", profile.id);
      await refreshProfile();
      const url = await fileUrl(stored);
      setAvatarUrl(url);
    } catch {
      toast.error("تعذّر رفع الصورة");
    }
    setUploading(false);
  };

  const handleRedeem = async () => {
    if (!voucherCode.trim()) return;
    setRedeeming(true);
    const result = await redeemVoucher(voucherCode.trim());
    if (result.ok) {
      toast.success("تم شحن رصيدك بنجاح", {
        description: `تمت إضافة ${formatIQD(result.amount)} إلى محفظتك`,
      });
      setVoucherCode("");
      await refreshProfile();
    } else {
      toast.error(result.error);
    }
    setRedeeming(false);
  };

  const card = "rounded-3xl border border-border bg-card p-6 shadow-sm";
  const inputCls =
    "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary";

  return (
    <div className="pt-20 sm:pt-24">
      <Page title="حسابي" subtitle="إدارة بياناتك الشخصية ومحفظتك ونشاطك">
        {/* Identity header */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <div
            className="h-28 bg-gradient-to-l from-primary/40 via-primary/15 to-transparent sm:h-32"
            aria-hidden
          />
          <div className="flex flex-col gap-5 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative w-fit">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="h-24 w-24 rounded-3xl border-4 border-card object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-card bg-primary text-primary-foreground shadow-lg">
                    <UserRound size={40} />
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="تغيير الصورة"
                  className="absolute -bottom-2 -start-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-lg transition hover:brightness-110"
                >
                  <Upload size={15} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatar}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-foreground">
                  {profile?.full_name || "مستخدم Ali Pro"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{profile?.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile?.is_admin && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary">
                      <ShieldCheck size={12} /> حساب أدمن
                    </span>
                  )}
                  {profile?.created_at && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      عضو منذ {formatDate(profile.created_at)}
                    </span>
                  )}
                  {uploading && (
                    <span className="text-[11px] text-primary">جاري رفع الصورة...</span>
                  )}
                </div>
              </div>
            </div>
            <div className="min-w-[220px] rounded-2xl border border-primary/25 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-primary">
                <Wallet size={15} /> رصيد المحفظة
              </p>
              <p className="mt-2 text-2xl font-extrabold text-foreground">
                {formatIQD(profile?.wallet_balance_iqd ?? 0)}
              </p>
              <button
                onClick={() => setDeposit(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground transition hover:brightness-110"
              >
                <Plus size={15} /> إضافة رصيد
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {(
            [
              ["إجمالي الطلبات", stats.orders, Package],
              ["طلبات قيد التنفيذ", stats.active, Package],
              ["تذاكر مفتوحة", stats.tickets, MessageSquare],
            ] as const
          ).map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <Icon size={18} className="mx-auto text-primary" />
              <p className="mt-2 text-2xl font-extrabold text-foreground">{value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Invite friends (referral engine) */}
        <section className="mt-5 rounded-3xl border border-primary/20 bg-primary/[.04] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Gift size={17} className="text-primary" /> ادعُ أصدقاءك واحصل على مكافأة
              </p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                شارك رابطك الخاص، وعند أول إيداع معتمد لصديقك تكسب{" "}
                <b className="text-primary">{REFERRAL_BONUS_PERCENT}٪</b> من مبلغ إيداعه تلقائياً في
                محفظتك.
              </p>
              <div className="mt-4">
                <code
                  dir="ltr"
                  className="block truncate rounded-xl border border-border bg-background px-4 py-3 text-left font-mono text-xs font-bold text-foreground"
                >
                  {myReferralLink || "—"}
                </code>
                <button
                  onClick={copyReferralLink}
                  disabled={!myReferralLink}
                  className="mt-3 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
                >
                  {refCopied ? <Check size={14} /> : <Copy size={14} />}
                  {refCopied ? "تم النسخ" : "نسخ رابط الدعوة"}
                </button>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-3 sm:min-w-[260px]">
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-2xl font-extrabold text-foreground">{referrals.length}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">الأصدقاء المدعوون</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-2xl font-extrabold text-primary">{formatIQD(earnedBonus)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">المكافآت المكتسبة</p>
              </div>
            </div>
          </div>
        </section>

        {profile?.is_banned && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-300">
            <p>حسابك محظور حالياً.</p>
            <button onClick={() => setAppealOpen(true)} className="mt-2 font-bold underline">
              تقديم طلب فك الحظر
            </button>
          </div>
        )}
        {profile?.is_restricted && (
          <div className="mt-5 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
            حسابك مقيد - بعض الميزات غير متاحة
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className={card}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">المعلومات الشخصية</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  تأكد من صحة بيانات التواصل الخاصة بك
                </p>
              </div>
              <div className="text-end">
                <p className="text-[11px] font-bold text-muted-foreground">
                  اكتمال الملف {completeness}%
                </p>
                <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <Field
                icon={<UserRound size={17} />}
                label="الاسم الكامل"
                value={name}
                onChange={setName}
              />
              <div>
                <label className="mb-2 block text-xs text-muted-foreground">
                  البريد الإلكتروني
                </label>
                <div className={`flex items-center gap-3 text-muted-foreground ${inputCls}`}>
                  <Mail size={17} />
                  {profile?.email}
                </div>
              </div>
              <Field
                icon={<Phone size={17} />}
                label="رقم الهاتف"
                value={phone}
                onChange={setPhone}
              />
              <button
                onClick={save}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110"
              >
                {saved ? <Check size={16} /> : <ShieldCheck size={16} />}
                {saved ? "تم الحفظ" : "حفظ التغييرات"}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className={card}>
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Gift size={16} className="text-primary" /> كارت الشحن
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                أدخل كود الكارت لشحن رصيدك فوراً
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  dir="ltr"
                  placeholder="APM-XXXX-XXXX"
                  className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
                />
                <button
                  onClick={handleRedeem}
                  disabled={redeeming || !voucherCode.trim()}
                  className="rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:brightness-110 disabled:opacity-40"
                >
                  شحن
                </button>
              </div>
            </div>

            {pendingDeposits.length > 0 && (
              <div className={card}>
                <p className="text-sm font-bold text-foreground">طلبات إيداع نشطة</p>
                <div className="mt-3 space-y-2">
                  {pendingDeposits.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2"
                    >
                      <div>
                        <p className="text-[11px] font-bold text-foreground">{d.gateway_label}</p>
                        <p className="text-[10px] text-primary">{formatIQD(d.amount_iqd)}</p>
                      </div>
                      <StatusPill status={d.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transactions.length > 0 && (
              <div className={card}>
                <p className="text-sm font-bold text-foreground">آخر حركات المحفظة</p>
                <ul className="mt-3 divide-y divide-border">
                  {transactions.slice(0, 6).map((tx) => (
                    <li key={tx.id} className="flex items-center justify-between py-2.5 text-xs">
                      <span className="truncate text-muted-foreground">
                        {tx.reason || "حركة محفظة"}
                      </span>
                      <span
                        className={
                          tx.amount >= 0 ? "font-bold text-primary" : "font-bold text-red-500"
                        }
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {formatIQD(tx.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <UnbanAppealModal
          open={appealOpen}
          onClose={() => setAppealOpen(false)}
          userId={user?.id ?? ""}
        />
        <DepositModal
          open={deposit}
          onClose={() => setDeposit(false)}
          onDone={() => {
            setDeposit(false);
            refreshProfile();
          }}
        />
      </Page>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs text-muted-foreground">{label}</label>
      <div className="relative">
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-input bg-background pr-11 text-sm text-foreground outline-none transition focus:border-primary"
        />
      </div>
    </div>
  );
}
