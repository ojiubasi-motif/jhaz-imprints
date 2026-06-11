import Redis from 'ioredis';
import { prisma } from '@jhaz-imprints/db';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const CATALOG_STREAM_KEY = 'stream:catalog.events';
const CATALOG_DLQ_KEY = 'stream:catalog.dlq';
const CONSUMER_GROUP = 'api-core-group';
const CONSUMER_NAME = `api-worker-${process.pid}`;

let redisClient: Redis | null = null;
let isStopping = false;

export async function startCatalogEventWorker() {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  try {
    // Create Consumer Group if it doesn't exist
    // '0-0' means create the group starting from the beginning of the stream if the stream exists.
    // MKSTREAM automatically creates the stream if it doesn't exist.
    await redisClient.xgroup('CREATE', CATALOG_STREAM_KEY, CONSUMER_GROUP, '0-0', 'MKSTREAM');
    console.log(`[CatalogEventWorker] Consumer group ${CONSUMER_GROUP} created.`);
  } catch (error: any) {
    if (!error.message.includes('BUSYGROUP')) {
      console.error('[CatalogEventWorker] Failed to create consumer group:', error);
      return;
    }
  }

  console.log(`[CatalogEventWorker] Started listening to ${CATALOG_STREAM_KEY}...`);

  while (!isStopping) {
    try {
      // Read new messages. '>' means read messages never delivered to other consumers in this group.
      // BLOCK 5000 means wait up to 5 seconds if no messages are available.
      const response = await redisClient.xreadgroup(
        'GROUP', CONSUMER_GROUP, CONSUMER_NAME,
        'COUNT', 10,
        'BLOCK', 5000,
        'STREAMS', CATALOG_STREAM_KEY, '>'
      );

      if (response && response.length > 0) {
        const streamData = response[0] as any;
        const messages = streamData[1];

        for (const message of messages) {
          const messageId = message[0];
          const fields = message[1];
          
          // Parse fields into a usable object
          const data: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
          }

          // ACK first to prevent infinite redelivery of poison messages.
          // If processing fails, the event goes to the DLQ instead.
          await redisClient.xack(CATALOG_STREAM_KEY, CONSUMER_GROUP, messageId);

          try {
            await processEvent(data.eventType, JSON.parse(data.payload));
          } catch (procError: any) {
            // Dead-letter queue: write failed message for manual inspection
            console.error(`[CatalogEventWorker] Failed to process ${data.eventType}, sending to DLQ:`, procError.message);
            try {
              await redisClient.xadd(
                CATALOG_DLQ_KEY,
                'MAXLEN', '~', '1000',
                '*',
                'originalId', messageId,
                'eventType', data.eventType || 'UNKNOWN',
                'payload', data.payload || '{}',
                'error', procError.message || 'Unknown error',
                'timestamp', new Date().toISOString()
              );
            } catch (dlqError: any) {
              console.error('[CatalogEventWorker] Failed to write to DLQ:', dlqError.message);
            }
          }
        }
      }
    } catch (error: any) {
      if (isStopping) break;
      console.error('[CatalogEventWorker] Error reading stream:', error);
      // Brief pause before retrying to prevent hot loops on persistent errors
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export function stopCatalogEventWorker() {
  isStopping = true;
  if (redisClient) {
    redisClient.quit();
  }
  console.log('[CatalogEventWorker] Stopped.');
}

async function processEvent(eventType: string, payload: any) {
  try {
    switch (eventType) {
      case 'PRODUCT_CREATED':
      case 'PRODUCT_UPDATED': {
        const product = payload;
        
        // Strip Mongoose specific fields if necessary and map to Prisma model
        await prisma.cachedProduct.upsert({
          where: { id: product._id || product.id },
          update: {
            slug: product.slug,
            name: product.name,
            basePrice: product.basePrice,
            isActive: product.isActive ?? true,
            fabricOptions: [],
            styleOptions: product.styleOptions || [],
            colorOptions: [],
          },
          create: {
            id: product._id || product.id,
            slug: product.slug,
            name: product.name,
            basePrice: product.basePrice,
            isActive: product.isActive ?? true,
            fabricOptions: [],
            styleOptions: product.styleOptions || [],
            colorOptions: [],
          }
        });
        console.log(`[CatalogEventWorker] Upserted local cache for product: ${product.name}`);
        break;
      }
      
      case 'PRODUCT_DELETED': {
        const id = payload.id;
        await prisma.cachedProduct.delete({
          where: { id }
        });
        console.log(`[CatalogEventWorker] Deleted local cache for product id: ${id}`);
        break;
      }
      
      default:
        console.log(`[CatalogEventWorker] Unknown event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`[CatalogEventWorker] Failed to process event ${eventType}:`, error);
    // Error logged; message already ACK'd so it won't retry
  }
}
