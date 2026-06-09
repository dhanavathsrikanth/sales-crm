import { cn } from "@/lib/utils";

interface Props {
  lastContactedAt: string | null;
  interactionCount: number;
  sentimentOverview: string;
  className?: string;
}

function calculateHealth(lastContactedAt: string | null, interactionCount: number): { score: number; label: string; color: string; emoji: string } {
  if (!lastContactedAt) {
    return { score: 10, label: "Never Contacted", color: "bg-red-500", emoji: "🔴" };
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(lastContactedAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  let score = 100;

  if (daysSince > 90) score -= 40;
  else if (daysSince > 60) score -= 30;
  else if (daysSince > 30) score -= 15;
  else if (daysSince > 14) score -= 5;

  if (interactionCount === 0) score -= 10;
  else if (interactionCount < 3) score += 5;
  else if (interactionCount >= 10) score += 10;

  score = Math.max(0, Math.min(100, score));

  if (score >= 75) return { score, label: "Strong", color: "bg-emerald-500", emoji: "💚" };
  if (score >= 50) return { score, label: "Warm", color: "bg-yellow-500", emoji: "🟡" };
  if (score >= 25) return { score, label: "Cold", color: "bg-orange-500", emoji: "🔴" };
  return { score, label: "At Risk", color: "bg-red-600", emoji: "⚠️" };
}

export default function RelationshipHealth({ lastContactedAt, interactionCount, className }: Props) {
  const { score, label, color, emoji } = calculateHealth(lastContactedAt, interactionCount);

  return (
    <div className={cn("rounded-xl border border-zinc-200 bg-white p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-700">Relationship Health</span>
        <span className="text-sm font-semibold">
          {emoji} {label}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-zinc-100">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-zinc-400 mt-1.5">{score}/100 — {label}</p>
    </div>
  );
}
