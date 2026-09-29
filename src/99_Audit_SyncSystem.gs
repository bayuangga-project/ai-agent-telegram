/**
 * ===================================================================
 * AUDIT: FULL SYNC SYSTEM CHECK
 * Memverifikasi seluruh sambungan GAS ↔ Sheet ↔ GitHub.
 * HANYA MEMBACA, TIDAK MENGUBAH DATA APAPUN.
 * ===================================================================
 */

function audit_SyncSystem_Full() {
  Logger.log('');
  Logger.log('╔══════════════════════════════════════════════╗');
  Logger.log('║   AUDIT SISTEM SINKRONISASI LENGKAP         ║');
  Logger.log('║   ' + DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB()) + '              ║');
  Logger.log('╚══════════════════════════════════════════════╝');
  Logger.log('');

  var hasil = {
    total: 0,
    pass: 0,
    fail: 0,
    warn: 0,
    detail: []
  };

  audit_1_KoneksiSheet(hasil);
  audit_2_KoneksiGitHub(hasil);
  audit_3_GitHubKeSheet_Knowledge(hasil);
  audit_4_SheetKeGitHub_Dokumentasi(hasil);
  audit_5_FileMd_Identik(hasil);
  audit_6_SelfDocSync(hasil);
  audit_7_ChangeDetector(hasil);
  audit_8_TriggerAktif(hasil);

  Logger.log('');
  Logger.log('╔══════════════════════════════════════════════╗');
  Logger.log('║   HASIL AKHIR AUDIT                          ║');
  Logger.log('╠══════════════════════════════════════════════╣');
  Logger.log('║  Total Pemeriksaan : ' + hasil.total);
  Logger.log('║  ✅ Lulus (PASS)   : ' + hasil.pass);
  Logger.log('║  ❌ Gagal (FAIL)   : ' + hasil.fail);
  Logger.log('║  ⚠️ Peringatan     : ' + hasil.warn);
  Logger.log('╚══════════════════════════════════════════════╝');

  if (hasil.fail === 0) {
    Logger.log('');
    Logger.log('🎉 SELAMAT! Seluruh sistem sinkronisasi berfungsi normal.');
  } else {
    Logger.log('');
    Logger.log('⚠️ Ada ' + hasil.fail + ' masalah yang perlu diperbaiki. Lihat detail di atas.');
  }
}

function _catat(hasil, status, nama, pesan) {
  hasil.total++;
  if (status === 'PASS') hasil.pass++;
  else if (status === 'FAIL') hasil.fail++;
  else if (status === 'WARN') hasil.warn++;

  var ikon = status === 'PASS' ? '✅' : (status === 'FAIL' ? '❌' : '⚠️');
  Logger.log(ikon + ' [' + status + '] ' + nama);
  if (pesan) Logger.log('   → ' + pesan);
  hasil.detail.push({ status: status, nama: nama, pesan: pesan });
}

// =====================================================
// 1. KONEKSI GAS ↔ GOOGLE SHEET
// =====================================================
function audit_1_KoneksiSheet(hasil) {
  Logger.log('');
  Logger.log('━━━ 1. KONEKSI GAS ↔ GOOGLE SHEET ━━━');

  try {
    var ss = SpreadsheetGateway.getSpreadsheet();
    if (ss) {
      _catat(hasil, 'PASS', 'Spreadsheet terhubung', 'ID: ' + ss.getId().substring(0, 10) + '...');
    } else {
      _catat(hasil, 'FAIL', 'Spreadsheet terhubung', 'getSpreadsheet() mengembalikan null');
      return;
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'Spreadsheet terhubung', e.message);
    return;
  }

  var sheetWajib = [
    'Chat_History', 'Knowledge', 'Log_System', 'Documentation',
    'Code_Snapshots', 'Memory_Summaries', 'Reminder_RawData',
    'Finance_Transactions', 'Finance_Wallets', 'SelfHeal_Patches'
  ];

  var sheets = ss.getSheets().map(function(s) { return s.getName(); });
  var hilang = [];

  for (var i = 0; i < sheetWajib.length; i++) {
    if (sheets.indexOf(sheetWajib[i]) === -1) {
      hilang.push(sheetWajib[i]);
    }
  }

  if (hilang.length === 0) {
    _catat(hasil, 'PASS', 'Sheet wajib tersedia', 'Semua ' + sheetWajib.length + ' sheet ada (' + sheets.length + ' total)');
  } else {
    _catat(hasil, 'FAIL', 'Sheet wajib tersedia', 'Hilang: ' + hilang.join(', '));
  }

  try {
    var knowledgeData = KnowledgeRepository.getAll();
    var count = knowledgeData ? knowledgeData.length : 0;
    if (count > 0) {
      _catat(hasil, 'PASS', 'Sheet Knowledge berisi data', count + ' entri ditemukan');
    } else {
      _catat(hasil, 'WARN', 'Sheet Knowledge berisi data', 'Kosong — mungkin belum sync dari GitHub');
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'Sheet Knowledge berisi data', e.message);
  }

  try {
    var logSheet = SpreadsheetGateway.getSheet('Log_System');
    var logRows = logSheet.getLastRow();
    _catat(hasil, 'PASS', 'Sheet Log_System aktif', (logRows - 1) + ' log tercatat');
  } catch (e) {
    _catat(hasil, 'FAIL', 'Sheet Log_System aktif', e.message);
  }
}

