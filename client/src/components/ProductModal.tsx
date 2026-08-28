import { useEffect, useState } from "react";
import { Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { MENU_CATEGORIES, type MenuCategory, type MenuItem, type MenuKind } from "../data/menu";
import { Button } from "./ui/Button";

interface ProductModalProps {
  open: boolean;
  itemToEdit?: MenuItem | null;
  onClose: () => void;
  onSave: (item: MenuItem) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const PRESET_IMAGES: { label: string; url: string }[] = [
  {
    label: "Kopi",
    url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60",
  },
  {
    label: "Nasi Goreng",
    url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=60",
  },
  {
    label: "Mie",
    url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60",
  },
  {
    label: "Roti / Sarapan",
    url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=60",
  },
  {
    label: "Camilan / Gorengan",
    url: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=60",
  },
  {
    label: "Minuman Dingin",
    url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60",
  },
];

export function ProductModal({
  open,
  itemToEdit,
  onClose,
  onSave,
  onDelete,
}: ProductModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MenuCategory>("Makanan");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [barcode, setBarcode] = useState("");
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [badge, setBadge] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategory(itemToEdit.category);
      setPrice(String(itemToEdit.price));
      setDescription(itemToEdit.description);
      setBarcode(itemToEdit.barcode);
      setImage(itemToEdit.image);
      setBadge(itemToEdit.badge ?? "");
    } else {
      setName("");
      setCategory("Makanan");
      setPrice("");
      setDescription("");
      setBarcode(generateRandomBarcode());
      setImage(PRESET_IMAGES[1].url);
      setBadge("");
    }
  }, [itemToEdit, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Nama produk wajib diisi");
      return;
    }
    const numericPrice = Number.parseInt(price.replace(/\D/g, ""), 10);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.warning("Harga produk harus lebih besar dari 0");
      return;
    }

    try {
      setSubmitting(true);
      const id = itemToEdit?.id ?? `prod-${Date.now()}`;
      const kind: MenuKind =
        category === "Minuman" ? "Minuman" : category === "Camilan" ? "Camilan" : "Makanan";

      const itemData: MenuItem = {
        id,
        name: name.trim(),
        category,
        kind,
        prepMinutes: itemToEdit?.prepMinutes ?? 5,
        price: numericPrice,
        description: description.trim() || name.trim(),
        barcode: barcode.trim() || generateRandomBarcode(),
        image,
        badge: badge.trim() ? badge.trim() : undefined,
      };

      await onSave(itemData);
      toast.success(
        itemToEdit
          ? `Produk "${name}" berhasil diperbarui`
          : `Produk "${name}" berhasil ditambahkan`,
      );
      onClose();
    } catch (err) {
      toast.error("Gagal menyimpan produk", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToEdit || !onDelete) return;
    if (window.confirm(`Yakin ingin menghapus produk "${itemToEdit.name}"?`)) {
      try {
        setSubmitting(true);
        await onDelete(itemToEdit.id);
        toast.success(`Produk "${itemToEdit.name}" berhasil dihapus`);
        onClose();
      } catch {
        toast.error("Gagal menghapus produk");
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl focus:outline-none"
      >
        <div className="flex items-start justify-between border-b border-ink/10 pb-4">
          <div>
            <h2
              id="product-modal-title"
              className="font-display text-xl font-bold tracking-tight text-ink"
            >
              {itemToEdit ? "Edit Produk" : "Tambah Produk Baru"}
            </h2>
            <p className="text-xs text-ink/55">
              Kelola informasi menu, harga, kategori, dan barcode produk.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/50 hover:bg-ink/5 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Nasi Goreng Spesial"
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MenuCategory)}
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              >
                {MENU_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                Harga Jual (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1000"
                step="500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Contoh: 25000"
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi bahan atau catatan menu..."
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Barcode (EAN-13 / SKU)
                </label>
                <button
                  type="button"
                  onClick={() => setBarcode(generateRandomBarcode())}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink/60 hover:text-ink"
                >
                  <Sparkles size={12} /> Auto
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="899..."
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm font-mono text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                Badge / Label Khusus (Opsional)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Contoh: Terlaris / Populer"
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Pilihan Foto Makanan / Minuman
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImage(preset.url)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    image === preset.url
                      ? "border-counterlime bg-counterlime/20 font-bold text-ink"
                      : "border-ink/10 bg-mineral/40 text-ink/60 hover:bg-mineral"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Atau masukkan URL foto kustom..."
              className="mt-2 w-full rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
            />
          </div>

          <div className="flex items-center justify-between border-t border-ink/10 pt-4">
            {itemToEdit && onDelete ? (
              <Button
                type="button"
                variant="danger-ghost"
                size="sm"
                onClick={handleDelete}
                disabled={submitting}
              >
                <Trash2 size={15} className="mr-1" />
                Hapus Produk
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan Produk"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function generateRandomBarcode(): string {
  const prefix = "899";
  const randomPart = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return `${prefix}${randomPart}`;
}
