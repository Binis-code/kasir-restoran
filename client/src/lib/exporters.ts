import * as XLSX from "xlsx";
import { db } from "./db";
import type { OrderRow } from "./repo";
import type { MenuItem } from "../data/menu";

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return [headers.map(csvEscape).join(";"), ...rows.map((r) => r.map(csvEscape).join(";"))].join(
    "\r\n",
  );
}

export async function exportBackupJson(): Promise<void> {
  const [products, orders] = await Promise.all([
    db.products.toArray(),
    db.orders.toArray(),
  ]);
  const payload = { app: "KASA Sistem Kasir", exportedAt: new Date().toISOString(), products, orders };
  download(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    `kasa-cadangan-${dateStamp()}.json`,
  );
}

export async function exportProductsCsv(products: MenuItem[]): Promise<void> {
  const csv = toCsv(
    ["id", "barcode", "nama", "deskripsi", "harga", "kategori", "jenis", "menit"],
    products.map((p) => [p.id, p.barcode, p.name, p.description, p.price, p.category, p.kind, p.prepMinutes]),
  );
  download(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), `kasa-produk-${dateStamp()}.csv`);
}

export type DailyRow = { key: string; date: string; orders: number; items: number; sales: number };
export type MonthlyRow = { key: string; month: string; orders: number; items: number; sales: number };

export async function exportReportExcel(
  daily: DailyRow[],
  monthly: MonthlyRow[],
): Promise<void> {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(daily.map(({ key: _k, ...rest }) => rest)),
    "Harian",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(monthly.map(({ key: _k, ...rest }) => rest)),
    "Bulanan",
  );
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `kasa-laporan-${dateStamp()}.xlsx`,
  );
}

export async function importBackupJson(file: File): Promise<number> {
  const text = await file.text();
  const parsed = JSON.parse(text) as { products?: MenuItem[] };
  if (!Array.isArray(parsed.products)) throw new Error("format tidak dikenali");
  const valid = parsed.products.filter(
    (p) => typeof p?.id === "string" && typeof p?.name === "string" && typeof p?.price === "number",
  );
  await db.products.bulkPut(valid);
  return valid.length;
}

export function groupDaily(orders: OrderRow[]): DailyRow[] {
  const map = new Map<string, DailyRow>();
  for (const o of orders) {
    if (o.status !== "sudah-dibayar" || !o.paidAt) continue;
    const date = new Date(o.paidAt).toISOString().slice(0, 10);
    const row = map.get(date) ?? { key: date, date, orders: 0, items: 0, sales: 0 };
    row.orders += 1;
    row.items += o.itemCount;
    row.sales += o.total;
    map.set(date, row);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function groupMonthly(orders: OrderRow[]): MonthlyRow[] {
  const map = new Map<string, MonthlyRow>();
  for (const o of orders) {
    if (o.status !== "sudah-dibayar" || !o.paidAt) continue;
    const month = new Date(o.paidAt).toISOString().slice(0, 7);
    const row = map.get(month) ?? { key: month, month, orders: 0, items: 0, sales: 0 };
    row.orders += 1;
    row.items += o.itemCount;
    row.sales += o.total;
    map.set(month, row);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}
