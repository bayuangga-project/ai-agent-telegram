/**
 * ===================================================================
 * SPESIALIS: KNOWLEDGE SYNC
 * Jembatan sinkronisasi 2 arah antara Sheet AI_Knowledge & GitHub.
 * ===================================================================
 */
const KnowledgeSyncSpecialist = {
  SYNC_FILE: 'ai_knowledge.md',
  NOTE_CODE: 'SYS_AUTO_SYNC',

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

  pushSheetToGitHub() {
    try {
      var allKnowledge = KnowledgeRepository.getAll();
      if (!allKnowledge || allKnowledge.length === 0) {
        return { status: 'empty', reason: 'no_data_in_sheet' };
      }

      var grouped = {};
      for (var i = 0; i < allKnowledge.length; i++) {
        var row = allKnowledge[i];
        if (row.active !== true && row.active !== 'TRUE') continue;
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

      var markdown = mdLines.join('\n');
      var existingFile = GitHubOpsService.readFile(this.SYNC_FILE);
      var sha = (existingFile && existingFile.sha) ? existingFile.sha : null;

      GitHubOpsService.commitFile(this.SYNC_FILE, markdown, 'knowledge:backup_from_sheet', null, sha);
      AppLogger.info('KNOWLEDGE_PUSH_SUCCESS', 'namespaces:' + namespaces.length);
      return { status: 'success', namespaces: namespaces.length, total_entries: allKnowledge.length };
    } catch (err) {
      AppLogger.error('KNOWLEDGE_PUSH_FAILED', err.message);
      return { status: 'error', reason: err.message };
    }
  }
};