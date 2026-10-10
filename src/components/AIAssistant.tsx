import { useRef, useState, useEffect } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

type Message = { role: "user" | "bot"; text: string };

const knowledgeBase: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["ببجي", "pubg", "شدات", "uc"],
    answer:
      "لشحن شدات ببجي موبايل: اختر بطاقة PUBG من قسم البطاقات الرقمية، حدد الفئة المطلوبة (600، 1380، 3480 شدة)، ادفع عبر زين كاش أو كي كارد، وستصلك الشدة فوراً على حسابك. تأكد من إدخال معرف اللاعب (Player ID) الصحيح.",
  },
  {
    keywords: ["ستيم", "steam", "محفظة"],
    answer:
      "لشراء بطاقة Steam: تصفح قسم البطاقات الرقمية، اختر الفئة المناسبة ($10، $20، $50)، ادفع بأي وسيلة دفع عراقية، ثم استخدم الكود في متجر Steam لشحن المحفظة. الكود يُنسخ بضغطة واحدة من صفحة طلباتك.",
  },
  {
    keywords: ["بلايستيشن", "playstation", "psn", "ps5", "ps4"],
    answer:
      "بطاقات PlayStation Network متوفرة بفئات $10، $25، $50. بعد الشراء، ادخل إلى حساب PSN، اختر Redeem Code وأدخل الكود. التعبئة فورية وتعمل لجميع الحسابات العراقية والخليجية.",
  },
  {
    keywords: ["انستغرام", "انستقرام", "instagram", "متابعين"],
    answer:
      "خدمات انستغرام تشمل: متابعين، لايكات، مشاهدات للستوري. التسليم تدريجي وآمن لحسابك. اختر الخدمة من قسم السوشيال ميديا، ادفع، وسيبدأ التنفيذ خلال 24 ساعة. ننصح بعدم تغيير اسم المستخدم أثناء التنفيذ.",
  },
  {
    keywords: ["تيك توك", "tiktok", "مشاهدات"],
    answer:
      "خدمات تيك توك: متابعين، مشاهدات، لايكات. التسليم سريع وآمن. اختر الخدمة المطلوبة، ادفع بالدينار العراقي، وسترى النتائج خلال ساعات. لا تشارك كلمة المرور مع أي طرف.",
  },
  {
    keywords: ["تلغرام", "telegram", "أعضاء", "اعضاء"],
    answer:
      "إضافة أعضاء لقنوات ومجموعات تلغرام: اختر العدد المطلوب (500، 1000، 5000)، ادفع، وأرسل رابط القناة للدعم الفني. الأعضاء حقيقيون ويتم إضافتهم تدريجياً.",
  },
  {
    keywords: ["يوتيوب", "youtube", "مشتركين", "مشاهدات يوتيوب"],
    answer:
      "خدمات يوتيوب: مشتركين، مشاهدات، ساعات مشاهدة. النمو آمن وتدريجي لتفادي أي مخالفة. اختر الخدمة، ادفع، وأرسل رابط القناة أو الفيديو. النتائج تظهر خلال 24-48 ساعة.",
  },
  {
    keywords: ["زين كاش", "zain cash", "دفع", "محفظة", "شحن المحفظة"],
    answer:
      "للدفع عبر زين كاش: اختر زين كاش عند الدفع، أدخل رقم هاتفك المرتبط بزين كاش، وستصلك رسالة لتأكيد الدفع. لشحن محفظتك في Ali Pro Media، تواصل مع الإدارة عبر تذكرة دعم وسيتم إضافة الرصيد يدوياً.",
  },
  {
    keywords: ["كي كارد", "qi card", "mastercard", "ماستر كارد"],
    answer:
      "للدفع عبر كي كارد: اختر Qi Card عند الدفع، أدخل بيانات بطاقتك، وسيتم تأكيد العملية فوراً. جميع المعاملات مشفرة وآمنة. يمكن أيضاً استخدام ماستر كارد عبر خيار Qi Card.",
  },
  {
    keywords: ["فاست", "fastpay", "فاست بي"],
    answer:
      "للدفع عبر FastPay: اختر فاست بي عند الدفع، افتح تطبيق FastPay على هاتفك، امسح QR أو أدخل الرمز، وأكد الدفع. التحويل فوري والمتجر يستلم الإشعار تلقائياً.",
  },
  {
    keywords: ["fib", "البنك العراقي", "first iraqi"],
    answer:
      "للدفع عبر FIB (البنك العراقي الأول): اختر FIB عند الدفع، ستحصل على رابط أو QR، افتح تطبيق FIB وأكد التحويل. العملية فورية وآمنة.",
  },
  {
    keywords: ["آسيا", "asiahawala", "حوالة"],
    answer:
      "للدفع عبر AsiaHawala: اختر آسيا حوالة عند الدفع، أدخل رقم حسابك، وأكد التحويل عبر التطبيق. المبلغ يُحوّل فوراً للمتجر.",
  },
  {
    keywords: ["تذكرة", "دعم", "support", "مشكلة", "مساعدة"],
    answer:
      'لإنشاء تذكرة دعم: اذهب لصفحة الدعم الفني، اضغط "تذكرة جديدة"، اكتب عنوان المشكلة ووصفها، وسيتم إرفاق بياناتك (الاسم، البريد، الهاتف) تلقائياً. سيرد عليك الأدمن في أقرب وقت.',
  },
  {
    keywords: ["حساب", "تسجيل", "register", "إنشاء", "أدمن"],
    answer:
      'لإنشاء حساب: اضغط "أنشئ حساباً جديداً" في صفحة الدخول، أدخل بريدك الإلكتروني أو رقم هاتفك العراقي، اسمك الكامل، وكلمة المرور. ستصل رمز تحقق (OTP) لإتمام التسجيل. حساب الأدمن الرئيسي: ha1900612@gmail.com.',
  },
  {
    keywords: ["حظر", "بان", "ban", "محظور"],
    answer:
      "إذا تم حظر حسابك، تواصل مع الدعم الفني عبر تذكرة مع شرح الموقف. يمكن للأدمن رفع الحظر بعد مراجعة الحالة. الحظر يمنع الدخول وإجراء المعاملات.",
  },
  {
    keywords: ["free fire", "فري فاير", "ماسات", "diamonds"],
    answer:
      "لشحن ماسات Free Fire: اختر الخدمة من البطاقات الرقمية، حدد عدد الماسات (500، 1080، 2180)، ادفع بالدينار، وأدخل معرف اللاعب (Player ID). الشحن فوري.",
  },
  {
    keywords: ["xbox", "إكس بوكس", "game pass"],
    answer:
      "بطاقات Xbox Game Pass متوفرة لمدة شهر أو ثلاثة أشهر. بعد الشراء، فعّل الكود من متجر Xbox أو تطبيق Microsoft. يعطيك وصولاً لمكتبة ألعاب ضخمة.",
  },
  {
    keywords: ["itunes", "آيتونز", "apple", "أبل"],
    answer:
      "بطاقات iTunes متوفرة بفئات $15، $25، $50. استخدم الكود في متجر App Store أو Apple Music. يعمل على جميع أجهزة Apple.",
  },
  {
    keywords: ["google play", "جوجل بلاي"],
    answer:
      "بطاقات Google Play متوفرة بفئات $10، $15، $25. استخدم الكود في متجر Google Play لشراء التطبيقات والألعاب والاشتراكات.",
  },
  {
    keywords: ["محفظة", "wallet", "رصيد", "balance"],
    answer:
      "محفظتك تظهر في الأعلى بجانب اسمك. لشحنها: أنشئ تذكرة دعم واطلب إضافة رصيد، أو تواصل مع الإدارة. يمكن للأدمن إضافة أو خصم رصيد من حسابك. استخدم المحفظة للدفع السريع عند الشراء.",
  },
];

