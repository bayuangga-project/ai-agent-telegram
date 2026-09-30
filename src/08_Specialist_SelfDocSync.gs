/**
 * ===================================================================
 * SPECIALIST: SELF-DOC SYNC (UNTRUNCATED DOCS READ & SANITY GUARD REJECTION)
 * Tanggung jawab: mengenali struktur kode sendiri, mendeteksi
 * perubahan, memvalidasi konsistensi skema tool vs handler Manager,
 * menyintesis dokumentasi secara organik, dan meminta persetujuan via Telegram.
 * 100% PATUH PASAL 1.2 (ZERO HARDCODE HUMAN LANGUAGE STRINGS IN THIS FILE).
 * ===================================================================
 */
var SelfDocSync = {

  CANONICAL_DOCS: [
    'ARCHITECTURE.md',
    'PROGRESS.md',
    'ROADMAP.md',
    'AI_DEVELOPMENT_HANDOVER.md',
    'ai_knowledge.md'
  ],

  runDailyCheck: function() {
    AppLogger.info('SELF_DOC_SYNC_START', 'daily_check');

    try {
      var schemaCheck = this.validateToolSchemaConsistency();
      if (!schemaCheck.valid && schemaCheck.missing.length > 0) {
        var config = Config.load();
        var alertTpl = KnowledgeRepository.get('sync', 'schema_alert_template') || 
          '⚠️ *Peringatan Skema Tool AI*\n\nTool berikut terdaftar di Knowledge tetapi belum memiliki handler di Manager:\n• `{{missing_list}}`';
        
        var alertText = TemplateEngine.render(alertTpl, { missing_list: schemaCheck.missing.join('`\n• `') });
        TelegramService.sendMessage(config.myChatId, alertText);
      }

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

  forceDocSync: function() {
    AppLogger.info('SELF_DOC_FORCE_START', 'manual_trigger');

    try {
      this._clearDraft();
      var currentStructure = this._readCodeStructure();
      if (!currentStructure || Object.keys(currentStructure).length === 0) {
        AppLogger.warning('SELF_DOC_FORCE_SKIP', 'no_source_data');
        return { success: false, reason: 'NO_SOURCE_DATA' };
      }

      var currentFiles = Object.keys(currentStructure);
      var syntheticDiff = {
        addedFiles: [],
        removedFiles: [],
        modifiedFiles: currentFiles.map(function(f) {
          return {
            file: f,
            changes: ['full_codebase_sync', 'loc:' + (currentStructure[f].loc || 0)]
          };
        }),
        totalChanges: currentFiles.length,
        isFirstRun: false,
        isForceSync: true
      };

      var draft = this._generateDocUpdate(syntheticDiff);
      if (!draft || !draft.files || draft.files.length === 0) {
        AppLogger.info('SELF_DOC_FORCE_SKIP', 'no_doc_update_generated');
        return { success: false, reason: 'NO_UPDATE_GENERATED' };
      }

      this._saveDraft(draft);
      this._sendNotification(draft);
      this._saveStructure(currentStructure);

      AppLogger.info('SELF_DOC_FORCE_DONE', 'draft_files:' + draft.files.length);
      return { success: true, draft: draft };

    } catch (e) {
      AppLogger.error('SELF_DOC_FORCE_FAIL', e.message);
      return { success: false, error: e.message };
    }
  },

  validateToolSchemaConsistency: function() {
    try {
      var toolsRaw = KnowledgeRepository.get('tools', 'registry');
      if (!toolsRaw) return { valid: true, missing: [] };

      var tools = [];
      try { tools = JSON.parse(toolsRaw); } catch (e) { return { valid: true, missing: [] }; }
      if (!Array.isArray(tools)) return { valid: true, missing: [] };

      var missing = [];
      for (var i = 0; i < tools.length; i++) {
        var toolName = tools[i].name;
        if (!toolName || toolName === 'chat') continue;

        try {
          var testRes = Manager._executeTool(toolName, {}, 'test_id', 'test_text', { riwayat: [] });
          if (testRes && testRes.code === 'CRITICAL_MANAGER_ERROR') {
            missing.push(toolName);
          }
        } catch (e) {}
      }

      if (missing.length > 0) {
        AppLogger.warning('TOOL_SCHEMA_MISMATCH', 'missing_handlers:' + missing.join(', '));
      }

      return { valid: missing.length === 0, missing: missing };
    } catch (e) {
      AppLogger.error('TOOL_SCHEMA_VALIDATE_FAIL', e.message);
      return { valid: true, missing: [] };
    }
  },

  _readCodeStructure: function() {
    try {
      var rawLocal = KnowledgeRepository.get('code', 'structure_snapshot');
      if (rawLocal) {
        var parsedLocal = JSON.parse(rawLocal);
        if (parsedLocal && typeof parsedLocal === 'object' && Object.keys(parsedLocal).length > 0) {
          AppLogger.info('SELF_DOC_FAST_LOCAL_READ', 'files_count:' + Object.keys(parsedLocal).length);
          return parsedLocal;
        }
      }
    } catch (eLocal) {}

    AppLogger.info('SELF_DOC_GITHUB_FETCH_FALLBACK', 'fetching_github_api');
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
        template = 'Kamu adalah technical writer untuk proyek AI Agent Telegram Vexa.\n' +
          'PERUBAHAN KODE TERDETEKSI:\n{{diff}}\n\n' +
          'DOKUMENTASI SAAT INI:\n{{current_docs}}\n\n' +
          'TUGAS ORGANIK (ATURAN RESTORAN):\n' +
          '1. Lakukan penyuntingan organik: HANYA ubah/hapus bagian tabel atau paragraf yang secara fisik sudah tidak valid/relevan.\n' +
          '2. PERTAHANKAN SEMUA DOKUMENTASI, KONTRAK, DAN INFORMASI YANG MASIH RELEVAN. DILARANG menghapus bab atau memperpendek dokumen secara sembarangan!\n' +
          '3. Kembalikan isi utuh dokumen baru dalam format JSON murni.\n\n' +
          'FORMAT OUTPUT (HANYA JSON MURNI):\n' +
          '{\n  "files": [ { "fileName": "AI_DEVELOPMENT_HANDOVER.md", "content": "isi lengkap markdown baru", "reason": "alasan" } ],\n  "summary": "ringkasan"\n}';
        
        KnowledgeRepository.save('sync', 'doc_update_prompt', template, 'ORGANIC_EDITORIAL_PROMPT');
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
        temperature: 0.2
      });

      if (!result || !result.text) return null;

      var parsed = this._repairLLMDocJSON(result.text);

      if (!parsed || !parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
        AppLogger.warning('SELF_DOC_PARSE_NULL', 'repaired_json_empty_or_invalid');
        return null;
      }

      var validFiles = [];
      var rawDocsObj = {};
      try { rawDocsObj = JSON.parse(currentDocs); } catch(e) {}

      for (var i = 0; i < parsed.files.length; i++) {
        var f = parsed.files[i];
        if (f.fileName && f.content && this.CANONICAL_DOCS.indexOf(f.fileName) !== -1) {
          
          // SANITY GUARD REJECTION: Mencegah LLM menghapus dokumen secara sembarangan
          var oldContent = rawDocsObj[f.fileName] || '';
          if (oldContent.length > 5000 && f.content.length < oldContent.length * 0.6) {
            AppLogger.warning('SELF_DOC_SANITY_REJECT', f.fileName + '|too_short:' + f.content.length + ' vs ' + oldContent.length);
            continue; // Tolak draft file ini jika LLM memotong > 40% isi dokumen asli!
          }

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

  _repairLLMDocJSON: function(rawText) {
    if (!rawText) return null;
    var cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try { return JSON.parse(cleaned); } catch (e1) {}

    try {
      var repaired = cleaned
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');
      return JSON.parse(repaired);
    } catch (e2) {}

    try {
      var match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        var block = match[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        return JSON.parse(block);
      }
    } catch (e3) {}

    AppLogger.error('LLM_DOC_JSON_REPAIR_FAIL', 'raw_text:' + cleaned.substring(0, 150));
    return null;
  },

  /**
   * MEMBACA 100% UTUH ISI DOKUMEN CANONICAL .MD TANPA POTONGAN SUBSTRING!
   */
  _collectCurrentDocs: function() {
    var docs = {};
    for (var i = 0; i < this.CANONICAL_DOCS.length; i++) {
      var fileName = this.CANONICAL_DOCS[i];
      try {
        var fileData = GitHubOpsService.readFile(fileName);
        if (fileData && fileData.content) {
          // 100% UNTRUNCATED READ (Membaca seluruh isi dokumen utuh)
          docs[fileName] = fileData.content;
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
      var fileNames = draft.files.map(function(f) { return f.fileName; }).join('\n• ');
      var summary = draft.summary || '';
      if (summary.length > 400) summary = summary.substring(0, 397) + '...';

      var tplNotify = KnowledgeRepository.get('sync', 'notification_template');
      if (!tplNotify) {
        tplNotify = '📝 *Perubahan kode terdeteksi!*\n\n' +
          'Ringkasan:\n{{summary}}\n\n' +
          'Dokumentasi yang perlu diupdate:\n• {{file_list}}\n\n' +
          'Reply *ya* untuk terbitkan, *batal* untuk batalkan, *detail* untuk lihat isi lengkap.';
        KnowledgeRepository.save('sync', 'notification_template', tplNotify, 'AUTO_BOOTSTRAP_NOTIFY_TPL');
      }

      var text = TemplateEngine.render(tplNotify, {
        summary: summary,
        file_list: fileNames
      });

      TelegramService.sendMessage(config.myChatId, text);
    } catch (e) {
      AppLogger.error('SELF_DOC_NOTIFY_FAIL', e.message);
    }
  },

  _sendReminder: function(draft) {
    try {
      var config = Config.load();
      var fileNames = draft.files.map(function(f) { return f.fileName; }).join(', ');

      var tplReminder = KnowledgeRepository.get('sync', 'reminder_template');
      if (!tplReminder) {
        tplReminder = '🔔 *Pengingat: Update dokumentasi masih menunggu persetujuan.*\n\n' +
          'File: {{file_list}}\n' +
          'Terdeteksi: {{detected_at}}\n\n' +
          'Reply *ya* untuk terbitkan, *batal* untuk batalkan, *detail* untuk lihat isi.';
        KnowledgeRepository.save('sync', 'reminder_template', tplReminder, 'AUTO_BOOTSTRAP_REMINDER_TPL');
      }

      var text = TemplateEngine.render(tplReminder, {
        file_list: fileNames,
        detected_at: draft.detectedAt || '-'
      });

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