"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTodayScheduledItems } from "@/lib/actions/schedule";
import { format } from "date-fns";
import {
  Phone,
  MessageSquare,
  Calendar,
  MapPin,
  Mail,
  Bell,
  X,
  Clock,
} from "lucide-react";

const TYPE_META: Record<string, { icon: React.ReactNode; label: string }> = {
  call: { icon: <Phone className="h-3.5 w-3.5" />, label: "Call" },
  whatsapp: { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "WhatsApp" },
  meeting: { icon: <Calendar className="h-3.5 w-3.5" />, label: "Meeting" },
  site_visit: { icon: <MapPin className="h-3.5 w-3.5" />, label: "Site Visit" },
  email: { icon: <Mail className="h-3.5 w-3.5" />, label: "Email" },
};

function formatTime(time: string | null) {
  if (!time) return "All day";
  try {
    const d = new Date(`2000-01-01T${time}`);
    return format(d, "h:mm a");
  } catch {
    return time;
  }
}

export default function ScheduleReminder() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dismissed, setDismissed] = useState(false);

  const { data, isFetched } = useQuery({
    queryKey: ["schedule-today"],
    queryFn: async () => {
      const res = await getTodayScheduledItems();
      if (!res.success) throw new Error(res.error || "Failed to fetch");
      return res.data ?? [];
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (isFetched && data && data.length > 0 && !dismissed && dialogRef.current) {
      dialogRef.current.showModal();
    }
  }, [isFetched, data, dismissed]);

  const close = useCallback(() => {
    dialogRef.current?.close();
    setDismissed(true);
  }, []);

  const snooze = useCallback(() => {
    dialogRef.current?.close();
    setTimeout(() => setDismissed(false), 5 * 60 * 1000);
  }, []);

  const items = data ?? [];

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto max-h-[80vh] w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm open:flex open:flex-col"
      onClick={(e) => { if (e.target === dialogRef.current) close(); }}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
            <Bell className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Schedule Reminder</h2>
            <p className="text-xs text-zinc-500">{format(new Date(), "EEEE, MMM d")}</p>
          </div>
        </div>
        <button
          onClick={close}
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto px-5 py-4">
        <p className="mb-3 text-sm font-medium text-zinc-700">
          You have {items.length} {items.length === 1 ? "item" : "items"} scheduled today:
        </p>
        <div className="space-y-2">
          {items.map((item) => {
            const meta = TYPE_META[item.type as string] ?? {
              icon: <Calendar className="h-3.5 w-3.5" />,
              label: item.type ?? "Follow-up",
            };
            return (
              <div
                key={`${item.source}-${item.id}`}
                className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {item.leadCompanyName || item.leadContactPerson || "Untitled"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {meta.label}
                    {item.leadContactPerson && item.source === "main"
                      ? ` · ${item.leadContactPerson}`
                      : ""}
                  </p>
                  {item.notes && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(item.followupTime)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3">
        <button
          onClick={snooze}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          Remind later
        </button>
        <button
          onClick={close}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          {items.length === 0 ? "Close" : "Got it"}
        </button>
      </div>
    </dialog>
  );
}
