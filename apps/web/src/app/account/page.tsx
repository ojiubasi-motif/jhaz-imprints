/**
 * Account Profile Page
 * User info, settings, and saved measurements
 */

"use client";

import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import Link from "next/link";

export default function AccountProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-amber-50 p-6 text-center">
          <p className="text-amber-800 mb-4">You must be logged in to view your account.</p>
          <Link href="/auth/login" className="btn-primary px-6 py-2">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Account Profile</h1>

      {/* User Info Section */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-6">Account Information</h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b">
            <div>
              <p className="text-sm text-muted">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pb-4 border-b">
            <div>
              <p className="text-sm text-muted">Name</p>
              <p className="font-semibold">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pb-4 border-b">
            <div>
              <p className="text-sm text-muted">Account Role</p>
              <p className="font-semibold">{user.role}</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              disabled
              className="text-gray-400 cursor-not-allowed opacity-50"
            >
              Edit Profile
            </button>
            <p className="text-xs text-muted mt-2">
              Profile editing coming soon
            </p>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-6">Recent Orders</h2>

        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">View your order history</p>
          <Link href="/orders" className="btn-primary px-6 py-2">
            Go to Orders
          </Link>
        </div>
      </div>

      {/* Logout Section */}
      <div className="card border-red-200 bg-red-50">
        <h2 className="text-xl font-semibold mb-4 text-red-800">Danger Zone</h2>

        <button
          onClick={() => {
            dispatch(logout());
            router.push("/");
          }}
          className="text-red-600 hover:text-red-800 font-semibold"
        >
          Logout
        </button>

        <p className="text-xs text-red-700 mt-2">
          You will be logged out and your session will end.
        </p>
      </div>
    </div>
  );
}
