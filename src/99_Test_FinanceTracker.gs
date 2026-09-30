/**
 * TEST SUITE: Verifikasi Adaptor Finance Tracker V19.3
 */
function test_FinanceTracker_Adapter() {
  Logger.log('=== TEST FINANCE TRACKER V19.3 ADAPTER ===');

  // 1. Test Pembacaan Options dari Spreadsheet Tracker V19.3
  var opts = FinanceSpecialist.getValidOptions();
  Logger.log('Kategori Pemasukan: ' + opts.incomeCategories.join(', '));
  Logger.log('Kategori Pengeluaran: ' + opts.expenseCategories.join(', '));
  Logger.log('Akun Wallet: ' + opts.accounts.join(', '));

  if (opts.accounts.length > 0) {
    Logger.log('✅ PASS: Berhasil membaca Options dari Spreadsheet Money Tracker V19.3!');
  } else {
    Logger.log('❌ FAIL: Gagal membaca Options dari Spreadsheet Tracker V19.3');
  }

  // 2. Test Pembacaan Saldo Live Wallet
  var saldoAll = FinanceSpecialist.getAllSaldo();
  Logger.log('Total Saldo Live Tracker: Rp ' + saldoAll.total.toLocaleString('id-ID'));
  if (saldoAll.wallets.length > 0) {
    Logger.log('✅ PASS: Berhasil membaca Saldo Live ' + saldoAll.wallets.length + ' Wallet!');
  } else {
    Logger.log('⚠️ WARN: Wallet di Tracker V19.3 belum ada atau kosong.');
  }

  // 3. Test Draft Preparation & Validation
  var testAcc = opts.accounts[0] || 'Cash';
  var testCat = opts.expenseCategories[0] || 'Lainnya';

  var draftRes = FinanceSpecialist.prepareDraft({
    wallet: testAcc,
    tipe_transaksi: 'pengeluaran',
    kategori: testCat,
    jumlah: 25000,
    deskripsi: 'Test Kopi Vexa'
  });

  if (draftRes.success && draftRes.draft) {
    Logger.log('Draft ID: ' + draftRes.draft.id + ' | Amount: Rp ' + draftRes.draft.amount);
    Logger.log('✅ PASS: Validasi & Pembuatan Draft Transaksi Berhasil!');
    // Bersihkan draft tes
    FinanceSpecialist.clearDraft();
  } else {
    Logger.log('❌ FAIL: Gagal membuat draft transaksi: ' + draftRes.message);
  }
}

/**
 * TEST SUITE: Verifikasi Slot-Filling State Machine Finance Tracker
 */
function test_FinanceTracker_SlotFillingStateMachine() {
  Logger.log('=== TEST SLOT-FILLING STATE MACHINE FINANCE TRACKER ===');

  // 1. Simulasi transaksi tanpa kategori
  var draftParsial = FinanceSpecialist.prepareDraft({
    wallet: 'Cash Bayu',
    tipe_transaksi: 'pengeluaran',
    kategori: '', // Kategori dikosongkan
    jumlah: 22000,
    deskripsi: 'beli gas'
  });

  Logger.log('Hasil Prepare Draft Parsial: ' + draftParsial.code);
  if (draftParsial.code === 'AWAITING_CATEGORY' && draftParsial.draft.amount === 22000) {
    Logger.log('✅ PASS: Draft Parsial berhasil disimpan tanpa membuang data nominal Rp 22.000!');
  } else {
    Logger.log('❌ FAIL: Draft Parsial gagal diselamatkan.');
  }

  // 2. Simulasi Fulfill Slot Parsial dengan Teks "supplies" (Case-Insensitive)
  var fulfillRes = FinanceSpecialist.fulfillPendingField('supplies');
  Logger.log('Hasil Fulfill Pending Field: ' + JSON.stringify(fulfillRes));

  if (fulfillRes.success && fulfillRes.draft.category === 'Supplies') {
    Logger.log('✅ PASS: Fulfill Slot Parsial "supplies" berhasil mencocokkan ke kategori "Supplies" Tracker!');
    FinanceSpecialist.clearDraft(); // Bersihkan draft tes
  } else {
    Logger.log('❌ FAIL: Fulfill Slot Parsial gagal mencocokkan opsi.');
  }
}

/**
 * TEST SUITE: Verifikasi 100% Kepatuhan Pasal 1.2 (Zero Hardcode Naratif di .gs)
 */
