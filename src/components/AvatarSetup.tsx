import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  RotateCcw,
  ShieldCheck,
  SwitchCamera,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { uploadAvatar } from "@/lib/data";
import { supabase } from "@/lib/supabase";

const DEFAULT_AVATAR = "/placeholder-user.jpg";
const MAX_DATA_URL = 500_000;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AvatarSetup() {
  const { profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOpen(false);
  };

  const startCamera = async (mode: "user" | "environment" = facing) => {
    stopCamera();
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      setFacing(mode);
      setStream(next);
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = next;
      });
    } catch {
      toast.error("تعذّر فتح الكاميرا. يمكنك اختيار صورة من المعرض.");
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });
        pendingFile.current = file;
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    pendingFile.current = file;
    setPreview(URL.createObjectURL(file));
  };

  const finish = () => {
    try {
      window.localStorage.setItem("apm-view", "home");
    } catch {
      /* private mode */
    }
    window.location.replace("/");
  };

  const save = async () => {
    if (!profile) return;
    if (!pendingFile.current) {
      toast.error("صورة الحساب إلزامية — التقط صورة أو اخترها من المعرض");
      return;
    }
    setBusy(true);
    let stored = "";
    try {
      stored = await uploadAvatar(profile.id, pendingFile.current);
    } catch {
      // حتى لو فشل الرفع نُبقي الصورة إلزامية: نخزّن نسخة مضغوطة inline.
      try {
        const dataUrl = await fileToDataUrl(pendingFile.current);
        stored = dataUrl && dataUrl.length <= MAX_DATA_URL ? dataUrl : DEFAULT_AVATAR;
      } catch {
        stored = DEFAULT_AVATAR;
      }
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: stored })
        .eq("id", profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("تم حفظ صورة حسابك");
      finish();
    } catch {
      toast.error("تعذّر حفظ صورة الحساب، حاول مرة أخرى");
    }
    setBusy(false);
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-500"
      dir="rtl"
    >
      <div className="auth-noise" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-aurora auth-aurora-a" />
        <div className="auth-aurora auth-aurora-b" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-10">
        <div className="animate-fade-up">
          <Logo />
        </div>
        <div className="mt-8 w-full animate-fade-up rounded-3xl border border-border bg-card/70 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8">
          <h1 className="text-2xl font-bold text-foreground">أكمل إعداد حسابك</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            صورة الملف الشخصي <span className="font-bold text-primary">إلزامية</span> قبل الدخول إلى
            لوحة Ali Pro Media. التقط صورة مباشرة أو اختر من المعرض.
          </p>

          <div className="motion-pop mx-auto mt-8 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-muted/40 shadow-[0_0_40px_color-mix(in_oklab,var(--color-primary)_30%,transparent)]">
            {preview ? (
              <img src={preview} alt="معاينة الصورة" className="h-full w-full object-cover" />
            ) : (
              <Camera className="text-primary" size={42} />
            )}
          </div>

          <div className="mt-8 grid w-full grid-cols-2 gap-3">
            <button
              onClick={() => startCamera("user")}
              className="hover-lift flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 py-3.5 text-sm font-bold text-primary"
            >
              <Camera size={18} /> التقاط مباشر
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="hover-lift flex items-center justify-center gap-2 rounded-2xl border border-border bg-muted/50 py-3.5 text-sm font-bold text-foreground"
            >
              <ImagePlus size={18} /> من المعرض
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          {preview && (
            <button
              onClick={() => {
                pendingFile.current = null;
                setPreview("");
              }}
              className="mx-auto mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-primary"
            >
              <RotateCcw size={13} /> إعادة الاختيار
            </button>
          )}

          <button
            onClick={save}
            disabled={busy || !preview}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
            تأكيد والمتابعة
          </button>

          <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck size={13} className="text-primary" /> لا يمكن تخطي هذه الخطوة — صورة الحساب
            مطلوبة.
          </p>
        </div>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 z-[130] flex flex-col bg-background">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={stopCamera}
              className="rounded-xl bg-muted p-2 text-foreground"
              aria-label="إغلاق الكاميرا"
            >
              <X />
            </button>
            <p className="text-sm font-bold text-foreground">التقاط صورة الحساب</p>
            <button
              onClick={() => startCamera(facing === "user" ? "environment" : "user")}
              className="rounded-xl bg-muted p-2 text-foreground"
              aria-label="تبديل الكاميرا"
            >
              <SwitchCamera />
            </button>
          </div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="min-h-0 flex-1 bg-black object-cover"
          />
          <div className="p-6">
            <button
              onClick={captureFrame}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-primary shadow-lg transition-transform duration-300 hover:scale-105"
              aria-label="التقاط"
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
