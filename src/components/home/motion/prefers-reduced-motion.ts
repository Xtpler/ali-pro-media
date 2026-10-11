/**
 * SSR-safe check for `prefers-reduced-motion`. Returns `false` on the server
 * and on browsers that don't support `matchMedia`, so server/client first
 * renders always agree (no hydration mismatch).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
