import {
  db,
  tablesTable,
  cashMovementsTable,
  categoriesTable,
  type OrderRow,
  type OrderStatus,
  type PayMethod,
  type ShiftRecord,
  type TableRow,
  type CashMovementRow,
  type CashMovementType,
  type CashMovementCategory,
  type CategoryRow,
} from "./db";
import type { MenuItem } from "../data/menu";

export type {
  OrderRow,
  TableRow,
  ShiftRecord,
  CashMovementRow,
  CashMovementType,
  CashMovementCategory,
  CategoryRow,
};
export { tablesTable, cashMovementsTable, categoriesTable };

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
  const rows = await tablesTable.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export async function saveTable(table: TableRow): Promise<void> {
  await tablesTable.put(table);
}

export async function deleteTable(id: string): Promise<void> {
  await tablesTable.delete(id);
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

export async function loadShiftHistory(): Promise<ShiftRecord[]> {
  const list = await db.shifts.toArray();
  return list.sort((a, b) => b.openedAt - a.openedAt);
}

export async function loadCashMovements(shiftId?: string): Promise<CashMovementRow[]> {
  if (shiftId) {
    const list = await cashMovementsTable.where("shiftId").equals(shiftId).toArray();
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }
  const list = await cashMovementsTable.toArray();
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveCashMovement(item: CashMovementRow): Promise<void> {
  await cashMovementsTable.put(item);
}

export async function deleteCashMovement(id: string): Promise<void> {
  await cashMovementsTable.delete(id);
}

export async function loadCategories(): Promise<CategoryRow[]> {
  const rows = await categoriesTable.toArray();
  return rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function saveCategory(category: CategoryRow): Promise<void> {
  await categoriesTable.put(category);
}

export async function updateCategory(
  id: string,
  updates: Partial<CategoryRow>,
  oldName?: string
): Promise<void> {
  await categoriesTable.update(id, updates);
  // If category name was renamed, cascade update all products under old category name
  if (updates.name && oldName && updates.name !== oldName) {
    const affectedProducts = await db.products.where("category").equals(oldName).toArray();
    for (const prod of affectedProducts) {
      await db.products.update(prod.id, { category: updates.name as any });
    }
  }
}

export async function deleteCategory(
  id: string,
  categoryName: string,
  reassignToCategoryName?: string
): Promise<void> {
  await categoriesTable.delete(id);
  if (reassignToCategoryName) {
    const affectedProducts = await db.products.where("category").equals(categoryName).toArray();
    for (const prod of affectedProducts) {
      await db.products.update(prod.id, { category: reassignToCategoryName as any });
    }
  }
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
