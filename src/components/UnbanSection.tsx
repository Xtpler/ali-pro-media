import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileImage,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { sanitizeText } from "@/lib/sanitize";
import { logError, submitUnbanAppeal, uploadAttachment } from "@/lib/store";

const PLATFORMS = ["تيك توك", "إنستغرام", "سناب شات", "فيسبوك", "ببجي", "تويتر / X"] as const;

export function UnbanSection() {
  const { user, profile } = useAuth();
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("تيك توك");
  const [username, setUsername] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    setUsername("");
    setDetails("");
    setFile(null);
    setSubmitted(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast.error("يجب تسجيل الدخول لإرسال الطلب");
      return;
    }
    if (!username.trim() || !details.trim()) {
      toast.error("اختر المنصة وأدخل اسم الحساب وتفاصيل الباند");
      return;
    }

    setSubmitting(true);
    try {
      // الصورة اختيارية: إن فشل الرفع يُرسل الطلب مع رابط صورة فارغ دون تعطيله
      let attachmentUrl = "";
      try {
        attachmentUrl = await uploadAttachment(user.id, file);
      } catch (uploadError) {
        logError("unban.upload", uploadError);
        attachmentUrl = "";
      }
      const reason = sanitizeText(
        `المنصة: ${platform}\nاسم الحساب: ${username}\nتفاصيل الباند: ${details}`,
        1800,
      );
      await submitUnbanAppeal({
        userId: user.id,
        reason,
        contactPhone: profile?.phone ?? "",
        attachmentUrl,
      });
      setSubmitted(true);
      toast.success("تم تقديم الطلب بنجاح");
    } catch (submitError) {
      logError("unban.submit", submitError);
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "تعذر إرسال الطلب، يرجى المحاولة مرة أخرى",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="mx-auto max-w-2xl py-8 text-center" aria-live="polite">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
          <CheckCircle2 size={34} />
        </div>
        <h3 className="mt-5 text-2xl font-extrabold text-foreground">تم استلام طلبك</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          سيراجع فريقنا حالة الحساب والصورة المرفقة، وسيصلك تحديث عند اكتمال المراجعة.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={reset}
          className="mt-6 border-primary/40 text-primary hover:bg-primary/10"
        >
          <RotateCcw /> إرسال طلب آخر
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-7 flex items-start gap-4 border-b border-border pb-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
          <ShieldCheck size={23} />
        </div>
        <div>
          <p className="text-xs font-bold text-primary">استعادة الحسابات</p>
          <h3 className="mt-1 text-xl font-extrabold text-foreground">قسم فتح الباند</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            أرسل تفاصيل الحظر وصورة الحالة ليتمكن الفريق من مراجعة حسابك.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <fieldset>
          <legend className="mb-3 text-sm font-bold text-foreground">اختر المنصة</legend>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((item) => (
              <Button
                key={item}
                type="button"
                variant={platform === item ? "default" : "outline"}
                onClick={() => setPlatform(item)}
                className={
                  platform === item
                    ? "font-bold"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary"
                }
              >
                {item}
              </Button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="unban-username" className="mb-2 block text-sm font-bold text-foreground">
            اسم المستخدم أو معرّف الحساب
          </label>
          <Input
            id="unban-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="@username"
            dir="ltr"
            maxLength={100}
            className="h-12 bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="unban-details" className="mb-2 block text-sm font-bold text-foreground">
            تفاصيل الباند
          </label>
          <Textarea
            id="unban-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="متى ظهر الحظر؟ وما الرسالة التي ظهرت لك؟"
            maxLength={1400}
            className="min-h-36 resize-y bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-bold text-foreground">صورة حالة الباند</span>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              if (
                selected &&
                (selected.size > 8 * 1024 * 1024 || !selected.type.startsWith("image/"))
              ) {
                toast.error("اختر صورة صالحة بحجم لا يتجاوز 8 ميغابايت");
                event.target.value = "";
                setFile(null);
                return;
              }
              setFile(selected);
            }}
          />
          <div className="border border-dashed border-primary/40 bg-primary/[.04] p-5 text-center">
            <FileImage className="mx-auto text-primary" size={30} />
            <p className="mt-3 break-all text-sm font-bold text-foreground">
              {file?.name ?? "ارفع لقطة شاشة واضحة لرسالة الحظر"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG أو JPG أو WEBP · حتى 8 ميغابايت
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInput.current?.click()}
                className="border-primary/40 text-primary hover:bg-primary/10"
              >
                <UploadCloud /> {file ? "تغيير الصورة" : "اختيار صورة"}
              </Button>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFile(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X /> إزالة
                </Button>
              )}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          size="lg"
          className="h-12 w-full font-extrabold"
        >
          {submitting ? <Loader2 className="animate-spin" /> : <Send />}
          {submitting ? "جارٍ إرسال الطلب..." : "إرسال طلب فتح الباند"}
        </Button>
      </form>
    </section>
  );
}
