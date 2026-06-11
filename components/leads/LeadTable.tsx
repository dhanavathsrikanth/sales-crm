"use client";

import { cn } from "@/lib/utils";
import {
  Phone,
  CircleDot,
  PhoneCall,
  CalendarCheck,
  MapPin,
  ClipboardList,
  FileText,
  Handshake,
  FlaskConical,
  Trophy,
  Frown,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import type { Lead } from "@/hooks/use-leads";
import { useMemo, useState } from "react";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
    </svg>
  );
}

const stageConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  new: { label: "New", icon: CircleDot, color: "text-zinc-600", bg: "bg-zinc-100" },
  contacted: { label: "Contacted", icon: PhoneCall, color: "text-blue-600", bg: "bg-blue-50" },
  meeting_scheduled: { label: "Meeting", icon: CalendarCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
  site_visited: { label: "Site Visited", icon: MapPin, color: "text-violet-600", bg: "bg-violet-50" },
  requirement_received: { label: "Requirement", icon: ClipboardList, color: "text-cyan-600", bg: "bg-cyan-50" },
  quotation_sent: { label: "Quotation", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
  negotiation: { label: "Negotiation", icon: Handshake, color: "text-orange-600", bg: "bg-orange-50" },
  trial_order: { label: "Trial", icon: FlaskConical, color: "text-rose-600", bg: "bg-rose-50" },
  won: { label: "Won", icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
  lost: { label: "Lost", icon: Frown, color: "text-red-600", bg: "bg-red-50" },
};

interface Props {
  data: Lead[];
}

export default function LeadTable({ data }: Props) {
  const columnHelper = createColumnHelper<Lead>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("companyName", {
        header: "Company",
        cell: (info) => (
          <Link href={`/leads/${info.row.original.id}`} className="font-medium text-zinc-900 hover:text-blue-600 truncate block max-w-[180px]">
            {info.getValue() || "Untitled"}
          </Link>
        ),
      }),
      columnHelper.accessor("builderName", {
        header: "Builder",
        cell: (info) => <span className="text-zinc-600">{info.getValue() || "—"}</span>,
      }),
      columnHelper.accessor("stage", {
        header: "Stage",
        cell: (info) => {
          const stage = stageConfig[info.getValue() ?? ""] ?? stageConfig.new;
          const Icon = stage.icon;
          return (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", stage.bg, stage.color)}>
              <Icon className="h-3 w-3" />
              {stage.label}
            </span>
          );
        },
      }),
      columnHelper.accessor("city", {
        header: "City",
        cell: (info) => <span className="text-zinc-600">{info.getValue() || "—"}</span>,
      }),
      columnHelper.accessor("estimatedM3", {
        header: "m³",
        cell: (info) => (
          <span className="font-medium text-zinc-800">
            {info.getValue() ? Number(info.getValue()).toLocaleString() : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("leadScore", {
        header: "Score",
        cell: (info) => {
          const score = info.getValue();
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 rounded-full bg-zinc-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    score! >= 70 ? "bg-emerald-500" : score! >= 40 ? "bg-amber-500" : "bg-red-400",
                  )}
                  style={{ width: `${score || 0}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500">{score || 0}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => (
          <span className="text-xs text-zinc-400">
            {info.getValue()
              ? formatDistanceToNow(new Date(info.getValue()!), { addSuffix: true })
              : "—"}
          </span>
        ),
      }),
      {
        id: "actions",
        header: "",
        cell: ({ row }: any) => (
          <div className="flex gap-1">
            {row.original.mobile && (
              <a href={`tel:${row.original.mobile}`} className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-blue-50 hover:text-blue-600">
                <Phone className="h-3.5 w-3.5" />
              </a>
            )}
            {row.original.mobile && (
              <a
                href={`https://wa.me/${row.original.mobile.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-zinc-200">
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
