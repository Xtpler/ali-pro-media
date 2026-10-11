import { Eye, Heart, MessageCircle, Share2, UserPlus, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

const ICONS: LucideIcon[] = [Heart, Eye, Share2, UserPlus, MessageCircle];

/**
 * Decorative slowly-orbiting brand-icon cluster. Pure CSS animation (no JS
 * frames), counter-rotated per icon so each glyph stays upright. `aria-hidden`
 * because it is decorative.
 */
export function OrbitIcons({ className }: { className?: string }) {
  const count = ICONS.length;
  return (
    <div className={`orbit-ring ${className ?? ""}`.trim()} aria-hidden>
      {ICONS.map((Icon, index) => (
        <span
          key={index}
          className="orbit-item"
          style={{ "--angle": `${index * (360 / count)}deg` } as CSSProperties}
        >
          <span className="orbit-item-inner">
            <Icon size={15} strokeWidth={2.2} />
          </span>
        </span>
      ))}
    </div>
  );
}
