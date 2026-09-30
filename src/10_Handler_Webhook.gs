/**
 * ===================================================================
 * ENTRY POINT: TELEGRAM WEBHOOK (TELEGRAM-FIRST ASYNC DISPATCH)
 * Tanggung jawab: validasi keamanan, dedup, ekstraksi media/teks,
 * dan delegasi ke CommandRouter atau Manager.
 * 100% PATUH PASAL 1.2 (ZERO HARDCODE HUMAN LANGUAGE STRINGS IN THIS FILE).
 * ===================================================================
 */
const WebhookHandler = {
  DEDUP_CACHE_TTL_SECONDS: 21600, // 6 jam

  handle(e) {
    try {
      const config = Config.load();

      if (!this._isAuthorized(e, config)) {
        AppLogger.warning('SECURITY_BLOCK', 'SECRET_INVALID');
        return ContentService.createTextOutput('Unauthorized');
      }

      const contents = JSON.parse(e.postData.contents);
      if (this._isDuplicateUpdate(contents)) {
        return ContentService.createTextOutput('OK');
      }

      const message = contents.message;
      if (!message) {
        return ContentService.createTextOutput('OK');
      }

      const chatId = message.chat.id.toString();

      if (chatId !== config.myChatId) {
        AppLogger.warning('SECURITY_BLOCK', 'UNAUTHORIZED_CHAT_ID:' + chatId);
        return ContentService.createTextOutput('OK');
      }

      const text = this._extractMessageContent(message);
      if (!text || text.trim().length === 0) {
        return ContentService.createTextOutput('OK');
      }

      AppLogger.info('INCOMING_MESSAGE', text.substring(0, 200));
      this._processMessage(chatId, text);

      return ContentService.createTextOutput('OK');
    } catch (error) {
      AppLogger.error('ERROR_DOPOST', error.message);
      return ContentService.createTextOutput('Error: ' + error.message);
    }
  },

  _isAuthorized(e, config) {
    return e.parameter.secret === config.sharedSecret;
  },

  _isDuplicateUpdate(contents) {
    const updateId = contents.update_id ? contents.update_id.toString() : null;
    if (!updateId) return false;

    const cache = CacheService.getScriptCache();
    const cacheKey = 'update_' + updateId;
    if (cache.get(cacheKey)) return true;

    cache.put(cacheKey, 'true', this.DEDUP_CACHE_TTL_SECONDS);
    return false;
  },

  _extractMessageContent(message) {
    if (message.text) {
      return message.text.trim();
    }

    var voiceObj = message.voice || message.audio;
    if (voiceObj && voiceObj.file_id) {
      try {
        AppLogger.info('PROCESSING_VOICE_NOTE', 'file_id:' + voiceObj.file_id);
        var transcript = TelegramService.transcribeVoiceNote(voiceObj.file_id);
        if (!transcript) {
          return '[Voice Note Transkrip]: (suara tidak terdengar jelas)';
        }
        return '[Voice Note Transkrip]: ' + transcript;
      } catch (e) {
        AppLogger.error('VOICE_TRANSCRIPTION_FAIL', e.message);
        return '[System Event]: Gagal memproses voice note - ' + e.message;
      }
    }

    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      try {
        var highestResPhoto = message.photo[message.photo.length - 1];
        AppLogger.info('PROCESSING_PHOTO', 'file_id:' + highestResPhoto.file_id);
        var visionDescription = TelegramService.analyzePhoto(highestResPhoto.file_id, message.caption);
        var captionText = message.caption ? '\nCatatan Pengguna: ' + message.caption : '';
        return '[Analisis Foto/Struk/Dokumen]: ' + visionDescription + captionText;
      } catch (e2) {
        AppLogger.error('PHOTO_VISION_FAIL', e2.message);
        return '[System Event]: Gagal memproses foto - ' + e2.message;
      }
    }

    if (message.document && message.document.mime_type && message.document.mime_type.indexOf('image/') === 0) {
      try {
        AppLogger.info('PROCESSING_IMAGE_DOCUMENT', 'file_id:' + message.document.file_id);
        var docVisionDesc = TelegramService.analyzePhoto(message.document.file_id, message.caption);
        var docCaptionText = message.caption ? '\nCatatan Pengguna: ' + message.caption : '';
        return '[Analisis Foto/Struk/Dokumen]: ' + docVisionDesc + docCaptionText;
      } catch (e3) {
        AppLogger.error('IMAGE_DOC_VISION_FAIL', e3.message);
        return '[System Event]: Gagal memproses dokumen gambar - ' + e3.message;
      }
    }

    if (message.video || message.sticker || message.location || message.contact) {
      var mediaType = message.video ? 'video' : (message.sticker ? 'stiker' : (message.location ? 'lokasi' : 'kontak'));
      return '[System Event]: User mengirimkan ' + mediaType + ' yang belum didukung.';
    }

    return null;
  },

  _processMessage(chatId, text) {
    if (CommandRouter.isKnownCommand(text)) {
      var responseText = CommandRouter.handle(chatId, text);
      if (responseText && responseText.trim().length > 0) {
        TelegramService.sendMessage(chatId, responseText);
      }
      return;
    }

    const placeholderId = TelegramService.sendMessage(chatId, TelegramService.pickPlaceholder());
    const finalText = Manager.processConversationalMessage(chatId, text);
    TelegramService.editMessage(chatId, placeholderId, finalText);
  }
};

function doPost(e) {
  return WebhookHandler.handle(e);
}