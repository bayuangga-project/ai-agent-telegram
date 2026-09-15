/**
 * ===================================================================
 * COMMAND ROUTER
 * ===================================================================
 */
const CommandRouter = {
  PREFIX_INGAT: '/ingat ',
  COMMANDS_LIST_REMINDER: ['/reminder', '/reminders'],

  isKnownCommand(text) {
    const cleanText = text.trim();
    const firstWord = cleanText.split(' ')[0].toLowerCase();
    return text.indexOf(this.PREFIX_INGAT) === 0 ||
      this.COMMANDS_LIST_REMINDER.indexOf(cleanText) !== -1 ||
      firstWord === '/diagnose' || firstWord === '/heal' ||
      firstWord === '/logs' || firstWord === '/patch' ||
      firstWord === '/build';
  },

  handle(chatId, text) {
    const cleanText = text.trim();
    const firstWord = cleanText.split(' ')[0].toLowerCase();
    const args = cleanText.substring(firstWord.length).trim();

    if (text.indexOf(this.PREFIX_INGAT) === 0)
      return this._handleIngat(chatId, text);
    if (this.COMMANDS_LIST_REMINDER.indexOf(cleanText) !== -1)
      return ReminderSpecialist.listActiveAsText();
    if (firstWord === '/diagnose' || firstWord === '/heal') {
      const keluhan = args || 'Cek log terakhir, apakah ada error?';
      return SelfHealingSpecialist.diagnose(keluhan);
    }
    if (firstWord === '/logs') {
      const count = parseInt(args, 10) || 10;
      const logs = SelfHealingSpecialist._getRecentLogs(count);
      if (logs.length === 0) return '📋 Log kosong.';
      let reply = '📋 *' + logs.length + ' Log Terakhir:*\n\n';
      logs.forEach(function(log) {
        const isErr = String(log.event).toUpperCase().indexOf('FAIL') !== -1;
        reply += (isErr ? '🔴' : '🟢') + ' `' + log.event + '` ' +
                 log.detail.substring(0, 80) + '\n';
      });
      return reply;
    }
    if (firstWord === '/patch') {
      if (args === 'apply') return SelfHealingSpecialist.applyPendingPatch(null);
      return '🔧 `/patch apply` | `/diagnose` | `/logs`';
    }
    if (firstWord === '/build') {
      if (!args) return '🏗️ Gunakan: `/build <deskripsi fitur>`\nContoh: `/build tracking mood harian`';
      return FeatureArchitect.generateBlueprint(args);
    }
    return 'Command tidak dikenali.';
  },

  _handleIngat(chatId, text) {
    const factText = text.substring(this.PREFIX_INGAT.length).trim();
    if (factText.length === 0)
      return 'Mau aku inget apa? Contoh: `/ingat aku suka kopi`';
    KnowledgeSpecialist.saveManualFact(chatId, factText);
    return 'Oke, aku inget ini: _"' + factText + '"_ 👍';
  }
};