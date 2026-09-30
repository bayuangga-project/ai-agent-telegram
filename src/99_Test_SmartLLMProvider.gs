/**
 * TEST SUITE: Smart LLM Provider Cooldown & Blacklist Test
 */
function test_SmartLLMProvider_Blacklist() {
  Logger.log('=== TEST SMART LLM PROVIDER BLACKLIST ===');

  var testModel = 'test/mock-model-429:free';

  // 1. Pastikan status awal tidak blacklisted
  var isBL1 = LLMProviderService._isModelBlacklisted(testModel);
  Logger.log('Status Awal (Harus False): ' + isBL1);

  // 2. Simulasi Blacklist (karena error 429)
  LLMProviderService._blacklistModel(testModel, 'HTTP 429 Rate Limit Mock');

  // 3. Cek apakah status berubah menjadi Blacklisted
  var isBL2 = LLMProviderService._isModelBlacklisted(testModel);
  Logger.log('Status Setelah Blacklist (Harus True): ' + isBL2);

  if (isBL2) {
    Logger.log('✅ PASS: Blacklist Cooldown 30 Menit berfungsi sempurna!');
  } else {
    Logger.log('❌ FAIL: Model gagal di-blacklist');
  }

  // 4. Test fungsi deteksi error
  var check429 = LLMProviderService._shouldBlacklist('OpenRouter Error HTTP 429: Rate limit hit');
  var check402 = LLMProviderService._shouldBlacklist('OpenRouter Error HTTP 402: Insufficient credits');
  var check200 = LLMProviderService._shouldBlacklist('Normal error message');

  Logger.log('Deteksi 429: ' + check429 + ' (Expected: true)');
  Logger.log('Deteksi 402: ' + check402 + ' (Expected: true)');
  Logger.log('Deteksi Normal: ' + check200 + ' (Expected: false)');

  if (check429 && check402 && !check200) {
    Logger.log('✅ PASS: Deteksi jenis error HTTP 402/429 akurat!');
  } else {
    Logger.log('❌ FAIL: Deteksi jenis error salah');
  }
}

/**
 * TEST SUITE: Verifikasi Smart Provider-Aware LLM Dispatching
 */
function test_ProviderAware_LLMDispatch() {
  Logger.log('=== TEST SMART PROVIDER-AWARE LLM ROUTING ===');

  // 1. Refresh Dynamic Ranking Matrix
  LLMIntelligence.rankModels();

  // 2. Ambil model ranked objects
  var rankedObjs = LLMIntelligence.getRankedModelObjectsForTask('chat_light');
  Logger.log('Total Ranked Models untuk chat_light: ' + rankedObjs.length);

  if (rankedObjs.length > 0) {
    Logger.log('Model Peringkat #1: ' + rankedObjs[0].model_id + ' | Provider: ' + rankedObjs[0].provider);
  }

  // 3. Test Eksekusi LLM Provider Service
  var res = LLMProviderService.generate({
    taskType: 'chat_light',
    systemInstruction: 'Jawab 1 kata: "SIAP"',
    messages: [{ role: 'user', text: 'Tes koneksi provider' }],
    temperature: 0.1
  });

  if (res && res.text) {
    Logger.log('\n✅ PASS: Smart Provider-Aware LLM Routing Berhasil!');
    Logger.log('   Provider Terpilih: [' + res.provider + ']');
    Logger.log('   Model Terpilih: ' + res.model);
    Logger.log('   Respon Teks: ' + res.text.trim());
  } else {
    Logger.log('\n❌ FAIL: Seluruh provider gagal merespons.');
  }
}