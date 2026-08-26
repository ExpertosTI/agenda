const express = require('express');
const router = express.Router();
const db = require('../db');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');

// POST /api/notifications/test-email - Trigger instant test email
router.post('/test-email', async (req, res) => {
  try {
    const { recipient } = req.body;
    const result = await emailService.sendTestEmail(recipient);
    if (result.success) {
      res.json({ success: true, message: `Correo de prueba enviado con éxito a ${result.recipient}`, data: result });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/test-whatsapp - Trigger instant test WhatsApp
router.post('/test-whatsapp', async (req, res) => {
  try {
    const { phone } = req.body;
    const result = await whatsappService.sendTestWhatsApp(phone);
    if (result.success) {
      res.json({ success: true, message: `WhatsApp de prueba enviado con éxito a ${result.recipient}`, data: result });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/notifications/logs - Get recent notification dispatch logs
router.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = db.getLogs(limit);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/notifications/status - Check health of both notification channels
router.get('/status', async (req, res) => {
  try {
    const emailHealth = await emailService.verifyConnection();
    const config = db.getConfig();
    
    // Check Evolution API reachability
    let evoHealth = { success: false, message: 'No comprobado' };
    try {
      const evoUrl = (config.evoApiUrl || 'https://evoapi.renace.tech').replace(/\/$/, '');
      const resp = await fetch(`${evoUrl}/instance/connectionState/${encodeURIComponent(config.evoInstance || 'RENACE.TECH')}`, {
        headers: { 'apikey': config.evoApiKey || '' }
      });
      evoHealth = {
        success: resp.ok,
        status: resp.status,
        message: resp.ok ? 'Evolution API Online' : `HTTP ${resp.status}`
      };
    } catch (e) {
      evoHealth = { success: false, error: e.message };
    }

    res.json({
      success: true,
      data: {
        email: emailHealth,
        whatsapp: evoHealth,
        schedulerActive: true
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
