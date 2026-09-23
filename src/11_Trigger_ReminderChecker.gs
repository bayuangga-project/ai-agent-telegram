/**
 * ===================================================================
 * ENTRY POINT: REMINDER CHECKER (Time-based Trigger)
 * ===================================================================
 */
function cekDanKirimReminder() {
  const lock = LockService.getScriptLock();
  
  if (!lock.tryLock(2000)) {
    return;
  }

  try {
    const remindersDue = ReminderSpecialist.getReminderDueNow();
    if (!remindersDue || remindersDue.length === 0) {
      return;
    }

    const config = Config.load();
    const targetChatId = config.myChatId;
    if (!targetChatId) {
      AppLogger.warning("REMINDER_TRIGGER", "MY_TELEGRAM_CHAT_ID_MISSING");
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
}