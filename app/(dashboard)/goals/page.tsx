"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Target,
  TrendingUp,
  Trophy,
  Flame,
  CalendarDays,
  Plus,
  Loader2,
  Edit3,
  Users,
  MapPin,
  Phone,
  Database,
  DollarSign,
  Award,
} from "lucide-react"

const BADGE_DEFS: Record<string, { label: string; icon: string; desc: string }> = {
  first_deal: { label: "First Deal Won", icon: "🏆", desc: "Celebrate your first closed deal" },
  pipeline_100: { label: "100m³ Pipeline", icon: "💧", desc: "Built 100m³ in your pipeline" },
  visits_10_week: { label: "10 Visits in a Week", icon: "📍", desc: "Completed 10 site visits in a week" },
  leads_5_day: { label: "5 Leads in a Day", icon: "⚡", desc: "Created 5 leads in a single day" },
  streak_7: { label: "7-Day Streak", icon: "🔥", desc: "7 consecutive days of activity" },
  streak_30: { label: "30-Day Streak", icon: "🔥", desc: "Month of non-stop grinding" },
}

function CircularProgress({
  current, target, size = 100, strokeWidth = 8,
}: {
  current: number; target: number; size?: number; strokeWidth?: number
}) {
  const pct = target > 0 ? Math.min(current / target, 1) : 0
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)
  const color = pct >= 1 ? "#10b981" : pct >= 0.6 ? "#f59e0b" : "#ef4444"
  const label = target > 0 ? `${Math.round(pct * 100)}%` : "—"

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e4e4e7" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>{label}</span>
    </div>
  )
}

