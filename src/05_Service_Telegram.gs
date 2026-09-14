/**
 * SERVICE: TELEGRAM
 * Tanggung jawab: satu-satunya titik komunikasi ke Telegram Bot API.
 * Termasuk fallback otomatis jika Markdown gagal di-parse oleh Telegram.
 */
var TelegramService = {
  PLACEHOLDER_OPTIONS: [
    '🤔 Bentar, lagi mikir...',
    '💭 Oke, proses dulu ya...',
    '⏳ Tunggu sebentar...',
    '🤔 Hmm, bentar ya...'
  ],

  pickPlaceholder: function() {
    var i = Math.floor(Math.random() * this.PLACEHOLDER_OPTIONS.length);
    return this.PLACEHOLDER_OPTIONS[i];
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
      AppLogger.info('TELEGRAM_PARSE_RETRY',
        'Markdown gagal, kirim ulang sebagai Plain Text');

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
      AppLogger.info('TELEGRAM_EDIT_PARSE_RETRY',
        'Markdown gagal, edit ulang sebagai Plain Text');

      delete payload.parse_mode;
      options.payload = JSON.stringify(payload);

      response = UrlFetchApp.fetch(url, options);
      responseText = response.getContentText();
      AppLogger.info('TELEGRAM_EDIT_RETRY', responseText.substring(0, 200));
    } else {
      AppLogger.info('TELEGRAM_EDIT', responseText.substring(0, 200));
    }
  }
};