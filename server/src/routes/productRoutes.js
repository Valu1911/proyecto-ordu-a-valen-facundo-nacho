import { Router } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { body, query, param, validationResult } from 'express-validator';
import { Product, User } from '../models/index.js';
import { authenticate } from '../middleware/authenticate.js';
import { aiService } from '../services/aiService.js';

const router = Router();

// GET /api/products - List with filters, pagination, geo
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isString(),
  query('style').optional().isString(),
  query('gender').optional().isString(),
  query('size').optional().isString(),
  query('condition').optional().isString(),
  query('brand').optional().isString(),
  query('search').optional().isString(),
  query('sort').optional().isIn(['newest', 'rating', 'nearest']),
  query('lat').optional().isDecimal(),
  query('lng').optional().isDecimal(),
  query('radius').optional().isInt({ min: 1 }),
], async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, category, style, gender, size,
      condition, brand, search, sort = 'newest',
      lat, lng, radius = 50,
    } = req.query;

    const where = { status: 'active' };

    if (category) where.category = category;
    if (style) where.style = style;
    if (gender) where.gender = gender;
    if (size) where.size = size;
    if (condition) where.item_condition = condition;
    if (brand) where.brand = { [Op.like]: `%${brand}%` };
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
      ];
    }

    let order = [['created_at', 'DESC']];
    const attributes = { include: [] };

    // Geo-distance filter using Haversine formula
    if (lat && lng) {
      const haversine = literal(
        `(6371 * acos(cos(radians(${parseFloat(lat)})) * cos(radians(location_lat)) * cos(radians(location_lng) - radians(${parseFloat(lng)})) + sin(radians(${parseFloat(lat)})) * sin(radians(location_lat))))`
      );
      attributes.include.push([haversine, 'distance']);

      if (radius && radius < 10000) {
        where[Op.and] = literal(
          `(6371 * acos(cos(radians(${parseFloat(lat)})) * cos(radians(location_lat)) * cos(radians(location_lng) - radians(${parseFloat(lng)})) + sin(radians(${parseFloat(lat)})) * sin(radians(location_lat)))) <= ${parseInt(radius)}`
        );
      }

      if (sort === 'nearest') {
        order = [[literal('distance'), 'ASC']];
      }
    }

    if (sort === 'rating') {
      order = [[literal('`owner`.`rating_avg`'), 'DESC']];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Product.findAndCountAll({
      where,
      attributes,
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'display_name', 'avatar_url', 'rating_avg', 'rating_count', 'location_city'],
      }],
      order,
      limit: parseInt(limit),
      offset,
    });

    res.json({
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/nearby
router.get('/nearby', [
  query('lat').isDecimal(),
  query('lng').isDecimal(),
  query('radius').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 20 }),
], async (req, res, next) => {
  try {
    const { lat, lng, radius = 30, limit = 10 } = req.query;

    const haversine = literal(
      `(6371 * acos(cos(radians(${parseFloat(lat)})) * cos(radians(location_lat)) * cos(radians(location_lng) - radians(${parseFloat(lng)})) + sin(radians(${parseFloat(lat)})) * sin(radians(location_lat))))`
    );

    const products = await Product.findAll({
      where: {
        status: 'active',
        location_lat: { [Op.ne]: null },
        [Op.and]: literal(
          `(6371 * acos(cos(radians(${parseFloat(lat)})) * cos(radians(location_lat)) * cos(radians(location_lng) - radians(${parseFloat(lng)})) + sin(radians(${parseFloat(lat)})) * sin(radians(location_lat)))) <= ${parseInt(radius)}`
        ),
      },
      attributes: { include: [[haversine, 'distance']] },
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'display_name', 'avatar_url', 'rating_avg', 'location_city'],
      }],
      order: [[literal('distance'), 'ASC']],
      limit: parseInt(limit),
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/user/:userId
router.get('/user/:userId', [
  param('userId').isUUID(),
], async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { user_id: req.params.userId, status: 'active' },
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'display_name', 'avatar_url', 'rating_avg'],
      }],
      order: [['created_at', 'DESC']],
    });
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/recommendations/personalized - Feed recommendations
router.get('/recommendations/personalized', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const style = req.query.style || 'streetwear';
    const keywords = req.query.keywords || '';
    const recommendations = await aiService.getPersonalizedFeed(req.user, limit, style, keywords);
    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id/recommendations - Content-based item recommendations
router.get('/:id/recommendations', [param('id').isUUID()], async (req, res, next) => {
  try {
    const { lat, lng, limit = 6 } = req.query;
    const recommendations = await aiService.getRecommendationsForProduct(
      req.params.id,
      lat ? parseFloat(lat) : null,
      lng ? parseFloat(lng) : null,
      parseInt(limit)
    );
    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id
router.get('/:id', [param('id').isUUID()], async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'display_name', 'avatar_url', 'bio', 'rating_avg', 'rating_count', 'location_city', 'created_at'],
      }],
    });

    if (!product || product.status === 'deleted') {
      return res.status(404).json({ error: 'Prenda no encontrada' });
    }

    // Increment views
    await product.increment('views_count');

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - Create
router.post('/', authenticate, (req, res, next) => {
  if (req.body.condition && !req.body.item_condition) {
    req.body.item_condition = req.body.condition;
  }
  next();
}, [
  body('title').trim().isLength({ min: 3, max: 150 }),
  body('description').trim().isLength({ min: 10 }),
  body('category').isIn(['remera', 'buzo', 'bermuda', 'pantalon', 'campera', 'camiseta_futbol', 'zapatillas', 'accesorio', 'otro', 'camisetas', 'calzado', 'accesorios']),
  body('style').isIn(['streetwear', 'y2k', 'retro', 'urban', 'deportivo', 'baggy', 'under', 'clasico', 'casual', 'vintage', 'formal']),
  body('gender').isIn(['hombre', 'mujer', 'unisex', 'ninos']),
  body('size').trim().notEmpty(),
  body('item_condition').isIn(['nuevo', 'como_nuevo', 'buen_estado', 'usado', 'muy_bueno', 'bueno']),
  body('brand').optional().trim(),
  body('images').isArray({ min: 1, max: 6 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos invalidos', details: errors.array() });
    }

    // Check if user has active exchanges pending confirmation
    const user = req.user;

    const product = await Product.create({
      ...req.body,
      user_id: user.id,
      location_lat: req.body.location_lat || user.location_lat,
      location_lng: req.body.location_lng || user.location_lng,
    });

    const fullProduct = await Product.findByPk(product.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'display_name', 'avatar_url', 'rating_avg'] }],
    });

    res.status(201).json({ product: fullProduct });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - Update
router.put('/:id', authenticate, [
  param('id').isUUID(),
  body('title').optional().trim().isLength({ min: 3, max: 150 }),
  body('description').optional().trim().isLength({ min: 10 }),
], async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Prenda no encontrada' });
    if (product.user_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    await product.update(req.body);
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, [param('id').isUUID()], async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Prenda no encontrada' });
    if (product.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await product.update({ status: 'deleted' });
    res.json({ message: 'Prenda eliminada' });
  } catch (error) {
    next(error);
  }
});

export default router;
