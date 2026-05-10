/**
 * Product Editor — create and edit products with images and options.
 */

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { ImageUploader, type UploadedImage } from "../components/ImageUploader";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createAdminProduct, clearSaveError } from "@/store/slices/productsSlice";

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

export function ProductEditor() {
  const dispatch = useAppDispatch();
  const { isSaving, saveError } = useAppSelector((state) => state.products);
  const [productImages, setProductImages] = useState<UploadedImage[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
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

  const onSubmit = async (data: ProductFormData) => {
    setLocalError(null);
    dispatch(clearSaveError());

    if (productImages.length === 0) {
      setLocalError("Please upload at least one product image");
      return;
    }
    
    const resultAction = await dispatch(createAdminProduct({
      ...data,
      images: productImages
    }));

    if (createAdminProduct.fulfilled.match(resultAction)) {
      alert("Product saved successfully!");
      reset();
      setProductImages([]);
    }
  };

  const displayError = localError || saveError;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Product Editor</h1>

      {displayError && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 mb-6 border border-red-200 text-red-700">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-100 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              {...register("name")}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
              placeholder="e.g., Traditional Wedding Aso-oke"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select {...register("category")} className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border bg-white">
              <option value="wedding-aso-oke">Wedding Aso-oke</option>
              <option value="agbada">Agbada</option>
              <option value="kente-gown">Kente Gown</option>
              <option value="ankara-casual">Ankara Casual</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₦)</label>
            <input
              {...register("basePrice", { valueAsNumber: true })}
              type="number"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
              placeholder="45000"
            />
            {errors.basePrice && <p className="text-red-600 text-sm mt-1">{errors.basePrice.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register("description")}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
              rows={4}
              placeholder="Detailed product description..."
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
          <ImageUploader
            label="Product Gallery Images"
            existingImages={productImages}
            onImagesChange={setProductImages}
            maxFiles={10}
            isPrimary={true}
          />
        </div>

        {/* SEO */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-100 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">SEO Metadata</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              {...register("seoMeta.title")}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
              placeholder="SEO title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register("seoMeta.description")}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
              rows={2}
              placeholder="Meta description for search results"
            />
          </div>
        </div>

        {/* Fabric Options */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-semibold text-gray-900">Fabric Options</h2>
            <button
              type="button"
              onClick={() => addFabric({ name: "", priceModifier: 0, swatchImageUrl: "", inStock: true })}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none"
            >
              + Add Fabric
            </button>
          </div>

          <div className="space-y-4">
            {fabricFields.map((field, idx) => (
              <div key={field.id} className="border border-gray-200 rounded p-4 bg-gray-50">
                <input
                  type="text"
                  placeholder="Fabric name"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border mb-2"
                  defaultValue={field.name}
                />
                <input
                  type="number"
                  placeholder="Price modifier"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                  defaultValue={field.priceModifier}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}
