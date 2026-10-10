// Support AI agent. Deploy: supabase functions deploy support-agent
// Secret required: supabase secrets set ANTHROPIC_API_KEY=...  (optional: SUPPORT_AGENT_MODEL)
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `أنت "مساعد Ali Pro" وكيل الدعم الذكي لمتجر Ali Pro Media للخدمات الرقمية في العراق.
تساعد الزبائن في: خدمات السوشيال ميديا، سوق الحسابات، البطاقات الإلكترونية، فتح الباند، شحن المحفظة، حالة الطلبات.
القواعد: أجب بالعربية بلهجة مهذبة وواضحة وباختصار (٣-٦ أسطر). لا تطلب كلمات المرور أبداً. لا تَعِد باسترجاع أموال ولا تؤكد حالة طلب محدد لأنك لا ترى بياناتهم.
إذا كانت المشكلة تحتاج تدخل الإدارة (دفع، طلب متأخر، حساب محظور، شكوى) فاطلب منه فتح تذكرة دعم من تبويب "تذاكري" وسيتم فتح المحادثة مع الإدارة بعد الموافقة عليها.
لا تخترع أسعاراً أو مدداً غير مذكورة. إن لم تعرف قل ذلك بصراحة.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  try {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    // Not configured: reply null so the app quietly uses its built-in answers instead of erroring.
    if (!key) return json({ reply: null, configured: false });
    const { messages } = await req.json();
    if (!Array.isArray(messages)) return json({ error: "bad_request" }, 400);
    const clean = messages
      .filter(
        (m: { role?: string; text?: string }) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.text === "string" &&
          m.text.trim(),
      )
      .slice(-10)
      .map((m: { role: string; text: string }) => ({
        role: m.role,
        content: m.text.slice(0, 1000),
      }));
    if (!clean.length || clean[clean.length - 1].role !== "user")
      return json({ error: "bad_request" }, 400);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("SUPPORT_AGENT_MODEL") ?? "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: SYSTEM,
        messages: clean,
      }),
    });
    if (!res.ok) return json({ error: "upstream_error" }, 502);
    const data = await res.json();
    const reply = (data.content ?? [])
      .map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return json({ reply: reply || null });
  } catch {
    return json({ error: "server_error" }, 500);
  }
});
