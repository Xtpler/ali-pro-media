import { m, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

/**
 * Scroll-linked parallax: the wrapped content drifts vertically at a different
 * speed than the page. Falls back to static under reduced motion (the
 * transform is snapped via <MotionConfig reducedMotion="user">).
 */
export function Parallax({
  children,
  className,
  offset = 48,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return (
    <m.div ref={ref} className={className} style={{ y }}>
      {children}
    </m.div>
  );
}
