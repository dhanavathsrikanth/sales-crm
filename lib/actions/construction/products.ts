"use server";

import { db } from "@/lib/db";
import { constrProducts } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, ilike, and } from "drizzle-orm";

export async function getProducts(filters?: { category?: string; search?: string }) {
  const conditions = [eq(constrProducts.isActive, true)];

  if (filters?.category) {
    conditions.push(eq(constrProducts.category, filters.category as any));
  }
  if (filters?.search) {
    conditions.push(ilike(constrProducts.name, `%${filters.search}%`));
  }

  return db.select().from(constrProducts).where(and(...conditions)).orderBy(constrProducts.name);
}

export async function getProductById(id: string) {
  const [product] = await db.select().from(constrProducts).where(eq(constrProducts.id, id));
  return product;
}

export async function createProduct(data: {
  name: string;
  slug: string;
  category: string;
  sizeLabel?: string;
  dimensions?: string;
  weightPerUnit?: string;
  density?: string;
  strength?: string;
  description?: string;
  pricePerPiece?: number;
  pricePerM3?: number;
  pricePerTruck?: number;
  isCustom?: boolean;
  manufacturerName?: string;
  imageUrl?: string;
}) {
  const [product] = await db.insert(constrProducts).values({
    name: data.name,
    slug: data.slug,
    category: data.category as any,
    sizeLabel: data.sizeLabel,
    dimensions: data.dimensions,
    weightPerUnit: data.weightPerUnit,
    density: data.density,
    strength: data.strength,
    description: data.description,
    pricePerPiece: data.pricePerPiece?.toString(),
    pricePerM3: data.pricePerM3?.toString(),
    pricePerTruck: data.pricePerTruck?.toString(),
    isCustom: data.isCustom ?? false,
    manufacturerName: data.manufacturerName,
    imageUrl: data.imageUrl,
  }).returning();
  return product;
}

export async function updateProduct(id: string, data: Partial<{
  name: string;
  pricePerPiece: number;
  pricePerM3: number;
  pricePerTruck: number;
  imageUrl: string;
  isActive: boolean;
}>) {
  const updates: any = {};
  if (data.name) updates.name = data.name;
  if (data.pricePerPiece !== undefined) updates.pricePerPiece = data.pricePerPiece.toString();
  if (data.pricePerM3 !== undefined) updates.pricePerM3 = data.pricePerM3.toString();
  if (data.pricePerTruck !== undefined) updates.pricePerTruck = data.pricePerTruck.toString();
  if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
  if (data.isActive !== undefined) updates.isActive = data.isActive;

  const [product] = await db.update(constrProducts).set(updates).where(eq(constrProducts.id, id)).returning();
  return product;
}
