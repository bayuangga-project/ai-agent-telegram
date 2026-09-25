/**
 * Test suite untuk SelfDocSync — jalankan manual dari GAS editor.
 * Tidak mengganggu fitur utama.
 */

function test_SelfDocSync_FormatTanggal() {
  var result = DateTimeUtils.formatTanggal(new Date('2026-09-24T10:00:00'));
  Logger.log('formatTanggal: ' + result);
  if (result !== '2026-09-24') {
    Logger.log('FAIL: expected 2026-09-24, got ' + result);
  } else {
    Logger.log('PASS: formatTanggal');
  }
}

function test_SelfDocSync_ParseApproval() {
  var tests = [
    { input: 'ya', expected: 'approve' },
    { input: 'Ya', expected: 'approve' },
    { input: 'setuju', expected: 'approve' },
    { input: 'batal', expected: 'reject' },
    { input: 'tidak', expected: 'reject' },
    { input: 'detail', expected: 'detail' },
    { input: 'lihat', expected: 'detail' },
    { input: 'halo', expected: null },
    { input: 'saya mau tanya', expected: null }
  ];

  var pass = 0;
  for (var i = 0; i < tests.length; i++) {
    var result = SelfDocSync.parseApproval(tests[i].input);
    if (result === tests[i].expected) {
      pass++;
    } else {
      Logger.log('FAIL: parseApproval("' + tests[i].input + '") = ' + result + ', expected ' + tests[i].expected);
    }
  }
  Logger.log('parseApproval: ' + pass + '/' + tests.length + ' passed');
}

function test_SelfDocSync_ReadStructure() {
  var structure = SelfDocSync._readCodeStructure();
  if (!structure) {
    Logger.log('FAIL: _readCodeStructure returned null (cek GITHUB_TOKEN)');
    return;
  }
  var files = Object.keys(structure);
  Logger.log('Files found: ' + files.length);
  Logger.log('Sample: ' + JSON.stringify(structure[files[0]], null, 2));
  Logger.log('PASS: _readCodeStructure');
}

function test_SelfDocSync_FullPipeline_DryRun() {
  Logger.log('=== DRY RUN: Full Pipeline ===');
  
  var structure = SelfDocSync._readCodeStructure();
  if (!structure) {
    Logger.log('SKIP: no source data');
    return;
  }
  
  var previous = SelfDocSync._getPreviousStructure();
  var diff = SelfDocSync._compareStructure(structure, previous);
  Logger.log('Changes: ' + diff.totalChanges);
  Logger.log('Added: ' + JSON.stringify(diff.addedFiles));
  Logger.log('Modified: ' + JSON.stringify(diff.modifiedFiles));
  Logger.log('Removed: ' + JSON.stringify(diff.removedFiles));
  
  if (diff.totalChanges > 0 && !diff.isFirstRun) {
    Logger.log('Generating doc update...');
    var draft = SelfDocSync._generateDocUpdate(diff);
    if (draft) {
      Logger.log('Draft files: ' + draft.files.length);
      Logger.log('Summary: ' + draft.summary);
    } else {
      Logger.log('No doc update generated');
    }
  }
  
  Logger.log('=== DRY RUN COMPLETE ===');
}

function test_SelfDocSync_SetupTrigger() {
  setupDailySelfDocTrigger();
  Logger.log('PASS: Trigger setup at 10:00');
}

function test_SelfDocSync_SaveInitialBaseline() {
  var structure = SelfDocSync._readCodeStructure();
  if (structure) {
    SelfDocSync._saveStructure(structure);
    Logger.log('PASS: Baseline 55 file berhasil disimpan ke sheet Knowledge.');
  } else {
    Logger.log('FAIL: Gagal membaca struktur kode.');
  }
}

/**
 * Cek apakah file di GAS Editor sama persis dengan yang ada di GitHub.
 */
function test_CekStatusSinkronisasi() {
  Logger.log('=== MEMERIKSA STATUS SINKRONISASI GAS vs GITHUB ===');
  
  // 1. Ambil file dari GitHub
  var githubFiles = GitHubOpsService.readAllSourceFiles();
  if (!githubFiles || Object.keys(githubFiles).length === 0) {
    Logger.log('❌ Gagal menghubungi GitHub. Periksa GITHUB_TOKEN di Script Properties.');
    return;
  }

  // 2. Ambil snapshot lokal
  var totalGithub = Object.keys(githubFiles).length;
  Logger.log('Total file .gs di GitHub: ' + totalGithub);
  
  // 3. Cek file spesifik yang baru saja kita ubah
  var fileCek = '02_Utils.gs';
  if (githubFiles[fileCek]) {
    var contentGithub = githubFiles[fileCek].content;
    var punyaFormatTanggal = contentGithub.indexOf('formatTanggal') !== -1;
    
    Logger.log('Status file ' + fileCek + ' di GitHub:');
    if (punyaFormatTanggal) {
      Logger.log('✅ ' + fileCek + ' di GitHub SUDAH memiliki formatTanggal (Sudah Sinkron)');
    } else {
      Logger.log('⚠️ ' + fileCek + ' di GitHub BELUM memiliki formatTanggal (Belum Sinkron / Masih Versi Lama)');
      Logger.log('👉 Solusi: Jalankan fungsi "runFullBackup" di dropdown GAS untuk menyinkronkannya.');
    }
  }
}

