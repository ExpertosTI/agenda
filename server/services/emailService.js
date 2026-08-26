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

function buildHtmlTemplate({ event, tenant, minutesBefore, isTest = false }) {
  const appUrl = process.env.APP_URL || 'https://agenda.renace.tech';
  const tenantName = tenant ? tenant.name : 'RENACE Tech';
  const tenantIcon = tenant ? tenant.icon : '⚡';
  const tenantColor = tenant ? tenant.accentColor || '#6366f1' : '#6366f1';
  
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
        <div class="badge">${tenantIcon} ${tenantName} · AGENDA MULTI-TENANT</div>
        <h1>Prueba de Notificación Exitosa</h1>
        <p>Tu servidor SMTP de Hostinger (<code>info@renace.tech</code>) está correctamente configurado y listo para despachar alertas de compromisos a los 10m y 5m para el perfil <strong>${tenantName}</strong>.</p>
        <div class="status-box">
          ✓ Hostinger SMTP SSL (Port 465)<br>
          ✓ Tenant: ${tenantName} (${tenant ? tenant.id : 'global'})<br>
          ✓ Fecha y Hora: ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}
        </div>
        <a href="${appUrl}" class="btn">Abrir Agenda Móvil</a>
        <div class="footer">
          Powered by <strong>RENACE Tech</strong> & <strong>Insforge DB</strong>
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
      .tenant-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
      .tenant-badge { font-size: 12px; font-weight: 800; color: ${tenantColor}; background: rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 12px; }
      .alert-badge { display: inline-block; background: ${badgeBg}; color: ${badgeColor}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 20px; border: 1px solid ${badgeBorder}; margin-bottom: 18px; }
      h1 { font-size: 22px; font-weight: 800; margin: 0 0 16px 0; color: #ffffff; }
      .card { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 20px; margin-bottom: 22px; }
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
      <div class="tenant-header">
        <span class="tenant-badge">${tenantIcon} ${tenantName}</span>
        <div class="alert-badge">⏰ ALERTA: FALTAN ${minutesBefore} MINUTOS</div>
      </div>
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

      <a href="${appUrl}?tenant=${tenant ? tenant.id : 'renace'}" class="btn">Ver en Agenda Móvil</a>

      <div class="footer">
        Enviado automáticamente por <strong>${tenantName} Agenda</strong> (<a href="${appUrl}" style="color:#818cf8; text-decoration:none;">agenda.renace.tech</a>)<br>
        Desde: <code>info@renace.tech</code>
      </div>
    </div>
  </body>
  </html>
  `;
}

async function sendEventReminder(event, minutesBefore, customRecipient = null) {
  const tenant = db.getTenantById(event.tenantId);
  const config = db.getConfig();
  const toEmail = customRecipient || (tenant && tenant.notifyEmail) || config.defaultNotifyEmail || 'info@renace.tech';
  const fromName = tenant ? `${tenant.name} Agenda` : 'RENACE Agenda';

  try {
    const transporter = createTransporter();
    const subject = `⏰ [${minutesBefore}m] ${tenant ? `[${tenant.name}] ` : ''}${event.icon || ''} ${event.title} (${event.timeDisplay || event.time})`;
    const html = buildHtmlTemplate({ event, tenant, minutesBefore });

    const info = await transporter.sendMail({
      from: `"${fromName}" <info@renace.tech>`,
      to: toEmail,
      subject: subject,
      html: html
    });

    console.log(`[EmailService] Reminder sent for "${event.title}" [Tenant: ${tenant ? tenant.id : 'default'}] (${minutesBefore}m) to ${toEmail}. MessageId: ${info.messageId}`);
    
    db.addLog({
      type: 'email',
      channel: 'Hostinger SMTP',
      tenantId: tenant ? tenant.id : 'renace',
      recipient: toEmail,
      eventId: event.id,
      eventTitle: event.title,
      minutesBefore: minutesBefore,
      status: 'success',
      messageId: info.messageId,
      detail: `Correo a los ${minutesBefore}m enviado para ${tenant ? tenant.name : 'RENACE'}`
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send reminder for "${event.title}":`, error.message);
    
    db.addLog({
      type: 'email',
      channel: 'Hostinger SMTP',
      tenantId: tenant ? tenant.id : 'renace',
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

async function sendTestEmail(customRecipient = null, tenantId = null) {
  const tenant = db.getTenantById(tenantId);
  const config = db.getConfig();
  const toEmail = customRecipient || (tenant && tenant.notifyEmail) || config.defaultNotifyEmail || 'info@renace.tech';
  const fromName = tenant ? `${tenant.name} Agenda` : 'RENACE Agenda';

  try {
    const transporter = createTransporter();
    const subject = `✅ [Prueba Multi-Tenant] Conexión SMTP Exitosa - ${tenant ? tenant.name : 'Agenda RENACE'}`;
    const html = buildHtmlTemplate({ tenant, isTest: true });

    const info = await transporter.sendMail({
      from: `"${fromName}" <info@renace.tech>`,
      to: toEmail,
      subject: subject,
      html: html
    });

    console.log(`[EmailService] Test email sent to ${toEmail}. MessageId: ${info.messageId}`);

    db.addLog({
      type: 'email_test',
      channel: 'Hostinger SMTP',
      tenantId: tenant ? tenant.id : 'renace',
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
      tenantId: tenant ? tenant.id : 'renace',
      recipient: toEmail,
      status: 'error',
      error: error.message,
      detail: `Fallo al enviar correo de prueba`
    });

    return { success: false, error: error.message };
  }
}

async function sendDailySummaryEmail(dateStr = null, customRecipient = null) {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const events = db.getEvents(targetDate);
  const config = db.getConfig();
  const toEmail = customRecipient || config.defaultNotifyEmail || 'ericmiguellaureano036@gmail.com';
  const appUrl = process.env.APP_URL || 'https://agenda.renace.tech';

  const d = new Date(targetDate + 'T12:00:00');
  const dateFormatted = d.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  let eventsHtml = '';
  if (events.length === 0) {
    eventsHtml = '<p style="color:#94a3b8; font-style:italic; text-align:center; padding:20px;">No tienes compromisos agendados para este día.</p>';
  } else {
    events.forEach((evt, idx) => {
      const tenant = db.getTenantById(evt.tenantId);
      const icon = evt.icon || '📌';
      const time = evt.timeDisplay || evt.time;
      const tenantName = tenant ? tenant.name : 'RENACE';
      const tenantColor = tenant ? tenant.accentColor || '#6366f1' : '#6366f1';

      let subtasksHtml = '';
      if (Array.isArray(evt.subtasks) && evt.subtasks.length > 0) {
        subtasksHtml = '<div style="margin-top:8px; padding-left:10px; border-left:2px solid rgba(255,255,255,0.1);">';
        evt.subtasks.forEach(st => {
          subtasksHtml += `<div style="font-size:12px; color:${st.completed ? '#10b981' : '#cbd5e1'}; margin-bottom:3px;">${st.completed ? '✓' : '▫'} ${st.text}</div>`;
        });
        subtasksHtml += '</div>';
      }

      let transitHtml = '';
      if (evt.transitBefore && evt.transitBefore.text) {
        transitHtml = `
          <div style="background:rgba(99,102,241,0.08); border-radius:8px; padding:6px 12px; margin-bottom:8px; font-size:12px; color:#818cf8;">
            🚗 <em>${evt.transitBefore.text}</em>
          </div>
        `;
      }

      eventsHtml += `
        ${transitHtml}
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:12px; font-weight:800; color:#818cf8;">🕒 ${time}</span>
            <span style="font-size:11px; font-weight:700; color:${tenantColor}; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:8px;">${tenantName}</span>
          </div>
          <div style="font-size:16px; font-weight:800; color:#ffffff; margin-bottom:4px;">${icon} ${evt.title}</div>
          <div style="font-size:13px; color:#94a3b8;">${evt.tag || ''}</div>
          ${evt.location ? `<div style="font-size:12px; color:#38bdf8; margin-top:6px;">📍 ${evt.location}</div>` : ''}
          ${evt.notes ? `<div style="font-size:12px; color:#cbd5e1; margin-top:6px; background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:8px;">📝 ${evt.notes}</div>` : ''}
          ${subtasksHtml}
        </div>
      `;
    });
  }

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <style>
      body { margin:0; padding:0; background-color: #060911; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; }
      .container { max-width: 560px; margin: 20px auto; background: #0b1120; border: 1px solid rgba(255,255,255,0.1); border-radius: 28px; padding: 32px; box-shadow: 0 25px 60px rgba(0,0,0,0.8); }
      .header-badge { display: inline-block; background: rgba(99, 102, 241, 0.2); color: #818cf8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; margin-bottom: 14px; }
      h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 4px 0; }
      .date-sub { font-size: 14px; font-weight: 700; color: #a855f7; margin-bottom: 20px; text-transform: capitalize; }
      .btn { display: block; background: linear-gradient(135deg, #6366f1, #a855f7); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 20px; border-radius: 14px; text-align: center; margin-top: 24px; }
      .footer { font-size: 11px; color: #64748b; margin-top: 26px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 18px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header-badge">🌟 AGENDA RENACE · RESUMEN DE JORNADA</div>
      <h1>Resumen de tu Agenda</h1>
      <div class="date-sub">📅 ${dateFormatted}</div>

      <div style="margin-bottom: 20px;">
        ${eventsHtml}
      </div>

      <a href="${appUrl}" class="btn">Abrir Agenda Completa en Vivo</a>

      <div class="footer">
        🔔 Recibirás alertas automáticas en este correo y en WhatsApp <strong>10m y 5m</strong> antes de cada compromiso.<br><br>
        Enviado por <strong>Agenda RENACE</strong> · <a href="${appUrl}" style="color:#818cf8; text-decoration:none;">agenda.renace.tech</a>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const transporter = createTransporter();
    const subject = `🌟 [Resumen de Agenda] Tu Planificación para ${dateFormatted}`;

    const info = await transporter.sendMail({
      from: `"Agenda RENACE" <info@renace.tech>`,
      to: toEmail,
      subject: subject,
      html: html
    });

    console.log(`[EmailService] Daily summary email sent to ${toEmail}. MessageId: ${info.messageId}`);

    db.addLog({
      type: 'email_summary',
      channel: 'Hostinger SMTP',
      tenantId: 'all',
      recipient: toEmail,
      status: 'success',
      messageId: info.messageId,
      detail: `Resumen de agenda enviado por correo para fecha ${targetDate}`
    });

    return { success: true, messageId: info.messageId, recipient: toEmail };
  } catch (error) {
    console.error('[EmailService] Failed to send summary email:', error.message);

    db.addLog({
      type: 'email_summary',
      channel: 'Hostinger SMTP',
      tenantId: 'all',
      recipient: toEmail,
      status: 'error',
      error: error.message,
      detail: `Fallo al enviar resumen de agenda por correo`
    });

    return { success: false, error: error.message };
  }
}

module.exports = {
  verifyConnection,
  sendEventReminder,
  sendTestEmail,
  sendDailySummaryEmail
};

