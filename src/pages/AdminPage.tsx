import { useEffect, useRef, useState } from "react";
import {
  Ban,
  Check,
  Edit3,
  Gift,
  ImagePlus,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  Megaphone,
  Minus,
  Package,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Users,
  Wallet,
  X,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getAllBanners,
  getAllProfiles,
  getProducts,
  getReplies,
  getTickets,
  saveProduct as saveProductApi,
  deleteProduct as deleteProductApi,
} from "@/lib/data";
import {
  addNotification,
  adjustWallet,
  adminDirectDeposit,
  errorMessage,
  fileUrl,
  listDeposits,
  listOrders,
  logError,
  reviewDeposit,
  reviewSupportTicket,
  updateOrderStatus,
  uploadAttachment,
} from "@/lib/store";
import {
  getAnnouncement,
  setAnnouncement,
  listVouchers,
  createVoucher,
  deleteVoucher,
  type Voucher,
} from "@/lib/site";
import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import { Attachment, ImageLightbox } from "@/components/Attachment";
import { toast } from "sonner";
import { formatDate, formatIQD } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { SupportWaiting } from "@/components/SupportWaiting";
import { hasAdminAccess, isMasterAdminEmail, MASTER_ADMIN_EMAIL } from "@/lib/constants";
import { setAdminRole } from "@/lib/roles.functions";
import type {
  Banner,
  Deposit,
  Order,
  OrderStatus,
  Product,
  Profile,
  SupportTicket,
  TicketReply,
} from "@/types";
import { Page, StatusPill } from "@/pages/OrdersPage";
import { AdBoard } from "@/components/AdBoard";
import { expectedMinutes, formatDuration } from "@/lib/orderProgress";
import { AdminAccounts } from "@/components/AdminAccounts";
import { AdminAnalytics } from "@/components/AdminAnalytics";

type Tab =
  | "orders"
  | "deposits"
  | "products"
  | "accounts"
  | "banners"
  | "tickets"
  | "users"
  | "vouchers"
  | "site"
  | "unban";

type UnbanAppeal = {
  id: string;
  user_id: string;
  reason: string;
  contact_phone: string;
  attachment_url?: string | null;
  status: string;
  created_at: string;
};
const emptyProduct = {
  name: "",
  name_ar: "",
  category: "digital_cards" as const,
  price_iqd: 0,
  description: "",
  icon: "CreditCard",
  available: true,
  sort_order: 1,
};
const emptyBanner = {
  title: "",
  subtitle: "",
  badge_text: "منصة موثوقة - تسليم فوري",
  image_url: "",
  cta_text: "اطلب الآن",
  link_url: "",
  active: true,
  sort_order: 1,
};
const STATUS_OPTIONS: [OrderStatus, string][] = [
  ["pending", "قيد الانتظار"],
  ["approved", "تمت الموافقة"],
  ["processing", "قيد التنفيذ"],
  ["completed", "مكتمل"],
  ["cancelled", "ملغى"],
  ["rejected", "مرفوض"],
];

