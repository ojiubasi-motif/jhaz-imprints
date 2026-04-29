/**
 * Review & Pay Step — final review of selections and order placement.
 */

"use client";

import { useFormContext } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { OrderCreate } from "@jhaz-imprints/shared";
import { useState } from "react";

interface ReviewPayStepProps {
  productId: string;
  onSuccess?: (orderId: string) => void;
}

async function createOrder(payload: OrderCreate & { token: string }) {
  const res = await fetch("/api/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${payload.token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create order");
  }

  return res.json();
}

export default function ReviewPayStep({ productId, onSuccess }: ReviewPayStepProps) {
  const { getValues, formState: { isSubmitting } } = useFormContext<OrderCreate>();
  const router = useRouter();
  const [computedTotal, setComputedTotal] = useState(0);

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      onSuccess?.(data.order.id);
      router.push(`/orders/${data.order.id}/confirmation`);
    },
    onError: (error) => {
      console.error("Order creation failed:", error);
    },
  });

  const handlePlaceOrder = async () => {
    const formData = getValues();
    const token = localStorage.getItem("auth_token") || "";

    createOrderMutation.mutate({
      ...formData,
      token,
    });
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

        {/* Product Summary */}
        <div className="space-y-3 border-b pb-4 mb-4">
          <div className="flex justify-between">
            <span className="text-muted">Product</span>
            <span className="font-semibold">{productId}</span>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Base Price</span>
            <span>₦45,000</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Style Modifier</span>
            <span>₦0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Fabric Modifier</span>
            <span>₦0</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between border-t pt-4">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-secondary">₦45,000</span>
        </div>
      </div>

      {/* Error Display */}
      {createOrderMutation.isError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {createOrderMutation.error instanceof Error
            ? createOrderMutation.error.message
            : "An error occurred while creating your order. Please try again."}
        </div>
      )}

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={createOrderMutation.isPending}
        className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {createOrderMutation.isPending ? "Processing..." : "Place Order"}
      </button>

      <p className="text-xs text-muted text-center">
        By placing an order, you agree to our terms and conditions.
      </p>
    </div>
  );
}
