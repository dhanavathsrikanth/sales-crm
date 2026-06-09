import { Phone, MessageSquare, Mail, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

const typeIcons: Record<string, any> = {
  call: Phone,
  whatsapp: MessageSquare,
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