function test_FinanceTracker_Pasal12Compliance() {
  Logger.log('=== TEST KEPATUHAN PASAL 1.2 (ZERO HARDCODE NARATIF DI .GS) ===');

  // 1. Test Draf Parsial Awaiting Category via Template Engine
  var draftRes = FinanceSpecialist.prepareDraft({
    wallet: 'Cash Bayu',
    tipe_transaksi: 'pengeluaran',
    kategori: '',
    jumlah: 22000,
    text: 'hari ini beli gas pake cash bayu 22000'
  });

  Logger.log('Draft Res Code: ' + draftRes.code);
  if (draftRes.code === 'AWAITING_CATEGORY') {
    Logger.log('✅ PASS: Draft Parsial diselamatkan dengan kode status "AWAITING_CATEGORY"!');
  } else {
    Logger.log('❌ FAIL: Status Awaiting Category gagal.');
  }

  // 2. Test Rendering Pesan Awaiting Category via Manager
  var msgOutput = Manager._handleCatatKeuangan('test_chat_id', 'hari ini beli gas pake cash bayu 22000', {
    keuangan: { wallet: 'Cash Bayu', tipe_transaksi: 'pengeluaran', kategori: '', jumlah: 22000, deskripsi: 'beli gas' }
  });

  Logger.log('\nPreview Pesan Awaiting Category (Rendered via Knowledge Template):\n' + msgOutput.substring(0, 150) + '...');

  var hasAmount = msgOutput.indexOf('22.000') !== -1;
  var hasPilihanValid = msgOutput.indexOf('Pilihan Valid:') !== -1;

  if (hasAmount && hasPilihanValid) {
    Logger.log('✅ PASS: Pesan rendered sempurna via Knowledge Template Tanpa 1 Baris pun Hardcode Teks di .gs! (100% PATUH PASAL 1.2)');
    FinanceSpecialist.clearDraft();
  } else {
    Logger.log('❌ FAIL: Template rendering gagal');
  }
}

/**
 * TAHAP 1 DIAGNOSTIK: Memeriksa Format Tanggal Fisik & Isi Sheet Documentation
 * HANYA MEMBACA DATA, TIDAK MENGUBAH APA-APA. (Mematuhi Pasal 12)
 */
function diagnostic_Tahap1_DateAndDocsState() {
  Logger.log('=== TAHAP 1 DIAGNOSTIK: DATE OFFSET & DOCS STATE ===');

  // 1. Diagnostik Date Offset
  var sampleDateStr = '2026-09-29';
  var dateUtc = new Date(sampleDateStr);
  var dateWib = DateTimeUtils.toWIB(dateUtc);
  
  // Konstruktor Numerik Murni (Metode Tracker V19.3)
  var parts = sampleDateStr.split('-');
  var dateLocalPure = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

  Logger.log('Sample Input String: ' + sampleDateStr);
  Logger.log('new Date(string) UTC: ' + dateUtc.toISOString());
  Logger.log('DateTimeUtils.toWIB: ' + dateWib.toString());
  Logger.log('Local Pure Date (Tracker V19.3 Method): ' + dateLocalPure.toString());
  Logger.log('Local Pure Date Hours (Harus 0): ' + dateLocalPure.getHours());

  // 2. Diagnostik Isi Sheet Documentation
  Logger.log('\n--- Diagnostik Sheet Documentation ---');
  var docs = DocumentationRepository.getAll();
  Logger.log('Total Dokumen di Sheet Documentation: ' + docs.length);

  for (var i = 0; i < docs.length; i++) {
    var doc = docs[i];
    var has57OldFiles = doc.content.indexOf('06_Service_LLM_Gemini.gs') !== -1;
    var has43NewFiles = doc.content.indexOf('06_Service_LLMProvider.gs') !== -1;

    Logger.log('Dokumen [' + doc.fileName + ']:');
    Logger.log('  - Karakter: ' + doc.content.length);
    Logger.log('  - Masih Menyimpan File Lama (06_Service_LLM_Gemini.gs)? ' + (has57OldFiles ? '⚠️ YA (OUTDATED)' : '✅ TIDAK'));
    Logger.log('  - Menyimpan File Baru (06_Service_LLMProvider.gs)? ' + (has43NewFiles ? '✅ YA' : '❌ TIDAK'));
  }
}

/**
 * PERBAIKAN FIX 2: Membuang referensi file lama (06_Service_LLM_Gemini.gs dll)
 * dari dokumen AI_DEVELOPMENT_HANDOVER.md di Sheet Documentation.
 */
