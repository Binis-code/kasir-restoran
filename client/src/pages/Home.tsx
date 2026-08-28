import { useEffect, useMemo, useRef, useState } from "react";
import { ScanLine, Search } from "lucide-react";
import { toast } from "sonner";
import { MENU_CATEGORIES, type MenuItem } from "../data/menu";
import { t } from "../locales/en";
import { Header } from "../components/Header";
import { MetricStrip } from "../components/MetricStrip";
import { ProductCard } from "../components/ProductCard";
import { CartPanel } from "../components/CartPanel";
import { PaymentModal } from "../components/PaymentModal";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { usePos } from "../components/PosContext";
import { cn } from "../lib/cn";

export default function Home() {
  const pos = usePos();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Semua" | (typeof MENU_CATEGORIES)[number]>("Favorit");
  const [payOpen, setPayOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (
        !payOpen &&
        !scanOpen &&
        !typing &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        e.key.toLowerCase() === "p"
      ) {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payOpen, scanOpen]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pos.products.filter((item) => {
      const inCategory =
        category === "Semua" ||
        item.category === category ||
        (category === "Favorit" && item.badge !== undefined);
      const matchesQuery =
        q.length === 0 ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.barcode.includes(q);
      return inCategory && matchesQuery;
    });
  }, [pos.products, query, category]);

  const inOrderIds = useMemo(
    () => new Set(pos.lines.map((line) => line.itemId)),
    [pos.lines],
  );

  const handleAdd = (item: MenuItem) => {
    pos.addItem(item.id);
    if (!inOrderIds.has(item.id)) {
      toastAdd(item.name);
    }
  };

  const handleScanProduct = (item: MenuItem) => {
    pos.addItem(item.id);
    toast.success(t.scanner.added(item.name), { description: t.toasts.addedBody });
  };

  const handleScanError = (code: string) => {
    toast.warning(t.scanner.notFound(code), {
      description: t.scanner.notFoundBody,
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t.header.readyTitle} showSavedStatus />
      <div className="px-5 pt-5 md:px-8">
        <MetricStrip />
      </div>

      <div className="flex flex-1 flex-col gap-6 p-5 md:p-8 lg:flex-row">
        <section aria-label={t.catalog.title} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink">
              {t.catalog.title}
            </h2>
            <div className="flex w-full max-w-sm items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-ink/40"
                />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  aria-label={t.catalog.searchLabel}
                  placeholder={t.catalog.searchPlaceholder}
                  className="h-11 w-full rounded-lg border border-ink/15 bg-white pl-9 pr-3.5 text-base text-ink placeholder:text-ink/40 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
                />
              </div>
              <button
                type="button"
                aria-label={t.scanner.open}
                title={t.scanner.open}
                onClick={() => setScanOpen(true)}
                className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink text-counterlime hover:bg-[#1f332f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <ScanLine size={20} />
              </button>
              <kbd
                aria-hidden="true"
                className="kbd-hint shrink-0 rounded border border-ink/15 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-ink/50"
              >
                {t.catalog.shortcutK}
              </kbd>
            </div>
          </div>

          <div role="tablist" aria-label="Kategori menu" className="mt-4 flex flex-wrap gap-1.5">
            {(["Semua", ...MENU_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={category === cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "pressable h-10 rounded-full px-4 text-sm font-medium",
                  category === cat
                    ? "bg-ink font-semibold text-mineral"
                    : "border border-ink/12 bg-white text-ink/65 hover:border-ink/35 hover:text-ink",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-ink/20 p-10 text-center">
              <p className="font-display font-semibold text-ink/70">
                {t.catalog.emptyResult}
              </p>
              <p className="mt-1 text-sm text-ink/50">{t.catalog.emptyResultBody}</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  inOrder={inOrderIds.has(item.id)}
                  onAdd={handleAdd}
                />
              ))}
            </div>
          )}

          <div className="mt-6 rounded-lg bg-white/60 px-4 py-3">
            <p className="text-sm font-semibold text-ink">{t.catalog.quickTipLabel}</p>
            <p className="text-xs text-ink/55">{t.catalog.quickTip}</p>
          </div>
        </section>

        <aside className="w-full shrink-0 pb-16 md:pb-0 lg:sticky lg:top-4 lg:w-[380px] lg:self-start">
          <CartPanel onPay={() => setPayOpen(true)} />
        </aside>
      </div>

      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} />
      <BarcodeScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onProduct={handleScanProduct}
        onError={handleScanError}
      />
    </div>
  );
}

function toastAdd(name: string) {
  toast.success(t.toasts.addedTitle(name), { description: t.toasts.addedBody });
}
