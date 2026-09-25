/**
 * ===================================================================
 * TRIGGER: SCHEDULED SYNC & BACKUP
 * Menjalankan sinkronisasi dan backup penuh otomatis harian.
 * ===================================================================
 */
function runDailyAutoSync() {
  try {
    AppLogger.info('TRIGGER_AUTO_SYNC_START', 'daily_04:00');
    var result = SyncOrchestrator.executeSync('auto');
    AppLogger.info('TRIGGER_AUTO_SYNC_END', JSON.stringify(result.summary));
  } catch (err) {
    AppLogger.error('TRIGGER_AUTO_SYNC_FAIL', err.message);
  }
}

function setupDailyAutoSyncTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runDailyAutoSync') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('runDailyAutoSync')
    .timeBased()
    .atHour(4)
    .everyDays(1)
    .create();
  AppLogger.info('TRIGGER_SETUP_SUCCESS', 'runDailyAutoSync');
}

function runDailySelfDocCheck() {
  try {
    AppLogger.info('TRIGGER_SELF_DOC_START', 'daily_10:00');
    SelfDocSync.runDailyCheck();
    AppLogger.info('TRIGGER_SELF_DOC_END', 'done');
  } catch (err) {
    AppLogger.error('TRIGGER_SELF_DOC_FAIL', err.message);
  }
}

function setupDailySelfDocTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runDailySelfDocCheck') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('runDailySelfDocCheck')
    .timeBased()
    .atHour(10)
    .everyDays(1)
    .create();
  AppLogger.info('TRIGGER_SETUP_SUCCESS', 'runDailySelfDocCheck at 10:00');
}