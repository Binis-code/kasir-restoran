import { useState } from "react";
import {
  Smartphone,
  ChefHat,
  Server,
  Laptop,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  X,
  Radio,
  BookOpen,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";
import { getNetworkHostInfo } from "../services/localSyncServer";

interface LocalServerGuideModalProps {
  open: boolean;
  onClose: () => void;
  onOpenPairingHub?: () => void;
}

export function LocalServerGuideModal({
  open,
  onClose,
  onOpenPairingHub,
}: LocalServerGuideModalProps) {
  const [activeTab, setActiveTab] = useState<
    "alur" | "setup" | "pelayan" | "offline" | "troubleshoot"
  >("alur");
  const hostInfo = getNetworkHostInfo();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 bg-mineral/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-counterlime shadow-xs">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                Panduan Penerapan Server Lokal & Pelayan Keliling
              </h2>
              <p className="text-xs text-ink/55">
                Petunjuk lengkap operasional restoran tanpa internet & multi-device terpadu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-ink/10 px-6 bg-white overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("alur")}
            className={cn(
              "flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all",
              activeTab === "alur"
                ? "border-ink text-ink bg-mineral/20"
                : "border-transparent text-ink/50 hover:text-ink"
            )}
          >
            <Radio size={14} />
            1. Arsitektur Jaringan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("setup")}
            className={cn(
              "flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all",
              activeTab === "setup"
                ? "border-ink text-ink bg-mineral/20"
                : "border-transparent text-ink/50 hover:text-ink"
            )}
          >
            <Server size={14} />
            2. Setup Server Utama
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pelayan")}
            className={cn(
              "flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all",
              activeTab === "pelayan"
                ? "border-ink text-ink bg-mineral/20"
                : "border-transparent text-ink/50 hover:text-ink"
            )}
          >
            <Smartphone size={14} />
            3. Cara Kerja Pelayan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("offline")}
            className={cn(
              "flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all",
              activeTab === "offline"
                ? "border-ink text-ink bg-mineral/20"
                : "border-transparent text-ink/50 hover:text-ink"
            )}
          >
            <Zap size={14} />
            4. Mode Hotspot / Tanpa Internet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("troubleshoot")}
            className={cn(
              "flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all",
              activeTab === "troubleshoot"
                ? "border-ink text-ink bg-mineral/20"
                : "border-transparent text-ink/50 hover:text-ink"
            )}
          >
            <HelpCircle size={14} />
            5. Solusi Kendala
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-mineral/10 text-ink text-xs space-y-4">
          {/* TAB 1: ARSITEKTUR */}
          {activeTab === "alur" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                  <Radio size={16} className="text-counterlime-dark" />
                  Topologi Restoran Terintegrasi
                </h3>
                <p className="text-ink/70 leading-relaxed">
                  Sistem ini dirancang bekerja secara <strong>100% lokal (Local Area Network)</strong>. Anda tidak memerlukan koneksi internet stabil dari ISP luar untuk mencatat pesanan, mencetak struk, atau mengirim tiket ke koki dapur.
                </p>

                {/* Visual Topology Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl border border-ink/10 bg-mineral/30 p-3.5 text-center flex flex-col items-center justify-center">
                    <div className="h-10 w-10 rounded-xl bg-ink text-counterlime flex items-center justify-center mb-2 shadow-xs">
                      <Laptop size={20} />
                    </div>
                    <p className="font-bold text-ink text-xs">Kasir Utama (Server Host)</p>
                    <p className="text-[11px] text-ink/50 mt-1">
                      Menyimpan database menu, kategori, transaksi, dan laci kas.
                    </p>
                    <span className="mt-2 text-[10px] bg-white border border-ink/15 px-2 py-0.5 rounded font-mono font-bold">
                      {hostInfo.baseUrl}
                    </span>
                  </div>

                  <div className="rounded-xl border border-ink/10 bg-mineral/30 p-3.5 text-center flex flex-col items-center justify-center">
                    <div className="h-10 w-10 rounded-xl bg-counterlime text-ink flex items-center justify-center mb-2 shadow-xs">
                      <Smartphone size={20} />
                    </div>
                    <p className="font-bold text-ink text-xs">HP Pelayan Keliling</p>
                    <p className="text-[11px] text-ink/50 mt-1">
                      Mencatat pesanan di meja pelanggan dan kirim langsung ke dapur.
                    </p>
                    <span className="mt-2 text-[10px] bg-white border border-ink/15 px-2 py-0.5 rounded font-mono font-bold">
                      /pelayan
                    </span>
                  </div>

                  <div className="rounded-xl border border-ink/10 bg-mineral/30 p-3.5 text-center flex flex-col items-center justify-center">
                    <div className="h-10 w-10 rounded-xl bg-amber-400 text-ink flex items-center justify-center mb-2 shadow-xs">
                      <ChefHat size={20} />
                    </div>
                    <p className="font-bold text-ink text-xs">Layar Dapur (KDS)</p>
                    <p className="text-[11px] text-ink/50 mt-1">
                      Tablet di dapur/bar menerima pesanan real-time & timer masak.
                    </p>
                    <span className="mt-2 text-[10px] bg-white border border-ink/15 px-2 py-0.5 rounded font-mono font-bold">
                      /dapur
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 size={15} /> Keunggulan Arsitektur Lokal:
                </p>
                <ul className="list-disc list-inside space-y-1 text-emerald-900/80">
                  <li><strong>Respon Seketika:</strong> Pesanan masuk ke dapur dalam kurang dari 0.1 detik tanpa lag internet.</li>
                  <li><strong>Hemat Kuota & Bebas Langganan:</strong> Data tersimpan aman di mesin lokal restoran Anda.</li>
                  <li><strong>Pairing Cepat:</strong> Cukup scan QR Code dari layar kasir tanpa perlu login akun yang rumit.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: SETUP SERVER UTAMA */}
          {activeTab === "setup" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                  <Server size={16} className="text-counterlime-dark" />
                  Langkah Menjalankan Server Utama di Laptop / PC Kasir
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-mineral/30 border border-ink/10">
                    <span className="h-6 w-6 rounded-full bg-ink text-counterlime flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-ink">Pastikan Terhubung ke WiFi Restoran</p>
                      <p className="text-ink/60 mt-0.5">
                        Hubungkan Laptop/PC Server ke Router WiFi yang sama dengan HP pelayan & tablet dapur.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-mineral/30 border border-ink/10">
                    <span className="h-6 w-6 rounded-full bg-ink text-counterlime flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-ink">Jalankan Aplikasi Kasir</p>
                      <p className="text-ink/60 mt-0.5">
                        Server otomatis mendengarkan di mode host (`0.0.0.0:5173`). Alamat IP server Anda saat ini:
                      </p>
                      <code className="mt-1.5 inline-block bg-white px-2.5 py-1 rounded border border-ink/15 font-mono font-bold text-ink text-xs">
                        {hostInfo.baseUrl}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-mineral/30 border border-ink/10">
                    <span className="h-6 w-6 rounded-full bg-ink text-counterlime flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-ink">Buka Tombol "Server Lokal" di Header</p>
                      <p className="text-ink/60 mt-0.5">
                        Klik tombol status server di pojok kanan atas untuk menampilkan QR Code Pairing bagi staf pelayan dan dapur.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {onOpenPairingHub && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={onOpenPairingHub} className="gap-2">
                    <Radio size={14} />
                    Buka QR Code Pairing Sekarang
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CARA KERJA PELAYAN */}
          {activeTab === "pelayan" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                  <Smartphone size={16} className="text-counterlime-dark" />
                  Alur Kerja Pelayan Keliling (Order-Taker)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-ink/10 p-3.5 bg-mineral/20 space-y-2">
                    <p className="font-bold text-ink flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-counterlime text-ink flex items-center justify-center text-[11px] font-bold">
                        A
                      </span>
                      Buka & Atur Identitas
                    </p>
                    <p className="text-ink/60 text-[11px] leading-relaxed">
                      Pelayan membuka link `/pelayan` di HP. Tidak perlu kata sandi rumit; cukup ketik nama pelayan (misal: *Budi*) sekali saja dan sistem akan mengingatnya.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ink/10 p-3.5 bg-mineral/20 space-y-2">
                    <p className="font-bold text-ink flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-counterlime text-ink flex items-center justify-center text-[11px] font-bold">
                        B
                      </span>
                      Pilih Meja & Catat Pesanan
                    </p>
                    <p className="text-ink/60 text-[11px] leading-relaxed">
                      Pelayan memilih Meja tamu (lampu Meja menunjukkan status <em>Terisi</em> atau <em>Kosong</em>). Tambahkan menu dan catatan khusus (*less sugar, pisah kuah*).
                    </p>
                  </div>

                  <div className="rounded-xl border border-ink/10 p-3.5 bg-mineral/20 space-y-2">
                    <p className="font-bold text-ink flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-counterlime text-ink flex items-center justify-center text-[11px] font-bold">
                        C
                      </span>
                      Kirim ke Dapur (KDS)
                    </p>
                    <p className="text-ink/60 text-[11px] leading-relaxed">
                      Tekan tombol <strong>"Kirim ke Dapur (KDS)"</strong>. Layar KDS koki seketika berbunyi bel notifikasi dan tiket antrean masak langsung muncul.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ink/10 p-3.5 bg-mineral/20 space-y-2">
                    <p className="font-bold text-ink flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-counterlime text-ink flex items-center justify-center text-[11px] font-bold">
                        D
                      </span>
                      Bayar di Tempat (Opsional)
                    </p>
                    <p className="text-ink/60 text-[11px] leading-relaxed">
                      Jika pelanggan ingin bayar langsung di meja, pelayan dapat menekan tombol <strong>"Bayar di Tempat (Pay at Table)"</strong> via Tunai atau scan QRIS.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MODE HOTSPOT / TANPA INTERNET */}
          {activeTab === "offline" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                  <Zap size={16} className="text-counterlime-dark" />
                  Menjalankan Aplikasi Menggunakan Hotspot HP (100% Offline)
                </h3>
                <p className="text-ink/70 leading-relaxed">
                  Jika restoran Anda belum memiliki router WiFi tetap, Anda dapat memanfaatkan <strong>Hotspot Portabel dari HP Kasir</strong> tanpa menghabiskan kuota data:
                </p>

                <div className="rounded-xl border border-ink/10 bg-mineral/30 p-4 space-y-2.5">
                  <ol className="list-decimal list-inside space-y-2 text-ink/80">
                    <li>
                      <strong>Nyalakan Hotspot Portabel di HP/Laptop:</strong> Buat nama hotspot restoran (misal: <em>WiFi-Kasir-Resto</em>).
                    </li>
                    <li>
                      <strong>Sambungkan HP Pelayan:</strong> Sambungkan HP semua pelayan ke hotspot tersebut.
                    </li>
                    <li>
                      <strong>Scan QR Code di Layar Kasir:</strong> HP pelayan akan langsung membuka sistem kasir lokal dengan kecepatan tinggi.
                    </li>
                  </ol>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck size={15} /> Keamanan Data Offline:
                </p>
                <p className="text-amber-900/80 text-[11px]">
                  Semua transaksi tersimpan di memori perangkat lokal dengan enkripsi IndexedDB. Saat aplikasi ditutup, data tetap aman dan tidak akan hilang.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: SOLUSI KENDALA */}
          {activeTab === "troubleshoot" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-1.5">
                <p className="font-bold text-ink flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600" />
                  1. HP Pelayan tidak bisa membuka link setelah scan QR?
                </p>
                <p className="text-ink/70 text-[11px] leading-relaxed">
                  • Pastikan HP Pelayan tersambung ke WiFi/Hotspot yang sama dengan server kasir.<br />
                  • Pastikan firewall di komputer server tidak memblokir port 5173 (izinkan Node.js / Vite di Windows Firewall).<br />
                  • Gunakan tombol <strong>"Ubah IP Manual"</strong> di modal Pusat Jaringan untuk memasukkan alamat IP WiFi laptop Anda (misal: `192.168.1.15:5173`).
                </p>
              </div>

              <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-1.5">
                <p className="font-bold text-ink flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600" />
                  2. Pesanan dari pelayan tidak muncul di dapur?
                </p>
                <p className="text-ink/70 text-[11px] leading-relaxed">
                  • Pastikan lampu indikator di kanan atas HP Pelayan berwarna hijau (<em>Real-Time Sync Aktif</em>).<br />
                  • Buka tab <strong>Perangkat</strong> di Pusat Jaringan untuk memastikan tablet dapur terdaftar dan online.
                </p>
              </div>

              <div className="rounded-xl border border-ink/10 bg-white p-4 space-y-1.5">
                <p className="font-bold text-ink flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600" />
                  3. Ingin mengganti IP Server Utama saat berpindah router?
                </p>
                <p className="text-ink/70 text-[11px] leading-relaxed">
                  • Buka menu <strong>Pengaturan</strong> &gt; <strong>Server Lokal</strong> &gt; klik <strong>Pusat Jaringan</strong> &gt; klik <strong>Ubah IP Manual</strong> lalu masukkan IP baru dari router.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-ink/10 bg-white px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-ink/50">
            <Radio size={14} className="text-emerald-600" />
            <span>Server Lokal Siap Digunakan.</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPairingHub && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenPairingHub();
                }}
                className="text-xs"
              >
                Buka Pairing QR
              </Button>
            )}
            <Button variant="ink" size="sm" onClick={onClose}>
              Tutup Panduan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
