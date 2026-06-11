"use client"

import { useState, useMemo } from "react"
import { useDashboard, type DashboardData } from "@/hooks/use-dashboard"
import { useTodayOdometerLog, useCreateOrUpdateOdometerLog } from "@/hooks/use-odometer"
import { format, formatDistanceToNow, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Phone,
  MessageSquare,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  Plus,
  FileEdit,
  Target,
  Trophy,
  Droplets,
  ListTodo,
  Star,
  X,
  PhoneCall,
  PlusCircle,
  Eye,
  UserPlus,
  AlertTriangle,
  Flame,
  CalendarDays,
  Users,
  Gauge,
  Pencil,
  Loader2,
} from "lucide-react"

const QUOTES = [
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Your income is directly proportional to the number of calls you make.",
  "Sales are contingent upon the attitude of the salesman – not the attitude of the prospect.",
  "Don't find customers for your product, find products for your customers.",
  "Stop selling. Start helping.",
  "The harder you work, the luckier you get.",
  "Every no brings you closer to a yes.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The only limit to your impact is your imagination and commitment.",
  "Be so good they can't ignore you.",
  "Sales is not about selling. It's about building trust.",
  "Your attitude determines your altitude.",
  "The biggest risk is not taking any risk.",
  "Fall seven times, stand up eight.",
  "Don't watch the clock; do what it does. Keep going.",
  "The secret of getting ahead is getting started.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Believe you can and you're halfway there.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Success usually comes to those who are too busy to be looking for it.",
  "If you are not willing to risk the usual, you will have to settle for the ordinary.",
  "The way to get started is to quit talking and begin doing.",
  "Sales are won by listening, not talking.",
  "People don't buy what you do, they buy why you do it.",
  "A satisfied customer is the best business strategy of all.",
  "The greatest danger in times of turbulence is to act with yesterday's logic.",
  "Every conversation is a chance to make a difference.",
  "The most valuable thing you can bring to a sale is your enthusiasm.",
  "Consistency is what transforms average into excellence.",
  "Make each day your masterpiece.",
]

const TYPE_EMOJIS: Record<string, string> = {
  call: "📞",
  whatsapp: "💬",
  meeting: "🤝",
  site_visit: "📍",
  email: "📧",
}

const TYPE_LABELS: Record<string, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  meeting: "Meeting",
  site_visit: "Site Visit",
  email: "Email",
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
}

const NOTE_COLORS: Record<string, string> = {
  yellow: "bg-yellow-50 border-yellow-200",
  blue: "bg-blue-50 border-blue-200",
  green: "bg-green-50 border-green-200",
  pink: "bg-pink-50 border-pink-200",
  purple: "bg-purple-50 border-purple-200",
}

