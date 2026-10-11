import { useEffect, useRef, useState } from "react";
import {
  Check,
  ClipboardCopy,
  Clock,
  Eye,
  EyeOff,
  Link2,
  Package,
  PartyPopper,
  ReceiptText,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatIQD } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { listDeposits, listOrders } from "@/lib/store";
import { useWalletRealtime } from "@/hooks/useWallet";
import {
  ORDER_STEPS,
  currentStep,
  formatDuration,
  isFailed,
  progressPercent,
  remainingMinutes,
} from "@/lib/orderProgress";
import type { Deposit, Order, OrderStatus } from "@/types";
import { Attachment } from "@/components/Attachment";
import { OrderReceiptModal } from "@/components/OrderReceiptModal";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  pending: {
    text: "قيد المراجعة",
    className: "order-status-pending",
  },
  approved: { text: "تمت الموافقة", className: "order-status-approved" },
  completed: { text: "مكتمل", className: "order-status-completed" },
  processing: { text: "قيد التنفيذ", className: "order-status-processing" },
  cancelled: { text: "ملغى", className: "order-status-cancelled" },
  rejected: { text: "مرفوض", className: "order-status-rejected" },
};

export function StatusPill({ status }: { status: OrderStatus | string }) {
  const item = STATUS_LABEL[status] ?? STATUS_LABEL["pending"]!;
  return <span className={`status-badge ${item.className}`}>{item.text}</span>;
}

