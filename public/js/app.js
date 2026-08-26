// Agenda RENACE - Frontend Application Logic

let currentDate = new Date().toISOString().split('T')[0];
let eventsList = [];
let editingEventId = null;
let selectedIcon = '📌';
let liveTickerInterval = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initServiceWorker();
  initDateSelectors();
  initIconSelectors();
  initEventListeners();
  loadEvents();
  loadConfig();
  
  // Live ticker for countdown every 5 seconds
  liveTickerInterval = setInterval(updateLiveCountdowns, 5000);
});

// Register PWA Service Worker
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('[PWA] Service Worker registrado:', reg.scope))
        .catch((err) => console.warn('[PWA] Error registrando Service Worker:', err));
    });
  }
}

// Date Selector Initialization
function initDateSelectors() {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  document.getElementById('pill-today').dataset.date = todayStr;
  document.getElementById('pill-tomorrow').dataset.date = tomorrowStr;
  document.getElementById('custom-date-picker').value = todayStr;

  setDate(todayStr);
}

function setDate(dateStr) {
  currentDate = dateStr;
  
  // Update header text
  const d = new Date(dateStr + 'T12:00:00');
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  const formatted = d.toLocaleDateString('es-DO', options);
  document.getElementById('current-date-badge').innerText = formatted.toUpperCase();

  // Update pills
  document.querySelectorAll('.date-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.date === dateStr);
  });

  loadEvents();
}

// Icon Selector
function initIconSelectors() {
  const choices = document.querySelectorAll('.icon-choice');
  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      choices.forEach(c => c.classList.remove('selected'));
      choice.classList.add('selected');
      selectedIcon = choice.dataset.icon;
    });
  });
}

// Event Listeners
function initEventListeners() {
  // Date pills
  document.getElementById('pill-today').addEventListener('click', (e) => setDate(e.target.dataset.date));
  document.getElementById('pill-tomorrow').addEventListener('click', (e) => setDate(e.target.dataset.date));
  document.getElementById('custom-date-picker').addEventListener('change', (e) => {
    if (e.target.value) setDate(e.target.value);
  });

  // Modal Triggers
  document.getElementById('fab-add-btn').addEventListener('click', () => openEventModal());
  document.getElementById('btn-close-event-modal').addEventListener('click', () => closeEventModal());
  document.getElementById('btn-settings-open').addEventListener('click', () => openSettingsModal());
  document.getElementById('btn-close-settings-modal').addEventListener('click', () => closeSettingsModal());

  // Forms
  document.getElementById('event-form').addEventListener('submit', handleSaveEvent);
  document.getElementById('settings-form').addEventListener('submit', handleSaveConfig);
  document.getElementById('btn-delete-event').addEventListener('click', handleDeleteCurrentEvent);

  // Test Buttons
  document.getElementById('btn-test-email').addEventListener('click', handleTestEmail);
  document.getElementById('btn-test-whatsapp').addEventListener('click', handleTestWhatsApp);
  document.getElementById('btn-refresh-logs').addEventListener('click', loadLogs);

  // Transit checkbox toggle
  document.getElementById('event-has-transit').addEventListener('change', (e) => {
    document.getElementById('transit-fields').style.display = e.target.checked ? 'block' : 'none';
  });
}

// Load Events from API
async function loadEvents() {
  try {
    const res = await window.api.getEvents(currentDate);
    eventsList = res.data || [];
    renderTimeline();
    updateProgress();
  } catch (err) {
    showToast('Error cargando compromisos: ' + err.message, 'error');
  }
}

