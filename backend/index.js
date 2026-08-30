require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const messageRoutes = require('./routes/messageRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];
const configuredOrigins = [process.env.CLIENT_URL, process.env.CLIENT_URLS]
  .filter(Boolean)
  .flatMap((value) => String(value).split(',').map((entry) => entry.trim()).filter(Boolean));
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];
const mongoUri = process.env.MONGODB_URI;
let mongoConnectionPromise;
let io = {
  to: () => ({ emit: () => {} }),
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

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
  if (mongoose.connection.readyState === 1) return;
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(mongoUri).catch((err) => {
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
  const server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
      },
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

module.exports = app;
