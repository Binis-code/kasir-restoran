import { db, type OrderRow, type PayMethod } from "./db";
import type { MenuItem } from "../data/menu";

export type { OrderRow };

export async function loadProducts(): Promise<MenuItem[]> {
  const rows = await db.products.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name));
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
  itemCount: number;
  method?: PayMethod;
  orderType: OrderRow["orderType"];
  tableNumber?: number;
  guests?: number;
  paidAt?: number;
}): OrderRow {
  return { ...input, createdAt: Date.now() };
}
