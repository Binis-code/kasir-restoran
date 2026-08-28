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
  type OrderItemLine,
  type OrderRow,
  type OrderStatus,
  type OrderType,
  type PayMethod,
  type ShiftRecord,
  type TableRow,
} from "../lib/db";
import {
  deleteProduct as repoDeleteProduct,
  deleteTable as repoDeleteTable,
  loadActiveShift,
  loadOrders,
  loadProducts,
  loadTables,
  saveOrder,
  saveProduct as repoSaveProduct,
  saveShift as repoSaveShift,
  saveTable as repoSaveTable,
  updateOrderStatus as repoUpdateOrderStatus,
} from "../lib/repo";

export type { OrderType, PayMethod, OrderStatus, TableRow, ShiftRecord, OrderRow };
export type CartLine = { itemId: string; qty: number; note?: string };

export type OrderTotals = {
  rawSubtotal: number;
  discountAmount: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
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
  discountType: "percent" | "fixed";
  discountValue: number;
  taxRate: number;
  serviceChargeRate: number;
  taxEnabled: boolean;
  serviceChargeEnabled: boolean;
  activeShift: ShiftRecord | null;
  setOrderType: (t: OrderType) => void;
  setTableNumber: (n: number) => void;
  setGuests: (n: number) => void;
  setDiscount: (type: "percent" | "fixed", value: number) => void;
  setTaxConfig: (enabled: boolean, rate: number) => void;
  setServiceChargeConfig: (enabled: boolean, rate: number) => void;
  addItem: (itemId: string) => void;
  setItemNote: (itemId: string, note: string) => void;
  increaseLine: (itemId: string) => void;
  decreaseLine: (itemId: string) => void;
  clearOrder: () => void;
  saveDraft: () => number;
  payOrder: (method: PayMethod, cashReceived?: number) => PayResult;
  reloadProducts: () => Promise<void>;
  reloadTables: () => Promise<void>;
  reloadOrders: () => Promise<void>;
  addProduct: (item: MenuItem) => Promise<void>;
  updateProduct: (item: MenuItem) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTable: (table: TableRow) => Promise<void>;
  updateTable: (table: TableRow) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  selectTable: (table: TableRow) => void;
  updateOrderStatus: (no: number, status: OrderStatus) => Promise<void>;
  openShift: (cashierName: string, startingCash: number) => Promise<void>;
  closeShift: (actualCash: number, notes?: string) => Promise<ShiftRecord>;
};

const PosContext = createContext<PosContextValue | null>(null);

const BASELINE_PENJUALAN_HARI_INI = 12_229_000;

function computeTotals(
  lines: CartLine[],
  products: MenuItem[],
  discountType: "percent" | "fixed",
  discountValue: number,
  taxEnabled: boolean,
  taxRate: number,
  serviceChargeEnabled: boolean,
  serviceChargeRate: number,
): OrderTotals {
  let rawSubtotal = 0;
  let count = 0;
  for (const line of lines) {
    const item = products.find((p) => p.id === line.itemId);
    if (!item) continue;
    rawSubtotal += item.price * line.qty;
    count += line.qty;
  }

  let discountAmount = 0;
  if (discountValue > 0) {
    if (discountType === "percent") {
      discountAmount = Math.round(rawSubtotal * (Math.min(100, discountValue) / 100));
    } else {
      discountAmount = Math.min(rawSubtotal, discountValue);
    }
  }

  const subtotal = Math.max(0, rawSubtotal - discountAmount);
  const serviceCharge = serviceChargeEnabled
    ? Math.round(subtotal * (serviceChargeRate / 100))
    : 0;
  const taxableBase = subtotal + serviceCharge;
  const tax = taxEnabled ? Math.round(taxableBase * (taxRate / 100)) : 0;
  const total = subtotal + serviceCharge + tax;

  return { rawSubtotal, discountAmount, subtotal, tax, serviceCharge, total, count };
}

function isToday(ts?: number): boolean {
  if (!ts) return false;
  return new Date(ts).toDateString() === new Date().toDateString();
}

