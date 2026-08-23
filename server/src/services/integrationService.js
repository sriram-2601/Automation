import crypto from 'crypto';
import { Integration } from '../models/Integration.js';
import { env } from '../config/env.js';
import { dbStatus } from '../config/db.js';

// Algorithm for token encryption
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Local mock integrations state in-memory if MongoDB is offline
const inMemoryIntegrations = {};

// 1. Encryption Utility functions
export function encryptToken(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, env.derivedEncryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptToken(encryptedText) {
  if (!encryptedText) return '';
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) return '';
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, env.derivedEncryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error.message);
    throw new Error('AUTH_EXPIRED'); // Standardized token decryption error
  }
}

// 2. Integration CRUD Services
export async function getIntegrationsList(userId) {
  const providers = ['gmail', 'slack', 'google-sheets', 'discord'];
  
  if (dbStatus.connected) {
    const docs = await Integration.find({ owner: userId });
    return providers.map(provider => {
      const doc = docs.find(d => d.provider === provider);
      return {
        provider,
        isConnected: doc ? doc.isConnected : false,
        expiresAt: doc ? doc.expiresAt : null,
      };
    });
  } else {
    // In-memory fallback
    const userMap = inMemoryIntegrations[userId] || {};
    return providers.map(provider => ({
      provider,
      isConnected: userMap[provider] ? userMap[provider].isConnected : false,
      expiresAt: userMap[provider] ? userMap[provider].expiresAt : null,
    }));
  }
}

export async function saveIntegrationCredentials(userId, provider, { accessToken, refreshToken, expiresAt, scopes = [] }) {
  const encryptedAccessToken = encryptToken(accessToken);
  const encryptedRefreshToken = encryptToken(refreshToken);

  if (dbStatus.connected) {
    const query = { owner: userId, provider };
    const update = {
      isConnected: true,
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresAt,
      scopes,
    };
    
    return await Integration.findOneAndUpdate(query, update, {
      upsert: true,
      new: true
    });
  } else {
    if (!inMemoryIntegrations[userId]) {
      inMemoryIntegrations[userId] = {};
    }
    inMemoryIntegrations[userId][provider] = {
      isConnected: true,
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresAt,
      scopes,
      updatedAt: new Date()
    };
    return inMemoryIntegrations[userId][provider];
  }
}

export async function getIntegrationCredentials(userId, provider) {
  let doc = null;
  if (dbStatus.connected) {
    doc = await Integration.findOne({ owner: userId, provider });
  } else {
    const userMap = inMemoryIntegrations[userId] || {};
    doc = userMap[provider];
  }

  if (!doc || !doc.isConnected) {
    throw new Error('INTEGRATION_NOT_CONNECTED');
  }

  // Check expiration
  if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
    throw new Error('AUTH_EXPIRED');
  }

  const accessToken = decryptToken(doc.encryptedAccessToken);
  const refreshToken = decryptToken(doc.encryptedRefreshToken);

  return {
    accessToken,
    refreshToken,
    expiresAt: doc.expiresAt,
  };
}

export async function disconnectIntegration(userId, provider) {
  if (dbStatus.connected) {
    await Integration.deleteOne({ owner: userId, provider });
  } else {
    if (inMemoryIntegrations[userId] && inMemoryIntegrations[userId][provider]) {
      inMemoryIntegrations[userId][provider].isConnected = false;
    }
  }
  return true;
}
