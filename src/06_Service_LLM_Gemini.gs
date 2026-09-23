/**
 * ===================================================================
 * SERVICE: GEMINI LLM PROVIDER (VERIFIED MODELS SEP 2026)
 * Model aktif berdasarkan: https://ai.google.dev/gemini-api/docs/models
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
        if (!m.supportedGenerationMethods) continue;
        if (m.supportedGenerationMethods.indexOf('generateContent') === -1) continue;
        var modelName = m.name.replace(/^models\//, '');
        activeModels.push(modelName);
      }

      if (activeModels.length === 0) return null;

      // Prioritas berdasarkan dokumen resmi Google (Sep 2026):
      // 1. gemini-3.5-flash-lite  = tercepat, paling efisien (rekomendasi Google)
      // 2. gemini-3.6-flash       = balance speed + intelligence
      // 3. gemini-3.8-flash       = paling pintar (untuk tugas berat)
      // 4. gemini-3.7-flash       = alternatif bagus
      // 5. gemini-3.1-flash-lite  = hemat kuota
      var priorities = [
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash'
      ];

      for (var p = 0; p < priorities.length; p++) {
        if (activeModels.indexOf(priorities[p]) >= 0) {
          this._cachedModel = priorities[p];
          AppLogger.info('GEMINI_MODEL_SELECTED', this._cachedModel);
          return this._cachedModel;
        }
      }

      // Fallback: ambil model flash apapun yang tersedia
      for (var j = 0; j < activeModels.length; j++) {
        if (activeModels[j].indexOf('flash') >= 0 &&
            activeModels[j].indexOf('image') === -1 &&
            activeModels[j].indexOf('live') === -1 &&
            activeModels[j].indexOf('tts') === -1) {
          this._cachedModel = activeModels[j];
          AppLogger.info('GEMINI_MODEL_FALLBACK', this._cachedModel);
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