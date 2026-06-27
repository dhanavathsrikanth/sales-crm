"use client"

import * as React from "react"
import { ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))

function TimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Pick time",
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const [hour, minute] = value ? value.split(":") : ["", ""]

  const handleHourChange = (h: string | null) => {
    if (h) onChange?.(`${h}:${minute || "00"}`)
  }

  const handleMinuteChange = (m: string | null) => {
    if (m) onChange?.(`${hour || "00"}:${m}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 w-full justify-start text-left font-normal rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500",
          !value && "text-zinc-400",
          className
        )}
      >
        <ClockIcon className="size-4 shrink-0" />
        {value || placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex items-center gap-2">
          <Select value={hour} onValueChange={handleHourChange}>
            <SelectTrigger className="w-[72px]">
              <SelectValue placeholder="HH" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">:</span>
          <Select value={minute} onValueChange={handleMinuteChange}>
            <SelectTrigger className="w-[72px]">
              <SelectValue placeholder="MM" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { TimePicker }
