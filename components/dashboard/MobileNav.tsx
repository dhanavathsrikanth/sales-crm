"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home, ContactRound, Building2, CalendarCheck, Ellipsis,
  MapPin, Phone, Goal, BarChart3, StickyNote, Settings, Gauge,
  Plus, UserPlus, UserRoundPlus
} from "lucide-react";
import { useState, useEffect } from "react";

const mainNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/leads", label: "Leads", icon: Building2 },
  { href: "/followups", label: "Follow-ups", icon: CalendarCheck },
  { href: "/more", label: "More", icon: Ellipsis, noLink: true as const },
];

const secondaryPages = [
  { href: "/visits", label: "Visits", icon: MapPin },
  { href: "/calls", label: "Calls", icon: Phone },
  { href: "/goals", label: "Goals", icon: Goal },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/mileage", label: "Mileage", icon: Gauge },
  { href: "/settings", label: "Settings", icon: Settings },
];

const createActions = [
  { href: "/leads/new", label: "New Lead", icon: UserPlus, color: "bg-blue-600" },
  { href: "/contacts/new", label: "New Contact", icon: UserRoundPlus, color: "bg-violet-600" },
  { href: "/calls", label: "Log Call", icon: Phone, color: "bg-emerald-600" },
  { href: "/visits/new", label: "Log Visit", icon: MapPin, color: "bg-amber-600" },
  { href: "/notes/new", label: "Quick Note", icon: StickyNote, color: "bg-pink-500" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const closeAll = () => { setCreateOpen(false); setMoreOpen(false); };

  useEffect(() => { closeAll(); }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href);
  };

  const isMoreActive =
    pathname.startsWith("/visits") ||
    pathname.startsWith("/calls") ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/notes") ||
    pathname.startsWith("/mileage") ||
    pathname.startsWith("/settings");

  useEffect(() => {
    if (createOpen || moreOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      return () => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [createOpen, moreOpen]);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 lg:hidden pb-safe shadow-[0_-1px_6px_rgba(0,0,0,0.04)] will-change-transform">
        <div className="flex items-center justify-around px-1">
          {mainNavItems.slice(0, 2).map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-2 min-w-0 transition-colors active:scale-95",
                isActive(item.href) ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {isActive(item.href) && (
                <span className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full bg-blue-500" />
              )}
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          ))}

          {/* Center plus button */}
          <button
            onClick={() => { setMoreOpen(false); setCreateOpen((o) => !o); }}
            className={cn(
              "relative -mt-3 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-90",
              createOpen ? "bg-red-500 rotate-45" : "bg-blue-600"
            )}
          >
            <Plus className="h-6 w-6 text-white" />
          </button>

          {mainNavItems.slice(2).map((item) => {
            const active = item.noLink ? isMoreActive : isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => {
                  if (item.noLink) {
                    setCreateOpen(false);
                    setMoreOpen((o) => !o);
                  } else {
                    router.push(item.href);
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-2 min-w-0 transition-colors active:scale-95",
                  active ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                {active && (
                  <span className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full bg-blue-500" />
                )}
                <item.icon className={cn("h-5 w-5", item.noLink && moreOpen && "rotate-45 transition-transform")} />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Create popover */}
      {createOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={closeAll}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-1/2 -translate-x-1/2 bottom-20 w-56 rounded-xl bg-white shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95"
            style={{ transformOrigin: "bottom center" }}
          >
            {/* Tip pointing down to plus button */}
            <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-r border-b border-zinc-100" />
            <div className="p-1.5">
              {createActions.map((a) => (
                <button
                  key={a.href}
                  onClick={() => { closeAll(); router.push(a.href); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 active:scale-[0.98] transition-colors"
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", a.color)}>
                    <a.icon className="h-4 w-4 text-white" />
                  </div>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={closeAll}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white px-5 pb-10 pt-2 shadow-xl animate-in slide-in-from-bottom-8"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-300" />
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Pages</p>
            <div className="space-y-0.5">
              {secondaryPages.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={closeAll}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors active:scale-[0.98]",
                    isActive(p.href)
                      ? "bg-blue-50 font-medium text-blue-700"
                      : "text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  <p.icon className="h-4 w-4" />
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
