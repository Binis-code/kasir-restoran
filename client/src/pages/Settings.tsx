import { useState, useRef } from "react";
import {
  Banknote,
  FileDown,
  FileSpreadsheet,
  FileUp,
  Percent,
  Printer,
  Store,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { Header } from "../components/Header";
import { Button } from "../components/ui/Button";
import { usePos } from "../components/PosContext";
import {
  exportBackupJson,
  exportProductsCsv,
  importBackupJson,
} from "../lib/exporters";
import { getPrinterDriver, setPrinterDriver } from "../services/printer";
import { cn } from "../lib/cn";

export default function Settings() {
  const {
    products,
    reloadProducts,
    taxEnabled,
    taxRate,
    serviceChargeEnabled,
    serviceChargeRate,
    setTaxConfig,
    setServiceChargeConfig,
    activeShift,
    openShift,
    closeShift,
    orders,
  } = usePos();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentDriver, setCurrentDriver] = useState(() => getPrinterDriver());

  // Modals state
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);

  // Tax form state
  const [tempTaxEnabled, setTempTaxEnabled] = useState(taxEnabled);
  const [tempTaxRate, setTempTaxRate] = useState(String(taxRate));
  const [tempScEnabled, setTempScEnabled] = useState(serviceChargeEnabled);
  const [tempScRate, setTempScRate] = useState(String(serviceChargeRate));

  // Shift form state
  const [cashierName, setCashierName] = useState("Jamie Morgan");
  const [startingCash, setStartingCash] = useState("200000");
  const [actualCash, setActualCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const cashSalesToday = orders
    .filter((o) => o.status === "sudah-dibayar" && o.method === "tunai")
    .reduce((sum, o) => sum + o.total, 0);

  const estimatedDrawerCash = (activeShift?.startingCash || 200_000) + cashSalesToday;

  const handleTogglePrinter = () => {
    const nextId = currentDriver.id === "browser" ? "escpos-bluetooth" : "browser";
    setPrinterDriver(nextId);
    const updated = getPrinterDriver();
    setCurrentDriver(updated);
    toast.success(`Driver printer diubah ke: ${updated.label}`);
  };

  const handleSaveTax = () => {
    const rate = Number.parseInt(tempTaxRate, 10) || 0;
    const scRate = Number.parseInt(tempScRate, 10) || 0;
    setTaxConfig(tempTaxEnabled, rate);
    setServiceChargeConfig(tempScEnabled, scRate);
    setTaxModalOpen(false);
    toast.success("Pengaturan Pajak & Service Charge berhasil disimpan!");
  };

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sc = Number.parseInt(startingCash.replace(/\D/g, ""), 10) || 0;
    await openShift(cashierName.trim() || "Kasir", sc);
    setShiftModalOpen(false);
    toast.success(`Shift kasir dibuka untuk "${cashierName}" dengan modal awal ${formatIDR(sc)}`);
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ac = Number.parseInt(actualCash.replace(/\D/g, ""), 10) || 0;
    try {
      const closed = await closeShift(ac, closingNotes);
      setShiftModalOpen(false);
      const diff = closed.cashDifference ?? 0;
      if (diff === 0) {
        toast.success(`Shift berhasil ditutup! Uang laci pas: ${formatIDR(ac)}`);
      } else if (diff > 0) {
        toast.warning(`Shift ditutup. Uang laci surplus (+${formatIDR(diff)})`);
      } else {
        toast.error(`Shift ditutup. Uang laci minus (${formatIDR(diff)})`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menutup shift");
    }
  };

  const handleImport = async (file: File) => {
    try {
      const count = await importBackupJson(file);
      await reloadProducts();
      toast.success(t.data.importSuccess, {
        description: t.data.importSuccessBody(count),
      });
    } catch {
      toast.error(t.data.importError, { description: t.data.importErrorBody });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t.settingsPage.title} />
      <div className="flex-1 p-5 md:p-8">
        <p className="-mt-1 mb-5 text-sm text-ink/55">{t.settingsPage.subtitle}</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:max-w-4xl">
          {/* Toko */}
          <SettingsCard
            icon={<Store size={19} aria-hidden="true" />}
            label={t.settingsPage.storeNameCard}
            value={t.settingsPage.storeNameValue}
            actionLabel={t.settingsPage.editStore}
            onAction={() =>
              toast(t.toasts.storeInfoSoon, { description: t.toasts.storeInfoBody })
            }
          />

          {/* Printer */}
          <SettingsCard
            icon={<Printer size={19} aria-hidden="true" />}
            label={t.settingsPage.printerCard}
            value={`${currentDriver.label} · Siap`}
            note="Beralih antara Cetak Browser & Thermal Bluetooth (ESC/POS)"
            actionLabel="Ganti Driver"
            onAction={handleTogglePrinter}
          >
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void currentDriver
                    .printReceipt({
                      orderNo: 0,
                      total: "Rp 25.000",
                      lines: [{ qty: 1, name: "Uji Struk Thermal", amount: "Rp 25.000" }],
                    })
                    .catch((err: Error) => toast.warning(err.message))
                }
              >
                {t.settingsPage.testPrint}
              </Button>
            </div>
          </SettingsCard>

          {/* Pajak & Biaya Layanan */}
          <SettingsCard
            icon={<Percent size={19} aria-hidden="true" />}
            label="Pajak & Biaya Layanan"
            value={
              taxEnabled
                ? `PPN ${taxRate}% ${serviceChargeEnabled ? `+ Service ${serviceChargeRate}%` : ""}`
                : "Tanpa Pajak (0%)"
            }
            note={
              serviceChargeEnabled
                ? `Pajak aktif (${taxRate}%) dan Service Charge aktif (${serviceChargeRate}%)`
                : taxEnabled
                ? `Pajak aktif (${taxRate}%)`
                : "Semua pesanan dihitung tanpa pajak"
            }
            actionLabel="Ubah Pajak"
            onAction={() => {
              setTempTaxEnabled(taxEnabled);
              setTempTaxRate(String(taxRate));
              setTempScEnabled(serviceChargeEnabled);
              setTempScRate(String(serviceChargeRate));
              setTaxModalOpen(true);
            }}
          />

          {/* Shift Kasir */}
          <SettingsCard
            icon={<Banknote size={19} aria-hidden="true" />}
            label="Shift & Laci Kas"
            value={
              activeShift
                ? `Shift Aktif: ${activeShift.cashierName}`
                : "Shift Tertutup"
            }
            note={
              activeShift
                ? `Modal awal: ${formatIDR(activeShift.startingCash)} · Estimasi fisik di laci: ${formatIDR(estimatedDrawerCash)}`
                : "Buka shift kasir baru untuk mencatat modal awal"
            }
            actionLabel={activeShift ? "Tutup Shift" : "Buka Shift"}
            onAction={() => setShiftModalOpen(true)}
          />

          {/* Backup */}
          <SettingsCard
            icon={<FileDown size={19} aria-hidden="true" />}
            label={t.data.card}
            value={`${products.length} produk tersimpan lokal`}
            note={t.data.exportHint}
            wide
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportProductsCsv(products)}
              >
                <FileSpreadsheet size={15} aria-hidden="true" />
                {t.data.exportCsv}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void exportBackupJson()}
              >
                <FileDown size={15} aria-hidden="true" />
                {t.data.exportJson}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp size={15} aria-hidden="true" />
                {t.data.importJson}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImport(file);
                  e.target.value = "";
                }}
              />
            </div>
          </SettingsCard>
        </div>
      </div>

      {/* Modal Pajak */}
      {taxModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
          onClick={() => setTaxModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">
                  Atur Pajak & Service Charge
                </h3>
                <p className="text-xs text-ink/55">
                  Sesuaikan persentase PPN dan biaya layanan restoran Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTaxModalOpen(false)}
                className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-ink/10 p-3.5 bg-mineral/30">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-ink">Pajak Restoran / PPN</label>
                  <input
                    type="checkbox"
                    checked={tempTaxEnabled}
                    onChange={(e) => setTempTaxEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-counterlime-dark cursor-pointer"
                  />
                </div>
                {tempTaxEnabled && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink/60">Tarif Pajak (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tempTaxRate}
                      onChange={(e) => setTempTaxRate(e.target.value)}
                      className="w-24 rounded border border-ink/15 bg-white px-2 py-1 text-xs font-bold text-ink focus:outline-none focus:ring-1 focus:ring-counterlime"
                    />
                    <div className="flex gap-1">
                      {[0, 10, 11, 12].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTempTaxRate(String(r))}
                          className="rounded border border-ink/10 bg-white px-2 py-0.5 text-[10px] font-bold text-ink/70 hover:bg-ink/5"
                        >
                          {r}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-ink/10 p-3.5 bg-mineral/30">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-ink">Service Charge (Biaya Layanan)</label>
                  <input
                    type="checkbox"
                    checked={tempScEnabled}
                    onChange={(e) => setTempScEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-counterlime-dark cursor-pointer"
                  />
                </div>
                {tempScEnabled && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink/60">Tarif Service (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tempScRate}
                      onChange={(e) => setTempScRate(e.target.value)}
                      className="w-24 rounded border border-ink/15 bg-white px-2 py-1 text-xs font-bold text-ink focus:outline-none focus:ring-1 focus:ring-counterlime"
                    />
                    <div className="flex gap-1">
                      {[0, 5, 7, 10].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTempScRate(String(r))}
                          className="rounded border border-ink/10 bg-white px-2 py-0.5 text-[10px] font-bold text-ink/70 hover:bg-ink/5"
                        >
                          {r}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-ink/10 pt-3">
              <Button size="sm" variant="outline" onClick={() => setTaxModalOpen(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleSaveTax}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Shift Kasir */}
      {shiftModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
          onClick={() => setShiftModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">
                  {activeShift ? "Tutup Shift Kasir" : "Buka Shift Kasir Baru"}
                </h3>
                <p className="text-xs text-ink/55">
                  {activeShift
                    ? "Hitung uang fisik di laci kas dan catat rekonsiliasi harian."
                    : "Masukkan nama kasir dan uang kembalian awal di laci kas."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShiftModalOpen(false)}
                className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"
              >
                <X size={18} />
              </button>
            </div>

            {!activeShift ? (
              <form onSubmit={handleOpenShiftSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Nama Kasir Bertugas
                  </label>
                  <input
                    type="text"
                    required
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    placeholder="Contoh: Jamie Morgan"
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-counterlime/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Modal Awal di Laci Kas (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="5000"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    placeholder="200000"
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-counterlime/60"
                  />
                  <p className="mt-1 text-[11px] text-ink/45">Uang pecahan kecil untuk uang kembalian.</p>
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-ink/10 pt-3">
                  <Button size="sm" variant="outline" onClick={() => setShiftModalOpen(false)}>
                    Batal
                  </Button>
                  <Button size="sm" type="submit">
                    Buka Shift Sekarang
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCloseShiftSubmit} className="mt-5 space-y-4">
                <div className="rounded-xl border border-ink/10 bg-mineral/40 p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink/60">Kasir Bertugas:</span>
                    <span className="font-bold text-ink">{activeShift.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Modal Awal Laci:</span>
                    <span className="font-bold text-ink">{formatIDR(activeShift.startingCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Total Penjualan Tunai:</span>
                    <span className="font-bold text-counterlime-dark">+{formatIDR(cashSalesToday)}</span>
                  </div>
                  <div className="border-t border-ink/10 pt-1.5 flex justify-between font-bold text-sm">
                    <span>Uang Seharusnya di Laci:</span>
                    <span className="text-ink">{formatIDR(estimatedDrawerCash)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Jumlah Uang Fisik Terhitung di Laci (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder={String(estimatedDrawerCash)}
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-counterlime/60"
                  />
                  {actualCash && (
                    <p className="mt-1 text-xs font-bold">
                      {Number.parseInt(actualCash, 10) === estimatedDrawerCash ? (
                        <span className="text-emerald-600">✓ Uang fisik pas (Selisih: Rp 0)</span>
                      ) : Number.parseInt(actualCash, 10) > estimatedDrawerCash ? (
                        <span className="text-blue-600">
                          ▲ Surplus +{formatIDR(Number.parseInt(actualCash, 10) - estimatedDrawerCash)}
                        </span>
                      ) : (
                        <span className="text-red-500">
                          ▼ Minus -{formatIDR(estimatedDrawerCash - Number.parseInt(actualCash, 10))}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                    Catatan Penutupan Shift (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Contoh: Pengeluaran Rp 20.000 beli plastik, uang pas."
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-counterlime"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-ink/10 pt-3">
                  <Button size="sm" variant="outline" onClick={() => setShiftModalOpen(false)}>
                    Batal
                  </Button>
                  <Button size="sm" type="submit">
                    Selesaikan & Tutup Shift
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsCard({
  icon,
  label,
  value,
  note,
  actionLabel,
  onAction,
  wide,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
  actionLabel?: string;
  onAction?: () => void;
  wide?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-ink/10 bg-white p-5 shadow-xs transition hover:border-ink/20",
        wide && "md:col-span-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-counterlime text-ink">
          {icon}
        </span>
        {actionLabel && onAction && (
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
      <h3 className="mt-3 text-xs font-semibold uppercase tracking-wider text-ink/50">
        {label}
      </h3>
      <p className="mt-0.5 font-display text-base font-bold text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-ink/50">{note}</p>}
      {children && <div className="mt-4 border-t border-ink/10 pt-3">{children}</div>}
    </article>
  );
}
