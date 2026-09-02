import { broadcastSync, subscribeSync } from "../lib/syncBus";

export interface ConnectedDevice {
  id: string;
  name: string;
  role: "kasir" | "pelayan" | "dapur" | "meja";
  ip?: string;
  userAgent?: string;
  lastSeen: number;
}

export interface NetworkHostInfo {
  host: string;
  port: string;
  protocol: string;
  baseUrl: string;
  isLocalServer: boolean;
}

const DEVICE_STORAGE_KEY = "kasa_local_device_info";

function generateDeviceId(): string {
  return `dev_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function getLocalDeviceInfo(): ConnectedDevice {
  if (typeof window === "undefined") {
    return {
      id: "server-master",
      name: "Kasir Server Utama",
      role: "kasir",
      lastSeen: Date.now(),
    };
  }

  try {
    const saved = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ConnectedDevice;
      parsed.lastSeen = Date.now();
      return parsed;
    }
  } catch {}

  // Determine role based on URL pathname
  const path = window.location.pathname;
  let role: ConnectedDevice["role"] = "kasir";
  let defaultName = "Kasir Utama (Master)";

  if (path.startsWith("/pelayan")) {
    role = "pelayan";
    defaultName = `HP Pelayan (${localStorage.getItem("kasa_waiter_name") || "Staf"})`;
  } else if (path.startsWith("/dapur")) {
    role = "dapur";
    defaultName = "Layar Dapur (KDS)";
  } else if (path.startsWith("/order")) {
    role = "meja";
    defaultName = "Self-Order Pelanggan";
  }

  const dev: ConnectedDevice = {
    id: generateDeviceId(),
    name: defaultName,
    role,
    lastSeen: Date.now(),
  };

  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(dev));
  } catch {}

  return dev;
}

export function updateLocalDeviceName(name: string, role?: ConnectedDevice["role"]) {
  const current = getLocalDeviceInfo();
  current.name = name;
  if (role) current.role = role;
  current.lastSeen = Date.now();
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

export function getNetworkHostInfo(): NetworkHostInfo {
  if (typeof window === "undefined") {
    return {
      host: "192.168.18.14",
      port: "5173",
      protocol: "http:",
      baseUrl: "http://192.168.18.14:5173",
      isLocalServer: true,
    };
  }

  const savedCustomIp = localStorage.getItem("kasa_custom_server_ip");
  let host = window.location.hostname;
  const port = window.location.port || (window.location.protocol === "https:" ? "443" : "80");
  const protocol = window.location.protocol;

  // If running on localhost/127.0.0.1, external phones CANNOT access "localhost".
  // Use saved LAN IP or active Wi-Fi adapter IP (192.168.18.14) so phone cameras can scan and connect.
  if (host === "localhost" || host === "127.0.0.1") {
    if (savedCustomIp && savedCustomIp.trim()) {
      host = savedCustomIp.trim().replace(/^https?:\/\//, "").split(":")[0];
    } else {
      host = "192.168.18.14";
    }
  }

  const baseUrl = `${protocol}//${host}${port ? `:${port}` : ""}`;

  const isLocalServer =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.");

  return {
    host,
    port,
    protocol,
    baseUrl,
    isLocalServer,
  };
}

class LocalNetworkHub {
  private listeners = new Set<(status: boolean) => void>();
  private peerListeners = new Set<(peers: ConnectedDevice[]) => void>();
  private peers: Map<string, ConnectedDevice> = new Map();

  constructor() {
    this.initPresence();
    this.setupLocalSyncBridge();
  }

  private initPresence() {
    if (typeof window === "undefined") return;

    // Register local device in peers map
    const local = getLocalDeviceInfo();
    this.peers.set(local.id, local);

    // Heartbeat every 8 seconds
    setInterval(() => {
      this.sendHeartbeat();
      this.cleanupStalePeers();
    }, 8000);

    // Initial broadcast
    setTimeout(() => this.sendHeartbeat(), 500);
  }

  private setupLocalSyncBridge() {
    // Listen to local BroadcastChannel/localStorage events
    subscribeSync((msg) => {
      if (msg.type === ("DEVICE_HEARTBEAT" as any)) {
        if (msg.payload && msg.payload.id) {
          this.peers.set(msg.payload.id, {
            ...msg.payload,
            lastSeen: Date.now(),
          });
          this.notifyPeerListeners();
        }
      }
    });
  }

  private sendHeartbeat() {
    const local = getLocalDeviceInfo();
    local.lastSeen = Date.now();
    broadcastSync("DEVICE_HEARTBEAT" as any, local);
  }

  private cleanupStalePeers() {
    const now = Date.now();
    let changed = false;
    for (const [id, peer] of this.peers.entries()) {
      // If not seen in 30 seconds, mark as offline
      if (now - peer.lastSeen > 30000 && id !== getLocalDeviceInfo().id) {
        this.peers.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.notifyPeerListeners();
    }
  }

  public getPeers(): ConnectedDevice[] {
    const local = getLocalDeviceInfo();
    this.peers.set(local.id, local);
    return Array.from(this.peers.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  }

  public subscribePeers(cb: (peers: ConnectedDevice[]) => void): () => void {
    this.peerListeners.add(cb);
    cb(this.getPeers());
    return () => {
      this.peerListeners.delete(cb);
    };
  }

  private notifyPeerListeners() {
    const list = this.getPeers();
    for (const cb of this.peerListeners) {
      try {
        cb(list);
      } catch (err) {
        console.error("Peer listener error:", err);
      }
    }
  }

  public isNetworkConnected(): boolean {
    return true;
  }

  public subscribeConnection(cb: (status: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(true);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const localNetworkHub = new LocalNetworkHub();
