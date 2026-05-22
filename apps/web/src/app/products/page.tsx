"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProducts } from "@/store/slices/productsSlice";
import { ProductGrid } from "@/components/products/ProductGrid";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import type { RootState } from "@/store";

function ProductsContent() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const { items, isLoading } = useAppSelector((state: RootState) => state.products);

  useEffect(() => {
    dispatch(fetchProducts({ category }));
  }, [dispatch, category]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Our Collection</h1>
          <p className="mt-2 text-muted">
            Browse our authentic traditional wear and customize them to your exact measurements.
          </p>
        </div>
      </div>
      
      <CategoryFilter />
      <ProductGrid products={items} isLoading={isLoading} />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading collection...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
