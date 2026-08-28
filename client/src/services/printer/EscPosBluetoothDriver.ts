import { t } from "../../locales/en";
import { generateEscPosReceipt } from "./escpos";
import type { PrinterDriver, ReceiptPayload } from "./types";

/**
 * Standard Bluetooth Low Energy / Classic SPP UUIDs used by 58mm/80mm Thermal Printers
 */
const PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Common POS printer service
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC Transparent / Serial
  "0000ff00-0000-1000-8000-00805f9b34fb", // Custom SPP
  "0000ae30-0000-1000-8000-00805f9b34fb", // MPT/RPP thermal printer
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

interface BluetoothPropertyHolder {
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

export class EscPosBluetoothDriver implements PrinterDriver {
  readonly id = "escpos-bluetooth" as const;
  readonly label = "Thermal Bluetooth (ESC/POS)";

  async printReceipt(payload: ReceiptPayload): Promise<void> {
    const nav = navigator as unknown as { bluetooth?: { requestDevice: (options: unknown) => Promise<any> } };
    if (!nav.bluetooth) {
      throw new Error(
        `${t.printerService.bluetoothUnavailable} — Browser ini belum mendukung Web Bluetooth API (gunakan Chrome/Edge di desktop atau Android).`,
      );
    }

    try {
      // 1. Request Bluetooth Device with printer service filters & fallback
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      if (!device.gatt) {
        throw new Error("Perangkat Bluetooth tidak memiliki antarmuka GATT.");
      }

      // 2. Connect to GATT Server
      const server = await device.gatt.connect();

      // 3. Find first accessible writable characteristic
      let targetCharacteristic: BluetoothPropertyHolder | null = null;

      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics: BluetoothPropertyHolder[] = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              targetCharacteristic = char;
              break;
            }
          }
          if (targetCharacteristic) break;
        } catch {
          // Continue scanning next service UUID
        }
      }

      if (!targetCharacteristic) {
        // Fallback: search all available primary services
        const services = await server.getPrimaryServices();
        for (const service of services) {
          const chars: BluetoothPropertyHolder[] = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              targetCharacteristic = char;
              break;
            }
          }
          if (targetCharacteristic) break;
        }
      }

      if (!targetCharacteristic) {
        throw new Error("Karakteristik pengiriman data (Write Characteristic) tidak ditemukan pada printer ini.");
      }

      // 4. Generate ESC/POS Binary Buffer
      const rawData = generateEscPosReceipt(payload, 58);

      // 5. Send in safe 100-byte chunks to avoid BLE buffer overflow
      const chunkSize = 100;
      for (let i = 0; i < rawData.length; i += chunkSize) {
        const chunk = rawData.slice(i, i + chunkSize);
        if (targetCharacteristic.properties.writeWithoutResponse && typeof targetCharacteristic.writeValueWithoutResponse === "function") {
          await targetCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await targetCharacteristic.writeValue(chunk);
        }
        // Small delay between packets
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // 6. Graceful disconnect
      device.gatt.disconnect();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "NotFoundError" || err.message.includes("User cancelled")) {
          throw new Error("Pemilihan printer Bluetooth dibatalkan.");
        }
        throw new Error(`Gagal mencetak struk Bluetooth: ${err.message}`);
      }
      throw new Error("Terjadi kesalahan yang tidak diketahui saat mencetak ke Bluetooth.");
    }
  }
}