// Render Timeline
function renderTimeline() {
  const container = document.getElementById('timeline-container');
  container.innerHTML = '';

  if (eventsList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="icon">🌴</span>
        <h3>Sin compromisos agendados</h3>
        <p>Toca el botón <strong>+</strong> abajo para agregar tu primera actividad.</p>
      </div>
    `;
    return;
  }

  eventsList.forEach((event, idx) => {
    // If transit node exists before event
    if (event.transitBefore && event.transitBefore.text) {
      const transitEl = document.createElement('div');
      transitEl.className = 'transit-node';
      transitEl.innerHTML = `<span>${event.transitBefore.icon || '🚗'} ${event.transitBefore.text}</span>`;
      container.appendChild(transitEl);
    }

    // Event Card
    const card = document.createElement('div');
    card.className = `event-card ${event.completed ? 'completed' : ''}`;
    card.dataset.id = event.id;

    // Determine Countdown Badge
    let countdownBadgeHtml = '';
    if (!event.completed && event.minutesLeft !== null) {
      if (event.minutesLeft <= 5 && event.minutesLeft > -60) {
        countdownBadgeHtml = `<span class="countdown-tag badge-urgent-5m">🚨 En ${event.minutesLeft}m</span>`;
      } else if (event.minutesLeft <= 10 && event.minutesLeft > 5) {
        countdownBadgeHtml = `<span class="countdown-tag badge-alert-10m">⏰ En ${event.minutesLeft}m</span>`;
      } else if (event.minutesLeft > 10 && event.minutesLeft <= 180) {
        countdownBadgeHtml = `<span class="countdown-tag badge-scheduled">⏳ En ${event.minutesLeft}m</span>`;
      }
    }

    card.innerHTML = `
      <div class="icon-box">${event.icon || '📌'}</div>
      <div class="info" onclick="handleCardClick('${event.id}', event)">
        <div class="time-row">
          <span class="time">${event.timeDisplay || event.time}</span>
          ${countdownBadgeHtml}
        </div>
        <div class="title">${event.title}</div>
        <div class="tag">${event.tag || 'Compromiso agendado'}</div>
        ${event.location ? `<div class="location-snippet">📍 ${event.location}</div>` : ''}
      </div>
      <div class="check-circle" onclick="handleToggleEvent('${event.id}', event)">
        <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>
      </div>
    `;

    container.appendChild(card);
  });
}

// Toggle Task Completed
async function handleToggleEvent(id, e) {
  if (e) e.stopPropagation();
  try {
    const res = await window.api.toggleEvent(id);
    const updated = res.data;
    
    // Update local state
    const idx = eventsList.findIndex(ev => ev.id === id);
    if (idx !== -1) {
      eventsList[idx].completed = updated.completed;
    }
    
    renderTimeline();
    updateProgress();
  } catch (err) {
    showToast('Error al actualizar estado: ' + err.message, 'error');
  }
}

// Update Progress Bar
function updateProgress() {
  const total = eventsList.length;
  const completed = eventsList.filter(e => e.completed).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById('progress-bar').style.width = `${pct}%`;
  document.getElementById('progress-text').innerText = `${completed}/${total} listas (${pct}%)`;
}

// Live Countdown Updater
function updateLiveCountdowns() {
  const now = new Date();
  let updated = false;

  eventsList.forEach(event => {
    if (!event.completed && event.date && event.time) {
      const [year, month, day] = event.date.split('-').map(Number);
      const [hours, minutes] = event.time.split(':').map(Number);
      const target = new Date(year, month - 1, day, hours, minutes, 0);
      const diffMin = Math.round((target.getTime() - now.getTime()) / 60000);
      
      if (event.minutesLeft !== diffMin) {
        event.minutesLeft = diffMin;
        updated = true;
      }
    }
  });

  if (updated) {
    renderTimeline();
  }
}

// Open / Close Event Modal
function openEventModal(eventId = null) {
  editingEventId = eventId;
  const modal = document.getElementById('event-modal');
  const titleEl = document.getElementById('event-modal-title');
  const btnDelete = document.getElementById('btn-delete-event');

  if (eventId) {
    const event = eventsList.find(e => e.id === eventId);
    if (!event) return;
    titleEl.innerText = 'Editar Compromiso';
    btnDelete.style.display = 'block';

    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-date').value = event.date || currentDate;
    document.getElementById('event-time').value = event.time || '10:00';
    document.getElementById('event-tag').value = event.tag || '';
    document.getElementById('event-location').value = event.location || '';
    document.getElementById('event-notes').value = event.notes || '';
    document.getElementById('event-notify-email').checked = event.notifyEmail !== false;
    document.getElementById('event-notify-whatsapp').checked = event.notifyWhatsApp !== false;

    // Transit
    if (event.transitBefore) {
      document.getElementById('event-has-transit').checked = true;
      document.getElementById('transit-fields').style.display = 'block';
      document.getElementById('event-transit-text').value = event.transitBefore.text || '';
    } else {
      document.getElementById('event-has-transit').checked = false;
      document.getElementById('transit-fields').style.display = 'none';
      document.getElementById('event-transit-text').value = '';
    }

    selectedIcon = event.icon || '📌';
  } else {
    titleEl.innerText = 'Nuevo Compromiso';
    btnDelete.style.display = 'none';
    document.getElementById('event-form').reset();
    document.getElementById('event-date').value = currentDate;
    document.getElementById('event-time').value = '10:00';
    document.getElementById('event-has-transit').checked = false;
    document.getElementById('transit-fields').style.display = 'none';
    document.getElementById('event-notify-email').checked = true;
    document.getElementById('event-notify-whatsapp').checked = true;
    selectedIcon = '📌';
  }

  // Highlight icon choice
  document.querySelectorAll('.icon-choice').forEach(choice => {
    choice.classList.toggle('selected', choice.dataset.icon === selectedIcon);
  });

  modal.classList.add('open');
}

function closeEventModal() {
  document.getElementById('event-modal').classList.remove('open');
  editingEventId = null;
}

function handleCardClick(id, e) {
  if (e) e.stopPropagation();
  openEventModal(id);
}

// Save Event (Create or Update)
async function handleSaveEvent(e) {
  e.preventDefault();

  const title = document.getElementById('event-title').value.trim();
  const date = document.getElementById('event-date').value;
  const time = document.getElementById('event-time').value;
  const tag = document.getElementById('event-tag').value.trim();
  const location = document.getElementById('event-location').value.trim();
  const notes = document.getElementById('event-notes').value.trim();
  const notifyEmail = document.getElementById('event-notify-email').checked;
  const notifyWhatsApp = document.getElementById('event-notify-whatsapp').checked;

  const hasTransit = document.getElementById('event-has-transit').checked;
  const transitText = document.getElementById('event-transit-text').value.trim();

  const eventPayload = {
    title,
    date,
    time,
    tag: tag || 'General',
    location,
    notes,
    icon: selectedIcon,
    notifyEmail,
    notifyWhatsApp,
    transitBefore: hasTransit && transitText ? { icon: '🚗', text: transitText } : null
  };

  try {
    if (editingEventId) {
      await window.api.updateEvent(editingEventId, eventPayload);
      showToast('Compromiso actualizado con éxito', 'success');
    } else {
      await window.api.createEvent(eventPayload);
      showToast('Compromiso agendado correctamente', 'success');
    }

    closeEventModal();
    loadEvents();
  } catch (err) {
    showToast('Error guardando compromiso: ' + err.message, 'error');
  }
}

// Delete Event
async function handleDeleteCurrentEvent() {
  if (!editingEventId) return;
  if (!confirm('¿Seguro que deseas eliminar este compromiso?')) return;

  try {
    await window.api.deleteEvent(editingEventId);
    showToast('Compromiso eliminado', 'success');
    closeEventModal();
    loadEvents();
  } catch (err) {
    showToast('Error al eliminar: ' + err.message, 'error');
  }
}

// Settings & Config
async function loadConfig() {
  try {
    const res = await window.api.getConfig();
    const cfg = res.data;
    if (!cfg) return;

    document.getElementById('cfg-email').value = cfg.defaultNotifyEmail || '';
    document.getElementById('cfg-phone').value = cfg.defaultNotifyPhone || '';
    document.getElementById('cfg-evo-instance').value = cfg.evoInstance || 'RENACE.TECH';
    document.getElementById('cfg-evo-url').value = cfg.evoApiUrl || 'https://evoapi.renace.tech';
  } catch (err) {
    console.warn('Error loading config:', err);
  }
}

function openSettingsModal() {
  loadConfig();
  loadLogs();
  document.getElementById('settings-modal').classList.add('open');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('open');
}

async function handleSaveConfig(e) {
  e.preventDefault();
  const defaultNotifyEmail = document.getElementById('cfg-email').value.trim();
  const defaultNotifyPhone = document.getElementById('cfg-phone').value.trim();
  const evoInstance = document.getElementById('cfg-evo-instance').value.trim();
  const evoApiUrl = document.getElementById('cfg-evo-url').value.trim();

  try {
    await window.api.updateConfig({
      defaultNotifyEmail,
      defaultNotifyPhone,
      evoInstance,
      evoApiUrl
    });
    showToast('Configuración guardada exitosamente', 'success');
  } catch (err) {
    showToast('Error guardando configuración: ' + err.message, 'error');
  }
}

// Notification Tests
async function handleTestEmail() {
  const btn = document.getElementById('btn-test-email');
  btn.disabled = true;
  btn.innerText = 'Enviando...';

  try {
    const recipient = document.getElementById('cfg-email').value.trim();
    const res = await window.api.testEmail(recipient);
    showToast(res.message || 'Correo de prueba enviado con éxito', 'success');
    loadLogs();
  } catch (err) {
    showToast('Error enviando correo: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerText = '📧 Probar Correo SMTP';
  }
}

async function handleTestWhatsApp() {
  const btn = document.getElementById('btn-test-whatsapp');
  btn.disabled = true;
  btn.innerText = 'Enviando...';

  try {
    const phone = document.getElementById('cfg-phone').value.trim();
    const res = await window.api.testWhatsApp(phone);
    showToast(res.message || 'WhatsApp de prueba enviado con éxito', 'success');
    loadLogs();
  } catch (err) {
    showToast('Error enviando WhatsApp: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerText = '💬 Probar WhatsApp (EvoAPI)';
  }
}

// Load Logs
async function loadLogs() {
  const logsContainer = document.getElementById('logs-container');
  logsContainer.innerHTML = '<div style="font-size:12px; color:#94a3b8;">Cargando historial...</div>';

  try {
    const res = await window.api.getLogs();
    const logs = res.data || [];

    if (logs.length === 0) {
      logsContainer.innerHTML = '<div style="font-size:12px; color:#94a3b8;">No hay envíos registrados aún.</div>';
      return;
    }

    logsContainer.innerHTML = logs.map(log => {
      const dateStr = new Date(log.timestamp).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const statusColor = log.status === 'success' ? '#10b981' : '#ef4444';
      const icon = log.type.includes('email') ? '📧' : '💬';

      return `
        <div class="log-item">
          <div class="log-header">
            <span>${icon} ${log.channel}</span>
            <span style="color: ${statusColor}; font-weight:700;">${log.status.toUpperCase()} · ${dateStr}</span>
          </div>
          <div class="log-detail">${log.detail || log.eventTitle || 'Prueba de conexión'} (${log.recipient})</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    logsContainer.innerHTML = '<div style="font-size:12px; color:#ef4444;">Error cargando logs</div>';
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
