import { useState } from "react";
import { MessageSquarePlus, Minus, Plus, ReceiptText, Tag } from "lucide-react";
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
    clearOrder,
    saveDraft,
  } = pos;

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [inputDiscountValue, setInputDiscountValue] = useState("");
  const [inputDiscountType, setInputDiscountType] = useState<"percent" | "fixed">("percent");

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
    setItemNote(itemId, noteInput);
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
      className="receipt-paper flex flex-col overflow-hidden rounded-xl border border-ink/10 shadow-[0_18px_40px_-24px_rgb(20_33_31/0.35)] lg:max-h-[calc(100vh-13rem)]"
    >
      <div className="px-5 pt-5">
        <p className="label-caps text-[11px] font-semibold text-ink/55">
          {t.cart.orderPrefix} {orderNo} ·{" "}
          {orderType === "bawa-pulang"
            ? t.receipt.orderTypeTakeaway
            : t.receipt.orderTypeTable(tableNumber)}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">
            {t.cart.title}
          </h2>
          <Button variant="danger-ghost" size="sm" onClick={handleClear}>
            {t.cart.clear}
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-ink/5 p-1">
          <TypeToggle
            active={orderType === "bawa-pulang"}
            label={t.cart.takeaway}
            onClick={() => setOrderType("bawa-pulang")}
          />
          <TypeToggle
            active={orderType === "meja"}
            label={`${t.cart.tableLabel} ${String(tableNumber).padStart(2, "0")}`}
            onClick={() => setOrderType("meja")}
          />
        </div>

        {orderType === "meja" && (
          <div className="mt-2.5 flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Pilih Meja</span>
            <select
              value={tableNumber}
              onChange={(e) => pos.setTableNumber(Number.parseInt(e.target.value, 10))}
              className="h-8 rounded-lg border border-ink/15 bg-white px-2.5 text-xs font-bold text-ink focus:border-ink/40 focus:outline-none focus:ring-1 focus:ring-counterlime"
            >
              {pos.tables.map((tbl) => {
                const numMatch = tbl.name.match(/\d+/);
                const num = numMatch ? Number.parseInt(numMatch[0], 10) : 1;
                return (
                  <option key={tbl.id} value={num}>
                    {tbl.name} ({tbl.area || "Utama"} · {tbl.seats} Kursi)
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-sm font-medium text-ink/70">Jumlah tamu</span>
          <span className="flex items-center gap-2">
            <QtyButton
              label="Kurangi jumlah tamu"
              onClick={() => setGuests(Math.max(1, guests - 1))}
            >
              <Minus size={13} strokeWidth={2.6} />
            </QtyButton>
            <span className="min-w-12 text-center font-display text-sm font-bold text-ink">
              {guests} {t.cart.guestsUnit}
            </span>
            <QtyButton
              label="Tambah jumlah tamu"
              onClick={() => setGuests(guests + 1)}
            >
              <Plus size={13} strokeWidth={2.6} />
            </QtyButton>
          </span>
        </div>

        <div className="receipt-perforation mt-4" />
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 py-14 text-center">
          <ReceiptText size={30} className="text-ink/25" aria-hidden="true" />
          <p className="font-display text-base font-semibold text-ink/70">
            {t.cart.emptyTitle}
          </p>
          <p className="text-sm text-ink/45">{t.cart.emptyBody}</p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
          {lines.map((line) => {
            const item = pos.products.find((p) => p.id === line.itemId);
            if (!item) return null;
            const isEditingNote = editingNoteId === line.itemId;

            return (
              <li
                key={line.itemId}
                className="relative rounded-lg bg-white/70 border border-ink/5 p-2.5 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <FoodImage
                    item={item}
                    className="h-11 w-11 shrink-0 rounded-md border border-ink/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{item.name}</p>
                    <p className="text-xs text-ink/50">
                      {formatIDR(item.price)}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <QtyButton
                        label={`${t.cart.itemQtyDecrease}: ${item.name}`}
                        onClick={() => decreaseLine(line.itemId)}
                      >
                        <Minus size={12} strokeWidth={2.6} />
                      </QtyButton>
                      <span
                        aria-live="polite"
                        className="min-w-6 text-center font-display text-sm font-bold text-ink"
                      >
                        {line.qty}
                      </span>
                      <QtyButton
                        label={`${t.cart.itemQtyIncrease}: ${item.name}`}
                        onClick={() => increaseLine(line.itemId)}
                      >
                        <Plus size={12} strokeWidth={2.6} />
                      </QtyButton>

                      <button
                        type="button"
                        onClick={() => handleOpenNote(line.itemId, line.note)}
                        className={cn(
                          "ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition",
                          line.note
                            ? "bg-amber-100 text-amber-900 font-bold"
                            : "text-ink/40 hover:bg-ink/5 hover:text-ink",
                        )}
                      >
                        <MessageSquarePlus size={12} />
                        {line.note ? "Edit Catatan" : "+ Catatan"}
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 self-center font-display text-sm font-bold tracking-tight text-ink">
                    {formatIDR(item.price * line.qty)}
                  </p>
                </div>

                {line.note && !isEditingNote && (
                  <p className="mt-2 rounded bg-amber-50/80 px-2 py-1 text-[11px] font-semibold text-amber-900 border border-amber-200/50">
                    📝 {line.note}
                  </p>
                )}

                {isEditingNote && (
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Contoh: Less ice, pedas sedang, tanpa bawang"
                      className="flex-1 rounded border border-ink/20 bg-white px-2 py-1 text-xs text-ink placeholder:text-ink/35 focus:outline-none focus:ring-1 focus:ring-counterlime"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNote(line.itemId)}
                      className="rounded bg-ink px-2.5 py-1 text-xs font-bold text-white hover:bg-ink/90"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNoteId(null)}
                      className="rounded border border-ink/20 px-2 py-1 text-xs font-medium text-ink/60 hover:bg-ink/5"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="px-5 pb-5">
        <div className="receipt-perforation mb-3" />

        {/* Discount & Promo Trigger */}
        <div className="mb-3 flex items-center justify-between border-b border-ink/10 pb-2.5">
          <button
            type="button"
            onClick={() => {
              setInputDiscountType(discountType);
              setInputDiscountValue(discountValue > 0 ? String(discountValue) : "");
              setShowDiscountModal(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/70 hover:text-ink"
          >
            <Tag size={13} className="text-counterlime-dark" />
            {discountValue > 0 ? (
              <span className="text-counterlime-dark font-extrabold">
                Diskon: {discountType === "percent" ? `${discountValue}%` : formatIDR(discountValue)} (Ubah)
              </span>
            ) : (
              "+ Tambah Diskon / Promo"
            )}
          </button>
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

          <div className="flex items-baseline justify-between pt-2 border-t border-ink/10">
            <dt className="font-display text-sm font-bold text-ink">
              {t.cart.totalLabel}
            </dt>
            <dd className="font-display text-2xl font-bold tracking-tight text-ink">
              {formatIDR(totals.total)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleSaveToKitchen} disabled={lines.length === 0}>
            Kirim ke Dapur
          </Button>
          <Button onClick={onPay} disabled={lines.length === 0}>
            {t.cart.payPrefix} {formatIDR(totals.total)}
          </Button>
        </div>

        <Button
          variant="ghost"
          className="mt-2 w-full text-xs"
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
          <kbd className="kbd-hint ml-1 rounded border border-ink/20 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-ink/60">
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
            className="w-full max-w-sm rounded-xl border border-ink/10 bg-white p-5 shadow-xl"
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
                  "rounded-lg border py-2 text-xs font-bold transition",
                  inputDiscountType === "percent"
                    ? "border-counterlime bg-counterlime/25 text-ink"
                    : "border-ink/15 text-ink/60 hover:bg-ink/5",
                )}
              >
                Persen (%)
              </button>
              <button
                type="button"
                onClick={() => setInputDiscountType("fixed")}
                className={cn(
                  "rounded-lg border py-2 text-xs font-bold transition",
                  inputDiscountType === "fixed"
                    ? "border-counterlime bg-counterlime/25 text-ink"
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
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-bold text-ink focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
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
              <Button size="sm" onClick={handleApplyDiscount}>
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
        "pressable h-9 rounded-md text-sm font-medium transition",
        active ? "bg-counterlime font-semibold text-ink shadow-sm" : "text-ink/55 hover:text-ink",
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
      className="pressable inline-flex h-6 w-6 items-center justify-center rounded-md border border-ink/15 bg-white text-ink/70 hover:border-ink/35 hover:bg-white hover:text-ink"
    >
      {children}
    </button>
  );
}
