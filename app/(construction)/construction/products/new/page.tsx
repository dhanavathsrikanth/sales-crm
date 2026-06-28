"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/actions/construction/products";
import PageHeader from "@/components/construction-shared/PageHeader";
import { Upload, ImageIcon } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    sizeLabel: "",
    dimensions: "",
    weightPerUnit: "",
    density: "",
    strength: "",
    description: "",
    pricePerPiece: "",
    pricePerM3: "",
    pricePerTruck: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const product = await createProduct({
        name: form.name,
        slug,
        category: "aac_block",
        sizeLabel: form.sizeLabel,
        dimensions: form.dimensions,
        weightPerUnit: form.weightPerUnit,
        density: form.density,
        strength: form.strength,
        description: form.description,
        pricePerPiece: form.pricePerPiece ? Number(form.pricePerPiece) : undefined,
        pricePerM3: form.pricePerM3 ? Number(form.pricePerM3) : undefined,
        pricePerTruck: form.pricePerTruck ? Number(form.pricePerTruck) : undefined,
        isCustom: true,
        manufacturerName: "ULTRA AAC BLOCKS / ARUGONDA INFRATECH",
      });
      setCreatedProductId(product.id);
      router.push(`/construction/products/${product.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !createdProductId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", createdProductId);

      const res = await fetch("/api/construction/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await res.json();
      setPreviewUrl(url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="Add Custom AAC Size" subtitle="Create a custom-sized AAC block product" />

      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1 block">Product Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. AAC Block 2 inch Custom"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block">Size Label</label>
            <input
              value={form.sizeLabel}
              onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })}
              placeholder="e.g. 2 inch"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block">Dimensions</label>
            <input
              value={form.dimensions}
              onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
              placeholder="e.g. 600x200x50mm"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block">Weight per Unit</label>
            <input
              value={form.weightPerUnit}
              onChange={(e) => setForm({ ...form, weightPerUnit: e.target.value })}
              placeholder="e.g. 3-4 kg"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1 block">Density</label>
            <input
              value={form.density}
              onChange={(e) => setForm({ ...form, density: e.target.value })}
              placeholder="e.g. 550-650 kg/m³"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1 block">Strength</label>
          <input
            value={form.strength}
            onChange={(e) => setForm({ ...form, strength: e.target.value })}
            placeholder="e.g. 3.8-4.5 N/mm²"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1 block">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Product description..."
            rows={3}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <h4 className="text-sm font-semibold text-zinc-900 mb-3">Pricing (optional, can set later)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Price per Piece (₹)</label>
              <input
                type="number"
                value={form.pricePerPiece}
                onChange={(e) => setForm({ ...form, pricePerPiece: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Price per m³ (₹)</label>
              <input
                type="number"
                value={form.pricePerM3}
                onChange={(e) => setForm({ ...form, pricePerM3: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Price per Truck (₹)</label>
              <input
                type="number"
                value={form.pricePerTruck}
                onChange={(e) => setForm({ ...form, pricePerTruck: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {createdProductId && (
          <div className="border-t border-zinc-100 pt-4">
            <h4 className="text-sm font-semibold text-zinc-900 mb-3">Product Image</h4>
            <div className="flex items-start gap-4">
              <div className="relative group">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-zinc-200" />
                ) : (
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400">
                    <ImageIcon className="h-6 w-6 mb-1" />
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-zinc-500">
                <p>Upload after creating the product.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Uploading..." : "Upload Image"}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
