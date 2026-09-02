import Dexie, { type EntityTable } from "dexie";
import { MENU_SEED, type MenuItem } from "../data/menu";

export type PayMethod = "kartu-qr" | "tunai" | "qris";
export type OrderStatus = "disimpan" | "memasak" | "siap" | "sudah-dibayar";
export type OrderType = "bawa-pulang" | "meja";

export type OrderItemLine = {
  itemId: string;
  name: string;
  qty: number;
  price: number;
  note?: string;
};

export type OrderRow = {
  no: number;
  status: OrderStatus;
  total: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  serviceCharge?: number;
  itemCount: number;
  items?: OrderItemLine[];
  method?: PayMethod;
  orderType: OrderType;
  tableNumber?: number;
  tableName?: string;
  guests?: number;
  customerName?: string;
  waiterId?: string;
  waiterName?: string;
  source?: "pos" | "waiter" | "self-order";
  paymentChoice?: "paid-now" | "pay-later";
  paidAt?: number;
  createdAt: number;
};

export type TableRow = {
  id: string;
  name: string;
  seats: number;
  area: string;
  active?: boolean;
};

export type CashMovementType = "CASH_IN" | "CASH_OUT";
export type CashMovementCategory =
  | "modal_awal"
  | "operasional"
  | "bahan_baku"
  | "setoran"
  | "tips"
  | "lainnya";

export type CashMovementRow = {
  id: string;
  shiftId?: string;
  type: CashMovementType;
  category: CashMovementCategory;
  amount: number;
  description: string;
  cashierName: string;
  createdAt: number;
};

export type ShiftRecord = {
  id: string;
  openedAt: number;
  closedAt?: number;
  cashierName: string;
  startingCash: number;
  actualCash?: number;
  expectedCash?: number;
  cashDifference?: number;
  cashSalesTotal?: number;
  cashInTotal?: number;
  cashOutTotal?: number;
  denominations?: Record<string, number>;
  status: "OPEN" | "CLOSED";
  notes?: string;
};

export interface CategoryRow {
  id: string;
  name: string;
  kind: "Makanan" | "Minuman" | "Camilan";
  color?: string;
  sortOrder: number;
  isDefault?: boolean;
  createdAt: number;
}

export const DEFAULT_CATEGORIES: CategoryRow[] = [
  { id: "cat-favorit", name: "Favorit", kind: "Makanan", color: "counterlime", sortOrder: 1, isDefault: true, createdAt: 1700000000000 },
  { id: "cat-sarapan", name: "Sarapan", kind: "Makanan", color: "amber", sortOrder: 2, isDefault: true, createdAt: 1700000001000 },
  { id: "cat-makanan", name: "Makanan", kind: "Makanan", color: "rose", sortOrder: 3, isDefault: true, createdAt: 1700000002000 },
  { id: "cat-minuman", name: "Minuman", kind: "Minuman", color: "blue", sortOrder: 4, isDefault: true, createdAt: 1700000003000 },
  { id: "cat-camilan", name: "Camilan", kind: "Camilan", color: "emerald", sortOrder: 5, isDefault: true, createdAt: 1700000004000 },
];

export const DEFAULT_TABLES: TableRow[] = [
  { id: "meja-01", name: "Meja 01", seats: 2, area: "Utama" },
  { id: "meja-02", name: "Meja 02", seats: 4, area: "Utama" },
  { id: "meja-03", name: "Meja 03", seats: 4, area: "Utama" },
  { id: "meja-04", name: "Meja 04", seats: 4, area: "Utama" },
  { id: "teras-01", name: "Teras 01", seats: 6, area: "Teras" },
  { id: "teras-02", name: "Teras 02", seats: 4, area: "Teras" },
];

export const db = new Dexie("kasa-kasir") as Dexie & {
  products: EntityTable<MenuItem, "id">;
  orders: EntityTable<OrderRow, "no">;
  tables: EntityTable<TableRow, "id">;
  shifts: EntityTable<ShiftRecord, "id">;
  cash_movements: EntityTable<CashMovementRow, "id">;
  categories: EntityTable<CategoryRow, "id">;
};

db.version(1).stores({
  products: "id, barcode, name, category",
  orders: "no, status, paidAt, createdAt",
});

db.version(2).stores({
  products: "id, barcode, name, category",
  orders: "no, status, paidAt, createdAt",
  tables: "id, name, area",
});

db.version(3).stores({
  products: "id, barcode, name, category",
  orders: "no, status, paidAt, createdAt",
  tables: "id, name, area",
  shifts: "id, openedAt, status",
});

db.version(4).stores({
  products: "id, barcode, name, category",
  orders: "no, status, paidAt, createdAt",
  tables: "id, name, area",
  shifts: "id, openedAt, status",
  cash_movements: "id, shiftId, type, category, createdAt",
});

