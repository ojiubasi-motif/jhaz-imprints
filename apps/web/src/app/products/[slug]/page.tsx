"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProductById, clearCurrentProduct } from "@/store/slices/productsSlice";
import Link from "next/link";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentProduct: product, isLoading, error } = useAppSelector((state) => state.products);

  useEffect(() => {
    if (typeof slug === "string") {
      dispatch(fetchProductById(slug));
    }
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, slug]);

  if (isLoading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[3/4] w-full rounded bg-gray-200" />
          <div className="space-y-6">
            <div className="h-10 w-3/4 bg-gray-200 rounded" />
            <div className="h-6 w-1/4 bg-gray-200 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link href="/products" className="text-primary hover:underline text-sm">
          &larr; Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
            <img
              src={product.images?.[0] || "/placeholder-image.jpg"}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.slice(1).map((img, idx) => (
                <div key={idx} className="aspect-square w-full overflow-hidden rounded bg-gray-100">
                  <img
                    src={img}
                    alt={`${product.name} thumbnail`}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-2xl font-bold text-secondary">
            ₦{product.basePrice.toLocaleString()}
          </p>
          
          <div className="mt-6 space-y-6">
            <p className="text-base text-gray-700 leading-relaxed">
              {product.description}
            </p>
            
            <div className="border-t border-b border-gray-200 py-4 space-y-2">
              <p className="text-sm">
                <span className="font-semibold text-gray-900">Category:</span>{" "}
                <span className="capitalize text-gray-600">{product.category.replace(/-/g, " ")}</span>
              </p>
              <p className="text-sm">
                <span className="font-semibold text-gray-900">Production Time:</span>{" "}
                <span className="text-gray-600">{product.productionDays} days</span>
              </p>
            </div>
          </div>

          <div className="mt-10 mt-auto">
            <button
              onClick={() => router.push(`/checkout?productId=${product._id || product.slug}`)}
              className="btn-primary w-full py-4 text-lg font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Customize & Order
            </button>
            <p className="mt-4 text-sm text-center text-muted">
              You will be guided through providing your body measurements and choosing fabric and style options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
