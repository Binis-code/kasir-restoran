import { useState, useMemo, useEffect } from "react";
import { usePos } from "../components/PosContext";
import { formatIDR } from "../data/menu";
import { loadShiftHistory } from "../lib/repo";
import { Header } from "../components/Header";
import { Button } from "../components/ui/Button";
import type {
  CashMovementType,
  CashMovementCategory,
  ShiftRecord,
} from "../lib/db";
import {
  Vault,
  PlusCircle,
  MinusCircle,
  ReceiptText,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Calculator,
  Printer,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Coins,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/cn";

const DENOMINATIONS = [
  { value: 100_000, label: "Rp 100.000", color: "bg-red-50 text-red-700 border border-red-200" },
  { value: 50_000, label: "Rp 50.000", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  { value: 20_000, label: "Rp 20.000", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  { value: 10_000, label: "Rp 10.000", color: "bg-purple-50 text-purple-700 border border-purple-200" },
  { value: 5_000, label: "Rp 5.000", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  { value: 2_000, label: "Rp 2.000", color: "bg-slate-50 text-slate-700 border border-slate-200" },
  { value: 1_000, label: "Rp 1.000", color: "bg-teal-50 text-teal-700 border border-teal-200" },
  { value: 500, label: "Koin Rp 500 / 1.000", color: "bg-zinc-50 text-zinc-700 border border-zinc-200" },
];

export default function CashDrawer() {
  const {
    activeShift,
    orders,
    cashMovements,
    openShift,
    closeShift,
    addCashMovement,
    deleteCashMovement,
    triggerOpenDrawer,
  } = usePos();

  const [activeTab, setActiveTab] = useState<"mutasi" | "histori">("mutasi");
  const [movementFilter, setMovementFilter] = useState<"ALL" | "CASH_IN" | "CASH_OUT">("ALL");

  // Modals state
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [openShiftModalOpen, setOpenShiftModalOpen] = useState(false);
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedShiftForReceipt, setSelectedShiftForReceipt] = useState<ShiftRecord | null>(null);

  // Form state for Cash Movement
  const [movementType, setMovementType] = useState<CashMovementType>("CASH_OUT");
  const [movementCategory, setMovementCategory] = useState<CashMovementCategory>("operasional");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDesc, setMovementDesc] = useState("");

  // Form state for Open Shift
  const [cashierNameInput, setCashierNameInput] = useState("Jamie Morgan");
  const [startingCashInput, setStartingCashInput] = useState("200000");

  // Form state for Close Shift (Denominations)
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
  });
  const [customManualCash, setCustomManualCash] = useState("");
  const [useDenomCalculator, setUseDenomCalculator] = useState(true);
  const [closingNotes, setClosingNotes] = useState("");

  // Shift History
  const [shiftHistory, setShiftHistory] = useState<ShiftRecord[]>([]);

  const fetchShiftHistory = async () => {
    const list = await loadShiftHistory();
    setShiftHistory(list);
  };

  useEffect(() => {
    void fetchShiftHistory();
  }, [activeShift]);

  // Current Shift Financial Metrics Calculations
  const shiftStartTime = activeShift?.openedAt ?? (Date.now() - 28800_000);
  const startingCash = activeShift?.startingCash ?? 200_000;

  const currentShiftOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "sudah-dibayar" &&
        (o.paidAt ? o.paidAt >= shiftStartTime : o.createdAt >= shiftStartTime)
    );
  }, [orders, shiftStartTime]);

  const cashSales = useMemo(() => {
    return currentShiftOrders
      .filter((o) => o.method === "tunai")
      .reduce((sum, o) => sum + o.total, 0);
  }, [currentShiftOrders]);

  const nonCashSales = useMemo(() => {
    return currentShiftOrders
      .filter((o) => o.method !== "tunai")
      .reduce((sum, o) => sum + o.total, 0);
  }, [currentShiftOrders]);

  const currentShiftMovements = useMemo(() => {
    return cashMovements.filter((m) => m.createdAt >= shiftStartTime);
  }, [cashMovements, shiftStartTime]);

  const totalCashIn = useMemo(() => {
    return currentShiftMovements
      .filter((m) => m.type === "CASH_IN" && m.category !== "modal_awal")
      .reduce((sum, m) => sum + m.amount, 0);
  }, [currentShiftMovements]);

  const totalCashOut = useMemo(() => {
    return currentShiftMovements
      .filter((m) => m.type === "CASH_OUT")
      .reduce((sum, m) => sum + m.amount, 0);
  }, [currentShiftMovements]);

  const expectedDrawerCash = startingCash + cashSales + totalCashIn - totalCashOut;

  // Calculated physical cash from denomination counts
  const totalPhysicalCash = useMemo(() => {
    if (!useDenomCalculator) {
      return Number.parseInt(customManualCash.replace(/\D/g, ""), 10) || 0;
    }
    return Object.entries(denomCounts).reduce(
      (sum, [valStr, qty]) => sum + Number.parseInt(valStr, 10) * (qty || 0),
      0
    );
  }, [denomCounts, useDenomCalculator, customManualCash]);

  const cashDifference = totalPhysicalCash - expectedDrawerCash;

  // Filtered movements for table
  const displayedMovements = useMemo(() => {
    if (movementFilter === "ALL") return cashMovements;
    return cashMovements.filter((m) => m.type === movementFilter);
  }, [cashMovements, movementFilter]);

  // Handlers
  const handleOpenDrawer = () => {
    triggerOpenDrawer();
    toast.success("Perintah buka laci kas (Drawer Kick) dikirim!", {
      description: "Sinyal pulsa ESC/POS pin telah dikirim ke printer kasir.",
      icon: <Vault className="w-5 h-5 text-counterlime-dark" />,
    });
  };

  const handleCreateMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseInt(movementAmount.replace(/\D/g, ""), 10) || 0;
    if (amount <= 0) {
      toast.error("Nominal kas harus lebih dari Rp 0");
      return;
    }
    if (!movementDesc.trim()) {
      toast.error("Keterangan kas harus diisi");
      return;
    }

    try {
      await addCashMovement({
        type: movementType,
        category: movementCategory,
        amount,
        description: movementDesc.trim(),
        cashierName: activeShift?.cashierName || "Jamie Morgan",
      });

      triggerOpenDrawer();
      setMovementModalOpen(false);
      setMovementAmount("");
      setMovementDesc("");
      toast.success(
        movementType === "CASH_IN"
          ? `Kas Masuk ${formatIDR(amount)} berhasil dicatat!`
          : `Kas Keluar ${formatIDR(amount)} berhasil dicatat!`
      );
    } catch {
      toast.error("Gagal mencatat mutasi kas.");
    }
  };

  const handleDeleteMovement = async (id: string, desc: string) => {
    if (confirm(`Hapus catatan mutasi "${desc}"?`)) {
      await deleteCashMovement(id);
      toast.success("Catatan mutasi kas berhasil dihapus.");
    }
  };

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sc = Number.parseInt(startingCashInput.replace(/\D/g, ""), 10) || 0;
    await openShift(cashierNameInput.trim() || "Kasir", sc);
    setOpenShiftModalOpen(false);
    triggerOpenDrawer();
    toast.success(`Shift kasir dibuka dengan modal awal ${formatIDR(sc)}`);
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const denomRecord: Record<string, number> = {};
      Object.entries(denomCounts).forEach(([k, v]) => {
        if (v > 0) denomRecord[k] = v;
      });

      const closed = await closeShift(totalPhysicalCash, closingNotes, denomRecord);
      setCloseShiftModalOpen(false);
      setSelectedShiftForReceipt(closed);
      setReceiptModalOpen(true);
      void fetchShiftHistory();

      if (closed.cashDifference === 0) {
        toast.success(`Shift ditutup. Uang laci pas: ${formatIDR(totalPhysicalCash)}`);
      } else if ((closed.cashDifference ?? 0) > 0) {
        toast.warning(
          `Shift ditutup. Uang laci surplus (+${formatIDR(closed.cashDifference ?? 0)})`
        );
      } else {
        toast.error(
          `Shift ditutup. Uang laci minus (${formatIDR(closed.cashDifference ?? 0)})`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menutup shift");
    }
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen flex-col bg-mineral">
      <Header title="Laci Kas & Manajemen Shift" />

      <div className="flex-1 p-5 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Status Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ink/10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-counterlime/20 text-ink flex items-center justify-center border border-counterlime/30">
              <Vault className="w-6 h-6 text-counterlime-dark" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink">
                  Status Shift Kasir
                </h2>
                {activeShift ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-counterlime/20 text-counterlime-dark border border-counterlime/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-counterlime-dark animate-pulse" />
                    Shift Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ink/10 text-ink/70">
                    Shift Tertutup
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-ink/55 mt-0.5 flex items-center gap-2">
                <span>Kasir: <strong className="text-ink font-semibold">{activeShift?.cashierName || "Jamie Morgan"}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-ink/40" />
                  Dibuka: {new Date(shiftStartTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenDrawer}
              className="gap-2 font-medium"
            >
              <Vault size={16} className="text-counterlime-dark" />
              Buka Laci (Drawer Kick)
            </Button>

            {activeShift ? (
              <Button
                variant="ink"
                size="sm"
                onClick={() => setCloseShiftModalOpen(true)}
                className="gap-2 bg-coral hover:bg-coral/90 text-white font-semibold border-0"
              >
                <ReceiptText size={16} />
                Tutup Shift (Z-Report)
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setOpenShiftModalOpen(true)}
                className="gap-2 font-semibold"
              >
                <PlusCircle size={16} />
                Buka Shift Baru
              </Button>
            )}
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Expected Drawer Cash */}
          <article className="rounded-2xl border border-counterlime/40 bg-white p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[11px] font-semibold text-ink/60 uppercase">
                Uang di Laci Saat Ini
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-counterlime text-ink">
                <DollarSign size={16} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              {formatIDR(expectedDrawerCash)}
            </p>
            <div className="text-xs text-ink/55 mt-2 flex items-center justify-between">
              <span>Modal Awal: {formatIDR(startingCash)}</span>
              <span className="font-semibold text-counterlime-dark">Sistem Ekspektasi</span>
            </div>
          </article>

          {/* Card 2: Cash Sales */}
          <article className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[11px] font-semibold text-ink/60 uppercase">
                Penjualan Tunai Shift
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                <ArrowDownLeft size={16} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
              {formatIDR(cashSales)}
            </p>
            <div className="text-xs text-ink/55 mt-2 flex items-center justify-between">
              <span>Non-Tunai: {formatIDR(nonCashSales)}</span>
              <span className="text-blue-700 font-semibold">{currentShiftOrders.length} Nota Lunas</span>
            </div>
          </article>

          {/* Card 3: Cash In */}
          <article className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[11px] font-semibold text-ink/60 uppercase">
                Total Kas Masuk (In)
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <ArrowDownLeft size={16} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-emerald-700">
              +{formatIDR(totalCashIn)}
            </p>
            <p className="text-xs text-ink/55 mt-2">
              Top-up modal / uang kembalian
            </p>
          </article>

          {/* Card 4: Cash Out / Petty Cash */}
          <article className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[11px] font-semibold text-ink/60 uppercase">
                Kas Keluar (Petty Cash)
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-rose-600">
              -{formatIDR(totalCashOut)}
            </p>
            <p className="text-xs text-ink/55 mt-2">
              Biaya operasional es, gas, bumbu
            </p>
          </article>
        </div>

        {/* Quick Action Buttons & Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMovementType("CASH_IN");
                setMovementCategory("setoran");
                setMovementModalOpen(true);
              }}
              className="gap-2 bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-semibold"
            >
              <PlusCircle size={15} className="text-emerald-600" />
              + Catat Kas Masuk (Cash In)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMovementType("CASH_OUT");
                setMovementCategory("operasional");
                setMovementModalOpen(true);
              }}
              className="gap-2 bg-rose-50/70 border-rose-200 text-rose-800 hover:bg-rose-100 font-semibold"
            >
              <MinusCircle size={15} className="text-rose-600" />
              - Catat Kas Keluar (Petty Cash)
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-ink/5 p-1 border border-ink/10">
            <button
              type="button"
              onClick={() => setActiveTab("mutasi")}
              className={cn(
                "pressable h-9 rounded-lg px-3 text-xs font-medium transition-all",
                activeTab === "mutasi"
                  ? "bg-counterlime font-semibold text-ink shadow-sm"
                  : "text-ink/60 hover:text-ink"
              )}
            >
              Log Mutasi Kas ({cashMovements.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("histori")}
              className={cn(
                "pressable h-9 rounded-lg px-3 text-xs font-medium transition-all",
                activeTab === "histori"
                  ? "bg-counterlime font-semibold text-ink shadow-sm"
                  : "text-ink/60 hover:text-ink"
              )}
            >
              Histori Shift ({shiftHistory.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Mutasi Kas */}
        {activeTab === "mutasi" ? (
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
            <div className="p-4 sm:p-5 border-b border-ink/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Log Mutasi Kas Masuk & Kas Keluar
                </h3>
                <p className="text-xs text-ink/55 mt-0.5">
                  Catatan mutasi kas laci secara terperinci untuk transparansi pembukuan.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {(["ALL", "CASH_IN", "CASH_OUT"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setMovementFilter(filter)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      movementFilter === filter
                        ? "bg-ink text-white border-ink font-semibold"
                        : "bg-white text-ink/60 border-ink/15 hover:text-ink"
                    )}
                  >
                    {filter === "ALL" ? "Semua" : filter === "CASH_IN" ? "Kas Masuk" : "Kas Keluar"}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/10 bg-mineral/60">
                    <th scope="col" className="label-caps px-5 py-3 text-[11px] font-semibold text-ink/50">
                      Waktu
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-[11px] font-semibold text-ink/50">
                      Tipe & Kategori
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-[11px] font-semibold text-ink/50">
                      Keterangan
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-[11px] font-semibold text-ink/50">
                      Staf / Kasir
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-right text-[11px] font-semibold text-ink/50">
                      Nominal
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-center text-[11px] font-semibold text-ink/50">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/6">
                  {displayedMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-ink/40 text-sm">
                        Belum ada catatan mutasi kas.
                      </td>
                    </tr>
                  ) : (
                    displayedMovements.map((mov) => (
                      <tr
                        key={mov.id}
                        className="hover:bg-mineral/40 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs text-ink/60">
                          {new Date(mov.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          •{" "}
                          {new Date(mov.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                                mov.type === "CASH_IN"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              )}
                            >
                              {mov.type === "CASH_IN" ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3" />
                              )}
                              {mov.type === "CASH_IN" ? "Kas Masuk" : "Kas Keluar"}
                            </span>
                            <span className="text-xs text-ink/60 capitalize">
                              {mov.category.replace("_", " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-ink">
                          {mov.description}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-ink/60">
                          {mov.cashierName}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3.5 text-right font-display font-bold",
                            mov.type === "CASH_IN" ? "text-emerald-700" : "text-rose-600"
                          )}
                        >
                          {mov.type === "CASH_IN" ? "+" : "-"}
                          {formatIDR(mov.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteMovement(mov.id, mov.description)}
                            className="p-1.5 rounded-lg text-ink/40 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus mutasi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Tab 2: Shift History (Z-Reports) */
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
            <div className="p-4 sm:p-5 border-b border-ink/10 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Histori Penutupan Shift (Z-Reports)
                </h3>
                <p className="text-xs text-ink/55 mt-0.5">
                  Rekapitulasi penutupan kasir dan selisih uang laci terdahulu.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink/10 bg-mineral/60">
                    <th scope="col" className="label-caps px-5 py-3 text-[11px] font-semibold text-ink/50">
                      Tanggal & Shift
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-[11px] font-semibold text-ink/50">
                      Kasir
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-right text-[11px] font-semibold text-ink/50">
                      Modal Awal
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-right text-[11px] font-semibold text-ink/50">
                      Omset Tunai
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-right text-[11px] font-semibold text-ink/50">
                      Fisik Dihitung
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-center text-[11px] font-semibold text-ink/50">
                      Selisih
                    </th>
                    <th scope="col" className="label-caps px-5 py-3 text-center text-[11px] font-semibold text-ink/50">
                      Struk Rekap
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/6">
                  {shiftHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-ink/40 text-sm">
                        Belum ada riwayat penutupan shift.
                      </td>
                    </tr>
                  ) : (
                    shiftHistory.map((shift) => {
                      const diff = shift.cashDifference ?? 0;
                      return (
                        <tr
                          key={shift.id}
                          className="hover:bg-mineral/40 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-ink">
                              {new Date(shift.openedAt).toLocaleDateString("id-ID", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-xs text-ink/50">
                              {new Date(shift.openedAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {shift.closedAt
                                ? new Date(shift.closedAt).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Sedang Berjalan"}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-ink">
                            {shift.cashierName}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-ink/70">
                            {formatIDR(shift.startingCash)}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-ink/70">
                            {formatIDR(shift.cashSalesTotal ?? 0)}
                          </td>
                          <td className="px-5 py-3.5 text-right font-display font-bold text-ink">
                            {formatIDR(shift.actualCash ?? 0)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {shift.status === "OPEN" ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-counterlime/20 text-counterlime-dark border border-counterlime/40">
                                Shift Aktif
                              </span>
                            ) : diff === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Pas (Rp 0)
                              </span>
                            ) : diff > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                +Surplus {formatIDR(diff)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> -Minus {formatIDR(Math.abs(diff))}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedShiftForReceipt(shift);
                                setReceiptModalOpen(true);
                              }}
                              className="gap-1.5 text-xs font-medium"
                            >
                              <Printer size={14} className="text-ink/60" />
                              Lihat Struk
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Catat Kas Masuk / Kas Keluar */}
      {movementModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
          onClick={() => setMovementModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl relative"
          >
            <div className="flex items-start justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">
                  {movementType === "CASH_IN" ? "Catat Kas Masuk (Cash In)" : "Catat Kas Keluar (Petty Cash)"}
                </h3>
                <p className="text-xs text-ink/55 mt-0.5">
                  {movementType === "CASH_IN"
                    ? "Tambahan uang modal atau kas masuk operasional ke laci kas."
                    : "Pengeluaran uang tunai dari laci untuk belanja operasional mendesak."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMovementModalOpen(false)}
                className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMovementSubmit} className="mt-5 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-mineral/80 rounded-xl border border-ink/10">
                <button
                  type="button"
                  onClick={() => {
                    setMovementType("CASH_IN");
                    setMovementCategory("setoran");
                  }}
                  className={cn(
                    "py-2 rounded-lg text-xs font-semibold transition-all",
                    movementType === "CASH_IN"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-ink/60 hover:text-ink"
                  )}
                >
                  + Kas Masuk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMovementType("CASH_OUT");
                    setMovementCategory("operasional");
                  }}
                  className={cn(
                    "py-2 rounded-lg text-xs font-semibold transition-all",
                    movementType === "CASH_OUT"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-ink/60 hover:text-ink"
                  )}
                >
                  - Kas Keluar
                </button>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                  Kategori
                </label>
                <select
                  value={movementCategory}
                  onChange={(e) => setMovementCategory(e.target.value as CashMovementCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink/15 bg-white text-sm text-ink focus:ring-2 focus:ring-counterlime focus:outline-none"
                >
                  {movementType === "CASH_IN" ? (
                    <>
                      <option value="setoran">Setoran Tambahan Kasir</option>
                      <option value="modal_awal">Tambah Modal Awal</option>
                      <option value="tips">Tips Bersama</option>
                      <option value="lainnya">Lain-lain</option>
                    </>
                  ) : (
                    <>
                      <option value="operasional">Biaya Operasional (Gas LPG, Galon, Listrik)</option>
                      <option value="bahan_baku">Bahan Baku Darurat (Es Batu, Bumbu, Sayur)</option>
                      <option value="tips">Distribusi Tips Karyawan</option>
                      <option value="lainnya">Lain-lain</option>
                    </>
                  )}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                  Nominal Uang (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-ink/40">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    value={movementAmount}
                    onChange={(e) => {
                      const num = Number.parseInt(e.target.value.replace(/\D/g, ""), 10);
                      setMovementAmount(isNaN(num) ? "" : num.toLocaleString("id-ID"));
                    }}
                    placeholder="Contoh: 25.000"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-ink/15 bg-white text-sm font-bold text-ink focus:ring-2 focus:ring-counterlime focus:outline-none"
                  />
                </div>

                {/* Quick nominal buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[10_000, 20_000, 50_000, 100_000, 200_000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setMovementAmount(amt.toLocaleString("id-ID"))}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-mineral/70 hover:bg-mineral text-ink/70 border border-ink/10"
                    >
                      +{formatIDR(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                  Keterangan / Rincian Pengeluaran
                </label>
                <textarea
                  required
                  rows={2}
                  value={movementDesc}
                  onChange={(e) => setMovementDesc(e.target.value)}
                  placeholder={
                    movementType === "CASH_IN"
                      ? "Contoh: Pecahan Rp 2.000 untuk uang kembalian"
                      : "Contoh: Beli Es Batu Kristal 2 Pack di warung sebelah"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink/15 bg-white text-sm text-ink focus:ring-2 focus:ring-counterlime focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMovementModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className={cn(
                    "text-white font-semibold",
                    movementType === "CASH_IN"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  )}
                >
                  Simpan Mutasi Kas
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Buka Shift Baru */}
      {openShiftModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
          onClick={() => setOpenShiftModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl relative"
          >
            <div className="flex items-start justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">
                  Buka Shift Kasir Baru
                </h3>
                <p className="text-xs text-ink/55 mt-0.5">
                  Mulai sesi kerja kasir baru dan masukkan modal awal di laci kas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenShiftModalOpen(false)}
                className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOpenShiftSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                  Nama Kasir Bertugas
                </label>
                <input
                  type="text"
                  required
                  value={cashierNameInput}
                  onChange={(e) => setCashierNameInput(e.target.value)}
                  placeholder="Nama Kasir"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink/15 bg-white text-sm font-semibold text-ink focus:ring-2 focus:ring-counterlime focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                  Modal Awal di Laci (Float)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-ink/40">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    value={Number.parseInt(startingCashInput.replace(/\D/g, ""), 10).toLocaleString("id-ID") || ""}
                    onChange={(e) => {
                      const num = Number.parseInt(e.target.value.replace(/\D/g, ""), 10);
                      setStartingCashInput(isNaN(num) ? "0" : String(num));
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-ink/15 bg-white text-sm font-bold text-ink focus:ring-2 focus:ring-counterlime focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenShiftModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-counterlime hover:bg-counterlime-dark text-ink font-semibold"
                >
                  Buka Shift Sekarang
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tutup Shift & Kalkulator Pecahan (Denominasi) */}
      {closeShiftModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px] overflow-y-auto"
          onClick={() => setCloseShiftModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl relative my-8"
          >
            <div className="flex items-start justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-coral/15 text-coral flex items-center justify-center border border-coral/30">
                  <Calculator className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    Tutup Shift & Hitung Uang Laci (Z-Report)
                  </h3>
                  <p className="text-xs text-ink/55">
                    Hitung fisik uang tunai di laci untuk rekonsiliasi kas dan deteksi selisih.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCloseShiftModalOpen(false)}
                className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="mt-5 space-y-5">
              {/* Mode switch: Kalkulator Denominasi vs Input Manual */}
              <div className="flex items-center justify-between p-3 bg-mineral/60 rounded-xl border border-ink/10">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-counterlime-dark" />
                  <span className="text-xs font-semibold text-ink">
                    Kalkulator Pecahan Uang (Rekomendasi)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseDenomCalculator(!useDenomCalculator)}
                  className="text-xs font-semibold text-counterlime-dark hover:underline"
                >
                  {useDenomCalculator ? "Ganti ke Input Manual" : "Ganti ke Hitung Pecahan"}
                </button>
              </div>

              {useDenomCalculator ? (
                /* Denomination Grid */
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-ink/70">
                    Masukkan Jumlah Lembar / Keping per Pecahan:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {DENOMINATIONS.map((d) => {
                      const qty = denomCounts[d.value] || 0;
                      const sub = d.value * qty;
                      return (
                        <div
                          key={d.value}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-ink/10 bg-mineral/30"
                        >
                          <div>
                            <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-bold", d.color)}>
                              {d.label}
                            </span>
                            <div className="text-xs text-ink/55 font-mono mt-0.5">
                              = {formatIDR(sub)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setDenomCounts((prev) => ({
                                  ...prev,
                                  [d.value]: Math.max(0, (prev[d.value] || 0) - 1),
                                }))
                              }
                              className="w-7 h-7 rounded-lg bg-white border border-ink/15 text-ink font-bold hover:bg-mineral flex items-center justify-center text-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={qty === 0 ? "" : qty}
                              onChange={(e) => {
                                const val = Number.parseInt(e.target.value, 10);
                                setDenomCounts((prev) => ({
                                  ...prev,
                                  [d.value]: isNaN(val) ? 0 : Math.max(0, val),
                                }));
                              }}
                              placeholder="0"
                              className="w-14 text-center py-1 rounded-lg border border-ink/15 font-bold text-sm bg-white text-ink"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDenomCounts((prev) => ({
                                  ...prev,
                                  [d.value]: (prev[d.value] || 0) + 1,
                                }))
                              }
                              className="w-7 h-7 rounded-lg bg-white border border-ink/15 text-ink font-bold hover:bg-mineral flex items-center justify-center text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Manual Cash Input */
                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                    Total Fisik Uang di Laci Kas (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-ink/40">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      value={customManualCash}
                      onChange={(e) => {
                        const num = Number.parseInt(e.target.value.replace(/\D/g, ""), 10);
                        setCustomManualCash(isNaN(num) ? "" : num.toLocaleString("id-ID"));
                      }}
                      placeholder="Contoh: 1.550.000"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-ink/15 bg-white text-base font-bold text-ink focus:ring-2 focus:ring-counterlime focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Real-time Reconciliation Box */}
              <div className="p-4 rounded-xl bg-mineral/60 border border-ink/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-ink/60">
                  <span>Kas Diharapkan Sistem:</span>
                  <span className="font-bold font-mono text-ink">
                    {formatIDR(expectedDrawerCash)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-ink/60">
                  <span>Total Fisik Dihitung Kasir:</span>
                  <span className="font-black font-mono text-base text-ink">
                    {formatIDR(totalPhysicalCash)}
                  </span>
                </div>
                <div className="pt-2 border-t border-ink/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">
                    Status Selisih Kas:
                  </span>
                  {cashDifference === 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uang Pas (Rp 0)
                    </span>
                  ) : cashDifference > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      + Surplus {formatIDR(cashDifference)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5" /> Minus {formatIDR(Math.abs(cashDifference))}
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                  Catatan Penutupan Shift (Opsional)
                </label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Contoh: Selisih Rp 5.000 karena pembulatan uang kembalian"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink/15 bg-white text-sm text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCloseShiftModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-coral hover:bg-coral/90 text-white font-bold gap-2"
                >
                  <ReceiptText size={16} />
                  Konfirmasi & Cetak Z-Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cetak Struk Rekap Shift (Z-Report Thermal Preview) */}
      {receiptModalOpen && selectedShiftForReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
          onClick={() => setReceiptModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl relative"
          >
            <div className="flex items-start justify-between border-b border-ink/10 pb-3">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Printer className="w-5 h-5 text-counterlime-dark" />
                Laporan Penutupan Shift (Z-Report)
              </h3>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Thermal Receipt Box */}
            <div className="mt-4 p-4 rounded-xl bg-mineral/40 border border-ink/15 font-mono text-xs text-ink space-y-2 select-text shadow-inner">
              <div className="text-center font-bold text-sm tracking-wide">
                KASA SISTEM KASIR
              </div>
              <div className="text-center text-ink/55 text-[11px]">
                REKAPITULASI PENUTUPAN SHIFT (Z-REPORT)
              </div>
              <div className="border-b border-dashed border-ink/20 my-2" />

              <div className="flex justify-between">
                <span>Shift ID:</span>
                <span>{selectedShiftForReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir Bertugas:</span>
                <span className="font-bold">{selectedShiftForReceipt.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu Buka:</span>
                <span>{new Date(selectedShiftForReceipt.openedAt).toLocaleTimeString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu Tutup:</span>
                <span>
                  {selectedShiftForReceipt.closedAt
                    ? new Date(selectedShiftForReceipt.closedAt).toLocaleTimeString("id-ID")
                    : "-"}
                </span>
              </div>

              <div className="border-b border-dashed border-ink/20 my-2" />

              <div className="flex justify-between">
                <span>(+) Modal Awal:</span>
                <span>{formatIDR(selectedShiftForReceipt.startingCash)}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) Penjualan Tunai:</span>
                <span>{formatIDR(selectedShiftForReceipt.cashSalesTotal ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) Kas Masuk:</span>
                <span>+{formatIDR(selectedShiftForReceipt.cashInTotal ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Kas Keluar:</span>
                <span>-{formatIDR(selectedShiftForReceipt.cashOutTotal ?? 0)}</span>
              </div>

              <div className="border-b border-dashed border-ink/20 my-2" />

              <div className="flex justify-between font-bold">
                <span>Ekspektasi Sistem:</span>
                <span>{formatIDR(selectedShiftForReceipt.expectedCash ?? 0)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-counterlime-dark">
                <span>Fisik Dihitung:</span>
                <span>{formatIDR(selectedShiftForReceipt.actualCash ?? 0)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Selisih Kas:</span>
                <span
                  className={
                    (selectedShiftForReceipt.cashDifference ?? 0) < 0
                      ? "text-coral font-bold"
                      : "text-emerald-700 font-bold"
                  }
                >
                  {(selectedShiftForReceipt.cashDifference ?? 0) >= 0 ? "+" : ""}
                  {formatIDR(selectedShiftForReceipt.cashDifference ?? 0)}
                </span>
              </div>

              {selectedShiftForReceipt.notes && (
                <>
                  <div className="border-b border-dashed border-ink/20 my-2" />
                  <div className="text-[11px] text-ink/55">
                    Catatan: {selectedShiftForReceipt.notes}
                  </div>
                </>
              )}

              <div className="border-b border-dashed border-ink/20 my-2" />
              <div className="text-center text-[10px] text-ink/40 pt-1">
                Dicetak pada {new Date().toLocaleString("id-ID")}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReceiptModalOpen(false)}
              >
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={handlePrintZReport}
                className="bg-ink text-white hover:bg-ink/90 gap-2 font-semibold"
              >
                <Printer size={15} />
                Cetak Struk Thermal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
