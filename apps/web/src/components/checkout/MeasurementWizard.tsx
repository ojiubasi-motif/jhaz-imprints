/**
 * Measurement Wizard — the main component for the checkout flow.
 * Guides customers through selecting measurements, styles, fabrics, and confirming order.
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
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
    mode: "onChange",
    defaultValues: {
      measurementId: "",
      notes: "",
      ...(draft?.productId === productId ? draft : {}),
      productId,
      // Force fresh selection by overriding stale "Standard" defaults from previous sessions
      styleOptionName: (draft?.productId === productId && draft.styleOptionName !== "Standard") ? draft.styleOptionName : "",
      fabricOptionName: (draft?.productId === productId && draft.fabricOptionName !== "Standard") ? draft.fabricOptionName : "",
      colorName: (draft?.productId === productId && draft.colorName !== "Original") ? draft.colorName : "",
    },
  });

  const { control } = methods;
  const watchedMeasurementId = useWatch({ control, name: "measurementId" });
  const watchedStyle = useWatch({ control, name: "styleOptionName" });
  const watchedFabric = useWatch({ control, name: "fabricOptionName" });
  const watchedColor = useWatch({ control, name: "colorName" });

  const { currentProduct, isLoading: productLoading } = useAppSelector((state) => state.products);
  
  // NOTE: All automatic fallbacks for style, fabric, and color have been removed.
  // We handle "no options" cases in the step UI by showing a message, 
  // but the user still needs a value to pass validation.
  // For products with NO options, we now set the "Standard" value ONLY when the step is mounted 
  // AND no choice exists, to satisfy validation without auto-selecting for configurable products.

  // Save draft to Redux on form change
  useEffect(() => {
    const subscription = methods.watch((data) => {
      dispatch(updateDraft(data));
    });

    return () => subscription.unsubscribe();
  }, [methods, dispatch]);

  const handleNext = async () => {
    let isValid = true;

    if (currentStep === 0) {
      isValid = await methods.trigger("measurementId");
    } else if (currentStep === 1) {
      isValid = await methods.trigger("styleOptionName");
    } else if (currentStep === 2) {
      const fabricValid = await methods.trigger("fabricOptionName");
      const colorValid = await methods.trigger("colorName");
      isValid = fabricValid && colorValid;
    }

    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 0) return !watchedMeasurementId;
    if (currentStep === 1) {
      // If no style options exist, we allow proceeding (value will be set in step component)
      const hasStyleOptions = currentProduct?.styleOptions && currentProduct.styleOptions.length > 0;
      return hasStyleOptions ? !watchedStyle : false;
    }
    if (currentStep === 2) {
      const hasFabricOptions = currentProduct?.fabricOptions && currentProduct.fabricOptions.length > 0;
      const hasColorOptions = currentProduct?.colorOptions && currentProduct.colorOptions.length > 0;
      
      let fabricMissing = hasFabricOptions ? !watchedFabric : false;
      let colorMissing = hasColorOptions ? !watchedColor : false;
      
      return fabricMissing || colorMissing;
    }
    return false;
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
                disabled={isNextDisabled()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 transition-all"
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
