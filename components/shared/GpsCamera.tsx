"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Camera, MapPin, Loader2, Navigation, RefreshCw,
  Download, Upload, CheckCircle2, AlertCircle, X,
  Maximize2, ChevronLeft, ChevronRight, Trash2,
  RotateCcw, Sun, Moon, Layers, SaveAll,
  Crosshair, Target, Share,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadToGallery, shareFile } from "@/lib/utils/save-to-gallery"
import db from "@/lib/offline/db"

interface GpsCameraProps {
  leadId: string
  onUploadComplete?: () => void
}

interface GpsInfo {
  lat: number
  lng: number
  accuracy: number
  placeName: string
  displayName: string
}

interface Capture {
  id: string
  dataUrl: string
  blob: Blob | null
  gps: GpsInfo
  width: number
  height: number
  mapTileUrl: string | null
  galleryStatus: "idle" | "saving" | "done" | "failed"
  crmStatus: "idle" | "saving" | "done" | "failed"
}

type StepStatus = Capture["galleryStatus"]

function GpsAccuracyDot({ accuracy }: { accuracy: number }) {
  const color = accuracy < 10 ? "bg-emerald-500" : accuracy < 30 ? "bg-amber-500" : "bg-red-500"
  const pulse = accuracy < 10 ? "animate-pulse" : ""
  return <span className={cn("inline-block h-2 w-2 rounded-full", color, pulse)} />
}

function getAccuracyLabel(accuracy: number) {
  if (accuracy < 10) return "High"
  if (accuracy < 30) return "Medium"
  if (accuracy < 100) return "Low"
  return "Poor"
}

