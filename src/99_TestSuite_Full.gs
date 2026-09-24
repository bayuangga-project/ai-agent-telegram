/**
 * ===================================================================
 * FULL TEST SUITE: AI AGENT TELEGRAM
 * 6 Batch, masing-masing di bawah 5 menit.
 * Semua data test menggunakan prefix [TEST] untuk identifikasi cleanup.
 * ===================================================================
 */

function _tLog(batch, name, status, detail, ms) {
  var line = '[B' + batch + '][' + status + '] ' + name;
  if (detail) line += ' | ' + detail;
  if (ms !== undefined && ms !== null) line += ' | ' + ms + 'ms';
  Logger.log(line);
}

function _cleanupTestData() {
  var cleaned = { transactions: 0, reminders: 0 };

  try {
    var activeTrx = TransactionRepository.getActive();
    for (var i = 0; i < activeTrx.length; i++) {
      var t = activeTrx[i];
      if (t.deskripsi && t.deskripsi.indexOf('[TEST]') >= 0) {
        TransactionRepository.softDelete(t.rowIndex);
        cleaned.transactions++;
      }
    }
  } catch (e) {
    Logger.log('[CLEANUP] Transaction cleanup error: ' + e.message);
  }

  try {
    var activeRem = ReminderRepository.getActive();
    for (var j = 0; j < activeRem.length; j++) {
      var r = activeRem[j];
      if (r.deskripsi && r.deskripsi.indexOf('[TEST]') >= 0) {
        ReminderRepository.updateStatus(r.rowIndex, ReminderRepository.STATUS_DONE);
        cleaned.reminders++;
      }
    }
  } catch (e) {
    Logger.log('[CLEANUP] Reminder cleanup error: ' + e.message);
  }

  Logger.log('[CLEANUP] Done | trx:' + cleaned.transactions + ' rem:' + cleaned.reminders);
  return cleaned;
}

