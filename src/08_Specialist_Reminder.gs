/**
 * ===================================================================
 * SPESIALIS: REMINDER
 * Tanggung jawab: semua logic bisnis terkait reminder.
 * Tidak tahu cara kirim Telegram ? hanya hasilkan teks siap pakai.
 * ===================================================================
 */
const ReminderSpecialist = {
  DEFAULT_SNOOZE_MINUTES: 30,
  NOTIFICATION_COOLDOWN_MINUTES: 5,

  getMenungguRespon() {
    return ReminderRepository.getMenungguRespon(30);
  },

  listActiveAsText() {
    const reminders = ReminderRepository.getActive();
    if (reminders.length === 0) return 'Tidak ada reminder aktif saat ini.';

    const lines = reminders.map((r, i) => {
      const waktu = DateTimeUtils.formatWaktu(r.waktuPertama);
      const recurring = r.jenisRecurring !== 'none' ? ' ? (' + r.jenisRecurring + ')' : '';
      return (i + 1) + '. *' + r.deskripsi + '*\n   ? ' + waktu + recurring +
        '\n   ? ' + r.prioritas + ' | ID: `' + r.id + '`';
    });
    return '? *Reminder Aktif:*\n\n' + lines.join('\n\n');
  },

  getAckPatternsForPrompt(limit) {
    return AckPatternsRepository.getRecent(limit);
  },

  create(reminderData) {
    if (!reminderData.waktuPertama || reminderData.waktuPertama.trim() === '') {
      return {
        success: false,
        text: 'Aku nangkep ini sebagai reminder, tapi waktunya kurang jelas. Kapan tepatnya?'
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

    return '? *Reminder' + labelUlang + '*\n\n' +
      '? ' + reminder.deskripsi + '\n' +
      '? ' + DateTimeUtils.formatWaktu(reminder.waktuPertama) + konteks;
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

  _buildRelevantFactContext(reminder) {
    const keyword = reminder.deskripsi.split(' ')[0];
    const faktaRelevan = KnowledgeSpecialist.findRelevantToKeyword(keyword, 50);
    return faktaRelevan.length > 0 ? '\n\n_' + faktaRelevan[0] + '_' : '';
  },

  _buildConfirmationText(data) {
    const recurringTeks = data.jenisRecurring && data.jenisRecurring !== 'none'
      ? '\n? Berulang: ' + data.jenisRecurring : '';
    return '? Reminder tersimpan!\n\n' +
      '? *' + data.deskripsi + '*\n' +
      '? ' + data.waktuPertama + ' WIB' + recurringTeks + '\n' +
      '? Prioritas: ' + data.prioritas;
  },

  _handleDone(pesanUserAsli, intent, target) {
    let text;
    if (target.jenisRecurring !== 'none') {
      const waktuBerikutnya = ReminderRepository.hitungWaktuBerikutnya(target);
      ReminderRepository.updateWaktu(target.rowIndex, waktuBerikutnya);
      ReminderRepository.updateTerakhirDiingatkan(target.rowIndex, 0);
      text = '? *' + target.deskripsi + '* sudah aku tandai selesai!\n' +
        'Pengingat berikutnya: ' + DateTimeUtils.formatWaktu(waktuBerikutnya);
    } else {
      ReminderRepository.updateStatus(target.rowIndex, ReminderRepository.STATUS_DONE);
      text = '? Oke, *' + target.deskripsi + '* sudah selesai! ?';
    }

    AckPatternsRepository.save(pesanUserAsli, intent.alasan, 'done');
    return { success: true, text };
  },

  _handleSnooze(pesanUserAsli, intent, target) {
    const menitSnooze = intent.snoozeMinit || this.DEFAULT_SNOOZE_MINUTES;
    const waktuBaru = new Date(DateTimeUtils.nowWIB().getTime() + menitSnooze * 60 * 1000);

    ReminderRepository.updateWaktu(target.rowIndex, waktuBaru);
    ReminderRepository.updateTerakhirDiingatkan(target.rowIndex, target.jumlahDiingatkan);

    const text = '? Oke, aku ingetin lagi ' + menitSnooze + ' menit lagi ya!';
    AckPatternsRepository.save(pesanUserAsli, intent.alasan, 'snooze');
    return { success: true, text };
  }
};