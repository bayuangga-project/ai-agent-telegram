/**
 * SPECIALIST: CHANGE DETECTOR
 * Tanggung jawab: mendeteksi perubahan pada codebase,
 * mengecek sinkronisasi dokumentasi, dan menyinkronkan
 * roadmap dengan kode secara otomatis.
 */
var ChangeDetector = {

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
      // Meskipun tidak ada perubahan kode, tetap cek roadmap sync
      if (detectionMode === 'full') {
        var syncResult = ProjectBrain.syncRoadmapWithCode();
        if (syncResult) {
          return '✅ Tidak ada perubahan kode.\n\n🔄 *Roadmap Sync:*\n' + syncResult;
        }
      }
      return '✅ Tidak ada perubahan kode sejak pengecekan terakhir. Semua stabil!';
    }

    var report = this._buildReport(changes, currentFiles);

    if (detectionMode === 'full') {
      var docSync = this._checkDocSync(changes);
      if (docSync.length > 0) {
        report += '\n\n📄 *Sinkronisasi Dokumentasi:*\n';
        docSync.forEach(function(d) { report += '• ' + d + '\n'; });
        report += '\nMau aku update dokumentasi agar sesuai?';
      }

      // Auto-sync roadmap dengan kode
      var syncResult = ProjectBrain.syncRoadmapWithCode();
      if (syncResult) {
        report += '\n\n🗺️ *Roadmap Sync:*\n' + syncResult;
      }
    }

    this._saveSnapshot(currentFiles);
    return report;
  },

  runScheduledDetection: function() {
    AppLogger.info('CHANGE_DETECT_SCHEDULED', 'Weekly check started');

    try {
      var currentFiles = this._getCurrentFiles();
      if (!currentFiles || Object.keys(currentFiles).length === 0) return;

      var snapshot = this._getLatestSnapshot();
      var changes = this._compareWithSnapshot(currentFiles, snapshot);

      var report = '🔔 *Laporan Perubahan Mingguan*\n\n';

      if (changes.total === 0) {
        report += 'Tidak ada perubahan kode minggu ini.\n';
      } else {
        report += this._buildReport(changes, currentFiles) + '\n';
      }

      // Selalu sync roadmap saat scheduled
      var syncResult = ProjectBrain.syncRoadmapWithCode();
      if (syncResult) {
        report += '\n🗺️ *Roadmap Sync:*\n' + syncResult;
      }

      var docSync = this._checkDocSync(changes);
      if (docSync.length > 0) {
        report += '\n📄 *Docs perlu update:*\n';
        docSync.forEach(function(d) { report += '• ' + d + '\n'; });
        report += '\nReply *"update docs"* kalau mau aku sesuaikan.';
      }

      var config = Config.load();
      TelegramService.sendMessage(config.myChatId, report);

      if (changes.total > 0) {
        this._saveSnapshot(currentFiles);
      }

    } catch (e) {
      AppLogger.error('CHANGE_DETECT_SCHEDULED_FAIL', e.message);
    }
  },

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

  _simpleHash: function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return String(Math.abs(hash));
  },

  _getLatestSnapshot: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Code_Snapshots');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return {};
      var snapshot = {};
      for (var i = 1; i < data.length; i++) {
        if (data[i][2] && data[i][4] === 'active') {
          snapshot[data[i][2]] = data[i][3];
        }
      }
      return snapshot;
    } catch (e) {
      return {};
    }
  },

  _saveSnapshot: function(currentFiles) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Code_Snapshots');
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][4] === 'active') {
          sheet.getRange(i + 1, 5).setValue('archived');
        }
      }
      var timestamp = DateTimeUtils.nowWIB();
      Object.keys(currentFiles).forEach(function(fileName) {
        var id = IdGenerator.generate('SNAP');
        SpreadsheetGateway.appendRowSafe('Code_Snapshots', [
          id, timestamp, fileName, currentFiles[fileName].hash, 'active'
        ]);
      });
    } catch (e) {
      AppLogger.error('CHANGE_DETECT_SNAPSHOT_SAVE_FAIL', e.message);
    }
  },

  _compareWithSnapshot: function(currentFiles, snapshot) {
    var added = [], modified = [], deleted = [];
    Object.keys(currentFiles).forEach(function(f) {
      if (!snapshot[f]) added.push(f);
      else if (snapshot[f] !== currentFiles[f].hash) modified.push(f);
    });
    Object.keys(snapshot).forEach(function(f) {
      if (!currentFiles[f]) deleted.push(f);
    });
    return { added: added, modified: modified, deleted: deleted,
             total: added.length + modified.length + deleted.length };
  },

  _buildReport: function(changes) {
    var report = '📊 *Deteksi Perubahan Kode*\n\n';
    if (changes.added.length > 0) {
      report += '🟢 *Baru (' + changes.added.length + '):*\n';
      changes.added.forEach(function(f) { report += '• `' + f + '`\n'; });
      report += '\n';
    }
    if (changes.modified.length > 0) {
      report += '🟡 *Berubah (' + changes.modified.length + '):*\n';
      changes.modified.forEach(function(f) { report += '• `' + f + '`\n'; });
      report += '\n';
    }
    if (changes.deleted.length > 0) {
      report += '🔴 *Dihapus (' + changes.deleted.length + '):*\n';
      changes.deleted.forEach(function(f) { report += '• `' + f + '`\n'; });
      report += '\n';
    }
    report += 'Total: ' + changes.total + ' perubahan.';
    return report;
  },

  _checkDocSync: function(changes) {
    var issues = [];
    var all = changes.added.concat(changes.modified);
    all.forEach(function(f) {
      if (f.indexOf('08_Specialist_') === 0)
        issues.push('Specialist baru/berubah: `' + f + '` — cek ARCHITECTURE.md §4');
      if (f.indexOf('11_Trigger_') === 0)
        issues.push('Trigger baru/berubah: `' + f + '` — cek ARCHITECTURE.md §5');
      if (f.indexOf('04_Repository_') === 0)
        issues.push('Repository baru/berubah: `' + f + '` — cek ARCHITECTURE.md §6');
    });
    return issues;
  }
};