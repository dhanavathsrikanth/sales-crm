import { cn } from "@/lib/utils";
import {
  Phone,
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
    </svg>
  );
}

function GoogleMapsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285F4"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>
  );
}

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
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-500 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition-all"
            title="Call"
          >
            <Phone className="h-5 w-5" />
          </a>
        )}
        {mobileDigits && (
          <a
            href={`https://wa.me/${mobileDigits}?text=Hi%20${encodeURIComponent(lead.contactPerson || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all"
            title="WhatsApp"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (lead.latitude && lead.longitude) {
              window.open(`https://www.google.com/maps?q=${lead.latitude},${lead.longitude}`, "_blank", "noopener,noreferrer");
            } else if (lead.siteAddress) {
              window.open(`https://www.google.com/maps/search/${encodeURIComponent(lead.siteAddress)}`, "_blank", "noopener,noreferrer");
            }
          }}
          className={cn(
            "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-cyan-600 hover:bg-cyan-50 active:scale-95 transition-all",
            (!lead.siteAddress && !lead.latitude && !lead.longitude) && "opacity-40 cursor-not-allowed hover:bg-transparent"
          )}
          title="View Location"
          disabled={!lead.siteAddress && !lead.latitude && !lead.longitude}
        >
          <GoogleMapsIcon className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onScheduleFollowup?.(lead);
          }}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all"
          title="Schedule Follow-up"
        >
          <CalendarCheck className="h-5 w-5" />
        </button>
        <Link
          href={`/leads/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 active:scale-95 transition-all ml-auto"
          title="View Details"
        >
          <Pencil className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}