// =====================================================
// 2. KONEKSI GAS ↔ GITHUB
// =====================================================
function audit_2_KoneksiGitHub(hasil) {
  Logger.log('');
  Logger.log('━━━ 2. KONEKSI GAS ↔ GITHUB ━━━');

  var config;
  try {
    config = Config.load();
    if (config.githubToken) {
      _catat(hasil, 'PASS', 'GitHub Token tersedia', 'Token terdeteksi di Script Properties');
    } else {
      _catat(hasil, 'FAIL', 'GitHub Token tersedia', 'GITHUB_TOKEN kosong di Script Properties');
      return;
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'GitHub Token tersedia', e.message);
    return;
  }

  try {
    var repo = config.githubRepoOwner + '/' + config.githubRepoName;
    _catat(hasil, 'PASS', 'Repo GitHub terkonfigurasi', repo + ' (branch: ' + (config.githubBranch || 'main') + ')');
  } catch (e) {
    _catat(hasil, 'FAIL', 'Repo GitHub terkonfigurasi', e.message);
  }

  try {
    var files = GitHubOpsService.listDirectory('src');
    if (files && files.length > 0) {
      _catat(hasil, 'PASS', 'Baca folder /src di GitHub', files.length + ' item ditemukan');
    } else {
      _catat(hasil, 'FAIL', 'Baca folder /src di GitHub', 'Folder kosong atau tidak ditemukan');
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'Baca folder /src di GitHub', e.message);
  }

  try {
    var allSource = GitHubOpsService.readAllSourceFiles();
    var count = allSource ? Object.keys(allSource).length : 0;
    if (count > 0) {
      _catat(hasil, 'PASS', 'Baca semua file .gs dari GitHub', count + ' file berhasil dibaca');
    } else {
      _catat(hasil, 'FAIL', 'Baca semua file .gs dari GitHub', 'Tidak ada file .gs yang bisa dibaca');
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'Baca semua file .gs dari GitHub', e.message);
  }

  var docFiles = ['ARCHITECTURE.md', 'PROGRESS.md', 'ROADMAP.md', 'AI_DEVELOPMENT_HANDOVER.md', 'ai_knowledge.md'];
  var docOk = 0;
  var docHilang = [];

  for (var i = 0; i < docFiles.length; i++) {
    try {
      var f = GitHubOpsService.readFile(docFiles[i]);
      if (f && f.content && f.content.length > 0) {
        docOk++;
      } else {
        docHilang.push(docFiles[i]);
      }
    } catch (e) {
      docHilang.push(docFiles[i]);
    }
  }

  if (docOk === docFiles.length) {
    _catat(hasil, 'PASS', 'Semua file .md ada di GitHub', docOk + '/' + docFiles.length + ' file ditemukan');
  } else {
    _catat(hasil, 'FAIL', 'Semua file .md ada di GitHub', 'Hilang: ' + docHilang.join(', '));
  }
}

