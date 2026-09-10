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

















