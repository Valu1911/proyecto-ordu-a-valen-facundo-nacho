import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

import { sequelize, User } from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import exchangeRoutes from './routes/exchangeRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketHandlers } from './sockets/chatHandler.js';
import { checkExpiredExchanges } from './services/exchangeService.js';
import { seedDatabase } from './seeders/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const app = express();
const httpServer = createServer(app);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;
  if (origin.includes('localhost') || origin.endsWith('.vercel.app')) return true;
  return true;
};

// Socket.IO setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 5e6, // 5MB for image uploads
});

// Make io accessible in routes
app.set('io', io);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo mas tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files (uploaded images)
app.use('/uploads', express.static(join(__dirname, '..', '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Check expired exchanges every 30 minutes
setInterval(() => {
  checkExpiredExchanges().catch(err => {
    console.error('Error checking expired exchanges:', err);
  });
}, 30 * 60 * 1000);

// Create admin user on first run
async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@segundavuelta.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin2026!SV';

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await User.create({
        email: adminEmail,
        password_hash: hashedPassword,
        display_name: 'Administrador',
        role: 'admin',
        bio: 'Administrador de Segunda Vuelta',
        location_city: 'Buenos Aires',
        location_province: 'Buenos Aires',
      });
      console.log(`Admin user created: ${adminEmail}`);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Sync database
    await sequelize.authenticate();
    console.log('MySQL connection established.');

    try {
      await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      console.log('Database synced.');
    } catch (syncErr) {
      console.warn('Sequelize sync alter warning, falling back to basic sync:', syncErr.message);
      await sequelize.sync();
    }

    // Create admin user
    await createAdminUser();

    // Populate initial seed data if empty
    await seedDatabase();

    // Run initial expired exchange check
    await checkExpiredExchanges().catch(() => {});

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Socket.IO ready for connections`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, io };
