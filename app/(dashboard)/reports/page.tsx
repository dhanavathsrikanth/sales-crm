"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  TrendingUp,
  Users,
  Target,
  MapPin,
  CalendarCheck,
  Database,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  FileSpreadsheet,
  Calculator,
  Building2,
  Save,
  Loader2,
  FileText,
  Gauge,
  Fuel,
  IndianRupee,
} from "lucide-react"

// ── Colors ──
const STAGE_COLORS: Record<string, string> = {
  New: "#a1a1aa", Contacted: "#3b82f6", Meeting: "#6366f1",
  "Site Visit": "#8b5cf6", Requirement: "#06b6d4", Quotation: "#f59e0b",
  Negotiation: "#f97316", "Trial Order": "#f43f5e", Won: "#10b981",
}
const CHART_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#f97316", "#f43f5e", "#10b981", "#a1a1aa", "#ef4444"]
const PIE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b"]

const DATE_PRESETS = [
  { key: "thisMonth", label: "This Month", getRange: () => {
    const n = new Date(); return { from: format(startOfMonth(n), "yyyy-MM-dd"), to: format(n, "yyyy-MM-dd") }
  }},
  { key: "lastMonth", label: "Last Month", getRange: () => {
    const n = subMonths(new Date(), 1); return { from: format(startOfMonth(n), "yyyy-MM-dd"), to: format(endOfMonth(n), "yyyy-MM-dd") }
  }},
  { key: "thisQuarter", label: "This Quarter", getRange: () => {
    const n = new Date(); const qStart = Math.floor(n.getMonth() / 3) * 3;
    return { from: format(new Date(n.getFullYear(), qStart, 1), "yyyy-MM-dd"), to: format(n, "yyyy-MM-dd") }
  }},
  { key: "custom", label: "Custom Range", getRange: () => ({ from: "", to: "" }) },
]

const STAGE_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", meeting_scheduled: "Meeting",
  site_visited: "Site Visit", requirement_received: "Requirement",
  quotation_sent: "Quotation", negotiation: "Negotiation",
  trial_order: "Trial Order", won: "Won", lost: "Lost",
}

