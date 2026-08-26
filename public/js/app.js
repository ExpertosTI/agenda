// Agenda RENACE - Ultra-Modern Fluid PWA Frontend Engine

let currentTenantId = 'all';
let tenantsList = [];
let currentDate = new Date().toISOString().split('T')[0];
let eventsList = [];
let editingEventId = null;
let selectedIcon = '📌';
let currentFilter = 'all'; // 'all', 'urgent', 'pending', 'completed'
let searchQuery = '';
let liveTickerInterval = null;
let clockInterval = null;

// Sound Effects via Web Audio API (Zero external assets)
const soundEffects = {
  ctx: null,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  },
  playPop() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }
};

// Haptic Vibration Helper
function triggerHaptic(pattern = [25]) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initServiceWorker();
  initLiveClock();
  initWeeklySlider();
  initIconSelectors();
  initEventListeners();
  
  // Read tenant from URL query param
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) {
    currentTenantId = tenantParam;
  }

  await loadTenants();
  loadEvents();
  loadConfig();
  
  // Live ticker for countdown every 5 seconds
  liveTickerInterval = setInterval(updateLiveCountdowns, 5000);
});

// PWA Service Worker Registration
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('[PWA] Service Worker activo:', reg.scope))
        .catch((err) => console.warn('[PWA] Service Worker no registrado:', err));
    });
  }
}

// Live Header Clock
function initLiveClock() {
  const updateClock = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const clockEl = document.getElementById('live-clock-text');
    if (clockEl) {
      clockEl.innerText = `${timeStr} · SANTO DOMINGO`;
    }
  };
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

// ---------------- WEEKLY SLIDER ----------------
function initWeeklySlider() {
  const container = document.getElementById('weekly-slider');
  if (!container) return;

  container.innerHTML = '';
  const today = new Date();
  
  // Render 10 days: 2 days back, today, and 7 days forward
  for (let i = -2; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dayName = d.toLocaleDateString('es-DO', { weekday: 'short' }).slice(0, 3);
    const dayNumber = d.getDate();
    const isActive = dateStr === currentDate ? 'active' : '';

    const chip = document.createElement('div');
    chip.className = `day-chip ${isActive}`;
    chip.dataset.date = dateStr;
    chip.innerHTML = `
      <span class="day-name">${dayName}</span>
      <span class="day-number">${dayNumber}</span>
      <span class="dot-indicator"></span>
    `;

    chip.addEventListener('click', () => {
      soundEffects.playPop();
      triggerHaptic(20);
      setDate(dateStr);
    });

    container.appendChild(chip);
  }
}

function setDate(dateStr) {
  currentDate = dateStr;
  
  // Update custom date picker
  const picker = document.getElementById('custom-date-picker');
  if (picker) picker.value = dateStr;

  // Update header text
  const d = new Date(dateStr + 'T12:00:00');
  const options = { weekday: 'long', day: 'numeric', month: 'short' };
  const formatted = d.toLocaleDateString('es-DO', options);
  document.getElementById('current-date-badge').innerText = formatted.toUpperCase();

  // Update Weekly slider chips
  document.querySelectorAll('.day-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.date === dateStr);
  });

  loadEvents();
}

// ---------------- TENANTS ----------------
async function loadTenants() {
  try {
    const res = await window.api.getTenants();
    tenantsList = res.data || [];
    renderTenantBar();
    populateTenantSelectors();
  } catch (err) {
    console.warn('Error loading tenants:', err);
  }
}

function renderTenantBar() {
  const container = document.getElementById('tenant-bar');
  if (!container) return;

  container.innerHTML = `
    <button class="tenant-pill ${currentTenantId === 'all' ? 'active' : ''}" data-tenant="all" onclick="selectTenant('all')">
      <span>🌐 Todos</span>
    </button>
  `;

  tenantsList.forEach(t => {
    const active = currentTenantId === t.id ? 'active' : '';
    const btn = document.createElement('button');
    btn.className = `tenant-pill ${active}`;
    btn.dataset.tenant = t.id;
    btn.onclick = () => selectTenant(t.id);
    btn.innerHTML = `<span>${t.icon || '🏢'} ${t.name}</span>`;
    container.appendChild(btn);
  });

  // Add Tenant Button
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-add-tenant';
  addBtn.innerHTML = '+ Nuevo Perfil';
  addBtn.onclick = () => openTenantModal();
  container.appendChild(addBtn);
}

