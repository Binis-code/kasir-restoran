import { useState, useMemo } from "react";
import { usePos } from "./PosContext";
import type { CategoryRow } from "../lib/db";
import { Button } from "./ui/Button";
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  X,
  Layers,
  UtensilsCrossed,
  Coffee,
  Cookie,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/cn";

interface CategoryManagerModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS = [
  { id: "counterlime", label: "Lime", bg: "bg-counterlime", border: "border-counterlime-dark" },
  { id: "amber", label: "Amber", bg: "bg-amber-400", border: "border-amber-500" },
  { id: "rose", label: "Rose", bg: "bg-rose-400", border: "border-rose-500" },
  { id: "blue", label: "Blue", bg: "bg-blue-400", border: "border-blue-500" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-400", border: "border-emerald-500" },
  { id: "purple", label: "Purple", bg: "bg-purple-400", border: "border-purple-500" },
  { id: "teal", label: "Teal", bg: "bg-teal-400", border: "border-teal-500" },
];

export function CategoryManagerModal({ open, onClose }: CategoryManagerModalProps) {
  const { categories, products, addCategory, updateCategory, deleteCategory } = usePos();

  // Form State for Add / Direct Edit
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catKind, setCatKind] = useState<"Makanan" | "Minuman" | "Camilan">("Makanan");
  const [catColor, setCatColor] = useState("counterlime");
  const [showAddForm, setShowAddForm] = useState(false);

  // Two-Step Verification State for Delete / Critical Edit
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationStep, setVerificationStep] = useState<1 | 2>(1);
  const [targetCategory, setTargetCategory] = useState<CategoryRow | null>(null);
  const [reassignTargetCategory, setReassignTargetCategory] = useState<string>("");
  const [pinInput, setPinInput] = useState("");
  const [typeConfirmInput, setTypeConfirmInput] = useState("");

  const resetForm = () => {
    setEditingCatId(null);
    setCatName("");
    setCatKind("Makanan");
    setCatColor("counterlime");
    setShowAddForm(false);
  };

  const startEdit = (cat: CategoryRow) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatKind(cat.kind);
    setCatColor(cat.color || "counterlime");
    setShowAddForm(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Nama kategori tidak boleh kosong");
      return;
    }

    try {
      if (editingCatId) {
        const oldCat = categories.find((c) => c.id === editingCatId);
        await updateCategory(
          editingCatId,
          {
            name: catName.trim(),
            kind: catKind,
            color: catColor,
          },
          oldCat?.name
        );
        toast.success(`Kategori "${catName}" berhasil diperbarui!`);
      } else {
        await addCategory({
          name: catName.trim(),
          kind: catKind,
          color: catColor,
        });
        toast.success(`Kategori baru "${catName}" berhasil ditambahkan!`);
      }
      resetForm();
    } catch {
      toast.error("Gagal menyimpan kategori");
    }
  };

  // Open 2-Step Verification for Delete
  const handleInitiateDelete = (cat: CategoryRow) => {
    setTargetCategory(cat);
    // Find available fallback categories for reassignment
    const fallbacks = categories.filter((c) => c.id !== cat.id);
    setReassignTargetCategory(fallbacks[0]?.name || "");
    setVerificationStep(1);
    setPinInput("");
    setTypeConfirmInput("");
    setVerificationModalOpen(true);
  };

  // Affected products for target category
  const affectedProducts = useMemo(() => {
    if (!targetCategory) return [];
    return products.filter((p) => p.category === targetCategory.name);
  }, [products, targetCategory]);

  const handleExecuteDelete = async () => {
    if (!targetCategory) return;
    try {
      await deleteCategory(
        targetCategory.id,
        targetCategory.name,
        reassignTargetCategory || undefined
      );
      setVerificationModalOpen(false);
      setTargetCategory(null);
      toast.success(
        `Kategori "${targetCategory.name}" berhasil dihapus${
          affectedProducts.length > 0 && reassignTargetCategory
            ? ` (${affectedProducts.length} produk dialihkan ke "${reassignTargetCategory}")`
            : ""
        }`
      );
    } catch {
      toast.error("Gagal menghapus kategori");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px] overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl relative my-8"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-ink/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-counterlime/20 text-ink flex items-center justify-center border border-counterlime/40">
              <Layers className="w-5 h-5 text-counterlime-dark" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Kelola Kategori Produk
              </h3>
              <p className="text-xs text-ink/55">
                Tambah, atur jenis dapur, atau hapus kategori dengan verifikasi keamanan dua langkah.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Add / Edit Form Card */}
        {showAddForm ? (
          <form
            onSubmit={handleSaveForm}
            className="mt-4 p-4 rounded-xl border border-counterlime/30 bg-counterlime/5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-ink">
                {editingCatId ? "✏️ Edit Kategori" : "+ Tambah Kategori Baru"}
              </h4>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-ink/50 hover:text-ink font-medium"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Paket Combo / Dessert"
                  className="w-full px-3 py-2 rounded-xl border border-ink/15 bg-white text-sm font-semibold text-ink focus:ring-2 focus:ring-counterlime focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Jenis Menu (Rute Dapur)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["Makanan", "Minuman", "Camilan"] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setCatKind(kind)}
                      className={cn(
                        "py-2 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all",
                        catKind === kind
                          ? "bg-ink text-white border-ink shadow-sm"
                          : "bg-white text-ink/60 border-ink/15 hover:text-ink"
                      )}
                    >
                      {kind === "Makanan" ? (
                        <UtensilsCrossed size={12} />
                      ) : kind === "Minuman" ? (
                        <Coffee size={12} />
                      ) : (
                        <Cookie size={12} />
                      )}
                      {kind}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Color Swatches */}
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                Warna Identitas Kategori
              </label>
              <div className="flex items-center gap-2">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCatColor(c.id)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform",
                      c.bg,
                      catColor === c.id
                        ? "ring-2 ring-ink ring-offset-2 scale-110 shadow-sm"
                        : "opacity-75 hover:opacity-100"
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-semibold">
                {editingCatId ? "Simpan Perubahan" : "+ Tambahkan Kategori"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="gap-1.5 font-semibold"
            >
              <Plus size={15} />
              Tambah Kategori Baru
            </Button>
          </div>
        )}

        {/* Categories List Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-mineral/60">
                <th className="label-caps px-4 py-3 text-[11px] font-semibold text-ink/50">
                  Kategori
                </th>
                <th className="label-caps px-4 py-3 text-[11px] font-semibold text-ink/50">
                  Jenis Dapur
                </th>
                <th className="label-caps px-4 py-3 text-center text-[11px] font-semibold text-ink/50">
                  Jumlah Produk
                </th>
                <th className="label-caps px-4 py-3 text-right text-[11px] font-semibold text-ink/50">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/6">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.name).length;
                return (
                  <tr key={cat.id} className="hover:bg-mineral/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-ink">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            cat.color === "amber"
                              ? "bg-amber-400"
                              : cat.color === "rose"
                              ? "bg-rose-400"
                              : cat.color === "blue"
                              ? "bg-blue-400"
                              : cat.color === "emerald"
                              ? "bg-emerald-400"
                              : cat.color === "purple"
                              ? "bg-purple-400"
                              : cat.color === "teal"
                              ? "bg-teal-400"
                              : "bg-counterlime"
                          )}
                        />
                        <span>{cat.name}</span>
                        {cat.isDefault && (
                          <span className="text-[10px] font-medium text-ink/40 bg-mineral px-1.5 py-0.5 rounded">
                            Bawaan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-mineral/70 text-ink/70 border border-ink/10">
                        {cat.kind === "Makanan" ? (
                          <UtensilsCrossed size={11} />
                        ) : cat.kind === "Minuman" ? (
                          <Coffee size={11} />
                        ) : (
                          <Cookie size={11} />
                        )}
                        {cat.kind}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-xs">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full",
                          count > 0 ? "bg-counterlime/20 text-ink" : "bg-ink/5 text-ink/40"
                        )}
                      >
                        {count} Produk
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(cat)}
                          className="h-8 px-2 text-ink/70 hover:text-ink"
                          title="Edit Kategori"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="danger-ghost"
                          size="sm"
                          onClick={() => handleInitiateDelete(cat)}
                          className="h-8 px-2"
                          title="Hapus Kategori (Verifikasi 2 Langkah)"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-right">
          <Button variant="outline" size="sm" onClick={onClose}>
            Selesai
          </Button>
        </div>
      </div>

      {/* Two-Step Verification Modal (Hapus Kategori) */}
      {verificationModalOpen && targetCategory && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-ink/65 p-4 backdrop-blur-sm"
          onClick={() => setVerificationModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl relative"
          >
            {/* Header with Step Indicator */}
            <div className="flex items-start justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                    Verifikasi Dua Langkah
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                      Langkah {verificationStep} dari 2
                    </span>
                  </h3>
                  <p className="text-xs text-ink/55">
                    Penghapusan kategori berdampak pada produk terkait.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerificationModalOpen(false)}
                className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* STEP 1: Impact Review & Product Reassignment */}
            {verificationStep === 1 ? (
              <div className="mt-4 space-y-4">
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Konfirmasi Hapus Kategori: </span>
                    Anda akan menghapus kategori <strong>"{targetCategory.name}"</strong>.
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-ink/70 mb-1">
                    Dampak Data Terkait:
                  </div>
                  <div className="p-3 rounded-xl border border-ink/10 bg-mineral/30 text-xs text-ink/80 space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span>Jumlah Produk Terdaftar:</span>
                      <span className="text-rose-600 font-bold">{affectedProducts.length} Produk</span>
                    </div>
                    {affectedProducts.length > 0 && (
                      <div className="text-[11px] text-ink/55 line-clamp-2">
                        Contoh produk: {affectedProducts.map((p) => p.name).slice(0, 4).join(", ")}
                        {affectedProducts.length > 4 ? "..." : ""}
                      </div>
                    )}
                  </div>
                </div>

                {affectedProducts.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                      Pindahkan {affectedProducts.length} produk ini ke kategori lain:
                    </label>
                    <select
                      value={reassignTargetCategory}
                      onChange={(e) => setReassignTargetCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-ink/15 bg-white text-sm font-semibold text-ink focus:ring-2 focus:ring-counterlime focus:outline-none"
                    >
                      {categories
                        .filter((c) => c.id !== targetCategory.id)
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            Pindahkan ke: {c.name} ({c.kind})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVerificationModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setVerificationStep(2)}
                    className="gap-2 bg-ink text-white hover:bg-ink/90 font-semibold"
                  >
                    Lanjut ke Verifikasi (Langkah 2)
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              /* STEP 2: Security Verification (PIN or Text Confirmation) */
              <div className="mt-4 space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Otorisasi Keamanan: </span>
                    Masukkan PIN Kasir/Supervisor (Default: <strong className="font-mono">1234</strong>) atau ketik nama kategori untuk konfirmasi.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                    Masukkan PIN Kasir (1234):
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full text-center tracking-widest px-3.5 py-2.5 rounded-xl border border-ink/15 bg-white text-lg font-bold text-ink focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>

                <div className="text-center text-xs text-ink/40 font-medium">
                  — ATAU KETIK NAMA KATEGORI —
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                    Ketik teks: <strong className="text-rose-600 font-mono">{targetCategory.name}</strong>
                  </label>
                  <input
                    type="text"
                    value={typeConfirmInput}
                    onChange={(e) => setTypeConfirmInput(e.target.value)}
                    placeholder={targetCategory.name}
                    className="w-full px-3.5 py-2 rounded-xl border border-ink/15 bg-white text-sm font-semibold text-ink focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVerificationStep(1)}
                    className="gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    Kembali ke Langkah 1
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      pinInput.trim() !== "1234" &&
                      typeConfirmInput.trim().toLowerCase() !== targetCategory.name.trim().toLowerCase()
                    }
                    onClick={handleExecuteDelete}
                    className={cn(
                      "gap-2 font-bold transition-all",
                      pinInput.trim() === "1234" ||
                        typeConfirmInput.trim().toLowerCase() === targetCategory.name.trim().toLowerCase()
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
                        : "bg-ink/10 text-ink/40 border-0 cursor-not-allowed"
                    )}
                  >
                    <Trash2 size={15} />
                    Konfirmasi Hapus Sekarang
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
