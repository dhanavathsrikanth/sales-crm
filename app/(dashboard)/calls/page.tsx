"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useCalls, useLogCall, useUpdateCall, type CallLog } from "@/hooks/use-calls"
import { useCreateFollowUp } from "@/hooks/use-followups"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Clock,
  Loader2,
  Plus,
  Search,
  Building2,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  User,
  Link2,
  Target,
} from "lucide-react"

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All" },
] as const

const STATUS_OPTIONS = [
  { value: "connected", label: "Connected", color: "text-emerald-600 bg-emerald-50" },
  { value: "missed", label: "Missed", color: "text-red-600 bg-red-50" },
  { value: "no_answer", label: "No Answer", color: "text-zinc-600 bg-zinc-100" },
  { value: "busy", label: "Busy", color: "text-amber-600 bg-amber-50" },
] as const

function formatDuration(seconds: number | null) {
  if (!seconds && seconds !== 0) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function getStatusBadge(status: string) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status)
  if (!opt) return null
  const icons = {
    connected: <Phone className="h-3 w-3" />,
    missed: <PhoneMissed className="h-3 w-3" />,
    no_answer: <PhoneOff className="h-3 w-3" />,
    busy: <PhoneOff className="h-3 w-3" />,
  }
  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-normal", opt.color)}>
      {icons[status as keyof typeof icons]}
      {opt.label}
    </Badge>
  )
}

function getContactName(c: CallLog) {
  if (c.contactFirstName) return `${c.contactFirstName} ${c.contactLastName || ""}`.trim()
  if (c.leadCompanyName) return c.leadCompanyName
  if (c.leadContactPerson) return c.leadContactPerson
  return c.phoneNumber || "Unknown"
}

