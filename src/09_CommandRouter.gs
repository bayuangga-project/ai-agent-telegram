/**
 * ===================================================================
 * COMMAND ROUTER
 * Tanggung jawab: deteksi & eksekusi command eksplisit Telegram
 * (fast path, tidak perlu panggil LLM/placeholder).
 * ===================================================================
 */
const CommandRouter = {
  PREFIX_INGAT: '/ingat ',
  COMMANDS_LIST_REMINDER: ['/reminder', '/reminders'],

  isKnownCommand(text) {
    return text.indexOf(this.PREFIX_INGAT) === 0 ||
      this.COMMANDS_LIST_REMINDER.indexOf(text) !== -1;
  },

  handle(chatId, text) {
    if (text.indexOf(this.PREFIX_INGAT) === 0) {
      return this._handleIngat(chatId, text);
    }
    if (this.COMMANDS_LIST_REMINDER.indexOf(text) !== -1) {
      return ReminderSpecialist.listActiveAsText();
    }
    return 'Command tidak dikenali.';
  },

  _handleIngat(chatId, text) {
    const factText = text.substring(this.PREFIX_INGAT.length).trim();
    if (factText.length === 0) {
      return 'Mau aku inget apa? Contoh: `/ingat aku suka kopi tanpa gula`';
    }
    KnowledgeSpecialist.saveManualFact(chatId, factText);
    return 'Oke, aku inget ini: _"' + factText + '"_ 👍';
  }
};