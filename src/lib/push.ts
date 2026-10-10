/**
 * إشعارات OneSignal للويب — تعمل حتى لو كان الموقع أو المتصفح مغلقاً.
 * يتم التحميل فقط إذا تم ضبط VITE_ONESIGNAL_APP_ID.
 */
import { savePushDevice } from "@/lib/store";

const APP_ID = import.meta.env["VITE_ONESIGNAL_APP_ID"] as string | undefined;

type OneSignalApi = {
  init: (config: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  User: { PushSubscription: { id?: string | null; optIn: () => Promise<void> } };
  Notifications: { permission: boolean; requestPermission: () => Promise<void> };
};

declare global {
  interface Window {
    OneSignal?: OneSignalApi;
    OneSignalDeferred?: ((os: OneSignalApi) => void)[];
  }
}

export const pushConfigured = Boolean(APP_ID);

let loaded = false;

function loadSdk(): Promise<void> {
  if (loaded) return Promise.resolve();
  loaded = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("sdk-failed"));
    document.head.appendChild(script);
  });
}

/** تهيئة الإشعارات وطلب الإذن من المستخدم بعد تسجيل الدخول */
async function registerAppWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    /* غير مدعوم على HTTP المحلي */
  }
}

export async function initPush(userId: string): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  await registerAppWorker();
  if ("Notification" in window && Notification.permission === "default") {
    void Notification.requestPermission();
  }
  if (!APP_ID) return;
  try {
    await loadSdk();
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: APP_ID,
        serviceWorkerPath: "/sw.js",
        serviceWorkerParam: { scope: "/" },
        allowLocalhostAsSecureOrigin: true,
      });
      await OneSignal.login(userId);
      if (!OneSignal.Notifications.permission) {
        await OneSignal.Notifications.requestPermission();
      }
      const playerId = OneSignal.User.PushSubscription.id;
      if (playerId) await savePushDevice(userId, playerId);
    });
  } catch {
    /* الإشعارات غير متاحة على هذا المتصفح */
  }
}
