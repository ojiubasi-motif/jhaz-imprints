/**
 * Analytics Summary — dashboard with key metrics and charts.
 */

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  totalRevenue: number;
  ordersThisMonth: number;
  averageOrderValue: number;
  pendingOrders: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch("/api/v1/admin/analytics", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export function AnalyticsSummary() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load analytics. Please try again later.
      </div>
    );
  }

  const metrics = [
    { label: "Total Revenue", value: `₦${data.totalRevenue.toLocaleString()}`, color: "bg-blue-100" },
    { label: "Orders This Month", value: data.ordersThisMonth.toString(), color: "bg-green-100" },
    { label: "Average Order Value", value: `₦${data.averageOrderValue.toLocaleString()}`, color: "bg-purple-100" },
    { label: "Pending Orders", value: data.pendingOrders.toString(), color: "bg-orange-100" },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-lg p-6 ${metric.color}`}>
            <p className="text-sm font-medium text-gray-700">{metric.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Revenue (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#8B5A2B" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
