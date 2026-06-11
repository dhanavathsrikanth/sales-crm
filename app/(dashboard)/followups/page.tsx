"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useFollowUps, useCreateFollowUp, useUpdateFollowUp, type FollowUp } from "@/hooks/use-followups"
import { format, isPast, isSameDay } from "date-fns"
import PageHeader from "@/components/shared/PageHeader"
import EmptyState from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  RotateCcw,
  Eye,
  Plus,
  CheckSquare,
  Square,
  List,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

const TABS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "missed", label: "Missed" },
  { key: "all", label: "All" },
] as const

const TYPE_LABELS: Record<string, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  meeting: "Meeting",
  site_visit: "Site Visit",
  email: "Email",
}

const TYPE_EMOJIS: Record<string, string> = {
  call: "📞",
  whatsapp: "💬",
  meeting: "🤝",
  site_visit: "📍",
  email: "📧",
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  missed: "bg-zinc-100 text-zinc-600 border-zinc-200",
}

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState("today")
  const { data, isLoading } = useFollowUps(activeTab)
  const createFollowUp = useCreateFollowUp()
  const updateFollowUp = useUpdateFollowUp()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [calendarView, setCalendarView] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState<string>("")
  const [rescheduleTime, setRescheduleTime] = useState<string>("")

  const [newFollowUp, setNewFollowUp] = useState({
    leadId: "",
    leadSearch: "",
    followupDate: "",
    followupTime: "",
    type: "call",
    priority: "medium",
    notes: "",
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const leadId = params.get("leadId")
    const leadName = params.get("leadName")
    if (leadId) {
      setNewFollowUp((p) => ({ ...p, leadId, leadSearch: leadName || "" }))
      setDrawerOpen(true)
    }
  }, [])

  const [leadSearchQuery, setLeadSearchQuery] = useState("")
  const [leadResults, setLeadResults] = useState<any[]>([])
  const [leadSearching, setLeadSearching] = useState(false)
  const [showLeadDropdown, setShowLeadDropdown] = useState(false)

  useEffect(() => {
    if (!leadSearchQuery.trim()) {
      setLeadResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLeadSearching(true)
      try {
        const res = await fetch(`/api/leads/search?q=${encodeURIComponent(leadSearchQuery)}&limit=20`)
        if (res.ok) {
          const results = await res.json()
          setLeadResults(results)
          setShowLeadDropdown(true)
        }
      } catch {
      } finally {
        setLeadSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [leadSearchQuery])

  const handleMarkDone = useCallback(
    (id: string) => {
      updateFollowUp.mutate(
        { id, status: "completed" },
        { onSuccess: () => toast.success("Follow-up completed"), onError: () => toast.error("Failed to complete follow-up") },
      )
    },
    [updateFollowUp],
  )

  const handleBulkDone = useCallback(() => {
    selectedIds.forEach((id) => updateFollowUp.mutate({ id, status: "completed" }))
    setSelectedIds(new Set())
  }, [selectedIds, updateFollowUp])

  const handleReschedule = useCallback(
    (id: string) => {
      if (!rescheduleDate) return
      updateFollowUp.mutate({ id, followupDate: rescheduleDate, followupTime: rescheduleTime || undefined })
      setReschedulingId(null)
      setRescheduleDate("")
      setRescheduleTime("")
    },
    [rescheduleDate, rescheduleTime, updateFollowUp],
  )

  const handleCreateFollowUp = useCallback(() => {
    if (!newFollowUp.leadId || !newFollowUp.followupDate) return
    createFollowUp.mutate(
      {
        leadId: newFollowUp.leadId,
        followupDate: newFollowUp.followupDate,
        followupTime: newFollowUp.followupTime || undefined,
        type: newFollowUp.type,
        priority: newFollowUp.priority,
        notes: newFollowUp.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Follow-up scheduled")
          setDrawerOpen(false)
          setNewFollowUp({ leadId: "", leadSearch: "", followupDate: "", followupTime: "", type: "call", priority: "medium", notes: "" })
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("Follow-up Reminder", {
              body: `Follow-up scheduled for ${format(new Date(newFollowUp.followupDate), "MMM d, yyyy")}`,
            })
          }
        },
        onError: () => toast.error("Failed to schedule follow-up"),
      },
    )
  }, [newFollowUp, createFollowUp])

  const requestNotificationPermission = useCallback(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (!data?.followups) return
    if (selectedIds.size === data.followups.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.followups.map((f) => f.id)))
    }
  }, [data, selectedIds])

  const today = format(new Date(), "yyyy-MM-dd")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-up Manager"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCalendarView(!calendarView)}
            >
              <CalendarIcon className="mr-1 h-4 w-4" />
              {calendarView ? "List" : "Calendar"}
            </Button>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <Button size="sm" onClick={() => { setDrawerOpen(true); requestNotificationPermission(); }}>
                <Plus className="mr-1 h-4 w-4" />
                Add Follow-up
              </Button>
              <DrawerContent className="sm:max-w-lg mx-auto">
                <DrawerHeader>
                  <DrawerTitle>Schedule Follow-up</DrawerTitle>
                  <DrawerDescription>Set a follow-up for a lead</DrawerDescription>
                </DrawerHeader>

                <div className="space-y-4 px-4 py-2">
                  <div className="space-y-2">
                    <Label>Lead</Label>
                    <div className="relative">
                      <Input
                        placeholder="Search leads..."
                        value={newFollowUp.leadSearch}
                        onChange={(e) => {
                          setNewFollowUp((p) => ({ ...p, leadSearch: e.target.value }))
                          setLeadSearchQuery(e.target.value)
                        }}
                        onFocus={() => leadResults.length > 0 && setShowLeadDropdown(true)}
                      />
                      {showLeadDropdown && leadResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
                          {leadResults.map((lead: any) => (
                            <button
                              key={lead.id}
                              type="button"
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                                newFollowUp.leadId === lead.id && "bg-muted font-medium",
                              )}
                              onClick={() => {
                                setNewFollowUp((p) => ({
                                  ...p,
                                  leadId: lead.id,
                                  leadSearch: `${lead.companyName || ""}${lead.contactPerson ? ` - ${lead.contactPerson}` : ""}`,
                                }))
                                setShowLeadDropdown(false)
                              }}
                            >
                              <span className="font-medium">{lead.companyName || "Unnamed"}</span>
                              {lead.contactPerson && (
                                <span className="text-muted-foreground">{lead.contactPerson}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {leadSearching && (
                        <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newFollowUp.followupDate}
                        onChange={(e) => setNewFollowUp((p) => ({ ...p, followupDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={newFollowUp.followupTime}
                        onChange={(e) => setNewFollowUp((p) => ({ ...p, followupTime: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(TYPE_EMOJIS).map(([key, emoji]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setNewFollowUp((p) => ({ ...p, type: key }))}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                            newFollowUp.type === key
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-input hover:bg-muted",
                          )}
                        >
                          <span>{emoji}</span>
                          <span>{TYPE_LABELS[key]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <div className="flex gap-2">
                      {["high", "medium", "low"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewFollowUp((prev) => ({ ...prev, priority: p }))}
                          className={cn(
                            "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                            newFollowUp.priority === p
                              ? p === "high"
                                ? "border-red-300 bg-red-50 text-red-700"
                                : p === "medium"
                                  ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                                  : "border-green-300 bg-green-50 text-green-700"
                              : "border-input hover:bg-muted",
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Add notes..."
                      value={newFollowUp.notes}
                      onChange={(e) => setNewFollowUp((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                </div>

                <DrawerFooter>
                  <Button onClick={handleCreateFollowUp} disabled={!newFollowUp.leadId || !newFollowUp.followupDate}>
                    Save &amp; Set Reminder
                  </Button>
                  <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        }
      />

      {data?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.todayPending + data.stats.todayCompleted}</p>
                <p className="text-xs text-muted-foreground">
                  Today: {data.stats.todayPending} pending | {data.stats.todayCompleted} completed
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.todayPending}</p>
                <p className="text-xs text-muted-foreground">Pending today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <List className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.weekTotal}</p>
                <p className="text-xs text-muted-foreground">This week total</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="overflow-x-auto -mx-1 px-1 scrollbar-hide">
        <div className="flex gap-1 rounded-lg bg-muted p-1 w-max sm:w-full">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                setSelectedIds(new Set())
              }}
              className={cn(
                "rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {calendarView && data && (
        <Card>
          <CardContent className="p-4">
            <MiniCalendar
              daysWithFollowups={data.daysWithFollowups}
              followups={data.followups}
              onDateSelect={(date) => {
                setActiveTab("all")
              }}
            />
          </CardContent>
        </Card>
      )}

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
          <span className="text-sm font-medium text-blue-700">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" className="border-blue-200 text-blue-700" onClick={handleBulkDone}>
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Mark All Complete
          </Button>
          <Button size="sm" variant="ghost" className="text-blue-700" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.followups.length ? (
        <EmptyState
          icon={<CalendarIcon className="h-7 w-7" />}
          title={
            activeTab === "today"
              ? "You're all caught up!"
              : activeTab === "missed"
                ? "No missed follow-ups"
                : "No follow-ups found"
          }
          description={
            activeTab === "today"
              ? "No follow-ups scheduled for today. Enjoy your day!"
              : activeTab === "upcoming"
                ? "No upcoming follow-ups."
                : activeTab === "completed"
                  ? "No completed follow-ups yet."
                  : activeTab === "missed"
                    ? "No missed follow-ups. Great job staying on track!"
                    : "No follow-ups yet. Create your first one."
          }
          action={
            activeTab !== "completed" && activeTab !== "missed" ? (
              <Button size="sm" onClick={() => setDrawerOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Follow-up
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {data.followups.map((followup) => {
            const isOverdue =
              followup.status === "pending" &&
              followup.followupDate &&
              isPast(new Date(followup.followupDate)) &&
              followup.followupDate !== today

            const isToday = followup.followupDate === today

            return (
              <Card
                key={followup.id}
                className={cn(
                  "transition-colors",
                  isOverdue && "ring-1 ring-red-300",
                  isToday && followup.status === "pending" && "ring-1 ring-amber-300",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSelect(followup.id)}
                      className="mt-1 shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {selectedIds.has(followup.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/leads/${followup.leadId}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {followup.leadCompanyName || "Unknown Lead"}
                          </Link>
                          {followup.leadContactPerson && (
                            <span className="ml-1 text-sm text-muted-foreground">
                              ({followup.leadContactPerson})
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {followup.priority && (
                            <Badge
                              variant="outline"
                              className={cn("border px-2 py-0", PRIORITY_COLORS[followup.priority])}
                            >
                              {followup.priority}
                            </Badge>
                          )}
                          {followup.status && (
                            <Badge
                              variant="outline"
                              className={cn("border px-2 py-0", STATUS_COLORS[followup.status])}
                            >
                              {followup.status}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {TYPE_EMOJIS[followup.type || ""] || "📌"}
                          <span>{TYPE_LABELS[followup.type || ""] || followup.type}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {followup.followupDate
                            ? format(new Date(followup.followupDate), "MMM d, yyyy")
                            : "No date"}
                        </span>
                        {followup.followupTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {followup.followupTime}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="font-medium text-red-600">Overdue</span>
                        )}
                      </div>

                      {followup.notes && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{followup.notes}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {followup.status === "pending" && (
                          <Button
                            size="xs"
                            variant="outline"
                            className="text-emerald-600"
                            onClick={() => handleMarkDone(followup.id)}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Mark Done
                          </Button>
                        )}

                        {followup.status !== "completed" && (
                          <Popover
                            open={reschedulingId === followup.id}
                            onOpenChange={(open) => {
                              setReschedulingId(open ? followup.id : null)
                              if (!open) {
                                setRescheduleDate("")
                                setRescheduleTime("")
                              }
                            }}
                          >
                            <PopoverTrigger
                              className="inline-flex h-6 items-center gap-1 rounded-lg border border-input bg-transparent px-2 text-xs font-medium whitespace-nowrap text-foreground transition-colors hover:bg-muted"
                              onClick={() => setReschedulingId(followup.id)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reschedule
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Reschedule</p>
                                <Input
                                  type="date"
                                  value={rescheduleDate}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                />
                                <Input
                                  type="time"
                                  value={rescheduleTime}
                                  onChange={(e) => setRescheduleTime(e.target.value)}
                                />
                                <Button
                                  size="sm"
                                  className="w-full"
                                  disabled={!rescheduleDate}
                                  onClick={() => handleReschedule(followup.id)}
                                >
                                  Save
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}

                        <Link href={`/leads/${followup.leadId}`}>
                          <Button size="xs" variant="ghost">
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View Lead
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MiniCalendar({
  daysWithFollowups,
  followups,
  onDateSelect,
}: {
  daysWithFollowups: string[]
  followups: FollowUp[]
  onDateSelect: (date: Date) => void
}) {
  const [viewDate, setViewDate] = useState<Date | undefined>(undefined)

  const modifiers = {
    hasFollowup: (date: Date) =>
      daysWithFollowups.some((d) => isSameDay(new Date(d), date)),
  }

  const modifiersStyles = {
    hasFollowup: {
      fontWeight: 600,
      textDecoration: "underline",
      textDecorationColor: "var(--color-primary)",
      textUnderlineOffset: "4px",
    },
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <Calendar
        mode="single"
        selected={viewDate}
        onSelect={(date) => {
          setViewDate(date)
          if (date) onDateSelect(date)
        }}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-md border"
      />
      {viewDate && (
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">
            Follow-ups for {format(viewDate, "MMM d, yyyy")}
          </p>
          {followups.filter((f) => f.followupDate && isSameDay(new Date(f.followupDate), viewDate)).length === 0 ? (
            <p className="text-sm text-muted-foreground">No follow-ups on this day.</p>
          ) : (
            <div className="space-y-2">
              {followups
                .filter((f) => f.followupDate && isSameDay(new Date(f.followupDate), viewDate))
                .map((f) => (
                  <div key={f.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                    <span>{TYPE_EMOJIS[f.type || ""] || "📌"}</span>
                    <Link
                      href={`/leads/${f.leadId}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {f.leadCompanyName || "Unknown"}
                    </Link>
                    {f.followupTime && (
                      <span className="text-muted-foreground">{f.followupTime}</span>
                    )}
                    <Badge variant="outline" className={cn("ml-auto", PRIORITY_COLORS[f.priority || ""])}>
                      {f.priority}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
