import { Bell } from "lucide-react";
import { toast } from "sonner";
import { IconButton } from "./ui/Button";
import { StatusDot } from "./KasaLogo";
import { t } from "../locales/en";

export function Header({
  title,
  showSavedStatus = false,
}: {
  title: string;
  showSavedStatus?: boolean;
}) {
  const handleNotifications = () => {
    toast(t.toasts.noNotifications);
  };

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/8 px-5 py-5 md:px-8">
      <div>
        <p className="label-caps text-[11px] font-medium text-ink/50">
          {t.header.dateToday}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[28px]">
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
      <div className="flex items-center gap-2">
        <IconButton label={t.header.notifications} onClick={handleNotifications}>
          <Bell size={19} />
        </IconButton>
        <span
          aria-label={t.header.profileOf(t.cashier.name, t.cashier.role)}
          title={t.header.profileOf(t.cashier.name, t.cashier.role)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-counterlime font-display text-xs font-bold text-ink"
        >
          {t.cashier.initials}
        </span>
      </div>
    </header>
  );
}
