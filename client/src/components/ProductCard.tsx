import { Check, Clock } from "lucide-react";
import type { MenuItem } from "../data/menu";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { FoodImage } from "./FoodImage";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/cn";

export function ProductCard({
  item,
  inOrder,
  onAdd,
}: {
  item: MenuItem;
  inOrder: boolean;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(item)}
      aria-label={ariaLabel(item, inOrder)}
      className={cn(
        "card-hover pressable group relative flex flex-col overflow-hidden rounded-xl border bg-white text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        inOrder ? "border-counterlime ring-1 ring-counterlime" : "border-ink/10",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink/5">
        <FoodImage item={item} className="h-full w-full" />
        {inOrder && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-counterlime px-2 py-1 text-[11px] font-bold text-ink shadow-sm">
            <Check size={12} strokeWidth={3} aria-hidden="true" />
            {t.catalog.inOrder}
          </span>
        )}
        {item.badge && !inOrder && (
          <span className="absolute left-2 top-2">
            <Badge tone="dark">{item.badge}</Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold leading-snug text-ink">
            {item.name}
          </h3>
          <p className="shrink-0 font-display text-[15px] font-bold tracking-tight text-ink">
            {formatIDR(item.price)}
          </p>
        </div>
        <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-ink/55">
          {item.description}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-ink/45">
          <Clock size={12} aria-hidden="true" />
          {item.kind} · {item.prepMinutes} {t.catalog.minutesSuffix}
        </p>
      </div>
    </button>
  );
}

function ariaLabel(item: MenuItem, inOrder: boolean): string {
  return inOrder
    ? `${item.name}, ${formatIDR(item.price)}. Tambah satu porsi lagi ke pesanan`
    : `${item.name}, ${formatIDR(item.price)}. Tambahkan ke pesanan`;
}
