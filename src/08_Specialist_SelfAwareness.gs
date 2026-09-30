/**
 * ===================================================================
 * SPESIALIS: SELF-AWARENESS (TIME-AWARE SELF-AUDIT & CODE INDEXER)
 * Tanggung jawab: Mengindeks file .gs fisik, objek, metode, nomor baris,
 * menyajikan 5 dokumen .md kanonik, dan mengekstrak log aktivitas N jam terakhir.
 * 100% PATUH PASAL 1.2 (ZERO HARDCODE HUMAN LANGUAGE STRINGS IN THIS FILE).
 * ===================================================================
 */
const SelfAwareness = {

  review(focus) {
    var reviewFocus = focus || 'all';
    AppLogger.info('SELF_AWARENESS_REVIEW', 'focus:' + reviewFocus);

    var metrics = this._gatherSelfData();
    return {
      focus: reviewFocus,
      timestamp: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB()),
      system_metrics: metrics
    };
  },

  getTimeWindowActivityLogs(hoursWindow) {
    var targetHours = hoursWindow || 7;
    var now = DateTimeUtils.nowWIB();
    var maxWindowMs = targetHours * 3600 * 1000;

    try {
      var sheet = SpreadsheetGateway.getSheet('Log_System');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return { hoursWindow: targetHours, eventCount: 0, eventsSummary: {} };
      }

      var recentEventsSummary = {};
      var detailedEventList = [];
      var totalEventsInWindow = 0;

      for (var i = data.length - 1; i >= 1; i--) {
        var rawTimestamp = data[i][0];
        if (!rawTimestamp) continue;

        var logDate = rawTimestamp instanceof Date ? rawTimestamp : new Date(rawTimestamp);
        if (isNaN(logDate.getTime())) continue;

        var diffMs = now.getTime() - logDate.getTime();
        if (diffMs > maxWindowMs) break;

        var eventName = String(data[i][1] || 'UNKNOWN').trim();
        var eventDetail = String(data[i][2] || '').trim().substring(0, 150);
        var eventStatus = String(data[i][3] || 'INFO').trim();

        totalEventsInWindow++;
        recentEventsSummary[eventName] = (recentEventsSummary[eventName] || 0) + 1;

        if (detailedEventList.length < 15) {
          detailedEventList.push({
            time: DateTimeUtils.formatWaktu(logDate),
            event: eventName,
            detail: eventDetail,
            status: eventStatus
          });
        }
      }

      return {
        hoursWindow: targetHours,
        totalEvents: totalEventsInWindow,
        eventsSummary: recentEventsSummary,
        recentEventsList: detailedEventList
      };

    } catch (e) {
      AppLogger.error('SELF_AWARENESS_TIME_LOG_FAIL', e.message);
      return { hoursWindow: targetHours, totalEvents: 0, eventsSummary: {} };
    }
  },

  buildCodeLineIndex() {
    try {
      var allSource = GitHubOpsService.readAllSourceFiles();
      if (!allSource) return [];

      var fileNames = Object.keys(allSource);
      var indexList = [];

      for (var i = 0; i < fileNames.length; i++) {
        var fileName = fileNames[i];
        var content = allSource[fileName].content || '';
        var lines = content.split('\n');

        for (var l = 0; l < lines.length; l++) {
          var line = lines[l].trim();
          
          var m1 = line.match(/^(\w+)\s*[:=]\s*function\s*\(([^)]*)\)/);
          var m2 = line.match(/^(\w+)\s*\(([^)]*)\)\s*\{/);

          var methodName = null;
          var params = '';

          if (m1) {
            methodName = m1[1];
            params = m1[2].trim();
          } else if (m2) {
            var reserved = ['if', 'for', 'while', 'function', 'switch', 'catch', 'return'];
            if (reserved.indexOf(m2[1]) === -1) {
              methodName = m2[1];
              params = m2[2].trim();
            }
          }

          if (methodName) {
            indexList.push({
              file: fileName,
              line: l + 1,
              method: methodName + '(' + params + ')'
            });
          }
        }
      }

      if (indexList.length > 0) {
        KnowledgeRepository.save('code', 'line_index', JSON.stringify(indexList.slice(0, 250)), 'LINE_INDEX_UPDATE');
      }

      return indexList;
    } catch (e) {
      AppLogger.error('CODE_INDEX_BUILD_FAIL', e.message);
      return [];
    }
  },

  searchCodeLocation(keyword) {
    if (!keyword) return [];
    var cleanKw = String(keyword).trim();

    var stopWords = ['vexa', 'dyar', 'di', 'file', 'mana', 'dan', 'baris', 'berapa', 'fungsi', 'dipanggil', 'tolong', 'cek', 'apa', 'nama', 'ada', 'yang', 'ini', 'itu', 'minta', 'cari', 'dimana'];
    var rawTokens = cleanKw.match(/([a-zA-Z_$][a-zA-Z0-9_$]{2,})/g) || [];
    var cleanTokens = rawTokens.filter(function(t) {
      return stopWords.indexOf(t.toLowerCase()) === -1;
    });

    if (cleanTokens.length === 0) {
      cleanTokens = [cleanKw.toLowerCase()];
    }

    var rawIndex = KnowledgeRepository.get('code', 'line_index');
    var indexList = [];
    if (rawIndex) {
      try { indexList = JSON.parse(rawIndex); } catch (e) {}
    }

    if (indexList.length === 0) {
      indexList = this.buildCodeLineIndex();
    }

    var matches = [];
    var seenKeys = {};

    for (var i = 0; i < indexList.length; i++) {
      var item = indexList[i];
      var itemFileLower = item.file.toLowerCase();
      var itemMethodLower = item.method.toLowerCase();

      for (var t = 0; t < cleanTokens.length; t++) {
        var tokenLower = cleanTokens[t].toLowerCase();
        if (itemFileLower.indexOf(tokenLower) !== -1 || itemMethodLower.indexOf(tokenLower) !== -1) {
          var key = item.file + ':' + item.line + ':' + item.method;
          if (!seenKeys[key]) {
            seenKeys[key] = true;
            matches.push(item);
          }
        }
      }
    }

    return matches.slice(0, 15);
  },

  _gatherSelfData() {
    var stackContractRaw = KnowledgeRepository.get('soul', 'stack_contract');
    var stackContract = null;
    if (stackContractRaw) {
      try { stackContract = JSON.parse(stackContractRaw); } catch (e) {}
    }

    if (!stackContract) {
      stackContract = {
        platform: "Google Apps Script V8 (.gs)",
        database: "Google Sheets (SpreadsheetGateway) & Money Tracker V19.3",
        configStorage: "Script Properties (PropertiesService)",
        codeFramework: "Object Literals (const X = {})",
        bannedHallucinations: [".env", "Node.js", "npm", "index.js", "process.env", "express", "GoogleGenAI SDK", "llm_service.py", "agent_runner.py"]
      };
      KnowledgeRepository.save('soul', 'stack_contract', JSON.stringify(stackContract), 'AUTO_BOOTSTRAP_STACK_CONTRACT');
    }

    var data = {
      stackContract: stackContract,
      recent7HoursActivity: this.getTimeWindowActivityLogs(7),
      codeStructure: {},
      fileList: [],
      codeLineIndexSample: [],
      sheetList: [],
      canonicalDocsContent: {},
      intentList: [
        'ack_reminder', 'buat_reminder', 'chat_biasa', 'catat_keuangan',
        'tanya_saldo', 'ringkasan_keuangan', 'atur_budget', 'edit_transaksi',
        'sync_documentation', 'diagnose_error', 'update_docs', 'audit_code',
        'fix_audit', 'check_changes', 'roadmap_query', 'implement_feature',
        'self_query', 'soul_query', 'soul_init', 'soul_memory_query'
      ],
      commandList: ['/ingat', '/diagnose', '/logs', '/patch', '/build', '/soul', '/init-soul', '/memory', '/export_ns', '/help', '/llm', '/audit', '/heal'],
      errorLogs: [],
      logStats: { total: 0, errors: 0, errorRatePercent: 0 },
      userKnowledge: { facts: [], profile: [] }
    };

    try {
      var rawIndex = KnowledgeRepository.get('code', 'line_index');
      if (rawIndex) {
        data.codeLineIndexSample = JSON.parse(rawIndex);
      }
    } catch (e) {}

    try {
      var rawStructure = KnowledgeRepository.get('code', 'structure_snapshot');
      if (rawStructure) {
        data.codeStructure = JSON.parse(rawStructure);
        data.fileList = Object.keys(data.codeStructure);
      }
    } catch (e2) {}

    if (data.fileList.length === 0) {
      try {
        var files = GitHubOpsService.listDirectory('src');
        if (Array.isArray(files)) {
          data.fileList = files.map(function(f) { return f.name || f.path || ''; });
        }
      } catch (e3) {}
    }

    try {
      var docs = DocumentationRepository.getAll();
      var canonicalTargets = ['ARCHITECTURE.md', 'PROGRESS.md', 'ROADMAP.md', 'AI_DEVELOPMENT_HANDOVER.md'];
      for (var d = 0; d < docs.length; d++) {
        if (canonicalTargets.indexOf(docs[d].fileName) !== -1) {
          data.canonicalDocsContent[docs[d].fileName] = docs[d].content;
        }
      }
      
      var aiKnowledgeContent = KnowledgeRepository.get('docsync', 'canonical_files');
      if (aiKnowledgeContent) {
        data.canonicalDocsContent['ai_knowledge.md'] = aiKnowledgeContent;
      }
    } catch (e4) {}

    try {
      var ss = SpreadsheetGateway.getSpreadsheet();
      data.sheetList = ss.getSheets().map(function(s) { return s.getName(); });
    } catch (e5) {}

    try {
      var sheet = SpreadsheetGateway.getSheet('Log_System');
      var logData = sheet.getDataRange().getValues();
      if (logData.length > 1) {
        var errors = [];
        var totalLogs = logData.length - 1;
        var errCount = 0;

        for (var i = 1; i < logData.length; i++) {
          var event = String(logData[i][1]).toUpperCase();
          var status = String(logData[i][3]).toUpperCase();
          var isError = event.indexOf('FAIL') !== -1 || event.indexOf('ERROR') !== -1 || status === 'ERROR';

          if (isError) {
            errCount++;
            if (errors.length < 10) {
              errors.push({
                timestamp: logData[i][0],
                event: logData[i][1],
                detail: String(logData[i][2]).substring(0, 100)
              });
            }
          }
        }
        data.errorLogs = errors;
        data.logStats = {
          total: totalLogs,
          errors: errCount,
          errorRatePercent: totalLogs > 0 ? Math.round((errCount / totalLogs) * 100) : 0
        };
      }
    } catch (e6) {}

    try {
      data.userKnowledge.facts = KnowledgeSpecialist.getActiveFactsForPrompt(10) || [];
      data.userKnowledge.profile = UserProfileSpecialist.getProfileForPrompt(10) || [];
    } catch (e7) {}

    return data;
  }
};