export default function CallsPage() {
  const [period, setPeriod] = useState("today")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const { data, isLoading, refetch } = useCalls(period, debouncedSearch)
  const logCall = useLogCall()
  const updateCall = useUpdateCall()
  const createFollowUp = useCreateFollowUp()

  const [quickDirection, setQuickDirection] = useState<"outbound" | "inbound">("outbound")
  const [quickStatus, setQuickStatus] = useState("connected")
  const [quickNumber, setQuickNumber] = useState("")
  const [quickDuration, setQuickDuration] = useState("")
  const [quickNotes, setQuickNotes] = useState("")
  const [quickContactSearch, setQuickContactSearch] = useState("")
  const [quickContactResults, setQuickContactResults] = useState<any[]>([])
  const [quickSelectedContact, setQuickSelectedContact] = useState<any>(null)
  const [quickContactOpen, setQuickContactOpen] = useState(false)
  const [quickLogging, setQuickLogging] = useState(false)

  const [expandedCall, setExpandedCall] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState("")

  const [linkDialog, setLinkDialog] = useState<{ open: boolean; callId: string }>({ open: false, callId: "" })
  const [linkSearch, setLinkSearch] = useState("")
  const [linkResults, setLinkResults] = useState<any[]>([])
  const [linkSearching, setLinkSearching] = useState(false)
  const [linkType, setLinkType] = useState<"lead" | "contact">("lead")

  const [missedFollowup, setMissedFollowup] = useState<CallLog | null>(null)
  const [followupDate, setFollowupDate] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!quickContactSearch.trim()) { setQuickContactResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(quickContactSearch)}&limit=10`)
        if (res.ok) setQuickContactResults(await res.json())
      } catch {} finally {}
    }, 300)
    return () => clearTimeout(timer)
  }, [quickContactSearch])

  useEffect(() => {
    if (!linkSearch.trim()) { setLinkResults([]); return }
    const timer = setTimeout(async () => {
      setLinkSearching(true)
      try {
        const endpoint = linkType === "lead" ? "/api/leads/search" : "/api/contacts/search"
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(linkSearch)}&limit=10`)
        if (res.ok) setLinkResults(await res.json())
      } catch {} finally { setLinkSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [linkSearch, linkType])

  const resetQuickLog = () => {
    setQuickNumber("")
    setQuickDuration("")
    setQuickNotes("")
    setQuickContactSearch("")
    setQuickContactResults([])
    setQuickSelectedContact(null)
    setQuickDirection("outbound")
    setQuickStatus("connected")
  }

  const handleQuickLog = async () => {
    if (!quickNumber && !quickSelectedContact) return
    setQuickLogging(true)
    try {
      await logCall.mutateAsync({
        contactId: quickSelectedContact?.id || undefined,
        phoneNumber: quickNumber || quickSelectedContact?.mobile || undefined,
        direction: quickDirection,
        status: quickStatus,
        duration: quickDuration ? parseInt(quickDuration) * 60 : undefined,
        notes: quickNotes || undefined,
      })
      resetQuickLog()
    } catch {} finally { setQuickLogging(false) }
  }

  const handleStartCall = (contact: any) => {
    setQuickSelectedContact(contact)
    setQuickNumber(contact.phoneNumber || "")
    setQuickDirection("outbound")
    setQuickStatus("connected")
  }

  const handleExpandCall = (call: CallLog) => {
    if (expandedCall === call.id) {
      setExpandedCall(null)
      return
    }
    setExpandedCall(call.id)
    setEditNotes(call.notes || "")
  }

  const handleSaveNotes = async (id: string) => {
    await updateCall.mutateAsync({ id, notes: editNotes })
    setExpandedCall(null)
  }

  const handleLinkCall = async () => {
    if (!linkDialog.callId) return
    await updateCall.mutateAsync({
      id: linkDialog.callId,
      ...(linkType === "lead" && linkResults[0] ? { leadId: linkResults[0].id } : {}),
      ...(linkType === "contact" && linkResults[0] ? { contactId: linkResults[0].id } : {}),
    })
    setLinkDialog({ open: false, callId: "" })
    setLinkSearch("")
    setLinkResults([])
  }

  const handleMissedFollowup = async () => {
    if (!missedFollowup || !followupDate) return
    await createFollowUp.mutateAsync({
      leadId: missedFollowup.leadId || "",
      followupDate,
      notes: `Follow-up from missed call${missedFollowup.notes ? `: ${missedFollowup.notes}` : ""}`,
      type: "call",
    })
    setMissedFollowup(null)
    setFollowupDate("")
  }

  const todayCalls = (data?.calls || []).filter((c) => {
    if (!c.calledAt) return false
    const d = new Date(c.calledAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  const todayTotalDuration = todayCalls.reduce((sum, c) => sum + (c.duration || 0), 0)

  const groupedToday = todayCalls.reduce<Record<string, CallLog[]>>((acc, c) => {
    const key = c.contactId || c.leadId || c.phoneNumber || "unknown"
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-6 pb-8">
      {/* Stats Bar */}
      {data?.stats && (
        <div className="grid grid-cols-4 gap-3">
          <Card><CardContent className="flex flex-col items-center gap-1 p-3 text-center">
            <Phone className="h-4 w-4 text-blue-600" />
            <p className="text-lg font-bold">{data.stats.callsToday}</p>
            <p className="text-[10px] text-muted-foreground">Calls Today</p>
          </CardContent></Card>
          <Card><CardContent className="flex flex-col items-center gap-1 p-3 text-center">
            <Clock className="h-4 w-4 text-violet-600" />
            <p className="text-lg font-bold">{formatDuration(data.stats.avgDuration)}</p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </CardContent></Card>
          <Card><CardContent className="flex flex-col items-center gap-1 p-3 text-center">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <p className="text-lg font-bold">{data.stats.connectRate}%</p>
            <p className="text-[10px] text-muted-foreground">Connect Rate</p>
          </CardContent></Card>
          <Card><CardContent className="flex flex-col items-center gap-1 p-3 text-center">
            <CalendarDays className="h-4 w-4 text-amber-600" />
            <p className="text-lg font-bold">{data.stats.callsThisWeek}</p>
            <p className="text-[10px] text-muted-foreground">This Week</p>
          </CardContent></Card>
        </div>
      )}

      {/* Frequent Contacts */}
      {data?.frequentContacts && data.frequentContacts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Frequent Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex flex-wrap gap-2">
              {data.frequentContacts.map((c: any) => (
                <Button
                  key={c.id}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleStartCall(c)}
                >
                  <Phone className="h-3 w-3" />
                  <span className="truncate max-w-28">{c.firstName}{c.lastName ? ` ${c.lastName}` : ""}</span>
                  {c.company && <span className="text-[10px] text-muted-foreground">({c.company})</span>}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missed Call Recovery */}
      {data?.missedCalls && data.missedCalls.length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
              <PhoneMissed className="h-4 w-4" />
              Missed Calls ({data.missedCalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-1">
              {data.missedCalls.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm border">
                  <div className="flex items-center gap-2 min-w-0">
                    <PhoneMissed className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    <span className="truncate font-medium">{getContactName(c)}</span>
                    {c.phoneNumber && (
                      <span className="text-xs text-muted-foreground shrink-0">{c.phoneNumber}</span>
                    )}
                    <span className="text-xs text-muted-foreground shrink-0">
                      {c.calledAt ? format(parseISO(c.calledAt), "h:mm a") : ""}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 ml-2"
                    onClick={() => {
                      setMissedFollowup(c)
                      setFollowupDate(new Date().toISOString().split("T")[0])
                    }}
                  >
                    <Target className="mr-1 h-3 w-3" />
                    Follow up
                  </Button>
                </div>
              ))}
              {data.missedCalls.length > 5 && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  +{data.missedCalls.length - 5} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Log Bar */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Quick Log Call
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[160px]">
              <Label className="text-[10px] mb-1 block">Contact or Number</Label>
              <div className="relative">
                <Input
                  placeholder="Phone number..."
                  value={quickNumber}
                  onChange={(e) => setQuickNumber(e.target.value)}
                  className="h-8 text-sm pr-8"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setQuickContactOpen(true)}
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              {quickSelectedContact && (
                <p className="text-[10px] text-blue-600 mt-0.5">
                  {quickSelectedContact.firstName} {quickSelectedContact.lastName || ""}
                  {quickSelectedContact.company ? ` — ${quickSelectedContact.company}` : ""}
                </p>
              )}
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Direction</Label>
              <div className="flex rounded-lg border bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => setQuickDirection("outbound")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    quickDirection === "outbound" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <PhoneOutgoing className="h-3 w-3" />
                  Out
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDirection("inbound")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    quickDirection === "inbound" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <PhoneIncoming className="h-3 w-3" />
                  In
                </button>
              </div>
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Status</Label>
              <Select value={quickStatus} onValueChange={(v) => v && setQuickStatus(v)}>
                <SelectTrigger className="h-8 text-xs w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[70px]">
              <Label className="text-[10px] mb-1 block">Min</Label>
              <Input
                placeholder="0"
                type="number"
                min="0"
                value={quickDuration}
                onChange={(e) => setQuickDuration(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <Label className="text-[10px] mb-1 block">Notes</Label>
              <Input
                placeholder="Optional..."
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="h-8"
              onClick={handleQuickLog}
              disabled={logCall.isPending || (!quickNumber && !quickSelectedContact)}
            >
              {logCall.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Plus className="mr-1 h-3 w-3" />}
              Log Call
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Calls (grouped by contact) */}
      {todayCalls.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Today&apos;s Calls
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {todayCalls.length} calls · {formatDuration(todayTotalDuration)} total
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              {Object.entries(groupedToday).map(([key, calls]) => (
                <div key={key} className="rounded-lg border bg-white">
                  <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/20">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{getContactName(calls[0])}</span>
                    <span className="text-xs text-muted-foreground">({calls.length})</span>
                  </div>
                  {calls.map((c) => (
                    <div key={c.id}>
                      <div
                        className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-muted/20"
                        onClick={() => handleExpandCall(c)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {c.direction === "outbound"
                            ? <PhoneOutgoing className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            : <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          }
                          <span className="text-xs text-muted-foreground">
                            {c.calledAt ? format(parseISO(c.calledAt), "h:mm a") : "—"}
                          </span>
                          {getStatusBadge(c.status)}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{formatDuration(c.duration)}</span>
                          {expandedCall === c.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                      {expandedCall === c.id && (
                        <div className="border-t bg-muted/10 px-3 py-2 space-y-2">
                          <Textarea
                            placeholder="Add notes..."
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="min-h-[60px] text-xs"
                          />
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setExpandedCall(null)}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleSaveNotes(c.id)}
                              disabled={updateCall.isPending}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  period === p.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="relative w-56">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.calls.length ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <Phone className="mb-4 h-10 w-10 text-zinc-300" />
            <h3 className="text-lg font-semibold text-zinc-900">No calls logged yet</h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Log your first call using the quick log bar above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.calls.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      c.direction === "outbound" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600",
                    )}>
                      {c.direction === "outbound" ? <PhoneOutgoing className="h-4 w-4" /> : <PhoneIncoming className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{getContactName(c)}</p>
                          {c.contactCompany && (
                            <p className="text-xs text-muted-foreground">{c.contactCompany}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(c.status)}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDuration(c.duration)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {c.calledAt ? format(parseISO(c.calledAt), "MMM d, yyyy") : "—"}
                        </span>
                        {c.calledAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(c.calledAt), "h:mm a")}
                          </span>
                        )}
                        {c.phoneNumber && <span className="text-muted-foreground">{c.phoneNumber}</span>}
                      </div>
                      {c.notes && (
                        <p className="mt-1 text-xs text-zinc-600 line-clamp-2">{c.notes}</p>
                      )}
                      {!c.contactId && !c.leadId && (
                        <button
                          onClick={() => setLinkDialog({ open: true, callId: c.id })}
                          className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Link2 className="h-3 w-3" />
                          Link to Lead
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Contact Search Dialog */}
      <Dialog open={quickContactOpen} onOpenChange={setQuickContactOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Input
              placeholder="Search contacts..."
              value={quickContactSearch}
              onChange={(e) => setQuickContactSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {quickContactResults.map((contact: any) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    setQuickSelectedContact(contact)
                    setQuickNumber(contact.mobile || "")
                    setQuickContactOpen(false)
                    setQuickContactSearch("")
                    setQuickContactResults([])
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm hover:bg-muted"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {contact.firstName} {contact.lastName || ""}
                    </p>
                    {contact.company && <p className="text-xs text-muted-foreground">{contact.company}</p>}
                  </div>
                  {contact.mobile && <span className="text-xs text-muted-foreground">{contact.mobile}</span>}
                </button>
              ))}
              {quickContactSearch && quickContactResults.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No contacts found</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link to Lead Dialog */}
      <Dialog open={linkDialog.open} onOpenChange={(o) => setLinkDialog({ open: o, callId: o ? linkDialog.callId : "" })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Link Call</DialogTitle>
            <DialogDescription>Link this call to a lead or contact</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setLinkType("lead")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  linkType === "lead" ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >
                Lead
              </button>
              <button
                type="button"
                onClick={() => setLinkType("contact")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  linkType === "contact" ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >
                Contact
              </button>
            </div>
            <div className="relative">
              <Input
                placeholder={`Search ${linkType}s...`}
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                autoFocus
              />
              {linkSearching && (
                <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {linkResults.map((item: any) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    handleLinkCall()
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm hover:bg-muted"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {linkType === "lead" ? (item.companyName || "Unnamed") : `${item.firstName || ""} ${item.lastName || ""}`}
                    </p>
                    {linkType === "lead" && item.contactPerson && (
                      <p className="text-xs text-muted-foreground">{item.contactPerson}</p>
                    )}
                  </div>
                </button>
              ))}
              {linkSearch && linkResults.length === 0 && !linkSearching && (
                <p className="text-sm text-muted-foreground py-4 text-center">No results found</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog({ open: false, callId: "" })}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missed Call Follow-up Dialog */}
      <Dialog open={!!missedFollowup} onOpenChange={(o) => { if (!o) setMissedFollowup(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>
              Create a follow-up task for {missedFollowup ? getContactName(missedFollowup) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
              />
            </div>
            {missedFollowup?.notes && (
              <div>
                <Label>Call Notes</Label>
                <p className="text-sm text-muted-foreground">{missedFollowup.notes}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMissedFollowup(null)}>Cancel</Button>
            <Button onClick={handleMissedFollowup} disabled={!followupDate || createFollowUp.isPending}>
              {createFollowUp.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Target className="mr-1 h-4 w-4" />}
              Create Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
