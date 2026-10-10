import { supabase } from "@/lib/supabase";
import { findAnswer } from "@/components/AIAssistant";

export type AgentMessage = { role: "user" | "assistant"; text: string };

/** Asks the AI support agent (Supabase edge function). Falls back to the local knowledge base if unavailable. */
export async function askAgent(
  history: AgentMessage[],
): Promise<{ text: string; source: "ai" | "local" }> {
  try {
    const { data, error } = await supabase.functions.invoke("support-agent", {
      body: { messages: history },
    });
    const reply = (data as { reply?: string } | null)?.reply;
    if (!error && reply) return { text: reply, source: "ai" };
  } catch {
    /* fall through to local answers */
  }
  const last = [...history].reverse().find((m) => m.role === "user")?.text ?? "";
  return { text: findAnswer(last), source: "local" };
}
