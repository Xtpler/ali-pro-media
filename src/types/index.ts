export type Product = {
  id: string;
  name: string;
  name_ar: string;
  category: "digital_cards" | "social_media";
  price_iqd: number;
  description: string;
  icon: string;
  image_url: string;
  available: boolean;
  sort_order: number;
  created_at: string;
};

export type OrderStatus =
  "pending" | "approved" | "processing" | "completed" | "cancelled" | "rejected";

export type Order = {
  estimated_minutes?: number | undefined;
  started_at?: string | null | undefined;
  completed_at?: string | null | undefined;
  id: string;
  user_id: string;
  product_id: string | null;
  product_name: string;
  category: "digital_cards" | "social_media";
  target_link: string;
  quantity: number;
  unit_price_iqd: number;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  payment_method: string;
  price_iqd: number;
  code: string;
  status: OrderStatus;
  admin_note?: string;
  /** بيانات الدخول المسلّمة لطلبات سوق الحسابات */
  credentials?: string;
  /** نوع الطلب: خدمة/بطاقة أو حساب من السوق */
  kind?: "service" | "account";
  /** نوع الطلب الثانوي (card/service) — متزامن مع الدالة purchase_with_wallet */
  order_type?: "card" | "service" | string;
  /** إجمالي سعر الطلب — يعادل price_iqd في الإصدارات الأحدث */
  total_price?: number;
  created_at: string;
};

export type DepositStatus = "pending" | "approved" | "rejected";

export type ReferralStatus = "pending" | "rewarded";

export type Referral = {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  status: ReferralStatus;
  reward_amount_iqd: number;
  created_at: string;
};

export type Deposit = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  gateway: DepositGateway;
  gateway_label: string;
  amount_iqd: number;
  receipt_url: string;
  sender_note: string;
  admin_note?: string | null;
  notes?: string | null;
  status: DepositStatus;
  created_at: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  kind: "success" | "error" | "info";
  read: boolean;
  created_at: string;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  badge_text?: string;
  link_url?: string;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  image_url: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_avatar_url: string;
  status: "pending" | "open" | "closed";
  approved_at?: string | null | undefined;
  closed_at?: string | null | undefined;
  created_at: string;
};

export type TicketReply = {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  image_url?: string;
  is_admin_reply: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  wallet_balance_iqd: number;
  role?: "user" | "admin" | "super_admin";
  is_admin: boolean;
  is_super_admin?: boolean;
  is_banned: boolean;
  is_restricted: boolean;
  avatar_url: string;
  created_at: string;
};

export type DepositGateway = "super_qi" | "zain_cash" | "fib" | "asiapay";

export const DEPOSIT_GATEWAYS: {
  id: DepositGateway;
  label_ar: string;
  label: string;
  target_type: "account" | "phone";
  target_value: string;
  hint: string;
}[] = [
  {
    id: "super_qi",
    label_ar: "سوبر كي (Super Qi)",
    label: "Super Qi",
    target_type: "account",
    target_value: "917324905236",
    hint: "حوّل المبلغ إلى رقم الحساب أعلاه ثم ارفع وصل التحويل",
  },
  {
    id: "zain_cash",
    label_ar: "زين كاش (Zain Cash)",
    label: "Zain Cash",
    target_type: "phone",
    target_value: "07819431592",
    hint: "حوّل المبلغ إلى الرقم أعلاه ثم ارفع وصل التحويل",
  },
  {
    id: "fib",
    label_ar: "البنك العراقي الأول (FIB)",
    label: "FIB",
    target_type: "phone",
    target_value: "07819431592",
    hint: "حوّل المبلغ إلى الرقم أعلاه ثم ارفع وصل التحويل",
  },
  {
    id: "asiapay",
    label_ar: "آسيا باي (Asiapay)",
    label: "Asiapay",
    target_type: "phone",
    target_value: "07819431592",
    hint: "حوّل المبلغ إلى الرقم أعلاه ثم ارفع وصل التحويل",
  },
];

export type PaymentMethod = "wallet";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; label_ar: string }[] = [
  { id: "wallet", label: "Wallet", label_ar: "رصيد المحفظة" },
];
