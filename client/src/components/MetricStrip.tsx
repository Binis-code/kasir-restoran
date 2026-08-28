import { Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/Button";
import { runningOrdersCount, salesToday, usePos } from "./PosContext";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";

export function MetricStrip() {
  const { orders } = usePos();
  const running = runningOrdersCount(orders);
  const paidOrders = orders.filter((o) => o.status === "sudah-dibayar");
  const avgOrder =
    paidOrders.length > 0
      ? Math.round(
          paidOrders.reduce((sum, o) => sum + o.total, 0) / paidOrders.length,
        )
      : 185000;

  return (
    <section
      aria-label="Ringkasan operasional"
      className="grid grid-cols-2 divide-ink/8 overflow-hidden rounded-xl border border-ink/8 bg-white lg:grid-cols-4 lg:divide-x"
    >
      <MetricCell
        active
        label={t.metrics.running}
        value={String(running).padStart(2, "0")}
        delta={t.metrics.runningDelta}
      />
      <MetricCell
        label={t.metrics.todaySales}
        value={formatIDR(salesToday(orders))}
        delta={t.metrics.salesDelta}
      />
      <MetricCell
        label={t.metrics.avgOrder}
        value={formatIDR(avgOrder)}
        delta={t.metrics.avgWindow}
      />
      <div className="flex items-center justify-center p-4">
        <Button variant="outline" onClick={() => toast(t.toasts.drawerOpened)}>
          <Banknote size={17} />
          {t.metrics.openDrawer}
        </Button>
      </div>
    </section>
  );
}

function MetricCell({
  label,
  value,
  delta,
  active = false,
}: {
  label: string;
  value: string;
  delta: string;
  active?: boolean;
}) {
  return (
    <div className="relative min-w-0 p-4">
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-counterlime"
        />
      )}
      <p className="label-caps text-[11px] font-medium text-ink/50">{label}</p>
      <p className="mt-1 truncate font-display text-xl font-bold tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs text-ink/50">{delta}</p>
    </div>
  );
}
