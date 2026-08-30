require('dotenv').config();

import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { connection, connect } from 'mongoose';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes';
import ticketRoutes from './routes/ticketRoutes';
import messageRoutes from './routes/messageRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();
const defaultAllowedOrigins = [
  'http://localhost:5173',
];
const mongoUri = process.env.MONGODB_URI;
let mongoConnectionPromise;
let io = {
  to: () => ({ emit: () => {} }),
};

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Date',
    'X-Api-Version',
    'Authorization',
  ],
};

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.options('*', cors(corsOptions));

// Expose io on req so route handlers can emit socket events.
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Support Desk Backend is running',
  });
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Support Desk API is running',
  });
});

async function connectToMongo() {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }
  if (connection.readyState === 1) return;
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = connect(mongoUri).catch((err) => {
      mongoConnectionPromise = undefined;
      throw err;
    });
  }
  await mongoConnectionPromise;
}

async function requireDatabase(req, res, next) {
  try {
    await connectToMongo();
    next();
  } catch (err) {
    next(err);
  }
}

app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/tickets', requireDatabase, ticketRoutes);
app.use('/api/tickets/:id/messages', requireDatabase, messageRoutes);
app.use('/api/dashboard', requireDatabase, dashboardRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id' });
  }
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate value for a unique field' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const server = createServer(app);
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join_ticket', (ticketId) => {
      if (ticketId) socket.join(`ticket:${ticketId}`);
    });

    socket.on('disconnect', () => {});
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

export default app;
