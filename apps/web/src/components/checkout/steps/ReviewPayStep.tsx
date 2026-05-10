/**
 * Review & Pay Step — final review of selections and order placement.
 * Supports online payment via Paystack and offline "Pay Later" fallback.
 */

"use client";

import { useFormContext } from "react-hook-form";
import { useRouter } from "next/navigation";
import type { OrderCreate } from "@jhaz-imprints/shared";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createOrder, clearCreateError } from "@/store/slices/ordersSlice";
import { clearDraft } from "@/store/slices/cartSlice";
import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { fetchApi } from "@/lib/api";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function ReviewPayStep() {
  const { getValues } = useFormContext<OrderCreate>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { isCreating, createError } = useAppSelector((state) => state.orders);
  const { currentProduct } = useAppSelector((state) => state.products);
  const { user } = useAppSelector((state) => state.auth);

  const [isOnline, setIsOnline] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const paystackRef = useRef<any>(null);

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    dispatch(clearCreateError());
  }, [dispatch]);

  const { basePrice, styleMod, fabricMod, total } = useMemo(() => {
    const formData = getValues();
    let bPrice = currentProduct?.basePrice || 0;
    let sMod = 0;
    let fMod = 0;

    if (currentProduct) {
      const selectedStyle = currentProduct.styleOptions?.find(
        (s) => s.name === formData.styleOptionName
      );
      if (selectedStyle) sMod = selectedStyle.priceModifier;

      const selectedFabric = currentProduct.fabricOptions?.find(
        (f) => f.name === formData.fabricOptionName
      );
      if (selectedFabric) fMod = selectedFabric.priceModifier;
    }

    return {
      basePrice: bPrice,
      styleMod: sMod,
      fabricMod: fMod,
      total: bPrice + sMod + fMod,
    };
  }, [currentProduct, getValues]);

  const handlePayNow = async () => {
    const formData = getValues();
    setIsProcessingPayment(true);

    try {
      // Step 1: Create order (PENDING_PAYMENT status)
      const resultAction = await dispatch(createOrder(formData));

      if (!createOrder.fulfilled.match(resultAction)) {
        throw new Error("Failed to create order");
      }

      const orderId = resultAction.payload.order.id;

      // Step 2: Initialize Paystack payment
      const paymentResponse = await fetchApi(`/orders/${orderId}/payment-intent`, {
        method: "POST",
      });

      if (!paymentResponse.paymentIntent) {
        throw new Error("Failed to initialize payment");
      }

      const { paystackAccessCode, reference } = paymentResponse.paymentIntent;

      // Step 3: Open Paystack modal
      if (!window.PaystackPop) {
        throw new Error("Paystack library not loaded");
      }

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: user?.email,
        amount: total * 100, // Convert to kobo
        ref: reference,
        accessCode: paystackAccessCode,
        onClose: () => {
          console.log("Payment modal closed");
          setIsProcessingPayment(false);
        },
        onSuccess: (response: any) => {
          console.log("Payment successful:", response);
          // Webhook will handle order confirmation
          dispatch(clearDraft());
          router.push(`/orders/${orderId}?status=payment-success`);
        },
      });

      handler.openIframe();
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayLater = async () => {
    const formData = getValues();

    try {
      const resultAction = await dispatch(createOrder(formData));

      if (createOrder.fulfilled.match(resultAction)) {
        dispatch(clearDraft());
        router.push(
          `/orders/${resultAction.payload.order.id}?status=offline-pending&message=payment-deferred`
        );
      }
    } catch (error) {
      console.error("Order creation error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Summary Card */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-6">Order Summary</h3>

        {/* Product Info with Image */}
        {currentProduct?.images && currentProduct.images.length > 0 && (
          <div className="mb-6 relative h-48 w-full rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={currentProduct.images[0]}
              alt={currentProduct.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Order Details */}
        <div className="space-y-3 border-b pb-4 mb-4">
          <div className="flex justify-between">
            <span className="text-muted">Product</span>
            <span className="font-semibold">{currentProduct?.name || "Unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Style</span>
            <span className="font-semibold">{getValues("styleOptionName")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Fabric</span>
            <span className="font-semibold">{getValues("fabricOptionName")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Colour</span>
            <span className="font-semibold">
              {getValues("colorName") || "Not specified"}
            </span>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Base Price</span>
            <span>₦{basePrice.toLocaleString()}</span>
          </div>
          {styleMod > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>+ Style Modifier</span>
              <span>₦{styleMod.toLocaleString()}</span>
            </div>
          )}
          {fabricMod > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>+ Fabric Modifier</span>
              <span>₦{fabricMod.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between border-t pt-4">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-secondary">
            ₦{total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {createError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200"
        >
          ⚠️ {createError}
        </div>
      )}

      {/* Network Status */}
      {!isOnline && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
          📡 You are offline. Payment will be deferred — you can complete it when you reconnect.
        </div>
      )}

      {/* Auth Check */}
      {!user && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 border border-amber-200">
          You must be logged in to place an order.
        </div>
      )}

      {/* Payment Buttons */}
      <div className="space-y-3">
        {isOnline ? (
          <button
            type="button"
            onClick={handlePayNow}
            disabled={isProcessingPayment || isCreating || !user}
            className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessingPayment || isCreating ? "Processing..." : "Pay Now with Paystack"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handlePayLater}
              disabled={isCreating || !user}
              className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating order..." : "Save Order & Pay Later"}
            </button>
            <p className="text-xs text-muted text-center">
              Your order will be saved. Complete payment when you reconnect to the internet.
            </p>
          </>
        )}
      </div>

      <p className="text-xs text-muted text-center">
        By placing an order, you agree to our terms and conditions.
      </p>
    </div>
  );
}

  return (
    <div className="space-y-6">
      {/* Order Summary Card */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-6">Order Summary</h3>

        {/* Product Info with Image */}
        {currentProduct?.images && currentProduct.images.length > 0 && (
          <div className="mb-6 relative h-48 w-full rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={currentProduct.images[0]}
              alt={currentProduct.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Order Details */}
        <div className="space-y-3 border-b pb-4 mb-4">
          <div className="flex justify-between">
            <span className="text-muted">Product</span>
            <span className="font-semibold">{currentProduct?.name || "Unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Style</span>
            <span className="font-semibold">{getValues("styleOptionName")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Fabric</span>
            <span className="font-semibold">{getValues("fabricOptionName")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Colour</span>
            <span className="font-semibold">
              {getValues("colorName") || "Not specified"}
            </span>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Base Price</span>
            <span>₦{basePrice.toLocaleString()}</span>
          </div>
          {styleMod > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>+ Style Modifier</span>
              <span>₦{styleMod.toLocaleString()}</span>
            </div>
          )}
          {fabricMod > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>+ Fabric Modifier</span>
              <span>₦{fabricMod.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between border-t pt-4">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-secondary">
            ₦{total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {createError && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200"
        >
          ⚠️ {createError}
        </div>
      )}

      {/* Network Status */}
      {!isOnline && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
          📡 You are offline. Payment will be deferred — you can complete it when you reconnect.
        </div>
      )}

      {/* Auth Check */}
      {!user && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 border border-amber-200">
          You must be logged in to place an order.
        </div>
      )}

      {/* Payment Buttons */}
      <div className="space-y-3">
        {isOnline ? (
          <button
            type="button"
            onClick={handlePayNow}
            disabled={isProcessingPayment || isCreating || !user}
            className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessingPayment || isCreating ? "Processing..." : "Pay Now with Paystack"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handlePayLater}
              disabled={isCreating || !user}
              className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating order..." : "Save Order & Pay Later"}
            </button>
            <p className="text-xs text-muted text-center">
              Your order will be saved. Complete payment when you reconnect to the internet.
            </p>
          </>
        )}
      </div>

      <p className="text-xs text-muted text-center">
        By placing an order, you agree to our terms and conditions.
      </p>
    </div>
  );
}
