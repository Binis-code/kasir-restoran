import { useState } from "react";
import { Bell, Radio, Smartphone, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { IconButton } from "./ui/Button";
import { StatusDot } from "./KasaLogo";
import { t } from "../locales/en";
import { NetworkHubModal } from "./NetworkHubModal";
import { getNetworkHostInfo } from "../services/localSyncServer";
import { useAuth } from "./AuthContext";
import { cn } from "../lib/cn";

export function Header({
  title,
  showSavedStatus = false,
}: {
  title: string;
  showSavedStatus?: boolean;
}) {
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const hostInfo = getNetworkHostInfo();
  const { currentStaff, openSwitchModal } = useAuth();

  const handleNotifications = () => {
    toast(t.toasts.noNotifications);
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 px-5 py-3.5 md:px-8 shrink-0 bg-mineral">
        <div>
          <p className="label-caps text-[10px] font-medium text-ink/50">
            {t.header.dateToday}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <h1 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
              {title}
            </h1>
            {showSavedStatus && (
              <span className="flex items-center gap-1.5 text-xs text-ink/55">
                <StatusDot />
                {t.header.allSaved}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Local Server & Waiter Pairing Trigger */}
          <button
            type="button"
            onClick={() => setNetworkModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-ink/12 bg-white px-3 py-2 text-xs font-bold text-ink shadow-2xs hover:border-ink/30 hover:bg-mineral/40 transition-all"
            title="Buka Pusat Jaringan & Pairing HP Pelayan"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="flex items-center gap-1.5 text-ink/80">
              <Radio size={14} className="text-emerald-700" />
              <span className="hidden sm:inline">Server Lokal:</span>
              <span className="font-mono text-[11px] text-ink font-extrabold">{hostInfo.host}:{hostInfo.port}</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1 bg-counterlime/40 text-ink text-[10px] font-extrabold px-1.5 py-0.5 rounded ml-0.5">
              <Smartphone size={11} />
              Pair HP
            </span>
          </button>

          <IconButton label={t.header.notifications} onClick={handleNotifications}>
            <Bell size={19} />
          </IconButton>

          {/* Active Staff & Role Switch Button */}
          <button
            type="button"
            onClick={openSwitchModal}
            className="group flex items-center gap-2 rounded-full border border-ink/12 bg-white pl-1 pr-3 py-1 shadow-2xs hover:border-ink/30 hover:bg-mineral/50 transition-all"
            title={`Login sebagai: ${currentStaff.name} (${currentStaff.title}). Klik untuk ganti staf.`}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-display text-xs font-bold shadow-2xs transition-transform group-hover:scale-105",
                currentStaff.avatarColor,
              )}
            >
              {currentStaff.initials}
            </span>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-ink leading-none">{currentStaff.name.split(" ")[0]}</p>
              <p className="text-[10px] font-semibold text-ink/50 uppercase leading-tight mt-0.5">
                {currentStaff.role}
              </p>
            </div>
            <ChevronDown size={14} className="text-ink/40 group-hover:text-ink transition-colors ml-0.5" />
          </button>
        </div>
      </header>

      {/* Network & Pairing Hub Modal */}
      <NetworkHubModal
        open={networkModalOpen}
        onClose={() => setNetworkModalOpen(false)}
      />
    </>
  );
}
