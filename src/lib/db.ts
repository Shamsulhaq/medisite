import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createPrismaClientWithRetry(): Promise<PrismaClient> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
      });
      const client = new PrismaClient({ adapter });
      // Verify the connection works
      await client.$queryRaw`SELECT 1`;
      return client;
    } catch (error) {
      lastError = error;
      console.error(
        `[db] Connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        error instanceof Error ? error.message : error
      );
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw new Error(
    `[db] Failed to connect to database after ${MAX_RETRIES} attempts. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

// Synchronous singleton for import usage (standard Next.js pattern).
// The retry logic runs on first actual query via the $connect middleware below.
export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Connect to the database with retries.
 * Call this in health checks or at startup to verify connectivity.
 */
export async function connectWithRetry(): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `[db] Connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        error instanceof Error ? error.message : error
      );
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw new Error(
    `[db] Failed to connect to database after ${MAX_RETRIES} attempts. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

export default prisma;
