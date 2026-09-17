function test_Batch7b_FinanceSpecialist() {
  Logger.log('=== TEST 1: Catat Pemasukan ===');
  const income = FinanceSpecialist.recordTransaction({
    walletNama: '[TEST] BCA',
    tipe: TransactionRepository.TIPE_INCOME,
    kategori: 'Gaji',
    jumlah: 5000000,
    deskripsi: '[TEST] gajian'
  });
  Logger.log(income.text);

  Logger.log('=== TEST 2: Catat Pengeluaran (wallet default) ===');
  const expense1 = FinanceSpecialist.recordTransaction({
    tipe: TransactionRepository.TIPE_EXPENSE,
    kategori: 'Makanan',
    jumlah: 30000,
    deskripsi: '[TEST] makan siang'
  });
  Logger.log(expense1.text);

  Logger.log('=== TEST 3: Cek Semua Saldo ===');
  Logger.log(FinanceSpecialist.getAllSaldoAsText());

  Logger.log('=== TEST 4: Buat Budget Kecil (untuk trigger alert) ===');
  const periodeIni = DateTimeUtils.formatPeriode(new Date());
  Logger.log(FinanceSpecialist.createOrUpdateBudget('Makanan', 50000, periodeIni));

  Logger.log('=== TEST 5: Pengeluaran Lagi (harus trigger alert budget) ===');
  const expense2 = FinanceSpecialist.recordTransaction({
    tipe: TransactionRepository.TIPE_EXPENSE,
    kategori: 'Makanan',
    jumlah: 30000,
    deskripsi: '[TEST] jajan sore'
  });
  Logger.log(expense2.text);
  Logger.log('>>> Harus ada teks alert budget di atas (total 60rb dari budget 50rb)');

  Logger.log('=== TEST 6: Edit Transaksi Terakhir ===');
  const editResult = FinanceSpecialist.editLastTransaction({ jumlah: 25000 });
  Logger.log(editResult.text);

  Logger.log('=== TEST 7: Ringkasan Periode ===');
  const ringkasan = FinanceSpecialist.getRingkasanPeriode(periodeIni);
  Logger.log(FinanceSpecialist.formatRingkasanAsText(ringkasan));

  Logger.log('=== SEMUA TEST BATCH 7b SELESAI ===');
}

function debug_CheckOAuthScopes() {
  const token = ScriptApp.getOAuthToken();
  const url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token;

  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  Logger.log('Response code: ' + response.getResponseCode());
  Logger.log('Scope info: ' + response.getContentText());
}

function debug_CheckGitHubConfig() {
  const props = PropertiesService.getScriptProperties();
  const owner = props.getProperty('GITHUB_REPO_OWNER');
  const repo = props.getProperty('GITHUB_REPO_NAME');
  const token = props.getProperty('GITHUB_TOKEN');

  Logger.log('Owner: "' + owner + '"');
  Logger.log('Repo: "' + repo + '"');
  Logger.log('Token (4 char pertama): "' + (token ? token.substring(0, 4) : 'KOSONG') + '"');
  Logger.log('Token length: ' + (token ? token.length : 0));

  // Cek apakah repo ini BENAR-BENAR terlihat oleh token ini
  const url = 'https://api.github.com/repos/' + owner + '/' + repo;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      Authorization: 'token ' + token,
      Accept: 'application/vnd.github+json'
    },
    muteHttpExceptions: true
  });

  Logger.log('Cek repo response code: ' + response.getResponseCode());
  Logger.log('Cek repo response: ' + response.getContentText().substring(0, 500));
}

/**
 * ===================================================================
 * TEST: Telegram Markdown Parse Error Fallback
 * ===================================================================
 */
function test_TelegramMarkdownFallback() {
  const config = Config.load();
  const chatId = config.myChatId;

  Logger.log('=== MULAI TEST TELEGRAM FALLBACK ===');

  // 1. Kirim pesan placeholder (seperti alur asli)
  const placeholder = TelegramService.pickPlaceholder();
  const messageId = TelegramService.sendMessage(chatId, placeholder);
  Logger.log('1. Placeholder terkirim dengan messageId: ' + messageId);

  if (!messageId) {
    Logger.log('❌ GAGAL: Tidak bisa mengirim pesan placeholder.');
    return;
  }

  // Beri jeda 2 detik agar Anda sempat melihat pesan placeholder di Telegram
  Utilities.sleep(2000);

  // 2. Teks simulasi dengan karakter rusak (bintang gantung, kurung siku rusak, dll)
  // Ini adalah karakter yang PASTI ditolak oleh parser Markdown Telegram
  const brokenMarkdownText = 
    "🧪 *TEST FALLBACK BERHASIL!*\n\n" +
    "Ini adalah simulasi jawaban dengan Markdown rusak:\n" +
    "• Bintang gantung tanpa penutup: *mie ayam enak\n" +
    "• Karakter kurung siku: [ini bukan link\n" +
    "• Formula target profit: > 500rb & modal < 200rb\n\n" +
    "Jika pesan ini terbaca utuh di Telegram (placeholder berhasil diedit), artinya FIX BERHASIL!";

  // 3. Coba lakukan editMessage dengan teks rusak tersebut
  TelegramService.editMessage(chatId, messageId, brokenMarkdownText);
  Logger.log('2. editMessage telah dieksekusi.');
  Logger.log('=== SELESAI TEST ===');
}


/**
 * Audit timezone: membandingkan output Date mentah vs toWIB().
 * Menentukan secara empiris apakah terjadi double offset WIB.
 */
function debug_TimezoneAudit() {
  const ses = Session.getScriptTimeZone();
  const now = new Date();
  const toWIBNow = DateTimeUtils.toWIB(now);

  const utcParsed = new Date("2025-01-01T00:00:00Z");
  const utcParsedWIB = DateTimeUtils.toWIB(utcParsed);

  const result = [
    "=== HASIL AUDIT TIMEZONE ===",
    "Script TimeZone : " + ses,
    "",
    "--- Skenario 1: new Date() (Waktu Server/Runtime) ---",
    "1. now.toString()       : " + now.toString(),
    "2. now.toISOString()    : " + now.toISOString(),
    "3. toWIB(now).toString(): " + toWIBNow.toString(),
    "4. toWIB(now).toISODate : " + toWIBNow.toISOString(),
    "",
    "--- Skenario 2: Parsing String ISO UTC (2025-01-01T00:00:00Z) ---",
    "1. utc.toString()       : " + utcParsed.toString(),
    "2. utc.toISOString()    : " + utcParsed.toISOString(),
    "3. toWIB(utc).toString(): " + utcParsedWIB.toString(),
    "4. toWIB(utc).toISODate : " + utcParsedWIB.toISOString(),
    "=========================================="
  ];

  const output = result.join("\n");
  Logger.log(output);
  return output;
}

function triggerKnowledgeSync() {
  KnowledgeSyncSpecialist.sync();
}













