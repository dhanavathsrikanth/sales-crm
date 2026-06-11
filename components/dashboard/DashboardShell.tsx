"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import Fab from "./Fab";
import QuickSearch from "@/components/shared/QuickSearch";
import OfflineBanner from "@/components/shared/OfflineBanner";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "My Day",
  "/contacts": "Contacts",
  "/leads": "Leads",
  "/leads/new": "New Lead",
  "/calls": "Call Log",
  "/visits": "Visits",
  "/followups": "Follow-ups",
  "/goals": "My Goals",
  "/reports": "Reports",
  "/notes": "Quick Notes",
  "/settings": "Settings",
  "/mileage": "Mileage Tracker",
};

function getTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/leads/")) return "Lead Details";
  if (pathname.startsWith("/contacts/")) return "Contact Details";
  return "My Day";
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarOpen } = useAppStore();

  return (
    <div className="flex min-h-screen-safe bg-zinc-50">
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 w-full max-w-full",
          sidebarOpen ? "lg:ml-60" : "lg:ml-16",
        )}
      >
        <OfflineBanner />
        <Topbar />
        <main className="flex-1 px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6 pb-[72px] lg:pb-8 overflow-x-hidden">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <MobileNav />
      <Fab />
      <QuickSearch />
    </div>
  );
}
