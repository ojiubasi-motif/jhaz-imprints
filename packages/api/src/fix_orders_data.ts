
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixOrders() {
  console.log('Fixing orders with NULL productId...');
  try {
    // We can't use prisma to find them if they throw P2032!
    // We have to use raw query.
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "Order" SET "productId" = 'unknown' WHERE "productId" IS NULL`
    );
    console.log(`Updated ${result} orders.`);
    
    // Also check other non-nullable fields I added
    const resultStyle = await prisma.$executeRawUnsafe(
      `UPDATE "Order" SET "styleOptionName" = 'unknown' WHERE "styleOptionName" IS NULL`
    );
    console.log(`Updated ${resultStyle} orders for styleOptionName.`);

    const resultFabric = await prisma.$executeRawUnsafe(
      `UPDATE "Order" SET "fabricOptionName" = 'unknown' WHERE "fabricOptionName" IS NULL`
    );
    console.log(`Updated ${resultFabric} orders for fabricOptionName.`);

  } catch (err) {
    console.error('Error fixing orders:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrders();
