import { cn } from "@/lib/utils";
import {
  Phone, MessageSquare, Mail, Plus,
  Building2, MapPin, Calendar,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Contact } from "@/hooks/use-contacts";

const relationshipConfig: Record<string, { label: string; color: string; bg: string; initials: string }> = {
  customer: { label: "Customer", color: "text-blue-600", bg: "bg-blue-50", initials: "bg-blue-500" },
  contractor: { label: "Contractor", color: "text-orange-600", bg: "bg-orange-50", initials: "bg-orange-500" },
  consultant: { label: "Consultant", color: "text-purple-600", bg: "bg-purple-50", initials: "bg-purple-500" },
  competitor: { label: "Competitor", color: "text-red-600", bg: "bg-red-50", initials: "bg-red-500" },
  referral: { label: "Referral", color: "text-emerald-600", bg: "bg-emerald-50", initials: "bg-emerald-500" },
  friend: { label: "Friend", color: "text-pink-600", bg: "bg-pink-50", initials: "bg-pink-500" },
};

interface Props {
  contact: Contact;
}

export default function ContactCard({ contact }: Props) {
  const rel = relationshipConfig[contact.relationship ?? ""] ?? relationshipConfig.friend;
  const initials = `${contact.firstName?.charAt(0) || ""}${contact.lastName?.charAt(0) || ""}`.toUpperCase() || "?";
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

  const lastContacted = contact.lastContactedAt ? new Date(contact.lastContactedAt) : null;
  const daysSince = lastContacted ? Math.floor((Date.now() - lastContacted.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isOverdue = daysSince !== null && daysSince > 30;

  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="group block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {contact.profilePhoto ? (
          <img src={contact.profilePhoto} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", rel.initials)}>
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900 truncate">{fullName}</h3>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", rel.bg, rel.color)}>
              {rel.label}
            </span>
          </div>
          {contact.designation && (
            <p className="text-xs text-zinc-500 truncate">{contact.designation}</p>
          )}
          {contact.company && (
            <p className="text-xs text-zinc-400 truncate flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 shrink-0" />
              {contact.company}
            </p>
          )}
        </div>
      </div>

      {contact.tags && contact.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {contact.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
              {tag}
            </span>
          ))}
          {contact.tags.length > 3 && (
            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              +{contact.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {lastContacted ? (
            <span className={cn("text-xs", isOverdue ? "text-red-500 font-medium" : "text-zinc-400")}>
              {isOverdue ? "⚠️ " : ""}{formatDistanceToNow(lastContacted, { addSuffix: true })}
            </span>
          ) : (
            <span className="text-xs text-zinc-400">Never contacted</span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {contact.mobile && (
            <a href={`tel:${contact.mobile}`} onClick={(e) => e.stopPropagation()} className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 hover:bg-blue-50 hover:text-blue-600">
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          {(contact.whatsapp || contact.mobile) && (
            <a href={`https://wa.me/${(contact.whatsapp || contact.mobile)!.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600">
              <MessageSquare className="h-3.5 w-3.5" />
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()} className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 hover:bg-amber-50 hover:text-amber-600">
              <Mail className="h-3.5 w-3.5" />
            </a>
          )}
          <Link href={`/contacts/${contact.id}`} className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 hover:bg-indigo-50 hover:text-indigo-600">
            <Plus className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Link>
  );
}
