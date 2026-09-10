/**
 * ===================================================================
 * ENTRY POINT: REMINDER CHECKER (Time-based Trigger)
 * Tanggung jawab: dijalankan tiap menit, cek reminder jatuh tempo,
 * kirim notifikasi.
 * ===================================================================
 */
function cekDanKirimReminder() {
  try {
    const chatId = Config.load().myChatId;
    const dueReminders = ReminderSpecialist.getRemindersDueNow();

    dueReminders.forEach(function(reminder) {
      const text = ReminderSpecialist.buildNotificationText(reminder);
      TelegramService.sendMessage(chatId, text);
      ReminderSpecialist.markAsNotified(reminder);
    });
  } catch (error) {
    AppLogger.error('REMINDER_CHECKER_ERROR', error.message);
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