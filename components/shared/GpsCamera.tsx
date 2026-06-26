"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Camera, MapPin, Loader2, Navigation, RefreshCw, Download, Upload, CheckCircle2, AlertCircle, X, Maximize2 } from "lucide-react"
import { saveToGallery } from "@/lib/utils/save-to-gallery"
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

type StepStatus = "idle" | "saving" | "done" | "failed"

export default function GpsCamera({ leadId, onUploadComplete }: GpsCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "captured">("loading")
  const [gps, setGps] = useState<GpsInfo | null>(null)
  const [gpsStatus, setGpsStatus] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [galleryStatus, setGalleryStatus] = useState<StepStatus>("idle")
  const [crmStatus, setCrmStatus] = useState<StepStatus>("idle")
  const [manualModal, setManualModal] = useState(false)
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    setError(null)
    setGalleryStatus("idle")
    setCrmStatus("idle")
    setCapturedDataUrl(null)
    setCapturedBlob(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 3840 }, height: { ideal: 2160 } },
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

  function drawStamp(ctx: CanvasRenderingContext2D, w: number, h: number, info: GpsInfo) {
    const stampH = Math.round(h * 0.12)
    const topY = h - stampH
    const pad = Math.round(h * 0.018)

    const placeSize = Math.round(h * 0.028)
    const addrSize = Math.round(h * 0.017)
    const metaSize = Math.round(h * 0.015)
    const brandSize = Math.round(h * 0.02)

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)"
    ctx.fillRect(0, topY, w, stampH)

    ctx.fillStyle = "#F97316"
    ctx.fillRect(0, topY, w, 2)

    const placeText = info.placeName || "Unknown Location"
    ctx.fillStyle = "#FFFFFF"
    ctx.font = `bold ${placeSize}px sans-serif`
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(placeText, pad, topY + pad)

    ctx.fillStyle = "#F97316"
    ctx.font = `bold ${brandSize}px sans-serif`
    ctx.textAlign = "right"
    ctx.fillText("PRISM RMC SALES", w - pad, topY + pad)

    if (info.displayName) {
      ctx.fillStyle = "#9CA3AF"
      ctx.font = `${addrSize}px sans-serif`
      ctx.textAlign = "left"
      const addr = info.displayName.length > 80 ? info.displayName.slice(0, 77) + "..." : info.displayName
      ctx.fillText(addr, pad, topY + pad + placeSize + 6)
    }

    const now = new Date()
    const ist = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    })

    const isAccurate = info.accuracy < 15
    const gpsStr = `${info.lat.toFixed(6)}, ${info.lng.toFixed(6)}`
    const accStr = isAccurate ? "" : ` ⚠️ Low Accuracy (${info.accuracy}m)`
    const metaText = `${gpsStr}${accStr} · ${ist} IST`

    ctx.fillStyle = "#F97316"
    ctx.font = `bold ${metaSize}px sans-serif`
    ctx.textAlign = "left"
    ctx.fillText(metaText, pad, topY + stampH - pad - metaSize)
  }

  async function handleCapture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

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
    setGps(info)
    setGpsStatus("")

    canvas.width = video.videoWidth || 1920
    canvas.height = video.videoHeight || 1080
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, 0, 0)
    drawStamp(ctx, canvas.width, canvas.height, info)

    const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
    setCapturedDataUrl(dataUrl)
    if (previewRef.current) previewRef.current.src = dataUrl

    setState("captured")
    stopCamera()
  }

  function pad(n: number) { return n.toString().padStart(2, "0") }

  function buildFilename(info: GpsInfo) {
    const now = new Date()
    const loc = (info.placeName || "Unknown")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .slice(0, 30)
    const y = now.getFullYear()
    const m = pad(now.getMonth() + 1)
    const d = pad(now.getDate())
    const h = pad(now.getHours())
    const min = pad(now.getMinutes())
    return `PRISM_RMC_${loc}_${y}-${m}-${d}_${h}${min}.jpg`
  }

  async function handleSaveAndUpload() {
    const canvas = canvasRef.current
    if (!canvas || !gps) return

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error("Canvas toBlob failed"))
      }, "image/jpeg", 0.82)
    })
    setCapturedBlob(blob)

    const filename = buildFilename(gps)

    const galleryPromise = (async () => {
      setGalleryStatus("saving")
      try {
        await saveToGallery(blob, filename)
        setGalleryStatus("done")
      } catch {
        setGalleryStatus("failed")
        throw new Error("gallery failed")
      }
    })()

    const crmPromise = (async () => {
      setCrmStatus("saving")
      try {
        const formData = new FormData()
        formData.append("file", blob, filename)
        formData.append("leadId", leadId)
        formData.append("type", "site")
        formData.append("caption", `📍 ${gps.placeName || "GPS Photo"} · ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`)
        formData.append("lat", gps.lat.toString())
        formData.append("lng", gps.lng.toString())
        formData.append("address", gps.displayName)

        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error(`Upload failed (${res.status})`)
        setCrmStatus("done")
      } catch (err: any) {
        setCrmStatus("failed")
        try {
          await db.syncQueue.add({
            action: "create",
            table: "photos" as any,
            data: { leadId, fileName: filename, gps },
            createdAt: new Date().toISOString(),
          })
        } catch {}
        throw err
      }
    })()

    const results = await Promise.allSettled([galleryPromise, crmPromise])

    const galleryOk = results[0].status === "fulfilled"
    const crmOk = results[1].status === "fulfilled"

    if (galleryOk && crmOk) {
      toast.success("📸 Photo saved to Gallery + CRM")
      onUploadComplete?.()
      return
    }

    if (galleryOk && !crmOk) {
      toast.error("Photo saved to Gallery. CRM upload queued for retry.")
    }

    if (!galleryOk && crmOk) {
      setManualModal(true)
      toast.error("Tap and hold the photo to save manually.")
    }

    if (!galleryOk && !crmOk) {
      setManualModal(true)
      toast.error("Both saves failed. Tap and hold to save photo manually.")
    }
  }

  function handleRetake() {
    setState("loading")
    setGps(null)
    setGpsStatus("")
    setError(null)
    setCapturedDataUrl(null)
    setCapturedBlob(null)
    setGalleryStatus("idle")
    setCrmStatus("idle")
    setManualModal(false)
    startCamera()
  }

  function StepIndicator({ label, status, icon: Icon }: { label: string; status: StepStatus; icon: typeof Download }) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800">
          {status === "idle" && <Icon className="h-3 w-3 text-zinc-500" />}
          {status === "saving" && <Loader2 className="h-3 w-3 animate-spin text-orange-400" />}
          {status === "done" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
          {status === "failed" && <AlertCircle className="h-3 w-3 text-red-400" />}
        </div>
        <span className={status === "done" ? "text-emerald-400" : status === "failed" ? "text-red-400" : "text-zinc-400"}>
          {label}: {status === "idle" ? "Ready" : status === "saving" ? `${label === "Gallery" ? "Saving" : "Uploading"}...` : status === "done" ? `✅ In ${label}` : "Failed"}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <MapPin className="h-12 w-12 text-zinc-300" />
        <p className="text-sm text-zinc-500 text-center max-w-xs">{error}</p>
        <Button variant="outline" size="sm" onClick={handleRetake}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Try Again
        </Button>
      </div>
    )
  }

  const done = galleryStatus === "done" && crmStatus === "done"

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      <canvas ref={canvasRef} className="hidden" />

      {state === "loading" && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      )}

      {state === "ready" && (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[70vh] object-contain" />
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
            {gpsStatus && (
              <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
                <Loader2 className="h-3 w-3 animate-spin" />
                {gpsStatus}
              </div>
            )}
            <Button
              size="lg"
              className="h-14 w-14 rounded-full p-0 shadow-xl"
              onClick={handleCapture}
              disabled={!!gpsStatus}
            >
              <Camera className="h-6 w-6" />
            </Button>
          </div>
        </>
      )}

      {(state === "captured" || done) && (
        <>
          <div className="relative">
            <img ref={previewRef} alt="Captured" className="w-full max-h-[70vh] object-contain" />
            {capturedDataUrl && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={() => setManualModal(true)}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {gps && (
            <div className="border-t border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-orange-500" />
                {gps.placeName || "Unknown"} — {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                {gps.accuracy < 15 ? "" : ` ⚠️ ${gps.accuracy}m`}
              </div>
            </div>
          )}
          {!done && (
            <div className="space-y-2 border-t border-zinc-700 bg-zinc-900 px-4 py-3">
              <StepIndicator label="Gallery" status={galleryStatus} icon={Download} />
              <StepIndicator label="CRM" status={crmStatus} icon={Upload} />
              <Button
                className="mt-2 w-full h-9 text-xs"
                onClick={handleSaveAndUpload}
                disabled={galleryStatus !== "idle" && crmStatus !== "idle"}
              >
                <Navigation className="mr-1.5 h-4 w-4" />
                Save to Gallery + CRM
              </Button>
              <div className="flex justify-center">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-500" onClick={handleRetake}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Retake
                </Button>
              </div>
            </div>
          )}
          {done && (
            <div className="border-t border-zinc-700 bg-zinc-900 p-4 text-center">
              <p className="mb-2 text-sm text-emerald-400">✅ Photo saved to Gallery & CRM</p>
              <div className="flex justify-center gap-3">
                <Button size="sm" variant="outline" onClick={handleRetake}>
                  <Camera className="mr-1.5 h-4 w-4" />
                  Take Another
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {manualModal && capturedDataUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setManualModal(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white"
            onClick={() => setManualModal(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={capturedDataUrl}
            alt="Full size"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-sm text-white/80">Tap and hold the photo → Save to Photos</p>
          </div>
        </div>
      )}
    </div>
  )
}
