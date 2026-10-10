import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock,
  ImagePlus,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Send,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getReplies, getTickets } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { checkRateLimit, errorMessage, notifyAdmin, uploadAttachment } from "@/lib/store";
import { sanitizeText } from "@/lib/sanitize";
import type { SupportTicket, TicketReply } from "@/types";
import { Page } from "@/pages/OrdersPage";
import { Attachment } from "@/components/Attachment";
import { SupportWaiting } from "@/components/SupportWaiting";
import { SupportAgent } from "@/components/SupportAgent";

export function SupportPage() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const ticketFileRef = useRef<HTMLInputElement>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const lastStatus = useRef<Record<string, string>>({});
  const [panel, setPanel] = useState<"ai" | "tickets">("ai");

  const load = async () => {
    if (!user) return;
    const rows = await getTickets(user.id).catch(() => [] as SupportTicket[]);
    for (const t of rows) {
      const before = lastStatus.current[t.id];
      if (before && before !== t.status) {
        if (t.status === "open")
          toast.success("تمت الموافقة على تذكرتك", {
            description: "المحادثة مع الإدارة مفتوحة الآن",
          });
        if (t.status === "closed") toast("تم إغلاق التذكرة", { description: t.subject });
      }
      lastStatus.current[t.id] = t.status;
    }
    setTickets(rows);
    setSelected((cur) => (cur ? (rows.find((r) => r.id === cur.id) ?? cur) : cur));
  };

  const reloadReplies = async (ticketId: string) => {
    setReplies(await getReplies(ticketId).catch(() => []));
  };

  useEffect(() => {
    void load();
  }, [user]);
  useEffect(() => {
    if (selected) void reloadReplies(selected.id);
  }, [selected?.id, selected?.status]);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [replies.length, selected?.id]);

  // Live updates: approval, admin replies and closing arrive without refresh
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`support-live-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets", filter: `user_id=eq.${user.id}` },
        () => {
          void load();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_replies" },
        (payload) => {
          const row = payload.new as TicketReply;
          setSelected((cur) => {
            if (cur && row.ticket_id === cur.id) void reloadReplies(cur.id);
            return cur;
          });
        },
      )
      .subscribe();
    const poll = window.setInterval(() => {
      void load();
      setSelected((cur) => {
        if (cur) void reloadReplies(cur.id);
        return cur;
      });
    }, 15000);
    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openFromAgent = (summary: string) => {
    setSubject("");
    setMessage(summary ? `ملخص محادثتي مع المساعد:\n${summary}` : "");
    setShowNew(true);
  };

  const closeOwnTicket = async () => {
    if (!selected || !window.confirm("إغلاق هذه المحادثة؟ لن تتمكن من إعادة فتحها.")) return;
    const { error } = await supabase
      .from("support_tickets")
      .update({ status: "closed", closed_at: new Date().toISOString() } as never)
      .eq("id", selected.id);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    await notifyAdmin("تم إغلاق تذكرة من العميل", selected.subject).catch(() => undefined);
    await load();
  };

  const createTicket = async () => {
    if (!user) return;
    const cleanSubject = sanitizeText(subject, 160);
    const cleanMessage = sanitizeText(message, 2000);
    if (!cleanSubject || !cleanMessage) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    if (!profile?.full_name || !profile?.phone) {
      toast.error("يرجى استكمال بياناتك الشخصية أولاً من صفحة حسابي");
      return;
    }

    setBusy(true);
    try {
      const allowed = await checkRateLimit("ticket", 3, 300);
      if (!allowed) {
        toast.error("لقد أرسلت عدة تذاكر بسرعة. انتظر قليلاً ثم حاول مرة أخرى.");
        return;
      }

      // المرفق اختياري: عند فشل أو بطء رفع الصورة يُسجَّل الطلب بدون رابط
      let imageUrl = "";
      try {
        imageUrl = ticketFile ? await uploadAttachment(user.id, ticketFile) : "";
      } catch {
        imageUrl = "";
      }
      const payload = {
        user_id: user.id,
        subject: cleanSubject,
        message: cleanMessage,
        image_url: imageUrl,
        user_name: profile.full_name,
        user_email: profile.email,
        user_phone: profile.phone,
        user_avatar_url: profile.avatar_url || "",
        status: "pending",
      };
      const { error } = await supabase.from("support_tickets").insert(payload);
      if (error) {
        console.error("[ticket] insert failed:", error);
        toast.error(errorMessage(error));
        return;
      }

      try {
        await notifyAdmin(
          "تذكرة دعم جديدة",
          `${cleanSubject} · ${profile.full_name || profile.email}`,
        );
      } catch {
        /* الإشعار الإداري ليس شرطاً لنجاح الإرسال */
      }
      toast.success("تم إرسال التذكرة", {
        description: "ستفتح المحادثة تلقائياً عند موافقة الإدارة",
      });
      setPanel("tickets");
      setSubject("");
      setMessage("");
      setTicketFile(null);
      setShowNew(false);
      await load();
    } catch (err) {
      console.error("[ticket] submission failed:", err);
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!selected || !user) return;
    const cleanReply = sanitizeText(reply, 2000);
    if (!cleanReply && !replyFile) return;

    setBusy(true);
    try {
      const allowed = await checkRateLimit("ticket_reply", 5, 300);
      if (!allowed) {
        toast.error("لقد أرسلت عدة ردود بسرعة. انتظر قليلاً ثم حاول مرة أخرى.");
        return;
      }

      // المرفق اختياري: عند فشل أو بطء رفع الصورة يُسجَّل الرد بدون رابط
      let imageUrl = "";
      if (replyFile) {
        try {
          imageUrl = await uploadAttachment(user.id, replyFile);
        } catch {
          imageUrl = "";
        }
      }
      const payload = {
        ticket_id: selected.id,
        user_id: user.id,
        message: cleanReply,
        image_url: imageUrl,
        is_admin_reply: false,
      };
      const { error } = await supabase.from("ticket_replies").insert(payload);
      if (error) {
        console.error("[reply] insert failed:", error);
        toast.error(errorMessage(error));
        return;
      }

      await notifyAdmin(
        "رد جديد على تذكرة",
        `${selected.subject} · ${profile?.full_name || profile?.email || "مستخدم"}`,
      ).catch(() => undefined);
      toast.success("تم إرسال الرد");
      setReply("");
      setReplyFile(null);
      await reloadReplies(selected.id);
    } catch (err) {
      console.error("[reply] submission failed:", err);
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const restricted = profile?.is_restricted;

  const statusMeta = (st: string) =>
    st === "open"
      ? { label: "المحادثة مفتوحة", cls: "bg-primary/15 text-primary", Icon: CheckCircle2 }
      : st === "pending"
        ? {
            label: "بانتظار الموافقة",
            cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
            Icon: Clock,
          }
        : { label: "مغلقة", cls: "bg-muted text-muted-foreground", Icon: Lock };
  const inputCls =
    "w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary";
  const sel = selected;
  const selMeta = sel ? statusMeta(sel.status) : null;
  const pendingCount = tickets.filter((t) => t.status === "pending").length;

  return (
    <div className="pt-20 sm:pt-24">
      <Page
        title="الدعم الفني"
        subtitle="اسأل المساعد الذكي فوراً، أو افتح تذكرة ليتواصل معك فريق الإدارة"
      >
        <div className="mb-6 inline-flex gap-1 rounded-2xl border border-border bg-card p-1">
          <button
            onClick={() => setPanel("ai")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${panel === "ai" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Bot size={15} /> المساعد الذكي
          </button>
          <button
            onClick={() => setPanel("tickets")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${panel === "tickets" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Ticket size={15} /> تذاكري{" "}
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 text-[9px] text-[#ffffff]">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {panel === "ai" ? (
          <div className="mx-auto max-w-3xl">
            <SupportAgent
              onOpenTicket={(summary) => {
                setPanel("tickets");
                openFromAgent(summary);
              }}
            />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-foreground">تذاكري</h2>
                <button
                  onClick={() => setShowNew(true)}
                  disabled={restricted}
                  className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
                >
                  <Plus size={15} /> تذكرة جديدة
                </button>
              </div>
              {restricted && (
                <div className="mb-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-300">
                  حسابك مقيد - لا يمكن إنشاء تذاكر جديدة
                </div>
              )}
              <div className="motion-stagger space-y-3">
                {tickets.map((ticket) => {
                  const meta = statusMeta(ticket.status);
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelected(ticket)}
                      className={`w-full rounded-2xl border p-4 text-start transition ${sel?.id === ticket.id ? "border-primary/50 bg-primary/[.07]" : "border-border bg-card hover:border-primary/30"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-foreground">
                            {ticket.subject}
                          </h3>
                          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                            {ticket.message}
                          </p>
                        </div>
                        <span
                          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${meta.cls}`}
                        >
                          <meta.Icon size={11} /> {meta.label}
                        </span>
                      </div>
                      <p className="mt-3 text-[10px] text-muted-foreground">
                        {formatDate(ticket.created_at)}
                      </p>
                    </button>
                  );
                })}
                {!tickets.length && (
                  <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                    <Ticket className="mx-auto text-muted-foreground" size={36} />
                    <p className="mt-3 text-sm text-foreground">لا توجد تذاكر بعد</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      جرّب المساعد الذكي أولاً، وإن لم يكفِ افتح تذكرة
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="flex min-h-[460px] flex-col rounded-3xl border border-border bg-card p-5">
              {sel && selMeta ? (
                <>
                  <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary">
                        {sel.status === "open" ? "محادثة مباشرة مع الإدارة" : "تفاصيل التذكرة"}
                      </p>
                      <h2 className="mt-1 truncate text-lg font-bold text-foreground">
                        {sel.subject}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${selMeta.cls}`}
                      >
                        <selMeta.Icon size={12} /> {selMeta.label}
                      </span>
                      {sel.status === "open" && (
                        <button
                          onClick={closeOwnTicket}
                          className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:border-red-400 hover:text-red-500"
                        >
                          إنهاء
                        </button>
                      )}
                    </div>
                  </div>

                  {sel.status === "pending" && (
                    <div className="mt-4">
                      <SupportWaiting compact />
                      <p className="mt-3 rounded-xl bg-amber-500/10 px-4 py-3 text-center text-xs leading-6 text-amber-700 dark:text-amber-200">
                        تم استلام تذكرتك وهي قيد المراجعة. ستفتح المحادثة مع الإدارة تلقائياً بمجرد
                        الموافقة عليها، وسيصلك إشعار.
                      </p>
                    </div>
                  )}
                  {sel.status === "open" && !replies.some((r) => r.is_admin_reply) && (
                    <div className="mt-4">
                      <SupportWaiting compact />
                    </div>
                  )}

                  {(sel.user_name || sel.user_email || sel.user_phone) && (
                    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-muted/60 p-3">
                      {sel.user_avatar_url && (
                        <img
                          src={sel.user_avatar_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}
                      {sel.user_name && (
                        <span className="flex items-center gap-1.5 text-xs text-foreground">
                          <UserRound size={13} /> {sel.user_name}
                        </span>
                      )}
                      {sel.user_email && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail size={13} /> {sel.user_email}
                        </span>
                      )}
                      {sel.user_phone && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone size={13} /> {sel.user_phone}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
                    <div className="rounded-2xl bg-muted/60 p-4 text-sm leading-7 text-foreground">
                      {sel.message}
                      <Attachment stored={sel.image_url} label="مرفق التذكرة" />
                    </div>
                    {replies.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl p-4 text-sm leading-6 ${item.is_admin_reply ? "me-8 border border-primary/25 bg-primary/10 text-foreground" : "ms-8 bg-muted text-foreground"}`}
                      >
                        {item.is_admin_reply && (
                          <p className="mb-1 text-[10px] font-bold text-primary">فريق الدعم</p>
                        )}
                        {item.message}
                        <Attachment stored={item.image_url} label="مرفق الرد" />
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    ))}
                    <div ref={chatEnd} />
                  </div>

                  {sel.status === "open" ? (
                    <div className="mt-5">
                      <div className="flex gap-2">
                        <input
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void sendReply();
                            }
                          }}
                          placeholder="اكتب ردك..."
                          className={`h-11 flex-1 ${inputCls}`}
                        />
                        <input
                          ref={replyFileRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
                        />
                        <button
                          onClick={() => replyFileRef.current?.click()}
                          title="إرفاق صورة"
                          className="rounded-xl border border-border bg-muted px-3 text-muted-foreground hover:text-primary"
                        >
                          <ImagePlus size={17} />
                        </button>
                        <button
                          disabled={busy}
                          onClick={sendReply}
                          className="rounded-xl bg-primary px-4 text-primary-foreground disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2 className="animate-spin" size={17} />
                          ) : (
                            <Send size={17} className="rotate-180" />
                          )}
                        </button>
                      </div>
                      {replyFile && (
                        <p className="mt-2 flex items-center gap-2 text-[11px] text-primary">
                          {replyFile.name}
                          <button
                            onClick={() => setReplyFile(null)}
                            className="text-muted-foreground"
                          >
                            <X size={12} />
                          </button>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">
                      <Lock size={14} />{" "}
                      {sel.status === "pending"
                        ? "الرد متاح بعد موافقة الإدارة"
                        : "هذه التذكرة مغلقة"}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full min-h-[380px] flex-col items-center justify-center text-center">
                  <MessageCircle className="text-primary" size={34} />
                  <p className="mt-3 text-sm font-bold text-foreground">اختر تذكرة لعرض المحادثة</p>
                  <p className="mt-1 max-w-xs text-xs leading-6 text-muted-foreground">
                    عند موافقة الإدارة على تذكرتك تفتح المحادثة هنا مباشرة ويمكنك مراسلتهم حتى يتم
                    إغلاقها.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {showNew && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-popover p-6 text-popover-foreground">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">تذكرة دعم جديدة</h2>
                <button
                  onClick={() => setShowNew(false)}
                  aria-label="إغلاق"
                  className="text-muted-foreground"
                >
                  <X />
                </button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-3">
                {profile?.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                )}
                <span className="flex items-center gap-1.5 text-xs text-foreground">
                  <UserRound size={13} /> {profile?.full_name || "غير محدد"}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-foreground">
                  <Mail size={13} /> {profile?.email}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-foreground">
                  <Phone size={13} /> {profile?.phone || "غير محدد"}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                سيتم إرفاق بياناتك تلقائياً، وتبقى التذكرة قيد المراجعة حتى توافق الإدارة وتفتح
                المحادثة.
              </p>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="عنوان المشكلة"
                className={`mt-4 h-12 ${inputCls}`}
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اشرح لنا كيف يمكننا مساعدتك"
                className={`mt-3 min-h-32 resize-none p-4 ${inputCls}`}
              />
              <input
                ref={ticketFileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setTicketFile(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => ticketFileRef.current?.click()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 py-3 text-xs font-bold text-muted-foreground hover:text-primary"
              >
                <ImagePlus size={16} />{" "}
                {ticketFile ? ticketFile.name : "إرفاق صورة أو لقطة شاشة (اختياري)"}
              </button>
              {ticketFile && (
                <button
                  onClick={() => setTicketFile(null)}
                  className="mt-2 text-[11px] text-red-500"
                >
                  إزالة المرفق
                </button>
              )}
              <button
                onClick={createTicket}
                disabled={busy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Send size={17} className="rotate-180" />
                )}{" "}
                {busy ? "جارٍ الإرسال..." : "إرسال التذكرة"}
              </button>
            </div>
          </div>
        )}
      </Page>
    </div>
  );
}
