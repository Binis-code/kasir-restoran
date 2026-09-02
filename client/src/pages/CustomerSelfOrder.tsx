import { useMemo, useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import QRCode from "qrcode";
import {
  Utensils,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  Minus,
  ArrowLeft,
  QrCode,
  ChefHat,
  Sparkles,
  MapPin,
  Smartphone,
  ChevronDown,
} from "lucide-react";
import { usePos, type CartLine } from "../components/PosContext";
import { formatIDR } from "../data/menu";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/cn";
import { toast } from "sonner";

export default function CustomerSelfOrder() {
  const { tableId: paramTableId } = useParams<{ tableId?: string }>();
  const [, setLocation] = useLocation();
  const {
    products,
    categories,
    tables,
    orders,
    createSelfOrder,
    taxEnabled,
    taxRate,
    serviceChargeEnabled,
    serviceChargeRate,
  } = usePos();

  // Selected table state (defaults to URL param or first table)
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    if (paramTableId) {
      const clean = decodeURIComponent(paramTableId).toLowerCase();
      const found = tables.find(
        (t) =>
          t.id.toLowerCase() === clean ||
          t.name.toLowerCase().replace(/\s+/g, "-") === clean ||
          t.name.toLowerCase() === clean ||
          t.name.toLowerCase().includes(clean),
      );
      if (found) return found.id;
    }
    return tables[0]?.id || "t1";
  });

  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);

  // Sync if URL param changes
  useEffect(() => {
    if (paramTableId) {
      const clean = decodeURIComponent(paramTableId).toLowerCase();
      const found = tables.find(
        (t) =>
          t.id.toLowerCase() === clean ||
          t.name.toLowerCase().replace(/\s+/g, "-") === clean ||
          t.name.toLowerCase() === clean ||
          t.name.toLowerCase().includes(clean),
      );
      if (found) setSelectedTableId(found.id);
    }
  }, [paramTableId, tables]);

  // Find active table object
  const currentTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0];
  }, [selectedTableId, tables]);

  const tableName = currentTable?.name || "Meja 01";
  const tableNum = currentTable ? parseInt(currentTable.name.match(/\d+/)?.[0] || "1", 10) : 1;

  // Customer local state
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem("kasa_self_customer_name") || "";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [qrisDataUrl, setQrisDataUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOrderNo, setActiveOrderNo] = useState<number | null>(() => {
    const saved = localStorage.getItem(`kasa_active_order_${tableNum}`);
    return saved ? parseInt(saved, 10) : null;
  });
  // Save customer name in localStorage
  useEffect(() => {
    if (customerName) {
      localStorage.setItem("kasa_self_customer_name", customerName);
    }
  }, [customerName]);

  // Track active submitted order status in real time
  const currentLiveOrder = useMemo(() => {
    if (!activeOrderNo) return null;
    return orders.find((o) => o.no === activeOrderNo) || null;
  }, [activeOrderNo, orders]);

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

  // Cart calculations
  const cartSummary = useMemo(() => {
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

  // Generate real QRIS QR image when modal opens
  useEffect(() => {
    if (!isQrisModalOpen) {
      setQrisDataUrl("");
      return;
    }
    const qrisPayload = `00020101021226670014ID.GO.QRIS.WWW01189360099800000000000215ID1020304958001520458125303360540${cartSummary.total}5802ID5912KASA RESTO6007JAKARTA6304`;
    QRCode.toDataURL(qrisPayload, {
      width: 300,
      margin: 1,
      color: { dark: "#14211F", light: "#FFFFFF" },
    })
      .then(setQrisDataUrl)
      .catch(console.error);
  }, [isQrisModalOpen, cartSummary.total]);

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

  // Submit order handler (Direct to Kitchen)
  const handleConfirmOrder = async (choice: "paid-now" | "pay-later") => {
    const finalCustomerName = customerName.trim() || `Tamu ${tableName}`;

    if (cartLines.length === 0) {
      toast.error("Keranjang pesanan masih kosong");
      return;
    }

    if (choice === "paid-now") {
      setIsQrisModalOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createSelfOrder({
        tableId: currentTable?.id || `table-${tableNum}`,
        tableName,
        tableNumber: tableNum,
        customerName: `${finalCustomerName} (Self-Order Meja)`,
        lines: cartLines,
        paymentChoice: "pay-later",
      });

      setActiveOrderNo(created.no);
      localStorage.setItem(`kasa_active_order_${tableNum}`, String(created.no));
      setCartLines([]);
      setIsCartOpen(false);
      toast.success("Pesanan langsung diteruskan ke Dapur!", {
        description: `Nomor Antrean: #${created.no} · ${tableName} · Makanan akan diantar langsung ke meja Anda.`,
      });
    } catch (err) {
      toast.error("Gagal mengirim pesanan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateQrisSuccess = async () => {
    const finalCustomerName = customerName.trim() || `Tamu ${tableName}`;
    try {
      setIsSubmitting(true);
      const created = await createSelfOrder({
        tableId: currentTable?.id || `table-${tableNum}`,
        tableName,
        tableNumber: tableNum,
        customerName: `${finalCustomerName} (Self-Order Meja)`,
        lines: cartLines,
        paymentChoice: "paid-now",
        method: "qris",
      });

      setActiveOrderNo(created.no);
      localStorage.setItem(`kasa_active_order_${tableNum}`, String(created.no));
      setCartLines([]);
      setIsCartOpen(false);
      setIsQrisModalOpen(false);
      toast.success("Pembayaran QRIS Berhasil!", {
        description: `Order #${created.no} lunas & langsung mulai dimasak di dapur. Makanan akan diantar ke ${tableName}.`,
      });
    } catch (err) {
      toast.error("Gagal memproses pembayaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mineral/30 text-ink pb-28">
      {/* Header Sticky */}
      <header className="sticky top-0 z-30 bg-ink text-white shadow-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Kembali ke Layar Kasir"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-counterlime animate-pulse" />
                <h1 className="text-sm font-bold tracking-tight text-white">
                  KASA · Menu Meja Pelanggan
                </h1>
              </div>

              {/* Table Selector Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setIsTableSelectorOpen(true)}
                className="flex items-center gap-1 text-xs text-counterlime font-bold hover:underline mt-0.5"
              >
                <MapPin size={12} />
                <span>{tableName} ({currentTable?.area || "Restoran"})</span>
                <ChevronDown size={12} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeOrderNo && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("live-order-tracker");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-1.5 rounded-full bg-counterlime px-3 py-1 text-xs font-bold text-ink shadow-sm animate-pulse"
              >
                <Clock size={13} />
                <span>Status #{activeOrderNo}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-lg px-4 pt-4 space-y-3.5">
        {/* Step Guide Banner (Direct Table Service Flow) */}
        <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-ink/10 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-counterlime/40 text-ink flex items-center justify-center border border-counterlime">
            <Smartphone size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-ink">
              Pesan Langsung dari Meja Anda
            </p>
            <p className="text-[11px] text-ink/60 mt-0.5 leading-snug">
              Pilih menu ➔ Pesanan langsung terhubung ke Dapur ➔ Makanan diantar langsung ke meja tanpa harus antre kasir.
            </p>
          </div>
        </div>

        {/* Customer Identity & Table Card */}
        <section className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="customer-name-input"
              className="block text-xs font-bold uppercase tracking-wider text-ink/70"
            >
              Nama Tamu di {tableName}:
            </label>
            <button
              type="button"
              onClick={() => setIsTableSelectorOpen(true)}
              className="text-[11px] font-bold text-ink/60 hover:text-ink underline"
            >
              Ganti Meja
            </button>
          </div>

          <div className="flex gap-2">
            <input
              id="customer-name-input"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ketik Nama Anda (contoh: Bpk. Gunawan)..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-ink focus:border-counterlime focus:bg-white focus:outline-none focus:ring-2 focus:ring-counterlime/30"
            />
            {customerName && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 px-2 py-1">
                <CheckCircle2 size={16} />
              </span>
            )}
          </div>
        </section>

        {/* Live Order Tracker (Direct Real-time Integration with Kitchen KDS) */}
        {currentLiveOrder && (
          <section
            id="live-order-tracker"
            className="rounded-2xl border-2 border-counterlime bg-white p-4 shadow-md space-y-3 animate-in fade-in duration-300"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-counterlime text-ink">
                  <ChefHat size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-ink">
                    Pesanan #{currentLiveOrder.no} ({tableName})
                  </h2>
                  <p className="text-[11px] text-ink/60">
                    Atas nama <strong className="text-ink">{currentLiveOrder.customerName}</strong>
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs",
                  currentLiveOrder.status === "memasak" && "bg-blue-600 text-white",
                  currentLiveOrder.status === "siap" && "bg-emerald-600 text-white animate-pulse",
                  currentLiveOrder.status === "sudah-dibayar" && "bg-counterlime text-ink",
                  currentLiveOrder.status === "disimpan" && "bg-slate-100 text-slate-800",
                )}
              >
                {currentLiveOrder.status === "memasak" ? "🍳 Sedang Dimasak Dapur" :
                 currentLiveOrder.status === "siap" ? "✨ SIAP DIANTAR KE MEJA!" :
                 currentLiveOrder.status === "sudah-dibayar" ? "✅ Selesai / Lunas" : "⏳ Antrean Dapur"}
              </span>
            </div>

            {/* Special Ready Notification Banner */}
            {currentLiveOrder.status === "siap" && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-emerald-950 flex items-start gap-2.5">
                <Sparkles size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">
                    Makanan Anda Sudah Selesai Dimasak!
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Pelayan / Food Runner sedang mengantarkan hidangan hangat Anda langsung ke <strong>{tableName}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Step Timeline */}
            <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold pt-1">
              <div className="flex flex-col items-center gap-1">
                <div className="h-2 w-full rounded-full bg-counterlime" />
                <span className="text-ink font-bold">1. Diterima</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "h-2 w-full rounded-full",
                    ["memasak", "siap", "sudah-dibayar"].includes(currentLiveOrder.status)
                      ? "bg-counterlime"
                      : "bg-slate-200",
                  )}
                />
                <span
                  className={
                    ["memasak", "siap", "sudah-dibayar"].includes(currentLiveOrder.status)
                      ? "text-ink font-bold"
                      : "text-slate-400"
                  }
                >
                  2. Dimasak
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "h-2 w-full rounded-full",
                    ["siap", "sudah-dibayar"].includes(currentLiveOrder.status)
                      ? "bg-counterlime"
                      : "bg-slate-200",
                  )}
                />
                <span
                  className={
                    ["siap", "sudah-dibayar"].includes(currentLiveOrder.status)
                      ? "text-ink font-bold"
                      : "text-slate-400"
                  }
                >
                  3. Siap Diantar
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "h-2 w-full rounded-full",
                    currentLiveOrder.status === "sudah-dibayar" ? "bg-counterlime" : "bg-slate-200",
                  )}
                />
                <span
                  className={
                    currentLiveOrder.status === "sudah-dibayar"
                      ? "text-ink font-bold"
                      : "text-slate-400"
                  }
                >
                  4. Selesai
                </span>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="rounded-xl bg-slate-50 p-2.5 text-xs space-y-1">
              <div className="font-semibold text-ink/70 mb-1">Rincian Menu ({currentLiveOrder.itemCount} item):</div>
              {currentLiveOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between text-ink/80">
                  <span>
                    <strong>{it.qty}x</strong> {it.name}
                    {it.note && <span className="block text-[10px] text-ink/50 italic">({it.note})</span>}
                  </span>
                  <span className="font-medium">{formatIDR(it.price * it.qty)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-1.5 font-bold text-ink">
                <span>Total Tagihan:</span>
                <span className="text-emerald-700 font-display">{formatIDR(currentLiveOrder.total)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-ink/60">
                {currentLiveOrder.paymentChoice === "paid-now" || currentLiveOrder.status === "sudah-dibayar"
                  ? "✅ Lunas via QRIS Mandiri"
                  : "💳 Bayar Nanti di Meja (Pay Later)"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveOrderNo(null);
                  localStorage.removeItem(`kasa_active_order_${tableNum}`);
                }}
                className="text-xs text-ink/70 underline hover:text-ink font-semibold"
              >
                + Tambah Pesanan Baru
              </button>
            </div>
          </section>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari makanan, kopi, camilan..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-ink placeholder:text-ink/40 focus:border-counterlime focus:outline-none focus:ring-2 focus:ring-counterlime/30 shadow-xs"
          />
        </div>

        {/* Categories Bar */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {["Semua", ...categories.map((c) => c.name)].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[40px]",
                selectedCategory === cat
                  ? "bg-ink text-counterlime shadow-sm"
                  : "bg-white text-ink/70 border border-slate-200 hover:border-ink/20",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredProducts.map((product) => {
            const inCart = cartLines.find((l) => l.itemId === product.id);
            return (
              <article
                key={product.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex gap-3">
                  {/* Item Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {product.badge && (
                      <span className="absolute left-1 top-1 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-ink shadow-sm">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold leading-snug text-ink">
                        {product.name}
                      </h3>
                      <p className="line-clamp-2 mt-0.5 text-[11px] text-ink/55">
                        {product.description || "Menu favorit racikan segar."}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-ink">
                        {formatIDR(product.price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cart Action Buttons */}
                <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-2.5">
                  {inCart ? (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => handleDecreaseItem(product.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink shadow-sm active:scale-95"
                        aria-label="Kurangi"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-ink">
                        {inCart.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddItem(product.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-counterlime text-ink shadow-sm active:scale-95"
                        aria-label="Tambah"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAddItem(product.id)}
                      className="h-8 gap-1.5 rounded-xl bg-counterlime px-3.5 text-xs font-bold text-ink hover:bg-counterlime/90 active:scale-95 shadow-xs"
                    >
                      <Plus size={14} />
                      Tambah
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <Utensils size={36} className="mx-auto text-ink/30 mb-2" />
            <p className="text-sm font-medium text-ink/60">
              Tidak ada menu yang sesuai dengan pencarian Anda.
            </p>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartSummary.count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-ink px-5 py-3.5 text-white shadow-xl transition-transform active:scale-[0.99] ring-2 ring-counterlime/40"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-counterlime text-ink font-bold text-sm shadow-xs">
                  {cartSummary.count}
                </span>
                <div className="text-left">
                  <div className="text-xs text-white/70">Pesanan {tableName}</div>
                  <div className="font-display text-base font-bold text-counterlime">
                    {formatIDR(cartSummary.total)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span>Lihat Keranjang</span>
                <ShoppingBag size={18} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer / Bottom Sheet Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div>
                <h2 className="text-base font-bold text-ink">Pesanan {tableName}</h2>
                <p className="text-xs text-ink/60">
                  Nama Pemesan: <strong className="text-ink">{customerName || "Tamu"}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-ink/60 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Drawer Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartLines.map((line) => {
                const prod = products.find((p) => p.id === line.itemId);
                if (!prod) return null;
                return (
                  <div key={line.itemId} className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-ink">{prod.name}</div>
                      <div className="font-display font-bold text-sm text-ink">
                        {formatIDR(prod.price * line.qty)}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <input
                        type="text"
                        value={line.note || ""}
                        onChange={(e) => handleSetNote(line.itemId, e.target.value)}
                        placeholder="Catatan: less sugar, pedas, dll."
                        className="mr-3 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-counterlime"
                      />

                      <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleDecreaseItem(line.itemId)}
                          className="flex h-6 w-6 items-center justify-center rounded text-ink hover:bg-slate-100"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-4 text-center text-xs font-bold">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => handleAddItem(line.itemId)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-counterlime text-ink"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Price Breakdown */}
              <div className="rounded-xl bg-slate-100/70 p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-ink/70">
                  <span>Subtotal ({cartSummary.count} item):</span>
                  <span>{formatIDR(cartSummary.rawSubtotal)}</span>
                </div>
                {taxEnabled && (
                  <div className="flex justify-between text-ink/70">
                    <span>PPN ({taxRate}%):</span>
                    <span>{formatIDR(cartSummary.tax)}</span>
                  </div>
                )}
                {serviceChargeEnabled && (
                  <div className="flex justify-between text-ink/70">
                    <span>Biaya Layanan ({serviceChargeRate}%):</span>
                    <span>{formatIDR(cartSummary.serviceCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 font-display text-sm font-bold text-ink">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-700">{formatIDR(cartSummary.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment & Dispatch Choices */}
            <div className="border-t border-slate-100 p-4 space-y-2.5 bg-white rounded-b-3xl">
              <Button
                type="button"
                onClick={() => handleConfirmOrder("pay-later")}
                disabled={isSubmitting}
                className="h-12 w-full gap-2 rounded-xl bg-counterlime font-bold text-ink hover:bg-counterlime/90 text-sm shadow-md"
              >
                <ChefHat size={18} />
                Kirim ke Dapur Sekarang (Bayar Nanti di Meja)
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleConfirmOrder("paid-now")}
                disabled={isSubmitting}
                className="h-11 w-full gap-2 rounded-xl border-slate-300 font-bold text-ink text-xs hover:bg-slate-50"
              >
                <QrCode size={16} />
                Bayar Langsung via QRIS Mandiri
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QRIS Interactive Payment Modal */}
      {isQrisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-counterlime text-ink">
                  <QrCode size={16} />
                </span>
                <span className="text-sm font-bold text-ink">QRIS Mandiri di {tableName}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsQrisModalOpen(false)}
                className="text-ink/50 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-ink/60">
              Scan barcode dengan BCA, GoPay, OVO, ShopeePay, atau DANA.
            </p>

            {/* QR Visual */}
            <div className="my-4 mx-auto flex h-56 w-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/20 bg-white p-3 shadow-inner">
              {qrisDataUrl ? (
                <img
                  src={qrisDataUrl}
                  alt="QRIS Interaktif"
                  className="h-44 w-44 rounded-xl object-contain bg-white"
                />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center">
                  <span className="text-xs text-ink/40 animate-pulse">Membuat QRIS...</span>
                </div>
              )}
              <span className="mt-1 text-[10px] font-bold tracking-widest text-ink/70">
                NMID: ID1020304958 · QRIS NASIONAL
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-ink/60">Total Pembayaran:</div>
              <div className="font-display text-xl font-bold text-emerald-700">
                {formatIDR(cartSummary.total)}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button
                type="button"
                onClick={handleSimulateQrisSuccess}
                disabled={isSubmitting}
                className="h-11 w-full gap-2 rounded-xl bg-counterlime font-bold text-ink hover:bg-counterlime/90 text-sm shadow-md"
              >
                <CheckCircle2 size={16} />
                Konfirmasi Pembayaran Selesai
              </Button>
              <button
                type="button"
                onClick={() => setIsQrisModalOpen(false)}
                className="text-xs font-semibold text-ink/50 hover:text-ink"
              >
                Batal / Pilih Metode Lain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Selector Modal (If customer wants to change table) */}
      {isTableSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-counterlime text-ink">
                  <MapPin size={16} />
                </span>
                <h3 className="text-sm font-bold text-ink">Pilih / Ganti Nomor Meja Anda</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTableSelectorOpen(false)}
                className="text-ink/50 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink/60">
              Pastikan nomor meja sesuai dengan stiker barcode yang Anda tempati di restoran.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {tables.map((t) => {
                const isSelected = t.id === selectedTableId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTableId(t.id);
                      setIsTableSelectorOpen(false);
                      toast.success(`Meja aktif: ${t.name} (${t.area})`);
                    }}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all",
                      isSelected
                        ? "bg-ink text-white border-ink ring-2 ring-counterlime/50 shadow-md"
                        : "bg-mineral/40 text-ink border-ink/10 hover:bg-white hover:border-ink/30",
                    )}
                  >
                    <p className="text-xs font-bold">{t.name}</p>
                    <p className="text-[10px] opacity-60 mt-0.5">{t.area} · {t.seats} Kursi</p>
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              className="w-full text-xs font-bold"
              onClick={() => setIsTableSelectorOpen(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
