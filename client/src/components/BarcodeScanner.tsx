import { useEffect, useRef, useState, useMemo } from "react";
import {
  X,
  Camera,
  Upload,
  Keyboard,
  Sparkles,
  Zap,
  ZapOff,
  RefreshCw,
  Search,
  AlertCircle,
  QrCode,
  Barcode as BarcodeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { findProductByBarcode } from "../lib/repo";
import type { MenuItem } from "../data/menu";
import { t } from "../locales/en";
import { usePos } from "./PosContext";
import { playScanSuccessBeep, playScanErrorBeep } from "../lib/audioFeedback";
import { cn } from "../lib/cn";

export interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onProduct?: (item: MenuItem) => void;
  onScanCode?: (code: string) => void;
  onError?: (code: string) => void;
  title?: string;
  subtitle?: string;
}

export function BarcodeScanner({
  open,
  onClose,
  onProduct,
  onScanCode,
  onError,
  title,
  subtitle,
}: BarcodeScannerProps) {
  const pos = usePos();
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual" | "demo">("camera");

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manual input state
  const [manualCode, setManualCode] = useState("");
  const [manualFoundProduct, setManualFoundProduct] = useState<MenuItem | null>(null);

  // Upload state
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detected state
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const trackRef = useRef<MediaStreamTrack | null>(null);
  const isHandlingRef = useRef<boolean>(false);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setActiveTab("camera");
      setManualCode("");
      setManualFoundProduct(null);
      setUploadPreview(null);
      setUploadStatus(null);
      setLastScannedCode(null);
      setCameraError(null);
      isHandlingRef.current = false;
    }
  }, [open]);

  // Live lookup for manual input
  useEffect(() => {
    const q = manualCode.trim();
    if (!q) {
      setManualFoundProduct(null);
      return;
    }
    const found = pos.products.find(
      (p) => p.barcode === q || p.name.toLowerCase().includes(q.toLowerCase())
    );
    setManualFoundProduct(found || null);
  }, [manualCode, pos.products]);

  // Process a scanned / decoded raw code
  const processRawCode = async (rawText: string) => {
    const code = rawText.trim();
    if (!code || isHandlingRef.current) return;
    isHandlingRef.current = true;

    setLastScannedCode(code);

    // 1. Check if it's a Table QR code (e.g. /order/meja-01 or meja-01 or http://.../order/meja-01)
    const tableMatch = code.match(/order\/([a-zA-Z0-9_-]+)/) || code.match(/^meja[ -]?(\d+)$/i);
    if (tableMatch) {
      playScanSuccessBeep();
      toast.success("QR Meja Terdeteksi", {
        description: `Kode Meja: ${tableMatch[1]}`,
      });
      onScanCode?.(code);
      setTimeout(() => {
        onClose();
      }, 700);
      return;
    }

    // 2. Check if it's a product barcode in database
    try {
      const product = await findProductByBarcode(code);
      if (product) {
        playScanSuccessBeep();
        toast.success(t.scanner.added(product.name), {
          description: `Barcode: ${product.barcode} • ${product.category}`,
        });
        onProduct?.(product);
        onScanCode?.(code);
        setTimeout(() => {
          onClose();
        }, 700);
        return;
      }
    } catch (err) {
      console.error("Error finding product by barcode:", err);
    }

    // 3. Unrecognized barcode / raw text
    playScanErrorBeep();
    onError?.(code);
    onScanCode?.(code);
    toast.warning(t.scanner.notFound(code), {
      description: t.scanner.notFoundBody,
    });
    setTimeout(() => {
      isHandlingRef.current = false;
    }, 1500);
  };

  // Setup live camera scanning with ZXing
  useEffect(() => {
    if (!open || activeTab !== "camera") return;

    let stopped = false;
    let scannerControls: { stop: () => void } | null = null;
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      setCameraError(null);

      try {
        const { BrowserMultiFormatReader, BarcodeFormat } = await import("@zxing/browser");

        // Enumerate devices to populate camera switcher
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          setCameraDevices(videoInputs);
        } catch {
          // ignore enumeration error
        }

        // Configure hints for fast and aggressive multi-format decoding (3 = DecodeHintType.TRY_HARDER)
        const hints = new Map<number, any>();
        hints.set(3, true);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 150,
          delayBetweenScanSuccess: 1000,
        });

        reader.possibleFormats = [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.DATA_MATRIX,
        ];

        const video = videoRef.current;
        if (!video) return;

        // Constraints
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId } }
            : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        video.srcObject = stream;
        await video.play();

        const videoTrack = stream.getVideoTracks()[0];
        trackRef.current = videoTrack || null;

        // Check torch capability
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities?.() as { torch?: boolean }) || {};
          setHasTorch(Boolean(capabilities.torch));
        }

        // Start scanning with ZXing from the active video element
        scannerControls = await reader.decodeFromVideoElement(video, (result) => {
          if (stopped) return;
          if (result) {
            void processRawCode(result.getText());
          }
        });
      } catch (err: unknown) {
        if (stopped) return;
        console.error("Camera init error:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        setCameraError(errMsg || t.scanner.cameraError);
      }
    };

    void initCamera();

    return () => {
      stopped = true;
      scannerControls?.stop();
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (trackRef.current) {
        trackRef.current.stop();
        trackRef.current = null;
      }
    };
  }, [open, activeTab, selectedDeviceId]);

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    if (!trackRef.current) return;
    try {
      const nextState = !isTorchOn;
      // @ts-expect-error applyConstraints torch support
      await trackRef.current.applyConstraints({ advanced: [{ torch: nextState }] });
      setIsTorchOn(nextState);
    } catch (err) {
      console.error("Torch error:", err);
    }
  };

  // Handle Image File Upload & Decode
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadStatus("Memindai gambar...");
    const url = URL.createObjectURL(file);
    setUploadPreview(url);

    try {
      const { BrowserMultiFormatReader, BarcodeFormat } = await import("@zxing/browser");

      const hints = new Map<number, any>();
      hints.set(3, true);

      const reader = new BrowserMultiFormatReader(hints);
      reader.possibleFormats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
      ];

      const img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const result = await reader.decodeFromImageElement(img);
      if (result) {
        setUploadStatus(`Berhasil membaca: ${result.getText()}`);
        void processRawCode(result.getText());
      } else {
        setUploadStatus("Tidak ada barcode/QR yang terdeteksi pada gambar ini.");
        playScanErrorBeep();
      }
    } catch (err) {
      console.error("Failed to decode image:", err);
      setUploadStatus("Gagal membaca barcode/QR dari gambar. Coba gambar lain yang lebih jelas.");
      playScanErrorBeep();
    }
  };

  // Sample Demo Barcodes for Quick Testing
  const demoItems = useMemo(() => {
    return pos.products.slice(0, 6);
  }, [pos.products]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-xl max-h-[92vh] bg-stone-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 bg-stone-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-counterlime/20 text-counterlime">
              <BarcodeIcon size={20} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold tracking-tight text-white">
                {title || t.scanner.title}
              </h3>
              <p className="text-xs text-white/50">
                {subtitle || "Pindai Barcode Produk (EAN/Code128) atau QR Code Meja"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t.scanner.close}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 hover:bg-white/15 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-stone-950/60 p-1.5 gap-1 shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all",
              activeTab === "camera"
                ? "bg-counterlime text-ink font-bold shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Camera size={14} />
            Kamera Langsung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all",
              activeTab === "upload"
                ? "bg-counterlime text-ink font-bold shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Upload size={14} />
            Unggah Foto
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all",
              activeTab === "manual"
                ? "bg-counterlime text-ink font-bold shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Keyboard size={14} />
            Ketik Manual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("demo")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all",
              activeTab === "demo"
                ? "bg-counterlime text-ink font-bold shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Sparkles size={14} />
            Demo Cepat
          </button>
        </div>

        {/* Tab Contents */}
        <div className="relative flex-1 overflow-y-auto min-h-[300px] flex flex-col justify-center bg-black/40">
          {/* 1. CAMERA TAB */}
          {activeTab === "camera" && (
            <div className="relative flex-1 flex flex-col items-center justify-center min-h-[340px] overflow-hidden">
              {cameraError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-3">
                    <AlertCircle size={26} />
                  </div>
                  <p className="font-semibold text-white text-sm">{t.scanner.cameraError}</p>
                  <p className="text-xs text-white/50 mt-1 mb-4 leading-relaxed">
                    {cameraError.includes("NotAllowedError") || cameraError.includes("Permission")
                      ? "Akses kamera ditolak. Berikan izin di browser atau gunakan tab 'Ketik Manual' / 'Unggah Foto'."
                      : t.scanner.cameraErrorBody}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("manual")}
                      className="px-3 py-1.5 rounded-lg bg-counterlime text-ink font-bold text-xs"
                    >
                      Ketik Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("demo")}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-semibold text-xs hover:bg-white/20"
                    >
                      Coba Barcode Demo
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="h-full w-full object-cover min-h-[340px]"
                  />

                  {/* Viewfinder Target Box with animated Laser Line */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-52 w-72 sm:w-80 rounded-2xl border-2 border-counterlime/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.55)] overflow-hidden">
                      {/* Laser scanning line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-counterlime shadow-[0_0_8px_#b8e621] animate-[scan_2s_ease-in-out_infinite]" />

                      {/* Corner Target Markers */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-counterlime" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-counterlime" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-counterlime" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-counterlime" />
                    </div>
                  </div>

                  {/* Camera Controls Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={handleToggleTorch}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-colors",
                          isTorchOn
                            ? "bg-amber-400 text-ink shadow-lg shadow-amber-400/30"
                            : "bg-black/60 text-white hover:bg-black/80"
                        )}
                        title={isTorchOn ? "Matikan Senter" : "Nyalakan Senter"}
                      >
                        {isTorchOn ? <Zap size={16} /> : <ZapOff size={16} />}
                      </button>
                    )}

                    {cameraDevices.length > 1 && (
                      <select
                        aria-label="Pilih Kamera"
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        className="h-8 rounded-lg bg-black/60 backdrop-blur-md px-2.5 text-[11px] font-semibold text-white border border-white/20 focus:outline-none"
                      >
                        <option value="">Kamera Otomatis</option>
                        {cameraDevices.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || `Kamera ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="absolute bottom-3 inset-x-0 flex justify-center">
                    <span className="bg-black/70 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-medium text-white/90 shadow-md">
                      {t.scanner.hint}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 2. UPLOAD IMAGE TAB */}
          {activeTab === "upload" && (
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUpload(file);
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-md border-2 border-dashed border-white/20 hover:border-counterlime/80 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/5 hover:bg-white/10 group"
              >
                {uploadPreview ? (
                  <div className="space-y-3">
                    <img
                      src={uploadPreview}
                      alt="Preview Barcode"
                      className="max-h-48 rounded-xl object-contain mx-auto border border-white/10 shadow-md"
                    />
                    <p className="text-xs text-counterlime font-semibold">
                      Klik untuk ganti gambar lain
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/60 group-hover:text-counterlime group-hover:scale-110 transition-all mb-3">
                      <Upload size={28} />
                    </div>
                    <p className="font-semibold text-sm text-white">
                      Pilih atau Tarik Foto Barcode / QR ke Sini
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      Mendukung format PNG, JPG, WEBP, atau tangkapan layar
                    </p>
                  </>
                )}
              </div>

              {uploadStatus && (
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <RefreshCw size={14} className="animate-spin text-counterlime" />
                  <span>{uploadStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* 3. MANUAL INPUT TAB */}
          {activeTab === "manual" && (
            <div className="p-6 max-w-md mx-auto w-full space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Masukkan Barcode (EAN-13 / SKU) atau Nama Produk
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    type="text"
                    autoFocus
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && manualCode.trim()) {
                        e.preventDefault();
                        void processRawCode(manualCode);
                      }
                    }}
                    placeholder="Contoh: 8991002100015 atau Nasi Goreng"
                    className="w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-counterlime focus:outline-none focus:ring-2 focus:ring-counterlime/40"
                  />
                </div>
              </div>

              {/* Instant Search Result Preview */}
              {manualFoundProduct ? (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-counterlime/10 border border-counterlime/30 text-white">
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-sm text-counterlime truncate">
                      {manualFoundProduct.name}
                    </p>
                    <p className="text-xs text-white/60">
                      Rp {manualFoundProduct.price.toLocaleString("id-ID")} • {manualFoundProduct.barcode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void processRawCode(manualFoundProduct.barcode)}
                    className="px-3.5 py-1.5 rounded-lg bg-counterlime font-bold text-xs text-ink shrink-0 hover:bg-counterlime/90 transition-transform active:scale-95"
                  >
                    Tambahkan
                  </button>
                </div>
              ) : manualCode.trim() ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60">
                  <span>Belum ada produk yang cocok dengan &quot;{manualCode}&quot;</span>
                  <button
                    type="button"
                    onClick={() => void processRawCode(manualCode)}
                    className="px-3 py-1 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20"
                  >
                    Cari Kode
                  </button>
                </div>
              ) : null}

              {/* Common Numeric Quick Pads for Touchscreens */}
              <div className="grid grid-cols-3 gap-1.5 pt-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === "C") setManualCode("");
                      else if (key === "OK") {
                        if (manualCode.trim()) void processRawCode(manualCode);
                      } else {
                        setManualCode((prev) => prev + key);
                      }
                    }}
                    className={cn(
                      "h-11 rounded-xl font-bold text-sm transition-all active:scale-95",
                      key === "OK"
                        ? "bg-counterlime text-ink"
                        : key === "C"
                        ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        : "bg-white/5 text-white hover:bg-white/10"
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. DEMO FAST TEST TAB */}
          {activeTab === "demo" && (
            <div className="p-5 max-w-lg mx-auto w-full space-y-3">
              <p className="text-xs text-white/60 leading-relaxed">
                Klik salah satu barcode produk sampel di bawah untuk mensimulasikan pemindaian scanner fisik:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void processRawCode(item.barcode)}
                    className="flex flex-col items-start p-3 rounded-xl bg-white/5 hover:bg-counterlime/15 border border-white/10 hover:border-counterlime/40 text-left transition-all group"
                  >
                    <span className="font-bold text-xs text-white group-hover:text-counterlime truncate w-full">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-mono text-white/50 group-hover:text-white/80 mt-0.5">
                      {item.barcode}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/60 mb-2">Simulasi QR Meja Pelanggan:</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void processRawCode("/order/meja-01")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-counterlime/20 border border-white/10 hover:border-counterlime text-xs font-semibold text-white"
                  >
                    <QrCode size={13} /> Meja 01
                  </button>
                  <button
                    type="button"
                    onClick={() => void processRawCode("/order/meja-03")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-counterlime/20 border border-white/10 hover:border-counterlime text-xs font-semibold text-white"
                  >
                    <QrCode size={13} /> Meja 03
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="px-5 py-3 border-t border-white/10 bg-stone-950/80 flex items-center justify-between text-xs text-white/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-counterlime animate-pulse" />
            <span>Mendukung Scanner Gun USB/Bluetooth & Kamera</span>
          </div>
          {lastScannedCode && (
            <span className="font-mono text-[11px] text-counterlime truncate max-w-[200px]">
              Terakhir: {lastScannedCode}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
