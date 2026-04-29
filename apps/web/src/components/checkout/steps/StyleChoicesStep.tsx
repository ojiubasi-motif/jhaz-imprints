/**
 * Style Choices Step — customer selects preferred style option.
 */

"use client";

import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { OrderCreate } from "@jhaz-imprints/shared";
import type { IStyleOption } from "@jhaz-imprints/catalog-db";

interface StyleChoicesStepProps {
  productId: string;
}

async function fetchProductStyles(productId: string): Promise<IStyleOption[]> {
  const res = await fetch(`/api/v1/products/${productId}`);
  if (!res.ok) throw new Error("Failed to fetch product");
  const product = await res.json();
  return product.styleOptions || [];
}

export default function StyleChoicesStep({ productId }: StyleChoicesStepProps) {
  const { watch, setValue } = useFormContext<OrderCreate>();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: styleOptions = [], isLoading } = useQuery({
    queryKey: ["product", productId, "styles"],
    queryFn: () => fetchProductStyles(productId),
  });

  const handleSelect = (styleName: string) => {
    setSelected(styleName);
    // Store in form context if needed
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Choose Your Style</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Choose Your Style</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {styleOptions.map((style) => (
          <button
            key={style.name}
            onClick={() => handleSelect(style.name)}
            className={`card text-left transition-all ${
              selected === style.name
                ? "ring-2 ring-primary border-primary"
                : "hover:shadow-md"
            }`}
          >
            {/* Preview Image */}
            <img
              src={style.previewImageUrl}
              alt={style.name}
              className="w-full h-40 object-cover rounded mb-3"
            />

            {/* Style Info */}
            <h4 className="font-semibold">{style.name}</h4>
            {style.description && (
              <p className="text-sm text-muted mt-1">{style.description}</p>
            )}

            {/* Price Modifier */}
            <div className="mt-3 text-sm">
              {style.priceModifier > 0 ? (
                <span className="text-secondary font-semibold">
                  + ₦{style.priceModifier.toLocaleString()}
                </span>
              ) : (
                <span className="text-muted">No additional cost</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
