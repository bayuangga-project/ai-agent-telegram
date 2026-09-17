const LLMProviderService = {
  REGISTRY: {
    openrouter: {
      apiKeyProperty: 'openrouterApiKey',
      call: function(sys, msgs, temp, model) {
        return OpenRouterProvider.call(sys, msgs, temp, model);
      }
    },
    gemini: {
      apiKeyProperty: 'geminiApiKey',
      call: function(sys, msgs, temp, model) {
        return GeminiProvider.call(sys, msgs, temp, model);
      }
    },
    groq: {
      apiKeyProperty: 'groqApiKey',
      call: function(sys, msgs, temp, model) {
        return GroqProvider.call(sys, msgs, temp);
      }
    }
  },

  generate(params) {
    var taskType = params.taskType || 'chat_light';
    var rankedModels = LLMIntelligence.getRankedModelsForTask(taskType);
    var startTime = new Date().getTime();
    var success = false;
    var usedModel = null;

    if (rankedModels.length === 0) {
      AppLogger.info('LLM_NO_MATRIX', 'triggering_discovery');
      LLMIntelligence.discoverAndBenchmark();
      rankedModels = LLMIntelligence.getRankedModelsForTask(taskType);
    }

    for (var i = 0; i < rankedModels.length; i++) {
      var modelId = rankedModels[i];
      var provider = this._detectProvider(modelId);
      var entry = this.REGISTRY[provider];
      if (!entry) continue;

      var config = Config.load();
      var apiKey = config[entry.apiKeyProperty];
      if (!apiKey) continue;

      try {
        var text = entry.call(params.systemInstruction, params.messages, params.temperature, modelId);
        var latency = new Date().getTime() - startTime;
        success = true;
        usedModel = modelId;
        LLMIntelligence.recordStat(taskType, modelId, true, latency);
        AppLogger.info('LLM_SUCCESS', provider + ':' + modelId + ':' + latency + 'ms');
        return { provider: provider, text: text, model: modelId };
      } catch (err) {
        var latencyFail = new Date().getTime() - startTime;
        LLMIntelligence.recordStat(taskType, modelId, false, latencyFail);
        AppLogger.warning('LLM_STEP_FAIL', modelId + ':' + err.message);
      }
    }

    var fallbackProviders = ['gemini', 'groq'];
    for (var j = 0; j < fallbackProviders.length; j++) {
      var fbProvider = fallbackProviders[j];
      var fbEntry = this.REGISTRY[fbProvider];
      var fbConfig = Config.load();
      if (!fbConfig[fbEntry.apiKeyProperty]) continue;

      try {
        var fbText = fbEntry.call(params.systemInstruction, params.messages, params.temperature, null);
        var fbLatency = new Date().getTime() - startTime;
        LLMIntelligence.recordStat(taskType, fbProvider + '_fallback', true, fbLatency);
        AppLogger.info('LLM_FALLBACK_SUCCESS', fbProvider);
        return { provider: fbProvider, text: fbText, model: 'default' };
      } catch (err) {
        AppLogger.warning('LLM_FALLBACK_FAIL', fbProvider + ':' + err.message);
      }
    }

    AppLogger.error('LLM_ALL_FAILED', 'task:' + taskType);
    return null;
  },

  generateFromSinglePrompt(promptText, temperature, chain, taskType) {
    return this.generate({
      taskType: taskType || 'chat_light',
      chain: chain || 'fast',
      messages: [{ role: 'user', text: promptText }],
      temperature: temperature
    });
  },

  _detectProvider(modelId) {
    if (!modelId) return 'gemini';
    if (modelId.indexOf('/') >= 0) return 'openrouter';
    if (modelId.indexOf('llama') >= 0 || modelId.indexOf('gemma') >= 0) return 'groq';
    if (modelId.indexOf('gemini') >= 0) return 'gemini';
    return 'openrouter';
  }
};