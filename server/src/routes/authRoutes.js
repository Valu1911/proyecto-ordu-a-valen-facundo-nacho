import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { User } from '../models/index.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 500 : 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
}

function sanitizeUser(user) {
  const { password_hash, refresh_token, ...userData } = user.toJSON();
  return userData;
}

// POST /api/auth/register
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Email invalido'),
  body('password').isLength({ min: 8 }).withMessage('La contrasena debe tener al menos 8 caracteres'),
  body('display_name').trim().isLength({ min: 2, max: 100 }).withMessage('Nombre entre 2 y 100 caracteres'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos invalidos', details: errors.array() });
    }

    const { email, password, display_name } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe una cuenta con este email' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      password_hash,
      display_name,
    });

    const { accessToken, refreshToken } = generateTokens(user);
    await user.update({ refresh_token: refreshToken, last_login: new Date() });

    res.status(201).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos invalidos', details: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Email o contrasena incorrectos' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email o contrasena incorrectos' });
    }

    // Check ban
    if (user.is_banned) {
      if (user.ban_type === 'permanent') {
        return res.status(403).json({
          error: 'Tu cuenta fue suspendida permanentemente.',
          reason: user.ban_reason,
        });
      }
      if (user.ban_until && new Date(user.ban_until) > new Date()) {
        return res.status(403).json({
          error: 'Tu cuenta esta suspendida temporalmente.',
          reason: user.ban_reason,
          until: user.ban_until,
        });
      }
      // Ban expired
      await user.update({ is_banned: false, ban_type: null, ban_until: null, ban_reason: null });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await user.update({ refresh_token: refreshToken, last_login: new Date() });

    res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/google-simulate (simulated Google OAuth for development)
router.post('/google-simulate', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('display_name').trim().isLength({ min: 2 }),
  body('avatar_url').optional().isURL(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos invalidos', details: errors.array() });
    }

    const { email, display_name, avatar_url } = req.body;

    let user = await User.findOne({ where: { email } });

    if (user) {
      // Existing user - update Google info
      await user.update({
        display_name: display_name || user.display_name,
        avatar_url: avatar_url || user.avatar_url,
        google_id: `google_sim_${Date.now()}`,
        last_login: new Date(),
      });
    } else {
      // New user
      user = await User.create({
        email,
        display_name,
        avatar_url,
        google_id: `google_sim_${Date.now()}`,
        last_login: new Date(),
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await user.update({ refresh_token: refreshToken });

    res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token requerido' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ error: 'Token invalido' });
    }

    const tokens = generateTokens(user);
    await user.update({ refresh_token: tokens.refreshToken });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expirado. Inicia sesion nuevamente.' });
    }
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await req.user.update({ refresh_token: null });
  res.json({ message: 'Sesion cerrada' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

export default router;
