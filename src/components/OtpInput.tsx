import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

const SLOTS = [0, 1, 2, 3, 4, 5];

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const commit = (next: string) => {
    onChange(next);
    if (next.length === 6) onComplete?.(next);
  };

  const setDigit = (index: number, digit: string) => {
    const chars = value.padEnd(6, " ").split("");
    chars[index] = digit || " ";
    const next = chars.join("").replace(/\s+$/, "").replace(/\s/g, "").slice(0, 6);
    commit(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      e.preventDefault();
      commit(value.slice(0, index - 1));
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index < 5) refs.current[index + 1]?.focus();
    if (e.key === "ArrowRight" && index > 0) refs.current[index - 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    commit(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div dir="ltr" className="flex items-center justify-center gap-2 sm:gap-3">
      {SLOTS.map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          aria-label={`الرقم ${i + 1}`}
          autoFocus={i === 0}
          onChange={(e) => setDigit(i, e.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className="h-14 w-11 rounded-2xl border border-emerald-400/40 bg-white text-center font-mono text-2xl font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:shadow-[0_0_0_4px_rgba(16,185,129,.15)] disabled:opacity-50 sm:w-12"
        />
      ))}
    </div>
  );
}
