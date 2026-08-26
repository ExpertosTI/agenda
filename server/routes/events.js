const express = require('express');
const router = express.Router();
const db = require('../db');
const insforgeService = require('../services/insforgeService');
const { calculateMinutesRemaining, parseEventDateTime } = require('../services/schedulerService');

// GET /api/events - List events (filtered by date, tenantId, and/or search)
router.get('/', (req, res) => {
  try {
    const { date, tenantId, q } = req.query;
    const events = db.getEvents(date, tenantId, q);
    
    // Add real-time countdown metadata and completion analytics
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

      const tenant = db.getTenantById(evt.tenantId);
      const subtasks = Array.isArray(evt.subtasks) ? evt.subtasks : [];
      const completedSubtasks = subtasks.filter(s => s.completed).length;

      return {
        ...evt,
        tenantName: tenant ? tenant.name : 'RENACE',
        tenantIcon: tenant ? tenant.icon : '⚡',
        subtasksCount: subtasks.length,
        subtasksCompleted: completedSubtasks,
        minutesLeft,
        statusLabel
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/events/export/ics - Export events to standard iCalendar (.ics) format
router.get('/export/ics', (req, res) => {
  try {
    const { tenantId } = req.query;
    const events = db.getEvents(null, tenantId);

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RENACE Tech//Agenda Multi-Tenant//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Agenda RENACE',
      'X-WR-TIMEZONE:America/Santo_Domingo'
    ];

    events.forEach(evt => {
      if (!evt.date || !evt.time) return;
      const cleanDate = evt.date.replace(/-/g, '');
      const cleanTime = evt.time.replace(/:/g, '') + '00';
      const endTime = (evt.endTime || evt.time).replace(/:/g, '') + '00';

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${evt.id}@agenda.renace.tech`);
      icsContent.push(`DTSTAMP:${cleanDate}T${cleanTime}`);
      icsContent.push(`DTSTART:${cleanDate}T${cleanTime}`);
      icsContent.push(`DTEND:${cleanDate}T${endTime}`);
      icsContent.push(`SUMMARY:${evt.icon || ''} ${evt.title}`);
      icsContent.push(`DESCRIPTION:${evt.notes || evt.tag || ''}`);
      if (evt.location) icsContent.push(`LOCATION:${evt.location}`);
      icsContent.push(`STATUS:${evt.completed ? 'COMPLETED' : 'CONFIRMED'}`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="agenda_renace.ics"');
    res.send(icsContent.join('\r\n'));
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
    const tenant = db.getTenantById(event.tenantId);
    res.json({ success: true, data: { ...event, tenantName: tenant ? tenant.name : 'RENACE' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/events - Create new event
router.post('/', async (req, res) => {
  try {
    const { tenantId, title, date, time, durationMinutes, tag, priority, icon, transitBefore, notes, location, subtasks, notifyEmail, notifyWhatsApp } = req.body;
    
    if (!title || !time) {
      return res.status(400).json({ success: false, error: 'Título y hora son obligatorios' });
    }

    const targetTenant = tenantId || req.headers['x-tenant-id'] || 'renace';

    const newEvent = db.saveEvent({
      tenantId: targetTenant,
      title,
      date: date || new Date().toISOString().split('T')[0],
      time,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 60,
      tag: tag || 'Compromiso',
      priority: priority || 'normal',
      icon: icon || '📌',
      transitBefore: transitBefore || null,
      notes: notes || '',
      location: location || '',
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      notifyEmail: notifyEmail !== false,
      notifyWhatsApp: notifyWhatsApp !== false
    });

    // Async Insforge sync
    insforgeService.syncEvent(newEvent, targetTenant).catch(() => {});

    res.status(201).json({ success: true, message: 'Compromiso creado exitosamente', data: newEvent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', async (req, res) => {
  try {
    const updated = db.updateEvent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Compromiso no encontrado' });
    }

    insforgeService.syncEvent(updated, updated.tenantId).catch(() => {});
    res.json({ success: true, message: 'Compromiso actualizado', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/events/:id/toggle - Toggle completed status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const event = db.toggleEventCompleted(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Compromiso no encontrado' });
    }

    insforgeService.syncEvent(event, event.tenantId).catch(() => {});
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/events/:id/postpone - Postpone event by minutes (+15, +30, +60)
router.post('/:id/postpone', (req, res) => {
  try {
    const minutes = parseInt(req.body.minutes || '15', 10);
    const event = db.postponeEvent(req.params.id, minutes);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Compromiso no encontrado' });
    }

    insforgeService.syncEvent(event, event.tenantId).catch(() => {});
    res.json({ success: true, message: `Compromiso pospuesto +${minutes} min`, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/events/:id/subtasks/:subtaskId/toggle - Toggle subtask
router.patch('/:id/subtasks/:subtaskId/toggle', (req, res) => {
  try {
    const event = db.toggleSubtask(req.params.id, req.params.subtaskId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Compromiso o subtarea no encontrada' });
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
