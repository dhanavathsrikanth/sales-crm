"use server";

import { db } from "@/lib/db";
import { constrOrders, constrOrderItems, constrCustomers, constrProducts } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils";
import { getOrCreateUser } from "../users";

export async function getOrders(filters?: { status?: string; search?: string }) {
  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(constrOrders.status, filters.status as any));
  }

  const orders = await db
    .select({
      id: constrOrders.id,
      orderNumber: constrOrders.orderNumber,
      orderDate: constrOrders.orderDate,
      status: constrOrders.status,
      totalAmount: constrOrders.totalAmount,
      finalAmount: constrOrders.finalAmount,
      deliveryDate: constrOrders.deliveryDate,
      createdAt: constrOrders.createdAt,
      customerName: constrCustomers.name,
      customerPhone: constrCustomers.phone,
      customerId: constrCustomers.id,
    })
    .from(constrOrders)
    .leftJoin(constrCustomers, eq(constrOrders.customerId, constrCustomers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(constrOrders.createdAt));

  return orders;
}

export async function getOrderById(id: string) {
  const [order] = await db
    .select({
      id: constrOrders.id,
      userId: constrOrders.userId,
      orderNumber: constrOrders.orderNumber,
      orderDate: constrOrders.orderDate,
      status: constrOrders.status,
      totalAmount: constrOrders.totalAmount,
      discountAmount: constrOrders.discountAmount,
      finalAmount: constrOrders.finalAmount,
      deliveryAddress: constrOrders.deliveryAddress,
      deliveryDate: constrOrders.deliveryDate,
      notes: constrOrders.notes,
      createdAt: constrOrders.createdAt,
      customerName: constrCustomers.name,
      customerPhone: constrCustomers.phone,
      customerId: constrCustomers.id,
    })
    .from(constrOrders)
    .leftJoin(constrCustomers, eq(constrOrders.customerId, constrCustomers.id))
    .where(eq(constrOrders.id, id));

  if (!order) return null;

  const items = await db
    .select({
      id: constrOrderItems.id,
      quantity: constrOrderItems.quantity,
      unitPrice: constrOrderItems.unitPrice,
      totalPrice: constrOrderItems.totalPrice,
      customSizeLabel: constrOrderItems.customSizeLabel,
      customDimensions: constrOrderItems.customDimensions,
      productName: constrProducts.name,
      productId: constrProducts.id,
    })
    .from(constrOrderItems)
    .leftJoin(constrProducts, eq(constrOrderItems.productId, constrProducts.id))
    .where(eq(constrOrderItems.orderId, id));

  return { ...order, items };
}

export async function createOrder(data: {
  customerId: string;
  leadId?: string;
  items: Array<{
    productId?: string;
    customSizeLabel?: string;
    customDimensions?: string;
    quantity: number;
    unitPrice: number;
  }>;
  deliveryAddress?: string;
  deliveryDate?: string;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await getOrCreateUser(userId);
  if (!user.data) throw new Error("Unauthorized");

  const orderNumber = generateOrderNumber();
  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const [order] = await db.insert(constrOrders).values({
    userId: user.data.id,
    customerId: data.customerId as any,
    leadId: data.leadId as any,
    orderNumber,
    totalAmount: totalAmount.toString(),
    finalAmount: totalAmount.toString(),
    deliveryAddress: data.deliveryAddress,
    deliveryDate: data.deliveryDate,
    notes: data.notes,
  }).returning();

  for (const item of data.items) {
    await db.insert(constrOrderItems).values({
      orderId: order.id,
      productId: item.productId as any,
      customSizeLabel: item.customSizeLabel,
      customDimensions: item.customDimensions,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      totalPrice: (item.quantity * item.unitPrice).toString(),
    });
  }

  return order;
}

export async function updateOrderStatus(id: string, status: string) {
  const [order] = await db
    .update(constrOrders)
    .set({ status: status as any })
    .where(eq(constrOrders.id, id))
    .returning();
  return order;
}

export async function getOrderStats() {
  const result = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${constrOrders.status} = 'pending')`,
      confirmed: sql<number>`count(*) filter (where ${constrOrders.status} = 'confirmed')`,
      dispatched: sql<number>`count(*) filter (where ${constrOrders.status} = 'dispatched')`,
      delivered: sql<number>`count(*) filter (where ${constrOrders.status} = 'delivered')`,
      revenue: sql<number>`coalesce(sum(${constrOrders.finalAmount}::numeric), 0)`,
      monthRevenue: sql<number>`coalesce(sum(${constrOrders.finalAmount}::numeric) filter (where ${constrOrders.createdAt} >= date_trunc('month', now())), 0)`,
    })
    .from(constrOrders);

  return result[0];
}

export async function getRecentOrders(limit = 5) {
  return db
    .select({
      id: constrOrders.id,
      orderNumber: constrOrders.orderNumber,
      status: constrOrders.status,
      finalAmount: constrOrders.finalAmount,
      createdAt: constrOrders.createdAt,
      customerName: constrCustomers.name,
    })
    .from(constrOrders)
    .leftJoin(constrCustomers, eq(constrOrders.customerId, constrCustomers.id))
    .orderBy(desc(constrOrders.createdAt))
    .limit(limit);
}
