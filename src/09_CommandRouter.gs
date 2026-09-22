/**
 * ===================================================================
 * COMMAND ROUTER
 * ===================================================================
 */
const CommandRouter = {
  COMMANDS: ['diagnose', 'heal', 'logs', 'patch', 'build', 'ingat', 'soul', 'init-soul', 'backup', 'restore', 'memory'],

  isKnownCommand(text) {
    if (!text || text.charAt(0) !== '/') return false;
    var cmd = text.substring(1).split(' ')[0].toLowerCase();
    return this.COMMANDS.indexOf(cmd) >= 0;
  },

  handle(chatId, text) {
    var cmd = text.substring(1).split(' ')[0].toLowerCase();
    var args = text.substring(cmd.length + 2).trim();

    if (cmd === 'diagnose') return Manager._handleDiagnoseError(chatId, text, {});
    if (cmd === 'heal') return Manager._handleDiagnoseError(chatId, text, {});
    if (cmd === 'logs') return Manager._handleSelfQuery(chatId, text, { self_query: { focus: 'all' } });
    if (cmd === 'patch') return Manager._handleDiagnoseError(chatId, text, {});
    if (cmd === 'build') return Manager._handleImplementFeature(chatId, text, {});
    if (cmd === 'ingat') return this._handleIngat(chatId, text);
    if (cmd === 'soul') return Manager._handleSoulQuery(chatId, args || text, {});
    if (cmd === 'init-soul') return Manager._handleSoulInit(chatId, text);
    if (cmd === 'backup') return Manager._handleBackupKnowledge(chatId, text);
    if (cmd === 'restore') return Manager._handleRestoreKnowledge(chatId, text);
    if (cmd === 'memory') return Manager._handleSoulMemoryQuery(chatId, args || text, {});

    return null;
  },

  _handleIngat(chatId, args) {
    if (!args) return 'Format: /ingat <pesan>';
    var intent = {
      tipe: 'buat_reminder',
      deskripsi: args,
      waktuPertama: '',
      jenisRecurring: 'none'
    };
    return Manager._handleBuatReminder(intent);
  }
};