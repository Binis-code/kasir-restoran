import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MENU_SEED, type MenuItem } from "../data/menu";
import { resetToDemoSeed } from "../lib/exporters";
import { broadcastSync, subscribeSync } from "../lib/syncBus";
import {
  db,
  ensureSeeded,
  DEFAULT_TABLES,
  DEFAULT_CATEGORIES,
  type OrderItemLine,
  type OrderRow,
  type OrderStatus,
  type OrderType,
  type PayMethod,
  type ShiftRecord,
  type TableRow,
  type CashMovementRow,
  type CashMovementType,
  type CashMovementCategory,
  type CategoryRow,
} from "../lib/db";
import {
  deleteProduct as repoDeleteProduct,
  deleteTable as repoDeleteTable,
  loadActiveShift,
  loadOrders,
  loadProducts,
  loadTables,
  loadCashMovements,
  loadCategories,
  saveCashMovement as repoSaveCashMovement,
  deleteCashMovement as repoDeleteCashMovement,
  saveCategory as repoSaveCategory,
  updateCategory as repoUpdateCategory,
  deleteCategory as repoDeleteCategory,
  nextOrderNo,
  saveOrder,
  saveProduct as repoSaveProduct,
  saveShift as repoSaveShift,
  saveTable as repoSaveTable,
  updateOrderStatus as repoUpdateOrderStatus,
} from "../lib/repo";

