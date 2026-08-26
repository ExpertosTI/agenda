const db = require('../server/db');
const emailService = require('../server/services/emailService');
const whatsappService = require('../server/services/whatsappService');
const insforgeService = require('../server/services/insforgeService');
const { calculateMinutesRemaining, parseEventDateTime } = require('../server/services/schedulerService');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 EJECUTANDO SUITE DE PRUEBAS ULTRA-MODERNA');
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
  console.log('\n--- 1. Multi-Tenant & Perfiles ---');
  const tenants = db.getTenants();
  assert(tenants.length >= 3, `Tenants encontrados: ${tenants.length}`);
  
  const altamarTenant = db.getTenantById('altamar');
  assert(altamarTenant && altamarTenant.name.includes('Altamar'), 'Tenant "Altamar" identificado correctamente');

  // 2. Events, Subtasks & Search Tests
  console.log('\n--- 2. Búsqueda, Subtareas & Posponer ---');
  const events = db.getEvents();
  assert(events.length >= 6, `Eventos base: ${events.length}`);

  const searchResults = db.getEvents(null, null, 'Peluquería');
  assert(searchResults.length >= 1, `Búsqueda por palabra clave: ${searchResults.length} coincidencia(s)`);

  const firstEvent = events[0];
  if (firstEvent && firstEvent.subtasks && firstEvent.subtasks.length > 0) {
    const subId = firstEvent.subtasks[0].id;
    const initialStatus = firstEvent.subtasks[0].completed;
    const updatedEvt = db.toggleSubtask(firstEvent.id, subId);
    assert(updatedEvt && updatedEvt.subtasks[0].completed === !initialStatus, 'Toggle de subtarea interactiva exitoso');
    // revert
    db.toggleSubtask(firstEvent.id, subId);
  }

  // 3. Analytics Test
  console.log('\n--- 3. Módulo de Analítica & Rendimiento ---');
  const stats = db.getAnalytics();
  assert(stats && typeof stats.total === 'number' && typeof stats.completionRate === 'number', `Estadísticas calculadas (Total: ${stats.total}, Éxito: ${stats.completionRate}%)`);

  // 4. Insforge DB Sync Test
  console.log('\n--- 4. Sincronización Insforge DB ---');
  const insforgeStatus = await insforgeService.getStatus();
  assert(insforgeStatus !== null, `Estado Insforge: ${insforgeStatus.status}`);

  // 5. Hostinger SMTP Test
  console.log('\n--- 5. Conexión Hostinger SMTP SSL ---');
  const smtpResult = await emailService.verifyConnection();
  assert(smtpResult.success === true, 'Conexión SMTP exitosa (smtp.hostinger.com:465)');

  // 6. WhatsApp Phone Normalization Test
  console.log('\n--- 6. Normalización Evolution API ---');
  const norm = whatsappService.normalizePhone('809-348-7921');
  assert(norm === '18093487921', `Formato telefónico RD: 809-348-7921 -> ${norm}`);

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
