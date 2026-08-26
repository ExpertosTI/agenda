const db = require('../server/db');
const emailService = require('../server/services/emailService');
const whatsappService = require('../server/services/whatsappService');
const insforgeService = require('../server/services/insforgeService');
const { calculateMinutesRemaining, parseEventDateTime } = require('../server/services/schedulerService');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 EJECUTANDO SUITE DE PRUEBAS MULTI-TENANT & INSFORGE');
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

  // 1. Multi-Tenant DB Tests
  console.log('\n--- 1. Pruebas de Multi-Tenant & Persistencia ---');
  const tenants = db.getTenants();
  assert(tenants.length >= 3, `Se encontraron ${tenants.length} tenants (mínimo 3: RENACE, Altamar, Personal)`);
  
  const altamarTenant = db.getTenantById('altamar');
  assert(altamarTenant && altamarTenant.name.includes('Altamar'), 'Tenant "Altamar" identificado correctamente');

  const events = db.getEvents();
  assert(events.length >= 6, `Se cargaron ${events.length} eventos iniciales`);
  
  const altamarEvents = db.getEvents(null, 'altamar');
  assert(altamarEvents.length >= 1, `Filtro por tenant funciona: ${altamarEvents.length} eventos para Altamar`);

  // 2. Insforge Service Test
  console.log('\n--- 2. Pruebas de Integración Insforge DB ---');
  const insforgeStatus = await insforgeService.getStatus();
  assert(insforgeStatus !== null, `Estado de Insforge obtenido: ${insforgeStatus.status}`);

  // 3. SMTP & Multi-Tenant Email Test
  console.log('\n--- 3. Pruebas de Hostinger SMTP Multi-Tenant ---');
  const smtpResult = await emailService.verifyConnection();
  assert(smtpResult.success === true, 'Conexión SMTP con Hostinger exitosa (smtp.hostinger.com:465)');

  // 4. WhatsApp Phone Normalization Test
  console.log('\n--- 4. Pruebas de Formato WhatsApp Evolution API ---');
  const norm1 = whatsappService.normalizePhone('809-348-7921');
  assert(norm1 === '18093487921', `Normalización Dominicana: 809-348-7921 -> ${norm1}`);

  // 5. Scheduler Window Calculation Test
  console.log('\n--- 5. Pruebas de Algoritmo de Alertas (10m y 5m) ---');
  const now = new Date();
  const in10m = new Date(now.getTime() + 10 * 60000);
  const event10m = {
    date: in10m.toISOString().split('T')[0],
    time: `${String(in10m.getHours()).padStart(2, '0')}:${String(in10m.getMinutes()).padStart(2, '0')}`
  };
  const parsed10m = parseEventDateTime(event10m);
  const diff10m = calculateMinutesRemaining(parsed10m);
  const is10mInWindow = diff10m >= 8.5 && diff10m <= 10.5;
  assert(is10mInWindow, `Cálculo de ventana 10m en rango válido (${diff10m.toFixed(2)} min restantes)`);

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
