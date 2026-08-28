import Dexie, { type EntityTable } from "dexie";
import { MENU_SEED, type MenuItem } from "../data/menu";

export type PayMethod = "kartu-qr" | "tunai" | "qris";
export type OrderStatus = "disimpan" | "siap" | "sudah-dibayar";
export type OrderType = "bawa-pulang" | "meja";

export type OrderRow = {
  no: number;
  status: OrderStatus;
  total: number;
  itemCount: number;
  method?: PayMethod;
  orderType: OrderType;
  tableNumber?: number;
  guests?: number;
  paidAt?: number;
  createdAt: number;
};

export const db = new Dexie("kasa-kasir") as Dexie & {
  products: EntityTable<MenuItem, "id">;
  orders: EntityTable<OrderRow, "no">;
};

db.version(1).stores({
  products: "id, barcode, name, category",
  orders: "no, status, paidAt, createdAt",
});

const SEED_ORDERS: OrderRow[] = [
  { no: 1047, status: "siap", total: 284000, itemCount: 2, orderType: "meja", tableNumber: 4, guests: 2, createdAt: Date.now() - 3600_000 },
  { no: 1046, status: "sudah-dibayar", total: 198000, itemCount: 2, method: "kartu-qr", orderType: "bawa-pulang", paidAt: Date.now() - 5400_000, createdAt: Date.now() - 6000_000 },
  { no: 1045, status: "disimpan", total: 442000, itemCount: 5, orderType: "meja", tableNumber: 2, guests: 4, createdAt: Date.now() - 7200_000 },
  { no: 1044, status: "sudah-dibayar", total: 118000, itemCount: 1, method: "tunai", orderType: "bawa-pulang", paidAt: Date.now() - 9000_000, createdAt: Date.now() - 9600_000 },
];

db.on("populate", (tx) => {
  void tx.table("products").bulkPut(MENU_SEED);
  void tx.table("orders").bulkAdd(SEED_ORDERS);
});

export async function ensureSeeded(): Promise<void> {
  await db.open();
  const productCount = await db.products.count();
  const orderCount = await db.orders.count();
  if (productCount === 0) await db.products.bulkPut(MENU_SEED);
  if (orderCount === 0) await db.orders.bulkAdd(SEED_ORDERS);
}
