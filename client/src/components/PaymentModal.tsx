import { useEffect, useRef, useState } from "react";
import { Banknote, CreditCard, QrCode, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { usePos, type PayMethod } from "./PosContext";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";

export function PaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { orderNo, totals, payOrder } = usePos();
  const [method, setMethod] = useState<PayMethod>("kartu-qr");
  const [cash, setCash] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setMethod("kartu-qr");
    setCash("");
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (method !== "qris") return;
    const payload = `KASA|QRIS-SIMULASI|PESANAN-${orderNo}|${totals.total}`;
    void QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: { dark: "#14211f", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [method, orderNo, totals.total]);

  if (!open) return null;

  const cashNum = Number.parseInt(cash.replace(/\D/g, ""), 10) || 0;
  const shortage = Math.max(0, totals.total - cashNum);
  const change = cashNum >= totals.total ? cashNum - totals.total : null;
  const canPay = method !== "tunai" || cashNum >= totals.total;

  const handlePay = () => {
    if (!canPay) return;
    const result = payOrder(method, method === "tunai" ? cashNum : undefined);
    if (method === "tunai" && result.change !== null) {
      toast.success(t.payment.successTitle, {
        description: `${t.payment.successDesc(result.orderNo, formatIDR(result.total))} · ${t.payment.successWithChange(formatIDR(result.change))}`,
      });
    } else {
      toast.success(t.payment.successTitle, {
        description: t.payment.successDesc(result.orderNo, formatIDR(result.total)),
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-ink/10 bg-white shadow-2xl focus:outline-none"
      >
        <div className="flex items-start justify-between px-6 pt-5">
          <div>
            <p className="label-caps text-[11px] font-semibold text-ink/50">
              {t.payment.orderLabel(orderNo)}
            </p>
            <h2
              id="payment-title"
              className="mt-1 font-display text-xl font-bold tracking-tight text-ink"
            >
              {t.payment.title}
            </h2>
          </div>
          <Button variant="ghost" size="sm" aria-label={t.payment.cancel} onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <div className="px-6 pt-3">
          <p className="label-caps text-[11px] font-medium text-ink/45">
            {t.payment.amountLabel}
          </p>
          <p className="font-display text-4xl font-bold tracking-tight text-ink">
            {formatIDR(totals.total)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 p-6 pb-0 sm:grid-cols-3">
          <MethodCard
            selected={method === "kartu-qr"}
            onSelect={() => setMethod("kartu-qr")}
            icon={<CreditCard size={20} />}
            title={t.payment.cardMethod}
            hint={t.payment.cardHint}
          />
          <MethodCard
            selected={method === "qris"}
            onSelect={() => setMethod("qris")}
            icon={<Wallet size={20} />}
            title={t.payment.qrisMethod}
            hint={t.payment.qrisHint}
          />
          <MethodCard
            selected={method === "tunai"}
            onSelect={() => setMethod("tunai")}
            icon={<Banknote size={20} />}
            title={t.payment.cashMethod}
            hint={t.payment.cashHint}
          />
        </div>

        {method === "tunai" && (
          <div className="px-6 pt-4">
            <label
              htmlFor="cash-received"
              className="label-caps block text-[11px] font-medium text-ink/50"
            >
              {t.payment.cashReceivedLabel}
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center font-display text-sm font-bold text-ink/60">
                Rp
              </span>
              <input
                id="cash-received"
                inputMode="numeric"
                autoComplete="off"
                value={cash}
                onChange={(e) => setCash(e.target.value.replace(/[^\d]/g, ""))}
                placeholder={t.payment.cashPlaceholder}
                aria-describedby="cash-status"
                className="h-12 w-full rounded-lg border border-ink/15 bg-white pl-10 pr-3.5 font-display text-lg font-bold tracking-tight text-ink placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>
            <p id="cash-status" aria-live="polite" className="min-h-11 pt-2 text-sm">
              {cash.length > 0 && shortage > 0 && (
                <>
                  <span className="font-semibold text-coral">
                    {t.payment.shortageLabel(formatIDR(shortage))}
                  </span>
                  {cashNum > 0 && (
                    <span className="block text-xs text-ink/55">
                      <span className="font-semibold">{t.payment.shortageErrorTitle}</span>{" "}
                      · {t.payment.shortageErrorBody(formatIDR(totals.total))}
                    </span>
                  )}
                </>
              )}
              {change !== null && (
                <span className="font-display font-bold text-emerald-700">
                  {t.payment.changeLabel(formatIDR(change))}
                </span>
              )}
            </p>
          </div>
        )}

        {method === "qris" && (
          <div className="px-6 pt-4">
            <div className="flex flex-col items-center rounded-xl border border-ink/10 bg-white p-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={t.payment.qrisMethod}
                  className="h-52 w-52 rounded-lg"
                />
              ) : (
                <div className="flex h-52 w-52 items-center justify-center rounded-lg bg-ink/5">
                  <QrCode size={44} className="text-ink/25" aria-hidden="true" />
                </div>
              )}
              <p className="mt-3 text-sm font-medium text-ink">
                {t.payment.qrisScanNote}
              </p>
              <p className="mt-1 text-center text-xs text-ink/50">
                {t.payment.qrisSimulated}
              </p>
            </div>
          </div>
        )}

        {method === "kartu-qr" && (
          <p className="flex items-center gap-2 px-6 pt-4 text-sm text-ink/50">
            <QrCode size={16} aria-hidden="true" />
            {t.payment.cardHint}.
          </p>
        )}

        <div className="flex justify-end gap-2 p-6">
          <Button variant="ghost" onClick={onClose}>
            {t.payment.cancel}
          </Button>
          <Button size="lg" disabled={!canPay} onClick={handlePay}>
            {t.payment.complete}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MethodCard({
  selected,
  onSelect,
  icon,
  title,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "pressable rounded-xl border p-3.5 text-left",
        selected
          ? "border-counterlime bg-counterlime/25 ring-1 ring-counterlime"
          : "border-ink/12 bg-white hover:border-ink/30",
      )}
    >
      <span className="text-ink">{icon}</span>
      <span className="mt-2 block text-sm font-semibold text-ink">{title}</span>
      <span className="mt-0.5 block text-[11px] leading-snug text-ink/50">{hint}</span>
    </button>
  );
}