db.version(5).stores({
  products: "id, barcode, name, category",
  orders: "no, status, paidAt, createdAt",
  tables: "id, name, area",
  shifts: "id, openedAt, status",
  cash_movements: "id, shiftId, type, category, createdAt",
  categories: "id, name, kind, sortOrder, createdAt",
});

const SEED_ORDERS: OrderRow[] = [
  {
    no: 1048,
    status: "memasak",
    total: 85000,
    subtotal: 76500,
    tax: 8500,
    discount: 0,
    itemCount: 3,
    orderType: "meja",
    tableNumber: 1,
    tableName: "Meja 01",
    customerName: "Budi Santoso",
    source: "self-order",
    paymentChoice: "pay-later",
    guests: 2,
    items: [
      { itemId: "kopi-susu", name: "Kopi Susu", qty: 2, price: 25000, note: "Less ice, gula aren terpisah" },
      { itemId: "roti-panggang-isi", name: "Roti Panggang Isi", qty: 1, price: 26500, note: "Ekstra keju" },
    ],
    createdAt: Date.now() - 600_000,
  },
  {
    no: 1047,
    status: "siap",
    total: 284000,
    subtotal: 255855,
    tax: 28145,
    discount: 0,
    itemCount: 2,
    orderType: "meja",
    tableNumber: 4,
    tableName: "Meja 04",
    customerName: "Rina & Teman",
    source: "waiter",
    paymentChoice: "pay-later",
    guests: 2,
    items: [
      { itemId: "nasi-goreng-spesial", name: "Nasi Goreng Spesial", qty: 2, price: 35000, note: "Pedas sedang" },
    ],
    createdAt: Date.now() - 3600_000,
  },
  {
    no: 1046,
    status: "sudah-dibayar",
    total: 198000,
    itemCount: 2,
    method: "kartu-qr",
    orderType: "bawa-pulang",
    customerName: "Andi",
    source: "pos",
    paidAt: Date.now() - 5400_000,
    createdAt: Date.now() - 6000_000,
  },
  {
    no: 1045,
    status: "disimpan",
    total: 442000,
    itemCount: 5,
    orderType: "meja",
    tableNumber: 2,
    tableName: "Meja 02",
    customerName: "Pak Wijaya",
    source: "self-order",
    paymentChoice: "pay-later",
    guests: 4,
    createdAt: Date.now() - 7200_000,
  },
  {
    no: 1044,
    status: "sudah-dibayar",
    total: 118000,
    itemCount: 1,
    method: "tunai",
    orderType: "bawa-pulang",
    customerName: "Lia",
    source: "pos",
    paidAt: Date.now() - 9000_000,
    createdAt: Date.now() - 9600_000,
  },
];

export const tablesTable = db.table<TableRow, string>("tables");
export const cashMovementsTable = db.table<CashMovementRow, string>("cash_movements");
export const categoriesTable = db.table<CategoryRow, string>("categories");

const SEED_MOVEMENTS: CashMovementRow[] = [
  {
    id: "mov-01",
    type: "CASH_IN",
    category: "modal_awal",
    amount: 200000,
    description: "Modal awal kasir buka shift",
    cashierName: "Jamie Morgan",
    createdAt: Date.now() - 14400_000,
  },
  {
    id: "mov-02",
    type: "CASH_OUT",
    category: "bahan_baku",
    amount: 25000,
    description: "Beli Es Batu Kristal 2 Pack",
    cashierName: "Jamie Morgan",
    createdAt: Date.now() - 7200_000,
  },
];

db.on("populate", (tx) => {
  void tx.table("products").bulkPut(MENU_SEED);
  void tx.table("orders").bulkAdd(SEED_ORDERS);
  void tx.table("tables").bulkPut(DEFAULT_TABLES);
  void tx.table("cash_movements").bulkPut(SEED_MOVEMENTS);
  void tx.table("categories").bulkPut(DEFAULT_CATEGORIES);
});

export async function ensureSeeded(): Promise<void> {
  await db.open();
  const productCount = await db.products.count();
  const orderCount = await db.orders.count();
  const tableCount = await tablesTable.count();
  const movementCount = await cashMovementsTable.count();
  const categoryCount = await categoriesTable.count();
  if (productCount === 0) await db.products.bulkPut(MENU_SEED);
  if (orderCount === 0) await db.orders.bulkAdd(SEED_ORDERS);
  if (tableCount === 0) await tablesTable.bulkPut(DEFAULT_TABLES);
  if (movementCount === 0) await cashMovementsTable.bulkPut(SEED_MOVEMENTS);
  if (categoryCount === 0) await categoriesTable.bulkPut(DEFAULT_CATEGORIES);
}
