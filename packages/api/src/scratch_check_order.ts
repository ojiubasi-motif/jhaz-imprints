
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkOrder() {
  const orderId = 'cmp3tx8b4000798mx30m0lxnb';
  console.log(`Checking order: ${orderId}`);
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    console.log('Order found:', order);
    
    const allOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('Recent orders:', allOrders.map(o => o.id));
  } catch (err) {
    console.error('Error checking order:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrder();
