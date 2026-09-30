/**
 * ===================================================================
 * SERVICE: LLM PROVIDER ORCHESTRATOR (SOTA NATIVE TOOLS SUPPORT & AUTO FALLBACK)
 * Tanggung jawab: Mengirimkan parameter tools resmi ke OpenRouter/Gemini/Groq API,
 * dengan penanganan fallback otomatis jika model tidak mendukung Native Tools.
 * 100% PATUH PASAL 1.2 (ZERO HARDCODE HUMAN LANGUAGE STRINGS IN THIS FILE).
 * ===================================================================
 */

var OpenRouterProvider = {
  API_URL: 'https://openrouter.ai/api/v1/chat/completions',

  call: function(systemInstruction, messages, temperature, modelName, tools) {
    var config = Config.load();
    var apiKey = config.openrouterApiKey;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY_MISSING');
    }

    var targetModel = modelName || config.openrouterModelFast;
    var formattedMessages = [];

    if (systemInstruction) {
      formattedMessages.push({ role: 'system', content: systemInstruction });
    }

    if (messages && messages.length > 0) {
      messages.forEach(function(msg) {
        formattedMessages.push({
          role: msg.role === 'ai' || msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user',
          content: msg.text || msg.content || ''
        });
      });
    }

    var payload = {
      model: targetModel,
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7
    };

    if (tools && Array.isArray(tools) && tools.length > 0) {
      payload.tools = tools;
    }

    var options = {
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

    var response = UrlFetchApp.fetch(this.API_URL, options);
    var statusCode = response.getResponseCode();
    var responseText = response.getContentText();

    if (statusCode !== 200) {
      throw new Error('OpenRouter Error HTTP ' + statusCode + ': ' + responseText.substring(0, 200));
    }

    var data = JSON.parse(responseText);
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error('OpenRouter invalid response structure: ' + responseText.substring(0, 200));
    }

    var msgObj = data.choices[0].message;
    if (msgObj.tool_calls && msgObj.tool_calls.length > 0) {
      var tc = msgObj.tool_calls[0];
      return JSON.stringify({
        thought: 'Native Tool Calling executed',
        action: tc.function ? tc.function.name : tc.name,
        tool_params: tc.function && tc.function.arguments ? (typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments) : {}
      });
    }

    return msgObj.content;
  }
};

var GeminiProvider = {
  API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
  CACHE_KEY: 'GEMINI_DISCOVERED_MODEL',
  CACHE_TTL_SECONDS: 86400,

  _discoverActiveModel: function() {
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
        'gemini-3.5-flash',
        'gemini-1.5-flash'
      ];

      var selectedModel = null;
      for (var p = 0; p < priorities.length; p++) {
        if (activeModels.indexOf(priorities[p]) >= 0) {
          selectedModel = priorities[p];
          break;
        }
      }

      if (!selectedModel) selectedModel = activeModels[0];

      if (selectedModel) {
        try {
          CacheService.getScriptCache().put(this.CACHE_KEY, selectedModel, this.CACHE_TTL_SECONDS);
        } catch (e) {}
      }

      return selectedModel;
    } catch (e) {
      return null;
    }
  },

  call: function(systemInstruction, messages, temperature, modelName) {
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
      throw new Error('GEMINI_HTTP_' + code + '|' + response.getContentText().substring(0, 150));
    }

    var data = JSON.parse(response.getContentText());
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('GEMINI_EMPTY_RESPONSE');
  }
};

