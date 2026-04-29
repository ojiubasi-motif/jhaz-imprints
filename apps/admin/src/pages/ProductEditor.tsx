/**
 * Product Editor — create and edit products with images and options.
 */

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ImageUploader, type UploadedImage } from "../components/ImageUploader";

const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.enum(["wedding-aso-oke", "agbada", "kente-gown", "ankara-casual", "other"]),
  description: z.string().min(1, "Description is required"),
  basePrice: z.number().positive("Price must be positive"),
  productionDays: z.number().positive("Production days must be positive"),
  seoMeta: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    keywords: z.array(z.string()),
  }),
});

type ProductFormData = z.infer<typeof ProductSchema>;

async function saveProduct(data: ProductFormData & { images: UploadedImage[] }, token: string) {
  const res = await fetch("/api/v1/admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save product");
  return res.json();
}

export function ProductEditor() {
  const token = localStorage.getItem("auth_token") || "";
  const [productImages, setProductImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      category: "wedding-aso-oke",
      description: "",
      basePrice: 0,
      productionDays: 14,
      seoMeta: {
        title: "",
        description: "",
        keywords: [],
      },
    },
  });

  const { fields: fabricFields, append: addFabric } = useFieldArray({
    control,
    name: "fabricOptions" as any,
  });

  const { fields: styleFields, append: addStyle } = useFieldArray({
    control,
    name: "styleOptions" as any,
  });

  const saveMutation = useMutation({
    mutationFn: (data: ProductFormData) =>
      saveProduct(
        { ...data, images: productImages },
        token
      ),
    onSuccess: () => {
      setError(null);
      alert("Product saved successfully!");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to save product");
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (productImages.length === 0) {
      setError("Please upload at least one product image");
      return;
    }
    saveMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Product Editor</h1>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input
              {...register("name")}
              className="input w-full"
              placeholder="e.g., Traditional Wedding Aso-oke"
            />
            {errors.name && <p className="text-error text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select {...register("category")} className="input w-full">
              <option value="wedding-aso-oke">Wedding Aso-oke</option>
              <option value="agbada">Agbada</option>
              <option value="kente-gown">Kente Gown</option>
              <option value="ankara-casual">Ankara Casual</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Base Price (₦)</label>
            <input
              {...register("basePrice", { valueAsNumber: true })}
              type="number"
              className="input w-full"
              placeholder="45000"
            />
            {errors.basePrice && <p className="text-error text-sm mt-1">{errors.basePrice.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register("description")}
              className="input w-full"
              rows={4}
              placeholder="Detailed product description..."
            />
            {errors.description && <p className="text-error text-sm mt-1">{errors.description.message}</p>}
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <ImageUploader
            label="Product Gallery Images"
            existingImages={productImages}
            onImagesChange={setProductImages}
            maxFiles={10}
            isPrimary={true}
          />
        </div>

        {/* SEO */}
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">SEO Metadata</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              {...register("seoMeta.title")}
              className="input w-full"
              placeholder="SEO title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register("seoMeta.description")}
              className="input w-full"
              rows={2}
              placeholder="Meta description for search results"
            />
          </div>
        </div>

        {/* Fabric Options */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Fabric Options</h2>
            <button
              type="button"
              onClick={() => addFabric({ name: "", priceModifier: 0, swatchImageUrl: "", inStock: true })}
              className="btn-secondary px-4 py-2"
            >
              + Add Fabric
            </button>
          </div>

          <div className="space-y-4">
            {fabricFields.map((field, idx) => (
              <div key={field.id} className="border rounded p-4">
                <input
                  type="text"
                  placeholder="Fabric name"
                  className="input w-full mb-2"
                  defaultValue={field.name}
                />
                <input
                  type="number"
                  placeholder="Price modifier"
                  className="input w-full"
                  defaultValue={field.priceModifier}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="btn-primary w-full py-3 font-semibold"
        >
          {saveMutation.isPending ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}
