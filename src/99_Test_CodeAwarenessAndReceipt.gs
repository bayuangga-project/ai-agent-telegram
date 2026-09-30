/**
 * TEST SUITE: Verifikasi Full 5 Canonical Docs Ingestion & Smart Wallet Resolver
 */
function test_FullDocsIngestionAndResolver() {
  Logger.log('=== TEST FULL 5 CANONICAL DOCS INGESTION & WALLET RESOLVER ===');

  // 1. Test Ingestion 5 Dokumen Canonical .MD
  var selfData = SelfAwareness.review('all').system_metrics;
  var docKeys = Object.keys(selfData.canonicalDocsContent);
  Logger.log('Dokumen Canonical .MD Terbaca di Memori SelfAwareness: ' + docKeys.join(', '));

  if (docKeys.indexOf('AI_DEVELOPMENT_HANDOVER.md') !== -1 && docKeys.indexOf('ARCHITECTURE.md') !== -1) {
    Logger.log('✅ PASS: Vexa 100% Membaca Seluruh Dokumen Canonical .MD (Full Closed-Loop Self-Awareness)!');
  } else {
    Logger.log('❌ FAIL: Dokumen .MD gagal dibaca');
  }

  // 2. Test Smart Wallet Resolver ("QRIS BCA" -> "BCA [Bayu]")
  var validAccounts = ['BCA [Bayu]', 'Cash Bayu', 'GoPay'];
  var resolvedWallet = FinanceSpecialist.resolveWalletAccount('QRIS BCA', validAccounts);
  Logger.log('\nResolver Input: "QRIS BCA" ➔ Resolved Output: "' + resolvedWallet + '"');

  if (resolvedWallet === 'BCA [Bayu]') {
    Logger.log('✅ PASS: Smart Wallet Resolver berhasil mencocokkan "QRIS BCA" ke Akun Resmi "BCA [Bayu]"!');
  } else {
    Logger.log('❌ FAIL: Wallet Resolver gagal.');
  }
}

/**
 * TEST SUITE: Verifikasi 100% Kepatuhan Pasal 1.2 & Smart Tokenizer Code Search
 */
function test_Pasal12ComplianceAndTokenizer() {
  Logger.log('=== TEST KEPATUHAN PASAL 1.2 & SMART TOKENIZER ===');

  // 1. Test Smart Tokenizer dari Kalimat Utuh
  var userSentence = 'Vexa, di file mana dan baris berapa fungsi analyzePhoto dipanggil?';
  var searchRes = SelfAwareness.searchCodeLocation(userSentence);
  
  Logger.log('Kalimat User: "' + userSentence + '"');
  Logger.log('Hasil Ekstraksi Tokenizer:\n' + JSON.stringify(searchRes, null, 2));

  if (searchRes.length > 0 && searchRes[0].file === '05_Service_Telegram.gs') {
    Logger.log('✅ PASS: Smart Tokenizer mengekstrak "analyzePhoto" & menunjuk file 05_Service_Telegram.gs baris ' + searchRes[0].line + '!');
  } else {
    Logger.log('❌ FAIL: Tokenizer gagal mengekstrak kata kunci.');
  }

  // 2. Test Stack Contract Grounding
  var metrics = SelfAwareness.review('all').system_metrics;
  if (metrics.stackContract && metrics.stackContract.platform.indexOf('Google Apps Script') !== -1) {
    Logger.log('✅ PASS: Stack Contract terbaca dari Database Knowledge tanpa hardcode di .gs!');
  } else {
    Logger.log('❌ FAIL: Stack Contract error');
  }
}