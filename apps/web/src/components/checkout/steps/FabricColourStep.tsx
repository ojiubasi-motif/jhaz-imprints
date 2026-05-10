/**
 * Fabric & Colour Step — customer selects fabric option and colour.
 */

"use client";

import { useFormContext } from "react-hook-form";
import Image from "next/image";
import type { OrderCreate } from "@jhaz-imprints/shared";
import { useAppSelector } from "@/store/hooks";

export default function FabricColourStep() {
  const { watch, setValue, formState: { errors } } = useFormContext<OrderCreate>();
  const selectedFabric = watch("fabricOptionName");
  const selectedColor = watch("colorName");

  const { currentProduct, isLoading } = useAppSelector((state) => state.products);

  if (isLoading || !currentProduct) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const fabricOptions = currentProduct.fabricOptions || [];
  const colorOptions = currentProduct.colorOptions || [];

  return (
    <div className="space-y-6">
      {/* Fabric Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Fabric</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fabricOptions.map((fabric) => (
            <button
              key={fabric.name}
              type="button"
              onClick={() => setValue("fabricOptionName", fabric.name, { shouldValidate: true })}
              className={`card text-left transition-all ${
                selectedFabric === fabric.name
                  ? "ring-2 ring-primary border-primary bg-blue-50"
                  : "hover:shadow-md"
              } ${!fabric.inStock ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!fabric.inStock}
            >
              {/* Swatch Image */}
              <div className="relative w-full h-20 overflow-hidden rounded mb-3">
                <Image
                  src={fabric.swatchImageUrl}
                  alt={`${fabric.name} swatch`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Fabric Info */}
              <h4 className="font-semibold">{fabric.name}</h4>
              {!fabric.inStock && (
                <p className="text-sm text-error mt-1 font-medium">Out of Stock</p>
              )}
              {fabric.priceModifier > 0 && (
                <p className="text-sm text-secondary mt-2">
                  + ₦{fabric.priceModifier.toLocaleString()}
                </p>
              )}
            </button>
          ))}
        </div>
        {errors.fabricOptionName && (
          <p role="alert" className="text-sm text-error mt-2">
            {errors.fabricOptionName.message}
          </p>
        )}
      </div>

      {/* Colour Selection */}
      {colorOptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Select Colour</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setValue("colorName", color.name, { shouldValidate: true })}
                  className={`relative w-16 h-16 rounded-lg border-4 transition-all ${
                    selectedColor === color.name
                      ? "border-gray-800 ring-2 ring-offset-2 ring-primary"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                  style={{
                    backgroundColor: color.hexCode || "#D1D5DB",
                  }}
                  title={color.name}
                  aria-label={color.name}
                  aria-pressed={selectedColor === color.name}
                >
                  {selectedColor === color.name && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold drop-shadow">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {selectedColor ? `Selected: ${selectedColor}` : "Click a colour to select"}
            </p>
          </div>
          {errors.colorName && (
            <p role="alert" className="text-sm text-error mt-2">
              {errors.colorName.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
