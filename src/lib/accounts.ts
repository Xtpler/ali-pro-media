export type AccountPlatform =
  "instagram" | "tiktok" | "telegram" | "youtube" | "facebook" | "twitter" | "gaming";

export const PLATFORM_LABEL: Record<AccountPlatform, string> = {
  instagram: "انستغرام",
  tiktok: "تيك توك",
  telegram: "تلغرام",
  youtube: "يوتيوب",
  facebook: "فيسبوك",
  twitter: "X (تويتر)",
  gaming: "حسابات الألعاب",
};

export const PLATFORM_IDS = Object.keys(PLATFORM_LABEL) as AccountPlatform[];

export function isAccountPlatform(value: string): value is AccountPlatform {
  return (PLATFORM_IDS as string[]).includes(value);
}
