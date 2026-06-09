"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, Phone, MessageSquare, Mail, Pencil, Trash2, MoreHorizontal,
  Calendar, MapPin, Trophy, Frown, ChevronRight, Loader2, Plus,
  Clock, CheckCircle, XCircle, PhoneMissed, Gift, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContact, useDeleteContact, useUpcomingBirthdays } from "@/hooks/use-contacts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RelationshipHealth from "@/components/contacts/RelationshipHealth";
import InteractionModal from "@/components/contacts/InteractionModal";
import { Separator } from "@/components/ui/separator";

const relationshipConfig: Record<string, { label: string; color: string; bg: string; initials: string }> = {
  customer: { label: "Customer", color: "text-blue-600", bg: "bg-blue-50", initials: "bg-blue-500" },
  contractor: { label: "Contractor", color: "text-orange-600", bg: "bg-orange-50", initials: "bg-orange-500" },
  consultant: { label: "Consultant", color: "text-purple-600", bg: "bg-purple-50", initials: "bg-purple-500" },
  competitor: { label: "Competitor", color: "text-red-600", bg: "bg-red-50", initials: "bg-red-500" },
  referral: { label: "Referral", color: "text-emerald-600", bg: "bg-emerald-50", initials: "bg-emerald-500" },
  friend: { label: "Friend", color: "text-pink-600", bg: "bg-pink-50", initials: "bg-pink-500" },
};

const interactionIcons: Record<string, any> = {
  call: Phone, whatsapp: MessageSquare, meeting: MapPin, email: Mail, site_visit: MapPin, lunch: Calendar, referral: Plus,
};

const sentimentEmojis: Record<string, string> = {
  positive: "👍", neutral: "😐", negative: "👎",
};

