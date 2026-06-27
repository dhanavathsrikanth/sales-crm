import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

export default function StatCard({ icon, label, value, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-zinc-200 bg-white p-3 sm:p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          {icon}
        </div>
      </div>
      <p className="mt-3 sm:mt-4 text-lg sm:text-2xl font-bold text-zinc-900">{value}</p>
      <p className="mt-0.5 text-xs sm:text-sm text-zinc-500">{label}</p>
    </div>
  );
}
