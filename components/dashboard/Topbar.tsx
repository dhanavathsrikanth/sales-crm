"use client";

import { useUser } from "@clerk/nextjs";
import { Bell, Search, Menu, Sun } from "lucide-react";
import { useAppStore } from "@/store";
import { UserButton } from "@clerk/nextjs";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Topbar() {
  const { user } = useUser();
  const { toggleSidebar, setCommandPaletteOpen } = useAppStore();

  const firstName = user?.firstName || "there";

  return (
    <header className="sticky top-0 z-30 flex h-12 lg:h-14 items-center gap-3 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4 lg:px-6">
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Sun className="h-4 w-4 lg:h-5 lg:w-5 text-amber-500 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 truncate">
            {getGreeting()}, {firstName}
          </h2>
        </div>
      </div>

      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        title="Search contacts & leads"
      >
        <Search className="h-4 w-4 lg:h-5 lg:w-5" />
      </button>

      <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
        <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
          3
        </span>
      </button>

      <div className="hidden sm:block">
        <UserButton />
      </div>
    </header>
  );
}
