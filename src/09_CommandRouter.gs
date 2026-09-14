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
    const cleanText = text.trim();
    const firstWord = cleanText.split(' ')[0].toLowerCase();
    
    return text.indexOf(this.PREFIX_INGAT) === 0 ||
      this.COMMANDS_LIST_REMINDER.indexOf(cleanText) !== -1 ||
      firstWord === '/diagnose' ||
      firstWord === '/heal' ||
      firstWord === '/logs' ||
      firstWord === '/patch';
  },

  handle(chatId, text) {
    const cleanText = text.trim();
    const firstWord = cleanText.split(' ')[0].toLowerCase();
    const args = cleanText.substring(firstWord.length).trim();

    // 1. Command /ingat
    if (text.indexOf(this.PREFIX_INGAT) === 0) {
      return this._handleIngat(chatId, text);
    }
    
    // 2. Command /reminder atau /reminders
    if (this.COMMANDS_LIST_REMINDER.indexOf(cleanText) !== -1) {
      return ReminderSpecialist.listActiveAsText();
    }

    // 3. Command /diagnose atau /heal [BARU]
    if (firstWord === '/diagnose' || firstWord === '/heal') {
      const keluhan = args || 'Tolong cek log terakhir, apakah ada error?';
      return SelfHealingSpecialist.diagnose(keluhan);
    }

    // 4. Command /logs [BARU]
    if (firstWord === '/logs') {
      const count = parseInt(args, 10) || 10;
      const logs = SelfHealingSpecialist._getRecentLogs(count);
      if (logs.length === 0) return '📋 Log kosong.';
      
      let reply = '📋 *' + logs.length + ' Log Terakhir:*\n\n';
      logs.forEach(function(log) {
        const eventUpper = String(log.event).toUpperCase();
        const isError = eventUpper.indexOf('FAIL') !== -1 ||
                        eventUpper.indexOf('ERROR') !== -1 ||
                        log.status === 'ERROR';
                        
        reply += (isError ? '🔴' : '🟢') + ' `' + log.event + '`\n' +
                 '   ' + log.detail.substring(0, 80) + '\n\n';
      });
      return reply;
    }

    // 5. Command /patch [BARU]
    if (firstWord === '/patch') {
      if (args === 'apply') {
        return SelfHealingSpecialist.applyPendingPatch(null);
      }
      return '🔧 *Patch Commands:*\n' +
             '• `/patch apply` — Apply patch terakhir ke GitHub\n' +
             '• `/diagnose <keluhan>` — Diagnosis error\n' +
             '• `/logs [jumlah]` — Lihat log terakhir';
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