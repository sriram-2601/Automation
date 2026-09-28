import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env.js';
import { executeWorkflowSequence } from '../agents/orchestrator.js';

let executionQueue = null;
let executionWorker = null;
let redisConnection = null;
let isRedisAvailable = false;

// Initialize connection with safe fallback
export async function initQueue() {
  if (!env.REDIS_URL) {
    console.log('[Queue] No REDIS_URL provided. Using in-memory execution queue.');
    return;
  }

  try {
    const testRedis = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 2000,
      retryStrategy: () => null // Do not infinite retry if unavailable on start
    });

    testRedis.on('error', () => {
      // Suppress unhandled error events during connection attempts
    });

    await testRedis.connect();

    console.log('[Queue] Redis connected successfully for background jobs.');
    redisConnection = testRedis;
    isRedisAvailable = true;

    executionQueue = new Queue('executionQueue', { connection: redisConnection });
    executionQueue.on('error', (err) => {
      console.warn('[Queue] BullMQ Queue error:', err.message);
    });

    executionWorker = new Worker('executionQueue', async (job) => {
      const { executionId, inputs } = job.data;
      console.log(`[Queue Worker] Processing background job for execution: ${executionId}`);
      await executeWorkflowSequence(executionId, inputs);
    }, { 
      connection: redisConnection,
      concurrency: 5
    });

    executionWorker.on('error', (err) => {
      console.warn('[Queue Worker] BullMQ Worker error:', err.message);
    });

    executionWorker.on('completed', (job) => {
      console.log(`[Queue Worker] Completed job ${job.id} for execution: ${job.data.executionId}`);
    });

    executionWorker.on('failed', (job, err) => {
      console.error(`[Queue Worker] Failed job ${job?.id} for execution: ${job?.data?.executionId}:`, err);
    });
  } catch (err) {
    console.warn('[Queue] Redis is unavailable. Using in-memory execution fallback.');
    isRedisAvailable = false;
    if (redisConnection) {
      try { redisConnection.disconnect(); } catch (e) {}
      redisConnection = null;
    }
  }
}

// Start queue initialization
initQueue().catch(() => {});

export async function addExecutionJob(executionId, inputs = {}) {
  // If Redis connected, attempt to add job
  if (isRedisAvailable && executionQueue) {
    try {
      console.log(`[Queue] Adding execution ${executionId} to Redis BullMQ.`);
      await executionQueue.add('execute', { executionId, inputs }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        }
      });
      return { queued: true, provider: 'bullmq' };
    } catch (err) {
      console.warn('[Queue] Failed to add job to BullMQ, falling back to in-memory:', err.message);
    }
  }

  // In-memory fallback
  console.log(`[Queue] Running execution ${executionId} in-memory asynchronously.`);
  setImmediate(async () => {
    try {
      await executeWorkflowSequence(executionId, inputs);
    } catch (err) {
      console.error('[Queue Fallback] In-memory background flow failed:', err);
    }
  });
  return { queued: true, provider: 'in-memory-fallback' };
}

export function getRedisStatus() {
  return isRedisAvailable ? 'connected' : 'in-memory-fallback';
}
