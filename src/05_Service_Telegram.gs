/**
 * ===================================================================
 * SERVICE: TELEGRAM (COMMUNICATION, MEDIA DOWNLOADER, WHISPER & VISION)
 * Tanggung jawab: Komunikasi Telegram Bot API, penanganan Markdown fallback,
 * pengunduhan file media, transkripsi suara (Whisper), dan analisis foto (Vision).
 * ===================================================================
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

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      AppLogger.error('TELEGRAM_SEND_PARSE_FAIL', e.message);
      return null;
    }

    if (data && !data.ok && data.description &&
        data.description.toLowerCase().indexOf("can't parse entities") !== -1) {
      AppLogger.info('TELEGRAM_PARSE_RETRY', 'Markdown gagal, kirim ulang sebagai Plain Text');

      delete payload.parse_mode;
      options.payload = JSON.stringify(payload);

      response = UrlFetchApp.fetch(url, options);
      responseText = response.getContentText();
      AppLogger.info('TELEGRAM_SEND_RETRY', responseText.substring(0, 200));

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        AppLogger.error('TELEGRAM_SEND_RETRY_FAIL', e.message);
        return null;
      }
    } else {
      AppLogger.info('TELEGRAM_SEND', responseText.substring(0, 200));
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

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      AppLogger.error('TELEGRAM_EDIT_PARSE_FAIL', e.message);
      return;
    }

    if (data && !data.ok && data.description &&
        data.description.toLowerCase().indexOf("can't parse entities") !== -1) {
      AppLogger.info('TELEGRAM_EDIT_PARSE_RETRY', 'Markdown gagal, edit ulang sebagai Plain Text');

      delete payload.parse_mode;
      options.payload = JSON.stringify(payload);

      response = UrlFetchApp.fetch(url, options);
      responseText = response.getContentText();
      AppLogger.info('TELEGRAM_EDIT_RETRY', responseText.substring(0, 200));
    } else {
      AppLogger.info('TELEGRAM_EDIT', responseText.substring(0, 200));
    }
  },

  /**
   * Mengambil Metadata File dari Telegram Bot API
   */
  getFile: function(fileId) {
    var config = Config.load();
    var url = 'https://api.telegram.org/bot' + config.telegramBotToken + '/getFile?file_id=' + encodeURIComponent(fileId);
    var response = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) return null;
    try {
      var data = JSON.parse(response.getContentText());
      return data && data.ok ? data.result : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Mengunduh File Media sebagai Blob dari Telegram Server
   */
  downloadFileBlob: function(filePath) {
    var config = Config.load();
    var url = 'https://api.telegram.org/file/bot' + config.telegramBotToken + '/' + filePath;
    var response = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) return null;
    return response.getBlob();
  },

  /**
   * Transkripsi Voice Note (.ogg) Menggunakan Groq Whisper API (whisper-large-v3)
   */
  transcribeVoiceNote: function(fileId) {
    var fileInfo = this.getFile(fileId);
    if (!fileInfo || !fileInfo.file_path) throw new Error('TELEGRAM_GET_FILE_FAILED');
    if (fileInfo.file_size && fileInfo.file_size > 20000000) {
      throw new Error('FILE_SIZE_EXCEEDS_LIMIT_20MB');
    }

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

    var code = response.getResponseCode();
    if (code !== 200) {
      throw new Error('GROQ_WHISPER_HTTP_' + code + '|' + response.getContentText().substring(0, 150));
    }

    var data = JSON.parse(response.getContentText());
    return data && data.text ? data.text.trim() : '';
  },

  /**
   * Analisis Foto / Struk / Dokumen Menggunakan Gemini 1.5 Flash Vision API
   */
  analyzePhoto: function(fileId, userCaption) {
    var fileInfo = this.getFile(fileId);
    if (!fileInfo || !fileInfo.file_path) throw new Error('TELEGRAM_GET_FILE_FAILED');
    if (fileInfo.file_size && fileInfo.file_size > 20000000) {
      throw new Error('FILE_SIZE_EXCEEDS_LIMIT_20MB');
    }

    var blob = this.downloadFileBlob(fileInfo.file_path);
    if (!blob) throw new Error('TELEGRAM_DOWNLOAD_BLOB_FAILED');

    var base64Image = Utilities.base64Encode(blob.getBytes());
    var mimeType = blob.getContentType() || 'image/jpeg';

    var config = Config.load();
    if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY_MISSING');

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + config.geminiApiKey;

    var promptText = KnowledgeRepository.get('vision', 'photo_analysis_prompt') || 
      'Ekstrak data penting, teks, atau deskripsikan gambar ini secara rinci.';

    if (userCaption && userCaption.trim().length > 0) {
      promptText += '\n\nCatatan Tambahan Pengguna: "' + userCaption + '"';
    }

    var payload = {
      contents: [{
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          }
        ]
      }]
    };

    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    if (code !== 200) {
      throw new Error('GEMINI_VISION_HTTP_' + code + '|' + response.getContentText().substring(0, 150));
    }

    var data = JSON.parse(response.getContentText());
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('GEMINI_VISION_EMPTY_RESPONSE');
  }
};