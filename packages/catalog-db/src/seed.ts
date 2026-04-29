/**
 * Sample product fixtures for the Jhaz-imprints catalog.
 * These can be used for testing and as examples of the product schema.
 */

export const SAMPLE_PRODUCTS = [
  {
    name: "Traditional Wedding Aso-oke",
    // slug will be auto-generated: "traditional-wedding-aso-oke"
    category: "wedding-aso-oke" as const,
    description:
      "Exquisite hand-woven Aso-oke fabric perfect for traditional weddings. " +
      "Features authentic patterns and premium quality. Available in multiple colors and styles.",
    basePrice: 45000,
    images: [
      "https://cdn.example.com/aso-oke-1.jpg",
      "https://cdn.example.com/aso-oke-2.jpg",
    ],
    fabricOptions: [
      {
        name: "Standard Aso-oke",
        priceModifier: 0,
        swatchImageUrl: "https://cdn.example.com/swatch-standard.jpg",
        inStock: true,
      },
      {
        name: "Premium Aso-oke",
        priceModifier: 10000,
        swatchImageUrl: "https://cdn.example.com/swatch-premium.jpg",
        inStock: true,
      },
      {
        name: "Gold Threaded Aso-oke",
        priceModifier: 20000,
        swatchImageUrl: "https://cdn.example.com/swatch-gold.jpg",
        inStock: false,
      },
    ],
    colorOptions: [
      {
        name: "Royal Blue",
        hexCode: "#4169E1",
        imageUrl: "https://cdn.example.com/blue.jpg",
      },
      {
        name: "Gold",
        hexCode: "#FFD700",
        imageUrl: "https://cdn.example.com/gold.jpg",
      },
      {
        name: "Burgundy",
        hexCode: "#800020",
        imageUrl: "https://cdn.example.com/burgundy.jpg",
      },
    ],
    styleOptions: [
      {
        name: "Classic Cut",
        priceModifier: 0,
        previewImageUrl: "https://cdn.example.com/classic.jpg",
        description: "Traditional, timeless design",
      },
      {
        name: "Modern Elegant",
        priceModifier: 5000,
        previewImageUrl: "https://cdn.example.com/modern.jpg",
        description: "Contemporary styling with traditional fabric",
      },
      {
        name: "Intricate Embroidery",
        priceModifier: 15000,
        previewImageUrl: "https://cdn.example.com/embroidered.jpg",
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
    category: "agbada" as const,
    description:
      "Distinguished Agbada outfit for formal and traditional occasions. " +
      "Crafted with premium fabrics and traditional tailoring techniques.",
    basePrice: 35000,
    images: [
      "https://cdn.example.com/agbada-1.jpg",
      "https://cdn.example.com/agbada-2.jpg",
    ],
    fabricOptions: [
      {
        name: "Cotton Blend",
        priceModifier: 0,
        swatchImageUrl: "https://cdn.example.com/swatch-cotton.jpg",
        inStock: true,
      },
      {
        name: "Silk Blend",
        priceModifier: 8000,
        swatchImageUrl: "https://cdn.example.com/swatch-silk.jpg",
        inStock: true,
      },
    ],
    colorOptions: [
      {
        name: "Cream",
        hexCode: "#FFFDD0",
        imageUrl: "https://cdn.example.com/cream.jpg",
      },
      {
        name: "Navy",
        hexCode: "#000080",
        imageUrl: "https://cdn.example.com/navy.jpg",
      },
    ],
    styleOptions: [
      {
        name: "Standard",
        priceModifier: 0,
        previewImageUrl: "https://cdn.example.com/agbada-standard.jpg",
      },
      {
        name: "With Traditional Beads",
        priceModifier: 7000,
        previewImageUrl: "https://cdn.example.com/agbada-beads.jpg",
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

    // Insert sample products
    const inserted = await Product.insertMany(SAMPLE_PRODUCTS);
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
