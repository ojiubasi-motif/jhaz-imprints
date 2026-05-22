import Link from "next/link";
import { format } from "date-fns";

export function OrderCard({ order }: { order: any }) {
  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b">
        <div>
          <p className="text-sm text-muted mb-1">
            Order Placed: <span className="font-semibold text-gray-900">{format(new Date(order.createdAt || Date.now()), "MMM d, yyyy")}</span>
          </p>
          <p className="text-sm text-muted">
            Order ID: <span className="font-mono">{order.id}</span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize
            ${(order.status === 'COMPLETED' || order.status === 'CONFIRMED') ? 'bg-green-100 text-green-800' : 
              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-blue-100 text-blue-800'}`}
          >
            {order.status.toLowerCase()}
          </span>
          <p className="text-lg font-bold text-secondary mt-1">
            ₦{order.totalAmount?.toLocaleString() || "0"}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Product Image */}
        <div className="h-20 w-20 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden relative">
          {order.product?.images?.[0] ? (
            <img 
              src={order.product.images[0]} 
              alt={order.product.name}
              className="w-full h-full object-cover" 
            />
          ) : (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{order.product?.name || "Custom Tailored Garment"}</h4>
          <p className="text-sm text-muted mt-1">
            Style: {order.styleOptionName || "Standard"} <br />
            Fabric: {order.fabricOptionName || "Standard"}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t flex justify-end">
        <Link href={`/orders/${order.id}`} className="text-sm font-medium text-primary hover:underline">
          View Details
        </Link>
      </div>
    </div>
  );
}
