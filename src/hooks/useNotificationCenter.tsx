/**
 * مركز الإشعارات: يتابع الإشعارات لحظياً (Realtime + تحديث دوري احتياطي)
 * ويعرض توست فوري وإشعار متصفح لكل إشعار جديد.
 */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { listNotifications, markNotificationsRead } from "@/lib/store";
import { categoryOf, type NotificationCategory } from "@/lib/notifications";
import type { AppNotification } from "@/types";

type Ctx = {
  notifications: AppNotification[];
  unread: number;
  unreadByCategory: Record<NotificationCategory, number>;
  reload: () => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<Ctx>({
  notifications: [],
  unread: 0,
  unreadByCategory: { deposits: 0, orders: 0, tickets: 0, system: 0 },
  reload: async () => {},
  markAllRead: async () => {},
});

export function useNotificationCenter() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  const announce = useCallback(
    (items: AppNotification[]) => {
      for (const n of items) {
        if (seen.current.has(n.id)) continue;
        seen.current.add(n.id);
        if (!primed.current) continue;
        const cat = categoryOf(n);
        const body = n.message || "";
        if (n.kind === "error") toast.error(n.title, { description: body });
        else if (n.kind === "success") toast.success(n.title, { description: body });
        else toast(n.title, { description: body });
        if (String(cat) === "deposits") refreshProfile();
      }
      primed.current = true;
    },
    [refreshProfile],
  );

  const reload = useCallback(async () => {
    if (!user) return;
    try {
      const next = await listNotifications(user.id, isAdmin);
      setNotifications(next);
      announce(next);
    } catch {
      /* تجاهل */
    }
  }, [user, isAdmin, announce]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      seen.current = new Set();
      primed.current = false;
      return;
    }
    void reload();
    const timer = window.setInterval(reload, 10000);
    const onManual = () => {
      void reload();
    };
    window.addEventListener("apm-notifications", onManual);

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        void reload();
      })
      .subscribe();

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("apm-notifications", onManual);
      void supabase.removeChannel(channel);
    };
  }, [user, reload]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await markNotificationsRead(user.id, isAdmin).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user, isAdmin]);

  const value = useMemo<Ctx>(() => {
    const unreadByCategory: Record<NotificationCategory, number> = {
      deposits: 0,
      orders: 0,
      tickets: 0,
      system: 0,
    };
    let unread = 0;
    for (const n of notifications) {
      if (n.read) continue;
      unread += 1;
      unreadByCategory[categoryOf(n)] += 1;
    }
    return { notifications, unread, unreadByCategory, reload, markAllRead };
  }, [notifications, reload, markAllRead]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
