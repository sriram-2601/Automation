import { validationResult } from 'express-validator';
import * as authService from '../services/authService.js';

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
