// server.js — Al-Huda Quran Academy Backend
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────────────
app.use(helmet());
app.set('trust proxy', 1);

// ── CORS ──────────────────────────────────────────────
const allowed = [
  process.env.FRONTEND_URL,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  methods:     ['GET','POST','PATCH','DELETE','OPTIONS'],
  credentials: true,
}));

// ── Body parsers ──────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Logging ───────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ─────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 60_000, max: 60,
  message: { success: false, message: 'Too many requests, slow down.' },
}));
app.use('/api/bookings', rateLimit({
  windowMs: 15 * 60_000, max: 10,
  message: { success: false, message: 'Too many booking attempts. Try again in 15 min.' },
}));

// ── Routes ────────────────────────────────────────────
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/contact',  require('./routes/contact'));

// ── Health ────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok', service: 'Al-Huda Quran Academy API', time: new Date().toISOString(),
}));

app.get('/', (_req, res) => res.json({
  message: '🕌 Al-Huda Quran Academy API v1.0',
  endpoints: {
    'POST /api/bookings':        'Submit a booking',
    'POST /api/contact':         'Send a contact message',
    'GET  /api/bookings':        'List all bookings (admin)',
    'GET  /api/bookings/stats':  'Booking stats (admin)',
    'PATCH /api/bookings/:id/status': 'Update booking status',
    'DELETE /api/bookings/:id':  'Delete a booking',
  },
}));

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => res.status(404).json({
  success: false, message: `${req.method} ${req.path} not found`,
}));

// ── Error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Boot ──────────────────────────────────────────────
(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🕌  Al-Huda Quran Academy — Backend API');
    console.log(`🚀  Running on http://localhost:${PORT}`);
    console.log(`📋  Health: http://localhost:${PORT}/health`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
})();
