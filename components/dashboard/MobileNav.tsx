"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sun, ContactRound, Building2, CalendarCheck, Ellipsis } from "lucide-react";

const mobileNavItems = [
  { href: "/", label: "My Day", icon: Sun },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/leads", label: "Leads", icon: Building2 },
  { href: "/followups", label: "Follow-ups", icon: CalendarCheck },
  { href: "/more", label: "More", icon: Ellipsis },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {mobileNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/more"
                ? ["/visits", "/calls", "/goals", "/reports", "/notes", "/settings"].some((p) =>
                    pathname === p || pathname.startsWith(p)
                  )
                : pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href === "/more" ? "/visits" : item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors",
                isActive ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
