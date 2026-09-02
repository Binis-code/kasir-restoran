import { useState } from "react";
import { MessageSquarePlus, Minus, Plus, ReceiptText, Tag, Trash2, Edit3, X, Check } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { usePos } from "./PosContext";
import { getPrinterDriver } from "../services/printer";
import { FoodImage } from "./FoodImage";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";

export function CartPanel({
  onPay,
}: {
  onPay: () => void;
}) {
  const pos = usePos();
  const {
    orderNo,
    orderType,
    tableNumber,
    guests,
    lines,
    totals,
    discountType,
    discountValue,
    taxEnabled,
    taxRate,
    serviceChargeEnabled,
    serviceChargeRate,
    setOrderType,
    setGuests,
    setDiscount,
    setItemNote,
    increaseLine,
    decreaseLine,
    removeItem,
    clearOrder,
    saveDraft,
  } = pos;

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [inputDiscountValue, setInputDiscountValue] = useState("");
  const [inputDiscountType, setInputDiscountType] = useState<"percent" | "fixed">("percent");

  const totalItemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  const handleClear = () => {
    if (lines.length === 0) return;
    clearOrder();
    toast(t.toasts.clearedTitle, { description: t.toasts.clearedBody });
  };

  const handleSaveToKitchen = () => {
    const no = saveDraft();
    toast.success(`Pesanan #${no} dikirim ke Dapur (KDS)!`, {
      description: "Koki dan barista dapat melihat tiket di halaman /dapur",
    });
  };

  const handleOpenNote = (itemId: string, currentNote?: string) => {
    setEditingNoteId(itemId);
    setNoteInput(currentNote || "");
  };

  const handleSaveNote = (itemId: string) => {
    setItemNote(itemId, noteInput.trim());
    setEditingNoteId(null);
    setNoteInput("");
  };

  const handleApplyDiscount = () => {
    const val = Number.parseInt(inputDiscountValue.replace(/\D/g, ""), 10) || 0;
    setDiscount(inputDiscountType, val);
    setShowDiscountModal(false);
    if (val > 0) {
      toast.success(`Diskon ${inputDiscountType === "percent" ? `${val}%` : formatIDR(val)} diterapkan!`);
    } else {
      toast.info("Diskon dihapus");
    }
  };

  return (
    <section
      aria-label={t.cart.title}
      className="flex h-full max-h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-md"
    >
      {/* Header Section */}
      <div className="border-b border-ink/10 bg-white px-4 pt-3.5 pb-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold tracking-tight text-ink">
                {t.cart.title}
              </h2>
              <span className="rounded-md bg-ink/5 px-2 py-0.5 text-xs font-bold text-ink/70">
                #{orderNo}
              </span>
            </div>
            <p className="text-xs font-medium text-ink/50 mt-0.5">
              {totalItemCount} item dipilih ·{" "}
              {orderType === "bawa-pulang"
                ? "Bawa Pulang"
                : `Makan di Tempat (${String(tableNumber).padStart(2, "0")})`}
            </p>
          </div>

          {lines.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-coral hover:bg-coral/10 transition-colors"
            >
              <Trash2 size={13} />
              <span>{t.cart.clear}</span>
            </button>
          )}
        </div>

        {/* Order Type Toggle */}
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-xl bg-mineral/70 p-1">
          <TypeToggle
            active={orderType === "bawa-pulang"}
            label={t.cart.takeaway}
            onClick={() => setOrderType("bawa-pulang")}
          />
          <TypeToggle
            active={orderType === "meja"}
            label={`Makan di Tempat (${String(tableNumber).padStart(2, "0")})`}
            onClick={() => setOrderType("meja")}
          />
        </div>

        {/* Table & Guest selectors */}
        <div className="mt-2 flex items-center justify-between gap-2 pt-0.5">
          {orderType === "meja" ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-ink/60">Meja:</span>
              <select
                value={tableNumber}
                onChange={(e) => pos.setTableNumber(Number.parseInt(e.target.value, 10))}
                className="h-7 rounded-lg border border-ink/15 bg-white px-2 text-xs font-bold text-ink focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              >
                {pos.tables.map((tbl) => {
                  const numMatch = tbl.name.match(/\d+/);
                  const num = numMatch ? Number.parseInt(numMatch[0], 10) : 1;
                  return (
                    <option key={tbl.id} value={num}>
                      {tbl.name} ({tbl.area || "Utama"})
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <span className="text-xs font-medium text-ink/50">Takeaway (Bawa pulang)</span>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs font-bold text-ink/60">Tamu:</span>
            <div className="flex items-center gap-1 bg-mineral/50 rounded-lg p-0.5 border border-ink/10">
              <QtyButton
                label="Kurangi jumlah tamu"
                onClick={() => setGuests(Math.max(1, guests - 1))}
              >
                <Minus size={11} strokeWidth={2.6} />
              </QtyButton>
              <span className="min-w-6 text-center font-display text-xs font-bold text-ink">
                {guests}
              </span>
              <QtyButton
                label="Tambah jumlah tamu"
                onClick={() => setGuests(guests + 1)}
              >
                <Plus size={11} strokeWidth={2.6} />
              </QtyButton>
            </div>
          </div>
        </div>
      </div>

      {/* Item List (Spacious & Clean Preview) */}
      {lines.length === 0 ? (
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-2.5 p-6 text-center bg-mineral/20">
          <div className="w-12 h-12 rounded-2xl bg-mineral flex items-center justify-center border border-ink/10 text-ink/30 shadow-2xs">
            <ReceiptText size={24} />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-ink/70">
              {t.cart.emptyTitle}
            </p>
            <p className="text-xs text-ink/45 mt-0.5 max-w-[200px] mx-auto">
              Pilih menu dari katalog di sebelah kiri untuk mulai transaksi.
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-2 bg-mineral/20 overscroll-contain divide-y-0">
          {lines.map((line) => {
            const item = pos.products.find((p) => p.id === line.itemId);
            if (!item) return null;
            const isEditingNote = editingNoteId === line.itemId;

            return (
              <li
                key={line.itemId}
                className="group relative rounded-xl bg-white border border-ink/10 p-2.5 shadow-2xs hover:border-ink/20 transition-all"
              >
                {/* Main Row: Image + Name & Unit Price + Subtotal */}
                <div className="flex items-start gap-2.5">
                  <FoodImage
                    item={item}
                    className="h-12 w-12 shrink-0 rounded-lg border border-ink/10 object-cover shadow-2xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="font-bold text-xs text-ink leading-snug truncate">
                        {item.name}
                      </p>
                      <p className="shrink-0 font-display text-xs font-bold tracking-tight text-ink">
                        {formatIDR(item.price * line.qty)}
                      </p>
                    </div>
                    <p className="text-[11px] text-ink/50 mt-0.5">
                      {formatIDR(item.price)} / porsi
                    </p>

                    {/* Stepper + Note + Delete Actions */}
                    <div className="mt-2 flex items-center justify-between gap-1.5">
                      {/* Qty Stepper */}
                      <div className="flex items-center gap-0.5 bg-mineral/60 rounded-lg p-0.5 border border-ink/10">
                        <QtyButton
                          label={`${t.cart.itemQtyDecrease}: ${item.name}`}
                          onClick={() => decreaseLine(line.itemId)}
                        >
                          <Minus size={11} strokeWidth={2.6} />
                        </QtyButton>
                        <span
                          aria-live="polite"
                          className="min-w-6 text-center font-display text-xs font-bold text-ink"
                        >
                          {line.qty}
                        </span>
                        <QtyButton
                          label={`${t.cart.itemQtyIncrease}: ${item.name}`}
                          onClick={() => increaseLine(line.itemId)}
                        >
                          <Plus size={11} strokeWidth={2.6} />
                        </QtyButton>
                      </div>

                      {/* Catatan / Note Trigger */}
                      <button
                        type="button"
                        onClick={() => handleOpenNote(line.itemId, line.note)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors border",
                          line.note
                            ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                            : "bg-white border-ink/12 text-ink/60 hover:text-ink hover:border-ink/30"
                        )}
                      >
                        <MessageSquarePlus size={11} className={line.note ? "text-amber-700" : "text-ink/40"} />
                        <span>{line.note ? "Ubah Catatan" : "+ Catatan"}</span>
                      </button>

                      {/* Remove Line Button */}
                      <button
                        type="button"
                        aria-label={`Hapus ${item.name}`}
                        title="Hapus item"
                        onClick={() => removeItem(line.itemId)}
                        className="h-6 w-6 rounded-md inline-flex items-center justify-center text-ink/35 hover:text-coral hover:bg-coral/10 transition-colors ml-auto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Display Active Note Pill */}
                {line.note && !isEditingNote && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 text-xs text-amber-950 font-medium">
                    <span className="truncate flex items-center gap-1 text-[11px]">
                      <span>📝</span>
                      <span className="font-semibold">{line.note}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenNote(line.itemId, line.note)}
                      className="ml-2 shrink-0 text-[10px] font-bold text-amber-800 hover:underline flex items-center gap-0.5"
                    >
                      <Edit3 size={10} /> Edit
                    </button>
                  </div>
                )}

                {/* Inline Note Editor */}
                {isEditingNote && (
                  <div className="mt-2 rounded-lg bg-mineral/60 border border-ink/15 p-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-ink/70">
                      <span>Catatan Pesanan:</span>
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        className="text-ink/40 hover:text-ink"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <input
                      type="text"
                      autoFocus
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Contoh: Tanpa gula, pedas level 3..."
                      className="w-full rounded-md border border-ink/20 bg-white px-2 py-1 text-xs text-ink placeholder:text-ink/40 focus:border-ink/50 focus:outline-none focus:ring-1 focus:ring-counterlime"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveNote(line.itemId);
                        if (e.key === "Escape") setEditingNoteId(null);
                      }}
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(null)}
                        className="rounded px-2 py-0.5 text-xs font-medium text-ink/60 hover:bg-ink/5"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveNote(line.itemId)}
                        className="rounded bg-ink px-2 py-0.5 text-xs font-bold text-white hover:bg-ink/90 flex items-center gap-1"
                      >
                        <Check size={11} /> Simpan
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Order Summary & Financials */}
      <div className="border-t border-ink/10 bg-white px-4 pt-3 pb-3.5 shrink-0 shadow-lg space-y-2">
        {/* Discount & Promo Trigger */}
        <div className="flex items-center justify-between border-b border-ink/8 pb-1.5">
          <button
            type="button"
            onClick={() => {
              setInputDiscountType(discountType);
              setInputDiscountValue(discountValue > 0 ? String(discountValue) : "");
              setShowDiscountModal(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/70 hover:text-ink transition-colors"
          >
            <Tag size={12} className="text-counterlime-dark" />
            {discountValue > 0 ? (
              <span className="text-counterlime-dark font-extrabold">
                Diskon: {discountType === "percent" ? `${discountValue}%` : formatIDR(discountValue)} (Ubah)
              </span>
            ) : (
              <span className="hover:underline">+ Tambah Diskon / Promo</span>
            )}
          </button>
          {discountValue > 0 && (
            <button
              type="button"
              onClick={() => setDiscount("percent", 0)}
              className="text-[11px] font-semibold text-coral hover:underline"
            >
              Hapus
            </button>
          )}
        </div>

        <dl className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <dt className="text-ink/60">Subtotal Produk</dt>
            <dd className="font-display font-medium text-ink">
              {formatIDR(totals.rawSubtotal)}
            </dd>
          </div>

          {totals.discountAmount > 0 && (
            <div className="flex items-center justify-between text-coral">
              <dt className="font-medium">Potongan Diskon</dt>
              <dd className="font-display font-bold">
                -{formatIDR(totals.discountAmount)}
              </dd>
            </div>
          )}

          {serviceChargeEnabled && (
            <div className="flex items-center justify-between">
              <dt className="text-ink/60">Service Charge ({serviceChargeRate}%)</dt>
              <dd className="font-display font-medium text-ink">
                {formatIDR(totals.serviceCharge)}
              </dd>
            </div>
          )}

          {taxEnabled && (
            <div className="flex items-center justify-between">
              <dt className="text-ink/60">Pajak ({taxRate}%)</dt>
              <dd className="font-display font-medium text-ink">
                {formatIDR(totals.tax)}
              </dd>
            </div>
          )}

          <div className="flex items-baseline justify-between pt-1.5 border-t border-ink/10 mt-1">
            <dt className="font-display text-sm font-bold text-ink">
              {t.cart.totalLabel}
            </dt>
            <dd className="font-display text-xl font-bold tracking-tight text-ink">
              {formatIDR(totals.total)}
            </dd>
          </div>
        </dl>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <Button
            variant="outline"
            onClick={handleSaveToKitchen}
            disabled={lines.length === 0}
            className="font-bold text-xs h-9.5 rounded-xl"
          >
            Kirim ke Dapur
          </Button>
          <Button
            variant="primary"
            onClick={onPay}
            disabled={lines.length === 0}
            className="font-bold text-xs h-9.5 rounded-xl"
          >
            {t.cart.payPrefix} {formatIDR(totals.total)}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-[11px] font-semibold text-ink/60 hover:text-ink h-7.5 rounded-lg"
          onClick={() =>
            void getPrinterDriver().printReceipt({
              orderNo,
              total: formatIDR(totals.total),
              lines: lines.map((l) => {
                const prod = pos.products.find((p) => p.id === l.itemId);
                return {
                  qty: l.qty,
                  name: prod ? (l.note ? `${prod.name} (${l.note})` : prod.name) : "Item",
                  amount: formatIDR((prod?.price || 0) * l.qty),
                };
              }),
            })
          }
        >
          Cetak struk
          <kbd className="kbd-hint ml-1.5 rounded border border-ink/20 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink/60">
            P
          </kbd>
        </Button>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
          onClick={() => setShowDiscountModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-5 shadow-2xl"
          >
            <h3 className="font-display text-base font-bold text-ink">
              Terapkan Diskon / Potongan
            </h3>
            <p className="mt-0.5 text-xs text-ink/50">
              Pilih diskon persentase atau nominal rupiah langsung.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInputDiscountType("percent")}
                className={cn(
                  "rounded-xl border py-2 text-xs font-bold transition-all",
                  inputDiscountType === "percent"
                    ? "border-counterlime-dark bg-counterlime text-ink shadow-xs"
                    : "border-ink/15 text-ink/60 hover:bg-ink/5",
                )}
              >
                Persen (%)
              </button>
              <button
                type="button"
                onClick={() => setInputDiscountType("fixed")}
                className={cn(
                  "rounded-xl border py-2 text-xs font-bold transition-all",
                  inputDiscountType === "fixed"
                    ? "border-counterlime-dark bg-counterlime text-ink shadow-xs"
                    : "border-ink/15 text-ink/60 hover:bg-ink/5",
                )}
              >
                Nominal (Rp)
              </button>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/60">
                Nilai Diskon ({inputDiscountType === "percent" ? "%" : "Rp"})
              </label>
              <input
                type="number"
                min="0"
                max={inputDiscountType === "percent" ? "100" : undefined}
                value={inputDiscountValue}
                onChange={(e) => setInputDiscountValue(e.target.value)}
                placeholder={inputDiscountType === "percent" ? "Contoh: 10" : "Contoh: 15000"}
                className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-bold text-ink focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDiscountModal(false)}
              >
                Batal
              </Button>
              <Button size="sm" variant="primary" onClick={handleApplyDiscount}>
                Terapkan Diskon
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TypeToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "pressable h-8 rounded-lg text-xs font-semibold transition-all",
        active
          ? "bg-counterlime text-ink shadow-xs font-bold"
          : "text-ink/60 hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

function QtyButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="pressable inline-flex h-7 w-7 items-center justify-center rounded-md border border-ink/15 bg-white text-ink hover:border-ink/40 hover:bg-mineral/40 transition-colors shrink-0"
    >
      {children}
    </button>
  );
}
