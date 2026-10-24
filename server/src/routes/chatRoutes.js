import { Router } from 'express';
import { param } from 'express-validator';
import { ChatRoom, Message, User } from '../models/index.js';
import { authenticate } from '../middleware/authenticate.js';
import { processImage } from '../middleware/upload.js';
import { Op } from 'sequelize';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/chat/rooms - My chat rooms
router.get('/rooms', authenticate, async (req, res, next) => {
  try {
    const rooms = await ChatRoom.findAll({
      where: {
        [Op.or]: [
          { user1_id: req.user.id, user1_deleted: false },
          { user2_id: req.user.id, user2_deleted: false },
        ],
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'display_name', 'avatar_url'] },
        { model: User, as: 'user2', attributes: ['id', 'display_name', 'avatar_url'] },
      ],
      order: [['last_message_at', 'DESC']],
    });

    // Get last message for each room
    const roomsWithLastMessage = await Promise.all(rooms.map(async (room) => {
      const lastMessage = await Message.findOne({
        where: { room_id: room.id },
        order: [['created_at', 'DESC']],
        attributes: ['content', 'message_type', 'created_at', 'sender_id'],
      });

      const unreadCount = await Message.count({
        where: {
          room_id: room.id,
          sender_id: { [Op.ne]: req.user.id },
          is_read: false,
        },
      });

      return {
        ...room.toJSON(),
        lastMessage,
        unreadCount,
      };
    }));

    res.json({ rooms: roomsWithLastMessage });
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/rooms/:id/messages
router.get('/rooms/:id/messages', authenticate, [param('id').isUUID()], async (req, res, next) => {
  try {
    const room = await ChatRoom.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: 'Chat no encontrado' });

    if (room.user1_id !== req.user.id && room.user2_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { room_id: req.params.id },
      include: [{ model: User, as: 'sender', attributes: ['id', 'display_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Mark messages as read
    await Message.update(
      { is_read: true },
      {
        where: {
          room_id: req.params.id,
          sender_id: { [Op.ne]: req.user.id },
          is_read: false,
        },
      }
    );

    res.json({
      messages: messages.reverse(),
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/chat/rooms/:id/image - Upload image to chat
router.post('/rooms/:id/image', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Imagen requerida' });

    const room = await ChatRoom.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: 'Chat no encontrado' });

    if (room.user1_id !== req.user.id && room.user2_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const imageUrl = await processImage(req.file.buffer, 'chat');

    const message = await Message.create({
      room_id: req.params.id,
      sender_id: req.user.id,
      image_url: imageUrl,
      message_type: 'image',
    });

    await room.update({ last_message_at: new Date() });

    const io = req.app.get('io');
    if (io) {
      const messageData = {
        ...message.toJSON(),
        sender: { id: req.user.id, display_name: req.user.display_name, avatar_url: req.user.avatar_url },
      };
      io.to(`room:${req.params.id}`).emit('chat:new_message', messageData);
    }

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/chat/rooms/:id - Soft delete for current user only
router.delete('/rooms/:id', authenticate, [param('id').isUUID()], async (req, res, next) => {
  try {
    const room = await ChatRoom.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: 'Chat no encontrado' });

    if (room.user1_id === req.user.id) {
      await room.update({ user1_deleted: true });
    } else if (room.user2_id === req.user.id) {
      await room.update({ user2_deleted: true });
    } else {
      return res.status(403).json({ error: 'No autorizado' });
    }

    res.json({ message: 'Chat eliminado de tu cuenta. Los mensajes se conservan por seguridad.' });
  } catch (error) {
    next(error);
  }
});

export default router;
