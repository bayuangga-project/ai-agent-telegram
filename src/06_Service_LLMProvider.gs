/**
 * ===================================================================
 * SERVICE: LLM PROVIDER ORCHESTRATOR (CIRCUIT-BREAKER ROUTING)
 * ===================================================================
 */
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
      call: function(sys, msgs, temp) {
        return GroqProvider.call(sys, msgs, temp);
      }
    }
  },

  generate(params) {
    var taskType = params.taskType || 'chat_light';
    var rankedModels = [];

    try {
      rankedModels = LLMIntelligence.getRankedModelsForTask(taskType);
    } catch (e) {
      rankedModels = [];
    }

    rankedModels = (rankedModels || []).filter(function(m) {
      return m && typeof m === 'string' && m.trim().length > 0;
    });

    var startTime = new Date().getTime();

    // 1. Jalur Utama: OpenRouter Free Models (dengan Circuit Breaker)
    var openRouterKey = Config.load().openrouterApiKey;
    if (openRouterKey && rankedModels.length > 0) {
      for (var i = 0; i < rankedModels.length; i++) {
        var modelId = rankedModels[i];
        if (modelId.indexOf(':free') === -1) continue;

        try {
          var text = OpenRouterProvider.call(params.systemInstruction, params.messages, params.temperature, modelId);
          var latency = new Date().getTime() - startTime;
          this._recordStatSafe(taskType, modelId, true, latency);
          AppLogger.info('LLM_OPENROUTER_SUCCESS', modelId + '|' + latency + 'ms');
          return { provider: 'openrouter', text: text, model: modelId };
        } catch (err) {
          var latencyFail = new Date().getTime() - startTime;
          this._recordStatSafe(taskType, modelId, false, latencyFail);
          AppLogger.warning('LLM_OPENROUTER_FAIL', modelId + '|' + err.message);

          // CIRCUIT BREAKER: Jika kuota harian akun free habis (429), langsung hentikan loop OpenRouter
          if (err.message && err.message.indexOf('429') >= 0) {
            AppLogger.warning('LLM_CIRCUIT_BREAKER', 'openrouter_daily_limit_hit_skipping_all');
            break;
          }
        }
      }
    }

    // 2. Backup 1: Gemini (Model Stabil gemini-1.5-flash)
    var geminiKey = Config.load().geminiApiKey;
    if (geminiKey) {
      try {
        var geminiText = GeminiProvider.call(params.systemInstruction, params.messages, params.temperature, null);
        var geminiLatency = new Date().getTime() - startTime;
        this._recordStatSafe(taskType, 'gemini_backup', true, geminiLatency);
        AppLogger.info('LLM_BACKUP_GEMINI_SUCCESS', geminiLatency + 'ms');
        return { provider: 'gemini', text: geminiText, model: 'gemini-1.5-flash' };
      } catch (gErr) {
        AppLogger.warning('LLM_BACKUP_GEMINI_FAIL', gErr.message);
      }
    }

    // 3. Backup 2: Groq (Llama-3.3-70b)
    var groqKey = Config.load().groqApiKey;
    if (groqKey) {
      try {
        var groqText = GroqProvider.call(params.systemInstruction, params.messages, params.temperature);
        var groqLatency = new Date().getTime() - startTime;
        this._recordStatSafe(taskType, 'groq_backup', true, groqLatency);
        AppLogger.info('LLM_BACKUP_GROQ_SUCCESS', groqLatency + 'ms');
        return { provider: 'groq', text: groqText, model: 'llama_groq' };
      } catch (grErr) {
        AppLogger.warning('LLM_BACKUP_GROQ_FAIL', grErr.message);
      }
    }

    AppLogger.error('LLM_ALL_PROVIDERS_DOWN', 'task:' + taskType);
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

  _recordStatSafe(taskType, modelId, success, latency) {
    try {
      if (typeof LLMIntelligence !== 'undefined' && LLMIntelligence.recordStat) {
        LLMIntelligence.recordStat(taskType, modelId, success, latency);
      }
    } catch (e) {}
  }
};