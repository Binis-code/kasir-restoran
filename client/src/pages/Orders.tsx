import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { Header } from "../components/Header";
import { usePos, type OrderStatus } from "../components/PosContext";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

export default function Orders() {
  const [, navigate] = useLocation();
  const { orders } = usePos();

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t.ordersPage.title} />
      <div className="flex-1 p-5 md:p-8">
        <p className="-mt-1 mb-5 text-sm text-ink/55">{t.ordersPage.subtitle}</p>

        <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/10 bg-mineral/60">
                <th scope="col" className="label-caps px-5 py-3 text-[11px] font-semibold text-ink/50">
                  {t.ordersPage.colNo}
                </th>
                <th scope="col" className="label-caps px-5 py-3 text-[11px] font-semibold text-ink/50">
                  {t.ordersPage.colStatus}
                </th>
                <th scope="col" className="label-caps px-5 py-3 text-right text-[11px] font-semibold text-ink/50">
                  {t.ordersPage.colTotal}
                </th>
                <th scope="col" className="px-5 py-3" aria-label={t.ordersPage.colAction} />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.no}
                  className="relative border-b border-ink/6 last:border-0 hover:bg-mineral/40"
                >
                  <td className="relative px-5 py-4">
                    {order.status !== "sudah-dibayar" && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-counterlime"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold tracking-tight text-ink">
                        #{order.no}
                      </p>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-ink/70">
                        {order.tableName || (order.tableNumber ? `Meja ${order.tableNumber}` : "Bawa Pulang")}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink/50">
                      <span>{t.ordersPage.metaLine(order.itemCount)}</span>
                      {order.waiterName && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Pelayan: {order.waiterName}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusChip status={order.status} />
                  </td>
                  <td className="px-5 py-4 text-right font-display font-bold tracking-tight text-ink">
                    {formatIDR(order.total)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast(t.toasts.orderOpened(order.no));
                        navigate("/");
                      }}
                    >
                      {t.ordersPage.open}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; tone: "lime" | "neutral" | "dark" }> = {
    memasak: { label: "Dimasak", tone: "lime" },
    siap: { label: t.ordersPage.statusSiap, tone: "lime" },
    "sudah-dibayar": { label: t.ordersPage.statusDibayar, tone: "neutral" },
    disimpan: { label: t.ordersPage.statusDisimpan, tone: "dark" },
  };
  const entry = map[status] || { label: status, tone: "neutral" };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
