import { validationResult } from 'express-validator';
import * as authService from '../services/authService.js';
import { env } from '../config/env.js';

export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, role } = req.body;
    const user = await authService.registerUser({ name, email, password, role });
    const token = authService.generateToken(user);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await authService.loginUser({ email, password });
    const token = authService.generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
}

export async function getMe(req, res) {
  try {
    // req.user is already populated by protect middleware
    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function socialLogin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { provider } = req.body;
    const user = await authService.authenticateSocialUser({ provider });
    const token = authService.generateToken(user);

    return res.status(200).json({
      message: `Login with ${provider} successful`,
      token,
      user,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export function getClientUrl(req) {
  if (req) {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
    const host = req.get('x-forwarded-host') || req.get('host');
    if (host) {
      return `${proto}://${host}`;
    }
  }
  return env.CLIENT_URL || 'http://localhost:3000';
}

// Initiates Google OAuth redirect with prompt=select_account
export async function googleAuth(req, res) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${getClientUrl(req)}/login?error=google_not_configured`);
  }

  const redirectUri = `${getClientUrl(req)}/api/auth/google/callback`;
  const scope = encodeURIComponent('openid email profile');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;

  return res.redirect(googleAuthUrl);
}

// Handles Google OAuth callback and session exchange
export async function googleCallback(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    console.error('Google OAuth error or cancellation:', error);
    return res.redirect(`${getClientUrl(req)}/login?error=${encodeURIComponent(error || 'Google login was cancelled')}`);
  }

  try {
    const redirectUri = `${getClientUrl(req)}/api/auth/google/callback`;

    // 1. Exchange authorization code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to exchange code with Google:', tokenData);
      return res.redirect(`${getClientUrl(req)}/login?error=Failed to exchange Google authorization token`);
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();
    if (!profile.email) {
      return res.redirect(`${getClientUrl(req)}/login?error=No email returned by Google account`);
    }

    // 3. Find or create user
    const user = await authService.findOrCreateOAuthUser({
      email: profile.email,
      name: profile.name || profile.given_name || profile.email.split('@')[0],
      provider: 'google',
      avatar: profile.picture,
    });

    // 4. Generate JWT
    const token = authService.generateToken(user);

    // 5. Redirect back to frontend with session token
    return res.redirect(`${getClientUrl(req)}/login?token=${token}`);
  } catch (err) {
    console.error('Error during Google OAuth callback:', err);
    return res.redirect(`${getClientUrl(req)}/login?error=${encodeURIComponent(err.message || 'Google authentication failed')}`);
  }
}

// Initiates GitHub OAuth redirect
export async function githubAuth(req, res) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return res.redirect(`${getClientUrl(req)}/login?error=github_not_configured`);
  }

  const redirectUri = `${getClientUrl(req)}/api/auth/github/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&prompt=consent`;

  return res.redirect(githubAuthUrl);
}

// Handles GitHub OAuth callback
export async function githubCallback(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${getClientUrl(req)}/login?error=${encodeURIComponent(error || 'GitHub login was cancelled')}`);
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.redirect(`${getClientUrl(req)}/login?error=Failed to retrieve GitHub access token`);
    }

    // Fetch GitHub profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Agentflow_AI',
      },
    });
    const ghUser = await userRes.json();

    let email = ghUser.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Agentflow_AI',
        },
      });
      const emails = await emailsRes.json();
      const primaryEmail = emails.find((e) => e.primary) || emails[0];
      email = primaryEmail?.email;
    }

    if (!email) {
      return res.redirect(`${getClientUrl(req)}/login?error=No email associated with GitHub account`);
    }

    const user = await authService.findOrCreateOAuthUser({
      email,
      name: ghUser.name || ghUser.login,
      provider: 'github',
      avatar: ghUser.avatar_url,
    });

    const token = authService.generateToken(user);
    return res.redirect(`${getClientUrl(req)}/login?token=${token}`);
  } catch (err) {
    console.error('Error during GitHub OAuth callback:', err);
    return res.redirect(`${getClientUrl(req)}/login?error=${encodeURIComponent(err.message || 'GitHub authentication failed')}`);
  }
}

