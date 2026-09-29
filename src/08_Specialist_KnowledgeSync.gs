/**
 * ===================================================================
 * SPESIALIS: KNOWLEDGE SYNC
 * Jembatan sinkronisasi 2 arah antara Sheet AI_Knowledge & GitHub.
 * Hanya mengekspor namespace yang terdaftar di whitelist.
 * ===================================================================
 */
const KnowledgeSyncSpecialist = {
  SYNC_FILE: 'ai_knowledge.md',
  NOTE_CODE: 'SYS_AUTO_SYNC',

  DEFAULT_NAMESPACES: [
    'intent', 'soul', 'tools', 'finance', 'docsync', 'benchmark',
    'selfheal', 'feature', 'roadmap', 'agent', 'sync', 'chat',
    'audit', 'selfaware', 'help'
  ],

  CRITICAL_NAMESPACES: ['intent', 'soul', 'tools', 'sync'],

  sync() {
    return this._pullFromGitHub();
  },

  bootstrap() {
    var existing = KnowledgeRepository.getByNamespace('intent');
    var hasData = Object.keys(existing).length > 0;
    if (hasData) {
      AppLogger.info('KNOWLEDGE_BOOTSTRAP_SKIP', 'sheet_not_empty');
      return { status: 'skipped', reason: 'sheet_not_empty' };
    }
    return this._pullFromGitHub();
  },

  _pullFromGitHub() {
    var fileData = GitHubOpsService.readFile(this.SYNC_FILE);
    if (!fileData || !fileData.content) {
      AppLogger.error('KNOWLEDGE_PULL_FAILED', 'empty_or_null');
      return { status: 'error', reason: 'no_content' };
    }

    var rawText = fileData.content;
    if (fileData.encoding === 'base64') {
      rawText = Utilities.newBlob(
        Utilities.base64Decode(rawText.replace(/\s/g, ''))
      ).getDataAsString();
    }

    var sections = rawText.split(/^##\s+/m);
    var count = 0;
    for (var i = 1; i < sections.length; i++) {
      var section = sections[i];
      var firstLineEnd = section.indexOf('\n');
      if (firstLineEnd === -1) continue;

      var header = section.substring(0, firstLineEnd).trim();
      var body = section.substring(firstLineEnd + 1).trim();
      var parts = header.split(':');
      if (parts.length !== 2) continue;

      KnowledgeRepository.save(parts[0].trim(), parts[1].trim(), body, this.NOTE_CODE);
      count++;
    }

    AppLogger.info('KNOWLEDGE_PULL_SUCCESS', 'sections:' + count);
    return { status: 'success', sections: count };
  },

  /**
   * Mengambil daftar namespace yang boleh diekspor dari Sheet.
   * Jika belum ada, gunakan default dan simpan.
   */
  getExportNamespaces() {
    var raw = KnowledgeRepository.get('sync', 'export_namespaces');
    if (raw) {
      try {
        var list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) return list;
      } catch (e) {}
    }
    
    // Bootstrap if missing or invalid
    KnowledgeRepository.save('sync', 'export_namespaces', JSON.stringify(this.DEFAULT_NAMESPACES), 'BOOTSTRAP');
    return this.DEFAULT_NAMESPACES.slice();
  },

  /**
   * Push HANYA namespace yang ada di whitelist ke GitHub.
   */
  pushSheetToGitHub() {
    try {
      var allKnowledge = KnowledgeRepository.getAll();
      if (!allKnowledge || allKnowledge.length === 0) {
        return { status: 'empty', reason: 'no_data_in_sheet' };
      }

      var exportList = this.getExportNamespaces();
      var grouped = {};
      var totalActive = 0;
      var totalFiltered = 0;
      var skippedNamespaces = {};

      for (var i = 0; i < allKnowledge.length; i++) {
        var row = allKnowledge[i];
        
        var isActive = row.active === true || String(row.active).toUpperCase() === 'TRUE';
        if (!isActive) continue;
        totalActive++;

        // Filter: hanya namespace yang ada di daftar export
        if (exportList.indexOf(row.namespace) === -1) {
          totalFiltered++;
          skippedNamespaces[row.namespace] = (skippedNamespaces[row.namespace] || 0) + 1;
          continue;
        }

        if (!row.namespace || !row.key) continue;

        if (!grouped[row.namespace]) grouped[row.namespace] = [];
        grouped[row.namespace].push({ key: row.key, content: row.content });
      }

      var namespaces = Object.keys(grouped).sort();
      
      if (namespaces.length === 0) {
        return { status: 'empty', reason: 'no_human_knowledge_to_push', total_active: totalActive, total_filtered: totalFiltered };
      }

      var mdLines = ['# AI Agent Knowledge Base', ''];
      var totalEntriesPushed = 0;
      
      for (var n = 0; n < namespaces.length; n++) {
        var ns = namespaces[n];
        var items = grouped[ns];
        for (var j = 0; j < items.length; j++) {
          mdLines.push('## ' + ns + ':' + items[j].key);
          mdLines.push(items[j].content);
          mdLines.push('');
          totalEntriesPushed++;
        }
      }

      var markdown = mdLines.join('\n');
      var existingFile = GitHubOpsService.readFile(this.SYNC_FILE);
      var sha = (existingFile && existingFile.sha) ? existingFile.sha : null;

      var commitOk = GitHubOpsService.commitFile(
        this.SYNC_FILE, 
        markdown, 
        'knowledge:backup_human_only', 
        null, 
        sha
      );

      if (!commitOk) return { status: 'error', reason: 'github_commit_failed' };

      AppLogger.info('KNOWLEDGE_PUSH_SUCCESS', 'namespaces:' + namespaces.length + '|entries:' + totalEntriesPushed);
      
      return { 
        status: 'success', 
        namespaces: namespaces.length, 
        total_entries: totalEntriesPushed,
        machine_data_filtered: totalFiltered,
        skipped_namespaces: skippedNamespaces
      };
    } catch (err) {
      AppLogger.error('KNOWLEDGE_PUSH_FAILED', err.message);
      return { status: 'error', reason: err.message };
    }
  },

  /**
   * Handler untuk command /export_ns dari Telegram
   */
  handleCommand(action, arg1, arg2) {
    var list = this.getExportNamespaces();

    if (action === 'list' || !action) {
      return '📋 *Daftar Namespace yang Diekspor ke GitHub:*\n\n' +
             list.map(function(ns, i) { return (i+1) + '. `' + ns + '`'; }).join('\n') +
             '\n\n💡 _Gunakan /export_ns add [nama] untuk menambah._';
    }

    if (action === 'add' && arg1) {
      var ns = arg1.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (list.indexOf(ns) !== -1) return '⚠️ Namespace `' + ns + '` sudah ada di daftar export.';
      list.push(ns);
      KnowledgeRepository.save('sync', 'export_namespaces', JSON.stringify(list), 'CMD_ADD');
      return '✅ Namespace `' + ns + '` berhasil ditambahkan ke daftar export.';
    }

    if (action === 'remove' && arg1) {
      var ns = arg1.toLowerCase().replace(/[^a-z0-9_]/g, '');
      var index = list.indexOf(ns);
      if (index === -1) return '⚠️ Namespace `' + ns + '` tidak ditemukan di daftar export.';
      
      if (this.CRITICAL_NAMESPACES.indexOf(ns) !== -1 && arg2 !== 'confirm') {
        return '⛔ *Peringatan Kritis*\nNamespace `' + ns + '` sangat penting untuk agen.\nYakin ingin menghapus dari export? Ketik: `/export_ns remove ' + ns + ' confirm`';
      }

      list.splice(index, 1);
      KnowledgeRepository.save('sync', 'export_namespaces', JSON.stringify(list), 'CMD_REMOVE');
      return '🗑️ Namespace `' + ns + '` berhasil dihapus dari daftar export.';
    }

    if (action === 'reset') {
      KnowledgeRepository.save('sync', 'export_namespaces', JSON.stringify(this.DEFAULT_NAMESPACES), 'CMD_RESET');
      return '♻️ Daftar export berhasil dikembalikan ke pengaturan pabrik (default).';
    }

    return '❓ Perintah tidak dikenal. Coba `/export_ns list` atau `/help`.';
  }
};