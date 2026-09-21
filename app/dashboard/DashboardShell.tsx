"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  CalendarDays,
  Wallet,
  Settings,
  Users,
  Compass,
} from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import styles from "./DashboardShell.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  external?: boolean;
};

const NAV: Record<string, NavItem[]> = {
  manager: [
    { label: "Overview", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "My Venues", href: "/dashboard/venues", icon: <Building2 size={18} /> },
    { label: "Bookings", href: "/dashboard/bookings", icon: <CalendarDays size={18} /> },
    { label: "Payouts", href: "/dashboard/payouts", icon: <Wallet size={18} /> },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
  ],
  player: [
    { label: "Overview", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Find a Pitch", href: "/explore", icon: <Compass size={18} />, external: true },
    { label: "My Bookings", href: "/dashboard/bookings", icon: <CalendarDays size={18} /> },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
  ],
  admin: [
    { label: "Overview", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Managers", href: "/dashboard/admin/managers", icon: <Users size={18} /> },
    { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
  ],
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  items,
  current,
  onNavigate,
}: {
  items: NavItem[];
  current: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={styles.nav} aria-label="Dashboard">
      {items.map((item) => {
        const active = isActive(current, item.href);
        const content = (
          <>
            <span className={styles.nav_icon} aria-hidden="true">{item.icon}</span>
            {item.label}
          </>
        );

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.nav_item} ${active ? styles.nav_item_active : ""}`}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

type DashboardShellProps = {
  user: { fullName: string; email: string; role: string };
  children: ReactNode;
};

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const items = NAV[user.role] ?? NAV.player;
  const activeItem = items.find((item) => isActive(pathname, item.href));
  const fallbackTitle =
    pathname === "/dashboard"
      ? "Overview"
      : pathname.split("/").filter(Boolean).pop() ?? "Overview";
  const pageTitle = activeItem
    ? activeItem.label
    : fallbackTitle === "managers"
      ? "Managers"
      : fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1);

  const initial = (user.fullName || user.email || "U").trim().charAt(0).toUpperCase();

  const userBlock = (
    <div className={styles.user_row}>
      <span className={styles.user_avatar}>{initial}</span>
      <div className={styles.user_info}>
        <p className={styles.user_name}>{user.fullName}</p>
        <p className={styles.user_email}>{user.email}</p>
      </div>
    </div>
  );

  return (
    <div className={styles.shell}>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebar_brand}>
          <Link href="/" className={styles.sidebar_logo_link}>
            <span className={styles.sidebar_logo}>TURFSKE</span>
          </Link>
        </div>
        <NavList items={items} current={pathname} />
        <div className={styles.sidebar_user}>
          {userBlock}
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile off-canvas drawer */}
      <div
        className={`${styles.drawer_overlay} ${drawerOpen ? styles.drawer_overlay_open : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside className={`${styles.drawer} ${drawerOpen ? styles.drawer_open : ""}`}>
        <button
          type="button"
          className={styles.drawer_close}
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
        <div className={styles.sidebar_brand}>
          <span className={styles.sidebar_logo}>TURFSKE</span>
        </div>
        <NavList items={items} current={pathname} onNavigate={() => setDrawerOpen(false)} />
        <div className={styles.sidebar_user}>
          {userBlock}
          <SignOutButton />
        </div>
      </aside>

      {/* Main column */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              className={styles.menu_button}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className={styles.topbar_brand}>TURFSKE</span>
            <h1 className={styles.topbar_title}>{pageTitle}</h1>
          </div>
          <div className={styles.topbar_user}>
            <span className={styles.topbar_avatar}>{initial}</span>
            <span className={styles.topbar_name}>{user.fullName}</span>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}