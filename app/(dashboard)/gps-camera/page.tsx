"use client"

import { useRouter } from "next/navigation"
import { Navigation } from "lucide-react"
import GpsCamera from "@/components/shared/GpsCamera"

export default function GpsCameraPage() {
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="-mx-3 sm:-mx-4 lg:-mx-8 -mt-3 sm:-mt-4 lg:-mt-6 mb-4 bg-gradient-to-b from-white via-white to-white/95 px-3 sm:px-4 lg:px-8 pb-3 pt-3 sm:pt-4 lg:pt-6 backdrop-blur-sm border-b border-zinc-100">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-200">
            <Navigation className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-zinc-900">GPS Camera</h1>
            <p className="text-xs text-zinc-500 truncate">
              Capture site photos with GPS location stamp
            </p>
          </div>
        </div>
      </div>

      <GpsCamera />
    </div>
  )
}
