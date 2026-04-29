/**
 * Order Status Badge — shared component for displaying order status.
 */

import { ReactNode } from "react";

interface OrderStatusBadgeProps {
  status: "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "SHIPPED" | "DELIVERED" | "CANCELLED";
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  CONFIRMED: { color: "bg-blue-100 text-blue-800", label: "Confirmed" },
  IN_PRODUCTION: { color: "bg-orange-100 text-orange-800", label: "In Production" },
  SHIPPED: { color: "bg-purple-100 text-purple-800", label: "Shipped" },
  DELIVERED: { color: "bg-green-100 text-green-800", label: "Delivered" },
  CANCELLED: { color: "bg-red-100 text-red-800", label: "Cancelled" },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps): ReactNode {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}
