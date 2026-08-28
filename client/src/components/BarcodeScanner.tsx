import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { findProductByBarcode } from "../lib/repo";
import type { MenuItem } from "../data/menu";
import { t } from "../locales/en";
import { usePos } from "./PosContext";

export function BarcodeScanner({
  open,
  onClose,
  onProduct,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  onProduct: (item: MenuItem) => void;
  onError: (code: string) => void;
}) {
  const { addItem } = usePos();

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let controls: { stop: () => void } | null = null;
    let intervalId: number | null = null;
    let stream: MediaStream | null = null;
    let handled = false;

    const handleCode = async (code: string) => {
      if (handled || stopped) return;
      handled = true;
      const product = await findProductByBarcode(code);
      if (stopped) return;
      if (product) {
        onProduct(product);
        addItem(product.id);
      } else {
        onError(code);
      }
      onClose();
    };

    const startNative = async (video: HTMLVideoElement) => {
      const Detector = window.BarcodeDetector;
      if (!Detector) return false;
      const detector = new Detector({
        formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"],
      });
      intervalId = window.setInterval(() => {
        if (stopped || video.readyState < 2) return;
        void detector
          .detect(video)
          .then((results) => {
            if (results.length > 0) void handleCode(results[0].rawValue);
          })
          .catch(() => undefined);
      }, 250);
      return true;
    };

    const start = async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        const usedNative = await startNative(video);
        if (!usedNative && !stopped) {
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const reader = new BrowserMultiFormatReader();
          controls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
            if (result) void handleCode(result.getText());
          });
        }
      } catch {
        if (!stopped) {
          toast.error(t.scanner.cameraError, {
            description: t.scanner.cameraErrorBody,
          });
          onClose();
        }
      }
    };

    void start();

    return () => {
      stopped = true;
      if (intervalId !== null) window.clearInterval(intervalId);
      controls?.stop();
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [open, addItem, onClose, onProduct, onError]);

  const videoRef = useRef<HTMLVideoElement>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95">
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <p className="font-display text-lg font-bold tracking-tight">
          {t.scanner.title}
        </p>
        <button
          type="button"
          aria-label={t.scanner.close}
          onClick={onClose}
          className="pressable flex h-11 w-11 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X size={22} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-72 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-counterlime shadow-[0_0_0_9999px_rgb(20_33_31/0.45)]"
        />
      </div>

      <p className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 text-center text-sm text-white/75">
        {t.scanner.hint}
      </p>
    </div>
  );
}
