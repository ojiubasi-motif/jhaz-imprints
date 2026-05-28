import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Shared instance for publishing events
export const redisPublisher = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const CATALOG_STREAM_KEY = 'stream:catalog.events';

/**
 * Publishes an event to the Redis Stream.
 * 
 * @param eventType - e.g. 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED'
 * @param payload - The data payload (will be stringified)
 */
export async function publishCatalogEvent(eventType: string, payload: any) {
  try {
    await redisPublisher.xadd(
      CATALOG_STREAM_KEY,
      '*', // Auto-generate ID
      'eventType', eventType,
      'payload', JSON.stringify(payload)
    );
    console.log(`[Catalog] Published event ${eventType} to ${CATALOG_STREAM_KEY}`);
  } catch (error) {
    console.error(`[Catalog] Failed to publish event ${eventType}:`, error);
  }
}
