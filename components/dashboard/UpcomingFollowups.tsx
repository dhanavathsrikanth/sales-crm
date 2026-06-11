import { Phone, Mail, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#25D366" viewBox="0 0 16 16">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
    </svg>
  );
}

const typeIcons: Record<string, any> = {
  call: Phone,
  whatsapp: WhatsAppIcon,
  meeting: Users,
  site_visit: MapPin,
  email: Mail,
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-zinc-100 text-zinc-600",
};

interface Followup {
  id: string;
  followupDate: string | null;
  followupTime: string | null;
  type: string | null;
  priority: string | null;
  notes: string | null;
  leadId: string | null;
  leadName: string | null;
}

interface Props {
  followups: Followup[];
}

export default function UpcomingFollowups({ followups }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-3.5">
        <h3 className="font-semibold text-zinc-900">Upcoming Follow-ups</h3>
      </div>
      <div className="divide-y divide-zinc-100">
        {followups.map((f) => {
          const Icon = typeIcons[f.type ?? ""] ?? Phone;
          return (
            <Link
              key={f.id}
              href={f.leadId ? `/leads/${f.leadId}` : "#"}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {f.leadName || "Unknown Lead"}
                </p>
                <p className="text-xs text-zinc-500">
                  {f.followupDate && format(new Date(f.followupDate), "MMM d")}
                  {f.followupTime && ` at ${f.followupTime.slice(0, 5)}`}
                </p>
              </div>
              {f.priority && (
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", priorityColors[f.priority])}>
                  {f.priority}
                </span>
              )}
            </Link>
          );
        })}
        {followups.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">No upcoming follow-ups</p>
        )}
      </div>
    </div>
  );
}
