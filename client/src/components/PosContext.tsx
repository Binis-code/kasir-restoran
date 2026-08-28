import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MenuItem } from "../data/menu";
import {
  db,
  ensureSeeded,
  type OrderRow,
  type OrderStatus,
  type OrderType,
  type PayMethod,
  type TableRow,
} from "../lib/db";
import {
  deleteProduct as repoDeleteProduct,
  deleteTable as repoDeleteTable,
  loadOrders,
  loadProducts,
  loadTables,
  saveOrder,
  saveProduct as repoSaveProduct,
  saveTable as repoSaveTable,
} from "../lib/repo";

export type { OrderType, PayMethod, OrderStatus, TableRow };
export type CartLine = { itemId: string; qty: number };

export type OrderTotals = {
  subtotal: number;
  tax: number;
  total: number;
  count: number;
};

type PayResult = { orderNo: number; total: number; change: number | null };

type PosContextValue = {
  ready: boolean;
  products: MenuItem[];
  tables: TableRow[];
  orderNo: number;
  orderType: OrderType;
  tableNumber: number;
  guests: number;
  lines: CartLine[];
  totals: OrderTotals;
  orders: OrderRow[];
  setOrderType: (t: OrderType) => void;
  setTableNumber: (n: number) => void;
  setGuests: (n: number) => void;
  addItem: (itemId: string) => void;
  increaseLine: (itemId: string) => void;
  decreaseLine: (itemId: string) => void;
  clearOrder: () => void;
  saveDraft: () => number;
  payOrder: (method: PayMethod, cashReceived?: number) => PayResult;
  reloadProducts: () => Promise<void>;
  reloadTables: () => Promise<void>;
  addProduct: (item: MenuItem) => Promise<void>;
  updateProduct: (item: MenuItem) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTable: (table: TableRow) => Promise<void>;
  updateTable: (table: TableRow) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  selectTable: (table: TableRow) => void;
};

const PosContext = createContext<PosContextValue | null>(null);

const BASELINE_PENJUALAN_HARI_INI = 12_229_000;

function computeTotals(lines: CartLine[], products: MenuItem[]): OrderTotals {
  let subtotal = 0;
  let count = 0;
  for (const line of lines) {
    const item = products.find((p) => p.id === line.itemId);
    if (!item) continue;
    subtotal += item.price * line.qty;
    count += line.qty;
  }
  const tax = Math.round(subtotal * 0.11);
  return { subtotal, tax, total: subtotal + tax, count };
}

function isToday(ts?: number): boolean {
  if (!ts) return false;
  return new Date(ts).toDateString() === new Date().toDateString();
}

