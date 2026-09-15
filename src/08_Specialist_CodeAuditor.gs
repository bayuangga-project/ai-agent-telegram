/**
 * SPECIALIST: CODE AUDITOR
 * Tanggung jawab: audit seluruh codebase, laporkan masalah,
 * dan perbaiki secara otomatis dengan konfirmasi user.
 */
var CodeAuditor = {

  /**
   * Entry point utama — dipanggil dari Manager atau CommandRouter.
   * @param {string} type - 'light' atau 'full'
   */
  runAudit: function(type) {
    var auditType = type || 'full';
    AppLogger.info('AUDIT_START', 'Type: ' + auditType);

    var data = this._collectData();
    if (!data || data.files.length === 0) {
      return '❌ Gagal membaca source code dari GitHub. Cek GITHUB_TOKEN.';
    }

    var categories = auditType === 'light'
      ? ['INTEGRITY', 'CONSISTENCY', 'ROBUSTNESS']
      : ['INTEGRITY', 'CONSISTENCY', 'ROBUSTNESS', 'SECURITY', 'PERFORMANCE', 'DEAD_CODE', 'DOC_SYNC'];

    var findings = this._analyzeInBatches(data, categories);

    if (!findings || findings.length === 0) {
      this._saveReport([], auditType);
      return '✅ Audit selesai! Kode kamu bersih, nggak ada masalah yang terdeteksi. Keren! 👏';
    }

    this._saveReport(findings, auditType);

    return this._formatReportForChat(findings, auditType);
  },

  /**
   * Entry point untuk trigger terjadwal.
   * Kirim laporan ke Telegram via TelegramService.
   */
  runScheduledAudit: function() {
    var dayOfWeek = new Date().getDay();
    var dayOfMonth = new Date().getDate();
    var type = (dayOfMonth === 1) ? 'full' : 'light';

    var report = this.runAudit(type);

    var config = Config.load();
    TelegramService.sendMessage(config.myChatId, report);
  },

  /**
   * Perbaiki masalah berdasarkan scope yang user pilih.
   * @param {string} scope - 'all', 'critical', 'critical+warning'
   */
  fixIssues: function(scope) {
    AppLogger.info('AUDIT_FIX_START', 'Scope: ' + scope);

    var findings = this._getLatestPendingFindings();
    if (!findings || findings.length === 0) {
      return '🤷 Nggak ada temuan audit yang perlu diperbaiki. Jalankan audit dulu ya.';
    }

    var filtered = this._filterByScope(findings, scope);
    if (filtered.length === 0) {
      return '🤷 Nggak ada temuan yang cocok dengan scope "' + scope + '".';
    }

    var fixes = this._generateFixes(filtered);
    if (!fixes || fixes.length === 0) {
      return '❌ Gagal generate perbaikan. Coba lagi nanti ya.';
    }

    var result = this._applyFixes(fixes, scope);
    this._markFindingsFixed(filtered);

    return result;
  },

  /**
   * Cek apakah sudah waktunya menawarkan audit ke user.
   * Dipanggil dari Manager saat percakapan biasa.
   * @returns {boolean}
   */
  shouldOfferAudit: function() {
    var lastDate = this._getLastAuditDate();
    if (!lastDate) return true;

    var now = new Date();
    var diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
  },

  /**
   * ============================================================
   * FASE 1: KUMPULKAN DATA
   * ============================================================
   */
  _collectData: function() {
    var files = [];
    var allSource = GitHubOpsService.readAllSourceFiles();

    Object.keys(allSource).forEach(function(name) {
      if (name !== 'appsscript.json') {
        files.push({
          name: name,
          content: allSource[name].content,
          sha: allSource[name].sha
        });
      }
    });

    var sheets = this._getSheetNames();

    var propKeys = [];
    try {
      var props = PropertiesService.getScriptProperties();
      propKeys = props.getKeys();
    } catch (e) {
      AppLogger.error('AUDIT_PROPS_FAIL', e.message);
    }

    var docs = {};
    var archFile = GitHubOpsService.readDocFile('ARCHITECTURE.md');
    var progFile = GitHubOpsService.readDocFile('PROGRESS.md');
    if (archFile) docs['ARCHITECTURE.md'] = archFile.content;
    if (progFile) docs['PROGRESS.md'] = progFile.content;

    return {
      files: files,
      sheets: sheets,
      propKeys: propKeys,
      docs: docs
    };
  },

  _getSheetNames: function() {
    try {
      var ss = SpreadsheetApp.openById(Config.load().spreadsheetId);
      return ss.getSheets().map(function(s) { return s.getName(); });
    } catch (e) {
      return [];
    }
  },

  /**
   * ============================================================
   * FASE 2: ANALISIS PER BATCH
   * ============================================================
   */
  _analyzeInBatches: function(data, categories) {
    var allFindings = [];
    var batches = this._splitIntoBatches(data.files);
    var self = this;

    batches.forEach(function(batch, index) {
      AppLogger.info('AUDIT_BATCH', 'Batch ' + (index + 1) + '/' + batches.length +
        ' (' + batch.length + ' files)');

      var prompt = self._buildAuditPrompt(batch, data, categories);
      var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.2, 'advanced');

      if (!llmResult || !llmResult.text) {
        AppLogger.error('AUDIT_LLM_FAIL', 'Batch ' + (index + 1) + ' gagal');
        return;
      }

      var batchFindings = self._parseFindings(llmResult.text);
      allFindings = allFindings.concat(batchFindings);

      Utilities.sleep(1000);
    });

    return this._deduplicateFindings(allFindings);
  },

  _splitIntoBatches: function(files) {
    var batches = [[], [], [], []];

    files.forEach(function(file) {
      var name = file.name;
      if (name.indexOf('00_') === 0 || name.indexOf('01_') === 0 ||
          name.indexOf('02_') === 0 || name.indexOf('03_') === 0) {
        batches[0].push(file);
      } else if (name.indexOf('04_') === 0 || name.indexOf('05_') === 0) {
        batches[1].push(file);
      } else if (name.indexOf('06_') === 0 || name.indexOf('07_') === 0 ||
                 name.indexOf('08_') === 0) {
        batches[2].push(file);
      } else {
        batches[3].push(file);
      }
    });

    return batches.filter(function(b) { return b.length > 0; });
  },

  _buildAuditPrompt: function(batch, data, categories) {
    var fileList = batch.map(function(f) {
      var truncated = f.content.length > 8000
        ? f.content.substring(0, 8000) + '\n... (dipotong)'
        : f.content;
      return '=== ' + f.name + ' ===\n' + truncated;
    }).join('\n\n');

    var sheetList = data.sheets.length > 0
      ? data.sheets.join(', ')
      : '(tidak terbaca)';

    var propList = data.propKeys.length > 0
      ? data.propKeys.join(', ')
      : '(tidak terbaca)';

    var catList = categories.join(', ');

    return 'Kamu adalah senior code reviewer yang mengaudit proyek ' +
      'AI Agent Telegram berbasis Google Apps Script.\n\n' +
      'ATURAN DESAIN PROYEK:\n' +
      '- Modul = object literal (const/var X = {...}), bukan class\n' +
      '- Lazy Evaluation: referensi modul lain dibungkus method\n' +
      '- Waktu selalu WIB via DateTimeUtils\n' +
      '- Repository = CRUD murni, tidak tahu Telegram/LLM\n' +
      '- Semua insert pakai appendRowSafe(), bukan appendRow()\n' +
      '- Soft delete (ubah status), jangan hapus baris\n\n' +
      'KATEGORI AUDIT: ' + catList + '\n\n' +
      'SHEET YANG ADA DI SPREADSHEET: ' + sheetList + '\n' +
      'SCRIPT PROPERTY KEYS: ' + propList + '\n\n' +
      'FILE YANG DI-REVIEW:\n' + fileList + '\n\n' +
      'TUGAS:\n' +
      'Cari masalah nyata di file-file di atas. Fokus pada bug, ' +
      'inkonsistensi, dan risiko. JANGAN mengarang masalah yang tidak ada.\n\n' +
      'FORMAT OUTPUT (JSON array murni, tanpa wrapper markdown):\n' +
      '[\n' +
      '  {\n' +
      '    "severity": "critical" | "warning" | "minor",\n' +
      '    "category": "salah satu dari kategori di atas",\n' +
      '    "fileName": "nama file yang bermasalah",\n' +
      '    "description": "penjelasan singkat masalahnya",\n' +
      '    "recommendation": "cara memperbaikinya"\n' +
      '  }\n' +
      ']\n\n' +
      'Jika tidak ada masalah, balas: []';
  },

  _parseFindings: function(rawText) {
    try {
      var cleaned = rawText.replace(/```json\n?/g, '')
                           .replace(/```\n?/g, '').trim();
      var parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed.filter(function(f) {
          return f.severity && f.fileName && f.description;
        });
      }
      return [];
    } catch (e) {
      AppLogger.error('AUDIT_PARSE_FAIL', e.message);
      return [];
    }
  },

  _deduplicateFindings: function(findings) {
    var seen = {};
    return findings.filter(function(f) {
      var key = f.fileName + '|' + f.description.substring(0, 50);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  },

  /**
   * ============================================================
   * FASE 3: FORMAT LAPORAN NATURAL
   * ============================================================
   */
    _formatReportForChat: function(findings, type) {
    var critical = findings.filter(function(f) { return f.severity === 'critical'; });
    var warning = findings.filter(function(f) { return f.severity === 'warning'; });
    var minor = findings.filter(function(f) { return f.severity === 'minor'; });

    var label = type === 'light' ? 'Ringan' : 'Lengkap';
    var reply = '📊 *Audit ' + label + ' Selesai!*\n';
    reply += findings.length + ' masalah ditemukan.\n\n';

    if (critical.length > 0) {
      reply += '🔴 *Kritis (' + critical.length + '):*\n';
      critical.forEach(function(f, i) {
        var desc = f.description.length > 80
          ? f.description.substring(0, 77) + '...'
          : f.description;
        reply += (i + 1) + '. ' + desc + '\n';
      });
      reply += '\n';
    }

    if (warning.length > 0) {
      reply += '🟠 *Penting (' + warning.length + '):*\n';
      warning.forEach(function(f, i) {
        var desc = f.description.length > 80
          ? f.description.substring(0, 77) + '...'
          : f.description;
        reply += (i + 1) + '. ' + desc + '\n';
      });
      reply += '\n';
    }

    if (minor.length > 0) {
      reply += '🟡 *Minor (' + minor.length + '):*\n';
      minor.forEach(function(f, i) {
        var desc = f.description.length > 80
          ? f.description.substring(0, 77) + '...'
          : f.description;
        reply += (i + 1) + '. ' + desc + '\n';
      });
      reply += '\n';
    }

    reply += 'Mau aku perbaiki?\n';
    reply += '• *"ya semua"*\n';
    if (critical.length > 0) reply += '• *"yang kritis aja"*\n';
    if (critical.length > 0 && warning.length > 0) reply += '• *"kritis sama penting"*\n';
    reply += '• *"nanti dulu"*';

    // Jika masih terlalu panjang (> 3800 chars), potong
    if (reply.length > 3800) {
      reply = '📊 *Audit ' + label + ' Selesai!*\n';
      reply += findings.length + ' masalah ditemukan.\n\n';
      reply += '🔴 Kritis: ' + critical.length + '\n';
      reply += '🟠 Penting: ' + warning.length + '\n';
      reply += '🟡 Minor: ' + minor.length + '\n\n';
      reply += 'Detail lengkap disimpan di sheet `Audit_Findings`.\n\n';
      reply += 'Mau aku perbaiki?\n';
      reply += '• *"ya semua"*\n';
      reply += '• *"yang kritis aja"*\n';
      reply += '• *"nanti dulu"*';
    }

    // Kirim detail per severity sebagai pesan terpisah jika ada banyak temuan
    if (findings.length > 5) {
      var config = Config.load();
      var detailMsg = '📋 *Detail Temuan Audit:*\n\n';

      findings.forEach(function(f, i) {
        var icon = f.severity === 'critical' ? '🔴' :
                   f.severity === 'warning' ? '🟠' : '🟡';
        var line = icon + ' *' + f.fileName + '*\n' +
                   f.description + '\n\n';

        // Kirim batch detail jika sudah mendekati limit
        if (detailMsg.length + line.length > 3800) {
          TelegramService.sendMessage(config.myChatId, detailMsg);
          detailMsg = '📋 *Detail (lanjutan):*\n\n';
          Utilities.sleep(500);
        }
        detailMsg += line;
      });

      if (detailMsg.length > 30) {
        TelegramService.sendMessage(config.myChatId, detailMsg);
      }
    }

    return reply;
  },

  /**
   * ============================================================
   * FASE 4: GENERATE & APPLY FIXES
   * ============================================================
   */
  _filterByScope: function(findings, scope) {
    if (scope === 'all') return findings;
    if (scope === 'critical') {
      return findings.filter(function(f) { return f.severity === 'critical'; });
    }
    if (scope === 'critical+warning') {
      return findings.filter(function(f) {
        return f.severity === 'critical' || f.severity === 'warning';
      });
    }
    return findings;
  },

  _generateFixes: function(findings) {
    var filesToRead = {};
    findings.forEach(function(f) {
      if (!filesToRead[f.fileName]) {
        filesToRead[f.fileName] = true;
      }
    });

    var sourceMap = {};
    Object.keys(filesToRead).forEach(function(fileName) {
      var fileData = GitHubOpsService.readFile('src/' + fileName);
      if (fileData) {
        sourceMap[fileName] = fileData.content;
      }
    });

    if (Object.keys(sourceMap).length === 0) {
      return [];
    }

    var findingsText = findings.map(function(f, i) {
      return (i + 1) + '. [' + f.severity.toUpperCase() + '] ' +
        f.fileName + ': ' + f.description +
        '\n   Rekomendasi: ' + f.recommendation;
    }).join('\n');

    var sourceText = '';
    Object.keys(sourceMap).forEach(function(name) {
      sourceText += '\n\n=== ' + name + ' ===\n' + sourceMap[name];
    });

    var prompt =
      'Kamu adalah senior developer yang memperbaiki bug di proyek ' +
      'AI Agent Telegram berbasis Google Apps Script.\n\n' +
      'TEMUAN AUDIT YANG HARUS DIPERBAIKI:\n' + findingsText + '\n\n' +
      'SOURCE CODE FILE:\n' + sourceText + '\n\n' +
      'TUGAS:\n' +
      'Perbaiki SEMUA masalah di atas. Berikan kode LENGKAP setiap file ' +
      'yang perlu diperbaiki. Pertahankan semua fungsi yang sudah ada.\n\n' +
      'FORMAT OUTPUT (JSON ketat tanpa wrapper markdown):\n' +
      '{\n' +
      '  "fixes": [\n' +
      '    {\n' +
      '      "fileName": "nama file",\n' +
      '      "patchedCode": "kode LENGKAP yang sudah diperbaiki",\n' +
      '      "changes": ["poin perubahan 1", "poin perubahan 2"]\n' +
      '    }\n' +
      '  ],\n' +
      '  "summary": "ringkasan semua perbaikan"\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.1, 'advanced');

    if (!llmResult || !llmResult.text) {
      AppLogger.error('AUDIT_FIX_LLM_FAIL', 'Semua provider gagal');
      return [];
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '')
                                  .replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);
      return result.fixes || [];
    } catch (e) {
      AppLogger.error('AUDIT_FIX_PARSE_FAIL', e.message);
      return [];
    }
  },

  _applyFixes: function(fixes, scope) {
    var timestamp = new Date().getTime();
    var branchName = 'audit/fix-' + scope + '-' + timestamp;

    var branchOk = GitHubOpsService.createBranch(branchName);
    if (!branchOk) {
      return '❌ Gagal buat branch di GitHub. Coba lagi nanti.';
    }

    var successCount = 0;
    var failCount = 0;
    var changeSummary = [];

    fixes.forEach(function(fix) {
      var original = GitHubOpsService.readFile('src/' + fix.fileName);
      var sha = original ? original.sha : null;

      var ok = GitHubOpsService.commitFile(
        'src/' + fix.fileName,
        fix.patchedCode,
        'audit-fix: ' + (fix.changes || []).join(', '),
        branchName,
        sha
      );

      if (ok) {
        successCount++;
        changeSummary.push('✅ `' + fix.fileName + '`: ' +
          (fix.changes || []).join(', '));
      } else {
        failCount++;
        changeSummary.push('❌ `' + fix.fileName + '`: gagal commit');
      }

      Utilities.sleep(1000);
    });

    var prBody = '## Audit Auto-Fix (' + scope + ')\n\n' +
      changeSummary.join('\n') + '\n\n' +
      '---\n_Generated by Code Audit Agent_';

    var prUrl = GitHubOpsService.createPullRequest(
      '🔧 Audit Fix: ' + successCount + ' file diperbaiki',
      prBody,
      branchName,
      null
    );

    var reply = '✅ *Perbaikan Selesai!*\n\n';
    reply += 'Berhasil: ' + successCount + ' file\n';
    if (failCount > 0) reply += 'Gagal: ' + failCount + ' file\n';
    reply += '\n📋 *Detail:*\n' + changeSummary.join('\n') + '\n';
    reply += '\n🌿 Branch: `' + branchName + '`\n';
    if (prUrl) {
      reply += '🔗 PR: ' + prUrl + '\n';
    }
    reply += '\nMerge di GitHub, lalu deploy versi baru ya! 👍';

    return reply;
  },

  /**
   * ============================================================
   * STORAGE: Simpan laporan & temuan ke Sheet
   * ============================================================
   */
  _saveReport: function(findings, type) {
    try {
      var id = IdGenerator.generate('AUDIT');
      var timestamp = DateTimeUtils.nowWIB();
      var critical = findings.filter(function(f) { return f.severity === 'critical'; }).length;
      var warning = findings.filter(function(f) { return f.severity === 'warning'; }).length;

      SpreadsheetGateway.appendRowSafe('Audit_Reports', [
        id, timestamp, type,
        0, findings.length, critical, warning, 'completed'
      ]);

      this._saveFindings(id, findings);
      return id;
    } catch (e) {
      AppLogger.error('AUDIT_SAVE_FAIL', e.message);
      return null;
    }
  },

  _saveFindings: function(reportId, findings) {
    var self = this;
    findings.forEach(function(f) {
      try {
        var id = IdGenerator.generate('FIND');
        SpreadsheetGateway.appendRowSafe('Audit_Findings', [
          id, reportId, f.severity, f.category,
          f.fileName, f.description, 'pending'
        ]);
      } catch (e) {
        AppLogger.error('AUDIT_FINDING_SAVE_FAIL', e.message);
      }
    });
  },

  _getLatestPendingFindings: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Audit_Findings');
      var data = sheet.getDataRange().getValues();
      var findings = [];

      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][6] === 'pending') {
          findings.push({
            id: data[i][0],
            severity: data[i][2],
            category: data[i][3],
            fileName: data[i][4],
            description: data[i][5]
          });
        }
      }
      return findings;
    } catch (e) {
      return [];
    }
  },

  _markFindingsFixed: function(findings) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Audit_Findings');
      var data = sheet.getDataRange().getValues();

      findings.forEach(function(f) {
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === f.id) {
            sheet.getRange(i + 1, 7).setValue('fixed');
            break;
          }
        }
      });
    } catch (e) {
      AppLogger.error('AUDIT_MARK_FAIL', e.message);
    }
  },

  _getLastAuditDate: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Audit_Reports');
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return null;

      var lastRow = data[data.length - 1];
      var ts = lastRow[1];
      return ts instanceof Date ? ts : new Date(ts);
    } catch (e) {
      return null;
    }
  }
};