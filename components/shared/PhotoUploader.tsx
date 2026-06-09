"use client"

import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Upload,
  Camera,
  X,
  FileText,
  Loader2,
  ImageUp,
} from "lucide-react"

interface PhotoUploaderProps {
  leadId: string
  onUploadComplete?: (photo: any) => void
}

const PHOTO_TYPES = [
  { value: "site", label: "Site Photo" },
  { value: "project", label: "Project Photo" },
  { value: "visiting_card", label: "Visiting Card" },
  { value: "document", label: "Document" },
]

export default function PhotoUploader({ leadId, onUploadComplete }: PhotoUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [photoType, setPhotoType] = useState("site")
  const [caption, setCaption] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const isMobile = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const valid: File[] = []
    for (const f of Array.from(newFiles)) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
      if (!allowed.includes(f.type)) {
        toast.error(`${f.name}: unsupported file type`)
        continue
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: exceeds 10MB limit`)
        continue
      }
      valid.push(f)
    }
    setFiles((prev) => [...prev, ...valid])
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    let completed = 0
    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("leadId", leadId)
      formData.append("type", photoType)
      if (caption) formData.append("caption", caption)
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error || "Upload failed")
        } else {
          const photo = await res.json()
          onUploadComplete?.(photo)
          toast.success(`${file.name} uploaded`)
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
      completed++
      setProgress(Math.round((completed / files.length) * 100))
    }
    setFiles([])
    setProgress(0)
    setCaption("")
    setUploading(false)
  }

  const getPreviewUrl = (file: File) => {
    if (file.type === "application/pdf") return null
    return URL.createObjectURL(file)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={photoType} onValueChange={(v) => v && setPhotoType(v)}>
          <SelectTrigger className="h-8 text-xs w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHOTO_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isMobile && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5" />
              Take Photo
            </Button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </>
        )}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          dragOver ? "border-blue-400 bg-blue-50" : "border-zinc-300 bg-zinc-50 hover:border-zinc-400",
        )}
      >
        <ImageUp className={cn("mb-2 h-8 w-8", dragOver ? "text-blue-500" : "text-zinc-300")} />
        <p className="text-sm font-medium text-zinc-600">
          {dragOver ? "Drop files here" : "Drag & drop or click to browse"}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">JPEG, PNG, WebP, PDF up to 10MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => {
              const preview = getPreviewUrl(f)
              return (
                <div key={`${f.name}-${i}`} className="group relative h-16 w-16 overflow-hidden rounded-lg border bg-zinc-100">
                  {preview ? (
                    <img src={preview} alt={f.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileText className="h-6 w-6 text-zinc-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
          <div>
            <Label className="text-[10px]">Caption (optional)</Label>
            <Input
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          {uploading && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Uploading ({progress}%)</>
            ) : (
              <><Upload className="mr-1 h-3.5 w-3.5" /> Upload {files.length > 1 ? `(${files.length} files)` : ""}</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
