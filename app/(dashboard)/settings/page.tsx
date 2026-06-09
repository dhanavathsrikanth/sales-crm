"use client"

import { useState, useEffect, useCallback } from "react"
import { setDefaultVehicleSettings } from "@/lib/actions/odometer"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
  Camera,
  Save,
  BellRing,
  BellOff,
  Gauge,
  Fuel,
  Bike,
  Car,
  Timer,
  Target,
} from "lucide-react"
import { toast } from "sonner"

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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("custom-fields")
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Vehicle & Travel state
  const [vehicleSettings, setVehicleSettings] = useState({
    vehicleType: "motorbike",
    vehicleNumber: "",
    vehicleModel: "",
    taRate: 4,
    monthlyKmTarget: 3000,
    remindStartTime: "08:30",
    remindEndTime: "19:00",
    alertMissingReadings: true,
  })
  const [vehicleSaving, setVehicleSaving] = useState(false)

  // Profile state
  const [profile, setProfile] = useState({ name: "", phone: "", company: "" })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false)

  // Notifications state
  const [notifFollowups, setNotifFollowups] = useState(false)
  const [notifDaily, setNotifDaily] = useState(false)
  const [notifMissed, setNotifMissed] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "default">("default")

  // Field form dialog
  const [fieldDialog, setFieldDialog] = useState(false)
  const [editingField, setEditingField] = useState<any>(null)
  const [fieldForm, setFieldForm] = useState({ fieldLabel: "", fieldName: "", fieldType: "text", isRequired: false, options: [] as string[] })
  const [fieldSaving, setFieldSaving] = useState(false)
  const [newOption, setNewOption] = useState("")

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch("/api/custom-fields").then((r) => r.json()).then(setFields).catch(() => {}),
      fetch("/api/dashboard").then((r) => r.json()).then((d) => {
        if (d?.user) {
          setProfile({ name: d.user.name || "", phone: d.user.phone || "", company: d.user.company || "" })
          setVehicleSettings({
            vehicleType: d.user.defaultVehicleType || "motorbike",
            vehicleNumber: d.user.defaultVehicleNumber || "",
            vehicleModel: d.user.vehicleModel || "",
            taRate: Number(d.user.defaultTaRate) || 4,
            monthlyKmTarget: Number(d.user.monthlyKmTarget) || 3000,
            remindStartTime: d.user.remindStartTime || "08:30",
            remindEndTime: d.user.remindEndTime || "19:00",
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

  // ── Profile ──
  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      toast.success("Profile updated")
    } catch { toast.error("Failed to update profile") }
    finally { setProfileSaving(false) }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProfilePhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("leadId", "profile")
      formData.append("type", "document")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (res.ok) {
        const photo = await res.json()
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePhoto: photo.url }),
        })
        toast.success("Photo updated")
      }
    } catch {} finally { setProfilePhotoUploading(false) }
  }

  // ── Custom Fields ──
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
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="custom-fields"><Settings2 className="mr-1.5 h-4 w-4" />Custom Fields</TabsTrigger>
          <TabsTrigger value="profile"><User className="mr-1.5 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-1.5 h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="vehicle"><Gauge className="mr-1.5 h-4 w-4" />Vehicle &amp; Travel</TabsTrigger>
        </TabsList>

        {/* ════════ TAB 1: CUSTOM FIELDS ════════ */}
        <TabsContent value="custom-fields" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Custom fields appear on every lead form. {fields.length} custom field{fields.length !== 1 ? "s" : ""} added.
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
                    <th className="px-3 py-2.5 text-left font-medium">Type</th>
                    <th className="px-3 py-2.5 text-center font-medium">Required</th>
                    <th className="px-3 py-2.5 text-center font-medium">Order</th>
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
                        <td className="px-3 py-2.5 capitalize text-muted-foreground">{f.fieldType}</td>
                        <td className="px-3 py-2.5 text-center">
                          {f.isRequired ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <X className="mx-auto h-4 w-4 text-zinc-300" />}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">{i + 1}</td>
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
        </TabsContent>

        {/* ════════ TAB 2: PROFILE ════════ */}
        <TabsContent value="profile" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 overflow-hidden">
                  <User className="h-7 w-7" />
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity">
                    {profilePhotoUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">Click to upload</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Company</Label>
                  <Input value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <Button size="sm" onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════ TAB 3: NOTIFICATIONS ════════ */}
        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <BellRing className="mt-0.5 h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Remind me of follow-ups</p>
                    <p className="text-xs text-muted-foreground">Browser notifications for pending follow-ups</p>
                  </div>
                </div>
                <Switch checked={notifFollowups} onCheckedChange={setNotifFollowups} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Daily summary at 9 AM</p>
                    <p className="text-xs text-muted-foreground">Shows today&apos;s follow-up count</p>
                  </div>
                </div>
                <Switch checked={notifDaily} onCheckedChange={setNotifDaily} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <BellOff className="mt-0.5 h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Missed follow-up alert</p>
                    <p className="text-xs text-muted-foreground">Get alerted when a follow-up is missed</p>
                  </div>
                </div>
                <Switch checked={notifMissed} onCheckedChange={setNotifMissed} />
              </div>
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
                    Enable Notifications
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ════════ TAB 4: VEHICLE & TRAVEL ════════ */}
        <TabsContent value="vehicle" className="mt-6 space-y-4">
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
                <div className="mt-1.5 flex gap-3">
                  {(["motorbike", "car", "other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVehicleSettings((p) => ({ ...p, vehicleType: t }))}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors",
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
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Andhra Pradesh format: AP XX AB XXXX</p>
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
                Travel Allowance Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Label className="text-xs">TA Rate per km</Label>
                <div className="mt-1.5 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">&rsaquo;&rsaquo;</span>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={vehicleSettings.taRate}
                    onChange={(e) => setVehicleSettings((p) => ({ ...p, taRate: parseFloat(e.target.value) || 0 }))}
                    className="h-9 text-sm pl-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/km</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  At &rsaquo;&rsaquo;{vehicleSettings.taRate}/km &rarr;{" "}
                  100 km = &rsaquo;&rsaquo;{(vehicleSettings.taRate * 100).toLocaleString("en-IN")} |{" "}
                  200 km = &rsaquo;&rsaquo;{(vehicleSettings.taRate * 200).toLocaleString("en-IN")} |{" "}
                  300 km = &rsaquo;&rsaquo;{(vehicleSettings.taRate * 300).toLocaleString("en-IN")}
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Remind me to log start reading</p>
                  <p className="text-xs text-muted-foreground">Daily reminder to log your odometer start</p>
                </div>
                <Input
                  type="time"
                  value={vehicleSettings.remindStartTime}
                  onChange={(e) => setVehicleSettings((p) => ({ ...p, remindStartTime: e.target.value }))}
                  className="h-8 w-32 text-xs"
                />
              </div>
              <Separator className="bg-zinc-100" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Remind me to log end reading</p>
                  <p className="text-xs text-muted-foreground">Evening reminder to close the day</p>
                </div>
                <Input
                  type="time"
                  value={vehicleSettings.remindEndTime}
                  onChange={(e) => setVehicleSettings((p) => ({ ...p, remindEndTime: e.target.value }))}
                  className="h-8 w-32 text-xs"
                />
              </div>
              <Separator className="bg-zinc-100" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Alert for missing end readings</p>
                  <p className="text-xs text-muted-foreground">Warn you next morning if end reading wasn&apos;t logged</p>
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
                    className="h-9 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">km/month</span>
                </div>
              </div>
              {vehicleSettings.monthlyKmTarget > 0 && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    Shows a progress bar on the Mileage page:{" "}
                    <span className="font-medium text-foreground">0 / {vehicleSettings.monthlyKmTarget.toLocaleString("en-IN")} km</span>
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
        </TabsContent>
      </Tabs>

      {/* Add/Edit Field Dialog */}
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

      {/* Delete Confirm */}
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
