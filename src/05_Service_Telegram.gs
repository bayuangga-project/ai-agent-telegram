/**
 * SERVICE: TELEGRAM (COMMUNICATION, MEDIA DOWNLOADER, WHISPER & RESILIENT VISION)
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

  analyzePhoto: function(fileId, userCaption) {
    var fileInfo = this.getFile(fileId);
    if (!fileInfo || !fileInfo.file_path) throw new Error('TELEGRAM_GET_FILE_FAILED');

    var blob = this.downloadFileBlob(fileInfo.file_path);
    if (!blob) throw new Error('TELEGRAM_DOWNLOAD_BLOB_FAILED');

    var pathLower = fileInfo.file_path.toLowerCase();
    var mimeType = 'image/jpeg';
    if (pathLower.indexOf('.png') !== -1) mimeType = 'image/png';
    else if (pathLower.indexOf('.webp') !== -1) mimeType = 'image/webp';

    var base64Image = Utilities.base64Encode(blob.getBytes()).replace(/\s/g, '');

    var config = Config.load();
    if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY_MISSING');

    // Clean Vision Prompt tanpa Simbol Bintang (*) atau Plus (+)
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
      promptText += '\n\nCatatan User: "' + userCaption + '"';
    }

    var payload = {
      contents: [{
        parts: [
          { text: promptText },
          { inlineData: { mimeType: mimeType, data: base64Image } }
        ]
      }]
    };

    var visionModels = ['gemini-2.0-flash-exp', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.5-flash'];
    for (var m = 0; m < visionModels.length; m++) {
      var model = visionModels[m];
      var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + config.geminiApiKey;

      try {
        var response = UrlFetchApp.fetch(url, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });

        if (response.getResponseCode() === 200) {
          var data = JSON.parse(response.getContentText());
          if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            return data.candidates[0].content.parts[0].text;
          }
        }
      } catch (e) {}
    }

    throw new Error('GEMINI_VISION_ALL_MODELS_FAILED');
  }
};