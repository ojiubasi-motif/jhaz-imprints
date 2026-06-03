const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');

// Use environment variables or safe local fallbacks
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/jhaz-catalog";
const postgresUri = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/jhaz-imprints?schema=public";

if (!process.env.MONGODB_URI || !process.env.DATABASE_URL) {
  console.warn("⚠️ Warning: MONGODB_URI or DATABASE_URL environment variables not set. Falling back to local development defaults.");
}

async function main() {
  let prisma;
  try {
    console.log("Connecting to MongoDB via Mongoose...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    console.log("Connecting to PostgreSQL...");
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: postgresUri
        }
      }
    });
    await prisma.$connect();
    console.log("Connected to PostgreSQL");

    const db = mongoose.connection.db;
    const productsCollection = db.collection("products");

    let page = 0;
    const batchSize = 20;
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching batch ${page + 1} from MongoDB...`);
      const mongoProducts = await productsCollection.find({})
        .skip(page * batchSize)
        .limit(batchSize)
        .toArray();

      if (mongoProducts.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Fetched ${mongoProducts.length} products to sync in batch ${page + 1}`);

      for (const prod of mongoProducts) {
        const id = prod._id.toString();
        console.log(`Syncing product: ${prod.name} (${id})`);

        await prisma.cachedProduct.upsert({
          where: { id },
          update: {
            slug: prod.slug,
            name: prod.name,
            basePrice: prod.basePrice,
            isActive: prod.isActive !== false,
            fabricOptions: [],
            styleOptions: prod.styleOptions || [],
            colorOptions: [],
            createdAt: prod.createdAt || new Date(),
            updatedAt: prod.updatedAt || new Date(),
          },
          create: {
            id,
            slug: prod.slug,
            name: prod.name,
            basePrice: prod.basePrice,
            isActive: prod.isActive !== false,
            fabricOptions: [],
            styleOptions: prod.styleOptions || [],
            colorOptions: [],
            createdAt: prod.createdAt || new Date(),
            updatedAt: prod.updatedAt || new Date(),
          }
        });
      }

      page++;
    }

    console.log("Sync completed!");
  } finally {
    console.log("Closing connections...");
    await mongoose.disconnect();
    if (prisma) {
      await prisma.$disconnect();
    }
    console.log("Connections closed.");
  }
}

main().catch(console.error);
