"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "@/hooks/construction/use-orders";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import { updateOrderStatus } from "@/lib/actions/construction/orders";
import { cn, formatCurrency } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  dispatched: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusFlow = ["pending", "confirmed", "dispatched", "delivered"];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading, refetch } = useOrder(id);
  const [updating, setUpdating] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <div className="text-center py-12 text-zinc-500">Order not found</div>;

  const currentIndex = statusFlow.indexOf(order.status ?? "pending");
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1
    ? statusFlow[currentIndex + 1]
    : null;

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    await updateOrderStatus(id, newStatus);
    setUpdating(false);
    refetch();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        subtitle={`Created ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}`}
        action={
          <button
            onClick={() => router.push("/construction/orders")}
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            ← Back to Orders
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="font-semibold text-zinc-900 mb-4">Status</h3>
            <div className="flex flex-wrap items-center gap-2">
              {statusFlow.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={cn(
                    "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium",
                    i <= currentIndex ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400"
                  )}>
                    {s}
                  </div>
                  {i < statusFlow.length - 1 && (
                    <div className={cn("w-3 h-px mx-0.5 sm:w-6 sm:mx-1", i < currentIndex ? "bg-emerald-400" : "bg-zinc-200")} />
                  )}
                </div>
              ))}
            </div>

            {nextStatus && order.status !== "cancelled" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={updating}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {updating ? "Updating..." : `Mark as ${nextStatus}`}
                </button>
                {order.status === "pending" && (
                  <button
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={updating}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="font-semibold text-zinc-900 mb-4">Order Items</h3>
            <div className="hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left text-xs font-semibold text-zinc-500 pb-2">Product</th>
                    <th className="text-right text-xs font-semibold text-zinc-500 pb-2">Qty</th>
                    <th className="text-right text-xs font-semibold text-zinc-500 pb-2">Unit Price</th>
                    <th className="text-right text-xs font-semibold text-zinc-500 pb-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 text-sm text-zinc-900">
                        {item.productName || item.customSizeLabel || "Custom"}
                        {item.customDimensions && (
                          <span className="text-zinc-400 ml-1">({item.customDimensions})</span>
                        )}
                      </td>
                      <td className="py-2 text-sm text-right text-zinc-700">{item.quantity}</td>
                      <td className="py-2 text-sm text-right text-zinc-700">{formatCurrency(Number(item.unitPrice))}</td>
                      <td className="py-2 text-sm text-right font-medium text-zinc-900">{formatCurrency(Number(item.totalPrice))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-zinc-900">Total</td>
                    <td className="pt-3 text-right text-lg font-bold text-zinc-900">{formatCurrency(Number(order.finalAmount))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="sm:hidden space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-zinc-100 p-3">
                  <p className="text-sm font-medium text-zinc-900">
                    {item.productName || item.customSizeLabel || "Custom"}
                  </p>
                  {item.customDimensions && (
                    <p className="text-xs text-zinc-400">{item.customDimensions}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Qty: {item.quantity}</span>
                    <span className="font-medium text-zinc-900">{formatCurrency(Number(item.totalPrice))}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-zinc-100">
                <span className="text-sm font-semibold text-zinc-900">Total</span>
                <span className="text-lg font-bold text-zinc-900">{formatCurrency(Number(order.finalAmount))}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="font-semibold text-zinc-900 mb-3">Customer</h3>
            <p className="text-sm font-medium text-zinc-900">{order.customerName || "—"}</p>
            {order.customerPhone && (
              <p className="text-sm text-zinc-500 mt-1">{order.customerPhone}</p>
            )}
          </div>

          {order.deliveryAddress && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="font-semibold text-zinc-900 mb-3">Delivery</h3>
              <p className="text-sm text-zinc-700">{order.deliveryAddress}</p>
              {order.deliveryDate && (
                <p className="text-sm text-zinc-500 mt-1">By: {order.deliveryDate}</p>
              )}
            </div>
          )}

          {order.notes && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="font-semibold text-zinc-900 mb-3">Notes</h3>
              <p className="text-sm text-zinc-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
