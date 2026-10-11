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
   `push_devices`, `action_logs`, `unban_appeals`, `password_reset_otps`, `referrals`.
2. يضيف الأعمدة الناقصة الجدولية (banners/orders/support_tickets/ticket_replies/
   deposit_requests/wallet_transactions/vouchers/card_categories/electronic_cards/profiles)
   ويعبّئها من الأعمدة القديمة (`banners.is_active` → `active`، `card_categories.name` → `name_ar`،
   `wallet_transactions.amount` → `amount_iqd`).
   - `wallet_transactions.amount` (القديم `NOT NULL` بدون default): يمنحه السكربت `default 0` ويضيف
     مُشغّل `wallet_amount_sync` يزامن `amount` ↔ `amount_iqd` تلقائياً لكل الكتّاب، تفادياً لخطأ
     `null value in column "amount" ... violates not-null constraint` عند شراء أي خدمة.
   - `wallet_transactions.transaction_type` (القديم `NOT NULL` بدون default): يمنحه السكربت
     `default 'purchase'` حتى لا يفشل أي كاتب (يشمل RPCs مثل `credit_wallet`).
   - `orders.order_type` (القديم `NOT NULL` بدون default): يمنحه السكربت `default 'service'`،
     ويضيف العمود إن لم يكن موجوداً، و`purchase_with_wallet` يكتبه صراحةً
     (`'card'` لبطاقات الدفع الرقمية، و`'service'` لغيرها).
   - `orders.total_price` (القديم `NOT NULL` بدون default): يمنحه السكربت `default 0`،
     ويضيف العمود إن لم يكن موجوداً، و`purchase_with_wallet` يكتبه صراحةً = السعر الكلي.
3. ينشئ/يعيد بناء الدوال التي يستدعيها التطبيق: `is_staff`, `is_master_admin`,
   `ensure_master_admin`, `set_updated_at`, `guard_wallet_balance`, `handle_new_user`,
   `check_rate_limit`, `credit_wallet`, `redeem_voucher`, `purchase_with_wallet`,
   `admin_adjust_wallet`, `admin_review_unban`, `review_support_ticket`,
   `apply_referral`, `maybe_reward_referral`.
   - `admin_adjust_wallet`: يحذف **كل** النسخ القديمة بنفس الاسم (overloads) ثم ينشئ
     نسخة قياسية واحدة تُرجع الرصيد الجديد — لتفادي خطأ PostgREST
     `Could not choose the best candidate function between public.admin_adjust_wallet(...)`.
   - **نظام الإحالة**: كل مستخدم له رابط فريد `/ref/<user-id>`؛ دالة `apply_referral` تربط
     المُدعوّ بالداعي (حالة `pending`)، ومشغّل `referral_reward` على `deposit_requests` يمنح
     الداعي مكافأة **قابلة للتهيئة** (الثابت `bonus_pct` داخل `maybe_reward_referral`، حالياً 10٪)
     من أول إيداع **معتمد** للصديق، ويقيّدها في `wallet_transactions` عبر `credit_wallet`.
4. يربط مشغّلات (triggers) الملف الشخصي والمحفظة وإنشاء المستخدم ومكافأة الإحالة بدون تكرار.
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
- نسخ رابط الدعوة من «حسابي» أو زر «ادعُ صديقاً» ثم فتحه: تظهر صفحة `/ref/<id>` وتُربَط الإحالة.
- قبول أول إيداع (موافقة) لمستخدم مُدعوّ: تُضاف مكافأة 10٪ لمحفظة الداعي ويصله إشعار.

## استكشاف الأخطاء / Troubleshooting

| العَرَض | السبب المتوقّع | الحل |
|---|---|---|
| `permission denied for table ...` | تشغيل بمفتاح `anon` | شغّله من SQL Editor كمالك/`service_role` |
| `must be owner of function/table` | صلاحيات غير كافية | استخدم حساب مالك المشروع |
| بقاء أخطاء 400 بعد النجاح | كاش PostgREST | انتظر ~10 ثوانٍ أو أعد التشغيل (يعيد `notify pgrst`) |
| خطأ عند `alter publication` | الجدول مضاف مسبقاً | طبيعي — العبارة تجاوز الخطأ تلقائياً |
| `Could not choose the best candidate function between public.admin_adjust_wallet(...)` | وجود نسخ متعددة (overloads) للدالة | السكربت يحذفها كلها ويعيد إنشاء نسخة واحدة؛ أعد تشغيل السكربت ثم أعد تحميل التطبيق |
| `null value in column "amount" of relation "wallet_transactions" violates not-null constraint` | العمود القديم `amount` `NOT NULL` بدون default بينما الكود يكتب `amount_iqd` | أعِد تشغيل السكربت (يمنح `default 0` ويضيف مُشغّل `sync_wallet_amount`) ثم أعد تحميل التطبيق وجرّب الطلب مجدداً |
| `null value in column "transaction_type" of relation "wallet_transactions" violates not-null constraint` | العمود القديم `transaction_type` `NOT NULL` بدون default | أعِد تشغيل السكربت (يمنح `default 'purchase'`) ثم أعد تحميل التطبيق وجرّب الطلب مجدداً |
| `null value in column "order_type" of relation "orders" violates not-null constraint` | العمود القديم `order_type` `NOT NULL` بدون default | أعِد تشغيل السكربت (يمنح `default 'service'`) ثم أعد تحميل التطبيق وجرّب الطلب مجدداً |
| `null value in column "total_price" of relation "orders" violates not-null constraint` | العمود القديم `total_price` `NOT NULL` بدون default | أعِد تشغيل السكربت (يمنح `default 0`) ثم أعد تحميل التطبيق وجرّب الطلب مجدداً |
| `could not find the function public.apply_referral` أو اختفاء جدول `referrals` | لم يُطبَّق سكربت المزامنة بعد | أعِد تشغيل السكربت (ينشئ `referrals` ودالة `apply_referral` والمشغّل) ثم أعد تحميل التطبيق |

---

المرجع البرمجي: عقد الجداول والدوال موجود في `src/lib/store.ts` و`src/lib/data.ts` و`src/lib/site.ts`.
