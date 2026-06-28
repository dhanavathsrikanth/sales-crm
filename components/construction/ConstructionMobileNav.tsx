"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building2,
  Users,
  CalendarCheck,
  MapPin,
  BarChart3,
  Gauge,
  Ellipsis,
} from "lucide-react";

const navItems = [
  { href: "/construction", label: "Home", icon: LayoutDashboard },
  { href: "/construction/products", label: "Products", icon: Package },
  { href: "/construction/orders", label: "Orders", icon: ShoppingCart },
  { href: "/construction/leads", label: "Leads", icon: Building2 },
  { href: "/construction/followups", label: "Follow-ups", icon: CalendarCheck },
];

const morePages = [
  { href: "/construction/contacts", label: "Customers", icon: Users },
  { href: "/construction/visits", label: "Visits", icon: MapPin },
  { href: "/construction/mileage", label: "Mileage", icon: Gauge },
  { href: "/construction/reports", label: "Reports", icon: BarChart3 },
];

export default function ConstructionMobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const closeAll = () => setMoreOpen(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/construction") return pathname === "/construction";
    return pathname === href || pathname.startsWith(href);
  };

  const isMoreActive = morePages.some((p) => isActive(p.href));

  useEffect(() => {
    if (moreOpen) {
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
  }, [moreOpen]);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 md:hidden pb-safe shadow-[0_-1px_6px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around px-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-2 py-2 min-w-0 transition-colors active:scale-95",
                isActive(item.href) ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {isActive(item.href) && (
                <span className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full bg-blue-500" />
              )}
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          ))}

          {/* More button */}
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-2 py-2 min-w-0 transition-colors active:scale-95",
              isMoreActive || moreOpen ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            {(isMoreActive || moreOpen) && (
              <span className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full bg-blue-500" />
            )}
            <Ellipsis className={cn("h-5 w-5", moreOpen && "rotate-90 transition-transform")} />
            <span className="text-[10px] font-medium leading-tight">More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={closeAll}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white px-5 pb-10 pt-2 shadow-xl animate-in slide-in-from-bottom-8"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-300" />
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">More</p>
            <div className="space-y-0.5">
              {morePages.map((p) => (
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
