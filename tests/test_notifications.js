const db = require('../server/db');
const emailService = require('../server/services/emailService');
const whatsappService = require('../server/services/whatsappService');
const { calculateMinutesRemaining, parseEventDateTime } = require('../server/services/schedulerService');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 EJECUTANDO SUITE DE PRUEBAS - AGENDA RENACE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. DB Test
  console.log('\n--- 1. Pruebas de Persistencia & Eventos Semilla ---');
  const events = db.getEvents();
  assert(events.length >= 6, `Se cargaron ${events.length} eventos iniciales (mínimo 6 esperados)`);
  
  const altamarEvent = events.find(e => e.title.includes('Altamar'));
  assert(altamarEvent !== undefined, 'Evento "Cocina Altamar" encontrado');
  assert(altamarEvent && altamarEvent.transitBefore !== null, 'Tramo de tránsito previo registrado en Cocina Altamar');

  // Test toggling completion
  const toggled = db.toggleEventCompleted(events[0].id);
  assert(toggled.completed === true, 'Toggle completar evento funciona');
  db.toggleEventCompleted(events[0].id); // restore

  // 2. Config Test
  console.log('\n--- 2. Pruebas de Configuración & Hostinger SMTP ---');
  const cfg = db.getConfig();
  assert(cfg.smtpUser === 'info@renace.tech', 'Usuario SMTP configurado: info@renace.tech');
  assert(cfg.smtpHost === 'smtp.hostinger.com', 'Servidor SMTP Hostinger configurado');
  assert(cfg.evoInstance === 'RENACE.TECH', 'Instancia Evolution API: RENACE.TECH');

  // Verify SMTP Connection Live
  console.log('Conectando a Hostinger SMTP (smtp.hostinger.com:465)...');
  const smtpResult = await emailService.verifyConnection();
  if (smtpResult.success) {
    assert(true, 'Conexión SMTP con Hostinger exitosa');
  } else {
    console.warn(`⚠️ Aviso SMTP: ${smtpResult.error}`);
  }

  // 3. WhatsApp Phone Normalization Test
  console.log('\n--- 3. Pruebas de Formato WhatsApp Evolution API ---');
  const norm1 = whatsappService.normalizePhone('809-348-7921');
  assert(norm1 === '18093487921', `Normalización Dominicana: 809-348-7921 -> ${norm1}`);

  const norm2 = whatsappService.normalizePhone('+1 (829) 555-1234');
  assert(norm2 === '18295551234', `Normalización Internacional: +1 (829) 555-1234 -> ${norm2}`);

  // 4. Scheduler Window Calculation Test
  console.log('\n--- 4. Pruebas de Algoritmo de Alertas (10m y 5m) ---');
  const now = new Date();
  // Simulated event in 10 minutes
  const in10m = new Date(now.getTime() + 10 * 60000);
  const event10m = {
    date: in10m.toISOString().split('T')[0],
    time: `${String(in10m.getHours()).padStart(2, '0')}:${String(in10m.getMinutes()).padStart(2, '0')}`
  };
  const parsed10m = parseEventDateTime(event10m);
  const diff10m = calculateMinutesRemaining(parsed10m);
  const is10mInWindow = diff10m >= 8.5 && diff10m <= 10.5;
  assert(is10mInWindow, `Cálculo de ventana 10m en rango válido (${diff10m.toFixed(2)} min restantes)`);

  // Simulated event in 5 minutes
  const in5m = new Date(now.getTime() + 5 * 60000);
  const event5m = {
    date: in5m.toISOString().split('T')[0],
    time: `${String(in5m.getHours()).padStart(2, '0')}:${String(in5m.getMinutes()).padStart(2, '0')}`
  };
  const parsed5m = parseEventDateTime(event5m);
  const diff5m = calculateMinutesRemaining(parsed5m);
  const is5mInWindow = diff5m >= 3.5 && diff5m <= 5.5;
  assert(is5mInWindow, `Cálculo de ventana 5m en rango válido (${diff5m.toFixed(2)} min restantes)`);

  console.log('\n====================================================');
  console.log(`📊 RESULTADOS: ${passed} pasadas, ${failed} fallidas`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Error fatal en pruebas:', err);
  process.exit(1);
});
