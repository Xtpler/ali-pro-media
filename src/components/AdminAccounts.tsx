import { useEffect, useState } from "react";
import { Edit3, KeyRound, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { formatIQD } from "@/lib/format";
import {
  deleteMarketAccount,
  getMarketCredentials,
  listMarketAccounts,
  saveMarketAccount,
  type MarketAccount,
} from "@/lib/store";
import {
  PLATFORM_IDS,
  PLATFORM_LABEL,
  isAccountPlatform,
  type AccountPlatform,
} from "@/lib/accounts";

type Form = {
  id: string;
  title: string;
  platform: AccountPlatform;
  followers: string;
  price_iqd: string;
  description: string;
  image_url: string;
  credentials: string;
};

const EMPTY: Form = {
  id: "",
  title: "",
  platform: "instagram",
  followers: "",
  price_iqd: "",
  description: "",
  image_url: "",
  credentials: "",
};

export function AdminAccounts() {
  const [accounts, setAccounts] = useState<MarketAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showCreds, setShowCreds] = useState<{ title: string; value: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setAccounts(await listMarketAccounts());
    } catch {
      toast.error("تعذر تحميل حسابات السوق");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const price = Number(form.price_iqd.replace(/\D/g, ""));
    if (!form.title.trim()) {
      toast.error("يرجى إدخال عنوان الحساب");
      return;
    }
    if (!price) {
      toast.error("يرجى إدخال سعر صحيح");
      return;
    }
    setSaving(true);
    try {
      await saveMarketAccount({
        ...(form.id ? { id: form.id } : {}),
        platform: form.platform,
        title: form.title.trim(),
        description: form.description.trim(),
        followers: Number(form.followers.replace(/\D/g, "")) || 0,
        price_iqd: price,
        image_url: form.image_url.trim(),
        credentials: form.credentials,
      });
      toast.success(form.id ? "تم تحديث الحساب" : "تمت إضافة الحساب إلى السوق");
      setForm(EMPTY);
      await load();
    } catch {
      toast.error("تعذر حفظ الحساب");
    } finally {
      setSaving(false);
    }
  };

  const edit = async (a: MarketAccount) => {
    const credentials = await getMarketCredentials(a.id).catch(() => "");
    setForm({
      id: a.id,
      title: a.title,
      platform: isAccountPlatform(a.platform) ? a.platform : "instagram",
      followers: String(a.followers),
      price_iqd: String(a.price_iqd),
      description: a.description,
      image_url: a.image_url,
      credentials,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (a: MarketAccount) => {
    if (!window.confirm(`حذف الحساب "${a.title}" نهائياً؟`)) return;
    try {
      await deleteMarketAccount(a.id);
      if (form.id === a.id) setForm(EMPTY);
      toast.success("تم حذف الحساب");
      await load();
    } catch {
      toast.error("تعذر حذف الحساب");
    }
  };

  const viewCreds = async (a: MarketAccount) => {
    const credentials = await getMarketCredentials(a.id).catch(() => "");
    setShowCreds({ title: a.title, value: credentials || "لا توجد بيانات دخول محفوظة" });
  };

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-3 rounded-3xl border border-white/[.08] bg-white/[.035] p-5">
        <h2 className="font-bold text-white">
          {form.id ? "تعديل حساب معروض" : "إضافة حساب جديد للسوق"}
        </h2>

        <Field label="عنوان الحساب">
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="القسم / المنصة">
            <select
              value={form.platform}
              onChange={(e) => set("platform", e.target.value as AccountPlatform)}
              className={inputCls}
            >
              {PLATFORM_IDS.map((id) => (
                <option key={id} value={id} className="bg-slate-900">
                  {PLATFORM_LABEL[id]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="السعر (دينار)">
            <input
              dir="ltr"
              value={form.price_iqd}
              onChange={(e) => set("price_iqd", e.target.value.replace(/\D/g, ""))}
              className={inputCls}
            />
          </Field>
          <Field label="عدد المتابعين">
            <input
              dir="ltr"
              value={form.followers}
              onChange={(e) => set("followers", e.target.value.replace(/\D/g, ""))}
              className={inputCls}
            />
          </Field>
          <Field label="رابط الصورة">
            <input
              dir="ltr"
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="الوصف">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-emerald-400/40"
          />
        </Field>

        <Field label="بيانات الدخول (تظهر للأدمن وللمشتري بعد الشراء)">
          <textarea
            rows={3}
            dir="ltr"
            placeholder="email / password / 2FA"
            value={form.credentials}
            onChange={(e) => set("credentials", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-emerald-400/40"
          />
        </Field>

        <div className="flex gap-2 pt-1">
          <button
            onClick={submit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
          >
            <Plus size={15} />{" "}
            {saving ? "جارٍ الحفظ..." : form.id ? "حفظ التعديلات" : "إضافة الحساب"}
          </button>
          {form.id && (
            <button
              onClick={() => setForm(EMPTY)}
              className="rounded-xl bg-white/10 px-4 py-3 text-xs font-bold text-white"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-500">
            جارٍ التحميل...
          </div>
        ) : accounts.length ? (
          accounts.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-white/[.035] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-white">{a.title}</p>
                <p className="mt-1 truncate text-[11px] text-slate-500">
                  {isAccountPlatform(a.platform) ? PLATFORM_LABEL[a.platform] : a.platform} ·{" "}
                  {a.followers.toLocaleString("en-US")} متابع
                </p>
                <p className="mt-1 text-xs font-bold text-emerald-300">{formatIQD(a.price_iqd)}</p>
                {a.sold && a.sold_to && (
                  <p className="mt-1 text-[10px] text-red-300">تم البيع للمستخدم: {a.sold_to}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                  {a.sold ? "مباع" : "متاح"}
                </span>
                <button
                  onClick={() => viewCreds(a)}
                  title="بيانات الدخول"
                  className="rounded-lg bg-sky-400/15 p-2 text-sky-300 hover:bg-sky-400/25"
                >
                  <KeyRound size={15} />
                </button>
                <button
                  onClick={() => edit(a)}
                  title="تعديل"
                  className="rounded-lg bg-white/10 p-2 text-slate-200 hover:bg-white/20"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => remove(a)}
                  title="حذف"
                  className="rounded-lg bg-red-400/15 p-2 text-red-300 hover:bg-red-400/25"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-500">
            لا توجد حسابات في السوق بعد
          </div>
        )}
      </div>

      {showCreds && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-white">بيانات الدخول</h2>
              <button
                onClick={() => setShowCreds(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">{showCreds.title}</p>
            <pre
              dir="ltr"
              className="mt-4 whitespace-pre-wrap break-all rounded-xl bg-white/[.04] p-3 text-xs leading-6 text-emerald-200"
            >
              {showCreds.value}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm text-white outline-none focus:border-emerald-400/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs text-slate-400">{label}</label>
      {children}
    </div>
  );
}
