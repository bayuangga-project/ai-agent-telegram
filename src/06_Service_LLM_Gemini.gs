/**
 * ===================================================================
 * SERVICE: GEMINI LLM PROVIDER (TRUE AUTO-DISCOVERY)
 * ===================================================================
 */
const GeminiProvider = {
  API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
  _cachedModel: null,

  _discoverActiveModel() {
    if (this._cachedModel) return this._cachedModel;

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
        if (m.supportedGenerationMethods &&
            m.supportedGenerationMethods.indexOf('generateContent') >= 0) {
          activeModels.push(m.name.replace(/^models\//, ''));
        }
      }

      if (activeModels.length === 0) return null;

      // Prioritaskan flash terbaru
      var priorities = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
      for (var p = 0; p < priorities.length; p++) {
        if (activeModels.indexOf(priorities[p]) >= 0) {
          this._cachedModel = priorities[p];
          return this._cachedModel;
        }
      }

      // Ambil model flash apapun yang ada
      for (var j = 0; j < activeModels.length; j++) {
        if (activeModels[j].indexOf('flash') >= 0) {
          this._cachedModel = activeModels[j];
          return this._cachedModel;
        }
      }

      this._cachedModel = activeModels[0];
      return this._cachedModel;
    } catch (e) {
      AppLogger.warning('GEMINI_DISCOVERY_FAIL', e.message);
      return null;
    }
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
      throw new Error('GEMINI_HTTP_' + code + '|' + response.getContentText().substring(0, 200));
    }

    var data = JSON.parse(response.getContentText());
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('GEMINI_EMPTY_RESPONSE');
  }
};