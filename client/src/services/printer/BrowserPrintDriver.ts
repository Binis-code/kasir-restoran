import type { PrinterDriver, ReceiptPayload } from "./types";

export class BrowserPrintDriver implements PrinterDriver {
  readonly id = "browser" as const;
  readonly label = "Cetak browser";

  async printReceipt(_payload: ReceiptPayload): Promise<void> {
    window.print();
  }
}
