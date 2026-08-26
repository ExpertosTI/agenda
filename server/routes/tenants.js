const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/tenants - List all tenants
router.get('/', (req, res) => {
  try {
    const tenants = db.getTenants();
    res.json({ success: true, count: tenants.length, data: tenants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenants/:id - Get specific tenant
router.get('/:id', (req, res) => {
  try {
    const tenant = db.getTenantById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant no encontrado' });
    }
    res.json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tenants - Create new tenant profile
router.post('/', (req, res) => {
  try {
    const { name, icon, badge, description, accentColor, notifyEmail, notifyPhone, evoInstance, smtpFrom } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'El nombre del tenant es obligatorio' });
    }

    const newTenant = db.saveTenant({
      name,
      icon,
      badge,
      description,
      accentColor,
      notifyEmail,
      notifyPhone,
      evoInstance,
      smtpFrom
    });

    res.status(201).json({ success: true, message: 'Tenant creado exitosamente', data: newTenant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tenants/:id - Update tenant profile
router.put('/:id', (req, res) => {
  try {
    const updated = db.updateTenant(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tenant no encontrado' });
    }
    res.json({ success: true, message: 'Tenant actualizado', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tenants/:id - Delete tenant
router.delete('/:id', (req, res) => {
  try {
    const success = db.deleteTenant(req.params.id);
    if (!success) {
      return res.status(400).json({ success: false, error: 'No se puede eliminar el último tenant principal' });
    }
    res.json({ success: true, message: 'Tenant eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
