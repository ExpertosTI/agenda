require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const eventsRouter = require('./routes/events');
const configRouter = require('./routes/config');
const notificationsRouter = require('./routes/notifications');
const schedulerService = require('./services/schedulerService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security & Cache headers for PWA
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'RENACE Engine');
  if (req.url.startsWith('/css/') || req.url.startsWith('/js/') || req.url.startsWith('/icons/')) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
});

// Serve Static Frontend (PWA)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/events', eventsRouter);
app.use('/api/config', configRouter);
app.use('/api/notifications', notificationsRouter);

// Health check endpoint for Docker / Traefik
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'Agenda RENACE',
    domain: 'agenda.renace.tech',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Fallback to PWA index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server & Notification Engine
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 AGENDA RENACE APP corriendo en puerto ${PORT}`);
  console.log(`🌐 URL Local: http://localhost:${PORT}`);
  console.log(`🌐 Dominio Producción: https://agenda.renace.tech`);
  console.log(`====================================================`);

  // Start background scheduler worker
  schedulerService.startScheduler();
});

module.exports = app;
