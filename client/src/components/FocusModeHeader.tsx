import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  KeyRound,
  LayoutGrid,
  Clock,
  Maximize2,
  Minimize2,
  ChefHat,
  UtensilsCrossed,
} from "lucide-react";
import { KasaMark } from "./KasaLogo";
import { useAuth } from "./AuthContext";
import { getNetworkHostInfo } from "../services/localSyncServer";
import { cn } from "../lib/cn";
import { NetworkHubModal } from "./NetworkHubModal";

interface FocusModeHeaderProps {
  title: string;
  subtitle?: string;
  roleType: "pelayan" | "dapur";
  badgeCount?: number;
}

export function FocusModeHeader({
  title,
  subtitle,
  roleType,
  badgeCount = 0,
}: FocusModeHeaderProps) {
  const { currentStaff, openSwitchModal } = useAuth();
  const hostInfo = getNetworkHostInfo();
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isFullAdmin = currentStaff.role === "admin" || currentStaff.role === "kasir";

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-ink px-4 py-2.5 text-white md:px-6 shrink-0 shadow-md">
        {/* Left: Branding & Station Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <KasaMark size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold tracking-tight text-white">
                  {title || "KASA"}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1",
                    roleType === "pelayan"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30",
                  )}
                >
                  {roleType === "pelayan" ? <UtensilsCrossed size={11} /> : <ChefHat size={11} />}
                  {roleType === "pelayan" ? "Pelayan Focus" : "Dapur KDS Focus"}
                  {badgeCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-coral text-white font-bold text-[9px]">
                      {badgeCount}
                    </span>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-white/50 hidden sm:block">
                {subtitle || "Modul Khusus Staf · Bebas Distraksi"}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Realtime Clock */}
        <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-white/80">
          <Clock size={13} className="text-counterlime" />
          <span className="font-mono font-bold">
            {currentTime.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span className="text-white/40">·</span>
          <span className="text-[11px] text-white/60">
            {currentTime.toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>

        {/* Right: Actions, Network Status, & Staff Profile */}
        <div className="flex items-center gap-2">
          {/* Local Server WiFi indicator */}
          <button
            type="button"
            onClick={() => setNetworkModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 transition-all"
            title="Pusat Jaringan & Server Lokal"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">{hostInfo.host}:{hostInfo.port}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh (Kiosk)"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Jump to POS Cashier (If Admin/Cashier is testing focus mode) */}
          {isFullAdmin && (
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/15 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-counterlime hover:text-ink transition-all"
              title="Kembali ke Layar POS Kasir"
            >
              <LayoutGrid size={14} />
              <span className="hidden md:inline">Ke POS Kasir</span>
            </Link>
          )}

          {/* Active Staff Badge & PIN Switch Trigger */}
          <button
            type="button"
            onClick={openSwitchModal}
            className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
            title="Klik untuk ganti akun staf / PIN"
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full font-display text-[10px] font-bold shadow-2xs",
                currentStaff.avatarColor,
              )}
            >
              {currentStaff.initials}
            </span>
            <span className="truncate max-w-[90px] md:max-w-[120px]">
              {currentStaff.name.split(" ")[0]}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-counterlime bg-counterlime/20 px-1.5 py-0.5 rounded">
              <KeyRound size={10} />
              PIN
            </span>
          </button>
        </div>
      </header>

      <NetworkHubModal
        open={networkModalOpen}
        onClose={() => setNetworkModalOpen(false)}
      />
    </>
  );
}
