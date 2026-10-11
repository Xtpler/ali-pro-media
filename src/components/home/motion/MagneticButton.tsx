import { m, useMotionValue, useSpring, type MotionStyle } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/components/home/motion/prefers-reduced-motion";

/**
 * Wraps a control (button/link) and nudges it toward the cursor within the
 * wrapper bounds, springing back on leave. Disabled under reduced motion.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.25,
  style,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  style?: MotionStyle;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 180, damping: 15, mass: 0.5 });
  const y = useSpring(useMotionValue(0), { stiffness: 180, damping: 15, mass: 0.5 });

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
      y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };
    node.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [strength, x, y]);

  return (
    <m.div ref={ref} className={className} style={{ x, y, ...style }}>
      {children}
    </m.div>
  );
}
