import Link from "next/link";
import { cn } from "@/lib/utils";
import {
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

const stages = [
  { key: "new", label: "New", icon: CircleDot, color: "bg-zinc-100 text-zinc-600" },
  { key: "contacted", label: "Contacted", icon: PhoneCall, color: "bg-blue-100 text-blue-600" },
  { key: "meeting_scheduled", label: "Meeting", icon: CalendarCheck, color: "bg-indigo-100 text-indigo-600" },
  { key: "site_visited", label: "Site Visited", icon: MapPin, color: "bg-violet-100 text-violet-600" },
  { key: "requirement_received", label: "Requirement", icon: ClipboardList, color: "bg-cyan-100 text-cyan-600" },
  { key: "quotation_sent", label: "Quotation", icon: FileText, color: "bg-amber-100 text-amber-600" },
  { key: "negotiation", label: "Negotiation", icon: Handshake, color: "bg-orange-100 text-orange-600" },
  { key: "trial_order", label: "Trial", icon: FlaskConical, color: "bg-rose-100 text-rose-600" },
  { key: "won", label: "Won", icon: Trophy, color: "bg-emerald-100 text-emerald-600" },
  { key: "lost", label: "Lost", icon: Frown, color: "bg-red-100 text-red-600" },
];

interface Props {
  stageCounts: { stage: string | null; count: number }[];
}

export default function LeadPipeline({ stageCounts }: Props) {
  const maxCount = Math.max(...stageCounts.map((s) => s.count), 1);

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-2 min-w-max pb-1">
        {stages.map((stage) => {
          const found = stageCounts.find((s) => s.stage === stage.key);
          const count = found?.count ?? 0;
          const pct = (count / maxCount) * 100;

          return (
            <Link
              key={stage.key}
              href={`/leads?stage=${stage.key}`}
              className="flex w-28 flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-center shadow-sm transition-all hover:border-zinc-300 hover:shadow"
            >
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", stage.color)}>
                <stage.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-zinc-600">{stage.label}</span>
              <span className="text-lg font-bold text-zinc-900">{count}</span>
              <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", stage.key === "won" ? "bg-emerald-500" : stage.key === "lost" ? "bg-red-400" : "bg-blue-500")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