// =====================================================
// 3. SINKRONISASI GITHUB → SHEET (Knowledge)
// =====================================================
function audit_3_GitHubKeSheet_Knowledge(hasil) {
  Logger.log('');
  Logger.log('━━━ 3. SINKRONISASI GITHUB → SHEET (Knowledge) ━━━');

  try {
    var fileData = GitHubOpsService.readFile('ai_knowledge.md');
    if (!fileData || !fileData.content) {
      _catat(hasil, 'FAIL', 'ai_knowledge.md bisa dibaca dari GitHub', 'File kosong atau tidak ditemukan');
      return;
    }

    var sections = fileData.content.split(/^##\s+/m);
    var githubCount = 0;
    for (var i = 1; i < sections.length; i++) {
      var header = sections[i].substring(0, sections[i].indexOf('\n')).trim();
      if (header.indexOf(':') !== -1) githubCount++;
    }

    _catat(hasil, 'PASS', 'ai_knowledge.md di GitHub', githubCount + ' bagian (section) ditemukan');

    var sheetKnowledge = KnowledgeRepository.getAll();
    var sheetCount = sheetKnowledge ? sheetKnowledge.length : 0;
    _catat(hasil, 'PASS', 'Knowledge di Sheet', sheetCount + ' entri tersimpan');

    if (sheetCount >= githubCount * 0.8) {
      _catat(hasil, 'PASS', 'Sinkronisasi Knowledge GitHub → Sheet', 'Sheet memiliki ' + sheetCount + '/' + githubCount + ' entri (' + Math.round(sheetCount / githubCount * 100) + '%)');
    } else {
      _catat(hasil, 'WARN', 'Sinkronisasi Knowledge GitHub → Sheet', 'Sheet hanya memiliki ' + sheetCount + '/' + githubCount + ' entri. Mungkin perlu sync ulang.');
    }

  } catch (e) {
    _catat(hasil, 'FAIL', 'Sinkronisasi Knowledge', e.message);
  }
}

// =====================================================
// 4. SINKRONISASI SHEET → GITHUB (Dokumentasi)
// =====================================================
function audit_4_SheetKeGitHub_Dokumentasi(hasil) {
  Logger.log('');
  Logger.log('━━━ 4. SINKRONISASI SHEET → GITHUB (Dokumentasi) ━━━');

  try {
    var docs = DocumentationRepository.getAll();
    if (docs && docs.length > 0) {
      _catat(hasil, 'PASS', 'Sheet Documentation berisi data', docs.length + ' dokumen tersimpan');
    } else {
      _catat(hasil, 'WARN', 'Sheet Documentation berisi data', 'Kosong — dokumen belum di-backup ke Sheet');
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'Sheet Documentation berisi data', e.message);
  }

  try {
    var canonicalRaw = KnowledgeRepository.get('docsync', 'canonical_files');
    if (canonicalRaw) {
      var files = canonicalRaw.split('\n').filter(function(l) { return l.trim().length > 0; });
      var hasLegacy = files.some(function(f) { return f.indexOf('01_') === 0; });
      if (!hasLegacy) {
        _catat(hasil, 'PASS', 'Daftar dokumen kanonik bersih', files.length + ' file: ' + files.join(', '));
      } else {
        _catat(hasil, 'FAIL', 'Daftar dokumen kanonik bersih', 'Masih ada file legacy lama!');
      }
    } else {
      _catat(hasil, 'WARN', 'Daftar dokumen kanonik bersih', 'Tidak ditemukan di Knowledge (akan pakai default)');
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'Daftar dokumen kanonik bersih', e.message);
  }
}

// =====================================================
// 5. PERBANDINGAN FILE .md (GITHUB vs SHEET)
//    Metode: Perbandingan KATA PER KATA (bukan karakter)
//    Menggunakan Whitelist Export Namespace untuk ai_knowledge.md
// =====================================================
function audit_5_FileMd_Identik(hasil) {
  Logger.log('');
  Logger.log('━━━ 5. PERBANDINGAN FILE .md (GITHUB vs SHEET) ━━━');
  Logger.log('   Metode: perbandingan kata per kata...');

  var canonicalFiles = ['ARCHITECTURE.md', 'PROGRESS.md', 'ROADMAP.md', 'AI_DEVELOPMENT_HANDOVER.md', 'ai_knowledge.md'];
  var docs = DocumentationRepository.getAll();

  // Fungsi bantu: pecah teks menjadi daftar kata bersih
  var ambilKataKata = function(str) {
    if (!str) return [];
    return str
      .replace(/\r\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(function(w) { return w.length > 0; });
  };

  for (var i = 0; i < canonicalFiles.length; i++) {
    var fileName = canonicalFiles[i];

    // 1. Ambil konten dari GitHub
    var githubFile = null;
    try {
      githubFile = GitHubOpsService.readFile(fileName);
    } catch (e) {}

    if (!githubFile || !githubFile.content) {
      _catat(hasil, 'WARN', fileName, 'Tidak ditemukan di GitHub, lewati');
      continue;
    }

    // 2. Ambil konten dari Sheet
    var sheetContent = '';

    if (fileName === 'ai_knowledge.md') {
      try {
        // Ambil Whitelist Namespace Human Knowledge resmi
        var exportList = [];
        if (typeof KnowledgeSyncSpecialist !== 'undefined' && KnowledgeSyncSpecialist.getExportNamespaces) {
          exportList = KnowledgeSyncSpecialist.getExportNamespaces();
        } else {
          exportList = ['intent', 'soul', 'tools', 'finance', 'docsync', 'benchmark', 'selfheal', 'feature', 'roadmap', 'agent', 'sync', 'chat', 'audit', 'selfaware', 'help'];
        }

        var allKnowledge = KnowledgeRepository.getAll();
        var grouped = {};
        for (var k = 0; k < allKnowledge.length; k++) {
          var row = allKnowledge[k];
          var isActive = row.active === true || String(row.active).toUpperCase() === 'TRUE';
          if (!isActive) continue;

          // Filter: Hanya rakit namespace yang diizinkan dalam Whitelist
          if (exportList.indexOf(row.namespace) === -1) continue;

          if (!grouped[row.namespace]) grouped[row.namespace] = [];
          grouped[row.namespace].push({ key: row.key, content: row.content });
        }

        var mdLines = ['# AI Agent Knowledge Base', ''];
        var namespaces = Object.keys(grouped).sort();
        for (var n = 0; n < namespaces.length; n++) {
          var ns = namespaces[n];
          var items = grouped[ns];
          for (var j = 0; j < items.length; j++) {
            mdLines.push('## ' + ns + ':' + items[j].key);
            mdLines.push(items[j].content);
            mdLines.push('');
          }
        }
        sheetContent = mdLines.join('\n');
      } catch (e) {
        _catat(hasil, 'FAIL', fileName, 'Gagal merakit dari sheet: ' + e.message);
        continue;
      }
    } else {
      var sheetDoc = null;
      for (var j = 0; j < docs.length; j++) {
        if (docs[j].fileName === fileName) {
          sheetDoc = docs[j];
          break;
        }
      }
      if (sheetDoc && sheetDoc.content) {
        sheetContent = sheetDoc.content;
      }
    }

    if (!sheetContent) {
      _catat(hasil, 'WARN', fileName, 'Tidak ditemukan di Sheet');
      continue;
    }

    // 3. Bandingkan KATA PER KATA
    var kataGithub = ambilKataKata(githubFile.content);
    var kataSheet = ambilKataKata(sheetContent);

    if (kataGithub.length === kataSheet.length) {
      var semuaSama = true;
      var bedaPertama = -1;
      for (var w = 0; w < kataGithub.length; w++) {
        if (kataGithub[w] !== kataSheet[w]) {
          semuaSama = false;
          bedaPertama = w;
          break;
        }
      }

      if (semuaSama) {
        _catat(hasil, 'PASS', fileName, 'IDENTIK ✅ (' + kataGithub.length + ' kata, 0 perbedaan)');
      } else {
        _catat(hasil, 'FAIL', fileName,
          'Kata ke-' + (bedaPertama + 1) + ' berbeda: GitHub="' + kataGithub[bedaPertama] + '" vs Sheet="' + kataSheet[bedaPertama] + '"'
        );
      }
    } else {
      var selisih = Math.abs(kataGithub.length - kataSheet.length);
      _catat(hasil, 'FAIL', fileName,
        'Jumlah kata berbeda: GitHub=' + kataGithub.length + ' vs Sheet=' + kataSheet.length + ' (selisih ' + selisih + ' kata)'
      );
    }
  }
}

// =====================================================
// 6. SELF DOC SYNC PIPELINE
// =====================================================
function audit_6_SelfDocSync(hasil) {
  Logger.log('');
  Logger.log('━━━ 6. SELF DOC SYNC PIPELINE ━━━');

  try {
    var structure = SelfDocSync._getPreviousStructure();
    if (structure && Object.keys(structure).length > 0) {
      _catat(hasil, 'PASS', 'Snapshot struktur kode tersimpan', Object.keys(structure).length + ' file tercatat di Knowledge');
    } else {
      _catat(hasil, 'WARN', 'Snapshot struktur kode tersimpan', 'Belum ada snapshot. Jalankan test_SelfDocSync_SaveInitialBaseline dulu.');
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'Snapshot struktur kode tersimpan', e.message);
  }

  try {
    var draft = SelfDocSync.getPendingDraft();
    if (draft) {
      _catat(hasil, 'WARN', 'Draft pending', 'Ada draft yang belum disetujui (' + draft.files.length + ' file). Cek Telegram Anda.');
    } else {
      _catat(hasil, 'PASS', 'Draft pending', 'Tidak ada draft tertunda');
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'Draft pending', e.message);
  }

  try {
    var testApproval = SelfDocSync.parseApproval('ya');
    if (testApproval === 'approve') {
      _catat(hasil, 'PASS', 'Parser persetujuan berfungsi', '"ya" → approve, "batal" → reject, "detail" → detail');
    } else {
      _catat(hasil, 'FAIL', 'Parser persetujuan berfungsi', 'Mengembalikan: ' + testApproval);
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'Parser persetujuan berfungsi', e.message);
  }
}

// =====================================================
// 7. CHANGE DETECTOR
// =====================================================
function audit_7_ChangeDetector(hasil) {
  Logger.log('');
  Logger.log('━━━ 7. CHANGE DETECTOR ━━━');

  try {
    var snapshot = ChangeDetector._getLatestSnapshot();
    var count = Object.keys(snapshot).length;
    if (count > 0) {
      _catat(hasil, 'PASS', 'Snapshot ChangeDetector tersimpan', count + ' file hash aktif');
    } else {
      _catat(hasil, 'WARN', 'Snapshot ChangeDetector tersimpan', 'Belum ada snapshot aktif');
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'Snapshot ChangeDetector tersimpan', e.message);
  }

  try {
    var currentFiles = ChangeDetector._getCurrentFiles();
    var fileCount = Object.keys(currentFiles).length;
    var hasManifest = currentFiles['appsscript.json'] ? true : false;

    if (fileCount > 0) {
      _catat(hasil, 'PASS', 'ChangeDetector baca file dari GitHub', fileCount + ' file' + (hasManifest ? ' (termasuk appsscript.json ✅)' : ' (appsscript.json belum terdeteksi)'));
    } else {
      _catat(hasil, 'FAIL', 'ChangeDetector baca file dari GitHub', 'Tidak ada file yang bisa dibaca');
    }
  } catch (e) {
    _catat(hasil, 'FAIL', 'ChangeDetector baca file dari GitHub', e.message);
  }
}

// =====================================================
// 8. TRIGGER AKTIF
// =====================================================
function audit_8_TriggerAktif(hasil) {
  Logger.log('');
  Logger.log('━━━ 8. TRIGGER JADWAL AKTIF ━━━');

  try {
    var triggers = ScriptApp.getProjectTriggers();
    var triggerMap = {};

    for (var i = 0; i < triggers.length; i++) {
      var func = triggers[i].getHandlerFunction();
      if (!triggerMap[func]) triggerMap[func] = 0;
      triggerMap[func]++;
    }

    var totalTriggers = triggers.length;
    _catat(hasil, 'PASS', 'Total trigger aktif', totalTriggers + ' trigger terdaftar');

    var wajibAda = [
      'runDailyAutoSync',
      'runDailySelfDocCheck',
      'runScheduledAuditWrapper',
      'cekDanKirimReminder'
    ];

    for (var j = 0; j < wajibAda.length; j++) {
      if (triggerMap[wajibAda[j]]) {
        _catat(hasil, 'PASS', 'Trigger: ' + wajibAda[j], 'Aktif (' + triggerMap[wajibAda[j]] + 'x)');
      } else {
        _catat(hasil, 'WARN', 'Trigger: ' + wajibAda[j], 'Belum aktif — jalankan setup-nya');
      }
    }

    var opsional = ['runDailyLLMDiscovery', 'runNightlySummarizerWrapper', 'runWeeklyChangeCheckWrapper'];
    for (var k = 0; k < opsional.length; k++) {
      if (triggerMap[opsional[k]]) {
        _catat(hasil, 'PASS', 'Trigger: ' + opsional[k], 'Aktif');
      } else {
        _catat(hasil, 'WARN', 'Trigger: ' + opsional[k], 'Belum aktif (opsional)');
      }
    }

  } catch (e) {
    _catat(hasil, 'FAIL', 'Trigger jadwal aktif', e.message);
  }
}