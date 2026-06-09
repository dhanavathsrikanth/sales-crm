"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ImageIcon,
  Download,
  Trash2,
  X,
  Loader2,
  Camera,
} from "lucide-react"

interface Photo {
  id: string
  url: string
  fileName: string | null
  fileSize: number | null
  type: string | null
  caption: string | null
  createdAt: string | null
}

interface PhotoGalleryProps {
  photos: Photo[]
  onDelete?: (id: string) => Promise<void>
}

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "site", label: "Site" },
  { value: "project", label: "Project" },
  { value: "visiting_card", label: "Card" },
  { value: "document", label: "Document" },
]

const photoTypeIcons: Record<string, any> = {
  site: Camera,
  project: ImageIcon,
  visiting_card: ImageIcon,
  document: ImageIcon,
}

export default function PhotoGallery({ photos, onDelete }: PhotoGalleryProps) {
  const [filter, setFilter] = useState("")
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = filter ? photos.filter((p) => p.type === filter) : photos

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      await onDelete?.(id)
    } catch {} finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  if (!photos.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-12 text-center">
        <Camera className="mb-3 h-10 w-10 text-zinc-300" />
        <p className="text-sm text-zinc-500">No photos yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === t.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.value && <span className="ml-1 text-[10px]">({photos.filter((p) => p.type === t.value).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-sm text-zinc-400">
          No {filter} photos
        </div>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {filtered.map((photo) => {
            const Icon = photoTypeIcons[photo.type as string] || ImageIcon
            const isPdf = photo.fileName?.toLowerCase().endsWith(".pdf")
            return (
              <div
                key={photo.id}
                className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl border bg-zinc-50"
              >
                <button
                  type="button"
                  className="block w-full"
                  onClick={() => !isPdf && setLightbox(photo)}
                >
                  {isPdf ? (
                    <div className="flex aspect-[3/4] items-center justify-center bg-zinc-100">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-zinc-300" />
                        <p className="mt-1 text-xs text-zinc-400">PDF</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={photo.url}
                      alt={photo.caption || "Photo"}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </button>
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isPdf && (
                    <a
                      href={photo.url}
                      download={photo.fileName || "download"}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-black/50 text-white hover:bg-black/70"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(photo.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/70 text-white hover:bg-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3 text-zinc-400" />
                    <span className="text-[10px] font-medium text-zinc-500 uppercase">
                      {(photo.type || "photo").replace(/_/g, " ")}
                    </span>
                  </div>
                  {photo.caption && (
                    <p className="mt-0.5 text-xs text-zinc-700 line-clamp-2">{photo.caption}</p>
                  )}
                  {photo.createdAt && (
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      {format(parseISO(photo.createdAt), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(o) => { if (!o) setLightbox(null) }}>
        <DialogContent className="sm:max-w-3xl p-1">
          {lightbox && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
              <img
                src={lightbox.url}
                alt={lightbox.caption || "Photo"}
                className="max-h-[75vh] w-full rounded-lg object-contain"
              />
              <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-b-lg">
                <div>
                  <p className="text-sm font-medium">{lightbox.caption || "No caption"}</p>
                  <p className="text-xs text-zinc-500">
                    {(lightbox.type || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    {lightbox.createdAt && ` · ${format(parseISO(lightbox.createdAt), "MMM d, yyyy h:mm a")}`}
                  </p>
                </div>
                <a
                  href={lightbox.url}
                  download={lightbox.fileName || "download"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">Are you sure? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
