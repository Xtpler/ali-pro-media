import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ variant = "switch" }: { variant?: "switch" | "icon" }) {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isLight ? "تفعيل الوضع الليلي" : "تفعيل الوضع النهاري"}
        className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-primary"
      >
        {isLight ? <Moon size={17} /> : <Sun size={17} />}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 transition-colors duration-300">
      <span className="flex items-center gap-2 text-sm font-medium text-card-foreground">
        {isLight ? (
          <Sun size={17} className="text-primary" />
        ) : (
          <Moon size={17} className="text-primary" />
        )}
        {isLight ? "الوضع النهاري" : "الوضع الليلي"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isLight}
        aria-label="تبديل الوضع الليلي والنهاري"
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${isLight ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-foreground shadow transition-all duration-300 ${isLight ? "right-0.5" : "right-[1.375rem]"}`}
        >
          {isLight ? <Sun size={12} /> : <Moon size={12} />}
        </span>
      </button>
    </div>
  );
}
