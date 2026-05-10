/**
 * Style Choices Step — customer selects preferred style option.
 */

"use client";

import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import Image from "next/image";
import type { OrderCreate } from "@jhaz-imprints/shared";
import { useAppSelector } from "@/store/hooks";

export default function StyleChoicesStep() {
  const { watch, setValue } = useFormContext<OrderCreate>();
  const currentStyle = watch("styleOptionName");
  
  const { currentProduct, isLoading } = useAppSelector((state) => state.products);

  const handleSelect = (styleName: string) => {
    setValue("styleOptionName", styleName, { shouldValidate: true });
  };

  if (isLoading || !currentProduct) {
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

  const styleOptions = currentProduct.styleOptions || [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Choose Your Style</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {styleOptions.map((style) => (
          <button
            key={style.name}
            type="button"
            onClick={() => handleSelect(style.name)}
            className={`card text-left transition-all ${
              currentStyle === style.name
                ? "ring-2 ring-primary border-primary"
                : "hover:shadow-md"
            }`}
          >
            {/* Preview Image */}
            <div className="relative w-full h-40 overflow-hidden rounded mb-3">
              <Image
                src={style.previewImageUrl}
                alt={style.name}
                fill
                className="object-cover"
              />
            </div>

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
