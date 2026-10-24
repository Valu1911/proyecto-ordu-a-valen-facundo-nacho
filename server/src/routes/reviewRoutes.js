import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Review, Exchange, User } from '../models/index.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// POST /api/reviews - Create a review after exchange completion
router.post('/', authenticate, [
  body('exchange_id').isUUID().withMessage('ID de intercambio invalido'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La calificacion debe ser entre 1 y 5'),
  body('comment').trim().isLength({ min: 5, max: 500 }).withMessage('El comentario debe tener entre 5 y 500 caracteres'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { exchange_id, rating, comment } = req.body;

    const exchange = await Exchange.findByPk(exchange_id);
    if (!exchange) {
      return res.status(404).json({ error: 'Intercambio no encontrado' });
    }

    if (exchange.status !== 'completed') {
      return res.status(400).json({ error: 'Solo podes calificar intercambios completados' });
    }

    // Check that caller is one of the exchange participants
    const isRequester = exchange.requester_id === req.user.id;
    const isOwner = exchange.owner_id === req.user.id;

    if (!isRequester && !isOwner) {
      return res.status(403).json({ error: 'No participaste en este intercambio' });
    }

    const reviewed_id = isRequester ? exchange.owner_id : exchange.requester_id;

    // Check if user already reviewed this exchange
    const existingReview = await Review.findOne({
      where: {
        reviewer_id: req.user.id,
        exchange_id,
      },
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Ya calificaste este intercambio' });
    }

    const review = await Review.create({
      reviewer_id: req.user.id,
      reviewed_id,
      exchange_id,
      rating,
      comment,
    });

    // Update reviewed user's rating stats
    const allReviews = await Review.findAll({
      where: { reviewed_id },
      attributes: ['rating'],
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const ratingCount = allReviews.length;
    const ratingAvg = (totalRating / ratingCount).toFixed(1);

    await User.update(
      { rating_avg: ratingAvg, rating_count: ratingCount },
      { where: { id: reviewed_id } }
    );

    res.status(201).json({
      message: 'Resena publicada exitosamente',
      review,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reviews/user/:userId - Get reviews for a user
router.get('/user/:userId', [
  param('userId').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: { reviewed_id: req.params.userId },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'display_name', 'avatar_url'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      reviews: rows,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
