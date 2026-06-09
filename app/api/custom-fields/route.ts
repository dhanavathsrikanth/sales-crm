import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { customFields, users } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const fields = await db
    .select()
    .from(customFields)
    .where(eq(customFields.userId, user.id))
    .orderBy(asc(customFields.sortOrder));

  return NextResponse.json(fields);
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  if (!body.fieldName || !body.fieldLabel || !body.fieldType) {
    return NextResponse.json({ error: "fieldName, fieldLabel, and fieldType are required" }, { status: 400 });
  }

  const maxOrder = await db
    .select({ max: customFields.sortOrder })
    .from(customFields)
    .where(eq(customFields.userId, user.id))
    .orderBy(asc(customFields.sortOrder))
    .limit(1);

  const [field] = await db
    .insert(customFields)
    .values({
      userId: user.id,
      fieldName: body.fieldName,
      fieldLabel: body.fieldLabel,
      fieldType: body.fieldType,
      options: body.options || null,
      isRequired: body.isRequired || false,
      sortOrder: body.sortOrder ?? (maxOrder[0]?.max || 0) + 1,
    })
    .returning();

  return NextResponse.json(field, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { orderedIds } = await req.json();
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds array required" }, { status: 400 });
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(customFields)
      .set({ sortOrder: i })
      .where(and(eq(customFields.id, orderedIds[i]), eq(customFields.userId, user.id)));
  }

  return NextResponse.json({ success: true });
}


