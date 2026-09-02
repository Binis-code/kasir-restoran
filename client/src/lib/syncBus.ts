export type SyncEventType =
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "TABLE_UPDATED"
  | "PRODUCTS_UPDATED"
  | "SHIFT_CHANGED"
  | "CASH_MOVEMENT_CREATED"
  | "CASH_MOVEMENT_DELETED"
  | "CATEGORY_CREATED"
  | "CATEGORY_UPDATED"
  | "CATEGORY_DELETED";

export type SyncMessage = {
  type: SyncEventType;
  payload?: any;
  senderId: string;
  timestamp: number;
};

const CHANNEL_NAME = "kasa_realtime_sync_channel";
const senderId = `node_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn("BroadcastChannel initialization failed:", e);
  }
}

type Listener = (msg: SyncMessage) => void;
const listeners = new Set<Listener>();

if (broadcastChannel) {
  broadcastChannel.onmessage = (event: MessageEvent<SyncMessage>) => {
    if (event.data && event.data.senderId !== senderId) {
      for (const fn of listeners) {
        try {
          fn(event.data);
        } catch (err) {
          console.error("Error in sync listener:", err);
        }
      }
    }
  };
} else if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "kasa_storage_sync_event" && e.newValue) {
      try {
        const msg = JSON.parse(e.newValue) as SyncMessage;
        if (msg.senderId !== senderId) {
          for (const fn of listeners) {
            try {
              fn(msg);
            } catch (err) {
              console.error("Error in sync listener:", err);
            }
          }
        }
      } catch {
        // ignore parse error
      }
    }
  });
}

export function broadcastSync(type: SyncEventType, payload?: any): void {
  const message: SyncMessage = {
    type,
    payload,
    senderId,
    timestamp: Date.now(),
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch (e) {
      console.warn("Failed to post message on BroadcastChannel:", e);
    }
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("kasa_storage_sync_event", JSON.stringify(message));
    } catch {
      // ignore quota error
    }
  }
}

export function subscribeSync(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