export default function GoalsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [form, setForm] = useState({ targetLeads: "", targetVisits: "", targetConversions: "", targetM3: "", targetRevenue: "" })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/goals")
      if (res.ok) {
        const d = await res.json()
        setData(d)
        if (d.goals) {
          setForm({
            targetLeads: d.goals.targetLeads?.toString() || "",
            targetVisits: d.goals.targetVisits?.toString() || "",
            targetConversions: d.goals.targetConversions?.toString() || "",
            targetM3: d.goals.targetM3?.toString() || "",
            targetRevenue: d.goals.targetRevenue?.toString() || "",
          })
        }
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSaveGoals = async () => {
    setSaving(true)
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setGoalsOpen(false)
      fetchData()
    } catch {} finally { setSaving(false) }
  }

  const progressItems = data?.progress ? [
    { key: "leads", label: "New Leads", icon: <Users className="h-4 w-4" />, current: data.progress.leadsCreated, target: data.goals?.targetLeads || 0, status: data.progress.status.leads, dailyRate: data.progress.dailyRate.leads },
    { key: "visits", label: "Site Visits", icon: <MapPin className="h-4 w-4" />, current: data.progress.visitsDone, target: data.goals?.targetVisits || 0, status: data.progress.status.visits, dailyRate: data.progress.dailyRate.visits },
    { key: "followups", label: "Follow-ups", icon: <Phone className="h-4 w-4" />, current: data.progress.followupsDone, target: data.goals?.targetConversions || 0, status: data.progress.status.followups, dailyRate: 0 },
    { key: "m3", label: "m³ Pipeline", icon: <Database className="h-4 w-4" />, current: Math.round(data.progress.m3Pipeline), target: Number(data.goals?.targetM3 || 0), status: data.progress.status.m3, dailyRate: data.progress.dailyRate.m3 },
    { key: "deals", label: "Deals Won", icon: <Trophy className="h-4 w-4" />, current: data.progress.dealsWon, target: data.goals?.targetConversions || 0, status: data.progress.status.deals, dailyRate: 0 },
    { key: "revenue", label: "Revenue (₹)", icon: <DollarSign className="h-4 w-4" />, current: data.progress.revenue, target: Number(data.goals?.targetRevenue || 0), status: data.progress.status.revenue, dailyRate: 0 },
  ] : []

  const statusLabel: Record<string, { text: string; color: string }> = {
    exceeded: { text: "Exceeded ✓", color: "text-emerald-600 bg-emerald-50" },
    on_track: { text: "On Track", color: "text-blue-600 bg-blue-50" },
    behind: { text: "Behind", color: "text-amber-600 bg-amber-50" },
    at_risk: { text: "At Risk!", color: "text-red-600 bg-red-50" },
  }

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`
    return `₹${val}`
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const bestMonth = data?.history ? [...data.history].sort((a: any, b: any) => {
    const aRate = a.leads + a.visits + a.won
    const bRate = b.leads + b.visits + b.won
    return bRate - aRate
  })[0] : null

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monthly Goals</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Button size="sm" onClick={() => setGoalsOpen(true)}>
          {data?.goals ? <Edit3 className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
          {data?.goals ? "Edit Goals" : "Set Goals"}
        </Button>
      </div>

      {/* Streak + Comparison */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-lg font-bold">{data.streak} days</p>
                <p className="text-[10px] text-muted-foreground">Active Streak</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-lg font-bold">{data.comparison.thisMonth.leads}</p>
                <p className="text-[10px] text-muted-foreground">
                  Leads{data.comparison.lastMonth.leads > 0 ? ` vs ${data.comparison.lastMonth.leads} last mo` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <MapPin className="h-8 w-8 text-violet-500" />
              <div>
                <p className="text-lg font-bold">{data.comparison.thisMonth.visits}</p>
                <p className="text-[10px] text-muted-foreground">
                  Visits{data.comparison.lastMonth.visits > 0 ? ` vs ${data.comparison.lastMonth.visits} last mo` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Trophy className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-lg font-bold">{data.comparison.thisMonth.won}</p>
                <p className="text-[10px] text-muted-foreground">
                  Won{data.comparison.lastMonth.won > 0 ? ` vs ${data.comparison.lastMonth.won} last mo` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals: Setup prompt or Progress Dashboard */}
      {!data?.goals ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Target className="mb-3 h-10 w-10 text-zinc-300" />
            <h3 className="text-lg font-semibold">No goals set for this month</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Set monthly targets to track your progress and stay motivated.
            </p>
            <Button className="mt-5" onClick={() => setGoalsOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Set Goals
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {progressItems.map((item) => {
              const st = statusLabel[item.status] || statusLabel.on_track
              const remaining = Math.max(0, item.target - item.current)
              return (
                <Card key={item.key}>
                  <CardContent className="flex flex-col items-center p-4 text-center">
                    <CircularProgress current={item.current} target={item.target} size={90} strokeWidth={7} />
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      {item.icon}
                      {item.label}
                    </div>
                    <div className="mt-1 space-y-0.5 text-[10px]">
                      <p>
                        <span className="font-medium">{typeof item.current === "number" ? item.current.toLocaleString() : item.current}</span>
                        <span className="text-muted-foreground"> / {item.target || "—"}</span>
                      </p>
                      {item.target > 0 && (
                        <p className={cn("rounded px-1 py-0.5 text-[10px] font-medium", st.color)}>{st.text}</p>
                      )}
                      {remaining > 0 && (
                        <p className="text-muted-foreground">{remaining} remaining</p>
                      )}
                    </div>
                    {item.dailyRate > 0 && (
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        Need {item.dailyRate}/day to hit target
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Weekly Breakdown */}
          {data.weeklyData && data.weeklyData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Weekly Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }} cursor={{ fill: "#f4f4f5" }} />
                      <Bar dataKey="leads" radius={[4, 4, 0, 0]} fill="#3b82f6" maxBarSize={32} name="Leads" />
                      <Bar dataKey="visits" radius={[4, 4, 0, 0]} fill="#8b5cf6" maxBarSize={32} name="Visits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {data.weeklyPace > 0 && data.progress && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    You need <strong>{data.weeklyPace}</strong> visits per week to stay on track
                    {data.progress.visitsDone < (data.weeklyPace * data.progress.dayOfMonth / 7) && (
                      <span className="text-amber-600"> — you&apos;re behind pace</span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Performance History */}
          {data.history && data.history.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-medium">Month</th>
                        <th className="px-4 py-2.5 text-right font-medium">Leads</th>
                        <th className="px-4 py-2.5 text-right font-medium">Visits</th>
                        <th className="px-4 py-2.5 text-right font-medium">Won</th>
                        <th className="px-4 py-2.5 text-right font-medium">m³</th>
                        <th className="px-4 py-2.5 text-right font-medium">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.history.map((row: any) => {
                        const score = row.leads + row.visits + row.won
                        const isBest = bestMonth && bestMonth.month === row.month
                        const isCurrent = row.month === data.history[data.history.length - 1]?.month
                        return (
                          <tr
                            key={row.month}
                            className={cn(
                              "border-b last:border-0 hover:bg-muted/20",
                              isBest && "bg-emerald-50/50",
                              isCurrent && "font-medium",
                            )}
                          >
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                {isBest && <Award className="h-3.5 w-3.5 text-emerald-500" />}
                                {row.month}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right">{row.leads}</td>
                            <td className="px-4 py-2.5 text-right">{row.visits}</td>
                            <td className="px-4 py-2.5 text-right">{row.won}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-xs">{row.m3.toFixed(1)}</td>
                            <td className="px-4 py-2.5 text-right">{score}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Badges */}
          {data.badges && data.badges.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Achievement Badges
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {data.badges.map((b: string) => {
                    const def = BADGE_DEFS[b]
                    if (!def) return null
                    return (
                      <div key={b} className="flex flex-col items-center gap-1 rounded-lg border bg-white p-3 text-center">
                        <span className="text-2xl">{def.icon}</span>
                        <p className="text-xs font-medium leading-tight">{def.label}</p>
                        <p className="text-[9px] text-muted-foreground leading-tight">{def.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Goals Form Dialog */}
      <Dialog open={goalsOpen} onOpenChange={(o) => { if (!o) setGoalsOpen(false) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{data?.goals ? "Edit Goals" : "Set Monthly Goals"}</DialogTitle>
            <DialogDescription>
              Set your targets for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">New Leads to Create</Label>
              <Input type="number" min="0" placeholder="e.g. 20" value={form.targetLeads} onChange={(e) => setForm({ ...form, targetLeads: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Site Visits to Complete</Label>
              <Input type="number" min="0" placeholder="e.g. 15" value={form.targetVisits} onChange={(e) => setForm({ ...form, targetVisits: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Follow-ups / Deals to Win</Label>
              <Input type="number" min="0" placeholder="e.g. 10" value={form.targetConversions} onChange={(e) => setForm({ ...form, targetConversions: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">m³ Pipeline Target</Label>
              <Input type="number" min="0" step="0.1" placeholder="e.g. 500" value={form.targetM3} onChange={(e) => setForm({ ...form, targetM3: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Target Revenue (₹)</Label>
              <Input type="number" min="0" placeholder="e.g. 5000000" value={form.targetRevenue} onChange={(e) => setForm({ ...form, targetRevenue: e.target.value })} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGoals} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Save Goals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
