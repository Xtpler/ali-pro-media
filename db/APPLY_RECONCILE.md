# تطبيق مزامنة قاعدة البيانات الحية / Apply the live-schema reconciliation

هذا الملف مرجع قصير لتشغيل السكربت `db/reconcile_live_schema.sql` على مشروع Supabase الحيّ
(`xalqbvxzpfrmcttxcife`). السكربت **إضافي فقط** (لا يحذف جداول أو بيانات) و**آمن للتشغيل أكثر من مرة**.

---

## قبل التشغيل / Before you run

- تحتاج وصول **مالك المشروع** أو مفتاح `service_role`. مفتاح التطبيق العام (`anon`) **لا يكفي**،
  لذلك لا يمكن تشغيله من الواجهة أو من الـ`.env` — شغّله من **SQL Editor** في لوحة Supabase.
- خذ نسخة احتياطية اختيارية: Dashboard → Database → Backups.

## الخطوات / Steps

1. افتح [Supabase Dashboard](https://supabase.com/dashboard) ثم المشروع `xalqbvxzpfrmcttxcife`.
2. من القائمة الجانبية: **SQL Editor** → **New query**.
3. افتح الملف `db/reconcile_live_schema.sql` وانسخ **كامل محتواه**.
4. الصقه في المحرّر ثم اضغط **Run** (شغّل الكل، وليس تحديداً جزئياً).
   - إن ظهر تحذير عن `notify pgrst` أو `alter publication` فتجاهله — الكتلة محمية داخلياً.
5. المتوقّع: `Success. No rows returned`.
6. عُد إلى التطبيق واعمل **تحديثاً كاملاً** للصفحة (Ctrl+F5). يجب أن تختفي أخطاء `404/400` من الـConsole.

> لتشغيله مجدداً (بعد تعديلات مستقبلية) كرّر نفس الخطوات بأمان — كل عبارة
> `create ... if not exists` / `add column if not exists` / `drop policy if exists` قابلة للتكرار.

## ماذا يفعل السكربت / What it does

1. ينشئ الجداول المفقودة: `products`, `market_accounts`, `market_account_secrets`,
   `push_devices`, `action_logs`, `unban_appeals`, `password_reset_otps`.
2. يضيف الأعمدة الناقصة الجدولية (banners/orders/support_tickets/ticket_replies/
   deposit_requests/wallet_transactions/vouchers/card_categories/electronic_cards/profiles)
   ويعبّئها من الأعمدة القديمة (`banners.is_active` → `active`، `card_categories.name` → `name_ar`،
   `wallet_transactions.amount` → `amount_iqd`).
3. ينشئ/يعيد بناء الدوال التي يستدعيها التطبيق: `is_staff`, `is_master_admin`,
   `ensure_master_admin`, `set_updated_at`, `guard_wallet_balance`, `handle_new_user`,
   `check_rate_limit`, `credit_wallet`, `redeem_voucher`, `purchase_with_wallet`,
   `admin_adjust_wallet`, `admin_review_unban`, `review_support_ticket`.
   - `admin_adjust_wallet`: يحذف **كل** النسخ القديمة بنفس الاسم (overloads) ثم ينشئ
     نسخة قياسية واحدة تُرجع الرصيد الجديد — لتفادي خطأ PostgREST
     `Could not choose the best candidate function between public.admin_adjust_wallet(...)`.
4. يربط مشغّلات (triggers) الملف الشخصي والمحفظة وإنشاء المستخدم بدون تكرار.
5. يضبط RLS وسياسات الجداول الجديدة/المتغيّرة، وحاويات التخزين
   (`avatars`, `deposits`, `unban_requests`, `attachments`) وسياساتها.
6. يضيف جداول المزامنة الفورية (Realtime) التي يستخدمها التطبيق.
7. يزرع بيانات أولية **فقط إذا كانت الجداول فارغة**.
8. ينفّذ `notify pgrst, 'reload schema'` لتحديث كاش PostgREST فوراً.

**لا يلمس** الدوال الحيّة القائمة التي تعمل أصلاً: `has_role` و`review_deposit`
(نحافظ عليهما كما هما لتجنّب أي ازدواج في إضافة الرصيد عند قبول الإيداع).

## تحقّق سريع / Quick verification (اختياري)

بعد التشغيل، جرّب من Home/ السوق/ حسابي:
- اختفاء خطأ المنتجات (`products`) وسوق الحسابات (`market_accounts`).
- ظهور البانرات والإعلان العلوي.
- فتح تبويب الدعم وإنشاء تذكرة، وطلب فك الحظر يُرسل بنجاح.
- ترقية/سحب صلاحية `admin` من لوحة الأدمن (لصاحب البريد الرئيسي) تعمل.

## استكشاف الأخطاء / Troubleshooting

| العَرَض | السبب المتوقّع | الحل |
|---|---|---|
| `permission denied for table ...` | تشغيل بمفتاح `anon` | شغّله من SQL Editor كمالك/`service_role` |
| `must be owner of function/table` | صلاحيات غير كافية | استخدم حساب مالك المشروع |
| بقاء أخطاء 400 بعد النجاح | كاش PostgREST | انتظر ~10 ثوانٍ أو أعد التشغيل (يعيد `notify pgrst`) |
| خطأ عند `alter publication` | الجدول مضاف مسبقاً | طبيعي — العبارة تجاوز الخطأ تلقائياً |
| `Could not choose the best candidate function between public.admin_adjust_wallet(...)` | وجود نسخ متعددة (overloads) للدالة | السكربت يحذفها كلها ويعيد إنشاء نسخة واحدة؛ أعد تشغيل السكربت ثم أعد تحميل التطبيق |

---

المرجع البرمجي: عقد الجداول والدوال موجود في `src/lib/store.ts` و`src/lib/data.ts` و`src/lib/site.ts`.