export default function MyDayPage() {
  const { data, isLoading } = useDashboard()
  const { user } = useUser()
  const [donePeople, setDonePeople] = useState<Set<string>>(new Set())

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night"
  const quoteIndex = new Date().getDate() % QUOTES.length
  const quote = QUOTES[quoteIndex]
  const firstName = user?.firstName || "there"

  const allPeople = useMemo(() => {
    if (!data) return []
    const people: {
      id: string
      name: string
      company: string
      reason: string
      reasonType: string
      mobile: string | null
      whatsapp: string | null
      leadId: string | null
    }[] = []

    for (const f of data.peopleToContact.followupsDue) {
      people.push({
        id: `fup-${f.id}`,
        name: f.leadContactPerson || f.contactPerson || f.leadCompanyName || "Unknown",
        company: f.leadCompanyName || "",
        reason: "Follow-up due today",
        reasonType: "followup",
        mobile: f.mobile,
        whatsapp: null,
        leadId: f.leadId,
      })
    }

    for (const b of data.peopleToContact.birthdays) {
      const fullName = [b.firstName, b.lastName].filter(Boolean).join(" ")
      const isTodayBirthday = b.birthday && (() => {
        const d = new Date(b.birthday)
        return isToday(d)
      })()
      people.push({
        id: `bday-${b.id}`,
        name: fullName || "Unknown",
        company: b.company || "",
        reason: isTodayBirthday ? "🎂 Birthday today!" : "🎂 Birthday tomorrow",
        reasonType: "birthday",
        mobile: b.mobile,
        whatsapp: b.whatsapp,
        leadId: b.leadId,
      })
    }

    for (const c of data.peopleToContact.frequencyDue) {
      const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ")
      people.push({
        id: `freq-${c.id}`,
        name: fullName || "Unknown",
        company: c.company || "",
        reason: `${c.contactFrequency === "weekly" ? "7-day" : c.contactFrequency === "monthly" ? "30-day" : "Quarterly"} check-in`,
        reasonType: "frequency",
        mobile: c.mobile,
        whatsapp: c.whatsapp,
        leadId: c.leadId,
      })
    }

    for (const h of data.peopleToContact.hotStale) {
      people.push({
        id: `hot-${h.id}`,
        name: h.contactPerson || h.companyName || "Unknown",
        company: h.companyName || "",
        reason: "No activity in 7 days",
        reasonType: "stale",
        mobile: h.mobile,
        whatsapp: null,
        leadId: h.id,
      })
    }

    return people
  }, [data])

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <Skeleton className="h-7 w-56 bg-white/20 mb-2" />
          <Skeleton className="h-4 w-40 bg-white/20 mb-4" />
          <Skeleton className="h-4 w-96 bg-white/20" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Failed to load dashboard data
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <Section1Greeting greeting={greeting} quote={quote} firstName={firstName} />
      <Section2DailyFocus data={data} />
      <Section3MyNumbers data={data} />
      <Section4PeopleToContact data={data} allPeople={allPeople} donePeople={donePeople} setDonePeople={setDonePeople} />
      <Section5QuickLog />
      <Section6RecentActivity data={data} />
      <Section7QuickNotes data={data} />
    </div>
  )
}

function Section1Greeting({
  greeting,
  quote,
  firstName,
}: {
  greeting: string
  quote: string
  firstName: string
}) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 sm:p-6 text-white shadow-lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="mt-0.5 text-blue-200 text-xs sm:text-sm">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/15 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm backdrop-blur-sm whitespace-nowrap">
          <CalendarDays className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
        </div>
      </div>
      <div className="mt-3 sm:mt-4 border-t border-white/20 pt-3 sm:pt-4">
        <p className="text-xs sm:text-sm italic text-blue-100 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      </div>
    </div>
  )
}

