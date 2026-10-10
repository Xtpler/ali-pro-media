/* إعدادات الموقع: الشريط الإعلاني، كروت الشحن، روابط الدعم */
import { supabase } from "@/lib/supabase";
import { sanitizeText, translateVoucherError } from "@/lib/site-helpers";

export type Voucher = {
  id: string;
  code: string;
  amount_iqd: number;
  active: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
};

export type Announcement = { text: string; active: boolean };

export const SUPPORT_PHONE = "07875277440";

export const SUPPORT_LINKS = {
  whatsapp: "https://wa.me/9647875277440",
  telegram: "https://t.me/+9647875277440",
  phone: "tel:+9647875277440",
};

/* ---------------- الشريط الإعلاني ---------------- */

export const DEFAULT_ANNOUNCEMENT: Announcement = {
  text: "مرحباً بك في Ali Pro Media — خدمات سوشيال ميديا وبطاقات رقمية بأسعار منافسة وتسليم سريع.",
  active: true,
};

export async function getAnnouncement(): Promise<Announcement> {
  const { data } = await supabase
    .from("announcements")
    .select("message, active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return DEFAULT_ANNOUNCEMENT;
  return { text: data.message, active: data.active };
}

export async function setAnnouncement(next: Announcement): Promise<void> {
  const { data } = await supabase
    .from("announcements")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const payload = { message: sanitizeText(next.text, 300), active: next.active };
  const { error } = data
    ? await supabase.from("announcements").update(payload).eq("id", data.id)
    : await supabase.from("announcements").insert(payload);
  if (error) throw error;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("apm-site"));
}

/* ---------------- كروت الشحن ---------------- */

export function randomVoucherCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `APM-${part()}-${part()}`;
}

export async function listVouchers(): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Voucher[];
}

export async function createVoucher(amount: number, code?: string): Promise<Voucher> {
  const { data, error } = await supabase
    .from("vouchers")
    .insert({
      code: (sanitizeText(code ?? "", 40) || randomVoucherCode()).toUpperCase(),
      amount_iqd: Math.max(0, Math.floor(amount)),
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Voucher;
}

export async function deleteVoucher(id: string): Promise<void> {
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  if (error) throw error;
}

export type RedeemResult = { ok: true; amount: number } | { ok: false; error: string };

export async function redeemVoucher(rawCode: string): Promise<RedeemResult> {
  const code = sanitizeText(rawCode, 40).toUpperCase();
  if (!code) return { ok: false, error: "يرجى إدخال كود الكارت." };
  const { data, error } = await supabase.rpc("redeem_voucher", { _code: code });
  if (error) return { ok: false, error: translateVoucherError(error.message) };
  return { ok: true, amount: Number(data ?? 0) };
}
