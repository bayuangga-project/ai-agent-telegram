const LLMIntelligence = {
  NAMESPACE_BENCHMARK: 'benchmark',
  NAMESPACE_ROUTING: 'llm_routing',
  NAMESPACE_LLM: 'llm',
  NAMESPACE_STATS: 'llm_stats',
  OPENROUTER_MODELS_URL: 'https://openrouter.ai/api/v1/models',
  BENCHMARK_BATCH_SIZE: 5,

  discoverAndBenchmark() {
    try {
      var models = this._fetchAndFilterModels();
      if (!models || models.length === 0) {
        AppLogger.warning('LLM_INTEL_NO_MODELS', 'no_free_models_found');
        return { status: 'no_models' };
      }

      var existingResults = this._loadExistingResults();
      var newModels = this._findUnbenchmarked(models, existingResults);
      var batch = newModels.slice(0, this.BENCHMARK_BATCH_SIZE);

      if (batch.length === 0) {
        this._reVerifyTopModels(models, existingResults);
        this._buildAndSaveMatrix(models, existingResults);
        return { status: 'all_benchmarked', models: models.length };
      }

      var testSuite = this._loadTestSuite();
      if (!testSuite || testSuite.length === 0) {
        AppLogger.error('LLM_INTEL_NO_SUITE', 'test_suite_missing');
        return { status: 'no_test_suite' };
      }

      for (var i = 0; i < batch.length; i++) {
        var modelId = batch[i];
        var result = this._benchmarkSingleModel(modelId, testSuite);
        existingResults[modelId] = result;
        AppLogger.info('LLM_INTEL_BENCHMARKED', modelId + ':score:' + result.totalScore);
      }

      this._saveResults(existingResults);
      this._buildAndSaveMatrix(models, existingResults);

      return { status: 'batch_complete', benchmarked: batch.length, total: models.length };
    } catch (err) {
      AppLogger.error('LLM_INTEL_ERROR', JSON.stringify({ error: err.message }));
      return { status: 'error', detail: err.message };
    }
  },

  _fetchAndFilterModels() {
    var config = Config.load();
    var apiKey = config.openrouterApiKey;
    if (!apiKey) {
      AppLogger.warning('LLM_INTEL_NO_KEY', 'openrouter_api_key_missing');
      return [];
    }

    var response = UrlFetchApp.fetch(this.OPENROUTER_MODELS_URL, {
      headers: { 'Authorization': 'Bearer ' + apiKey },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      AppLogger.error('LLM_INTEL_FETCH_FAIL', 'status:' + response.getResponseCode());
      return [];
    }

    var data = JSON.parse(response.getContentText());
    if (!data.data) return [];

    var costRules = this._loadCostRules();
    var maxPrompt = costRules.max_cost_per_million_prompt || '0';
    var maxCompletion = costRules.max_cost_per_million_completion || '0';

    var freeModels = [];
    for (var i = 0; i < data.data.length; i++) {
      var m = data.data[i];
      if (!m.pricing) continue;
      var promptCost = String(m.pricing.prompt || '1');
      var completionCost = String(m.pricing.completion || '1');

      if (parseFloat(promptCost) <= parseFloat(maxPrompt) &&
          parseFloat(completionCost) <= parseFloat(maxCompletion)) {
        freeModels.push({
          id: m.id,
          name: m.name || m.id,
          contextLength: m.context_length || 4096,
          promptCost: promptCost,
          completionCost: completionCost
        });
      }
    }

    freeModels.sort(function(a, b) {
      return (b.contextLength || 0) - (a.contextLength || 0);
    });

    var top30 = freeModels.slice(0, 30);
    var modelIds = top30.map(function(m) { return m.id; });

    KnowledgeRepository.save(this.NAMESPACE_LLM, 'available_models',
      JSON.stringify(top30), 'AUTO_DISCOVERY');
    KnowledgeRepository.save(this.NAMESPACE_LLM, 'last_scan_at',
      DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB()), 'AUTO_DISCOVERY');

    AppLogger.info('LLM_INTEL_DISCOVERED', 'free:' + freeModels.length + '|top30:' + top30.length);
    return modelIds;
  },

  _loadTestSuite() {
    var raw = KnowledgeRepository.get(this.NAMESPACE_BENCHMARK, 'test_suite');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  _loadScoringConfig() {
    var raw = KnowledgeRepository.get(this.NAMESPACE_BENCHMARK, 'scoring_config');
    if (!raw) return { min_pass_score: 50, categories: {} };
    try { return JSON.parse(raw); } catch (e) { return { min_pass_score: 50, categories: {} }; }
  },

  _loadCostRules() {
    var raw = KnowledgeRepository.get(this.NAMESPACE_ROUTING, 'cost_rules');
    if (!raw) return { max_cost_per_million_prompt: '0', max_cost_per_million_completion: '0' };
    try { return JSON.parse(raw); } catch (e) { return { max_cost_per_million_prompt: '0', max_cost_per_million_completion: '0' }; }
  },

  _loadTaskDefinitions() {
    var raw = KnowledgeRepository.get(this.NAMESPACE_ROUTING, 'task_definitions');
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (e) { return {}; }
  },

  _loadExistingResults() {
    var raw = KnowledgeRepository.get(this.NAMESPACE_LLM, 'benchmark_results');
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (e) { return {}; }
  },

  _saveResults(results) {
    KnowledgeRepository.save(this.NAMESPACE_LLM, 'benchmark_results',
      JSON.stringify(results), 'AUTO_BENCHMARK');
  },

  _findUnbenchmarked(models, existingResults) {
    var unbenchmarked = [];
    for (var i = 0; i < models.length; i++) {
      if (!existingResults[models[i]]) {
        unbenchmarked.push(models[i]);
      }
    }
    return unbenchmarked;
  },

  _benchmarkSingleModel(modelId, testSuite) {
    var scores = {};
    var totalWeight = 0;
    var weightedScore = 0;
    var latencies = [];

    for (var i = 0; i < testSuite.length; i++) {
      var test = testSuite[i];
      var startTime = new Date().getTime();

      try {
        var response = OpenRouterProvider.call(
          'You are a precise assistant. Follow instructions exactly.',
          [{ role: 'user', text: test.prompt }],
          0.1,
          modelId
        );

        var latency = new Date().getTime() - startTime;
        latencies.push(latency);

        var passed = this._evaluateAnswer(test, response);
        scores[test.id] = {
          category: test.category,
          passed: passed,
          latency: latency,
          weight: test.weight
        };

        if (passed) {
          weightedScore += test.weight;
        }
        totalWeight += test.weight;
      } catch (err) {
        scores[test.id] = {
          category: test.category,
          passed: false,
          latency: -1,
          weight: test.weight,
          error: err.message
        };
        totalWeight += test.weight;
      }
    }

    var totalScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
    var avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce(function(a, b) { return a + b; }, 0) / latencies.length)
      : -1;

    return {
      modelId: modelId,
      totalScore: totalScore,
      avgLatencyMs: avgLatency,
      scores: scores,
      testedAt: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB())
    };
  },

  _evaluateAnswer(testCase, answer) {
    if (!answer || !testCase.answer_pattern) return false;
    var cleaned = answer.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      var regex = new RegExp(testCase.answer_pattern, 'i');
      return regex.test(cleaned);
    } catch (e) {
      return cleaned.toLowerCase().indexOf(testCase.answer_pattern.toLowerCase()) >= 0;
    }
  },

  _reVerifyTopModels(models, existingResults) {
    var testSuite = this._loadTestSuite();
    if (!testSuite || testSuite.length === 0) return;

    var verifyTest = testSuite[0];
    var scored = [];
    for (var key in existingResults) {
      if (existingResults.hasOwnProperty(key)) {
        scored.push({ id: key, score: existingResults[key].totalScore || 0 });
      }
    }
    scored.sort(function(a, b) { return b.score - a.score; });
    var top5 = scored.slice(0, 5);

    for (var i = 0; i < top5.length; i++) {
      var modelId = top5[i].id;
      try {
        var response = OpenRouterProvider.call(
          'system_check',
          [{ role: 'user', text: verifyTest.prompt }],
          0.1,
          modelId
        );
        var passed = this._evaluateAnswer(verifyTest, response);
        if (!passed) {
          existingResults[modelId].totalScore = Math.max(0, existingResults[modelId].totalScore - 10);
          AppLogger.warning('LLM_INTEL_REVERIFY_FAIL', modelId);
        }
      } catch (err) {
        existingResults[modelId].totalScore = Math.max(0, existingResults[modelId].totalScore - 20);
        AppLogger.warning('LLM_INTEL_REVERIFY_ERROR', modelId);
      }
    }
    this._saveResults(existingResults);
  },

  _buildAndSaveMatrix(models, benchmarkResults) {
    var taskDefs = this._loadTaskDefinitions();
    var scoringConfig = this._loadScoringConfig();
    var matrix = {};

    var taskTypes = Object.keys(taskDefs);
    for (var t = 0; t < taskTypes.length; t++) {
      var taskType = taskTypes[t];
      var def = taskDefs[taskType];
      var requiredCategories = def.primary || [];
      var minContext = def.min_context || 4096;

      var ranked = [];
      for (var modelId in benchmarkResults) {
        if (!benchmarkResults.hasOwnProperty(modelId)) continue;
        var result = benchmarkResults[modelId];
        if (result.totalScore < scoringConfig.min_pass_score) continue;

        var categoryScore = 0;
        var categoryCount = 0;
        for (var cat = 0; cat < requiredCategories.length; cat++) {
          var catName = requiredCategories[cat];
          for (var testId in result.scores) {
            if (result.scores[testId].category === catName && result.scores[testId].passed) {
              categoryScore += 1;
            }
            if (result.scores[testId].category === catName) {
              categoryCount += 1;
            }
          }
        }

        var catRatio = categoryCount > 0 ? categoryScore / categoryCount : 0.5;
        var latencyPenalty = result.avgLatencyMs > (scoringConfig.latency_penalty_threshold_ms || 15000) ? 0.8 : 1.0;
        var latencyBonus = result.avgLatencyMs < (scoringConfig.latency_bonus_threshold_ms || 3000) ? 1.1 : 1.0;

        var finalScore = Math.round(
          (result.totalScore * 0.5 + catRatio * 100 * 0.4 + 50 * 0.1) * latencyPenalty * latencyBonus
        );

        ranked.push({ model: modelId, score: finalScore, avgLatency: result.avgLatencyMs });
      }

      ranked.sort(function(a, b) { return b.score - a.score; });
      matrix[taskType] = ranked.slice(0, 5);
    }

    KnowledgeRepository.save(this.NAMESPACE_ROUTING, 'matrix',
      JSON.stringify(matrix), 'AUTO_MATRIX_BUILD');
    AppLogger.info('LLM_INTEL_MATRIX_BUILT', 'tasks:' + taskTypes.length);
  },

  getBestModelForTask(taskType) {
    var matrixRaw = KnowledgeRepository.get(this.NAMESPACE_ROUTING, 'matrix');
    if (!matrixRaw) return null;

    try {
      var matrix = JSON.parse(matrixRaw);
      var ranked = matrix[taskType];
      if (!ranked || ranked.length === 0) {
        ranked = matrix['chat_light'] || [];
      }
      return ranked.length > 0 ? ranked[0].model : null;
    } catch (e) {
      return null;
    }
  },

  getRankedModelsForTask(taskType) {
    var matrixRaw = KnowledgeRepository.get(this.NAMESPACE_ROUTING, 'matrix');
    if (!matrixRaw) return [];

    try {
      var matrix = JSON.parse(matrixRaw);
      var ranked = matrix[taskType];
      if (!ranked || ranked.length === 0) {
        ranked = matrix['chat_light'] || [];
      }
      return ranked.map(function(r) { return r.model; });
    } catch (e) {
      return [];
    }
  },

  recordStat(taskType, modelId, success, latencyMs) {
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

    KnowledgeRepository.save(this.NAMESPACE_STATS, 'counters',
      JSON.stringify(counters), 'RUNTIME_STAT');
  },

  adaptiveReRank() {
    var raw = KnowledgeRepository.get(this.NAMESPACE_STATS, 'counters');
    if (!raw) return { status: 'no_stats' };

    var counters;
    try { counters = JSON.parse(raw); } catch (e) { return { status: 'parse_error' }; }

    var totalCalls = 0;
    for (var key in counters) {
      if (counters.hasOwnProperty(key)) {
        totalCalls += counters[key].count;
      }
    }

    if (totalCalls < 50) return { status: 'insufficient_data', calls: totalCalls };

    var benchmarkResults = this._loadExistingResults();
    var models = [];
    var modelsRaw = KnowledgeRepository.get(this.NAMESPACE_LLM, 'available_models');
    if (modelsRaw) {
      try {
        var parsed = JSON.parse(modelsRaw);
        models = parsed.map(function(m) { return m.id; });
      } catch (e) { models = []; }
    }

    for (var k in counters) {
      if (!counters.hasOwnProperty(k)) continue;
      var parts = k.split('|');
      var taskType = parts[0];
      var modelId = parts[1];
      var stat = counters[k];
      var successRate = stat.count > 0 ? stat.success / stat.count : 0;
      var avgLatency = stat.count > 0 ? stat.totalLatency / stat.count : 99999;

      if (benchmarkResults[modelId]) {
        if (successRate < 0.6) {
          benchmarkResults[modelId].totalScore = Math.max(0, benchmarkResults[modelId].totalScore - 15);
          AppLogger.info('LLM_INTEL_ADAPTIVE_DOWN', modelId + ':rate:' + Math.round(successRate * 100));
        } else if (successRate > 0.95 && avgLatency < 5000) {
          benchmarkResults[modelId].totalScore = Math.min(100, benchmarkResults[modelId].totalScore + 5);
          AppLogger.info('LLM_INTEL_ADAPTIVE_UP', modelId + ':rate:' + Math.round(successRate * 100));
        }
      }
    }

    this._saveResults(benchmarkResults);
    this._buildAndSaveMatrix(models, benchmarkResults);
    KnowledgeRepository.save(this.NAMESPACE_STATS, 'counters', '{}', 'RESET_AFTER_RERANK');
    AppLogger.info('LLM_INTEL_RERANK_COMPLETE', 'total_calls:' + totalCalls);

    return { status: 'reranked', totalCalls: totalCalls };
  }
};