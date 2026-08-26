// API Client for Agenda RENACE

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
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
  // Events
  getEvents: (date) => request(date ? `/events?date=${encodeURIComponent(date)}` : '/events'),
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (eventData) => request('/events', { method: 'POST', body: JSON.stringify(eventData) }),
  updateEvent: (id, eventData) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(eventData) }),
  toggleEvent: (id) => request(`/events/${id}/toggle`, { method: 'PATCH' }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),

  // Configuration
  getConfig: () => request('/config'),
  updateConfig: (configData) => request('/config', { method: 'PUT', body: JSON.stringify(configData) }),

  // Notifications & Tests
  testEmail: (recipient) => request('/notifications/test-email', { method: 'POST', body: JSON.stringify({ recipient }) }),
  testWhatsApp: (phone) => request('/notifications/test-whatsapp', { method: 'POST', body: JSON.stringify({ phone }) }),
  getLogs: () => request('/notifications/logs'),
  getStatus: () => request('/notifications/status')
};

window.api = api;
