import * as integrationService from '../services/integrationService.js';
import { env } from '../config/env.js';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { dbStatus } from '../config/db.js';

export async function list(req, res) {
  try {
    const list = await integrationService.getIntegrationsList(req.user._id || req.user.id);
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getStatus(req, res) {
  try {
    const list = await integrationService.getIntegrationsList(req.user._id || req.user.id);
    return res.status(200).json({
      status: 'healthy',
      integrations: list
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Redirects to mock OAuth callback immediately for local simulation
export async function oauthStart(req, res) {
  const { provider } = req.params;
  
  // Validate provider name
  const validProviders = ['gmail', 'slack', 'google-sheets', 'discord'];
  if (!validProviders.includes(provider)) {
    return res.redirect(`${env.CLIENT_URL}/integrations?status=error&error=invalid_provider`);
  }

  const userId = req.query.userId || '';

  // Redirect to callback route on local API, forwarding the userId
  const callbackUrl = `http://localhost:5000/api/integrations/oauth/${provider}/callback?code=mock_authorization_code_12345&state=oauth_state&userId=${userId}`;
  return res.redirect(callbackUrl);
}

// Handles mock callback, logs connection, and redirects back to Client UI integrations page
export async function oauthCallback(req, res) {
  const { provider } = req.params;
  
  try {
    const mockAccessToken = `mock_access_token_${provider}_${Date.now()}`;
    const mockRefreshToken = `mock_refresh_token_${provider}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiration

    // Capture user details from state or cookies (we mock it using a query parameter or load from req.user if session cookie exists.
    // Wait! Since standard browser redirection doesn't carry Bearer Authorization headers in URL, we need another way to link it to the user.
    // We can pass a query string or state, or look up req.user if a session cookie is configured.
    // In our case, since the subagent runs logged-in in the browser, we can pass user ID in the OAuth state, or we can just connect it to the first user or mock user!
    // Wait! If the frontend calls start, it can pass the JWT token in query parameter `token`, or we can query it.
    // To make it extremely simple: let's allow the frontend to pass the user ID or JWT token in the query or state, or we can fetch req.user if available, or we can fallback to connecting the integration to the active operator user.
    // Let's check: the start endpoint redirect:
    // If the client starts the flow, it can query: `/api/integrations/oauth/:provider/start?userId=${userId}`
    // Let's read `userId` from req.query and pass it along in the callback URL!
    // Yes! That is extremely clean and links the credentials to the correct user.
    let userId = req.query.userId || req.user?._id || req.user?.id || 'mock-user-id';

    // If userId is invalid and database is connected, fallback to first user in database
    if (dbStatus.connected && (!userId || !mongoose.isValidObjectId(userId) || userId === 'mock-user-id')) {
      const firstUser = await User.findOne();
      if (firstUser) {
        userId = firstUser._id.toString();
      }
    }

    await integrationService.saveIntegrationCredentials(
      userId,
      provider,
      {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresAt,
        scopes: ['read', 'write']
      }
    );

    // Redirect user back to Client UI integrations tab
    return res.redirect(`${env.CLIENT_URL}/integrations?provider=${provider}&status=connected`);
  } catch (error) {
    return res.redirect(`${env.CLIENT_URL}/integrations?status=error&error=${encodeURIComponent(error.message)}`);
  }
}

// Manual integration credential setup
export async function setupManual(req, res) {
  try {
    const { provider, accessToken, refreshToken, expiresAt, scopes } = req.body;
    
    if (!provider || !accessToken) {
      return res.status(400).json({ message: 'Provider and Access Token are required.' });
    }

    const doc = await integrationService.saveIntegrationCredentials(
      req.user._id || req.user.id,
      provider,
      {
        accessToken,
        refreshToken: refreshToken || '',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        scopes: scopes || []
      }
    );

    return res.status(200).json({
      message: 'Integration connected manually successfully',
      integration: {
        provider: doc.provider,
        isConnected: doc.isConnected
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Disconnect
export async function remove(req, res) {
  try {
    const { provider } = req.params;
    await integrationService.disconnectIntegration(req.user._id || req.user.id, provider);
    return res.status(200).json({ message: `Disconnected ${provider} integration successfully.` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
