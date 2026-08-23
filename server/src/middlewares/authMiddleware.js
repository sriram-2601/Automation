import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getUserById } from '../services/authService.js';

export async function protect(req, res, next) {
  let token;

  // Read token from Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Fetch user from DB or memory fallback
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // Attach user to req object
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token validation failed' });
  }
}

// Middleware to restrict access to specific roles
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user ? req.user.role : 'none'}) is not authorized to access this resource` 
      });
    }
    next();
  };
}
