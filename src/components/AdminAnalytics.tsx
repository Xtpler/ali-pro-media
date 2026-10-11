import { Coins, Package, ShoppingBag, Wallet } from "lucide-react";
import { formatIQD } from "@/lib/format";
import type { Deposit, Order, Profile } from "@/types";

const DAY_MS = 86_400_000;
const DAYS = 14;

type DayBucket = { label: string; fullLabel: string; total: number };

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** إيرادات آخر 14 يوماً من الطلبات غير الملغاة */
function dailyRevenue(orders: Order[]): DayBucket[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setTime(start.getTime() - (DAYS - 1) * DAY_MS);

  const byDay = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "rejected") continue;
    const created = new Date(o.created_at);
    if (created.getTime() < start.getTime()) continue;
    const k = dayKey(created);
    byDay.set(k, (byDay.get(k) ?? 0) + Number(o.price_iqd || 0));
  }

  const dayFmt = new Intl.DateTimeFormat("ar-IQ", { day: "numeric" });
  const fullFmt = new Intl.DateTimeFormat("ar-IQ", { day: "numeric", month: "short" });
  return Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(start.getTime() + i * DAY_MS);
    return {
      label: dayFmt.format(d),
      fullLabel: fullFmt.format(d),
      total: byDay.get(dayKey(d)) ?? 0,
    };
  });
}

export function AdminAnalytics({
  orders,
  profiles,
  deposits,
}: {
  orders: Order[];
  profiles: Profile[];
  deposits: Deposit[];
}) {
  const totalRevenue = orders
    .filter((o) => o.status === "approved" || o.status === "processing" || o.status === "completed")
    .reduce((sum, o) => sum + Number(o.price_iqd || 0), 0);
  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "approved" || o.status === "processing",
  ).length;
  const totalWallets = profiles.reduce((sum, p) => sum + Number(p.wallet_balance_iqd || 0), 0);

  const pendingList = deposits.filter((d) => d.status === "pending");
  const pendingDepositsTotal = pendingList.reduce((sum, d) => sum + Number(d.amount_iqd || 0), 0);

  const days = dailyRevenue(orders);
  const peak = Math.max(1, ...days.map((d) => d.total));
  const windowTotal = days.reduce((sum, d) => sum + d.total, 0);

  const stats = [
    { icon: <Wallet size={17} />, value: formatIQD(totalRevenue), label: "إجمالي الإيرادات" },
    { icon: <ShoppingBag size={17} />, value: activeOrders, label: "الطلبات النشطة" },
    { icon: <Coins size={17} />, value: formatIQD(totalWallets), label: "إجمالي أرصدة المحافظ" },
    {
      icon: <Package size={17} />,
      value: `${pendingList.length} · ${formatIQD(pendingDepositsTotal)}`,
      label: "الإيداعات المعلقة",
    },
  ];

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="hover-lift flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.03] px-4 py-3"
          >
            <div className="rounded-xl bg-emerald-400/15 p-2.5 text-emerald-400">{s.icon}</div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/[.08] bg-white/[.035] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-white">مخطط إيرادات آخر {DAYS} يوماً</h2>
          <span className="text-[11px] text-slate-500">الإجمالي: {formatIQD(windowTotal)}</span>
        </div>
        <div className="mt-5 flex h-44 items-end gap-1.5">
          {days.map((d, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center gap-1.5">
              <div
                className="group flex w-full flex-1 items-end"
                title={`${d.fullLabel} · ${formatIQD(d.total)}`}
              >
                <div
                  className="w-full rounded-t bg-gradient-to-t from-emerald-500/25 to-emerald-400 transition-all duration-500"
                  style={{ height: `${Math.max(3, (d.total / peak) * 100)}%` }}
                />
              </div>
              <span className="whitespace-nowrap text-[9px] text-slate-500">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
