/**
 * ===================================================================
 * SPESIALIS: LLM INTELLIGENCE (ISOLATED RUNTIME ENGINE)
 * ===================================================================
 */
const LLMIntelligence = {
  NAMESPACE_BENCHMARK: 'benchmark',
  NAMESPACE_ROUTING: 'llm_routing',
  NAMESPACE_LLM: 'llm',
  NAMESPACE_STATS: 'llm_stats',
  BATCH_SIZE: 3,

  discoverAndBenchmark() {
    return this.runFullPipeline();
  },

  runFullPipeline() {
    var res1 = this.discoverModels();
    var res2 = this.benchmarkBatch();
    var res3 = this.rankModels();
    return { discovery: res1, benchmark: res2, ranking: res3 };
  },

  discoverModels() {
    try {
      var raw = KnowledgeRepository.get(this.NAMESPACE_LLM, 'candidate_models');
      if (!raw) {
        return { stage: 'discovery', status: 'no_candidates_in_sheet' };
      }

      var modelIds;
      try {
        modelIds = JSON.parse(raw);
      } catch (e) {
        modelIds = raw.split(',').map(function(s) { return s.trim(); });
      }

      if (!Array.isArray(modelIds) || modelIds.length === 0) {
        return { stage: 'discovery', status: 'empty_list' };
      }

      var formatted = modelIds.map(function(id) {
        return { id: id, contextLength: 8192 };
      });

      KnowledgeRepository.save(this.NAMESPACE_LLM, 'available_free_models', JSON.stringify(formatted), 'DISCOVERY');

      AppLogger.info('LLM_DISCOVERY_SUCCESS', 'count:' + modelIds.length);
      return {
        stage: 'discovery',
        status: 'success',
        count: modelIds.length,
        models: modelIds
      };
    } catch (err) {
      AppLogger.error('LLM_DISCOVER_FAIL', err.message);
      return { stage: 'discovery', status: 'error', reason: err.message };
    }
  },

  benchmarkBatch() {
    var startTime = new Date().getTime();

    try {
      var candidateIds = this._loadCandidateIds();
      if (!candidateIds || candidateIds.length === 0) {
        var discRes = this.discoverModels();
        if (discRes.status !== 'success' || !discRes.models) {
          return { stage: 'benchmark', status: 'no_candidates' };
        }
        candidateIds = discRes.models;
      }

      var existingResults = this._loadExistingResults();
      var unbenchmarked = [];
      for (var i = 0; i < candidateIds.length; i++) {
        if (!existingResults[candidateIds[i]]) {
          unbenchmarked.push(candidateIds[i]);
        }
      }

      if (unbenchmarked.length === 0) {
        return {
          stage: 'benchmark',
          status: 'all_tested',
          total_tested: Object.keys(existingResults).length
        };
      }

      var batch = unbenchmarked.slice(0, this.BATCH_SIZE);
      var diagPrompt = KnowledgeRepository.get(this.NAMESPACE_BENCHMARK, 'diagnostic_prompt');
      var patCalc = KnowledgeRepository.get(this.NAMESPACE_BENCHMARK, 'pattern_calc');
      var patLogic = KnowledgeRepository.get(this.NAMESPACE_BENCHMARK, 'pattern_logic');

      var testedInThisRun = [];

      for (var b = 0; b < batch.length; b++) {
        if (new Date().getTime() - startTime > 120000) {
          break;
        }

        var modelId = batch[b];
        var result = this._testSingleModel(modelId, diagPrompt, patCalc, patLogic);
        existingResults[modelId] = result;
        testedInThisRun.push({
          model: modelId,
          score: result.totalScore,
          latency: result.avgLatencyMs
        });
      }

      this._saveResults(existingResults);

      AppLogger.info('LLM_BENCHMARK_BATCH', 'tested:' + testedInThisRun.length);
      return {
        stage: 'benchmark',
        status: 'batch_completed',
        tested_count: testedInThisRun.length,
        results: testedInThisRun,
        remaining: unbenchmarked.length - testedInThisRun.length
      };
    } catch (err) {
      AppLogger.error('LLM_BENCHMARK_FAIL', err.message);
      return { stage: 'benchmark', status: 'error', reason: err.message };
    }
  },

  rankModels() {
    try {
      var candidateIds = this._loadCandidateIds();
      var existingResults = this._loadExistingResults();

      var scoredList = [];
      for (var modelId in existingResults) {
        if (!existingResults.hasOwnProperty(modelId)) continue;
        var r = existingResults[modelId];
        if (r && typeof r.totalScore === 'number' && r.totalScore >= 30) {
          scoredList.push({ model: modelId, score: r.totalScore });
        }
      }

      scoredList.sort(function(a, b) { return b.score - a.score; });
      var rankedModels = scoredList.map(function(item) { return item.model; });

      if (rankedModels.length === 0 && candidateIds && candidateIds.length > 0) {
        rankedModels = candidateIds.slice(0, 5);
      }

      var matrix = {
        chat_light: rankedModels,
        chat_heavy: rankedModels,
        intent_analysis: rankedModels,
        code_analysis: rankedModels,
        code_generation: rankedModels,
        documentation: rankedModels,
        web_grounded: rankedModels
      };

      KnowledgeRepository.save(this.NAMESPACE_ROUTING, 'matrix', JSON.stringify(matrix), 'RANKING');

      AppLogger.info('LLM_RANKING_DONE', 'ranked:' + rankedModels.length);
      return {
        stage: 'ranking',
        status: 'success',
        ranked_count: rankedModels.length,
        top_models: rankedModels.slice(0, 3)
      };
    } catch (err) {
      AppLogger.error('LLM_RANKING_FAIL', err.message);
      return { stage: 'ranking', status: 'error', reason: err.message };
    }
  },

  _testSingleModel(modelId, promptText, patCalc, patLogic) {
    var prompt = promptText || '{"calc": 47 * 23, "logic": "tidak"}';
    var start = new Date().getTime();
    var qualityScore = 0;
    var latency = 20000;

    try {
      var res = OpenRouterProvider.call(
        'Return raw JSON only.',
        [{ role: 'user', text: prompt }],
        0.1,
        modelId
      );

      latency = new Date().getTime() - start;

      if (res) {
        var clean = res.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        var rxCalc = new RegExp(patCalc || '1081', 'i');
        if (rxCalc.test(clean)) qualityScore += 50;

        var rxLogic = new RegExp(patLogic || 'tidak', 'i');
        if (rxLogic.test(clean)) qualityScore += 50;
      }
    } catch (e) {
      latency = 20000;
      qualityScore = 0;
    }

    var latencyScore = Math.max(0, Math.min(100, Math.round(100 - ((latency - 2000) / 100))));
    if (latency <= 2000) latencyScore = 100;

    var finalScore = Math.round((qualityScore * 0.7) + (latencyScore * 0.3));

    return {
      modelId: modelId,
      totalScore: finalScore,
      qualityScore: qualityScore,
      avgLatencyMs: latency,
      testedAt: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB())
    };
  },

  _loadCandidateIds() {
    var raw = KnowledgeRepository.get(this.NAMESPACE_LLM, 'available_free_models');
    if (!raw) return [];
    try {
      var list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0 && list[0].id) {
        return list.map(function(item) { return item.id; });
      }
      if (Array.isArray(list)) return list;
      return [];
    } catch (e) {
      return [];
    }
  },

  _loadExistingResults() {
    var raw = KnowledgeRepository.get(this.NAMESPACE_LLM, 'benchmark_results');
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (e) { return {}; }
  },

  _saveResults(results) {
    KnowledgeRepository.save(this.NAMESPACE_LLM, 'benchmark_results', JSON.stringify(results), 'BENCHMARK_SAVE');
  },

  getRankedModelsForTask(taskType) {
    var matrixRaw = KnowledgeRepository.get(this.NAMESPACE_ROUTING, 'matrix');
    if (!matrixRaw) return [];
    try {
      var matrix = JSON.parse(matrixRaw);
      var models = matrix[taskType] || matrix['chat_light'] || [];
      return Array.isArray(models) ? models : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Pencatatan metrik ringan: MURNI mencatat statistik, TIDAK PERNAH memicu re-ranking di tengah chat
   */
  recordStat(taskType, modelId, success, latencyMs) {
    try {
      var raw = KnowledgeRepository.get(this.NAMESPACE_STATS, 'counters');
      var counters = {};
      if (raw) {
        try { counters = JSON.parse(raw); } catch (e) { counters = {}; }
      }

      var key = taskType + '|' + modelId;
      if (!counters[key]) {
        counters[key] = { success: 0, fail: 0, totalLatency: 0, count: 0 };
      }

      if (success) counters[key].success++;
      else counters[key].fail++;
      counters[key].totalLatency += latencyMs;
      counters[key].count++;

      KnowledgeRepository.save(this.NAMESPACE_STATS, 'counters', JSON.stringify(counters), 'STAT_RECORD');
    } catch (e) {}
  },

  /**
   * Re-ranking adaptif: HANYA dipanggil oleh scheduler pemeliharaan jam 03:00
   */
  adaptiveReRank() {
    var rawStats = KnowledgeRepository.get(this.NAMESPACE_STATS, 'counters');
    if (!rawStats) return;

    var counters;
    try { counters = JSON.parse(rawStats); } catch (e) { return; }

    var results = this._loadExistingResults();
    var hasChanges = false;

    for (var k in counters) {
      if (!counters.hasOwnProperty(k)) continue;
      var parts = k.split('|');
      var modelId = parts[1];
      var stat = counters[k];
      if (stat.count >= 3 && results[modelId]) {
        var rate = stat.success / stat.count;
        if (rate < 0.5) {
          results[modelId].totalScore = Math.max(0, results[modelId].totalScore - 20);
          hasChanges = true;
        } else if (rate >= 0.9) {
          results[modelId].totalScore = Math.min(100, results[modelId].totalScore + 5);
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      this._saveResults(results);
      this.rankModels();
    }

    try {
      KnowledgeRepository.save(this.NAMESPACE_STATS, 'counters', '{}', 'RESET_COUNTERS');
    } catch (e) {}
    AppLogger.info('ADAPTIVE_RERANK', 'completed');
  }
};