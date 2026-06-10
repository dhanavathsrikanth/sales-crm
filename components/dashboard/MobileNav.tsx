"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sun, ContactRound, Building2, CalendarCheck, Plus, Ellipsis } from "lucide-react";
import { useState } from "react";

const mainNavItems = [
  { href: "/", label: "Home", icon: Sun },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/leads", label: "Leads", icon: Building2 },
  { href: "/followups", label: "Follow-ups", icon: CalendarCheck },
  { href: "/more", label: "More", icon: Ellipsis },
];

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/more")
      return ["/visits", "/calls", "/goals", "/reports", "/notes", "/settings", "/mileage"].some((p) =>
        pathname === p || pathname.startsWith(p)
      );
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 lg:hidden pb-safe shadow-[0_-1px_6px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-around px-1">
        {mainNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href === "/more" ? "/visits" : item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-2 min-w-0 transition-colors active:scale-95",
                active ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {active && (
                <span className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full bg-blue-500" />
              )}
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
