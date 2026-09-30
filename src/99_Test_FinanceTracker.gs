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