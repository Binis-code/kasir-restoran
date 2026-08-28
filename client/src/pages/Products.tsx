import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { formatIDR, type MenuItem } from "../data/menu";
import { t } from "../locales/en";
import { Header } from "../components/Header";
import { FoodImage } from "../components/FoodImage";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { usePos } from "../components/PosContext";

export default function Products() {
  const { products } = usePos();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return products;
    return products.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.barcode.includes(q),
    );
  }, [products, query]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t.productsPage.title} />
      <div className="flex-1 p-5 md:p-8">
        <div className="-mt-1 mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/55">{t.productsPage.subtitle}</p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                aria-label={t.productsPage.searchPlaceholder}
                placeholder={t.productsPage.searchPlaceholder}
                className="h-11 w-52 rounded-lg border border-ink/15 bg-white pl-9 pr-3 text-base text-ink placeholder:text-ink/40 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>
            <Button onClick={notifyEditor}>{t.productsPage.addNew}</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/20 p-10 text-center">
            <p className="font-display font-semibold text-ink/70">
              {t.productsPage.emptyResult}
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-ink/10 bg-white">
            {filtered.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 border-b border-ink/6 px-4 py-3.5 last:border-0 hover:bg-mineral/40 md:px-5"
              >
                <FoodImage
                  item={item}
                  className="h-12 w-12 shrink-0 rounded-lg border border-ink/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="truncate text-xs text-ink/50">{item.description}</p>
                </div>
                <span className="hidden shrink-0 sm:block">
                  <Badge>{item.category}</Badge>
                </span>
                <p className="w-24 shrink-0 text-right font-display text-sm font-bold tracking-tight text-ink">
                  {formatIDR(item.price)}
                </p>
                <span className="hidden w-16 shrink-0 text-center md:block">
                  <Badge tone="lime">{t.productsPage.statusActive}</Badge>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => notifyEdit(item)}
                >
                  {t.productsPage.edit}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function notifyEditor() {
  toast(t.toasts.productEditSoon, { description: t.toasts.productEditBody });
}

function notifyEdit(item: MenuItem) {
  toast(t.toasts.productEditSoon, {
    description: `${item.name} · ${t.toasts.productEditBody}`,
  });
}
