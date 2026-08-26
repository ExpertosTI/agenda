const db = require('../db');

class InsforgeClient {
  constructor() {
    this.timeoutMs = 3000;
  }

  getConfig() {
    const config = db.getConfig();
    return {
      apiUrl: (process.env.INSFORGE_API_URL || config.insforgeApiUrl || 'https://insforge.renace.tech/api').replace(/\/$/, ''),
      apiKey: process.env.INSFORGE_API_KEY || config.insforgeApiKey || ''
    };
  }

  async isConnected() {
    const { apiUrl, apiKey } = this.getConfig();
    if (!apiUrl) return false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(`${apiUrl}/health`, {
        headers: {
          'User-Agent': 'RENACE-Agenda-MultiTenant/1.0',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        signal: controller.signal
      });

      clearTimeout(timeout);
      return res.ok || res.status === 404; // reachable
    } catch (err) {
      return false;
    }
  }

  async syncEvent(event, tenantId) {
    const { apiUrl, apiKey } = this.getConfig();
    if (!apiUrl) return false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const payload = {
        id: event.id,
        tenant_id: tenantId || event.tenantId || 'renace',
        title: event.title,
        date: event.date,
        time: event.time,
        tag: event.tag,
        location: event.location,
        notes: event.notes,
        completed: event.completed,
        updated_at: new Date().toISOString()
      };

      const res = await fetch(`${apiUrl}/agenda_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RENACE-Agenda-MultiTenant/1.0',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);
      return res.ok;
    } catch (err) {
      // Local first: silent fallback
      return false;
    }
  }

  async getStatus() {
    const { apiUrl } = this.getConfig();
    const connected = await this.isConnected();

    return {
      insforgeApiUrl: apiUrl,
      connected: connected,
      status: connected ? 'CONECTADO ✅ (Insforge PostgreSQL Sync)' : 'MODO LOCAL HYBRID PERSISTENT ✅',
      engine: 'PostgreSQL / PostgREST + SQLite/JSON Local Cache'
    };
  }
}

module.exports = new InsforgeClient();
