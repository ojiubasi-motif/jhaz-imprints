"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyOrders, clearError } from "@/store/slices/ordersSlice";
import { OrderCard } from "@/components/orders/OrderCard";
import { useRouter, useSearchParams } from "next/navigation";
import type { RootState } from "@/store";

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const orderId = searchParams.get("orderId");
  const { items, isLoading, error } = useAppSelector((state: RootState) => state.orders);
  const { user, isLoading: authLoading } = useAppSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?redirect=/orders");
      return;
    }
    dispatch(clearError());
    dispatch(fetchMyOrders());
  }, [dispatch, user, router, authLoading]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 animate-pulse bg-gray-100 h-10 w-48 rounded" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-40 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null; // Redirecting

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {status === "success" && (
        <div role="alert" className="rounded-lg bg-green-50 p-4 text-sm text-green-700 mb-6 border border-green-200">
          🎉 Payment successful! Your order <strong>#{orderId?.slice(-6).toUpperCase()}</strong> has been placed.
        </div>
      )}

      {status === "verifying" && (
        <div role="alert" className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 mb-6 border border-blue-200">
          ⌛ We're verifying your payment. Your order status will update shortly.
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-40 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't placed any orders yet.</p>
          <div className="mt-6">
            <button
              onClick={() => router.push("/products")}
              className="btn-primary px-4 py-2"
            >
              Start Shopping
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
