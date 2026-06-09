import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { contacts, users, interactions, callLog, leads } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  let referredByContact = null;
  if (contact.referredBy) {
    const [ref] = await db
      .select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName, company: contacts.company, mobile: contacts.mobile })
      .from(contacts)
      .where(eq(contacts.id, contact.referredBy))
      .limit(1);
    referredByContact = ref;
  }

  let leadList: any[] = [];
  if (contact.leadId) {
    leadList = await db
      .select({
        id: leads.id,
        companyName: leads.companyName,
        stage: leads.stage,
        estimatedM3: leads.estimatedM3,
        city: leads.city,
      })
      .from(leads)
      .where(eq(leads.id, contact.leadId))
      .limit(1);
  }

  const contactInteractions = await db
    .select()
    .from(interactions)
    .where(eq(interactions.contactId, id))
    .orderBy(desc(interactions.occurredAt));

  const contactCallLog = await db
    .select()
    .from(callLog)
    .where(eq(callLog.contactId, id))
    .orderBy(desc(callLog.calledAt));

  return NextResponse.json({
    ...contact,
    referredByContact,
    linkedLeads: contact.leadId ? leadList : [],
    interactions: contactInteractions,
    callLog: contactCallLog,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.whatsappSameAsMobile) {
    body.whatsapp = body.mobile;
  }
  delete body.whatsappSameAsMobile;

  const [updated] = await db
    .update(contacts)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(contacts.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [deleted] = await db
    .update(contacts)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(contacts.id, id))
    .returning({ id: contacts.id, firstName: contacts.firstName });

  if (!deleted) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  return NextResponse.json({ message: `Contact ${deleted.firstName} deactivated` });
}
