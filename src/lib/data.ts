import { supabase } from "@/lib/supabase";
import type { Banner, Order, Product, Profile, SupportTicket, TicketReply } from "@/types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data ? ({ ...data, is_admin: false } as Profile) : null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const [{ data, error }, roles] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
  ]);
  if (error) throw error;
  const admins = new Set((roles.data ?? []).map((r) => r.user_id));
  return (data ?? []).map((p) => ({ ...p, is_admin: admins.has(p.id) })) as Profile[];
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("category")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function saveProduct(input: Partial<Product>): Promise<void> {
  const payload = {
    name: input.name ?? "",
    name_ar: input.name_ar ?? "",
    category: input.category ?? "digital_cards",
    price_iqd: input.price_iqd ?? 0,
    description: input.description ?? "",
    icon: input.icon ?? "",
    image_url: input.image_url ?? "",
    available: input.available ?? true,
    sort_order: input.sort_order ?? 0,
  };
  const { error } = input.id
    ? await supabase.from("products").update(payload).eq("id", input.id)
    : await supabase.from("products").insert(payload);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function getBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as Banner[];
}

export async function getAllBanners(): Promise<Banner[]> {
  const { data, error } = await supabase.from("banners").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as Banner[];
}

export async function getOrders(userId?: string): Promise<Order[]> {
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Order[];
}

export async function getTickets(userId?: string): Promise<SupportTicket[]> {
  let query = supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as SupportTicket[];
}

export async function getReplies(ticketId: string): Promise<TicketReply[]> {
  const { data, error } = await supabase
    .from("ticket_replies")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as TicketReply[];
}

/** صورة الحساب الشخصي: نرفعها إلى مساحة avatars العامة ثم نعود للمرفقات عند الفشل */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "png";
  const fileName = `${userId}/avatar-${Date.now()}.${safeExt}`;

  try {
    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (error) throw error;
    const publicUrl = supabase.storage.from("avatars").getPublicUrl(fileName).data.publicUrl;
    if (publicUrl) return publicUrl;
  } catch {
    /* نجرّب مساحة المرفقات */
  }

  const { error } = await supabase.storage
    .from("attachments")
    .upload(fileName, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return `attachments/${fileName}`;
}
