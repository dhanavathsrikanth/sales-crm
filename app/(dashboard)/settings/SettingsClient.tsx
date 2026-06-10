"use client"

import { useState, useEffect } from "react"
import { setDefaultVehicleSettings } from "@/lib/actions/odometer"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Loader2,
  Check,
  X,
  User,
  Bell,
  Settings2,
  Save,
  BellRing,
  BellOff,
  Gauge,
  Fuel,
  Bike,
  Car,
  Timer,
  Target,
  AlertCircle,
  CalendarCheck,
  Flame,
} from "lucide-react"
import { toast } from "sonner"
import { useDashboard } from "@/hooks/use-dashboard"
import { getNotifSettings, saveNotifSettings } from "@/components/dashboard/Topbar"
import { UserProfile } from "@clerk/nextjs"
import { useAppStore } from "@/store"

const FIELD_TYPES = [
  "text", "number", "dropdown", "date", "checkbox", "phone", "email", "textarea",
] as const

const PREPOPULATED_FIELDS = [
  { fieldLabel: "Site Engineer Name", fieldName: "site_engineer_name", fieldType: "text", isRequired: false },
  { fieldLabel: "Contractor Name", fieldName: "contractor_name", fieldType: "text", isRequired: false },
  { fieldLabel: "Pump Required", fieldName: "pump_required", fieldType: "checkbox", isRequired: false },
  { fieldLabel: "Cement Brand", fieldName: "cement_brand", fieldType: "text", isRequired: false },
  { fieldLabel: "Consultant Name", fieldName: "consultant_name", fieldType: "text", isRequired: false },
]

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
        active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function NotificationRow({ icon, title, description, checked, color }: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  color: "red" | "blue" | "amber"
}) {
  const bgMap = { red: "bg-red-50", blue: "bg-blue-50", amber: "bg-amber-50" }
  const textMap = { red: "text-red-600", blue: "text-blue-600", amber: "text-amber-600" }
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border p-3", checked ? bgMap[color] : "bg-muted/20")}>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", checked ? bgMap[color] : "bg-muted")}>
        <span className={checked ? textMap[color] : "text-muted-foreground"}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {checked ? (
        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <X className="h-4 w-4 text-zinc-300 shrink-0" />
      )}
    </div>
  )
}

