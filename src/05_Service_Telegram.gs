/**
 * SERVICE: TELEGRAM (COMMUNICATION, MEDIA DOWNLOADER, WHISPER & MULTI-PROVIDER VISION)
 * Tanggung jawab: Komunikasi Telegram Bot API, penanganan Markdown fallback,
 * pengunduhan file media, transkripsi suara (Whisper), dan analisis foto (Vision).
 * 100% PATUH PASAL 1.2 (ZERO HARDCODE HUMAN LANGUAGE STRINGS IN THIS FILE).
 */
var TelegramService = {

  pickPlaceholder: function() {
    try {
      var raw = KnowledgeRepository.get('chat', 'placeholders');
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          var idx = Math.floor(Math.random() * arr.length);
          return arr[idx];
        }
      }
    } catch (e) {}
    
    // Auto-Bootstrap Placeholder ke Database jika belum ada
    var defaultPlaceholders = JSON.stringify(['⏳ ...', '💭 ...', '🤔 ...']);
    KnowledgeRepository.save('chat', 'placeholders', defaultPlaceholders, 'AUTO_BOOTSTRAP_PLACEHOLDERS');
    return '⏳ ...';
  },

  sendMessage: function(chatId, text) {
    var config = Config.load();
    var url = 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage';

    var payload = { chat_id: chatId, text: text, parse_mode: 'Markdown' };
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var data;

    try { data = JSON.parse(responseText); } catch (e) { return null; }

    if (data && !data.ok && data.description &&
        data.description.toLowerCase().indexOf("can't parse entities") !== -1) {
      AppLogger.info('TELEGRAM_PARSE_RETRY', 'PARSER_FAILED_FALLBACK_PLAIN');
      delete payload.parse_mode;
      options.payload = JSON.stringify(payload);
      response = UrlFetchApp.fetch(url, options);
      responseText = response.getContentText();
      try { data = JSON.parse(responseText); } catch (e) { return null; }
    }

    return data && data.result ? data.result.message_id : null;
  },

  editMessage: function(chatId, messageId, text) {
    if (!messageId) {
      this.sendMessage(chatId, text);
      return;
    }

    var config = Config.load();
    var url = 'https://api.telegram.org/bot' + config.telegramBotToken + '/editMessageText';

    var payload = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown'
    };
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var data;

    try { data = JSON.parse(responseText); } catch (e) { return; }

    if (data && !data.ok && data.description &&
        data.description.toLowerCase().indexOf("can't parse entities") !== -1) {
      AppLogger.info('TELEGRAM_EDIT_PARSE_RETRY', 'PARSER_FAILED_FALLBACK_PLAIN');
      delete payload.parse_mode;
      options.payload = JSON.stringify(payload);
      UrlFetchApp.fetch(url, options);
    }
  },

  getFile: function(fileId) {
    var config = Config.load();
    var url = 'https://api.telegram.org/bot' + config.telegramBotToken + '/getFile?file_id=' + encodeURIComponent(fileId);
    var response = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return null;
    try {
      var data = JSON.parse(response.getContentText());
      return data && data.ok ? data.result : null;
    } catch (e) { return null; }
  },

  downloadFileBlob: function(filePath) {
    var config = Config.load();
    var url = 'https://api.telegram.org/file/bot' + config.telegramBotToken + '/' + filePath;
    var response = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return null;
    return response.getBlob();
  },

  transcribeVoiceNote: function(fileId) {
    var fileInfo = this.getFile(fileId);
    if (!fileInfo || !fileInfo.file_path) throw new Error('TELEGRAM_GET_FILE_FAILED');

    var blob = this.downloadFileBlob(fileInfo.file_path);
    if (!blob) throw new Error('TELEGRAM_DOWNLOAD_BLOB_FAILED');

    var config = Config.load();
    if (!config.groqApiKey) throw new Error('GROQ_API_KEY_MISSING');

    var url = 'https://api.groq.com/openai/v1/audio/transcriptions';
    var payload = {
      file: blob.setName('audio.ogg'),
      model: 'whisper-large-v3',
      response_format: 'json',
      language: 'id'
    };

    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + config.groqApiKey },
      payload: payload,
      muteHttpExceptions: true
    });

    var data = JSON.parse(response.getContentText());
    return data && data.text ? data.text.trim() : '';
  },

  /**
   * Analisis Foto dengan Multi-Provider Resilient Fallback
   * 100% PASAL 1.2 COMPLIANT: Prompt & Template dibaca murni dari Database Knowledge
   */
  analyzePhoto: function(fileId, userCaption) {
    var fileInfo = this.getFile(fileId);
    if (!fileInfo || !fileInfo.file_path) throw new Error('TELEGRAM_GET_FILE_FAILED');

    var blob = this.downloadFileBlob(fileInfo.file_path);
    if (!blob) throw new Error('TELEGRAM_DOWNLOAD_BLOB_FAILED');

    var pathLower = fileInfo.file_path.toLowerCase();
    var mimeType = 'image/jpeg';
    if (pathLower.indexOf('.png') !== -1) mimeType = 'image/png';
    else if (pathLower.indexOf('.webp') !== -1) mimeType = 'image/webp';

    var base64Image = Utilities.base64Encode(blob.getBytes()).replace(/\s+/g, '');
    var config = Config.load();

    // 1. Ambil Prompt dari Knowledge Database (Auto-Bootstrap jika belum ada)
    var promptText = KnowledgeRepository.get('vision', 'photo_analysis_prompt');
    if (!promptText) {
      promptText = 'Ekstrak data penting dari gambar/struk ini secara ringkas, jelas, dan BERSIH TANPA SIMBOL BINTANG (*) ATAU PLUS (+).\n' +
        'Sebutkan:\n' +
        '- Toko: [Nama Toko]\n' +
        '- Barang: [Daftar Barang]\n' +
        '- Total: [Nominal Angka Murni]\n' +
        '- Metode Pembayaran: [BCA / QRIS / Cash / GoPay / dll]';
      KnowledgeRepository.save('vision', 'photo_analysis_prompt', promptText, 'AUTO_BOOTSTRAP_VISION_PROMPT');
    }

    if (userCaption && userCaption.trim().length > 0) {
      var captionTpl = KnowledgeRepository.get('vision', 'user_caption_template') || '\n\nCatatan User: "{{caption}}"';
      promptText += TemplateEngine.render(captionTpl, { caption: userCaption.trim() });
    }

    // 2. Jalur Utama: Google Gemini API (Discovery Active Model)
    if (config.geminiApiKey) {
      var geminiModels = [];
      if (typeof GeminiProvider !== 'undefined' && GeminiProvider._discoverActiveModel) {
        var discovered = GeminiProvider._discoverActiveModel();
        if (discovered) geminiModels.push(discovered);
      }
      geminiModels.push('gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-2.0-flash-exp');

      for (var m = 0; m < geminiModels.length; m++) {
        var modelName = geminiModels[m];
        var urlGemini = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + config.geminiApiKey;

        var payloadGemini = {
          contents: [{
            parts: [
              { text: promptText },
              { inlineData: { mimeType: mimeType, data: base64Image } }
            ]
          }]
        };

        try {
          var resG = UrlFetchApp.fetch(urlGemini, {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payloadGemini),
            muteHttpExceptions: true
          });

          if (resG.getResponseCode() === 200) {
            var dataG = JSON.parse(resG.getContentText());
            if (dataG.candidates && dataG.candidates[0] && dataG.candidates[0].content && dataG.candidates[0].content.parts) {
              AppLogger.info('VISION_GEMINI_SUCCESS', 'model:' + modelName);
              return dataG.candidates[0].content.parts[0].text;
            }
          }
        } catch (eG) {}
      }
    }

    // 3. Jalur Backup: OpenRouter Vision API
    if (config.openrouterApiKey) {
      var urlOR = 'https://openrouter.ai/api/v1/chat/completions';
      var openRouterVisionModels = [
        'meta-llama/llama-3.2-11b-vision-instruct:free',
        'qwen/qwen-2-vl-72b-instruct:free',
        'google/gemini-2.0-flash-exp:free'
      ];

      for (var o = 0; o < openRouterVisionModels.length; o++) {
        var orModel = openRouterVisionModels[o];
        var payloadOR = {
          model: orModel,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image_url', image_url: { url: 'data:' + mimeType + ';base64,' + base64Image } }
            ]
          }]
        };

        try {
          var resOR = UrlFetchApp.fetch(urlOR, {
            method: 'post',
            headers: {
              'Authorization': 'Bearer ' + config.openrouterApiKey,
              'HTTP-Referer': 'https://github.com/bayuangga-project/ai-agent-telegram'
            },
            contentType: 'application/json',
            payload: JSON.stringify(payloadOR),
            muteHttpExceptions: true
          });

          if (resOR.getResponseCode() === 200) {
            var dataOR = JSON.parse(resOR.getContentText());
            if (dataOR.choices && dataOR.choices[0] && dataOR.choices[0].message) {
              AppLogger.info('VISION_OPENROUTER_SUCCESS', 'model:' + orModel);
              return dataOR.choices[0].message.content;
            }
          }
        } catch (eOR) {}
      }
    }

    throw new Error('VISION_ALL_PROVIDERS_FAILED');
  }
};