/**
 * SPECIALIST: CHANGE DETECTOR
 * Tanggung jawab: mendeteksi perubahan pada codebase,
 * mengecek sinkronisasi dokumentasi, dan melaporkan
 * temuan ke user secara proaktif.
 *
 * Dipicu oleh:
 * - Trigger mingguan (Minggu 20:00 WIB)
 * - Percakapan natural (user tanya "ada yang berubah?")
 * - Setelah deploy (manual trigger)
 */
var ChangeDetector = {

  /**
   * Entry point utama.
   * @param {string} mode - 'full' (semua cek) atau 'quick' (hanya perubahan kode)
   * @returns {string} Laporan untuk user
   */
  runDetection: function(mode) {
    var detectionMode = mode || 'full';
    AppLogger.info('CHANGE_DETECT_START', 'Mode: ' + detectionMode);

    var currentFiles = this._getCurrentFiles();
    if (!currentFiles || Object.keys(currentFiles).length === 0) {
      return '❌ Gagal membaca kode dari GitHub. Cek GITHUB_TOKEN.';
    }

    var snapshot = this._getLatestSnapshot();
    var changes = this._compareWithSnapshot(currentFiles, snapshot);

    if (changes.total === 0) {
      return '✅ Tidak ada perubahan kode sejak pengecekan terakhir. Semua stabil!';
    }

    var report = this._buildReport(changes, currentFiles);

    if (detectionMode === 'full') {
      var docSync = this._checkDocSync(changes);
      if (docSync.length > 0) {
        report += '\n\n📄 *Sinkronisasi Dokumentasi:*\n';
        docSync.forEach(function(d) {
          report += '• ' + d + '\n';
        });
        report += '\nMau aku update dokumentasi agar sesuai?';
      }
    }

    // Update snapshot setelah deteksi
    this._saveSnapshot(currentFiles);

    return report;
  },

  /**
   * Entry point untuk trigger terjadwal.
   * Kirim laporan ke Telegram hanya jika ada perubahan.
   */
  runScheduledDetection: function() {
    AppLogger.info('CHANGE_DETECT_SCHEDULED', 'Weekly check started');

    try {
      var currentFiles = this._getCurrentFiles();
      if (!currentFiles || Object.keys(currentFiles).length === 0) return;

      var snapshot = this._getLatestSnapshot();
      var changes = this._compareWithSnapshot(currentFiles, snapshot);

      if (changes.total === 0) {
        AppLogger.info('CHANGE_DETECT_SCHEDULED', 'No changes detected');
        return;
      }

      var report = '🔔 *Laporan Perubahan Mingguan*\n\n' +
                   this._buildReport(changes, currentFiles);

      var docSync = this._checkDocSync(changes);
      if (docSync.length > 0) {
        report += '\n\n📄 *Docs perlu update:*\n';
        docSync.forEach(function(d) {
          report += '• ' + d + '\n';
        });
        report += '\nReply *"update docs"* kalau mau aku sesuaikan.';
      }

      var config = Config.load();
      TelegramService.sendMessage(config.myChatId, report);

      this._saveSnapshot(currentFiles);

    } catch (e) {
      AppLogger.error('CHANGE_DETECT_SCHEDULED_FAIL', e.message);
    }
  },

  /**
   * ============================================================
   * INTERNAL: Baca file dari GitHub
   * ============================================================
   */
  _getCurrentFiles: function() {
    var allSource = GitHubOpsService.readAllSourceFiles();
    var result = {};

    Object.keys(allSource).forEach(function(name) {
      if (name !== 'appsscript.json') {
        result[name] = {
          content: allSource[name].content,
          sha: allSource[name].sha,
          hash: this._simpleHash(allSource[name].content)
        };
      }
    }.bind(this));

    return result;
  },

  /**
   * Hash sederhana untuk deteksi perubahan cepat.
   */
  _simpleHash: function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return String(Math.abs(hash));
  },

  /**
   * ============================================================
   * INTERNAL: Snapshot management
   * ============================================================
   */
  _getLatestSnapshot: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Code_Snapshots');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return {};

      var snapshot = {};
      for (var i = 1; i < data.length; i++) {
        var fileName = data[i][2];
        var fileHash = data[i][3];
        var status = data[i][4];
        if (fileName && status === 'active') {
          snapshot[fileName] = fileHash;
        }
      }
      return snapshot;
    } catch (e) {
      AppLogger.error('CHANGE_DETECT_SNAPSHOT_READ_FAIL', e.message);
      return {};
    }
  },

  _saveSnapshot: function(currentFiles) {
    try {
      // Nonaktifkan snapshot lama
      var sheet = SpreadsheetGateway.getSheet('Code_Snapshots');
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][4] === 'active') {
          sheet.getRange(i + 1, 5).setValue('archived');
        }
      }

      // Simpan snapshot baru
      var timestamp = DateTimeUtils.nowWIB();
      Object.keys(currentFiles).forEach(function(fileName) {
        var id = IdGenerator.generate('SNAP');
        SpreadsheetGateway.appendRowSafe('Code_Snapshots', [
          id, timestamp, fileName, currentFiles[fileName].hash, 'active'
        ]);
      });

      AppLogger.info('CHANGE_DETECT_SNAPSHOT_SAVED',
        Object.keys(currentFiles).length + ' files');
    } catch (e) {
      AppLogger.error('CHANGE_DETECT_SNAPSHOT_SAVE_FAIL', e.message);
    }
  },

  /**
   * ============================================================
   * INTERNAL: Bandingkan file sekarang vs snapshot
   * ============================================================
   */
  _compareWithSnapshot: function(currentFiles, snapshot) {
    var added = [];
    var modified = [];
    var deleted = [];

    // Cek file baru dan file yang berubah
    Object.keys(currentFiles).forEach(function(fileName) {
      if (!snapshot[fileName]) {
        added.push(fileName);
      } else if (snapshot[fileName] !== currentFiles[fileName].hash) {
        modified.push(fileName);
      }
    });

    // Cek file yang dihapus
    Object.keys(snapshot).forEach(function(fileName) {
      if (!currentFiles[fileName]) {
        deleted.push(fileName);
      }
    });

    return {
      added: added,
      modified: modified,
      deleted: deleted,
      total: added.length + modified.length + deleted.length
    };
  },

  /**
   * ============================================================
   * INTERNAL: Build laporan untuk user
   * ============================================================
   */
  _buildReport: function(changes, currentFiles) {
    var report = '📊 *Deteksi Perubahan Kode*\n\n';

    if (changes.added.length > 0) {
      report += '🟢 *File Baru (' + changes.added.length + '):*\n';
      changes.added.forEach(function(f) {
        report += '• `' + f + '`\n';
      });
      report += '\n';
    }

    if (changes.modified.length > 0) {
      report += '🟡 *File Berubah (' + changes.modified.length + '):*\n';
      changes.modified.forEach(function(f) {
        report += '• `' + f + '`\n';
      });
      report += '\n';
    }

    if (changes.deleted.length > 0) {
      report += '🔴 *File Dihapus (' + changes.deleted.length + '):*\n';
      changes.deleted.forEach(function(f) {
        report += '• `' + f + '`\n';
      });
      report += '\n';
    }

    report += 'Total: ' + changes.total + ' perubahan.';
    return report;
  },

  /**
   * ============================================================
   * INTERNAL: Cek apakah docs out-of-sync
   * ============================================================
   */
  _checkDocSync: function(changes) {
    var issues = [];
    var allChanges = changes.added.concat(changes.modified);

    // Cek apakah ada file Specialist baru tapi ARCHITECTURE.md belum mention
    allChanges.forEach(function(fileName) {
      if (fileName.indexOf('08_Specialist_') === 0) {
        var moduleName = fileName.replace('08_Specialist_', '').replace('.gs', '');
        issues.push('File specialist baru/berubah: `' + moduleName +
          '` — pastikan ARCHITECTURE.md §4 sudah include.');
      }

      if (fileName.indexOf('11_Trigger_') === 0) {
        issues.push('Trigger baru/berubah: `' + fileName +
          '` — pastikan ARCHITECTURE.md §5 sudah dokumentasikan alurnya.');
      }

      if (fileName.indexOf('04_Repository_') === 0) {
        issues.push('Repository baru/berubah: `' + fileName +
          '` — pastikan ARCHITECTURE.md §6 (Data Model) sudah update.');
      }
    });

    // Cek apakah ada sheet baru yang belum didokumentasikan
    if (changes.added.length > 0) {
      issues.push('Ada file baru — cek apakah sheet baru juga dibuat dan perlu didokumentasikan di §6.');
    }

    return issues;
  }
};