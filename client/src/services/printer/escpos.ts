import type { ReceiptPayload } from "./types";

/**
 * Standard ESC/POS Command Byte Sequences
 */
export const ESC_POS_COMMANDS = {
  INIT: [0x1b, 0x40], // ESC @
  ALIGN_LEFT: [0x1b, 0x61, 0x00], // ESC a 0
  ALIGN_CENTER: [0x1b, 0x61, 0x01], // ESC a 1
  ALIGN_RIGHT: [0x1b, 0x61, 0x02], // ESC a 2
  BOLD_ON: [0x1b, 0x45, 0x01], // ESC E 1
  BOLD_OFF: [0x1b, 0x45, 0x00], // ESC E 0
  DOUBLE_SIZE: [0x1d, 0x21, 0x11], // GS ! 17
  NORMAL_SIZE: [0x1d, 0x21, 0x00], // GS ! 0
  FEED_LINES: (n: number) => [0x1b, 0x64, n], // ESC d n
  PARTIAL_CUT: [0x1d, 0x56, 0x01], // GS V 1
  FULL_CUT: [0x1d, 0x56, 0x00], // GS V 0
  DRAWER_KICK: [0x1b, 0x70, 0x00, 0x19, 0xfa], // ESC p 0 25 250
};

/**
 * Format two columns (left name/item, right price/total) with clean spacing
 */
export function formatTwoColumns(left: string, right: string, maxChars: number = 32): string {
  const spaceNeeded = maxChars - left.length - right.length;
  if (spaceNeeded <= 0) {
    const truncatedLeft = left.slice(0, Math.max(1, maxChars - right.length - 1));
    return `${truncatedLeft} ${right}\n`;
  }
  return `${left}${" ".repeat(spaceNeeded)}${right}\n`;
}

/**
 * Generate ESC/POS Binary Buffer from ReceiptPayload
 */
export function generateEscPosReceipt(payload: ReceiptPayload, paperWidth: 58 | 80 = 58): Uint8Array {
  const maxChars = paperWidth === 58 ? 32 : 48;
  const bytes: number[] = [];

  const append = (arr: number[]) => bytes.push(...arr);
  const appendText = (text: string) => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);
    bytes.push(...Array.from(encoded));
  };

  // 1. Initialize Printer
  append(ESC_POS_COMMANDS.INIT);

  // 2. Header (Store Title)
  append(ESC_POS_COMMANDS.ALIGN_CENTER);
  append(ESC_POS_COMMANDS.BOLD_ON);
  append(ESC_POS_COMMANDS.DOUBLE_SIZE);
  appendText("KASA KASIR\n");
  append(ESC_POS_COMMANDS.NORMAL_SIZE);
  appendText("Sistem Kasir Kuliner\n");
  appendText(`${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}\n`);
  append(ESC_POS_COMMANDS.BOLD_OFF);

  // 3. Divider
  appendText("-".repeat(maxChars) + "\n");

  // 4. Order Info
  append(ESC_POS_COMMANDS.ALIGN_LEFT);
  if (payload.orderNo > 0) {
    appendText(`No. Pesanan: #${payload.orderNo}\n`);
  } else {
    appendText("UJI COBA CETAK STRUK\n");
  }
  appendText("-".repeat(maxChars) + "\n");

  // 5. Item Lines
  if (payload.lines.length === 0) {
    appendText("Koneksi Printer Bluetooth OK\n");
  } else {
    for (const item of payload.lines) {
      const itemTitle = `${item.qty}x ${item.name}`;
      appendText(formatTwoColumns(itemTitle, item.amount, maxChars));
    }
  }

  // 6. Divider & Total
  appendText("-".repeat(maxChars) + "\n");
  if (payload.total) {
    append(ESC_POS_COMMANDS.BOLD_ON);
    appendText(formatTwoColumns("TOTAL", payload.total, maxChars));
    append(ESC_POS_COMMANDS.BOLD_OFF);
  }

  // 7. Footer
  append(ESC_POS_COMMANDS.ALIGN_CENTER);
  appendText("\nTerima Kasih Atas Kunjungan Anda!\n");
  appendText("Simpan struk sebagai bukti pembayaran\n");

  // 8. Feed & Cut
  append(ESC_POS_COMMANDS.FEED_LINES(4));
  append(ESC_POS_COMMANDS.PARTIAL_CUT);

  return new Uint8Array(bytes);
}
