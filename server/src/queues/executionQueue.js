import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env.js';
import { executeWorkflowSequence } from '../agents/orchestrator.js';

let executionQueue = null;
let executionWorker = null;
let redisConnection = null;
let isRedisAvailable = false;

// Initialize connection
try {
  redisConnection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 2000, // 2 seconds timeout
    retryStrategy(times) {
      if (times > 2) {
        return null; // Stop retrying to let fallback trigger
      }
      return 1000;
    }
  });

  redisConnection.on('error', (err) => {
    console.warn('[Queue] Redis connection error. Using in-memory fallback.');
    isRedisAvailable = false;
  });

  redisConnection.on('connect', () => {
    console.log('[Queue] Redis connected successfully for background jobs.');
    isRedisAvailable = true;
  });

  executionQueue = new Queue('executionQueue', { connection: redisConnection });
  isRedisAvailable = true;
} catch (e) {
  console.warn('[Queue] Could not initialize BullMQ queue, using in-memory execution fallback:', e.message);
  isRedisAvailable = false;
}

// Set up worker if Redis connects
if (isRedisAvailable && redisConnection) {
  try {
    executionWorker = new Worker('executionQueue', async (job) => {
      const { executionId, inputs } = job.data;
      console.log(`[Queue Worker] Processing background job for execution: ${executionId}`);
      await executeWorkflowSequence(executionId, inputs);
    }, { 
      connection: redisConnection,
      concurrency: 5
    });

    executionWorker.on('completed', (job) => {
      console.log(`[Queue Worker] Completed job ${job.id} for execution: ${job.data.executionId}`);
    });

    executionWorker.on('failed', (job, err) => {
      console.error(`[Queue Worker] Failed job ${job?.id} for execution: ${job?.data?.executionId}:`, err);
    });
  } catch (err) {
    console.warn('[Queue Worker] Failed to start BullMQ worker:', err.message);
    isRedisAvailable = false;
  }
}

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
