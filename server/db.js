const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const LOGS_FILE = path.join(DATA_DIR, 'notification_logs.json');

// Default initial events based on prototype
function getInitialEvents() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  return [
    {
      id: uuidv4(),
      date: dateStr,
      time: '06:00',
      timeDisplay: '06:00 AM',
      title: 'Bicicleta / Ejercicio',
      tag: 'Ruta matutina • 1h 30m',
      icon: '🚴',
      completed: false,
      transitBefore: null,
      notes: 'Entrenamiento matutino al aire libre',
      location: 'Ruta Mirador Sur',
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      date: dateStr,
      time: '08:30',
      timeDisplay: '08:30 AM',
      title: 'Peluquería',
      tag: 'Corte y cuidado personal',
      icon: '💈',
      completed: false,
      transitBefore: null,
      notes: 'Corte de cabello y barba',
      location: 'Peluquería VIP',
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      date: dateStr,
      time: '10:00',
      timeDisplay: '10:00 AM',
      title: 'Entrevistar Personal',
      tag: 'Evaluación de candidatos',
      icon: '👥',
      completed: false,
      transitBefore: {
        icon: '🚗',
        text: 'Traslado a entrevistas (30 min)',
        durationMinutes: 30
      },
      notes: 'Entrevistas para nuevo equipo de operaciones',
      location: 'Oficina Central / Sala de Juntas',
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      date: dateStr,
      time: '11:30',
      timeDisplay: '11:30 AM',
      title: 'Cocina Altamar',
      tag: 'Operaciones & Almuerzo',
      icon: '🍽️',
      completed: false,
      transitBefore: {
        icon: '🚗',
        text: 'Ruta hacia Altamar (15 min)',
        durationMinutes: 15
      },
      notes: 'Supervisión de operaciones de cocina y reunión de almuerzo',
      location: 'Altamar Restaurant',
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 4,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      date: dateStr,
      time: '12:45',
      timeDisplay: '12:45 PM',
      title: 'Los Mina',
      tag: 'Gestión / Parada técnica',
      icon: '📍',
      completed: false,
      transitBefore: {
        icon: '🚗',
        text: 'Salida hacia Santo Domingo Este',
        durationMinutes: 20
      },
      notes: 'Revisión de punto operativo y coordinación',
      location: 'Los Mina, Santo Domingo Este',
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      date: dateStr,
      time: '14:00',
      timeDisplay: '02:00 PM',
      title: 'Las Américas',
      tag: 'Rumbo Este / En ruta',
      icon: '🛣️',
      completed: false,
      transitBefore: null,
      notes: 'Monitoreo de ruta y cierre de agenda',
      location: 'Autopista Las Américas',
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 6,
      createdAt: new Date().toISOString()
    }
  ];
}

// Read JSON helper
function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filePath, defaultValue);
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

// Write JSON helper
function writeJson(filePath, data) {
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Events DB methods
function getEvents(filterDate = null) {
  let events = readJson(EVENTS_FILE, getInitialEvents());
  if (filterDate) {
    events = events.filter(e => e.date === filterDate);
  }
  return events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

function getEventById(id) {
  const events = readJson(EVENTS_FILE, []);
  return events.find(e => e.id === id);
}

function saveEvent(eventData) {
  const events = readJson(EVENTS_FILE, []);
  const newEvent = {
    id: eventData.id || uuidv4(),
    date: eventData.date || new Date().toISOString().split('T')[0],
    time: eventData.time || '12:00',
    timeDisplay: eventData.timeDisplay || formatTimeDisplay(eventData.time || '12:00'),
    title: eventData.title || 'Nuevo Compromiso',
    tag: eventData.tag || 'General',
    icon: eventData.icon || '📌',
    completed: Boolean(eventData.completed),
    transitBefore: eventData.transitBefore || null,
    notes: eventData.notes || '',
    location: eventData.location || '',
    notifyEmail: eventData.notifyEmail !== false,
    notifyWhatsApp: eventData.notifyWhatsApp !== false,
    notified_10m: false,
    notified_5m: false,
    order: eventData.order || events.length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  events.push(newEvent);
  writeJson(EVENTS_FILE, events);
  return newEvent;
}

function updateEvent(id, updateData) {
  const events = readJson(EVENTS_FILE, []);
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return null;

  const existing = events[idx];
  const updated = {
    ...existing,
    ...updateData,
    timeDisplay: updateData.time ? formatTimeDisplay(updateData.time) : existing.timeDisplay,
    updatedAt: new Date().toISOString()
  };

  // If time or date changed, reset notification flags
  if (updateData.time && updateData.time !== existing.time || updateData.date && updateData.date !== existing.date) {
    updated.notified_10m = false;
    updated.notified_5m = false;
  }

  events[idx] = updated;
  writeJson(EVENTS_FILE, events);
  return updated;
}

function deleteEvent(id) {
  let events = readJson(EVENTS_FILE, []);
  const initialLen = events.length;
  events = events.filter(e => e.id !== id);
  writeJson(EVENTS_FILE, events);
  return events.length < initialLen;
}

function toggleEventCompleted(id) {
  const events = readJson(EVENTS_FILE, []);
  const event = events.find(e => e.id === id);
  if (!event) return null;

  event.completed = !event.completed;
  event.updatedAt = new Date().toISOString();
  writeJson(EVENTS_FILE, events);
  return event;
}

// Config DB methods
function getConfig() {
  const defaultConfig = {
    smtpHost: process.env.SMTP_HOST || 'smtp.hostinger.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
    smtpSecure: process.env.SMTP_SECURE !== 'false',
    smtpUser: process.env.SMTP_USER || 'info@renace.tech',
    smtpFrom: process.env.SMTP_FROM || 'RENACE Agenda <info@renace.tech>',
    defaultNotifyEmail: process.env.DEFAULT_NOTIFY_EMAIL || 'info@renace.tech',
    evoApiUrl: process.env.EVO_API_URL || 'https://evoapi.renace.tech',
    evoApiKey: process.env.EVO_API_KEY || 'B6D711FCDE4D4FD5936544120E713976',
    evoInstance: process.env.EVO_INSTANCE || 'RENACE.TECH',
    defaultNotifyPhone: process.env.DEFAULT_NOTIFY_PHONE || '18093487921',
    alertMinutesFirst: parseInt(process.env.ALERT_MINUTES_FIRST || '10', 10),
    alertMinutesSecond: parseInt(process.env.ALERT_MINUTES_SECOND || '5', 10)
  };

  return readJson(CONFIG_FILE, defaultConfig);
}

function updateConfig(newConfig) {
  const current = getConfig();
  const updated = { ...current, ...newConfig };
  writeJson(CONFIG_FILE, updated);
  return updated;
}

// Logs DB methods
function getLogs(limit = 50) {
  const logs = readJson(LOGS_FILE, []);
  return logs.slice(-limit).reverse();
}

function addLog(logEntry) {
  const logs = readJson(LOGS_FILE, []);
  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...logEntry
  };
  logs.push(entry);
  if (logs.length > 200) {
    logs.splice(0, logs.length - 200);
  }
  writeJson(LOGS_FILE, logs);
  return entry;
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hStr = hours < 10 ? `0${hours}` : `${hours}`;
  return `${hStr}:${minutes} ${ampm}`;
}

module.exports = {
  getEvents,
  getEventById,
  saveEvent,
  updateEvent,
  deleteEvent,
  toggleEventCompleted,
  getConfig,
  updateConfig,
  getLogs,
  addLog,
  formatTimeDisplay
};
