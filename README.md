# Lovable Upgrade Suite

Build, fix, and fully upgrade this application with all features, fixes, security protections, and OneSignal Push Notifications integration:

1. ONESIGNAL PUSH NOTIFICATIONS INTEGRATION (WORKS OFFSITE):

   - Integrate OneSignal SDK / Web Push Notification API using a dedicated Service Worker (`OneSignalSDKWorker.js`).

   - Prompt users and admins to allow browser push notifications upon login/dashboard entry.

   - Send instant push alerts even when the website or browser is closed:

     a) To Admin: Instant push notification on new deposit submissions, new orders, and support ticket creation.

     b) To User: Instant push notification on deposit approval/rejection, order status changes, and support ticket replies.

2. AUTHENTICATION & SECURITY SYSTEM:

   - FIX LOGIN & SESSION ERRORS: Resolve login/signup crashes and state reset issues.

   - FUNCTIONAL OTP SYSTEM: Implement working OTP (One-Time Password) verification flow for user registration/login.

   - RATE LIMITING & ANTI-SPAM: Prevent rapid multiple submissions of deposit requests, orders, and OTP codes.

   - INPUT SANITIZATION & XSS PROTECTION: Sanitize all inputs (URLs, notes, ticket messages).

   - CREDENTIAL SECURITY: Encrypt/hide sensitive account marketplace details until a transaction is completed.

3. ADMIN DASHBOARD & ORDER MANAGEMENT:

   - PENDING DEPOSITS FIX: Display all user deposit requests (amount, gateway, uploaded receipt image, note, timestamp) in persistent storage.

   - APPROVE / REJECT DEPOSITS: Approving automatically credits the user's wallet balance in real-time.

   - DETAILED ORDER INFO: Display target Link/URL and Quantity for Social Media orders, and item details with buyer info for Accounts Marketplace.

   - ADMIN METRICS: Add summary cards at the top (Total Revenue, Pending Deposits, Active Support Tickets).

4. SUPPORT TICKETS ATTACHMENT SYSTEM:

   - Allow users and admins to attach images/files (screenshots, receipts) when creating or replying to tickets.

   - Display clickable image thumbnails with full-screen view modals.

5. UI & SETTINGS CLEANUP:

   - REMOVE the "Add Domain" (إضافة دومين) option completely from Settings pages.

   - Add "شروط الاستخدام" (Terms of Service) and "سياسة الخصوصية" (Privacy Policy) modals/pages.

6. ADDITIONAL HIGH-VALUE FEATURES:

   - VOUCHER / GIFT CARD SYSTEM: Redeemable deposit code tab for users, with admin management to generate fixed balance codes.

   - WALLET VALIDATION: Block purchase if user balance < product total with a warning toast ("رصيدك غير كافٍ").

   - DYNAMIC PRICE CALCULATOR: Auto-calculate service total cost based on entered quantity before ordering.

   - FLOATING SUPPORT & ANNOUNCEMENT BAR: Add floating WhatsApp/Telegram contact shortcuts and a top editable notification ticker/banner.

Please apply this master update onto the current codebase, ensuring all state/database mutations persist seamlessly without breaking existing functionality.

قم بتعديل وتحديث ملفات المشروع الحالي مباشرة بدون مسح الكود أو البدء من الصفر:"

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/699c79d1-57f5-4a3a-9498-15cef58c9414).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
