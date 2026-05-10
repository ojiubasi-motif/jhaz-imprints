"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CATEGORIES = [
  { value: "", label: "All Products" },
  { value: "wedding-aso-oke", label: "Wedding Aso-Oke" },
  { value: "agbada", label: "Agbada" },
  { value: "kente-gown", label: "Kente Gown" },
  { value: "ankara-casual", label: "Ankara Casual" },
  { value: "other", label: "Other" },
];

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleCategoryChange = (value: string) => {
    router.push(`/products?${createQueryString("category", value)}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => handleCategoryChange(cat.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            currentCategory === cat.value
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
