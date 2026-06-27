"use server";

import { db } from "@/lib/db";
import { constrCustomers } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, ilike, and, or } from "drizzle-orm";
import { getOrCreateUser } from "../users";

export async function getCustomers(filters?: { search?: string; type?: string }) {
  const conditions = [];

  if (filters?.search) {
    conditions.push(
      or(
        ilike(constrCustomers.name, `%${filters.search}%`),
        ilike(constrCustomers.phone, `%${filters.search}%`),
      )
    );
  }
  if (filters?.type) {
    conditions.push(eq(constrCustomers.type, filters.type as any));
  }

  return db
    .select()
    .from(constrCustomers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(constrCustomers.createdAt));
}

export async function getCustomerById(id: string) {
  const [customer] = await db.select().from(constrCustomers).where(eq(constrCustomers.id, id));
  return customer;
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  type?: string;
  notes?: string;
}) {
  const { userId } = await auth();
  const user = await getOrCreateUser(userId ?? undefined);
  if (!user.data) throw new Error("Unauthorized");

  const [customer] = await db.insert(constrCustomers).values({
    userId: user.data.id,
    name: data.name,
    phone: data.phone,
    whatsapp: data.whatsapp,
    email: data.email,
    address: data.address,
    city: data.city,
    district: data.district,
    state: data.state,
    pincode: data.pincode,
    type: (data.type as any) ?? "individual",
    notes: data.notes,
  }).returning();

  return customer;
}
