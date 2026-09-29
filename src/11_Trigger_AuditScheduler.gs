/**
 * TRIGGER: AUDIT SCHEDULER
 * Tanggung jawab: menjalankan audit terjadwal otomatis.
 * - Setiap Senin jam 07:00 WIB → audit ringan
 * - Setiap tanggal 1 jam 07:00 WIB → audit penuh
 * 
 * Implementasi: trigger harian jam 07:00, lalu cek tanggal/hari di dalam fungsi.
 * (GAS tidak mendukung trigger onMonthDay secara langsung)
 */
var AuditScheduler = {

  runScheduledAudit: function() {
    var now = DateTimeUtils.nowWIB();
    var dayOfMonth = now.getDate();
    var dayOfWeek = now.getDay();

    if (dayOfMonth === 1) {
      AppLogger.info('AUDIT_TRIGGER', 'Monthly full audit (tanggal 1)');
      try {
        CodeAuditor.runAudit('full');
      } catch (e) {
        AppLogger.error('AUDIT_MONTHLY_FAIL', e.message);
      }
      return;
    }

    if (dayOfWeek === 1) {
      AppLogger.info('AUDIT_TRIGGER', 'Weekly light audit (Senin)');
      try {
        CodeAuditor.runScheduledAudit();
      } catch (e) {
        AppLogger.error('AUDIT_WEEKLY_FAIL', e.message);
      }
      return;
    }

    AppLogger.info('AUDIT_TRIGGER', 'Skipped (bukan Senin dan bukan tanggal 1)');
  },

  setupDailyTrigger: function() {
    this._deleteExistingTriggers();

    ScriptApp.newTrigger('runScheduledAuditWrapper')
      .timeBased()
      .atHour(7)
      .everyDays(1)
      .create();

    AppLogger.info('AUDIT_TRIGGER_SETUP', 'Daily trigger created (07:00 WIB)');
  },

  _deleteExistingTriggers: function() {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'runScheduledAuditWrapper') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
};

function runScheduledAuditWrapper() {
  AuditScheduler.runScheduledAudit();
}

function setupWeeklyTrigger() {
  AuditScheduler.setupDailyTrigger();
}