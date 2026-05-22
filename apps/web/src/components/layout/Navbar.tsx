"use client";

import Link from "next/link";
import Image from "next/image";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";

export function Navbar() {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-50 bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo/jhazImprntLogo.png"
                alt="Jhaz-imprints"
                width={160}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link href="/products" className="text-gray-700 hover:text-primary">
                Shop
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              <>
                <Link href="/orders" className="text-sm font-medium text-gray-700 hover:text-primary">
                  My Orders
                </Link>
                <button
                  onClick={() => dispatch(logoutUser())}
                  className="text-sm font-medium text-gray-700 hover:text-error"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-primary">
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
