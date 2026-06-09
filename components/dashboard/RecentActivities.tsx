import {
  PhoneCall,
  MessageSquare,
  CalendarCheck,
  MapPin,
  Mail,
  Target,
  Camera,
  FileEdit,
  FileText,
  Trophy,
  Frown,
  PlusCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: any; color: string }> = {
  lead_created: { icon: PlusCircle, color: "text-blue-600 bg-blue-50" },
  call: { icon: PhoneCall, color: "text-emerald-600 bg-emerald-50" },
  followup_added: { icon: CalendarCheck, color: "text-indigo-600 bg-indigo-50" },
  visit: { icon: MapPin, color: "text-violet-600 bg-violet-50" },
  photo_uploaded: { icon: Camera, color: "text-pink-600 bg-pink-50" },
  stage_changed: { icon: Target, color: "text-amber-600 bg-amber-50" },
  note_added: { icon: FileEdit, color: "text-zinc-600 bg-zinc-100" },
  quotation_sent: { icon: FileText, color: "text-cyan-600 bg-cyan-50" },
  won: { icon: Trophy, color: "text-emerald-600 bg-emerald-50" },
  lost: { icon: Frown, color: "text-red-600 bg-red-50" },
};

interface Activity {
  id: string;
  type: string | null;
  description: string | null;
  createdAt: Date | null;
}

interface Props {
  activities: Activity[];
}

export default function RecentActivities({ activities }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-3.5">
        <h3 className="font-semibold text-zinc-900">Recent Activities</h3>
      </div>
      <div className="divide-y divide-zinc-100">
        {activities.map((a) => {
          const config = typeConfig[a.type ?? ""] ?? { icon: PlusCircle, color: "bg-zinc-100 text-zinc-500" };
          const Icon = config.icon;
          return (
            <div key={a.id} className="flex items-start gap-3 px-5 py-3">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", config.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-700 truncate">{a.description}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : ""}
                </p>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">No recent activities</p>
        )}
      </div>
    </div>
  );
}
