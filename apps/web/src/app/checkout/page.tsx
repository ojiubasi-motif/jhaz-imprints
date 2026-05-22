"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import MeasurementWizard from "@/components/checkout/MeasurementWizard";
import { CheckoutErrorBoundary } from "@/components/checkout/CheckoutErrorBoundary";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchProductById, clearCurrentProduct } from "@/store/slices/productsSlice";
import type { RootState } from "@/store";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Only redirect if we've finished loading AND still have no user
    if (!isLoading && !user) {
      router.push("/auth/login?redirect=/checkout");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId));
    }
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, productId]);

  if (!productId) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">No product selected</h1>
        <button onClick={() => router.push("/products")} className="text-primary hover:underline">
          Go back to products
        </button>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-muted">Loading your session...</p>
        <div className="mt-4 inline-block">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
      <p className="text-muted mb-8">
        Follow the steps below to customize and order your bespoke garment.
      </p>

      <MeasurementWizard productId={productId} />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <CheckoutErrorBoundary>
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <CheckoutContent />
        </Suspense>
      </CheckoutErrorBoundary>
    </main>
  );
}
