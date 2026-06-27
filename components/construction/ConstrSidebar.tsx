"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building2,
  Users,
  CalendarCheck,
  MapPin,
  BarChart3,
  ArrowLeft,
  HardHat,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/construction", label: "Dashboard", icon: LayoutDashboard },
  { href: "/construction/products", label: "Products", icon: Package },
  { href: "/construction/orders", label: "Orders", icon: ShoppingCart },
  { href: "/construction/leads", label: "Leads", icon: Building2 },
  { href: "/construction/contacts", label: "Customers", icon: Users },
  { href: "/construction/followups", label: "Follow-ups", icon: CalendarCheck },
  { href: "/construction/visits", label: "Visits", icon: MapPin },
  { href: "/construction/reports", label: "Reports", icon: BarChart3 },
];

export default function ConstrSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-700 bg-zinc-900 text-white transition-transform duration-200",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-700 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-zinc-900">
              <HardHat className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-white whitespace-nowrap">
              Constru<span className="text-amber-400">Panel</span>
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/construction" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-amber-500/20 text-amber-300"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-amber-400" : "text-zinc-500")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-zinc-700 p-3">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ArrowLeft className="h-5 w-5 shrink-0 text-zinc-500" />
            Back to RMC CRM
          </Link>
        </div>

        <div className="border-t border-zinc-700 p-3">
          <div className="flex items-center gap-3">
            <UserButton />
            <div>
              <p className="text-sm font-medium text-zinc-100 truncate">Profile</p>
              <p className="text-xs text-zinc-500">Construction Panel</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
