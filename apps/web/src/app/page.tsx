"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProducts } from "@/store/slices/productsSlice";
import { ProductCard } from "@/components/products/ProductCard";

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { items, isLoading } = useAppSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts({}));
  }, [dispatch]);

  // Just grab first 4 products for featured
  const featuredProducts = items.slice(0, 4);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1606293459218-198305c215e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="African Fabric Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            <span className="block text-secondary mb-2">Authentic Elegance.</span>
            <span className="block">Tailored for You.</span>
          </h1>
          <p className="mt-4 text-xl max-w-2xl text-gray-200 mb-10">
            Experience the finest Nigerian traditional wear. From majestic Agbadas to stunning Wedding Aso-Oke, customized precisely to your measurements.
          </p>
          <div className="flex gap-4 flex-col sm:flex-row">
            <Link
              href="/products"
              className="bg-secondary text-gray-900 px-8 py-4 rounded-md font-bold text-lg hover:bg-yellow-500 transition-colors shadow-lg"
            >
              Shop Collection
            </Link>
            <Link
              href="/auth/register"
              className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-md font-bold text-lg hover:bg-white/20 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Featured Arrivals</h2>
              <p className="text-muted mt-2">Discover our most popular traditional styles.</p>
            </div>
            <Link href="/products" className="text-primary font-semibold hover:underline hidden sm:block">
              View All &rarr;
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse flex flex-col">
                  <div className="aspect-[3/4] w-full rounded bg-gray-200 mb-4" />
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-1/4 bg-gray-200 rounded mt-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.slug || product._id} product={product} />
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="btn-secondary w-full py-3">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-muted mt-4 max-w-2xl mx-auto">
              Getting your custom-tailored traditional attire is easier than ever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Choose Your Style</h3>
              <p className="text-muted">Browse our collection and select your preferred garment design, fabric, and color.</p>
            </div>
            <div>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Enter Measurements</h3>
              <p className="text-muted">Use our interactive guide to provide your exact body measurements for a perfect fit.</p>
            </div>
            <div>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">We Tailor & Deliver</h3>
              <p className="text-muted">Our expert tailors craft your garment with precision and deliver it straight to your door.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
