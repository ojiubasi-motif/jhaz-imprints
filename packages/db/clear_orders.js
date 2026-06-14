import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try to read DATABASE_URL from packages/db/.env
let envUrl = '';
try {
  const envContent = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf-8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
  if (match) {
    envUrl = match[1];
  }
} catch (e) {
  // ignore
}

const dbUrl = process.argv[2] || envUrl || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Please provide a DATABASE_URL as an argument or set it in the environment.");
  process.exit(1);
}

// Mask password in logs
let hostSnippet = 'URL';
try {
  hostSnippet = dbUrl.split('@')[1] || dbUrl;
} catch (e) {}

console.log("Connecting to database at:", hostSnippet);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  try {
    // Due to Cascade Delete constraints, this will automatically wipe corresponding Payment and OrderStatusHistory records
    const deleted = await prisma.order.deleteMany({});
    console.log(`Successfully deleted ${deleted.count} orders.`);
  } catch (error) {
    console.error("Failed to delete orders:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
