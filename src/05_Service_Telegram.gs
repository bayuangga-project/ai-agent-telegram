/**
 * ===================================================================
 * SERVICE: TELEGRAM
 * Tanggung jawab: satu-satunya titik komunikasi ke Telegram Bot API.
 * ===================================================================
 */
const TelegramService = {
  PLACEHOLDER_OPTIONS: [
    '🤔 Bentar, lagi mikir...',
    '💭 Oke, proses dulu ya...',
    '⏳ Tunggu sebentar...',
    '🤔 Hmm, bentar ya...'
  ],

  pickPlaceholder() {
    const i = Math.floor(Math.random() * this.PLACEHOLDER_OPTIONS.length);
    return this.PLACEHOLDER_OPTIONS[i];
  },

  sendMessage(chatId, text) {
    const config = Config.load();
    const url = 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage';
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' }),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    AppLogger.info('TELEGRAM_SEND', responseText.substring(0, 200));

    try {
      const data = JSON.parse(responseText);
      return data.result ? data.result.message_id : null;
    } catch (e) {
      AppLogger.error('TELEGRAM_SEND_PARSE_FAIL', e.message);
      return null;
    }
  },

  editMessage(chatId, messageId, text) {
    if (!messageId) {
      this.sendMessage(chatId, text);
      return;
    }

    const config = Config.load();
    const url = 'https://api.telegram.org/bot' + config.telegramBotToken + '/editMessageText';
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: chatId, message_id: messageId, text: text, parse_mode: 'Markdown'
      }),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    AppLogger.info('TELEGRAM_EDIT', response.getContentText().substring(0, 200));
  }
};