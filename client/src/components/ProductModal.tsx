import { useEffect, useState } from "react";
import { Sparkles, Trash2, X, Plus, Check, ScanLine } from "lucide-react";
import { toast } from "sonner";
import type { MenuItem, MenuKind } from "../data/menu";
import { Button } from "./ui/Button";
import { usePos } from "./PosContext";
import { cn } from "../lib/cn";
import { ProductImagePicker, CULINARY_GALLERY } from "./ProductImagePicker";
import { BarcodeScanner } from "./BarcodeScanner";

interface ProductModalProps {
  open: boolean;
  itemToEdit?: MenuItem | null;
  onClose: () => void;
  onSave: (item: MenuItem) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function ProductModal({
  open,
  itemToEdit,
  onClose,
  onSave,
  onDelete,
}: ProductModalProps) {
  const { categories, addCategory } = usePos();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Makanan");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [barcode, setBarcode] = useState("");
  const [image, setImage] = useState(CULINARY_GALLERY[0].url);
  const [badge, setBadge] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Inline Quick Add Category
  const [inlineNewCatOpen, setInlineNewCatOpen] = useState(false);
  const [inlineNewCatName, setInlineNewCatName] = useState("");
  const [inlineNewCatKind, setInlineNewCatKind] = useState<MenuKind>("Makanan");

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
      setCategory(categories[0]?.name || "Makanan");
      setPrice("");
      setDescription("");
      setBarcode(generateRandomBarcode());
      setImage(CULINARY_GALLERY[0].url);
      setBadge("");
    }
  }, [itemToEdit, open, categories]);

  if (!open) return null;

  const handleCreateInlineCategory = async () => {
    if (!inlineNewCatName.trim()) {
      toast.warning("Nama kategori tidak boleh kosong");
      return;
    }
    const created = await addCategory({
      name: inlineNewCatName.trim(),
      kind: inlineNewCatKind,
    });
    setCategory(created.name);
    setInlineNewCatName("");
    setInlineNewCatOpen(false);
    toast.success(`Kategori "${created.name}" berhasil dibuat dan dipilih!`);
  };

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
      const matchedCategory = categories.find((c) => c.name === category);
      const kind: MenuKind = matchedCategory ? matchedCategory.kind : "Makanan";

      const itemData: MenuItem = {
        id,
        name: name.trim(),
        category: category as any,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-3 sm:p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col max-h-[90vh] w-full max-w-2xl rounded-2xl border border-ink/10 bg-white shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Sticky Header */}
        <div className="shrink-0 flex items-start justify-between border-b border-ink/10 px-6 py-4 bg-white">
          <div>
            <h2
              id="product-modal-title"
              className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink"
            >
              {itemToEdit ? "Edit Produk" : "Tambah Produk Baru"}
            </h2>
            <p className="text-xs text-ink/55 mt-0.5">
              Kelola informasi menu, harga, kategori, dan foto produk (lokal / online).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/50 hover:bg-ink/5 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setInlineNewCatOpen(!inlineNewCatOpen)}
                  className="text-[11px] font-semibold text-counterlime-dark hover:underline flex items-center gap-0.5"
                >
                  <Plus size={12} />
                  {inlineNewCatOpen ? "Tutup" : "+ Kategori Baru"}
                </button>
              </div>

              {inlineNewCatOpen ? (
                <div className="mt-1 p-2.5 rounded-lg border border-counterlime/40 bg-counterlime/10 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={inlineNewCatName}
                      onChange={(e) => setInlineNewCatName(e.target.value)}
                      placeholder="Nama kategori..."
                      className="flex-1 px-2.5 py-1.5 rounded-md border border-ink/15 bg-white text-xs font-semibold text-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineCategory}
                      className="px-2.5 py-1.5 rounded-md bg-counterlime text-ink text-xs font-bold hover:bg-counterlime-dark flex items-center gap-1"
                    >
                      <Check size={13} />
                      Simpan
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {(["Makanan", "Minuman", "Camilan"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setInlineNewCatKind(k)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-semibold border",
                          inlineNewCatKind === k
                            ? "bg-ink text-white border-ink"
                            : "bg-white text-ink/60 border-ink/15"
                        )}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm text-ink focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} ({cat.kind})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Barcode (EAN-13 / SKU)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-counterlime/30 hover:bg-counterlime/60 px-2 py-0.5 rounded-md transition-colors"
                  >
                    <ScanLine size={12} /> Pindai
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarcode(generateRandomBarcode())}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink/60 hover:text-ink"
                  >
                    <Sparkles size={12} /> Auto
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="899..."
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm font-mono text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                Badge / Label Khusus (Opsional)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Contoh: Terlaris / Populer / Rekomendasi"
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                Deskripsi Singkat Menu
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi bahan atau catatan rasa..."
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
              />
            </div>
          </div>

          {/* Image Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5">
              Pilihan Foto Produk (Lokal / Web / Galeri Nusantara)
            </label>
            <ProductImagePicker
              value={image}
              onChange={setImage}
              productName={name}
              categoryName={category}
            />
          </div>
        </form>

        {/* Sticky Pinned Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-ink/10 px-6 py-3 bg-mineral/30">
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
            <Button
              type="submit"
              form="product-form"
              size="sm"
              disabled={submitting}
            >
              {submitting ? "Menyimpan..." : "Simpan Produk"}
            </Button>
          </div>
        </div>
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Pindai Barcode Fisik Produk"
        subtitle="Arahkan barcode kemasan produk ke kamera atau ketik/unggah foto"
        onScanCode={(code) => {
          setBarcode(code);
          toast.success(`Barcode Berhasil Diisi: ${code}`);
          setScannerOpen(false);
        }}
      />
    </div>
  );
}

function generateRandomBarcode(): string {
  const prefix = "899";
  const randomPart = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return `${prefix}${randomPart}`;
}
