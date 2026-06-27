"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selected = value ? new Date(value + "T00:00:00") : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, "0")
      const d = String(date.getDate()).padStart(2, "0")
      onChange?.(`${y}-${m}-${d}`)
    } else {
      onChange?.("")
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selected ? format(selected, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={(date) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return date < today
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
