"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, Phone, MessageSquare, Calendar, MapPin,
  Camera, Clock, Trash2, Trophy, Frown, MoreHorizontal,
  Pencil, Plus, ExternalLink, ImageIcon, Loader2, ChevronRight,
  CircleDot, PhoneCall, CalendarCheck, ClipboardList,
  FileText, Handshake, FlaskConical, ScanLine, StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLead, useDeleteLead, useUpdateLeadStage, useUpdateLead } from "@/hooks/use-leads";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import StageChanger from "@/components/leads/StageChanger";
import QuickShare from "@/components/leads/QuickShare";
import PhotoUploader from "@/components/shared/PhotoUploader";
import PhotoGallery from "@/components/shared/PhotoGallery";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { useNotes } from "@/hooks/use-notes";
import { useCustomFields } from "@/hooks/use-custom-fields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const activityIcons: Record<string, any> = {
  lead_created: Plus,
  call: Phone,
  followup_added: Calendar,
  visit: MapPin,
  photo_uploaded: Camera,
  stage_changed: ChevronRight,
  note_added: Pencil,
  won: Trophy,
  lost: Frown,
};

const activityColors: Record<string, string> = {
  lead_created: "bg-blue-100 text-blue-600",
  call: "bg-emerald-100 text-emerald-600",
  followup_added: "bg-indigo-100 text-indigo-600",
  visit: "bg-violet-100 text-violet-600",
  photo_uploaded: "bg-pink-100 text-pink-600",
  stage_changed: "bg-amber-100 text-amber-600",
  note_added: "bg-zinc-100 text-zinc-600",
  won: "bg-emerald-100 text-emerald-600",
  lost: "bg-red-100 text-red-600",
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#25D366" viewBox="0 0 16 16">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
    </svg>
  );
}

const followupTypeIcons: Record<string, any> = {
  call: Phone,
  whatsapp: WhatsAppIcon,
  meeting: Calendar,
  site_visit: MapPin,
  email: Pencil,
};

const priorityColors: Record<string, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-zinc-50 text-zinc-600",
};

