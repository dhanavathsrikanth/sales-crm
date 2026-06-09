import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { quickNotes, users, leads, contacts } from "@/lib/db/schema";
import { eq, and, like, desc, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const leadId = searchParams.get("leadId") || "";
  const contactId = searchParams.get("contactId") || "";

  let conditions = eq(quickNotes.userId, user.id);

  if (search) {
    conditions = and(conditions, like(quickNotes.content, `%${search}%`))!;
  }
  if (leadId) {
    conditions = and(conditions, eq(quickNotes.leadId, leadId))!;
  }
  if (contactId) {
    conditions = and(conditions, eq(quickNotes.contactId, contactId))!;
  }

  const notes = await db
    .select()
    .from(quickNotes)
    .where(conditions)
    .orderBy(desc(quickNotes.isPinned), desc(quickNotes.createdAt));

  const leadIds = notes.map((n) => n.leadId).filter(Boolean) as string[];
  const contactIds = notes.map((n) => n.contactId).filter(Boolean) as string[];

  let leadMap: Record<string, any> = {};
  let contactMap: Record<string, any> = {};

  if (leadIds.length > 0) {
    const linkedLeads = await db
      .select({ id: leads.id, companyName: leads.companyName, contactPerson: leads.contactPerson })
      .from(leads)
      .where(inArray(leads.id, leadIds));
    leadMap = Object.fromEntries(linkedLeads.map((l) => [l.id, l]));
  }

  if (contactIds.length > 0) {
    const linkedContacts = await db
      .select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName, company: contacts.company })
      .from(contacts)
      .where(inArray(contacts.id, contactIds));
    contactMap = Object.fromEntries(linkedContacts.map((c) => [c.id, c]));
  }

  const enriched = notes.map((n) => ({
    ...n,
    lead: n.leadId ? leadMap[n.leadId] || null : null,
    contact: n.contactId ? contactMap[n.contactId] || null : null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  if (!body.content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  let leadId = body.leadId || null;
  let contactId = body.contactId || null;

  if (!leadId) {
    const userLeads = await db
      .select({ id: leads.id, companyName: leads.companyName, contactPerson: leads.contactPerson })
      .from(leads)
      .where(eq(leads.userId, user.id));
    for (const l of userLeads) {
      const names = [l.companyName, l.contactPerson].filter(Boolean).map((n) => n!.toLowerCase());
      if (names.some((n) => body.content.toLowerCase().includes(n))) {
        leadId = l.id;
        break;
      }
    }
  }

  const [note] = await db
    .insert(quickNotes)
    .values({
      userId: user.id,
      content: body.content,
      color: body.color || "yellow",
      isPinned: body.isPinned || false,
      leadId,
      contactId,
    })
    .returning();

  return NextResponse.json(note, { status: 201 });
}
