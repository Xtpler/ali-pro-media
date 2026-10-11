/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/data";
import { initPush } from "@/lib/push";
import {
  requestPasswordOtp,
  verifyPasswordOtp,
  confirmPasswordReset,
} from "@/lib/passwordReset.functions";
import { isMasterAdminEmail } from "@/lib/constants";
import { consumePendingReferral } from "@/lib/store";
import type { Profile } from "@/types";

type ResetResult = { error?: string };
type UpdatePasswordResult = { error?: string; fallback?: boolean };

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authMode: "login" | "register";
  otpPending: boolean;
  otpPurpose: "register" | "reset" | null;
  setAuthMode: (mode: "login" | "register") => void;
  signIn: (identifier: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => Promise<{ error?: string; needsOtp?: boolean }>;
  sendOtp: (identifier: string, purpose: "register" | "reset") => Promise<{ error?: string }>;
  verifyOtp: (code: string) => Promise<{ error?: string }>;
  sendResetOtp: (email: string) => Promise<ResetResult>;
  verifyResetOtp: (email: string, code: string) => Promise<{ error?: string }>;
  updatePassword: (email: string, password: string) => Promise<UpdatePasswordResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function authError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (m.includes("email not confirmed"))
    return "لم يتم تأكيد بريدك بعد. أدخل رمز التحقق المرسل إليك.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "هذا البريد مسجّل مسبقاً. سجّل الدخول بدلاً من ذلك.";
  if (m.includes("password") && m.includes("6")) return "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "محاولات كثيرة بوقت قصير. انتظر دقيقة ثم أعد المحاولة.";
  if (m.includes("expired") || m.includes("invalid token") || m.includes("otp"))
    return "رمز التحقق غير صحيح أو منتهي الصلاحية.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "تعذّر الاتصال بالخادم. تحقّق من الإنترنت.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [otpPending, setOtpPending] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<"register" | "reset" | null>(null);
  const pendingEmail = useRef("");
  const pushStarted = useRef(false);
  const resetCode = useRef("");
  const resetFlowActive = useRef(false);
  const resetViaSupabase = useRef(false);
  const pendingResetSession = useRef<Session | null>(null);

  const loadProfile = useCallback(async (nextUser: User) => {
    const [profileData, roleResult, superRoleResult] = await Promise.all([
      getProfile(nextUser.id).catch(() => null),
      supabase.rpc("has_role", { _user_id: nextUser.id, _role: "admin" }),
      Promise.resolve(
        supabase.rpc("has_role", { _user_id: nextUser.id, _role: "super_admin" as never }),
      ).catch(() => ({ data: false })),
    ]);
    if (!profileData) {
      setProfile(null);
      return;
    }
    const master = isMasterAdminEmail(nextUser.email ?? profileData.email);
    if (master && roleResult.data !== true) {
      try {
        await supabase.rpc("ensure_master_admin");
      } catch {
        /* best effort */
      }
      try {
        await supabase.from("user_roles").insert({ user_id: nextUser.id, role: "admin" });
      } catch {
        /* best effort */
      }
    }
    const isAdmin = master || roleResult.data === true;
    const isSuperAdmin = master || superRoleResult.data === true;
    setProfile({
      ...profileData,
      role: isSuperAdmin ? "super_admin" : isAdmin ? "admin" : "user",
      is_admin: isAdmin,
      is_super_admin: isSuperAdmin,
    });
    if (!pushStarted.current) {
      pushStarted.current = true;
      void initPush(nextUser.id);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) await loadProfile(data.user);
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;
    let settled = false;

    const applySession = async (session: Session | null) => {
      if (!mounted) return;
      if (resetFlowActive.current) {
        pendingResetSession.current = session;
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        setOtpPending(false);
        setOtpPurpose(null);
        await loadProfile(session.user);
        // إحالة معلّقة وصلت عبر /ref/<id> قبل تسجيل الدخول — تُطبَّق الآن
        consumePendingReferral();
      } else {
        setProfile(null);
        pushStarted.current = false;
      }
    };

    const finishLoading = () => {
      if (!mounted || settled) return;
      settled = true;
      setLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session: Session | null) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        resetFlowActive.current = true;
        pendingResetSession.current = session;
        finishLoading();
        return;
      }
      if (resetFlowActive.current && event !== "SIGNED_OUT") {
        pendingResetSession.current = session;
        return;
      }
      void applySession(session).finally(() => {
        if (event === "INITIAL_SESSION") finishLoading();
      });
    });

    void hydrateSession().catch(() => undefined);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        if (!resetFlowActive.current) {
          setUser(data.session?.user ?? null);
          if (data.session?.user) await loadProfile(data.session.user);
        }
      })
      .catch(() => undefined)
      .finally(finishLoading);

    const onFocus = () => {
      void supabase.auth.getSession().then(({ data }) => {
        if (!mounted || resetFlowActive.current) return;
        if (data.session?.user) setUser(data.session.user);
      });
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [loadProfile]);

  const signIn = async (identifier: string, password: string) => {
    const email = identifier.trim().toLowerCase();
    if (!email.includes("@")) return { error: "يرجى تسجيل الدخول بالبريد الإلكتروني." };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        pendingEmail.current = email;
        setOtpPurpose("register");
        setOtpPending(true);
        await supabase.auth.resend({ type: "signup", email }).catch(() => undefined);
        return { error: "حسابك يحتاج تأكيد. أدخل رمز التحقق المرسل إلى بريدك." };
      }
      return { error: authError(error.message) };
    }
    if (data.session) {
      await persistSession(data.session);
      return {};
    }
    await supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) return persistSession(sessionData.session);
      return undefined;
    });
    return {};
  };

  const persistSession = async (session: Session) => {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    setUser(session.user);
    setOtpPending(false);
    setOtpPurpose(null);
    await loadProfile(session.user);
  };

  const hydrateSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await persistSession(data.session);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) return { error: "يرجى إدخال بريد إلكتروني صحيح." };
    if (password.length < 6) return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." };
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), phone: phone.trim() },
      },
    });
    if (error) return { error: authError(error.message) };
    pendingEmail.current = cleanEmail;

    if (data.session) {
      await persistSession(data.session);
      return {};
    }

    const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (signedIn.session) {
      await persistSession(signedIn.session);
      return {};
    }

    const unconfirmed = signInError?.message.toLowerCase().includes("email not confirmed");
    setOtpPurpose("register");
    setOtpPending(true);
    if (unconfirmed || !data.session) {
      await supabase.auth.resend({ type: "signup", email: cleanEmail }).catch(() => undefined);
    }
    return { needsOtp: true };
  };

  const sendOtp = async (identifier: string, purpose: "register" | "reset") => {
    const email = (identifier || pendingEmail.current).trim().toLowerCase();
    if (!email.includes("@")) return { error: "يرجى إدخال بريد إلكتروني صحيح." };
    pendingEmail.current = email;
    setOtpPurpose(purpose);
    setOtpPending(true);
    const { error } =
      purpose === "register"
        ? await supabase.auth.resend({ type: "signup", email })
        : await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) return { error: authError(error.message) };
    return {};
  };

  const verifyOtp = async (code: string) => {
    const token = code.replace(/\D/g, "");
    if (token.length !== 6) return { error: "رمز التحقق يجب أن يكون 6 أرقام." };
    const { data, error } = await supabase.auth.verifyOtp({
      email: pendingEmail.current,
      token,
      type: otpPurpose === "reset" ? "email" : "signup",
    });
    if (error) return { error: authError(error.message) };
    if (data.session) await persistSession(data.session);
    setOtpPending(false);
    setOtpPurpose(null);
    return {};
  };

  const sendResetOtp = async (email: string): Promise<ResetResult> => {
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) return { error: "يرجى إدخال بريد إلكتروني صحيح." };
    pendingEmail.current = clean;
    resetCode.current = "";
    resetViaSupabase.current = false;
    pendingResetSession.current = null;
    try {
      const result = await requestPasswordOtp({ data: { email: clean } });
      if (result.ok) return {};
      if (result.reason === "invalid-email") return { error: "يرجى إدخال بريد إلكتروني صحيح." };
      resetFlowActive.current = true;
      resetViaSupabase.current = true;
      let { error } = await supabase.auth.resetPasswordForEmail(clean);
      if (error) {
        ({ error } = await supabase.auth.signInWithOtp({
          email: clean,
          options: { shouldCreateUser: false },
        }));
      }
      if (error) {
        resetFlowActive.current = false;
        resetViaSupabase.current = false;
        if (result.reason === "not-configured") {
          return { error: "تعذّر إرسال رمز التحقق. تحقّق من إعدادات البريد." };
        }
        return { error: authError(error.message) };
      }
      return {};
    } catch {
      return { error: "تعذّر الاتصال بالخادم. تحقّق من الإنترنت." };
    }
  };

  const verifyResetOtp = async (email: string, code: string) => {
    const clean = email.trim().toLowerCase();
    const token = code.replace(/\D/g, "");
    if (token.length !== 6) return { error: "رمز التحقق يجب أن يكون 6 أرقام." };
    try {
      if (resetViaSupabase.current) {
        resetFlowActive.current = true;
        let { data, error } = await supabase.auth.verifyOtp({
          email: clean,
          token,
          type: "recovery",
        });
        if (error) {
          ({ data, error } = await supabase.auth.verifyOtp({ email: clean, token, type: "email" }));
        }
        if (error) return { error: authError(error.message) };
        pendingResetSession.current = data.session;
        resetCode.current = token;
        return {};
      }
      const result = await verifyPasswordOtp({ data: { email: clean, code: token } });
      if (!result.ok) {
        if (result.reason === "expired" || result.reason === "not-found")
          return { error: "انتهت صلاحية الرمز. أعد طلب رمز جديد." };
        if (result.reason === "too-many") return { error: "محاولات كثيرة. أعد طلب رمز جديد." };
        return { error: "رمز التحقق غير صحيح." };
      }
      resetCode.current = token;
      return {};
    } catch {
      return { error: "تعذّر الاتصال بالخادم. تحقّق من الإنترنت." };
    }
  };

  const updatePassword = async (email: string, password: string): Promise<UpdatePasswordResult> => {
    if (password.length < 6) return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." };
    const clean = email.trim().toLowerCase();
    if (!resetCode.current) return { error: "يرجى التحقق من الرمز أولاً." };
    try {
      if (resetViaSupabase.current && pendingResetSession.current) {
        await supabase.auth.setSession({
          access_token: pendingResetSession.current.access_token,
          refresh_token: pendingResetSession.current.refresh_token,
        });
        const { error } = await supabase.auth.updateUser({ password });
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        resetFlowActive.current = false;
        resetViaSupabase.current = false;
        pendingResetSession.current = null;
        resetCode.current = "";
        setUser(null);
        setProfile(null);
        if (error) return { error: authError(error.message) };
        return {};
      }
      const result = await confirmPasswordReset({
        data: { email: clean, code: resetCode.current, password },
      });
      if (!result.ok) {
        if (result.reason === "expired" || result.reason === "mismatch")
          return { error: "انتهت صلاحية الرمز. أعد العملية من البداية." };
        if (result.reason === "weak") return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." };
        if (result.reason === "no-user") return { error: "لا يوجد حساب مسجّل بهذا البريد." };
        return { error: "تعذّر تحديث كلمة المرور. حاول مرة أخرى." };
      }
      resetCode.current = "";
      resetFlowActive.current = false;
      return { fallback: result.mode === "fallback" };
    } catch {
      return { error: "تعذّر الاتصال بالخادم. تحقّق من الإنترنت." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut().catch(() => undefined);
    setUser(null);
    setProfile(null);
    pushStarted.current = false;
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      authMode,
      otpPending,
      otpPurpose,
      setAuthMode,
      signIn,
      signUp,
      sendOtp,
      verifyOtp,
      sendResetOtp,
      verifyResetOtp,
      updatePassword,
      signOut,
      refreshProfile,
    }),
    [user, profile, loading, authMode, otpPending, otpPurpose, refreshProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
