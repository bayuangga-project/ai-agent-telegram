/**
 * ===================================================================
 * SPECIALIST: SELF-DOC SYNC
 * Tanggung jawab: mengenali struktur kode sendiri, mendeteksi
 * perubahan, menyesuaikan dokumentasi, dan meminta persetujuan
 * pengguna via Telegram sebelum push ke GitHub.
 * ===================================================================
 */
var SelfDocSync = {

  CANONICAL_DOCS: [
    'ARCHITECTURE.md',
    'PROGRESS.md',
    'ROADMAP.md',
    'AI_DEVELOPMENT_HANDOFF.md',
    'ai_knowledge.md'
  ],

  runDailyCheck: function() {
    AppLogger.info('SELF_DOC_SYNC_START', 'daily_check');

    try {
      var pending = this.getPendingDraft();
      if (pending) {
        this._sendReminder(pending);
        return;
      }

      var currentStructure = this._readCodeStructure();
      if (!currentStructure || Object.keys(currentStructure).length === 0) {
        AppLogger.warning('SELF_DOC_SYNC_SKIP', 'no_source_data');
        return;
      }

      var previousStructure = this._getPreviousStructure();
      var diff = this._compareStructure(currentStructure, previousStructure);

      if (diff.totalChanges === 0) {
        AppLogger.info('SELF_DOC_SYNC', 'no_changes');
        this._saveStructure(currentStructure);
        return;
      }

      var draft = this._generateDocUpdate(diff);
      if (!draft || !draft.files || draft.files.length === 0) {
        AppLogger.info('SELF_DOC_SYNC', 'no_doc_update_needed');
        this._saveStructure(currentStructure);
        return;
      }

      this._saveDraft(draft);
      this._sendNotification(draft);
      this._saveStructure(currentStructure);

      AppLogger.info('SELF_DOC_SYNC_DONE',
        'changes:' + diff.totalChanges + '|draft_files:' + draft.files.length);

    } catch (e) {
      AppLogger.error('SELF_DOC_SYNC_FAIL', e.message);
    }
  },

  _readCodeStructure: function() {
    var allSource = GitHubOpsService.readAllSourceFiles();
    if (!allSource) return null;

    var fileNames = Object.keys(allSource);
    var structure = {};
    var allObjects = [];

    for (var i = 0; i < fileNames.length; i++) {
      var name = fileNames[i];
      var fileData = allSource[name];
      var content = fileData.content || '';
      var sha = fileData.sha || '';

      var objects = this._extractObjects(content);
      var methods = this._extractMethods(content);
      var loc = content.split('\n').length;

      structure[name] = {
        sha: sha,
        loc: loc,
        objects: objects,
        methods: methods
      };

      for (var j = 0; j < objects.length; j++) {
        allObjects.push(objects[j]);
      }
    }

    for (var k = 0; k < fileNames.length; k++) {
      var fName = fileNames[k];
      var fContent = allSource[fName].content || '';
      structure[fName].dependencies = this._extractDependencies(fContent, allObjects, structure[fName].objects);
    }

    return structure;
  },

  _extractObjects: function(content) {
    var objects = [];
    var lines = content.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var match = line.match(/^(?:var|const|let)\s+(\w+)\s*=\s*\{/);
      if (match && match[1].charAt(0) === match[1].charAt(0).toUpperCase()) {
        objects.push(match[1]);
      }
    }
    return objects;
  },

  _extractMethods: function(content) {
    var methods = [];
    var lines = content.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var match1 = line.match(/^(\w+)\s*[:=]\s*function\s*\(([^)]*)\)/);
      if (match1) {
        methods.push(match1[1] + '(' + match1[2].trim() + ')');
        continue;
      }
      var match2 = line.match(/^(\w+)\s*\(([^)]*)\)\s*\{/);
      if (match2) {
        var reserved = ['if', 'for', 'while', 'function', 'switch', 'catch', 'return'];
        if (reserved.indexOf(match2[1]) === -1) {
          methods.push(match2[1] + '(' + match2[2].trim() + ')');
        }
      }
    }
    return methods;
  },

  _extractDependencies: function(content, allObjects, selfObjects) {
    var deps = [];
    for (var i = 0; i < allObjects.length; i++) {
      var obj = allObjects[i];
      if (selfObjects.indexOf(obj) !== -1) continue;
      var pattern = new RegExp('\\b' + obj + '\\.');
      if (pattern.test(content)) {
        deps.push(obj);
      }
    }
    return deps;
  },

  _getPreviousStructure: function() {
    try {
      var raw = KnowledgeRepository.get('code', 'structure_snapshot');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  _saveStructure: function(structure) {
    try {
      KnowledgeRepository.save('code', 'structure_snapshot',
        JSON.stringify(structure), 'auto-extracted');
    } catch (e) {
      AppLogger.error('SELF_DOC_STRUCTURE_SAVE_FAIL', e.message);
    }
  },

  _compareStructure: function(current, previous) {
    var added = [];
    var removed = [];
    var modified = [];

    if (!previous) {
      var currentFiles = Object.keys(current);
      return {
        addedFiles: currentFiles,
        removedFiles: [],
        modifiedFiles: [],
        totalChanges: currentFiles.length,
        isFirstRun: true
      };
    }

    var currentKeys = Object.keys(current);
    var previousKeys = Object.keys(previous);

    for (var i = 0; i < currentKeys.length; i++) {
      var f = currentKeys[i];
      if (!previous[f]) {
        added.push(f);
      } else if (current[f].sha !== previous[f].sha) {
        var changes = [];
        var currMethods = current[f].methods || [];
        var prevMethods = previous[f].methods || [];

        for (var m = 0; m < currMethods.length; m++) {
          if (prevMethods.indexOf(currMethods[m]) === -1) {
            changes.push('new_method:' + currMethods[m]);
          }
        }
        for (var n = 0; n < prevMethods.length; n++) {
          if (currMethods.indexOf(prevMethods[n]) === -1) {
            changes.push('removed_method:' + prevMethods[n]);
          }
        }

        var currDeps = current[f].dependencies || [];
        var prevDeps = previous[f].dependencies || [];
        for (var d = 0; d < currDeps.length; d++) {
          if (prevDeps.indexOf(currDeps[d]) === -1) {
            changes.push('new_dep:' + currDeps[d]);
          }
        }

        if (changes.length === 0) {
          changes.push('content_changed');
        }

        modified.push({ file: f, changes: changes });
      }
    }

    for (var j = 0; j < previousKeys.length; j++) {
      var pf = previousKeys[j];
      if (!current[pf]) {
        removed.push(pf);
      }
    }

    return {
      addedFiles: added,
      removedFiles: removed,
      modifiedFiles: modified,
      totalChanges: added.length + removed.length + modified.length,
      isFirstRun: false
    };
  },

  _generateDocUpdate: function(diff) {
    try {
      var template = KnowledgeRepository.get('sync', 'doc_update_prompt');
      if (!template) {
        AppLogger.error('SELF_DOC_NO_PROMPT', 'sync:doc_update_prompt missing');
        return null;
      }

      var currentDocs = this._collectCurrentDocs();
      var diffText = JSON.stringify(diff, null, 2);

      var prompt = TemplateEngine.render(template, {
        diff: diffText,
        current_docs: currentDocs
      });

      var result = LLMProviderService.generate({
        taskType: 'docsync_analysis',
        systemInstruction: prompt,
        messages: [{ role: 'user', text: 'Analyze and return JSON.' }],
        temperature: 0.3
      });

      if (!result || !result.text) return null;

      var cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var parsed = JSON.parse(cleaned);

      if (!parsed.files || parsed.files.length === 0) return null;

      var validFiles = [];
      for (var i = 0; i < parsed.files.length; i++) {
        var f = parsed.files[i];
        if (f.fileName && f.content && this.CANONICAL_DOCS.indexOf(f.fileName) !== -1) {
          validFiles.push(f);
        }
      }

      if (validFiles.length === 0) return null;

      return {
        files: validFiles,
        summary: parsed.summary || '',
        detectedAt: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB())
      };

    } catch (e) {
      AppLogger.error('SELF_DOC_GENERATE_FAIL', e.message);
      return null;
    }
  },

  _collectCurrentDocs: function() {
    var docs = {};
    for (var i = 0; i < this.CANONICAL_DOCS.length; i++) {
      var fileName = this.CANONICAL_DOCS[i];
      try {
        var fileData = GitHubOpsService.readFile(fileName);
        if (fileData && fileData.content) {
          docs[fileName] = fileData.content.substring(0, 8000);
        }
      } catch (e) {
        AppLogger.warning('SELF_DOC_READ_WARN', fileName + ':' + e.message);
      }
    }
    return JSON.stringify(docs, null, 2);
  },

  _saveDraft: function(draft) {
    try {
      KnowledgeRepository.save('sync', 'pending_draft',
        JSON.stringify(draft), 'awaiting_approval');
    } catch (e) {
      AppLogger.error('SELF_DOC_DRAFT_SAVE_FAIL', e.message);
    }
  },

  getPendingDraft: function() {
    try {
      var raw = KnowledgeRepository.get('sync', 'pending_draft');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  parseApproval: function(text) {
    var lower = text.toLowerCase().trim();
    var approveWords = ['ya', 'yes', 'setuju', 'oke', 'ok', 'iya', 'y', 'iy', 'yoi', 'sip', 'gas', 'lanjut'];
    var rejectWords = ['batal', 'tidak', 'no', 'tolak', 'n', 'batalkan', 'jangan', 'skip'];
    var detailWords = ['detail', 'lihat', 'tampilkan', 'cek', 'tunjuk'];

    for (var i = 0; i < approveWords.length; i++) {
      if (lower === approveWords[i]) return 'approve';
    }
    for (var j = 0; j < rejectWords.length; j++) {
      if (lower === rejectWords[j]) return 'reject';
    }
    for (var k = 0; k < detailWords.length; k++) {
      if (lower === detailWords[k]) return 'detail';
    }
    return null;
  },

  approveDraft: function() {
    var draft = this.getPendingDraft();
    if (!draft) return { success: false, reason: 'no_pending_draft' };

    var results = [];
    for (var i = 0; i < draft.files.length; i++) {
      var f = draft.files[i];
      try {
        var ok = GitHubOpsService.updateDocFile(
          f.fileName, f.content, 'selfdoc: auto-update ' + f.fileName
        );
        results.push({ file: f.fileName, success: ok });
      } catch (e) {
        results.push({ file: f.fileName, success: false, error: e.message });
      }
    }

    this._clearDraft();

    var successCount = 0;
    for (var j = 0; j < results.length; j++) {
      if (results[j].success) successCount++;
    }

    AppLogger.info('SELF_DOC_APPROVED',
      'pushed:' + successCount + '/' + results.length);

    return { success: true, results: results };
  },

  rejectDraft: function() {
    var draft = this.getPendingDraft();
    if (!draft) return { success: false, reason: 'no_pending_draft' };
    this._clearDraft();
    AppLogger.info('SELF_DOC_REJECTED', 'draft_cleared');
    return { success: true };
  },

  getDraftDetail: function() {
    var draft = this.getPendingDraft();
    if (!draft) return null;
    return draft;
  },

  _clearDraft: function() {
    try {
      KnowledgeRepository.deactivate('sync', 'pending_draft');
    } catch (e) {
      AppLogger.error('SELF_DOC_CLEAR_FAIL', e.message);
    }
  },

  _sendNotification: function(draft) {
    try {
      var config = Config.load();
      var fileNames = [];
      for (var i = 0; i < draft.files.length; i++) {
        fileNames.push(draft.files[i].fileName);
      }

      var msg = draft.summary || '';
      if (msg.length > 400) {
        msg = msg.substring(0, 397) + '...';
      }

      var text = '📝 *Perubahan kode terdeteksi!*\n\n' +
        'File yang berubah:\n' +
        this._formatFileList(draft) + '\n' +
        (msg ? '\n' + msg + '\n' : '') +
        '\nDokumentasi yang perlu diupdate:\n' +
        '• ' + fileNames.join('\n• ') + '\n\n' +
        'Reply *ya* untuk terbitkan, *batal* untuk batalkan, *detail* untuk lihat isi lengkap.';

      TelegramService.sendMessage(config.myChatId, text);
    } catch (e) {
      AppLogger.error('SELF_DOC_NOTIFY_FAIL', e.message);
    }
  },

  _sendReminder: function(draft) {
    try {
      var config = Config.load();
      var fileNames = [];
      for (var i = 0; i < draft.files.length; i++) {
        fileNames.push(draft.files[i].fileName);
      }

      var text = '🔔 *Pengingat: Update dokumentasi masih menunggu persetujuan.*\n\n' +
        'File: ' + fileNames.join(', ') + '\n' +
        'Terdeteksi: ' + (draft.detectedAt || '-') + '\n\n' +
        'Reply *ya* untuk terbitkan, *batal* untuk batalkan, *detail* untuk lihat isi.';

      TelegramService.sendMessage(config.myChatId, text);
      AppLogger.info('SELF_DOC_REMINDER_SENT', 'pending_since:' + draft.detectedAt);
    } catch (e) {
      AppLogger.error('SELF_DOC_REMINDER_FAIL', e.message);
    }
  },

  _formatFileList: function(draft) {
    var lines = [];
    for (var i = 0; i < draft.files.length; i++) {
      var f = draft.files[i];
      lines.push('• `' + f.fileName + '`' + (f.reason ? ' — ' + f.reason : ''));
    }
    return lines.join('\n');
  }
};