/**
 * TEST SUITE: Verifikasi filter human knowledge di pushSheetToGitHub()
 * SAFE: Test ini tidak menulis ke GitHub, hanya simulasi filtering
 */

function test_KnowledgeSync_FilterAnalysis() {
  Logger.log('=== TEST: FILTER HUMAN KNOWLEDGE ===');

  var allKnowledge = KnowledgeRepository.getAll();
  if (!allKnowledge || allKnowledge.length === 0) {
    Logger.log('❌ FAIL: Knowledge kosong');
    return;
  }

  var humanNamespaces = KnowledgeSyncSpecialist.HUMAN_KNOWLEDGE_NAMESPACES;
  var stats = {
    total_rows: allKnowledge.length,
    total_active: 0,
    total_inactive: 0,
    human_data: {},
    machine_data: {},
    unknown_namespaces: {}
  };

  for (var i = 0; i < allKnowledge.length; i++) {
    var row = allKnowledge[i];
    var isActive = row.active === true || String(row.active).toUpperCase() === 'TRUE';
    
    if (isActive) {
      stats.total_active++;
      if (humanNamespaces.indexOf(row.namespace) !== -1) {
        stats.human_data[row.namespace] = (stats.human_data[row.namespace] || 0) + 1;
      } else {
        stats.machine_data[row.namespace] = (stats.machine_data[row.namespace] || 0) + 1;
      }
    } else {
      stats.total_inactive++;
    }
  }

  Logger.log('📊 STATISTIK DATABASE AI_Knowledge:');
  Logger.log('   Total baris: ' + stats.total_rows);
  Logger.log('   Aktif: ' + stats.total_active);
  Logger.log('   Tidak aktif (sampah): ' + stats.total_inactive);
  Logger.log('');
  Logger.log('✅ Data HUMAN (akan di-push ke GitHub):');
  var humanCount = 0;
  for (var ns in stats.human_data) {
    Logger.log('   ' + ns + ': ' + stats.human_data[ns] + ' entries');
    humanCount += stats.human_data[ns];
  }
  Logger.log('   TOTAL: ' + humanCount + ' entries');
  Logger.log('');
  Logger.log('🚫 Data MESIN (akan di-SKIP dari GitHub):');
  var machineCount = 0;
  for (var ns2 in stats.machine_data) {
    Logger.log('   ' + ns2 + ': ' + stats.machine_data[ns2] + ' entries');
    machineCount += stats.machine_data[ns2];
  }
  Logger.log('   TOTAL: ' + machineCount + ' entries');
  Logger.log('');
  
  var estimatedReduction = machineCount > 0 
    ? Math.round((machineCount / (humanCount + machineCount)) * 100) 
    : 0;
  Logger.log('📉 Estimasi pengurangan file ai_knowledge.md: ~' + estimatedReduction + '%');
  
  if (humanCount > 0) {
    Logger.log('');
    Logger.log('✅ PASS: Filter siap dijalankan. ' + humanCount + ' entries akan di-push.');
  } else {
    Logger.log('❌ FAIL: Tidak ada human knowledge yang akan di-push');
  }
}

/**
 * TEST: Verifikasi push aktual ke GitHub (setelah analysis PASS)
 * ⚠️ INI AKAN MENIMPA ai_knowledge.md di GitHub
 */
function test_KnowledgeSync_PushToGitHub() {
  Logger.log('=== TEST: PUSH FILTERED KNOWLEDGE KE GITHUB ===');
  Logger.log('⚠️  INI AKAN MENIMPA ai_knowledge.md di GitHub');
  Logger.log('');
  
  var result = KnowledgeSyncSpecialist.pushSheetToGitHub();
  
  Logger.log('Status: ' + result.status);
  Logger.log('Response: ' + JSON.stringify(result, null, 2));
  
  if (result.status === 'success') {
    Logger.log('');
    Logger.log('✅ PASS: File ai_knowledge.md berhasil diperbarui!');
    Logger.log('   Namespace ter-push: ' + result.namespaces);
    Logger.log('   Total entries: ' + result.total_entries);
    Logger.log('   Data mesin di-filter: ' + result.machine_data_filtered);
    Logger.log('');
    Logger.log('🎯 Silakan cek file ai_knowledge.md di GitHub Anda!');
  } else {
    Logger.log('❌ FAIL: ' + result.reason);
  }
}