function formatCurrency(val: number | null | undefined) {
  if (!val) return "₹0"
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`
  return `₹${val}`
}

export default function ReportsPage() {
  const [preset, setPreset] = useState("thisMonth")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [queryFrom, setQueryFrom] = useState("")
  const [queryTo, setQueryTo] = useState("")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Concrete Calculator
  const [calcOpen, setCalcOpen] = useState(false)
  const [calcFloors, setCalcFloors] = useState("")
  const [calcArea, setCalcArea] = useState("")
  const [calcRatio, setCalcRatio] = useState("0.037")
  const [calcResult, setCalcResult] = useState<number | null>(null)
  const [calcBreakdown, setCalcBreakdown] = useState<any[]>([])

  // Save to lead
  const [leadSearchOpen, setLeadSearchOpen] = useState(false)
  const [leadSearch, setLeadSearch] = useState("")
  const [leadResults, setLeadResults] = useState<any[]>([])
  const [saveM3Loading, setSaveM3Loading] = useState(false)

  // Export loading
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    const p = DATE_PRESETS.find((d) => d.key === preset)!
    const range = p.getRange()
    setDateFrom(range.from)
    setDateTo(range.to)
    if (preset !== "custom") {
      setQueryFrom(range.from)
      setQueryTo(range.to)
    }
  }, [preset])

  useEffect(() => {
    if (!queryFrom || !queryTo) return
    setLoading(true)
    setError(null)
    fetch(`/api/reports?from=${queryFrom}&to=${queryTo}`)
      .then((r) => { if (!r.ok) throw new Error("Failed to load reports"); return r.json() })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [queryFrom, queryTo])

  const handleApplyCustom = () => {
    setQueryFrom(dateFrom)
    setQueryTo(dateTo)
  }

  // ── Concrete Calculator ──
  const calculateConcrete = () => {
    const floors = parseFloat(calcFloors) || 0
    const area = parseFloat(calcArea) || 0
    const ratio = parseFloat(calcRatio) || 0.037
    const total = floors * area * ratio
    setCalcResult(total)
    const slab = total * 0.4
    const beam = total * 0.25
    const column = total * 0.2
    const foundation = total * 0.15
    setCalcBreakdown([
      { name: "Slab", value: slab, pct: 40 },
      { name: "Beams", value: beam, pct: 25 },
      { name: "Columns", value: column, pct: 20 },
      { name: "Foundation", value: foundation, pct: 15 },
    ])
  }

  const handleSaveM3ToLead = async () => {
    if (!calcResult || !leadResults[0]) return
    setSaveM3Loading(true)
    try {
      await fetch(`/api/leads/${leadResults[0].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimatedM3: calcResult.toFixed(2) }),
      })
      setLeadSearchOpen(false)
      setLeadSearch("")
      setLeadResults([])
    } catch {} finally { setSaveM3Loading(false) }
  }

  // ── Exports ──
  const exportCSV = async (type: string, filename: string) => {
    if (!data?.exportData) return
    setExporting(type)
    try {
      const { default: Papa } = await import("papaparse")
      const rows = data.exportData[type] || []
      if (!rows.length) { setExporting(null); return }
      const csv = Papa.unparse(rows)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `${filename}_${queryFrom}_${queryTo}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch {} finally { setExporting(null) }
  }

  const exportExcel = async (type: string, filename: string) => {
    if (!data?.exportData) return
    setExporting(type)
    try {
      const XLSX = await import("xlsx")
      let rows = data.exportData[type] || []
      if (!rows.length) { setExporting(null); return }

      if (type === "visits") {
        rows = rows.map((r: any) => ({
          ...r,
          "Date's Odometer Start": r.odometerStart || "",
          "Date's Odometer End": r.odometerEnd || "",
          "Date's Odometer Distance": r.odometerDistance || "",
        }))
      } else if (type === "leads") {
        rows = rows.map((r: any) => {
          const leadDate = r.createdAt ? format(new Date(r.createdAt), "yyyy-MM-dd") : ""
          const odo = data.mileageDaily.find((d: any) => d.date === leadDate)
          return {
            ...r,
            "Date's Odometer Start": odo ? data.exportData.mileage.find((m: any) => m.logDate === leadDate)?.startReading || "" : "",
            "Date's Odometer End": odo ? data.exportData.mileage.find((m: any) => m.logDate === leadDate)?.endReading || "" : "",
            "Date's Odometer Distance": odo ? data.exportData.mileage.find((m: any) => m.logDate === leadDate)?.distanceKm || "" : "",
          }
        })
      }

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, type)
      XLSX.writeFile(wb, `${filename}_${queryFrom}_${queryTo}.xlsx`)
    } catch {} finally { setExporting(null) }
  }

  const exportMonthlyReport = async () => {
    if (!data?.exportData) return
    setExporting("monthly")
    try {
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()

      // Sheet 1: Summary KPIs
      const summaryRows = [
        { "Metric": "Leads Created", "Value": data.summary.leadsCreated },
        { "Metric": "Leads Won", "Value": data.summary.leadsWon },
        { "Metric": "Leads Lost", "Value": data.summary.leadsLost },
        { "Metric": "Conversion Rate", "Value": `${data.summary.conversionRate}%` },
        { "Metric": "Total Visits", "Value": data.summary.totalVisits },
        { "Metric": "Follow-ups Completed", "Value": data.summary.followupsCompleted },
        { "Metric": "Total m³ (Won)", "Value": data.summary.totalPotentialM3 },
        { "Metric": "Est. Revenue (Won)", "Value": data.summary.estimatedRevenue },
        { "Metric": "Total Distance (km)", "Value": data.mileageSummary.totalDistance },
        { "Metric": "Total TA Amount (₹)", "Value": data.mileageSummary.totalTaAmount },
        { "Metric": "Total Fuel Cost (₹)", "Value": data.mileageSummary.totalFuelCost },
        { "Metric": "Days on Field", "Value": data.mileageSummary.daysOnField },
        { "Metric": "Net Travel Cost (₹)", "Value": data.mileageSummary.netCost },
      ]
      const ws1 = XLSX.utils.json_to_sheet(summaryRows)
      XLSX.utils.book_append_sheet(wb, ws1, "Summary KPIs")

      // Sheet 2: All Leads
      const leadsRows = data.exportData.leads || []
      if (leadsRows.length) {
        const ws = XLSX.utils.json_to_sheet(leadsRows)
        XLSX.utils.book_append_sheet(wb, ws, "All Leads")
      }

      // Sheet 3: Visits
      const visitsRows = data.exportData.visits || []
      if (visitsRows.length) {
        const ws = XLSX.utils.json_to_sheet(visitsRows)
        XLSX.utils.book_append_sheet(wb, ws, "Visits")
      }

      // Sheet 4: Follow-ups
      const followupsRows = data.exportData.followups || []
      if (followupsRows.length) {
        const ws = XLSX.utils.json_to_sheet(followupsRows)
        XLSX.utils.book_append_sheet(wb, ws, "Follow-ups")
      }

      // Sheet 5: Activities
      const activitiesRows = data.exportData.activities || []
      if (activitiesRows.length) {
        const ws = XLSX.utils.json_to_sheet(activitiesRows)
        XLSX.utils.book_append_sheet(wb, ws, "Activities")
      }

      // Sheet 6: Mileage Log (formatted)
      const mileageRows = data.exportData.mileage || []
      if (mileageRows.length) {
        const wsData = mileageRows.map((o: any) => {
          const d = o.logDate ? new Date(o.logDate + "T00:00:00") : null
          return {
            "Date": d ? format(d, "dd-MMM-yyyy") : "",
            "Day": d ? format(d, "EEEE") : "",
            "Vehicle No.": o.vehicleNumber || "",
            "Start Reading (km)": Number(o.startReading),
            "End Reading (km)": o.endReading ? Number(o.endReading) : "",
            "Distance (km)": o.distanceKm ? Number(o.distanceKm) : "",
            "TA Rate (₹/km)": Number(o.taRatePerKm || 4),
            "TA Amount (₹)": o.taAmount ? Number(o.taAmount) : "",
            "Fuel Filled (L)": o.fuelFilled ? Number(o.fuelFilled) : "",
            "Fuel Cost (₹)": o.fuelCost ? Number(o.fuelCost) : "",
            "Purpose": o.purpose || "",
            "Visits Done That Day": o.linkedVisitIds?.length || 0,
          }
        })

        const ws = XLSX.utils.json_to_sheet(wsData)
        XLSX.utils.book_append_sheet(wb, ws, "Mileage Log")

        // Column widths
        const colWidths = [14, 12, 16, 14, 14, 12, 12, 12, 12, 12, 20, 14]
        ws["!cols"] = colWidths.map((w) => ({ wch: w }))

        // Header styling: bold, orange bg, white text
        const headerRange = XLSX.utils.decode_range(ws["!ref"] || "A1:L1")
        for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r: 0, c })
          if (!ws[addr]) continue
          ws[addr].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "F97316" } },
            alignment: { horizontal: "center", vertical: "center" },
          }
        }

        // Data rows styling
        for (let r = 1; r <= wsData.length; r++) {
          const rowColor = r % 2 === 0 ? "FFFFFF" : "F3F4F6"
          for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c })
            if (!ws[addr]) continue
            ws[addr].s = { fill: { fgColor: { rgb: rowColor } } }
          }
          // Distance column (F): highlight > 100 km in light green
          const distAddr = XLSX.utils.encode_cell({ r, c: 5 })
          if (ws[distAddr] && ws[distAddr].v > 100) {
            ws[distAddr].s = { fill: { fgColor: { rgb: "DCFCE7" } }, font: { bold: true } }
          }
        }

        // Summary row at bottom
        const summaryRow = wsData.length + 1
        const totalRow: Record<string, any> = {}
        for (const key of Object.keys(wsData[0])) {
          totalRow[key] = ""
        }
        totalRow["Date"] = "TOTAL"
        totalRow["Distance (km)"] = mileageRows.reduce((s: number, o: any) => s + Number(o.distanceKm || 0), 0)
        totalRow["TA Amount (₹)"] = mileageRows.reduce((s: number, o: any) => s + Number(o.taAmount || 0), 0)
        totalRow["Fuel Filled (L)"] = mileageRows.reduce((s: number, o: any) => s + Number(o.fuelFilled || 0), 0)
        totalRow["Fuel Cost (₹)"] = mileageRows.reduce((s: number, o: any) => s + Number(o.fuelCost || 0), 0)

        XLSX.utils.sheet_add_json(ws, [totalRow], { skipHeader: true, origin: -1 })

        // Style summary row
        const summaryAddr = XLSX.utils.encode_cell({ r: summaryRow, c: 0 })
        if (ws[summaryAddr]) {
          ws[summaryAddr].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "F97316" } } }
        }
        for (let c = 1; c <= headerRange.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r: summaryRow, c })
          if (ws[addr]) {
            ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: "FFEDD5" } } }
          }
        }
      }

      XLSX.writeFile(wb, `monthly_report_${queryFrom}_${queryTo}.xlsx`)
    } catch {} finally { setExporting(null) }
  }

  const exportMileageCSV = async () => {
    if (!data?.exportData?.mileage) return
    setExporting("mileage-csv")
    try {
      const { default: Papa } = await import("papaparse")
      const rows = data.exportData.mileage.map((o: any) => {
        const d = o.logDate ? new Date(o.logDate + "T00:00:00") : null
        return {
          Date: d ? format(d, "yyyy-MM-dd") : "",
          Day: d ? format(d, "EEEE") : "",
          Vehicle_Number: o.vehicleNumber || "",
          Start_KM: Number(o.startReading),
          End_KM: o.endReading ? Number(o.endReading) : "",
          Distance_KM: o.distanceKm ? Number(o.distanceKm) : "",
          TA_Rate: Number(o.taRatePerKm || 4),
          TA_Amount_INR: o.taAmount ? Number(o.taAmount) : "",
          Fuel_Litres: o.fuelFilled ? Number(o.fuelFilled) : "",
          Fuel_Cost_INR: o.fuelCost ? Number(o.fuelCost) : "",
          Net_Cost_INR: o.fuelCost && o.taAmount ? Number(o.fuelCost) - Number(o.taAmount) : "",
          Purpose: o.purpose || "",
          Visits_Count: o.linkedVisitIds?.length || 0,
        }
      })
      if (!rows.length) { setExporting(null); return }
      const csv = Papa.unparse(rows)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `PRISM_Mileage_${queryFrom}_${queryTo}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch {} finally { setExporting(null) }
  }

  const exportMileageExcel = async () => {
    if (!data?.exportData?.mileage) return
    setExporting("mileage-excel")
    try {
      const XLSX = await import("xlsx")
      const mileageRows = data.exportData.mileage
      const wsData = mileageRows.map((o: any) => {
        const d = o.logDate ? new Date(o.logDate + "T00:00:00") : null
        return {
          "Date": d ? format(d, "dd-MMM-yyyy") : "",
          "Day": d ? format(d, "EEEE") : "",
          "Vehicle No.": o.vehicleNumber || "",
          "Start (km)": Number(o.startReading),
          "End (km)": o.endReading ? Number(o.endReading) : "",
          "Distance (km)": o.distanceKm ? Number(o.distanceKm) : "",
          "TA Rate": Number(o.taRatePerKm || 4),
          "TA Amount (₹)": o.taAmount ? Number(o.taAmount) : "",
          "Fuel (L)": o.fuelFilled ? Number(o.fuelFilled) : "",
          "Fuel Cost (₹)": o.fuelCost ? Number(o.fuelCost) : "",
          "Net Cost (₹)": o.fuelCost && o.taAmount ? Number(o.fuelCost) - Number(o.taAmount) : "",
          "Purpose": o.purpose || "",
          "Visits": o.linkedVisitIds?.length || 0,
        }
      })
      if (!wsData.length) { setExporting(null); return }

      const ws = XLSX.utils.json_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Mileage Log")

      const colWidths = [14, 12, 16, 12, 12, 12, 10, 12, 10, 12, 12, 20, 8]
      ws["!cols"] = colWidths.map((w) => ({ wch: w }))

      const headerRange = XLSX.utils.decode_range(ws["!ref"] || "A1:M1")
      for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c })
        if (!ws[addr]) continue
        ws[addr].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "F97316" } },
          alignment: { horizontal: "center", vertical: "center" },
        }
      }

      for (let r = 1; r <= wsData.length; r++) {
        const rowColor = r % 2 === 0 ? "FFFFFF" : "F3F4F6"
        for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r, c })
          if (!ws[addr]) continue
          ws[addr].s = { fill: { fgColor: { rgb: rowColor } } }
        }
        const distAddr = XLSX.utils.encode_cell({ r, c: 5 })
        if (ws[distAddr] && ws[distAddr].v > 100) {
          ws[distAddr].s = { fill: { fgColor: { rgb: "DCFCE7" } }, font: { bold: true } }
        }
      }

      const period = `${format(new Date(queryFrom), "MMM_yyyy")}`.toUpperCase()
      XLSX.writeFile(wb, `PRISM_Mileage_${period}.xlsx`)
    } catch {} finally { setExporting(null) }
  }

  const summaryCards = data ? [
    { icon: <Users className="h-4 w-4" />, label: "Leads Created", value: data.summary.leadsCreated, color: "text-blue-600 bg-blue-50" },
    { icon: <Target className="h-4 w-4" />, label: "Won", value: data.summary.leadsWon, color: "text-emerald-600 bg-emerald-50" },
    { icon: <TrendingUp className="h-4 w-4" />, label: "Lost", value: data.summary.leadsLost, color: "text-red-600 bg-red-50" },
    { icon: <BarChart3 className="h-4 w-4" />, label: "Conversion", value: `${data.summary.conversionRate}%`, color: "text-violet-600 bg-violet-50" },
    { icon: <MapPin className="h-4 w-4" />, label: "Visits", value: data.summary.totalVisits, color: "text-cyan-600 bg-cyan-50" },
    { icon: <CalendarCheck className="h-4 w-4" />, label: "Follow-ups Done", value: data.summary.followupsCompleted, color: "text-amber-600 bg-amber-50" },
    { icon: <Database className="h-4 w-4" />, label: "Total m³", value: data.summary.totalPotentialM3.toLocaleString(), color: "text-indigo-600 bg-indigo-50" },
    { icon: <DollarSign className="h-4 w-4" />, label: "Est. Revenue", value: formatCurrency(data.summary.estimatedRevenue), color: "text-emerald-600 bg-emerald-50" },
  ] : []

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                preset === p.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {preset === "custom" && (
            <>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-36 text-xs" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-36 text-xs" />
              <Button size="sm" className="h-8 text-xs" onClick={handleApplyCustom}>Apply</Button>
            </>
          )}
          {preset !== "custom" && (
            <span className="text-xs text-muted-foreground">
              {dateFrom} — {dateTo}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Section 1: Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map((card, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.color)}>
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-lg font-bold">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Section 2: Charts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* A) Monthly Leads Created vs Won */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Leads Created vs Won</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }} />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Created" />
                    <Line type="monotone" dataKey="won" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Won" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* B) Lead Stage Funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lead Stage Funnel</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.stageFunnel} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }} cursor={{ fill: "#f4f4f5" }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={24}>
                      {data.stageFunnel.map((entry: any, i: number) => (
                        <Cell key={entry.name} fill={STAGE_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* C) Follow-up Type Distribution (donut) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Follow-up Type Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex items-center h-64">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.followupTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {data.followupTypes.map((entry: any, i: number) => (
                          <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-1.5 pl-2">
                  {data.followupTypes.map((entry: any, i: number) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground truncate flex-1">{entry.name}</span>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                  {data.followupTypes.length === 0 && (
                    <p className="text-xs text-muted-foreground">No follow-ups in this period</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* D) City-wise Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">City-wise Lead Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.cityDistribution} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }} cursor={{ fill: "#f4f4f5" }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#6366f1" maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* E) Project Type Breakdown (pie) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Project Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex items-center h-56">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.projectTypes} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}>
                        {data.projectTypes.map((entry: any, i: number) => (
                          <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-1.5 pl-2">
                  {data.projectTypes.map((entry: any, i: number) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground truncate flex-1">{entry.name}</span>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* F) Concrete Grade Demand */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Concrete Grade Demand</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {data.gradeDemand.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.gradeDemand} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }} cursor={{ fill: "#f4f4f5" }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#f59e0b" maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No grade data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section 3: Travel & Mileage */}
      {data?.mileageDaily && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">Travel &amp; Mileage</h2>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Gauge className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{Math.round(data.mileageSummary.totalDistance).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground">Total Distance (km)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">&rsaquo;&rsaquo;{Math.round(data.mileageSummary.totalTaAmount).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground">Total TA Amount</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Fuel className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">&rsaquo;&rsaquo;{Math.round(data.mileageSummary.totalFuelCost).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground">Total Fuel Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{data.mileageSummary.daysOnField}</p>
                    <p className="text-[10px] text-muted-foreground">Days on Field</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    data.mileageSummary.netCost > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600",
                  )}>
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{data.mileageSummary.netCost > 0 ? "-" : ""}&rsaquo;&rsaquo;{Math.abs(data.mileageSummary.netCost).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground">Net Travel Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart: Daily Distance */}
          {data.mileageDaily.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Distance (km)</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.mileageDaily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#71717a" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: string) => {
                          const d = new Date(v + "T00:00:00")
                          return format(d, "d MMM")
                        }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }}
                        formatter={(value: any) => [`${Number(value).toLocaleString("en-IN")} km`]}
                        labelFormatter={(label: any) => {
                          const d = new Date(String(label) + "T00:00:00")
                          return format(d, "MMM d, yyyy")
                        }}
                      />
                      <Bar dataKey="distanceKm" radius={[4, 4, 0, 0]} maxBarSize={32}>
                        {data.mileageDaily.map((entry: any, i: number) => (
                          <Cell
                            key={i}
                            fill={entry.isProfitable ? "#10b981" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Section 4: Top Leads Table */}
      {data?.topLeads && data.topLeads.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top 10 Leads by Potential m³</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">Company</th>
                    <th className="px-4 py-2.5 text-left font-medium">Stage</th>
                    <th className="px-4 py-2.5 text-right font-medium">m³</th>
                    <th className="px-4 py-2.5 text-right font-medium">Value</th>
                    <th className="px-4 py-2.5 text-left font-medium">City</th>
                    <th className="px-4 py-2.5 text-left font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topLeads.map((lead: any) => (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">{lead.companyName || "Unnamed"}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-xs font-normal">
                          {STAGE_LABELS[lead.stage as string] || lead.stage}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm">{lead.estimatedM3?.toFixed(1) || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm">{formatCurrency(lead.estimatedValue)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{lead.city || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {lead.lastActivity
                          ? <span title={lead.lastActivity}>{lead.lastActivity.substring(0, 40)}{lead.lastActivity.length > 40 ? "..." : ""}</span>
                          : "—"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Export + Concrete Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Export Options */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-auto py-2 text-xs"
                onClick={() => exportCSV("leads", "leads")}
                disabled={exporting === "leads"}
              >
                {exporting === "leads" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Export Leads (CSV)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-auto py-2 text-xs"
                onClick={() => exportExcel("leads", "leads")}
                disabled={exporting === "excel-leads"}
              >
                {exporting === "excel-leads" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                Export Leads (Excel)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-auto py-2 text-xs"
                onClick={() => exportCSV("visits", "visits")}
                disabled={exporting === "visits"}
              >
                {exporting === "visits" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Export Visits (CSV)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-auto py-2 text-xs"
                onClick={() => exportCSV("followups", "followups")}
                disabled={exporting === "followups"}
              >
                {exporting === "followups" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Export Follow-ups (CSV)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-auto py-2 text-xs"
                onClick={exportMileageCSV}
                disabled={exporting === "mileage-csv"}
              >
                {exporting === "mileage-csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Export Mileage (CSV)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-auto py-2 text-xs"
                onClick={exportMileageExcel}
                disabled={exporting === "mileage-excel"}
              >
                {exporting === "mileage-excel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                Export Mileage (Excel)
              </Button>
              <Button
                variant="default"
                size="sm"
                className="justify-start gap-2 h-auto py-2 text-xs col-span-full sm:col-span-1"
                onClick={exportMonthlyReport}
                disabled={exporting === "monthly"}
              >
                {exporting === "monthly" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                Monthly Report (Excel)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Concrete Calculator */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Concrete Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div>
              <Label className="text-[10px]">Number of Floors</Label>
              <Input type="number" min="1" placeholder="e.g. 5" value={calcFloors} onChange={(e) => setCalcFloors(e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-[10px]">Floor Plate Area (sq ft)</Label>
              <Input type="number" min="1" placeholder="e.g. 2000" value={calcArea} onChange={(e) => setCalcArea(e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-[10px]">Concrete Usage Ratio</Label>
              <Input type="number" step="0.001" value={calcRatio} onChange={(e) => setCalcRatio(e.target.value)} className="h-8 text-sm" />
            </div>
            <Button size="sm" className="w-full h-8 text-xs" onClick={calculateConcrete}>
              <Calculator className="mr-1 h-3.5 w-3.5" />
              Calculate
            </Button>
            {calcResult !== null && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-center">
                  <span className="text-xs text-muted-foreground">Estimated Total</span>
                  <span className="block text-xl font-bold">{calcResult.toFixed(1)} m³</span>
                </p>
                <div className="space-y-1">
                  {calcBreakdown.map((b) => (
                    <div key={b.name} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{b.name} ({b.pct}%)</span>
                      <span className="font-mono font-medium">{b.value.toFixed(1)} m³</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => setLeadSearchOpen(true)}>
                  <Save className="mr-1 h-3 w-3" />
                  Save to Lead
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save to Lead Dialog */}
      <Dialog open={leadSearchOpen} onOpenChange={(o) => { setLeadSearchOpen(o); if (!o) { setLeadSearch(""); setLeadResults([]) } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save m³ to Lead</DialogTitle>
            <DialogDescription>Search and select a lead to update with estimated m³</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Search leads..."
              value={leadSearch}
              onChange={async (e) => {
                setLeadSearch(e.target.value)
                if (!e.target.value.trim()) { setLeadResults([]); return }
                try {
                  const res = await fetch(`/api/leads/search?q=${encodeURIComponent(e.target.value)}&limit=10`)
                  if (res.ok) setLeadResults(await res.json())
                } catch {}
              }}
              autoFocus
            />
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {leadResults.map((lead: any) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => handleSaveM3ToLead()}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm hover:bg-muted"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{lead.companyName || "Unnamed"}</p>
                    {lead.contactPerson && <p className="text-xs text-muted-foreground">{lead.contactPerson}</p>}
                  </div>
                </button>
              ))}
              {leadSearch && leadResults.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No leads found</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeadSearchOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
