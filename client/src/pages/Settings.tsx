import { useState, useRef } from "react";
import {
  Banknote,
  FileDown,
  FileSpreadsheet,
  FileUp,
  Percent,
  Printer,
  Store,
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

export default function Settings() {
  const { products, reloadProducts } = usePos();
  const cashToday = 1_680_000;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentDriver, setCurrentDriver] = useState(() => getPrinterDriver());

  const handleTogglePrinter = () => {
    const nextId = currentDriver.id === "browser" ? "escpos-bluetooth" : "browser";
    setPrinterDriver(nextId);
    const updated = getPrinterDriver();
    setCurrentDriver(updated);
    toast.success(`Driver printer diubah ke: ${updated.label}`);
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:max-w-4xl">
          <SettingsCard
            icon={<Store size={19} aria-hidden="true" />}
            label={t.settingsPage.storeNameCard}
            value={t.settingsPage.storeNameValue}
            actionLabel={t.settingsPage.editStore}
            onAction={() =>
              toast(t.toasts.storeInfoSoon, { description: t.toasts.storeInfoBody })
            }
          />
          <SettingsCard
            icon={<Printer size={19} aria-hidden="true" />}
            label={t.settingsPage.printerCard}
            value={`${currentDriver.label} · Siap`}
            note="Klik 'Ganti Driver' untuk beralih antara Cetak Browser & Thermal Bluetooth"
            actionLabel="Ganti Driver"
            onAction={handleTogglePrinter}
          >
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void currentDriver
                    .printReceipt({ orderNo: 0, total: "Rp 25.000", lines: [{ qty: 1, name: "Uji Struk Thermal", amount: "Rp 25.000" }] })
                    .catch((err: Error) => toast.warning(err.message))
                }
              >
                {t.settingsPage.testPrint}
              </Button>
            </div>
          </SettingsCard>
          <SettingsCard
            icon={<Percent size={19} aria-hidden="true" />}
            label={t.settingsPage.taxCard}
            value={t.settingsPage.taxValue}
            actionLabel={t.settingsPage.editTax}
            onAction={() =>
              toast(t.toasts.taxFixed, { description: t.toasts.taxFixedBody })
            }
          />
          <SettingsCard
            icon={<Banknote size={19} aria-hidden="true" />}
            label={t.settingsPage.cashCard}
            value={formatIDR(cashToday)}
            note={t.settingsPage.cashNote}
            actionLabel={t.settingsPage.recordDeposit}
            onAction={() =>
              toast(t.toasts.depositRecorded, {
                description: t.toasts.depositBody,
              })
            }
          />
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
                onClick={() => {
                  void exportBackupJson();
                  toast.success(t.data.exported, { description: t.data.exportedBody });
                }}
              >
                <FileDown size={15} aria-hidden="true" />
                {t.data.exportJson}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void exportProductsCsv(products);
                  toast.success(t.data.exported, { description: t.data.exportedBody });
                }}
              >
                <FileSpreadsheet size={15} aria-hidden="true" />
                {t.data.exportCsv}
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <FileUp size={15} aria-hidden="true" />
                {t.data.importJson}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                aria-label={t.data.importJson}
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
  wide = false,
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
    <article className={wide ? "card-hover rounded-xl border border-ink/10 bg-white p-5 md:col-span-2" : "card-hover rounded-xl border border-ink/10 bg-white p-5"}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink/5 text-ink/70">
          {icon}
        </span>
        <h3 className="label-caps text-[11px] font-medium text-ink/55">{label}</h3>
      </div>
      <p className="mt-3 font-display text-lg font-bold tracking-tight text-ink">
        {value}
      </p>
      {note && <p className="mt-1 text-xs leading-relaxed text-ink/50">{note}</p>}
      {(children || actionLabel) && (
        <div className="mt-4 flex justify-end border-t border-dashed border-ink/12 pt-3">
          {children}
          {actionLabel && onAction && (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
