const db = require('../db');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');

let schedulerInterval = null;

function parseEventDateTime(event) {
  if (!event || !event.date || !event.time) return null;
  // e.g. date: "2026-08-27", time: "10:00"
  const [year, month, day] = event.date.split('-').map(Number);
  const [hours, minutes] = event.time.split(':').map(Number);
  
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function calculateMinutesRemaining(eventDate) {
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  return diffMs / (1000 * 60);
}

async function checkUpcomingEvents() {
  try {
    const events = db.getEvents();
    const config = db.getConfig();

    const firstWindowMin = config.alertMinutesFirst || 10;
    const secondWindowMin = config.alertMinutesSecond || 5;

    for (const event of events) {
      if (event.completed) continue;

      const eventDateTime = parseEventDateTime(event);
      if (!eventDateTime) continue;

      const minutesRemaining = calculateMinutesRemaining(eventDateTime);

      // Window for first alert (e.g. 10m window: between 8.5m and 10.5m)
      if (minutesRemaining <= (firstWindowMin + 0.5) && minutesRemaining >= (firstWindowMin - 1.5)) {
        if (!event.notified_10m) {
          console.log(`[Scheduler] ⏰ Disparando alerta de ${firstWindowMin}m para: "${event.title}"`);
          
          db.updateEvent(event.id, { notified_10m: true });

          if (event.notifyEmail !== false) {
            emailService.sendEventReminder(event, firstWindowMin).catch(err => {
              console.error('[Scheduler] Email error:', err);
            });
          }

          if (event.notifyWhatsApp !== false) {
            whatsappService.sendEventReminder(event, firstWindowMin).catch(err => {
              console.error('[Scheduler] WhatsApp error:', err);
            });
          }
        }
      }

      // Window for second alert (e.g. 5m window: between 3.5m and 5.5m)
      if (minutesRemaining <= (secondWindowMin + 0.5) && minutesRemaining >= (secondWindowMin - 1.5)) {
        if (!event.notified_5m) {
          console.log(`[Scheduler] 🚨 Disparando alerta de ${secondWindowMin}m para: "${event.title}"`);

          db.updateEvent(event.id, { notified_5m: true });

          if (event.notifyEmail !== false) {
            emailService.sendEventReminder(event, secondWindowMin).catch(err => {
              console.error('[Scheduler] Email error:', err);
            });
          }

          if (event.notifyWhatsApp !== false) {
            whatsappService.sendEventReminder(event, secondWindowMin).catch(err => {
              console.error('[Scheduler] WhatsApp error:', err);
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error during checkUpcomingEvents:', err);
  }
}

function startScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log('[Scheduler] ⏰ Motor de Alertas Automáticas iniciado (Chequeo cada 20 segundos para 10m y 5m)');
  // Initial check
  checkUpcomingEvents();
  // Continuous check every 20 seconds
  schedulerInterval = setInterval(checkUpcomingEvents, 20000);
}

function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Motor de Alertas detenido.');
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  checkUpcomingEvents,
  parseEventDateTime,
  calculateMinutesRemaining
};
