import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { formatIDR, type MenuItem } from "../data/menu";
import { t } from "../locales/en";
import { Header } from "../components/Header";
import { FoodImage } from "../components/FoodImage";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ProductModal } from "../components/ProductModal";
import { usePos } from "../components/PosContext";

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = usePos();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

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

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setSelectedProduct(item);
    setModalOpen(true);
  };

  const handleSave = async (item: MenuItem) => {
    if (selectedProduct) {
      await updateProduct(item);
    } else {
      await addProduct(item);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t.productsPage.title} />
      <div className="flex-1 p-5 md:p-8">
        <div className="-mt-1 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink/55">{t.productsPage.subtitle}</p>
            <p className="text-xs font-semibold text-ink/40">Total: {products.length} produk terdaftar</p>
          </div>
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
            <Button onClick={handleOpenAdd}>
              <Plus size={16} className="mr-1" />
              {t.productsPage.addNew}
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/20 p-10 text-center bg-white">
            <p className="font-display font-semibold text-ink/70">
              {t.productsPage.emptyResult}
            </p>
            <p className="mt-1 text-xs text-ink/50">Coba kata kunci lain atau tambahkan produk baru.</p>
            <Button size="sm" className="mt-4" onClick={handleOpenAdd}>
              <Plus size={14} className="mr-1" /> Tambah Produk Baru
            </Button>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
            {filtered.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 border-b border-ink/6 px-4 py-3.5 last:border-0 hover:bg-mineral/40 md:px-5"
              >
                <FoodImage
                  item={item}
                  className="h-12 w-12 shrink-0 rounded-lg border border-ink/10 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink">{item.name}</p>
                    {item.badge && (
                      <span className="rounded bg-counterlime/30 px-1.5 py-0.5 text-[10px] font-bold text-ink">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink/50">{item.description}</p>
                  <p className="mt-0.5 text-[11px] font-mono text-ink/40">Barcode: {item.barcode}</p>
                </div>
                <span className="hidden shrink-0 sm:block">
                  <Badge>{item.category}</Badge>
                </span>
                <p className="w-28 shrink-0 text-right font-display text-sm font-bold tracking-tight text-ink">
                  {formatIDR(item.price)}
                </p>
                <span className="hidden w-16 shrink-0 text-center md:block">
                  <Badge tone="lime">{t.productsPage.statusActive}</Badge>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleOpenEdit(item)}
                >
                  {t.productsPage.edit}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProductModal
        open={modalOpen}
        itemToEdit={selectedProduct}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