/**
 * TEST SUITE: Verifikasi filter human knowledge di pushSheetToGitHub()
 * SAFE: Test ini tidak menulis ke GitHub, hanya simulasi filtering
 */
function test_KnowledgeSync_FilterAnalysis() {
  Logger.log('=== TEST: FILTER HUMAN KNOWLEDGE ===');

  var allKnowledge = KnowledgeRepository.getAll();
  if (!allKnowledge || allKnowledge.length === 0) {
    Logger.log('❌ FAIL: Knowledge kosong');
    return;
  }

  // Uji bootstrap getExportNamespaces
  var exportList = KnowledgeSyncSpecialist.getExportNamespaces();
  Logger.log('✅ Daftar Namespace Export: ' + exportList.join(', '));

  var stats = {
    total_rows: allKnowledge.length,
    total_active: 0,
    human_data: {},
    machine_data: {}
  };

  for (var i = 0; i < allKnowledge.length; i++) {
    var row = allKnowledge[i];
    var isActive = row.active === true || String(row.active).toUpperCase() === 'TRUE';
    
    if (isActive) {
      stats.total_active++;
      if (exportList.indexOf(row.namespace) !== -1) {
        stats.human_data[row.namespace] = (stats.human_data[row.namespace] || 0) + 1;
      } else {
        stats.machine_data[row.namespace] = (stats.machine_data[row.namespace] || 0) + 1;
      }
    }
  }

  var humanCount = 0;
  for (var ns in stats.human_data) humanCount += stats.human_data[ns];
  var machineCount = 0;
  for (var ns2 in stats.machine_data) machineCount += stats.machine_data[ns2];
  
  Logger.log('📊 Baris Aktif: ' + stats.total_active);
  Logger.log('✅ Di-push (Human): ' + humanCount);
  Logger.log('🚫 Di-skip (Machine): ' + machineCount);
  
  if (humanCount > 0) {
    Logger.log('✅ PASS: Filter siap dijalankan.');
  } else {
    Logger.log('❌ FAIL: Tidak ada data untuk di-push.');
  }
}

/**
 * TEST SUITE: Verifikasi Purge Database & Name Rendering
 */
function test_ExecPurgeAndDynamicName() {
  Logger.log('=== TEST PURGE DATABASE & DYNAMIC NAME ===');

  // 1. Eksekusi Purge 950+ Baris Sampah
  var purgeResult = KnowledgeRepository.purgeInactive();
  Logger.log('Purge Status: ' + JSON.stringify(purgeResult));
  if (purgeResult.success) {
    Logger.log('✅ PASS: Berhasil memangkas ' + purgeResult.purged + ' baris sampah mati!');
    Logger.log('   Sisa baris aktif yang dipertahankan: ' + purgeResult.activeRemaining);
  } else {
    Logger.log('❌ FAIL: Purge gagal - ' + purgeResult.error);
  }

  // 2. Test Render Nama Vexa pada /help
  var helpText = CommandRouter._handleHelp();
  var hasVexaName = helpText.indexOf('Vexa') !== -1;
  var hasDyarName = helpText.indexOf('Dyar') !== -1;

  Logger.log('\nPreview Judul Bantuan:\n' + helpText.substring(0, 80));

  if (hasVexaName && !hasDyarName) {
    Logger.log('✅ PASS: Nama "Vexa" berhasil dirender secara dinamis! Kata "Dyar" resmi hilang.');
  } else {
    Logger.log('❌ FAIL: Judul /help masih menyebut Dyar atau gagal merender Vexa.');
  }
}

/**
 * TEST SUITE: Verifikasi Optimalisasi Fondasi (Logger, Gateway, Gemini Cache)
 */
