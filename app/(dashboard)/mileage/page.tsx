"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  useTodayOdometerLog,
  useOdometerLogs,
  useOdometerStats,
  useCreateOrUpdateOdometerLog,
  useDeleteOdometerLog,
} from "@/hooks/use-odometer"
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, isPast, isToday, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  Gauge,
  Fuel,
  IndianRupee,
  TrendingUp,
  CalendarDays,
  GripVertical,
  Bike,
  Car,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from "lucide-react"

const quickLogSchema = z.object({
  logDate: z.string().min(1, "Date is required"),
  startReading: z.string().min(1, "Start reading is required").regex(/^\d+$/, "Must be a number"),
  endReading: z.string().regex(/^\d*$/, "Must be a number").optional().or(z.literal("")),
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  taRatePerKm: z.string().min(1, "TA rate required").regex(/^\d+(\.\d+)?$/, "Must be a number"),
  purpose: z.string().optional(),
})

type QuickLogForm = z.infer<typeof quickLogSchema>

const FILTERS = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom Range" },
] as const

export default function MileagePage() {
  const now = new Date()
  const today = format(now, "yyyy-MM-dd")
  const [filterKey, setFilterKey] = useState<string>("week")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [quickLogOpen, setQuickLogOpen] = useState(false)
  const [editLog, setEditLog] = useState<{ id: string; logDate: string; startReading: string; endReading?: string; vehicleType: string; vehicleNumber: string; taRatePerKm: string; purpose: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [highlightDate, setHighlightDate] = useState<string | null>(null)
  const highlightRef = useRef<HTMLTableRowElement | null>(null)

  const todayLogQ = useTodayOdometerLog()
  const statsQ = useOdometerStats()
  const saveLog = useCreateOrUpdateOdometerLog()
  const deleteLog = useDeleteOdometerLog()

  const filterParams = useMemo(() => {
    if (filterKey === "week") {
      const s = startOfWeek(now, { weekStartsOn: 1 })
      const e = endOfWeek(now, { weekStartsOn: 1 })
      return { dateFrom: format(s, "yyyy-MM-dd"), dateTo: format(e, "yyyy-MM-dd") }
    }
    if (filterKey === "month") {
      const s = startOfMonth(now)
      const e = endOfMonth(now)
      return { dateFrom: format(s, "yyyy-MM-dd"), dateTo: format(e, "yyyy-MM-dd") }
    }
    if (filterKey === "custom" && customFrom && customTo) {
      return { dateFrom: customFrom, dateTo: customTo }
    }
    return undefined
  }, [filterKey, customFrom, customTo])

  const logsQ = useOdometerLogs(filterParams)

  const missingDays = useMemo(() => {
    const missing: { date: string; status: "missing" | "incomplete" }[] = []
    for (let i = 0; i < 7; i++) {
      const d = subDays(now, i + 1)
      const dateStr = format(d, "yyyy-MM-dd")
      const log = logsQ.data?.logs.find((l) => l.logDate === dateStr)
      if (!log) {
        missing.push({ date: dateStr, status: "missing" })
      } else if (!log.endReading) {
        missing.push({ date: dateStr, status: "incomplete" })
      }
    }
    return missing
  }, [logsQ.data?.logs])

  useEffect(() => {
    if (highlightDate && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [highlightDate])

  const quickLogForm = useForm<QuickLogForm>({
    resolver: zodResolver(quickLogSchema),
    defaultValues: {
      logDate: today,
      startReading: "",
      endReading: "",
      vehicleType: "motorbike",
      vehicleNumber: "",
      taRatePerKm: "4",
      purpose: "",
    },
  })

  const editForm = useForm<QuickLogForm>({
    resolver: zodResolver(quickLogSchema),
    defaultValues: {
      logDate: "",
      startReading: "",
      endReading: "",
      vehicleType: "motorbike",
      vehicleNumber: "",
      taRatePerKm: "4",
      purpose: "",
    },
  })

  const watchStart = quickLogForm.watch("startReading")
  const watchEnd = quickLogForm.watch("endReading")
  const watchRate = quickLogForm.watch("taRatePerKm")

  const watchEditStart = editForm.watch("startReading")
  const watchEditEnd = editForm.watch("endReading")
  const watchEditRate = editForm.watch("taRatePerKm")

  const liveDistance = useMemo(() => {
    const s = Number(watchStart)
    const e = Number(watchEnd)
    if (s && e && e > s) return e - s
    return 0
  }, [watchStart, watchEnd])

  const liveTA = useMemo(() => {
    const rate = Number(watchRate) || 4
    return liveDistance * rate
  }, [liveDistance, watchRate])

  const editLiveDistance = useMemo(() => {
    const s = Number(watchEditStart)
    const e = Number(watchEditEnd)
    if (s && e && e > s) return e - s
    return 0
  }, [watchEditStart, watchEditEnd])

  const editLiveTA = useMemo(() => {
    const rate = Number(watchEditRate) || 4
    return editLiveDistance * rate
  }, [editLiveDistance, watchEditRate])

  const handleSaveToday = (data: { startReading: string; endReading?: string; vehicleNumber?: string; taRatePerKm?: string; vehicleType?: string; purpose?: string }) => {
    saveLog.mutate(
      {
        logDate: today,
        startReading: data.startReading,
        endReading: data.endReading,
        vehicleNumber: data.vehicleNumber || undefined,
        taRatePerKm: data.taRatePerKm,
        vehicleType: data.vehicleType,
        purpose: data.purpose || undefined,
      },
      {
        onSuccess: () => toast.success("Log saved"),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  const handleQuickLogSave = (data: QuickLogForm) => {
    saveLog.mutate(
      {
        logDate: data.logDate,
        startReading: data.startReading,
        endReading: data.endReading || undefined,
        vehicleNumber: data.vehicleNumber || undefined,
        taRatePerKm: data.taRatePerKm,
        vehicleType: data.vehicleType,
        purpose: data.purpose || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Log saved")
          setQuickLogOpen(false)
          quickLogForm.reset()
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  const handleEditSave = (data: QuickLogForm) => {
    if (!editLog) return
    saveLog.mutate(
      {
        logDate: data.logDate,
        startReading: data.startReading,
        endReading: data.endReading || undefined,
        vehicleNumber: data.vehicleNumber || undefined,
        taRatePerKm: data.taRatePerKm,
        vehicleType: data.vehicleType,
        purpose: data.purpose || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Log updated")
          setEditLog(null)
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  const openEdit = (log: any) => {
    editForm.reset({
      logDate: log.logDate,
      startReading: log.startReading,
      endReading: log.endReading || "",
      vehicleType: log.vehicleType || "motorbike",
      vehicleNumber: log.vehicleNumber || "",
      taRatePerKm: log.taRatePerKm || "4",
      purpose: log.purpose || "",
    })
    setEditLog(log)
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleHighlight = (date: string) => {
    setHighlightDate(date)
  }

  const todayLog = todayLogQ.data
  const isPartial = todayLog && !todayLog.endReading
  const isComplete = todayLog && todayLog.endReading
  const distanceToday = todayLog?.startReading && todayLog?.endReading
    ? Number(todayLog.endReading) - Number(todayLog.startReading)
    : 0

  const fmtNum = (n: number) => n.toLocaleString("en-IN")

  return (
    <div className="space-y-6 pb-8">
      {/* MISSING DAYS ALERT */}
      {missingDays.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            You have {missingDays.length} day{missingDays.length > 1 ? "s" : ""} with missing or incomplete readings.{" "}
            <button
              onClick={() => handleHighlight(missingDays[0].date)}
              className="font-medium underline underline-offset-2 hover:text-amber-900"
            >
              View them &rarr;
            </button>
          </span>
        </div>
      )}

      {/* TODAY'S ODOMETER CARD */}
      <Card className={cn(isComplete && "border-emerald-300")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            {isComplete ? "Today's Log Complete" : isPartial ? "End Today's Reading" : "Log Today's Reading"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayLogQ.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isComplete ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-emerald-700">
                      {todayLog.vehicleType === "car" ? "🚗" : "🏍️"}{" "}
                      {Number(todayLog.startReading).toLocaleString("en-IN")} &rarr;{" "}
                      {Number(todayLog.endReading).toLocaleString("en-IN")} km
                    </p>
                    <p className="text-xs text-emerald-600">
                      {todayLog.vehicleNumber && `${todayLog.vehicleNumber} · `}
                      {todayLog.purpose || "No purpose noted"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(todayLog)}>
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                </div>
                <Separator className="my-3 bg-emerald-200" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">Distance</p>
                    <p className="text-xl font-bold text-emerald-900">{fmtNum(distanceToday)} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">TA Earned</p>
                    <p className="text-xl font-bold text-emerald-900">&rsaquo;&rsaquo;{fmtNum(Number(todayLog.taAmount || 0))}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">Fuel Cost</p>
                    <p className="text-xl font-bold text-emerald-900">
                      {todayLog.fuelCost ? `₹${fmtNum(Number(todayLog.fuelCost))}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">TA Rate</p>
                    <p className="text-xl font-bold text-emerald-900">₹{todayLog.taRatePerKm}/km</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={quickLogForm.handleSubmit((data) =>
                handleSaveToday({
                  startReading: data.startReading,
                  endReading: data.endReading || undefined,
                  vehicleNumber: data.vehicleNumber,
                  taRatePerKm: data.taRatePerKm,
                  vehicleType: data.vehicleType,
                }),
              )}
              className="space-y-4"
            >
              {isPartial && (
                <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
                  Started at <strong>{Number(todayLog.startReading).toLocaleString("en-IN")} km</strong> — enter end reading to close the day.
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="today-start">Start Reading (km)</Label>
                  <Input
                    id="today-start"
                    type="number"
                    placeholder="e.g. 12450"
                    className="h-12 text-lg"
                    {...quickLogForm.register("startReading")}
                    disabled={isPartial}
                  />
                  {quickLogForm.formState.errors.startReading && (
                    <p className="text-xs text-red-500">{quickLogForm.formState.errors.startReading.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="today-end">End Reading (km)</Label>
                  <Input
                    id="today-end"
                    type="number"
                    placeholder={isPartial ? "Enter end reading" : "Fill at day end"}
                    className="h-12 text-lg"
                    {...quickLogForm.register("endReading")}
                  />
                </div>
              </div>

              {isPartial && watchEnd && Number(watchEnd) > Number(todayLog.startReading) && (
                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  Today's distance: <strong>{fmtNum(Number(watchEnd) - Number(todayLog.startReading))} km</strong>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="today-vehicle">Vehicle Number</Label>
                  <Input id="today-vehicle" placeholder="e.g. MH-01-AB-1234" {...quickLogForm.register("vehicleNumber")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="today-rate">TA Rate (₹/km)</Label>
                  <Input id="today-rate" type="number" step="0.5" {...quickLogForm.register("taRatePerKm")} />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={saveLog.isPending}>
                {saveLog.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPartial ? "Close Day" : "Save Reading"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* MONTHLY STATS */}
      {statsQ.data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <p className="text-lg font-bold">{fmtNum(statsQ.data.totalDistanceKm)}</p>
              <p className="text-[10px] text-muted-foreground">This Month (km)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
              <CalendarDays className="h-5 w-5 text-violet-600" />
              <p className="text-lg font-bold">{statsQ.data.totalDays}</p>
              <p className="text-[10px] text-muted-foreground">Working Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              <p className="text-lg font-bold">&rsaquo;&rsaquo;{fmtNum(statsQ.data.totalTaAmount)}</p>
              <p className="text-[10px] text-muted-foreground">Total TA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
              <Gauge className="h-5 w-5 text-amber-600" />
              <p className="text-lg font-bold">{fmtNum(statsQ.data.avgDailyKm)}</p>
              <p className="text-[10px] text-muted-foreground">Avg/Day (km)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TABLE HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterKey(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filterKey === f.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {filterKey === "custom" && (
            <div className="flex items-center gap-2">
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 w-36" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 w-36" />
            </div>
          )}
          <Button size="sm" onClick={() => setQuickLogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Quick Log
          </Button>
        </div>
      </div>

      {/* TABLE */}
      {logsQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !logsQ.data?.logs.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Gauge className="mb-3 h-10 w-10 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-900">No odometer logs found</p>
            <p className="mt-1 text-xs text-muted-foreground">Start by logging today's reading above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Start</TableHead>
                <TableHead className="text-right">End</TableHead>
                <TableHead className="text-right">Distance</TableHead>
                <TableHead className="text-right">TA</TableHead>
                <TableHead className="text-right">Fuel</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsQ.data.logs.map((log) => {
                const logDate = log.logDate
                const isIncomplete = !log.endReading
                const isPastDate = logDate && isPast(parseISO(logDate)) && !isToday(parseISO(logDate))
                const isForgotten = isIncomplete && isPastDate
                const isHighlighted = highlightDate === logDate

                let rowColor = ""
                if (isForgotten) rowColor = "bg-red-50 hover:bg-red-100/80"
                else if (isIncomplete) rowColor = "bg-amber-50 hover:bg-amber-100/80"
                else rowColor = "bg-emerald-50/50 hover:bg-emerald-100/50"

                return (
                  <tbody key={log.id}>
                    <TableRow
                      ref={isHighlighted ? highlightRef : undefined}
                      className={cn(rowColor, isHighlighted && "ring-2 ring-amber-400")}
                    >
                      <TableCell>
                        <button
                          onClick={() => toggleRow(log.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {expandedRows.has(log.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium text-xs whitespace-nowrap">
                        {log.logDate ? format(parseISO(log.logDate), "MMM d") : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="flex items-center gap-1">
                          {log.vehicleType === "car" ? <Car className="h-3 w-3" /> : <Bike className="h-3 w-3" />}
                          {log.vehicleNumber || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {Number(log.startReading).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {log.endReading ? Number(log.endReading).toLocaleString("en-IN") : (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-transparent">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-medium">
                        {log.distanceKm ? `${fmtNum(Number(log.distanceKm))} km` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {log.taAmount ? `₹${fmtNum(Number(log.taAmount))}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        {log.fuelCost ? `₹${fmtNum(Number(log.fuelCost))}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs max-w-32 truncate">
                        {log.purpose || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="xs" variant="ghost" onClick={() => openEdit(log)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="xs" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setDeleteConfirm(log.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(log.id) && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={10} className="p-3">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p><span className="font-medium text-foreground">Linked Visits:</span> {log.linkedVisitIds?.length ? log.linkedVisitIds.join(", ") : "None"}</p>
                            <p><span className="font-medium text-foreground">TA Rate:</span> ₹{log.taRatePerKm || 4}/km</p>
                            <p><span className="font-medium text-foreground">Fuel Filled:</span> {log.fuelFilled ? `${log.fuelFilled} L` : "—"}</p>
                            {log.createdAt && (
                              <p><span className="font-medium text-foreground">Logged:</span> {format(parseISO(log.createdAt), "MMM d, yyyy h:mm a")}</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </tbody>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* QUICK LOG DRAWER */}
      <Drawer open={quickLogOpen} onOpenChange={setQuickLogOpen}>
        <DrawerContent className="sm:max-w-lg mx-auto">
          <DrawerHeader>
            <DrawerTitle>Quick Log</DrawerTitle>
            <DrawerDescription>Enter odometer reading for any date</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={quickLogForm.handleSubmit(handleQuickLogSave)}>
            <div className="space-y-4 px-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="ql-date">Date</Label>
                <Input id="ql-date" type="date" {...quickLogForm.register("logDate")} />
                {quickLogForm.formState.errors.logDate && (
                  <p className="text-xs text-red-500">{quickLogForm.formState.errors.logDate.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ql-start">Start Reading (km) *</Label>
                  <Input id="ql-start" type="number" placeholder="e.g. 12450" {...quickLogForm.register("startReading")} />
                  {quickLogForm.formState.errors.startReading && (
                    <p className="text-xs text-red-500">{quickLogForm.formState.errors.startReading.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ql-end">End Reading (km)</Label>
                  <Input id="ql-end" type="number" placeholder="Optional" {...quickLogForm.register("endReading")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ql-vehicle">Vehicle Number</Label>
                  <Input id="ql-vehicle" placeholder="e.g. MH-01-AB-1234" {...quickLogForm.register("vehicleNumber")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ql-rate">TA Rate (₹/km)</Label>
                  <Input id="ql-rate" type="number" step="0.5" {...quickLogForm.register("taRatePerKm")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Vehicle Type</Label>
                <Select
                  value={quickLogForm.watch("vehicleType") || "motorbike"}
                  onValueChange={(v) => quickLogForm.setValue("vehicleType", v || "motorbike")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motorbike">🏍️ Motorbike</SelectItem>
                    <SelectItem value="car">🚗 Car</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ql-purpose">Purpose</Label>
                <Textarea
                  id="ql-purpose"
                  placeholder="e.g. Site visit, client meeting..."
                  {...quickLogForm.register("purpose")}
                />
              </div>

              {liveDistance > 0 && (
                <div className="rounded-lg bg-primary/5 p-3 text-center text-sm">
                  <p className="font-medium text-primary">
                    Distance: {fmtNum(liveDistance)} km | TA: ₹{fmtNum(liveTA)}
                  </p>
                </div>
              )}
            </div>

            <DrawerFooter>
              <Button type="submit" disabled={saveLog.isPending}>
                {saveLog.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Log
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {/* EDIT DRAWER */}
      <Drawer open={!!editLog} onOpenChange={(o) => { if (!o) setEditLog(null) }}>
        <DrawerContent className="sm:max-w-lg mx-auto">
          <DrawerHeader>
            <DrawerTitle>Edit Log</DrawerTitle>
            <DrawerDescription>Update odometer reading</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSave)}>
            <div className="space-y-4 px-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="el-date">Date</Label>
                <Input id="el-date" type="date" {...editForm.register("logDate")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="el-start">Start Reading (km) *</Label>
                  <Input id="el-start" type="number" placeholder="e.g. 12450" {...editForm.register("startReading")} />
                  {editForm.formState.errors.startReading && (
                    <p className="text-xs text-red-500">{editForm.formState.errors.startReading.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="el-end">End Reading (km)</Label>
                  <Input id="el-end" type="number" placeholder="Optional" {...editForm.register("endReading")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="el-vehicle">Vehicle Number</Label>
                  <Input id="el-vehicle" placeholder="e.g. MH-01-AB-1234" {...editForm.register("vehicleNumber")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="el-rate">TA Rate (₹/km)</Label>
                  <Input id="el-rate" type="number" step="0.5" {...editForm.register("taRatePerKm")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Vehicle Type</Label>
                <Select
                  value={editForm.watch("vehicleType") || "motorbike"}
                  onValueChange={(v) => editForm.setValue("vehicleType", v || "motorbike")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motorbike">🏍️ Motorbike</SelectItem>
                    <SelectItem value="car">🚗 Car</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="el-purpose">Purpose</Label>
                <Textarea
                  id="el-purpose"
                  placeholder="e.g. Site visit, client meeting..."
                  {...editForm.register("purpose")}
                />
              </div>

              {editLiveDistance > 0 && (
                <div className="rounded-lg bg-primary/5 p-3 text-center text-sm">
                  <p className="font-medium text-primary">
                    Distance: {fmtNum(editLiveDistance)} km | TA: ₹{fmtNum(editLiveTA)}
                  </p>
                </div>
              )}
            </div>

            <DrawerFooter>
              <Button type="submit" disabled={saveLog.isPending}>
                {saveLog.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Log
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {/* DELETE CONFIRM */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Log</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteLog.isPending}
              onClick={() => {
                if (!deleteConfirm) return
                deleteLog.mutate(deleteConfirm, {
                  onSuccess: () => {
                    toast.success("Log deleted")
                    setDeleteConfirm(null)
                  },
                  onError: (e) => toast.error(e.message),
                })
              }}
            >
              {deleteLog.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