const photoTypeLabels: Record<string, string> = {
  site: "Site Photo",
  project: "Project",
  visiting_card: "Visiting Card",
  document: "Document",
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { data: lead, isLoading, isError } = useLead(id);
  const deleteLead = useDeleteLead();
  const updateStage = useUpdateLeadStage();
  const updateLead = useUpdateLead();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState("customer");
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [scanning, setScanning] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const queryClient = useQueryClient();
  const { data: linkedNotes = [] } = useNotes({ leadId: id });
  const { data: customFields = [] } = useCustomFields();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">Lead not found.</p>
        <Link href="/leads"><Button variant="outline" className="mt-3">Back to Leads</Button></Link>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteLead.mutateAsync(id);
    router.push("/leads");
  };

  const handleMarkWon = () => updateStage.mutate({ id, stage: "won" });
  const handleMarkLost = () => updateStage.mutate({ id, stage: "lost" });

  const openEditDialog = () => {
    setEditTab("customer");
    setEditForm({
      companyName: lead.companyName || "",
      clientCompany: lead.clientCompany || "",
      builderName: lead.builderName || "",
      projectName: lead.projectName || "",
      contactPerson: lead.contactPerson || "",
      designation: lead.designation || "",
      mobile: lead.mobile || "",
      email: lead.email || "",
      existingVendor: lead.existingVendor || "",
      competitorNotes: lead.competitorNotes || "",
      siteAddress: lead.siteAddress || "",
      city: lead.city || "",
      district: lead.district || "",
      state: lead.state || "",
      pincode: lead.pincode || "",
      latitude: lead.latitude || "",
      longitude: lead.longitude || "",
      projectType: lead.projectType || "",
      projectStatus: lead.projectStatus || "",
      numberOfFloors: lead.numberOfFloors?.toString() || "",
      builtUpArea: lead.builtUpArea?.toString() || "",
      estimatedValue: lead.estimatedValue?.toString() || "",
      estimatedM3: lead.estimatedM3?.toString() || "",
      monthlyM3: lead.monthlyM3?.toString() || "",
      immediateM3: lead.immediateM3?.toString() || "",
      expectedSupplyDate: lead.expectedSupplyDate || "",
      remarks: lead.remarks || "",
      stage: lead.stage || "new",
      gradeRequirements: (lead.gradeRequirements || []).join(", "),
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const payload: Record<string, any> = {};
      for (const [key, value] of Object.entries(editForm)) {
        if (key === "gradeRequirements") {
          payload.gradeRequirements = value ? value.split(",").map((g) => g.trim()).filter(Boolean) : [];
        } else if (key === "numberOfFloors" || key === "builtUpArea") {
          payload[key] = value ? Number(value) : null;
        } else {
          payload[key] = value || null;
        }
      }
      await updateLead.mutateAsync({ id, ...payload });
      toast.success("Lead updated");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update lead");
    }
  };

  const score = lead.leadScore ?? 0;
  const scoreColor = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-400";
  const scoreText = score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/leads" className="hover:text-zinc-700">Leads</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-800 font-medium truncate">{lead.companyName || "Lead"}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/leads">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-zinc-900 truncate max-w-[200px] sm:max-w-none">{lead.companyName || "Untitled"}</h1>
              <Badge className={cn(
                "shrink-0",
                lead.stage === "won" ? "bg-emerald-100 text-emerald-700" :
                lead.stage === "lost" ? "bg-red-100 text-red-700" :
                "bg-blue-100 text-blue-700"
              )}>
                {(lead.stage || "new").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <QuickShare
            contactPerson={lead.contactPerson}
            projectName={lead.projectName}
            city={lead.city}
            mobile={lead.mobile}
            userName={user?.firstName || "Sales Rep"}
          />
          {lead.mobile && (
            <a href={`tel:${lead.mobile}`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Call</span>
              </Button>
            </a>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={openEditDialog}>
                <Pencil className="h-4 w-4 mr-2" /> Edit Lead
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleMarkWon}>
                <Trophy className="h-4 w-4 mr-2 text-emerald-500" /> Mark as Won
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMarkLost}>
                <Frown className="h-4 w-4 mr-2 text-red-500" /> Mark as Lost
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteConfirm(true)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" /> Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-500">Lead Score</span>
            <span className={cn("text-xs font-semibold", scoreText)}>{score}/100</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100">
            <div className={cn("h-full rounded-full transition-all", scoreColor)} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StageChanger leadId={lead.id} currentStage={lead.stage || "new"} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide -mx-1 px-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="followups" className="text-xs sm:text-sm whitespace-nowrap">Follow-ups ({lead.followups?.length || 0})</TabsTrigger>
          <TabsTrigger value="visits" className="text-xs sm:text-sm whitespace-nowrap">Visits ({lead.visits?.length || 0})</TabsTrigger>
          <TabsTrigger value="photos" className="text-xs sm:text-sm whitespace-nowrap">Photos ({lead.photos?.length || 0})</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs sm:text-sm whitespace-nowrap">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-3">Customer Info</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ["Company", lead.companyName],
                  ["Client Company", lead.clientCompany],
                  ["Builder", lead.builderName],
                  ["Project", lead.projectName],
                  ["Contact", lead.contactPerson],
                  ["Designation", lead.designation],
                  ["Mobile", lead.mobile],
                  ["Email", lead.email],
                  ["Existing Vendor", lead.existingVendor || "None"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-zinc-500">{label}</dt>
                    <dd className="text-zinc-900 font-medium text-right max-w-[60%] truncate">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
              {lead.competitorNotes && (
                <div className="mt-3 rounded-lg bg-orange-50 p-3">
                  <p className="text-xs font-medium text-orange-700">Competitor Notes</p>
                  <p className="text-sm text-orange-800 mt-0.5">{lead.competitorNotes}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-3">Project Info</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ["Type", lead.projectType ? lead.projectType.charAt(0).toUpperCase() + lead.projectType.slice(1) : null],
                  ["Status", lead.projectStatus ? lead.projectStatus.charAt(0).toUpperCase() + lead.projectStatus.slice(1) : null],
                  ["Floors", lead.numberOfFloors?.toString()],
                  ["Built-up Area", lead.builtUpArea ? `${Number(lead.builtUpArea).toLocaleString()} sq ft` : null],
                  ["Est. Value", lead.estimatedValue ? `₹${Number(lead.estimatedValue).toLocaleString()}` : null],
                  ["Supply Date", lead.expectedSupplyDate ? format(new Date(lead.expectedSupplyDate), "MMM d, yyyy") : null],
                  ["Lead Score", lead.leadScore?.toString()],
                  ["Created", lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : null],
                ].map(([label, value]) => value ? (
                  <div key={label} className="flex justify-between">
                    <dt className="text-zinc-500">{label}</dt>
                    <dd className="text-zinc-900 font-medium text-right">{value}</dd>
                  </div>
                ) : null)}
              </dl>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-3">Concrete Requirements</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <p className="text-lg font-bold text-blue-700">{lead.estimatedM3 ? Number(lead.estimatedM3).toLocaleString() : "—"}</p>
                  <p className="text-[10px] text-blue-500 font-medium">Total m³</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3 text-center">
                  <p className="text-lg font-bold text-indigo-700">{lead.monthlyM3 ? Number(lead.monthlyM3).toLocaleString() : "—"}</p>
                  <p className="text-[10px] text-indigo-500 font-medium">Monthly m³</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <p className="text-lg font-bold text-amber-700">{lead.immediateM3 ? Number(lead.immediateM3).toLocaleString() : "—"}</p>
                  <p className="text-[10px] text-amber-500 font-medium">Immediate m³</p>
                </div>
              </div>
              {lead.gradeRequirements && lead.gradeRequirements.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-zinc-500 mb-1.5">Grade Requirements</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.gradeRequirements.map((g: string) => (
                      <span key={g} className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">{g}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-3">Location</h3>
              {lead.siteAddress ? (
                <p className="text-sm text-zinc-700 mb-2">{lead.siteAddress}</p>
              ) : (
                <p className="text-sm text-zinc-400 mb-2">No address provided</p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{[lead.city, lead.district, lead.state].filter(Boolean).join(", ") || "—"}</span>
                {lead.pincode && <span>- {lead.pincode}</span>}
              </div>
              {lead.latitude && lead.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${lead.latitude},${lead.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <MapPin className="h-3 w-3" />
                  View on Google Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {lead.remarks && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-2">Remarks</h3>
              <p className="text-sm text-zinc-700">{lead.remarks}</p>
            </div>
          )}

          {lead.customFieldValues && lead.customFieldValues.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-3">Custom Fields</h3>
              <dl className="space-y-2 text-sm">
                {lead.customFieldValues.map((cfv: any) => (
                  <div key={cfv.id || cfv.fieldId} className="flex justify-between">
                    <dt className="text-zinc-500">{cfv.fieldLabel || cfv.fieldName || cfv.fieldId}</dt>
                    <dd className="text-zinc-900 font-medium text-right max-w-[60%] truncate">
                      {cfv.value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {linkedNotes.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900">Linked Notes ({linkedNotes.length})</h3>
                <Link href="/notes">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
                </Link>
              </div>
              <div className="space-y-2">
                {linkedNotes.slice(0, 5).map((n: any) => (
                  <div
                    key={n.id}
                    className={cn(
                      "rounded-lg border p-3 text-sm transition-colors hover:shadow-sm",
                      n.color === "yellow" ? "bg-amber-50 border-amber-200" :
                      n.color === "blue" ? "bg-sky-50 border-sky-200" :
                      n.color === "green" ? "bg-emerald-50 border-emerald-200" :
                      n.color === "pink" ? "bg-pink-50 border-pink-200" :
                      "bg-purple-50 border-purple-200"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="followups" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">All Follow-ups</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Follow-up
            </Button>
          </div>
          {(!lead.followups || lead.followups.length === 0) ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
              <Calendar className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">No follow-ups yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lead.followups
                .sort((a: any, b: any) => (a.status === "pending" ? -1 : 1))
                .map((f: any) => {
                  const Icon = followupTypeIcons[f.type] ?? Calendar;
                  return (
                    <div key={f.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-semibold uppercase rounded-full px-2 py-0.5",
                            f.status === "pending" ? "bg-amber-50 text-amber-700" :
                            f.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          )}>{f.status}</span>
                          {f.priority && (
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", priorityColors[f.priority])}>{f.priority}</span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-900 mt-1">
                          {f.followupDate && format(new Date(f.followupDate), "MMM d, yyyy")}
                          {f.followupTime && ` at ${f.followupTime.slice(0, 5)}`}
                        </p>
                        {f.notes && <p className="text-sm text-zinc-600 mt-1">{f.notes}</p>}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="visits" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Site Visits</h3>
            <Button size="sm">
              <MapPin className="h-4 w-4 mr-1.5" />
              Log Visit
            </Button>
          </div>
          {(!lead.visits || lead.visits.length === 0) ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
              <MapPin className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">No visits logged</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lead.visits.map((v: any) => (
                <div key={v.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-zinc-900">
                        {v.checkInTime ? format(new Date(v.checkInTime), "MMM d, yyyy") : "—"}
                      </span>
                      {v.durationMinutes && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {v.durationMinutes} min
                        </span>
                      )}
                    </div>
                    {v.checkInAddress && <p className="text-sm text-zinc-600 mt-1">{v.checkInAddress}</p>}
                    {v.notes && <p className="text-sm text-zinc-500 mt-1">{v.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="photos" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Photos</h3>
            <Button size="sm" onClick={() => setPhotoUploadOpen(true)}>
              <Camera className="h-4 w-4 mr-1.5" />
              Upload Photo
            </Button>
          </div>

          <ErrorBoundary
            onError={(err) => {
              console.error("PhotoGallery error:", err);
              toast.error("Failed to load photos");
            }}
          >
            <PhotoGallery
              photos={lead.photos || []}
              onDelete={async (photoId) => {
                await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
                queryClient.invalidateQueries({ queryKey: ["lead", id] });
              }}
            />
          </ErrorBoundary>

          {lead.photos?.some((p: any) => p.type === "visiting_card") && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Visiting Card Scanner</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {lead.photos
                    .filter((p: any) => p.type === "visiting_card")
                    .map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-lg border p-2">
                        <img src={p.url} alt="Card" className="h-12 w-12 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate">{p.caption || "Visiting Card"}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 h-6 text-[10px]"
                            disabled={scanning === p.id}
                            onClick={async () => {
                              setScanning(p.id)
                              setScanResult(null)
                              try {
                                const res = await fetch("/api/scan-card", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ imageUrl: p.url }),
                                })
                                if (!res.ok) throw new Error("Scan failed")
                                const data = await res.json()
                                setScanResult(data)
                                toast.success("Card scanned successfully")
                              } catch {
                                toast.error("Failed to scan card")
                              } finally { setScanning(null) }
                            }}
                          >
                            {scanning === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanLine className="h-3 w-3" />}
                            Extract
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
                {scanResult && (
                  <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium">Extracted Info</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px]"
                        onClick={() => {
                          fetch(`/api/leads/${id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              contactPerson: scanResult.name || lead.contactPerson,
                              mobile: scanResult.mobile || lead.mobile,
                              email: scanResult.email || lead.email,
                              companyName: scanResult.company || lead.companyName,
                              designation: scanResult.designation || lead.designation,
                              siteAddress: scanResult.address || lead.siteAddress,
                            }),
                          }).then(() => {
                            queryClient.invalidateQueries({ queryKey: ["lead", id] })
                            toast.success("Lead updated with scanned data")
                            setScanResult(null)
                          })
                        }}
                      >
                        Apply to Lead
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {scanResult.name && <div><span className="text-muted-foreground">Name:</span> {scanResult.name}</div>}
                      {scanResult.mobile && <div><span className="text-muted-foreground">Mobile:</span> {scanResult.mobile}</div>}
                      {scanResult.email && <div><span className="text-muted-foreground">Email:</span> {scanResult.email}</div>}
                      {scanResult.designation && <div><span className="text-muted-foreground">Designation:</span> {scanResult.designation}</div>}
                      {scanResult.company && <div><span className="text-muted-foreground">Company:</span> {scanResult.company}</div>}
                      {scanResult.address && <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {scanResult.address}</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {(!lead.activities || lead.activities.length === 0) ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
              <p className="text-sm text-zinc-500">No activity recorded</p>
            </div>
          ) : (
            <div className="relative pl-8 space-y-0">
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-zinc-200" />
              {lead.activities.map((a: any) => {
                const Icon = activityIcons[a.type] ?? Plus;
                const color = activityColors[a.type] ?? "bg-zinc-100 text-zinc-600";
                return (
                  <div key={a.id} className="relative pb-6 last:pb-0">
                    <div className={cn("absolute -left-6 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white", color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-lg border border-zinc-100 bg-white p-3 shadow-sm">
                      <p className="text-sm text-zinc-800">{a.description}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">Are you sure you want to delete <strong>{lead.companyName}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLead.isPending}>
              {deleteLead.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={photoUploadOpen} onOpenChange={setPhotoUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
          </DialogHeader>
          <ErrorBoundary
            onError={(err) => {
              console.error("Photo upload error:", err);
              toast.error("Upload failed. Please check your connection and try again.");
              setPhotoUploadOpen(false);
            }}
          >
            <PhotoUploader
              leadId={id}
              onUploadComplete={() => {
                try {
                  queryClient.invalidateQueries({ queryKey: ["lead", id] });
                } catch (e) {
                  console.error("Failed to invalidate queries:", e);
                }
                setPhotoUploadOpen(false);
              }}
            />
          </ErrorBoundary>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead details below</DialogDescription>
          </DialogHeader>

          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {[
              { id: "customer", label: "Customer" },
              { id: "location", label: "Location" },
              { id: "project", label: "Project" },
              { id: "notes", label: "Notes" },
              { id: "custom", label: "Custom" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEditTab(t.id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  editTab === t.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-4 py-2">
            {editTab === "customer" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["companyName", "Company Name *", "text"],
                  ["clientCompany", "Client Company", "text"],
                  ["builderName", "Builder Name", "text"],
                  ["projectName", "Project Name", "text"],
                  ["contactPerson", "Contact Person *", "text"],
                  ["designation", "Designation", "text"],
                  ["mobile", "Mobile *", "text"],
                  ["email", "Email", "email"],
                  ["existingVendor", "Existing Vendor", "text"],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type={type}
                      value={editForm[key] || ""}
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <Label className="text-xs">Competitor Notes</Label>
                  <Textarea
                    value={editForm.competitorNotes || ""}
                    onChange={(e) => setEditForm({ ...editForm, competitorNotes: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {editTab === "location" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Site Address</Label>
                  <Textarea
                    value={editForm.siteAddress || ""}
                    onChange={(e) => setEditForm({ ...editForm, siteAddress: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["city", "City"],
                    ["district", "District"],
                    ["state", "State"],
                    ["pincode", "Pincode"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <Label className="text-xs">{label}</Label>
                      <Input
                        value={editForm[key] || ""}
                        onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Latitude</Label>
                    <Input
                      value={editForm.latitude || ""}
                      onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Longitude</Label>
                    <Input
                      value={editForm.longitude || ""}
                      onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {editTab === "project" && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Project Type</Label>
                    <select
                      value={editForm.projectType || ""}
                      onChange={(e) => setEditForm({ ...editForm, projectType: e.target.value })}
                      className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm"
                    >
                      <option value="">Select</option>
                      {["residential", "commercial", "industrial", "infrastructure"].map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Project Status</Label>
                    <select
                      value={editForm.projectStatus || ""}
                      onChange={(e) => setEditForm({ ...editForm, projectStatus: e.target.value })}
                      className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm"
                    >
                      <option value="">Select</option>
                      {["planning", "excavation", "foundation", "structural", "finishing", "completed"].map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Floors</Label>
                    <Input
                      type="number"
                      value={editForm.numberOfFloors || ""}
                      onChange={(e) => setEditForm({ ...editForm, numberOfFloors: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Built-up (sq ft)</Label>
                    <Input
                      type="number"
                      value={editForm.builtUpArea || ""}
                      onChange={(e) => setEditForm({ ...editForm, builtUpArea: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Est. Value (₹)</Label>
                    <Input
                      type="number"
                      value={editForm.estimatedValue || ""}
                      onChange={(e) => setEditForm({ ...editForm, estimatedValue: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Total m³</Label>
                    <Input
                      type="number"
                      value={editForm.estimatedM3 || ""}
                      onChange={(e) => setEditForm({ ...editForm, estimatedM3: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Monthly m³</Label>
                    <Input
                      type="number"
                      value={editForm.monthlyM3 || ""}
                      onChange={(e) => setEditForm({ ...editForm, monthlyM3: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Immediate m³</Label>
                    <Input
                      type="number"
                      value={editForm.immediateM3 || ""}
                      onChange={(e) => setEditForm({ ...editForm, immediateM3: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Expected Supply Date</Label>
                    <Input
                      type="date"
                      value={editForm.expectedSupplyDate || ""}
                      onChange={(e) => setEditForm({ ...editForm, expectedSupplyDate: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Grade Requirements</Label>
                    <Input
                      value={editForm.gradeRequirements || ""}
                      onChange={(e) => setEditForm({ ...editForm, gradeRequirements: e.target.value })}
                      placeholder="e.g. M20, M25"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {editTab === "notes" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Lead Stage</Label>
                  <select
                    value={editForm.stage || "new"}
                    onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
                    className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm"
                  >
                    {["new", "contacted", "meeting_scheduled", "site_visited", "requirement_received", "quotation_sent", "negotiation", "trial_order"].map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Remarks / Notes</Label>
                  <Textarea
                    value={editForm.remarks || ""}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                    rows={4}
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {editTab === "custom" && (
              <div>
                {customFields.length === 0 ? (
                  <p className="text-sm text-zinc-400">No custom fields configured.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {customFields.map((cf) => (
                      <div key={cf.id}>
                        <Label className="text-xs">{cf.fieldLabel || cf.fieldName}{cf.isRequired && " *"}</Label>
                        {cf.fieldType === "textarea" ? (
                          <textarea
                            value={editForm[`cf_${cf.id}`] || ""}
                            onChange={(e) => setEditForm({ ...editForm, [`cf_${cf.id}`]: e.target.value })}
                            className="h-16 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"
                          />
                        ) : (
                          <Input
                            type={cf.fieldType === "number" ? "number" : "text"}
                            value={editForm[`cf_${cf.id}`] || ""}
                            onChange={(e) => setEditForm({ ...editForm, [`cf_${cf.id}`]: e.target.value })}
                            className="h-8 text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={updateLead.isPending}>
              {updateLead.isPending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