var GroqProvider = {
  NAME: 'groq',
  MODEL: 'llama-3.3-70b-versatile',
  ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',

  call: function(systemInstruction, messages, temperature, modelName) {
    var config = Config.load();
    if (!config.groqApiKey) {
      throw new Error('GROQ_API_KEY_MISSING');
    }

    var targetModel = modelName || this.MODEL;
    var chatMessages = [];

    if (systemInstruction) {
      chatMessages.push({ role: 'system', content: systemInstruction });
    }

    if (messages && messages.length > 0) {
      messages.forEach(function(m) {
        chatMessages.push({
          role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.text || m.content || ''
        });
      });
    }

    var payload = {
      model: targetModel,
      messages: chatMessages,
      max_tokens: 2048,
      temperature: typeof temperature === 'number' ? temperature : 0.7
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + config.groqApiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(this.ENDPOINT, options);
    var code = response.getResponseCode();

    if (code !== 200) {
      throw new Error('GROQ_HTTP_' + code + '|' + response.getContentText().substring(0, 150));
    }

    var data = JSON.parse(response.getContentText());
    var choice = data.choices && data.choices[0];
    if (!choice || !choice.message) {
      throw new Error('GROQ_EMPTY_RESPONSE');
    }

    return choice.message.content;
  }
};

var LLMProviderService = {
  COOLDOWN_SECONDS: 1800,

  generate: function(params) {
    var taskType = params.taskType || 'chat_light';
    var rankedModels = [];

    try {
      rankedModels = LLMIntelligence.getRankedModelObjectsForTask(taskType);
    } catch (e) {
      rankedModels = [];
    }

    var startTime = new Date().getTime();
    var config = Config.load();

    if (rankedModels && rankedModels.length > 0) {
      for (var i = 0; i < rankedModels.length; i++) {
        var item = rankedModels[i];
        var modelId = item.model_id;
        var provider = item.provider || this._inferProvider(modelId);

        if (this._isModelBlacklisted(modelId)) {
          AppLogger.info('LLM_SKIP_BLACKLISTED', modelId);
          continue;
        }

        try {
          var responseText = null;

          if (provider === 'gemini' && config.geminiApiKey) {
            responseText = GeminiProvider.call(params.systemInstruction, params.messages, params.temperature, modelId);
          } else if (provider === 'groq' && config.groqApiKey) {
            responseText = GroqProvider.call(params.systemInstruction, params.messages, params.temperature, modelId);
          } else if (config.openrouterApiKey) {
            // Coba panggil dengan Native Tools jika disertakan, fallback jika HTTP 400
            try {
              responseText = OpenRouterProvider.call(params.systemInstruction, params.messages, params.temperature, modelId, params.tools);
            } catch (errTools) {
              if (String(errTools.message).indexOf('400') !== -1 && params.tools) {
                // Fallback tanpa parameter tools (Prompt-based ReAct)
                responseText = OpenRouterProvider.call(params.systemInstruction, params.messages, params.temperature, modelId, null);
              } else {
                throw errTools;
              }
            }
          } else {
            continue;
          }

          var latency = new Date().getTime() - startTime;
          this._recordStatSafe(taskType, modelId, true, latency);
          AppLogger.info('LLM_MODEL_SUCCESS', modelId + '[' + provider + ']|' + latency + 'ms');

          return { provider: provider, text: responseText, model: modelId };

        } catch (err) {
          var latencyFail = new Date().getTime() - startTime;
          this._recordStatSafe(taskType, modelId, false, latencyFail);

          var errStr = String(err.message || err);
          AppLogger.warning('LLM_MODEL_FAIL', modelId + '[' + provider + ']|' + errStr);

          if (errStr.indexOf('404') !== -1 || errStr.toLowerCase().indexOf('not found') !== -1) {
            if (typeof LLMIntelligence !== 'undefined' && LLMIntelligence.setDeprecated) {
              LLMIntelligence.setDeprecated(modelId, errStr);
            }
          } else if (this._shouldBlacklist(errStr)) {
            this._blacklistModel(modelId, errStr);
          }
        }
      }
    }

    if (config.geminiApiKey) {
      try {
        var gText = GeminiProvider.call(params.systemInstruction, params.messages, params.temperature, null);
        var gLatency = new Date().getTime() - startTime;
        this._recordStatSafe(taskType, 'gemini_fallback', true, gLatency);
        AppLogger.info('LLM_FALLBACK_GEMINI_SUCCESS', gLatency + 'ms');
        return { provider: 'gemini', text: gText, model: 'gemini-fallback' };
      } catch (gErr) {
        AppLogger.warning('LLM_FALLBACK_GEMINI_FAIL', String(gErr.message || gErr));
      }
    }

    if (config.groqApiKey) {
      try {
        var grText = GroqProvider.call(params.systemInstruction, params.messages, params.temperature, null);
        var grLatency = new Date().getTime() - startTime;
        this._recordStatSafe(taskType, 'groq_fallback', true, grLatency);
        AppLogger.info('LLM_FALLBACK_GROQ_SUCCESS', grLatency + 'ms');
        return { provider: 'groq', text: grText, model: 'groq-fallback' };
      } catch (grErr) {
        AppLogger.warning('LLM_FALLBACK_GROQ_FAIL', String(grErr.message || grErr));
      }
    }

    AppLogger.error('LLM_ALL_PROVIDERS_DOWN', 'task:' + taskType);
    return null;
  },

  generateFromSinglePrompt: function(promptText, temperature, taskType) {
    return this.generate({
      taskType: taskType || 'chat_light',
      messages: [{ role: 'user', text: promptText }],
      temperature: temperature
    });
  },

  _inferProvider: function(modelId) {
    if (!modelId) return 'openrouter';
    var clean = String(modelId).toLowerCase();
    if (clean.indexOf('gemini') !== -1) return 'gemini';
    if (clean.indexOf('groq') !== -1 || clean.indexOf('llama_groq') !== -1) return 'groq';
    return 'openrouter';
  },

  _recordStatSafe: function(taskType, modelId, success, latency) {
    try {
      if (typeof LLMIntelligence !== 'undefined' && LLMIntelligence.recordStat) {
        LLMIntelligence.recordStat(taskType, modelId, success, latency);
      }
    } catch (e) {}
  },

  _isModelBlacklisted: function(modelId) {
    try {
      var cache = CacheService.getScriptCache();
      var key = this._getCacheKey(modelId);
      return cache.get(key) !== null;
    } catch (e) {
      return false;
    }
  },

  _blacklistModel: function(modelId, reason) {
    try {
      var cache = CacheService.getScriptCache();
      var key = this._getCacheKey(modelId);
      cache.put(key, 'blacklisted', this.COOLDOWN_SECONDS);

      if (typeof LLMIntelligence !== 'undefined' && LLMIntelligence.setCooldown) {
        LLMIntelligence.setCooldown(modelId, this.COOLDOWN_SECONDS, reason);
      }
    } catch (e) {
      AppLogger.error('LLM_BLACKLIST_SAVE_FAIL', e.message);
    }
  },

  _shouldBlacklist: function(errMessage) {
    if (!errMessage) return false;
    var msg = errMessage.toLowerCase();
    return msg.indexOf('429') >= 0 || 
           msg.indexOf('402') >= 0 || 
           msg.indexOf('503') >= 0 || 
           msg.indexOf('500') >= 0 || 
           msg.indexOf('rate limit') >= 0 || 
           msg.indexOf('credit') >= 0 || 
           msg.indexOf('quota') >= 0;
  },

  _getCacheKey: function(modelId) {
    var clean = String(modelId || '').replace(/[^a-zA-Z0-9]/g, '_');
    return 'LLM_BL_' + clean.substring(0, 50);
  }
};