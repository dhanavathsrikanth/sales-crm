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
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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