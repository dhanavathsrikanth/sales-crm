"use client"

import * as React from "react"
import { ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

  const handleHourChange = (h: string) => {
    onChange?.(`${h}:${minute || "00"}`)
  }

  const handleMinuteChange = (m: string) => {
    onChange?.(`${hour || "00"}:${m}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <ClockIcon className="mr-2 size-4" />
          {value || placeholder}
        </Button>
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