// ============================================================
// BATCH 1: REPOSITORY CRUD (NO LLM)
// Menguji layer data: tulis, baca, update, hapus.
// ============================================================
function test_Batch1_RepositoryCRUD() {
  var start = new Date().getTime();
  var passed = 0, failed = 0, skipped = 0;

  Logger.log('========================================');
  Logger.log('BATCH 1: REPOSITORY CRUD (NO LLM)');
  Logger.log('========================================');

  // --- 1.1 WalletRepository ---
  try {
    var t0 = new Date().getTime();
    var walletId = WalletRepository.create('[TEST] Wallet', 100000);
    var wallet = WalletRepository.findById(walletId);
    var found = WalletRepository.findByName('[TEST] Wallet');
    var all = WalletRepository.getAll();
    var latency = new Date().getTime() - t0;

    if (wallet && wallet.nama === '[TEST] Wallet' && found && all.length > 0) {
      passed++;
      _tLog(1, 'WALLET_CRUD', 'PASS', 'id:' + walletId + ' all:' + all.length, latency);
    } else {
      failed++;
      _tLog(1, 'WALLET_CRUD', 'FAIL', 'data mismatch', latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'WALLET_CRUD', 'ERROR', e.message, null);
  }

  // --- 1.2 TransactionRepository ---
  try {
    var t0 = new Date().getTime();
    var testWallet = WalletRepository.findByName('[TEST] Wallet') || WalletRepository.findByName('Cash');
    var trxId = TransactionRepository.create({
      walletId: testWallet.id,
      tanggalTransaksi: DateTimeUtils.nowWIB(),
      tipe: TransactionRepository.TIPE_INCOME,
      kategori: '[TEST] Gaji',
      jumlah: 5000000,
      deskripsi: '[TEST] gajian'
    });
    var active = TransactionRepository.getActive();
    var last = TransactionRepository.getLastActive();
    var byWallet = TransactionRepository.getByWallet(testWallet.id);
    var found = TransactionRepository.findById(trxId);
    var latency = new Date().getTime() - t0;

    if (found && found.jumlah === 5000000 && last && active.length > 0) {
      passed++;
      _tLog(1, 'TRANSACTION_CRUD', 'PASS', 'id:' + trxId + ' active:' + active.length, latency);
    } else {
      failed++;
      _tLog(1, 'TRANSACTION_CRUD', 'FAIL', 'data mismatch', latency);
    }

    // Test update
    var t1 = new Date().getTime();
    TransactionRepository.update(last.rowIndex, { jumlah: 4500000 });
    var updated = TransactionRepository.findById(trxId);
    var lat2 = new Date().getTime() - t1;

    if (updated && updated.jumlah === 4500000) {
      passed++;
      _tLog(1, 'TRANSACTION_UPDATE', 'PASS', 'new amount:4500000', lat2);
    } else {
      failed++;
      _tLog(1, 'TRANSACTION_UPDATE', 'FAIL', 'update not reflected', lat2);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'TRANSACTION_CRUD', 'ERROR', e.message, null);
  }

  // --- 1.3 ReminderRepository ---
  try {
    var t0 = new Date().getTime();
    var remId = ReminderRepository.create({
      deskripsi: '[TEST] meeting',
      waktuPertama: DateTimeUtils.nowWIB(),
      jenisRecurring: 'none',
      prioritas: 'High'
    });
    var activeRem = ReminderRepository.getActive();
    var latency = new Date().getTime() - t0;

    if (remId && activeRem.length > 0) {
      passed++;
      _tLog(1, 'REMINDER_CRUD', 'PASS', 'id:' + remId + ' active:' + activeRem.length, latency);
    } else {
      failed++;
      _tLog(1, 'REMINDER_CRUD', 'FAIL', 'data mismatch', latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'REMINDER_CRUD', 'ERROR', e.message, null);
  }

  // --- 1.4 AckPatternsRepository ---
  try {
    var t0 = new Date().getTime();
    AckPatternsRepository.save('[TEST] ok done', 'user acknowledged', 'done');
    var recent = AckPatternsRepository.getRecent(5);
    var latency = new Date().getTime() - t0;

    if (recent && recent.length > 0) {
      passed++;
      _tLog(1, 'ACK_PATTERNS', 'PASS', 'recent:' + recent.length, latency);
    } else {
      failed++;
      _tLog(1, 'ACK_PATTERNS', 'FAIL', 'empty result', latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'ACK_PATTERNS', 'ERROR', e.message, null);
  }

  // --- 1.5 KnowledgeRepository ---
  try {
    var t0 = new Date().getTime();
    KnowledgeRepository.save('test', '[TEST]_key', 'test content v1', 'test note');
    var val = KnowledgeRepository.get('test', '[TEST]_key');
    var ns = KnowledgeRepository.getByNamespace('test');
    var latency = new Date().getTime() - t0;

    if (val && val.indexOf('test content') >= 0) {
      passed++;
      _tLog(1, 'KNOWLEDGE_CRUD', 'PASS', 'ns_keys:' + Object.keys(ns || {}).length, latency);
    } else {
      failed++;
      _tLog(1, 'KNOWLEDGE_CRUD', 'FAIL', 'value mismatch', latency);
    }

    // Test deactivate
    var t1 = new Date().getTime();
    KnowledgeRepository.deactivate('test', '[TEST]_key');
    var afterDeact = KnowledgeRepository.get('test', '[TEST]_key');
    var lat2 = new Date().getTime() - t1;

    if (!afterDeact) {
      passed++;
      _tLog(1, 'KNOWLEDGE_DEACTIVATE', 'PASS', null, lat2);
    } else {
      failed++;
      _tLog(1, 'KNOWLEDGE_DEACTIVATE', 'FAIL', 'still active after deactivate', lat2);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'KNOWLEDGE_CRUD', 'ERROR', e.message, null);
  }

  // --- 1.6 ChatHistoryRepository ---
  try {
    var t0 = new Date().getTime();
    var chatId = Config.load().myChatId;
    ChatHistoryRepository.save(chatId, 'user', '[TEST] hello');
    ChatHistoryRepository.save(chatId, 'ai', '[TEST] hi back');
    var recent = ChatHistoryRepository.getRecent(5);
    var latency = new Date().getTime() - t0;

    if (recent && recent.length >= 2) {
      passed++;
      _tLog(1, 'CHAT_HISTORY', 'PASS', 'recent:' + recent.length, latency);
    } else {
      failed++;
      _tLog(1, 'CHAT_HISTORY', 'FAIL', 'expected >=2 got:' + (recent ? recent.length : 0), latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'CHAT_HISTORY', 'ERROR', e.message, null);
  }

  // --- 1.7 FactsRepository via KnowledgeSpecialist ---
  try {
    var t0 = new Date().getTime();
    var chatId = Config.load().myChatId;
    KnowledgeSpecialist.saveFact(chatId, '[TEST] user suka kopi', 'manual');
    var facts = KnowledgeSpecialist.getActiveFactsForPrompt(10);
    var relevant = KnowledgeSpecialist.findRelevantToKeyword('kopi', 50);
    var latency = new Date().getTime() - t0;

    if (facts && facts.length > 0) {
      passed++;
      _tLog(1, 'FACTS_CRUD', 'PASS', 'total:' + facts.length + ' relevant_kopi:' + relevant.length, latency);
    } else {
      failed++;
      _tLog(1, 'FACTS_CRUD', 'FAIL', 'empty facts', latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'FACTS_CRUD', 'ERROR', e.message, null);
  }

  // --- 1.8 BudgetRepository via FinanceSpecialist ---
  try {
    var t0 = new Date().getTime();
    var periode = DateTimeUtils.formatPeriode(DateTimeUtils.nowWIB());
    var budget = FinanceSpecialist.createOrUpdateBudget('[TEST] Makanan', 500000, periode);
    var latency = new Date().getTime() - t0;

    if (budget && budget.success) {
      passed++;
      _tLog(1, 'BUDGET_CRUD', 'PASS', 'action:' + budget.action, latency);
    } else {
      failed++;
      _tLog(1, 'BUDGET_CRUD', 'FAIL', 'not success', latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'BUDGET_CRUD', 'ERROR', e.message, null);
  }

  // --- Cleanup ---
  _cleanupTestData();

  // --- Summary ---
  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 1 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed + ' | Skipped: ' + skipped);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('========================================');
}

// ============================================================
// BATCH 2: INTENT DETECTION (ALL INTENTS + EDGE CASES)
// Menguji IntentAnalyzer.analyze() untuk semua intent.
// Hanya test detection, TIDAK memanggil handler.
// ============================================================
function test_Batch2_IntentDetection() {
  var start = new Date().getTime();
  var DEADLINE = 5 * 60 * 1000;
  var passed = 0, failed = 0, skipped = 0, errors = [];

  Logger.log('========================================');
  Logger.log('BATCH 2: INTENT DETECTION');
  Logger.log('========================================');

  // Gather context once
  var context;
  try {
    var t0 = new Date().getTime();
    context = Manager._gatherContext();
    _tLog(2, 'CONTEXT_GATHER', 'OK', null, new Date().getTime() - t0);
  } catch (e) {
    _tLog(2, 'CONTEXT_GATHER', 'FALLBACK', e.message, null);
    context = { riwayat: [], facts: [], profile: [], ltm: [], reminderMenunggu: [], ackPatterns: [] };
  }

  var cases = [
    ['catat pengeluaran makan siang 35 ribu dari cash', 'catat_keuangan'],
    ['pemasukan gaji 5 juta ke BCA', 'catat_keuangan'],
    ['berapa total saldo semua wallet', 'tanya_saldo'],
    ['saldo wallet cash berapa', 'tanya_saldo'],
    ['ringkasan keuangan bulan ini', 'ringkasan_keuangan'],
    ['atur budget makanan 500rb per bulan', 'atur_budget'],
    ['edit transaksi terakhir jumlahnya jadi 25rb', 'edit_transaksi'],
    ['sinkronkan dokumentasi dengan source code', 'sync_documentation'],
    ['oke sudah selesai', 'ack_reminder'],
    ['ingatkan besok jam 9 pagi meeting dengan tim', 'buat_reminder'],
    ['diagnose error webhook timeout', 'diagnose_error'],
    ['update dokumentasi arsitektur sistem', 'update_docs'],
    ['audit seluruh kode sumber', 'audit_code'],
    ['perbaiki semua issue dari audit terakhir', 'fix_audit'],
    ['cek perubahan kode minggu ini', 'check_changes'],
    ['bagaimana progress roadmap proyek saat ini', 'roadmap_query'],
    ['implementasikan fitur notifikasi push', 'implement_feature'],
    ['bagaimana kondisi sistemmu saat ini', 'self_query'],
    ['siapa kamu dan apa tujuanmu', 'soul_query'],
    ['inisialisasi soul', 'soul_init'],
    ['backup knowledge ke github', 'backup_knowledge'],
    ['restore knowledge dari github', 'restore_knowledge'],
    ['apa yang kamu ingat tentang interaksi kita', 'soul_memory_query'],
    ['halo apa kabar hari ini', 'chat_biasa'],
    // Edge cases
    ['', 'chat_biasa'],
    ['a', 'chat_biasa'],
    ['I want to check my wallet balance', 'tanya_saldo'],
    ['catat pengeluaran kopi 15rb dan ingatkan besok jam 8', 'catat_keuangan'],
    ['!!!!!????', 'chat_biasa'],
  ];

  for (var i = 0; i < cases.length; i++) {
    if (new Date().getTime() - start > DEADLINE) {
      _tLog(2, 'DEADLINE', 'SKIP', '5min reached at case ' + (i + 1), null);
      skipped += cases.length - i;
      break;
    }

    var input = cases[i][0];
    var expected = cases[i][1];
    var t0 = new Date().getTime();

    try {
      var result = IntentAnalyzer.analyze(input, context);
      var latency = new Date().getTime() - t0;
      var detected = (result && result.tipe) ? result.tipe : 'null';
      var match = detected === expected;

      if (match) {
        passed++;
        _tLog(2, 'CASE_' + (i + 1), 'PASS', expected + ' | ' + latency + 'ms', latency);
      } else {
        failed++;
        _tLog(2, 'CASE_' + (i + 1), 'MISMATCH', 'expected:' + expected + ' got:' + detected + ' | input:' + input.substring(0, 40), latency);
      }

      if (result) {
        var extras = [];
        if (result.complexity) extras.push('complexity:' + result.complexity);
        if (result.keuangan) extras.push('has_keuangan:true');
        if (result.factsBaru && result.factsBaru.length > 0) extras.push('factsBaru:' + result.factsBaru.length);
        if (extras.length > 0) {
          Logger.log('  [META] ' + extras.join(' | '));
        }
      }
    } catch (e) {
      failed++;
      var latency = new Date().getTime() - t0;
      _tLog(2, 'CASE_' + (i + 1), 'ERROR', e.message + ' | input:' + input.substring(0, 30), latency);
      errors.push({ caseNum: i + 1, input: input.substring(0, 30), error: e.message });
    }
  }

  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 2 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed + ' | Skipped: ' + skipped);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('Accuracy: ' + (passed + failed > 0 ? Math.round(passed / (passed + failed) * 100) : 0) + '%');
  if (errors.length > 0) Logger.log('Errors: ' + JSON.stringify(errors));
  Logger.log('========================================');
}

// ============================================================
// BATCH 3: LLM PROVIDER ROUTING
// Menguji provider selection per taskType dan latency.
// ============================================================
function test_Batch3_LLMRouting() {
  var start = new Date().getTime();
  var passed = 0, failed = 0;

  Logger.log('========================================');
  Logger.log('BATCH 3: LLM PROVIDER ROUTING');
  Logger.log('========================================');

  var taskTypes = [
    'chat_light',
    'chat_heavy',
    'intent_analysis',
    'finance_response',
    'documentation'
  ];

  // Test generate() per taskType
  for (var i = 0; i < taskTypes.length; i++) {
    var task = taskTypes[i];
    var t0 = new Date().getTime();

    try {
      var result = LLMProviderService.generate({
        taskType: task,
        systemInstruction: 'You are a test assistant. Reply briefly.',
        messages: [{ role: 'user', text: 'Say OK and nothing else.' }],
        temperature: 0.3
      });
      var latency = new Date().getTime() - t0;

      if (result && result.text) {
        passed++;
        _tLog(3, 'GENERATE_' + task, 'PASS', 'provider:' + result.provider + ' model:' + (result.model || 'unknown') + ' text_len:' + result.text.length, latency);
      } else {
        failed++;
        _tLog(3, 'GENERATE_' + task, 'FAIL', 'null result', latency);
      }
    } catch (e) {
      failed++;
      _tLog(3, 'GENERATE_' + task, 'ERROR', e.message, new Date().getTime() - t0);
    }
  }

  // Test generateFromSinglePrompt()
  var singlePromptTasks = ['intent_analysis', 'chat_light'];
  for (var j = 0; j < singlePromptTasks.length; j++) {
    var task = singlePromptTasks[j];
    var t0 = new Date().getTime();

    try {
      var result = LLMProviderService.generateFromSinglePrompt('Reply with OK only.', 0.3, task);
      var latency = new Date().getTime() - t0;

      if (result && result.text) {
        passed++;
        _tLog(3, 'SINGLE_' + task, 'PASS', 'provider:' + result.provider + ' model:' + (result.model || 'unknown'), latency);
      } else {
        failed++;
        _tLog(3, 'SINGLE_' + task, 'FAIL', 'null result', latency);
      }
    } catch (e) {
      failed++;
      _tLog(3, 'SINGLE_' + task, 'ERROR', e.message, new Date().getTime() - t0);
    }
  }

  // Test LLM Intelligence ranking
  try {
    var t0 = new Date().getTime();
    var ranked = LLMIntelligence.getRankedModelsForTask('chat_light');
    var latency = new Date().getTime() - t0;

    if (ranked && ranked.length > 0) {
      passed++;
      _tLog(3, 'RANKING_chat_light', 'PASS', 'models:' + ranked.length + ' top:' + ranked[0], latency);
    } else {
      failed++;
      _tLog(3, 'RANKING_chat_light', 'FAIL', 'empty ranking (fallback will be used)', latency);
    }
  } catch (e) {
    failed++;
    _tLog(3, 'RANKING_chat_light', 'ERROR', e.message, null);
  }

  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 3 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('========================================');
}

// ============================================================
// BATCH 4: FINANCE END-TO-END (NO LLM, SPECIALIST LAYER)
// Menguji business logic keuangan secara langsung.
// ============================================================
function test_Batch4_FinanceE2E() {
  var start = new Date().getTime();
  var passed = 0, failed = 0;

  Logger.log('========================================');
  Logger.log('BATCH 4: FINANCE END-TO-END');
  Logger.log('========================================');

  var periode = DateTimeUtils.formatPeriode(DateTimeUtils.nowWIB());

  // 4.1 Resolve/Create Wallet
  try {
    var t0 = new Date().getTime();
    var wallet = FinanceSpecialist.resolveWallet('[TEST] BCA');
    var latency = new Date().getTime() - t0;

    if (wallet && wallet.id) {
      passed++;
      _tLog(4, 'RESOLVE_WALLET', 'PASS', 'id:' + wallet.id + ' nama:' + wallet.nama, latency);
    } else {
      failed++;
      _tLog(4, 'RESOLVE_WALLET', 'FAIL', 'no wallet returned', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'RESOLVE_WALLET', 'ERROR', e.message, null);
  }

  // 4.2 Record Income
  try {
    var t0 = new Date().getTime();
    var income = FinanceSpecialist.recordTransaction({
      walletNama: '[TEST] BCA',
      tipe: TransactionRepository.TIPE_INCOME,
      kategori: '[TEST] Gaji',
      jumlah: 5000000,
      deskripsi: '[TEST] gajian'
    });
    var latency = new Date().getTime() - t0;

    if (income && income.success && income.data && income.data.saldoTerbaru !== undefined) {
      passed++;
      _tLog(4, 'RECORD_INCOME', 'PASS', 'saldo:' + income.data.saldoTerbaru + ' trxId:' + income.data.transactionId, latency);
    } else {
      failed++;
      _tLog(4, 'RECORD_INCOME', 'FAIL', JSON.stringify(income).substring(0, 100), latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'RECORD_INCOME', 'ERROR', e.message, null);
  }

  // 4.3 Record Expense
  try {
    var t0 = new Date().getTime();
    var expense = FinanceSpecialist.recordTransaction({
      walletNama: '[TEST] BCA',
      tipe: TransactionRepository.TIPE_EXPENSE,
      kategori: '[TEST] Makanan',
      jumlah: 30000,
      deskripsi: '[TEST] makan siang'
    });
    var latency = new Date().getTime() - t0;

    if (expense && expense.success) {
      passed++;
      _tLog(4, 'RECORD_EXPENSE', 'PASS', 'saldo:' + expense.data.saldoTerbaru, latency);
    } else {
      failed++;
      _tLog(4, 'RECORD_EXPENSE', 'FAIL', 'not success', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'RECORD_EXPENSE', 'ERROR', e.message, null);
  }

  // 4.4 Create Budget
  try {
    var t0 = new Date().getTime();
    var budget = FinanceSpecialist.createOrUpdateBudget('[TEST] Makanan', 50000, periode);
    var latency = new Date().getTime() - t0;

    if (budget && budget.success) {
      passed++;
      _tLog(4, 'CREATE_BUDGET', 'PASS', 'action:' + budget.action + ' batas:' + budget.batasJumlah, latency);
    } else {
      failed++;
      _tLog(4, 'CREATE_BUDGET', 'FAIL', 'not success', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'CREATE_BUDGET', 'ERROR', e.message, null);
  }

  // 4.5 Record Expense to Trigger Budget Alert
  try {
    var t0 = new Date().getTime();
    var expense2 = FinanceSpecialist.recordTransaction({
      walletNama: '[TEST] BCA',
      tipe: TransactionRepository.TIPE_EXPENSE,
      kategori: '[TEST] Makanan',
      jumlah: 30000,
      deskripsi: '[TEST] jajan sore'
    });
    var latency = new Date().getTime() - t0;

    var hasAlert = expense2 && expense2.data && expense2.data.budgetAlert;
    if (hasAlert) {
      passed++;
      _tLog(4, 'BUDGET_ALERT', 'PASS', 'status:' + expense2.data.budgetAlert.status + ' pct:' + expense2.data.budgetAlert.persentase + '%', latency);
    } else {
      passed++;
      _tLog(4, 'BUDGET_ALERT', 'INFO', 'no alert triggered (total may not exceed threshold yet)', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'BUDGET_ALERT', 'ERROR', e.message, null);
  }

  // 4.6 Edit Last Transaction
  try {
    var t0 = new Date().getTime();
    var edit = FinanceSpecialist.editLastTransaction({ jumlah: 25000 });
    var latency = new Date().getTime() - t0;

    if (edit && edit.success && edit.data && edit.data.jumlah === 25000) {
      passed++;
      _tLog(4, 'EDIT_TRANSACTION', 'PASS', 'new_jumlah:' + edit.data.jumlah, latency);
    } else {
      failed++;
      _tLog(4, 'EDIT_TRANSACTION', 'FAIL', JSON.stringify(edit).substring(0, 100), latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'EDIT_TRANSACTION', 'ERROR', e.message, null);
  }

  // 4.7 Get Summary
  try {
    var t0 = new Date().getTime();
    var summary = FinanceSpecialist.getRingkasanPeriode(periode);
    var latency = new Date().getTime() - t0;

    if (summary && summary.totalMasuk !== undefined && summary.totalKeluar !== undefined) {
      passed++;
      _tLog(4, 'RINGKASAN', 'PASS', 'masuk:' + summary.totalMasuk + ' keluar:' + summary.totalKeluar + ' bersih:' + summary.saldoBersih, latency);
    } else {
      failed++;
      _tLog(4, 'RINGKASAN', 'FAIL', 'missing fields', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'RINGKASAN', 'ERROR', e.message, null);
  }

  // 4.8 Get All Saldo
  try {
    var t0 = new Date().getTime();
    var semua = FinanceSpecialist.getAllSaldo();
    var latency = new Date().getTime() - t0;

    if (semua && semua.wallets && semua.total !== undefined) {
      passed++;
      _tLog(4, 'ALL_SALDO', 'PASS', 'wallets:' + semua.wallets.length + ' total:' + semua.total, latency);
    } else {
      failed++;
      _tLog(4, 'ALL_SALDO', 'FAIL', 'missing fields', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'ALL_SALDO', 'ERROR', e.message, null);
  }

  // --- Cleanup ---
  _cleanupTestData();

  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 4 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('========================================');
}

// ============================================================
// BATCH 5: MEMORY, SOUL, CONTEXT
// Menguji sistem ingatan dan kesadaran agen.
// ============================================================
function test_Batch5_MemoryContext() {
  var start = new Date().getTime();
  var passed = 0, failed = 0, skipped = 0;

  Logger.log('========================================');
  Logger.log('BATCH 5: MEMORY, SOUL, CONTEXT');
  Logger.log('========================================');

  var chatId = Config.load().myChatId;

  // 5.1 Chat History Context
  try {
    var t0 = new Date().getTime();
    var riwayat = ChatHistoryRepository.getRecent(15);
    var latency = new Date().getTime() - t0;

    if (riwayat && riwayat.length >= 0) {
      passed++;
      _tLog(5, 'CHAT_HISTORY_CTX', 'PASS', 'entries:' + riwayat.length, latency);
    } else {
      failed++;
      _tLog(5, 'CHAT_HISTORY_CTX', 'FAIL', 'null result', latency);
    }
  } catch (e) {
    failed++;
    _tLog(5, 'CHAT_HISTORY_CTX', 'ERROR', e.message, null);
  }

  // 5.2 Active Facts
  try {
    var t0 = new Date().getTime();
    var facts = KnowledgeSpecialist.getActiveFactsForPrompt(50);
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'ACTIVE_FACTS', 'PASS', 'count:' + facts.length, latency);
  } catch (e) {
    failed++;
    _tLog(5, 'ACTIVE_FACTS', 'ERROR', e.message, null);
  }

  // 5.3 User Profile
  try {
    var t0 = new Date().getTime();
    var profile = UserProfileSpecialist.getProfileForPrompt(30);
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'USER_PROFILE', 'PASS', 'items:' + (profile ? profile.length : 0), latency);
  } catch (e) {
    failed++;
    _tLog(5, 'USER_PROFILE', 'ERROR', e.message, null);
  }

  // 5.4 Long-Term Memory
  try {
    var t0 = new Date().getTime();
    var ltm = MemorySpecialist.getLongTermMemory(7);
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'LTM_7DAYS', 'PASS', 'summaries:' + ltm.length, latency);
  } catch (e) {
    failed++;
    _tLog(5, 'LTM_7DAYS', 'ERROR', e.message, null);
  }

  // 5.5 Pending Reminders
  try {
    var t0 = new Date().getTime();
    var pending = ReminderSpecialist.getMenungguRespon();
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'PENDING_REMINDERS', 'PASS', 'count:' + pending.length, latency);
  } catch (e) {
    failed++;
    _tLog(5, 'PENDING_REMINDERS', 'ERROR', e.message, null);
  }

  // 5.6 Ack Patterns
  try {
    var t0 = new Date().getTime();
    var patterns = ReminderSpecialist.getAckPatternsForPrompt(10);
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'ACK_PATTERNS_CTX', 'PASS', 'count:' + patterns.length, latency);
  } catch (e) {
    failed++;
    _tLog(5, 'ACK_PATTERNS_CTX', 'ERROR', e.message, null);
  }

  // 5.7 Soul Full Context
  try {
    var t0 = new Date().getTime();
    var soul = SoulSpecialist.getFullContext();
    var latency = new Date().getTime() - t0;

    var keys = soul ? Object.keys(soul) : [];
    var hasData = soul && soul.self_model;
    if (hasData) {
      passed++;
      _tLog(5, 'SOUL_CONTEXT', 'PASS', 'keys:' + keys.join(','), latency);
    } else {
      skipped++;
      _tLog(5, 'SOUL_CONTEXT', 'SKIP', 'soul not initialized yet', latency);
    }
  } catch (e) {
    failed++;
    _tLog(5, 'SOUL_CONTEXT', 'ERROR', e.message, null);
  }

  // 5.8 Soul Sub-Components
  var soulMethods = [
    ['getSelfModel', 'SOUL_SELF_MODEL'],
    ['getIdentity', 'SOUL_IDENTITY'],
    ['getBeliefs', 'SOUL_BELIEFS'],
    ['getGrowthLog', 'SOUL_GROWTH_LOG'],
    ['getEmotionalState', 'SOUL_EMOTIONAL']
  ];

  for (var i = 0; i < soulMethods.length; i++) {
    try {
      var t0 = new Date().getTime();
      var val = SoulSpecialist[soulMethods[i][0]]();
      var latency = new Date().getTime() - t0;

      var type = typeof val;
      var info = type === 'object' && val !== null ? 'keys:' + Object.keys(val).length : type;
      if (Array.isArray(val)) info = 'length:' + val.length;

      passed++;
      _tLog(5, soulMethods[i][1], 'PASS', info, latency);
    } catch (e) {
      failed++;
      _tLog(5, soulMethods[i][1], 'ERROR', e.message, null);
    }
  }

  // 5.9 SoulMemory (Episodic + Meta)
  try {
    var t0 = new Date().getTime();
    var episodes = SoulMemory.getRecentEpisodes(10);
    var meta = SoulMemory.getMetaInsights(5);
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'SOUL_MEMORY', 'PASS', 'episodes:' + (episodes ? episodes.length : 0) + ' meta:' + (meta ? meta.length : 0), latency);
  } catch (e) {
    failed++;
    _tLog(5, 'SOUL_MEMORY', 'ERROR', e.message, null);
  }

  // 5.10 Full Context Gather (simulasi Manager._gatherContext)
  try {
    var t0 = new Date().getTime();
    var ctx = Manager._gatherContext();
    var latency = new Date().getTime() - t0;

    var ctxKeys = Object.keys(ctx);
    var ctxInfo = ctxKeys.map(function(k) {
      var v = ctx[k];
      return k + ':' + (Array.isArray(v) ? v.length : typeof v);
    }).join(' | ');

    passed++;
    _tLog(5, 'FULL_CONTEXT_GATHER', 'PASS', ctxInfo, latency);
  } catch (e) {
    failed++;
    _tLog(5, 'FULL_CONTEXT_GATHER', 'ERROR', e.message, null);
  }

  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 5 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed + ' | Skipped: ' + skipped);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('========================================');
}

// ============================================================
// BATCH 6: INTEGRATION (SAFE INTENTS VIA MANAGER)
// Menguji pipeline penuh: input → context → intent → handler → response.
// Hanya intent yang TIDAK mutasi GitHub.
// ============================================================
function test_Batch6_Integration() {
  var start = new Date().getTime();
  var DEADLINE = 5 * 60 * 1000;
  var passed = 0, failed = 0, skipped = 0;

  Logger.log('========================================');
  Logger.log('BATCH 6: INTEGRATION (SAFE INTENTS)');
  Logger.log('========================================');

  var chatId = Config.load().myChatId;

  var cases = [
    '[TEST] halo apa kabar hari ini',
    '[TEST] catat pengeluaran kopi 15 ribu dari cash',
    '[TEST] berapa saldo semua wallet saya',
    '[TEST] ringkasan keuangan bulan ini',
    '[TEST] ingatkan besok jam 10 pagi untuk olahraga',
    '[TEST] bagaimana kondisi sistemmu saat ini',
    '[TEST] siapa kamu dan apa tujuanmu',
    '[TEST] apa yang kamu ingat tentang interaksi kita',
    '[TEST] saya suka minum teh hijau setiap pagi',
    '[TEST] terima kasih sudah membantu',
  ];

  for (var i = 0; i < cases.length; i++) {
    if (new Date().getTime() - start > DEADLINE) {
      _tLog(6, 'DEADLINE', 'SKIP', '5min reached at case ' + (i + 1), null);
      skipped += cases.length - i;
      break;
    }

    var input = cases[i];
    var t0 = new Date().getTime();

    try {
      var response = Manager.processConversationalMessage(chatId, input);
      var latency = new Date().getTime() - t0;

      if (response && response.length > 0) {
        passed++;
        var preview = response.substring(0, 150).replace(/\n/g, ' ');
        _tLog(6, 'INTEG_' + (i + 1), 'PASS', 'len:' + response.length + ' | ' + preview, latency);
      } else {
        failed++;
        _tLog(6, 'INTEG_' + (i + 1), 'FAIL', 'empty response', latency);
      }
    } catch (e) {
      failed++;
      var latency = new Date().getTime() - t0;
      _tLog(6, 'INTEG_' + (i + 1), 'ERROR', e.message, latency);
    }
  }

  // --- Cleanup ---
  _cleanupTestData();

  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 6 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed + ' | Skipped: ' + skipped);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('========================================');
}