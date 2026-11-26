"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  MessageCircle,
  MessageSquareText,
  Settings as SettingsIcon,
} from "lucide-react";
import { useOcto } from "@/lib/store";
import { unreadCount } from "@/lib/analytics";
import { cn, initials, avatarColor } from "@/lib/utils";
import { OctoMark } from "./octo-mark";
import { SavedPill } from "./saved-pill";
import { ThemeToggle } from "./theme-toggle";

/**
 * The app frame: slim sidebar on desktop, bottom tab bar on mobile.
 * Five destinations, one level deep, always visible.
 */

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/conversations", label: "Conversations", icon: MessageCircle },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/replies", label: "Replies", icon: MessageSquareText },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const SUPPORT_LINK = `https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "254700000000"}?text=${encodeURIComponent(
  "Hi Octo support, I need help with my assistant",
)}`;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.19-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.21-8.24 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.86-.87 2.09 0 1.24.9 2.43 1.02 2.6.12.17 1.75 2.68 4.24 3.76.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { workspace, demoMode } = useOcto();
  const business = workspace.business;
  const unread = unreadCount(workspace);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh bg-background">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card px-3 py-6 md:flex">
        <Link
          href="/home"
          className="mb-6 flex items-center gap-2.5 rounded-md px-2 py-1"
        >
          <OctoMark />
          <span className="text-xl font-semibold tracking-tight">Octo</span>
        </Link>

        {/* Business switcher (single business in v1) */}
        <div className="mb-6 flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5">
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold",
              avatarColor(business.name || "Octo"),
            )}
          >
            {initials(business.name || "Octo Business")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {business.name || "Your business"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {business.location || "Add your location"}
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Main">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-md px-3 text-[15px] transition-colors",
                  active
                    ? "bg-primary-soft font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-5" strokeWidth={active ? 2.3 : 1.9} />
                <span>{item.label}</span>
                {item.href === "/conversations" && unread > 0 ? (
                  <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-foreground">
                    {unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <a
            href={SUPPORT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <WhatsAppIcon className="size-5 text-[#25D366]" />
            Need help?
          </a>
          <div className="flex items-center justify-between px-1">
            <SavedPill />
            <ThemeToggle />
          </div>
          {demoMode ? (
            <p className="px-2 text-xs leading-relaxed text-muted-foreground">
              Everything you change is saved on this device.
            </p>
          ) : null}
        </div>
      </aside>

      {/* ---------- Mobile top bar ---------- */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
        <Link href="/home" className="flex min-w-0 items-center gap-2.5">
          <OctoMark className="size-8" />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold leading-tight">
              {business.name || "Octo"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Octo assistant
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <SavedPill />
          <ThemeToggle />
        </div>
      </header>

      {/* ---------- Page content ---------- */}
      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 md:px-8 md:pb-16 md:pt-10">
          {children}
        </div>
      </main>

      {/* ---------- Mobile help button ---------- */}
      <a
        href={SUPPORT_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold shadow-lift md:hidden"
      >
        <WhatsAppIcon className="size-5 text-[#25D366]" />
        Need help?
      </a>

      {/* ---------- Mobile bottom tabs ---------- */}
      <nav
        aria-label="Main"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 pt-1 backdrop-blur md:hidden"
      >
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.9} />
                {item.href === "/conversations" && unread > 0 ? (
                  <span className="absolute -right-2 -top-1 size-2.5 rounded-full bg-accent ring-2 ring-card" />
                ) : null}
              </span>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
