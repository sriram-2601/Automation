import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { dbStatus } from '../config/db.js';

// In-memory user store fallback
const inMemoryUsers = [];

// Helper to sign JWT token
export function generateToken(user) {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export async function registerUser({ name, email, password, role = 'operator' }) {
  // Validate duplicate email
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Hash password with cost factor 12
  const hashedPassword = await bcrypt.hash(password, 12);

  if (dbStatus.connected) {
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });
    await newUser.save();
    
    // Return document converted to object, removing password
    const userObj = newUser.toObject();
    delete userObj.password;
    return userObj;
  } else {
    // In-Memory Fallback
    const mockId = `mock-user-${Date.now()}`;
    const newUser = {
      _id: mockId,
      id: mockId,
      name,
      email,
      password: hashedPassword,
      role,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryUsers.push(newUser);
    
    const userCopy = { ...newUser };
    delete userCopy.password;
    return userCopy;
  }
}

export async function loginUser({ email, password }) {
  let user = null;

  if (dbStatus.connected) {
    // Explicitly select password since it has select: false
    user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid email or password');
    }
  } else {
    // In-Memory Fallback
    user = inMemoryUsers.find(u => u.email === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  const now = new Date();
  if (dbStatus.connected) {
    user.lastLogin = now;
    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  } else {
    // Update reference in inMemoryUsers
    const idx = inMemoryUsers.findIndex(u => u._id === user._id);
    if (idx !== -1) {
      inMemoryUsers[idx].lastLogin = now;
    }
    const userCopy = { ...user };
    delete userCopy.password;
    return userCopy;
  }
}

export async function getUserById(userId) {
  if (dbStatus.connected) {
    const user = await User.findById(userId);
    return user;
  } else {
    const user = inMemoryUsers.find(u => u._id === userId || u.id === userId);
    if (!user) return null;
    const userCopy = { ...user };
    delete userCopy.password;
    return userCopy;
  }
}

export async function findUserByEmail(email) {
  const normEmail = email.toLowerCase();
  if (dbStatus.connected) {
    return await User.findOne({ email: normEmail });
  } else {
    return inMemoryUsers.find(u => u.email === normEmail) || null;
  }
}