export function PosProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);

  const [orderNo, setOrderNo] = useState(1049);
  const [orderType, setOrderType] = useState<OrderType>("bawa-pulang");
  const [tableNumber, setTableNumber] = useState(1);
  const [guests, setGuests] = useState(2);

  // Multi-tab carts per table
  const [tableDrafts, setTableDrafts] = useState<Record<string, CartLine[]>>({
    takeaway: [
      { itemId: "kopi-susu", qty: 1, note: "Gula aren sedikit" },
      { itemId: "roti-panggang-isi", qty: 1 },
    ],
  });

  // Discounts & Tax Configs
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxEnabled, setTaxEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("kasa_tax_enabled");
      return saved === null ? true : saved === "1";
    } catch {
      return true;
    }
  });
  const [taxRate, setTaxRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("kasa_tax_rate");
      return saved ? Number.parseInt(saved, 10) : 11;
    } catch {
      return 11;
    }
  });
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("kasa_service_charge_enabled") === "1";
    } catch {
      return false;
    }
  });
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("kasa_service_charge_rate");
      return saved ? Number.parseInt(saved, 10) : 5;
    } catch {
      return 5;
    }
  });

  const activeCartKey = orderType === "bawa-pulang" ? "takeaway" : `table-${tableNumber}`;
  const lines = tableDrafts[activeCartKey] || [];

  const setLinesForActiveCart = useCallback(
    (updater: (prev: CartLine[]) => CartLine[]) => {
      setTableDrafts((prev) => {
        const current = prev[activeCartKey] || [];
        return {
          ...prev,
          [activeCartKey]: updater(current),
        };
      });
    },
    [activeCartKey],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await ensureSeeded();
        const [loadedProducts, loadedOrders, loadedTables, shift] = await Promise.all([
          loadProducts(),
          loadOrders(),
          loadTables(),
          loadActiveShift(),
        ]);
        if (!alive) return;
        setProducts(loadedProducts);
        setOrders(loadedOrders);
        setTables(loadedTables);
        setActiveShift(shift || null);
        const last = loadedOrders[0]?.no ?? 1048;
        setOrderNo(last + 1);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const totals = useMemo(
    () =>
      computeTotals(
        lines,
        products,
        discountType,
        discountValue,
        taxEnabled,
        taxRate,
        serviceChargeEnabled,
        serviceChargeRate,
      ),
    [
      lines,
      products,
      discountType,
      discountValue,
      taxEnabled,
      taxRate,
      serviceChargeEnabled,
      serviceChargeRate,
    ],
  );

  const addItem = useCallback(
    (itemId: string) => {
      setLinesForActiveCart((prev) => {
        const existing = prev.find((l) => l.itemId === itemId);
        if (existing) {
          return prev.map((l) =>
            l.itemId === itemId ? { ...l, qty: l.qty + 1 } : l,
          );
        }
        return [...prev, { itemId, qty: 1 }];
      });
    },
    [setLinesForActiveCart],
  );

  const setItemNote = useCallback(
    (itemId: string, note: string) => {
      setLinesForActiveCart((prev) =>
        prev.map((l) => (l.itemId === itemId ? { ...l, note: note.trim() } : l)),
      );
    },
    [setLinesForActiveCart],
  );

  const increaseLine = useCallback(
    (itemId: string) => {
      setLinesForActiveCart((prev) =>
        prev.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + 1 } : l)),
      );
    },
    [setLinesForActiveCart],
  );

  const decreaseLine = useCallback(
    (itemId: string) => {
      setLinesForActiveCart((prev) =>
        prev
          .map((l) => (l.itemId === itemId ? { ...l, qty: l.qty - 1 } : l))
          .filter((l) => l.qty > 0),
      );
    },
    [setLinesForActiveCart],
  );

  const clearOrder = useCallback(() => {
    setLinesForActiveCart(() => []);
    setDiscountValue(0);
  }, [setLinesForActiveCart]);

  const setDiscount = useCallback((type: "percent" | "fixed", value: number) => {
    setDiscountType(type);
    setDiscountValue(value);
  }, []);

  const setTaxConfig = useCallback((enabled: boolean, rate: number) => {
    setTaxEnabled(enabled);
    setTaxRate(rate);
    try {
      localStorage.setItem("kasa_tax_enabled", enabled ? "1" : "0");
      localStorage.setItem("kasa_tax_rate", String(rate));
    } catch {}
  }, []);

  const setServiceChargeConfig = useCallback((enabled: boolean, rate: number) => {
    setServiceChargeEnabled(enabled);
    setServiceChargeRate(rate);
    try {
      localStorage.setItem("kasa_service_charge_enabled", enabled ? "1" : "0");
      localStorage.setItem("kasa_service_charge_rate", String(rate));
    } catch {}
  }, []);

  const recordOrder = useCallback(
    (status: OrderStatus, recordedTotals: OrderTotals, method?: PayMethod) => {
      const orderItems: OrderItemLine[] = lines.map((l) => {
        const prod = products.find((p) => p.id === l.itemId);
        return {
          itemId: l.itemId,
          name: prod?.name || "Produk",
          qty: l.qty,
          price: prod?.price || 0,
          note: l.note,
        };
      });

      const tableName =
        orderType === "meja"
          ? tables.find((t) => {
              const m = t.name.match(/\d+/);
              return m && Number.parseInt(m[0], 10) === tableNumber;
            })?.name || `Meja ${String(tableNumber).padStart(2, "0")}`
          : undefined;

      const row: OrderRow = {
        no: orderNo,
        status,
        total: recordedTotals.total,
        subtotal: recordedTotals.subtotal,
        tax: recordedTotals.tax,
        discount: recordedTotals.discountAmount,
        serviceCharge: recordedTotals.serviceCharge,
        itemCount: recordedTotals.count,
        items: orderItems,
        method,
        orderType,
        tableNumber: orderType === "meja" ? tableNumber : undefined,
        tableName,
        guests: orderType === "meja" ? guests : undefined,
        paidAt: status === "sudah-dibayar" ? Date.now() : undefined,
        createdAt: Date.now(),
      };

      setOrders((prev) => [row, ...prev]);
      setLinesForActiveCart(() => []);
      setDiscountValue(0);
      setOrderNo((n) => n + 1);
      void saveOrder(row).catch(() => undefined);
    },
    [guests, lines, orderNo, orderType, products, setLinesForActiveCart, tableNumber, tables],
  );

  const saveDraft = useCallback(() => {
    const no = orderNo;
    recordOrder("memasak", totals);
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

  const updateOrderStatus = useCallback(async (no: number, status: OrderStatus) => {
    await repoUpdateOrderStatus(no, status);
    setOrders((prev) =>
      prev.map((o) => (o.no === no ? { ...o, status } : o)),
    );
  }, []);

  const openShift = useCallback(async (cashierName: string, startingCash: number) => {
    const shift: ShiftRecord = {
      id: `shift-${Date.now()}`,
      openedAt: Date.now(),
      cashierName,
      startingCash,
      status: "OPEN",
    };
    await repoSaveShift(shift);
    setActiveShift(shift);
  }, []);

  const closeShift = useCallback(
    async (actualCash: number, notes?: string): Promise<ShiftRecord> => {
      if (!activeShift) {
        throw new Error("Tidak ada shift yang sedang aktif.");
      }
      const paidCashTotal = orders
        .filter(
          (o) =>
            o.status === "sudah-dibayar" &&
            o.method === "tunai" &&
            (o.paidAt ?? 0) >= activeShift.openedAt,
        )
        .reduce((sum, o) => sum + o.total, 0);

      const expectedCash = activeShift.startingCash + paidCashTotal;
      const cashDifference = actualCash - expectedCash;

      const closed: ShiftRecord = {
        ...activeShift,
        closedAt: Date.now(),
        actualCash,
        expectedCash,
        cashDifference,
        status: "CLOSED",
        notes,
      };

      await repoSaveShift(closed);
      setActiveShift(null);
      return closed;
    },
    [activeShift, orders],
  );

  const reloadProducts = useCallback(async () => {
    setProducts(await loadProducts());
  }, []);

  const reloadTables = useCallback(async () => {
    setTables(await loadTables());
  }, []);

  const reloadOrders = useCallback(async () => {
    setOrders(await loadOrders());
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
      discountType,
      discountValue,
      taxRate,
      serviceChargeRate,
      taxEnabled,
      serviceChargeEnabled,
      activeShift,
      setOrderType,
      setTableNumber,
      setGuests,
      setDiscount,
      setTaxConfig,
      setServiceChargeConfig,
      addItem,
      setItemNote,
      increaseLine,
      decreaseLine,
      clearOrder,
      saveDraft,
      payOrder,
      reloadProducts,
      reloadTables,
      reloadOrders,
      addProduct,
      updateProduct,
      deleteProduct,
      addTable,
      updateTable,
      deleteTable,
      selectTable,
      updateOrderStatus,
      openShift,
      closeShift,
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
      discountType,
      discountValue,
      taxRate,
      serviceChargeRate,
      taxEnabled,
      serviceChargeEnabled,
      activeShift,
      setOrderType,
      setTableNumber,
      setGuests,
      setDiscount,
      setTaxConfig,
      setServiceChargeConfig,
      addItem,
      setItemNote,
      increaseLine,
      decreaseLine,
      clearOrder,
      saveDraft,
      payOrder,
      reloadProducts,
      reloadTables,
      reloadOrders,
      addProduct,
      updateProduct,
      deleteProduct,
      addTable,
      updateTable,
      deleteTable,
      selectTable,
      updateOrderStatus,
      openShift,
      closeShift,
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
  return orders.filter((o) => o.status !== "sudah-dibayar").length;
}

export function salesToday(orders: OrderRow[]): number {
  const paidToday = orders
    .filter((o) => o.status === "sudah-dibayar" && isToday(o.paidAt))
    .reduce((sum, o) => sum + o.total, 0);
  return BASELINE_PENJUALAN_HARI_INI + paidToday;
}

export { db };
