import { cn } from "../lib/cn";

export function KasaMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Logo KASA"
    >
      <rect width="32" height="32" rx="7" fill="#14211F" />
      <path
        d="M9 6h14v20l-2.33-1.7L18.33 26 16 24.3 13.67 26l-2.34-1.7L9 26V6z"
        fill="#EEF0EB"
      />
      <rect x="12" y="10" width="8" height="2" rx="1" fill="#14211F" />
      <rect x="12" y="14" width="5" height="2" rx="1" fill="#C7F36B" />
      <rect x="12" y="18" width="8" height="2" rx="1" fill="#14211F" opacity="0.55" />
    </svg>
  );
}

export function KasaLogoBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <KasaMark size={compact ? 30 : 38} />
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-tight text-white">
            KASA
          </p>
          <p className="label-caps text-[11px] font-medium text-white/50">
            SISTEM KASIR
          </p>
        </div>
      )}
    </div>
  );
}

export function StatusDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block h-2 w-2 rounded-full bg-emerald-400", className)}
    />
  );
}
