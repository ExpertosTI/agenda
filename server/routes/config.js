const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/config - Get current app and notification configuration
router.get('/', (req, res) => {
  try {
    const config = db.getConfig();
    // Return sanitized config (mask sensitive password)
    const sanitized = {
      ...config,
      smtpPassConfigured: Boolean(process.env.SMTP_PASS || config.smtpPassword),
      evoApiKeyConfigured: Boolean(config.evoApiKey)
    };
    res.json({ success: true, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/config - Update configuration
router.put('/', (req, res) => {
  try {
    const {
      defaultNotifyEmail,
      defaultNotifyPhone,
      evoInstance,
      evoApiUrl,
      evoApiKey,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpFrom,
      alertMinutesFirst,
      alertMinutesSecond
    } = req.body;

    const updated = db.updateConfig({
      defaultNotifyEmail,
      defaultNotifyPhone,
      evoInstance,
      evoApiUrl,
      ...(evoApiKey ? { evoApiKey } : {}),
      smtpHost,
      smtpPort: smtpPort ? parseInt(smtpPort, 10) : undefined,
      smtpUser,
      smtpFrom,
      alertMinutesFirst: alertMinutesFirst ? parseInt(alertMinutesFirst, 10) : undefined,
      alertMinutesSecond: alertMinutesSecond ? parseInt(alertMinutesSecond, 10) : undefined
    });

    res.json({ success: true, message: 'Configuración actualizada', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