const callStatusConfig: Record<string, { icon: any; color: string; label: string }> = {
  connected: { icon: CheckCircle, color: "text-emerald-600", label: "Connected" },
  missed: { icon: XCircle, color: "text-red-600", label: "Missed" },
  no_answer: { icon: PhoneMissed, color: "text-orange-600", label: "No Answer" },
  busy: { icon: XCircle, color: "text-zinc-500", label: "Busy" },
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: contact, isLoading, isError } = useContact(id);
  const deleteContact = useDeleteContact();
  const { data: birthdays } = useUpcomingBirthdays();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>;
  }

  if (isError || !contact) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">Contact not found.</p>
        <Link href="/contacts"><Button variant="outline" className="mt-3">Back to Contacts</Button></Link>
      </div>
    );
  }

  const rel = relationshipConfig[contact.relationship ?? ""] ?? relationshipConfig.friend;
  const initials = `${contact.firstName?.charAt(0) || ""}${contact.lastName?.charAt(0) || ""}`.toUpperCase() || "?";
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

  const daysSince = contact.lastContactedAt
    ? Math.floor((Date.now() - new Date(contact.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const birthdayInfo = contact.birthday
    ? (() => {
        const bd = new Date(contact.birthday);
        const now = new Date();
        const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        const diff = Math.ceil((thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { monthDay: format(bd, "MMM d"), daysUntil: diff >= 0 ? diff : 365 + diff };
      })()
    : null;

  const handleDelete = async () => {
    await deleteContact.mutateAsync(id);
    router.push("/contacts");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/contacts" className="hover:text-zinc-700">Contacts</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-800 font-medium truncate">{fullName}</span>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/contacts">
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            {contact.profilePhoto ? (
              <img src={contact.profilePhoto} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white", rel.initials)}>
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900">{fullName}</h1>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", rel.bg, rel.color)}>{rel.label}</span>
              </div>
              {contact.designation && <p className="text-sm text-zinc-500">{contact.designation}</p>}
              {contact.company && <p className="text-sm text-zinc-400 flex items-center gap-1 mt-0.5"><Building2 className="h-3.5 w-3.5" />{contact.company}</p>}
              <div className="flex items-center gap-2 mt-1.5">
                {daysSince !== null ? (
                  <span className={cn("text-xs", daysSince > 30 ? "text-red-500 font-medium" : "text-zinc-400")}>
                    {daysSince > 30 ? "⚠️ " : ""}Last contacted {formatDistanceToNow(new Date(contact.lastContactedAt!), { addSuffix: true })}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">Never contacted</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {contact.mobile && (
              <a href={`tel:${contact.mobile}`} className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                <Phone className="h-4 w-4" />
              </a>
            )}
            {(contact.whatsapp || contact.mobile) && (
              <a href={`https://wa.me/${(contact.whatsapp || contact.mobile)!.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                <MessageSquare className="h-4 w-4" />
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100">
                <Mail className="h-4 w-4" />
              </a>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <Link href={`/contacts/${id}/edit`}>
                  <DropdownMenuItem><Pencil className="h-4 w-4 mr-2" /> Edit Contact</DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteConfirm(true)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <RelationshipHealth
            lastContactedAt={contact.lastContactedAt}
            interactionCount={contact.interactions?.length || 0}
            sentimentOverview=""
          />
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="interactions">Interactions ({contact.interactions?.length || 0})</TabsTrigger>
          <TabsTrigger value="leads">Linked Leads ({contact.linkedLeads?.length || 0})</TabsTrigger>
          <TabsTrigger value="calls">Call Log ({contact.callLog?.length || 0})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-zinc-900 mb-3">Contact Information</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Mobile", contact.mobile],
                ["WhatsApp", contact.whatsapp],
                ["Email", contact.email],
                ["Designation", contact.designation],
                ["Company", contact.company],
                ["Contact Frequency", contact.contactFrequency ? contact.contactFrequency.charAt(0).toUpperCase() + contact.contactFrequency.slice(1) : null],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between sm:flex-col">
                  <dt className="text-xs text-zinc-500">{label}</dt>
                  <dd className="text-sm font-medium text-zinc-900">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-zinc-900 mb-3">Referred By</h3>
            {contact.referredByContact ? (
              <Link href={`/contacts/${contact.referredByContact.id}`} className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 hover:bg-zinc-100 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                  {contact.referredByContact.firstName?.charAt(0)}{contact.referredByContact.lastName?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{contact.referredByContact.firstName} {contact.referredByContact.lastName}</p>
                  {contact.referredByContact.company && <p className="text-xs text-zinc-500">{contact.referredByContact.company}</p>}
                </div>
              </Link>
            ) : (
              <p className="text-sm text-zinc-400">No referrer recorded</p>
            )}
          </div>

          {contact.tags && contact.tags.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag: string) => (
                  <span key={tag} className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {contact.personalNotes && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-2">Personal Notes</h3>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{contact.personalNotes}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="interactions" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Interaction History</h3>
            <Button size="sm" onClick={() => setInteractionOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Log Interaction
            </Button>
          </div>
          {(!contact.interactions || contact.interactions.length === 0) ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
              <Phone className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">No interactions logged yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contact.interactions.map((interaction: any) => {
                const Icon = interactionIcons[interaction.type] ?? Phone;
                return (
                  <div key={interaction.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-500 capitalize">{interaction.type?.replace("_", " ")}</span>
                        <span className={cn(
                          "text-[10px] font-semibold uppercase rounded-full px-1.5 py-0.5",
                          interaction.direction === "inbound" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                        )}>{interaction.direction}</span>
                        {interaction.sentiment && <span className="text-xs">{sentimentEmojis[interaction.sentiment] || ""}</span>}
                        {interaction.duration && (
                          <span className="flex items-center gap-1 text-xs text-zinc-400">
                            <Clock className="h-3 w-3" />{interaction.duration}min
                          </span>
                        )}
                      </div>
                      {interaction.summary && <p className="text-sm text-zinc-700 mt-1">{interaction.summary}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-400">
                          {interaction.occurredAt ? formatDistanceToNow(new Date(interaction.occurredAt), { addSuffix: true }) : ""}
                        </span>
                        {interaction.nextAction && (
                          <span className="text-xs text-blue-600">→ {interaction.nextAction}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leads" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900">Linked Leads</h3>
          </div>
          {(!contact.linkedLeads || contact.linkedLeads.length === 0) ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
              <Trophy className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">No leads linked to this contact</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contact.linkedLeads.map((lead: any) => (
                <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-zinc-300 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900">{lead.companyName || "Untitled"}</p>
                    {lead.city && <p className="text-xs text-zinc-500">{lead.city}</p>}
                  </div>
                  <Badge className={cn(
                    lead.stage === "won" ? "bg-emerald-100 text-emerald-700" :
                    lead.stage === "lost" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  )}>{lead.stage?.replace(/_/g, " ")}</Badge>
                  {lead.estimatedM3 && <span className="text-sm font-medium text-zinc-700">{Number(lead.estimatedM3).toLocaleString()} m³</span>}
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calls" className="mt-6 space-y-4">
          <h3 className="font-semibold text-zinc-900">Call Log</h3>
          {(!contact.callLog || contact.callLog.length === 0) ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
              <Phone className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">No calls logged</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contact.callLog.map((call: any) => {
                const cfg = callStatusConfig[call.status] ?? { icon: Phone, color: "text-zinc-500", label: call.status };
                const Icon = cfg.icon;
                return (
                  <div key={call.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-50", cfg.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-500 capitalize">{call.direction}</span>
                        <span className={cn("text-[10px] font-semibold rounded-full px-1.5 py-0.5", cfg.label === "Connected" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{cfg.label}</span>
                        {call.duration && <span className="flex items-center gap-1 text-xs text-zinc-400"><Clock className="h-3 w-3" />{call.duration}s</span>}
                      </div>
                      {call.notes && <p className="text-sm text-zinc-600 mt-1">{call.notes}</p>}
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {call.calledAt ? formatDistanceToNow(new Date(call.calledAt), { addSuffix: true }) : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          <h3 className="font-semibold text-zinc-900">Upcoming</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 mb-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Next Follow-up
              </div>
              {daysSince !== null && daysSince > 14 ? (
                <p className="text-sm text-orange-600">⚠️ Overdue — last contacted {daysSince} days ago</p>
              ) : daysSince !== null ? (
                <p className="text-sm text-emerald-600">✅ Contacted recently ({daysSince} days ago)</p>
              ) : (
                <p className="text-sm text-zinc-400">No follow-up scheduled</p>
              )}
              {contact.contactFrequency && (
                <p className="text-xs text-zinc-500 mt-1">Frequency: {contact.contactFrequency}</p>
              )}
            </div>
            {birthdayInfo && (
              <div className="rounded-xl border border-pink-200 bg-pink-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-pink-800 mb-2">
                  <Gift className="h-4 w-4" />
                  Birthday
                </div>
                <p className="text-sm text-pink-700">
                  {birthdayInfo.monthDay} ({birthdayInfo.daysUntil <= 0 ? "Today!" : `in ${birthdayInfo.daysUntil} days`})
                </p>
                {(contact.whatsapp || contact.mobile) && (
                  <a
                    href={`https://wa.me/${(contact.whatsapp || contact.mobile)!.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Happy Birthday ${contact.firstName}! Wishing you a wonderful year ahead.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Send birthday wishes on WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Contact</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">Are you sure you want to delete <strong>{fullName}</strong>? This will deactivate the contact.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteContact.isPending}>
              {deleteContact.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InteractionModal contactId={id} open={interactionOpen} onOpenChange={setInteractionOpen} />
    </div>
  );
}
