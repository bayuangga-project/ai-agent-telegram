/**
 * SPECIALIST: SELF-HEALING
 * Tanggung jawab: mendiagnosis error dari log, membaca source code
 * dari GitHub, menghasilkan patch perbaikan, dan mengcommit ke GitHub.
 */
var SelfHealingSpecialist = {

  getLevel: function() {
    try {
      var props = PropertiesService.getScriptProperties();
      var level = parseInt(props.getProperty('SELF_HEAL_LEVEL') || '2', 10);
      return (level >= 1 && level <= 3) ? level : 2;
    } catch (e) {
      return 2;
    }
  },

  diagnose: function(keluhanUser) {
    AppLogger.info('SELF_HEAL_START', 'Keluhan: ' + keluhanUser);

    var logs = this._getRecentLogs(30);
    var errorLogs = this._filterErrorLogs(logs);
    var suspectFiles = this._identifySuspectFiles(errorLogs, keluhanUser);

    var sourceMap = {};
    suspectFiles.forEach(function(fileName) {
      var fileData = GitHubOpsService.readFile('src/' + fileName);
      if (fileData) {
        sourceMap[fileName] = fileData;
      }
    });

    if (Object.keys(sourceMap).length === 0) {
      return '❌ Gagal membaca source code dari GitHub. ' +
             'Silakan cek GITHUB_TOKEN di Script Properties (kemungkinan expired atau kurang scope `repo`).';
    }

    var diagnosis = this._askLLMForDiagnosis(
      keluhanUser, errorLogs, sourceMap
    );

    if (!diagnosis || !diagnosis.patchedCode) {
      return this._formatDiagnosisOnly(diagnosis, errorLogs);
    }

    this._savePatch(diagnosis);

    var level = this.getLevel();
    if (level >= 2) {
      return this._applyToGitHub(diagnosis);
    }

    return this._formatPatchForChat(diagnosis);
  },

  updateDocumentation: function(instruction) {
    AppLogger.info('SELF_HEAL_DOC_UPDATE', instruction);

    var archFile = GitHubOpsService.readDocFile('ARCHITECTURE.md');
    var progFile = GitHubOpsService.readDocFile('PROGRESS.md');

    if (!archFile && !progFile) {
      return '❌ Gagal membaca dokumentasi dari GitHub. ' +
             'Kemungkinan GITHUB_TOKEN expired atau kurang scope `repo`. ' +
             'Silakan cek di Script Properties.';
    }

    var prompt =
      'Kamu adalah technical writer yang mengelola dokumentasi proyek AI Agent Telegram.\n\n' +
      'INSTRUKSI USER:\n' + instruction + '\n\n' +
      'ARCHITECTURE.md SAAT INI:\n' +
      (archFile ? archFile.content : '(tidak terbaca)') + '\n\n' +
      'PROGRESS.md SAAT INI:\n' +
      (progFile ? progFile.content : '(tidak terbaca)') + '\n\n' +
      'TUGAS:\n' +
      'Update file yang relevan berdasarkan instruksi. Pertahankan format yang ada.\n\n' +
      'FORMAT OUTPUT (JSON ketat tanpa wrapper markdown):\n' +
      '{\n' +
      '  "files": [\n' +
      '    {\n' +
      '      "fileName": "ARCHITECTURE.md atau PROGRESS.md",\n' +
      '      "content": "isi lengkap file"\n' +
      '    }\n' +
      '  ],\n' +
      '  "summary": "ringkasan perubahan"\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.2, 'advanced');

    if (!llmResult || !llmResult.text) {
      return '❌ Semua provider LLM gagal merespons. Coba lagi beberapa saat.';
    }

    var responseText = llmResult.text;

    try {
      var cleaned = responseText.replace(/```json\n?/g, '')
                                .replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      if (result.files && result.files.length > 0) {
        var commitResults = [];

        result.files.forEach(function(file) {
          var ok = GitHubOpsService.updateDocFile(
            file.fileName,
            file.content,
            'docs: ' + result.summary
          );
          commitResults.push({ file: file.fileName, success: ok });
        });

        var reply = '📝 *Update Dokumentasi Selesai*\n\n' +
                    '*Ringkasan:* ' + result.summary + '\n\n' +
                    '*Status File:*\n';
        commitResults.forEach(function(r) {
          reply += (r.success ? '✅' : '❌') + ' `' + r.file + '`\n';
        });

        return reply;
      }

      return '🤷 Tidak ada perubahan dokumentasi yang perlu dilakukan.';

    } catch (e) {
      AppLogger.error('SELF_HEAL_DOC_PARSE_FAIL', e.message);
      return '❌ Gagal update dokumentasi: ' + e.message;
    }
  },

  applyPendingPatch: function(patchId) {
    var patch = this._getPatchById(patchId);
    if (!patch) {
      return '❌ Patch tidak ditemukan.';
    }

    if (patch.status !== 'pending') {
      return '⚠️ Patch ini sudah berstatus: ' + patch.status;
    }

    return this._applyToGitHub({
      fileName: patch.fileName,
      patchedCode: patch.patchedCode,
      diagnosis: patch.diagnosis
    });
  },

  _getRecentLogs: function(count) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Log_System');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      var start = Math.max(1, data.length - count);
      return data.slice(start).map(function(row) {
        return {
          timestamp: row[0],
          event: row[1],
          detail: String(row[2] || '').substring(0, 300),
          status: row[3]
        };
      });
    } catch (e) {
      AppLogger.error('SELF_HEAL_LOG_READ_FAIL', e.message);
      return [];
    }
  },

  _filterErrorLogs: function(logs) {
    return logs.filter(function(log) {
      var event = String(log.event).toUpperCase();
      return event.indexOf('FAIL') !== -1 ||
             event.indexOf('ERROR') !== -1 ||
             event.indexOf('BAD') !== -1 ||
             event.indexOf('RETRY') !== -1 ||
             log.status === 'ERROR';
    });
  },

  _identifySuspectFiles: function(errorLogs, keluhan) {
    var suspectSet = {};
    var mapping = {
      'TELEGRAM': '05_Service_Telegram.gs',
      'LLM': '06_Service_LLM.gs',
      'INTENT': '09_Manager_IntentAnalyzer.gs',
      'WEBHOOK': '10_Handler_Webhook.gs',
      'REMINDER': '11_Trigger_ReminderChecker.gs',
      'FINANCE': '08_Specialist_Finance.gs',
      'REPO': '01_SpreadsheetGateway.gs',
      'SEARCH': '07_Service_WebSearch.gs',
      'GITHUB': '13_Service_GitHubOps.gs',
      'SELF_HEAL': '08_Specialist_SelfHealing.gs'
    };

    errorLogs.forEach(function(log) {
      var event = String(log.event).toUpperCase();
      Object.keys(mapping).forEach(function(key) {
        if (event.indexOf(key) !== -1) {
          suspectSet[mapping[key]] = true;
        }
      });
    });

    suspectSet['09_Manager.gs'] = true;
    return Object.keys(suspectSet);
  },

  _askLLMForDiagnosis: function(keluhan, errorLogs, sourceMap) {
    var logText = errorLogs.length > 0
      ? errorLogs.map(function(l) {
          return '[' + l.timestamp + '] ' + l.event + ': ' + l.detail;
        }).join('\n')
      : '(Tidak ada error log spesifik)';

    var sourceText = '';
    Object.keys(sourceMap).forEach(function(fileName) {
      sourceText += '\n\n=== FILE: ' + fileName + ' ===\n' +
                    sourceMap[fileName].content;
    });

    var prompt =
      'Kamu adalah senior developer yang mendiagnosis bug di sistem ' +
      'AI Agent Telegram berbasis Google Apps Script.\n\n' +
      'ATURAN DESAIN PROYEK:\n' +
      '- Modul ditulis sebagai object literal (var X = {...} atau const X = {...}), bukan class.\n' +
      '- Lazy Evaluation: method pembungkus untuk panggil modul lain.\n' +
      '- Waktu selalu WIB via DateTimeUtils.\n' +
      '- Repository tidak tahu soal Telegram/LLM.\n\n' +
      'KELUHAN USER:\n' + keluhan + '\n\n' +
      'ERROR LOG:\n' + logText + '\n\n' +
      'SOURCE CODE FILE:\n' + sourceText + '\n\n' +
      'TUGAS:\n' +
      '1. Analisis penyebab error.\n' +
      '2. Tentukan file yang perlu diperbaiki.\n' +
      '3. Berikan kode LENGKAP file tersebut yang sudah diperbaiki.\n\n' +
      'FORMAT OUTPUT (JSON ketat tanpa pembungkus markdown):\n' +
      '{\n' +
      '  "diagnosis": "penjelasan singkat untuk user",\n' +
      '  "technicalDetail": "penjelasan teknis",\n' +
      '  "fileName": "nama file misal 05_Service_Telegram.gs",\n' +
      '  "patchedCode": "kode LENGKAP file yang sudah diperbaiki",\n' +
      '  "changes": ["poin perubahan 1", "poin perubahan 2"]\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.1, 'advanced');

    if (!llmResult || !llmResult.text) {
      AppLogger.error('SELF_HEAL_LLM_ALL_FAILED', 'Semua provider gagal');
      return null;
    }

    var responseText = llmResult.text;

    try {
      var cleaned = responseText.replace(/```json\n?/g, '')
                                .replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      AppLogger.error('SELF_HEAL_LLM_PARSE_FAIL', e.message);
      return {
        diagnosis: 'Saya menemukan indikasi masalah tapi gagal membuat patch otomatis.',
        technicalDetail: responseText.substring(0, 500),
        fileName: null,
        patchedCode: null,
        changes: []
      };
    }
  },

  _applyToGitHub: function(diagnosis) {
    var branchName = 'fix/' +
      diagnosis.fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() +
      '-' + new Date().getTime();

    var branchOk = GitHubOpsService.createBranch(branchName);
    if (!branchOk) {
      return this._formatPatchForChat(diagnosis) +
             '\n\n⚠️ Gagal buat branch di GitHub. Silakan apply manual.';
    }

    var original = GitHubOpsService.readFile('src/' + diagnosis.fileName);
    var sha = original ? original.sha : null;

    var commitOk = GitHubOpsService.commitFile(
      'src/' + diagnosis.fileName,
      diagnosis.patchedCode,
      'fix: ' + diagnosis.diagnosis + ' (auto-heal)',
      branchName,
      sha
    );

    if (!commitOk) {
      return this._formatPatchForChat(diagnosis) +
             '\n\n⚠️ Gagal commit ke GitHub. Silakan apply manual.';
    }

    var prUrl = GitHubOpsService.createPullRequest(
      '🤖 Auto-Heal: ' + diagnosis.fileName,
      '## Diagnosis\n' + diagnosis.diagnosis + '\n\n' +
      '## Detail Teknis\n' + (diagnosis.technicalDetail || '-') + '\n\n' +
      '## Perubahan\n' +
      (diagnosis.changes || []).map(function(c) { return '- ' + c; }).join('\n'),
      branchName,
      null
    );

    this._updatePatchStatus(diagnosis.fileName, 'committed');

    var reply = '🛠️ *Perbaikan Berhasil Dibuat!*\n\n' +
                '🔍 *Diagnosis:* ' + diagnosis.diagnosis + '\n\n' +
                '📁 *File:* `' + diagnosis.fileName + '`\n' +
                '🌿 *Branch:* `' + branchName + '`\n';

    if (prUrl) {
      reply += '🔗 *Pull Request:* ' + prUrl + '\n';
    }

    reply += '\n📋 *Perubahan:*\n';
    (diagnosis.changes || []).forEach(function(c) {
      reply += '• ' + c + '\n';
    });

    reply += '\n📌 *Langkah selanjutnya:* Review PR di GitHub, lalu merge jika sesuai.';
    return reply;
  },

  _formatPatchForChat: function(diagnosis) {
    var reply = '🔍 *Hasil Diagnosis:*\n\n' +
                diagnosis.diagnosis + '\n\n';

    if (diagnosis.patchedCode && diagnosis.fileName) {
      reply += '🔧 *File:* `' + diagnosis.fileName + '`\n\n' +
               '📋 *Perubahan:*\n';
      (diagnosis.changes || []).forEach(function(c) {
        reply += '• ' + c + '\n';
      });
      reply += '\nKode perbaikan telah disimpan ke sheet `SelfHeal_Patches`.';
    }

    return reply;
  },

  _formatDiagnosisOnly: function(diagnosis, errorLogs) {
    var reply = '🔍 *Hasil Diagnosis:*\n\n';

    if (diagnosis && diagnosis.diagnosis) {
      reply += diagnosis.diagnosis + '\n\n';
    } else {
      reply += 'Tidak ditemukan error yang jelas dari log.\n\n';
    }

    if (errorLogs.length > 0) {
      reply += '📊 *Log Error Terakhir:*\n';
      errorLogs.slice(-3).forEach(function(log) {
        reply += '• `[' + log.event + ']` ' + log.detail.substring(0, 80) + '\n';
      });
    }

    return reply;
  },

  _savePatch: function(diagnosis) {
    try {
      var id = IdGenerator.generate('PATCH');
      var timestamp = DateTimeUtils.nowWIB();
      SpreadsheetGateway.appendRowSafe('SelfHeal_Patches', [
        id,
        timestamp,
        diagnosis.fileName || 'unknown',
        diagnosis.diagnosis || '',
        diagnosis.patchedCode || '',
        'pending'
      ]);
      return id;
    } catch (e) {
      AppLogger.error('SELF_HEAL_SAVE_FAIL', e.message);
      return null;
    }
  },

  _getPatchById: function(patchId) {
    try {
      var sheet = SpreadsheetGateway.getSheet('SelfHeal_Patches');
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (!patchId || data[i][0] === patchId) {
          return {
            id: data[i][0],
            timestamp: data[i][1],
            fileName: data[i][2],
            diagnosis: data[i][3],
            patchedCode: data[i][4],
            status: data[i][5]
          };
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  _updatePatchStatus: function(fileName, newStatus) {
    try {
      var sheet = SpreadsheetGateway.getSheet('SelfHeal_Patches');
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][2] === fileName && data[i][5] === 'pending') {
          sheet.getRange(i + 1, 6).setValue(newStatus);
          break;
        }
      }
    } catch (e) {
      AppLogger.error('SELF_HEAL_STATUS_FAIL', e.message);
    }
  }
};