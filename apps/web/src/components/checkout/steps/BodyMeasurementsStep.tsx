/**
 * Body Measurements Step — collect customer body dimensions.
 */

"use client";

import { useFormContext } from "react-hook-form";
import { useState } from "react";
import type { OrderCreate } from "@jhaz-imprints/shared";
import BodyDiagram from "../BodyDiagram";

type MeasurementField = "chest" | "waist" | "hip" | "shoulder" | "armLength" | "length";

const FIELDS: Array<{
  key: MeasurementField;
  label: string;
  hint: string;
}> = [
  { key: "chest", label: "Bust / Chest", hint: "Fullest part of your chest" },
  { key: "waist", label: "Waist", hint: "Narrowest part of your waist" },
  { key: "hip", label: "Hip", hint: "Fullest part of your hips" },
  { key: "shoulder", label: "Shoulder", hint: "From shoulder to shoulder" },
  { key: "armLength", label: "Arm Length", hint: "From shoulder to wrist" },
  { key: "length", label: "Length", hint: "Full length of garment (shoulder to hem)" },
];

export default function BodyMeasurementsStep() {
  const { register, formState: { errors }, watch } = useFormContext<OrderCreate>();
  const [highlightedPart, setHighlightedPart] = useState<MeasurementField | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Measurements Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Body Measurements (in cm)</h3>

          {FIELDS.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className="block text-sm font-medium mb-1"
              >
                {field.label}
                <span className="text-xs text-muted ml-1">— {field.hint}</span>
              </label>
              <input
                id={field.key}
                type="number"
                min="30"
                max="250"
                step="0.5"
                placeholder="0"
                {...register(field.key)}
                onFocus={() => setHighlightedPart(field.key)}
                onBlur={() => setHighlightedPart(null)}
                className="input w-full"
              />
              {errors[field.key] && (
                <p role="alert" className="text-sm text-error mt-1">
                  {errors[field.key]?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Right: Body Diagram */}
        <div className="flex items-center justify-center">
          <BodyDiagram highlightedPart={highlightedPart} />
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-gray-700">
          💡 <strong>Tip:</strong> Measure over your normal clothing. Use a soft measuring tape
          and keep it snug but not tight.
        </p>
      </div>
    </div>
  );
}