function useNow(ms = 20000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

function OrderTracker({ order, now }: { order: Order; now: number }) {
  const [reveal, setReveal] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const failed = isFailed(order.status);
  const done = order.status === "completed";
  const pct = progressPercent(order, now);
  const step = currentStep(order.status);
  const left = remainingMinutes(order, now);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground">{order.product_name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(order.created_at)} · الكمية: {order.quantity}
            </p>
            {order.target_link && (
              <p
                className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground"
                dir="ltr"
              >
                <Link2 size={12} /> {order.target_link}
              </p>
            )}
          </div>
        </div>
        <div className="text-start sm:text-end">
          <p className="text-sm font-bold text-primary">{formatIQD(order.price_iqd)}</p>
          <div className="mt-1">
            <StatusPill status={order.status} />
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-muted/40 px-5 py-4">
        {failed ? (
          <p className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-300">
            <XCircle size={16} /> {order.status === "cancelled" ? "تم إلغاء الطلب" : "تم رفض الطلب"}
            {order.admin_note ? (
              <span className="font-normal text-muted-foreground"> — {order.admin_note}</span>
            ) : null}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {done ? (
                  <PartyPopper size={14} className="text-primary" />
                ) : (
                  <Clock size={14} className="text-primary" />
                )}
                {done
                  ? "اكتمل طلبك وتم التسليم"
                  : order.status === "processing"
                    ? `المدة المتبقية التقريبية: ${formatDuration(left)}`
                    : `المدة المتوقعة للتنفيذ: ${formatDuration(left)}`}
              </span>
              <span className="text-primary">{pct}%</span>
            </div>
            <div
              className="mt-2 h-2.5 overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full bg-primary transition-all duration-1000 ${done ? "" : "order-bar-live"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <ol className="mt-4 grid grid-cols-4 gap-1">
              {ORDER_STEPS.map((s, i) => {
                const reached = i <= step && (i < 3 || done);
                const active = i === step && !done;
                return (
                  <li key={s.id} className="flex flex-col items-center gap-1.5 text-center">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${reached ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"} ${active ? "ring-4 ring-primary/20" : ""}`}
                    >
                      {reached && !active ? <Check size={14} /> : i + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${reached || active ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        {done && (order.code || order.credentials) && (
          <div className="mt-4 space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            {order.code && (
              <div className="flex items-center justify-between gap-2">
                <code className="truncate text-xs text-foreground" dir="ltr">
                  {order.code}
                </code>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(order.code);
                    toast.success("تم نسخ الكود");
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-foreground hover:border-primary"
                >
                  <ClipboardCopy size={13} /> نسخ
                </button>
              </div>
            )}
            {order.credentials && (
              <div className="flex items-center justify-between gap-2">
                <code className="truncate text-xs text-foreground" dir="ltr">
                  {reveal ? order.credentials : "••••••••••••"}
                </code>
                <button
                  onClick={() => setReveal((v) => !v)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-foreground hover:border-primary"
                >
                  {reveal ? <EyeOff size={13} /> : <Eye size={13} />}{" "}
                  {reveal ? "إخفاء" : "إظهار بيانات الحساب"}
                </button>
              </div>
            )}
          </div>
        )}

        {done && (
          <button
            onClick={() => setReceiptOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/10"
          >
            <ReceiptText size={15} /> طباعة / تحميل الإيصال
          </button>
        )}
      </div>

      {receiptOpen && <OrderReceiptModal order={order} onClose={() => setReceiptOpen(false)} />}
    </article>
  );
}

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [tab, setTab] = useState<"orders" | "deposits">("orders");
  const known = useRef<Record<string, string>>({});
  const now = useNow();

  const reload = () => {
    if (!user) return;
    listOrders(user.id)
      .then((rows) => {
        for (const o of rows) {
          const before = known.current[o.id];
          if (before && before !== o.status) {
            if (o.status === "completed")
              toast.success("اكتمل طلبك 🎉", { description: o.product_name });
            else if (o.status === "processing")
              toast("بدأ تنفيذ طلبك", { description: o.product_name });
          }
          known.current[o.id] = o.status;
        }
        setOrders(rows);
      })
      .catch(() => undefined);
    listDeposits(user.id)
      .then(setDeposits)
      .catch(() => undefined);
  };

  useEffect(reload, [user]);
  useWalletRealtime(reload);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`orders-live-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        reload,
      )
      .subscribe();
    const poll = window.setInterval(reload, 20000);
    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const tabBtn = (id: "orders" | "deposits", label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${tab === id ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="pt-20 sm:pt-24">
      <Page
        title="طلباتي"
        subtitle="تابع تقدم طلباتك لحظة بلحظة، وسيصلك التسليم تلقائياً عند الاكتمال"
      >
        <div className="mb-6 inline-flex gap-1 rounded-2xl border border-border bg-card p-1">
          {tabBtn("orders", "الطلبات")}
          {tabBtn("deposits", "عمليات الإيداع")}
        </div>

        {tab === "orders" ? (
          <div className="motion-stagger space-y-4">
            {orders.length ? (
              orders.map((order) => <OrderTracker key={order.id} order={order} now={now} />)
            ) : (
              <Empty text="لا توجد طلبات حتى الآن" hint="ابدأ بطلب أول خدمة من المتجر" />
            )}
          </div>
        ) : (
          <div className="motion-stagger space-y-3">
            {deposits.length ? (
              deposits.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Wallet size={22} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground">{d.gateway_label || "إيداع"}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(d.created_at)}
                      </p>
                      {d.sender_note && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          ملاحظتك: {d.sender_note}
                        </p>
                      )}
                      {d.admin_note && (
                        <p className="mt-1 line-clamp-2 text-xs text-foreground">
                          رد الإدارة: {d.admin_note}
                        </p>
                      )}
                      {d.receipt_url && <Attachment stored={d.receipt_url} label="وصل التحويل" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p className="text-sm font-bold text-primary">{formatIQD(d.amount_iqd)}</p>
                      <div className="mt-1">
                        <StatusPill status={d.status} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty text="لا توجد عمليات إيداع" hint="أضف رصيداً من صفحة حسابي" />
            )}
          </div>
        )}
      </Page>
    </div>
  );
}

function Empty({ text, hint }: { text: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-20 text-center">
      <ReceiptText className="mx-auto text-muted-foreground" size={38} />
      <p className="mt-4 text-sm text-foreground">{text}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-[calc(100vh-150px)] max-w-[1440px] px-4 py-8 sm:px-5 sm:py-12 lg:px-10">
      <div className="mb-8">
        <p className="text-xs font-bold text-primary">حسابك</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </main>
  );
}
export { Page };
