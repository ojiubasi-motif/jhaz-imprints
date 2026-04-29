/**
 * Order Queue — tailor view for managing order production.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { OrderStatusBadge } from "../components/OrderStatusBadge";

interface Order {
  id: string;
  userId: string;
  measurement: {
    chest?: number;
    waist?: number;
    hip?: number;
  };
  user: { firstName?: string; lastName?: string };
  status: "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  createdAt: string;
}

async function fetchOrders(token: string): Promise<Order[]> {
  const res = await fetch("/api/v1/admin/orders?status=CONFIRMED,IN_PRODUCTION", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

async function updateOrderStatus(
  orderId: string,
  status: string,
  token: string
): Promise<void> {
  const res = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
}

export function OrderQueue() {
  const token = localStorage.getItem("auth_token") || "";
  const queryClient = useQueryClient();
  const [sortBy] = useState<"date" | "status">("date");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "queue"],
    queryFn: () => fetchOrders(token),
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "queue"] });
    },
  });

  // Sort orders by creation date (most urgent first)
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Order Queue</h1>

      {sortedOrders.length === 0 ? (
        <div className="card text-center py-12 text-muted">
          <p>No orders to process right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Order Info */}
                <div>
                  <p className="text-xs text-muted uppercase">Customer</p>
                  <p className="text-lg font-semibold">
                    {order.user.firstName} {order.user.lastName}
                  </p>
                  <p className="text-sm text-muted mt-2">Order: #{order.id.slice(0, 8)}</p>
                </div>

                {/* Measurements */}
                <div>
                  <p className="text-xs text-muted uppercase">Measurements</p>
                  <div className="space-y-1 text-sm">
                    {order.measurement.chest && (
                      <p>Chest: <strong>{order.measurement.chest} cm</strong></p>
                    )}
                    {order.measurement.waist && (
                      <p>Waist: <strong>{order.measurement.waist} cm</strong></p>
                    )}
                    {order.measurement.hip && (
                      <p>Hip: <strong>{order.measurement.hip} cm</strong></p>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-muted uppercase mb-2">Status</p>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Status Update Dropdown */}
                  <select
                    value={order.status}
                    onChange={(e) =>
                      statusMutation.mutate({
                        orderId: order.id,
                        status: e.target.value,
                      })
                    }
                    disabled={statusMutation.isPending}
                    className="input mt-2 text-sm"
                  >
                    <option value="IN_PRODUCTION">In Production</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
