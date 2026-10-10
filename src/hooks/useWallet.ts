import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

/**
 * مزامنة فورية للمحفظة والإيداعات:
 * - يستمع لتغيّرات جدولَي deposits و profiles للمستخدم الحالي.
 * - عند قبول الإيداع يعرض إشعار نجاح ويحدّث الرصيد تلقائياً دون تحديث الصفحة.
 */
export function useWalletRealtime(onDepositsChanged?: () => void) {
  const { user, refreshProfile } = useAuth();
  const cbRef = useRef(onDepositsChanged);
  cbRef.current = onDepositsChanged;
  const refreshRef = useRef(refreshProfile);
  refreshRef.current = refreshProfile;

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`wallet-sync-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => {
          void refreshRef.current();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deposit_requests",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { status?: string };
          if (row.status === "approved") {
            toast.success("تم قبول طلب الإيداع وإضافة الرصيد إلى محفظتك بنجاح 🚀");
          } else if (row.status === "rejected") {
            toast.error("تم رفض طلب الإيداع", {
              description: "راجع الإشعارات أو تواصل مع الدعم للتفاصيل.",
            });
          }
          void refreshRef.current();
          cbRef.current?.();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deposit_requests",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          cbRef.current?.();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);
}
