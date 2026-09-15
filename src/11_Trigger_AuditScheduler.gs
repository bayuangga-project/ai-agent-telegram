/**
 * TRIGGER: AUDIT SCHEDULER
 * Tanggung jawab: menjalankan audit terjadwal otomatis.
 * - Setiap Senin jam 07:00 WIB → audit ringan
 * - Setiap tanggal 1 jam 07:00 WIB → audit penuh
 */
var AuditScheduler = {

  /**
   * Dipanggil oleh time-based trigger.
   * Otomatis menentukan jenis audit berdasarkan tanggal.
   */
  runScheduledAudit: function() {
    AppLogger.info('AUDIT_TRIGGER', 'Scheduled audit started');

    try {
      CodeAuditor.runScheduledAudit();
    } catch (e) {
      AppLogger.error('AUDIT_TRIGGER_FAIL', e.message);
    }
  },

  /**
   * Setup trigger mingguan (Senin 07:00 WIB).
   * Jalankan fungsi ini SEKALI dari editor GAS untuk mengaktifkan.
   */

  setupWeeklyTrigger: function() {
    this._deleteExistingTriggers();

    ScriptApp.newTrigger('runScheduledAuditWrapper')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(7)
      .create();

    AppLogger.info('AUDIT_TRIGGER_SETUP', 'Weekly trigger created (Senin 07:00)');
    Logger.log('✅ Trigger audit mingguan berhasil dibuat!');
  },

  /**
   * Hapus trigger lama agar tidak duplikat.
   */
  _deleteExistingTriggers: function() {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'runScheduledAuditWrapper') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
};

/**
 * Wrapper global untuk trigger.
 * GAS trigger hanya bisa memanggil fungsi global, bukan method object.
 */
function runScheduledAuditWrapper() {
  AuditScheduler.runScheduledAudit();
}

function setupWeeklyTrigger() {
  AuditScheduler.setupWeeklyTrigger();
}