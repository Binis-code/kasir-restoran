import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Armchair, Coffee, Edit, Plus, UtensilsCrossed } from "lucide-react";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { Header } from "../components/Header";
import { Button } from "../components/ui/Button";
import { TableModal } from "../components/TableModal";
import { usePos, type TableRow } from "../components/PosContext";
import { cn } from "../lib/cn";

export default function Tables() {
  const pos = usePos();
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableRow | null>(null);
  const [activeAreaFilter, setActiveAreaFilter] = useState<string>("Semua");

  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    for (const tbl of pos.tables) {
      if (tbl.area && tbl.area.trim()) set.add(tbl.area.trim());
    }
    return Array.from(set);
  }, [pos.tables]);

  const filteredTables = useMemo(() => {
    if (activeAreaFilter === "Semua") return pos.tables;
    return pos.tables.filter((tbl) => (tbl.area || "Utama") === activeAreaFilter);
  }, [pos.tables, activeAreaFilter]);

  const handleOpenAdd = () => {
    setSelectedTable(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (table: TableRow, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTable(table);
    setModalOpen(true);
  };

  const handleSave = async (table: TableRow) => {
    if (selectedTable) {
      await pos.updateTable(table);
    } else {
      await pos.addTable(table);
    }
  };

  const handleDelete = async (id: string) => {
    await pos.deleteTable(id);
  };

  const handleSelectTableAndOrder = (table: TableRow) => {
    pos.selectTable(table);
    setLocation("/");
  };

  // Find if table has an active draft or unpaid order
  const getTableActiveOrder = (table: TableRow) => {
    const numMatch = table.name.match(/\d+/);
    const num = numMatch ? Number.parseInt(numMatch[0], 10) : undefined;
    if (!num) return null;

    // Check currently active draft cart in POS
    if (pos.orderType === "meja" && pos.tableNumber === num && pos.lines.length > 0) {
      return {
        orderNo: pos.orderNo,
        total: pos.totals.total,
        label: "Sedang Dipesan",
      };
    }

    // Check unpaid stored orders
    const activeOrder = pos.orders.find(
      (o) => o.orderType === "meja" && o.tableNumber === num && o.status !== "sudah-dibayar",
    );
    if (activeOrder) {
      return {
        orderNo: activeOrder.no,
        total: activeOrder.total,
        label: activeOrder.status === "siap" ? "Siap Disajikan" : "Disimpan",
      };
    }

    return null;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t.tablesPage.title} />
      <div className="flex-1 p-5 md:p-8">
        <div className="-mt-1 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink/55">{t.tablesPage.subtitle}</p>
            <p className="text-xs font-semibold text-ink/40">
              Total: {pos.tables.length} meja makan terdaftar
            </p>
          </div>
          <Button onClick={handleOpenAdd}>
            <Plus size={16} className="mr-1" />
            Tambah Meja Baru
          </Button>
        </div>

        {/* Area Filter Tabs */}
        {availableAreas.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-1.5 border-b border-ink/10 pb-3">
            <span className="text-xs font-bold text-ink/50 mr-2">Filter Area:</span>
            <button
              type="button"
              onClick={() => setActiveAreaFilter("Semua")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                activeAreaFilter === "Semua"
                  ? "bg-ink text-mineral shadow-xs"
                  : "bg-ink/5 text-ink/70 hover:bg-ink/10",
              )}
            >
              Semua Area ({pos.tables.length})
            </button>

            {availableAreas.map((areaName) => {
              const count = pos.tables.filter((t) => (t.area || "Utama") === areaName).length;
              const isSelected = activeAreaFilter === areaName;
              return (
                <button
                  key={areaName}
                  type="button"
                  onClick={() => setActiveAreaFilter(areaName)}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                    isSelected
                      ? "bg-counterlime text-ink font-bold shadow-xs"
                      : "bg-ink/5 text-ink/70 hover:bg-ink/10",
                  )}
                >
                  {areaName} ({count})
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTables.map((table) => {
            const activeInfo = getTableActiveOrder(table);
            const isActive = !!activeInfo;

            return (
              <article
                key={table.id}
                onClick={() => handleSelectTableAndOrder(table)}
                className={cn(
                  "card-hover cursor-pointer rounded-xl border bg-white p-5 transition-all hover:shadow-md",
                  isActive
                    ? "border-counterlime ring-2 ring-counterlime/40"
                    : "border-ink/10 hover:border-ink/25",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-lg",
                        isActive ? "bg-counterlime text-ink" : "bg-ink/5 text-ink/60",
                      )}
                    >
                      <Armchair size={21} aria-hidden="true" />
                    </span>
                    <div>
                      <span className="rounded-md bg-ink/6 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/60">
                        {table.area || "Utama"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={
                        isActive
                          ? "rounded-full bg-counterlime px-2.5 py-1 text-[11px] font-bold text-ink"
                          : "rounded-full bg-ink/6 px-2.5 py-1 text-[11px] font-semibold text-ink/55"
                      }
                    >
                      {isActive ? activeInfo.label : t.tablesPage.empty}
                    </span>

                    <button
                      type="button"
                      aria-label={`Edit ${table.name}`}
                      onClick={(e) => handleOpenEdit(table, e)}
                      className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink"
                    >
                      <Edit size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="mt-3 font-display text-base font-bold tracking-tight text-ink">
                  {table.name}
                </h3>
                <p className="mt-0.5 text-xs text-ink/50">
                  {t.tablesPage.seatsUnit(table.seats)}
                </p>

                {isActive ? (
                  <div className="mt-3 border-t border-dashed border-ink/15 pt-3">
                    <p className="font-display text-sm font-bold text-ink">
                      {t.tablesPage.activeOrder(activeInfo.orderNo, formatIDR(activeInfo.total))}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-counterlime-dark">
                      Klik untuk buka / tambah menu meja ini
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 border-t border-ink/6 pt-3 flex items-center justify-between text-xs text-ink/40">
                    <span>Meja Kosong</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-ink/70 hover:underline">
                      <UtensilsCrossed size={12} /> Buka Pesanan
                    </span>
                  </div>
                )}
              </article>
            );
          })}

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

      <TableModal
        open={modalOpen}
        tableToEdit={selectedTable}
        availableAreas={availableAreas}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
