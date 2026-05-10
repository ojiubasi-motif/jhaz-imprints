"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOrderById } from "@/store/slices/ordersSlice";
import Link from "next/link";

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentOrder: order, isLoading } = useAppSelector((state) => state.orders);

  useEffect(() => {
    if (typeof orderId === "string") {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  if (isLoading || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-gray-200 rounded-full mb-4" />
          <div className="h-6 w-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-8">
        <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
        Order Received!
      </h1>
      <p className="text-lg text-muted mb-8">
        Thank you for your order. We've received your request and will begin processing it shortly.
      </p>

      <div className="card bg-gray-50 border-gray-200 p-6 max-w-md mx-auto text-left mb-8">
        <h3 className="text-lg font-semibold border-b pb-3 mb-3">Order Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Order Number</span>
            <span className="font-mono font-medium">{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Amount</span>
            <span className="font-medium">₦{order.totalAmount?.toLocaleString() || "0"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-medium text-yellow-600 capitalize">{order.status?.toLowerCase() || "Pending"}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href={`/orders/${order.id}`} className="btn-secondary px-8 py-3">
          View Order
        </Link>
        <Link href="/products" className="btn-primary px-8 py-3">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
