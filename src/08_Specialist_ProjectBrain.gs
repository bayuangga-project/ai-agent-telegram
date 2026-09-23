/**
 * ===================================================================
 * SPESIALIS: PROJECT BRAIN
 * Tanggung jawab: Memahami visi proyek, menyinkronkan roadmap vs kode,
 * dan mengevaluasi ide baru secara terstruktur.
 * ===================================================================
 */
const ProjectBrain = {

  buildRoadmapFromDiscussion(userInput) {
    AppLogger.info('PROJECT_BRAIN_BUILD', 'input:' + userInput);

    var existingRoadmap = this._readDoc('ROADMAP.md');
    var existingItems = this._readItems();

    var template = KnowledgeRepository.get('roadmap', 'build_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        existing_roadmap: existingRoadmap || '-',
        existing_items: existingItems || '-',
        user_input: userInput
      });
    } else {
      prompt = userInput + '\n\n' + existingRoadmap;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'documentation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Generate roadmap JSON.' }],
      temperature: 0.3
    });

    if (!llmResult || !llmResult.text) {
      return { success: false, code: 'ROADMAP_LLM_FAILED' };
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      var commitOk = false;
      if (result.roadmapContent) {
        commitOk = GitHubOpsService.updateDocFile('ROADMAP.md', result.roadmapContent, 'docs: update ROADMAP.md');
      }

      if (result.items && Array.isArray(result.items)) {
        this._syncItemsToSheet(result.items);
      }

      return {
        success: true,
        summary: result.summary,
        commitOk: commitOk,
        itemsCount: result.items ? result.items.length : 0
      };
    } catch (e) {
      AppLogger.error('PROJECT_BRAIN_PARSE_FAIL', e.message);
      return { success: false, code: 'ROADMAP_PARSE_FAILED', error: e.message };
    }
  },

  syncRoadmapWithCode() {
    AppLogger.info('PROJECT_BRAIN_SYNC', 'started');

    var roadmap = this._readDoc('ROADMAP.md');
    var items = this._readItems();
    var allFiles = GitHubOpsService.listDirectory('src');
    var fileNames = Array.isArray(allFiles) ? allFiles.map(function(f) { return f.name; }) : [];

    var template = KnowledgeRepository.get('roadmap', 'sync_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        existing_roadmap: roadmap || '-',
        existing_items: items || '-',
        file_names: fileNames.join('\n')
      });
    } else {
      prompt = fileNames.join('\n');
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'documentation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Sync roadmap JSON.' }],
      temperature: 0.2
    });

    if (!llmResult || !llmResult.text) return { success: false, code: 'ROADMAP_SYNC_LLM_FAILED' };

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);
      var changesMade = 0;

      if (result.updates && Array.isArray(result.updates)) {
        for (var i = 0; i < result.updates.length; i++) {
          var u = result.updates[i];
          if (this._updateItemStatus(u.feature, u.newStatus)) changesMade++;
        }
      }

      if (result.newItems && Array.isArray(result.newItems)) {
        for (var j = 0; j < result.newItems.length; j++) {
          var it = result.newItems[j];
          if (this._addItem(it.feature, it.category, it.priority, it.status, it.notes)) changesMade++;
        }
      }

      if (result.roadmapChanges) {
        this._updateRoadmapContent(result.roadmapChanges);
        changesMade++;
      }

      return {
        success: true,
        summary: result.summary,
        changesMade: changesMade
      };
    } catch (e) {
      AppLogger.error('PROJECT_BRAIN_SYNC_PARSE_FAIL', e.message);
      return { success: false, code: 'ROADMAP_SYNC_PARSE_FAILED', error: e.message };
    }
  },

  adaptRoadmapForNewIdea(idea) {
    AppLogger.info('PROJECT_BRAIN_ADAPT', 'idea:' + idea);

    var roadmap = this._readDoc('ROADMAP.md');
    var items = this._readItems();

    var template = KnowledgeRepository.get('roadmap', 'adapt_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        existing_roadmap: roadmap || '-',
        existing_items: items || '-',
        idea: idea
      });
    } else {
      prompt = idea;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'chat_heavy',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Evaluate idea JSON.' }],
      temperature: 0.3
    });

    if (!llmResult || !llmResult.text) return { success: false, code: 'ADAPT_LLM_FAILED' };

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      if (result.acceptIdea && result.newItem) {
        this._addItem(
          result.newItem.feature,
          result.newItem.category,
          result.newItem.priority,
          'idea',
          result.newItem.notes
        );
      }

      return {
        success: true,
        analysis: result
      };
    } catch (e) {
      AppLogger.error('PROJECT_BRAIN_ADAPT_FAIL', e.message);
      return { success: false, code: 'ADAPT_PARSE_FAILED', error: e.message };
    }
  },

  answerQuestion(question) {
    AppLogger.info('PROJECT_BRAIN_QUERY', question);

    var roadmap = this._readDoc('ROADMAP.md');
    var items = this._readItems();
    var template = KnowledgeRepository.get('roadmap', 'query_prompt');

    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        roadmap_context: 'ROADMAP:\n' + (roadmap || '-') + '\n\nITEMS:\n' + (items || '-'),
        question: question
      });
    } else {
      prompt = question;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'chat_heavy',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: question }],
      temperature: 0.5
    });

    return (llmResult && llmResult.text) ? llmResult.text : null;
  },

  updateRoadmapStatus(feature, status) {
    return this._updateItemStatus(feature, status);
  },

  _readDoc(fileName) {
    var file = GitHubOpsService.readDocFile(fileName);
    return file ? file.content : null;
  },

  _readItems() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return '-';

      var lines = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][1]) {
          lines.push('- [' + data[i][4] + '] ' + data[i][1] + ' (' + data[i][2] + ', ' + data[i][3] + ')' + (data[i][6] ? ' - ' + data[i][6] : ''));
        }
      }
      return lines.length > 0 ? lines.join('\n') : '-';
    } catch (e) {
      return '-';
    }
  },

  _addItem(feature, category, priority, status, notes) {
    try {
      var id = IdGenerator.generate('RD');
      SpreadsheetGateway.appendRowSafe('Roadmap_Items', [
        id, feature, category || 'General',
        priority || 'P3', status || 'idea', '', notes || ''
      ]);
      return true;
    } catch (e) {
      AppLogger.error('ROADMAP_ADD_FAIL', e.message);
      return false;
    }
  },

  _updateItemStatus(feature, newStatus) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var data = sheet.getDataRange().getValues();
      var featureLower = feature.toLowerCase();

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1]).toLowerCase().indexOf(featureLower) !== -1) {
          sheet.getRange(i + 1, 5).setValue(newStatus);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  _syncItemsToSheet(items) {
    var self = this;
    items.forEach(function(item) {
      var sheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var data = sheet.getDataRange().getValues();
      var found = false;

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1]).toLowerCase() === item.feature.toLowerCase()) {
          sheet.getRange(i + 1, 3).setValue(item.category || data[i][2]);
          sheet.getRange(i + 1, 4).setValue(item.priority || data[i][3]);
          sheet.getRange(i + 1, 5).setValue(item.status || data[i][4]);
          sheet.getRange(i + 1, 7).setValue(item.notes || data[i][6]);
          found = true;
          break;
        }
      }

      if (!found) {
        self._addItem(item.feature, item.category, item.priority, item.status, item.notes);
      }
    });
  },

  _updateRoadmapContent(changesDescription) {
    var existing = this._readDoc('ROADMAP.md');
    if (!existing) return;

    var template = KnowledgeRepository.get('roadmap', 'update_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        changes_description: changesDescription,
        existing_content: existing
      });
    } else {
      prompt = changesDescription + '\n\n' + existing;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'documentation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Return pure markdown content.' }],
      temperature: 0.2
    });

    if (llmResult && llmResult.text) {
      GitHubOpsService.updateDocFile('ROADMAP.md', llmResult.text.trim(), 'docs: auto-sync roadmap');
    }
  }
};