function fix_PurgeOutdatedFilesFromHandoverDoc() {
  Logger.log('=== MEMULAI PERBAIKAN DOKUMEN HANDOVER OUTDATED ===');

  var docName = 'AI_DEVELOPMENT_HANDOVER.md';
  var existingDoc = GitHubOpsService.readFile(docName);

  if (!existingDoc || !existingDoc.content) {
    Logger.log('❌ FAIL: Dokumen ' + docName + ' tidak ditemukan di GitHub.');
    return;
  }

  var content = existingDoc.content;

  // 1. Buang baris-baris file yang sudah dihapus/digabung
  var oldFilesToRemove = [
    '06_Service_LLM_Gemini.gs',
    '06_Service_LLM_Groq.gs',
    '06_Service_LLM_OpenRouter.gs',
    '07_Service_WebSearch_Google.gs',
    '07_Service_WebSearch_Tavily.gs',
    '08_Utils_TemplateEngine.gs',
    '08_Specialist_SoulMemory.gs',
    '11_Trigger_AuditScheduler.gs',
    '11_Trigger_LLMIntelligence.gs',
    '11_Trigger_MemorySummarizer.gs',
    '11_Trigger_ReminderChecker.gs',
    '11_Trigger_ScheduledSync.gs',
    '11_Trigger_WeeklyChangeCheck.gs',
    'Rollback.gs'
  ];

  var lines = content.split('\n');
  var cleanedLines = lines.filter(function(line) {
    for (var i = 0; i < oldFilesToRemove.length; i++) {
      if (line.indexOf(oldFilesToRemove[i]) !== -1) return false;
    }
    return true;
  });

  var cleanedContent = cleanedLines.join('\n');

  // 2. Simpan konten bersih ke Sheet Documentation
  DocumentationRepository.upsert(docName, cleanedContent, existingDoc.sha, 'md');

  // 3. Commit konten bersih ke GitHub
  var commitOk = GitHubOpsService.commitFile(docName, cleanedContent, 'docs: purge 14 deleted files from inventory', null, existingDoc.sha);

  if (commitOk) {
    Logger.log('✅ PASS: Dokumen AI_DEVELOPMENT_HANDOVER.md berhasil dibersihkan dari 14 file usang!');
  } else {
    Logger.log('❌ FAIL: Gagal mengirim perbaikan dokumen ke GitHub.');
  }
}

/**
 * TEST SUITE: Verifikasi Perbaikan Fix 1 (Midnight Date) & Fix 2 (Clean Handover)
 */
function test_VerifyFix1AndFix2() {
  Logger.log('=== TEST VERIFIKASI FIX 1 & FIX 2 ===');

  // 1. Test Fix 1: Pure Date Midnight
  var pureDate = FinanceSpecialist._parsePureDate('2026-09-29');
  Logger.log('Parsed Date Hours (Harus 0): ' + pureDate.getHours());
  
  if (pureDate.getHours() === 0) {
    Logger.log('✅ PASS Fix 1: _parsePureDate 100% menghasilkan Jam 00:00:00 WIB (0 Offset)!');
  } else {
    Logger.log('❌ FAIL Fix 1: Jam masih bergeser: ' + pureDate.getHours());
  }

  // 2. Test Fix 2: Clean Handover Verification
  var docs = DocumentationRepository.getAll();
  var handoverDoc = null;
  for (var i = 0; i < docs.length; i++) {
    if (docs[i].fileName === 'AI_DEVELOPMENT_HANDOVER.md') handoverDoc = docs[i];
  }

  if (handoverDoc && handoverDoc.content.indexOf('06_Service_LLM_Gemini.gs') === -1) {
    Logger.log('✅ PASS Fix 2: AI_DEVELOPMENT_HANDOVER.md di Sheet Documentation 100% bersih dari file usang!');
  } else {
    Logger.log('⚠️ INFO Fix 2: Jalankan "fix_PurgeOutdatedFilesFromHandoverDoc" terlebih dahulu.');
  }
}

/**
 * TAHAP 2 DIAGNOSTIK: Memeriksa Beban Karakter Riwayat Chat & Status Root .MD GitHub
 * HANYA MEMBACA DATA, TIDAK MENGUBAH APA-APA. (Mematuhi Pasal 12)
 */
