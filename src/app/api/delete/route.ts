import { NextRequest, NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';
import { hashIP } from '../../lib/rateLimiter';



/**
 * DELETE method to handle the removal of data based on the user's hashed IP.
 * 
 * @param req - Incoming request object
 * @returns JSON response indicating success or failure
 */


export async function DELETE(req: NextRequest) {



// All required environment variables
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = process.env.COSMOS_DB_CONTAINER;

if (!endpoint || !key) {
  // Critical configuration error; fail fast
  throw new Error('Cosmos DB endpoint or key is not defined in environment variables.');
}

if (!databaseId || !containerId) {
  throw new Error('Cosmos DB database ID or container ID is not defined in environment variables.');
}

// Initialize CosmosClient with connection details
const client = new CosmosClient({ endpoint, key });


// Custom error type properties
interface CustomError extends Error {
  code?: number;
}




  try {
    // Extract the user's IP address correctly from Next.js request object
    const ip = req.ip ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'; // Default to 'unknown' if no IP is found


    // Hash the IP for anonymity before storing/processing
    const hashedIP = hashIP(ip);

    // Access the Cosmos DB container with type assertions
    const container = client.database(databaseId!).container(containerId!);


    // Attempt to delete the item associated with the hashed IP
    await container.item(hashedIP, hashedIP).delete();

    // Return a success response if deletion is successful
    return NextResponse.json({ message: 'Your data has been deleted.' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Using custom error type
      const customError = error as CustomError;

      console.error('Error deleting data:', customError.message);

      if (customError.code === 404 || customError.message.includes('Entity with the specified id does not exist')) {
        return NextResponse.json({ error: 'No data found to delete.' }, { status: 404 });
      }
    }

    // Error response
    return NextResponse.json({ error: 'An unexpected error occurred during deletion.' }, { status: 500 });
  }

}
