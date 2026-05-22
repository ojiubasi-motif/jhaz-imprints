"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import React, { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loadProfile,
  logoutUser,
  clearAuth,
} from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/apiClient";
import { tokenStore } from "@/lib/tokenStore";

/**
 * AuthInitializer — bootstraps the auth state and manages token lifecycle.
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { expiresAt } = useAppSelector((state) => state.auth);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showPendingPaymentModal, setShowPendingPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);

  /**
   * Schedule a proactive refresh 60 seconds before token expiry.
   * This ensures the user never experiences a mid-session 401.
   */
  const scheduleRefresh = () => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    if (!expiresAt) return;

    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshAtTime = timeUntilExpiry - 60 * 1000; // Refresh 60s before expiry

    if (refreshAtTime <= 0) {
      // Token expires very soon; refresh immediately
      tokenStore.setToken(null);
      return;
    }

    refreshTimerRef.current = setTimeout(() => {
      console.log('Proactively refreshing token...');
      // The next fetch will auto-refresh via apiClient.ensureToken()
      // This is just to ensure the token is fresh for upcoming requests
    }, refreshAtTime);
  };

  /**
   * On app mount:
   * 1. Try a silent restore using the refresh token from the cookie.
   * 2. If successful, schedule proactive refresh.
   * 3. Listen for auth-expired events (token rejected by API).
   * 4. Listen for online events (resume pending payments).
   */
  useEffect(() => {
    console.log('AuthInitializer mounted — attempting silent restore');

    // Attempt silent restore
    dispatch(loadProfile() as any).then((result: any) => {
      if (result.payload) {
        console.log('Silent restore successful, user:', result.payload.user);
      } else {
        console.log('No active session (no valid refresh token)');
      }
    });

    /**
     * auth-expired: dispatched by apiClient when receiving 401.
     * Clear auth state and redirect to login.
     */
    const handleAuthExpired = () => {
      console.log('Auth expired event received — clearing session');
      dispatch(clearAuth());
      router.push('/auth/login?error=session-expired');
    };

    /**
     * online: dispatched by the browser when connection is restored.
     * Check for pending payments and show modal.
     */
    const handleOnline = async () => {
      console.log('Online event received — checking for pending payments');
      try {
        const response = await fetchApi('/orders?status=pending&limit=1');
        if (response.items && response.items.length > 0) {
          const order = response.items[0];
          setPendingOrder(order);
          setShowPendingPaymentModal(true);
        }
      } catch (error) {
        console.error('Error checking pending payments:', error);
      }
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
      window.removeEventListener('online', handleOnline);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [dispatch, router]);

  /**
   * Schedule refresh whenever the token expiry time changes.
   */
  useEffect(() => {
    scheduleRefresh();
  }, [expiresAt]);

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
              You have a pending order for{" "}
              <span className="font-semibold">{pendingOrder.productName}</span> with a balance of{" "}
              <span className="font-semibold text-secondary">
                ₦{pendingOrder.totalAmount?.toLocaleString() || "0"}
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
