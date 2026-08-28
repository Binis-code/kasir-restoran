import { useState } from "react";
import { CheckCircle2, ChefHat, Clock, Flame, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { Button } from "../components/ui/Button";
import { usePos, type OrderRow, type OrderStatus } from "../components/PosContext";
import { cn } from "../lib/cn";

export default function Kitchen() {
  const { orders, updateOrderStatus } = usePos();
  const [filter, setFilter] = useState<"SEMUA" | OrderStatus>("SEMUA");

  const kitchenOrders = orders.filter(
    (o) => o.status === "disimpan" || o.status === "memasak" || o.status === "siap",
  );

  const filteredOrders = kitchenOrders.filter((o) => {
    if (filter === "SEMUA") return true;
    return o.status === filter;
  });

  const countWaiting = orders.filter((o) => o.status === "disimpan").length;
  const countCooking = orders.filter((o) => o.status === "memasak").length;
  const countReady = orders.filter((o) => o.status === "siap").length;

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

  return (
    <div className="flex min-h-screen flex-col bg-mineral">
      <Header title="Layar Dapur & Bar (KDS)" />
      <div className="flex-1 p-5 md:p-8">
        <div className="-mt-1 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink/65">
              Antrean tiket pesanan makanan dan minuman real-time untuk koki & barista.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("SEMUA")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                filter === "SEMUA"
                  ? "bg-ink text-white shadow-xs"
                  : "bg-white border border-ink/15 text-ink/70 hover:bg-ink/5",
              )}
            >
              Semua ({kitchenOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("disimpan")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5",
                filter === "disimpan"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-white border border-ink/15 text-ink/70 hover:bg-ink/5",
              )}
            >
              <Clock size={13} /> Menunggu ({countWaiting})
            </button>
            <button
              type="button"
              onClick={() => setFilter("memasak")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5",
                filter === "memasak"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-ink/15 text-ink/70 hover:bg-ink/5",
              )}
            >
              <Flame size={13} /> Dimasak ({countCooking})
            </button>
            <button
              type="button"
              onClick={() => setFilter("siap")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5",
                filter === "siap"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white border border-ink/15 text-ink/70 hover:bg-ink/5",
              )}
            >
              <CheckCircle2 size={13} /> Siap Saji ({countReady})
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
            <ChefHat size={40} className="mx-auto text-ink/30 mb-3" />
            <h3 className="font-display text-lg font-bold text-ink">
              Tidak Ada Tiket Masak Aktif
            </h3>
            <p className="mt-1 text-xs text-ink/55">
              Semua pesanan makanan & minuman saat ini sudah siap atau telah selesai disajikan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOrders.map((order) => {
              const minutesAgo = Math.max(1, Math.round((Date.now() - order.createdAt) / 60000));
              const isUrgent = minutesAgo > 15 && order.status !== "siap";

              return (
                <div
                  key={order.no}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border bg-white shadow-sm overflow-hidden transition-all",
                    order.status === "siap"
                      ? "border-emerald-500 ring-2 ring-emerald-500/30"
                      : order.status === "memasak"
                      ? "border-blue-500 ring-1 ring-blue-500/30"
                      : isUrgent
                      ? "border-amber-500 ring-2 ring-amber-500/40"
                      : "border-ink/15",
                  )}
                >
                  <div>
                    {/* Ticket Header */}
                    <div
                      className={cn(
                        "p-4 border-b flex items-center justify-between",
                        order.status === "siap"
                          ? "bg-emerald-50 border-emerald-100"
                          : order.status === "memasak"
                          ? "bg-blue-50 border-blue-100"
                          : "bg-mineral/40 border-ink/10",
                      )}
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-ink/50">
                          #{order.no}
                        </span>
                        <h3 className="font-display text-base font-bold text-ink">
                          {order.orderType === "meja"
                            ? order.tableName || `Meja ${order.tableNumber}`
                            : "Bawa Pulang (Takeaway)"}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                            order.status === "siap"
                              ? "bg-emerald-600 text-white"
                              : order.status === "memasak"
                              ? "bg-blue-600 text-white"
                              : isUrgent
                              ? "bg-amber-600 text-white animate-pulse"
                              : "bg-amber-100 text-amber-800",
                          )}
                        >
                          <Clock size={11} /> {minutesAgo} mnt lalu
                        </span>
                      </div>
                    </div>

                    {/* Order Items with Notes */}
                    <div className="p-4 space-y-3">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="border-b border-dashed border-ink/10 pb-2.5 last:border-0 last:pb-0"
                          >
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-bold text-ink">
                                <span className="inline-block min-w-5 font-mono text-counterlime-dark">
                                  {item.qty}x
                                </span>{" "}
                                {item.name}
                              </p>
                            </div>
                            {item.note && (
                              <p className="mt-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 border border-amber-200/60 inline-block">
                                📝 Catatan: {item.note}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-ink/50 italic">
                          {order.itemCount} item dalam pesanan ini
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="p-4 pt-0">
                    <Button
                      size="sm"
                      className="w-full font-bold shadow-xs"
                      variant={order.status === "siap" ? "outline" : "primary"}
                      onClick={() => handleAdvanceStatus(order)}
                    >
                      {order.status === "disimpan" && (
                        <>
                          <Flame size={14} className="mr-1.5" />
                          Mulai Masak
                        </>
                      )}
                      {order.status === "memasak" && (
                        <>
                          <CheckCircle2 size={14} className="mr-1.5" />
                          Tandai Siap Saji
                        </>
                      )}
                      {order.status === "siap" && (
                        <>
                          <Utensils size={14} className="mr-1.5 text-emerald-600" />
                          Selesaikan Antar
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
