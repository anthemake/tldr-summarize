import crypto from 'crypto';
import { CosmosClient, Container } from '@azure/cosmos';

let container: Container | null = null;

function getContainer(): Container {
  if (!container) {
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const databaseId = process.env.COSMOS_DB_DATABASE;
    const containerId = process.env.COSMOS_DB_CONTAINER;

    // Ensure all required environment variables are all set
    if (!endpoint || !key || !databaseId || !containerId) {
      throw new Error(
        'COSMOS_DB_ENDPOINT, COSMOS_DB_KEY, COSMOS_DB_DATABASE, and COSMOS_DB_CONTAINER must be defined in environment variables.'
      );
    }

    const client = new CosmosClient({ endpoint, key });
    container = client.database(databaseId).container(containerId);
  }
  return container;
}

// Hash the IP address before storing it
export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Function to check and update the rate limit based on hashed IP
export async function checkRateLimit(ip: string): Promise<{ perMinute: boolean; perHour: boolean }> {
  const container = getContainer();
  const hashedIP = hashIP(ip); // Hash the IP

  const currentTime = Date.now();
  const oneMinuteAgo = currentTime - 60 * 1000;
  const oneHourAgo = currentTime - 60 * 60 * 1000;
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // 24 hours

  try {
    // Retrieve existing rate limit record for this hashed IP
    const { resource: rateLimitData } = await container.item(hashedIP, hashedIP).read();

    // If the record is older than 24 hours, delete it and reset rate limit
    if (rateLimitData && currentTime - rateLimitData.lastRequestTime > oneDayInMilliseconds) {
      await container.item(hashedIP, hashedIP).delete();

      return { perMinute: true, perHour: true }; // Allow the request since the old record is deleted
    }

    if (!rateLimitData) {
      // No record exists; create a new one
      const newRecord = {
        id: hashedIP,
        ip: hashedIP,
        requestCountMinute: 1,
        requestCountHour: 1,
        lastRequestTime: currentTime,
      };

      await container.items.create(newRecord);
      return { perMinute: true, perHour: true };
    }

    // Update the rate limit counts for this hashed IP
    const updatedRecord = { ...rateLimitData };
    if (rateLimitData.lastRequestTime > oneMinuteAgo) {
      updatedRecord.requestCountMinute++;
    } else {
      updatedRecord.requestCountMinute = 1; // Reset minute counter
    }

    if (rateLimitData.lastRequestTime > oneHourAgo) {
      updatedRecord.requestCountHour++;
    } else {
      updatedRecord.requestCountHour = 1; // Reset hour counter
    }

    updatedRecord.lastRequestTime = currentTime;

    // Save the updated rate limit record
    await container.item(hashedIP, hashedIP).replace(updatedRecord);

    // Enforce limits: 5 requests per minute, 80 requests per hour
    const perMinute = updatedRecord.requestCountMinute <= 5;
    const perHour = updatedRecord.requestCountHour <= 80;

    return { perMinute, perHour };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { perMinute: true, perHour: true }; // Fail-safe: allow the request
  }
}
