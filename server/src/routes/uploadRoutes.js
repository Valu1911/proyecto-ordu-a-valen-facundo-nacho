import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  uploadProductImages,
  uploadChatImage,
  uploadAvatar,
  processImage,
  processAvatar,
} from '../middleware/upload.js';
import { User } from '../models/index.js';

const router = Router();

// POST /api/upload/product-images - Upload up to 6 images for a product
router.post('/product-images', authenticate, (req, res, next) => {
  uploadProductImages(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error al subir imagenes' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Debes enviar al menos una imagen' });
    }

    try {
      const urls = [];
      for (const file of req.files) {
        const url = await processImage(file.buffer, 'products', {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 82,
        });
        urls.push(url);
      }

      res.json({ urls });
    } catch (processErr) {
      next(processErr);
    }
  });
});

// POST /api/upload/chat-image - Upload a single image for chat
router.post('/chat-image', authenticate, (req, res, next) => {
  uploadChatImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error al subir imagen de chat' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se envio ninguna imagen' });
    }

    try {
      const url = await processImage(req.file.buffer, 'chat', {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 80,
      });

      res.json({ url });
    } catch (processErr) {
      next(processErr);
    }
  });
});

// POST /api/upload/avatar - Upload profile avatar
router.post('/avatar', authenticate, (req, res, next) => {
  uploadAvatar(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error al subir avatar' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se envio ningun archivo' });
    }

    try {
      const avatarUrl = await processAvatar(req.file.buffer);
      await User.update({ avatar_url: avatarUrl }, { where: { id: req.user.id } });

      res.json({ avatar_url: avatarUrl });
    } catch (processErr) {
      next(processErr);
    }
  });
});

export default router;
