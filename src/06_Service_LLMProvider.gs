/**
 * ===================================================================
 * SERVICE: LLM PROVIDERS & ORCHESTRATOR
 * Mengelola Komunikasi Langsung ke OpenRouter, Gemini, dan Groq
 * dengan Dukungan Blacklist Cooldown & Fallback Otomatis.
 * ===================================================================
 */

const OpenRouterProvider = {
  API_URL: 'https://openrouter.ai/api/v1/chat/completions',

  call(systemInstruction, messages, temperature, modelName) {
    const config = Config.load();
    const apiKey = config.openrouterApiKey;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY belum diset di Script Properties');
    }

    const targetModel = modelName || config.openrouterModelFast;
    const formattedMessages = [];

    if (systemInstruction) {
      formattedMessages.push({ role: 'system', content: systemInstruction });
    }

    if (messages && messages.length > 0) {
      messages.forEach(function(msg) {
        formattedMessages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.text || msg.content || ''
        });
      });
    }

    const payload = {
      model: targetModel,
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://github.com/' + (config.githubRepoOwner || 'bayuangga') + '/' + (config.githubRepoName || 'ai-agent-telegram'),
        'X-Title': 'AI Agent Telegram'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(this.API_URL, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode !== 200) {
      throw new Error('OpenRouter Error HTTP ' + statusCode + ': ' + responseText.substring(0, 200));
    }

    const data = JSON.parse(responseText);
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error('OpenRouter invalid response structure: ' + responseText.substring(0, 200));
    }

    return data.choices[0].message.content;
  }
};

const GeminiProvider = {
  API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
  CACHE_KEY: 'GEMINI_DISCOVERED_MODEL',
  CACHE_TTL_SECONDS: 86400,

  _discoverActiveModel() {
    try {
      var cache = CacheService.getScriptCache();
      var cached = cache.get(this.CACHE_KEY);
      if (cached) return cached;
    } catch (e) {}

    var config = Config.load();
    var apiKey = config.geminiApiKey;
    if (!apiKey) return null;

    try {
      var url = this.API_BASE + '/models?key=' + apiKey;
      var response = UrlFetchApp.fetch(url, { method: 'GET', muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) return null;

      var data = JSON.parse(response.getContentText());
      if (!data.models || !Array.isArray(data.models)) return null;

      var activeModels = [];
      for (var i = 0; i < data.models.length; i++) {
        var m = data.models[i];
        if (!m.supportedGenerationMethods) continue;
        if (m.supportedGenerationMethods.indexOf('generateContent') === -1) continue;
        activeModels.push(m.name.replace(/^models\//, ''));
      }

      if (activeModels.length === 0) return null;

      var priorities = [
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash'
      ];

      var selectedModel = null;
      for (var p = 0; p < priorities.length; p++) {
        if (activeModels.indexOf(priorities[p]) >= 0) {
          selectedModel = priorities[p];
          break;
        }
      }

      if (!selectedModel) {
        for (var j = 0; j < activeModels.length; j++) {
          if (activeModels[j].indexOf('flash') >= 0 &&
              activeModels[j].indexOf('image') === -1 &&
              activeModels[j].indexOf('live') === -1 &&
              activeModels[j].indexOf('tts') === -1) {
            selectedModel = activeModels[j];
            break;
          }
        }
      }

      if (!selectedModel) selectedModel = activeModels[0];

      if (selectedModel) {
        try {
          CacheService.getScriptCache().put(this.CACHE_KEY, selectedModel, this.CACHE_TTL_SECONDS);
          AppLogger.info('GEMINI_MODEL_CACHED', selectedModel);
        } catch (e) {}
      }

      return selectedModel;
    } catch (e) {
      AppLogger.warning('GEMINI_DISCOVERY_FAIL', e.message);
      return null;
    }
  },

  _clearModelCache() {
    try {
      CacheService.getScriptCache().remove(this.CACHE_KEY);
    } catch (e) {}
  },

  call(systemInstruction, messages, temperature, modelName) {
    var config = Config.load();
    var apiKey = config.geminiApiKey;
    if (!apiKey) throw new Error('GEMINI_API_KEY_MISSING');

    var model = modelName || this._discoverActiveModel();
    if (!model) throw new Error('GEMINI_NO_ACTIVE_MODEL');

    var url = this.API_BASE + '/models/' + model + ':generateContent?key=' + apiKey;

    var contents = [];
    if (messages && messages.length > 0) {
      for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        var role = (msg.role === 'ai' || msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
        contents.push({
          role: role,
          parts: [{ text: msg.text || msg.content || '' }]
        });
      }
    } else {
      contents.push({ role: 'user', parts: [{ text: '-' }] });
    }

    var payload = {
      contents: contents,
      generationConfig: {
        temperature: typeof temperature === 'number' ? temperature : 0.7
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    var response = UrlFetchApp.fetch(url, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    if (code !== 200) {
      this._clearModelCache();
      throw new Error('GEMINI_HTTP_' + code + '|' + response.getContentText().substring(0, 200));
    }

    var data = JSON.parse(response.getContentText());
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('GEMINI_EMPTY_RESPONSE');
  }
};

const GroqProvider = {
  NAME: 'groq',
  MODEL: 'openai/gpt-oss-20b',
  ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',

  call(systemInstruction, messages, temperature) {
    const config = Config.load();
    if (!config.groqApiKey) {
      throw new Error('Groq API key tidak dikonfigurasi');
    }

    const chatMessages = [];
    if (systemInstruction) {
      chatMessages.push({ role: 'system', content: systemInstruction });
    }
    messages.forEach(m => {
      chatMessages.push({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      });
    });

    const payload = {
      model: this.MODEL,
      messages: chatMessages,
      max_tokens: 1536,
      temperature: temperature || 0.7
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + config.groqApiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(this.ENDPOINT, options);
    const code = response.getResponseCode();

    if (code === 429 || code === 503) {
      throw new Error('Groq overload (HTTP ' + code + ')');
    }
    if (code !== 200) {
      throw new Error('Groq HTTP error ' + code);
    }

    const data = JSON.parse(response.getContentText());
    const choice = data.choices && data.choices[0];
    if (!choice || !choice.message) {
      throw new Error('Groq tidak mengembalikan jawaban');
    }

    return choice.message.content;
  }
};

const LLMProviderService = {
  COOLDOWN_SECONDS: 1800,

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

          if (this._shouldBlacklist(errStr)) {
            this._blacklistModel(modelId, errStr);
          }
        }
      }
    }

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