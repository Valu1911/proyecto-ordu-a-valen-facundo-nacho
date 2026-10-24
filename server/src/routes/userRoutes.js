import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { User, Review, Product } from '../models/index.js';
import { authenticate } from '../middleware/authenticate.js';
import { processAvatar } from '../middleware/upload.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 } });

// GET /api/users/top-rated
router.get('/top-rated', async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { is_banned: false, rating_count: { [Symbol.for('gte')]: 1 } },
      attributes: ['id', 'display_name', 'avatar_url', 'rating_avg', 'rating_count', 'location_city', 'bio', 'created_at'],
      order: [['rating_avg', 'DESC'], ['rating_count', 'DESC']],
      limit: 10,
    });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id
router.get('/:id', [param('id').isUUID()], async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash', 'refresh_token', 'google_id'] },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const products = await Product.findAll({
      where: { user_id: user.id, status: 'active' },
      order: [['created_at', 'DESC']],
    });

    const reviews = await Review.findAll({
      where: { reviewed_id: user.id },
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'display_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    res.json({ user, products, reviews });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/profile
router.put('/profile', authenticate, [
  body('display_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('location_city').optional().trim(),
  body('location_province').optional().trim(),
  body('location_lat').optional().isDecimal(),
  body('location_lng').optional().isDecimal(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos invalidos', details: errors.array() });
    }

    const allowedFields = ['display_name', 'bio', 'location_city', 'location_province', 'location_lat', 'location_lng'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    await req.user.update(updateData);
    const { password_hash, refresh_token, ...userData } = req.user.toJSON();
    res.json({ user: userData });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/avatar
router.put('/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Imagen requerida' });

    const avatarUrl = await processAvatar(req.file.buffer);
    await req.user.update({ avatar_url: avatarUrl });

    res.json({ avatar_url: avatarUrl });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/location
router.put('/location', authenticate, [
  body('lat').isDecimal(),
  body('lng').isDecimal(),
  body('city').optional().trim(),
  body('province').optional().trim(),
], async (req, res, next) => {
  try {
    await req.user.update({
      location_lat: req.body.lat,
      location_lng: req.body.lng,
      location_city: req.body.city,
      location_province: req.body.province,
    });
    res.json({ message: 'Ubicacion actualizada' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/change-password
router.put('/change-password', authenticate, [
  body('current_password').isLength({ min: 6 }),
  body('new_password').isLength({ min: 8 }).withMessage('La nueva contrasena debe tener al menos 8 caracteres'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { current_password, new_password } = req.body;
    if (req.user.password_hash) {
      const isValid = await bcrypt.compare(current_password, req.user.password_hash);
      if (!isValid) {
        return res.status(400).json({ error: 'La contraseña actual no es correcta' });
      }
    }

    const hashed = await bcrypt.hash(new_password, 12);
    await req.user.update({ password_hash: hashed });

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
