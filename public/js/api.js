// API Client for Agenda RENACE Ultra-Moderna

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  try {
    const currentTenant = window.currentTenantId || 'all';
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': currentTenant,
        ...(options.headers || {})
      },
      ...options
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

const api = {
  // Tenants
  getTenants: () => request('/tenants'),
  getTenant: (id) => request(`/tenants/${id}`),
  createTenant: (tenantData) => request('/tenants', { method: 'POST', body: JSON.stringify(tenantData) }),
  updateTenant: (id, tenantData) => request(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(tenantData) }),
  deleteTenant: (id) => request(`/tenants/${id}`, { method: 'DELETE' }),

  // Events
  getEvents: (date, tenantId, q = '') => {
    let url = '/events?';
    if (date) url += `date=${encodeURIComponent(date)}&`;
    if (tenantId && tenantId !== 'all') url += `tenantId=${encodeURIComponent(tenantId)}&`;
    if (q) url += `q=${encodeURIComponent(q)}&`;
    return request(url.replace(/&$/, ''));
  },
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (eventData) => request('/events', { method: 'POST', body: JSON.stringify(eventData) }),
  updateEvent: (id, eventData) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(eventData) }),
  toggleEvent: (id) => request(`/events/${id}/toggle`, { method: 'PATCH' }),
  postponeEvent: (id, minutes = 15) => request(`/events/${id}/postpone`, { method: 'POST', body: JSON.stringify({ minutes }) }),
  toggleSubtask: (eventId, subtaskId) => request(`/events/${eventId}/subtasks/${subtaskId}/toggle`, { method: 'PATCH' }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),

  // Analytics & Stats
  getAnalytics: (tenantId) => request(tenantId && tenantId !== 'all' ? `/analytics?tenantId=${encodeURIComponent(tenantId)}` : '/analytics'),

  // Configuration
  getConfig: () => request('/config'),
  updateConfig: (configData) => request('/config', { method: 'PUT', body: JSON.stringify(configData) }),

  // Notifications, Tests & Insforge
  testEmail: (recipient, tenantId) => request('/notifications/test-email', { method: 'POST', body: JSON.stringify({ recipient, tenantId }) }),
  testWhatsApp: (phone, tenantId) => request('/notifications/test-whatsapp', { method: 'POST', body: JSON.stringify({ phone, tenantId }) }),
  getLogs: (tenantId) => request(tenantId && tenantId !== 'all' ? `/notifications/logs?tenantId=${encodeURIComponent(tenantId)}` : '/notifications/logs'),
  getStatus: () => request('/notifications/status')
};

window.api = api;
