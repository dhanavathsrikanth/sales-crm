"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CircleDot, PhoneCall, CalendarCheck, MapPin, ClipboardList,
  FileText, Handshake, FlaskConical, Trophy, Frown,
} from "lucide-react";
import { useUpdateLeadStage } from "@/hooks/use-leads";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const stages = [
  { key: "new", label: "New", icon: CircleDot, color: "text-zinc-600", bar: "bg-zinc-400" },
  { key: "contacted", label: "Contacted", icon: PhoneCall, color: "text-blue-600", bar: "bg-blue-500" },
  { key: "meeting_scheduled", label: "Meeting", icon: CalendarCheck, color: "text-indigo-600", bar: "bg-indigo-500" },
  { key: "site_visited", label: "Site Visited", icon: MapPin, color: "text-violet-600", bar: "bg-violet-500" },
  { key: "requirement_received", label: "Requirement", icon: ClipboardList, color: "text-cyan-600", bar: "bg-cyan-500" },
  { key: "quotation_sent", label: "Quotation", icon: FileText, color: "text-amber-600", bar: "bg-amber-500" },
  { key: "negotiation", label: "Negotiation", icon: Handshake, color: "text-orange-600", bar: "bg-orange-500" },
  { key: "trial_order", label: "Trial", icon: FlaskConical, color: "text-rose-600", bar: "bg-rose-500" },
  { key: "won", label: "Won", icon: Trophy, color: "text-emerald-600", bar: "bg-emerald-500" },
  { key: "lost", label: "Lost", icon: Frown, color: "text-red-600", bar: "bg-red-500" },
];

interface Props {
  leadId: string;
  currentStage: string;
}

export default function StageChanger({ leadId, currentStage }: Props) {
  const [targetStage, setTargetStage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const updateStage = useUpdateLeadStage();

  const currentIdx = stages.findIndex((s) => s.key === currentStage);

  const handleClick = (key: string) => {
    if (key === currentStage) return;
    if (key === "won" || key === "lost") {
      setTargetStage(key);
    } else {
      updateStage.mutate({ id: leadId, stage: key });
    }
  };

  const confirmWonLost = () => {
    if (targetStage) {
      updateStage.mutate({ id: leadId, stage: targetStage, notes });
      setTargetStage(null);
      setNotes("");
    }
  };

  return (
    <>
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1 min-w-max pb-1">
          {stages.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.key === currentStage;
            const isPast = i <= currentIdx && s.key !== "won" && s.key !== "lost";
            const isWonLost = s.key === "won" || s.key === "lost";

            return (
              <button
                key={s.key}
                onClick={() => handleClick(s.key)}
                disabled={updateStage.isPending}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-center transition-all min-w-[64px]",
                  isActive
                    ? "bg-blue-50 ring-2 ring-blue-200"
                    : "hover:bg-zinc-50 opacity-60 hover:opacity-100",
                  isWonLost && "mt-2",
                )}
              >
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-full", s.color, isActive ? "bg-white shadow-sm" : "")}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className={cn("text-[10px] font-medium leading-tight", isActive ? "text-blue-700" : "text-zinc-500")}>
                  {s.label.split(" ")[0]}
                </span>
                {i < stages.length - 2 && (
                  <div className={cn("h-0.5 w-full rounded-full -mt-0.5", isPast ? s.bar : "bg-zinc-200")} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={!!targetStage} onOpenChange={() => setTargetStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Mark as {targetStage === "won" ? "Won" : "Lost"}
            </DialogTitle>
            <DialogDescription>
              {targetStage === "won"
                ? "Congratulations! Add any notes about this win."
                : "Add a reason for losing this lead."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={targetStage === "lost" ? "Why was this lead lost?" : "Any notes..."}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTargetStage(null)}>Cancel</Button>
            <Button
              onClick={confirmWonLost}
              disabled={updateStage.isPending}
              className={targetStage === "lost" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
