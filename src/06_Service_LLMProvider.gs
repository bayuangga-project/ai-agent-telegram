/**
 * ===================================================================
 * SERVICE: LLM PROVIDER ORCHESTRATOR (SMART BLACKLIST & COOLDOWN)
 * ===================================================================
 */
const LLMProviderService = {
  COOLDOWN_SECONDS: 1800, // 30 Menit Cooldown

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

    // 1. Jalur Utama: OpenRouter (dengan Blacklist & Cooldown Check)
    var openRouterKey = Config.load().openrouterApiKey;
    if (openRouterKey && rankedModels.length > 0) {
      for (var i = 0; i < rankedModels.length; i++) {
        var modelId = rankedModels[i];

        if (this._isModelBlacklisted(modelId)) {
          AppLogger.info('LLM_SKIP_BLACKLISTED', modelId);
          continue;
        }

        try {
          var text = OpenRouterProvider.call(params.systemInstruction, params.messages, params.temperature, modelId);
          var latency = new Date().getTime() - startTime;
          this._recordStatSafe(taskType, modelId, true, latency);
          AppLogger.info('LLM_OPENROUTER_SUCCESS', modelId + '|' + latency + 'ms');
          return { provider: 'openrouter', text: text, model: modelId };
        } catch (err) {
          var latencyFail = new Date().getTime() - startTime;
          this._recordStatSafe(taskType, modelId, false, latencyFail);
          
          var errStr = String(err.message || err);
          AppLogger.warning('LLM_OPENROUTER_FAIL', modelId + '|' + errStr);

          // Masukkan ke Blacklist Cooldown jika error 404/402/429/500/503
          if (this._shouldBlacklist(errStr)) {
            this._blacklistModel(modelId, errStr);
          }
        }
      }
    }

    // 2. Backup 1: Gemini
    var geminiKey = Config.load().geminiApiKey;
    if (geminiKey) {
      try {
        var geminiText = GeminiProvider.call(params.systemInstruction, params.messages, params.temperature, null);
        var geminiLatency = new Date().getTime() - startTime;
        this._recordStatSafe(taskType, 'gemini_backup', true, geminiLatency);
        AppLogger.info('LLM_BACKUP_GEMINI_SUCCESS', geminiLatency + 'ms');
        return { provider: 'gemini', text: geminiText, model: 'gemini-1.5-flash' };
      } catch (gErr) {
        AppLogger.warning('LLM_BACKUP_GEMINI_FAIL', String(gErr.message || gErr));
      }
    }

    // 3. Backup 2: Groq
    var groqKey = Config.load().groqApiKey;
    if (groqKey) {
      try {
        var groqText = GroqProvider.call(params.systemInstruction, params.messages, params.temperature);
        var groqLatency = new Date().getTime() - startTime;
        this._recordStatSafe(taskType, 'groq_backup', true, groqLatency);
        AppLogger.info('LLM_BACKUP_GROQ_SUCCESS', groqLatency + 'ms');
        return { provider: 'groq', text: groqText, model: 'llama_groq' };
      } catch (grErr) {
        AppLogger.warning('LLM_BACKUP_GROQ_FAIL', String(grErr.message || grErr));
      }
    }

    AppLogger.error('LLM_ALL_PROVIDERS_DOWN', 'task:' + taskType);
    return null;
  },

  generateFromSinglePrompt(promptText, temperature, taskType) {
    return this.generate({
      taskType: taskType || 'chat_light',
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
  },

  _isModelBlacklisted(modelId) {
    try {
      var cache = CacheService.getScriptCache();
      var key = this._getCacheKey(modelId);
      return cache.get(key) !== null;
    } catch (e) {
      return false;
    }
  },

  _blacklistModel(modelId, reason) {
    try {
      var cache = CacheService.getScriptCache();
      var key = this._getCacheKey(modelId);
      cache.put(key, 'blacklisted', this.COOLDOWN_SECONDS);
      AppLogger.warning('LLM_MODEL_BLACKLISTED', modelId + '|cooldown:' + this.COOLDOWN_SECONDS + 's|reason:' + reason.substring(0, 100));
    } catch (e) {
      AppLogger.error('LLM_BLACKLIST_SAVE_FAIL', e.message);
    }
  },

  _shouldBlacklist(errMessage) {
    if (!errMessage) return false;
    var msg = errMessage.toLowerCase();
    return msg.indexOf('404') >= 0 || 
           msg.indexOf('429') >= 0 || 
           msg.indexOf('402') >= 0 || 
           msg.indexOf('503') >= 0 || 
           msg.indexOf('500') >= 0 || 
           msg.indexOf('not found') >= 0 || 
           msg.indexOf('unavailable') >= 0 || 
           msg.indexOf('rate limit') >= 0 || 
           msg.indexOf('credit') >= 0 || 
           msg.indexOf('quota') >= 0;
  },

  _getCacheKey(modelId) {
    var clean = String(modelId || '').replace(/[^a-zA-Z0-9]/g, '_');
    return 'LLM_BL_' + clean.substring(0, 50);
  }
};