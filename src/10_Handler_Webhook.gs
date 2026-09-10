/**
 * ===================================================================
 * ENTRY POINT: TELEGRAM WEBHOOK
 * Tanggung jawab: validasi keamanan, dedup, lalu delegasi ke
 * CommandRouter (fast path) atau Manager (conversational path).
 * ===================================================================
 */
const WebhookHandler = {
  DEDUP_CACHE_TTL_SECONDS: 21600, // 6 jam

  handle(e) {
    try {
      const config = Config.load();

      if (!this._isAuthorized(e, config)) {
        AppLogger.warning('SECURITY_BLOCK', 'Secret tidak valid');
        return ContentService.createTextOutput('Unauthorized');
      }

      const contents = JSON.parse(e.postData.contents);
      if (this._isDuplicateUpdate(contents)) {
        return ContentService.createTextOutput('OK');
      }

      const message = contents.message;
      if (!message || !message.text) {
        return ContentService.createTextOutput('OK');
      }

      const chatId = message.chat.id.toString();
      const text = message.text.trim();

      if (chatId !== config.myChatId) {
        AppLogger.warning('SECURITY_BLOCK', 'ChatId tidak dikenal: ' + chatId);
        return ContentService.createTextOutput('OK');
      }

      AppLogger.info('INCOMING_MESSAGE', text);
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

  _processMessage(chatId, text) {
    if (CommandRouter.isKnownCommand(text)) {
      const responseText = CommandRouter.handle(chatId, text);
      TelegramService.sendMessage(chatId, responseText);
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