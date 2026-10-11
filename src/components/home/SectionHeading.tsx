import type { ReactNode } from "react";
import { Reveal } from "@/components/home/Reveal";

/** Consistent eyebrow + title + subtitle block used by every home section. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  icon,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  align?: "center" | "start";
}) {
  const centered = align === "center";
  return (
    <Reveal className={centered ? "text-center" : "text-right"}>
      <div className={centered ? "mx-auto max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <span className="eyebrow">
            {icon}
            {eyebrow}
          </span>
        )}
        <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.3] text-foreground sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{subtitle}</p>
        )}
      </div>
    </Reveal>
  );
}
