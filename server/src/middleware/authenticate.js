import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso no autorizado. Inicia sesion.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash', 'refresh_token'] },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Check if user is banned
    if (user.is_banned) {
      if (user.ban_type === 'permanent') {
        return res.status(403).json({
          error: 'Tu cuenta fue suspendida permanentemente.',
          reason: user.ban_reason,
        });
      }
      if (user.ban_type === 'temporary' && user.ban_until && new Date(user.ban_until) > new Date()) {
        return res.status(403).json({
          error: 'Tu cuenta esta suspendida temporalmente.',
          reason: user.ban_reason,
          until: user.ban_until,
        });
      }
      // Ban expired, auto-unban
      if (user.ban_type === 'temporary' && user.ban_until && new Date(user.ban_until) <= new Date()) {
        await user.update({ is_banned: false, ban_type: null, ban_until: null, ban_reason: null });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesion expirada. Inicia sesion nuevamente.' });
    }
    next(error);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tenes permisos para esta accion' });
    }
    next();
  };
}
