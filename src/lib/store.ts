/**
 * طبقة البيانات: كل العمليات تُخزَّن بشكل دائم في قاعدة بيانات Lovable Cloud.
 * لا يوجد أي تخزين محلي مؤقت — كل شيء يظهر لكل الأجهزة وللإدارة.
 */
import { supabase } from "@/lib/supabase";
import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import type { AppNotification, Deposit, DepositGateway, Order, OrderStatus } from "@/types";

/* ------------------------------------------------------------------ ملفات */

const BUCKET_RECEIPTS = "deposits";
const BUCKET_ATTACHMENTS = "unban_requests";

function safeExt(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "png";
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : "png";
}

/**
 * يرفع الملف إلى التخزين — وإن فشل الرفع يعيد نصاً فارغاً
 * حتى لا يتعطّل إرسال الطلب نفسه.
 */
async function uploadTo(
  bucket: string,
  userId: string,
  file: File | null | undefined,
): Promise<string> {
  if (!file) return "";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt(file.name)}`;
  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) {
      console.warn(`[upload] ${bucket} failed`, error.message);
      return "";
    }
    return `${bucket}/${path}`;
  } catch (error) {
    console.warn(`[upload] ${bucket} failed`, error);
    return "";
  }
}

export const uploadReceipt = (userId: string, file: File | null | undefined) =>
  uploadTo(BUCKET_RECEIPTS, userId, file);
export const uploadAttachment = (userId: string, file: File | null | undefined) =>
  uploadTo(BUCKET_ATTACHMENTS, userId, file);

/** تحويل المرجع المخزّن إلى رابط مؤقت قابل للعرض */
export async function fileUrl(stored: string): Promise<string> {
  if (!stored) return "";
  if (/^(https?:|data:|blob:)/i.test(stored)) return stored;
  const [bucket, ...rest] = stored.split("/");
  if (!bucket || !rest.length) return "";
  const { data } = await supabase.storage.from(bucket).createSignedUrl(rest.join("/"), 60 * 60);
  return data?.signedUrl ?? "";
}

/* ---------------------------------------------------------- تسجيل الأخطاء */

/**
 * تسجيل الأخطاء بشكل غير حاجب (non-blocking) — لا يعطّل الواجهة ولا يرمي استثناءً،
 * ويصلح للاستخدام داخل معالجات catch دون التأثير على تجربة المستخدم.
 */
export function logError(scope: string, error: unknown): void {
  void Promise.resolve().then(() => {
    console.error(`[apm:${scope}]`, errorMessage(error));
  });
}

type MinimalDbError = { message?: string | null; code?: string | null; details?: string | null };

/** هل الخطأ ناتج عن عمود غير موجود في المخطط (نسخة قاعدة بيانات قديمة)؟ */
function isUndefinedColumnError(error: MinimalDbError): boolean {
  const text = [error.message, error.code, error.details].filter(Boolean).join(" ");
  return /42703|pgrst204|column .* does not exist|could not find the '.*' column/i.test(text);
}

/* ------------------------------------------------------- حدود المحاولات */

export async function checkRateLimit(
  action: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    _action: action,
    _max: max,
    _window_seconds: windowSeconds,
  });
  if (error) return true;
  return data !== false;
}

/* ------------------------------------------------------------- إشعارات */

export async function addNotification(input: {
  userId: string;
  title: string;
  message: string;
  kind?: "success" | "error" | "info";
}): Promise<void> {
  const title = sanitizeText(input.title, 120);
  const message = sanitizeText(input.message, 500);
  await supabase.from("notifications").insert({
    user_id: input.userId,
    audience: "user",
    title,
    message,
    kind: input.kind ?? "info",
  });
  void pushSafely({ userIds: [input.userId], title, message });
}

export async function notifyAdmin(title: string, message: string): Promise<void> {
  const cleanTitle = sanitizeText(title, 120);
  const cleanMessage = sanitizeText(message, 500);
  await supabase.from("notifications").insert({
    user_id: null,
    audience: "admin",
    title: cleanTitle,
    message: cleanMessage,
    kind: "info",
  });
  void pushSafely({ toAdmins: true, title: cleanTitle, message: cleanMessage });
}

/** إشعار فوري (OneSignal) — يُتجاهل بهدوء إذا لم تُضبط المفاتيح بعد */
async function pushSafely(input: {
  userIds?: string[];
  toAdmins?: boolean;
  title: string;
  message: string;
}) {
  try {
    const { sendPush } = await import("@/lib/push.functions");
    await sendPush({ data: input });
  } catch {
    /* الإشعارات الفورية غير مهيأة */
  }
}

export async function listNotifications(
  userId: string,
  includeAdmin = false,
): Promise<AppNotification[]> {
  const query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);
  const { data } = includeAdmin
    ? await query.or(`user_id.eq.${userId},audience.eq.admin`)
    : await query.eq("user_id", userId);
  return (data ?? []) as unknown as AppNotification[];
}

export async function markNotificationsRead(userId: string, includeAdmin = false): Promise<void> {
  if (includeAdmin) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("audience", "admin")
      .eq("read", false);
  }
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

/* --------------------------------------------------------------- طلبات */

export type PurchaseInput = {
  productId: string | null;
  productName: string;
  category: "digital_cards" | "social_media";
  kind?: "service" | "account";
  targetLink?: string;
  quantity?: number;
  unitPrice: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  marketAccountId?: string | null;
};

/** شراء بالمحفظة: يخصم الرصيد وينشئ الطلب في عملية واحدة آمنة */
export async function purchaseWithWallet(input: PurchaseInput): Promise<Order> {
  const { data, error } = await supabase.rpc("purchase_with_wallet", {
    _product_id: (input.productId ?? null) as unknown as string,
    _product_name: sanitizeText(input.productName, 160),
    _category: input.category,
    _kind: input.kind ?? "service",
    _target_link: sanitizeUrl(input.targetLink ?? ""),
    _quantity: Math.max(1, Math.floor(input.quantity ?? 1)),
    _unit_price: input.unitPrice,
    _buyer_name: sanitizeText(input.buyerName, 80),
    _buyer_phone: sanitizeText(input.buyerPhone, 30),
    _buyer_email: sanitizeText(input.buyerEmail, 120),
    _market_account_id: (input.marketAccountId ?? null) as unknown as string,
  });
  if (error) throw new Error(translateError(error.message));
  return data as unknown as Order;
}

/** يُحفظ للتوافق مع الاستدعاءات القديمة */
export const createOrder = purchaseWithWallet;

export async function listOrders(userId?: string): Promise<Order[]> {
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Order[];
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  extra?: { admin_note?: string; code?: string; credentials?: string; estimated_minutes?: number },
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      ...(extra?.admin_note !== undefined
        ? { admin_note: sanitizeText(extra.admin_note, 500) }
        : {}),
      ...(extra?.code !== undefined ? { code: sanitizeText(extra.code, 200) } : {}),
      ...(extra?.credentials !== undefined
        ? { credentials: sanitizeText(extra.credentials, 1000) }
        : {}),
      ...(extra?.estimated_minutes !== undefined
        ? { estimated_minutes: Math.max(0, Math.round(extra.estimated_minutes)) }
        : {}),
      ...(status === "processing" ? { started_at: now } : {}),
      ...(status === "completed" ? { completed_at: now } : {}),
    } as never)
    .eq("id", id);
  if (error) throw error;
}

/* --------------------------------------------------------------- إيداع */

export async function createDeposit(input: {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  gateway: DepositGateway;
  gatewayLabel: string;
  amount: number;
  receiptUrl: string;
  senderNote: string;
}): Promise<Deposit> {
  const allowed = await checkRateLimit("deposit", 3, 300);
  if (!allowed) throw new Error("لقد أرسلت عدة طلبات إيداع بسرعة. انتظر قليلاً ثم حاول مرة أخرى.");
  const { data, error } = await supabase
    .from("deposit_requests")
    .insert({
      user_id: input.userId,
      user_name: sanitizeText(input.userName, 80),
      user_email: sanitizeText(input.userEmail, 120),
      user_phone: sanitizeText(input.userPhone, 30),
      gateway: input.gateway,
      gateway_label: sanitizeText(input.gatewayLabel, 60),
      amount_iqd: input.amount,
      receipt_url: input.receiptUrl,
      sender_note: sanitizeText(input.senderNote, 500),
      notes: sanitizeText(input.senderNote, 500),
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Deposit;
}

export async function listDeposits(userId?: string): Promise<Deposit[]> {
  let query = supabase
    .from("deposit_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Deposit[];
}

/** موافقة/رفض الإيداع: يضيف الرصيد للمحفظة فوراً عند الموافقة */
export async function reviewDeposit(
  depositId: string,
  approve: boolean,
  note = "",
): Promise<number | null> {
  const { data, error } = await supabase.rpc("review_deposit", {
    _deposit_id: depositId,
    _approve: approve,
    _note: sanitizeText(note, 300),
  });
  if (error) throw new Error(translateError(error.message));
  return (data as number | null) ?? null;
}

export const updateDepositStatus = (id: string, status: "approved" | "rejected", note = "") =>
  reviewDeposit(id, status === "approved", note);

/* --------------------------------------------------------------- التذاكر */

export type TicketReviewAction = "approve" | "reopen" | "close" | "delete";

/**
 * مراجعة تذكرة دعم من الإدارة (موافقة/إعادة فتح/إغلاق/حذف).
 * تعتمد على دالة آمنة في قاعدة البيانات (`review_support_ticket`) تتجاوز
 * قيود RLS، وإن لم تكن مثبّتة بعد تعمل مباشرة على الجدول كحل احتياطي.
 */
export async function reviewSupportTicket(
  ticketId: string,
  action: TicketReviewAction,
): Promise<void> {
  const { error } = await supabase.rpc("review_support_ticket", {
    _ticket_id: ticketId,
    _action: action,
  });
  if (!error) return;

  const isSchemaError = /could not find the function|pgrst202|schema cache|404/i.test(
    [error.message, error.code ?? "", error.details ?? ""].join(" "),
  );
  if (!isSchemaError) throw new Error(translateError(error.message));

  if (action === "delete") {
    await supabase.from("ticket_replies").delete().eq("ticket_id", ticketId);
    const { error: delError } = await supabase.from("support_tickets").delete().eq("id", ticketId);
    if (delError) throw new Error(translateError(delError.message));
    return;
  }

  const patch =
    action === "close"
      ? { status: "closed", closed_at: new Date().toISOString() }
      : { status: "open", approved_at: new Date().toISOString(), closed_at: null };
  const { data, error: updError } = await supabase
    .from("support_tickets")
    .update(patch as never)
    .eq("id", ticketId)
    .select("id");
  if (updError) throw new Error(translateError(updError.message));
  if (!data || data.length === 0) {
    throw new Error("تعذّر تحديث التذكرة — تأكد من صلاحيات حساب الإدارة.");
  }
}

/* --------------------------------------------------------- فتح الباند */

export type UnbanAppealInput = {
  userId: string;
  reason: string;
  contactPhone?: string;
  attachmentUrl?: string;
};

/**
 * إرسال طلب فك باند إلى قاعدة البيانات بشكل موحّد.
 * يخزّن المرفق في `attachment_url` (المخطط الحالي)، مع رجوع تلقائي إلى
 * `proof_image_url` لقواعد البيانات الأقدم، ويرمي خطأً واضحاً عند الفشل.
 */
export async function submitUnbanAppeal(input: UnbanAppealInput): Promise<void> {
  const reason = sanitizeText(input.reason, 1800);
  const contactPhone = sanitizeText(input.contactPhone ?? "", 30);
  const attachmentUrl = input.attachmentUrl ?? "";

  const { error } = await supabase.from("unban_appeals").insert({
    user_id: input.userId,
    reason,
    contact_phone: contactPhone,
    attachment_url: attachmentUrl,
  });
  if (!error) return;

  if (isUndefinedColumnError(error)) {
    // قاعدة بيانات قديمة تخزّن المرفق في proof_image_url بدل attachment_url.
    const { error: legacyError } = await supabase.from("unban_appeals").insert({
      user_id: input.userId,
      reason,
      contact_phone: contactPhone,
      proof_image_url: attachmentUrl,
    });
    if (!legacyError) return;
    logError("submitUnbanAppeal.legacy", legacyError);
    throw new Error(translateError(errorMessage(legacyError)));
  }

  logError("submitUnbanAppeal", error);
  throw new Error(translateError(errorMessage(error)));
}

/* -------------------------------------------------------------- المحفظة */

export async function adjustWallet(
  userId: string,
  amount: number,
  reason = "تعديل إداري",
): Promise<number> {
  const { data, error } = await supabase.rpc("admin_adjust_wallet", {
    _user_id: userId,
    _amount: amount,
    _reason: sanitizeText(reason, 200),
  });
  if (!error) return data as number;

  // Fallback: if the RPC is missing or ambiguous in the database (schema error), update the profile directly.
  const isSchemaError =
    /could not find the function|could not choose the best candidate function|pgrst202|pgrst203|schema cache|404/i.test(
      [error.message, error.code ?? "", error.details ?? ""].join(" "),
    );
  if (!isSchemaError) throw new Error(translateError(error.message));

  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("wallet_balance_iqd")
    .eq("id", userId)
    .single();
  if (profErr) throw new Error(translateError(errorMessage(profErr)));

  const newBalance = Math.max(0, Number(prof?.wallet_balance_iqd ?? 0) + amount);
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ wallet_balance_iqd: newBalance })
    .eq("id", userId);
  if (updErr) throw new Error(translateError(updErr.message));

  // Best-effort transaction log; ignore failures so the adjustment still succeeds.
  await supabase
    .from("wallet_transactions")
    .insert({
      user_id: userId,
      amount: amount,
      amount_iqd: amount,
      transaction_type: "purchase",
      balance_after: newBalance,
      reason: sanitizeText(reason, 200),
    })
    .then(({ error: txErr }) => {
      if (txErr) console.warn("wallet_transactions log failed:", txErr.message);
    });

  return newBalance;
}

/**
 * إيداع مباشر من الإدارة: يسجّل طلب إيداع بحالة "approved" ثم يضمن إضافة الرصيد
 * فوراً إلى المحفظة حتى لو تأخرت المشغلات (triggers) في قاعدة البيانات.
 */
export async function adminDirectDeposit(
  target: {
    id: string;
    full_name?: string;
    email?: string;
    phone?: string;
    wallet_balance_iqd?: number;
  },
  amount: number,
  reason = "إيداع مباشر من الإدارة",
): Promise<number> {
  if (!amount || amount <= 0) throw new Error("أدخل مبلغاً صحيحاً");

  const { data: before } = await supabase
    .from("profiles")
    .select("wallet_balance_iqd")
    .eq("id", target.id)
    .maybeSingle();
  const startingBalance = Number(before?.wallet_balance_iqd ?? target.wallet_balance_iqd ?? 0);

  // 1) سجل الإيداع (لا نفشل العملية إن منعت الصلاحيات الإدراج)
  const { error: depErr } = await supabase.from("deposit_requests").insert({
    user_id: target.id,
    user_name: sanitizeText(target.full_name ?? "", 80),
    user_email: sanitizeText(target.email ?? "", 120),
    user_phone: sanitizeText(target.phone ?? "", 30),
    gateway: "admin",
    gateway_label: "إيداع مباشر من الإدارة",
    amount_iqd: amount,
    receipt_url: "",
    sender_note: sanitizeText(reason, 500),
    status: "approved",
    admin_note: sanitizeText(reason, 300),
    reviewed_at: new Date().toISOString(),
  });
  if (depErr) console.warn("admin deposit record failed:", depErr.message);

  // 2) إضافة الرصيد عبر الدالة الآمنة
  let newBalance = startingBalance;
  try {
    newBalance = await adjustWallet(target.id, amount, reason);
  } catch (e) {
    console.warn("admin_adjust_wallet failed, using direct fallback:", e);
  }

  // 3) ضمان احتياطي: تأكد أن الرصيد زاد فعلاً وإلا حدّث الملف مباشرة
  const { data: after } = await supabase
    .from("profiles")
    .select("wallet_balance_iqd")
    .eq("id", target.id)
    .maybeSingle();
  const current = Number(after?.wallet_balance_iqd ?? newBalance);
  if (current < startingBalance + amount) {
    const fixed = startingBalance + amount;
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ wallet_balance_iqd: fixed })
      .eq("id", target.id);
    if (updErr) throw new Error(translateError(updErr.message));
    return fixed;
  }
  return current;
}

export async function listWalletTransactions(userId?: string) {
  let query = supabase
    .from("wallet_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (userId) query = query.eq("user_id", userId);
  const { data } = await query;
  return data ?? [];
}

/* ------------------------------------------------------- سوق الحسابات */

export type MarketAccount = {
  id: string;
  platform: string;
  title: string;
  description: string;
  followers: number;
  price_iqd: number;
  image_url: string;
  sold: boolean;
  sold_to: string | null;
  created_at: string;
};

export async function listMarketAccounts(): Promise<MarketAccount[]> {
  const { data, error } = await supabase
    .from("market_accounts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MarketAccount[];
}

export async function saveMarketAccount(
  input: Partial<MarketAccount> & { credentials?: string },
): Promise<string> {
  const payload = {
    platform: sanitizeText(input.platform ?? "instagram", 30),
    title: sanitizeText(input.title ?? "", 160),
    description: sanitizeText(input.description ?? "", 1000),
    followers: Math.max(0, Math.floor(input.followers ?? 0)),
    price_iqd: Math.max(0, Math.floor(input.price_iqd ?? 0)),
    image_url: sanitizeUrl(input.image_url ?? ""),
  };
  let id = input.id;
  if (id) {
    const { error } = await supabase.from("market_accounts").update(payload).eq("id", id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("market_accounts")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
  }
  if (input.credentials !== undefined && id) {
    const { error } = await supabase
      .from("market_account_secrets")
      .upsert({ account_id: id, credentials: sanitizeText(input.credentials, 2000) });
    if (error) throw error;
  }
  return id!;
}

export async function deleteMarketAccount(id: string): Promise<void> {
  const { error } = await supabase.from("market_accounts").delete().eq("id", id);
  if (error) throw error;
}

/** بيانات الدخول: تظهر للأدمن، وللمشتري فقط بعد إتمام الشراء */
export async function getMarketCredentials(accountId: string): Promise<string> {
  const { data } = await supabase
    .from("market_account_secrets")
    .select("credentials")
    .eq("account_id", accountId)
    .maybeSingle();
  return data?.credentials ?? "";
}

/* ------------------------------------------------------ أجهزة الإشعارات */

export async function savePushDevice(userId: string, playerId: string): Promise<void> {
  await supabase
    .from("push_devices")
    .upsert({ user_id: userId, player_id: playerId }, { onConflict: "player_id" });
}

/* --------------------------------------------------------------- أدوات */

/**
 * استخراج نص الخطأ الحقيقي (من Supabase أو غيره) لعرضه كما هو في التنبيهات —
 * بدون رسائل عامة تخفي سبب المشكلة.
 */
export function errorMessage(err: unknown): string {
  if (!err) return "خطأ غير معروف";
  if (typeof err === "string") return err;
  const anyErr = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
  const parts = [anyErr.message, anyErr.details, anyErr.hint].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  if (parts.length) {
    const code = typeof anyErr.code === "string" && anyErr.code ? ` [${anyErr.code}]` : "";
    return parts.join(" — ") + code;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("insufficient")) return "رصيدك غير كافٍ لإتمام هذه العملية.";
  if (m.includes("rate") || m.includes("too many")) return "محاولات كثيرة بوقت قصير. انتظر قليلاً.";
  if (m.includes("forbidden")) return "ليست لديك صلاحية لتنفيذ هذه العملية.";
  if (m.includes("banned")) return "حسابك موقوف. تواصل مع الدعم.";
  if (m.includes("sold")) return "تم بيع هذا الحساب بالفعل.";
  if (m.includes("voucher") || m.includes("code")) return "الكود غير صحيح أو مستخدم مسبقاً.";
  return message;
}
