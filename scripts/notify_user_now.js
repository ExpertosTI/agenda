require('dotenv').config();
const db = require('../server/db');
const emailService = require('../server/services/emailService');
const whatsappService = require('../server/services/whatsappService');

async function main() {
  const targetEmail = 'ericmiguellaureano036@gmail.com';
  const targetPhone = '18297125844';

  console.log('====================================================');
  console.log('📨 DESPACHO DE RESUMEN Y NOTIFICACIONES A USUARIO');
  console.log(`👤 Correo Destino: ${targetEmail}`);
  console.log(`💬 WhatsApp Destino: +${targetPhone}`);
  console.log('====================================================');

  // Dates: today and tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  console.log(`\n📅 1. Enviando Resumen de Mañana (${tomorrowStr})...`);

  // Ensure tomorrow has events to display
  const tomorrowEvents = db.getEvents(tomorrowStr);
  if (tomorrowEvents.length === 0) {
    console.log('Duplicando eventos de demostración para la fecha de mañana...');
    const todayEvents = db.getEvents(todayStr);
    todayEvents.forEach(evt => {
      db.saveEvent({
        ...evt,
        id: undefined,
        date: tomorrowStr,
        completed: false,
        notified_10m: false,
        notified_5m: false
      });
    });
  }

  // 1. Send WhatsApp Summary for Tomorrow
  console.log('Enviando WhatsApp de Resumen para mañana...');
  const waTomorrow = await whatsappService.sendDailySummary(tomorrowStr, targetPhone);
  console.log('Resultado WhatsApp:', waTomorrow);

  // 2. Send Email Summary for Tomorrow
  console.log('\nEnviando Correo SMTP de Resumen para mañana...');
  const emTomorrow = await emailService.sendDailySummaryEmail(tomorrowStr, targetEmail);
  console.log('Resultado Email:', emTomorrow);

  console.log('\n====================================================');
  console.log('✅ Despacho completado.');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Error durante el despacho:', err);
});
