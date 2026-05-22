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
  const { watch, setValue, formState: { errors } } = useFormContext<OrderCreate>();
  const currentStyle = watch("styleOptionName");
  
  const { currentProduct, isLoading } = useAppSelector((state) => state.products);
  const productId = watch("productId");

  const handleSelect = (styleName: string) => {
    setValue("styleOptionName", styleName);
  };

  if (isLoading || !currentProduct || (String(currentProduct._id) !== productId && currentProduct.slug !== productId)) {
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

  useEffect(() => {
    if (styleOptions.length === 0 && !currentStyle && !isLoading) {
      setValue("styleOptionName", "Standard");
    }
  }, [styleOptions, currentStyle, isLoading, setValue]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Choose Your Style</h3>
        <span className="text-xs font-medium text-error">* Required</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {styleOptions.length > 0 ? (
          styleOptions.map((style) => (
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
          ))
        ) : (
          <div className="col-span-full py-8 px-6 text-center bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
            <p className="text-blue-800 font-medium">Standard Configuration</p>
            <p className="text-sm text-blue-600 mt-1">This product comes in a standard style as shown in the main image. No additional selection is required.</p>
          </div>
        )}
      </div>
      
      {!currentStyle && styleOptions.length > 0 && (
        <p className="text-sm text-amber-600 mt-2 italic">
          Please select a style above to enable the next step.
        </p>
      )}

      {errors.styleOptionName && (
        <p role="alert" className="text-sm text-error mt-2">
          {errors.styleOptionName.message || "Please select a style choice."}
        </p>
      )}
    </div>
  );
}
