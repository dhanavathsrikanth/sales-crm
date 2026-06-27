"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building2,
  Users,
  CalendarCheck,
  MapPin,
  BarChart3,
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
  { href: "/construction/reports", label: "Reports", icon: BarChart3 },
];

export default function ConstructionMobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/construction") return pathname === "/construction";
    return pathname === href || pathname.startsWith(href);
  };

  const isMoreActive = morePages.some((p) => isActive(p.href));

  return (
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
        <Link
          href="/construction/contacts"
          className={cn(
            "relative flex flex-col items-center gap-0.5 px-2 py-2 min-w-0 transition-colors active:scale-95",
            isMoreActive ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
          )}
        >
          {isMoreActive && (
            <span className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full bg-blue-500" />
          )}
          <div className="relative">
            <Users className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium leading-tight">More</span>
        </Link>
      </div>
    </nav>
  );
}
