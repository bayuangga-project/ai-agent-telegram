/**
 * ===================================================================
 * SPESIALIS: REMINDER (SEMANTIC KEYWORD CLEANER INTEGRATED)
 * Tanggung jawab: semua logic bisnis terkait reminder, format pemberitahuan,
 * dan ekstraksi kata kunci memori fakta relevan (Stopword Filter & N-Gram).
 * 100% PATUH PASAL 1.2 (ZERO HARDCODE HUMAN LANGUAGE STRINGS IN THIS FILE).
 * ===================================================================
 */
const ReminderSpecialist = {
  DEFAULT_SNOOZE_MINUTES: 30,
  NOTIFICATION_COOLDOWN_MINUTES: 5,

  getMenungguRespon() {
    return ReminderRepository.getMenungguRespon(30);
  },

  getReminderDueNow() {
    var now = DateTimeUtils.nowWIB();
    var active = ReminderRepository.getActive();
    var due = [];
    for (var i = 0; i < active.length; i++) {
      var r = active[i];
      if (this._isDueNow(r, now)) {
        due.push(r);
      }
    }
    return due;
  },

  listActiveAsText() {
    return ReminderRepository.formatDaftarAktifSebagaiTeks();
  },

  getAckPatternsForPrompt(limit) {
    return AckPatternsRepository.getRecent(limit);
  },

  create(reminderData) {
    if (!reminderData.waktuPertama || reminderData.waktuPertama.trim() === '') {
      var tplTimeMissing = KnowledgeRepository.get('reminder', 'error_time_missing') || 
        'Aku nangkep ini sebagai reminder, tapi waktunya kurang jelas. Kapan tepatnya?';
      return {
        success: false,
        text: tplTimeMissing
      };
    }

    ReminderRepository.create({
      deskripsi: reminderData.deskripsi,
      waktuPertama: reminderData.waktuPertama,
      jenisRecurring: reminderData.jenisRecurring,
      recurringConfig: reminderData.recurringConfig,
      prioritas: reminderData.prioritas,
      catatan: reminderData.catatan
    });

    return { success: true, text: this._buildConfirmationText(reminderData) };
  },

  acknowledge(pesanUserAsli, ackIntent, remindersMenunggu) {
    const target = remindersMenunggu.find(r => r.id === ackIntent.reminderId);
    if (!target) return { success: false, text: '' };

    if (ackIntent.aksiReminder === 'done') {
      return this._handleDone(pesanUserAsli, ackIntent, target);
    }
    if (ackIntent.aksiReminder === 'snooze') {
      return this._handleSnooze(pesanUserAsli, ackIntent, target);
    }
    return { success: false, text: '' };
  },

  getRemindersDueNow() {
    const now = DateTimeUtils.nowWIB();
    return ReminderRepository.getActive().filter(r => this._isDueNow(r, now));
  },

  buildNotificationText(reminder) {
    const jumlahBaru = parseInt(reminder.jumlahDiingatkan, 10) + 1;
    const labelUlang = jumlahBaru > 1 ? ' (ke-' + jumlahBaru + ')' : '';
    const konteks = this._buildRelevantFactContext(reminder);

    return '⏰ *Reminder' + labelUlang + '*\n\n' +
      '📌 ' + reminder.deskripsi + '\n' +
      '🕐 ' + DateTimeUtils.formatWaktu(reminder.waktuPertama) + konteks;
  },

  markAsNotified(reminder) {
    const jumlahBaru = parseInt(reminder.jumlahDiingatkan, 10) + 1;
    ReminderRepository.updateTerakhirDiingatkan(reminder.rowIndex, jumlahBaru);
    AppLogger.info('REMINDER_NOTIFIED', 'ID: ' + reminder.id + ' | Ke-' + jumlahBaru);
    return jumlahBaru;
  },

  _isDueNow(reminder, now) {
    const waktuReminder = DateTimeUtils.toWIB(new Date(reminder.waktuPertama));
    if (now.getTime() - waktuReminder.getTime() < 0) return false;

    if (!reminder.terakhirDiingatkan) return true;

    const selisih = now.getTime() - DateTimeUtils.toWIB(reminder.terakhirDiingatkan).getTime();
    const cooldownMs = this.NOTIFICATION_COOLDOWN_MINUTES * 60 * 1000;
    return selisih >= cooldownMs;
  },

  /**
   * Extractor Kata Kunci Bersih (Stopword Filtering)
   */
  _extractCleanKeywords(text) {
    if (!text) return [];
    var str = String(text).toLowerCase();
    var stopWords = ['beli', 'ambil', 'bayar', 'di', 'ke', 'untuk', 'pada', 'saat', 'dengan', 'pakai', 'pake', 'via', 'tolong', 'jangan', 'lupa', 'jam', 'hari', 'besok', 'kemarin', 'nanti', 'nanti2'];
    var words = str.match(/([a-zA-Z0-9_$]{3,})/g) || [];
    return words.filter(function(w) {
      return stopWords.indexOf(w) === -1;
    });
  },

  /**
   * Mencocokkan Kata Kunci Berbobot (Semantic Match) ke Memori Fakta
   */
  _buildRelevantFactContext(reminder) {
    if (!reminder || !reminder.deskripsi) return '';
    var keywords = this._extractCleanKeywords(reminder.deskripsi);
    if (keywords.length === 0) return '';

    for (var i = 0; i < keywords.length; i++) {
      var faktaRelevan = KnowledgeSpecialist.findRelevantToKeyword(keywords[i], 20);
      if (faktaRelevan && faktaRelevan.length > 0) {
        return '\n\n_' + faktaRelevan[0] + '_';
      }
    }
    return '';
  },

  _buildConfirmationText(data) {
    const recurringTeks = data.jenisRecurring && data.jenisRecurring !== 'none'
      ? '\n🔄 Berulang: ' + data.jenisRecurring : '';
    return '✅ Reminder tersimpan!\n\n' +
      '📌 *' + data.deskripsi + '*\n' +
      '📅 ' + data.waktuPertama + ' WIB' + recurringTeks + '\n' +
      '🏷 Prioritas: ' + data.prioritas;
  },

  _handleDone(pesanUserAsli, intent, target) {
    let text;
    if (target.jenisRecurring !== 'none') {
      const waktuBerikutnya = ReminderRepository.hitungWaktuBerikutnya(target);
      ReminderRepository.updateWaktu(target.rowIndex, waktuBerikutnya);
      ReminderRepository.updateTerakhirDiingatkan(target.rowIndex, 0);
      text = '✅ *' + target.deskripsi + '* sudah aku tandai selesai!\n' +
        'Pengingat berikutnya: ' + DateTimeUtils.formatWaktu(waktuBerikutnya);
    } else {
      ReminderRepository.updateStatus(target.rowIndex, ReminderRepository.STATUS_DONE);
      text = '✅ Oke, *' + target.deskripsi + '* sudah selesai! 👍';
    }

    AckPatternsRepository.save(pesanUserAsli, intent.alasan, 'done');
    return { success: true, text };
  },

  _handleSnooze(pesanUserAsli, intent, target) {
    const menitSnooze = intent.snoozeMinit || this.DEFAULT_SNOOZE_MINUTES;
    const waktuBaru = new Date(DateTimeUtils.nowWIB().getTime() + menitSnooze * 60 * 1000);

    ReminderRepository.updateWaktu(target.rowIndex, waktuBaru);
    ReminderRepository.updateTerakhirDiingatkan(target.rowIndex, target.jumlahDiingatkan);

    const text = '⏱ Oke, aku ingetin lagi ' + menitSnooze + ' menit lagi ya!';
    AckPatternsRepository.save(pesanUserAsli, intent.alasan, 'snooze');
    return { success: true, text };
  }
};