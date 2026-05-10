/**
 * Order Status Page
 * Display order details, measurements, and payment status
 */

"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchOrderById } from "@/store/slices/ordersSlice";
import Link from "next/link";
import Image from "next/image";

export default function OrderStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const orderId = params.orderId as string;
  const status = searchParams.get("status");
  const actionParam = searchParams.get("action");

  const { currentOrder, isLoading } = useAppSelector((state) => state.orders);
  const { user } = useAppSelector((state) => state.auth);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId) as any);
    }
  }, [dispatch, orderId]);

  useEffect(() => {
    // Show payment modal if action=complete-payment
    if (actionParam === "complete-payment") {
      setShowPaymentModal(true);
    }
  }, [actionParam]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-amber-50 p-6 text-center">
          <p className="text-amber-800 mb-4">You must be logged in to view orders.</p>
          <Link href="/auth/login" className="btn-primary px-6 py-2">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-800 mb-4">Order not found.</p>
          <Link href="/orders" className="btn-primary px-6 py-2">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (orderStatus: string) => {
    const colors: Record<string, string> = {
      CONFIRMED: "bg-green-50 text-green-800 border-green-200",
      PENDING_PAYMENT: "bg-yellow-50 text-yellow-800 border-yellow-200",
      PROCESSING: "bg-blue-50 text-blue-800 border-blue-200",
      SHIPPED: "bg-purple-50 text-purple-800 border-purple-200",
      DELIVERED: "bg-green-50 text-green-800 border-green-200",
      CANCELLED: "bg-red-50 text-red-800 border-red-200",
    };
    return colors[orderStatus] || "bg-gray-50 text-gray-800 border-gray-200";
  };

  const getStatusBadge = (orderStatus: string) => {
    const badges: Record<string, string> = {
      CONFIRMED: "✅ Confirmed",
      PENDING_PAYMENT: "⏳ Awaiting Payment",
      PROCESSING: "🔄 Processing",
      SHIPPED: "📦 Shipped",
      DELIVERED: "🎉 Delivered",
      CANCELLED: "❌ Cancelled",
    };
    return badges[orderStatus] || orderStatus;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Order #{currentOrder.id}</h1>

      {/* Status Banner */}
      {status && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
          {status === "payment-success" && "✅ Payment successful! Your order is confirmed."}
          {status === "offline-pending" && "💾 Order saved. Complete payment when you reconnect to the internet."}
          {status === "payment-pending" && "⏳ Initializing payment..."}
        </div>
      )}

      {/* Order Overview Card */}
      <div className="card mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Info */}
          <div>
            {currentOrder.product?.images?.[0] && (
              <div className="relative h-80 w-full rounded-lg overflow-hidden bg-gray-100 mb-6">
                <Image
                  src={currentOrder.product.images[0]}
                  alt={currentOrder.product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted">Product</p>
                <p className="font-semibold text-lg">
                  {currentOrder.product?.name || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted">Style</p>
                <p className="font-semibold">{currentOrder.styleOptionName}</p>
              </div>

              <div>
                <p className="text-sm text-muted">Fabric</p>
                <p className="font-semibold">{currentOrder.fabricOptionName}</p>
              </div>

              <div>
                <p className="text-sm text-muted">Colour</p>
                <p className="font-semibold">{currentOrder.colorName || "Not specified"}</p>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="space-y-6">
            {/* Status */}
            <div>
              <p className="text-sm text-muted mb-2">Status</p>
              <div className={`rounded-lg border p-3 font-semibold ${getStatusColor(currentOrder.status)}`}>
                {getStatusBadge(currentOrder.status)}
              </div>
            </div>

            {/* Price Breakdown */}
            <div>
              <p className="text-sm text-muted mb-3">Price Breakdown</p>
              <div className="space-y-2 bg-gray-50 rounded p-4">
                <div className="flex justify-between text-sm">
                  <span>Base Price</span>
                  <span>₦{currentOrder.basePrice?.toLocaleString() || 0}</span>
                </div>

                {currentOrder.styleModifier && currentOrder.styleModifier > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>+ Style Modifier</span>
                    <span>₦{currentOrder.styleModifier.toLocaleString()}</span>
                  </div>
                )}

                {currentOrder.fabricModifier && currentOrder.fabricModifier > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>+ Fabric Modifier</span>
                    <span>₦{currentOrder.fabricModifier.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span className="text-secondary">₦{currentOrder.totalPrice?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            {/* Created Date */}
            <div>
              <p className="text-sm text-muted">Order Date</p>
              <p className="font-semibold">
                {new Date(currentOrder.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Action Buttons */}
            {currentOrder.status === "PENDING_PAYMENT" && (
              <button
                onClick={() => router.push(`/orders/${orderId}?action=complete-payment`)}
                className="btn-primary w-full py-2"
              >
                Complete Payment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Measurements Section */}
      {currentOrder.measurements && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-6">Measurements (cm)</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: "Chest", value: currentOrder.measurements.chest },
              { label: "Waist", value: currentOrder.measurements.waist },
              { label: "Hip", value: currentOrder.measurements.hip },
              { label: "Shoulder", value: currentOrder.measurements.shoulder },
              { label: "Arm Length", value: currentOrder.measurements.armLength },
              { label: "Length", value: currentOrder.measurements.length },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted mb-2">{m.label}</p>
                <p className="text-2xl font-bold text-primary">{m.value} cm</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Links */}
      <div className="flex gap-4">
        <Link href="/orders" className="btn-secondary px-6 py-2">
          Back to Orders
        </Link>
        <Link href="/products" className="btn-secondary px-6 py-2">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