function NotificationToggleRow({ icon, title, description, checked, onCheckedChange }: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

interface Props {
  initialTab?: string
}

export default function SettingsClient({ initialTab }: Props) {
  const [activeTab, setActiveTab] = useState(initialTab || "custom-fields")
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profilePhotoUploading] = useState(false)

  const { data: dashboard } = useDashboard()

  const overdueFollowups = dashboard?.dailyFocus?.overdueFollowups?.length || 0
  const todayFollowups = dashboard?.dailyFocus?.todayFollowups?.length || 0
  const hotStale = dashboard?.peopleToContact?.hotStale?.length || 0

  const vehicleDefaults = {
    vehicleType: "motorbike",
    vehicleNumber: "",
    vehicleModel: "",
    taRate: 4,
    monthlyKmTarget: 3000,
    remindStartTime: "08:30",
    remindEndTime: "19:00",
    alertMissingReadings: true,
  }

  const [vehicleSettings, setVehicleSettings] = useState(vehicleDefaults)
  const [vehicleSaving, setVehicleSaving] = useState(false)

  const notifSettings = getNotifSettings()
  const [notifFollowups, setNotifFollowups] = useState(notifSettings.followups)
  const [notifDaily, setNotifDaily] = useState(notifSettings.daily)
  const [notifMissed, setNotifMissed] = useState(notifSettings.missed)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "default">("default")

  const [fieldDialog, setFieldDialog] = useState(false)
  const [editingField, setEditingField] = useState<any>(null)
  const [fieldForm, setFieldForm] = useState({ fieldLabel: "", fieldName: "", fieldType: "text", isRequired: false, options: [] as string[] })
  const [fieldSaving, setFieldSaving] = useState(false)
  const [newOption, setNewOption] = useState("")

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch("/api/custom-fields").then((r) => r.json()).then(setFields).catch(() => {}),
      fetch("/api/dashboard").then((r) => r.json()).then((d) => {
        if (d?.user) {
          setVehicleSettings({
            vehicleType: d.user.defaultVehicleType || vehicleDefaults.vehicleType,
            vehicleNumber: d.user.defaultVehicleNumber || "",
            vehicleModel: d.user.vehicleModel || "",
            taRate: Number(d.user.defaultTaRate) || vehicleDefaults.taRate,
            monthlyKmTarget: Number(d.user.monthlyKmTarget) || vehicleDefaults.monthlyKmTarget,
            remindStartTime: d.user.remindStartTime || vehicleDefaults.remindStartTime,
            remindEndTime: d.user.remindEndTime || vehicleDefaults.remindEndTime,
            alertMissingReadings: d.user.alertMissingReadings !== false,
          })
        }
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission)
    }
  }, [])

  const requestNotifPermission = async () => {
    if (typeof Notification === "undefined") return
    const result = await Notification.requestPermission()
    setNotifPermission(result)
    if (result === "granted") toast.success("Notifications enabled")
  }

  const handleNotifChange = (key: "followups" | "daily" | "missed", value: boolean) => {
    if (key === "followups") setNotifFollowups(value)
    if (key === "daily") setNotifDaily(value)
    if (key === "missed") setNotifMissed(value)
    saveNotifSettings({ followups: key === "followups" ? value : notifFollowups, daily: key === "daily" ? value : notifDaily, missed: key === "missed" ? value : notifMissed })
  }

  const allFields = [...PREPOPULATED_FIELDS, ...fields]

  const openAddField = () => {
    setEditingField(null)
    setFieldForm({ fieldLabel: "", fieldName: "", fieldType: "text", isRequired: false, options: [] })
    setFieldDialog(true)
  }

  const openEditField = (field: any) => {
    setEditingField(field)
    setFieldForm({
      fieldLabel: field.fieldLabel,
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      options: field.options || [],
    })
    setFieldDialog(true)
  }

  const handleSaveField = async () => {
    if (!fieldForm.fieldLabel || !fieldForm.fieldName) return
    setFieldSaving(true)
    try {
      const payload = {
        ...fieldForm,
        options: fieldForm.fieldType === "dropdown" ? fieldForm.options : [],
      }
      if (editingField) {
        const res = await fetch(`/api/custom-fields/${editingField.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update")
        const updated = await res.json()
        setFields((prev) => prev.map((f) => (f.id === editingField.id ? updated : f)))
      } else {
        const res = await fetch("/api/custom-fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to create")
        const created = await res.json()
        setFields((prev) => [...prev, created])
      }
      setFieldDialog(false)
      toast.success(editingField ? "Field updated" : "Field created")
    } catch { toast.error("Failed to save field") }
    finally { setFieldSaving(false) }
  }

  const handleDeleteField = async (id: string) => {
    try {
      await fetch(`/api/custom-fields/${id}`, { method: "DELETE" })
      setFields((prev) => prev.filter((f) => f.id !== id))
      toast.success("Field deleted")
    } catch { toast.error("Failed to delete") }
    finally { setDeleteConfirm(null) }
  }

  const moveField = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= fields.length) return
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]]
    setFields(newFields)
    fetch("/api/custom-fields", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newFields.map((f: any) => f.id) }),
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-2xl font-bold px-1">Settings</h1>

      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <TabButton active={activeTab === "custom-fields"} onClick={() => setActiveTab("custom-fields")}>
          <Settings2 className="h-4 w-4" />
          <span>Custom Fields</span>
        </TabButton>
        <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
          <User className="h-4 w-4" />
          <span>Profile</span>
        </TabButton>
        <TabButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")}>
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
          {(overdueFollowups + hotStale) > 0 && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
              {(overdueFollowups + hotStale) > 9 ? "9+" : (overdueFollowups + hotStale)}
            </span>
          )}
        </TabButton>
        <TabButton active={activeTab === "vehicle"} onClick={() => setActiveTab("vehicle")}>
          <Gauge className="h-4 w-4" />
          <span>Vehicle</span>
        </TabButton>
      </div>

      {activeTab === "custom-fields" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Custom fields appear on every lead form. {fields.length} added.
            </p>
            <Button size="sm" onClick={openAddField}>
              <Plus className="mr-1 h-4 w-4" /> Add Field
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="w-8 px-2 py-2.5" />
                    <th className="px-3 py-2.5 text-left font-medium">Field Label</th>
                    <th className="px-3 py-2.5 text-left font-medium hidden sm:table-cell">Type</th>
                    <th className="px-3 py-2.5 text-center font-medium">Req</th>
                    <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allFields.map((f: any, i: number) => {
                    const isPrepopulated = PREPOPULATED_FIELDS.some((p) => p.fieldName === f.fieldName && !f.id)
                    return (
                      <tr key={f.fieldName || f.id} className={cn("border-b last:border-0 hover:bg-muted/20", isPrepopulated && "opacity-50")}>
                        <td className="px-2 py-2.5">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </td>
                        <td className="px-3 py-2.5 font-medium">
                          {f.fieldLabel}
                          {isPrepopulated && <span className="ml-2 text-[10px] text-muted-foreground">(system)</span>}
                        </td>
                        <td className="px-3 py-2.5 capitalize text-muted-foreground hidden sm:table-cell">{f.fieldType}</td>
                        <td className="px-3 py-2.5 text-center">
                          {f.isRequired ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <X className="mx-auto h-4 w-4 text-zinc-300" />}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {!isPrepopulated ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => moveField(fields.indexOf(f), -1)}
                                disabled={fields.indexOf(f) === 0}
                                className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveField(fields.indexOf(f), 1)}
                                disabled={fields.indexOf(f) === fields.length - 1}
                                className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditField(f)}
                                className="rounded p-1 text-muted-foreground hover:bg-muted"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(f.id)}
                                className="rounded p-1 text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Default</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white overflow-hidden">
            <UserProfile />
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <NotificationRow
                icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                title="Overdue Follow-ups"
                description={`${overdueFollowups} past due`}
                checked={overdueFollowups > 0}
                color="red"
              />
              <NotificationRow
                icon={<CalendarCheck className="h-4 w-4 text-blue-500" />}
                title="Today's Follow-ups"
                description={`${todayFollowups} scheduled today`}
                checked={todayFollowups > 0}
                color="blue"
              />
              <NotificationRow
                icon={<Flame className="h-4 w-4 text-amber-500" />}
                title="Hot & Stale Leads"
                description={`${hotStale} need attention`}
                checked={hotStale > 0}
                color="amber"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <NotificationToggleRow
                icon={<BellRing className="h-4 w-4 text-blue-500" />}
                title="Remind me of follow-ups"
                description="Browser notifications for pending follow-ups"
                checked={notifFollowups}
                onCheckedChange={(v) => handleNotifChange("followups", v)}
              />
              <NotificationToggleRow
                icon={<Bell className="h-4 w-4 text-amber-500" />}
                title="Daily summary at 9 AM"
                description="Shows today's follow-up count"
                checked={notifDaily}
                onCheckedChange={(v) => handleNotifChange("daily", v)}
              />
              <NotificationToggleRow
                icon={<BellOff className="h-4 w-4 text-red-500" />}
                title="Missed follow-up alert"
                description="Get alerted when a follow-up is missed"
                checked={notifMissed}
                onCheckedChange={(v) => handleNotifChange("missed", v)}
              />
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">Browser Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {notifPermission === "granted" ? "Enabled" : notifPermission === "denied" ? "Blocked" : "Not requested"}
                  </p>
                </div>
                {notifPermission !== "granted" && notifPermission !== "denied" && (
                  <Button size="sm" variant="outline" onClick={requestNotifPermission}>
                    <Bell className="mr-1 h-4 w-4" />
                    Enable
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "vehicle" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bike className="h-4 w-4 text-primary" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-xs">Vehicle Type</Label>
                <div className="mt-1.5 flex gap-2 sm:gap-3 overflow-x-auto pb-1">
                  {(["motorbike", "car", "other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVehicleSettings((p) => ({ ...p, vehicleType: t }))}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 sm:px-4 py-2.5 text-sm transition-colors shrink-0",
                        vehicleSettings.vehicleType === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input hover:bg-muted",
                      )}
                    >
                      {t === "motorbike" ? <Bike className="h-4 w-4" /> : t === "car" ? <Car className="h-4 w-4" /> : <Gauge className="h-4 w-4" />}
                      <span className="capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Vehicle Number</Label>
                  <Input
                    value={vehicleSettings.vehicleNumber}
                    onChange={(e) => setVehicleSettings((p) => ({ ...p, vehicleNumber: e.target.value }))}
                    placeholder="e.g. AP 16 AB 1234"
                    className="h-9 text-sm"
                  />
                  <p className="mt-0.5 text-[10px] text-muted-foreground">AP XX AB XXXX format</p>
                </div>
                <div>
                  <Label className="text-xs">Vehicle Name / Model</Label>
                  <Input
                    value={vehicleSettings.vehicleModel}
                    onChange={(e) => setVehicleSettings((p) => ({ ...p, vehicleModel: e.target.value }))}
                    placeholder="e.g. Honda Activa"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Fuel className="h-4 w-4 text-emerald-600" />
                Travel Allowance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-xs">TA Rate per km</Label>
                <div className="mt-1.5 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">₹</span>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={vehicleSettings.taRate}
                    onChange={(e) => setVehicleSettings((p) => ({ ...p, taRate: parseFloat(e.target.value) || 0 }))}
                    className="h-9 text-sm pl-7 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/km</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  ₹{vehicleSettings.taRate}/km → 100km = ₹{(vehicleSettings.taRate * 100).toLocaleString("en-IN")} | 200km = ₹{(vehicleSettings.taRate * 200).toLocaleString("en-IN")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Timer className="h-4 w-4 text-amber-600" />
                Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Start reading reminder</p>
                  <p className="text-xs text-muted-foreground">Daily odometer start</p>
                </div>
                <Input
                  type="time"
                  value={vehicleSettings.remindStartTime}
                  onChange={(e) => setVehicleSettings((p) => ({ ...p, remindStartTime: e.target.value }))}
                  className="h-8 w-32 text-xs shrink-0"
                />
              </div>
              <Separator className="bg-zinc-100" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">End reading reminder</p>
                  <p className="text-xs text-muted-foreground">Evening close-out</p>
                </div>
                <Input
                  type="time"
                  value={vehicleSettings.remindEndTime}
                  onChange={(e) => setVehicleSettings((p) => ({ ...p, remindEndTime: e.target.value }))}
                  className="h-8 w-32 text-xs shrink-0"
                />
              </div>
              <Separator className="bg-zinc-100" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Alert for missing readings</p>
                  <p className="text-xs text-muted-foreground">Warn if end reading missing</p>
                </div>
                <Switch
                  checked={vehicleSettings.alertMissingReadings}
                  onCheckedChange={(v) => setVehicleSettings((p) => ({ ...p, alertMissingReadings: v }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-600" />
                Monthly Target
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-xs">Monthly km target</Label>
                <div className="mt-1.5 relative">
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={vehicleSettings.monthlyKmTarget}
                    onChange={(e) => setVehicleSettings((p) => ({ ...p, monthlyKmTarget: parseInt(e.target.value) || 0 }))}
                    className="h-9 text-sm pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">km/mo</span>
                </div>
              </div>
              {vehicleSettings.monthlyKmTarget > 0 && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    Progress bar: <span className="font-medium text-foreground">0 / {vehicleSettings.monthlyKmTarget.toLocaleString("en-IN")} km</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={vehicleSaving}
              onClick={async () => {
                setVehicleSaving(true)
                try {
                  const res = await setDefaultVehicleSettings({
                    vehicleType: vehicleSettings.vehicleType,
                    vehicleNumber: vehicleSettings.vehicleNumber,
                    vehicleModel: vehicleSettings.vehicleModel,
                    taRate: vehicleSettings.taRate,
                    monthlyKmTarget: vehicleSettings.monthlyKmTarget,
                    remindStartTime: vehicleSettings.remindStartTime,
                    remindEndTime: vehicleSettings.remindEndTime,
                    alertMissingReadings: vehicleSettings.alertMissingReadings,
                  })
                  if (res.success) {
                    toast.success("Vehicle settings saved")
                  } else {
                    toast.error(res.error || "Failed to save")
                  }
                } catch {
                  toast.error("Failed to save vehicle settings")
                } finally {
                  setVehicleSaving(false)
                }
              }}
            >
              {vehicleSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Save Vehicle Settings
            </Button>
          </div>
        </div>
      )}

      <Dialog open={fieldDialog} onOpenChange={(o) => { if (!o) setFieldDialog(false) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field" : "Add Custom Field"}</DialogTitle>
            <DialogDescription>Configure the field that appears on lead forms</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Field Label</Label>
              <Input
                value={fieldForm.fieldLabel}
                onChange={(e) => setFieldForm({
                  ...fieldForm,
                  fieldLabel: e.target.value,
                  fieldName: editingField ? fieldForm.fieldName : slugify(e.target.value),
                })}
                placeholder="e.g. Site Engineer Name"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Field Name (slug)</Label>
              <Input
                value={fieldForm.fieldName}
                onChange={(e) => setFieldForm({ ...fieldForm, fieldName: e.target.value })}
                placeholder="e.g. site_engineer_name"
                className="h-8 text-sm font-mono text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Field Type</Label>
              <Select value={fieldForm.fieldType} onValueChange={(v) => v && setFieldForm({ ...fieldForm, fieldType: v, options: v === "dropdown" ? fieldForm.options : [] })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fieldForm.fieldType === "dropdown" && (
              <div>
                <Label className="text-xs">Options</Label>
                <div className="flex gap-1 mb-1">
                  <Input
                    placeholder="Add option..."
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className="h-7 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newOption.trim()) {
                        e.preventDefault()
                        setFieldForm({ ...fieldForm, options: [...fieldForm.options, newOption.trim()] })
                        setNewOption("")
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (newOption.trim()) {
                        setFieldForm({ ...fieldForm, options: [...fieldForm.options, newOption.trim()] })
                        setNewOption("")
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {fieldForm.options.map((opt, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs">
                      {opt}
                      <button type="button" onClick={() => setFieldForm({ ...fieldForm, options: fieldForm.options.filter((_, j) => j !== i) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={fieldForm.isRequired}
                onCheckedChange={(v) => setFieldForm({ ...fieldForm, isRequired: v })}
              />
              <Label className="text-xs">Required field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveField} disabled={fieldSaving || !fieldForm.fieldLabel}>
              {fieldSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {editingField ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null) }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete Field</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will remove the field and all its values from leads. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeleteField(deleteConfirm)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}