function selectTenant(tenantId) {
  soundEffects.playPop();
  triggerHaptic(20);
  currentTenantId = tenantId;
  window.currentTenantId = tenantId;

  // Update URL query without page reload
  const url = new URL(window.location);
  if (tenantId === 'all') {
    url.searchParams.delete('tenant');
  } else {
    url.searchParams.set('tenant', tenantId);
  }
  window.history.replaceState({}, '', url);

  // Update pill styles
  document.querySelectorAll('.tenant-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.tenant === tenantId);
  });

  loadEvents();
}

function populateTenantSelectors() {
  const select = document.getElementById('event-tenant-select');
  if (select) {
    select.innerHTML = tenantsList.map(t => `
      <option value="${t.id}">${t.icon || '🏢'} ${t.name}</option>
    `).join('');
  }
}

// ---------------- EVENTS ----------------
async function loadEvents() {
  try {
    const res = await window.api.getEvents(currentDate, currentTenantId, searchQuery);
    eventsList = res.data || [];
    renderTimeline();
    updateProgress();
  } catch (err) {
    showToast('Error cargando compromisos: ' + err.message, 'error');
  }
}

function renderTimeline() {
  const container = document.getElementById('timeline-container');
  container.innerHTML = '';

  let filtered = eventsList;
  if (currentFilter === 'urgent') {
    filtered = eventsList.filter(e => !e.completed && (e.priority === 'high' || (e.minutesLeft !== null && e.minutesLeft <= 10)));
  } else if (currentFilter === 'pending') {
    filtered = eventsList.filter(e => !e.completed);
  } else if (currentFilter === 'completed') {
    filtered = eventsList.filter(e => e.completed);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="icon">🌴</span>
        <h3>Sin compromisos agendados</h3>
        <p>Toca el botón <strong>+</strong> abajo para agregar tu primera actividad.</p>
      </div>
    `;
    return;
  }

  filtered.forEach((event) => {
    // If transit node exists before event
    if (event.transitBefore && event.transitBefore.text) {
      const transitEl = document.createElement('div');
      transitEl.className = 'transit-node';
      transitEl.innerHTML = `<span>${event.transitBefore.icon || '🚗'} ${event.transitBefore.text}</span>`;
      container.appendChild(transitEl);
    }

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

    // Subtasks HTML
    let subtasksHtml = '';
    if (Array.isArray(event.subtasks) && event.subtasks.length > 0) {
      subtasksHtml = `
        <div class="subtasks-section">
          ${event.subtasks.map(s => `
            <div class="subtask-item ${s.completed ? 'done' : ''}" onclick="handleToggleSubtask('${event.id}', '${s.id}', event)">
              <div class="subtask-checkbox">${s.completed ? '✓' : ''}</div>
              <span>${s.text}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Priority class
    const priorityClass = `priority-${event.priority || 'normal'}`;

    // Event Card
    const card = document.createElement('div');
    card.className = `event-card ${event.completed ? 'completed' : ''} ${priorityClass}`;
    card.dataset.id = event.id;

    card.innerHTML = `
      <div class="card-main-row">
        <div class="icon-box" onclick="handleCardClick('${event.id}', event)">${event.icon || '📌'}</div>
        <div class="info" onclick="handleCardClick('${event.id}', event)">
          <div class="time-row">
            <span class="time">${event.timeDisplay || event.time}</span>
            ${event.tenantName ? `<span class="card-tenant-tag">${event.tenantIcon || '🏢'} ${event.tenantName}</span>` : ''}
            ${countdownBadgeHtml}
          </div>
          <div class="title">${event.title}</div>
          <div class="tag">${event.tag || 'Compromiso agendado'}</div>
          ${event.location ? `<div class="location-snippet">📍 ${event.location}</div>` : ''}
        </div>
        <div class="check-circle" onclick="handleToggleEvent('${event.id}', event)">
          <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>
        </div>
      </div>
      ${subtasksHtml}
      <div class="card-actions-toolbar">
        ${event.location ? `<a href="${event.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(event.location)}`}" target="_blank" class="card-action-btn" onclick="event.stopPropagation()">🗺️ Navegar</a>` : `<span></span>`}
        <div style="display:flex; gap:6px;">
          <button class="card-action-btn" onclick="handlePostpone('${event.id}', 15, event)">⏱️ +15m</button>
          <button class="card-action-btn" onclick="handleCardClick('${event.id}', event)">✏️ Editar</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Toggle Task Completed with Sound & Haptics
async function handleToggleEvent(id, e) {
  if (e) e.stopPropagation();
  try {
    const res = await window.api.toggleEvent(id);
    const updated = res.data;
    
    // Play sound and haptic if completed
    if (updated.completed) {
      soundEffects.playSuccess();
      triggerHaptic([40, 60, 40]);
      showToast(`¡"${updated.title}" completado! 🎉`, 'success');
    } else {
      soundEffects.playPop();
      triggerHaptic(25);
    }

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

// Postpone Event
async function handlePostpone(id, minutes = 15, e) {
  if (e) e.stopPropagation();
  try {
    const res = await window.api.postponeEvent(id, minutes);
    soundEffects.playPop();
    triggerHaptic(30);
    showToast(`Pospuesto +${minutes} min (${res.data.timeDisplay})`, 'info');
    loadEvents();
  } catch (err) {
    showToast('Error posponiendo: ' + err.message, 'error');
  }
}

// Toggle Subtask
async function handleToggleSubtask(eventId, subtaskId, e) {
  if (e) e.stopPropagation();
  try {
    const res = await window.api.toggleSubtask(eventId, subtaskId);
    soundEffects.playPop();
    triggerHaptic(20);
    const idx = eventsList.findIndex(ev => ev.id === eventId);
    if (idx !== -1) {
      eventsList[idx] = res.data;
    }
    renderTimeline();
  } catch (err) {
    showToast('Error en subtarea: ' + err.message, 'error');
  }
}

// Update Progress Bar
function updateProgress() {
  const total = eventsList.length;
  const completed = eventsList.filter(e => e.completed).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = `${pct}%`;
  const text = document.getElementById('progress-text');
  if (text) text.innerText = `${completed}/${total} listas (${pct}%)`;
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

// Icon Selector
function initIconSelectors() {
  const choices = document.querySelectorAll('.icon-choice');
  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      choices.forEach(c => c.classList.remove('selected'));
      choice.classList.add('selected');
      selectedIcon = choice.dataset.icon;
      soundEffects.playPop();
    });
  });
}

// Event Listeners
function initEventListeners() {
  // Custom date picker
  document.getElementById('custom-date-picker')?.addEventListener('change', (e) => {
    if (e.target.value) setDate(e.target.value);
  });

  // Search input
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      loadEvents();
    });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      loadEvents();
    });
  }

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      soundEffects.playPop();
      renderTimeline();
    });
  });

  // Modal Triggers
  document.getElementById('fab-add-btn')?.addEventListener('click', () => openEventModal());
  document.getElementById('btn-close-event-modal')?.addEventListener('click', () => closeEventModal());
  document.getElementById('btn-settings-open')?.addEventListener('click', () => openSettingsModal());
  document.getElementById('btn-close-settings-modal')?.addEventListener('click', () => closeSettingsModal());
  document.getElementById('btn-stats-open')?.addEventListener('click', () => openStatsModal());
  document.getElementById('btn-close-stats-modal')?.addEventListener('click', () => closeStatsModal());
  document.getElementById('btn-close-tenant-modal')?.addEventListener('click', () => closeTenantModal());

  // Forms
  document.getElementById('event-form')?.addEventListener('submit', handleSaveEvent);
  document.getElementById('tenant-form')?.addEventListener('submit', handleSaveTenant);
  document.getElementById('settings-form')?.addEventListener('submit', handleSaveConfig);
  document.getElementById('btn-delete-event')?.addEventListener('click', handleDeleteCurrentEvent);

  // Subtask Add Button in Form
  document.getElementById('btn-add-form-subtask')?.addEventListener('click', handleAddFormSubtask);

  // Export iCal
  document.getElementById('btn-export-ical')?.addEventListener('click', () => {
    window.location.href = `/api/events/export/ics?tenantId=${currentTenantId}`;
    showToast('Descargando calendario iCal (.ics)...', 'success');
  });

  // Test Buttons
  document.getElementById('btn-test-email')?.addEventListener('click', handleTestEmail);
  document.getElementById('btn-test-whatsapp')?.addEventListener('click', handleTestWhatsApp);
  document.getElementById('btn-refresh-logs')?.addEventListener('click', loadLogs);

  // Transit toggle
  document.getElementById('event-has-transit')?.addEventListener('change', (e) => {
    document.getElementById('transit-fields').style.display = e.target.checked ? 'block' : 'none';
  });
}

