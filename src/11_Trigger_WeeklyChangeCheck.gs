/**
 * TRIGGER: WEEKLY CHANGE CHECK
 * Tanggung jawab: menjalankan deteksi perubahan mingguan.
 * Setiap Minggu jam 20:00 WIB.
 */
var WeeklyChangeCheckTrigger = {

  setupWeeklyTrigger: function() {
    this._deleteExistingTriggers();

    ScriptApp.newTrigger('runWeeklyChangeCheckWrapper')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.SUNDAY)
      .atHour(20)
      .create();

    AppLogger.info('WEEKLY_CHANGE_TRIGGER_SETUP', 'Created (Minggu 20:00)');
    Logger.log('✅ Trigger weekly change check berhasil dibuat!');
  },

  _deleteExistingTriggers: function() {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'runWeeklyChangeCheckWrapper') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
};

function runWeeklyChangeCheckWrapper() {
  ChangeDetector.runScheduledDetection();
}

function setupWeeklyChangeCheck() {
  WeeklyChangeCheckTrigger.setupWeeklyTrigger();
}