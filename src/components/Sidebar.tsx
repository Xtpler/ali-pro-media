import { useState } from "react";
import {
  Gift,
  Headphones,
  LayoutDashboard,
  LogOut,
  Plus,
  ReceiptText,
  Settings,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DepositModal } from "@/components/DepositModal";
import { InviteModal } from "@/components/InviteModal";
import { useAuth } from "@/context/AuthContext";
import { formatIQD } from "@/lib/format";
import { hasAdminAccess } from "@/lib/constants";

export type View = "home" | "orders" | "support" | "profile" | "admin" | "settings";

export function Sidebar({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
}) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [deposit, setDeposit] = useState(false);
  const [invite, setInvite] = useState(false);
  const showAdmin = hasAdminAccess(user, profile);

  const go = (view: View) => {
    onNavigate(view);
    onClose();
  };

  const openDeposit = () => {
    onClose();
    setTimeout(() => setDeposit(true), 180);
  };

  const openInvite = () => {
    onClose();
    setTimeout(() => setInvite(true), 180);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[150] h-screen w-screen overflow-hidden" dir="rtl">
          <button
            aria-label="إغلاق القائمة"
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-slate-950/80 backdrop-blur-md"
          />
          <aside className="absolute inset-y-0 right-0 z-[160] flex h-screen w-[300px] max-w-[85vw] flex-col overflow-y-auto border-l border-white/10 bg-slate-950 p-5 shadow-[0_0_60px_rgba(0,0,0,.7)]">
            <div className="flex items-center justify-between">
              <Logo compact={false} />
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.07] p-4">
              <p className="text-[11px] text-slate-400">رصيد المحفظة</p>
              <p className="mt-1 text-xl font-bold text-emerald-300">
                {formatIQD(profile?.wallet_balance_iqd ?? 0)}
              </p>
              <button
                onClick={openDeposit}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-300"
              >
                <Plus size={15} /> إيداع رصيد
              </button>
            </div>

            <button
              onClick={openInvite}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-emerald-400/20 bg-white/[.03] px-4 py-3.5 text-right text-sm font-bold text-emerald-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400/10"
            >
              <Gift size={18} className="transition-transform duration-300 hover:rotate-6" /> ادعُ
              صديقك واحصل على مكافأة
            </button>

            <div className="mt-4">
              <ThemeToggle variant="switch" />
            </div>

            <nav className="mt-5 space-y-1.5">
              <Item icon={<ReceiptText size={17} />} onClick={() => go("orders")}>
                سجل المعاملات
              </Item>
              <Item icon={<Settings size={17} />} onClick={() => go("settings")}>
                الإعدادات
              </Item>
              <div className="my-3 border-t border-white/10" />
              <Item icon={<ShoppingBag size={17} />} onClick={() => go("home")}>
                الرئيسية
              </Item>
              <Item icon={<UserRound size={17} />} onClick={() => go("profile")}>
                حسابي
              </Item>
              <Item icon={<Headphones size={17} />} onClick={() => go("support")}>
                الدعم الفني
              </Item>
            </nav>

            {showAdmin && (
              <button
                onClick={() => go("admin")}
                className="mt-4 flex w-full items-center gap-3 rounded-xl border border-primary px-3 py-3 text-sm font-bold text-primary shadow-[0_0_18px_color-mix(in_srgb,var(--primary)_35%,transparent)] transition hover:bg-primary/10"
              >
                <LayoutDashboard size={17} /> لوحة الأدمن
              </button>
            )}
            <button
              onClick={() => signOut()}
              className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-red-300 hover:bg-red-400/10"
            >
              <LogOut size={17} /> تسجيل الخروج
            </button>
          </aside>
        </div>
      )}

      <DepositModal
        open={deposit}
        onClose={() => setDeposit(false)}
        onDone={() => {
          setDeposit(false);
          refreshProfile();
          toast.success("تم إرسال طلب الإيداع", {
            description: "سيتم إضافة الرصيد بعد موافقة الإدارة على الوصل.",
          });
        }}
      />

      <InviteModal open={invite} onClose={() => setInvite(false)} />
    </>
  );
}

function Item({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      <span className="text-emerald-400">{icon}</span>
      {children}
    </button>
  );
}
