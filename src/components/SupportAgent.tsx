import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, Ticket, UserRound } from "lucide-react";
import { toast } from "sonner";
import { askAgent, type AgentMessage } from "@/lib/supportAgent";
import { checkRateLimit } from "@/lib/store";
import { sanitizeText } from "@/lib/sanitize";

const SUGGESTIONS = [
  "كيف أشحن محفظتي؟",
  "كم يستغرق تنفيذ طلب السوشيال ميديا؟",
  "كيف أشتري حساباً من السوق؟",
  "حسابي محظور، ماذا أفعل؟",
];
const WELCOME: AgentMessage = {
  role: "assistant",
  text: "أهلاً بك 👋 أنا مساعد Ali Pro الذكي. اسألني عن الخدمات والدفع والطلبات، وإن احتجت تدخل الإدارة أحوّلك لتذكرة دعم.",
};

export function SupportAgent({ onOpenTicket }: { onOpenTicket: (summary: string) => void }) {
  const [messages, setMessages] = useState<AgentMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const send = async (raw: string) => {
    const text = sanitizeText(raw, 500);
    if (!text || busy) return;
    if (!(await checkRateLimit("ai_agent", 12, 60).catch(() => true))) {
      toast.error("أرسلت رسائل كثيرة، انتظر قليلاً.");
      return;
    }
    const next: AgentMessage[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    const res = await askAgent(next.filter((m) => m !== WELCOME));
    setLocal(res.source === "local");
    setMessages((m) => [...m, { role: "assistant", text: res.text }]);
    setBusy(false);
  };

  const transcript = () =>
    messages
      .filter((m) => m !== WELCOME)
      .map((m) => `${m.role === "user" ? "أنا" : "المساعد"}: ${m.text}`)
      .join("\n")
      .slice(0, 1800);

  return (
    <div className="flex h-[min(620px,calc(100vh-260px))] min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-l from-primary/10 to-transparent px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_24px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
            <Bot size={22} />
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
              مساعد Ali Pro <Sparkles size={14} className="text-primary" />
            </p>
            <p className="text-[11px] text-muted-foreground">
              {local ? "وضع الأسئلة الشائعة" : "وكيل ذكاء اصطناعي · يرد فوراً"}
            </p>
          </div>
        </div>
        <button
          onClick={() => onOpenTicket(transcript())}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[11px] font-bold text-foreground transition hover:border-primary hover:text-primary"
        >
          <Ticket size={14} /> تحويل إلى تذكرة
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}
            >
              {m.role === "user" ? <UserRound size={14} /> : <Bot size={14} />}
            </span>
            <p
              className={`max-w-[82%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-7 ${m.role === "user" ? "rounded-bl-md bg-primary text-primary-foreground" : "rounded-br-md border border-border bg-muted/60 text-foreground"}`}
            >
              {m.text}
            </p>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin text-primary" /> المساعد يكتب...
          </div>
        )}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="rounded-full border border-border bg-background px-3 py-2 text-[11px] font-bold text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={end} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="اكتب سؤالك هنا..."
          className="h-11 flex-1 rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="إرسال"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
        >
          <Send size={17} className="rotate-180" />
        </button>
      </form>
    </div>
  );
}
