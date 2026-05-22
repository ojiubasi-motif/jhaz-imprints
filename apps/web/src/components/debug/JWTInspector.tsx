"use client";

import React, { useState, useEffect } from "react";
import { tokenStore } from "@/lib/tokenStore";

/**
 * Development/debugging component to inspect the JWT token.
 * Shows:
 * - Token expiry countdown with progress bar
 * - Decoded payload (claims)
 * - Token status (valid, expiring soon, expired)
 * 
 * Usage: Add to your layout during dev:
 *   {process.env.NODE_ENV === 'development' && <JWTInspector />}
 */
export function JWTInspector() {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [payload, setPayload] = useState<Record<string, any> | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const time = tokenStore.getTimeUntilExpiry();
      setTimeRemaining(time);
      setPayload(tokenStore.decodePayload());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!tokenStore.hasToken()) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-100 border border-gray-300 rounded p-2 text-xs max-w-xs z-40">
        <div className="font-semibold">🔐 JWT Inspector</div>
        <div className="text-gray-600">No token in memory</div>
      </div>
    );
  }

  const secondsRemaining = Math.ceil(timeRemaining / 1000);
  const minutesRemaining = Math.floor(secondsRemaining / 60);

  const isExpiringSoon = timeRemaining < 60 * 1000;
  const isExpired = timeRemaining === 0;

  const barColor = isExpired
    ? "bg-red-500"
    : isExpiringSoon
    ? "bg-yellow-500"
    : "bg-green-500";

  const statusText = isExpired
    ? "Expired"
    : isExpiringSoon
    ? "Expiring soon"
    : "Valid";

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded shadow-lg p-3 text-xs max-w-sm z-40">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="font-semibold">🔐 JWT Inspector</div>
        <div className={`px-2 py-1 rounded text-xs font-semibold ${
          isExpired ? 'bg-red-100 text-red-800' : 
          isExpiringSoon ? 'bg-yellow-100 text-yellow-800' : 
          'bg-green-100 text-green-800'
        }`}>
          {statusText}
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {/* Countdown */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Expires in:</span>
            <span className="font-mono">
              {minutesRemaining}m {secondsRemaining % 60}s
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-200`}
              style={{ width: `${Math.max(0, Math.min(100, (timeRemaining / (payload?.exp ? (payload.exp * 1000 - Date.now()) : 1)) * 100))}%` }}
            />
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && payload && (
          <div className="mt-3 space-y-2 border-t pt-2">
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold mb-1">Payload</div>
              <pre className="text-xs overflow-auto max-h-32">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
            <div className="text-gray-500 text-xs">
              <strong>Tip:</strong> Token lives in memory; never localStorage. Refresh token in httpOnly cookie.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
