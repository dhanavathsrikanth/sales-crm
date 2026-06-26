"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Camera, MapPin, Loader2, Navigation, RefreshCw } from "lucide-react"

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

export default function GpsCamera({ leadId, onUploadComplete }: GpsCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "captured" | "uploading">("loading")
  const [gps, setGps] = useState<GpsInfo | null>(null)
  const [gpsStatus, setGpsStatus] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    setError(null)
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
    const placeWidth = ctx.measureText(placeText).width
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

    const dataUrl = canvas.toDataURL("image/jpeg", 0.6)
    if (previewRef.current) previewRef.current.src = dataUrl

    setState("captured")
    stopCamera()
  }

  async function handleUpload() {
    const canvas = canvasRef.current
    if (!canvas || !gps) return

    setState("uploading")

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error("Canvas toBlob failed"))
        }, "image/jpeg", 0.82)
      })

      const formData = new FormData()
      formData.append("file", blob, `gps_${Date.now()}.jpg`)
      formData.append("leadId", leadId)
      formData.append("type", "site")
      formData.append("caption", `📍 ${gps.placeName || "GPS Photo"} · ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`)

      const xhr = new XMLHttpRequest()
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed (${xhr.status})`))
        }
        xhr.onerror = () => reject(new Error("Network error"))
        xhr.open("POST", "/api/upload")
        xhr.send(formData)
      })

      toast.success("GPS photo uploaded")
      onUploadComplete?.()
    } catch (err: any) {
      console.error("GPS upload error:", err)
      toast.error(`Upload failed: ${err.message}`)
      setState("captured")
    }
  }

  function handleRetake() {
    setState("loading")
    setGps(null)
    setGpsStatus("")
    setError(null)
    startCamera()
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

      {(state === "captured" || state === "uploading") && (
        <>
          <img ref={previewRef} alt="Captured" className="w-full max-h-[70vh] object-contain" />
          {gps && (
            <div className="border-t border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-orange-500" />
                {gps.placeName || "Unknown"} — {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                {gps.accuracy < 15 ? "" : ` ⚠️ ${gps.accuracy}m`}
              </div>
            </div>
          )}
          <div className="flex justify-center gap-3 bg-zinc-900 p-4">
            <Button variant="outline" onClick={handleRetake} disabled={state === "uploading"}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Retake
            </Button>
            <Button onClick={handleUpload} disabled={state === "uploading"}>
              {state === "uploading" ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading...</>
              ) : (
                <><Navigation className="mr-1.5 h-4 w-4" /> Upload GPS Photo</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
