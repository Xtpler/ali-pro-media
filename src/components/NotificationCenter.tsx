import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Info,
  MessageSquare,
  Package,
  Wallet,
  Settings2,
} from "lucide-react";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import {
  NOTIFICATION_CATEGORIES,
  categoryOf,
  type NotificationCategory,
} from "@/lib/notifications";

type View = "home" | "orders" | "support" | "profile" | "admin" | "settings";

const CAT_ICON: Record<NotificationCategory, typeof Bell> = {
  deposits: Wallet,
  orders: Package,
  tickets: MessageSquare,
  system: Settings2,
};
const CAT_VIEW: Record<NotificationCategory, View> = {
  deposits: "profile",
  orders: "orders",
  tickets: "support",
  system: "home",
};

function ago(iso: string, now: number) {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "الآن";
  if (s < 3600) return `منذ ${Math.floor(s / 60)} د`;
  if (s < 86400) return `منذ ${Math.floor(s / 3600)} س`;
  return `منذ ${Math.floor(s / 86400)} يوم`;
}

export function NotificationCenter({
  onNavigate,
  isAdmin = false,
}: {
  onNavigate: (v: View) => void;
  isAdmin?: boolean;
}) {
  const { notifications, unread, unreadByCategory, reload, markAllRead } = useNotificationCenter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await reload();
      setFreshIds(new Set(notifications.filter((n) => !n.read).map((n) => n.id)));
    }
  };

  const visible = useMemo(
    () =>
      (category === "all"
        ? notifications
        : notifications.filter((n) => categoryOf(n) === category)
      ).slice(0, 40),
    [notifications, category],
  );
  const now = Date.now();

  return (
    <div className="relative" ref={box}>
      <button
        onClick={toggle}
        aria-label="الإشعارات"
        aria-expanded={open}
        className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-primary"
      >
        <Bell
          size={17}
          className={unread > 0 ? "animate-[bellRing_2.4s_ease-in-out_infinite]" : ""}
        />
        {unread > 0 && (
          <span className="absolute -top-1.5 -left-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground ring-2 ring-background">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-x-3 top-[84px] z-[60] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl sm:absolute sm:inset-x-auto sm:left-0 sm:top-14 sm:w-[24rem]"
          dir="rtl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-extrabold text-foreground">الإشعارات</p>
              <p className="text-[11px] text-muted-foreground">
                {unread ? `${unread} غير مقروء` : "لا يوجد جديد"}
              </p>
            </div>
            <button
              onClick={() => void markAllRead()}
              disabled={!unread}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-primary transition hover:bg-primary/10 disabled:opacity-40"
            >
              <CheckCheck size={14} /> تحديد الكل كمقروء
            </button>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
            {NOTIFICATION_CATEGORIES.map((c) => {
              const count = c.id === "all" ? unread : unreadByCategory[c.id];
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${category === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {c.label}
                  {count > 0 && (
                    <span
                      className={`rounded-full px-1.5 text-[9px] ${category === c.id ? "bg-primary-foreground/20" : "bg-primary/15 text-primary"}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
            {visible.length ? (
              visible.map((n) => {
                const cat = categoryOf(n);
                const Icon = CAT_ICON[cat];
                const KindIcon =
                  n.kind === "error" ? CircleAlert : n.kind === "success" ? CircleCheck : Info;
                const isNew = freshIds.has(n.id) || !n.read;
                const target: View = isAdmin && /جديد/.test(n.title) ? "admin" : CAT_VIEW[cat];
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      onNavigate(target);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-start transition hover:bg-accent ${isNew ? "bg-primary/[.06]" : ""}`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.kind === "error" ? "bg-red-500/15 text-red-500" : "bg-primary/10 text-primary"}`}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <KindIcon
                          size={12}
                          className={
                            n.kind === "error"
                              ? "text-red-500"
                              : n.kind === "success"
                                ? "text-primary"
                                : "text-muted-foreground"
                          }
                        />
                        <span className="truncate text-xs font-bold text-foreground">
                          {n.title}
                        </span>
                        {isNew && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </span>
                      {n.message && (
                        <span className="mt-1 line-clamp-2 block text-[11px] leading-5 text-muted-foreground">
                          {n.message}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] text-muted-foreground/80">
                        {ago(n.created_at, now)}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <BellOff className="mx-auto text-muted-foreground" size={30} />
                <p className="mt-3 text-xs text-muted-foreground">لا توجد إشعارات هنا</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
