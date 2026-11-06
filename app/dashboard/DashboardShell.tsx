"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Wallet,
  Settings,
  Users,
  Compass,
  Home,
  Goal,
  LifeBuoy,
  PhoneCall,
} from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import styles from "./DashboardShell.module.css";

// Placeholder contact address — the owner will set the real support inbox.
const SUPPORT_HREF = "mailto:support@turfske.co.ke";

const ICON_SIZE = 18;
const ICON_STROKE = 1.75;

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const NAV: Record<string, NavItem[]> = {
  manager: [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
    {
      label: "My venues",
      href: "/dashboard/venues",
      icon: <Building2 size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
    {
      label: "Bookings",
      href: "/dashboard/bookings",
      icon: <CalendarCheck size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
    {
      label: "Payouts",
      href: "/dashboard/payouts",
      icon: <Wallet size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
  ],
  player: [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
    {
      label: "Find a pitch",
      href: "/dashboard/explore",
      icon: <Compass size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
    {
      label: "My bookings",
      href: "/dashboard/bookings",
      icon: <CalendarCheck size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
  ],
  admin: [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
    {
      label: "Managers",
      href: "/dashboard/admin/managers",
      icon: <Users size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    },
  ],
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" className={styles.brand} onClick={onNavigate}>
      <span className={styles.brand_tile} aria-hidden="true">
        <Goal size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      </span>
      <span className={styles.brand_name}>TurfsKE</span>
    </Link>
  );
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

        return (
          <Fragment key={item.href}>
            {item.href === "/dashboard/settings" && (
              <div className={styles.nav_divider} aria-hidden="true" />
            )}
            <Link
              href={item.href}
              className={`${styles.nav_item} ${active ? styles.nav_item_active : ""}`}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.nav_icon} aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}

function HelpCard({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className={styles.help_card}>
      <Link href="/" className={styles.help_row} onClick={onNavigate}>
        <span className={styles.help_icon} aria-hidden="true">
          <Home size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        </span>
        Back to home
      </Link>
      <div className={styles.help_divider} aria-hidden="true" />
      <Link href={SUPPORT_HREF} className={styles.help_row} onClick={onNavigate}>
        <span className={styles.help_icon} aria-hidden="true">
          <PhoneCall size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        </span>
        Contact support
      </Link>
    </div>
  );
}

function UserCard({
  fullName,
  email,
  roleLabel,
  initial,
}: {
  fullName: string;
  email: string;
  roleLabel: string;
  initial: string;
}) {
  return (
    <div className={styles.user_card}>
      <div className={styles.user_row}>
        <span className={styles.user_avatar} aria-hidden="true">
          {initial}
        </span>
        <div className={styles.user_info}>
          <div className={styles.user_name_row}>
            <p className={styles.user_name}>{fullName}</p>
            <span className={styles.user_role}>{roleLabel}</span>
          </div>
          <p className={styles.user_email}>{email}</p>
        </div>
      </div>
      <SignOutButton />
    </div>
  );
}

type DashboardShellProps = {
  user: { fullName: string; email: string; role: string };
  children: ReactNode;
};

export default function DashboardShell({
  user,
  children,
}: DashboardShellProps) {
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
      : (pathname.split("/").filter(Boolean).pop() ?? "Overview");
  const pageTitle = activeItem
    ? activeItem.label
    : fallbackTitle === "managers"
      ? "Managers"
      : fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1);

  const initial = (user.fullName || user.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  const roleLabel =
    user.role === "manager"
      ? "Manager"
      : user.role === "admin"
        ? "Admin"
        : "Player";

  return (
    <div className={styles.shell}>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebar_brand}>
          <Brand />
        </div>
        <NavList items={items} current={pathname} />
        <div className={styles.sidebar_footer}>
          <HelpCard />
          <UserCard
            fullName={user.fullName}
            email={user.email}
            roleLabel={roleLabel}
            initial={initial}
          />
        </div>
      </aside>

      {/* Mobile off-canvas drawer */}
      <div
        className={`${styles.drawer_overlay} ${drawerOpen ? styles.drawer_overlay_open : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`${styles.drawer} ${drawerOpen ? styles.drawer_open : ""}`}
      >
        <button
          type="button"
          className={styles.drawer_close}
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} strokeWidth={ICON_STROKE} />
        </button>
        <div className={styles.sidebar_brand}>
          <Brand onNavigate={() => setDrawerOpen(false)} />
        </div>
        <NavList
          items={items}
          current={pathname}
          onNavigate={() => setDrawerOpen(false)}
        />
        <div className={styles.sidebar_footer}>
          <HelpCard onNavigate={() => setDrawerOpen(false)} />
          <UserCard
            fullName={user.fullName}
            email={user.email}
            roleLabel={roleLabel}
            initial={initial}
          />
        </div>
      </aside>

      {/* Main column */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbar_left}>
            <button
              type="button"
              className={styles.menu_button}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} strokeWidth={ICON_STROKE} />
            </button>
            <span className={styles.topbar_brand}>TurfsKE</span>
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
