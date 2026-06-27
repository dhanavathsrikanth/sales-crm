"use client";

import { useState } from "react";
import Link from "next/link";
import { useProducts } from "@/hooks/construction/use-products";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import EmptyState from "@/components/construction-shared/EmptyState";
import { Package, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useProducts({ category, search: search || undefined });

  const categories = [
    { label: "All", value: undefined },
    { label: "AAC Blocks", value: "aac_block" },
    { label: "Red Bricks", value: "red_brick" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="AAC Blocks & Red Bricks catalog"
        action={
          <div className="flex gap-2">
            <Link
              href="/construction/products/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Custom Size
            </Link>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                category === cat.value
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !products || products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="No products yet"
          description="Products will appear here once added."
          action={
            <Link
              href="/construction/products/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Custom Size
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/construction/products/${product.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-emerald-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <Package className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  product.category === "aac_block"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                )}>
                  {product.category === "aac_block" ? "AAC Block" : "Red Brick"}
                </span>
              </div>

              <h3 className="font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                {product.name}
              </h3>
              {product.sizeLabel && (
                <p className="text-sm text-zinc-500 mt-0.5">{product.sizeLabel}</p>
              )}

              <div className="mt-3 space-y-1">
                {product.dimensions && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Dimensions</span>
                    <span className="text-zinc-600 font-medium">{product.dimensions}</span>
                  </div>
                )}
                {product.weightPerUnit && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Weight</span>
                    <span className="text-zinc-600 font-medium">{product.weightPerUnit}</span>
                  </div>
                )}
              </div>

              {(product.pricePerPiece || product.pricePerM3) && (
                <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1">
                  {product.pricePerPiece && (
                    <p className="text-xs text-zinc-500">₹{product.pricePerPiece}/piece</p>
                  )}
                  {product.pricePerM3 && (
                    <p className="text-xs text-zinc-500">₹{product.pricePerM3}/m³</p>
                  )}
                </div>
              )}

              {product.manufacturerName && (
                <p className="mt-2 text-[10px] text-zinc-400">{product.manufacturerName}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