// ---------------- MODAL MANAGEMENT ----------------
function openEventModal(eventId = null) {
  soundEffects.playPop();
  editingEventId = eventId;
  const modal = document.getElementById('event-modal');
  const titleEl = document.getElementById('event-modal-title');
  const btnDelete = document.getElementById('btn-delete-event');
  const subtasksListEl = document.getElementById('form-subtasks-list');
  subtasksListEl.innerHTML = '';

  if (eventId) {
    const event = eventsList.find(e => e.id === eventId);
    if (!event) return;
    titleEl.innerText = 'Editar Compromiso';
    btnDelete.style.display = 'block';

    document.getElementById('event-tenant-select').value = event.tenantId || 'renace';
    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-date').value = event.date || currentDate;
    document.getElementById('event-time').value = event.time || '10:00';
    document.getElementById('event-priority').value = event.priority || 'normal';
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

    // Subtasks
    if (Array.isArray(event.subtasks)) {
      event.subtasks.forEach(s => renderFormSubtaskItem(s.text, s.completed));
    }

    selectedIcon = event.icon || '📌';
  } else {
    titleEl.innerText = 'Nuevo Compromiso';
    btnDelete.style.display = 'none';
    document.getElementById('event-form').reset();
    document.getElementById('event-tenant-select').value = currentTenantId !== 'all' ? currentTenantId : 'renace';
    document.getElementById('event-date').value = currentDate;
    document.getElementById('event-time').value = '10:00';
    document.getElementById('event-priority').value = 'normal';
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

// Subtask management inside Event Form
function handleAddFormSubtask() {
  const input = document.getElementById('form-new-subtask-input');
  const text = input.value.trim();
  if (!text) return;
  renderFormSubtaskItem(text, false);
  input.value = '';
  input.focus();
}

function renderFormSubtaskItem(text, completed = false) {
  const container = document.getElementById('form-subtasks-list');
  const item = document.createElement('div');
  item.style = 'display:flex; align-items:center; gap:8px; margin-bottom:6px;';
  item.innerHTML = `
    <input type="checkbox" ${completed ? 'checked' : ''} class="form-subtask-check" style="accent-color:var(--accent);">
    <input type="text" value="${text}" class="form-input form-subtask-text" style="flex:1; padding:6px 10px; font-size:12px;">
    <button type="button" style="background:none; border:none; color:#ef4444; font-size:14px; cursor:pointer;" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(item);
}

// Save Event (Create or Update)
async function handleSaveEvent(e) {
  e.preventDefault();

  const tenantId = document.getElementById('event-tenant-select').value;
  const title = document.getElementById('event-title').value.trim();
  const date = document.getElementById('event-date').value;
  const time = document.getElementById('event-time').value;
  const priority = document.getElementById('event-priority').value;
  const tag = document.getElementById('event-tag').value.trim();
  const location = document.getElementById('event-location').value.trim();
  const notes = document.getElementById('event-notes').value.trim();
  const notifyEmail = document.getElementById('event-notify-email').checked;
  const notifyWhatsApp = document.getElementById('event-notify-whatsapp').checked;

  const hasTransit = document.getElementById('event-has-transit').checked;
  const transitText = document.getElementById('event-transit-text').value.trim();

  // Collect Subtasks
  const subtaskElements = document.querySelectorAll('#form-subtasks-list > div');
  const subtasks = Array.from(subtaskElements).map(el => ({
    id: Math.random().toString(36).substring(2, 9),
    text: el.querySelector('.form-subtask-text').value.trim(),
    completed: el.querySelector('.form-subtask-check').checked
  })).filter(s => s.text);

  const eventPayload = {
    tenantId,
    title,
    date,
    time,
    priority,
    tag: tag || 'General',
    location,
    notes,
    icon: selectedIcon,
    subtasks,
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

    soundEffects.playPop();
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

// ---------------- TENANT MODAL ----------------
function openTenantModal() {
  soundEffects.playPop();
  document.getElementById('tenant-modal').classList.add('open');
}

function closeTenantModal() {
  document.getElementById('tenant-modal').classList.remove('open');
}

async function handleSaveTenant(e) {
  e.preventDefault();
  const name = document.getElementById('new-tenant-name').value.trim();
  const icon = document.getElementById('new-tenant-icon').value.trim() || '🏢';
  const badge = document.getElementById('new-tenant-badge').value.trim() || 'Cliente';
  const notifyEmail = document.getElementById('new-tenant-email').value.trim();
  const notifyPhone = document.getElementById('new-tenant-phone').value.trim();

  try {
    await window.api.createTenant({ name, icon, badge, notifyEmail, notifyPhone });
    showToast(`Perfil "${name}" creado exitosamente`, 'success');
    closeTenantModal();
    await loadTenants();
  } catch (err) {
    showToast('Error creando tenant: ' + err.message, 'error');
  }
}

// ---------------- STATS MODAL ----------------
async function openStatsModal() {
  soundEffects.playPop();
  const modal = document.getElementById('stats-modal');
  try {
    const res = await window.api.getAnalytics(currentTenantId);
    const data = res.data;
    document.getElementById('stat-total').innerText = data.total;
    document.getElementById('stat-completed').innerText = data.completed;
    document.getElementById('stat-rate').innerText = `${data.completionRate}%`;
    document.getElementById('stat-urgent').innerText = data.priorityBreakdown.high;
    modal.classList.add('open');
  } catch (err) {
    showToast('Error cargando estadísticas', 'error');
  }
}

function closeStatsModal() {
  document.getElementById('stats-modal').classList.remove('open');
}

// ---------------- SETTINGS & CONFIG ----------------
async function loadConfig() {
  try {
    const res = await window.api.getConfig();
    const cfg = res.data;
    if (!cfg) return;

    document.getElementById('cfg-email').value = cfg.defaultNotifyEmail || '';
    document.getElementById('cfg-phone').value = cfg.defaultNotifyPhone || '';
    document.getElementById('cfg-evo-instance').value = cfg.evoInstance || 'RENACE.TECH';
    document.getElementById('cfg-evo-url').value = cfg.evoApiUrl || 'https://evoapi.renace.tech';

    // Insforge Status
    const statusRes = await window.api.getStatus();
    const insforgeInfo = statusRes.data?.insforge;
    if (insforgeInfo) {
      const insforgeEl = document.getElementById('insforge-status-display');
      if (insforgeEl) {
        insforgeEl.innerHTML = `
          <strong>Insforge DB Sync:</strong> ${insforgeInfo.status}<br>
          <span style="color:#94a3b8; font-size:11px;">${insforgeInfo.engine}</span>
        `;
      }
    }
  } catch (err) {
    console.warn('Error loading config:', err);
  }
}

function openSettingsModal() {
  soundEffects.playPop();
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

// ---------------- TESTS ----------------
async function handleTestEmail() {
  const btn = document.getElementById('btn-test-email');
  btn.disabled = true;
  btn.innerText = 'Enviando...';

  try {
    const recipient = document.getElementById('cfg-email').value.trim();
    const tenant = currentTenantId !== 'all' ? currentTenantId : 'renace';
    const res = await window.api.testEmail(recipient, tenant);
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
    const tenant = currentTenantId !== 'all' ? currentTenantId : 'renace';
    const res = await window.api.testWhatsApp(phone, tenant);
    showToast(res.message || 'WhatsApp de prueba enviado con éxito', 'success');
    loadLogs();
  } catch (err) {
    showToast('Error enviando WhatsApp: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerText = '💬 Probar WhatsApp (EvoAPI)';
  }
}

// ---------------- LOGS ----------------
async function loadLogs() {
  const logsContainer = document.getElementById('logs-container');
  logsContainer.innerHTML = '<div style="font-size:12px; color:#94a3b8;">Cargando historial...</div>';

  try {
    const res = await window.api.getLogs(currentTenantId);
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
            <span>${icon} ${log.channel} [${log.tenantId || 'global'}]</span>
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

// ---------------- TOAST ----------------
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