export default function GpsCamera({ leadId, onUploadComplete }: GpsCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "session">("loading")
  const [error, setError] = useState<string | null>(null)
  const [gpsStatus, setGpsStatus] = useState("")
  const [currentGps, setCurrentGps] = useState<GpsInfo | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [torchOn, setTorchOn] = useState(false)

  const [captures, setCaptures] = useState<Capture[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null)
  const [shareStatus, setShareStatus] = useState<StepStatus>("idle")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const thumbnailRef = useRef<HTMLDivElement>(null)

  const activeCapture = captures[activeIndex] || null

  useEffect(() => {
    startCamera(facingMode)
    return () => stopCamera()
  }, [facingMode])

  async function startCamera(facing: "environment" | "user") {
    stopCamera()
    setError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 3840 }, height: { ideal: 2160 } },
      })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
      setState("ready")
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.")
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setTorchOn(false)
  }

  async function toggleTorch() {
    const track = stream?.getVideoTracks()[0]
    if (!track) return
    const capabilities = track.getCapabilities() as any
    if (!capabilities?.torch) {
      toast.error("Flash not available on this camera")
      return
    }
    const next = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] } as any)
      setTorchOn(next)
    } catch { toast.error("Could not toggle flash") }
  }

  function toggleCamera() {
    setFacingMode((f) => (f === "environment" ? "user" : "environment"))
  }

  function getPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      })
    })
  }

  async function reverseGeocode(lat: number, lng: number) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
      { headers: { "User-Agent": "RMCSalesCRM/1.0" } },
    )
    if (!res.ok) throw new Error("Geocoding failed")
    const data = await res.json()
    return {
      placeName: data.name || data.address?.road || data.address?.suburb || data.address?.city_district || "",
      displayName: data.display_name || "",
    }
  }

  function latLngToTile(lat: number, lng: number, zoom: number) {
    const n = Math.pow(2, zoom)
    const x = Math.floor(((lng + 180) / 360) * n)
    const latRad = (lat * Math.PI) / 180
    const y = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
    )
    return { x, y }
  }

  async function fetchMapTile(lat: number, lng: number): Promise<string | null> {
    if (!lat && !lng) return null
    try {
      const zoom = 16
      const { x, y } = latLngToTile(lat, lng, zoom)
      const url = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
      const img = new Image()
      img.crossOrigin = "anonymous"
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject()
        img.src = url
      })
      const c = document.createElement("canvas")
      c.width = 256
      c.height = 256
      const ctx = c.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      return c.toDataURL("image/png")
    } catch {
      return null
    }
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
    if (!text) return []
    const words = text.split(", ").join(" ").split(" ")
    const lines: string[] = []
    let line = ""
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
      if (lines.length >= 3) break
    }
    if (line) lines.push(line)
    return lines
  }

  function formatISTDateTime(date: Date): string {
    const ist = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const day = weekdays[ist.getDay()]
    const d = ist.getDate().toString().padStart(2, "0")
    const m = (ist.getMonth() + 1).toString().padStart(2, "0")
    const y = ist.getFullYear()
    let hours = ist.getHours()
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    const h = hours.toString().padStart(2, "0")
    const min = ist.getMinutes().toString().padStart(2, "0")
    return `${day}, ${d}/${m}/${y} ${h}:${min} ${ampm} GMT +05:30`
  }

  async function compressToTarget(
    sourceCanvas: HTMLCanvasElement,
    targetBytes: number = 400 * 1024,
  ): Promise<{ blob: Blob; dataUrl: string }> {
    let quality = 0.65
    let maxDim = 1920

    for (let attempt = 0; attempt < 6; attempt++) {
      const tempCanvas = document.createElement("canvas")
      const tCtx = tempCanvas.getContext("2d")!
      const w = sourceCanvas.width
      const h = sourceCanvas.height
      const scale = Math.min(maxDim / w, maxDim / h, 1)
      tempCanvas.width = Math.round(w * scale)
      tempCanvas.height = Math.round(h * scale)
      tCtx.drawImage(sourceCanvas, 0, 0, tempCanvas.width, tempCanvas.height)

      const blob = await new Promise<Blob>((resolve, reject) => {
        tempCanvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error("toBlob failed"))
        }, "image/jpeg", quality)
      })

      const dataUrl = tempCanvas.toDataURL("image/jpeg", quality)

      if (blob.size <= targetBytes) return { blob, dataUrl }

      quality *= 0.7
      maxDim = Math.round(maxDim * 0.8)
    }

    const tempCanvas = document.createElement("canvas")
    const tCtx = tempCanvas.getContext("2d")!
    const w = sourceCanvas.width
    const h = sourceCanvas.height
    const scale = Math.min(1280 / w, 1280 / h, 1)
    tempCanvas.width = Math.round(w * scale)
    tempCanvas.height = Math.round(h * scale)
    tCtx.drawImage(sourceCanvas, 0, 0, tempCanvas.width, tempCanvas.height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      tempCanvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error("toBlob failed"))
      }, "image/jpeg", 0.35)
    })
    const dataUrl = tempCanvas.toDataURL("image/jpeg", 0.35)
    return { blob, dataUrl }
  }

  async function drawStamp(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    info: GpsInfo,
    mapTileUrl: string | null,
  ) {
    const stampH = Math.round(h * 0.40)
    const topY = h - stampH
    const pad = Math.round(h * 0.018)

    ctx.fillStyle = "rgba(0, 0, 0, 0.78)"
    ctx.fillRect(0, topY, w, stampH)

    const mapSize = mapTileUrl
      ? Math.min(Math.round(stampH * 0.65), Math.round(w * 0.18))
      : 0
    const mapX = pad
    const mapY = topY + pad

    if (mapTileUrl) {
      const img = new Image()
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve()
        img.src = mapTileUrl
      })
      if (img.complete && img.naturalWidth > 0) {
        ctx.save()
        ctx.beginPath()
        const r = Math.round(mapSize * 0.06)
        ctx.roundRect(mapX, mapY, mapSize, mapSize, r)
        ctx.clip()
        ctx.drawImage(img, mapX, mapY, mapSize, mapSize)
        ctx.restore()

        const pinX = mapX + mapSize / 2
        const pinY = mapY + mapSize / 2
        ctx.beginPath()
        ctx.moveTo(pinX - 5, pinY + 2)
        ctx.quadraticCurveTo(pinX, pinY - 10, pinX + 5, pinY + 2)
        ctx.fillStyle = "#EF4444"
        ctx.fill()
        ctx.beginPath()
        ctx.arc(pinX, pinY - 3, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = "#FFFFFF"
        ctx.fill()
      }
    }

    const textX = mapTileUrl ? mapX + mapSize + pad * 1.5 : pad
    const textMaxW = w - textX - pad

    const citySize = Math.round(h * 0.036)
    const cityText = info.placeName || "Unknown Location"
    ctx.fillStyle = "#FFFFFF"
    ctx.font = `bold ${citySize}px sans-serif`
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(cityText + "  \u{1F1EE}\u{1F1F3}", textX, mapY, textMaxW)

    const addrSize = Math.round(h * 0.021)
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)"
    ctx.font = `${addrSize}px sans-serif`
    const addr = info.displayName || ""
    const addrLines = wrapText(ctx, addr, textMaxW)
    addrLines.forEach((line, i) => {
      ctx.fillText(line, textX, mapY + citySize + 8 + i * (addrSize + 5), textMaxW)
    })

    const coordY = mapY + citySize + 8 + addrLines.length * (addrSize + 5) + 14
    const coordSize = Math.round(h * 0.024)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = `bold ${coordSize}px sans-serif`
    ctx.fillText(
      `Lat ${info.lat.toFixed(6)}\u00B0   Long ${info.lng.toFixed(6)}\u00B0`,
      textX,
      coordY,
      textMaxW,
    )

    const dtY = coordY + coordSize + 10
    const dtSize = Math.round(h * 0.019)
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)"
    ctx.font = `${dtSize}px sans-serif`
    ctx.fillText(formatISTDateTime(new Date()), textX, dtY, textMaxW)

    const brandSize = Math.round(h * 0.016)
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    ctx.font = `bold ${brandSize}px sans-serif`
    ctx.textAlign = "right"
    ctx.fillText("GPS CAMERA", w - pad, topY + pad)
    ctx.textAlign = "left"
  }

  function pad(n: number) { return n.toString().padStart(2, "0") }

  function buildFilename(info: GpsInfo, index: number) {
    const now = new Date()
    const loc = (info.placeName || "Unknown")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .slice(0, 25)
    const y = now.getFullYear()
    const m = pad(now.getMonth() + 1)
    const d = pad(now.getDate())
    const h = pad(now.getHours())
    const min = pad(now.getMinutes())
    const sec = pad(now.getSeconds())
    return `PRISM_RMC_${loc}_${y}${m}${d}_${h}${min}${sec}_${index}.jpg`
  }

  async function captureImage(info: GpsInfo): Promise<{ dataUrl: string; blob: Blob; width: number; height: number; mapTileUrl: string | null }> {
    const video = videoRef.current!
    const canvas = canvasRef.current!
    canvas.width = video.videoWidth || 1920
    canvas.height = video.videoHeight || 1080
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, 0, 0)

    const mapTileUrl = await fetchMapTile(info.lat, info.lng)
    await drawStamp(ctx, canvas.width, canvas.height, info, mapTileUrl)

    const { blob, dataUrl } = await compressToTarget(canvas, 400 * 1024)
    return { dataUrl, blob, width: canvas.width, height: canvas.height, mapTileUrl }
  }

  async function handleCapture() {
    setGpsStatus("Getting GPS location...")
    let info: GpsInfo
    try {
      const pos = await getPosition()
      const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
      info = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
        placeName: geo.placeName,
        displayName: geo.displayName,
      }
    } catch {
      info = {
        lat: 0, lng: 0, accuracy: 999,
        placeName: "Location unavailable",
        displayName: "",
      }
    }
    setCurrentGps(info)
    setGpsStatus("")

    const { dataUrl, blob, width, height, mapTileUrl } = await captureImage(info)
    const newCapture: Capture = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      dataUrl, blob, width, height, gps: info, mapTileUrl,
      galleryStatus: "idle", crmStatus: "idle",
    }

    setCaptures((prev) => {
      const next = [...prev, newCapture]
      setActiveIndex(next.length - 1)
      return next
    })
    setState("session")

    setTimeout(() => {
      thumbnailRef.current?.scrollTo({ left: thumbnailRef.current.scrollWidth, behavior: "smooth" })
    }, 50)
  }

  async function getBlob(capture: Capture): Promise<Blob> {
    if (capture.blob) return capture.blob
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = capture.dataUrl
    })
    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error("toBlob failed"))
      }, "image/jpeg", 0.65)
    })
    return blob
  }

  function setCaptureStatus(
    id: string,
    field: "galleryStatus" | "crmStatus",
    status: Capture["galleryStatus"],
  ) {
    setCaptures((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: status } : c)),
    )
  }

  async function handleSaveToGallery(id: string) {
    const capture = captures.find((c) => c.id === id)
    if (!capture) return
    setCaptureStatus(id, "galleryStatus", "saving")
    try {
      const blob = await getBlob(capture)
      const filename = buildFilename(capture.gps, captures.indexOf(capture))
      await downloadToGallery(blob, filename)
      setCaptureStatus(id, "galleryStatus", "done")
      toast.success("Saved to Photos")
    } catch {
      setCaptureStatus(id, "galleryStatus", "failed")
      setFullscreenIdx(captures.indexOf(capture))
      toast.error("Tap and hold photo → Save to Photos")
    }
  }

  async function handleSaveToCrm(id: string) {
    const capture = captures.find((c) => c.id === id)
    if (!capture) return
    setCaptureStatus(id, "crmStatus", "saving")
    try {
      const blob = await getBlob(capture)
      const filename = buildFilename(capture.gps, captures.indexOf(capture))
      const formData = new FormData()
      formData.append("file", blob, filename)
      formData.append("leadId", leadId)
      formData.append("type", "site")
      formData.append(
        "caption",
        `📍 ${capture.gps.placeName || "GPS Photo"} · ${capture.gps.lat.toFixed(6)}, ${capture.gps.lng.toFixed(6)}`,
      )
      formData.append("lat", capture.gps.lat.toString())
      formData.append("lng", capture.gps.lng.toString())
      formData.append("address", capture.gps.displayName)

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error(`Upload failed (${res.status})`)
      setCaptureStatus(id, "crmStatus", "done")
      toast.success("Saved to CRM")
      onUploadComplete?.()
    } catch {
      setCaptureStatus(id, "crmStatus", "failed")
      try {
        await db.syncQueue.add({
          action: "create",
          table: "photos" as any,
          data: { leadId, gps: capture.gps },
          createdAt: new Date().toISOString(),
        })
      } catch {}
      toast.error("CRM upload failed — will retry when online.")
    }
  }

  async function handleShare(id: string) {
    const capture = captures.find((c) => c.id === id)
    if (!capture) return
    setShareStatus("saving")
    try {
      const blob = await getBlob(capture)
      const filename = buildFilename(capture.gps, captures.indexOf(capture))
      await shareFile(blob, filename)
      setShareStatus("done")
      toast.success("Shared")
    } catch {
      setShareStatus("failed")
      toast.error("Share cancelled or failed")
    }
    setTimeout(() => setShareStatus("idle"), 1500)
  }

  async function handleSaveAll(field: "galleryStatus" | "crmStatus") {
    const pending = captures.filter((c) => c[field] === "idle" || c[field] === "failed")
    if (pending.length === 0) {
      toast.info("All photos already saved")
      return
    }
    const label = field === "galleryStatus" ? "Gallery" : "CRM"
    const fn = field === "galleryStatus" ? handleSaveToGallery : handleSaveToCrm
    toast(`Saving ${pending.length} photos to ${label}...`)
    for (const c of pending) {
      await fn(c.id)
    }
    toast.success(`Saved ${pending.length} photos to ${label}`)
  }

  function handleDeleteCapture(id: string) {
    const idx = captures.findIndex((c) => c.id === id)
    setCaptures((prev) => {
      const next = prev.filter((c) => c.id !== id)
      if (next.length === 0) {
        setState("ready")
        setActiveIndex(0)
        if (!stream) startCamera(facingMode)
      } else {
        setActiveIndex(Math.min(idx, next.length - 1))
      }
      return next
    })
  }

  function handleContinueCapture() {
    if (!stream) startCamera(facingMode)
    else setState("ready")
  }

  function handleNewSession() {
    stopCamera()
    setCaptures([])
    setActiveIndex(0)
    setCurrentGps(null)
    setState("loading")
    startCamera(facingMode)
  }

  function StatusIcon({ status }: { status: StepStatus }) {
    if (status === "saving") return <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400" />
    if (status === "done") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    if (status === "failed") return <AlertCircle className="h-3.5 w-3.5 text-red-400" />
    return null
  }

  const allGalleryDone = captures.length > 0 && captures.every((c) => c.galleryStatus === "done")
  const allCrmDone = captures.length > 0 && captures.every((c) => c.crmStatus === "done")

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <Camera className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-sm text-zinc-500 text-center max-w-xs">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => startCamera(facingMode)}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Try Again
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleCamera}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Switch Camera
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading */}
      {state === "loading" && (
        <div className="flex h-64 sm:h-72 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
          <p className="text-xs text-zinc-500">Starting camera...</p>
        </div>
      )}

      {/* Camera View */}
      {state === "ready" && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-[50vh] sm:h-[65vh] object-cover"
          />

          {/* Camera overlay controls */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-3 sm:p-3">
            <div className="flex gap-2">
              <button
                onClick={toggleCamera}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors active:bg-black/70 active:text-white"
                title="Switch camera"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={toggleTorch}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-95",
                  torchOn
                    ? "bg-orange-500/80 text-white"
                    : "bg-black/50 text-white/80 active:bg-black/70 active:text-white",
                )}
                title="Flash"
              >
                {torchOn ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

            {currentGps && (
              <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur-sm">
                <GpsAccuracyDot accuracy={currentGps.accuracy} />
                <span className="hidden sm:inline">{getAccuracyLabel(currentGps.accuracy)}</span>
              </div>
            )}
          </div>

          {/* GPS status + capture button */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-5 pt-12 sm:p-6 sm:pt-12">
            <div className="flex flex-col items-center gap-3">
              {gpsStatus ? (
                <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {gpsStatus}
                </div>
              ) : (
                <div className="h-5" />
              )}
              <button
                onClick={handleCapture}
                disabled={!!gpsStatus}
                className="group relative active:scale-95 transition-transform"
              >
                <div className="absolute -inset-3 rounded-full bg-white/10 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-20" />
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-[5px] border-white/90 bg-transparent">
                  <div className="h-14 w-14 rounded-full bg-white transition-colors group-active:bg-white/80" />
                </div>
              </button>
            </div>
          </div>

          {/* Session count badge */}
          {captures.length > 0 && (
            <button
              onClick={() => { setState("session"); stopCamera() }}
              className="absolute right-3 bottom-32 flex items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-2 text-xs text-white/80 backdrop-blur-sm transition-colors active:bg-black/80"
            >
              <Layers className="h-4 w-4" />
              {captures.length} photo{captures.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Session Review */}
      {state === "session" && captures.length > 0 && (
        <div className="flex flex-col pb-20 sm:pb-0">
          {/* Main preview */}
          <div className="relative bg-black">
            <img
              src={activeCapture!.dataUrl}
              alt={`Photo ${activeIndex + 1}`}
              className="w-full h-[40vh] sm:max-h-[55vh] object-contain cursor-pointer"
              onClick={() => setFullscreenIdx(activeIndex)}
            />

            {/* Nav arrows */}
            {captures.length > 1 && (
              <>
                {activeIndex > 0 && (
                  <button
                    onClick={() => setActiveIndex((i) => i - 1)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors active:bg-black/70 active:text-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                {activeIndex < captures.length - 1 && (
                  <button
                    onClick={() => setActiveIndex((i) => i + 1)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors active:bg-black/70 active:text-white"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </>
            )}

            {/* Photo counter */}
            <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
              {activeIndex + 1} / {captures.length}
            </div>

            {/* Expand */}
            <button
              onClick={() => setFullscreenIdx(activeIndex)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm transition-colors active:bg-black/70 active:text-white"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            {/* Delete */}
            <button
              onClick={() => handleDeleteCapture(activeCapture!.id)}
              className="absolute right-3 top-14 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm transition-colors active:bg-red-500/80 active:text-white"
              title="Delete photo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* GPS info bar */}
          <div className="border-t border-zinc-800 bg-zinc-900 px-3 sm:px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-zinc-400">
              <GpsAccuracyDot accuracy={activeCapture!.gps.accuracy} />
              <MapPin className="h-3 w-3 shrink-0 text-orange-400" />
              <span className="truncate max-w-[140px] sm:max-w-none">{activeCapture!.gps.placeName || "Unknown"}</span>
              <span className="shrink-0">{activeCapture!.gps.lat.toFixed(6)}, {activeCapture!.gps.lng.toFixed(6)}</span>
              {activeCapture!.gps.accuracy >= 30 && (
                <span className="shrink-0 text-amber-400">⚠️ {activeCapture!.gps.accuracy}m</span>
              )}
              <span className="ml-auto text-[10px] text-zinc-600 hidden sm:inline">{activeCapture!.width}×{activeCapture!.height}</span>
            </div>
          </div>

          {/* Thumbnail strip */}
          {captures.length > 1 && (
            <div
              ref={thumbnailRef}
              className="flex gap-1.5 overflow-x-auto border-t border-zinc-800 bg-zinc-900 px-3 py-2.5 scrollbar-thin"
            >
              {captures.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "relative shrink-0 overflow-hidden rounded-lg ring-2 transition-all",
                    i === activeIndex
                      ? "ring-orange-500 ring-offset-1 ring-offset-zinc-900 scale-105"
                      : "ring-transparent opacity-60 hover:opacity-90",
                  )}
                >
                  <img
                    src={c.dataUrl}
                    alt=""
                    className="h-14 w-20 object-cover"
                  />
                  {(c.galleryStatus === "done" || c.crmStatus === "done") && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5 pb-0.5">
                      {c.galleryStatus === "done" && (
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                      )}
                      {c.crmStatus === "done" && (
                        <CheckCircle2 className="h-2.5 w-2.5 text-blue-400" />
                      )}
                    </div>
                  )}
                  {(c.galleryStatus === "saving" || c.crmStatus === "saving") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 border-t border-zinc-800 bg-zinc-900 px-3 sm:px-4 py-3">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-11 justify-start gap-2 border-zinc-700 text-xs transition-all active:scale-[0.98] px-2",
                  activeCapture!.galleryStatus === "done"
                    ? "border-emerald-700 bg-emerald-900/30 text-emerald-400"
                    : "text-zinc-200 hover:bg-zinc-800 hover:text-white",
                )}
                onClick={() => handleSaveToGallery(activeCapture!.id)}
                disabled={activeCapture!.galleryStatus === "saving"}
              >
                <StatusIcon status={activeCapture!.galleryStatus} />
                {activeCapture!.galleryStatus === "done" ? (
                  <span className="flex-1 text-left truncate">Gallery ✓</span>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 text-left truncate">Gallery</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-11 justify-start gap-2 border-zinc-700 text-xs transition-all active:scale-[0.98] px-2",
                  activeCapture!.crmStatus === "done"
                    ? "border-emerald-700 bg-emerald-900/30 text-emerald-400"
                    : "text-zinc-200 hover:bg-zinc-800 hover:text-white",
                )}
                onClick={() => handleSaveToCrm(activeCapture!.id)}
                disabled={activeCapture!.crmStatus === "saving"}
              >
                <StatusIcon status={activeCapture!.crmStatus} />
                {activeCapture!.crmStatus === "done" ? (
                  <span className="flex-1 text-left truncate">CRM ✓</span>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 text-left truncate">CRM</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-11 justify-start gap-2 border-zinc-700 text-xs transition-all active:scale-[0.98] px-2",
                  shareStatus === "done"
                    ? "border-emerald-700 bg-emerald-900/30 text-emerald-400"
                    : "text-zinc-200 hover:bg-zinc-800 hover:text-white",
                )}
                onClick={() => handleShare(activeCapture!.id)}
                disabled={shareStatus === "saving"}
              >
                <StatusIcon status={shareStatus} />
                {shareStatus === "done" ? (
                  <span className="flex-1 text-left truncate">Shared ✓</span>
                ) : (
                  <>
                    <Share className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 text-left truncate">Share</span>
                  </>
                )}
              </Button>
            </div>

            {/* Batch actions */}
            {captures.length > 1 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-10 gap-1.5 text-xs transition-all active:scale-[0.97]",
                    allGalleryDone
                      ? "text-emerald-500/60"
                      : "text-zinc-400 active:text-white active:bg-zinc-800",
                  )}
                  onClick={() => handleSaveAll("galleryStatus")}
                  disabled={allGalleryDone}
                >
                  <SaveAll className="h-4 w-4 shrink-0" />
                  <span className="truncate">{allGalleryDone ? "All Saved ✓" : "All Gallery"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-10 gap-1.5 text-xs transition-all active:scale-[0.97]",
                    allCrmDone
                      ? "text-emerald-500/60"
                      : "text-zinc-400 active:text-white active:bg-zinc-800",
                  )}
                  onClick={() => handleSaveAll("crmStatus")}
                  disabled={allCrmDone}
                >
                  <SaveAll className="h-4 w-4 shrink-0" />
                  <span className="truncate">{allCrmDone ? "All Saved ✓" : "All CRM"}</span>
                </Button>
              </div>
            )}

            <div className="flex justify-center gap-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 text-xs text-zinc-500 active:text-white active:bg-zinc-800 gap-1.5"
                onClick={handleContinueCapture}
              >
                <Camera className="h-4 w-4 shrink-0" />
                Add More
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 text-xs text-zinc-500 active:text-white active:bg-zinc-800 gap-1.5"
                onClick={handleNewSession}
              >
                <RefreshCw className="h-4 w-4 shrink-0" />
                New Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen modal */}
      {fullscreenIdx !== null && captures[fullscreenIdx] && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          onClick={() => setFullscreenIdx(null)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3 pt-safe">
            <button
              onClick={() => setFullscreenIdx(null)}
              className="flex h-10 w-10 items-center justify-center text-white/60 active:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="text-xs text-white/40">
              {fullscreenIdx + 1} / {captures.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSaveToGallery(captures[fullscreenIdx].id)
                }}
                className="flex h-9 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[11px] text-white/80 active:bg-white/20"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Gallery</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSaveToCrm(captures[fullscreenIdx].id)
                }}
                className="flex h-9 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[11px] text-white/80 active:bg-white/20"
              >
                <Upload className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">CRM</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleShare(captures[fullscreenIdx].id)
                }}
                className="flex h-9 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[11px] text-white/80 active:bg-white/20"
              >
                <Share className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* Image */}
          <div
            className="flex-1 flex items-center justify-center px-2 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={captures[fullscreenIdx].dataUrl}
              alt="Full size"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Bottom GPS bar */}
          <div className="px-3 pb-4 sm:px-4 pb-safe" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-xl bg-white/5 px-3 sm:px-4 py-2.5 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 shrink-0 text-orange-400" />
                <span className="truncate">{captures[fullscreenIdx].gps.placeName || "Unknown"}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/40">
                <span className="flex items-center gap-1">
                  <Crosshair className="h-3 w-3" />
                  {captures[fullscreenIdx].gps.lat.toFixed(6)}, {captures[fullscreenIdx].gps.lng.toFixed(6)}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {getAccuracyLabel(captures[fullscreenIdx].gps.accuracy)} ({captures[fullscreenIdx].gps.accuracy}m)
                </span>
              </div>
            </div>
          </div>

          {/* Nav arrows overlay */}
          {captures.length > 1 && (
            <>
              {fullscreenIdx > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setFullscreenIdx((i) => i! - 1)
                  }}
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/60 backdrop-blur-sm transition-colors active:bg-white/20 active:text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              {fullscreenIdx < captures.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setFullscreenIdx((i) => i! + 1)
                  }}
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/60 backdrop-blur-sm transition-colors active:bg-white/20 active:text-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
