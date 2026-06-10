"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus, UserRoundPlus, Phone, MapPin, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

const fabActions = [
  { href: "/leads/new", label: "New Lead", icon: UserPlus, color: "bg-blue-600 hover:bg-blue-700" },
  { href: "/contacts", label: "New Contact", icon: UserRoundPlus, color: "bg-violet-600 hover:bg-violet-700" },
  { href: "/calls", label: "Log Call", icon: Phone, color: "bg-emerald-600 hover:bg-emerald-700" },
  { href: "/visits", label: "Log Visit", icon: MapPin, color: "bg-amber-600 hover:bg-amber-700" },
  { href: "/notes", label: "Quick Note", icon: StickyNote, color: "bg-pink-500 hover:bg-pink-600" },
];

export default function Fab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 lg:bottom-8 lg:right-6">
      {open &&
        fabActions.map((action) => (
          <button
            key={action.href}
            onClick={() => {
              setOpen(false);
              router.push(action.href);
            }}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-right-4",
              action.color
            )}
          >
            <action.icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all duration-300 hover:bg-blue-700 active:scale-95",
          open && "rotate-45 bg-red-500 hover:bg-red-600"
        )}
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  );
}
