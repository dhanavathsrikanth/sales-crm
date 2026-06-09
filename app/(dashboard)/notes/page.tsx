"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Pin, PinOff, Palette, Link2, Unlink, Trash2, Search,
  Plus, X, Loader2, StickyNote, ExternalLink, Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

const COLORS = [
  { name: "yellow", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", hover: "hover:bg-amber-100" },
  { name: "blue", bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-900", hover: "hover:bg-sky-100" },
  { name: "green", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", hover: "hover:bg-emerald-100" },
  { name: "pink", bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-900", hover: "hover:bg-pink-100" },
  { name: "purple", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-900", hover: "hover:bg-purple-100" },
];

const COLOR_MAP: Record<string, typeof COLORS[0]> = Object.fromEntries(COLORS.map((c) => [c.name, c]));

export default function NotesPage() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState("yellow");
  const [newPinned, setNewPinned] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [linkResults, setLinkResults] = useState<any[]>([]);
  const [linkingNoteId, setLinkingNoteId] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<"lead" | "contact">("lead");
  const debounceRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: notes = [], isLoading } = useNotes({ search: search || undefined });
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const pinned = notes.filter((n) => n.isPinned);
  const unpinned = notes.filter((n) => !n.isPinned);

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !(e.target as Element)?.closest("input, textarea, [contenteditable]")) {
        e.preventDefault();
        setShowAdd(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    try {
      await createNote.mutateAsync({ content: newContent.trim(), color: newColor, isPinned: newPinned });
      setNewContent("");
      setNewColor("yellow");
      setNewPinned(false);
      setShowAdd(false);
      toast.success("Note created");
    } catch {
      toast.error("Failed to create note");
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await updateNote.mutateAsync({ id, ...data });
    } catch {
      toast.error("Failed to update note");
    }
  };

  const handleDelete = async (id: string) => {
    const deleted = notes.find((n) => n.id === id);
    try {
      await deleteNote.mutateAsync(id);
      toast("Note deleted", {
        icon: <Trash2 className="h-4 w-4" />,
        action: {
          label: "Undo",
          onClick: async () => {
            if (deleted) {
              await createNote.mutateAsync({
                content: deleted.content,
                color: deleted.color,
                isPinned: deleted.isPinned,
                leadId: deleted.leadId || undefined,
                contactId: deleted.contactId || undefined,
              });
              toast.success("Note restored");
            }
          },
        },
      });
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const searchLink = useCallback(async (q: string) => {
    if (!q) { setLinkResults([]); return; }
    const endpoint = linkType === "lead" ? "/api/leads/search" : "/api/contacts/search";
    try {
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setLinkResults(data);
    } catch {
      setLinkResults([]);
    }
  }, [linkType]);

  const handleLinkSearch = (q: string) => {
    setLinkSearch(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLink(q), 250);
  };

  const handleLink = async (noteId: string, targetId: string) => {
    const data = linkType === "lead" ? { leadId: targetId } : { contactId: targetId };
    await handleUpdate(noteId, data);
    setLinkingNoteId(null);
    setLinkSearch("");
    setLinkResults([]);
    toast.success("Note linked");
  };

  const handleUnlink = async (noteId: string, type: "lead" | "contact") => {
    const data = type === "lead" ? { leadId: null } : { contactId: null };
    await handleUpdate(noteId, data);
    toast.success("Link removed");
  };

  useEffect(() => { autoResize(textareaRef.current); }, [newContent]);
  useEffect(() => { autoResize(editTextareaRef.current); }, [editContent]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quick Notes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Press <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-mono">N</kbd> to quick-add</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!showAdd && (
        <button
          onClick={() => { setShowAdd(true); setTimeout(() => textareaRef.current?.focus(), 100); }}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-white p-4 text-zinc-400 transition-colors hover:border-blue-300 hover:text-blue-500"
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">New Note</span>
        </button>
      )}

      {showAdd && (
        <div className={cn("rounded-xl border-2 p-4 shadow-sm space-y-3 transition-colors", COLOR_MAP[newColor]?.bg, COLOR_MAP[newColor]?.border)}>
          <textarea
            ref={textareaRef}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write a note..."
            rows={2}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleCreate();
              if (e.key === "Escape") { setShowAdd(false); setNewContent(""); }
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setNewColor(c.name)}
                  className={cn("h-6 w-6 rounded-full border-2 transition-all", c.bg,
                    newColor === c.name ? "scale-110 border-zinc-600" : "border-transparent hover:scale-110"
                  )}
                />
              ))}
              <div className="h-5 w-px bg-zinc-300" />
              <button
                type="button"
                onClick={() => setNewPinned(!newPinned)}
                className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                  newPinned ? "text-blue-600 bg-blue-50" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                )}
              >
                {newPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewContent(""); }}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleCreate} disabled={!newContent.trim() || createNote.isPending}>
                {createNote.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {pinned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pin className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-zinc-700">Pinned ({pinned.length})</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {pinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isEditing={editingId === note.id}
                editContent={editContent}
                linkingNoteId={linkingNoteId}
                linkSearch={linkSearch}
                linkResults={linkResults}
                linkType={linkType}
                onStartEdit={() => { setEditingId(note.id); setEditContent(note.content); }}
                onEditContentChange={(v) => setEditContent(v)}
                onSaveEdit={() => { handleUpdate(note.id, { content: editContent }); setEditingId(null); }}
                onCancelEdit={() => setEditingId(null)}
                onColorChange={(color) => handleUpdate(note.id, { color })}
                onTogglePin={() => handleUpdate(note.id, { isPinned: !note.isPinned })}
                onDelete={() => handleDelete(note.id)}
                onStartLink={() => { setLinkingNoteId(note.id); setLinkSearch(""); setLinkResults([]); }}
                onLinkSearch={handleLinkSearch}
                onLink={handleLink}
                onUnlink={(type) => handleUnlink(note.id, type)}
                onLinkTypeChange={setLinkType}
                setLinkingNoteId={setLinkingNoteId}
                className="min-w-[280px] max-w-[320px] shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : unpinned.length === 0 && pinned.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <StickyNote className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">No notes yet</p>
          <p className="text-xs mt-1">Press <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-mono">N</kbd> or click + New Note to get started</p>
        </div>
      ) : unpinned.length === 0 && search ? (
        <div className="flex justify-center py-12 text-zinc-400">
          <p className="text-sm">No notes match your search</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {unpinned.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              editContent={editContent}
              linkingNoteId={linkingNoteId}
              linkSearch={linkSearch}
              linkResults={linkResults}
              linkType={linkType}
              onStartEdit={() => { setEditingId(note.id); setEditContent(note.content); }}
              onEditContentChange={(v) => setEditContent(v)}
              onSaveEdit={() => { handleUpdate(note.id, { content: editContent }); setEditingId(null); }}
              onCancelEdit={() => setEditingId(null)}
              onColorChange={(color) => handleUpdate(note.id, { color })}
              onTogglePin={() => handleUpdate(note.id, { isPinned: !note.isPinned })}
              onDelete={() => handleDelete(note.id)}
              onStartLink={() => { setLinkingNoteId(note.id); setLinkSearch(""); setLinkResults([]); }}
              onLinkSearch={handleLinkSearch}
              onLink={handleLink}
              onUnlink={(type) => handleUnlink(note.id, type)}
              onLinkTypeChange={setLinkType}
              setLinkingNoteId={setLinkingNoteId}
              className="break-inside-avoid"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note, isEditing, editContent, linkingNoteId, linkSearch, linkResults, linkType,
  onStartEdit, onEditContentChange, onSaveEdit, onCancelEdit,
  onColorChange, onTogglePin, onDelete, onStartLink, onLinkSearch, onLink,
  onUnlink, onLinkTypeChange, setLinkingNoteId, className,
}: {
  note: any; isEditing: boolean; editContent: string; linkingNoteId: string | null;
  linkSearch: string; linkResults: any[]; linkType: "lead" | "contact";
  onStartEdit: () => void; onEditContentChange: (v: string) => void;
  onSaveEdit: () => void; onCancelEdit: () => void;
  onColorChange: (color: string) => void; onTogglePin: () => void; onDelete: () => void;
  onStartLink: () => void; onLinkSearch: (q: string) => void;
  onLink: (noteId: string, targetId: string) => void;
  onUnlink: (type: "lead" | "contact") => void;
  onLinkTypeChange: (t: "lead" | "contact") => void;
  setLinkingNoteId: (id: string | null) => void;
  className?: string;
}) {
  const color = COLOR_MAP[note.color] || COLOR_MAP.yellow;
  const editRef = useRef<HTMLTextAreaElement>(null);
  const [colorOpen, setColorOpen] = useState(false);

  useEffect(() => { if (isEditing) editRef.current?.focus(); }, [isEditing]);

  useEffect(() => { if (editRef.current) { editRef.current.style.height = "auto"; editRef.current.style.height = editRef.current.scrollHeight + "px"; } }, [editContent]);

  return (
    <div className={cn("group rounded-xl border-2 p-4 shadow-sm transition-all hover:shadow-md", color.bg, className)}>
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={editRef}
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            rows={3}
            className="w-full resize-none bg-transparent text-sm outline-none"
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }}
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancelEdit}>Cancel</Button>
            <Button type="button" size="sm" onClick={onSaveEdit}>Save</Button>
          </div>
        </div>
      ) : (
        <>
          <div onClick={onStartEdit} className="cursor-text min-h-[3rem]">
            <p className={cn("text-sm whitespace-pre-wrap", color.text)}>{note.content}</p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span>{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span>
              {(note.lead || note.contact) && (
                <>
                  <span>·</span>
                  {note.lead && (
                    <Link href={`/leads/${note.lead.id}`} className="flex items-center gap-1 text-blue-500 hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      {note.lead.companyName || note.lead.contactPerson}
                    </Link>
                  )}
                  {note.contact && (
                    <span className="flex items-center gap-1 text-purple-500">
                      <ExternalLink className="h-3 w-3" />
                      {`${note.contact.firstName || ""} ${note.contact.lastName || ""}`.trim() || note.contact.company}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={onTogglePin} className={cn("flex h-7 w-7 items-center justify-center rounded-md",
              note.isPinned ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600 hover:bg-black/5")}>
              {note.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>

            <div className="relative">
              <button type="button" onClick={() => setColorOpen(!colorOpen)} className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-black/5">
                <Palette className="h-3.5 w-3.5" />
              </button>
              {colorOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setColorOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg">
                    {COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => { onColorChange(c.name); setColorOpen(false); }}
                        className={cn("h-5 w-5 rounded-full border-2 transition-all", c.bg,
                          note.color === c.name ? "border-zinc-600" : "border-transparent hover:scale-110"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <button type="button" onClick={onStartLink} className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-black/5">
              <Link2 className="h-3.5 w-3.5" />
            </button>

            {(note.lead || note.contact) && (
              <button type="button" onClick={() => onUnlink(note.lead ? "lead" : "contact")} className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50">
                <Unlink className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="flex-1" />

            <button type="button" onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}

      {linkingNoteId === note.id && (
        <div className="mt-3 space-y-2 border-t border-black/10 pt-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1">
            <button type="button" onClick={() => onLinkTypeChange("lead")} className={cn("rounded-md px-2 py-1 text-[11px] font-medium", linkType === "lead" ? "bg-blue-100 text-blue-700" : "text-zinc-500 hover:bg-zinc-100")}>Lead</button>
            <button type="button" onClick={() => onLinkTypeChange("contact")} className={cn("rounded-md px-2 py-1 text-[11px] font-medium", linkType === "contact" ? "bg-purple-100 text-purple-700" : "text-zinc-500 hover:bg-zinc-100")}>Contact</button>
            <div className="flex-1" />
            <button type="button" onClick={() => setLinkingNoteId(null)} className="text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button>
          </div>
          <input
            value={linkSearch}
            onChange={(e) => onLinkSearch(e.target.value)}
            placeholder={`Search ${linkType}s...`}
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs outline-none focus:border-blue-400"
            autoFocus
          />
          {linkResults.length > 0 && (
            <div className="max-h-36 overflow-y-auto space-y-0.5">
              {linkResults.map((r: any) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onLink(note.id, r.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left hover:bg-black/5"
                >
                  <Link2 className="h-3 w-3 shrink-0 text-zinc-400" />
                  <span className="font-medium truncate">{r.companyName || `${r.firstName || ""} ${r.lastName || ""}`.trim()}</span>
                  <span className="text-zinc-400 truncate">{r.contactPerson || r.mobile || ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
