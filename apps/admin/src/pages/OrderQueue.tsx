/**
 * Order Queue — view for managing orders.
 */

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAllOrders, updateOrderStatus, setStatusFilter } from '@/store/slices/ordersSlice';
import { format } from 'date-fns';

export function OrderQueue() {
  const dispatch = useAppDispatch();
  const { items, isLoading, error, statusFilter } = useAppSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await dispatch(updateOrderStatus({ id, status: newStatus }));
  };

  const filteredItems = statusFilter === 'ALL' 
    ? items 
    : items.filter(order => order.status === statusFilter);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Queue</h1>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map(status => (
            <button
              key={status}
              onClick={() => dispatch(setStatusFilter(status))}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === status 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-lg shadow animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {filteredItems.map((order) => (
              <li key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      Order #{order.id}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy HH:mm") : 'Unknown date'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-lg font-bold text-gray-900 mb-2">
                      ₦{order.totalAmount?.toLocaleString() || '0'}
                    </p>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`text-sm rounded-full px-3 py-1 font-medium border-0 ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6
                        ${order.status === 'COMPLETED' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                          order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                          'bg-blue-50 text-blue-700 ring-blue-700/10'}`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
                
                {/* Additional details could go here */}
                <div className="mt-4 flex gap-4 text-sm text-gray-500 bg-gray-50 p-3 rounded">
                  <div><span className="font-semibold text-gray-700">Style:</span> {order.styleOptionName || 'N/A'}</div>
                  <div><span className="font-semibold text-gray-700">Fabric:</span> {order.fabricOptionName || 'N/A'}</div>
                </div>
              </li>
            ))}
            
            {filteredItems.length === 0 && (
              <li className="p-8 text-center text-gray-500">
                No orders found matching this filter.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
