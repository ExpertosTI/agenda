const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const TENANTS_FILE = path.join(DATA_DIR, 'tenants.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const LOGS_FILE = path.join(DATA_DIR, 'notification_logs.json');

// Default initial tenants
function getInitialTenants() {
  return [
    {
      id: 'renace',
      name: 'RENACE Tech',
      slug: 'renace',
      icon: '⚡',
      badge: 'Principal',
      description: 'Operaciones corporativas, desarrollo de software y proyectos de alta tecnología',
      accentColor: '#6366f1',
      notifyEmail: 'info@renace.tech',
      notifyPhone: '18093487921',
      evoInstance: 'RENACE.TECH',
      smtpFrom: 'RENACE Agenda <info@renace.tech>',
      insforgeSync: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'altamar',
      name: 'Altamar Restaurante',
      slug: 'altamar',
      icon: '🍽️',
      badge: 'Operaciones',
      description: 'Supervisión de cocina, gestión de compras, proveedores e inventario',
      accentColor: '#10b981',
      notifyEmail: 'info@renace.tech',
      notifyPhone: '18093487921',
      evoInstance: 'RENACE.TECH',
      smtpFrom: 'Altamar Agenda <info@renace.tech>',
      insforgeSync: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'personal',
      name: 'Dirección & Personal',
      slug: 'personal',
      icon: '👤',
      badge: 'Personal',
      description: 'Rutinas personales, ejercicio matutino, barbería y agenda ejecutiva',
      accentColor: '#a855f7',
      notifyEmail: 'info@renace.tech',
      notifyPhone: '18093487921',
      evoInstance: 'RENACE.TECH',
      smtpFrom: 'Agenda Personal <info@renace.tech>',
      insforgeSync: true,
      createdAt: new Date().toISOString()
    }
  ];
}

// Default initial events enriched with subtasks, durations and priorities
function getInitialEvents() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  return [
    {
      id: uuidv4(),
      tenantId: 'personal',
      date: dateStr,
      time: '06:00',
      endTime: '07:30',
      durationMinutes: 90,
      timeDisplay: '06:00 AM',
      title: 'Bicicleta / Ejercicio',
      tag: 'Ruta matutina • 1h 30m',
      priority: 'high',
      icon: '🚴',
      completed: false,
      transitBefore: null,
      notes: 'Entrenamiento matutino al aire libre por la costa',
      location: 'Ruta Mirador Sur, Santo Domingo',
      mapsUrl: 'https://maps.google.com/?q=Mirador+Sur+Santo+Domingo',
      subtasks: [
        { id: uuidv4(), text: 'Calentamiento 10 min', completed: true },
        { id: uuidv4(), text: 'Recorrido 25 km', completed: false },
        { id: uuidv4(), text: 'Hidratación y estiramiento', completed: false }
      ],
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      tenantId: 'personal',
      date: dateStr,
      time: '08:30',
      endTime: '09:15',
      durationMinutes: 45,
      timeDisplay: '08:30 AM',
      title: 'Peluquería VIP',
      tag: 'Corte y cuidado personal',
      priority: 'medium',
      icon: '💈',
      completed: false,
      transitBefore: null,
      notes: 'Corte de cabello, perfilado de barba y lavado',
      location: 'Peluquería VIP Santo Domingo',
      mapsUrl: 'https://maps.google.com/?q=Barberia+VIP+Santo+Domingo',
      subtasks: [
        { id: uuidv4(), text: 'Confirmar cita con barbero', completed: true },
        { id: uuidv4(), text: 'Tratamiento capilar', completed: false }
      ],
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      tenantId: 'renace',
      date: dateStr,
      time: '10:00',
      endTime: '11:15',
      durationMinutes: 75,
      timeDisplay: '10:00 AM',
      title: 'Entrevistar Personal',
      tag: 'Evaluación de candidatos',
      priority: 'high',
      icon: '👥',
      completed: false,
      transitBefore: {
        icon: '🚗',
        text: 'Traslado a entrevistas (30 min)',
        durationMinutes: 30
      },
      notes: 'Entrevistas presenciales para nuevo equipo de operaciones de RENACE',
      location: 'Oficina Central / Sala de Juntas RENACE',
      mapsUrl: 'https://maps.google.com/?q=Santo+Domingo+Piantini',
      subtasks: [
        { id: uuidv4(), text: 'Revisar CVs impresos', completed: false },
        { id: uuidv4(), text: 'Prueba técnica de evaluación', completed: false },
        { id: uuidv4(), text: 'Ronda de preguntas conductuales', completed: false }
      ],
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      tenantId: 'altamar',
      date: dateStr,
      time: '11:30',
      endTime: '12:30',
      durationMinutes: 60,
      timeDisplay: '11:30 AM',
      title: 'Cocina Altamar',
      tag: 'Operaciones & Almuerzo',
      priority: 'high',
      icon: '🍽️',
      completed: false,
      transitBefore: {
        icon: '🚗',
        text: 'Ruta hacia Altamar (15 min)',
        durationMinutes: 15
      },
      notes: 'Supervisión de línea de cocina, verificación de estándares y reunión de almuerzo',
      location: 'Altamar Restaurant, Santo Domingo',
      mapsUrl: 'https://maps.google.com/?q=Altamar+Restaurant',
      subtasks: [
        { id: uuidv4(), text: 'Chequeo de temperaturas de mariscos', completed: false },
        { id: uuidv4(), text: 'Auditoría de tickets de comanda', completed: false }
      ],
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 4,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      tenantId: 'renace',
      date: dateStr,
      time: '12:45',
      endTime: '13:45',
      durationMinutes: 60,
      timeDisplay: '12:45 PM',
      title: 'Los Mina',
      tag: 'Gestión / Parada técnica',
      priority: 'medium',
      icon: '📍',
      completed: false,
      transitBefore: {
        icon: '🚗',
        text: 'Salida hacia Santo Domingo Este (20 min)',
        durationMinutes: 20
      },
      notes: 'Revisión de punto operativo y coordinación de entregas',
      location: 'Los Mina, Santo Domingo Este',
      mapsUrl: 'https://maps.google.com/?q=Los+Mina+Santo+Domingo+Este',
      subtasks: [
        { id: uuidv4(), text: 'Inspección de local', completed: false },
        { id: uuidv4(), text: 'Firma de documentos de recepción', completed: false }
      ],
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      tenantId: 'renace',
      date: dateStr,
      time: '14:00',
      endTime: '15:30',
      durationMinutes: 90,
      timeDisplay: '02:00 PM',
      title: 'Las Américas',
      tag: 'Rumbo Este / En ruta',
      priority: 'normal',
      icon: '🛣️',
      completed: false,
      transitBefore: null,
      notes: 'Monitoreo de ruta hacia el este, inspección de puntos y cierre de jornada',
      location: 'Autopista Las Américas KM 18',
      mapsUrl: 'https://maps.google.com/?q=Autopista+Las+Americas+Santo+Domingo',
      subtasks: [],
      notifyEmail: true,
      notifyWhatsApp: true,
      notified_10m: false,
      notified_5m: false,
      order: 6,
      createdAt: new Date().toISOString()
    }
  ];
}

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