export function findAnswer(query: string): string {
  const lower = query.toLowerCase();
  for (const item of knowledgeBase) {
    if (item.keywords.some((kw) => lower.includes(kw.toLowerCase()))) return item.answer;
  }
  return "مرحباً! أنا مساعد Ali Pro الذكي. يمكنني مساعدتك في: شحن البطاقات الرقمية (ببجي، ستيم، بلايستيشن، فري فاير)، خدمات السوشيال ميديا (انستغرام، تيك توك، يوتيوب)، طرق الدفع (زين كاش، كي كارد، فاست بي)، وإنشاء تذاكر الدعم. اكتب سؤالك وسأساعدك فوراً.";
}

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "مرحباً! أنا مساعد Ali Pro الذكي 🤖\nكيف يمكنني مساعدتك اليوم؟" },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input };
    const botMsg: Message = { role: "bot", text: findAnswer(input) };
    setMessages((m) => [...m, userMsg, botMsg]);
    setInput("");
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,.4)] transition hover:scale-105"
        >
          <Bot size={26} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[8px]">
            ✨
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 left-6 z-[90] flex h-[500px] max-h-[80vh] w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">مساعد Ali Pro الذكي</p>
                <p className="text-[10px] text-emerald-400">متصل الآن</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                    msg.role === "user"
                      ? "bg-white/[.06] text-slate-200"
                      : "bg-emerald-400/10 text-emerald-100 border border-emerald-400/20"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick suggestions */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {["كيف أشحن شدات ببجي؟", "طرق الدفع", "كيف أنشئ تذكرة دعم؟", "شحن محفظتي"].map(
                (q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                    }}
                    className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[11px] text-slate-300 hover:border-emerald-400/30 hover:text-emerald-300"
                  >
                    {q}
                  </button>
                ),
              )}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="اكتب سؤالك..."
              className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm text-white outline-none focus:border-emerald-400/40"
              dir="rtl"
            />
            <button
              onClick={send}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
