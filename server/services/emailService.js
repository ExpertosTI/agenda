const nodemailer = require('nodemailer');
const db = require('../db');

function createTransporter() {
  const config = db.getConfig();
  const host = config.smtpHost || 'smtp.hostinger.com';
  const port = parseInt(config.smtpPort || '465', 10);
  const secure = port === 465;

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure,
    auth: {
      user: config.smtpUser || 'info@renace.tech',
      pass: process.env.SMTP_PASS || config.smtpPassword || 'JustWork2027@'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

async function verifyConnection() {
  try {
    const transporter = createTransporter();
    const result = await transporter.verify();
    return { success: true, message: 'Conexión SMTP exitosa con Hostinger' };
  } catch (error) {
    console.error('[EmailService] SMTP Verify Error:', error.message);
    return { success: false, error: error.message };
  }
}

function buildHtmlTemplate({ event, minutesBefore, isTest = false }) {
  const config = db.getConfig();
  const appUrl = process.env.APP_URL || 'https://agenda.renace.tech';
  
  if (isTest) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { margin:0; padding:0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
        .container { max-width: 540px; margin: 20px auto; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        .badge { display: inline-block; background: rgba(99, 102, 241, 0.2); color: #818cf8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.4); margin-bottom: 16px; }
        h1 { font-size: 22px; font-weight: 800; margin: 0 0 12px 0; color: #ffffff; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
        .status-box { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 18px; color: #10b981; font-weight: 600; font-size: 14px; margin-bottom: 24px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 14px; text-align: center; }
        .footer { font-size: 11px; color: #64748b; margin-top: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">⚡ RENACE TECH · AGENDA</div>
        <h1>Prueba de Notificación Exitosa</h1>
        <p>Tu servidor SMTP de Hostinger (<code>info@renace.tech</code>) está correctamente configurado y listo para despachar alertas de compromisos a los 10m y 5m.</p>
        <div class="status-box">
          ✓ Conexión establecida · Hostinger SMTP Port 465 (SSL)<br>
          ✓ Fecha y Hora: ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}
        </div>
        <a href="${appUrl}" class="btn">Abrir Agenda Móvil</a>
        <div class="footer">
          Powered by <strong>RENACE Tech</strong> · Sistema de Productividad & Agenda
        </div>
      </div>
    </body>
    </html>
    `;
  }

  const badgeColor = minutesBefore === 5 ? '#ef4444' : '#f59e0b';
  const badgeBg = minutesBefore === 5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
  const badgeBorder = minutesBefore === 5 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)';

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <style>
      body { margin:0; padding:0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
      .container { max-width: 520px; margin: 20px auto; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.7); }
      .alert-badge { display: inline-block; background: ${badgeBg}; color: ${badgeColor}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 20px; border: 1px solid ${badgeBorder}; margin-bottom: 18px; }
      h1 { font-size: 22px; font-weight: 800; margin: 0 0 16px 0; color: #ffffff; }
      .card { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 20px; margin-bottom: 22px; }
      .card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
      .icon-box { font-size: 28px; background: rgba(255,255,255,0.06); width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); }
      .time-highlight { font-size: 14px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      .title-highlight { font-size: 18px; font-weight: 800; color: #ffffff; }
      .tag-text { font-size: 13px; color: #94a3b8; margin-top: 4px; }
      .transit-box { background: rgba(99, 102, 241, 0.1); border-left: 3px solid #6366f1; border-radius: 8px; padding: 10px 14px; margin-top: 14px; font-size: 13px; color: #c7d2fe; }
      .notes-box { background: rgba(255,255,255,0.02); border-radius: 10px; padding: 12px 14px; margin-top: 12px; font-size: 13px; color: #cbd5e1; border: 1px dashed rgba(255,255,255,0.1); }
      .btn { display: block; background: linear-gradient(135deg, #6366f1, #a855f7); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 20px; border-radius: 14px; text-align: center; margin-top: 20px; }
      .footer { font-size: 11px; color: #64748b; margin-top: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="alert-badge">⏰ ALERTA: FALTAN ${minutesBefore} MINUTOS</div>
      <h1>Próximo Compromiso en tu Agenda</h1>
      
      <div class="card">
        <div style="margin-bottom: 12px;">
          <div class="time-highlight">🕒 ${event.timeDisplay || event.time} · Fecha: ${event.date}</div>
          <div class="title-highlight">${event.icon || '📌'} ${event.title}</div>
          <div class="tag-text">${event.tag || 'Compromiso agendado'}</div>
        </div>

        ${event.location ? `<div style="font-size: 13px; color: #38bdf8; margin-top: 8px;">📍 Ubicación: <strong>${event.location}</strong></div>` : ''}

        ${event.transitBefore ? `
          <div class="transit-box">
            🚗 <strong>Traslado previo:</strong> ${event.transitBefore.text || 'Tiempo estimado en ruta'}
          </div>
        ` : ''}

        ${event.notes ? `
          <div class="notes-box">
            📝 <strong>Detalles:</strong> ${event.notes}
          </div>
        ` : ''}
      </div>

      <a href="${appUrl}" class="btn">Ver en Agenda Móvil</a>

      <div class="footer">
        Enviado automáticamente por <strong>RENACE Tech Agenda</strong> (<a href="${appUrl}" style="color:#818cf8; text-decoration:none;">agenda.renace.tech</a>)<br>
        Desde: <code>info@renace.tech</code>
      </div>
    </div>
  </body>
  </html>
  `;
}

async function sendEventReminder(event, minutesBefore, customRecipient = null) {
  const config = db.getConfig();
  const toEmail = customRecipient || config.defaultNotifyEmail || 'info@renace.tech';

  try {
    const transporter = createTransporter();
    const subject = `⏰ [${minutesBefore}m] Recordatorio: ${event.icon || ''} ${event.title} (${event.timeDisplay || event.time})`;
    const html = buildHtmlTemplate({ event, minutesBefore });

    const info = await transporter.sendMail({
      from: config.smtpFrom || '"RENACE Agenda" <info@renace.tech>',
      to: toEmail,
      subject: subject,
      html: html
    });

    console.log(`[EmailService] Reminder sent for "${event.title}" (${minutesBefore}m) to ${toEmail}. MessageId: ${info.messageId}`);
    
    db.addLog({
      type: 'email',
      channel: 'Hostinger SMTP',
      recipient: toEmail,
      eventId: event.id,
      eventTitle: event.title,
      minutesBefore: minutesBefore,
      status: 'success',
      messageId: info.messageId,
      detail: `Correo de aviso a los ${minutesBefore}m enviado exitosamente`
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send reminder for "${event.title}":`, error.message);
    
    db.addLog({
      type: 'email',
      channel: 'Hostinger SMTP',
      recipient: toEmail,
      eventId: event.id,
      eventTitle: event.title,
      minutesBefore: minutesBefore,
      status: 'error',
      error: error.message,
      detail: `Error al despachar correo por SMTP`
    });

    return { success: false, error: error.message };
  }
}

async function sendTestEmail(customRecipient = null) {
  const config = db.getConfig();
  const toEmail = customRecipient || config.defaultNotifyEmail || 'info@renace.tech';

  try {
    const transporter = createTransporter();
    const subject = `✅ [Prueba] Conexión SMTP Exitosa - Agenda RENACE`;
    const html = buildHtmlTemplate({ isTest: true });

    const info = await transporter.sendMail({
      from: config.smtpFrom || '"RENACE Agenda" <info@renace.tech>',
      to: toEmail,
      subject: subject,
      html: html
    });

    console.log(`[EmailService] Test email sent to ${toEmail}. MessageId: ${info.messageId}`);

    db.addLog({
      type: 'email_test',
      channel: 'Hostinger SMTP',
      recipient: toEmail,
      status: 'success',
      messageId: info.messageId,
      detail: `Prueba de correo SMTP enviada correctamente`
    });

    return { success: true, messageId: info.messageId, recipient: toEmail };
  } catch (error) {
    console.error('[EmailService] Test email failed:', error.message);

    db.addLog({
      type: 'email_test',
      channel: 'Hostinger SMTP',
      recipient: toEmail,
      status: 'error',
      error: error.message,
      detail: `Fallo al enviar correo de prueba`
    });

    return { success: false, error: error.message };
  }
}

module.exports = {
  verifyConnection,
  sendEventReminder,
  sendTestEmail
};
