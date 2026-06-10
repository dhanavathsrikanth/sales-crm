"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const segmentLabels: Record<string, string> = {
  leads: "Leads",
  contacts: "Contacts",
  followups: "Follow-ups",
  calls: "Calls",
  visits: "Visits",
  goals: "Goals",
  reports: "Reports",
  notes: "Notes",
  settings: "Settings",
  mileage: "Mileage",
  new: "New",
};

function formatSegment(seg: string): string {
  if (segmentLabels[seg]) return segmentLabels[seg];
  if (/^[0-9a-f]{8,}$/i.test(seg.replace(/-/g, "")))
    return seg.length > 8 ? `${seg.slice(0, 8)}...` : seg;
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    label: formatSegment(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="mb-4 -mt-1">
      <ol className="flex items-center gap-1 text-xs text-zinc-400 flex-wrap">
        <li>
          <Link href="/" className="hover:text-zinc-700 transition-colors">
            <Home className="h-3 w-3" />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 shrink-0" />
            {crumb.isLast ? (
              <span className="font-medium text-zinc-700" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-zinc-700 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
