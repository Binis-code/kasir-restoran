import { cn } from "../../lib/cn";

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: "neutral" | "lime" | "coral" | "dark";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-ink/8 text-ink/70",
    lime: "bg-counterlime text-ink",
    coral: "bg-coral text-white",
    dark: "bg-ink text-mineral",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
