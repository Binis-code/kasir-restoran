import { useMemo, useState, useEffect } from "react";
import {
  Users,
  ChefHat,
  CreditCard,
  Plus,
  Minus,
  Search,
  QrCode,
  Banknote,
  AlertCircle,
  Clock,
  ClipboardList,
  UtensilsCrossed,
  LayoutGrid,
  Sparkles,
  ArrowRight,
  Check,
  Flame,
  ScanLine,
} from "lucide-react";
import { usePos, type CartLine, type OrderRow } from "../components/PosContext";
import { formatIDR } from "../data/menu";
import { Button } from "../components/ui/Button";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { cn } from "../lib/cn";
import { toast } from "sonner";
import { FocusModeHeader } from "../components/FocusModeHeader";
import { useAuth } from "../components/AuthContext";

type WaiterTab = "order" | "my-orders" | "floor-map";

export default function WaiterOrder() {
  const { currentStaff, openSwitchModal } = useAuth();
  const {
    products,
    categories,
    tables,
    orders,
    createWaiterOrder,
    updateOrderStatus,
    taxEnabled,
    taxRate,
    serviceChargeEnabled,
    serviceChargeRate,
  } = usePos();

  // Active Tab
  const [activeTab, setActiveTab] = useState<WaiterTab>("order");

  // Isolated storage keys per waiter profile ID
  const staffDraftCartKey = `kasa_waiter_cart_${currentStaff.id}`;
  const staffDraftTableKey = `kasa_waiter_table_${currentStaff.id}`;

  // State isolated per waiter
  const [cartLines, setCartLines] = useState<CartLine[]>(() => {
    try {
      const saved = localStorage.getItem(staffDraftCartKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    return localStorage.getItem(staffDraftTableKey) || tables[0]?.id || "t1";
  });

  const [customerName, setCustomerName] = useState("");
  const [guestsCount, setGuestsCount] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<"tunai" | "qris">("tunai");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setTick] = useState(0);

  // Auto-tick for live timers every 10s
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Sync isolated cart to localStorage whenever currentStaff or cartLines changes
  useEffect(() => {
    try {
      localStorage.setItem(staffDraftCartKey, JSON.stringify(cartLines));
    } catch (e) {
      console.error("Failed to save waiter draft cart", e);
    }
  }, [cartLines, staffDraftCartKey]);

  // Load correct draft cart when switching staff
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(staffDraftCartKey);
      setCartLines(savedCart ? JSON.parse(savedCart) : []);
      const savedTable = localStorage.getItem(staffDraftTableKey);
      if (savedTable) setSelectedTableId(savedTable);
    } catch {
      setCartLines([]);
    }
  }, [currentStaff.id, staffDraftCartKey, staffDraftTableKey]);

  // Save selected table per waiter
  useEffect(() => {
    localStorage.setItem(staffDraftTableKey, selectedTableId);
  }, [selectedTableId, staffDraftTableKey]);

  // Matched table info
  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0];
  }, [selectedTableId, tables]);

  const tableNumber = selectedTable ? parseInt(selectedTable.name.match(/\d+/)?.[0] || "1", 10) : 1;

  // Active orders map by table
  const activeOrdersByTable = useMemo(() => {
    const map = new Map<string, OrderRow>();
    const active = orders.filter((o) => o.status !== "sudah-dibayar");
    for (const ord of active) {
      if (ord.tableName) {
        const found = tables.find((t) => t.name.toLowerCase() === ord.tableName?.toLowerCase());
        if (found) map.set(found.id, ord);
      } else if (ord.tableNumber) {
        const found = tables.find((t) => {
          const num = parseInt(t.name.match(/\d+/)?.[0] || "0", 10);
          return num === ord.tableNumber;
        });
        if (found) map.set(found.id, ord);
      }
    }
    return map;
  }, [orders, tables]);

  const activeOrderOnSelectedTable = selectedTable ? activeOrdersByTable.get(selectedTable.id) : undefined;
  const isSelectedTableOccupied = !!activeOrderOnSelectedTable;
  const isHandledByMe =
    activeOrderOnSelectedTable &&
    (activeOrderOnSelectedTable.waiterId === currentStaff.id ||
      activeOrderOnSelectedTable.waiterName === currentStaff.name);

  // Orders taken by THIS waiter today
  const myActiveOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.waiterId === currentStaff.id ||
          o.waiterName === currentStaff.name ||
          (o.source === "waiter" && o.customerName?.includes(currentStaff.name))) &&
        o.status !== "sudah-dibayar",
    );
  }, [orders, currentStaff]);

  const myReadyOrdersCount = useMemo(() => {
    return myActiveOrders.filter((o) => o.status === "siap").length;
  }, [myActiveOrders]);

  // Cart operations
  const handleAddItem = (itemId: string) => {
    setCartLines((prev) => {
      const idx = prev.findIndex((l) => l.itemId === itemId);
      if (idx >= 0) {
        return prev.map((l, i) => (i === idx ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { itemId, qty: 1 }];
    });
  };

  const handleDecreaseItem = (itemId: string) => {
    setCartLines((prev) =>
      prev
        .map((l) => (l.itemId === itemId ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const handleSetNote = (itemId: string, note: string) => {
    setCartLines((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, note } : l)),
    );
  };

  const handleClearCart = () => {
    setCartLines([]);
    localStorage.removeItem(staffDraftCartKey);
    toast.info("Keranjang pesanan dibersihkan.");
  };

  // Cart totals
  const totals = useMemo(() => {
    let rawSubtotal = 0;
    let count = 0;
    for (const line of cartLines) {
      const prod = products.find((p) => p.id === line.itemId);
      if (prod) {
        rawSubtotal += prod.price * line.qty;
        count += line.qty;
      }
    }
    const tax = taxEnabled ? Math.round((rawSubtotal * taxRate) / 100) : 0;
    const serviceCharge = serviceChargeEnabled
      ? Math.round((rawSubtotal * serviceChargeRate) / 100)
      : 0;
    const total = rawSubtotal + tax + serviceCharge;

    return { rawSubtotal, tax, serviceCharge, total, count };
  }, [cartLines, products, serviceChargeEnabled, serviceChargeRate, taxEnabled, taxRate]);

  // Filtered menu
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === "Semua" || p.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Action: Send to Kitchen
  const handleSendToKitchen = async () => {
    if (cartLines.length === 0) {
      toast.error("Pilih menu terlebih dahulu");
      return;
    }
    try {
      setIsSubmitting(true);
      const finalCustomerName = customerName.trim()
        ? customerName.trim()
        : `Tamu ${selectedTable?.name}`;

      const created = await createWaiterOrder({
        tableId: selectedTable?.id,
        tableName: selectedTable?.name,
        tableNumber,
        customerName: finalCustomerName,
        waiterId: currentStaff.id,
        waiterName: currentStaff.name,
        guests: guestsCount,
        lines: cartLines,
        status: "memasak",
      });

      toast.success("Pesanan dikirim ke Dapur (KDS)!", {
        description: `Order #${created.no} · ${selectedTable?.name} · Pelayan: ${currentStaff.name}`,
      });
      setCartLines([]);
      localStorage.removeItem(staffDraftCartKey);
      setCustomerName("");
    } catch (err) {
      toast.error("Gagal mengirim pesanan ke dapur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Pay at Table
  const handlePayAtTable = async () => {
    if (cartLines.length === 0) {
      toast.error("Pilih menu terlebih dahulu");
      return;
    }
    try {
      setIsSubmitting(true);
      const finalCustomerName = customerName.trim()
        ? customerName.trim()
        : `Tamu ${selectedTable?.name}`;

      const created = await createWaiterOrder({
        tableId: selectedTable?.id,
        tableName: selectedTable?.name,
        tableNumber,
        customerName: finalCustomerName,
        waiterId: currentStaff.id,
        waiterName: currentStaff.name,
        guests: guestsCount,
        lines: cartLines,
        status: "sudah-dibayar",
        method: payMethod,
      });

      toast.success("Pembayaran Meja Berhasil!", {
        description: `Order #${created.no} · ${formatIDR(created.total)} (${payMethod.toUpperCase()}) · Pelayan: ${currentStaff.name}`,
      });
      setCartLines([]);
      localStorage.removeItem(staffDraftCartKey);
      setCustomerName("");
      setIsPayModalOpen(false);
    } catch (err) {
      toast.error("Gagal memproses pembayaran meja.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-mineral">
      <FocusModeHeader
        title="Mode Pelayan"
        subtitle={`Petugas: ${currentStaff.name} · Sesi Terisolasi & Tanpa Overlap Meja`}
        roleType="pelayan"
      />

      <div className="flex-1 p-4 md:p-6 pb-28">
        {/* Top Control Bar: Multi-Waiter Identity & Navigation Tabs */}
        <div className="mb-4 rounded-2xl bg-white border border-ink/10 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          {/* Active Waiter Profile Badge */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs",
                currentStaff.avatarColor,
              )}
            >
              {currentStaff.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-ink">{currentStaff.name}</p>
                <span className="text-[10px] bg-counterlime/40 text-ink font-bold px-2 py-0.5 rounded-full border border-counterlime">
                  {currentStaff.title}
                </span>
                <button
                  type="button"
                  onClick={openSwitchModal}
                  className="text-[11px] font-semibold text-ink/50 hover:text-ink underline flex items-center gap-1"
                >
                  <Sparkles size={12} className="text-amber-500" />
                  Ganti Akun Pelayan (PIN)
                </button>
              </div>
              <p className="text-[11px] text-ink/50 mt-0.5">
                Draft pesanan tersimpan khusus untuk <strong>{currentStaff.name}</strong> · Mencegah bentrok dengan pelayan lain.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-mineral/60 p-1 rounded-xl border border-ink/10">
            <button
              type="button"
              onClick={() => setActiveTab("order")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "order"
                  ? "bg-ink text-white shadow-xs"
                  : "text-ink/70 hover:text-ink hover:bg-white/60",
              )}
            >
              <UtensilsCrossed size={14} />
              <span>1. Catat Pesanan</span>
              {cartLines.length > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-counterlime text-ink text-[10px] font-bold flex items-center justify-center">
                  {totals.count}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("my-orders")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all relative",
                activeTab === "my-orders"
                  ? "bg-ink text-white shadow-xs"
                  : "text-ink/70 hover:text-ink hover:bg-white/60",
              )}
            >
              <ClipboardList size={14} />
              <span>2. Pesanan Saya</span>
              {myActiveOrders.length > 0 && (
                <span
                  className={cn(
                    "h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                    myReadyOrdersCount > 0
                      ? "bg-emerald-500 text-white animate-pulse"
                      : "bg-ink/20 text-ink",
                  )}
                >
                  {myActiveOrders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("floor-map")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "floor-map"
                  ? "bg-ink text-white shadow-xs"
                  : "text-ink/70 hover:text-ink hover:bg-white/60",
              )}
            >
              <LayoutGrid size={14} />
              <span>3. Denah Meja ({tables.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ORDER ENTRY */}
        {activeTab === "order" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Table & Menu Selection */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {/* Table & Guest Picker Bar with Overlap Protection */}
              <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-counterlime text-ink">
                      <Users size={16} />
                    </span>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-ink/70">
                        Pilih Meja Restoran
                      </span>
                      <span className="text-[11px] text-ink/40 ml-2 font-medium">
                        (Mencegah tabrakan pesanan antar-pelayan)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label htmlFor="waiter-guest-count" className="text-xs font-medium text-ink/60">
                      Jumlah Kursi:
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 4, 6, 8].map((g) => (
                        <button
                          key={g}
                          id="waiter-guest-count"
                          type="button"
                          onClick={() => setGuestsCount(g)}
                          className={cn(
                            "h-7 w-7 rounded-lg text-xs font-bold transition-all",
                            guestsCount === g
                              ? "bg-ink text-counterlime shadow-xs"
                              : "bg-slate-100 text-ink/60 hover:bg-slate-200",
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table Chips with Live Waiter Status */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {tables.map((t) => {
                    const activeOrd = activeOrdersByTable.get(t.id);
                    const isOccupied = !!activeOrd;
                    const isSelected = t.id === selectedTableId;
                    const isMine =
                      activeOrd &&
                      (activeOrd.waiterId === currentStaff.id ||
                        activeOrd.waiterName === currentStaff.name);

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTableId(t.id)}
                        className={cn(
                          "flex flex-col items-start justify-between rounded-xl p-2.5 text-xs font-bold transition-all text-left min-h-[58px] border relative",
                          isSelected
                            ? "bg-ink text-counterlime shadow-md ring-2 ring-counterlime border-ink"
                            : isMine
                            ? "bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100"
                            : isOccupied
                            ? "bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100"
                            : "bg-slate-50 text-ink/80 hover:bg-slate-100 border-slate-200",
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold">{t.name}</span>
                          <span className="text-[10px] opacity-60">{t.area}</span>
                        </div>

                        <div className="mt-1 flex items-center justify-between w-full">
                          {isOccupied ? (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.2 text-[9px] font-bold line-clamp-1",
                                isSelected
                                  ? "bg-counterlime text-ink"
                                  : isMine
                                  ? "bg-emerald-200 text-emerald-900"
                                  : "bg-amber-200 text-amber-900",
                              )}
                            >
                              {isMine
                                ? "Saya (#" + activeOrd?.no + ")"
                                : (activeOrd?.waiterName?.split(" ")[0] || "Tamu") + " (#" + activeOrd?.no + ")"}
                            </span>
                          ) : (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.2 text-[9px] font-semibold",
                                isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800",
                              )}
                            >
                              Kosong
                            </span>
                          )}
                          <span className="text-[10px] opacity-50">{t.seats} Kursi</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Overlap & Conflict Notice Card if Table is Occupied */}
                {isSelectedTableOccupied && activeOrderOnSelectedTable && (
                  <div
                    className={cn(
                      "rounded-xl p-3 border flex items-start justify-between gap-3 animate-in fade-in duration-200",
                      isHandledByMe
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : "bg-amber-50 border-amber-300 text-amber-950",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle
                        size={18}
                        className={isHandledByMe ? "text-emerald-700 shrink-0 mt-0.5" : "text-amber-700 shrink-0 mt-0.5"}
                      />
                      <div>
                        <p className="text-xs font-bold">
                          {isHandledByMe
                            ? `Anda sedang menangani pesanan aktif di ${selectedTable?.name} (Order #${activeOrderOnSelectedTable.no})`
                            : `Perhatian: ${selectedTable?.name} sedang aktif ditangani oleh ${
                                activeOrderOnSelectedTable.waiterName || activeOrderOnSelectedTable.customerName
                              } (Order #${activeOrderOnSelectedTable.no})`}
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          Status Dapur:{" "}
                          <strong>
                            {activeOrderOnSelectedTable.status === "siap"
                              ? "✨ SIAP DISAJIKAN"
                              : activeOrderOnSelectedTable.status === "memasak"
                              ? "🍳 Sedang Dimasak di Dapur"
                              : "⏳ Menunggu Antrean"}
                          </strong>{" "}
                          · {activeOrderOnSelectedTable.itemCount} menu ({formatIDR(activeOrderOnSelectedTable.total)})
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/80 border shrink-0">
                      {isHandledByMe ? "Pesanan Saya" : "Pelayan Lain"}
                    </span>
                  </div>
                )}

                {/* Guest Name Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Pelanggan (opsional, contoh: Bpk. Gunawan)"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-ink focus:border-counterlime focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Menu Filters & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                  {["Semua", ...categories.map((c) => c.name)].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "rounded-xl px-3.5 py-2 text-xs font-bold transition-all min-h-[40px]",
                        selectedCategory === cat
                          ? "bg-ink text-counterlime shadow-sm"
                          : "bg-white text-ink/70 border border-slate-200 hover:border-ink/20",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama menu..."
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-ink focus:border-counterlime focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    title="Pindai Barcode Menu atau QR Meja"
                    aria-label="Pindai Barcode Menu atau QR Meja"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink/70 hover:bg-counterlime hover:text-ink hover:border-counterlime-dark transition-all shadow-xs"
                  >
                    <ScanLine size={16} />
                  </button>
                </div>
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const inCart = cartLines.find((l) => l.itemId === p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col justify-between rounded-2xl border border-ink/10 bg-white p-3 shadow-sm hover:shadow-md transition-all"
                    >
                      <div>
                        {p.image && (
                          <div className="h-24 w-full rounded-xl overflow-hidden mb-2 bg-slate-100">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="font-bold text-xs leading-snug text-ink line-clamp-2">
                          {p.name}
                        </div>
                        <div className="mt-1 font-display font-bold text-xs text-ink">
                          {formatIDR(p.price)}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                        {inCart ? (
                          <div className="flex w-full items-center justify-between rounded-lg bg-slate-100 p-1">
                            <button
                              type="button"
                              onClick={() => handleDecreaseItem(p.id)}
                              className="flex h-7 w-7 items-center justify-center rounded bg-white text-ink shadow-sm"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="text-xs font-bold text-ink">{inCart.qty}</span>
                            <button
                              type="button"
                              onClick={() => handleAddItem(p.id)}
                              className="flex h-7 w-7 items-center justify-center rounded bg-counterlime text-ink shadow-sm"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddItem(p.id)}
                            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-counterlime text-xs font-bold text-ink hover:bg-counterlime/90 active:scale-95 shadow-sm"
                          >
                            <Plus size={14} />
                            Pilih
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Order Summary & Rapid Action */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-20 rounded-2xl border border-ink/10 bg-white p-4 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-ink">
                      Pesanan {selectedTable?.name}
                    </h3>
                    <p className="text-[11px] text-ink/60">
                      {customerName || "Tamu"} · {guestsCount} Orang · Pelayan:{" "}
                      <strong className="text-ink">{currentStaff.name}</strong>
                    </p>
                  </div>
                  {cartLines.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                {/* Cart Lines */}
                <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                  {cartLines.length === 0 ? (
                    <div className="py-8 text-center text-xs text-ink/40">
                      <p>Belum ada menu yang dipilih.</p>
                      <p className="mt-1 text-[11px]">
                        Draft pesanan ini tersimpan khusus untuk <strong>{currentStaff.name}</strong>.
                      </p>
                    </div>
                  ) : (
                    cartLines.map((line) => {
                      const prod = products.find((p) => p.id === line.itemId);
                      if (!prod) return null;
                      return (
                        <div
                          key={line.itemId}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-xs text-ink">{prod.name}</p>
                              <p className="text-[11px] text-ink/60">
                                {line.qty} × {formatIDR(prod.price)} = {formatIDR(prod.price * line.qty)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDecreaseItem(line.itemId)}
                                className="h-6 w-6 rounded bg-white text-ink border border-slate-200 flex items-center justify-center"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-ink">
                                {line.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddItem(line.itemId)}
                                className="h-6 w-6 rounded bg-counterlime text-ink flex items-center justify-center font-bold"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={line.note || ""}
                            onChange={(e) => handleSetNote(line.itemId, e.target.value)}
                            placeholder="Catatan (contoh: pedas, es sedikit)"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-ink placeholder:text-ink/30 focus:border-counterlime focus:outline-none"
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-ink/60">
                    <span>Subtotal ({totals.count} item):</span>
                    <span>{formatIDR(totals.rawSubtotal)}</span>
                  </div>
                  {taxEnabled && (
                    <div className="flex justify-between text-ink/60">
                      <span>PPN ({taxRate}%):</span>
                      <span>{formatIDR(totals.tax)}</span>
                    </div>
                  )}
                  {serviceChargeEnabled && (
                    <div className="flex justify-between text-ink/60">
                      <span>Service Charge ({serviceChargeRate}%):</span>
                      <span>{formatIDR(totals.serviceCharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-display text-sm font-bold text-ink border-t border-slate-200 pt-2">
                    <span>Total Tagihan:</span>
                    <span className="text-base text-ink">{formatIDR(totals.total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Button
                    variant="primary"
                    className="w-full h-12 text-sm font-bold shadow-md"
                    onClick={handleSendToKitchen}
                    disabled={cartLines.length === 0 || isSubmitting}
                  >
                    <ChefHat size={18} className="mr-1.5" />
                    Kirim ke Dapur ({currentStaff.name})
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-11 text-xs font-bold"
                    onClick={() => setIsPayModalOpen(true)}
                    disabled={cartLines.length === 0 || isSubmitting}
                  >
                    <CreditCard size={15} className="mr-1.5" />
                    Bayar di Tempat (Pay at Table)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY ACTIVE ORDERS */}
        {activeTab === "my-orders" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Daftar Pesanan Saya ({currentStaff.name})
                </h3>
                <p className="text-xs text-ink/60 mt-0.5">
                  Memantau status memasak di dapur untuk semua pesanan yang Anda catat hari ini.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 text-xs font-bold">
                {myActiveOrders.length} Pesanan Aktif
              </span>
            </div>

            {myActiveOrders.length === 0 ? (
              <div className="rounded-2xl border border-ink/10 bg-white p-12 text-center shadow-sm">
                <ClipboardList size={36} className="mx-auto text-ink/30 mb-3" />
                <p className="font-bold text-sm text-ink">Belum Ada Pesanan Aktif</p>
                <p className="text-xs text-ink/50 mt-1 max-w-md mx-auto">
                  Semua pesanan yang Anda kirimkan ke dapur akan muncul di sini dengan notifikasi siap saji real-time.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setActiveTab("order")}
                >
                  <Plus size={14} className="mr-1" />
                  Mulai Catat Pesanan Baru
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myActiveOrders.map((ord) => {
                  const minutesAgo = Math.max(0, Math.floor((Date.now() - ord.createdAt) / 60000));
                  const isReady = ord.status === "siap";

                  return (
                    <div
                      key={ord.no}
                      className={cn(
                        "rounded-2xl border p-4 bg-white shadow-sm flex flex-col justify-between transition-all",
                        isReady
                          ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-50/40 shadow-md"
                          : "border-ink/10",
                      )}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold bg-ink text-counterlime px-1.5 py-0.5 rounded">
                                #{ord.no}
                              </span>
                              <span className="font-display font-bold text-sm text-ink">
                                {ord.tableName || `Meja ${ord.tableNumber}`}
                              </span>
                            </div>
                            <p className="text-xs text-ink/60 mt-0.5">
                              {ord.customerName} · {ord.guests || 2} Tamu
                            </p>
                          </div>

                          {/* Cooking Status Badge */}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs",
                              isReady
                                ? "bg-emerald-600 text-white animate-pulse"
                                : ord.status === "memasak"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-ink/70",
                            )}
                          >
                            {isReady ? (
                              <>
                                <Sparkles size={13} />
                                SIAP SAJI!
                              </>
                            ) : ord.status === "memasak" ? (
                              <>
                                <Flame size={13} />
                                Dimasak
                              </>
                            ) : (
                              <>
                                <Clock size={13} />
                                Antre
                              </>
                            )}
                          </span>
                        </div>

                        {/* Items List */}
                        <div className="rounded-xl bg-mineral/40 p-2.5 space-y-1 text-xs">
                          {ord.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                              <span className="text-ink font-medium">
                                <strong className="text-ink font-bold">{it.qty}x</strong> {it.name}
                                {it.note && (
                                  <span className="block text-[10px] text-ink/50 italic">
                                    catatan: {it.note}
                                  </span>
                                )}
                              </span>
                              <span className="text-ink/60 text-[11px]">
                                {formatIDR(it.price * it.qty)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-ink/50">Total: </span>
                          <strong className="text-ink font-bold font-display">
                            {formatIDR(ord.total)}
                          </strong>
                        </div>

                        {isReady ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            onClick={() => {
                              updateOrderStatus(ord.no, "sudah-dibayar");
                              toast.success(`Pesanan #${ord.no} diantar & selesai!`);
                            }}
                          >
                            <Check size={14} className="mr-1" />
                            Selesai Diantar
                          </Button>
                        ) : (
                          <span className="text-[11px] text-ink/50 flex items-center gap-1 font-mono">
                            <Clock size={12} />
                            {minutesAgo === 0 ? "Baru masuk" : `${minutesAgo} mnt lalu`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FLOOR & TABLE MAP OVERVIEW */}
        {activeTab === "floor-map" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Denah & Distribusi Meja Pelayan
                </h3>
                <p className="text-xs text-ink/60 mt-0.5">
                  Melihat seluruh meja restoran beserta penanggung jawab pelayan secara real-time.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Kosong
                </span>
                <span className="flex items-center gap-1 text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-600" />
                  Terisi
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tables.map((t) => {
                const activeOrd = activeOrdersByTable.get(t.id);
                const isOccupied = !!activeOrd;
                const isMine =
                  activeOrd &&
                  (activeOrd.waiterId === currentStaff.id ||
                    activeOrd.waiterName === currentStaff.name);

                return (
                  <div
                    key={t.id}
                    className={cn(
                      "rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all",
                      isOccupied
                        ? isMine
                          ? "bg-emerald-50/80 border-emerald-300"
                          : "bg-amber-50/80 border-amber-300"
                        : "bg-white border-ink/10",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-bold text-sm text-ink">{t.name}</h4>
                        <span className="text-xs text-ink/50 font-medium">Area {t.area}</span>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-bold",
                            isOccupied
                              ? isMine
                                ? "bg-emerald-200 text-emerald-950"
                                : "bg-amber-200 text-amber-950"
                              : "bg-emerald-100 text-emerald-800",
                          )}
                        >
                          {isOccupied ? "Terisi" : "Kosong"}
                        </span>
                        <span className="text-xs text-ink/60">{t.seats} Kursi</span>
                      </div>

                      {isOccupied && activeOrd && (
                        <div className="mt-3 rounded-xl bg-white/90 p-2.5 border border-ink/10 space-y-1 text-xs">
                          <p className="font-bold text-ink">
                            Order #{activeOrd.no} · {activeOrd.customerName}
                          </p>
                          <p className="text-ink/60 text-[11px]">
                            Ditangani:{" "}
                            <strong className="text-ink">
                              {activeOrd.waiterName || "Tamu"}
                            </strong>
                          </p>
                          <p className="text-ink/60 text-[11px]">
                            Total: <strong>{formatIDR(activeOrd.total)}</strong> ({activeOrd.itemCount} item)
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-100">
                      <Button
                        variant={isOccupied ? "outline" : "primary"}
                        size="sm"
                        className="w-full text-xs font-bold"
                        onClick={() => {
                          setSelectedTableId(t.id);
                          setActiveTab("order");
                        }}
                      >
                        {isOccupied ? "Buka & Tambah Menu" : "Catat Pesanan Meja Ini"}
                        <ArrowRight size={13} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pay at Table Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-ink">
                  Bayar Langsung di {selectedTable?.name}
                </h3>
                <p className="text-xs text-ink/50">
                  Petugas Pelayan: <strong>{currentStaff.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="rounded-lg p-1 text-ink/40 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-mineral/50 p-3 text-center space-y-1">
              <span className="text-xs text-ink/60">Total yang harus dibayar:</span>
              <p className="font-display text-2xl font-bold text-ink">
                {formatIDR(totals.total)}
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayMethod("tunai")}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all",
                  payMethod === "tunai"
                    ? "bg-ink text-white border-ink shadow-sm"
                    : "bg-white text-ink border-slate-200 hover:bg-slate-50",
                )}
              >
                <Banknote size={16} />
                Tunai (Cash)
              </button>
              <button
                type="button"
                onClick={() => setPayMethod("qris")}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all",
                  payMethod === "qris"
                    ? "bg-ink text-white border-ink shadow-sm"
                    : "bg-white text-ink border-slate-200 hover:bg-slate-50",
                )}
              >
                <QrCode size={16} />
                QRIS Dinamis
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsPayModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                className="flex-1 font-bold"
                onClick={handlePayAtTable}
                disabled={isSubmitting}
              >
                Konfirmasi Lunas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode & Table QR Scanner Modal for Waiter */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Pindai Menu atau QR Meja"
        subtitle="Arahkan ke barcode menu untuk menambah pesanan, atau QR meja untuk beralih meja"
        onProduct={(item) => {
          handleAddItem(item.id);
          toast.success(`${item.name} Ditambahkan ke Pesanan Meja`);
          setScannerOpen(false);
        }}
        onScanCode={(code) => {
          const tableMatch = code.match(/order\/([a-zA-Z0-9_-]+)/) || code.match(/^meja[ -]?(\d+)$/i);
          if (tableMatch) {
            const slugOrNum = tableMatch[1].toLowerCase();
            const matched = tables.find(
              (t) =>
                t.name.toLowerCase().replace(/\s+/g, "-") === slugOrNum ||
                t.name.toLowerCase().includes(slugOrNum)
            );
            if (matched) {
              setSelectedTableId(matched.id);
              toast.success(`Beralih ke ${matched.name}`, {
                description: `Area ${matched.area || "Utama"} aktif.`,
              });
            }
          }
          setScannerOpen(false);
        }}
      />
    </div>
  );
}
