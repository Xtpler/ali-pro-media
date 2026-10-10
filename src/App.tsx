import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/lib/theme";
import { SplashScreen } from "@/components/SplashScreen";
import { LoginTransition } from "@/components/LoginTransition";
import { AvatarSetup } from "@/components/AvatarSetup";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AIAssistant } from "@/components/AIAssistant";
import { AuthPage } from "@/pages/AuthPage";
import { HomePage } from "@/pages/HomePage";
import { OrdersPage } from "@/pages/OrdersPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SupportPage } from "@/pages/SupportPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AdminPage } from "@/pages/AdminPage";
import { NotificationProvider } from "@/hooks/useNotificationCenter";
import { hasAdminAccess } from "@/lib/constants";

type View = "home" | "orders" | "support" | "profile" | "admin" | "settings";
const VIEWS: View[] = ["home", "orders", "support", "profile", "admin", "settings"];
const VIEW_KEY = "apm-view";

function readView(): View {
  try {
    const stored = window.localStorage.getItem(VIEW_KEY) ?? sessionStorage.getItem(VIEW_KEY);
    if (stored && VIEWS.includes(stored as View)) return stored as View;
  } catch {
    /* private mode */
  }
  return "home";
}

function AppContent({ initialView }: { initialView?: View | undefined }) {
  const { user, profile, loading } = useAuth();
  const routerNavigate = useNavigate();
  const [splash, setSplash] = useState(true);
  const [welcome, setWelcome] = useState(false);
  const [view, setView] = useState<View>(() => initialView ?? readView());
  const [search, setSearch] = useState("");
  const hadNoUser = useRef(false);
  const done = useCallback(() => setSplash(false), []);
  const navigate = useCallback((next: View) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);
  const canAccessAdmin = hasAdminAccess(user, profile);

  useEffect(() => {
    if (loading || splash) return;
    if (!user) hadNoUser.current = true;
    else if (hadNoUser.current) {
      hadNoUser.current = false;
      setWelcome(true);
    }
  }, [user, loading, splash]);

  useEffect(() => {
    if (loading || splash || !user || view !== "admin" || canAccessAdmin) return;
    navigate("home");
    void routerNavigate({ to: "/", replace: true });
  }, [canAccessAdmin, loading, navigate, routerNavigate, splash, user, view]);

  if (splash || loading) return <SplashScreen onDone={done} ready={!loading} />;
  if (!user) return <AuthPage />;
  if (welcome) return <LoginTransition onDone={() => setWelcome(false)} />;
  if (profile && !profile.avatar_url) return <AvatarSetup />;

  return (
    <div className="app-shell theme-smooth min-h-screen bg-background text-foreground" dir="rtl">
      <Navbar view={view} onNavigate={navigate} onSearch={setSearch} />
      <main key={view} className="motion-rise">
        {view === "home" && <HomePage search={search} onNavigate={navigate} />}
        {view === "orders" && <OrdersPage />}
        {view === "support" && <SupportPage />}
        {view === "profile" && <ProfilePage />}
        {view === "settings" && <SettingsPage />}
        {view === "admin" && canAccessAdmin && <AdminPage />}
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
}

function App({ initialView }: { initialView?: View | undefined }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent initialView={initialView} />
        </NotificationProvider>
        <Toaster position="top-center" richColors dir="rtl" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
