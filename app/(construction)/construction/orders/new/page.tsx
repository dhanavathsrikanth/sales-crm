"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProducts } from "@/hooks/construction/use-products";
import { useCustomers } from "@/hooks/construction/use-contacts";
import { createOrder } from "@/lib/actions/construction/orders";
import { createCustomer } from "@/lib/actions/construction/contacts";
import PageHeader from "@/components/construction-shared/PageHeader";
import { Plus, Trash2 } from "lucide-react";

interface OrderItem {
  productId?: string;
  customSizeLabel: string;
  customDimensions: string;
  quantity: number;
  unitPrice: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { data: products } = useProducts();
  const { data: customers, refetch: refetchCustomers } = useCustomers();
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", city: "" });
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ productId: "", customSizeLabel: "", customDimensions: "", quantity: 1, unitPrice: 0 }]);

  const addItem = () => {
    setItems([...items, { productId: "", customSizeLabel: "", customDimensions: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;

    if (field === "productId") {
      const product = products?.find(p => p.id === value);
      if (product) {
        newItems[index].unitPrice = Number(product.pricePerPiece || 0);
        newItems[index].customSizeLabel = "";
        newItems[index].customDimensions = "";
      }
    }

    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleCreateCustomer = async () => {
    if (!newCustomer.name) return;
    const customer = await createCustomer({
      name: newCustomer.name,
      phone: newCustomer.phone,
      city: newCustomer.city,
    });
    setCustomerId(customer.id);
    setShowNewCustomer(false);
    setNewCustomer({ name: "", phone: "", city: "" });
    refetchCustomers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    setSaving(true);

    try {
      await createOrder({
        customerId,
        items: items.map(item => ({
          productId: item.productId || undefined,
          customSizeLabel: item.customSizeLabel || undefined,
          customDimensions: item.customDimensions || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        deliveryAddress: deliveryAddress || undefined,
        notes: notes || undefined,
      });

      router.push("/construction/orders");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="New Order" subtitle="Create a new sales order" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="font-semibold text-zinc-900 mb-3">Customer</h3>

          {!showNewCustomer ? (
            <div className="flex gap-2">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a customer...</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCustomer(true)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Name *"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  placeholder="Phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="City"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-900">Order Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-3 w-3" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="rounded-lg border border-zinc-100 p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <select
                      value={item.productId || ""}
                      onChange={(e) => updateItem(index, "productId", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select product...</option>
                      {products?.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} {p.sizeLabel ? `(${p.sizeLabel})` : ""}</option>
                      ))}
                      <option value="__custom__">Custom Size</option>
                    </select>

                    {item.productId === "__custom__" && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Size label (e.g. 2 inch)"
                          value={item.customSizeLabel}
                          onChange={(e) => updateItem(index, "customSizeLabel", e.target.value)}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          placeholder="Dimensions (e.g. 600x200x50mm)"
                          value={item.customDimensions}
                          onChange={(e) => updateItem(index, "customDimensions", e.target.value)}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-zinc-500">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Unit Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs text-zinc-500">Total</label>
                        <div className="flex h-full items-center text-sm font-medium text-zinc-900 px-3 pt-1">
                          ₹{(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="ml-2 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-between">
            <span className="text-sm font-semibold text-zinc-900">Total Amount</span>
            <span className="text-lg font-bold text-zinc-900">₹{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
          <h3 className="font-semibold text-zinc-900">Additional Details</h3>
          <div>
            <label className="text-sm text-zinc-600 mb-1 block">Delivery Address</label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !customerId || items.length === 0}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Creating Order..." : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
