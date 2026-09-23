/**
 * ===================================================================
 * SPESIALIS: DOCUMENTATION SYNC (DOCSYNC)
 * Menyinkronkan file dokumentasi kanonik (.md) terhadap source code (.gs).
 * ===================================================================
 */
const DocSyncSpecialist = {

  sync() {
    try {
      var canonicalFiles = this._getCanonicalFiles();
      var sourceMetadata = this._collectSourceMetadata();
      var currentDocs = this._collectCurrentDocs(canonicalFiles);
      var analysisResult = this._analyzeWithLLM(sourceMetadata, currentDocs, canonicalFiles);

      if (!analysisResult || !analysisResult.updates || analysisResult.updates.length === 0) {
        return { success: true, updated: [], unchanged: canonicalFiles, summary: 'no_changes_detected' };
      }

      var updatedFiles = [];
      for (var i = 0; i < analysisResult.updates.length; i++) {
        var update = analysisResult.updates[i];
        if (!update.file || !update.content) continue;
        if (!this._isCanonical(update.file, canonicalFiles)) continue;

        var commitResult = this._commitDocUpdate(update.file, update.content, update.reason);
        if (commitResult) {
          updatedFiles.push({ file: update.file, reason: update.reason });
        }
      }

      var unchanged = [];
      for (var j = 0; j < canonicalFiles.length; j++) {
        var isUpdated = false;
        for (var k = 0; k < updatedFiles.length; k++) {
          if (updatedFiles[k].file === canonicalFiles[j]) { isUpdated = true; break; }
        }
        if (!isUpdated) unchanged.push(canonicalFiles[j]);
      }

      return {
        success: true,
        updated: updatedFiles,
        unchanged: unchanged,
        summary: analysisResult.summary || 'sync_completed'
      };
    } catch (err) {
      AppLogger.error('DOCSYNC_ERROR', JSON.stringify({ error: err.message, stack: err.stack }));
      return { success: false, code: 'SYNC_EXECUTION_FAILED', detail: err.message };
    }
  },

  _getCanonicalFiles() {
    var raw = KnowledgeRepository.get('docsync', 'canonical_files');
    if (!raw) return [];
    return raw.split('\n').map(function(line) {
      return line.trim();
    }).filter(function(line) {
      return line.length > 0 && line.indexOf('.md') === line.length - 3;
    });
  },

  _isCanonical(fileName, canonicalFiles) {
    for (var i = 0; i < canonicalFiles.length; i++) {
      if (canonicalFiles[i] === fileName) return true;
    }
    return false;
  },

  _collectSourceMetadata() {
    var files = GitHubOpsService.readAllSourceFiles();
    if (!files || files.length === 0) return 'no_source_files_found';

    var metadata = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var name = f.name || f.path || 'unknown';
      var content = f.content || '';
      var loc = content.split('\n').length;
      var methods = this._extractMethodSignatures(content);
      metadata.push({ file: name, loc: loc, methods: methods });
    }
    return JSON.stringify(metadata, null, 2);
  },

  _extractMethodSignatures(content) {
    var signatures = [];
    var lines = content.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var match = line.match(/^(\w+)\s*[:=]\s*function\s*\(([^)]*)\)/);
      if (match) {
        signatures.push(match[1] + '(' + match[2].trim() + ')');
        continue;
      }
      var match2 = line.match(/^(\w+)\s*\(([^)]*)\)\s*\{/);
      if (match2 && match2[1] !== 'if' && match2[1] !== 'for' && match2[1] !== 'while' && match2[1] !== 'function') {
        signatures.push(match2[1] + '(' + match2[2].trim() + ')');
      }
    }
    return signatures;
  },

  _collectCurrentDocs(canonicalFiles) {
    var docs = {};
    for (var i = 0; i < canonicalFiles.length; i++) {
      var fileName = canonicalFiles[i];
      try {
        var fileData = GitHubOpsService.readFile(fileName);
        if (fileData && fileData.content) {
          var rawContent = fileData.content;
          if (fileData.encoding === 'base64') {
            rawContent = Utilities.newBlob(
              Utilities.base64Decode(rawContent.replace(/\s/g, ''))
            ).getDataAsString();
          }
          docs[fileName] = rawContent.substring(0, 10000);
        }
      } catch (err) {
        AppLogger.warning('DOCSYNC_READ_WARNING', 'file:' + fileName + '|error:' + err.message);
      }
    }
    return JSON.stringify(docs, null, 2);
  },

  _analyzeWithLLM(sourceMetadata, currentDocs, canonicalFiles) {
    var template = KnowledgeRepository.get('docsync', 'analysis_prompt');
    if (!template) {
      AppLogger.error('DOCSYNC_NO_PROMPT', 'analysis_prompt_missing');
      return null;
    }

    var prompt = TemplateEngine.render(template, {
      source_metadata: sourceMetadata,
      current_docs: currentDocs,
      canonical_files: canonicalFiles.join('\n')
    });

    var result = LLMProviderService.generate({
      taskType: 'docsync_analysis',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Analyze and return JSON.' }],
      temperature: 0.3
    });

    if (!result || !result.text) return null;

    var cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      AppLogger.warning('DOCSYNC_PARSE_ERROR', err.message);
      return null;
    }
  },

  _commitDocUpdate(fileName, content, reason) {
    try {
      var existingFile = GitHubOpsService.readFile(fileName);
      var sha = (existingFile && existingFile.sha) ? existingFile.sha : null;
      var commitMsg = 'docsync:' + fileName;

      GitHubOpsService.commitFile(fileName, content, commitMsg, null, sha);
      AppLogger.info('DOCSYNC_COMMIT_SUCCESS', 'file:' + fileName);
      return true;
    } catch (err) {
      AppLogger.error('DOCSYNC_COMMIT_FAILED', 'file:' + fileName + '|error:' + err.message);
      return false;
    }
  }
};