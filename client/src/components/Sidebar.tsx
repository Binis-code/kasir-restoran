import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Armchair,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Package,
  ReceiptText,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { KasaMark, StatusDot } from "./KasaLogo";
import { runningOrdersCount, salesToday, usePos } from "./PosContext";
import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { cn } from "../lib/cn";

type NavEntry = { href: string; label: string; icon: LucideIcon; badge?: number };

const COLLAPSE_KEY = "kasa-sidebar-collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean): void {
  try {
    localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    /* penyimpanan tidak tersedia — abaikan */
  }
}

export function Sidebar() {
  const [location] = useLocation();
  const { orders } = usePos();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const running = runningOrdersCount(orders);

  const toggle = () => {
    setCollapsed((prev) => {
      writeCollapsed(!prev);
      return !prev;
    });
  };

  const navEntries: NavEntry[] = [
    { href: "/", label: t.nav.newPos, icon: CirclePlus },
    { href: "/pesanan", label: t.nav.orders, icon: ReceiptText, badge: running },
    { href: "/meja", label: t.nav.tables, icon: Armchair },
    { href: "/produk", label: t.nav.products, icon: Package },
    { href: "/laporan", label: t.nav.reports, icon: BarChart3 },
  ];

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-ink md:flex",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className={cn("pt-6", collapsed ? "px-3" : "px-5")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <KasaMark size={collapsed ? 32 : 38} />
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-display text-lg font-bold tracking-tight text-white">
                KASA
              </p>
              <p className="label-caps text-[11px] font-medium text-white/50">
                {t.appTagline}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <p className="mt-3 flex items-center gap-2 text-xs text-white/55">
            <StatusDot />
            {t.station}
          </p>
        )}
        {collapsed && (
          <p className="mt-3 flex justify-center" title={t.station}>
            <StatusDot />
          </p>
        )}
      </div>

      <nav
        aria-label="Navigasi utama"
        className={cn("mt-7 space-y-1", collapsed ? "px-2" : "px-3")}
      >
        {navEntries.map((entry) => (
          <NavItem
            key={entry.href}
            entry={entry}
            active={location === entry.href}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {!collapsed && (
        <div className="mt-6 px-5">
          <p className="label-caps text-[11px] font-medium text-white/40">
            {t.controlSection}
          </p>
        </div>
      )}
      <nav
        aria-label="Kontrol"
        className={cn("mt-2 space-y-1", collapsed ? "px-2" : "px-3")}
      >
        <NavItem
          entry={{ href: "/pengaturan", label: t.nav.settings, icon: Settings }}
          active={location === "/pengaturan"}
          collapsed={collapsed}
        />
      </nav>

      <div className="flex-1" />

      {!collapsed && (
        <div className="mx-4 mb-4 rounded-xl bg-white/5 p-4">
          <p className="label-caps text-[11px] font-medium text-white/45">
            {t.metrics.todaySales}
          </p>
          <p className="mt-1 font-display text-lg font-bold tracking-tight text-counterlime">
            {formatIDR(salesToday(orders))}
          </p>
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-3 border-t border-white/10",
          collapsed ? "justify-center py-4" : "px-5 py-4",
        )}
      >
        <span
          aria-label={t.header.profileOf(t.cashier.name, t.cashier.role)}
          title={t.header.profileOf(t.cashier.name, t.cashier.role)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-counterlime font-display text-xs font-bold text-ink"
        >
          {t.cashier.initials}
        </span>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-medium text-white">{t.cashier.name}</p>
            <p className="text-xs text-white/50">{t.cashier.role}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? t.sidebar.expand : t.sidebar.collapse}
        title={collapsed ? t.sidebar.expand : t.sidebar.collapse}
        className="pressable mb-4 flex h-10 w-10 items-center justify-center self-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-counterlime"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const entries: NavEntry[] = [
    { href: "/", label: t.nav.newPos, icon: CirclePlus },
    { href: "/pesanan", label: t.nav.orders, icon: ReceiptText },
    { href: "/meja", label: t.nav.tables, icon: Armchair },
    { href: "/produk", label: t.nav.products, icon: Package },
    { href: "/laporan", label: t.nav.reports, icon: BarChart3 },
    { href: "/pengaturan", label: t.nav.settings, icon: Settings },
  ];

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/10 bg-ink pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {entries.map((entry) => {
        const Icon = entry.icon;
        const active = location === entry.href;
        return (
          <Link
            key={entry.href}
            href={entry.href}
            aria-current={active ? "page" : undefined}
            aria-label={entry.label}
            title={entry.label}
            className={cn(
              "pressable flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px]",
              active ? "bg-counterlime/15 text-counterlime" : "text-white/60",
            )}
          >
            <Icon size={21} strokeWidth={active ? 2.4 : 1.8} />
            <span className="max-w-full truncate px-1">{entry.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function NavItem({
  entry,
  active,
  collapsed,
}: {
  entry: NavEntry;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = entry.icon;
  return (
    <Link
      href={entry.href}
      aria-current={active ? "page" : undefined}
      aria-label={entry.label}
      title={entry.label}
      className={cn(
        "pressable relative flex h-11 items-center gap-3 rounded-lg text-sm",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-counterlime font-semibold text-ink"
          : "font-medium text-white/70 hover:bg-white/8 hover:text-white",
      )}
    >
      <Icon size={19} strokeWidth={active ? 2.3 : 1.9} />
      {!collapsed && (
        <>
          <span className="flex-1">{entry.label}</span>
          {entry.badge !== undefined && entry.badge > 0 && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                active ? "bg-ink text-mineral" : "bg-coral text-white",
              )}
            >
              {String(entry.badge).padStart(2, "0")}
            </span>
          )}
        </>
      )}
      {collapsed && entry.badge !== undefined && entry.badge > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[11px] font-bold leading-none text-white">
          {entry.badge}
        </span>
      )}
    </Link>
  );
}
