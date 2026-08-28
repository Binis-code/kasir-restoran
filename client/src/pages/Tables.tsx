import { Armchair, Coffee } from "lucide-react";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { Header } from "../components/Header";
import { usePos } from "../components/PosContext";
import { cn } from "../lib/cn";

type TableCard = {
  id: string;
  name: string;
  seats: number;
  active?: boolean;
};

export default function Tables() {
  const pos = usePos();
  const tableActive = pos.orderType === "meja" && pos.lines.length > 0;

  const tables: TableCard[] = [
    { id: "meja-01", name: "Meja 01", seats: 2 },
    { id: "meja-02", name: "Meja 02", seats: 4 },
    { id: "meja-03", name: "Meja 03", seats: 4 },
    {
      id: "meja-04",
      name: `Meja ${String(pos.tableNumber).padStart(2, "0")}`,
      seats: 4,
      active: tableActive,
    },
    { id: "teras-01", name: "Teras 01", seats: 6 },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t.tablesPage.title} />
      <div className="flex-1 p-5 md:p-8">
        <p className="-mt-1 mb-5 text-sm text-ink/55">{t.tablesPage.subtitle}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <article
              key={table.id}
              className={cn(
                "card-hover rounded-xl border bg-white p-5",
                table.active
                  ? "border-counterlime ring-1 ring-counterlime"
                  : "border-ink/10",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    table.active ? "bg-counterlime text-ink" : "bg-ink/5 text-ink/60",
                  )}
                >
                  <Armchair size={21} aria-hidden="true" />
                </span>
                <span
                  className={
                    table.active
                      ? "rounded-full bg-counterlime px-2.5 py-1 text-[11px] font-bold text-ink"
                      : "rounded-full bg-ink/6 px-2.5 py-1 text-[11px] font-semibold text-ink/55"
                  }
                >
                  {table.active ? "Aktif" : t.tablesPage.empty}
                </span>
              </div>
              <h3 className="mt-3 font-display text-base font-bold tracking-tight text-ink">
                {table.name}
              </h3>
              <p className="mt-0.5 text-xs text-ink/50">
                {t.tablesPage.seatsUnit(table.seats)}
              </p>
              {table.active && (
                <p className="mt-3 border-t border-dashed border-ink/15 pt-3 font-display text-sm font-bold text-ink">
                  {t.tablesPage.activeOrder(pos.orderNo, formatIDR(pos.totals.total))}
                </p>
              )}
            </article>
          ))}

          <article className="card-hover rounded-xl border border-ink/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-counterlime text-ink">
                <Coffee size={21} aria-hidden="true" />
              </span>
              <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-mineral">
                {t.station}
              </span>
            </div>
            <h3 className="mt-3 font-display text-base font-bold tracking-tight text-ink">
              {t.tablesPage.cashierStation}
            </h3>
            <p className="mt-0.5 text-xs text-ink/50">{t.cashier.name}</p>
          </article>
        </div>
      </div>
    </div>
  );
}