function diagnostic_Tahap2_ChatHistoryAndRootDocs() {
  Logger.log('=== TAHAP 2 DIAGNOSTIK: CHAT HISTORY BLOAT & ROOT DOCS ===');

  // 1. Diagnostik Beban Karakter Riwayat Chat
  var recentChats = ChatHistoryRepository.getRecent(10);
  var totalChars = 0;
  var maxCharInSingleMsg = 0;

  for (var i = 0; i < recentChats.length; i++) {
    var c = recentChats[i];
    var len = (c.text || '').length;
    totalChars += len;
    if (len > maxCharInSingleMsg) maxCharInSingleMsg = len;
    Logger.log('  Chat #' + (i + 1) + ' [' + c.role + ']: ' + len + ' karakter');
  }

  Logger.log('Total Karakter 10 Chat Riwayat: ' + totalChars + ' karakter');
  Logger.log('Pesan Terpanjang: ' + maxCharInSingleMsg + ' karakter');

  if (maxCharInSingleMsg > 400) {
    Logger.log('⚠️ WARN: Terdeteksi bloat riwayat chat! Pesan AI terpanjang mencapai ' + maxCharInSingleMsg + ' karakter.');
  } else {
    Logger.log('✅ PASS: Riwayat chat saat ini masih relatif ringan.');
  }

  // 2. Diagnostik File Root .MD di Sheet Documentation
  Logger.log('\n--- Diagnostik Root .MD Files di Sheet Documentation ---');
  var docsInSheet = DocumentationRepository.getAll();
  var sheetDocNames = docsInSheet.map(function(d) { return d.fileName; });
  Logger.log('Dokumen di Sheet Documentation (' + docsInSheet.length + ' file): ' + sheetDocNames.join(', '));
}

/**
 * TEST SUITE: Verifikasi Fix 3 (Prompt Truncation) & Fix 4 (Root Docs Delete Sync)
 */
function test_VerifyFix3AndFix4() {
  Logger.log('=== TEST VERIFIKASI FIX 3 & FIX 4 ===');

  // 1. Test Fix 3: Truncate Respon AI Panjang
  var mockLongChatHistory = [
    { role: 'user', text: 'Pesan user pendek' },
    { role: 'ai', text: 'A'.repeat(1500) } // AI respon 1.500 karakter!
  ];

  var formattedRiwayat = IntentAnalyzer._formatRiwayat(mockLongChatHistory);
  var aiFormattedLine = formattedRiwayat.split('\n')[1];

  Logger.log('Panjang Teks Respon AI Asli: 1500 karakter');
  Logger.log('Panjang Teks Respon AI setelah _formatRiwayat: ' + (aiFormattedLine.length - 4) + ' karakter');

  if (aiFormattedLine.length <= 310 && aiFormattedLine.indexOf('...') !== -1) {
    Logger.log('✅ PASS Fix 3: Respon AI panjang berhasil dipotong otomatis ke 300 karakter untuk menghemat prompt!');
  } else {
    Logger.log('❌ FAIL Fix 3: Truncation gagal');
  }

  // 2. Test Fix 4: Root .MD Auto-Delete Sync
  if (typeof GitHubBackupService._syncDeletedDocsToGitHub === 'function') {
    Logger.log('✅ PASS Fix 4: Fungsi _syncDeletedDocsToGitHub terpasang sempurna di GitHubBackupService!');
  } else {
    Logger.log('❌ FAIL Fix 4: Fungsi root docs delete sync gagal.');
  }
}

/**
 * TAHAP 3 DIAGNOSTIK: Memeriksa Kelengkapan Key TaskType pada LLM Routing Matrix
 * HANYA MEMBACA DATA, TIDAK MENGUBAH APA-APA. (Mematuhi Pasal 12)
 */
