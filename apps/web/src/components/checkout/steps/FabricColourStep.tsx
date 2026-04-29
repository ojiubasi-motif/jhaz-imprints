/**
 * Fabric & Colour Step — customer selects fabric option and colour.
 */

"use client";

import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { OrderCreate } from "@jhaz-imprints/shared";
import type { IFabricOption, IColorOption } from "@jhaz-imprints/catalog-db";

interface FabricColourStepProps {
  productId: string;
}

async function fetchProductOptions(productId: string) {
  const res = await fetch(`/api/v1/products/${productId}`);
  if (!res.ok) throw new Error("Failed to fetch product");
  const product = await res.json();
  return {
    fabricOptions: product.fabricOptions || [],
    colorOptions: product.colorOptions || [],
  };
}

export default function FabricColourStep({ productId }: FabricColourStepProps) {
  const { watch, setValue } = useFormContext<OrderCreate>();
  const [selectedFabric, setSelectedFabric] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["product", productId, "options"],
    queryFn: () => fetchProductOptions(productId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const { fabricOptions = [], colorOptions = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Fabric Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Fabric</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fabricOptions.map((fabric) => (
            <button
              key={fabric.name}
              onClick={() => setSelectedFabric(fabric.name)}
              className={`card text-left transition-all ${
                selectedFabric === fabric.name
                  ? "ring-2 ring-primary border-primary"
                  : "hover:shadow-md"
              }`}
              disabled={!fabric.inStock}
            >
              {/* Swatch Image */}
              <img
                src={fabric.swatchImageUrl}
                alt={`${fabric.name} swatch`}
                className="w-full h-20 object-cover rounded mb-3"
              />

              {/* Fabric Info */}
              <h4 className="font-semibold">{fabric.name}</h4>
              {!fabric.inStock && (
                <p className="text-sm text-error mt-1">Out of Stock</p>
              )}
              {fabric.priceModifier > 0 && (
                <span className="text-sm text-secondary">
                  + ₦{fabric.priceModifier.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Colour Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Colour</h3>
        <div className="flex flex-wrap gap-4">
          {colorOptions.map((color) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color.name)}
              className={`relative w-16 h-16 rounded-full border-4 transition-all ${
                selectedColor === color.name
                  ? "ring-4 ring-primary border-primary"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              style={{ backgroundColor: color.hexCode || "#D1D5DB" }}
              title={color.name}
              aria-label={color.name}
            >
              {selectedColor === color.name && (
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
