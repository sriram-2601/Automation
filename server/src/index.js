import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { connectDB, dbStatus } from './config/db.js';
import { initSocket } from './config/socket.js';
import authRoutes from './routes/authRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { getRedisStatus } from './queues/executionQueue.js';

// Initialize express app
const app = express();
const server = http.createServer(app);

// 1. Security Headers & CORS
app.use(helmet());
app.use(cors({
  origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// 2. Request Logging & Compression
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}
app.use(compression());

// 3. Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Rate Limiting for Auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// 5. Connect to MongoDB
connectDB();

// 6. Initialize Socket.IO
const io = initSocket(server);

// 7. Base API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    database: dbStatus.connected ? 'connected' : 'in-memory-fallback',
    redis: getRedisStatus(),
    env: env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// 8. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// 9. Start Server
const PORT = env.PORT;
server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Agentflow_AI backend server running on port ${PORT}`);
  console.log(`Client URL expected at: ${env.CLIENT_URL}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`==================================================`);
});