export function PosProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [orderNo, setOrderNo] = useState(1048);
  const [orderType, setOrderType] = useState<OrderType>("bawa-pulang");
  const [tableNumber, setTableNumber] = useState(1);
  const [guests, setGuests] = useState(2);
  const [lines, setLines] = useState<CartLine[]>([
    { itemId: "kopi-susu", qty: 1 },
    { itemId: "roti-panggang-isi", qty: 1 },
  ]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await ensureSeeded();
        const [loadedProducts, loadedOrders, loadedTables] = await Promise.all([
          loadProducts(),
          loadOrders(),
          loadTables(),
        ]);
        if (!alive) return;
        setProducts(loadedProducts);
        setOrders(loadedOrders);
        setTables(loadedTables);
        const last = loadedOrders[0]?.no ?? 1047;
        setOrderNo(last + 1);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const totals = useMemo(() => computeTotals(lines, products), [lines, products]);

  const addItem = useCallback((itemId: string) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.itemId === itemId);
      if (existing) {
        return prev.map((l) =>
          l.itemId === itemId ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { itemId, qty: 1 }];
    });
  }, []);

  const increaseLine = useCallback((itemId: string) => {
    setLines((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + 1 } : l)),
    );
  }, []);

  const decreaseLine = useCallback((itemId: string) => {
    setLines((prev) =>
      prev
        .map((l) => (l.itemId === itemId ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const clearOrder = useCallback(() => {
    setLines([]);
  }, []);

  const recordOrder = useCallback(
    (status: OrderStatus, recordedTotals: OrderTotals, method?: PayMethod) => {
      const row: OrderRow = {
        no: orderNo,
        status,
        total: recordedTotals.total,
        itemCount: recordedTotals.count,
        method,
        orderType,
        tableNumber: orderType === "meja" ? tableNumber : undefined,
        guests: orderType === "meja" ? guests : undefined,
        paidAt: status === "sudah-dibayar" ? Date.now() : undefined,
        createdAt: Date.now(),
      };
      setOrders((prev) => [row, ...prev]);
      setLines([]);
      setOrderNo((n) => n + 1);
      void saveOrder(row).catch(() => undefined);
    },
    [guests, orderNo, orderType, tableNumber],
  );

  const saveDraft = useCallback(() => {
    const no = orderNo;
    recordOrder("disimpan", totals);
    return no;
  }, [orderNo, recordOrder, totals]);

  const payOrder = useCallback(
    (method: PayMethod, cashReceived?: number): PayResult => {
      const no = orderNo;
      const paidTotal = totals.total;
      const change =
        method === "tunai" && cashReceived !== undefined
          ? Math.max(0, cashReceived - paidTotal)
          : null;
      recordOrder("sudah-dibayar", totals, method);
      return { orderNo: no, total: paidTotal, change };
    },
    [orderNo, recordOrder, totals],
  );

  const reloadProducts = useCallback(async () => {
    setProducts(await loadProducts());
  }, []);

  const reloadTables = useCallback(async () => {
    setTables(await loadTables());
  }, []);

  const addProduct = useCallback(async (item: MenuItem) => {
    await repoSaveProduct(item);
    setProducts(await loadProducts());
  }, []);

  const updateProduct = useCallback(async (item: MenuItem) => {
    await repoSaveProduct(item);
    setProducts(await loadProducts());
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await repoDeleteProduct(id);
    setProducts(await loadProducts());
  }, []);

  const addTable = useCallback(async (table: TableRow) => {
    await repoSaveTable(table);
    setTables(await loadTables());
  }, []);

  const updateTable = useCallback(async (table: TableRow) => {
    await repoSaveTable(table);
    setTables(await loadTables());
  }, []);

  const deleteTable = useCallback(async (id: string) => {
    await repoDeleteTable(id);
    setTables(await loadTables());
  }, []);

  const selectTable = useCallback((table: TableRow) => {
    const numMatch = table.name.match(/\d+/);
    const num = numMatch ? Number.parseInt(numMatch[0], 10) : 1;
    setOrderType("meja");
    setTableNumber(num);
    setGuests(table.seats);
  }, []);

  const value = useMemo<PosContextValue>(
    () => ({
      ready,
      products,
      tables,
      orderNo,
      orderType,
      tableNumber,
      guests,
      lines,
      totals,
      orders,
      setOrderType,
      setTableNumber,
      setGuests,
      addItem,
      increaseLine,
      decreaseLine,
      clearOrder,
      saveDraft,
      payOrder,
      reloadProducts,
      reloadTables,
      addProduct,
      updateProduct,
      deleteProduct,
      addTable,
      updateTable,
      deleteTable,
      selectTable,
    }),
    [
      ready,
      products,
      tables,
      orderNo,
      orderType,
      tableNumber,
      guests,
      lines,
      totals,
      orders,
      setOrderType,
      setTableNumber,
      setGuests,
      addItem,
      increaseLine,
      decreaseLine,
      clearOrder,
      saveDraft,
      payOrder,
      reloadProducts,
      reloadTables,
      addProduct,
      updateProduct,
      deleteProduct,
      addTable,
      updateTable,
      deleteTable,
      selectTable,
    ],
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos(): PosContextValue {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error("usePos harus dipakai di dalam PosProvider");
  return ctx;
}

export function runningOrdersCount(orders: OrderRow[]): number {
  return orders.filter((o) => o.status !== "sudah-dibayar").length + 1;
}

export function salesToday(orders: OrderRow[]): number {
  const paidToday = orders
    .filter((o) => o.status === "sudah-dibayar" && isToday(o.paidAt))
    .reduce((sum, o) => sum + o.total, 0);
  return BASELINE_PENJUALAN_HARI_INI + paidToday;
}

export { db };
