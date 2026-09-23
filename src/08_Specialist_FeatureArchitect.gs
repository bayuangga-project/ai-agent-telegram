/**
 * ===================================================================
 * SPESIALIS: FEATURE ARCHITECT
 * Tanggung jawab: Brainstorming arsitektur, generate blueprint fitur,
 * dan implementasi kode baru otomatis ke branch/PR GitHub.
 * ===================================================================
 */
const FeatureArchitect = {

  generateBlueprint(idea) {
    AppLogger.info('FEATURE_ARCHITECT_BLUEPRINT', 'idea:' + idea);

    var context = this._gatherProjectContext();
    var template = KnowledgeRepository.get('feature', 'blueprint_prompt');

    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        file_list: context.fileList,
        sheet_list: context.sheetList,
        intent_list: context.intentList,
        command_list: context.commandList,
        idea: idea
      });
    } else {
      prompt = idea + '\n\n' + JSON.stringify(context);
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'code_generation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Generate feature blueprint JSON.' }],
      temperature: 0.3
    });

    if (!llmResult || !llmResult.text) {
      return { success: false, code: 'BLUEPRINT_LLM_FAILED' };
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var blueprint = JSON.parse(cleaned);

      this._saveBlueprint(blueprint, idea);
      return {
        success: true,
        blueprint: blueprint,
        idea: idea
      };
    } catch (e) {
      AppLogger.error('FEATURE_ARCHITECT_PARSE_FAIL', e.message);
      return { success: false, code: 'BLUEPRINT_PARSE_FAILED', error: e.message };
    }
  },

  implementBlueprint(idea) {
    AppLogger.info('FEATURE_ARCHITECT_IMPLEMENT', 'idea:' + idea);

    var blueprint = this._getLatestBlueprint();
    if (!blueprint) {
      return { success: false, code: 'NO_PENDING_BLUEPRINT' };
    }

    var context = this._gatherProjectContext();
    var timestamp = new Date().getTime();
    var branchName = 'feature/' + (blueprint.featureName || 'new-feature').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '-' + timestamp;

    var backupBranch = GitHubOpsService.createBackupBranch('feature-' + timestamp);
    var branchOk = GitHubOpsService.createBranch(branchName);
    if (!branchOk) {
      return { success: false, code: 'BRANCH_CREATION_FAILED', branchName: branchName };
    }

    var generatedFiles = this._generateAllCode(blueprint, context, idea);
    if (!generatedFiles || generatedFiles.length === 0) {
      return { success: false, code: 'CODE_GENERATION_FAILED' };
    }

    var validFiles = [];
    var rejectedFiles = [];

    for (var i = 0; i < generatedFiles.length; i++) {
      var file = generatedFiles[i];
      var path = file.fileName.indexOf('src/') === 0 ? file.fileName : 'src/' + file.fileName;
      var original = GitHubOpsService.readFile(path);
      if (!original) original = GitHubOpsService.readFile(file.fileName);

      var originalContent = original ? original.content : null;
      var validation = PatchValidator.validate(file.code, originalContent, file.fileName);

      if (validation.valid) {
        validFiles.push({
          file: file,
          path: path,
          sha: original ? original.sha : null,
          validation: validation
        });
      } else {
        rejectedFiles.push({
          fileName: file.fileName,
          errors: validation.errors
        });
      }
    }

    if (validFiles.length === 0) {
      return {
        success: false,
        code: 'ALL_FILES_REJECTED_BY_VALIDATOR',
        rejectedFiles: rejectedFiles
      };
    }

    var commitLog = [];
    var successCount = 0;
    var failCount = 0;

    for (var j = 0; j < validFiles.length; j++) {
      var item = validFiles[j];
      var isNew = !item.sha;
      var ok = GitHubOpsService.commitFile(
        item.path,
        item.file.code,
        (isNew ? 'feat: ' : 'update: ') + item.file.fileName,
        branchName,
        item.sha
      );

      if (ok) {
        successCount++;
        commitLog.push({ fileName: item.file.fileName, status: 'committed', isNew: isNew });
      } else {
        failCount++;
        commitLog.push({ fileName: item.file.fileName, status: 'failed', isNew: isNew });
      }
    }

    var prBody = '## Feature: ' + blueprint.featureName + '\n\n' +
                 (blueprint.description || '-') + '\n\n' +
                 '## Commits\n' + commitLog.map(function(c) { return '- ' + c.fileName + ' (' + c.status + ')'; }).join('\n') + '\n\n';

    if (backupBranch) {
      prBody += '## Backup\n`' + backupBranch + '`\n\n';
    }

    var prUrl = GitHubOpsService.createPullRequest(
      'Feature: ' + blueprint.featureName,
      prBody,
      branchName,
      null
    );

    ProjectBrain.updateRoadmapStatus(blueprint.featureName, 'in-progress');

    return {
      success: true,
      featureName: blueprint.featureName,
      branchName: branchName,
      backupBranch: backupBranch,
      prUrl: prUrl,
      commitLog: commitLog,
      newSheets: blueprint.newSheets || [],
      rejectedFiles: rejectedFiles
    };
  },

  _generateAllCode(blueprint, context, idea) {
    var filesToGenerate = [];

    if (blueprint.newFiles && Array.isArray(blueprint.newFiles)) {
      blueprint.newFiles.forEach(function(f) {
        filesToGenerate.push({
          fileName: f.fileName,
          isNew: true,
          description: f.description,
          type: f.type
        });
      });
    }

    if (blueprint.modifiedFiles && Array.isArray(blueprint.modifiedFiles)) {
      blueprint.modifiedFiles.forEach(function(f) {
        var path = f.fileName.indexOf('src/') === 0 ? f.fileName : 'src/' + f.fileName;
        var existing = GitHubOpsService.readFile(path);
        if (!existing) existing = GitHubOpsService.readFile(f.fileName);

        filesToGenerate.push({
          fileName: f.fileName,
          isNew: false,
          changes: f.changes,
          existingCode: existing ? existing.content : null
        });
      });
    }

    if (filesToGenerate.length === 0) return [];

    var results = [];
    for (var i = 0; i < filesToGenerate.length; i++) {
      var fileSpec = filesToGenerate[i];
      AppLogger.info('FEATURE_GENERATE_FILE', fileSpec.fileName);

      var code = this._generateSingleFile(fileSpec, blueprint, context, idea);
      if (code) {
        results.push({
          fileName: fileSpec.fileName,
          code: code
        });
      }
    }

    return results;
  },

  _generateSingleFile(fileSpec, blueprint, context, idea) {
    var templateKey = fileSpec.isNew ? 'new_file_prompt' : 'modify_file_prompt';
    var template = KnowledgeRepository.get('feature', templateKey);
    var prompt = '';

    if (template) {
      if (fileSpec.isNew) {
        prompt = TemplateEngine.render(template, {
          file_name: fileSpec.fileName,
          file_type: fileSpec.type,
          file_description: fileSpec.description,
          feature_name: blueprint.featureName,
          feature_description: blueprint.description,
          file_list: context.fileList,
          sheet_list: context.sheetList
        });
      } else {
        prompt = TemplateEngine.render(template, {
          file_name: fileSpec.fileName,
          changes: (fileSpec.changes || []).join('\n'),
          existing_code: fileSpec.existingCode || '-',
          feature_name: blueprint.featureName
        });
      }
    } else {
      prompt = fileSpec.fileName + '\n\n' + JSON.stringify(fileSpec);
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'code_generation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Generate pure code without markdown.' }],
      temperature: 0.1
    });

    if (!llmResult || !llmResult.text) return null;

    var code = llmResult.text;
    code = code.replace(/^```javascript\n?/m, '');
    code = code.replace(/^```gs\n?/m, '');
    code = code.replace(/```\s*$/m, '');
    return code.trim();
  },

  _gatherProjectContext() {
    var files = GitHubOpsService.listDirectory('src');
    var fileList = Array.isArray(files) ? files.map(function(f) { return f.name; }).join(', ') : '-';

    var sheetList = '-';
    try {
      var ss = SpreadsheetGateway.getSpreadsheet();
      sheetList = ss.getSheets().map(function(s) { return s.getName(); }).join(', ');
    } catch (e) {}

    return {
      fileList: fileList,
      sheetList: sheetList,
      intentList: 'catat_keuangan, tanya_saldo, sync_documentation, audit_code, roadmap_query, implement_feature, self_query, soul_query',
      commandList: '/ingat, /diagnose, /patch, /soul, /memory, /sync'
    };
  },

  _saveBlueprint(blueprint, idea) {
    try {
      var id = IdGenerator.generate('BLUE');
      var timestamp = DateTimeUtils.nowWIB();
      SpreadsheetGateway.appendRowSafe('SelfHeal_Patches', [
        id,
        timestamp,
        'BLUEPRINT: ' + (blueprint.featureName || 'unknown'),
        idea,
        JSON.stringify(blueprint),
        'pending'
      ]);
    } catch (e) {
      AppLogger.error('FEATURE_BLUEPRINT_SAVE_FAIL', e.message);
    }
  },

  _getLatestBlueprint() {
    try {
      var sheet = SpreadsheetGateway.getSheet('SelfHeal_Patches');
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][2]).indexOf('BLUEPRINT:') === 0 && data[i][5] === 'pending') {
          return JSON.parse(data[i][4]);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }
};