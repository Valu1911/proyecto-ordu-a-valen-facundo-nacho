import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Report, User, Product } from '../models/index.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// POST /api/reports - Create a report
router.post('/', authenticate, [
  body('reported_user_id').isUUID().withMessage('ID de usuario reportado invalido'),
  body('reported_product_id').optional({ nullable: true }).isUUID().withMessage('ID de producto invalido'),
  body('reason').isIn(['spam', 'fraude', 'contenido_inapropiado', 'acoso', 'otro']).withMessage('Motivo de reporte no valido'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('La descripcion debe tener entre 10 y 500 caracteres'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reported_user_id, reported_product_id, reason, description } = req.body;

    if (reported_user_id === req.user.id) {
      return res.status(400).json({ error: 'No podes reportarte a vos mismo' });
    }

    const reportedUser = await User.findByPk(reported_user_id);
    if (!reportedUser) {
      return res.status(404).json({ error: 'Usuario a reportar no encontrado' });
    }

    if (reported_product_id) {
      const reportedProduct = await Product.findByPk(reported_product_id);
      if (!reportedProduct) {
        return res.status(404).json({ error: 'Prenda a reportar no encontrada' });
      }
    }

    const report = await Report.create({
      reporter_id: req.user.id,
      reported_user_id,
      reported_product_id: reported_product_id || null,
      reason,
      description,
    });

    res.status(201).json({
      message: 'Reporte enviado a moderacion correctamente',
      report,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
