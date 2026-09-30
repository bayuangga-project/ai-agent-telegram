/**
 * ===================================================================
 * SPESIALIS: SELF-AWARENESS (FULL CANONICAL DOCS INGESTION & LINE INDEX)
 * Tanggung jawab: Mengindeks file .gs fisik, objek, metode, dan nomor baris,
 * serta menyajikan SELURUH ISI 5 DOKUMEN .MD KANONIK untuk kesadaran diri utuh
 * tanpa halusinasi Node.js/.env/python.
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

  /**
   * Mengindeks seluruh file .gs, nama objek, nama metode, dan NOMOR BARIS FISIK
   */
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
        KnowledgeRepository.save('code', 'line_index', JSON.stringify(indexList.slice(0, 200)), 'LINE_INDEX_UPDATE');
      }

      return indexList;
    } catch (e) {
      AppLogger.error('CODE_INDEX_BUILD_FAIL', e.message);
      return [];
    }
  },

  /**
   * Mencari lokasi file & nomor baris berdasarkan kata kunci fungsi/objek
   */
  searchCodeLocation(keyword) {
    if (!keyword) return [];
    var cleanKw = String(keyword).toLowerCase().trim();

    var rawIndex = KnowledgeRepository.get('code', 'line_index');
    var indexList = [];
    if (rawIndex) {
      try { indexList = JSON.parse(rawIndex); } catch (e) {}
    }

    if (indexList.length === 0) {
      indexList = this.buildCodeLineIndex();
    }

    var matches = [];
    for (var i = 0; i < indexList.length; i++) {
      var item = indexList[i];
      if (item.file.toLowerCase().indexOf(cleanKw) !== -1 || 
          item.method.toLowerCase().indexOf(cleanKw) !== -1) {
        matches.push(item);
      }
    }

    return matches.slice(0, 15);
  },

  _gatherSelfData() {
    var data = {
      stackContract: {
        platform: "Google Apps Script V8 (.gs)",
        database: "Google Sheets (SpreadsheetGateway) & Money Tracker V19.3",
        configStorage: "Script Properties (PropertiesService)",
        codeFramework: "Object Literals (const X = {})",
        bannedHallucinations: [".env", "Node.js", "npm", "index.js", "process.env", "express", "GoogleGenAI SDK", "llm_service.py", "agent_runner.py"]
      },
      codeStructure: {},
      fileList: [],
      codeLineIndexSample: [],
      sheetList: [],
      canonicalDocsContent: {}, // FULL 5 CANONICAL DOCS INGESTION
      intentList: [
        'ack_reminder', 'buat_reminder', 'chat_biasa', 'catat_keuangan',
        'tanya_saldo', 'ringkasan_keuangan', 'atur_budget', 'edit_transaksi',
        'sync_documentation', 'diagnose_error', 'update_docs', 'audit_code',
        'fix_audit', 'check_changes', 'roadmap_query', 'implement_feature',
        'self_query', 'soul_query', 'soul_init', 'soul_memory_query'
      ],
      commandList: ['/ingat', '/diagnose', '/logs', '/patch', '/build', '/soul', '/init-soul', '/memory', '/export_ns', '/help', '/llm'],
      errorLogs: [],
      logStats: { total: 0, errors: 0, errorRatePercent: 0 },
      userKnowledge: { facts: [], profile: [] }
    };

    // A. Membaca Peta Struktur Kode Fisik dari Knowledge Database
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

    // B. Membaca SELURUH ISI 5 DOKUMEN .MD KANONIK
    try {
      var docs = DocumentationRepository.getAll();
      var canonicalTargets = ['ARCHITECTURE.md', 'PROGRESS.md', 'ROADMAP.md', 'AI_DEVELOPMENT_HANDOVER.md'];
      for (var d = 0; d < docs.length; d++) {
        if (canonicalTargets.indexOf(docs[d].fileName) !== -1) {
          data.canonicalDocsContent[docs[d].fileName] = docs[d].content;
        }
      }
      
      // Tambahkan ai_knowledge.md dari Knowledge
      var aiKnowledgeContent = KnowledgeRepository.get('docsync', 'canonical_files');
      if (aiKnowledgeContent) {
        data.canonicalDocsContent['ai_knowledge.md'] = aiKnowledgeContent;
      }
    } catch (e4) {}

    // C. Membaca Daftar Sheet Aktif
    try {
      var ss = SpreadsheetGateway.getSpreadsheet();
      data.sheetList = ss.getSheets().map(function(s) { return s.getName(); });
    } catch (e5) {}

    // D. Membaca Log Error Terakhir
    try {
      var sheet = SpreadsheetGateway.getSheet('Log_System');
      var logData = sheet.getDataRange().getValues();
      if (logData.length > 1) {
        var errors = [];
        var totalLogs = logData.length - 1;
        var errCount = 0;

        for (var i = logData.length - 1; i >= 1; i--) {
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

    // E. Membaca Data User
    try {
      data.userKnowledge.facts = KnowledgeSpecialist.getActiveFactsForPrompt(10) || [];
      data.userKnowledge.profile = UserProfileSpecialist.getProfileForPrompt(10) || [];
    } catch (e7) {}

    return data;
  }
};