import { m, useMotionTemplate, useMotionValue, useSpring, type MotionStyle } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/components/home/motion/prefers-reduced-motion";

/**
 * Pointer-driven 3D tilt. Rotations are spring-smoothed motion values so the
 * card feels weighty, and a subtle radial glare follows the cursor. Disabled
 * entirely under `prefers-reduced-motion` (no listeners are attached).
 */
export function TiltCard({
  children,
  className,
  style,
  max = 6,
  scale = 1.015,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  style?: MotionStyle;
  max?: number;
  scale?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 240, damping: 20, mass: 0.7 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 240, damping: 20, mass: 0.7 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareBackground = useMotionTemplate`radial-gradient(420px circle at ${glareX}% ${glareY}%, color-mix(in oklab, var(--color-primary) 15%, transparent), transparent 46%)`;
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      rotateX.set(-(py - 0.5) * max * 2);
      rotateY.set((px - 0.5) * max * 2);
      if (glare) {
        glareX.set(px * 100);
        glareY.set(py * 100);
      }
    };
    const onLeave = () => {
      rotateX.set(0);
      rotateY.set(0);
      glareX.set(50);
      glareY.set(50);
    };
    node.addEventListener("pointermove", onMove, { passive: true });
    node.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [glare, max, rotateX, rotateY, glareX, glareY]);

  const hoverProps = reduced ? {} : { whileHover: { scale } };

  return (
    <m.div
      ref={ref}
      className={className}
      style={{ ...style, rotateX, rotateY, transformPerspective: 1000 }}
      {...hoverProps}
      transition={{ scale: { type: "spring", stiffness: 320, damping: 24 } }}
    >
      {children}
      {glare && (
        <m.div aria-hidden className="tilt-glare" style={{ background: glareBackground }} />
      )}
    </m.div>
  );
}
