import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Exchange, Product, User, ChatRoom } from '../models/index.js';
import { authenticate } from '../middleware/authenticate.js';
import { generateExchangeCode } from '../services/exchangeService.js';
import { Op } from 'sequelize';

const router = Router();

// POST /api/exchanges - Request an exchange
router.post('/', authenticate, [
  body('product_requested_id').isUUID(),
  body('product_offered_id').optional().isUUID(),
], async (req, res, next) => {
  try {
    const { product_requested_id, product_offered_id } = req.body;

    const productRequested = await Product.findByPk(product_requested_id);
    if (!productRequested || productRequested.status !== 'active') {
      return res.status(404).json({ error: 'Prenda no encontrada o no disponible' });
    }

    if (productRequested.user_id === req.user.id) {
      return res.status(400).json({ error: 'No podes solicitar un intercambio con vos mismo' });
    }

    // Check for existing pending exchange
    const existing = await Exchange.findOne({
      where: {
        requester_id: req.user.id,
        product_requested_id,
        status: { [Op.in]: ['pending', 'accepted', 'formalized'] },
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'Ya tenes un intercambio activo para esta prenda' });
    }

    const exchange = await Exchange.create({
      requester_id: req.user.id,
      owner_id: productRequested.user_id,
      product_requested_id,
      product_offered_id,
    });

    // Create chat room
    const chatRoom = await ChatRoom.create({
      exchange_id: exchange.id,
      user1_id: req.user.id,
      user2_id: productRequested.user_id,
    });

    // System message
    const { Message } = await import('../models/index.js');
    await Message.create({
      room_id: chatRoom.id,
      sender_id: req.user.id,
      content: `${req.user.display_name} solicito un intercambio.`,
      message_type: 'system',
    });

    // Notify owner via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${productRequested.user_id}`).emit('notification:new', {
        type: 'exchange_request',
        data: {
          exchangeId: exchange.id,
          requesterName: req.user.display_name,
          productTitle: productRequested.title,
          roomId: chatRoom.id,
        },
      });
    }

    res.status(201).json({ exchange, chatRoom });
  } catch (error) {
    next(error);
  }
});

// GET /api/exchanges/my
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const exchanges = await Exchange.findAll({
      where: {
        [Op.or]: [
          { requester_id: req.user.id },
          { owner_id: req.user.id },
        ],
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'display_name', 'avatar_url'] },
        { model: User, as: 'owner', attributes: ['id', 'display_name', 'avatar_url'] },
        { model: Product, as: 'productRequested', attributes: ['id', 'title', 'images'] },
        { model: Product, as: 'productOffered', attributes: ['id', 'title', 'images'] },
        { model: ChatRoom, as: 'chatRoom', attributes: ['id'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ exchanges });
  } catch (error) {
    next(error);
  }
});

// GET /api/exchanges/:id
router.get('/:id', authenticate, [param('id').isUUID()], async (req, res, next) => {
  try {
    const exchange = await Exchange.findByPk(req.params.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'display_name', 'avatar_url', 'rating_avg'] },
        { model: User, as: 'owner', attributes: ['id', 'display_name', 'avatar_url', 'rating_avg'] },
        { model: Product, as: 'productRequested' },
        { model: Product, as: 'productOffered' },
        { model: ChatRoom, as: 'chatRoom', attributes: ['id'] },
      ],
    });

    if (!exchange) return res.status(404).json({ error: 'Intercambio no encontrado' });
    if (exchange.requester_id !== req.user.id && exchange.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    res.json({ exchange });
  } catch (error) {
    next(error);
  }
});

