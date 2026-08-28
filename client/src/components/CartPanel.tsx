import { Minus, Plus, ReceiptText } from "lucide-react";
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
    setOrderType,
    setGuests,
    increaseLine,
    decreaseLine,
    clearOrder,
    saveDraft,
  } = pos;

  const handleClear = () => {
    if (lines.length === 0) return;
    clearOrder();
    toast(t.toasts.clearedTitle, { description: t.toasts.clearedBody });
  };

  const handleSave = () => {
    const no = saveDraft();
    toast.success(t.toasts.savedTitle(no), { description: t.toasts.savedBody });
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
            <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Nomor Meja</span>
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
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {lines.map((line) => {
            const item = pos.products.find((p) => p.id === line.itemId);
            if (!item) return null;
            return (
              <li
                key={line.itemId}
                className="relative flex items-center gap-3 rounded-lg py-2 pl-4 pr-2"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-counterlime"
                />
                <FoodImage
                  item={item}
                  className="h-11 w-11 shrink-0 rounded-md border border-ink/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-ink/50">
                    {formatIDR(item.price)} ·{" "}
                    {item.kind.toLowerCase() === "minuman"
                      ? "Minuman"
                      : item.kind.toLowerCase() === "makanan"
                        ? "Makanan"
                        : "Camilan"}
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
                  </div>
                </div>
                <p className="shrink-0 self-center font-display text-sm font-bold tracking-tight text-ink">
                  {formatIDR(item.price * line.qty)}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <div className="px-5 pb-5">
        <div className="receipt-perforation mb-4" />
        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink/60">{t.cart.productSubtotal}</dt>
            <dd className="font-display font-medium text-ink">
              {formatIDR(totals.subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink/60">{t.cart.taxLabel}</dt>
            <dd className="font-display font-medium text-ink">
              {formatIDR(totals.tax)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between pt-1.5">
            <dt className="font-display text-base font-bold text-ink">
              {t.cart.totalLabel}
            </dt>
            <dd className="font-display text-2xl font-bold tracking-tight text-ink">
              {formatIDR(totals.total)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleSave} disabled={lines.length === 0}>
            {t.cart.saveDraft}
          </Button>
          <Button onClick={onPay} disabled={lines.length === 0}>
            {t.cart.payPrefix} {formatIDR(totals.total)}
          </Button>
        </div>
        <Button
          variant="ghost"
          className="mt-2 w-full"
          onClick={() =>
            void getPrinterDriver().printReceipt({
              orderNo,
              total: formatIDR(totals.total),
              lines: [],
            })
          }
        >
          Cetak struk
          <kbd className="kbd-hint ml-1 rounded border border-ink/20 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-ink/60">
            P
          </kbd>
        </Button>
      </div>
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
        "pressable h-9 rounded-md text-sm font-medium",
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
      className="pressable flex h-10 w-10 items-center justify-center rounded-md border border-ink/15 bg-white text-ink/70 hover:border-ink/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
    >
      {children}
    </button>
  );
}
