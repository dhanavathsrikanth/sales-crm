import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { interactions, users, contacts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");

  if (!contactId) return NextResponse.json({ error: "contactId required" }, { status: 400 });

  const allInteractions = await db
    .select()
    .from(interactions)
    .where(eq(interactions.contactId, contactId))
    .orderBy(desc(interactions.occurredAt));

  return NextResponse.json(allInteractions);
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  const [interaction] = await db
    .insert(interactions)
    .values({
      userId: user.id,
      contactId: body.contactId,
      leadId: body.leadId || null,
      type: body.type || "call",
      direction: body.direction || "outbound",
      duration: body.duration || null,
      summary: body.summary || null,
      sentiment: body.sentiment || "neutral",
      nextAction: body.nextAction || null,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
    })
    .returning();

  await db
    .update(contacts)
    .set({ lastContactedAt: new Date(), updatedAt: new Date() })
    .where(eq(contacts.id, body.contactId));

  return NextResponse.json(interaction, { status: 201 });
}
