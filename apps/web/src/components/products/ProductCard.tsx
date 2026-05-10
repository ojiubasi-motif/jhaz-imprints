import Link from "next/link";
import Image from "next/image";
import type { IProduct } from "@jhaz-imprints/catalog-db";

export function ProductCard({ product }: { product: IProduct }) {
  const imageUrl = product.images?.[0] || "/placeholder-image.jpg";

  return (
    <Link href={`/products/${product._id || product.slug}`} className="group">
      <div className="card h-full transition-transform hover:-translate-y-1 hover:shadow-lg flex flex-col">
        <div className="aspect-[3/4] w-full overflow-hidden rounded bg-gray-200 mb-4 relative">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover object-center group-hover:opacity-75 transition-opacity"
          />
        </div>
        <div className="flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary">
              {product.name}
            </h3>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 capitalize">
              {product.category.replace(/-/g, " ")}
            </span>
          </div>
          <p className="text-xl font-bold text-secondary mt-auto">
            ₦{product.basePrice.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