// Initiates X (Twitter) OAuth 2.0 redirect
export async function twitterAuth(req, res) {
  if (!env.TWITTER_CLIENT_ID || !env.TWITTER_CLIENT_SECRET) {
    return res.redirect(`${getClientUrl(req)}/login?error=twitter_not_configured`);
  }

  const clientUrl = getClientUrl(req);
  const redirectUri = `${clientUrl}/api/auth/twitter/callback`;
  const scope = encodeURIComponent('tweet.read users.read offline.access');
  const state = encodeURIComponent(JSON.stringify({ clientUrl }));
  const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;

  return res.redirect(twitterAuthUrl);
}

// Handles X (Twitter) OAuth 2.0 callback
export async function twitterCallback(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${getClientUrl(req)}/login?error=${encodeURIComponent(error || 'X (Twitter) login was cancelled')}`);
  }

  try {
    let clientUrl = getClientUrl(req);
    try {
      if (req.query.state) {
        const s = JSON.parse(decodeURIComponent(req.query.state));
        if (s.clientUrl) clientUrl = s.clientUrl;
      }
    } catch (e) {}
    const redirectUri = `${clientUrl}/api/auth/twitter/callback`;
    const basicAuth = Buffer.from(`${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`).toString('base64');

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: env.TWITTER_CLIENT_ID,
        redirect_uri: redirectUri,
        code_verifier: 'challenge',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('Failed to exchange code with Twitter:', tokenData);
      return res.redirect(`${clientUrl}/login?error=Failed to retrieve X (Twitter) access token`);
    }

    // Fetch Twitter user info
    const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userRes.json();
    const twUser = userData.data;
    if (!twUser) {
      return res.redirect(`${clientUrl}/login?error=Failed to get profile from Twitter`);
    }

    const email = `${twUser.username.toLowerCase()}@x.com`;
    const user = await authService.findOrCreateOAuthUser({
      email,
      name: twUser.name || twUser.username,
      provider: 'twitter',
      avatar: twUser.profile_image_url,
    });

    const token = authService.generateToken(user);
    return res.redirect(`${clientUrl}/login?token=${token}`);
  } catch (err) {
    console.error('Error during Twitter OAuth callback:', err);
    return res.redirect(`${getClientUrl(req)}/login?error=${encodeURIComponent(err.message || 'X (Twitter) authentication failed')}`);
  }
}


// Initiates Facebook (Meta) OAuth redirect
export async function facebookAuth(req, res) {
  if (!env.FACEBOOK_CLIENT_ID || !env.FACEBOOK_CLIENT_SECRET) {
    return res.redirect(`${getClientUrl(req)}/login?error=facebook_not_configured`);
  }

  const redirectUri = `${getClientUrl(req)}/api/auth/facebook/callback`;
  const facebookAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile&auth_type=rerequest`;

  return res.redirect(facebookAuthUrl);
}

// Handles Facebook (Meta) OAuth callback
export async function facebookCallback(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${getClientUrl(req)}/login?error=${encodeURIComponent(error || 'Facebook login was cancelled')}`);
  }

  try {
    const redirectUri = `${getClientUrl(req)}/api/auth/facebook/callback`;

    // 1. Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${env.FACEBOOK_CLIENT_SECRET}&code=${code}`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Failed to get Facebook access token:', tokenData);
      return res.redirect(`${getClientUrl(req)}/login?error=Failed to retrieve Facebook access token`);
    }

    // 2. Fetch Facebook profile
    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`;
    const profileResponse = await fetch(profileUrl);
    const profile = await profileResponse.json();

    const email = profile.email || `facebook_${profile.id}@facebook.com`;
    const avatar = profile.picture?.data?.url || '';

    const user = await authService.findOrCreateOAuthUser({
      email,
      name: profile.name || `Facebook User`,
      provider: 'facebook',
      avatar,
    });

    const token = authService.generateToken(user);
    return res.redirect(`${getClientUrl(req)}/login?token=${token}`);
  } catch (err) {
    console.error('Error during Facebook OAuth callback:', err);
    return res.redirect(`${getClientUrl(req)}/login?error=${encodeURIComponent(err.message || 'Facebook authentication failed')}`);
  }
}

