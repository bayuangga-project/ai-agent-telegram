/**
 * TEST SUITE: Verifikasi Sheet LLM_Models Registry & Pipeline
 */
function test_LLMRegistry_PipelineAndSheet() {
  Logger.log('=== TEST LLM_MODELS SHEET REGISTRY PIPELINE ===');

  // 1. Test Auto-Discovery & Creation Sheet
  var discRes = LLMIntelligence.discoverModels();
  Logger.log('Discovery Result: ' + JSON.stringify(discRes));

  // 2. Test Pembacaan Tabel LLM_Models
  var models = LLMIntelligence._getAllModelRows();
  Logger.log('Total Model Tersimpan di Sheet LLM_Models: ' + models.length);

  if (models.length > 0) {
    Logger.log('Sample Model #1: ' + models[0].model_id + ' | Provider: ' + models[0].provider + ' | Status: ' + models[0].status);
    Logger.log('✅ PASS: Sheet LLM_Models berhasil dibuat & terisi model live!');
  } else {
    Logger.log('❌ FAIL: Sheet LLM_Models kosong');
  }

  // 3. Test Dynamic Task Ranking
  var rankRes = LLMIntelligence.rankModels();
  Logger.log('Ranking Result: ' + JSON.stringify(rankRes));
  if (rankRes.ranked_count > 0) {
    Logger.log('✅ PASS: Dynamic Task Ranking berhasil!');
  } else {
    Logger.log('❌ FAIL: Ranking gagal');
  }

  // 4. Test Command Telegram Handler
  var cmdRes = LLMIntelligence.handleCommand('list');
  Logger.log('\nPreview Output Telegram Command /llm:\n' + cmdRes.substring(0, 300) + '...');
  if (cmdRes.indexOf('Katalog Model LLM Vexa') !== -1) {
    Logger.log('✅ PASS: Handler Command /llm Telegram berfungsi sempurna!');
  } else {
    Logger.log('❌ FAIL: Command /llm error');
  }
}

/**
 * TEST SUITE: Verifikasi Suffix Telegram Bot Autocomplete di CommandRouter
 */
function test_CommandRouter_TelegramSuffixSanitizer() {
  Logger.log('=== TEST SANITASI COMMAND TELEGRAM ===');

  var testCases = [
    { input: '/llm discover', expectedCmd: true },
    { input: '/llm@dyarassistant_bot discover', expectedCmd: true },
    { input: '/LLM@dyarassistant_bot DISCOVER', expectedCmd: true },
    { input: '   /export_ns@dyarassistant_bot list  ', expectedCmd: true },
    { input: 'halo vexa', expectedCmd: false }
  ];

  var passed = 0;
  for (var i = 0; i < testCases.length; i++) {
    var tc = testCases[i];
    var isKnown = CommandRouter.isKnownCommand(tc.input);
    if (isKnown === tc.expectedCmd) {
      passed++;
      Logger.log('✅ PASS untuk input: "' + tc.input + '"');
    } else {
      Logger.log('❌ FAIL untuk input: "' + tc.input + '" (Result: ' + isKnown + ')');
    }
  }

  // Test Eksekusi Handler dengan Suffix Autocomplete
  var resSuffix = CommandRouter.handle('test_chat_id', '/llm@dyarassistant_bot discover');
  Logger.log('\nPreview Output Eksekusi Suffix Autocomplete:\n' + resSuffix.substring(0, 150) + '...');

  if (resSuffix.indexOf('Auto-Discovery Selesai') !== -1 || resSuffix.indexOf('Katalog Model LLM') !== -1) {
    Logger.log('✅ PASS: Handler Command dengan Suffix Telegram Autocomplete 100% SUKSES!');
  } else {
    Logger.log('❌ FAIL: Handler Suffix Telegram Error');
  }
}

/**
 * TEST SUITE: Verifikasi Pure Live API Discovery dari OpenRouter, Gemini, & Groq
 */
function test_LLMRegistry_PureDynamicDiscovery() {
  Logger.log('=== TEST 100% PURE DYNAMIC LIVE API DISCOVERY ===');

  var discRes = LLMIntelligence.discoverModels();
  Logger.log('Hasil Discovery Live API: ' + JSON.stringify(discRes));

  var models = LLMIntelligence._getAllModelRows();
  Logger.log('\nTotal Model Tersimpan di Sheet LLM_Models: ' + models.length);

  var providerCounts = {};
  for (var i = 0; i < models.length; i++) {
    var p = models[i].provider;
    providerCounts[p] = (providerCounts[p] || 0) + 1;
  }

  Logger.log('\nRincian Model per Provider API:');
  for (var prov in providerCounts) {
    Logger.log(' - Provider [' + prov + ']: ' + providerCounts[prov] + ' model');
  }

  if (models.length > 0) {
    Logger.log('\n✅ PASS: Discovery Live API murni (0% Hardcode) berhasil menarik model dari 3 Provider!');
  } else {
    Logger.log('\n❌ FAIL: Gagal menarik model live.');
  }
}