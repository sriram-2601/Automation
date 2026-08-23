import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/agentflow_ai',
  JWT_SECRET: process.env.JWT_SECRET || 'agentflow_jwt_secret_dev_key_12345',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY || 'agentflow_encryption_key_32_bytes_long!!', // Default fallback key
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

// Check encryption key length, derive 32-byte key if it is not 32 bytes
import crypto from 'crypto';
const rawKey = env.CREDENTIAL_ENCRYPTION_KEY;
env.derivedEncryptionKey = crypto.createHash('sha256').update(rawKey).digest(); // Safe 32-byte Buffer for AES-256