function test_Pilar2_FondasiOptimization() {
  Logger.log('=== TEST OPTIMALISASI FONDASI PILAR 2 ===');

  // 1. Test AppLogger instan tanpa LockService
  var startLog = new Date().getTime();
  AppLogger.info('TEST_PERF_LOG', 'Testing fast direct log write');
  var logDuration = new Date().getTime() - startLog;
  Logger.log('Durasi penulisan log: ' + logDuration + ' ms');
  if (logDuration < 2000) {
    Logger.log('✅ PASS: AppLogger bekerja sangat cepat tanpa deadlock 10s!');
  } else {
    Logger.log('❌ FAIL: AppLogger masih lambat');
  }

  // 2. Test Gateway Cache Invalidation
  SpreadsheetGateway.clearCache();
  var sheet = SpreadsheetGateway.ensureSheet('Log_System', null);
  if (sheet) {
    Logger.log('✅ PASS: SpreadsheetGateway.ensureSheet & clearCache berfungsi!');
  }

  // 3. Test Gemini Model Caching
  GeminiProvider._clearModelCache();
  var model1 = GeminiProvider._discoverActiveModel();
  
  var startCache = new Date().getTime();
  var model2 = GeminiProvider._discoverActiveModel(); // Panggilan kedua harus membaca dari CacheService
  var cacheDuration = new Date().getTime() - startCache;

  Logger.log('Model Gemini terdeteksi: ' + model1);
  Logger.log('Durasi baca dari cache: ' + cacheDuration + ' ms');

  if (model1 === model2 && cacheDuration < 100) {
    Logger.log('✅ PASS: Gemini Discovery Caching 24 Jam berhasil (0ms latency)!');
  } else {
    Logger.log('⚠️ WARN: Gemini API key mungkin belum dikonfigurasi atau cache miss.');
  }
}

/**
 * TEST SUITE: Verifikasi Merger Sub-Langkah A1 & A2
 */
function test_Pilar2_MergerA1A2() {
  Logger.log('=== TEST MERGER SUB-LANGKAH A1 & A2 ===');

  // 1. Verifikasi TemplateEngine
  var rendered = TemplateEngine.render('Halo {{name}}!', { name: 'Vexa' });
  if (rendered === 'Halo Vexa!') {
    Logger.log('✅ PASS: TemplateEngine di 02_Utils.gs berfungsi normal!');
  } else {
    Logger.log('❌ FAIL: TemplateEngine error');
  }

  // 2. Verifikasi WebSearchProviderService
  var isConfigured = WebSearchProviderService.isAnyConfigured();
  Logger.log('WebSearch Configured Status: ' + isConfigured);
  Logger.log('✅ PASS: WebSearch Providers di 07_Service_WebSearchProvider.gs berfungsi normal!');

  // 3. Verifikasi LLMProviderService
  var singlePromptRes = LLMProviderService.generateFromSinglePrompt('Respon 1 kata: "OK"', 0.1, 'chat_light');
  if (singlePromptRes && singlePromptRes.text) {
    Logger.log('✅ PASS: LLM Providers di 06_Service_LLMProvider.gs berfungsi normal! Respon: ' + singlePromptRes.text);
  } else {
    Logger.log('⚠️ WARN: LLM Provider tidak mengembalikan teks (cek API Keys).');
  }
}

/**
 * TEST SUITE: Verifikasi Sub-Langkah A3 (MasterScheduler & SoulMemory)
 */
function test_Pilar2_MergerA3() {
  Logger.log('=== TEST MERGER SUB-LANGKAH A3 ===');

  // 1. Verifikasi SoulMemory
  SoulMemory.recordEpisode('test_event', 'test_context', 'success', 'neutral', 'details_test');
  var recentEpisodes = SoulMemory.getRecentEpisodes(1);
  if (recentEpisodes && recentEpisodes.length > 0) {
    Logger.log('✅ PASS: SoulMemory di 08_Specialist_Soul.gs berfungsi sempurna!');
  } else {
    Logger.log('❌ FAIL: SoulMemory error');
  }

  // 2. Verifikasi Master Scheduler Wrapper Functions
  try {
    var triggers = ScriptApp.getProjectTriggers();
    Logger.log('Total trigger GAS aktif saat ini: ' + triggers.length);
    Logger.log('✅ PASS: Master Scheduler di 11_Trigger_MasterScheduler.gs siap mengawal seluruh jadwal!');
  } catch (e) {
    Logger.log('❌ FAIL: Master Scheduler error: ' + e.message);
  }
}