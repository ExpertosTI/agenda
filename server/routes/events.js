const express = require('express');
const router = express.Router();
const db = require('../db');
const { calculateMinutesRemaining, parseEventDateTime } = require('../services/schedulerService');

// GET /api/events - List all events (optionally filter by date)
router.get('/', (req, res) => {
  try {
    const { date } = req.query;
    const events = db.getEvents(date);
    
    // Add real-time countdown metadata to each event
    const enriched = events.map(evt => {
      const dt = parseEventDateTime(evt);
      let minutesLeft = null;
      let statusLabel = 'upcoming';

      if (dt) {
        minutesLeft = Math.round(calculateMinutesRemaining(dt));
        if (evt.completed) {
          statusLabel = 'completed';
        } else if (minutesLeft < -60) {
          statusLabel = 'past';
        } else if (minutesLeft <= 0 && minutesLeft >= -60) {
          statusLabel = 'in_progress';
        } else if (minutesLeft <= 5) {
          statusLabel = 'urgent_5m';
        } else if (minutesLeft <= 10) {
          statusLabel = 'alert_10m';
        } else {
          statusLabel = 'scheduled';
        }
      }

      return {
        ...evt,
        minutesLeft,
        statusLabel
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', (req, res) => {
  try {
    const event = db.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Compromiso no encontrado' });
    }
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/events - Create new event
router.post('/', (req, res) => {
  try {
    const { title, date, time, tag, icon, transitBefore, notes, location, notifyEmail, notifyWhatsApp } = req.body;
    
    if (!title || !time) {
      return res.status(400).json({ success: false, error: 'Título y hora son obligatorios' });
    }

    const newEvent = db.saveEvent({
      title,
      date: date || new Date().toISOString().split('T')[0],
      time,
      tag: tag || 'Compromiso',
      icon: icon || '📌',
      transitBefore: transitBefore || null,
      notes: notes || '',
      location: location || '',
      notifyEmail: notifyEmail !== false,
      notifyWhatsApp: notifyWhatsApp !== false
    });

    res.status(201).json({ success: true, message: 'Compromiso creado exitosamente', data: newEvent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', (req, res) => {
  try {
    const updated = db.updateEvent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Compromiso no encontrado' });
    }
    res.json({ success: true, message: 'Compromiso actualizado', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/events/:id/toggle - Toggle completed status
router.patch('/:id/toggle', (req, res) => {
  try {
    const event = db.toggleEventCompleted(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Compromiso no encontrado' });
    }
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteEvent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Compromiso no encontrado' });
    }
    res.json({ success: true, message: 'Compromiso eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