// PUT /api/exchanges/:id/accept
router.put('/:id/accept', authenticate, async (req, res, next) => {
  try {
    const exchange = await Exchange.findByPk(req.params.id);
    if (!exchange) return res.status(404).json({ error: 'Intercambio no encontrado' });
    if (exchange.owner_id !== req.user.id) return res.status(403).json({ error: 'Solo el dueno puede aceptar' });
    if (exchange.status !== 'pending') return res.status(400).json({ error: 'El intercambio ya no esta pendiente' });

    await exchange.update({ status: 'accepted' });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${exchange.requester_id}`).emit('exchange:status_update', { exchange });
    }

    res.json({ exchange });
  } catch (error) {
    next(error);
  }
});

// PUT /api/exchanges/:id/reject
router.put('/:id/reject', authenticate, async (req, res, next) => {
  try {
    const exchange = await Exchange.findByPk(req.params.id);
    if (!exchange) return res.status(404).json({ error: 'Intercambio no encontrado' });
    if (exchange.owner_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    await exchange.update({ status: 'rejected' });
    res.json({ exchange });
  } catch (error) {
    next(error);
  }
});

// PUT /api/exchanges/:id/formalize
router.put('/:id/formalize', authenticate, [
  body('product_offered_id').isUUID(),
], async (req, res, next) => {
  try {
    const exchange = await Exchange.findByPk(req.params.id);
    if (!exchange) return res.status(404).json({ error: 'Intercambio no encontrado' });
    if (exchange.status !== 'accepted') return res.status(400).json({ error: 'El intercambio debe estar aceptado' });

    const code = generateExchangeCode();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    await exchange.update({
      status: 'formalized',
      product_offered_id: req.body.product_offered_id,
      exchange_code: code,
      formalized_at: new Date(),
      expires_at: expiresAt,
    });

    // Mark both products as reserved
    await Product.update({ status: 'reserved' }, {
      where: { id: { [Op.in]: [exchange.product_requested_id, req.body.product_offered_id] } },
    });

    const io = req.app.get('io');
    if (io) {
      const otherUserId = exchange.requester_id === req.user.id ? exchange.owner_id : exchange.requester_id;
      io.to(`user:${otherUserId}`).emit('exchange:status_update', { exchange });
    }

    res.json({ exchange });
  } catch (error) {
    next(error);
  }
});

// PUT /api/exchanges/:id/confirm
router.put('/:id/confirm', authenticate, async (req, res, next) => {
  try {
    const exchange = await Exchange.findByPk(req.params.id);
    if (!exchange) return res.status(404).json({ error: 'Intercambio no encontrado' });
    if (exchange.status !== 'formalized') return res.status(400).json({ error: 'El intercambio debe estar formalizado' });

    const updateData = {};
    if (exchange.requester_id === req.user.id) updateData.requester_confirmed = true;
    if (exchange.owner_id === req.user.id) updateData.owner_confirmed = true;

    await exchange.update(updateData);
    await exchange.reload();

    // Check if both confirmed
    if (exchange.requester_confirmed && exchange.owner_confirmed) {
      await exchange.update({ status: 'completed', completed_at: new Date() });

      // Mark products as exchanged
      await Product.update({ status: 'exchanged' }, {
        where: { id: { [Op.in]: [exchange.product_requested_id, exchange.product_offered_id].filter(Boolean) } },
      });
    }

    const io = req.app.get('io');
    if (io) {
      const otherUserId = exchange.requester_id === req.user.id ? exchange.owner_id : exchange.requester_id;
      io.to(`user:${otherUserId}`).emit('exchange:status_update', { exchange });
    }

    res.json({ exchange });
  } catch (error) {
    next(error);
  }
});

// PUT /api/exchanges/:id/cancel
router.put('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const exchange = await Exchange.findByPk(req.params.id);
    if (!exchange) return res.status(404).json({ error: 'Intercambio no encontrado' });
    if (exchange.requester_id !== req.user.id && exchange.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    if (['completed', 'rejected', 'cancelled'].includes(exchange.status)) {
      return res.status(400).json({ error: 'No se puede cancelar este intercambio' });
    }

    // Restore products if they were reserved
    if (exchange.status === 'formalized') {
      await Product.update({ status: 'active' }, {
        where: { id: { [Op.in]: [exchange.product_requested_id, exchange.product_offered_id].filter(Boolean) } },
      });
    }

    await exchange.update({ status: 'cancelled' });
    res.json({ exchange });
  } catch (error) {
    next(error);
  }
});

export default router;
