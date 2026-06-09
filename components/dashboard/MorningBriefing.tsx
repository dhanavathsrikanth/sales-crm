import { useUser } from "@clerk/nextjs";
import { CalendarDays, MapPin, ArrowRight, ListTodo } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  followupsDueToday: number;
  visitsThisWeek: number;
  loading: boolean;
}

export default function MorningBriefing({ followupsDueToday, visitsThisWeek, loading }: Props) {
  const { user } = useUser();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <Skeleton className="h-6 w-48 bg-white/20 mb-2" />
        <Skeleton className="h-4 w-32 bg-white/20 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-40 bg-white/20" />
          <Skeleton className="h-10 w-40 bg-white/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {user?.firstName || "there"} 👋
          </h1>
          <p className="mt-1 text-blue-100 text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-4">
        <Link
          href="/followups"
          className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <ListTodo className="h-4 w-4" />
          {followupsDueToday > 0 ? (
            <>You have {followupsDueToday} follow-up{followupsDueToday !== 1 ? "s" : ""} due today</>
          ) : (
            <>No follow-ups due today</>
          )}
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Link>
        <div className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-medium backdrop-blur-sm">
          <MapPin className="h-4 w-4" />
          {visitsThisWeek} site visit{visitsThisWeek !== 1 ? "s" : ""} this week
        </div>
      </div>
    </div>
  );
}
