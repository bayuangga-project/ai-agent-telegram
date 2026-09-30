/**
 * ===================================================================
 * SPESIALIS: LLM INTELLIGENCE (LLM_MODELS SHEET REGISTRY ENGINE)
 * ===================================================================
 */
const LLMIntelligence = {
  SHEET_NAME: 'LLM_Models',
  HEADERS: ['model_id', 'provider', 'display_name', 'is_free', 'context_length', 'quality_score', 'avg_latency_ms', 'status', 'cooldown_until', 'last_tested_at'],
  BATCH_SIZE: 3,

  _ensureSheet() {
    return SpreadsheetGateway.ensureSheet(this.SHEET_NAME, this.HEADERS);
  },

  discoverModels() {
    this._ensureSheet();
    AppLogger.info('LLM_DISCOVERY_START', 'fetching_live_api_pure_dynamic');

    var newDiscovered = 0;
    var existingModels = this._getAllModelRows();
    var existingMap = {};
    for (var i = 0; i < existingModels.length; i++) {
      existingMap[existingModels[i].model_id] = existingModels[i];
    }

    var config = Config.load();

    if (config.openrouterApiKey) {
      try {
        var urlOR = 'https://openrouter.ai/api/v1/models';
        var resOR = UrlFetchApp.fetch(urlOR, { method: 'get', muteHttpExceptions: true });
        if (resOR.getResponseCode() === 200) {
          var dataOR = JSON.parse(resOR.getContentText());
          if (dataOR && Array.isArray(dataOR.data)) {
            var freeModels = dataOR.data.filter(function(m) {
              if (!m.id) return false;
              var isFreePricing = m.pricing && (m.pricing.prompt === '0' || m.pricing.prompt === 0);
              var isFreeTag = m.id.indexOf(':free') !== -1;
              return isFreePricing || isFreeTag;
            });

            freeModels.sort(function(a, b) { return (b.context_length || 0) - (a.context_length || 0); });

            for (var f = 0; f < freeModels.length; f++) {
              var itemOR = freeModels[f];
              if (!existingMap[itemOR.id]) {
                this._insertModelRow({
                  model_id: itemOR.id,
                  provider: 'openrouter',
                  display_name: itemOR.name || itemOR.id,
                  is_free: true,
                  context_length: itemOR.context_length || 8192,
                  quality_score: 50,
                  avg_latency_ms: 2000,
                  status: 'ACTIVE',
                  cooldown_until: '',
                  last_tested_at: ''
                });
                newDiscovered++;
              }
            }
          }
        }
      } catch (eOR) {
        AppLogger.warning('LLM_DISCOVERY_OPENROUTER_FAIL', eOR.message);
      }
    }

    if (config.geminiApiKey) {
      try {
        var urlGemini = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + config.geminiApiKey;
        var resGemini = UrlFetchApp.fetch(urlGemini, { method: 'get', muteHttpExceptions: true });
        if (resGemini.getResponseCode() === 200) {
          var dataGemini = JSON.parse(resGemini.getContentText());
          if (dataGemini && Array.isArray(dataGemini.models)) {
            for (var g = 0; g < dataGemini.models.length; g++) {
              var gm = dataGemini.models[g];
              if (!gm.supportedGenerationMethods) continue;
              if (gm.supportedGenerationMethods.indexOf('generateContent') === -1) continue;

              var gId = gm.name.replace(/^models\//, '');
              if (!existingMap[gId]) {
                this._insertModelRow({
                  model_id: gId,
                  provider: 'gemini',
                  display_name: gm.displayName || gId,
                  is_free: true,
                  context_length: gm.inputTokenLimit || 32768,
                  quality_score: 85,
                  avg_latency_ms: 1200,
                  status: 'ACTIVE',
                  cooldown_until: '',
                  last_tested_at: ''
                });
                newDiscovered++;
              }
            }
          }
        }
      } catch (eGemini) {
        AppLogger.warning('LLM_DISCOVERY_GEMINI_FAIL', eGemini.message);
      }
    }

    if (config.groqApiKey) {
      try {
        var urlGroq = 'https://api.groq.com/openai/v1/models';
        var resGroq = UrlFetchApp.fetch(urlGroq, {
          method: 'get',
          headers: { 'Authorization': 'Bearer ' + config.groqApiKey },
          muteHttpExceptions: true
        });
        if (resGroq.getResponseCode() === 200) {
          var dataGroq = JSON.parse(resGroq.getContentText());
          if (dataGroq && Array.isArray(dataGroq.data)) {
            for (var q = 0; q < dataGroq.data.length; q++) {
              var qm = dataGroq.data[q];
              if (!qm.id) continue;
              if (qm.active === false) continue;

              if (!existingMap[qm.id]) {
                this._insertModelRow({
                  model_id: qm.id,
                  provider: 'groq',
                  display_name: qm.id,
                  is_free: true,
                  context_length: qm.context_window || 8192,
                  quality_score: 80,
                  avg_latency_ms: 1000,
                  status: 'ACTIVE',
                  cooldown_until: '',
                  last_tested_at: ''
                });
                newDiscovered++;
              }
            }
          }
        }
      } catch (eGroq) {
        AppLogger.warning('LLM_DISCOVERY_GROQ_FAIL', eGroq.message);
      }
    }

    AppLogger.info('LLM_DISCOVERY_COMPLETE', 'new_models_added:' + newDiscovered);
    return { status: 'success', new_discovered: newDiscovered };
  },

  benchmarkBatch() {
    this._ensureSheet();
    var startTime = new Date().getTime();
    var models = this._getAllModelRows();

    var candidates = models.filter(function(m) {
      return m.provider === 'openrouter' && m.status !== 'DEPRECATED';
    });

    if (candidates.length === 0) {
      this.discoverModels();
      models = this._getAllModelRows();
      candidates = models.filter(function(m) { return m.provider === 'openrouter' && m.status !== 'DEPRECATED'; });
    }

    candidates.sort(function(a, b) {
      var timeA = a.last_tested_at ? new Date(a.last_tested_at).getTime() : 0;
      var timeB = b.last_tested_at ? new Date(b.last_tested_at).getTime() : 0;
      return timeA - timeB;
    });

    var batch = candidates.slice(0, this.BATCH_SIZE);
    var testedCount = 0;

    for (var i = 0; i < batch.length; i++) {
      if (new Date().getTime() - startTime > 120000) break;

      var target = batch[i];
      var testResult = this._testSingleModel(target.model_id);

      if (testResult.status === 'DEPRECATED') {
        this.setDeprecated(target.model_id, testResult.error);
      } else {
        this._updateModelStats(target.model_id, testResult.qualityScore, testResult.latencyMs);
      }
      testedCount++;
    }

    AppLogger.info('LLM_BENCHMARK_BATCH_DONE', 'tested:' + testedCount);
    return { status: 'success', tested_count: testedCount };
  },

  rankModels() {
    var models = this._getAllModelRows();
    var now = new Date().getTime();

    for (var i = 0; i < models.length; i++) {
      var m = models[i];
      if (m.status === 'COOLDOWN' && m.cooldown_until) {
        var cooldownTime = new Date(m.cooldown_until).getTime();
        if (now >= cooldownTime) {
          this._updateModelStatus(m.model_id, 'ACTIVE', '');
          m.status = 'ACTIVE';
        }
      }
    }

    var activeModels = models.filter(function(item) {
      return item.status === 'ACTIVE' && item.is_free === true;
    });

    activeModels.sort(function(a, b) {
      if (b.quality_score !== a.quality_score) {
        return b.quality_score - a.quality_score;
      }
      return a.avg_latency_ms - b.avg_latency_ms;
    });

    var rankedObjects = activeModels.map(function(item) {
      return { model_id: item.model_id, provider: item.provider };
    });

    if (rankedObjects.length === 0) {
      rankedObjects = [
        { model_id: 'gemini-1.5-flash', provider: 'gemini' },
        { model_id: 'llama_groq', provider: 'groq' }
      ];
    }

    var matrix = {
      chat_light: rankedObjects,
      chat_heavy: rankedObjects,
      intent_analysis: rankedObjects,
      code_analysis: rankedObjects,
      code_generation: rankedObjects,
      documentation: rankedObjects,
      web_grounded: rankedObjects
    };

    KnowledgeRepository.save('llm_routing', 'matrix', JSON.stringify(matrix), 'DYNAMIC_RANKING');
    AppLogger.info('LLM_RANKING_UPDATED', 'active_ranked_count:' + rankedObjects.length);
    return { status: 'success', ranked_count: rankedObjects.length, top_3: rankedObjects.slice(0, 3) };
  },

  setCooldown(modelId, durationSeconds, reason) {
    var until = new Date(new Date().getTime() + ((durationSeconds || 1800) * 1000));
    var untilStr = DateTimeUtils.formatUntukPrompt(until);
    this._updateModelStatus(modelId, 'COOLDOWN', untilStr);
    AppLogger.warning('LLM_MODEL_COOLDOWN_SET', modelId + '|until:' + untilStr + '|reason:' + (reason || '-'));
  },

  setDeprecated(modelId, reason) {
    this._updateModelStatus(modelId, 'DEPRECATED', '');
    AppLogger.error('LLM_MODEL_DEPRECATED', modelId + '|reason:' + (reason || '-'));
  },

  /**
   * Mengembalikan daftar Objek { model_id, provider } yang sudah ter-ranking
   */
  getRankedModelObjectsForTask(taskType) {
    var matrixRaw = KnowledgeRepository.get('llm_routing', 'matrix');
    if (!matrixRaw) {
      this.rankModels();
      matrixRaw = KnowledgeRepository.get('llm_routing', 'matrix');
    }
    try {
      var matrix = JSON.parse(matrixRaw);
      var list = matrix[taskType] || matrix['chat_light'] || [];
      if (!Array.isArray(list)) return [];

      // Backward compatibility jika berisi string ID
      return list.map(function(item) {
        if (typeof item === 'string') {
          var prov = 'openrouter';
          if (item.indexOf('gemini') !== -1) prov = 'gemini';
          if (item.indexOf('groq') !== -1 || item.indexOf('llama_groq') !== -1) prov = 'groq';
          return { model_id: item, provider: prov };
        }
        return item;
      });
    } catch (e) {
      return [];
    }
  },

  getRankedModelsForTask(taskType) {
    var objs = this.getRankedModelObjectsForTask(taskType);
    return objs.map(function(o) { return o.model_id; });
  },

  runFullPipeline() {
    var res1 = this.discoverModels();
    var res2 = this.benchmarkBatch();
    var res3 = this.rankModels();
    return { discovery: res1, benchmark: res2, ranking: res3 };
  },

  recordStat(taskType, modelId, success, latencyMs) {
    if (!success) {
      this._adjustQualityScore(modelId, -5);
    } else if (latencyMs > 0) {
      this._adjustQualityScore(modelId, 1);
    }
  },

  handleCommand(action, arg1, arg2) {
    if (action === 'discover') {
      var resDisc = this.discoverModels();
      this.rankModels();
      return '🔄 *Pure Live API Discovery Selesai!*\nModel baru ditarik dari OpenRouter, Gemini, & Groq: ' + resDisc.new_discovered + '\nKetik `/llm list` untuk melihat katalog.';
    }

    if (action === 'bench') {
      var resBench = this.benchmarkBatch();
      this.rankModels();
      return '⚡ *Benchmarking Selesai!*\nTotal model diuji: ' + resBench.tested_count;
    }

    if (action === 'add' && arg1) {
      var parts = arg1.split(':');
      var provider = parts.length > 1 ? parts[0] : 'openrouter';
      var modelId = parts.length > 1 ? parts.slice(1).join(':') : parts[0];

      this._insertModelRow({
        model_id: modelId,
        provider: provider,
        display_name: modelId,
        is_free: modelId.indexOf(':free') !== -1,
        context_length: 8192,
        quality_score: 70,
        avg_latency_ms: 1500,
        status: 'ACTIVE',
        cooldown_until: '',
        last_tested_at: ''
      });
      this.rankModels();
      return '✅ Model `' + modelId + '` (' + provider + ') berhasil ditambahkan ke sheet LLM_Models!';
    }

    var models = this._getAllModelRows();
    if (models.length === 0) {
      this.discoverModels();
      models = this._getAllModelRows();
    }

    var activeList = models.filter(function(m) { return m.status === 'ACTIVE'; });
    var cooldownList = models.filter(function(m) { return m.status === 'COOLDOWN'; });

    var text = '📊 *Katalog Live Model LLM Vexa (LLM_Models Sheet)*\n\n' +
      '🟢 *Aktif (' + activeList.length + '):*\n';

    for (var i = 0; i < Math.min(10, activeList.length); i++) {
      var a = activeList[i];
      text += (i + 1) + '. `' + a.model_id + '` [' + a.provider + '] (Skor: ' + a.quality_score + ' | ' + a.avg_latency_ms + 'ms)\n';
    }

    if (cooldownList.length > 0) {
      text += '\n🟡 *Dalam Cooldown (' + cooldownList.length + '):*\n';
      for (var j = 0; j < Math.min(5, cooldownList.length); j++) {
        text += '• `' + cooldownList[j].model_id + '` [' + cooldownList[j].provider + '] (Hingga: ' + cooldownList[j].cooldown_until + ')\n';
      }
    }

    text += '\n💡 _Gunakan `/llm discover` untuk update live dari API resmi, atau `/llm bench` untuk uji ulang._';
    return text;
  },

  _getAllModelRows() {
    try {
      var sheet = this._ensureSheet();
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      var rows = [];
      for (var i = 1; i < data.length; i++) {
        var r = data[i];
        if (!r[0]) continue;
        rows.push({
          rowIndex: i + 1,
          model_id: String(r[0]),
          provider: String(r[1] || 'openrouter'),
          display_name: String(r[2] || r[0]),
          is_free: r[3] === true || String(r[3]).toUpperCase() === 'TRUE',
          context_length: Number(r[4]) || 8192,
          quality_score: Number(r[5]) || 50,
          avg_latency_ms: Number(r[6]) || 2000,
          status: String(r[7] || 'ACTIVE'),
          cooldown_until: String(r[8] || ''),
          last_tested_at: String(r[9] || '')
        });
      }
      return rows;
    } catch (e) {
      return [];
    }
  },

  _insertModelRow(modelObj) {
    var sheet = this._ensureSheet();
    var nowStr = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      modelObj.model_id,
      modelObj.provider,
      modelObj.display_name,
      modelObj.is_free,
      modelObj.context_length,
      modelObj.quality_score,
      modelObj.avg_latency_ms,
      modelObj.status,
      modelObj.cooldown_until || '',
      modelObj.last_tested_at || nowStr
    ]);
  },

  _updateModelStatus(modelId, status, cooldownUntil) {
    var sheet = this._ensureSheet();
    var models = this._getAllModelRows();
    for (var i = 0; i < models.length; i++) {
      if (models[i].model_id === modelId) {
        sheet.getRange(models[i].rowIndex, 8).setValue(status);
        sheet.getRange(models[i].rowIndex, 9).setValue(cooldownUntil || '');
        return;
      }
    }
  },

  _updateModelStats(modelId, qualityScore, latencyMs) {
    var sheet = this._ensureSheet();
    var models = this._getAllModelRows();
    var nowStr = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    for (var i = 0; i < models.length; i++) {
      if (models[i].model_id === modelId) {
        sheet.getRange(models[i].rowIndex, 6).setValue(qualityScore);
        sheet.getRange(models[i].rowIndex, 7).setValue(latencyMs);
        sheet.getRange(models[i].rowIndex, 10).setValue(nowStr);
        return;
      }
    }
  },

  _adjustQualityScore(modelId, delta) {
    var sheet = this._ensureSheet();
    var models = this._getAllModelRows();
    for (var i = 0; i < models.length; i++) {
      if (models[i].model_id === modelId) {
        var current = models[i].quality_score;
        var updated = Math.max(0, Math.min(100, current + delta));
        sheet.getRange(models[i].rowIndex, 6).setValue(updated);
        return;
      }
    }
  },

  _testSingleModel(modelId) {
    var start = new Date().getTime();
    var qualityScore = 0;
    var latency = 20000;

    try {
      var res = OpenRouterProvider.call(
        'Return raw JSON only.',
        [{ role: 'user', text: '{"calc": 47 * 23, "logic": "tidak"}' }],
        0.1,
        modelId
      );

      latency = new Date().getTime() - start;

      if (res) {
        var clean = res.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        if (clean.indexOf('1081') !== -1) qualityScore += 50;
        if (clean.toLowerCase().indexOf('tidak') !== -1) qualityScore += 50;
      }
      return { status: 'OK', qualityScore: qualityScore, latencyMs: latency };
    } catch (e) {
      var errStr = String(e.message || e);
      if (errStr.indexOf('404') !== -1 || errStr.indexOf('not found') !== -1) {
        return { status: 'DEPRECATED', error: errStr };
      }
      return { status: 'FAIL', qualityScore: 0, latencyMs: 20000, error: errStr };
    }
  }
};