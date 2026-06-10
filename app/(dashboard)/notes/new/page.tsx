"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StickyNote, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

const COLORS = [
  { key: "yellow", label: "Yellow", className: "bg-yellow-50 border-yellow-200", activeClass: "ring-2 ring-yellow-400" },
  { key: "blue", label: "Blue", className: "bg-blue-50 border-blue-200", activeClass: "ring-2 ring-blue-400" },
  { key: "green", label: "Green", className: "bg-emerald-50 border-emerald-200", activeClass: "ring-2 ring-emerald-400" },
  { key: "pink", label: "Pink", className: "bg-pink-50 border-pink-200", activeClass: "ring-2 ring-pink-400" },
  { key: "purple", label: "Purple", className: "bg-purple-50 border-purple-200", activeClass: "ring-2 ring-purple-400" },
];

export default function NewNotePage() {
  const router = useRouter();
  const createNote = useCreateNote();

  const [content, setContent] = useState("");
  const [color, setColor] = useState("yellow");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await createNote.mutateAsync({ content: content.trim(), color });
      router.push("/notes");
    } catch {
      // error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/notes">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Quick Note</h1>
          <p className="text-xs text-zinc-500">Jot down a quick thought</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex gap-1.5 mb-2">
          {COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => setColor(c.key)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-all",
                c.className,
                color === c.key && c.activeClass
              )}
              title={c.label}
            />
          ))}
        </div>

        <Textarea
          placeholder="Write your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          autoFocus
          className="resize-none text-sm"
        />

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={!content.trim() || saving || createNote.isPending} className="flex-1">
            {createNote.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Save Note</>
            )}
          </Button>
          <Link href="/notes">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
        <p className="text-xs text-zinc-500 text-center">
          Notes are saved to your personal dashboard and can be pinned to appear on your home screen.
        </p>
      </div>
    </div>
  );
}