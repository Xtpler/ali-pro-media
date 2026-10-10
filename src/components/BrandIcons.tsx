import type React from "react";

type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg",
});

export function InstagramIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.5 2h-2.7v13.1a2.6 2.6 0 1 1-2.1-2.55V9.8a5.7 5.7 0 1 0 4.8 5.62V8.9a6.6 6.6 0 0 0 3.9 1.27V7.3a3.9 3.9 0 0 1-3.9-3.9V2z" />
    </svg>
  );
}

export function TelegramIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor" aria-hidden="true">
      <path d="M21.6 4.2 2.9 11.3c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.3c.3.8 1.3 1 1.9.4l2.6-2.5 4.6 3.4c.7.5 1.7.1 1.9-.7l3-14.2c.2-.9-.7-1.7-1.8-1.3zM9.6 14.2l8.2-5.1-6.6 6.3-.3 3.4-1.3-4.6z" />
    </svg>
  );
}

export function FacebookIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor" aria-hidden="true">
      <path d="M13.5 21.9V13.9h2.7l.5-3.2h-3.2V8.6c0-.9.3-1.6 1.7-1.6h1.6V4.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.5H7.3v3.2h3v8h3.2z" />
    </svg>
  );
}

export function YoutubeIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor" aria-hidden="true">
      <path d="M22.2 7.5c-.25-1.9-1-2.6-2.9-2.8C17.4 4.5 14.9 4.4 12 4.4s-5.4.1-7.3.3C2.8 4.9 2 5.6 1.8 7.5 1.6 9 1.6 10.4 1.6 12s0 3 .2 4.5c.2 1.9 1 2.6 2.9 2.8 1.9.2 4.4.3 7.3.3s5.4-.1 7.3-.3c1.9-.2 2.65-.9 2.9-2.8.2-1.5.2-2.9.2-4.5s0-3-.2-4.5zM10 15.3V8.7l5.8 3.3-5.8 3.3z" />
    </svg>
  );
}

export function XIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.6 3h3.3l-7.2 8.2L22 21h-6.6l-4.4-5.7L5.8 21H2.5l7.7-8.8L2 3h6.8l4 5.3L17.6 3zm-1.2 16h1.8L7.7 4.9H5.8L16.4 19z" />
    </svg>
  );
}

const MAP: Record<string, (p: IconProps) => React.ReactElement> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  telegram: TelegramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  x: XIcon,
  twitter: XIcon,
};

export const PLATFORMS: { id: string; label: string; color: string }[] = [
  { id: "instagram", label: "انستغرام", color: "text-pink-400" },
  { id: "tiktok", label: "تيك توك", color: "text-slate-100" },
  { id: "telegram", label: "تليجرام", color: "text-sky-400" },
  { id: "facebook", label: "فيسبوك", color: "text-blue-400" },
  { id: "youtube", label: "يوتيوب", color: "text-red-400" },
  { id: "x", label: "إكس", color: "text-slate-200" },
];

export function detectPlatform(text: string): string | null {
  const value = text.toLowerCase();
  if (value.includes("instagram") || value.includes("انستغرام") || value.includes("انستكرام"))
    return "instagram";
  if (value.includes("tiktok") || value.includes("تيك")) return "tiktok";
  if (value.includes("telegram") || value.includes("تليجرام") || value.includes("تلغرام"))
    return "telegram";
  if (value.includes("facebook") || value.includes("فيس")) return "facebook";
  if (value.includes("youtube") || value.includes("يوتيوب")) return "youtube";
  if (
    value.includes("twitter") ||
    value.includes(" x ") ||
    value.includes("اكس") ||
    value.includes("إكس")
  )
    return "x";
  return null;
}

export function BrandIcon({
  platform,
  size = 22,
  className = "",
}: {
  platform: string | null;
  size?: number;
  className?: string;
}) {
  if (!platform) return null;
  const Comp = MAP[platform];
  if (!Comp) return null;
  return <Comp size={size} className={className} />;
}