export function AdminPage() {
  const { user, profile } = useAuth();
  const canAccessAdmin = hasAdminAccess(user, profile);
  const [tab, setTab] = useState<Tab>("orders");
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [announcement, setAnnouncementState] = useState<{ text: string; active: boolean }>({
    text: "",
    active: true,
  });
  const [depositReceipts, setDepositReceipts] = useState<Record<string, string>>({});
  const [productForm, setProductForm] = useState<{
    id?: string;
    name: string;
    name_ar: string;
    category: "digital_cards" | "social_media";
    price_iqd: number;
    description: string;
    icon: string;
    available: boolean;
    sort_order: number;
  }>(emptyProduct);
  const [bannerForm, setBannerForm] = useState<typeof emptyBanner>(emptyBanner);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [adminReply, setAdminReply] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [walletEdit, setWalletEdit] = useState<{ target: Profile; amount: string } | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [reviewingDep, setReviewingDep] = useState<string | null>(null);
  const [orderDelivery, setOrderDelivery] = useState<{
    order: Order;
    code: string;
    credentials: string;
  } | null>(null);
  const [lightbox, setLightbox] = useState("");
  const [etaDraft, setEtaDraft] = useState<Record<string, string>>({});
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [replyBusy, setReplyBusy] = useState(false);
  const [voucherAmount, setVoucherAmount] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [appeals, setAppeals] = useState<UnbanAppeal[]>([]);
  const replyFileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [p, b, o, d, t, u, v, a, appealResult] = await Promise.all([
      getProducts().catch(() => []),
      getAllBanners().catch(() => []),
      listOrders().catch(() => []),
      listDeposits().catch(() => []),
      getTickets().catch(() => []),
      getAllProfiles().catch(() => []),
      listVouchers().catch(() => []),
      getAnnouncement().catch(() => ({ text: "", active: true })),
      (async () => {
        const { data } = await supabase
          .from("unban_appeals")
          .select("*")
          .order("created_at", { ascending: false });
        return (data ?? []) as UnbanAppeal[];
      })().catch(() => [] as UnbanAppeal[]),
    ]);
    setProducts(p);
    setBanners(b);
    setOrders(o);
    setDeposits(d);
    setTickets(t);
    setProfiles(u);
    setVouchers(v);
    setAnnouncementState(a);
    setAppeals(appealResult);
  };
  useEffect(() => {
    if (!canAccessAdmin) return;
    load();
    const handler = () => load();
    window.addEventListener("apm-notifications", handler);
    const timer = window.setInterval(load, 15000);
    return () => {
      window.removeEventListener("apm-notifications", handler);
      window.clearInterval(timer);
    };
  }, [canAccessAdmin]);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        deposits.map(
          async (d) =>
            [d.id, d.receipt_url ? await fileUrl(d.receipt_url).catch(() => "") : ""] as const,
        ),
      );
      setDepositReceipts(Object.fromEntries(entries));
    })();
  }, [deposits]);

  useEffect(() => {
    if (selectedTicket)
      getReplies(selectedTicket.id)
        .then(setReplies)
        .catch(() => setReplies([]));
    else setReplies([]);
  }, [selectedTicket]);

  if (!canAccessAdmin) {
    return (
      <Page title="لوحة الأدمن" subtitle="صلاحيات محدودة">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center">
          <ShieldAlert className="mx-auto text-red-300" size={40} />
          <p className="mt-4 font-bold text-white">ليس لديك صلاحية الوصول</p>
        </div>
      </Page>
    );
  }

  const profileFor = (userId: string, fallbackName = "", fallbackEmail = ""): Profile =>
    profiles.find((p) => p.id === userId) ?? {
      id: userId,
      email: fallbackEmail,
      full_name: fallbackName,
      phone: "",
      wallet_balance_iqd: 0,
      is_admin: false,
      is_super_admin: false,
      is_banned: false,
      is_restricted: false,
      avatar_url: "",
      created_at: new Date().toISOString(),
    };

  /* ------- Deposits queue ------- */
  const decideDeposit = async (deposit: Deposit, approve: boolean) => {
    if (reviewingDep) return;
    setReviewingDep(deposit.id);
    try {
      await reviewDeposit(deposit.id, approve);
      addNotification({
        userId: deposit.user_id,
        title: approve ? "تمت إضافة رصيدك" : "تم رفض طلب الإيداع",
        message: `${deposit.gateway_label} · ${formatIQD(deposit.amount_iqd)}`,
        kind: approve ? "success" : "error",
      });
      toast.success(
        approve
          ? `تمت إضافة ${formatIQD(deposit.amount_iqd)} إلى محفظة المستخدم`
          : "تم رفض طلب الإيداع",
      );
      await load();
    } catch (e) {
      logError("admin.decideDeposit", e);
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setReviewingDep(null);
    }
  };

  /* ------- Orders queue ------- */
  const changeStatus = async (order: Order, status: OrderStatus) => {
    if (status === order.status) return;
    try {
      const minutes =
        Number(etaDraft[order.id]) || order.estimated_minutes || expectedMinutes(order);
      await updateOrderStatus(
        order.id,
        status,
        status === "processing" || status === "approved"
          ? { estimated_minutes: minutes }
          : undefined,
      );
      addNotification({
        userId: order.user_id,
        title:
          status === "completed"
            ? "اكتمل طلبك"
            : status === "processing"
              ? "بدأ تنفيذ طلبك"
              : "تحديث حالة طلبك",
        message: `${order.product_name} · ${STATUS_OPTIONS.find((s) => s[0] === status)?.[1] ?? status}${status === "processing" ? ` · المدة المتوقعة ${formatDuration(minutes)}` : ""}`,
        kind:
          status === "cancelled" || status === "rejected"
            ? "error"
            : status === "completed"
              ? "success"
              : "info",
      });
      toast.success("تم تحديث حالة الطلب وإشعار المستخدم");
      await load();
    } catch (e) {
      logError("admin.changeStatus", e);
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    }
  };

  const saveDelivery = async () => {
    if (!orderDelivery) return;
    try {
      await updateOrderStatus(orderDelivery.order.id, orderDelivery.order.status, {
        code: sanitizeText(orderDelivery.code, 200),
        credentials: sanitizeText(orderDelivery.credentials, 1000),
      });
      addNotification({
        userId: orderDelivery.order.user_id,
        title: "تم تسليم طلبك",
        message: orderDelivery.order.product_name,
        kind: "success",
      });
      toast.success("تم حفظ بيانات التسليم");
      setOrderDelivery(null);
      await load();
    } catch (e) {
      logError("admin.saveDelivery", e);
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    }
  };

  /* ------- Products / Banners ------- */
  const saveProduct = async () => {
    if (!productForm.name_ar || !productForm.price_iqd) return;
    try {
      await saveProductApi({
        id: editingProduct ?? undefined,
        name: sanitizeText(productForm.name, 120),
        name_ar: sanitizeText(productForm.name_ar, 120),
        category: productForm.category as "digital_cards" | "social_media",
        price_iqd: productForm.price_iqd,
        description: sanitizeText(productForm.description, 1000),
        icon: productForm.icon,
        available: productForm.available,
        sort_order: productForm.sort_order,
      } as Partial<Product>);
      setProductForm(emptyProduct);
      setEditingProduct(null);
      await load();
      toast.success("تم الحفظ");
    } catch (e) {
      logError("admin.saveProduct", e);
      toast.error(e instanceof Error ? e.message : "حدث خطأ أثناء الحفظ");
    }
  };
  const writeBanner = async (payload: Record<string, unknown>, id: string | null) => {
    const run = (body: Record<string, unknown>) =>
      id
        ? supabase
            .from("banners")
            .update(body as never)
            .eq("id", id)
        : supabase.from("banners").insert(body as never);
    let { error } = await run(payload);
    if (error && /column .*(link_url|badge_text)/i.test(error.message)) {
      const missing = /link_url/i.test(error.message) ? "link_url" : "badge_text";
      const { [missing]: _omit, ...rest } = payload;
      void _omit;
      toast.message(
        `الحقل "${missing === "link_url" ? "رابط الزر" : "نص الشارة"}" غير موجود في قاعدة البيانات بعد — تم الحفظ بدونه.`,
      );
      ({ error } = await run(rest));
    }
    if (error) throw new Error(error.message);
  };

  const saveBanner = async () => {
    if (!bannerForm.title || !bannerForm.image_url) return;
    const payload = {
      ...bannerForm,
      title: sanitizeText(bannerForm.title, 120),
      subtitle: sanitizeText(bannerForm.subtitle, 200),
      badge_text: sanitizeText(bannerForm.badge_text, 60),
      image_url: sanitizeUrl(bannerForm.image_url),
      cta_text: sanitizeText(bannerForm.cta_text, 40),
      link_url: bannerForm.link_url ? sanitizeUrl(bannerForm.link_url) : "",
      sort_order: Number(bannerForm.sort_order) || 1,
    };
    try {
      await writeBanner(payload, editingBanner);
      setBannerForm(emptyBanner);
      setEditingBanner(null);
      await load();
      toast.success("تم حفظ البنر");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر حفظ البنر");
    }
  };
  const toggleBannerActive = async (b: Banner) => {
    try {
      await writeBanner({ active: !b.active }, b.id);
      await load();
      toast.success(b.active ? "تم إيقاف البنر" : "تم تفعيل البنر");
    } catch (e) {
      logError("admin.toggleBannerActive", e);
      toast.error(e instanceof Error ? e.message : "تعذّر تغيير الحالة");
    }
  };
  const removeProduct = async (id: string) => {
    try {
      await deleteProductApi(id);
      await load();
      toast.success("تم حذف المنتج");
    } catch (e) {
      logError("admin.removeProduct", e);
      toast.error(e instanceof Error ? e.message : "تعذّر حذف المنتج");
    }
  };
  const removeBanner = async (id: string) => {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) {
      logError("admin.removeBanner", error);
      toast.error(errorMessage(error));
      return;
    }
    await load();
    toast.success("تم حذف البنر");
  };

  /* ------- Tickets ------- */
  const sendAdminReply = async () => {
    if (!selectedTicket || !profile?.id || (!adminReply.trim() && !replyFile)) return;
    setReplyBusy(true);
    try {
      const imageUrl = replyFile ? await uploadAttachment(profile.id, replyFile) : "";
      const { error } = await supabase.from("ticket_replies").insert({
        ticket_id: selectedTicket.id,
        user_id: profile.id,
        message: sanitizeText(adminReply, 2000),
        image_url: imageUrl,
        is_admin_reply: true,
      });
      if (error) throw error;
      addNotification({
        userId: selectedTicket.user_id,
        title: "رد جديد من الدعم الفني",
        message: `${selectedTicket.subject}${adminReply ? ` · ${adminReply}` : ""}`,
        kind: "info",
      });
      setAdminReply("");
      setReplyFile(null);
      setReplies(await getReplies(selectedTicket.id).catch(() => []));
      toast.success("تم إرسال الرد");
    } catch (e) {
      logError("admin.sendAdminReply", e);
      toast.error(e instanceof Error ? e.message : "تعذر إرسال الرد");
    }
    setReplyBusy(false);
  };
  const closeTicket = async (t: SupportTicket) => {
    try {
      await reviewSupportTicket(t.id, "close");
      addNotification({
        userId: t.user_id,
        title: "تم إغلاق تذكرتك",
        message: t.subject,
        kind: "info",
      });
      toast.success("تم إغلاق المحادثة");
      await load();
      setSelectedTicket(null);
    } catch (e) {
      logError("admin.closeTicket", e);
      toast.error(e instanceof Error ? e.message : "تعذر إغلاق التذكرة");
    }
  };
  const approveTicket = async (t: SupportTicket, reopen = false) => {
    try {
      await reviewSupportTicket(t.id, reopen ? "reopen" : "approve");
      addNotification({
        userId: t.user_id,
        title: reopen ? "أُعيد فتح تذكرتك" : "تمت الموافقة على تذكرتك",
        message: `${t.subject} · المحادثة مع الإدارة مفتوحة الآن`,
        kind: "success",
      });
      toast.success(reopen ? "أُعيد فتح المحادثة" : "تمت الموافقة وفُتحت المحادثة");
      setSelectedTicket({ ...t, status: "open" });
      await load();
    } catch (e) {
      logError("admin.approveTicket", e);
      toast.error(e instanceof Error ? e.message : "تعذرت الموافقة على التذكرة");
    }
  };
  const deleteTicket = async (ticket: SupportTicket) => {
    if (!window.confirm(`حذف التذكرة "${ticket.subject}" نهائياً؟`)) return;
    try {
      await reviewSupportTicket(ticket.id, "delete");
      addNotification({
        userId: ticket.user_id,
        title: "تم حذف تذكرتك",
        message: ticket.subject,
        kind: "info",
      });
      toast.success("تم حذف التذكرة");
      setSelectedTicket(null);
      await load();
    } catch (e) {
      logError("admin.deleteTicket", e);
      toast.error(e instanceof Error ? e.message : "تعذر حذف التذكرة");
    }
  };

  /* ------- Users ------- */
  const isMaster = isMasterAdminEmail(profile?.email);
  const isSuperAdmin = Boolean(profile?.is_super_admin || isMaster);

  const toggleFlag = async (p: Profile, field: "is_banned" | "is_restricted") => {
    const patch: { is_banned?: boolean; is_restricted?: boolean } = { [field]: !p[field] };
    const { error } = await supabase.from("profiles").update(patch).eq("id", p.id);
    if (error) {
      logError("admin.toggleFlag", error);
      toast.error(errorMessage(error));
      return;
    }
    toast.success("تم التحديث");
    await load();
  };

  const toggleAdmin = async (p: Profile) => {
    if (!isMaster) {
      toast.error("صلاحية إدارة الرتب حصرية للمالك فقط");
      return;
    }
    if (isMasterAdminEmail(p.email)) {
      toast.error("لا يمكن تعديل صلاحية حساب المالك");
      return;
    }
    try {
      const result = await setAdminRole({ data: { userId: p.id, grant: !p.is_admin } });
      if (!result.ok) {
        if (result.reason === "forbidden") throw new Error("صلاحية إدارة الرتب حصرية للمالك فقط");
        if (result.reason === "protected") throw new Error("لا يمكن تعديل صلاحية حساب المالك");
        throw new Error("تعذّر تحديث الصلاحية");
      }
      if (p.is_admin) {
        addNotification({
          userId: p.id,
          title: "تم تحديث صلاحياتك",
          message: "تمت إزالة صلاحية الأدمن من حسابك",
          kind: "info",
        });
        toast.success("تمت إزالة صلاحية الأدمن");
      } else {
        addNotification({
          userId: p.id,
          title: "تمت ترقيتك",
          message: "أصبح حسابك أدمن الآن",
          kind: "success",
        });
        toast.success("تم منح صلاحية الأدمن");
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر تحديث الصلاحية");
    }
  };

  const applyWallet = async (sign: 1 | -1) => {
    if (!walletEdit || walletBusy) return;
    const amount = Number(walletEdit.amount.replace(/\D/g, ""));
    if (!amount) return;
    setWalletBusy(true);
    try {
      if (!isSuperAdmin) throw new Error("إدارة أرصدة المحافظ متاحة للسوبر أدمن فقط");
      const target = walletEdit.target;
      const newBalance =
        sign > 0
          ? await adminDirectDeposit(target, amount, "إضافة رصيد من السوبر أدمن")
          : await adjustWallet(target.id, -Math.abs(amount), "سحب رصيد من السوبر أدمن");
      addNotification({
        userId: target.id,
        title: sign > 0 ? "تمت إضافة رصيد لحسابك" : "تم سحب رصيد من حسابك",
        message: formatIQD(amount),
        kind: sign > 0 ? "success" : "info",
      });
      // تحديث فوري للقائمة المعروضة قبل إعادة الجلب من الخادم
      setProfiles((prev) =>
        prev.map((p) => (p.id === target.id ? { ...p, wallet_balance_iqd: newBalance } : p)),
      );
      toast.success(
        sign > 0 ? "تم إضافة الرصيد للمستخدم بنجاح" : "تم سحب الرصيد من المستخدم بنجاح",
      );
      setWalletEdit(null);
      await load();
    } catch (e) {
      logError("admin.applyWallet", e);
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setWalletBusy(false);
    }
  };

  /* ------- Unban appeals ------- */
  const reviewAppeal = async (appeal: UnbanAppeal, approve: boolean) => {
    if (!isSuperAdmin) {
      toast.error("إدارة فك الباند متاحة للسوبر أدمن فقط");
      return;
    }
    try {
      const { error } = await supabase.rpc("admin_review_unban", {
        _appeal_id: appeal.id,
        _approve: approve,
        _note: approve ? "تمت الموافقة على طلب فك الباند." : "تم رفض طلب فك الباند.",
      });
      if (error) throw new Error(errorMessage(error));
      toast.success(approve ? "تم فك الباند بنجاح" : "تم رفض الطلب");
      await load();
    } catch (e) {
      logError("admin.reviewAppeal", e);
      toast.error(e instanceof Error ? e.message : "تعذر تحديث الطلب");
    }
  };

  /* ------- Vouchers ------- */
  const addVoucher = async () => {
    const amount = Number(voucherAmount.replace(/\D/g, ""));
    if (!amount) {
      toast.error("أدخل مبلغاً صحيحاً");
      return;
    }
    try {
      await createVoucher(amount, sanitizeText(voucherCode, 40));
      setVoucherAmount("");
      setVoucherCode("");
      toast.success("تم إنشاء الكارت");
      await load();
    } catch {
      toast.error("تعذر إنشاء الكارت");
    }
  };
  const removeVoucher = async (id: string) => {
    await deleteVoucher(id);
    toast.success("تم حذف الكارت");
    await load();
  };

  /* ------- Site announcement ------- */
  const saveAnnouncement = async () => {
    try {
      await setAnnouncement({
        text: sanitizeText(announcement.text, 300),
        active: announcement.active,
      });
      toast.success("تم حفظ الشريط الإعلاني");
    } catch {
      toast.error("تعذر الحفظ");
    }
  };

  const filteredProfiles = profiles.filter((p) =>
    `${p.full_name} ${p.email} ${p.phone}`.toLowerCase().includes(userSearch.toLowerCase()),
  );
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const openTickets = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="admin-panel">
      <Page title="لوحة التحكم" subtitle="لوحة إدارة حديثة — بيانات مباشرة، أدوار، طلبات ودعم">
        <AdminAnalytics orders={orders} profiles={profiles} deposits={deposits} />
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric icon={<Users />} value={profiles.length} label="عدد المستخدمين" />
          <Metric icon={<ShoppingBag />} value={pendingOrders} label="طلبات معلقة" />
          <Metric icon={<Megaphone />} value={openTickets} label="تذاكر الدعم النشطة" />
          <Metric icon={<Package />} value={products.length} label="منتج" />
          <Metric icon={<Megaphone />} value={banners.length} label="إعلان" />
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl bg-white/[.04] p-1">
          {(
            [
              ["orders", "طلبات المراجعة"],
              ["deposits", "طلبات الإيداع"],
              ["products", "المنتجات"],
              ["accounts", "سوق الحسابات"],
              ["banners", "إدارة البنرات والإعلانات"],
              ["tickets", "التذاكر"],
              ["unban", "إدارة الحظر وفك الباند"],
              ["users", "إدارة المستخدمين"],
              ["vouchers", "كروت الشحن"],
              ["site", "إعدادات الموقع"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold ${tab === id ? "bg-emerald-400 text-slate-950" : "text-slate-400"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ORDERS QUEUE */}
        {tab === "orders" && (
          <div className="admin-table">
            <div className="space-y-3 p-3">
              {orders.length ? (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-2xl border border-white/[.08] bg-white/[.035] p-4"
                  >
                    <div className="grid gap-3 text-sm sm:grid-cols-[1.4fr_1.4fr_.7fr_.9fr_1.1fr]">
                      <div>
                        <b className="text-white">{o.product_name}</b>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatDate(o.created_at)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {o.buyer_name || "مستخدم"} · {o.buyer_email}
                        </p>
                        {o.buyer_phone && (
                          <p className="text-[11px] text-slate-500" dir="ltr">
                            {o.buyer_phone}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        {o.kind === "account" ? (
                          <p className="text-xs text-amber-300">حساب من السوق: {o.product_name}</p>
                        ) : (
                          <p
                            className="flex items-center gap-1 truncate text-xs text-sky-300"
                            dir="ltr"
                            title={o.target_link}
                          >
                            <Link2 size={12} className="shrink-0" /> {o.target_link || "—"}
                          </p>
                        )}
                        {o.credentials && (
                          <p
                            className="flex items-center gap-1 text-[11px] text-amber-300"
                            dir="ltr"
                          >
                            <KeyRound size={12} className="shrink-0" /> {o.credentials}
                          </p>
                        )}
                        {o.code && (
                          <p className="text-[11px] text-slate-500" dir="ltr">
                            {o.code}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-slate-300">
                        الكمية: {o.quantity}
                        <span className="mt-1 block text-[10px] text-slate-500">
                          {o.kind === "account"
                            ? "سوق الحسابات"
                            : o.category === "social_media"
                              ? "سوشيال ميديا"
                              : "بطاقة رقمية"}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-emerald-300">
                        {formatIQD(o.price_iqd)}
                        <span className="mt-1 block text-[10px] font-normal text-slate-500">
                          مخصوم من المحفظة
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StatusPill status={o.status} />
                        <input
                          type="number"
                          min={1}
                          inputMode="numeric"
                          dir="ltr"
                          value={etaDraft[o.id] ?? String(o.estimated_minutes || "")}
                          onChange={(e) => setEtaDraft((d) => ({ ...d, [o.id]: e.target.value }))}
                          placeholder={`${expectedMinutes(o)} د`}
                          title="المدة المتوقعة للتنفيذ بالدقائق (تظهر للزبون)"
                          className="h-9 w-20 rounded-lg border border-white/10 bg-slate-900 px-2 text-center text-[11px] font-bold text-white"
                        />
                        <select
                          value={
                            STATUS_OPTIONS.some((s) => s[0] === o.status) ? o.status : "pending"
                          }
                          onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                          className="h-9 rounded-lg border border-white/10 bg-slate-900 px-2 text-[11px] font-bold text-white"
                        >
                          {STATUS_OPTIONS.map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            setOrderDelivery({
                              order: o,
                              code: o.code || "",
                              credentials: o.credentials || "",
                            })
                          }
                          className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-[11px] font-bold text-white"
                        >
                          <KeyRound size={13} /> تسليم
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyBox text="لا توجد طلبات بعد" />
              )}
            </div>
          </div>
        )}

        {/* DEPOSITS QUEUE */}
        {tab === "deposits" && (
          <div className="admin-table">
            <div className="space-y-3 p-3">
              {deposits.length ? (
                deposits.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/[.08] bg-white/[.035] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {depositReceipts[d.id] ? (
                        <button onClick={() => setLightbox(depositReceipts[d.id] ?? "")}>
                          <img
                            src={depositReceipts[d.id]}
                            alt="وصل التحويل"
                            className="h-16 w-16 rounded-xl object-cover"
                          />
                        </button>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5 text-slate-500">
                          <Wallet size={20} />
                        </div>
                      )}
                      <div>
                        <b className="text-white">{d.gateway_label}</b>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {d.user_name || "مستخدم"} · {d.user_email}
                        </p>
                        {d.user_phone && (
                          <p className="text-[11px] text-slate-500" dir="ltr">
                            {d.user_phone}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatDate(d.created_at)}
                        </p>
                        {d.sender_note && (
                          <p className="mt-1 text-[11px] text-slate-400">{d.sender_note}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-300">
                        {formatIQD(d.amount_iqd)}
                      </span>
                      <StatusPill status={d.status} />
                      {d.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => decideDeposit(d, true)}
                            disabled={reviewingDep !== null}
                            className="flex items-center gap-1 rounded-lg bg-emerald-400 px-3 py-2 text-[11px] font-bold text-slate-950 disabled:opacity-50"
                          >
                            {reviewingDep === d.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}{" "}
                            موافقة
                          </button>
                          <button
                            onClick={() => decideDeposit(d, false)}
                            disabled={reviewingDep !== null}
                            className="flex items-center gap-1 rounded-lg bg-red-400/15 px-3 py-2 text-[11px] font-bold text-red-300 disabled:opacity-50"
                          >
                            <X size={13} /> رفض
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyBox text="لا توجد طلبات إيداع بعد" />
              )}
            </div>
          </div>
        )}

        {orderDelivery && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white">تسليم الطلب</h2>
                <button onClick={() => setOrderDelivery(null)} className="text-slate-400">
                  <X />
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">{orderDelivery.order.product_name}</p>
              <input
                value={orderDelivery.code}
                onChange={(e) => setOrderDelivery({ ...orderDelivery, code: e.target.value })}
                placeholder="الكود"
                dir="ltr"
                className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm text-white outline-none focus:border-emerald-400/40"
              />
              <textarea
                value={orderDelivery.credentials}
                onChange={(e) =>
                  setOrderDelivery({ ...orderDelivery, credentials: e.target.value })
                }
                placeholder="بيانات الدخول / التفاصيل"
                dir="ltr"
                className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm text-white outline-none focus:border-emerald-400/40"
              />
              <button
                onClick={saveDelivery}
                className="mt-4 w-full rounded-xl bg-emerald-400 py-3 text-xs font-bold text-slate-950"
              >
                حفظ التسليم
              </button>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <section className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
            <Editor
              title={editingProduct ? "تعديل المنتج" : "إضافة منتج"}
              onSave={saveProduct}
              onCancel={() => {
                setEditingProduct(null);
                setProductForm(emptyProduct);
              }}
              editing={!!editingProduct}
            >
              <Input
                label="الاسم بالعربي"
                value={productForm.name_ar}
                onChange={(v) => setProductForm({ ...productForm, name_ar: v })}
              />
              <Input
                label="الاسم بالإنجليزي"
                value={productForm.name}
                onChange={(v) => setProductForm({ ...productForm, name: v })}
              />
              <Input
                label="سعر الوحدة بالدينار"
                type="number"
                value={String(productForm.price_iqd)}
                onChange={(v) => setProductForm({ ...productForm, price_iqd: Number(v) })}
              />
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="وصف الخدمة"
                className="min-h-24 w-full rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm text-white outline-none"
              />
              <select
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    category: e.target.value as "digital_cards" | "social_media",
                  })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white"
              >
                <option value="digital_cards">بطاقات رقمية</option>
                <option value="social_media">سوشيال ميديا</option>
              </select>
            </Editor>
            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-white/[.08] bg-white/[.035] p-4"
                >
                  <div>
                    <p className="font-bold text-white">{p.name_ar}</p>
                    <p className="mt-1 text-xs text-emerald-300">
                      {formatIQD(p.price_iqd)} · {p.available ? "متوفر" : "متوقف"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(p.id);
                        setProductForm({
                          name: p.name,
                          name_ar: p.name_ar,
                          category: p.category,
                          price_iqd: p.price_iqd,
                          description: p.description,
                          icon: p.icon,
                          available: p.available,
                          sort_order: p.sort_order,
                        });
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="rounded-lg p-2 text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BANNERS */}
        {tab === "banners" && (
          <section className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
            <Editor
              title={editingBanner ? "تعديل البنر" : "إضافة بنر جديد"}
              onSave={saveBanner}
              onCancel={() => {
                setEditingBanner(null);
                setBannerForm(emptyBanner);
              }}
              editing={!!editingBanner}
            >
              <Input
                label="العنوان الرئيسي"
                value={bannerForm.title}
                onChange={(v) => setBannerForm({ ...bannerForm, title: v })}
              />
              <Input
                label="النص التعريفي"
                value={bannerForm.subtitle}
                onChange={(v) => setBannerForm({ ...bannerForm, subtitle: v })}
              />
              <Input
                label="نص الشارة"
                value={bannerForm.badge_text}
                onChange={(v) => setBannerForm({ ...bannerForm, badge_text: v })}
              />
              <Input
                label="رابط صورة الخلفية"
                value={bannerForm.image_url}
                onChange={(v) => setBannerForm({ ...bannerForm, image_url: v })}
              />
              <Input
                label="نص الزر"
                value={bannerForm.cta_text}
                onChange={(v) => setBannerForm({ ...bannerForm, cta_text: v })}
              />
              <Input
                label="رابط الزر (اختياري)"
                value={bannerForm.link_url}
                onChange={(v) => setBannerForm({ ...bannerForm, link_url: v })}
              />
              <Input
                label="الترتيب"
                type="number"
                value={String(bannerForm.sort_order)}
                onChange={(v) => setBannerForm({ ...bannerForm, sort_order: Number(v) || 1 })}
              />
              <button
                type="button"
                onClick={() => setBannerForm({ ...bannerForm, active: !bannerForm.active })}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[.04] px-3 py-3 text-xs font-bold text-white"
              >
                <span>الحالة</span>
                <span className={bannerForm.active ? "text-emerald-300" : "text-slate-400"}>
                  {bannerForm.active ? "نشط" : "متوقف"}
                </span>
              </button>
            </Editor>
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="mb-2 text-[11px] font-bold text-muted-foreground">
                  معاينة مباشرة للوحة الإعلانات (تدعم صورة أو فيديو mp4/webm)
                </p>
                <div className="-mx-4 sm:-mx-6 lg:-mx-10">
                  {bannerForm.title || bannerForm.image_url ? (
                    <AdBoard
                      banners={[{ ...bannerForm, id: "preview", created_at: "", active: true }]}
                    />
                  ) : (
                    <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                      أدخل العنوان ورابط الصورة لتظهر المعاينة
                    </p>
                  )}
                </div>
              </div>
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/[.08] bg-white/[.035] p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {b.image_url ? (
                      <img src={b.image_url} alt="" className="h-12 w-20 rounded-xl object-cover" />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{b.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {b.badge_text || b.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => toggleBannerActive(b)}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${b.active ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-slate-400"}`}
                    >
                      {b.active ? "نشط" : "متوقف"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingBanner(b.id);
                        setBannerForm({
                          title: b.title,
                          subtitle: b.subtitle,
                          badge_text: b.badge_text ?? "",
                          image_url: b.image_url,
                          cta_text: b.cta_text,
                          link_url: b.link_url ?? "",
                          active: b.active,
                          sort_order: b.sort_order,
                        });
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:text-white"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => removeBanner(b.id)}
                      className="rounded-lg p-2 text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TICKETS */}
        {tab === "tickets" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
            <div className="motion-stagger space-y-3">
              {[...tickets]
                .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"))
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full rounded-2xl border p-4 text-right transition ${selectedTicket?.id === t.id ? "border-emerald-400/40 bg-emerald-400/[.07]" : "border-white/[.08] bg-white/[.035] hover:border-white/20"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">{t.subject}</h3>
                        <p className="mt-2 line-clamp-1 text-xs text-slate-500">{t.message}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${t.status === "open" ? "bg-primary/15 text-primary" : t.status === "pending" ? "bg-amber-500/15 text-amber-600 dark:text-amber-300" : "bg-white/10 text-slate-400"}`}
                      >
                        {t.status === "open"
                          ? "مفتوحة"
                          : t.status === "pending"
                            ? "تنتظر الموافقة"
                            : "مغلقة"}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
            {selectedTicket ? (
              <div className="rounded-3xl border border-white/[.08] bg-white/[.035] p-5">
                {selectedTicket.status === "open" && !replies.some((r) => r.is_admin_reply) && (
                  <div className="mb-4">
                    <SupportWaiting compact />
                    <p className="mt-2 text-center text-[11px] text-amber-200">
                      العميل في انتظار الرد — وجّه الطلب فوراً
                    </p>
                  </div>
                )}
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs text-emerald-400">تفاصيل التذكرة</p>
                    <h2 className="mt-1 text-lg font-bold text-white">{selectedTicket.subject}</h2>
                  </div>
                  <div className="flex gap-2">
                    {selectedTicket.status === "pending" && (
                      <button
                        onClick={() => approveTicket(selectedTicket)}
                        className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:brightness-110"
                      >
                        <MessageSquare size={14} /> قبول وفتح المحادثة
                      </button>
                    )}
                    {selectedTicket.status === "closed" && (
                      <button
                        onClick={() => approveTicket(selectedTicket, true)}
                        className="flex items-center gap-2 rounded-xl bg-primary/15 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/25"
                      >
                        <MessageSquare size={14} /> إعادة فتح
                      </button>
                    )}
                    {selectedTicket.status !== "closed" && (
                      <button
                        onClick={() => closeTicket(selectedTicket)}
                        className="flex items-center gap-2 rounded-xl bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-400/20"
                      >
                        <Lock size={14} />{" "}
                        {selectedTicket.status === "pending" ? "رفض وإغلاق" : "إغلاق المحادثة"}
                      </button>
                    )}
                    <button
                      onClick={() => deleteTicket(selectedTicket)}
                      className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-red-400/20 hover:text-red-300"
                    >
                      <Trash2 size={14} /> حذف
                    </button>
                  </div>
                </div>
                {selectedTicket.status === "pending" && (
                  <p className="mt-3 rounded-xl bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-700 dark:text-amber-200">
                    هذه التذكرة بانتظار قرارك. عند القبول تفتح المحادثة للزبون ويُرسل له إشعار فوري،
                    ويمكنك إغلاقها في أي وقت.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 rounded-2xl bg-white/[.04] p-3 text-[11px] text-slate-400">
                  <span>{selectedTicket.user_name || "مستخدم"}</span>
                  <span>{selectedTicket.user_email}</span>
                  <span dir="ltr">{selectedTicket.user_phone}</span>
                  <span>{formatDate(selectedTicket.created_at)}</span>
                </div>
                <div className="mt-4 rounded-2xl bg-white/[.04] p-4 text-sm leading-7 text-slate-300">
                  {selectedTicket.message}
                  <Attachment stored={selectedTicket.image_url} />
                </div>
                <div className="mt-4 space-y-3">
                  {replies.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-4 text-sm leading-6 ${item.is_admin_reply ? "mr-8 bg-emerald-400/10 text-emerald-100" : "ml-8 bg-white/[.05] text-slate-300"}`}
                    >
                      {item.message}
                      <Attachment stored={item.image_url} />
                      <p className="mt-2 text-[10px] text-slate-500">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
                {selectedTicket.status === "open" && (
                  <div className="mt-5">
                    <div className="flex gap-2">
                      <input
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        placeholder="اكتب رد الأدمن..."
                        className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm text-white outline-none focus:border-emerald-400/40"
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
                        className="rounded-xl border border-white/10 bg-white/[.06] px-3 text-slate-300 hover:bg-white/10"
                      >
                        <ImagePlus size={16} />
                      </button>
                      <button
                        onClick={sendAdminReply}
                        disabled={replyBusy}
                        className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 text-xs font-bold text-slate-950 disabled:opacity-50"
                      >
                        {replyBusy ? (
                          <Loader2 className="animate-spin" size={15} />
                        ) : (
                          <Send size={15} />
                        )}{" "}
                        رد
                      </button>
                    </div>
                    {replyFile && (
                      <p className="mt-2 flex items-center gap-2 text-[11px] text-emerald-300">
                        {replyFile.name}
                        <button onClick={() => setReplyFile(null)} className="text-slate-400">
                          <X size={12} />
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[380px] items-center justify-center rounded-3xl border border-white/[.08] bg-white/[.035]">
                <p className="text-sm text-slate-400">اختر تذكرة لعرض التفاصيل</p>
              </div>
            )}
          </div>
        )}

        {/* MARKET ACCOUNTS */}
        {tab === "accounts" && <AdminAccounts />}

        {/* UNBAN */}
        {tab === "unban" && (
          <section className="space-y-3">
            {!isSuperAdmin && (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-200">
                هذه الصفحة متاحة للسوبر أدمن فقط.
              </div>
            )}
            {appeals.length ? (
              appeals.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-white/[.08] bg-white/[.035] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-white">طلب فك باند</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {a.contact_phone} · {formatDate(a.created_at)}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {a.reason}
                      </p>
                      {a.attachment_url && (
                        <button
                          onClick={async () => {
                            const u = await fileUrl(a.attachment_url ?? "").catch(() => "");
                            if (u) setLightbox(u);
                          }}
                          className="mt-3 text-xs font-bold text-emerald-300"
                        >
                          عرض المرفق
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {a.status === "pending" ? (
                        <>
                          {isSuperAdmin && (
                            <>
                              <button
                                onClick={() => reviewAppeal(a, true)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950"
                              >
                                <Check size={14} /> فك الباند
                              </button>
                              <button
                                onClick={() => reviewAppeal(a, false)}
                                className="rounded-lg bg-red-400/15 px-3 py-2 text-xs font-bold text-red-300"
                              >
                                رفض
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <span className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-400">
                          {a.status === "approved" ? "تمت الموافقة" : "مرفوض"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyBox text="لا توجد طلبات فك باند" />
            )}
          </section>
        )}

        {/* USERS */}
        {tab === "users" && (
          <section>
            <div className="relative mb-4 max-w-md">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ابحث عن مستخدم..."
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm text-white outline-none focus:border-emerald-400/40"
              />
            </div>
            {isMaster ? (
              <p className="mb-3 text-[11px] text-emerald-300">
                أنت المالك — يمكنك منح أو سحب صلاحيات الأدمن من مفتاح الرتبة بجانب كل مستخدم.
              </p>
            ) : (
              <p className="mb-3 text-[11px] text-slate-500">
                تعديل رتب الأدمن متاح فقط لحساب المالك ({MASTER_ADMIN_EMAIL}).
              </p>
            )}
            <div className="space-y-3">
              {filteredProfiles.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-white/[.035] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                        <Users size={18} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white">{p.full_name || "بدون اسم"}</p>
                      <p className="text-xs text-slate-500">
                        {p.email} · {p.phone || "لا يوجد هاتف"}
                      </p>
                      <div className="mt-1 flex gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] ${p.is_admin ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-slate-500"}`}
                        >
                          {p.is_admin ? "أدمن" : "مستخدم"}
                        </span>
                        {p.is_banned && (
                          <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-[9px] text-red-300">
                            محظور
                          </span>
                        )}
                        {p.is_restricted && (
                          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] text-amber-300">
                            مقيد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300">
                      {formatIQD(p.wallet_balance_iqd)}
                    </span>
                    {isSuperAdmin && (
                      <button
                        onClick={() => setWalletEdit({ target: p, amount: "" })}
                        className="flex items-center gap-1 rounded-lg bg-emerald-400/15 px-3 py-2 text-[11px] font-bold text-emerald-300"
                      >
                        <Wallet size={13} /> إدارة الرصيد
                      </button>
                    )}
                    {isMaster && !isMasterAdminEmail(p.email) && (
                      <button
                        onClick={() => toggleAdmin(p)}
                        title={p.is_admin ? "سحب صلاحية الأدمن" : "منح صلاحية الأدمن"}
                        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-bold ${p.is_admin ? "bg-amber-400/15 text-amber-200" : "bg-white/10 text-white"}`}
                      >
                        {p.is_admin ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                        {p.is_admin ? "مستخدم" : "أدمن"}
                      </button>
                    )}
                    {isMasterAdminEmail(p.email) && (
                      <span className="rounded-lg bg-emerald-400/20 px-2 py-2 text-[10px] font-bold text-emerald-200">
                        المالك
                      </span>
                    )}
                    <button
                      onClick={() => toggleFlag(p, "is_banned")}
                      title="حظر"
                      className={`rounded-lg p-2 ${p.is_banned ? "bg-red-400/20 text-red-300" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}
                    >
                      <Ban size={15} />
                    </button>
                    <button
                      onClick={() => toggleFlag(p, "is_restricted")}
                      title="تقييد"
                      className={`rounded-lg p-2 ${p.is_restricted ? "bg-amber-400/20 text-amber-300" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}
                    >
                      <Lock size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {walletEdit && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-white">
                      إدارة رصيد {walletEdit.target.full_name || walletEdit.target.email}
                    </h2>
                    <button onClick={() => setWalletEdit(null)} className="text-slate-400">
                      <X />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    الرصيد الحالي: {formatIQD(walletEdit.target.wallet_balance_iqd)}
                  </p>
                  <input
                    value={walletEdit.amount}
                    onChange={(e) =>
                      setWalletEdit({ ...walletEdit, amount: e.target.value.replace(/\D/g, "") })
                    }
                    dir="ltr"
                    placeholder="المبلغ بالدينار"
                    className="mt-4 h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm text-white outline-none focus:border-emerald-400/40"
                  />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => applyWallet(1)}
                      disabled={walletBusy}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-xs font-bold text-slate-950 disabled:opacity-50"
                    >
                      {walletBusy ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Plus size={15} />
                      )}{" "}
                      إضافة رصيد
                    </button>
                    <button
                      onClick={() => applyWallet(-1)}
                      disabled={walletBusy}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-400/15 py-3 text-xs font-bold text-red-300 disabled:opacity-50"
                    >
                      <Minus size={15} /> سحب رصيد
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* VOUCHERS */}
        {tab === "vouchers" && (
          <section className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
            <div className="space-y-3 rounded-3xl border border-white/[.08] bg-white/[.035] p-5">
              <h2 className="font-bold text-white">إنشاء كارت شحن</h2>
              <Input
                label="المبلغ بالدينار"
                type="number"
                value={voucherAmount}
                onChange={setVoucherAmount}
              />
              <Input label="كود مخصص (اختياري)" value={voucherCode} onChange={setVoucherCode} />
              <button
                onClick={addVoucher}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-xs font-bold text-slate-950"
              >
                <Gift size={15} /> إنشاء الكارت
              </button>
            </div>
            <div className="space-y-3">
              {vouchers.length ? (
                vouchers.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-2xl border border-white/[.08] bg-white/[.035] p-4"
                  >
                    <div>
                      <p className="font-bold text-white" dir="ltr">
                        {v.code}
                      </p>
                      <p className="mt-1 text-xs text-emerald-300">{formatIQD(v.amount_iqd)}</p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {v.used_by ? `مستخدم بتاريخ ${formatDate(v.used_at ?? "")}` : "غير مستخدم"}
                      </p>
                    </div>
                    <button
                      onClick={() => removeVoucher(v.id)}
                      className="rounded-lg p-2 text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <EmptyBox text="لا توجد كروت شحن بعد" />
              )}
            </div>
          </section>
        )}

        {/* SITE SETTINGS */}
        {tab === "site" && (
          <section className="max-w-xl space-y-3 rounded-3xl border border-white/[.08] bg-white/[.035] p-5">
            <h2 className="font-bold text-white">الشريط الإعلاني</h2>
            <textarea
              value={announcement.text}
              onChange={(e) => setAnnouncementState({ ...announcement, text: e.target.value })}
              className="min-h-24 w-full rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm text-white outline-none"
              placeholder="نص الإعلان"
            />
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={announcement.active}
                onChange={(e) =>
                  setAnnouncementState({ ...announcement, active: e.target.checked })
                }
              />
              نشط
            </label>
            <button
              onClick={saveAnnouncement}
              className="w-full rounded-xl bg-emerald-400 py-3 text-xs font-bold text-slate-950"
            >
              حفظ
            </button>
          </section>
        )}

        <ImageLightbox url={lightbox} onClose={() => setLightbox("")} />
      </Page>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="hover-lift flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.03] px-4 py-3">
      <div className="rounded-xl bg-emerald-400/15 p-2.5 text-emerald-400">{icon}</div>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-[10px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function Editor({
  title,
  children,
  onSave,
  onCancel,
  editing,
}: {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  editing: boolean;
}) {
  return (
    <div className="space-y-3 rounded-3xl border border-white/[.08] bg-white/[.035] p-5">
      <h2 className="font-bold text-white">{title}</h2>
      {children}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          className="flex-1 rounded-xl bg-emerald-400 py-3 text-xs font-bold text-slate-950"
        >
          حفظ
        </button>
        {editing && (
          <button
            onClick={onCancel}
            className="rounded-xl bg-white/10 px-4 py-3 text-xs font-bold text-white"
          >
            إلغاء
          </button>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm text-white outline-none focus:border-emerald-400/40"
      />
    </div>
  );
}
