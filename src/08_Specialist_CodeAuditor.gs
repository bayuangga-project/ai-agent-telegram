/**
 * ===================================================================
 * SPESIALIS: CODE AUDITOR
 * Tanggung jawab: audit codebase, analisis statis berbantuan LLM,
 * penyimpanan laporan/temuan ke Sheet, dan pembuatan branch/PR perbaikan.
 * ===================================================================
 */
const CodeAuditor = {

  runAudit(type) {
    var auditType = type || 'full';
    AppLogger.info('AUDIT_START', 'type:' + auditType);

    var data = this._collectData();
    if (!data || data.files.length === 0) {
      return { success: false, code: 'SOURCE_READ_FAILED' };
    }

    var categories = auditType === 'light'
      ? ['INTEGRITY', 'CONSISTENCY', 'ROBUSTNESS']
      : ['INTEGRITY', 'CONSISTENCY', 'ROBUSTNESS', 'SECURITY', 'PERFORMANCE', 'DEAD_CODE', 'DOC_SYNC'];

    var findings = this._analyzeInBatches(data, categories);

    var reportId = this._saveReport(findings, auditType);

    var criticalCount = findings.filter(function(f) { return f.severity === 'critical'; }).length;
    var warningCount = findings.filter(function(f) { return f.severity === 'warning'; }).length;
    var minorCount = findings.filter(function(f) { return f.severity === 'minor'; }).length;

    return {
      success: true,
      reportId: reportId,
      auditType: auditType,
      totalFindings: findings.length,
      criticalCount: criticalCount,
      warningCount: warningCount,
      minorCount: minorCount,
      findings: findings
    };
  },

  runScheduledAudit() {
    var dayOfMonth = new Date().getDate();
    var type = (dayOfMonth === 1) ? 'full' : 'light';
    var result = this.runAudit(type);

    var config = Config.load();
    if (config.myChatId && result.success && result.totalFindings > 0) {
      Manager._askLLMWithKnowledge(config.myChatId, '', 'audit', 'report_response', result);
    }
  },

  fixIssues(scope) {
    var fixScope = scope || 'all';
    AppLogger.info('AUDIT_FIX_START', 'scope:' + fixScope);

    var findings = this._getLatestPendingFindings();
    if (!findings || findings.length === 0) {
      return { success: false, code: 'NO_PENDING_FINDINGS' };
    }

    var filtered = this._filterByScope(findings, fixScope);
    if (filtered.length === 0) {
      return { success: false, code: 'NO_MATCHING_SCOPE_FINDINGS', scope: fixScope };
    }

    var fixes = this._generateFixes(filtered);
    if (!fixes || fixes.length === 0) {
      return { success: false, code: 'FIX_GENERATION_FAILED' };
    }

    var result = this._applyFixes(fixes, fixScope);
    if (result.success && result.successCount > 0) {
      this._markFindingsFixed(filtered);
    }

    return result;
  },

  shouldOfferAudit() {
    var lastDate = this._getLastAuditDate();
    if (!lastDate) return true;

    var now = new Date();
    var diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
  },

  _collectData() {
    var files = [];
    var allSource = GitHubOpsService.readAllSourceFiles();

    if (Array.isArray(allSource)) {
      for (var i = 0; i < allSource.length; i++) {
        var item = allSource[i];
        var name = item.name || item.path || '';
        if (name && name !== 'appsscript.json' && name.indexOf('.gs') >= 0) {
          files.push({
            name: name,
            content: item.content || '',
            sha: item.sha || null
          });
        }
      }
    } else if (allSource && typeof allSource === 'object') {
      Object.keys(allSource).forEach(function(name) {
        if (name !== 'appsscript.json' && name.indexOf('.gs') >= 0) {
          files.push({
            name: name,
            content: allSource[name].content || '',
            sha: allSource[name].sha || null
          });
        }
      });
    }

    var sheets = this._getSheetNames();

    var propKeys = [];
    try {
      var props = PropertiesService.getScriptProperties();
      propKeys = props.getKeys();
    } catch (e) {
      AppLogger.error('AUDIT_PROPS_FAIL', e.message);
    }

    return {
      files: files,
      sheets: sheets,
      propKeys: propKeys
    };
  },

  _getSheetNames() {
    try {
      var ss = SpreadsheetGateway.getSpreadsheet();
      return ss.getSheets().map(function(s) { return s.getName(); });
    } catch (e) {
      return [];
    }
  },

  _analyzeInBatches(data, categories) {
    var allFindings = [];
    var batches = this._splitIntoBatches(data.files);
    var self = this;

    for (var i = 0; i < batches.length; i++) {
      var batch = batches[i];
      AppLogger.info('AUDIT_BATCH', 'batch:' + (i + 1) + '/' + batches.length + '|files:' + batch.length);

      var prompt = self._buildAuditPrompt(batch, data, categories);
      var llmResult = LLMProviderService.generate({
        taskType: 'code_analysis',
        chain: 'advanced',
        systemInstruction: prompt,
        messages: [{ role: 'user', text: 'Analyze and return JSON findings array.' }],
        temperature: 0.2
      });

      if (!llmResult || !llmResult.text) {
        AppLogger.error('AUDIT_LLM_FAIL', 'batch:' + (i + 1));
        continue;
      }

      var batchFindings = self._parseFindings(llmResult.text);
      allFindings = allFindings.concat(batchFindings);
    }

    return this._deduplicateFindings(allFindings);
  },

  _splitIntoBatches(files) {
    var batches = [];
    var currentBatch = [];
    var currentBatchSize = 0;
    var MAX_BATCH_CHARACTERS = 12000;

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var fileLength = (file.content || '').length;

      if (currentBatch.length > 0 && (currentBatchSize + fileLength > MAX_BATCH_CHARACTERS)) {
        batches.push(currentBatch);
        currentBatch = [file];
        currentBatchSize = fileLength;
      } else {
        currentBatch.push(file);
        currentBatchSize += fileLength;
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  },

  _buildAuditPrompt(batch, data, categories) {
    var template = KnowledgeRepository.get('audit', 'analysis_prompt');

    var fileList = batch.map(function(f) {
      var truncated = f.content.length > 8000
        ? f.content.substring(0, 8000)
        : f.content;
      return '=== ' + f.name + ' ===\n' + truncated;
    }).join('\n\n');

    var sheetList = data.sheets.length > 0 ? data.sheets.join(', ') : '-';
    var propList = data.propKeys.length > 0 ? data.propKeys.join(', ') : '-';
    var catList = categories.join(', ');

    if (template) {
      return TemplateEngine.render(template, {
        categories: catList,
        sheets: sheetList,
        prop_keys: propList,
        files: fileList
      });
    }

    return catList + '\n\n' + fileList;
  },

  _parseFindings(rawText) {
    try {
      var cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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

  _deduplicateFindings(findings) {
    var seen = {};
    return findings.filter(function(f) {
      var key = f.fileName + '|' + f.description.substring(0, 50);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  },

  _filterByScope(findings, scope) {
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

  _generateFixes(findings) {
    var filesToRead = {};
    findings.forEach(function(f) {
      if (!filesToRead[f.fileName]) {
        filesToRead[f.fileName] = true;
      }
    });

    var sourceMap = {};
    Object.keys(filesToRead).forEach(function(fileName) {
      var path = fileName.indexOf('src/') === 0 ? fileName : 'src/' + fileName;
      var fileData = GitHubOpsService.readFile(path);
      if (!fileData) {
        fileData = GitHubOpsService.readFile(fileName);
      }
      if (fileData) {
        sourceMap[fileName] = fileData.content;
      }
    });

    if (Object.keys(sourceMap).length === 0) {
      return [];
    }

    var findingsText = findings.map(function(f, i) {
      return (i + 1) + '. [' + String(f.severity).toUpperCase() + '] ' +
        f.fileName + ': ' + f.description +
        '\nRecommendation: ' + f.recommendation;
    }).join('\n');

    var sourceText = '';
    Object.keys(sourceMap).forEach(function(name) {
      sourceText += '\n\n=== ' + name + ' ===\n' + sourceMap[name];
    });

    var template = KnowledgeRepository.get('audit', 'fix_generation_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        findings: findingsText,
        source_code: sourceText
      });
    } else {
      prompt = findingsText + '\n\n' + sourceText;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'code_generation',
      chain: 'advanced',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Generate complete patched files in JSON.' }],
      temperature: 0.1
    });

    if (!llmResult || !llmResult.text) {
      AppLogger.error('AUDIT_FIX_LLM_FAIL', 'generation_failed');
      return [];
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);
      return result.fixes || [];
    } catch (e) {
      AppLogger.error('AUDIT_FIX_PARSE_FAIL', e.message);
      return [];
    }
  },

  _applyFixes(fixes, scope) {
    var timestamp = new Date().getTime();
    var branchName = 'audit/fix-' + scope + '-' + timestamp;

    var backupBranch = GitHubOpsService.createBackupBranch('audit-' + timestamp);

    var validatedFixes = [];
    var rejectedFixes = [];

    fixes.forEach(function(fix) {
      var path = fix.fileName.indexOf('src/') === 0 ? fix.fileName : 'src/' + fix.fileName;
      var original = GitHubOpsService.readFile(path);
      if (!original) {
        original = GitHubOpsService.readFile(fix.fileName);
      }
      var originalContent = original ? original.content : null;

      var validation = PatchValidator.validate(
        fix.patchedCode,
        originalContent,
        fix.fileName
      );

      if (validation.valid) {
        validatedFixes.push({
          fix: fix,
          path: path,
          sha: original ? original.sha : null,
          validation: validation
        });
      } else {
        rejectedFixes.push({
          fix: fix,
          validation: validation
        });
      }
    });

    if (validatedFixes.length === 0) {
      return {
        success: false,
        code: 'ALL_PATCHES_REJECTED',
        rejectedFixes: rejectedFixes
      };
    }

    var branchOk = GitHubOpsService.createBranch(branchName);
    if (!branchOk) {
      return {
        success: false,
        code: 'BRANCH_CREATION_FAILED',
        branchName: branchName
      };
    }

    var successCount = 0;
    var failCount = 0;
    var changeSummary = [];

    validatedFixes.forEach(function(item) {
      var ok = GitHubOpsService.commitFile(
        item.path,
        item.fix.patchedCode,
        'audit-fix: ' + (item.fix.changes || []).join(', '),
        branchName,
        item.sha
      );

      if (ok) {
        successCount++;
        changeSummary.push(item.fix.fileName + ': ' + (item.fix.changes || []).join(', '));
      } else {
        failCount++;
        changeSummary.push(item.fix.fileName + ': commit_failed');
      }
    });

    var prBody = '## Audit Auto-Fix (' + scope + ')\n\n' +
                 changeSummary.join('\n') + '\n\n';

    if (backupBranch) {
      prBody += '## Backup Branch\n`' + backupBranch + '`\n\n';
    }

    prBody += '---\n_Generated by Code Audit Agent_';

    var prUrl = GitHubOpsService.createPullRequest(
      'Audit Fix: ' + successCount + ' files patched',
      prBody,
      branchName,
      null
    );

    return {
      success: true,
      scope: scope,
      branchName: branchName,
      backupBranch: backupBranch,
      prUrl: prUrl,
      successCount: successCount,
      failCount: failCount,
      changeSummary: changeSummary,
      rejectedFixes: rejectedFixes
    };
  },

  _saveReport(findings, type) {
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

  _saveFindings(reportId, findings) {
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

  _getLatestPendingFindings() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Audit_Findings');
      var data = sheet.getDataRange().getValues();
      var findings = [];

      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][6] === 'pending') {
          findings.push({
            id: data[i][0],
            reportId: data[i][1],
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

  _markFindingsFixed(findings) {
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

  _getLastAuditDate() {
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