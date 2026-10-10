import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { OtpInput } from "@/components/OtpInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { isPhone } from "@/lib/format";

type FieldProps = {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  dir?: "ltr" | "rtl";
  type?: string;
};

function Field({ icon, value, onChange, placeholder, dir = "rtl", type = "text" }: FieldProps) {
  return (
    <div className="group relative animate-fade-up">
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-input bg-background/60 pr-11 pl-4 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/70 focus:border-primary/70 focus:bg-background focus:ring-4 focus:ring-primary/15"
        dir={dir}
      />
    </div>
  );
}

function Stat({ value, text }: { value: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3 text-center shadow-sm backdrop-blur transition-transform duration-300 hover:-translate-y-1">
      <p className="text-lg font-bold text-primary">{value}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{text}</p>
    </div>
  );
}

function SocialButton({
  label,
  onClick,
  disabled,
  children,
  className = "",
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`group glow-ring flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ${className}`}
    >
      <span className="transition-transform duration-300 group-hover:scale-110">{children}</span>
      {label}
    </button>
  );
}

type ResetStep = "email" | "code" | "password" | "done";

export function AuthPage() {
  const {
    authMode,
    setAuthMode,
    signIn,
    signUp,
    sendOtp,
    otpPending,
    verifyOtp,
    sendResetOtp,
    verifyResetOtp,
    updatePassword,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [usePhone, setUsePhone] = useState(false);

  /* forgot password state */
  const [forgot, setForgot] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");

  /** تسجيل الدخول عبر Google أو Discord مع رسائل عربية واضحة */
  const socialSignIn = async (provider: "google" | "discord") => {
    setBusy(true);
    setError("");
    const label = provider === "google" ? "Google" : "Discord";
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (oauthError) {
        // المزود غير مفعل أو رفض الطلب — رسالة عربية واضحة بدل صفحة خطأ
        setError("مزود الخدمة غير مفعل حالياً، يرجى الدخول بالبريد الإلكتروني");
        toast.error("مزود الخدمة غير مفعل حالياً، يرجى الدخول بالبريد الإلكتروني");
      }
    } catch {
      setError("مزود الخدمة غير مفعل حالياً، يرجى الدخول بالبريد الإلكتروني");
      toast.error("تعذر الاتصال بخدمة " + label + "، تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    if (authMode === "register") {
      const result = await signUp(email, password, name, phone);
      if (result.error) setError(result.error);
    } else {
      const result = await signIn(usePhone ? phone : email, password);
      if (result.error) setError(result.error);
    }
    setBusy(false);
  };

  const submitOtp = async () => {
    setBusy(true);
    const result = await verifyOtp(otp);
    if (result.error) setError(result.error);
    setBusy(false);
  };

  const closeForgot = () => {
    setForgot(false);
    setResetStep("email");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setNotice("");
    setError("");
  };

  const sendCode = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    const result = await sendResetOtp(resetEmail.trim());
    if (result.error) setError(result.error);
    else {
      setResetStep("code");
      setNotice(`تم إرسال رمز مكوّن من 6 أرقام إلى ${resetEmail.trim()}`);
    }
    setBusy(false);
  };

  const checkCode = async () => {
    setBusy(true);
    setError("");
    const result = await verifyResetOtp(resetEmail.trim(), resetCode);
    if (result.error) setError(result.error);
    else {
      setResetStep("password");
      setNotice("تم التحقق من الرمز بنجاح، اختر كلمة مرور جديدة.");
    }
    setBusy(false);
  };

  const savePassword = async () => {
    setError("");
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setBusy(true);
    const result = await updatePassword(resetEmail.trim(), newPassword);
    if (result.error) setError(result.error);
    else {
      setResetStep("done");
      setNotice(
        result.fallback
          ? "تم التحقق بنجاح. أرسلنا رابط تأكيد نهائي إلى بريدك — افتحه لاعتماد كلمة المرور الجديدة."
          : "تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن.",
      );
    }
    setBusy(false);
  };

  const primaryBtn =
    "flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div
      className="auth-page relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-500"
      dir="rtl"
    >
      <div className="auth-noise" />
      {/* soft animated aurora backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-aurora auth-aurora-a" />
        <div className="auth-aurora auth-aurora-b" />
      </div>

      <div className="absolute left-4 top-4 z-20">
        <ThemeToggle variant="icon" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1.05fr_1fr]">
        {/* Brand showcase */}
        <div className="relative hidden items-center justify-center overflow-hidden border-l border-border bg-gradient-to-br from-primary/10 via-background to-background lg:flex">
          <div className="auth-ring ring-one" />
          <div className="auth-ring ring-two" />
          <div className="auth-ring ring-three" />
          <div className="relative z-10 max-w-md px-10 text-center">
            <div className="animate-fade-up">
              <Logo />
            </div>
            <p className="mt-9 text-3xl font-bold leading-relaxed text-foreground animate-fade-up">
              كل ما تحتاجه لعالمك الرقمي
              <br />
              <span className="bg-gradient-to-l from-primary to-primary/60 bg-clip-text text-transparent">
                في مكان واحد.
              </span>
            </p>
            <p className="mt-5 text-sm leading-7 text-muted-foreground animate-fade-up">
              بطاقاتك الرقمية وخدمات السوشيال ميديا، بسرعة وأمان وبأفضل الأسعار في العراق.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-3">
              <Stat text="خدمة رقمية" value="50+" />
              <Stat text="عميل سعيد" value="10K+" />
              <Stat text="دعم متواصل" value="24/7" />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <div className="lg:hidden">
                <Logo />
              </div>
            </div>

            {forgot ? (
              <div className="animate-fade-up rounded-3xl border border-border bg-card/70 p-6 shadow-xl backdrop-blur-xl sm:p-8">
                <button
                  onClick={closeForgot}
                  className="mb-6 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <ArrowRight size={15} /> العودة لتسجيل الدخول
                </button>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <KeyRound size={26} />
                </div>
                <h1 className="mt-5 text-2xl font-bold text-foreground">نسيان كلمة المرور</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {resetStep === "email" &&
                    "أدخل بريدك الإلكتروني المسجّل وسنرسل لك رمز تحقق من 6 أرقام."}
                  {resetStep === "code" && "أدخل رمز التحقق المرسل إلى بريدك الإلكتروني."}
                  {resetStep === "password" && "اختر كلمة مرور جديدة لحسابك."}
                  {resetStep === "done" && "تم تحديث كلمة المرور بنجاح."}
                </p>

                {notice && (
                  <p className="mt-4 rounded-xl bg-primary/10 px-3 py-2 text-xs leading-5 text-primary">
                    {notice}
                  </p>
                )}

                {resetStep === "email" && (
                  <div className="mt-6 space-y-4">
                    <Field
                      icon={<Mail size={17} />}
                      value={resetEmail}
                      onChange={setResetEmail}
                      placeholder="البريد الإلكتروني المسجّل"
                      dir="ltr"
                    />
                    <button
                      onClick={sendCode}
                      disabled={busy || !resetEmail}
                      className={primaryBtn}
                    >
                      إرسال رمز التحقق <ArrowLeft size={17} />
                    </button>
                  </div>
                )}

                {resetStep === "code" && (
                  <div className="mt-6 space-y-4">
                    <OtpInput value={resetCode} onChange={setResetCode} disabled={busy} />
                    <button
                      onClick={checkCode}
                      disabled={busy || resetCode.length !== 6}
                      className={primaryBtn}
                    >
                      تأكيد الرمز <ArrowLeft size={17} />
                    </button>
                    <button
                      onClick={sendCode}
                      disabled={busy}
                      className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      إعادة إرسال الرمز
                    </button>
                  </div>
                )}

                {resetStep === "password" && (
                  <div className="mt-6 space-y-4">
                    <Field
                      icon={<KeyRound size={17} />}
                      type="password"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="كلمة المرور الجديدة"
                      dir="ltr"
                    />
                    <Field
                      icon={<KeyRound size={17} />}
                      type="password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="تأكيد كلمة المرور"
                      dir="ltr"
                    />
                    <button
                      onClick={savePassword}
                      disabled={busy || !newPassword}
                      className={primaryBtn}
                    >
                      حفظ كلمة المرور <ArrowLeft size={17} />
                    </button>
                  </div>
                )}

                {resetStep === "done" && (
                  <button onClick={closeForgot} className={`mt-6 ${primaryBtn}`}>
                    تسجيل الدخول الآن
                  </button>
                )}

                {error && (
                  <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
            ) : otpPending ? (
              <div className="animate-fade-up rounded-3xl border border-border bg-card/70 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <KeyRound size={30} />
                </div>
                <h1 className="mt-6 text-2xl font-bold text-foreground">
                  تحقق من بريدك الإلكتروني
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  تم إرسال رمز تحقق مكوّن من 6 أرقام إلى بريدك الإلكتروني
                  {email ? ` (${email})` : ""}
                  <br />
                  أدخله بالأسفل لإكمال إنشاء حسابك
                </p>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-8 h-14 w-full rounded-2xl border border-primary/40 bg-background text-center font-mono text-2xl tracking-[.55em] text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                  placeholder="000000"
                  dir="ltr"
                />
                {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
                <button
                  onClick={submitOtp}
                  disabled={busy || otp.length < 4}
                  className={`mt-5 ${primaryBtn}`}
                >
                  تأكيد الرمز <ArrowLeft size={17} />
                </button>
                <button
                  onClick={() => sendOtp(email || phone, "register")}
                  disabled={busy}
                  className="mt-5 w-full text-center text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  لم يصلك الرمز؟ إعادة الإرسال
                </button>
              </div>
            ) : (
              <div className="animate-fade-up rounded-3xl border border-border bg-card/70 p-6 shadow-xl backdrop-blur-xl sm:p-8">
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles size={15} /> مرحباً بك في Ali Pro Media
                </p>
                <h1 className="mt-3 text-3xl font-bold text-foreground">
                  {authMode === "login" ? "سجل دخولك للمتابعة" : "أنشئ حسابك الآن"}
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {authMode === "login"
                    ? "ادخل إلى عالمك الرقمي بأمان"
                    : "انضم إلى آلاف المستخدمين — يبدأ رصيدك بـ 0 د.ع"}
                </p>

                <div className="mt-8 flex rounded-xl border border-border bg-muted/50 p-1">
                  <button
                    onClick={() => setUsePhone(false)}
                    className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all duration-300 ${!usePhone ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    البريد الإلكتروني
                  </button>
                  <button
                    onClick={() => setUsePhone(true)}
                    className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all duration-300 ${usePhone ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    رقم الهاتف العراقي
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {authMode === "register" && (
                    <Field
                      icon={<UserRound size={17} />}
                      value={name}
                      onChange={setName}
                      placeholder="الاسم الكامل"
                    />
                  )}
                  {usePhone ? (
                    <Field
                      icon={<Phone size={17} />}
                      value={phone}
                      onChange={setPhone}
                      placeholder="07xxxxxxxxx أو +964..."
                      dir="ltr"
                    />
                  ) : (
                    <Field
                      icon={<Mail size={17} />}
                      value={email}
                      onChange={setEmail}
                      placeholder="البريد الإلكتروني"
                      dir="ltr"
                    />
                  )}
                  {authMode === "login" && usePhone && phone && !isPhone(phone) && (
                    <p className="text-xs text-amber-500">تأكد من إدخال رقم عراقي صحيح</p>
                  )}
                  <div className="group relative">
                    <KeyRound
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary"
                      size={17}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="كلمة المرور"
                      className="h-12 w-full rounded-xl border border-input bg-background/60 pr-11 pl-11 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/70 focus:border-primary/70 focus:bg-background focus:ring-4 focus:ring-primary/15"
                      dir="ltr"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
                      aria-label="إظهار كلمة المرور"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {authMode === "login" && (
                  <button
                    onClick={() => {
                      setForgot(true);
                      setResetEmail(email);
                    }}
                    className="mt-3 block w-full text-right text-xs font-bold text-primary transition-colors hover:text-primary/80"
                  >
                    نسيان كلمة المرور؟
                  </button>
                )}

                {error && (
                  <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </p>
                )}

                <button
                  onClick={submit}
                  disabled={busy || !password || (!email && !phone)}
                  className={`mt-5 ${primaryBtn}`}
                >
                  {authMode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"} <ArrowLeft size={17} />
                </button>

                <div className="mt-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[11px] text-muted-foreground">أو أكمل باستخدام</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <SocialButton
                    label="Google"
                    onClick={() => socialSignIn("google")}
                    disabled={busy}
                    className="border-border bg-card/80 text-foreground hover:border-primary/60 hover:text-primary"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1A6.2 6.2 0 1 1 16.1 7.4l2.8-2.7A10 10 0 1 0 12 22c5.8 0 9.6-4 9.6-9.7 0-.7-.07-1.3-.18-2.1H12z"
                      />
                    </svg>
                  </SocialButton>
                  <SocialButton
                    label="Discord"
                    onClick={() => socialSignIn("discord")}
                    disabled={busy}
                    className="border-border bg-card/80 text-foreground hover:border-[#5865F2]/60 hover:text-foreground"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                      className="text-[#5865F2]"
                      aria-hidden
                    >
                      <path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.099.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </SocialButton>
                </div>

                <button
                  onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                  className="mt-6 w-full text-center text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {authMode === "login"
                    ? "ليس لديك حساب؟ أنشئ حساباً جديداً"
                    : "لديك حساب بالفعل؟ سجل الدخول"}
                </button>

                <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                  <ShieldCheck size={14} className="text-primary" /> بياناتك محمية ومشفرة بالكامل
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
