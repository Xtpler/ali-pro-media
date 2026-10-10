import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, Search, Wallet, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { formatIQD } from "@/lib/format";
import { NotificationCenter } from "@/components/NotificationCenter";
import { hasAdminAccess } from "@/lib/constants";

type View = "home" | "orders" | "support" | "profile" | "admin" | "settings";

export function Navbar({
  view,
  onNavigate,
  onSearch,
}: {
  view: View;
  onNavigate: (view: View) => void;
  onSearch: (value: string) => void;
}) {
  const { user, profile, refreshProfile } = useAuth();
  const [sidebar, setSidebar] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const showAdmin = hasAdminAccess(user, profile);
  const nav = (next: View) => {
    onNavigate(next);
  };

  useEffect(() => {
    const wallet = () => {
      refreshProfile();
    };
    window.addEventListener("apm-wallet", wallet);
    return () => window.removeEventListener("apm-wallet", wallet);
  }, [refreshProfile]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-2xl transition-colors duration-300">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:gap-5 sm:px-5 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebar(true)}
            aria-label="القائمة"
            className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-primary"
          >
            <Menu size={18} className="transition-transform duration-300 hover:rotate-6" />
          </button>
          <button onClick={() => nav("home")}>
            <Logo compact={false} />
          </button>
        </div>

        <div className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          <NavButton active={view === "home"} onClick={() => nav("home")}>
            الرئيسية
          </NavButton>
          <NavButton active={view === "orders"} onClick={() => nav("orders")}>
            طلباتي
          </NavButton>
          <NavButton active={view === "support"} onClick={() => nav("support")}>
            الدعم الفني
          </NavButton>
          {showAdmin && (
            <button
              onClick={() => nav("admin")}
              className="flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-bold text-primary shadow-[0_0_18px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition hover:bg-primary/10"
            >
              <LayoutDashboard size={16} /> لوحة الأدمن
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 sm:flex">
            <Wallet size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">
              {formatIQD(profile?.wallet_balance_iqd ?? 0)}
            </span>
          </div>
          <div className="hidden sm:block">
            <ThemeToggle variant="icon" />
          </div>
          <button
            onClick={() => setMobileSearch(!mobileSearch)}
            aria-label="بحث"
            className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-primary lg:hidden"
          >
            {mobileSearch ? <X size={17} /> : <Search size={17} />}
          </button>
          <NotificationCenter onNavigate={nav} isAdmin={showAdmin} />
        </div>
      </div>

      <div className="mx-auto hidden max-w-[1440px] px-5 pb-4 lg:block lg:px-10">
        <div className="relative">
          <Search
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            onChange={(e) => onSearch(e.target.value)}
            placeholder="ابحث عن خدمة، حساب أو بطاقة..."
            className="h-11 w-full rounded-xl border border-border bg-card pr-11 pl-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:bg-accent"
          />
        </div>
      </div>

      {mobileSearch && (
        <div className="border-t border-white/10 px-5 py-4 lg:hidden">
          <div className="relative">
            <Search
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              onChange={(e) => onSearch(e.target.value)}
              placeholder="ابحث..."
              className="h-11 w-full rounded-xl border border-border bg-card pr-11 text-sm text-foreground outline-none transition focus:border-primary/50"
            />
          </div>
        </div>
      )}

      <Sidebar open={sidebar} onClose={() => setSidebar(false)} onNavigate={onNavigate} />
    </header>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-emerald-400/10 text-emerald-300" : "text-slate-400 hover:text-white"}`}
    >
      {children}
    </button>
  );
}
