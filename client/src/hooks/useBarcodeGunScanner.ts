import { useEffect, useRef } from "react";
import { findProductByBarcode } from "../lib/repo";
import type { MenuItem } from "../data/menu";
import { playScanSuccessBeep, playScanErrorBeep } from "../lib/audioFeedback";

export interface BarcodeScanResult {
  code: string;
  product: MenuItem | null;
}

interface UseBarcodeGunScannerOptions {
  enabled?: boolean;
  onScan?: (result: BarcodeScanResult) => void;
  onProductFound?: (product: MenuItem) => void;
  onProductNotFound?: (code: string) => void;
  maxKeyIntervalMs?: number;
  minCodeLength?: number;
}

/**
 * Global Hardware USB / Bluetooth Barcode Scanner Gun (HID Keyboard Wedge) Hook.
 * Automatically captures rapid keystrokes from handheld laser/2D scanners.
 */
export function useBarcodeGunScanner({
  enabled = true,
  onScan,
  onProductFound,
  onProductNotFound,
  maxKeyIntervalMs = 60,
  minCodeLength = 3,
}: UseBarcodeGunScannerOptions = {}) {
  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const isGunTypingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore meta keys (Ctrl, Alt, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = performance.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable);

      // Reset buffer if too much time has passed since previous keypress
      if (timeSinceLastKey > 400 && bufferRef.current.length > 0) {
        bufferRef.current = [];
        isGunTypingRef.current = false;
      }

      // Check for Enter key indicating end of scanner transmission
      if (e.key === "Enter" || e.key === "Tab") {
        const fullCode = bufferRef.current.join("").trim();
        const wasGunBurst = isGunTypingRef.current;

        // Clean buffer
        bufferRef.current = [];
        isGunTypingRef.current = false;

        if (fullCode.length >= minCodeLength && (wasGunBurst || !isInputActive)) {
          // If in an input, prevent default form submit if it was a gun burst
          if (wasGunBurst) {
            e.preventDefault();
            e.stopPropagation();
          }

          try {
            const product = await findProductByBarcode(fullCode);
            if (product) {
              playScanSuccessBeep();
              onProductFound?.(product);
            } else {
              playScanErrorBeep();
              onProductNotFound?.(fullCode);
            }
            onScan?.({ code: fullCode, product: product || null });
          } catch (err) {
            console.error("Failed to process barcode scanner input:", err);
          }
          return;
        }

        // If not a scanner burst, let standard enter behavior pass
        return;
      }

      // Collect single visible character keys
      if (e.key.length === 1) {
        // If keystrokes are arriving very fast (< maxKeyIntervalMs), flag as hardware gun burst
        if (timeSinceLastKey <= maxKeyIntervalMs && bufferRef.current.length > 0) {
          isGunTypingRef.current = true;
        }

        bufferRef.current.push(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [enabled, onScan, onProductFound, onProductNotFound, maxKeyIntervalMs, minCodeLength]);
}