function writeJson(filePath, data) {
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// ---------------- TENANTS ----------------
function getTenants() {
  return readJson(TENANTS_FILE, getInitialTenants());
}

function getTenantById(id) {
  const tenants = getTenants();
  return tenants.find(t => t.id === id || t.slug === id) || tenants[0];
}

function saveTenant(tenantData) {
  const tenants = getTenants();
  const newTenant = {
    id: tenantData.id || uuidv4(),
    slug: tenantData.slug || (tenantData.name || 'tenant').toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: tenantData.name || 'Nuevo Tenant',
    icon: tenantData.icon || '🏢',
    badge: tenantData.badge || 'Cliente',
    description: tenantData.description || '',
    accentColor: tenantData.accentColor || '#6366f1',
    notifyEmail: tenantData.notifyEmail || 'info@renace.tech',
    notifyPhone: tenantData.notifyPhone || '18093487921',
    evoInstance: tenantData.evoInstance || 'RENACE.TECH',
    smtpFrom: tenantData.smtpFrom || `${tenantData.name} <info@renace.tech>`,
    insforgeSync: tenantData.insforgeSync !== false,
    createdAt: new Date().toISOString()
  };

  tenants.push(newTenant);
  writeJson(TENANTS_FILE, tenants);
  return newTenant;
}

function updateTenant(id, updateData) {
  const tenants = getTenants();
  const idx = tenants.findIndex(t => t.id === id || t.slug === id);
  if (idx === -1) return null;

  tenants[idx] = {
    ...tenants[idx],
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  writeJson(TENANTS_FILE, tenants);
  return tenants[idx];
}

function deleteTenant(id) {
  let tenants = getTenants();
  if (tenants.length <= 1) return false;
  tenants = tenants.filter(t => t.id !== id && t.slug !== id);
  writeJson(TENANTS_FILE, tenants);
  return true;
}

// ---------------- EVENTS ----------------
function getEvents(filterDate = null, tenantId = null, searchQuery = null) {
  let events = readJson(EVENTS_FILE, getInitialEvents());
  
  // Ensure legacy events have proper defaults
  events = events.map(e => {
    if (!e.tenantId) {
      if ((e.title || '').toLowerCase().includes('altamar')) e.tenantId = 'altamar';
      else if ((e.title || '').toLowerCase().includes('bicicleta') || (e.title || '').toLowerCase().includes('peluquer')) e.tenantId = 'personal';
      else e.tenantId = 'renace';
    }
    if (!e.priority) e.priority = 'normal';
    if (!Array.isArray(e.subtasks)) e.subtasks = [];
    return e;
  });

  if (tenantId && tenantId !== 'all') {
    events = events.filter(e => (e.tenantId || 'renace') === tenantId);
  }
  
  if (filterDate) {
    events = events.filter(e => e.date === filterDate);
  }

  if (searchQuery && typeof searchQuery === 'string') {
    const q = searchQuery.toLowerCase().trim();
    events = events.filter(e => 
      (e.title || '').toLowerCase().includes(q) ||
      (e.tag || '').toLowerCase().includes(q) ||
      (e.location || '').toLowerCase().includes(q) ||
      (e.notes || '').toLowerCase().includes(q)
    );
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
    tenantId: eventData.tenantId || 'renace',
    date: eventData.date || new Date().toISOString().split('T')[0],
    time: eventData.time || '12:00',
    endTime: eventData.endTime || calculateEndTime(eventData.time || '12:00', eventData.durationMinutes || 60),
    durationMinutes: eventData.durationMinutes || 60,
    timeDisplay: eventData.timeDisplay || formatTimeDisplay(eventData.time || '12:00'),
    title: eventData.title || 'Nuevo Compromiso',
    tag: eventData.tag || 'General',
    priority: eventData.priority || 'normal',
    icon: eventData.icon || '📌',
    completed: Boolean(eventData.completed),
    transitBefore: eventData.transitBefore || null,
    notes: eventData.notes || '',
    location: eventData.location || '',
    mapsUrl: eventData.location ? `https://maps.google.com/?q=${encodeURIComponent(eventData.location)}` : '',
    subtasks: Array.isArray(eventData.subtasks) ? eventData.subtasks : [],
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
    mapsUrl: updateData.location ? `https://maps.google.com/?q=${encodeURIComponent(updateData.location)}` : existing.mapsUrl,
    updatedAt: new Date().toISOString()
  };

  if (updateData.time && updateData.time !== existing.time || updateData.date && updateData.date !== existing.date) {
    updated.notified_10m = false;
    updated.notified_5m = false;
  }

  events[idx] = updated;
  writeJson(EVENTS_FILE, events);
  return updated;
}

function postponeEvent(id, minutesToAdd = 15) {
  const events = readJson(EVENTS_FILE, []);
  const event = events.find(e => e.id === id);
  if (!event || !event.time) return null;

  const [hours, minutes] = event.time.split(':').map(Number);
  const totalMin = hours * 60 + minutes + minutesToAdd;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  const newTimeStr = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;

  event.time = newTimeStr;
  event.timeDisplay = formatTimeDisplay(newTimeStr);
  event.notified_10m = false;
  event.notified_5m = false;
  event.postponedCount = (event.postponedCount || 0) + 1;
  event.updatedAt = new Date().toISOString();

  writeJson(EVENTS_FILE, events);
  return event;
}

function toggleSubtask(eventId, subtaskId) {
  const events = readJson(EVENTS_FILE, []);
  const event = events.find(e => e.id === eventId);
  if (!event || !Array.isArray(event.subtasks)) return null;

  const sub = event.subtasks.find(s => s.id === subtaskId);
  if (!sub) return null;

  sub.completed = !sub.completed;
  event.updatedAt = new Date().toISOString();
  writeJson(EVENTS_FILE, events);
  return event;
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

// ---------------- ANALYTICS ----------------
function getAnalytics(tenantId = null) {
  const events = getEvents(null, tenantId);
  const total = events.length;
  const completed = events.filter(e => e.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Breakdown by priority
  const highPriority = events.filter(e => e.priority === 'high').length;
  const mediumPriority = events.filter(e => e.priority === 'medium').length;
  const normalPriority = events.filter(e => e.priority === 'normal').length;

  // With transit
  const transitCount = events.filter(e => e.transitBefore !== null).length;

  return {
    total,
    completed,
    pending,
    completionRate,
    priorityBreakdown: {
      high: highPriority,
      medium: mediumPriority,
      normal: normalPriority
    },
    transitCount,
    tenantsCount: getTenants().length
  };
}

// ---------------- CONFIG ----------------
function getConfig() {
  const defaultConfig = {
    appName: 'Agenda RENACE Ultra-Moderna',
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
    insforgeApiUrl: process.env.INSFORGE_API_URL || 'https://insforge.renace.tech/api',
    insforgeApiKey: process.env.INSFORGE_API_KEY || '',
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

// ---------------- LOGS ----------------
function getLogs(limit = 50, tenantId = null) {
  let logs = readJson(LOGS_FILE, []);
  if (tenantId && tenantId !== 'all') {
    logs = logs.filter(l => l.tenantId === tenantId);
  }
  return logs.slice(-limit).reverse();
}

function addLog(logEntry) {
  const logs = readJson(LOGS_FILE, []);
  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    tenantId: logEntry.tenantId || 'renace',
    ...logEntry
  };
  logs.push(entry);
  if (logs.length > 300) {
    logs.splice(0, logs.length - 300);
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

function calculateEndTime(startTimeStr, durationMinutes = 60) {
  if (!startTimeStr) return '13:00';
  const [h, m] = startTimeStr.split(':').map(Number);
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

module.exports = {
  getTenants,
  getTenantById,
  saveTenant,
  updateTenant,
  deleteTenant,
  getEvents,
  getEventById,
  saveEvent,
  updateEvent,
  postponeEvent,
  toggleSubtask,
  deleteEvent,
  toggleEventCompleted,
  getAnalytics,
  getConfig,
  updateConfig,
  getLogs,
  addLog,
  formatTimeDisplay
};
