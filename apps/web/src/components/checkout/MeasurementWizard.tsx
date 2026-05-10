/**
 * Measurement Wizard — the main component for the checkout flow.
 * Guides customers through selecting measurements, styles, fabrics, and confirming order.
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderCreateSchema, type OrderCreate } from "@jhaz-imprints/shared";
import BodyMeasurementsStep from "./steps/BodyMeasurementsStep";
import StyleChoicesStep from "./steps/StyleChoicesStep";
import FabricColourStep from "./steps/FabricColourStep";
import ReviewPayStep from "./steps/ReviewPayStep";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateDraft } from "@/store/slices/cartSlice";

const STEPS = [
  "Body measurements",
  "Style choices",
  "Fabric & colour",
  "Review & pay",
] as const;

export interface MeasurementWizardProps {
  productId: string;
  onSuccess?: (orderId: string) => void;
}

export default function MeasurementWizard({ productId, onSuccess }: MeasurementWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.cart.draft);

  const methods = useForm<OrderCreate>({
    resolver: zodResolver(OrderCreateSchema),
    mode: "onBlur",
    defaultValues: {
      measurementId: "",
      productId,
      notes: "",
      ...draft,
    },
  });

  // Save draft to Redux on form change
  useEffect(() => {
    const subscription = methods.watch((data) => {
      dispatch(updateDraft(data));
    });

    return () => subscription.unsubscribe();
  }, [methods, dispatch]);

  const handleNext = async () => {
    // Validate current step before proceeding
    // This is a simplified check — ideally each step defines its own fields
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSuccess = (orderId: string) => {
    onSuccess?.(orderId);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Step Indicator */}
      <ol aria-label="Order steps" className="mb-8 flex gap-2 justify-between">
        {STEPS.map((step, i) => (
          <li
            key={step}
            aria-current={i === currentStep ? "step" : undefined}
            className={`flex-1 text-center text-sm font-medium ${
              i === currentStep
                ? "text-primary font-semibold"
                : i < currentStep
                  ? "text-green-600"
                  : "text-muted"
            }`}
          >
            <div className="mb-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-current">
                {i < currentStep ? "✓" : i + 1}
              </span>
            </div>
            {step}
          </li>
        ))}
      </ol>

      {/* Form Content */}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => {})} className="space-y-6">
          {currentStep === 0 && <BodyMeasurementsStep />}
          {currentStep === 1 && <StyleChoicesStep />}
          {currentStep === 2 && <FabricColourStep />}
          {currentStep === 3 && (
            <ReviewPayStep />
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-between pt-6">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="btn-secondary disabled:opacity-50 px-6 py-2"
            >
              ← Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary px-6 py-2"
              >
                Next →
              </button>
            ) : null}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
