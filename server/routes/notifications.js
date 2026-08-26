const express = require('express');
const router = express.Router();
const db = require('../db');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const insforgeService = require('../services/insforgeService');

// POST /api/notifications/test-email - Trigger instant test email (tenant specific)
router.post('/test-email', async (req, res) => {
  try {
    const { recipient, tenantId } = req.body;
    const result = await emailService.sendTestEmail(recipient, tenantId);
    if (result.success) {
      res.json({ success: true, message: `Correo de prueba enviado con éxito a ${result.recipient}`, data: result });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/test-whatsapp - Trigger instant test WhatsApp (tenant specific)
router.post('/test-whatsapp', async (req, res) => {
  try {
    const { phone, tenantId } = req.body;
    const result = await whatsappService.sendTestWhatsApp(phone, tenantId);
    if (result.success) {
      res.json({ success: true, message: `WhatsApp de prueba enviado con éxito a ${result.recipient}`, data: result });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/send-summary - Trigger complete agenda summary to WhatsApp & Email
router.post('/send-summary', async (req, res) => {
  try {
    const { phone, email, date } = req.body;
    const waResult = await whatsappService.sendDailySummary(date, phone);
    const emResult = await emailService.sendDailySummaryEmail(date, email);

    res.json({
      success: waResult.success || emResult.success,
      message: `Resumen de agenda despachado a WhatsApp (${waResult.recipient}) y Correo (${emResult.recipient})`,
      data: {
        whatsapp: waResult,
        email: emResult
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/send-summary-email - Trigger summary specifically to Email
router.post('/send-summary-email', async (req, res) => {
  try {
    const { email, date } = req.body;
    const result = await emailService.sendDailySummaryEmail(date, email);
    if (result.success) {
      res.json({ success: true, message: `Resumen de agenda enviado por correo a ${result.recipient}`, data: result });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/notifications/logs - Get recent logs (optionally filtered by tenantId)
router.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const { tenantId } = req.query;
    const logs = db.getLogs(limit, tenantId);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/notifications/status - Check health of notification channels & Insforge
router.get('/status', async (req, res) => {
  try {
    const emailHealth = await emailService.verifyConnection();
    const config = db.getConfig();
    const insforgeStatus = await insforgeService.getStatus();
    
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
        insforge: insforgeStatus,
        schedulerActive: true
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
