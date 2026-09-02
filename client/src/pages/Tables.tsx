import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import QRCode from "qrcode";
import {
  Armchair,
  Coffee,
  Edit,
  Plus,
  UtensilsCrossed,
  QrCode,
  ExternalLink,
  Copy,
  Printer,
  Check,
  Wifi,
} from "lucide-react";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { Header } from "../components/Header";
import { Button } from "../components/ui/Button";
import { TableModal } from "../components/TableModal";
import { usePos, type TableRow } from "../components/PosContext";
import { getNetworkHostInfo } from "../services/localSyncServer";
import { cn } from "../lib/cn";
import { toast } from "sonner";

export default function Tables() {
  const pos = usePos();
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableRow | null>(null);
  const [activeAreaFilter, setActiveAreaFilter] = useState<string>("Semua");
  const [qrModalTable, setQrModalTable] = useState<TableRow | null>(null);
  const [qrImageDataUrl, setQrImageDataUrl] = useState<string>("");
  const [hasCopied, setHasCopied] = useState(false);
  const hostInfo = getNetworkHostInfo();

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

  const handleOpenQr = (table: TableRow, e: React.MouseEvent) => {
    e.stopPropagation();
    setQrModalTable(table);
    setHasCopied(false);
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
        label: activeOrder.status === "siap" ? "Siap Disajikan" : "Dimasak",
      };
    }

    return null;
  };

  const getTableOrderUrl = (table: TableRow) => {
    const slug = encodeURIComponent(table.name.toLowerCase().replace(/\s+/g, "-"));
    return `${hostInfo.baseUrl}/order/${slug}`;
  };

  useEffect(() => {
    if (!qrModalTable) {
      setQrImageDataUrl("");
      return;
    }
    const url = getTableOrderUrl(qrModalTable);
    QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      color: { dark: "#14211F", light: "#FFFFFF" },
    })
      .then(setQrImageDataUrl)
      .catch(console.error);
  }, [qrModalTable, hostInfo.baseUrl]);

  const handleCopyLink = () => {
    if (!qrModalTable) return;
    const url = getTableOrderUrl(qrModalTable);
    navigator.clipboard.writeText(url).then(() => {
      setHasCopied(true);
      toast.success("Tautan QR Meja disalin ke clipboard!");
      setTimeout(() => setHasCopied(false), 2500);
    });
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/pelayan")}
              className="gap-1.5 font-bold"
            >
              <UtensilsCrossed size={15} />
              Mode Pelayan Cepat
            </Button>
            <Button size="sm" onClick={handleOpenAdd} className="gap-1.5 font-bold">
              <Plus size={15} />
              Tambah Meja
            </Button>
          </div>
        </div>

        {/* Filter Area Tabs */}
        {availableAreas.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveAreaFilter("Semua")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                activeAreaFilter === "Semua"
                  ? "bg-ink font-semibold text-mineral shadow-xs"
                  : "border border-ink/10 bg-white text-ink/65 hover:bg-ink/5",
              )}
            >
              Semua ({pos.tables.length})
            </button>
            {availableAreas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setActiveAreaFilter(area)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  activeAreaFilter === area
                    ? "bg-ink font-semibold text-mineral shadow-xs"
                    : "border border-ink/10 bg-white text-ink/65 hover:bg-ink/5",
                )}
              >
                {area} ({pos.tables.filter((t) => (t.area || "Utama") === area).length})
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTables.map((table) => {
            const activeInfo = getTableActiveOrder(table);
            const isActive = Boolean(activeInfo);

            return (
              <article
                key={table.id}
                onClick={() => handleSelectTableAndOrder(table)}
                className={cn(
                  "card-hover cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:shadow-md",
                  isActive
                    ? "border-counterlime ring-2 ring-counterlime/40"
                    : "border-ink/10 hover:border-ink/25",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl",
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

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Lihat & Cetak QR Meja Pelanggan"
                      onClick={(e) => handleOpenQr(table, e)}
                      className="rounded-lg p-1.5 text-ink/50 hover:bg-counterlime/20 hover:text-ink transition-colors"
                    >
                      <QrCode size={17} />
                    </button>

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

                <div className="mt-3 flex items-baseline justify-between">
                  <h3 className="font-display text-base font-bold tracking-tight text-ink">
                    {table.name}
                  </h3>
                  <span
                    className={
                      isActive
                        ? "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800"
                        : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-ink/55"
                    }
                  >
                    {isActive && activeInfo ? activeInfo.label : t.tablesPage.empty}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-ink/50">
                  {t.tablesPage.seatsUnit(table.seats)}
                </p>

                {isActive && activeInfo ? (
                  <div className="mt-3 border-t border-dashed border-ink/15 pt-3">
                    <p className="font-display text-sm font-bold text-ink">
                      {t.tablesPage.activeOrder(activeInfo.orderNo, formatIDR(activeInfo.total))}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-counterlime-dark">
                      Klik untuk kelola pesanan meja ini
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

          <article className="card-hover rounded-2xl border border-ink/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-counterlime text-ink">
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

      {/* Table QR Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-counterlime text-ink">
                  <QrCode size={16} />
                </span>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-ink">QR Order · {qrModalTable.name}</h3>
                  <p className="text-[11px] text-ink/50">Area {qrModalTable.area || "Utama"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQrModalTable(null)}
                className="text-ink/50 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-ink/60">
              Pelanggan cukup scan QR ini di meja untuk melihat menu dan memesan langsung.
            </p>

            {/* QR Code Container */}
            <div className="my-4 mx-auto flex h-60 w-60 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/20 bg-slate-50 p-3 shadow-inner">
              {qrImageDataUrl ? (
                <img
                  src={qrImageDataUrl}
                  alt={`QR ${qrModalTable.name}`}
                  className="h-48 w-48 rounded-xl object-contain shadow-xs bg-white p-1.5"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center">
                  <span className="text-xs text-ink/40 animate-pulse">Membuat QR...</span>
                </div>
              )}
              <span className="mt-1.5 text-xs font-bold text-ink tracking-wide">
                {qrModalTable.name} ({qrModalTable.area || "Area Restoran"})
              </span>
            </div>

            {/* Direct URL display with LAN Wi-Fi badge */}
            <div className="rounded-xl bg-slate-100 p-2.5 text-left text-xs text-ink/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-counterlime-dark">
                <Wifi size={13} />
                <span>URL Akses HP & Wi-Fi:</span>
              </div>
              <div className="font-mono text-[11px] break-all text-ink/70">
                {getTableOrderUrl(qrModalTable)}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 space-y-2">
              <a
                href={getTableOrderUrl(qrModalTable)}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-counterlime font-bold text-ink hover:bg-counterlime/90 text-xs shadow-sm"
              >
                <ExternalLink size={15} />
                Buka Tampilan Pelanggan
              </a>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex-1 gap-1.5 rounded-xl font-semibold text-xs"
                >
                  {hasCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {hasCopied ? "Tersalin!" : "Salin Link"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.success("Perintah cetak stiker QR meja dikirim!");
                    window.print();
                  }}
                  className="flex-1 gap-1.5 rounded-xl font-semibold text-xs"
                >
                  <Printer size={14} />
                  Cetak Stiker
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
