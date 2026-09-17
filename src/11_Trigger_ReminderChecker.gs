/**
 * ===================================================================
 * ENTRY POINT: REMINDER CHECKER (Time-based Trigger)
 * Tanggung jawab: dijalankan tiap menit, cek reminder jatuh tempo,
 * kirim notifikasi.
 * ===================================================================
 */
/**
 * Memeriksa reminder yang jatuh tempo dan mengirimkan notifikasi.
 * Dilindungi LockService untuk mencegah eksekusi ganda bersamaan.
 */
function cekDanKirimReminder() {
  const lock = LockService.getScriptLock();
  
  // Lewati jika eksekusi menit sebelumnya masih berlangsung
  if (!lock.tryLock(2000)) {
    return;
  }

  try {
    const remindersDue = ReminderSpecialist.getReminderDueNow();
    if (!remindersDue || remindersDue.length === 0) {
      return;
    }

    const targetChatId = Config.myChatId;
    if (!targetChatId) {
      AppLogger.warning("REMINDER_TRIGGER", "MY_TELEGRAM_CHAT_ID belum dikonfigurasi.");
      return;
    }

    remindersDue.forEach(function(reminder) {
      const pesan = ReminderSpecialist.buildNotificationText(reminder);
      TelegramService.sendMessage(targetChatId, pesan);
      ReminderSpecialist.markAsNotified(reminder);
    });
  } catch (err) {
    AppLogger.error(
      "REMINDER_TRIGGER_ERROR",
      JSON.stringify({
        errorMessage: err.message,
        stack: err.stack
      })
    );
  } finally {
    lock.releaseLock();
  }
}

function setupReminderTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'cekDanKirimReminder') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('cekDanKirimReminder').timeBased().everyMinutes(1).create();
  Logger.log('Trigger reminder checker berhasil dibuat!');
}