/**
 * Error Boundary for Checkout Flow
 * Gracefully handles errors during the checkout process
 */

"use client";

import React, { ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CheckoutErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Checkout Error Boundary caught:", error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>

            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Checkout Error
            </h1>

            <p className="text-gray-600 mb-6">
              Something went wrong during checkout. Please try again or contact
              support if the problem persists.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-6 text-left max-h-32 overflow-auto">
                <code className="text-xs text-red-700">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.reset}
                className="flex-1 btn-primary px-4 py-2"
              >
                Try Again
              </button>

              <Link
                href="/"
                className="flex-1 btn-secondary px-4 py-2 text-center"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
