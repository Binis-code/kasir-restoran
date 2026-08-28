import { useMemo, useState } from "react";
import { Banknote, FileSpreadsheet, Printer, ReceiptText } from "lucide-react";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { Header } from "../components/Header";
import { usePos } from "../components/PosContext";
import { usePrint } from "../components/PrintContext";
import { Button } from "../components/ui/Button";
import {
  exportReportExcel,
  groupDaily,
  groupMonthly,
  type DailyRow,
  type MonthlyRow,
} from "../lib/exporters";
import { toast } from "sonner";
import { cn } from "../lib/cn";

function formatTanggal(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function formatBulan(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}-01`));
}

export default function Reports() {
  const { orders } = usePos();
  const { printReport } = usePrint();
  const [tab, setTab] = useState<"harian" | "bulanan">("harian");

  const paidOrders = useMemo(
    () => orders.filter((o) => o.status === "sudah-dibayar" && o.paidAt),
    [orders],
  );

  const daily = useMemo(() => groupDaily(paidOrders).slice(-14), [paidOrders]);
  const monthly = useMemo(() => groupMonthly(paidOrders).slice(-6), [paidOrders]);

  const activeRows: Array<DailyRow | MonthlyRow> = tab === "harian" ? daily : monthly;
  const totalSales = activeRows.reduce((sum, r) => sum + r.sales, 0);
  const totalOrders = activeRows.reduce((sum, r) => sum + r.orders, 0);
  const totalItems = activeRows.reduce((sum, r) => sum + r.items, 0);
  const maxSales = Math.max(1, ...activeRows.map((r) => r.sales));

  const labelOf = (r: DailyRow | MonthlyRow) =>
    tab === "harian" ? formatTanggal(r.key) : formatBulan(r.key);

  const handleExcel = () => {
    if (activeRows.length === 0) return;
    void exportReportExcel(daily, monthly);
    toast.success(t.data.exported, { description: t.data.exportedBody });
  };

  const handlePdf = () => {
    if (activeRows.length === 0) return;
    printReport({
      title: t.reportsPage.printTitle,
      period:
        activeRows.length > 0
          ? `${labelOf(activeRows[0])} — ${labelOf(activeRows[activeRows.length - 1])}`
          : "-",
      rows: activeRows.map((r) => ({
        label: labelOf(r),
        orders: r.orders,
        items: r.items,
        sales: formatIDR(r.sales),
      })),
      totalSales: formatIDR(totalSales),
      totalOrders,
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t.reportsPage.title} />
      <div className="flex-1 p-5 md:p-8">
        <p className="-mt-1 mb-5 text-sm text-ink/55">{t.reportsPage.subtitle}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-3xl">
          <article className="card-hover rounded-xl border border-ink/10 bg-white p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-counterlime text-ink">
                <Banknote size={19} aria-hidden="true" />
              </span>
              <h3 className="label-caps text-[11px] font-medium text-ink/55">
                {t.reportsPage.netSales}
              </h3>
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
              {formatIDR(totalSales)}
            </p>
          </article>

          <article className="card-hover rounded-xl border border-ink/10 bg-white p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-counterlime">
                <ReceiptText size={19} aria-hidden="true" />
              </span>
              <h3 className="label-caps text-[11px] font-medium text-ink/55">
                {t.reportsPage.completedOrders}
              </h3>
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
              {totalOrders}
              <span className="ml-2 text-base font-medium text-ink/40">
                {totalItems} {t.reportsPage.colItems.toLowerCase()}
              </span>
            </p>
          </article>
        </div>

        <section
          aria-label={t.reportsPage.title}
          className="mt-6 max-w-4xl rounded-xl border border-ink/10 bg-white p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg bg-ink/5 p-1">
              {(["harian", "bulanan"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "pressable h-10 rounded-md px-4 text-sm font-medium",
                    tab === key
                      ? "bg-counterlime font-semibold text-ink shadow-sm"
                      : "text-ink/55 hover:text-ink",
                  )}
                >
                  {key === "harian" ? t.reportsPage.tabHarian : t.reportsPage.tabBulanan}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExcel} disabled={activeRows.length === 0}>
                <FileSpreadsheet size={15} aria-hidden="true" />
                {t.reportsPage.exportExcel}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePdf} disabled={activeRows.length === 0}>
                <Printer size={15} aria-hidden="true" />
                {t.reportsPage.exportPdf}
              </Button>
            </div>
          </div>

          {activeRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/50">
              {t.reportsPage.empty}
            </p>
          ) : (
            <>
              <div
                className="mt-5 flex h-36 items-end gap-1.5"
                role="img"
                aria-label={`${t.reportsPage.title} ${tab}`}
              >
                {activeRows.map((r) => (
                  <div
                    key={r.key}
                    title={`${labelOf(r)} — ${formatIDR(r.sales)}`}
                    className="min-w-6 flex-1 rounded-t-md bg-counterlime hover:bg-ink"
                    style={{ height: `${Math.max(4, (r.sales / maxSales) * 100)}%` }}
                  />
                ))}
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink/10">
                      <th scope="col" className="label-caps py-2.5 text-[11px] font-semibold text-ink/50">
                        {t.reportsPage.colDate}
                      </th>
                      <th scope="col" className="label-caps py-2.5 text-right text-[11px] font-semibold text-ink/50">
                        {t.reportsPage.colOrders}
                      </th>
                      <th scope="col" className="label-caps py-2.5 text-right text-[11px] font-semibold text-ink/50">
                        {t.reportsPage.colItems}
                      </th>
                      <th scope="col" className="label-caps py-2.5 text-right text-[11px] font-semibold text-ink/50">
                        {t.reportsPage.colSales}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...activeRows].reverse().map((r) => (
                      <tr key={r.key} className="border-b border-ink/6 last:border-0">
                        <td className="py-2.5 font-medium text-ink">{labelOf(r)}</td>
                        <td className="py-2.5 text-right text-ink/70">{r.orders}</td>
                        <td className="py-2.5 text-right text-ink/70">{r.items}</td>
                        <td className="py-2.5 text-right font-display font-bold text-ink">
                          {formatIDR(r.sales)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