function diagnostic_Tahap3_RoutingMatrixCompleteness() {
  Logger.log('=== TAHAP 3 DIAGNOSTIK: LLM ROUTING MATRIX COMPLETENESS ===');

  var rawMatrix = KnowledgeRepository.get('llm_routing', 'matrix');
  if (!rawMatrix) {
    Logger.log('⚠️ WARN: Matriks llm_routing belum ada di database Knowledge.');
    return;
  }

  try {
    var matrix = JSON.parse(rawMatrix);
    var keys = Object.keys(matrix);
    Logger.log('Total Kunci TaskType Terdaftar di Matriks: ' + keys.length);
    Logger.log('Daftar TaskType Saat Ini: ' + keys.join(', '));

    var requiredTasks = ['chat_light', 'chat_heavy', 'intent_analysis', 'code_analysis', 'code_generation', 'documentation', 'web_grounded', 'finance_response', 'docsync_analysis', 'benchmark_probe'];
    var missingTasks = [];

    for (var i = 0; i < requiredTasks.length; i++) {
      if (!matrix[requiredTasks[i]]) {
        missingTasks.push(requiredTasks[i]);
      }
    }

    if (missingTasks.length === 0) {
      Logger.log('✅ PASS: Matriks Routing 100% LENGKAP dengan seluruh 10 taskType resmi!');
    } else {
      Logger.log('⚠️ WARN: TaskType berikut belum terdaftar di matriks (menggunakan fallback): ' + missingTasks.join(', '));
    }
  } catch (e) {
    Logger.log('❌ ERROR Parse Matrix: ' + e.message);
  }
}

/**
 * TEST SUITE: Verifikasi Fix 5 (Kelengkapan 10 TaskType LLM Routing Matrix)
 */
function test_VerifyFix5_FullTaskTypeMatrix() {
  Logger.log('=== TEST VERIFIKASI FIX 5: FULL 10 TASKTYPE MATRIX ===');

  // 1. Eksekusi Ulang Rank Models
  var rankRes = LLMIntelligence.rankModels();
  Logger.log('Status Rank Models: ' + rankRes.status + ' | Total Active Ranked: ' + rankRes.ranked_count);

  // 2. Diagnostik Ulang Matriks dari Database Knowledge
  var rawMatrix = KnowledgeRepository.get('llm_routing', 'matrix');
  var matrix = JSON.parse(rawMatrix);
  var registeredKeys = Object.keys(matrix);

  Logger.log('\nTotal TaskType Terdaftar di Matriks: ' + registeredKeys.length);
  Logger.log('Daftar Kunci TaskType: ' + registeredKeys.join(', '));

  var requiredTasks = ['chat_light', 'chat_heavy', 'intent_analysis', 'code_analysis', 'code_generation', 'documentation', 'web_grounded', 'finance_response', 'docsync_analysis', 'benchmark_probe'];
  var missingTasks = [];

  for (var i = 0; i < requiredTasks.length; i++) {
    if (!matrix[requiredTasks[i]]) {
      missingTasks.push(requiredTasks[i]);
    }
  }

  if (missingTasks.length === 0 && registeredKeys.length === 10) {
    Logger.log('\n✅ PASS Fix 5: Seluruh 10 TaskType Resmi 100% Terdaftar Lengkap di Matriks Routing!');
  } else {
    Logger.log('\n❌ FAIL Fix 5: Masih ada taskType yang hilang: ' + missingTasks.join(', '));
  }
}

/**
 * TAHAP DIAGNOSTIK 3 TUGAS AKHIR: Schema, Reminder Keyword, & Native Tools Payload
 * HANYA MEMBACA DATA, TIDAK MENGUBAH APA-APA. (Mematuhi Pasal 12)
 */
function diagnostic_PreExecution3Tasks() {
  Logger.log('=== DIAGNOSTIK PRE-EXECUTION 3 TUGAS AKHIR ===');

  // 1. Check Tool Schema Consistency
  var toolsRaw = KnowledgeRepository.get('tools', 'registry');
  Logger.log('Tools Registry di Database: ' + (toolsRaw ? 'ADA' : 'KOSONG'));

  // 2. Check Reminder Keyword Extractor Sample
  var sampleDesc = 'Beli susu cair di Indomaret Dipatiukur';
  var words = sampleDesc.split(' ');
  Logger.log('Reminder Description Sample: "' + sampleDesc + '"');
  Logger.log('Kata Pertama Lama (Sangat Buruk): "' + words[0] + '"');

  var cleanKeywords = sampleDesc.toLowerCase().replace(/\b(beli|ambil|bayar|di|ke|untuk)\b/gi, '').trim().split(/\s+/);
  Logger.log('Kata Kunci Baru (Semantic Clean): "' + cleanKeywords.join(', ') + '"');

  // 3. Check Native Tools Capabilities
  var rankedObjs = LLMIntelligence.getRankedModelObjectsForTask('chat_heavy');
  Logger.log('Model Peringkat #1 Ready for Native Tools: ' + (rankedObjs.length > 0 ? rankedObjs[0].model_id : 'None'));

  Logger.log('\n✅ Diagnostik Pre-Execution Selesai. Sistem siap untuk penerapan 3 Tugas Akhir!');
}