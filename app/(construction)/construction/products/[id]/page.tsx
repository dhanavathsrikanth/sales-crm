"use client";

import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProduct } from "@/hooks/construction/use-products";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import { updateProduct } from "@/lib/actions/construction/products";
import { Upload, ImageIcon } from "lucide-react";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading, refetch } = useProduct(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pricePiece, setPricePiece] = useState("");
  const [priceM3, setPriceM3] = useState("");
  const [priceTruck, setPriceTruck] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (!product) return <div className="text-center py-12 text-zinc-500">Product not found</div>;

  const handleSave = async () => {
    setSaving(true);
    await updateProduct(id, {
      pricePerPiece: pricePiece ? Number(pricePiece) : undefined,
      pricePerM3: priceM3 ? Number(priceM3) : undefined,
      pricePerTruck: priceTruck ? Number(priceTruck) : undefined,
    });
    setSaving(false);
    refetch();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", id);

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
      await updateProduct(id, { imageUrl: url });
      refetch();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const imageUrl = previewUrl || product.imageUrl;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title={product.name}
        subtitle={product.manufacturerName || undefined}
      />

      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {product.category === "aac_block" ? "AAC Block" : "Red Brick"}
          </span>
          {product.isCustom && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              Custom Size
            </span>
          )}
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <h4 className="text-sm font-semibold text-zinc-900 mb-3">Product Image</h4>
          <div className="flex items-start gap-4">
            <div className="relative group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-32 w-32 rounded-lg object-cover border border-zinc-200"
                />
              ) : (
                <div className="h-32 w-32 rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400">
                  <ImageIcon className="h-8 w-8 mb-1" />
                  <span className="text-xs">No image</span>
                </div>
              )}
              <div
                className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 text-sm text-zinc-500">
              <p>Upload a product image (JPEG, PNG, WebP). Max 5MB.</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading..." : "Change Image"}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {product.dimensions && (
            <>
              <div><span className="text-zinc-400">Dimensions</span></div>
              <div className="font-medium text-zinc-900">{product.dimensions}</div>
            </>
          )}
          {product.weightPerUnit && (
            <>
              <div><span className="text-zinc-400">Weight</span></div>
              <div className="font-medium text-zinc-900">{product.weightPerUnit}</div>
            </>
          )}
          {product.density && (
            <>
              <div><span className="text-zinc-400">Density</span></div>
              <div className="font-medium text-zinc-900">{product.density}</div>
            </>
          )}
          {product.strength && (
            <>
              <div><span className="text-zinc-400">Strength</span></div>
              <div className="font-medium text-zinc-900">{product.strength}</div>
            </>
          )}
        </div>

        {!!product.specs && typeof product.specs === "object" && (
          <div className="border-t border-zinc-100 pt-4">
            <h4 className="text-sm font-semibold text-zinc-900 mb-2">Technical Specifications</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {Object.entries(product.specs as Record<string, string>).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-zinc-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-medium text-zinc-900">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {product.applications && product.applications.length > 0 && (
          <div className="border-t border-zinc-100 pt-4">
            <h4 className="text-sm font-semibold text-zinc-900 mb-2">Applications</h4>
            <div className="flex flex-wrap gap-1.5">
              {product.applications.map((app: string) => (
                <span key={app} className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">
                  {app}
                </span>
              ))}
            </div>
          </div>
        )}

        {product.keyFeatures && product.keyFeatures.length > 0 && (
          <div className="border-t border-zinc-100 pt-4">
            <h4 className="text-sm font-semibold text-zinc-900 mb-2">Key Features</h4>
            <div className="flex flex-wrap gap-1.5">
              {product.keyFeatures.map((feature: string) => (
                <span key={feature} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-zinc-100 pt-4">
          <h4 className="text-sm font-semibold text-zinc-900 mb-3">Set Your Prices</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Price per Piece (₹)</label>
              <input
                type="number"
                placeholder={product.pricePerPiece || "Set price"}
                value={pricePiece}
                onChange={(e) => setPricePiece(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Price per m³ (₹)</label>
              <input
                type="number"
                placeholder={product.pricePerM3 || "Set price"}
                value={priceM3}
                onChange={(e) => setPriceM3(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Price per Truck (₹)</label>
              <input
                type="number"
                placeholder={product.pricePerTruck || "Set price"}
                value={priceTruck}
                onChange={(e) => setPriceTruck(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Prices"}
          </button>
        </div>
      </div>

      <button
        onClick={() => router.back()}
        className="text-sm text-zinc-500 hover:text-zinc-700"
      >
        ← Back
      </button>
    </div>
  );
}
