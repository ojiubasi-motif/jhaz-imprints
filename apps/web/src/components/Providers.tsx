"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import React, { useEffect, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { loadProfile, logout } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showPendingPaymentModal, setShowPendingPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);

  useEffect(() => {
    // Load profile on app initialization
    dispatch(loadProfile() as any).catch(() => {
      // Profile load failed - likely no auth cookie
    });

    // Listen for auth expired events
    const handleAuthExpired = () => {
      dispatch(logout());
      router.push('/auth/login?error=session-expired');
    };

    window.addEventListener('auth-expired', handleAuthExpired);

    // Check for pending payments when coming back online
    const handleOnline = async () => {
      try {
        const response = await fetchApi('/orders?status=pending_payment&take=1');
        if (response.orders && response.orders.length > 0) {
          const order = response.orders[0];
          setPendingOrder(order);
          setShowPendingPaymentModal(true);
        }
      } catch (error) {
        console.error('Error checking for pending payments:', error);
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
      window.removeEventListener('online', handleOnline);
    };
  }, [dispatch, router]);

  const handleResumPayment = () => {
    if (pendingOrder) {
      router.push(`/orders/${pendingOrder.id}?action=complete-payment`);
      setShowPendingPaymentModal(false);
    }
  };

  const handleDismiss = () => {
    setShowPendingPaymentModal(false);
  };

  return (
    <>
      {children}
      
      {/* Pending Payment Modal */}
      {showPendingPaymentModal && pendingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-semibold">Incomplete Payment</h2>
            <p className="text-gray-600">
              You have a pending order for {pendingOrder.productName} with a balance of{' '}
              <span className="font-semibold text-secondary">
                ₦{pendingOrder.totalPrice.toLocaleString()}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Complete the payment to confirm your order.
            </p>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleDismiss}
                className="flex-1 btn-secondary px-4 py-2"
              >
                Maybe Later
              </button>
              <button
                onClick={handleResumPayment}
                className="flex-1 btn-primary px-4 py-2"
              >
                Complete Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
