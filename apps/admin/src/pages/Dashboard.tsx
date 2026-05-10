import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAnalytics } from "@/store/slices/analyticsSlice";
import AnalyticsSummary from "@/components/AnalyticsSummary";

export function Dashboard() {
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h1>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-6 h-32 animate-pulse flex flex-col">
                <div className="h-4 w-1/3 bg-gray-200 rounded mb-4" />
                <div className="h-8 w-1/2 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-900">₦{data?.totalRevenue?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Active Orders</h3>
              <p className="text-3xl font-bold text-gray-900">{data?.activeOrders || '0'}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Customers</h3>
              <p className="text-3xl font-bold text-gray-900">{data?.totalCustomers || '0'}</p>
            </div>
          </div>
        )}

        {/* Existing Analytics Summary component (e.g. charts/graphs) */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4 border-b pb-2">Analytics Details</h2>
          <AnalyticsSummary />
        </div>
      </div>
    </div>
  );
}
