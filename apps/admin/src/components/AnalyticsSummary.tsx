/**
 * Analytics Summary — dashboard with key metrics and charts.
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAppSelector } from "@/store/hooks";

export default function AnalyticsSummary() {
  const { data, isLoading, error } = useAppSelector((state) => state.analytics);

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
    { label: "Total Revenue", value: `₦${(data.totalRevenue || 0).toLocaleString()}`, color: "bg-blue-100" },
    { label: "Orders This Month", value: (data.ordersThisMonth || 0).toString(), color: "bg-green-100" },
    { label: "Average Order Value", value: `₦${(data.averageOrderValue || 0).toLocaleString()}`, color: "bg-purple-100" },
    { label: "Pending Orders", value: (data.pendingOrders || 0).toString(), color: "bg-orange-100" },
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
      <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Revenue (Last 6 Months)</h3>
        {data.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#8B5A2B" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-md">
            No chart data available
          </div>
        )}
      </div>
    </div>
  );
}
