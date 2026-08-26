const db = require('../db');

function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  // Dominican Republic numbers (10 digits starting with 809, 829, 849 -> prepend 1)
  if (cleaned.length === 10 && (cleaned.startsWith('809') || cleaned.startsWith('829') || cleaned.startsWith('849'))) {
    cleaned = '1' + cleaned;
  }
  return cleaned;
}

function buildWhatsAppMessage(event, minutesBefore) {
  const appUrl = process.env.APP_URL || 'https://agenda.renace.tech';
  const icon = event.icon || '📌';
  const urgency = minutesBefore === 5 ? '🚨 *¡ALERTA DE 5 MINUTOS!*' : '⏰ *RECORDATORIO: FALTAN 10 MINUTOS*';

  let msg = `${urgency}\n\n`;
  msg += `*${icon} ${event.title}*\n`;
  msg += `🕒 *Hora:* ${event.timeDisplay || event.time} (Fecha: ${event.date})\n`;
  
  if (event.tag) {
    msg += `🏷️ *Categoría:* ${event.tag}\n`;
  }
  
  if (event.location) {
    msg += `📍 *Ubicación:* ${event.location}\n`;
  }

  if (event.transitBefore && event.transitBefore.text) {
    msg += `🚗 *Traslado previo:* ${event.transitBefore.text}\n`;
  }

  if (event.notes) {
    msg += `📝 *Notas:* ${event.notes}\n`;
  }

  msg += `\n🌐 *Abrir Agenda:* ${appUrl}`;
  return msg;
}

async function sendWhatsAppMessage({ number, text }) {
  const config = db.getConfig();
  const evoApiUrl = (config.evoApiUrl || 'https://evoapi.renace.tech').replace(/\/$/, '');
  const evoApiKey = config.evoApiKey || 'B6D711FCDE4D4FD5936544120E713976';
  const evoInstance = config.evoInstance || 'RENACE.TECH';

  const cleanNumber = normalizePhone(number);
  if (!cleanNumber) {
    throw new Error('Número de teléfono inválido o vacío');
  }

  const endpoint = `${evoApiUrl}/message/sendText/${encodeURIComponent(evoInstance)}`;
  
  const payload = {
    number: cleanNumber,
    text: text,
    delay: 1200
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evoApiKey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(`Evolution API Error: ${errorMsg}`);
  }

  return data;
}

async function sendEventReminder(event, minutesBefore, customPhone = null) {
  const config = db.getConfig();
  const recipientPhone = customPhone || config.defaultNotifyPhone || '18093487921';
  const text = buildWhatsAppMessage(event, minutesBefore);

  try {
    const result = await sendWhatsAppMessage({ number: recipientPhone, text });
    console.log(`[WhatsAppService] Reminder sent for "${event.title}" (${minutesBefore}m) to ${recipientPhone}`);

    db.addLog({
      type: 'whatsapp',
      channel: 'Evolution API',
      recipient: recipientPhone,
      eventId: event.id,
      eventTitle: event.title,
      minutesBefore: minutesBefore,
      status: 'success',
      detail: `Mensaje de WhatsApp a los ${minutesBefore}m enviado exitosamente`
    });

    return { success: true, data: result };
  } catch (error) {
    console.error(`[WhatsAppService] Failed to send reminder for "${event.title}":`, error.message);

    db.addLog({
      type: 'whatsapp',
      channel: 'Evolution API',
      recipient: recipientPhone,
      eventId: event.id,
      eventTitle: event.title,
      minutesBefore: minutesBefore,
      status: 'error',
      error: error.message,
      detail: `Error al enviar WhatsApp vía Evolution API`
    });

    return { success: false, error: error.message };
  }
}

async function sendTestWhatsApp(customPhone = null) {
  const config = db.getConfig();
  const recipientPhone = customPhone || config.defaultNotifyPhone || '18093487921';
  const evoInstance = config.evoInstance || 'RENACE.TECH';
  const appUrl = process.env.APP_URL || 'https://agenda.renace.tech';

  const testText = `✅ *PRUEBA AGENDA RENACE · EVOLUTION API*\n\nConexión establecida con éxito.\n• Instancia: *${evoInstance}*\n• Fecha: ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}\n• Alertas activas: *10 minutos* y *5 minutos* antes de cada compromiso.\n\n🌐 ${appUrl}`;

  try {
    const result = await sendWhatsAppMessage({ number: recipientPhone, text: testText });
    console.log(`[WhatsAppService] Test WhatsApp sent to ${recipientPhone}`);

    db.addLog({
      type: 'whatsapp_test',
      channel: 'Evolution API',
      recipient: recipientPhone,
      status: 'success',
      detail: `Prueba de WhatsApp enviada correctamente`
    });

    return { success: true, data: result, recipient: recipientPhone };
  } catch (error) {
    console.error('[WhatsAppService] Test WhatsApp failed:', error.message);

    db.addLog({
      type: 'whatsapp_test',
      channel: 'Evolution API',
      recipient: recipientPhone,
      status: 'error',
      error: error.message,
      detail: `Fallo al enviar WhatsApp de prueba`
    });

    return { success: false, error: error.message };
  }
}

module.exports = {
  normalizePhone,
  sendWhatsAppMessage,
  sendEventReminder,
  sendTestWhatsApp
};
