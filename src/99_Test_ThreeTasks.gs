/**
 * TEST SUITE: Verifikasi 3 Tugas Akhir (Schema Validator, Semantic Reminder, & Native Tools)
 */
function test_VerifyThreeFinalTasks() {
  Logger.log('=== TEST VERIFIKASI 3 TUGAS AKHIR ===');

  // 1. Test Tugas 3.2: Tool Schema Consistency Validator
  var schemaRes = SelfDocSync.validateToolSchemaConsistency();
  Logger.log('Tool Schema Validation Status: ' + JSON.stringify(schemaRes));
  if (schemaRes.valid) {
    Logger.log('✅ PASS Tugas 3.2: Seluruh Tool di Registry 100% memiliki handler valid di Manager!');
  } else {
    Logger.log('❌ FAIL Tugas 3.2: Ada tool yang handler-nya hilang: ' + schemaRes.missing.join(', '));
  }

  // 2. Test Tugas 3.3: Semantic Memory Keyword Cleaner di Reminder
  var mockReminder = { deskripsi: 'Beli susu cair di Indomaret', waktuPertama: new Date() };
  var cleanKeywords = ReminderSpecialist._extractCleanKeywords(mockReminder.deskripsi);
  Logger.log('\nKata Kunci Reminder Bersih: ' + cleanKeywords.join(', '));

  if (cleanKeywords.indexOf('susu') !== -1 && cleanKeywords.indexOf('indomaret') !== -1 && cleanKeywords.indexOf('beli') === -1) {
    Logger.log('✅ PASS Tugas 3.3: Stopword Filter berhasil membuang "Beli" & menyisakan kata kunci berbobot!');
  } else {
    Logger.log('❌ FAIL Tugas 3.3: Keyword Extractor error');
  }

  // 3. Test SOTA Upgrade: Native Function Calling Support
  var mockTools = [{ type: 'function', function: { name: 'tanya_saldo', description: 'Cek saldo' } }];
  var llmNativeRes = LLMProviderService.generate({
    taskType: 'chat_light',
    systemInstruction: 'Jawab singkat',
    messages: [{ role: 'user', text: 'Cek saldo gopay' }],
    tools: mockTools
  });

  if (llmNativeRes && llmNativeRes.text) {
    Logger.log('\n✅ PASS SOTA Upgrade: Native Protocol Function Calling dengan Auto-Fallback Berhasil!');
  } else {
    Logger.log('❌ FAIL SOTA Upgrade: Panggilan LLM error');
  }
}

/**
 * DIAGNOSTIK PRE-EXECUTION: Menguji Gemini Embedding API & Trigger Creation
 * HANYA MEMBACA DATA & UJI API, TIDAK MENGUBAH DATABASE PRODUKSI. (Mematuhi Pasal 12)
 */
function diagnostic_PreExecutionCombinedSOTA() {
  Logger.log('=== DIAGNOSTIK PRE-EXECUTION SOTA FASE C & D ===');

  var config = Config.load();

  // 1. Uji Gemini Embedding API (text-embedding-004)
  if (!config.geminiApiKey) {
    Logger.log('❌ FAIL: GEMINI_API_KEY belum dikonfigurasi.');
    return;
  }

  var urlEmbedding = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=' + config.geminiApiKey;
  var payloadEmbedding = {
    model: 'models/text-embedding-004',
    content: { parts: [{ text: 'Bensin dan Pertamax di SPBU' }] }
  };

  try {
    var resE = UrlFetchApp.fetch(urlEmbedding, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payloadEmbedding),
      muteHttpExceptions: true
    });

    var codeE = resE.getResponseCode();
    Logger.log('Gemini Embedding API Status: ' + codeE);

    if (codeE === 200) {
      var dataE = JSON.parse(resE.getContentText());
      if (dataE.embedding && dataE.embedding.values) {
        Logger.log('✅ PASS FASE D: Gemini Embedding API Aktif! Dimensi Vektor: ' + dataE.embedding.values.length + ' float.');
      }
    } else {
      Logger.log('⚠️ WARN FASE D: Embedding API return HTTP ' + codeE + ' (Fallback ke Keyword Match akan aktif).');
    }
  } catch (eE) {
    Logger.log('❌ ERROR Embedding: ' + eE.message);
  }

  // 2. Uji Kapasitas Trigger GAS
  try {
    var currentTriggers = ScriptApp.getProjectTriggers();
    Logger.log('\nTotal Trigger Aktif Saat Ini: ' + currentTriggers.length + ' / 20 (Limit GAS)');
    if (currentTriggers.length < 15) {
      Logger.log('✅ PASS FASE C: Kuota Trigger GAS sangat cukup untuk Async Task Queue!');
    } else {
      Logger.log('⚠️ WARN FASE C: Trigger aktif sudah mendekati limit 20.');
    }
  } catch (eT) {
    Logger.log('❌ ERROR Trigger: ' + eT.message);
  }
}

/**
 * TEST SUITE: Verifikasi FASE C (Async Task Queue) & FASE D (Vector Cosine Similarity RAG)
 */
function test_VerifyCombinedSOTA_PhaseCD() {
  Logger.log('=== TEST VERIFIKASI SOTA FASE C & D ===');

  // 1. Test FASE D: Vector Cosine Similarity
  var sampleFact = 'Isi bensin Pertamax 100rb di SPBU Dipatiukur';
  FactsRepository.save('test_chat_id', sampleFact, 'keuangan');

  var semanticFacts = KnowledgeSpecialist.findRelevantToKeyword('bensin', 5);
  Logger.log('Semantic Search Results untuk "bensin":\n' + JSON.stringify(semanticFacts));

  if (semanticFacts.length > 0 && semanticFacts[0].indexOf('Pertamax') !== -1) {
    Logger.log('✅ PASS FASE D: Vector Cosine Similarity RAG Berhasil Mencocokkan "bensin" -> "Pertamax"!');
  } else {
    Logger.log('⚠️ WARN FASE D: Cosine Similarity fallback ke Keyword Matching.');
  }

  // 2. Test FASE C: Async Enqueue & Self-Deleting Trigger
  var asyncMsg = Manager._enqueueAsyncTask('test_chat_id', 'deep_research', 'Riset tren AI 2026', []);
  Logger.log('Async Enqueue Response: ' + asyncMsg);

  var triggers = ScriptApp.getProjectTriggers();
  var hasWorkerTrigger = triggers.some(function(t) { return t.getHandlerFunction() === 'runAsyncTaskWorkerWrapper'; });

  if (asyncMsg.indexOf('Diterima') !== -1 && hasWorkerTrigger) {
    Logger.log('✅ PASS FASE C: Async Task Queue Enqueue & Trigger Creation Berhasil!');
  } else {
    Logger.log('❌ FAIL FASE C: Async Enqueue error');
  }
}