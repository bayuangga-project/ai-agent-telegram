/**
 * ===================================================================
 * SPESIALIS: SELF-HEALING
 * Tanggung jawab: Diagnosis error dari log, pembuatan patch GitHub,
 * dan pembaruan dokumentasi berbasis LLM.
 * ===================================================================
 */
const SelfHealingSpecialist = {

  getLevel() {
    try {
      var props = PropertiesService.getScriptProperties();
      var level = parseInt(props.getProperty('SELF_HEAL_LEVEL') || '2', 10);
      return (level >= 1 && level <= 3) ? level : 2;
    } catch (e) {
      return 2;
    }
  },

  diagnose(keluhanUser) {
    AppLogger.info('SELF_HEAL_START', 'keluhan:' + keluhanUser);

    var logs = this._getRecentLogs(30);
    var errorLogs = this._filterErrorLogs(logs);
    var suspectFiles = this._identifySuspectFiles(errorLogs, keluhanUser);

    var sourceMap = {};
    for (var i = 0; i < suspectFiles.length; i++) {
      var fileName = suspectFiles[i];
      var path = fileName.indexOf('src/') === 0 ? fileName : 'src/' + fileName;
      var fileData = GitHubOpsService.readFile(path);
      if (!fileData) fileData = GitHubOpsService.readFile(fileName);
      if (fileData) {
        sourceMap[fileName] = fileData;
      }
    }

    if (Object.keys(sourceMap).length === 0) {
      return { success: false, code: 'SOURCE_READ_FAILED' };
    }

    var diagnosis = this._askLLMForDiagnosis(keluhanUser, errorLogs, sourceMap);

    if (!diagnosis || !diagnosis.patchedCode || !diagnosis.fileName) {
      return {
        success: true,
        status: 'diagnosis_only',
        diagnosis: diagnosis ? diagnosis.diagnosis : 'NO_CLEAR_DIAGNOSIS',
        technicalDetail: diagnosis ? diagnosis.technicalDetail : null,
        errorLogs: errorLogs.slice(-3)
      };
    }

    var patchId = this._savePatch(diagnosis);

    var level = this.getLevel();
    if (level >= 2) {
      var applyResult = this._applyToGitHub(diagnosis);
      applyResult.patchId = patchId;
      return applyResult;
    }

    return {
      success: true,
      status: 'patch_ready_pending_approval',
      patchId: patchId,
      diagnosis: diagnosis.diagnosis,
      fileName: diagnosis.fileName,
      changes: diagnosis.changes || []
    };
  },

  updateDocumentation(instruction) {
    AppLogger.info('SELF_HEAL_DOC_UPDATE', instruction);

    var canonicalRaw = KnowledgeRepository.get('docsync', 'canonical_files');
    var canonicalFiles = canonicalRaw
      ? canonicalRaw.split('\n').map(function(line) { return line.trim(); }).filter(function(line) { return line.length > 0; })
      : ['ARCHITECTURE.md', 'PROGRESS.md', 'ROADMAP.md', 'AI_DEVELOPMENT_HANDOFF.md', 'ai_knowledge.md'];

    var currentDocs = {};

    for (var i = 0; i < canonicalFiles.length; i++) {
      var fName = canonicalFiles[i];
      var fileData = GitHubOpsService.readFile(fName);
      if (fileData && fileData.content) {
        currentDocs[fName] = fileData.content.substring(0, 5000);
      }
    }

    var template = KnowledgeRepository.get('selfheal', 'doc_update_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        instruction: instruction,
        current_docs: JSON.stringify(currentDocs, null, 2)
      });
    } else {
      prompt = instruction + '\n\n' + JSON.stringify(currentDocs);
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'documentation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Generate updated documentation JSON.' }],
      temperature: 0.2
    });

    if (!llmResult || !llmResult.text) {
      return { success: false, code: 'DOC_UPDATE_LLM_FAILED' };
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      if (result.files && Array.isArray(result.files) && result.files.length > 0) {
        var commitResults = [];
        for (var j = 0; j < result.files.length; j++) {
          var f = result.files[j];
          var ok = GitHubOpsService.updateDocFile(f.fileName, f.content, 'docs: ' + (result.summary || 'update'));
          commitResults.push({ file: f.fileName, success: ok });
        }

        return {
          success: true,
          summary: result.summary,
          files: commitResults
        };
      }

      return { success: true, summary: 'NO_CHANGES_REQUIRED', files: [] };
    } catch (e) {
      AppLogger.error('SELF_HEAL_DOC_PARSE_FAIL', e.message);
      return { success: false, code: 'DOC_PARSE_FAILED', error: e.message };
    }
  },

  applyPendingPatch(patchId) {
    var patch = this._getPatchById(patchId);
    if (!patch) {
      return { success: false, code: 'PATCH_NOT_FOUND' };
    }

    if (patch.status !== 'pending') {
      return { success: false, code: 'PATCH_ALREADY_PROCESSED', status: patch.status };
    }

    return this._applyToGitHub({
      fileName: patch.fileName,
      patchedCode: patch.patchedCode,
      diagnosis: patch.diagnosis
    });
  },

  _getRecentLogs(count) {
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

  _filterErrorLogs(logs) {
    return logs.filter(function(log) {
      var event = String(log.event).toUpperCase();
      return event.indexOf('FAIL') !== -1 ||
             event.indexOf('ERROR') !== -1 ||
             event.indexOf('BAD') !== -1 ||
             event.indexOf('RETRY') !== -1 ||
             log.status === 'ERROR';
    });
  },

  _identifySuspectFiles(errorLogs, keluhan) {
    var suspectSet = {};
    var mapping = {
      'TELEGRAM': ['05_Service_Telegram.gs'],
      'LLM': [
        '06_Service_LLMProvider.gs',
        '06_Service_LLM_Gemini.gs',
        '06_Service_LLM_Groq.gs',
        '06_Service_LLM_OpenRouter.gs'
      ],
      'INTENT': ['09_Manager_IntentAnalyzer.gs'],
      'WEBHOOK': ['10_Handler_Webhook.gs'],
      'REMINDER': ['11_Trigger_ReminderChecker.gs', '08_Specialist_Reminder.gs'],
      'FINANCE': ['08_Specialist_Finance.gs', '04_Repository_Transaction.gs', '04_Repository_Wallet.gs'],
      'REPO': ['01_SpreadsheetGateway.gs', '04_Repository_Knowledge.gs'],
      'SEARCH': [
        '07_Service_WebSearchProvider.gs',
        '07_Service_WebSearch_Google.gs',
        '07_Service_WebSearch_Tavily.gs'
      ],
      'GITHUB': ['13_Service_GitHubOps.gs', '12_Service_GitHubBackup.gs'],
      'SELF_HEAL': ['08_Specialist_SelfHealing.gs'],
      'SOUL': ['08_Specialist_Soul.gs', '08_Specialist_SoulMemory.gs']
    };

    errorLogs.forEach(function(log) {
      var event = String(log.event).toUpperCase();
      Object.keys(mapping).forEach(function(key) {
        if (event.indexOf(key) !== -1) {
          mapping[key].forEach(function(file) {
            suspectSet[file] = true;
          });
        }
      });
    });

    suspectSet['09_Manager.gs'] = true;
    return Object.keys(suspectSet);
  },

  _askLLMForDiagnosis(keluhan, errorLogs, sourceMap) {
    var logText = errorLogs.length > 0
      ? errorLogs.map(function(l) {
          return '[' + l.timestamp + '] ' + l.event + ': ' + l.detail;
        }).join('\n')
      : '-';

    var sourceText = '';
    Object.keys(sourceMap).forEach(function(fileName) {
      sourceText += '\n\n=== FILE: ' + fileName + ' ===\n' + sourceMap[fileName].content;
    });

    var template = KnowledgeRepository.get('selfheal', 'diagnosis_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        keluhan: keluhan || '-',
        error_logs: logText,
        source_code: sourceText
      });
    } else {
      prompt = keluhan + '\n\n' + logText + '\n\n' + sourceText;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'code_analysis',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Diagnose and return JSON patch.' }],
      temperature: 0.1
    });

    if (!llmResult || !llmResult.text) return null;

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      AppLogger.error('SELF_HEAL_LLM_PARSE_FAIL', e.message);
      return null;
    }
  },

  _applyToGitHub(diagnosis) {
    var timestamp = new Date().getTime();
    var branchName = 'fix/' + diagnosis.fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '-' + timestamp;

    var path = diagnosis.fileName.indexOf('src/') === 0 ? diagnosis.fileName : 'src/' + diagnosis.fileName;
    var original = GitHubOpsService.readFile(path);
    if (!original) original = GitHubOpsService.readFile(diagnosis.fileName);

    var originalContent = original ? original.content : null;
    var sha = original ? original.sha : null;

    var validation = PatchValidator.validate(diagnosis.patchedCode, originalContent, diagnosis.fileName);

    if (!validation.valid) {
      return {
        success: false,
        code: 'PATCH_VALIDATION_FAILED',
        diagnosis: diagnosis.diagnosis,
        fileName: diagnosis.fileName,
        errors: validation.errors
      };
    }

    var backupBranch = GitHubOpsService.createBackupBranch('selfheal-' + timestamp);
    var branchOk = GitHubOpsService.createBranch(branchName);
    if (!branchOk) {
      return { success: false, code: 'BRANCH_CREATION_FAILED', branchName: branchName };
    }

    var commitOk = GitHubOpsService.commitFile(
      path,
      diagnosis.patchedCode,
      'fix: ' + diagnosis.diagnosis + ' (auto-heal)',
      branchName,
      sha
    );

    if (!commitOk) {
      return { success: false, code: 'COMMIT_FAILED', branchName: branchName };
    }

    var prBody = '## Diagnosis\n' + diagnosis.diagnosis + '\n\n' +
                 '## Detail Teknis\n' + (diagnosis.technicalDetail || '-') + '\n\n' +
                 '## Perubahan\n' + (diagnosis.changes || []).map(function(c) { return '- ' + c; }).join('\n') + '\n\n';

    if (backupBranch) {
      prBody += '## Backup\n`' + backupBranch + '`\n\n';
    }

    var prUrl = GitHubOpsService.createPullRequest(
      'Auto-Heal: ' + diagnosis.fileName,
      prBody,
      branchName,
      null
    );

    this._updatePatchStatus(diagnosis.fileName, 'committed');

    return {
      success: true,
      diagnosis: diagnosis.diagnosis,
      fileName: diagnosis.fileName,
      branchName: branchName,
      backupBranch: backupBranch,
      prUrl: prUrl,
      changes: diagnosis.changes || [],
      warnings: validation.warnings || []
    };
  },

  _savePatch(diagnosis) {
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

  _getPatchById(patchId) {
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

  _updatePatchStatus(fileName, newStatus) {
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