"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MarkerData {
  lat: number
  lng: number
  label?: string
  date?: string
  duration?: number | null
  address?: string
  leadId?: string | null
}

interface VisitMapProps {
  center: [number, number]
  zoom?: number
  markers: MarkerData[]
}

export default function VisitMap({ center, zoom = 13, markers }: VisitMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false,
    })
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map)
    instanceRef.current = map
    return () => {
      map.remove()
      instanceRef.current = null
    }
  }, [center, zoom])

  useEffect(() => {
    const map = instanceRef.current
    if (!map) return
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) layer.remove()
    })
    markers.forEach((m) => {
      const isRecent = m.date && Date.now() - new Date(m.date).getTime() < 7 * 86400000
      const color = isRecent ? "#2563eb" : "#94a3b8"
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map)
      const pc = [
        `<div style="font-family:system-ui,sans-serif;min-width:160px;">`,
        `<p style="font-weight:600;margin:0 0 2px;font-size:13px;">${m.label || "Unknown"}</p>`,
        m.date ? `<p style="margin:0 0 2px;font-size:11px;color:#64748b;">${new Date(m.date).toLocaleDateString()}</p>` : "",
        m.address ? `<p style="margin:0 0 2px;font-size:11px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.address}</p>` : "",
        m.duration ? `<p style="margin:0;font-size:11px;color:#64748b;">${m.duration} min</p>` : "",
        m.leadId ? `<a href="/leads/${m.leadId}" style="font-size:11px;color:#2563eb;text-decoration:underline;margin-top:4px;display:inline-block;">View Lead</a>` : "",
        `</div>`,
      ].join("")
      marker.bindPopup(pc)
    })
    if (markers.length > 1) {
      const group = L.featureGroup(markers.map((mm) => L.marker([mm.lat, mm.lng])))
      map.fitBounds(group.getBounds().pad(0.1))
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], zoom)
    }
  }, [markers, zoom])

  return <div ref={mapRef} className="h-full w-full" />
}
