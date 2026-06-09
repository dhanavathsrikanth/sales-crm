"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateInteraction } from "@/hooks/use-contacts";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const types = [
  { value: "call", label: "📞 Call" },
  { value: "whatsapp", label: "💬 WhatsApp" },
  { value: "meeting", label: "🤝 Meeting" },
  { value: "email", label: "📧 Email" },
  { value: "site_visit", label: "📍 Site Visit" },
  { value: "lunch", label: "🍽️ Lunch" },
  { value: "referral", label: "🔗 Referral" },
];

const sentiments = [
  { value: "positive", label: "👍 Positive", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "neutral", label: "😐 Neutral", color: "text-zinc-600 bg-zinc-50 border-zinc-200" },
  { value: "negative", label: "👎 Negative", color: "text-red-600 bg-red-50 border-red-200" },
];

interface Props {
  contactId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InteractionModal({ contactId, open, onOpenChange }: Props) {
  const [type, setType] = useState("call");
  const [direction, setDirection] = useState("outbound");
  const [sentiment, setSentiment] = useState("neutral");
  const [summary, setSummary] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [duration, setDuration] = useState("");
  const createInteraction = useCreateInteraction();

  const handleSubmit = async () => {
    await createInteraction.mutateAsync({
      contactId,
      type,
      direction,
      sentiment,
      summary,
      nextAction,
      duration: duration ? parseInt(duration) : undefined,
      occurredAt: new Date().toISOString(),
    });
    setSummary("");
    setNextAction("");
    setDuration("");
    setType("call");
    setSentiment("neutral");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log New Interaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {types.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    type === t.value
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Direction</Label>
            <div className="flex gap-1.5 mt-1">
              {[
                { value: "outbound", label: "📤 Outbound" },
                { value: "inbound", label: "📥 Inbound" },
              ].map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDirection(d.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    direction === d.value
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 15"
              className="h-9"
            />
          </div>

          <div>
            <Label>Summary</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="What was discussed?"
            />
          </div>

          <div>
            <Label>Sentiment</Label>
            <div className="flex gap-1.5 mt-1">
              {sentiments.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSentiment(s.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    sentiment === s.value ? s.color : "border-zinc-200 text-zinc-600 hover:border-zinc-300",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Next Action</Label>
            <Input
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="e.g. Send quotation by Friday"
              className="h-9"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createInteraction.isPending || !summary}>
              {createInteraction.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...</>
              ) : (
                "Log Interaction"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