function Section2MileageCard() {
  const { data: todayLog, isLoading } = useTodayOdometerLog()
  const saveLog = useCreateOrUpdateOdometerLog()
  const [startValue, setStartValue] = useState("")
  const [endValue, setEndValue] = useState("")

  const isPartial = todayLog && !todayLog.endReading
  const isComplete = todayLog && todayLog.endReading
  const distanceToday = todayLog?.startReading && todayLog?.endReading
    ? Number(todayLog.endReading) - Number(todayLog.startReading)
    : 0
  const taToday = distanceToday * Number(todayLog?.taRatePerKm || 4)

  const previewDistance = endValue && Number(endValue) > Number(todayLog?.startReading)
    ? Number(endValue) - Number(todayLog?.startReading)
    : 0
  const previewTA = previewDistance * Number(todayLog?.taRatePerKm || 4)

  const handleSaveStart = () => {
    if (!startValue) return
    saveLog.mutate(
      { logDate: new Date().toISOString().split("T")[0], startReading: startValue },
      { onSuccess: () => { toast.success("Start reading logged"); setStartValue("") } },
    )
  }

  const handleCloseDay = () => {
    if (!endValue || !todayLog) return
    saveLog.mutate(
      {
        logDate: todayLog.logDate,
        startReading: todayLog.startReading,
        endReading: endValue,
        taRatePerKm: todayLog.taRatePerKm || "4",
      },
      { onSuccess: () => { toast.success("Day closed!"); setEndValue("") } },
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5 text-primary" />Mileage</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(isComplete && "border-emerald-200 bg-emerald-50/30")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {isComplete ? (
            <span className="text-emerald-700">✅ Today: {distanceToday} km · ₹{taToday} TA</span>
          ) : isPartial ? (
            <span className="text-amber-700">🏍️ Started: {Number(todayLog.startReading).toLocaleString("en-IN")} km</span>
          ) : (
            <span className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Log today's start reading
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!todayLog && (
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Odometer start (km)"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              className="h-12 text-lg"
            />
            <Button className="w-full" size="lg" disabled={!startValue || saveLog.isPending} onClick={handleSaveStart}>
              {saveLog.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Log Start
            </Button>
          </div>
        )}
        {isPartial && (
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="End reading (km)"
              value={endValue}
              onChange={(e) => setEndValue(e.target.value)}
              className="h-12 text-lg"
            />
            {previewDistance > 0 && (
              <p className="text-center text-sm font-medium text-primary">
                {previewDistance} km · ₹{previewTA} TA
              </p>
            )}
            <Button className="w-full" size="lg" disabled={!endValue || saveLog.isPending} onClick={handleCloseDay}>
              {saveLog.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Close Day
            </Button>
          </div>
        )}
        {isComplete && (
          <div className="text-center">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{distanceToday} km</p>
              <p className="text-xs text-muted-foreground">Distance today</p>
            </div>
            <Link href="/mileage" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <Pencil className="h-3 w-3" />Edit
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Section2DailyFocus({ data }: { data: DashboardData }) {
  const { dailyFocus } = data
  const todayMeetings = dailyFocus.todayFollowups.filter((f) => f.type === "meeting")
  const todaySiteVisits = dailyFocus.todayFollowups.filter((f) => f.type === "site_visit")

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Daily Focus</h2>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Section2MileageCard />
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Flame className="h-5 w-5" />
              URGENT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dailyFocus.overdueFollowups.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-red-600">
                  Overdue Follow-ups ({dailyFocus.overdueFollowups.length})
                </p>
                <div className="space-y-2">
                  {dailyFocus.overdueFollowups.slice(0, 5).map((f) => (
                    <Link
                      key={f.id}
                      href={`/leads/${f.leadId}`}
                      className="flex items-center gap-2 rounded-lg bg-white p-2.5 text-sm shadow-sm transition-colors hover:bg-red-50"
                    >
                      <span>{TYPE_EMOJIS[f.type || ""] || "📌"}</span>
                      <span className="flex-1 truncate font-medium">
                        {f.leadCompanyName || "Unknown"}
                      </span>
                      {f.priority && (
                        <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", PRIORITY_COLORS[f.priority])}>
                          {f.priority}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {dailyFocus.staleLeads.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-amber-600">
                  Stale (no contact 21+ days)
                </p>
                <div className="space-y-1">
                  {dailyFocus.staleLeads.slice(0, 5).map((l) => (
                    <Link
                      key={l.id}
                      href={`/leads/${l.id}`}
                      className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm shadow-sm transition-colors hover:bg-amber-50"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span className="truncate">{l.companyName || "Unknown"}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {dailyFocus.hotLeads.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-red-600">
                  Hot Leads ({dailyFocus.hotLeads.length})
                </p>
                <div className="space-y-1">
                  {dailyFocus.hotLeads.slice(0, 5).map((l) => (
                    <Link
                      key={l.id}
                      href={`/leads/${l.id}`}
                      className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm shadow-sm transition-colors hover:bg-red-50"
                    >
                      <Flame className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="truncate font-medium">{l.companyName || "Unknown"}</span>
                      <Badge variant="outline" className="ml-auto px-1.5 py-0 text-[10px] capitalize">
                        {l.stage?.replace("_", " ")}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {dailyFocus.overdueFollowups.length === 0 &&
              dailyFocus.staleLeads.length === 0 &&
              dailyFocus.hotLeads.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nothing urgent. Great job staying on top of things!
                </p>
              )}
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <ListTodo className="h-5 w-5" />
              TODAY&apos;S PLAN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dailyFocus.todayFollowups.filter((f) => f.type !== "meeting" && f.type !== "site_visit").length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-amber-600">
                  Follow-ups ({dailyFocus.todayFollowups.length})
                </p>
                <div className="space-y-1">
                  {dailyFocus.todayFollowups
                    .filter((f) => f.type !== "meeting" && f.type !== "site_visit")
                    .slice(0, 5)
                    .map((f) => (
                      <Link
                        key={f.id}
                        href={`/leads/${f.leadId}`}
                        className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm shadow-sm transition-colors hover:bg-amber-50"
                      >
                        <span>{TYPE_EMOJIS[f.type || ""] || "📌"}</span>
                        <span className="flex-1 truncate font-medium">
                          {f.leadCompanyName || "Unknown"}
                        </span>
                        {f.followupTime && (
                          <span className="text-xs text-muted-foreground">{f.followupTime}</span>
                        )}
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {todaySiteVisits.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-amber-600">
                  Site Visits ({todaySiteVisits.length})
                </p>
                {todaySiteVisits.map((f) => (
                  <Link
                    key={f.id}
                    href={`/leads/${f.leadId}`}
                    className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm shadow-sm transition-colors hover:bg-amber-50"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <span className="truncate">{f.leadCompanyName || "Unknown"}</span>
                  </Link>
                ))}
              </div>
            )}

            {todayMeetings.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-amber-600">
                  Meetings ({todayMeetings.length})
                </p>
                {todayMeetings.map((f) => (
                  <Link
                    key={f.id}
                    href={`/leads/${f.leadId}`}
                    className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm shadow-sm transition-colors hover:bg-amber-50"
                  >
                    <Users className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <span className="truncate">{f.leadCompanyName || "Unknown"}</span>
                    {f.followupTime && (
                      <span className="text-xs text-muted-foreground">{f.followupTime}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {dailyFocus.todayFollowups.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No follow-ups planned for today
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <CalendarDays className="h-5 w-5" />
              THIS WEEK
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{dailyFocus.upcomingWeekFollowupsCount}</p>
              <p className="text-sm text-muted-foreground">Upcoming follow-ups this week</p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{dailyFocus.weekLeadsNeedingMovement}</p>
              <p className="text-sm text-muted-foreground">Leads needing stage movement</p>
            </div>
            <Link
              href="/followups"
              className="flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-white p-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              <Eye className="h-4 w-4" />
              View all follow-ups
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Section3MyNumbers({ data }: { data: DashboardData }) {
  const { myNumbers } = data
  const goals = myNumbers.goals
  const targetLeads = goals?.targetLeads || 20
  const targetVisits = goals?.targetVisits || 15
  const targetConversions = goals?.targetConversions || 5
  const targetM3 = Number(goals?.targetM3) || 500

  const metrics = [
    {
      label: "Leads Created",
      value: myNumbers.leadsCreatedThisMonth,
      target: targetLeads,
      icon: UserPlus,
      color: "text-blue-600",
      stroke: "#2563eb",
    },
    {
      label: "Site Visits",
      value: myNumbers.visitsThisMonth,
      target: targetVisits,
      icon: MapPin,
      color: "text-violet-600",
      stroke: "#7c3aed",
    },
    {
      label: "Deals Won",
      value: myNumbers.dealsWonThisMonth,
      target: targetConversions,
      icon: Trophy,
      color: "text-emerald-600",
      stroke: "#059669",
    },
    {
      label: "m³ Pipeline",
      value: Math.round(myNumbers.m3Pipeline),
      target: targetM3,
      icon: Droplets,
      color: "text-cyan-600",
      stroke: "#0891b2",
    },
  ]

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">My Numbers</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => {
          const pct = m.target > 0 ? Math.min(Math.round((m.value / m.target) * 100), 100) : 0
          const circumference = 2 * Math.PI * 36
          const offset = circumference - (pct / 100) * circumference
          const Icon = m.icon

          return (
            <Card key={m.label}>
              <CardContent className="flex flex-col items-center p-4 text-center">
                <div className="relative mb-2">
                  <svg width="88" height="88" className="-rotate-90">
                    <circle cx="44" cy="44" r="36" fill="none" stroke="oklch(0.92 0 0)" strokeWidth="6" />
                    <circle
                      cx="44"
                      cy="44"
                      r="36"
                      fill="none"
                      stroke={m.stroke}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className={cn("h-5 w-5", m.color)} />
                  </div>
                </div>
                <p className="text-lg font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {pct}% of {m.target}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function Section4PeopleToContact({
  data,
  allPeople,
  donePeople,
  setDonePeople,
}: {
  data: DashboardData
  allPeople: {
    id: string
    name: string
    company: string
    reason: string
    reasonType: string
    mobile: string | null
    whatsapp: string | null
    leadId: string | null
  }[]
  donePeople: Set<string>
  setDonePeople: (fn: Set<string> | ((prev: Set<string>) => Set<string>)) => void
}) {
  const visible = allPeople.filter((p) => !donePeople.has(p.id))

  if (visible.length === 0 && allPeople.length === 0) return null

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">
        People to Contact Today
        {allPeople.length > 0 && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({allPeople.length - donePeople.size} remaining)
          </span>
        )}
      </h2>
      <div className="space-y-2">
        {visible.slice(0, 10).map((person) => (
          <Card key={person.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {person.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={person.leadId ? `/leads/${person.leadId}` : "#"}
                  className="text-sm font-medium hover:text-primary hover:underline"
                >
                  {person.name}
                </Link>
                {person.company && (
                  <p className="text-xs text-muted-foreground">{person.company}</p>
                )}
                <p className="text-xs text-muted-foreground">{person.reason}</p>
              </div>
              <div className="flex items-center gap-1">
                {person.mobile && (
                  <a
                    href={`tel:${person.mobile}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-emerald-600 hover:bg-muted"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                )}
                {person.whatsapp && (
                  <a
                    href={`https://wa.me/${person.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-emerald-600 hover:bg-muted"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </a>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => setDonePeople((prev) => new Set(prev).add(person.id))}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {visible.length === 0 && allPeople.length > 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            All caught up! Everyone has been contacted.
          </p>
        )}
      </div>
    </div>
  )
}

function Section5QuickLog() {
  const [open, setOpen] = useState<string | null>(null)
  const [callModal, setCallModal] = useState({ leadName: "", notes: "" })
  const [visitModal, setVisitModal] = useState({ leadName: "", address: "", notes: "" })
  const [noteModal, setNoteModal] = useState({ content: "", color: "yellow" })

  const actions = [
    {
      id: "call",
      label: "Log a Call",
      icon: PhoneCall,
      color: "text-emerald-600 bg-emerald-50",
      dialog: (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a Call</DialogTitle>
            <DialogDescription>Quickly log a call you just made</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Lead / Contact name</Label>
              <Input
                placeholder="Enter name..."
                value={callModal.leadName}
                onChange={(e) => setCallModal((p) => ({ ...p, leadName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Call summary..."
                value={callModal.notes}
                onChange={(e) => setCallModal((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); setCallModal({ leadName: "", notes: "" }) }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      ),
    },
    {
      id: "visit",
      label: "Log a Visit",
      icon: MapPin,
      color: "text-violet-600 bg-violet-50",
      dialog: (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a Site Visit</DialogTitle>
            <DialogDescription>Record a site visit</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Lead / Site name</Label>
              <Input
                placeholder="Enter name..."
                value={visitModal.leadName}
                onChange={(e) => setVisitModal((p) => ({ ...p, leadName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                placeholder="Site address..."
                value={visitModal.address}
                onChange={(e) => setVisitModal((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Visit notes..."
                value={visitModal.notes}
                onChange={(e) => setVisitModal((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); setVisitModal({ leadName: "", address: "", notes: "" }) }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      ),
    },
    {
      id: "note",
      label: "Add Quick Note",
      icon: FileEdit,
      color: "text-amber-600 bg-amber-50",
      dialog: (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Note</DialogTitle>
            <DialogDescription>Jot down a quick thought</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Write your note..."
              value={noteModal.content}
              onChange={(e) => setNoteModal((p) => ({ ...p, content: e.target.value }))}
            />
            <div className="flex gap-2">
              {["yellow", "blue", "green", "pink", "purple"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNoteModal((p) => ({ ...p, color: c }))}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-all",
                    NOTE_COLORS[c].split(" ")[0],
                    noteModal.color === c && "scale-125 ring-2 ring-zinc-400",
                  )}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); setNoteModal({ content: "", color: "yellow" }) }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      ),
    },
    {
      id: "lead",
      label: "New Lead",
      icon: PlusCircle,
      color: "text-blue-600 bg-blue-50",
      dialog: (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Lead</DialogTitle>
            <DialogDescription>Add a lead in seconds</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Company name</Label>
              <Input placeholder="Company name..." />
            </div>
            <div>
              <Label>Contact person</Label>
              <Input placeholder="Contact person..." />
            </div>
            <div>
              <Label>Phone</Label>
              <Input placeholder="Phone number..." type="tel" />
            </div>
          </div>
          <DialogFooter>
            <Button>Save Lead</Button>
          </DialogFooter>
        </DialogContent>
      ),
    },
  ]

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Quick Log</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <Dialog key={a.id} open={open === a.id} onOpenChange={(o) => setOpen(o ? a.id : null)}>
              <button
                type="button"
                onClick={() => setOpen(a.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left shadow-sm transition-all hover:shadow-md",
                  a.color,
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/80">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{a.label}</span>
              </button>
              {a.dialog}
            </Dialog>
          )
        })}
      </div>
    </div>
  )
}

function Section6RecentActivity({ data }: { data: DashboardData }) {
  const typeConfig: Record<string, { icon: any; color: string }> = {
    lead_created: { icon: PlusCircle, color: "text-blue-600 bg-blue-50" },
    call: { icon: PhoneCall, color: "text-emerald-600 bg-emerald-50" },
    followup_added: { icon: CalendarCheck, color: "text-indigo-600 bg-indigo-50" },
    visit: { icon: MapPin, color: "text-violet-600 bg-violet-50" },
    stage_changed: { icon: Target, color: "text-amber-600 bg-amber-50" },
    note_added: { icon: FileEdit, color: "text-zinc-600 bg-zinc-100" },
    quotation_sent: { icon: FileEdit, color: "text-cyan-600 bg-cyan-50" },
    won: { icon: Trophy, color: "text-emerald-600 bg-emerald-50" },
    lost: { icon: Trophy, color: "text-red-600 bg-red-50" },
  }

  if (data.recentActivities.length === 0) return null

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Recent Activity</h2>
      <Card>
        <CardContent className="divide-y divide-zinc-100 p-0">
          {data.recentActivities.map((a) => {
            const config = typeConfig[a.type ?? ""] ?? { icon: Star, color: "bg-zinc-100 text-zinc-500" }
            const Icon = config.icon
            return (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-zinc-700">{a.description}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : ""}
                  </p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function Section7QuickNotes({ data }: { data: DashboardData }) {
  const [newNote, setNewNote] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  if (data.pinnedNotes.length === 0 && !showAdd) return null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Quick Notes</h2>
        {!showAdd && (
          <Button size="xs" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Note
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {showAdd && (
          <div className="flex w-56 flex-col gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-white p-3 shadow-sm">
            <Textarea
              placeholder="Type your note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-16 text-sm"
            />
            <div className="flex gap-1">
              {["yellow", "blue", "green", "pink", "purple"].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn("h-4 w-4 rounded-full border", NOTE_COLORS[c].split(" ")[0])}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <Button size="xs" className="flex-1">Save</Button>
              <Button size="xs" variant="ghost" onClick={() => { setShowAdd(false); setNewNote("") }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        {data.pinnedNotes.map((note) => (
          <div
            key={note.id}
            className={cn(
              "flex w-56 flex-col gap-1 rounded-xl border p-3 shadow-sm",
              NOTE_COLORS[note.color || "yellow"] || NOTE_COLORS.yellow,
            )}
          >
            <p className="text-sm text-zinc-800">{note.content}</p>
            <p className="text-[10px] text-zinc-500">
              {note.createdAt ? formatDistanceToNow(new Date(note.createdAt), { addSuffix: true }) : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