export type {
  OrderType,
  PayMethod,
  OrderStatus,
  TableRow,
  ShiftRecord,
  OrderRow,
  CashMovementRow,
  CashMovementType,
  CashMovementCategory,
  CategoryRow,
};
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
  categories: CategoryRow[];
  tables: TableRow[];
  orderNo: number;
  orderType: OrderType;
  tableNumber: number;
  guests: number;
  lines: CartLine[];
  totals: OrderTotals;
  orders: OrderRow[];
  cashMovements: CashMovementRow[];
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
  removeItem: (itemId: string) => void;
  clearOrder: () => void;
  saveDraft: () => number;
  payOrder: (method: PayMethod, cashReceived?: number) => PayResult;
  createSelfOrder: (input: {
    tableId?: string;
    tableName?: string;
    tableNumber?: number;
    customerName: string;
    lines: CartLine[];
    paymentChoice: "paid-now" | "pay-later";
    method?: PayMethod;
  }) => Promise<OrderRow>;
  createWaiterOrder: (input: {
    tableId?: string;
    tableName?: string;
    tableNumber?: number;
    customerName?: string;
    waiterId?: string;
    waiterName?: string;
    lines: CartLine[];
    status?: OrderStatus;
    method?: PayMethod;
    guests?: number;
  }) => Promise<OrderRow>;
  addCashMovement: (input: {
    type: CashMovementType;
    category: CashMovementCategory;
    amount: number;
    description: string;
    cashierName?: string;
  }) => Promise<CashMovementRow>;
  deleteCashMovement: (id: string) => Promise<void>;
  reloadCashMovements: () => Promise<void>;
  triggerOpenDrawer: () => void;
  reloadProducts: () => Promise<void>;
  reloadTables: () => Promise<void>;
  reloadOrders: () => Promise<void>;
  reloadCategories: () => Promise<void>;
  addProduct: (item: MenuItem) => Promise<void>;
  updateProduct: (item: MenuItem) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Partial<CategoryRow>) => Promise<CategoryRow>;
  updateCategory: (id: string, updates: Partial<CategoryRow>, oldName?: string) => Promise<void>;
  deleteCategory: (id: string, categoryName: string, reassignToCategoryName?: string) => Promise<void>;
  addTable: (table: TableRow) => Promise<void>;
  updateTable: (table: TableRow) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  selectTable: (table: TableRow) => void;
  updateOrderStatus: (no: number, status: OrderStatus) => Promise<void>;
  openShift: (cashierName: string, startingCash: number) => Promise<void>;
  closeShift: (
    actualCash: number,
    notes?: string,
    denominations?: Record<string, number>,
  ) => Promise<ShiftRecord>;
  resetSeed: () => Promise<void>;
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
  const [products, setProducts] = useState<MenuItem[]>(MENU_SEED);
  const [categories, setCategories] = useState<CategoryRow[]>(DEFAULT_CATEGORIES);
  const [tables, setTables] = useState<TableRow[]>(DEFAULT_TABLES);
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

  const [cashMovements, setCashMovements] = useState<CashMovementRow[]>([]);

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
        let [loadedProducts, loadedOrders, loadedTables, shift, loadedMovements, loadedCats] = await Promise.all([
          loadProducts(),
          loadOrders(),
          loadTables(),
          loadActiveShift(),
          loadCashMovements(),
          loadCategories(),
        ]);
        if (loadedProducts.length === 0) {
          await db.products.bulkPut(MENU_SEED);
          loadedProducts = await loadProducts();
        }
        if (!alive) return;
        setProducts(loadedProducts);
        setCategories(loadedCats);
        setOrders(loadedOrders);
        setTables(loadedTables);
        setCashMovements(loadedMovements);
        setActiveShift(shift || null);
        const last = loadedOrders[0]?.no ?? 1048;
        setOrderNo(last + 1);
      } finally {
        if (alive) setReady(true);
      }
    })();

    const unsubscribe = subscribeSync(async (msg) => {
      if (!alive) return;
      if (msg.type === "ORDER_CREATED" || msg.type === "ORDER_STATUS_CHANGED") {
        const loadedOrders = await loadOrders();
        if (alive) {
          setOrders(loadedOrders);
          const maxNo = loadedOrders.reduce((max, o) => Math.max(max, o.no), 1048);
          setOrderNo((prev) => Math.max(prev, maxNo + 1));
        }
      } else if (msg.type === "TABLE_UPDATED") {
        const loadedTables = await loadTables();
        if (alive) setTables(loadedTables);
      } else if (msg.type === "PRODUCTS_UPDATED") {
        const loadedProducts = await loadProducts();
        if (alive) setProducts(loadedProducts);
      } else if (msg.type === "CATEGORY_CREATED" || msg.type === "CATEGORY_UPDATED" || msg.type === "CATEGORY_DELETED") {
        const [loadedCats, loadedProducts] = await Promise.all([loadCategories(), loadProducts()]);
        if (alive) {
          setCategories(loadedCats);
          setProducts(loadedProducts);
        }
      } else if (msg.type === "SHIFT_CHANGED") {
        const shift = await loadActiveShift();
        if (alive) setActiveShift(shift || null);
      } else if (msg.type === "CASH_MOVEMENT_CREATED" || msg.type === "CASH_MOVEMENT_DELETED") {
        const loadedMovements = await loadCashMovements();
        if (alive) setCashMovements(loadedMovements);
      }
    });

    return () => {
      alive = false;
      unsubscribe();
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
        const idx = prev.findIndex((l) => l.itemId === itemId);
        if (idx >= 0) {
          return prev.map((l, i) => (i === idx ? { ...l, qty: l.qty + 1 } : l));
        }
        return [...prev, { itemId, qty: 1 }];
      });
    },
    [setLinesForActiveCart],
  );

  const setItemNote = useCallback(
    (itemId: string, note: string) => {
      setLinesForActiveCart((prev) =>
        prev.map((l) => (l.itemId === itemId ? { ...l, note } : l)),
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

  const removeItem = useCallback(
    (itemId: string) => {
      setLinesForActiveCart((prev) => prev.filter((l) => l.itemId !== itemId));
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
        source: "pos",
        paymentChoice: status === "sudah-dibayar" ? "paid-now" : "pay-later",
        paidAt: status === "sudah-dibayar" ? Date.now() : undefined,
        createdAt: Date.now(),
      };

      setOrders((prev) => [row, ...prev]);
      setLinesForActiveCart(() => []);
      setDiscountValue(0);
      setOrderNo((n) => n + 1);
      void saveOrder(row).then(() => {
        broadcastSync("ORDER_CREATED", { order: row });
      });
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

  const createSelfOrder = useCallback(
    async (input: {
      tableId?: string;
      tableName?: string;
      tableNumber?: number;
      customerName: string;
      lines: CartLine[];
      paymentChoice: "paid-now" | "pay-later";
      method?: PayMethod;
    }): Promise<OrderRow> => {
      const orderNumber = await nextOrderNo();
      const orderItems: OrderItemLine[] = input.lines.map((l) => {
        const prod = products.find((p) => p.id === l.itemId);
        return {
          itemId: l.itemId,
          name: prod?.name || "Produk",
          qty: l.qty,
          price: prod?.price || 0,
          note: l.note,
        };
      });

      const selfTotals = computeTotals(
        input.lines,
        products,
        "percent",
        0,
        taxEnabled,
        taxRate,
        serviceChargeEnabled,
        serviceChargeRate,
      );

      const status: OrderStatus = input.paymentChoice === "paid-now" ? "sudah-dibayar" : "memasak";

      const row: OrderRow = {
        no: orderNumber,
        status,
        total: selfTotals.total,
        subtotal: selfTotals.subtotal,
        tax: selfTotals.tax,
        discount: 0,
        serviceCharge: selfTotals.serviceCharge,
        itemCount: selfTotals.count,
        items: orderItems,
        method: input.method || (input.paymentChoice === "paid-now" ? "qris" : undefined),
        orderType: "meja",
        tableNumber: input.tableNumber,
        tableName: input.tableName || (input.tableNumber ? `Meja ${String(input.tableNumber).padStart(2, "0")}` : undefined),
        customerName: input.customerName.trim() || "Pelanggan Meja",
        source: "self-order",
        paymentChoice: input.paymentChoice,
        paidAt: status === "sudah-dibayar" ? Date.now() : undefined,
        createdAt: Date.now(),
      };

      await saveOrder(row);
      setOrders((prev) => [row, ...prev]);
      setOrderNo((n) => Math.max(n + 1, orderNumber + 1));
      broadcastSync("ORDER_CREATED", { order: row });
      return row;
    },
    [products, serviceChargeEnabled, serviceChargeRate, taxEnabled, taxRate],
  );

  const createWaiterOrder = useCallback(
    async (input: {
      tableId?: string;
      tableName?: string;
      tableNumber?: number;
      customerName?: string;
      waiterId?: string;
      waiterName?: string;
      lines: CartLine[];
      status?: OrderStatus;
      method?: PayMethod;
      guests?: number;
    }): Promise<OrderRow> => {
      const orderNumber = await nextOrderNo();
      const orderItems: OrderItemLine[] = input.lines.map((l) => {
        const prod = products.find((p) => p.id === l.itemId);
        return {
          itemId: l.itemId,
          name: prod?.name || "Produk",
          qty: l.qty,
          price: prod?.price || 0,
          note: l.note,
        };
      });

      const waiterTotals = computeTotals(
        input.lines,
        products,
        "percent",
        0,
        taxEnabled,
        taxRate,
        serviceChargeEnabled,
        serviceChargeRate,
      );

      const status: OrderStatus = input.status || (input.method ? "sudah-dibayar" : "memasak");

      const row: OrderRow = {
        no: orderNumber,
        status,
        total: waiterTotals.total,
        subtotal: waiterTotals.subtotal,
        tax: waiterTotals.tax,
        discount: 0,
        serviceCharge: waiterTotals.serviceCharge,
        itemCount: waiterTotals.count,
        items: orderItems,
        method: input.method,
        orderType: "meja",
        tableNumber: input.tableNumber,
        tableName: input.tableName || (input.tableNumber ? `Meja ${String(input.tableNumber).padStart(2, "0")}` : undefined),
        guests: input.guests || 2,
        customerName: input.customerName?.trim() || "Tamu Meja",
        waiterId: input.waiterId,
        waiterName: input.waiterName,
        source: "waiter",
        paymentChoice: status === "sudah-dibayar" ? "paid-now" : "pay-later",
        paidAt: status === "sudah-dibayar" ? Date.now() : undefined,
        createdAt: Date.now(),
      };

      await saveOrder(row);
      setOrders((prev) => [row, ...prev]);
      setOrderNo((n) => Math.max(n + 1, orderNumber + 1));
      broadcastSync("ORDER_CREATED", { order: row });
      return row;
    },
    [products, serviceChargeEnabled, serviceChargeRate, taxEnabled, taxRate],
  );

  const updateOrderStatus = useCallback(async (no: number, status: OrderStatus) => {
    await repoUpdateOrderStatus(no, status);
    setOrders((prev) =>
      prev.map((o) => (o.no === no ? { ...o, status } : o)),
    );
    broadcastSync("ORDER_STATUS_CHANGED", { no, status });
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
    broadcastSync("SHIFT_CHANGED", { shift });
  }, []);

  const closeShift = useCallback(
    async (
      actualCash: number,
      notes?: string,
      denominations?: Record<string, number>,
    ): Promise<ShiftRecord> => {
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

      const shiftMovements = cashMovements.filter((m) => (m.createdAt ?? 0) >= activeShift.openedAt);
      const cashInTotal = shiftMovements
        .filter((m) => m.type === "CASH_IN" && m.category !== "modal_awal")
        .reduce((sum, m) => sum + m.amount, 0);
      const cashOutTotal = shiftMovements
        .filter((m) => m.type === "CASH_OUT")
        .reduce((sum, m) => sum + m.amount, 0);

      const expectedCash = activeShift.startingCash + paidCashTotal + cashInTotal - cashOutTotal;
      const cashDifference = actualCash - expectedCash;

      const closed: ShiftRecord = {
        ...activeShift,
        closedAt: Date.now(),
        actualCash,
        expectedCash,
        cashDifference,
        cashSalesTotal: paidCashTotal,
        cashInTotal,
        cashOutTotal,
        denominations,
        status: "CLOSED",
        notes,
      };

      await repoSaveShift(closed);
      setActiveShift(null);
      broadcastSync("SHIFT_CHANGED", { shift: closed });
      return closed;
    },
    [activeShift, cashMovements, orders],
  );

  const addCashMovement = useCallback(
    async (input: {
      type: CashMovementType;
      category: CashMovementCategory;
      amount: number;
      description: string;
      cashierName?: string;
    }): Promise<CashMovementRow> => {
      const row: CashMovementRow = {
        id: `mov-${Date.now()}`,
        shiftId: activeShift?.id,
        type: input.type,
        category: input.category,
        amount: input.amount,
        description: input.description,
        cashierName: input.cashierName || activeShift?.cashierName || "Kasir",
        createdAt: Date.now(),
      };
      await repoSaveCashMovement(row);
      setCashMovements((prev) => [row, ...prev]);
      broadcastSync("CASH_MOVEMENT_CREATED", { movement: row });
      return row;
    },
    [activeShift],
  );

  const deleteCashMovement = useCallback(
    async (id: string) => {
      await repoDeleteCashMovement(id);
      setCashMovements((prev) => prev.filter((m) => m.id !== id));
      broadcastSync("CASH_MOVEMENT_DELETED", { id });
    },
    [],
  );

  const reloadCashMovements = useCallback(async () => {
    const list = await loadCashMovements();
    setCashMovements(list);
    broadcastSync("CASH_MOVEMENT_CREATED");
  }, []);

  const triggerOpenDrawer = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      }
    } catch {}
  }, []);

  const reloadProducts = useCallback(async () => {
    const p = await loadProducts();
    setProducts(p);
    broadcastSync("PRODUCTS_UPDATED");
  }, []);

  const reloadTables = useCallback(async () => {
    const t = await loadTables();
    setTables(t);
    broadcastSync("TABLE_UPDATED");
  }, []);

  const reloadOrders = useCallback(async () => {
    const o = await loadOrders();
    setOrders(o);
  }, []);

  const reloadCategories = useCallback(async () => {
    const cats = await loadCategories();
    setCategories(cats);
  }, []);

  const addCategory = useCallback(async (input: Partial<CategoryRow>) => {
    const id = input.id || `cat-${Date.now()}`;
    const newCat: CategoryRow = {
      id,
      name: input.name?.trim() || "Kategori Baru",
      kind: input.kind || "Makanan",
      color: input.color || "counterlime",
      sortOrder: input.sortOrder ?? (categories.length + 1),
      createdAt: Date.now(),
      isDefault: false,
    };
    await repoSaveCategory(newCat);
    const updatedCats = await loadCategories();
    setCategories(updatedCats);
    broadcastSync("CATEGORY_CREATED", newCat);
    return newCat;
  }, [categories.length]);

  const updateCategory = useCallback(async (id: string, updates: Partial<CategoryRow>, oldName?: string) => {
    await repoUpdateCategory(id, updates, oldName);
    const [updatedCats, updatedProds] = await Promise.all([loadCategories(), loadProducts()]);
    setCategories(updatedCats);
    setProducts(updatedProds);
    broadcastSync("CATEGORY_UPDATED", { id, updates });
    if (updates.name && oldName && updates.name !== oldName) {
      broadcastSync("PRODUCTS_UPDATED");
    }
  }, []);

  const deleteCategory = useCallback(async (id: string, categoryName: string, reassignToCategoryName?: string) => {
    await repoDeleteCategory(id, categoryName, reassignToCategoryName);
    const [updatedCats, updatedProds] = await Promise.all([loadCategories(), loadProducts()]);
    setCategories(updatedCats);
    setProducts(updatedProds);
    broadcastSync("CATEGORY_DELETED", { id, categoryName, reassignToCategoryName });
    if (reassignToCategoryName) {
      broadcastSync("PRODUCTS_UPDATED");
    }
  }, []);

  const addProduct = useCallback(async (item: MenuItem) => {
    await repoSaveProduct(item);
    setProducts(await loadProducts());
    broadcastSync("PRODUCTS_UPDATED");
  }, []);

  const updateProduct = useCallback(async (item: MenuItem) => {
    await repoSaveProduct(item);
    setProducts(await loadProducts());
    broadcastSync("PRODUCTS_UPDATED");
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await repoDeleteProduct(id);
    setProducts(await loadProducts());
    broadcastSync("PRODUCTS_UPDATED");
  }, []);

  const addTable = useCallback(async (table: TableRow) => {
    await repoSaveTable(table);
    setTables(await loadTables());
    broadcastSync("TABLE_UPDATED");
  }, []);

  const updateTable = useCallback(async (table: TableRow) => {
    await repoSaveTable(table);
    setTables(await loadTables());
    broadcastSync("TABLE_UPDATED");
  }, []);

  const deleteTable = useCallback(async (id: string) => {
    await repoDeleteTable(id);
    setTables(await loadTables());
    broadcastSync("TABLE_UPDATED");
  }, []);

  const selectTable = useCallback((table: TableRow) => {
    const numMatch = table.name.match(/\d+/);
    const num = numMatch ? Number.parseInt(numMatch[0], 10) : 1;
    setOrderType("meja");
    setTableNumber(num);
    setGuests(table.seats);
  }, []);

  const resetSeed = useCallback(async () => {
    await resetToDemoSeed();
    const [prods, tbls, movs, cats] = await Promise.all([
      loadProducts(),
      loadTables(),
      loadCashMovements(),
      loadCategories(),
    ]);
    setProducts(prods);
    setTables(tbls);
    setCashMovements(movs);
    setCategories(cats);
    broadcastSync("PRODUCTS_UPDATED");
    broadcastSync("TABLE_UPDATED");
    broadcastSync("CATEGORY_UPDATED");
  }, []);

  const value = useMemo<PosContextValue>(
    () => ({
      ready,
      products,
      categories,
      tables,
      orderNo,
      orderType,
      tableNumber,
      guests,
      lines,
      totals,
      orders,
      cashMovements,
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
      removeItem,
      clearOrder,
      saveDraft,
      payOrder,
      createSelfOrder,
      createWaiterOrder,
      addCashMovement,
      deleteCashMovement,
      reloadCashMovements,
      triggerOpenDrawer,
      reloadProducts,
      reloadTables,
      reloadOrders,
      reloadCategories,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      addTable,
      updateTable,
      deleteTable,
      selectTable,
      updateOrderStatus,
      openShift,
      closeShift,
      resetSeed,
    }),
    [
      ready,
      products,
      categories,
      tables,
      orderNo,
      orderType,
      tableNumber,
      guests,
      lines,
      totals,
      orders,
      cashMovements,
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
      removeItem,
      clearOrder,
      saveDraft,
      payOrder,
      createSelfOrder,
      createWaiterOrder,
      addCashMovement,
      deleteCashMovement,
      reloadCashMovements,
      triggerOpenDrawer,
      reloadProducts,
      reloadTables,
      reloadOrders,
      reloadCategories,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory,
      addTable,
      updateTable,
      deleteTable,
      selectTable,
      updateOrderStatus,
      openShift,
      closeShift,
      resetSeed,
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
