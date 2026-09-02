import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Utensils,
  QrCode,
  Smartphone,
  Store,
  Check,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { FocusModeHeader } from "../components/FocusModeHeader";
import { useAuth } from "../components/AuthContext";
import { Button } from "../components/ui/Button";
import { usePos, type OrderRow, type OrderStatus } from "../components/PosContext";
import { cn } from "../lib/cn";

export default function Kitchen() {
  const { currentStaff } = useAuth();
  const { orders, updateOrderStatus } = usePos();
  const [filter, setFilter] = useState<"SEMUA" | OrderStatus>("SEMUA");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [, setTick] = useState(0);

  // Live timer tick every 10 seconds for real-time elapsed time accuracy
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter active tickets in Kitchen and sort STRICT FIFO (First In First Out: oldest createdAt first)
  const kitchenOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "disimpan" || o.status === "memasak" || o.status === "siap")
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === "SEMUA") return kitchenOrders;
    return kitchenOrders.filter((o) => o.status === filter);
  }, [kitchenOrders, filter]);

  const countWaiting = kitchenOrders.filter((o) => o.status === "disimpan").length;
  const countCooking = kitchenOrders.filter((o) => o.status === "memasak").length;
  const countReady = kitchenOrders.filter((o) => o.status === "siap").length;

  const handleAdvanceStatus = async (order: OrderRow) => {
    try {
      let nextStatus: OrderStatus = "memasak";
      if (order.status === "disimpan") nextStatus = "memasak";
      else if (order.status === "memasak") nextStatus = "siap";
      else if (order.status === "siap") nextStatus = "sudah-dibayar";

      await updateOrderStatus(order.no, nextStatus);

      if (nextStatus === "memasak") {
        toast.info(`Pesanan #${order.no} mulai dimasak`);
      } else if (nextStatus === "siap") {
        toast.success(`Pesanan #${order.no} SIAP DISAJIKAN!`);
      } else {
        toast.success(`Pesanan #${order.no} selesai diantar`);
      }
    } catch {
      toast.error("Gagal memperbarui status pesanan dapur");
    }
  };

  const toggleItemCheck = (orderNo: number, idx: number) => {
    const key = `${orderNo}_${idx}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-mineral">
      <FocusModeHeader
        title="Layar Dapur (KDS)"
        subtitle={`Kepala Dapur: ${currentStaff.name} · Antrean Masak FIFO`}
        roleType="dapur"
        badgeCount={countWaiting}
      />

      <div className="flex-1 p-4 md:p-6 pb-24">
        {/* Top summary & filter bar */}
        <div className="-mt-1 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-counterlime text-ink font-bold">
              FIFO
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink">Urutan Datang Pertama (First-In First-Out)</h2>
              <p className="text-xs text-ink/60">
                Tiket otomatis berurutan dari pesanan paling awal masuk ke dapur.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilter("SEMUA")}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-bold transition",
                filter === "SEMUA"
                  ? "bg-ink text-counterlime shadow-sm"
                  : "bg-white border border-ink/15 text-ink/70 hover:bg-ink/5",
              )}
            >
              Semua ({kitchenOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("disimpan")}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-bold transition flex items-center gap-1.5",
                filter === "disimpan"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white border border-ink/15 text-ink/70 hover:bg-ink/5",
              )}
            >
              <Clock size={14} /> Antre ({countWaiting})
            </button>
            <button
              type="button"
              onClick={() => setFilter("memasak")}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-bold transition flex items-center gap-1.5",
                filter === "memasak"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-ink/15 text-ink/70 hover:bg-ink/5",
              )}
            >
              <Flame size={14} /> Dimasak ({countCooking})
            </button>
            <button
              type="button"
              onClick={() => setFilter("siap")}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-bold transition flex items-center gap-1.5",
                filter === "siap"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white border border-ink/15 text-ink/70 hover:bg-ink/5",
              )}
            >
              <CheckCircle2 size={14} /> Siap Saji ({countReady})
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink/20 bg-white p-12 text-center">
            <ChefHat size={44} className="mx-auto text-ink/30 mb-3" />
            <h3 className="font-display text-lg font-bold text-ink">
              Tidak Ada Tiket Masak Aktif
            </h3>
            <p className="mt-1 text-xs text-ink/55">
              Semua pesanan makanan & minuman saat ini sudah siap atau telah selesai disajikan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOrders.map((order, orderIndex) => {
              const minutesAgo = Math.max(0, Math.floor((Date.now() - order.createdAt) / 60000));
              const isUrgent = minutesAgo >= 15 && order.status !== "siap";
              const isMedium = minutesAgo >= 5 && minutesAgo < 15 && order.status !== "siap";

              const sourceLabel =
                order.source === "self-order"
                  ? "QR Self-Order"
                  : order.source === "waiter"
                  ? "Pelayan"
                  : "Kasir POS";

              const SourceIcon =
                order.source === "self-order"
                  ? QrCode
                  : order.source === "waiter"
                  ? Smartphone
                  : Store;

              return (
                <div
                  key={order.no}
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-200",
                    order.status === "siap"
                      ? "border-emerald-500 ring-2 ring-emerald-500/30"
                      : order.status === "memasak"
                      ? "border-blue-500 ring-2 ring-blue-500/20"
                      : isUrgent
                      ? "border-rose-500 ring-2 ring-rose-500/40"
                      : "border-ink/15",
                  )}
                >
                  <div>
                    {/* Ticket Header */}
                    <div
                      className={cn(
                        "p-3.5 border-b flex items-start justify-between",
                        order.status === "siap"
                          ? "bg-emerald-50/90 border-emerald-100"
                          : order.status === "memasak"
                          ? "bg-blue-50/90 border-blue-100"
                          : isUrgent
                          ? "bg-rose-50/90 border-rose-100"
                          : "bg-slate-50 border-ink/10",
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-xs font-bold text-counterlime">
                            #{order.no}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-ink/50">
                            Urutan ke-{orderIndex + 1}
                          </span>
                        </div>

                        <h3 className="font-display text-base font-bold text-ink mt-1">
                          {order.orderType === "meja"
                            ? order.tableName || `Meja ${order.tableNumber}`
                            : "Bawa Pulang (Takeaway)"}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-xs font-semibold text-ink/80">
                            {order.customerName || "Pelanggan"}
                          </span>
                          <span className="text-[10px] text-ink/40">•</span>
                          <span className="inline-flex items-center gap-1 rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-ink/70 border border-slate-200">
                            <SourceIcon size={10} />
                            {sourceLabel}
                          </span>
                          {order.waiterName && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 text-[10px] font-bold shadow-2xs">
                              <UserCheck size={10} className="text-emerald-700" />
                              Pelayan: {order.waiterName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Timer Pill */}
                      <div className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-xs",
                            order.status === "siap"
                              ? "bg-emerald-600 text-white"
                              : isUrgent
                              ? "bg-rose-600 text-white animate-pulse"
                              : isMedium
                              ? "bg-amber-500 text-white"
                              : "bg-emerald-100 text-emerald-900",
                          )}
                        >
                          <Clock size={12} />
                          {minutesAgo === 0 ? "Baru saja" : `${minutesAgo} mnt`}
                        </span>
                        {isUrgent && (
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-rose-600">
                            <AlertTriangle size={11} />
                            Prioritas!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items Checklist */}
                    <div className="p-3.5 space-y-2.5">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => {
                          const itemKey = `${order.no}_${idx}`;
                          const isDone = Boolean(checkedItems[itemKey]);

                          return (
                            <div
                              key={idx}
                              onClick={() => toggleItemCheck(order.no, idx)}
                              className={cn(
                                "cursor-pointer rounded-xl border p-2.5 transition-all select-none",
                                isDone
                                  ? "bg-slate-100/70 border-slate-200 opacity-60 line-through text-ink/40"
                                  : "bg-white border-slate-200/80 hover:border-counterlime text-ink shadow-xs",
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "flex h-5 w-5 items-center justify-center rounded-md text-xs font-bold transition-all",
                                      isDone
                                        ? "bg-emerald-600 text-white"
                                        : "border border-slate-300 bg-white text-transparent",
                                    )}
                                  >
                                    <Check size={13} />
                                  </span>
                                  <span className="font-bold text-xs">
                                    <span className="font-mono text-counterlime-dark mr-1">
                                      {item.qty}x
                                    </span>
                                    {item.name}
                                  </span>
                                </div>
                              </div>

                              {item.note && (
                                <p className="mt-1.5 ml-7 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200/60 inline-block not-italic">
                                  📝 {item.note}
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-ink/50 italic py-2">
                          {order.itemCount} item dalam pesanan ini
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stage Action Button */}
                  <div className="p-3.5 pt-0">
                    <Button
                      size="sm"
                      className="h-11 w-full font-bold shadow-xs rounded-xl text-xs gap-2"
                      variant={order.status === "siap" ? "outline" : "primary"}
                      onClick={() => handleAdvanceStatus(order)}
                    >
                      {order.status === "disimpan" && (
                        <>
                          <Flame size={15} />
                          Mulai Masak (Step 1)
                        </>
                      )}
                      {order.status === "memasak" && (
                        <>
                          <CheckCircle2 size={15} />
                          Tandai Siap Saji (Step 2)
                        </>
                      )}
                      {order.status === "siap" && (
                        <>
                          <Utensils size={15} className="text-emerald-600" />
                          Selesaikan Antar ke Tamu
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
