const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/analytics - Get productivity statistics and breakdown
router.get('/', (req, res) => {
  try {
    const { tenantId } = req.query;
    const stats = db.getAnalytics(tenantId);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
