/**
 * ===================================================================
 * SPESIALIS: SYNC ORCHESTRATOR
 * Koordinator sentral untuk sinkronisasi Knowledge, Docs, dan Database.
 * ===================================================================
 */
const SyncOrchestrator = {

  assessState() {
    return {
      knowledge: this._assessKnowledge(),
      documentation: this._assessDocumentation(),
      sheets: this._assessSheetStructure(),
      last_sync: this._getLastSyncTimestamp()
    };
  },

  executeSync(scope) {
    var results = {};

    if (scope === 'pull' || scope === 'full' || scope === 'auto') {
      results.knowledge_pull = this._pullKnowledge();
    }

    if (scope === 'backup' || scope === 'full' || scope === 'auto') {
      results.knowledge_backup = this._backupKnowledge();
    }

    if (scope === 'docs' || scope === 'full' || scope === 'auto') {
      results.documentation = this._syncDocumentation();
    }

    if (scope === 'sheets' || scope === 'full' || scope === 'auto') {
      results.sheets = this._ensureSheets();
    }

    this._saveSyncTimestamp();

    var totalActions = 0;
    var totalSkipped = 0;
    var errors = [];
    var keys = Object.keys(results);
    for (var i = 0; i < keys.length; i++) {
      var r = results[keys[i]];
      if (!r) continue;
      if (r.status === 'error') errors.push({ area: keys[i], reason: r.reason });
      if (r.actions) totalActions += r.actions;
      if (r.skipped) totalSkipped += r.skipped;
    }

    return {
      scope: scope,
      results: results,
      summary: {
        total_actions: totalActions,
        total_skipped: totalSkipped,
        total_errors: errors.length,
        errors: errors
      }
    };
  },

  autoDocument(changeDescription) {
    try {
      AppLogger.info('AUTO_DOC_TRIGGERED', changeDescription);
      var docResult = this._syncDocumentation();
      var backupResult = this._backupKnowledge();
      return {
        documentation: docResult,
        knowledge_backup: backupResult,
        change: changeDescription
      };
    } catch (e) {
      AppLogger.error('AUTO_DOC_FAILED', e.message);
      return { status: 'error', reason: e.message };
    }
  },

  _assessKnowledge() {
    try {
      var sheetData = KnowledgeRepository.getAll();
      return { status: 'available', entries: sheetData ? sheetData.length : 0 };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _assessDocumentation() {
    try {
      var files = GitHubOpsService.readAllSourceFiles();
      if (!files) return { status: 'available', source_files: 0 };
      return { status: 'available', source_files: Object.keys(files).length };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _assessSheetStructure() {
    try {
      var ss = SpreadsheetGateway.getSpreadsheet();
      var sheets = ss.getSheets().map(function(s) { return s.getName(); });
      return { status: 'available', existing_sheets: sheets };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _getLastSyncTimestamp() {
    return KnowledgeRepository.get('sync', 'last_timestamp');
  },

  _saveSyncTimestamp() {
    var now = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    KnowledgeRepository.save('sync', 'last_timestamp', now, 'SYNC_AUTO');
  },

  _pullKnowledge() {
    try {
      var before = KnowledgeRepository.getAll();
      var countBefore = before ? before.length : 0;
      var result = KnowledgeSyncSpecialist.sync();
      var after = KnowledgeRepository.getAll();
      var countAfter = after ? after.length : 0;
      var newEntries = countAfter - countBefore;
      return {
        status: 'success',
        direction: 'github_to_sheet',
        actions: newEntries > 0 ? newEntries : 0,
        skipped: newEntries === 0 ? 1 : 0
      };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _backupKnowledge() {
    try {
      var result = KnowledgeSyncSpecialist.pushSheetToGitHub();
      return {
        status: result.status === 'success' ? 'success' : 'skipped',
        direction: 'sheet_to_github',
        actions: result.status === 'success' ? 1 : 0,
        skipped: result.status === 'success' ? 0 : 1
      };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _syncDocumentation() {
    try {
      var result = DocSyncSpecialist.sync();
      return {
        status: result.success ? 'success' : 'error',
        direction: 'code_to_docs',
        actions: result.updated ? result.updated.length : 0,
        skipped: result.unchanged ? result.unchanged.length : 0
      };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _ensureSheets() {
    try {
      var sheetHeaders = {
        'Chat_History': ['id', 'timestamp', 'chatId', 'role', 'text'],
        'Memory_Facts': ['id', 'timestamp', 'chatId', 'category', 'fact', 'status'],
        'User_Profile': ['key', 'value', 'category', 'confidence', 'lastUpdated'],
        'Memory_Summaries': ['id', 'date', 'summary', 'topics', 'messageCount'],
        'Reminder_RawData': ['ID', 'TIMESTAMP', 'DESKRIPSI', 'WAKTU', 'STATUS', 'PRIORITAS', 'TERAKHIR_DIINGATKAN', 'CATATAN', 'JENIS_RECURRING', 'RECURRING_CONFIG', 'JUMLAH_DIINGATKAN'],
        'Reminder_AckPatterns': ['id', 'timestamp', 'pesanUser', 'interpretasi', 'aksi'],
        'Finance_Wallets': ['id', 'nama', 'saldoAwal', 'createdAt'],
        'Finance_Transactions': ['id', 'timestamp', 'walletId', 'tanggalTransaksi', 'tipe', 'kategori', 'jumlah', 'deskripsi', 'status'],
        'Finance_Budgets': ['id', 'kategori', 'batasJumlah', 'periode', 'createdAt'],
        'Log_System': ['timestamp', 'jenisEvent', 'detail', 'status'],
        'Knowledge': ['id', 'namespace', 'key', 'content', 'version', 'active', 'updated_at', 'notes'],
        'Documentation': ['fileName', 'content', 'sha', 'lastSyncedAt', 'fileType'],
        'SelfHeal_Patches': ['id', 'timestamp', 'fileName', 'diagnosis', 'patchedCode', 'status'],
        'Audit_Reports': ['id', 'timestamp', 'type', 'findingsCount', 'status'],
        'Audit_Findings': ['id', 'reportId', 'file', 'line', 'severity', 'description', 'status'],
        'Code_Snapshots': ['id', 'timestamp', 'fileName', 'hash', 'status'],
        'Roadmap_Items': ['feature', 'category', 'priority', 'status', 'notes'],
        'Self_Reviews': ['id', 'timestamp', 'focus', 'score', 'summary'],
        'Soul_Episodic_Memory': ['id', 'timestamp', 'eventType', 'context', 'outcome', 'emotionalState', 'details'],
        'Soul_Meta_Memory': ['id', 'timestamp', 'insight', 'source', 'confidence'],
        'Soul_User_Patterns': ['id', 'timestamp', 'pattern', 'frequency', 'lastSeen'],
        'AI_Knowledge': ['id', 'namespace', 'key', 'content', 'version', 'active', 'updated_at', 'notes']
      };

      var required = Object.keys(sheetHeaders);
      var ss = SpreadsheetGateway.getSpreadsheet();
      var existing = ss.getSheets().map(function(s) { return s.getName(); });
      var created = 0;
      var skipped = 0;

      for (var i = 0; i < required.length; i++) {
        var name = required[i];
        if (existing.indexOf(name) >= 0) {
          skipped++;
        } else {
          SpreadsheetGateway.ensureSheet(name, sheetHeaders[name]);
          created++;
        }
      }
      return { status: 'success', actions: created, skipped: skipped };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  }
};