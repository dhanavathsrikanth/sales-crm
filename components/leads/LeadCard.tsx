import { cn } from "@/lib/utils";
import {
  Phone,
  MessageSquare,
  Calendar,
  Pencil,
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
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Lead } from "@/hooks/use-leads";

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
  lead: Lead;
  onScheduleFollowup?: (lead: Lead) => void;
}

export default function LeadCard({ lead, onScheduleFollowup }: Props) {
  const stage = stageConfig[lead.stage ?? ""] ?? stageConfig.new;
  const StageIcon = stage.icon;

  const mobileDigits = lead.mobile?.replace(/[^0-9]/g, "") || "";

  return (
    <div className="group relative rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md">
      <Link href={`/leads/${lead.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-900 truncate min-h-[20px]">{lead.companyName || "Untitled"}</h3>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0", stage.bg, stage.color)}>
                <StageIcon className="h-3 w-3" />
                {stage.label}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-zinc-500 min-h-[20px]">
              {[lead.builderName, lead.city].filter(Boolean).join(" | ") || "No details"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm text-zinc-600">
          <span className="truncate">{lead.contactPerson || "\u2014"}</span>
          {lead.mobile && (
            <span className="text-blue-600 shrink-0">{lead.mobile}</span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {lead.estimatedM3 && (
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {Number(lead.estimatedM3).toLocaleString()} m\u00B3
            </span>
          )}
          {lead.leadScore !== null && (
            <span className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
              lead.leadScore >= 70 ? "bg-emerald-50 text-emerald-700" :
              lead.leadScore >= 40 ? "bg-amber-50 text-amber-700" :
              "bg-red-50 text-red-700",
            )}>
              Score: {lead.leadScore}
            </span>
          )}
        </div>

        {lead.leadScore !== null && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-blue-500 transition-all"
              style={{ width: `${lead.leadScore}%` }}
            />
          </div>
        )}

        <p className="mt-3 text-xs text-zinc-400 min-h-[16px]">
          {lead.createdAt
            ? `${formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}`
            : ""}
        </p>
      </Link>

      <div className="mt-2 flex items-center gap-1.5 border-t border-zinc-100 pt-2">
        {lead.mobile && (
          <a
            href={`tel:${lead.mobile}`}
            onClick={(e) => e.stopPropagation()}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition-all"
            title="Call"
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        {mobileDigits && (
          <a
            href={`https://wa.me/${mobileDigits}?text=Hi%20${encodeURIComponent(lead.contactPerson || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 transition-all"
            title="WhatsApp"
          >
            <MessageSquare className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onScheduleFollowup?.(lead);
          }}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all"
          title="Schedule Follow-up"
        >
          <Calendar className="h-4 w-4" />
        </button>
        <Link
          href={`/leads/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 active:scale-95 transition-all ml-auto"
          title="View Details"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
