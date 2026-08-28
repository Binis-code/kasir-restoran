import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { TableRow } from "../lib/db";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";

interface TableModalProps {
  open: boolean;
  tableToEdit?: TableRow | null;
  availableAreas?: string[];
  onClose: () => void;
  onSave: (table: TableRow) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const DEFAULT_AREAS = [
  "Utama",
  "Teras",
  "VIP",
  "Lantai 2",
  "Outdoor",
  "Lesehan",
  "Rooftop",
  "Gazebo",
];

export function TableModal({
  open,
  tableToEdit,
  availableAreas = DEFAULT_AREAS,
  onClose,
  onSave,
  onDelete,
}: TableModalProps) {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("4");
  const [area, setArea] = useState("Utama");
  const [submitting, setSubmitting] = useState(false);

  const mergedAreas = Array.from(
    new Set([...availableAreas, ...DEFAULT_AREAS]),
  );

  useEffect(() => {
    if (tableToEdit) {
      setName(tableToEdit.name);
      setSeats(String(tableToEdit.seats));
      setArea(tableToEdit.area || "Utama");
    } else {
      setName("");
      setSeats("4");
      setArea("Utama");
    }
  }, [tableToEdit, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Nama meja wajib diisi");
      return;
    }
    const numericSeats = Number.parseInt(seats, 10);
    if (isNaN(numericSeats) || numericSeats <= 0) {
      toast.warning("Kapasitas kursi harus lebih besar dari 0");
      return;
    }

    try {
      setSubmitting(true);
      const id = tableToEdit?.id ?? `meja-${Date.now()}`;
      const tableData: TableRow = {
        id,
        name: name.trim(),
        seats: numericSeats,
        area: area.trim() || "Utama",
      };

      await onSave(tableData);
      toast.success(
        tableToEdit
          ? `Meja "${name}" berhasil diperbarui`
          : `Meja "${name}" berhasil ditambahkan ke area "${tableData.area}"`,
      );
      onClose();
    } catch (err) {
      toast.error("Gagal menyimpan meja", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!tableToEdit || !onDelete) return;
    if (window.confirm(`Yakin ingin menghapus "${tableToEdit.name}"?`)) {
      try {
        setSubmitting(true);
        await onDelete(tableToEdit.id);
        toast.success(`Meja "${tableToEdit.name}" berhasil dihapus`);
        onClose();
      } catch {
        toast.error("Gagal menghapus meja");
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
        aria-labelledby="table-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-ink/10 bg-white p-6 shadow-2xl focus:outline-none"
      >
        <div className="flex items-start justify-between border-b border-ink/10 pb-4">
          <div>
            <h2
              id="table-modal-title"
              className="font-display text-xl font-bold tracking-tight text-ink"
            >
              {tableToEdit ? "Edit Meja" : "Tambah Meja Baru"}
            </h2>
            <p className="text-xs text-ink/55">
              Kelola nomor meja, kapasitas kursi, dan custom area makan.
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
              Nama / Nomor Meja <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Meja 05 / VIP 01 / Lesehan A"
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
              Kapasitas Kursi <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              max="50"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              placeholder="4"
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                Area / Lokasi (Bisa Custom Bebas)
              </label>
              <span className="text-[11px] font-medium text-counterlime-dark">
                Ketik nama area apa saja
              </span>
            </div>

            <input
              type="text"
              list="area-suggestions"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Ketik nama area kustom (contoh: Lesehan, Rooftop, VIP, Kolam)"
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-counterlime/60"
            />

            <datalist id="area-suggestions">
              {mergedAreas.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>

            <div className="mt-2.5">
              <p className="text-[11px] font-semibold text-ink/50 mb-1.5">Pilihan Cepat / Preset:</p>
              <div className="flex flex-wrap gap-1.5">
                {mergedAreas.map((a) => {
                  const isSelected = area.trim().toLowerCase() === a.trim().toLowerCase();
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setArea(a)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs transition-all",
                        isSelected
                          ? "border-counterlime bg-counterlime/25 font-bold text-ink shadow-xs"
                          : "border-ink/10 bg-mineral/50 text-ink/70 hover:bg-mineral hover:text-ink",
                      )}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-ink/10 pt-4">
            {tableToEdit && onDelete ? (
              <Button
                type="button"
                variant="danger-ghost"
                size="sm"
                onClick={handleDelete}
                disabled={submitting}
              >
                <Trash2 size={15} className="mr-1 text-red-500" />
                Hapus Meja
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
                {submitting ? "Menyimpan..." : "Simpan Meja"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
