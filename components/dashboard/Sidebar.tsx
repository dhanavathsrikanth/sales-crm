"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { UserButton } from "@clerk/nextjs";
import {
  Sun,
  ContactRound,
  Building2,
  Phone,
  MapPin,
  CalendarCheck,
  Target,
  BarChart3,
  StickyNote,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "My Day", icon: Sun },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/leads", label: "Leads", icon: Building2 },
  { href: "/calls", label: "Call Log", icon: Phone },
  { href: "/visits", label: "Visits", icon: MapPin },
  { href: "/followups", label: "Follow-ups", icon: CalendarCheck },
  { href: "/goals", label: "My Goals", icon: Target },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notes", label: "Quick Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-zinc-200 bg-white transition-all duration-300",
        sidebarOpen ? "w-60" : "w-16"
      )}
    >
      <div className="flex h-14 items-center border-b border-zinc-200 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <span
            className={cn(
              "text-base font-bold text-zinc-900 whitespace-nowrap transition-opacity duration-200",
              sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            PRISM<span className="text-blue-600">RMC</span>
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-600" : "text-zinc-400")} />
                <span
                  className={cn(
                    "transition-opacity duration-200",
                    sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-zinc-200 p-3">
        <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
          <UserButton />
          <div className={cn("transition-opacity duration-200", sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden")}>
            <p className="text-sm font-medium text-zinc-900 truncate">Profile</p>
            <p className="text-xs text-zinc-500">Sign out</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
