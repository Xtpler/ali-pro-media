import { m } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Fade/slide reveal the first time the content scrolls into view. Animates
 * transform + opacity only, runs once, and honors `prefers-reduced-motion`
 * through <MotionConfig reducedMotion="user">.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  x = 0,
  y = 24,
  once = true,
  amount = 0.15,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  x?: number;
  y?: number;
  once?: boolean;
  amount?: number;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.65, delay, ease: [0.21, 0.61, 0.35, 1] }}
    >
      {children}
    </m.div>
  );
}
