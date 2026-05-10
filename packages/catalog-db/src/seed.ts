/**
 * Sample product fixtures for the Jhaz-imprints catalog.
 * These can be used for testing and as examples of the product schema.
 */

export const SAMPLE_PRODUCTS = [
  {
    name: "Traditional Wedding Aso-oke",
    slug: "traditional-wedding-aso-oke",
    category: "wedding-aso-oke" as const,
    description:
      "Exquisite hand-woven Aso-oke fabric perfect for traditional weddings. " +
      "Features authentic patterns and premium quality. Available in multiple colors and styles.",
    basePrice: 45000,
    images: [
      "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&q=80",
      "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80",
    ],
    fabricOptions: [
      {
        name: "Standard Aso-oke",
        priceModifier: 0,
        swatchImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
        inStock: true,
      },
      {
        name: "Premium Aso-oke",
        priceModifier: 10000,
        swatchImageUrl: "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=200&q=80",
        inStock: true,
      },
      {
        name: "Gold Threaded Aso-oke",
        priceModifier: 20000,
        swatchImageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&q=80",
        inStock: false,
      },
    ],
    colorOptions: [
      {
        name: "Royal Blue",
        hexCode: "#4169E1",
        imageUrl: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=200&q=80",
      },
      {
        name: "Gold",
        hexCode: "#FFD700",
        imageUrl: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=200&q=80",
      },
      {
        name: "Burgundy",
        hexCode: "#800020",
        imageUrl: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=200&q=80",
      },
    ],
    styleOptions: [
      {
        name: "Classic Cut",
        priceModifier: 0,
        previewImageUrl: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400&q=80",
        description: "Traditional, timeless design",
      },
      {
        name: "Modern Elegant",
        priceModifier: 5000,
        previewImageUrl: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80",
        description: "Contemporary styling with traditional fabric",
      },
      {
        name: "Intricate Embroidery",
        priceModifier: 15000,
        previewImageUrl: "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=400&q=80",
        description: "Hand-embroidered details on premium fabric",
      },
    ],
    productionDays: 14,
    isActive: true,
    seoMeta: {
      title: "Traditional Nigerian Aso-oke Wedding Dress | Jhaz-imprints",
      description:
        "Authentic hand-woven Aso-oke fabric for traditional Nigerian weddings. Customize colors and styles.",
      keywords: ["aso-oke", "nigerian wedding dress", "traditional outfit", "african wedding"],
    },
  },
  {
    name: "Elegant Agbada",
    slug: "elegant-agbada",
    category: "agbada" as const,
    description:
      "Distinguished Agbada outfit for formal and traditional occasions. " +
      "Crafted with premium fabrics and traditional tailoring techniques.",
    basePrice: 35000,
    images: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
      "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=800&q=80",
    ],
    fabricOptions: [
      {
        name: "Cotton Blend",
        priceModifier: 0,
        swatchImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
        inStock: true,
      },
      {
        name: "Silk Blend",
        priceModifier: 8000,
        swatchImageUrl: "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=200&q=80",
        inStock: true,
      },
    ],
    colorOptions: [
      {
        name: "Cream",
        hexCode: "#FFFDD0",
        imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=200&q=80",
      },
      {
        name: "Navy",
        hexCode: "#000080",
        imageUrl: "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=200&q=80",
      },
    ],
    styleOptions: [
      {
        name: "Standard",
        priceModifier: 0,
        previewImageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&q=80",
        description: "Clean, classic Agbada silhouette",
      },
      {
        name: "With Traditional Beads",
        priceModifier: 7000,
        previewImageUrl: "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=400&q=80",
        description: "Includes traditional beaded accents",
      },
    ],
    productionDays: 21,
    isActive: true,
    seoMeta: {
      title: "Elegant Nigerian Agbada | Jhaz-imprints",
      description: "Premium Agbada for formal and traditional occasions. Custom tailoring available.",
      keywords: ["agbada", "nigerian fashion", "men's traditional wear", "formal outfit"],
    },
  },
  {
    name: "Kente Gown",
    slug: "kente-gown",
    category: "kente-gown" as const,
    description:
      "Stunning Kente-inspired gown crafted from vibrant woven fabric. " +
      "A bold statement piece for cultural events, graduations, and celebrations.",
    basePrice: 38000,
    images: [
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
      "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=800&q=80",
    ],
    fabricOptions: [
      {
        name: "Classic Kente",
        priceModifier: 0,
        swatchImageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&q=80",
        inStock: true,
      },
      {
        name: "Silk Kente",
        priceModifier: 12000,
        swatchImageUrl: "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=200&q=80",
        inStock: true,
      },
    ],
    colorOptions: [
      {
        name: "Multicolour",
        hexCode: "#FF6B35",
        imageUrl: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=200&q=80",
      },
      {
        name: "Gold & Black",
        hexCode: "#FFD700",
        imageUrl: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=200&q=80",
      },
    ],
    styleOptions: [
      {
        name: "A-Line",
        priceModifier: 0,
        previewImageUrl: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&q=80",
        description: "Flowing A-line silhouette",
      },
      {
        name: "Fitted Midi",
        priceModifier: 6000,
        previewImageUrl: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=400&q=80",
        description: "Tailored midi-length fitted gown",
      },
    ],
    productionDays: 18,
    isActive: true,
    seoMeta: {
      title: "Kente Gown | African Print Dress | Jhaz-imprints",
      description:
        "Vibrant Kente-inspired gown for cultural events and celebrations. Premium African woven fabric.",
      keywords: ["kente gown", "african print dress", "ghana fashion", "cultural wear"],
    },
  },
  {
    name: "Ankara Casual Dress",
    slug: "ankara-casual-dress",
    category: "ankara-casual" as const,
    description:
      "Stylish everyday dress made from vibrant Ankara print fabric. " +
      "Perfect for casual outings, office wear, and weekend events.",
    basePrice: 18000,
    images: [
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80",
      "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800&q=80",
    ],
    fabricOptions: [
      {
        name: "Standard Ankara",
        priceModifier: 0,
        swatchImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80",
        inStock: true,
      },
      {
        name: "Premium Dutch Wax",
        priceModifier: 5000,
        swatchImageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&q=80",
        inStock: true,
      },
    ],
    colorOptions: [
      {
        name: "Bold Print",
        hexCode: "#E63946",
        imageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=200&q=80",
      },
      {
        name: "Earth Tones",
        hexCode: "#8B4513",
        imageUrl: "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=200&q=80",
      },
    ],
    styleOptions: [
      {
        name: "Straight Cut",
        priceModifier: 0,
        previewImageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80",
        description: "Clean straight cut, knee length",
      },
      {
        name: "Peplum",
        priceModifier: 3000,
        previewImageUrl: "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=400&q=80",
        description: "Flattering peplum waist detail",
      },
    ],
    productionDays: 7,
    isActive: true,
    seoMeta: {
      title: "Ankara Casual Dress | African Print Fashion | Jhaz-imprints",
      description:
        "Vibrant Ankara print casual dresses. African print fabric, custom tailored to your measurements.",
      keywords: ["ankara dress", "african print", "casual wear", "nigerian fashion"],
    },
  },
];


/**
 * Example of how to seed the database with sample products.
 * This would typically be run during initial setup or testing.
 *
 * Usage:
 *   pnpm db:seed
 */
export async function seedProductCatalog() {
  try {
    const { connectMongoDB } = await import("./index");
    const { Product } = await import("./models");

    await connectMongoDB();

    console.log("[Seed] Starting product catalog seeding...");

    // Clear existing products
    await Product.deleteMany({});
    console.log("[Seed] Cleared existing products");

    // Insert sample products using create() so the pre-save hook runs for each
    // (insertMany bypasses hooks — slug would not be auto-generated)
    const inserted = [];
    for (const product of SAMPLE_PRODUCTS) {
      const doc = await Product.create(product);
      inserted.push(doc);
      console.log(`[Seed] Inserted: ${doc.name} (slug: ${doc.slug})`);
    }
    console.log(`[Seed] Inserted ${inserted.length} products`);

    // Verify by fetching
    const count = await Product.countDocuments();
    console.log(`[Seed] Total products in database: ${count}`);

    console.log("[Seed] Product catalog seeding completed successfully");
  } catch (error) {
    console.error("[Seed] Error seeding product catalog:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProductCatalog().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
