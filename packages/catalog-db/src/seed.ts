/**
 * Comprehensive seed data for the Jhaz-imprints catalog.
 *
 * Coverage:
 *   - 14 fabric types, each with 3-5 property variants
 *   - All 5 unit types represented (yard, trouser-length, ft, roll, pack)
 *   - Price modifiers ranging from ₦0 to ₦25,000
 *   - Mixed inStock/outOfStock and stockLevel values
 *   - 30+ products spread across all 14 categories
 *   - All genders and occasions represented
 *
 * Usage:
 *   MONGODB_URI=<uri> npx tsx src/seed.ts
 *   pnpm db:seed   (if script is wired in package.json)
 */

import type { ICategoryRef } from "./models/types";

// ─────────────────────────────────────────────────────────────────────────────
// Fabrics
// 14 distinct fabric types; each property is a purchasable colour/variant.
// priceModifier is added on top of the product's basePrice in ₦.
// ─────────────────────────────────────────────────────────────────────────────

export const SAMPLE_FABRICS = [
  // ── 1. Standard Aso-oke ─────────────────────────────────────────────────
  {
    name: "Standard Aso-oke",
    slug: "standard-aso-oke",
    description: "Traditional hand-woven Aso-oke fabric — durable and authentic.",
    properties: [
      {
        colorName: "Royal Blue",
        colorCode: "#4169E1",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 50,
        isActive: true,
      },
      {
        colorName: "Gold",
        colorCode: "#FFD700",
        imageUrl: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 35,
        isActive: true,
      },
      {
        colorName: "Burgundy",
        colorCode: "#800020",
        imageUrl: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 20,
        isActive: true,
      },
      {
        colorName: "Forest Green",
        colorCode: "#228B22",
        imageUrl: "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },

  // ── 2. Premium Aso-oke ──────────────────────────────────────────────────
  {
    name: "Premium Aso-oke",
    slug: "premium-aso-oke",
    description: "High-grade hand-woven Aso-oke with gold thread accents — reserved for VIP ceremonies.",
    properties: [
      {
        colorName: "Royal Blue",
        colorCode: "#4169E1",
        imageUrl: "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 10000,
        inStock: true,
        stockLevel: 15,
        isActive: true,
      },
      {
        colorName: "Cream",
        colorCode: "#FFFDD0",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 10000,
        inStock: true,
        stockLevel: 10,
        isActive: true,
      },
      {
        colorName: "Wine Red",
        colorCode: "#722F37",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 12000,
        inStock: true,
        stockLevel: 8,
        isActive: true,
      },
      {
        colorName: "Mint Green",
        colorCode: "#98FF98",
        imageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 11000,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },

  // ── 3. Gold Threaded Aso-oke ────────────────────────────────────────────
  {
    name: "Gold Threaded Aso-oke",
    slug: "gold-threaded-aso-oke",
    description: "Luxury Aso-oke with pure gold-threaded weaving. Limited edition — only for top ceremonies.",
    properties: [
      {
        colorName: "Gold on Navy",
        colorCode: "#FFD700",
        imageUrl: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 20000,
        inStock: true,
        stockLevel: 5,
        isActive: true,
      },
      {
        colorName: "Gold on Burgundy",
        colorCode: "#B8860B",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 25000,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },

  // ── 4. Cotton Blend ─────────────────────────────────────────────────────
  {
    name: "Cotton Blend",
    slug: "cotton-blend",
    description: "Soft breathable cotton blend — comfortable for all-day wear in any season.",
    properties: [
      {
        colorName: "Cream",
        colorCode: "#FFFDD0",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 80,
        isActive: true,
      },
      {
        colorName: "Navy",
        colorCode: "#000080",
        imageUrl: "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 60,
        isActive: true,
      },
      {
        colorName: "Ash Grey",
        colorCode: "#B2BEB5",
        imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 45,
        isActive: true,
      },
      {
        colorName: "White",
        colorCode: "#FFFFFF",
        imageUrl: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 100,
        isActive: true,
      },
    ],
  },

  // ── 5. Silk Blend ───────────────────────────────────────────────────────
  {
    name: "Silk Blend",
    slug: "silk-blend",
    description: "Luxurious silk blend with a natural sheen. Premium feel, drapes beautifully.",
    properties: [
      {
        colorName: "Ivory",
        colorCode: "#FFFFF0",
        imageUrl: "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 8000,
        inStock: true,
        stockLevel: 25,
        isActive: true,
      },
      {
        colorName: "Champagne",
        colorCode: "#F7E7CE",
        imageUrl: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 9000,
        inStock: true,
        stockLevel: 18,
        isActive: true,
      },
      {
        colorName: "Dusty Rose",
        colorCode: "#DCAE96",
        imageUrl: "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 8500,
        inStock: true,
        stockLevel: 12,
        isActive: true,
      },
      {
        colorName: "Midnight Black",
        colorCode: "#0C0C0C",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 10000,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },

  // ── 6. Classic Kente ────────────────────────────────────────────────────
  {
    name: "Classic Kente",
    slug: "classic-kente",
    description: "Authentic Ghanaian Kente strip-woven cloth — vibrant, bold, and culturally significant.",
    properties: [
      {
        colorName: "Multicolour",
        colorCode: "#FF6B35",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 30,
        isActive: true,
      },
      {
        colorName: "Gold & Black",
        colorCode: "#FFD700",
        imageUrl: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 3000,
        inStock: true,
        stockLevel: 20,
        isActive: true,
      },
      {
        colorName: "Red & Green",
        colorCode: "#E63946",
        imageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 2000,
        inStock: true,
        stockLevel: 15,
        isActive: true,
      },
    ],
  },

  // ── 7. Standard Ankara ──────────────────────────────────────────────────
  {
    name: "Standard Ankara",
    slug: "standard-ankara",
    description: "Quality African wax-print fabric — vibrant prints for everyday and occasion wear.",
    properties: [
      {
        colorName: "Bold Print",
        colorCode: "#E63946",
        imageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 100,
        isActive: true,
      },
      {
        colorName: "Earth Tones",
        colorCode: "#8B4513",
        imageUrl: "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 75,
        isActive: true,
      },
      {
        colorName: "Blue Geometric",
        colorCode: "#1D3557",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 90,
        isActive: true,
      },
      {
        colorName: "Yellow & Orange",
        colorCode: "#F4A261",
        imageUrl: "https://images.unsplash.com/photo-1616436483786-09b5dce71f8d?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },

  // ── 8. Premium Dutch Wax ────────────────────────────────────────────────
  {
    name: "Premium Dutch Wax",
    slug: "premium-dutch-wax",
    description: "Top-quality Dutch wax print — vivid colours that resist fading for years.",
    properties: [
      {
        colorName: "Crimson Bloom",
        colorCode: "#DC143C",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 5000,
        inStock: true,
        stockLevel: 40,
        isActive: true,
      },
      {
        colorName: "Cobalt Garden",
        colorCode: "#0047AB",
        imageUrl: "https://images.unsplash.com/photo-1616436483786-09b5dce71f8d?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 5000,
        inStock: true,
        stockLevel: 32,
        isActive: true,
      },
      {
        colorName: "Emerald Swirl",
        colorCode: "#50C878",
        imageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 6000,
        inStock: true,
        stockLevel: 22,
        isActive: true,
      },
      {
        colorName: "Sunset Burst",
        colorCode: "#FF7043",
        imageUrl: "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 5500,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },

  // ── 9. Senator Fabric ───────────────────────────────────────────────────
  // Sold by trouser-length — typical for senator suits
  {
    name: "Senator Fabric",
    slug: "senator-fabric",
    description: "Fine polyester-linen blend fabric tailored for senator two-piece suits.",
    properties: [
      {
        colorName: "Sky Blue",
        colorCode: "#87CEEB",
        imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&q=80",
        unit: "trouser-length" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 60,
        isActive: true,
      },
      {
        colorName: "Charcoal",
        colorCode: "#36454F",
        imageUrl: "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=400&q=80",
        unit: "trouser-length" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 45,
        isActive: true,
      },
      {
        colorName: "Brown Khaki",
        colorCode: "#C3B091",
        imageUrl: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80",
        unit: "trouser-length" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 55,
        isActive: true,
      },
      {
        colorName: "Olive Green",
        colorCode: "#6B8E23",
        imageUrl: "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=400&q=80",
        unit: "trouser-length" as const,
        priceModifier: 1500,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },

  // ── 10. Isi-agu Brocade ─────────────────────────────────────────────────
  // Lion-head brocade for Isiagu — sold by ft
  {
    name: "Isi-agu Brocade",
    slug: "isi-agu-brocade",
    description: "Premium lion-head brocade fabric used exclusively for Isiagu traditional attire.",
    properties: [
      {
        colorName: "Red Lion",
        colorCode: "#C0392B",
        imageUrl: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=400&q=80",
        unit: "ft" as const,
        priceModifier: 4000,
        inStock: true,
        stockLevel: 30,
        isActive: true,
      },
      {
        colorName: "Black Lion",
        colorCode: "#1C1C1C",
        imageUrl: "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=400&q=80",
        unit: "ft" as const,
        priceModifier: 4000,
        inStock: true,
        stockLevel: 25,
        isActive: true,
      },
      {
        colorName: "Gold Lion",
        colorCode: "#DAA520",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
        unit: "ft" as const,
        priceModifier: 6000,
        inStock: true,
        stockLevel: 15,
        isActive: true,
      },
      {
        colorName: "Purple Lion",
        colorCode: "#6A0DAD",
        imageUrl: "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=400&q=80",
        unit: "ft" as const,
        priceModifier: 5000,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },

  // ── 11. French Lace ─────────────────────────────────────────────────────
  // Sold by roll — typical for lace fabric
  {
    name: "French Lace",
    slug: "french-lace",
    description: "Imported French lace with intricate floral embroidery — the hallmark of owambe fashion.",
    properties: [
      {
        colorName: "Ivory Floral",
        colorCode: "#FFFFF0",
        imageUrl: "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=400&q=80",
        unit: "roll" as const,
        priceModifier: 15000,
        inStock: true,
        stockLevel: 8,
        isActive: true,
      },
      {
        colorName: "Champagne Lace",
        colorCode: "#F7E7CE",
        imageUrl: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80",
        unit: "roll" as const,
        priceModifier: 18000,
        inStock: true,
        stockLevel: 5,
        isActive: true,
      },
      {
        colorName: "Royal Purple Lace",
        colorCode: "#7B2D8B",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
        unit: "roll" as const,
        priceModifier: 20000,
        inStock: true,
        stockLevel: 3,
        isActive: true,
      },
      {
        colorName: "Wine Red Lace",
        colorCode: "#722F37",
        imageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80",
        unit: "roll" as const,
        priceModifier: 16000,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },

  // ── 12. Swiss Lace ──────────────────────────────────────────────────────
  {
    name: "Swiss Lace",
    slug: "swiss-lace",
    description: "Lightweight Swiss voile lace — elegant and breathable for daytime celebrations.",
    properties: [
      {
        colorName: "White Voile",
        colorCode: "#F5F5F5",
        imageUrl: "https://images.unsplash.com/photo-1616436483786-09b5dce71f8d?w=400&q=80",
        unit: "roll" as const,
        priceModifier: 12000,
        inStock: true,
        stockLevel: 6,
        isActive: true,
      },
      {
        colorName: "Pastel Pink",
        colorCode: "#FFB6C1",
        imageUrl: "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=400&q=80",
        unit: "roll" as const,
        priceModifier: 13000,
        inStock: true,
        stockLevel: 4,
        isActive: true,
      },
      {
        colorName: "Baby Blue",
        colorCode: "#89CFF0",
        imageUrl: "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=400&q=80",
        unit: "roll" as const,
        priceModifier: 12500,
        inStock: true,
        stockLevel: 7,
        isActive: true,
      },
    ],
  },

  // ── 13. Dashiki Print Fabric ────────────────────────────────────────────
  // Sold by pack (pre-cut dashiki sets)
  {
    name: "Dashiki Print Fabric",
    slug: "dashiki-print",
    description: "Pre-cut embroidered dashiki sets — vibrant African chest-embroidery designs.",
    properties: [
      {
        colorName: "Classic Orange",
        colorCode: "#FF6600",
        imageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80",
        unit: "pack" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 40,
        isActive: true,
      },
      {
        colorName: "Electric Blue",
        colorCode: "#7DF9FF",
        imageUrl: "https://images.unsplash.com/photo-1616436483786-09b5dce71f8d?w=400&q=80",
        unit: "pack" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 35,
        isActive: true,
      },
      {
        colorName: "Purple & Gold",
        colorCode: "#800080",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
        unit: "pack" as const,
        priceModifier: 2000,
        inStock: true,
        stockLevel: 20,
        isActive: true,
      },
      {
        colorName: "White & Gold",
        colorCode: "#FFD700",
        imageUrl: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80",
        unit: "pack" as const,
        priceModifier: 2500,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },

  // ── 14. Boubou Fabric ───────────────────────────────────────────────────
  // Heavy embroidered fabric for Boubou robes
  {
    name: "Boubou Fabric",
    slug: "boubou-fabric",
    description: "Wide-width flowing fabric for Boubou and grand Babariga robes — soft finish.",
    properties: [
      {
        colorName: "Pure White",
        colorCode: "#FFFFFF",
        imageUrl: "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 0,
        inStock: true,
        stockLevel: 70,
        isActive: true,
      },
      {
        colorName: "Sky Blue",
        colorCode: "#87CEEB",
        imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 1500,
        inStock: true,
        stockLevel: 50,
        isActive: true,
      },
      {
        colorName: "Dusty Gold",
        colorCode: "#C5A028",
        imageUrl: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 3000,
        inStock: true,
        stockLevel: 30,
        isActive: true,
      },
      {
        colorName: "Deep Purple",
        colorCode: "#301934",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
        unit: "yard" as const,
        priceModifier: 2500,
        inStock: false,
        stockLevel: 0,
        isActive: true,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Products — 30 products covering all 14 categories
// ─────────────────────────────────────────────────────────────────────────────

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  images: string[];
  productionDays: number;
  categories: ICategoryRef[];
  fabricSlugs: string[];
  gender: string;
  occasion: string;
  styleOptions: Array<{ name: string; priceModifier: number; description?: string }>;
  isActive: boolean;
  seoMeta: { title: string; description: string; keywords: string[] };
}

export const SAMPLE_PRODUCTS: SeedProduct[] = [

  // ════════════════════════════════════════════
  // WEDDING ASO-OKE  (3 products)
  // ════════════════════════════════════════════
  {
    name: "Bridal Aso-oke Set",
    slug: "bridal-aso-oke-set",
    description:
      "Stunning hand-woven Aso-oke bridal set comprising gele, ipele, and iro. " +
      "Crafted with premium gold-threaded fabric for a regal appearance on your wedding day.",
    basePrice: 65000,
    images: [
      "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&q=80",
      "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80",
    ],
    productionDays: 14,
    categories: [{ name: "Wedding Aso-oke", slug: "wedding-aso-oke" }],
    fabricSlugs: ["gold-threaded-aso-oke", "premium-aso-oke"],
    gender: "women",
    occasion: "wedding",
    styleOptions: [
      { name: "Classic Set", priceModifier: 0, description: "Gele, ipele, and iro" },
      { name: "Extended Set", priceModifier: 10000, description: "Adds fila cap for groom to match" },
    ],
    isActive: true,
    seoMeta: {
      title: "Bridal Aso-oke Set | Nigerian Traditional Wedding | Jhaz-imprints",
      description: "Premium gold-threaded Aso-oke bridal set. Custom gele, ipele, iro. Nigerian wedding specialists.",
      keywords: ["aso-oke", "bridal", "nigerian wedding", "gele", "traditional"],
    },
  },
  {
    name: "Traditional Wedding Aso-oke",
    slug: "traditional-wedding-aso-oke",
    description:
      "Exquisite hand-woven Aso-oke fabric perfect for traditional weddings. " +
      "Available in multiple colours and styles — from classic royal blue to rich burgundy.",
    basePrice: 45000,
    images: [
      "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&q=80",
      "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80",
    ],
    productionDays: 14,
    categories: [{ name: "Wedding Aso-oke", slug: "wedding-aso-oke" }],
    fabricSlugs: ["standard-aso-oke", "premium-aso-oke", "gold-threaded-aso-oke"],
    gender: "women",
    occasion: "wedding",
    styleOptions: [
      { name: "Classic Cut", priceModifier: 0, description: "Timeless traditional design" },
      { name: "Modern Elegant", priceModifier: 5000, description: "Contemporary styling" },
      { name: "Intricate Embroidery", priceModifier: 15000, description: "Hand-embroidered details" },
    ],
    isActive: true,
    seoMeta: {
      title: "Traditional Aso-oke Wedding Set | Jhaz-imprints",
      description: "Hand-woven Aso-oke wedding fabric. Customise colour and style.",
      keywords: ["aso-oke", "wedding", "traditional", "nigerian fashion"],
    },
  },
  {
    name: "Groom's Aso-oke Fila & Agbada Combo",
    slug: "groom-aso-oke-combo",
    description:
      "Complete groom ensemble featuring matching Aso-oke fila cap and flowing Agbada. " +
      "Custom-fitted for the big day with coordinated colour options.",
    basePrice: 80000,
    images: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
      "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=800&q=80",
    ],
    productionDays: 21,
    categories: [{ name: "Wedding Aso-oke", slug: "wedding-aso-oke" }],
    fabricSlugs: ["premium-aso-oke", "cotton-blend"],
    gender: "men",
    occasion: "wedding",
    styleOptions: [
      { name: "Standard Combo", priceModifier: 0 },
      { name: "Embroidered Collar & Cuffs", priceModifier: 12000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Groom Aso-oke & Agbada Combo | Nigerian Wedding | Jhaz-imprints",
      description: "Custom groom Aso-oke and Agbada combo. Traditional Nigerian wedding attire.",
      keywords: ["groom", "aso-oke", "agbada", "wedding", "nigerian"],
    },
  },

  // ════════════════════════════════════════════
  // AGBADA  (3 products)
  // ════════════════════════════════════════════
  {
    name: "Elegant Agbada",
    slug: "elegant-agbada",
    description:
      "Distinguished Agbada outfit for formal and traditional occasions. " +
      "Crafted with premium fabrics and traditional tailoring techniques.",
    basePrice: 55000,
    images: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
      "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=800&q=80",
    ],
    productionDays: 21,
    categories: [{ name: "Agbada", slug: "agbada" }],
    fabricSlugs: ["cotton-blend", "silk-blend"],
    gender: "men",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Standard", priceModifier: 0, description: "Classic Agbada silhouette" },
      { name: "With Beads", priceModifier: 7000, description: "Traditional beaded accents" },
    ],
    isActive: true,
    seoMeta: {
      title: "Elegant Nigerian Agbada | Jhaz-imprints",
      description: "Premium Agbada for formal occasions. Custom tailoring.",
      keywords: ["agbada", "nigerian", "men", "traditional", "formal"],
    },
  },
  {
    name: "Grand Babariga Agbada",
    slug: "grand-babariga-agbada",
    description:
      "The most regal of Nigerian men's wear — a full three-piece Agbada with intricate embroidery " +
      "at the chest, collar, and cuffs. Built for governors and royalty.",
    basePrice: 90000,
    images: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
    ],
    productionDays: 30,
    categories: [{ name: "Agbada", slug: "agbada" }],
    fabricSlugs: ["boubou-fabric", "silk-blend"],
    gender: "men",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Three-Piece", priceModifier: 0 },
      { name: "Heavy Gold Embroidery", priceModifier: 20000 },
      { name: "Bejewelled Buttons", priceModifier: 8000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Grand Babariga Agbada | Premium Nigerian Attire | Jhaz-imprints",
      description: "Full three-piece embroidered Agbada. Nigeria's most prestigious men's wear.",
      keywords: ["babariga", "agbada", "nigerian royalty", "embroidery"],
    },
  },
  {
    name: "Casual Agbada",
    slug: "casual-agbada",
    description:
      "A lighter, single-layer Agbada suitable for Friday prayers, naming ceremonies, and casual owambe. " +
      "Comfortable cotton blend with subtle embroidery.",
    basePrice: 38000,
    images: [
      "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=800&q=80",
    ],
    productionDays: 14,
    categories: [{ name: "Agbada", slug: "agbada" }],
    fabricSlugs: ["cotton-blend", "boubou-fabric"],
    gender: "men",
    occasion: "casual",
    styleOptions: [
      { name: "Simple Collar Embroidery", priceModifier: 0 },
      { name: "Full Front Embroidery", priceModifier: 5000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Casual Agbada | Lightweight Nigerian Robe | Jhaz-imprints",
      description: "Comfortable single-layer Agbada. Perfect for ceremonies and prayer.",
      keywords: ["agbada", "casual", "nigerian", "cotton", "men"],
    },
  },

  // ════════════════════════════════════════════
  // KAFTAN  (2 products)
  // ════════════════════════════════════════════
  {
    name: "Ankara Kaftan",
    slug: "ankara-kaftan-001",
    description:
      "Vibrant Ankara print kaftan for special occasions. Bold patterns, relaxed fit. " +
      "A Nigerian party staple.",
    basePrice: 45000,
    images: [
      "https://images.unsplash.com/photo-1616436483786-09b5dce71f8d?w=800&q=80",
    ],
    productionDays: 10,
    categories: [{ name: "Kaftan", slug: "kaftan" }],
    fabricSlugs: ["standard-ankara", "premium-dutch-wax"],
    gender: "men",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Round Neck", priceModifier: 0 },
      { name: "V-Neck with Embroidery", priceModifier: 4000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Ankara Kaftan | Nigerian Men's Fashion | Jhaz-imprints",
      description: "Bold Ankara print kaftan. Custom-tailored for Nigerian celebrations.",
      keywords: ["kaftan", "ankara", "men", "nigerian", "celebration"],
    },
  },
  {
    name: "Luxury Silk Kaftan",
    slug: "luxury-silk-kaftan",
    description:
      "A sophisticated silk-blend kaftan with subtle sheen — perfect for corporate events, " +
      "Eid celebrations, and high-society owambe.",
    basePrice: 60000,
    images: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
    ],
    productionDays: 14,
    categories: [{ name: "Kaftan", slug: "kaftan" }],
    fabricSlugs: ["silk-blend", "cotton-blend"],
    gender: "men",
    occasion: "corporate",
    styleOptions: [
      { name: "Plain Silk", priceModifier: 0 },
      { name: "Embossed Pattern", priceModifier: 8000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Luxury Silk Kaftan | Men's Premium Wear | Jhaz-imprints",
      description: "Sophisticated silk-blend kaftan for corporate and celebration events.",
      keywords: ["kaftan", "silk", "luxury", "men", "corporate"],
    },
  },

  // ════════════════════════════════════════════
  // KENTE GOWN  (2 products)
  // ════════════════════════════════════════════
  {
    name: "Kente Mermaid Gown",
    slug: "kente-mermaid-gown",
    description:
      "Body-hugging mermaid silhouette crafted from vibrant Kente strip-woven cloth. " +
      "A bold statement piece for graduations, cultural galas, and celebrations.",
    basePrice: 52000,
    images: [
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
    ],
    productionDays: 18,
    categories: [{ name: "Kente Gown", slug: "kente-gown" }],
    fabricSlugs: ["classic-kente"],
    gender: "women",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Mermaid Fit", priceModifier: 0 },
      { name: "Sweetheart Neckline", priceModifier: 5000 },
      { name: "Off-Shoulder", priceModifier: 6000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Kente Mermaid Gown | African Gown | Jhaz-imprints",
      description: "Stunning Kente mermaid gown for galas and cultural events.",
      keywords: ["kente", "mermaid", "gown", "women", "african"],
    },
  },
  {
    name: "Kente A-Line Dress",
    slug: "kente-a-line-dress",
    description:
      "Elegant A-line Kente dress with fitted bodice and flowing skirt. " +
      "Ideal for graduations, church events, and cultural showcases.",
    basePrice: 38000,
    images: [
      "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=800&q=80",
    ],
    productionDays: 14,
    categories: [{ name: "Kente Gown", slug: "kente-gown" }],
    fabricSlugs: ["classic-kente"],
    gender: "women",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Standard A-Line", priceModifier: 0 },
      { name: "With Train", priceModifier: 8000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Kente A-Line Dress | Ghanaian Print Gown | Jhaz-imprints",
      description: "Vibrant Kente A-line dress. Perfect for graduations and celebrations.",
      keywords: ["kente", "a-line", "dress", "ghana", "women"],
    },
  },

  // ════════════════════════════════════════════
  // ANKARA CASUAL  (3 products)
  // ════════════════════════════════════════════
  {
    name: "Ankara Casual Dress",
    slug: "ankara-casual-dress",
    description:
      "Stylish everyday dress made from vibrant Ankara print fabric. " +
      "Perfect for casual outings, office wear, and weekend events.",
    basePrice: 18000,
    images: [
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80",
      "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800&q=80",
    ],
    productionDays: 7,
    categories: [{ name: "Ankara Casual", slug: "ankara-casual" }],
    fabricSlugs: ["standard-ankara", "premium-dutch-wax"],
    gender: "women",
    occasion: "casual",
    styleOptions: [
      { name: "Straight Cut", priceModifier: 0 },
      { name: "Peplum", priceModifier: 3000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Ankara Casual Dress | African Print Fashion | Jhaz-imprints",
      description: "Vibrant Ankara print casual dresses. Custom-tailored to your measurements.",
      keywords: ["ankara", "casual dress", "african print", "women"],
    },
  },
  {
    name: "Men's Ankara Shirt & Trouser",
    slug: "ankara-shirt-trouser-set",
    description:
      "Matching Ankara shirt and trouser set for men — stylish, bold, and distinctly African. " +
      "Available in bold prints and earth tones.",
    basePrice: 22000,
    images: [
      "https://images.unsplash.com/photo-1616436483786-09b5dce71f8d?w=800&q=80",
    ],
    productionDays: 7,
    categories: [{ name: "Ankara Casual", slug: "ankara-casual" }],
    fabricSlugs: ["standard-ankara", "premium-dutch-wax"],
    gender: "men",
    occasion: "casual",
    styleOptions: [
      { name: "Short Sleeve", priceModifier: 0 },
      { name: "Long Sleeve", priceModifier: 1500 },
    ],
    isActive: true,
    seoMeta: {
      title: "Men's Ankara Shirt & Trouser Set | Jhaz-imprints",
      description: "Bold African print matching set for men. Casual and smart-casual wear.",
      keywords: ["ankara", "men", "casual", "matching set", "african"],
    },
  },
  {
    name: "Ankara Jumpsuit",
    slug: "ankara-jumpsuit",
    description:
      "Trendy wide-leg Ankara jumpsuit — comfortable, fashionable, and bold. " +
      "Perfect for daytime events and casual outings.",
    basePrice: 24000,
    images: [
      "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800&q=80",
    ],
    productionDays: 7,
    categories: [{ name: "Ankara Casual", slug: "ankara-casual" }],
    fabricSlugs: ["premium-dutch-wax"],
    gender: "women",
    occasion: "casual",
    styleOptions: [
      { name: "Wide Leg", priceModifier: 0 },
      { name: "Fitted + Belt", priceModifier: 2000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Ankara Jumpsuit | African Print Casual Wear | Jhaz-imprints",
      description: "Stylish Ankara wide-leg jumpsuit. African print casual fashion.",
      keywords: ["ankara", "jumpsuit", "women", "casual", "african print"],
    },
  },

  // ════════════════════════════════════════════
  // BURIAL WEAR  (2 products)
  // ════════════════════════════════════════════
  {
    name: "White Burial Agbada",
    slug: "white-burial-agbada",
    description:
      "Dignified all-white Agbada for burial and funeral ceremonies. " +
      "Crafted from pure cotton blend — respectful and appropriately formal.",
    basePrice: 35000,
    images: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
    ],
    productionDays: 10,
    categories: [{ name: "Burial Wear", slug: "burial-wear" }],
    fabricSlugs: ["cotton-blend"],
    gender: "men",
    occasion: "burial",
    styleOptions: [
      { name: "Simple Plain", priceModifier: 0 },
      { name: "With White Embroidery", priceModifier: 4000 },
    ],
    isActive: true,
    seoMeta: {
      title: "White Burial Agbada | Funeral Wear Nigeria | Jhaz-imprints",
      description: "All-white cotton Agbada for Nigerian burial ceremonies.",
      keywords: ["burial", "funeral", "white", "agbada", "men"],
    },
  },
  {
    name: "Ash Burial Set (Women)",
    slug: "ash-burial-set-women",
    description:
      "Elegant ash/grey Iro & Buba set for female mourners. Dignified and culturally appropriate. " +
      "Available in ash, deep black, or ivory white per family tradition.",
    basePrice: 28000,
    images: [
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
    ],
    productionDays: 7,
    categories: [{ name: "Burial Wear", slug: "burial-wear" }],
    fabricSlugs: ["cotton-blend"],
    gender: "women",
    occasion: "burial",
    styleOptions: [
      { name: "Plain", priceModifier: 0 },
      { name: "Lace Trim", priceModifier: 5000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Women's Burial Wear Set | Ash & White | Jhaz-imprints",
      description: "Dignified burial wear for women. Ash, white, or black options.",
      keywords: ["burial wear", "women", "funeral", "ash", "nigerian"],
    },
  },

  // ════════════════════════════════════════════
  // IRO & BUBA  (2 products)
  // ════════════════════════════════════════════
  {
    name: "Traditional Iro & Buba",
    slug: "traditional-iro-buba",
    description:
      "Authentic Yoruba two-piece blouse and wrapper set. " +
      "Handmade with premium Aso-oke or lace fabric — suitable for owambe, naming, and church.",
    basePrice: 35000,
    images: [
      "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&q=80",
    ],
    productionDays: 10,
    categories: [{ name: "Iro & Buba", slug: "iro-buba" }],
    fabricSlugs: ["standard-aso-oke", "french-lace"],
    gender: "women",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Plain Buba", priceModifier: 0 },
      { name: "Puffed Sleeve Buba", priceModifier: 3000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Traditional Iro & Buba | Yoruba Women's Wear | Jhaz-imprints",
      description: "Premium Iro & Buba set crafted with Aso-oke or lace. Owambe and wedding-ready.",
      keywords: ["iro buba", "yoruba", "women", "traditional", "owambe"],
    },
  },
  {
    name: "Lace Iro & Buba",
    slug: "lace-iro-buba",
    description:
      "Glamorous French lace Iro & Buba — the ultimate owambe party set. " +
      "Paired with matching head-tie (gele) option.",
    basePrice: 55000,
    images: [
      "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80",
    ],
    productionDays: 14,
    categories: [{ name: "Iro & Buba", slug: "iro-buba" }],
    fabricSlugs: ["french-lace", "swiss-lace"],
    gender: "women",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Standard Set", priceModifier: 0 },
      { name: "With Matching Gele", priceModifier: 12000 },
    ],
    isActive: true,
    seoMeta: {
      title: "French Lace Iro & Buba | Owambe Party Wear | Jhaz-imprints",
      description: "Glamorous French lace Iro & Buba for parties and celebrations.",
      keywords: ["iro buba", "french lace", "owambe", "women", "party"],
    },
  },

  // ════════════════════════════════════════════
  // SENATOR  (2 products)
  // ════════════════════════════════════════════
  {
    name: "Classic Senator Suit",
    slug: "classic-senator-suit",
    description:
      "Smart two-piece Abuja senator suit — a Nigerian corporate and political staple. " +
      "Tailored from fine polyester-linen blend with clean lines and structured fit.",
    basePrice: 32000,
    images: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
    ],
    productionDays: 10,
    categories: [{ name: "Senator", slug: "senator" }],
    fabricSlugs: ["senator-fabric"],
    gender: "men",
    occasion: "corporate",
    styleOptions: [
      { name: "Classic Fit", priceModifier: 0 },
      { name: "Slim Fit", priceModifier: 2000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Classic Senator Suit | Nigerian Corporate Wear | Jhaz-imprints",
      description: "Sharp two-piece senator suit. Tailored for Nigerian politicians and executives.",
      keywords: ["senator suit", "men", "corporate", "nigerian", "abuja"],
    },
  },
  {
    name: "Embroidered Senator Suit",
    slug: "embroidered-senator-suit",
    description:
      "Premium senator suit with intricate embroidery on the collar, chest, and cuffs. " +
      "Ideal for high-profile events, traditional ceremonies, and VIP occasions.",
    basePrice: 45000,
    images: [
      "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=800&q=80",
    ],
    productionDays: 14,
    categories: [{ name: "Senator", slug: "senator" }],
    fabricSlugs: ["senator-fabric"],
    gender: "men",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Light Embroidery", priceModifier: 0 },
      { name: "Heavy Embroidery", priceModifier: 8000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Embroidered Senator Suit | Nigerian VIP Wear | Jhaz-imprints",
      description: "Intricate embroidered senator suit. Premium fabric, custom tailored.",
      keywords: ["senator suit", "embroidered", "men", "VIP", "nigerian"],
    },
  },

  // ════════════════════════════════════════════
  // DASHIKI  (2 products)
  // ════════════════════════════════════════════
  {
    name: "Classic Dashiki Shirt",
    slug: "classic-dashiki-shirt",
    description:
      "Colourful embroidered pullover dashiki shirt — a pan-African classic. " +
      "Bold chest embroidery and relaxed fit. Casual and festive.",
    basePrice: 12000,
    images: [
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80",
    ],
    productionDays: 5,
    categories: [{ name: "Dashiki", slug: "dashiki" }],
    fabricSlugs: ["dashiki-print"],
    gender: "men",
    occasion: "casual",
    styleOptions: [
      { name: "Standard", priceModifier: 0 },
      { name: "Matching Trousers", priceModifier: 6000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Classic Dashiki Shirt | Pan-African Fashion | Jhaz-imprints",
      description: "Embroidered dashiki shirt. Bold colours, relaxed fit. Pan-African style.",
      keywords: ["dashiki", "african shirt", "men", "casual", "pan-african"],
    },
  },
  {
    name: "Dashiki Dress (Women)",
    slug: "dashiki-dress-women",
    description:
      "Women's midi dashiki dress with bold print and embroidered chest panel. " +
      "Casual and vibrant — perfect for festivals and cultural events.",
    basePrice: 15000,
    images: [
      "https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800&q=80",
    ],
    productionDays: 5,
    categories: [{ name: "Dashiki", slug: "dashiki" }],
    fabricSlugs: ["dashiki-print"],
    gender: "women",
    occasion: "casual",
    styleOptions: [
      { name: "Midi Length", priceModifier: 0 },
      { name: "Maxi Length", priceModifier: 3000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Women's Dashiki Dress | African Print Fashion | Jhaz-imprints",
      description: "Bold dashiki dress for women. Vibrant African print style.",
      keywords: ["dashiki", "women", "african print", "dress", "casual"],
    },
  },

  // ════════════════════════════════════════════
  // BOUBOU  (2 products)
  // ════════════════════════════════════════════
  {
    name: "Men's Grand Boubou",
    slug: "mens-grand-boubou",
    description:
      "Flowing West African grand Boubou robe for men — elegant and dignified. " +
      "Suitable for Friday prayers, Eid celebrations, and cultural events.",
    basePrice: 40000,
    images: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
    ],
    productionDays: 14,
    categories: [{ name: "Boubou", slug: "boubou" }],
    fabricSlugs: ["boubou-fabric"],
    gender: "men",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Plain Collar", priceModifier: 0 },
      { name: "Embroidered Neck & Chest", priceModifier: 7000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Men's Grand Boubou | West African Robe | Jhaz-imprints",
      description: "Flowing Boubou robe for men. Perfect for prayers and cultural events.",
      keywords: ["boubou", "men", "west african", "robe", "eid"],
    },
  },
  {
    name: "Women's Boubou Gown",
    slug: "womens-boubou-gown",
    description:
      "Graceful women's Boubou gown with wide sleeves and flowing silhouette. " +
      "Elegant for Eid, naming ceremonies, and owambe.",
    basePrice: 35000,
    images: [
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
    ],
    productionDays: 12,
    categories: [{ name: "Boubou", slug: "boubou" }],
    fabricSlugs: ["boubou-fabric", "swiss-lace"],
    gender: "women",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Standard", priceModifier: 0 },
      { name: "Lace Overlay", priceModifier: 10000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Women's Boubou Gown | Elegant African Robe | Jhaz-imprints",
      description: "Graceful women's Boubou gown. Nigerian owambe and Eid fashion.",
      keywords: ["boubou", "women", "gown", "owambe", "eid"],
    },
  },

  // ════════════════════════════════════════════
  // ISIAGU  (2 products)
  // ════════════════════════════════════════════
  {
    name: "Classic Isiagu Top",
    slug: "classic-isiagu-top",
    description:
      "Iconic Igbo traditional blouse featuring premium lion-head brocade. " +
      "Worn by men for title-taking ceremonies, chieftaincy events, and cultural occasions.",
    basePrice: 28000,
    images: [
      "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=800&q=80",
    ],
    productionDays: 10,
    categories: [{ name: "Isiagu", slug: "isiagu" }],
    fabricSlugs: ["isi-agu-brocade"],
    gender: "men",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Standard Top", priceModifier: 0 },
      { name: "With Matching Trousers", priceModifier: 10000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Classic Isiagu Top | Igbo Traditional Wear | Jhaz-imprints",
      description: "Lion-head brocade Isiagu. Traditional Igbo attire for ceremonies.",
      keywords: ["isiagu", "igbo", "traditional", "men", "lion head"],
    },
  },
  {
    name: "Premium Isiagu Full Set",
    slug: "premium-isiagu-full-set",
    description:
      "Full Isiagu chief's set — top, matching trousers, red cap (fez), and walking stick holder. " +
      "The complete Igbo title-holder appearance.",
    basePrice: 55000,
    images: [
      "https://images.unsplash.com/photo-1620912189865-1e8a33da5e99?w=800&q=80",
    ],
    productionDays: 21,
    categories: [{ name: "Isiagu", slug: "isiagu" }],
    fabricSlugs: ["isi-agu-brocade"],
    gender: "men",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Standard Set", priceModifier: 0 },
      { name: "With Red Coral Beads", priceModifier: 15000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Premium Isiagu Chief's Set | Igbo Traditional | Jhaz-imprints",
      description: "Complete Isiagu chief's attire — top, trousers, and accessories.",
      keywords: ["isiagu", "chief", "igbo", "full set", "title ceremony"],
    },
  },

  // ════════════════════════════════════════════
  // BLAZER TOP  (2 products)
  // ════════════════════════════════════════════
  {
    name: "Ankara Blazer Top",
    slug: "ankara-blazer-top",
    description:
      "Tailored blazer-style blouse in bold Ankara print. " +
      "Smart-casual and corporate variants — perfect for African-print office days.",
    basePrice: 22000,
    images: [
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80",
    ],
    productionDays: 7,
    categories: [{ name: "Blazer Top", slug: "blazer-top" }],
    fabricSlugs: ["premium-dutch-wax"],
    gender: "women",
    occasion: "corporate",
    styleOptions: [
      { name: "Single Button", priceModifier: 0 },
      { name: "Double Breasted", priceModifier: 3000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Ankara Blazer Top | African Print Corporate Wear | Jhaz-imprints",
      description: "Tailored Ankara blazer for women. Bold print meets corporate style.",
      keywords: ["blazer", "ankara", "women", "corporate", "african print"],
    },
  },
  {
    name: "Lace Blazer Top",
    slug: "lace-blazer-top",
    description:
      "Elegant French lace blazer top for women — glamorous enough for owambe, " +
      "refined enough for corporate settings.",
    basePrice: 35000,
    images: [
      "https://images.unsplash.com/photo-1583394293214-3b978f5b6db8?w=800&q=80",
    ],
    productionDays: 10,
    categories: [{ name: "Blazer Top", slug: "blazer-top" }],
    fabricSlugs: ["french-lace"],
    gender: "women",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Plain Collar", priceModifier: 0 },
      { name: "Ruffled Collar", priceModifier: 4000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Lace Blazer Top | Owambe & Corporate | Jhaz-imprints",
      description: "French lace blazer top. Elegant for parties and office events.",
      keywords: ["blazer", "french lace", "women", "owambe", "corporate"],
    },
  },

  // ════════════════════════════════════════════
  // LACE WEAR  (2 products)
  // ════════════════════════════════════════════
  {
    name: "French Lace Evening Gown",
    slug: "french-lace-evening-gown",
    description:
      "Stunning floor-length French lace evening gown. Intricate floral embroidery, " +
      "fitted bodice, and sweeping skirt — the ultimate owambe statement piece.",
    basePrice: 75000,
    images: [
      "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&q=80",
    ],
    productionDays: 21,
    categories: [{ name: "Lace Wear", slug: "lace-wear" }],
    fabricSlugs: ["french-lace"],
    gender: "women",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "A-Line Skirt", priceModifier: 0 },
      { name: "Mermaid Fit", priceModifier: 8000 },
      { name: "Off-Shoulder", priceModifier: 5000 },
    ],
    isActive: true,
    seoMeta: {
      title: "French Lace Evening Gown | Nigerian Owambe | Jhaz-imprints",
      description: "Floor-length French lace gown. The ultimate owambe party wear.",
      keywords: ["french lace", "evening gown", "owambe", "women", "luxury"],
    },
  },
  {
    name: "Swiss Lace Blouse & Skirt Set",
    slug: "swiss-lace-blouse-skirt",
    description:
      "Lightweight Swiss voile lace blouse and pencil skirt set. " +
      "Elegant and breathable — ideal for daytime celebrations and church services.",
    basePrice: 45000,
    images: [
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
    ],
    productionDays: 14,
    categories: [{ name: "Lace Wear", slug: "lace-wear" }],
    fabricSlugs: ["swiss-lace"],
    gender: "women",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Pencil Skirt", priceModifier: 0 },
      { name: "Flared Skirt", priceModifier: 3000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Swiss Lace Blouse & Skirt Set | Daytime Elegance | Jhaz-imprints",
      description: "Lightweight Swiss lace set. Perfect for church and daytime parties.",
      keywords: ["swiss lace", "blouse", "skirt", "women", "celebration"],
    },
  },

  // ════════════════════════════════════════════
  // OTHER  (2 products)
  // ════════════════════════════════════════════
  {
    name: "Kids' Ankara Party Outfit",
    slug: "kids-ankara-party-outfit",
    description:
      "Adorable matching Ankara outfit for children — top and trousers/skirt combo. " +
      "Bold prints and comfortable cotton blend. Perfect for naming ceremonies and celebrations.",
    basePrice: 8000,
    images: [
      "https://images.unsplash.com/photo-1616436483786-09b5dce71f8d?w=800&q=80",
    ],
    productionDays: 5,
    categories: [{ name: "Other", slug: "other" }],
    fabricSlugs: ["standard-ankara"],
    gender: "kids",
    occasion: "social-events-celebrations",
    styleOptions: [
      { name: "Standard", priceModifier: 0 },
      { name: "With Accessories", priceModifier: 2000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Kids Ankara Party Outfit | Nigerian Children's Fashion | Jhaz-imprints",
      description: "Cute Ankara matching outfit for kids. Perfect for naming ceremonies.",
      keywords: ["kids", "ankara", "children", "party", "nigerian"],
    },
  },
  {
    name: "Unisex Corporate Agbada",
    slug: "unisex-corporate-agbada",
    description:
      "A contemporary unisex interpretation of the Agbada — fitted, structured, and boardroom-ready. " +
      "Cotton-silk blend with subtle embroidery.",
    basePrice: 48000,
    images: [
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
    ],
    productionDays: 14,
    categories: [{ name: "Other", slug: "other" }],
    fabricSlugs: ["silk-blend", "cotton-blend"],
    gender: "unisex",
    occasion: "corporate",
    styleOptions: [
      { name: "Standard", priceModifier: 0 },
      { name: "Embossed Logo", priceModifier: 5000 },
    ],
    isActive: true,
    seoMeta: {
      title: "Unisex Corporate Agbada | Modern African Fashion | Jhaz-imprints",
      description: "Contemporary Agbada for all genders. Boardroom-ready African fashion.",
      keywords: ["agbada", "unisex", "corporate", "modern", "african"],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Seed runner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seed the catalog database with complete fabric and product data.
 * Clears existing records first so the seed is idempotent.
 */
export async function seedProductCatalog() {
  try {
    const { connectMongoDB } = await import("./index");
    const { Product, Fabric, FabricCategory } = await import("./models");

    await connectMongoDB();
    console.log("[Seed] Connected to MongoDB");

    // ── Step 0: Fabric Categories ─────────────────────────────────────────
    await FabricCategory.deleteMany({});
    console.log("[Seed] Cleared existing fabric categories");

    const categorySlugs = ["aso-oke", "cotton", "silk", "kente", "ankara", "senator", "brocade", "lace", "print"];
    const categoryNames = ["Aso-oke", "Cotton", "Silk", "Kente", "Ankara", "Senator", "Brocade", "Lace", "Print"];
    
    const createdCategories = [];
    for (let i = 0; i < categorySlugs.length; i++) {
      const cat = await FabricCategory.create({
        name: categoryNames[i],
        slug: categorySlugs[i],
      });
      createdCategories.push(cat);
      console.log(`[Seed]  ✓ Fabric Category: ${cat.name}`);
    }
    
    const categoryMap = new Map(createdCategories.map((c) => [c.slug, c]));

    // ── Step 1: Fabrics ──────────────────────────────────────────────────
    await Fabric.deleteMany({});
    console.log("[Seed] Cleared existing fabrics");

    const fabricToCategory: Record<string, string> = {
      "standard-aso-oke": "aso-oke",
      "premium-aso-oke": "aso-oke",
      "gold-threaded-aso-oke": "aso-oke",
      "cotton-blend": "cotton",
      "silk-blend": "silk",
      "classic-kente": "kente",
      "standard-ankara": "ankara",
      "premium-dutch-wax": "ankara",
      "senator-fabric": "senator",
      "isi-agu-brocade": "brocade",
      "french-lace": "lace",
      "swiss-lace": "lace",
      "dashiki-print-fabric": "print",
      "boubou-fabric": "print",
    };

    const fabricDocs: any[] = [];
    for (const fabric of SAMPLE_FABRICS) {
      const catSlug = fabricToCategory[fabric.slug] || "cotton";
      const catDoc = categoryMap.get(catSlug);
      if (!catDoc) throw new Error(`Category ${catSlug} not found in seeded categories`);

      const doc = await Fabric.create({
        ...fabric,
        category: catDoc._id,
      });
      fabricDocs.push(doc);

      catDoc.fabrics.push(doc._id as any);
      await catDoc.save();

      console.log(`[Seed]  ✓ Fabric: ${doc.name} under ${catDoc.name} (${doc.properties.length} variants)`);
    }
    console.log(`[Seed] ${fabricDocs.length} fabrics inserted`);

    // Build slug → ObjectId lookup
    const fabricSlugToId = new Map(fabricDocs.map((f) => [f.slug, f._id]));

    // ── Step 2: Products ─────────────────────────────────────────────────
    await Product.deleteMany({});
    console.log("[Seed] Cleared existing products");

    const productDocs = [];
    for (const product of SAMPLE_PRODUCTS) {
      const fabricIds = product.fabricSlugs
        .map((slug) => fabricSlugToId.get(slug))
        .filter(Boolean);

      if (fabricIds.length !== product.fabricSlugs.length) {
        const missing = product.fabricSlugs.filter((s) => !fabricSlugToId.has(s));
        console.warn(`[Seed] ⚠ Product "${product.name}" — unknown fabric slugs: ${missing.join(", ")}`);
      }

      const { fabricSlugs, images, styleOptions, ...productData } = product;
      const updatedStyleOptions = styleOptions.map((style, idx) => {
        const imgUrl = images[idx] || images[0] || "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&q=80";
        return {
          ...style,
          imgUrl,
        };
      });

      const doc = await Product.create({
        ...productData,
        fabrics: fabricIds,
        styleOptions: updatedStyleOptions,
      });
      productDocs.push(doc);
      console.log(`[Seed]  ✓ Product: ${doc.name}  [${doc.categories.map((c: ICategoryRef) => c.name).join(", ")}]`);
    }
    console.log(`[Seed] ${productDocs.length} products inserted`);

    // ── Verify ────────────────────────────────────────────────────────────
    const { Product: P, Fabric: F } = await import("./models");
    const fabricCount  = await F.countDocuments();
    const productCount = await P.countDocuments();
    console.log(`\n[Seed] ════════════════════════════`);
    console.log(`[Seed]  Fabrics  in DB : ${fabricCount}`);
    console.log(`[Seed]  Products in DB : ${productCount}`);
    console.log(`[Seed] ════════════════════════════`);
    console.log("[Seed] Done ✓");

    process.exit(0);
  } catch (error) {
    console.error("[Seed] Error:", error);
    process.exit(1);
  }
}

// Run directly if executed as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProductCatalog().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
