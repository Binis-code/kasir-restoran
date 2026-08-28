import { db, type OrderRow, type OrderStatus, type PayMethod, type ShiftRecord, type TableRow } from "./db";
import type { MenuItem } from "../data/menu";

export type { OrderRow, TableRow, ShiftRecord };

export async function loadProducts(): Promise<MenuItem[]> {
  const rows = await db.products.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveProduct(item: MenuItem): Promise<void> {
  await db.products.put(item);
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id);
}

export async function loadTables(): Promise<TableRow[]> {
  const rows = await db.tables.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export async function saveTable(table: TableRow): Promise<void> {
  await db.tables.put(table);
}

export async function deleteTable(id: string): Promise<void> {
  await db.tables.delete(id);
}

export async function loadOrders(): Promise<OrderRow[]> {
  const rows = await db.orders.toArray();
  return rows.sort((a, b) => b.no - a.no);
}

export async function nextOrderNo(): Promise<number> {
  const last = await db.orders.orderBy(":id").last();
  return (last?.no ?? 1043) + 1;
}

export async function saveOrder(row: OrderRow): Promise<void> {
  await db.orders.put(row);
}

export async function updateOrderStatus(no: number, status: OrderStatus): Promise<void> {
  await db.orders.update(no, { status });
}

export async function loadActiveShift(): Promise<ShiftRecord | undefined> {
  return db.shifts.where("status").equals("OPEN").first();
}

export async function saveShift(shift: ShiftRecord): Promise<void> {
  await db.shifts.put(shift);
}

export async function findProductByBarcode(
  code: string,
): Promise<MenuItem | undefined> {
  return db.products.where("barcode").equals(code).first();
}

export async function upsertProducts(items: MenuItem[]): Promise<number> {
  await db.products.bulkPut(items);
  return items.length;
}

export function toOrderRow(input: {
  no: number;
  status: OrderRow["status"];
  total: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  serviceCharge?: number;
  itemCount: number;
  method?: PayMethod;
  orderType: OrderRow["orderType"];
  tableNumber?: number;
  tableName?: string;
  guests?: number;
  paidAt?: number;
}): OrderRow {
  return { ...input, createdAt: Date.now() };
}
