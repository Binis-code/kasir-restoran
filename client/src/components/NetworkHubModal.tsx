import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Wifi,
  Smartphone,
  ChefHat,
  QrCode,
  Users,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Server,
  Info,
  X,
  Radio,
  Laptop,
  Tablet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";
import {
  getNetworkHostInfo,
  localNetworkHub,
  type ConnectedDevice,
} from "../services/localSyncServer";
import { usePos } from "./PosContext";

interface NetworkHubModalProps {
  open: boolean;
  onClose: () => void;
}

export function NetworkHubModal({ open, onClose }: NetworkHubModalProps) {
  const { tables } = usePos();
  const hostInfo = getNetworkHostInfo();
  const [activeTab, setActiveTab] = useState<"pelayan" | "dapur" | "meja" | "perangkat">("pelayan");
  const [customIp, setCustomIp] = useState(() => {
    return localStorage.getItem("kasa_custom_server_ip") || "";
  });
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || "meja-01");
  const [connectedPeers, setConnectedPeers] = useState<ConnectedDevice[]>([]);

  // Keep selected table valid if tables change
  useEffect(() => {
    if (tables.length > 0 && !tables.some((t) => t.id === selectedTableId)) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  // Generated QR Data URLs
  const [waiterQrUrl, setWaiterQrUrl] = useState<string>("");
  const [kitchenQrUrl, setKitchenQrUrl] = useState<string>("");
  const [tableQrUrl, setTableQrUrl] = useState<string>("");

  // Determine effective base URL
  const effectiveBaseUrl = customIp.trim()
    ? `http://${customIp.trim().replace(/^https?:\/\//, "")}${
        customIp.includes(":") ? "" : `:${hostInfo.port || "5173"}`
      }`
    : hostInfo.baseUrl;

  const waiterFullUrl = `${effectiveBaseUrl}/pelayan`;
  const kitchenFullUrl = `${effectiveBaseUrl}/dapur`;
  const tableFullUrl = selectedTable
    ? `${effectiveBaseUrl}/order/${selectedTable.id}`
    : `${effectiveBaseUrl}/order/meja-01`;

  // Subscribe to live connected peers
  useEffect(() => {
    if (!open) return;
    const unsub = localNetworkHub.subscribePeers((peers) => {
      setConnectedPeers(peers);
    });
    return unsub;
  }, [open]);

  // Generate QR codes
  useEffect(() => {
    if (!open) return;

    QRCode.toDataURL(waiterFullUrl, { width: 280, margin: 1, color: { dark: "#14211F", light: "#FFFFFF" } })
      .then(setWaiterQrUrl)
      .catch(console.error);

    QRCode.toDataURL(kitchenFullUrl, { width: 280, margin: 1, color: { dark: "#14211F", light: "#FFFFFF" } })
      .then(setKitchenQrUrl)
      .catch(console.error);

    QRCode.toDataURL(tableFullUrl, { width: 280, margin: 1, color: { dark: "#14211F", light: "#FFFFFF" } })
      .then(setTableQrUrl)
      .catch(console.error);
  }, [open, waiterFullUrl, kitchenFullUrl, tableFullUrl]);

  if (!open) return null;

  const handleCopy = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success(`${label} disalin ke clipboard!`);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleSaveCustomIp = () => {
    const clean = customIp.trim();
    if (clean) {
      localStorage.setItem("kasa_custom_server_ip", clean);
      toast.success("Alamat IP Server Lokal disimpan!");
    } else {
      localStorage.removeItem("kasa_custom_server_ip");
      toast.info("Menggunakan alamat IP otomatis.");
    }
    setIsEditingIp(false);
  };

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
        <div className="flex items-center justify-between border-b border-ink/10 bg-mineral/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-counterlime text-ink shadow-xs">
              <Radio size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                Pusat Jaringan & Perangkat
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Server Lokal Aktif
                </span>
              </h2>
              <p className="text-xs text-ink/55">
                Hubungkan HP Pelayan & Tablet Dapur ke Server Utama dalam 1 jaringan WiFi.
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

        {/* Server IP Info Banner */}
        <div className="bg-ink/5 px-6 py-3 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Server size={15} className="text-ink/60" />
            <span className="font-bold text-ink/70">Alamat Server Utama:</span>
            {!isEditingIp ? (
              <code className="bg-white px-2 py-0.5 rounded-md border border-ink/15 font-mono font-bold text-ink text-[13px]">
                {effectiveBaseUrl}
              </code>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  placeholder="Contoh: 192.168.1.15:5173"
                  className="h-7 w-48 rounded-md border border-ink/30 bg-white px-2 text-xs font-mono font-bold text-ink focus:outline-none focus:ring-1 focus:ring-counterlime"
                />
                <Button size="sm" variant="primary" onClick={handleSaveCustomIp} className="h-7 text-[11px] px-2">
                  Simpan
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditingIp ? (
              <button
                type="button"
                onClick={() => setIsEditingIp(true)}
                className="text-[11px] font-bold text-ink/60 hover:text-ink underline"
              >
                Ubah IP Manual
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingIp(false)}
                className="text-[11px] font-semibold text-ink/40 hover:text-ink"
              >
                Batal
              </button>
            )}
            <span className="text-ink/20">|</span>
            <span className="text-ink/60 flex items-center gap-1">
              <Users size={13} /> {connectedPeers.length} Perangkat Terhubung
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-ink/10 px-6 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("pelayan")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all",
              activeTab === "pelayan"
                ? "border-ink text-ink bg-mineral/20"
                : "border-transparent text-ink/50 hover:text-ink"
            )}
          >
            <Smartphone size={15} />
            HP Pelayan Keliling
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dapur")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all",
              activeTab === "dapur"
                ? "border-ink text-ink bg-mineral/20"
                : "border-transparent text-ink/50 hover:text-ink"
            )}
          >
            <ChefHat size={15} />
            Layar Dapur (KDS)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("meja")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all",
              activeTab === "meja"
                ? "border-ink text-ink bg-mineral/20"
                : "border-transparent text-ink/50 hover:text-ink"
            )}
          >
            <QrCode size={15} />
            QR Menu Meja
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("perangkat")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all",
              activeTab === "perangkat"
                ? "border-ink text-ink bg-mineral/20"
                : "border-transparent text-ink/50 hover:text-ink"
            )}
          >
            <Wifi size={15} />
            Perangkat ({connectedPeers.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 bg-mineral/10">
          {/* TAB 1: HP PELAYAN */}
          {activeTab === "pelayan" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-ink/10 shadow-sm text-center">
                {waiterQrUrl ? (
                  <img
                    src={waiterQrUrl}
                    alt="QR Code HP Pelayan"
                    className="w-52 h-52 rounded-xl border border-ink/10 p-2 bg-white shadow-2xs"
                  />
                ) : (
                  <div className="w-52 h-52 rounded-xl bg-mineral animate-pulse" />
                )}
                <p className="text-xs font-bold text-ink mt-3">Scan dengan Kamera HP Pelayan</p>
                <p className="text-[11px] text-ink/50 mt-0.5">Langsung membuka mode pelayan keliling</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-white border border-ink/10 p-4 space-y-2.5">
                  <span className="text-xs font-bold text-ink/60 uppercase tracking-wider block">
                    Link Akses Langsung
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={waiterFullUrl}
                      className="flex-1 bg-mineral/50 border border-ink/15 rounded-lg px-3 py-2 text-xs font-mono text-ink select-all focus:outline-none"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(waiterFullUrl, "Link Pelayan")}
                      className="shrink-0 h-8 gap-1 text-xs"
                    >
                      {copiedUrl === waiterFullUrl ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      Salin
                    </Button>
                    <a
                      href={waiterFullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink/15 bg-white text-ink/70 hover:bg-mineral/50 transition-colors"
                      title="Buka di tab baru"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-4 space-y-2 text-xs text-emerald-950">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Wifi size={14} /> Petunjuk Penggunaan Pelayan:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-emerald-900/85">
                    <li>Pastikan HP Pelayan terhubung ke <strong>WiFi Restoran</strong> yang sama.</li>
                    <li>Buka kamera atau browser, scan QR Code di samping.</li>
                    <li>Isi nama pelayan di HP dan langsung mulai mencatat pesanan di meja pelanggan.</li>
                    <li>Pesanan yang dikirim seketika masuk ke <strong>Dapur (KDS)</strong> dan <strong>Kasir</strong>!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAYAR DAPUR KDS */}
          {activeTab === "dapur" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-ink/10 shadow-sm text-center">
                {kitchenQrUrl ? (
                  <img
                    src={kitchenQrUrl}
                    alt="QR Code Layar Dapur"
                    className="w-52 h-52 rounded-xl border border-ink/10 p-2 bg-white shadow-2xs"
                  />
                ) : (
                  <div className="w-52 h-52 rounded-xl bg-mineral animate-pulse" />
                )}
                <p className="text-xs font-bold text-ink mt-3">Scan untuk Tablet Dapur (KDS)</p>
                <p className="text-[11px] text-ink/50 mt-0.5">Layar antrean masak real-time koki & barista</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-white border border-ink/10 p-4 space-y-2.5">
                  <span className="text-xs font-bold text-ink/60 uppercase tracking-wider block">
                    Link Akses Dapur (KDS)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={kitchenFullUrl}
                      className="flex-1 bg-mineral/50 border border-ink/15 rounded-lg px-3 py-2 text-xs font-mono text-ink select-all focus:outline-none"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(kitchenFullUrl, "Link Dapur")}
                      className="shrink-0 h-8 gap-1 text-xs"
                    >
                      {copiedUrl === kitchenFullUrl ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      Salin
                    </Button>
                    <a
                      href={kitchenFullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink/15 bg-white text-ink/70 hover:bg-mineral/50 transition-colors"
                      title="Buka di tab baru"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-4 space-y-2 text-xs text-amber-950">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <ChefHat size={14} /> Integrasi Dapur Real-Time:
                  </p>
                  <p className="text-amber-900/85">
                    Pasang tablet di area dapur atau bar kopi. Setiap pesanan baru dari pelayan atau kasir akan langsung muncul dengan peringatan suara bel dapur dan timer antrean.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QR MENU MEJA */}
          {activeTab === "meja" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-ink/10 shadow-sm text-center">
                {tableQrUrl ? (
                  <img
                    src={tableQrUrl}
                    alt={`QR Code ${selectedTable?.name || "Meja"}`}
                    className="w-52 h-52 rounded-xl border border-ink/10 p-2 bg-white shadow-2xs"
                  />
                ) : (
                  <div className="w-52 h-52 rounded-xl bg-mineral animate-pulse" />
                )}
                <p className="text-xs font-bold text-ink mt-3">
                  QR Code: {selectedTable?.name || "Meja 01"} {selectedTable?.area ? `(${selectedTable.area})` : ""}
                </p>
                <p className="text-[11px] text-ink/50 mt-0.5">Pelanggan scan untuk pesan sendiri dari meja</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-white border border-ink/10 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-ink/60 uppercase tracking-wider block">
                      Pilih Meja Restoran:
                    </label>
                    <span className="text-[11px] font-semibold text-ink/40">
                      {tables.length} meja aktif
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                    {tables.map((t) => {
                      const isSelected = selectedTable?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTableId(t.id)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-2xs",
                            isSelected
                              ? "bg-ink text-counterlime border-ink ring-2 ring-counterlime/40"
                              : "bg-mineral/40 text-ink/75 border-ink/15 hover:bg-white hover:border-ink/35"
                          )}
                        >
                          <span>{t.name}</span>
                          {t.area && (
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                isSelected
                                  ? "bg-white/15 text-counterlime"
                                  : "bg-ink/10 text-ink/60"
                              )}
                            >
                              {t.area}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    readOnly
                    value={tableFullUrl}
                    className="flex-1 bg-white border border-ink/15 rounded-lg px-3 py-2 text-xs font-mono text-ink select-all focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(tableFullUrl, `Link ${selectedTable?.name || "Meja"}`)}
                    className="shrink-0 h-8 gap-1 text-xs"
                  >
                    Salin Link
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERANGKAT TERHUBUNG */}
          {activeTab === "perangkat" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-ink">Perangkat Aktif di Jaringan Restoran</h3>
                  <p className="text-xs text-ink/50">Daftar perangkat yang terhubung ke Server Kasir Utama saat ini.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setConnectedPeers(localNetworkHub.getPeers());
                    toast.success("Daftar perangkat diperbarui.");
                  }}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <RefreshCw size={13} />
                  Refresh
                </Button>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white divide-y divide-ink/8 shadow-sm overflow-hidden">
                {connectedPeers.map((peer) => {
                  const isLocal = peer.id === localNetworkHub.getPeers()[0]?.id;
                  return (
                    <div key={peer.id} className="p-4 flex items-center justify-between gap-3 hover:bg-mineral/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-mineral flex items-center justify-center border border-ink/10 text-ink/70">
                          {peer.role === "kasir" ? (
                            <Laptop size={18} />
                          ) : peer.role === "dapur" ? (
                            <Tablet size={18} />
                          ) : (
                            <Smartphone size={18} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-ink">{peer.name}</p>
                            {isLocal && (
                              <span className="text-[10px] bg-counterlime/40 text-ink font-bold px-1.5 py-0.2 rounded">
                                Perangkat Ini
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink/50 mt-0.5">
                            Peran: <span className="font-semibold uppercase text-ink/70">{peer.role}</span> · Aktif:{" "}
                            {Math.round((Date.now() - peer.lastSeen) / 1000)} detik lalu
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Online
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-ink/10 bg-white px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-ink/50">
            <Info size={14} className="text-ink/40" />
            <span>Pastikan semua perangkat tersambung ke router WiFi yang sama.</span>
          </div>
          <Button variant="ink" size="sm" onClick={onClose}>
            Selesai
          </Button>
        </div>
      </div>
    </div>
  );
}
