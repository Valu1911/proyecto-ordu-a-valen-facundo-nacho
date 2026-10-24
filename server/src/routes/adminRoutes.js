import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { User, Product, Exchange, Report, BanLog } from '../models/index.js';
import { authenticate, authorize } from '../middleware/authenticate.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize('admin'));

// GET /api/admin/dashboard - Metrics
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      activeExchanges,
      completedExchanges,
      pendingReports,
      bannedUsers,
    ] = await Promise.all([
      User.count(),
      Product.count(),
      Exchange.count({ where: { status: ['requested', 'accepted', 'formalized'] } }),
      Exchange.count({ where: { status: 'completed' } }),
      Report.count({ where: { status: 'pending' } }),
      User.count({ where: { is_banned: true } }),
    ]);

    // Recent 5 exchanges
    const recentExchanges = await Exchange.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'requester', attributes: ['id', 'display_name', 'email'] },
        { model: User, as: 'owner', attributes: ['id', 'display_name', 'email'] },
        { model: Product, as: 'productRequested', attributes: ['id', 'title'] },
      ],
    });

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        activeExchanges,
        completedExchanges,
        pendingReports,
        bannedUsers,
      },
      recentExchanges,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - List users with filters and pagination
router.get('/users', [
  query('search').optional().trim(),
  query('status').optional().isIn(['all', 'active', 'banned']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { display_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status === 'banned') {
      where.is_banned = true;
    } else if (status === 'active') {
      where.is_banned = false;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'refresh_token'] },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      users: rows,
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

// POST /api/admin/users/:id/ban - Ban a user
router.post('/users/:id/ban', [
  param('id').isUUID(),
  body('ban_type').isIn(['temporary', 'permanent']).withMessage('Tipo de ban invalido'),
  body('duration_days').optional({ nullable: true }).isInt({ min: 1, max: 365 }),
  body('reason').trim().isLength({ min: 5, max: 500 }).withMessage('Debe especificar una razon (5 a 500 caracteres)'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { ban_type, duration_days, reason } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'No se puede sancionar a un administrador' });
    }

    let banUntil = null;
    if (ban_type === 'temporary') {
      const days = duration_days || 7;
      banUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    await user.update({
      is_banned: true,
      ban_type,
      ban_until: banUntil,
      ban_reason: reason,
    });

    // Record in BanLog
    await BanLog.create({
      user_id: user.id,
      admin_id: req.user.id,
      action: ban_type === 'temporary' ? 'ban_temp' : 'ban_permanent',
      reason,
      duration_days: ban_type === 'temporary' ? (duration_days || 7) : null,
    });

    res.json({
      message: `Usuario ${user.display_name} suspendido correctamente`,
      user: {
        id: user.id,
        is_banned: user.is_banned,
        ban_type: user.ban_type,
        ban_until: user.ban_until,
        ban_reason: user.ban_reason,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/users/:id/unban - Unban a user
router.post('/users/:id/unban', [
  param('id').isUUID(),
  body('reason').trim().isLength({ min: 3, max: 500 }).withMessage('Debe indicar un motivo de desbaneo'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await user.update({
      is_banned: false,
      ban_type: null,
      ban_until: null,
      ban_reason: null,
    });

    // Record in BanLog
    await BanLog.create({
      user_id: user.id,
      admin_id: req.user.id,
      action: 'unban',
      reason,
      duration_days: null,
    });

    res.json({
      message: `Usuario ${user.display_name} reactivado correctamente`,
      user: {
        id: user.id,
        is_banned: false,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/reports - Get report queue
router.get('/reports', [
  query('status').optional().isIn(['all', 'pending', 'reviewed', 'resolved']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const { count, rows } = await Report.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'display_name', 'email'] },
        { model: User, as: 'reportedUser', attributes: ['id', 'display_name', 'email', 'is_banned', 'strikes'] },
        { model: Product, as: 'reportedProduct', attributes: ['id', 'title', 'images', 'status'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      reports: rows,
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

// PUT /api/admin/reports/:id - Resolve report
router.put('/reports/:id', [
  param('id').isUUID(),
  body('status').isIn(['reviewed', 'resolved']).withMessage('Estado invalido'),
  body('admin_notes').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    await report.update({
      status,
      admin_notes: admin_notes || report.admin_notes,
      resolved_at: status === 'resolved' ? new Date() : report.resolved_at,
    });

    res.json({
      message: 'Reporte actualizado',
      report,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/activity-log - Ban and audit activity
router.get('/activity-log', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await BanLog.findAndCountAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'display_name', 'email'] },
        { model: User, as: 'admin', attributes: ['id', 'display_name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      activity: rows,
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
