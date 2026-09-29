/**
 * ===================================================================
 * MASTER SCHEDULER & TRIGGERS
 * Pusat Pengelolaan Seluruh Jadwal Otomatis (Harian, Mingguan, Bulanan).
 * Menjaga semua wrapper fungsi global agar trigger GAS tidak terputus.
 * ===================================================================
 */

// -------------------------------------------------------------------
// 1. SCHEDULED SYNC & SELF-DOC CHECK
// -------------------------------------------------------------------
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

// -------------------------------------------------------------------
// 2. AUDIT SCHEDULER (MINGGUAN / TANGGAL 1)
// -------------------------------------------------------------------
var AuditScheduler = {
  runScheduledAudit: function() {
    var now = DateTimeUtils.nowWIB();
    var dayOfMonth = now.getDate();
    var dayOfWeek = now.getDay();

    if (dayOfMonth === 1) {
      AppLogger.info('AUDIT_TRIGGER', 'Monthly full audit (tanggal 1)');
      try { CodeAuditor.runAudit('full'); } catch (e) { AppLogger.error('AUDIT_MONTHLY_FAIL', e.message); }
      return;
    }

    if (dayOfWeek === 1) {
      AppLogger.info('AUDIT_TRIGGER', 'Weekly light audit (Senin)');
      try { CodeAuditor.runScheduledAudit(); } catch (e) { AppLogger.error('AUDIT_WEEKLY_FAIL', e.message); }
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
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'runScheduledAuditWrapper') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
};

function runScheduledAuditWrapper() { AuditScheduler.runScheduledAudit(); }
function setupWeeklyTrigger() { AuditScheduler.setupDailyTrigger(); }

// -------------------------------------------------------------------
// 3. REMINDER CHECKER (TIAP MENIT)
// -------------------------------------------------------------------
function cekDanKirimReminder() {
  try {
    var dueReminders = ReminderSpecialist.getReminderDueNow();
    if (!dueReminders || dueReminders.length === 0) return;

    var config = Config.load();
    for (var i = 0; i < dueReminders.length; i++) {
      var reminder = dueReminders[i];
      var text = ReminderSpecialist.buildNotificationText(reminder);
      TelegramService.sendMessage(config.myChatId, text);
      ReminderSpecialist.markAsNotified(reminder);
    }
  } catch (err) {
    AppLogger.error('REMINDER_CHECKER_FAIL', err.message);
  }
}

function setupReminderTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'cekDanKirimReminder') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('cekDanKirimReminder')
    .timeBased()
    .everyMinutes(1)
    .create();
  AppLogger.info('TRIGGER_SETUP_SUCCESS', 'cekDanKirimReminder');
}

// -------------------------------------------------------------------
// 4. LLM INTELLIGENCE DISCOVERY (DAILY 03:00)
// -------------------------------------------------------------------
function runDailyLLMDiscovery() {
  AppLogger.info('TRIGGER_LLM_INTEL_START', 'daily_03:00');
  var pipelineResult = LLMIntelligence.runFullPipeline();
  AppLogger.info('TRIGGER_LLM_INTEL_END', JSON.stringify(pipelineResult));
}

function setupDailyLLMDiscovery() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runDailyLLMDiscovery') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('runDailyLLMDiscovery')
    .timeBased()
    .atHour(3)
    .everyDays(1)
    .create();
  AppLogger.info('TRIGGER_SETUP_SUCCESS', 'runDailyLLMDiscovery');
}

// -------------------------------------------------------------------
// 5. MEMORY NIGHTLY SUMMARIZER
// -------------------------------------------------------------------
var MemorySummarizerTrigger = {
  setupNightlyTrigger: function() {
    this._deleteExistingTriggers();
    ScriptApp.newTrigger('runNightlySummarizerWrapper')
      .timeBased()
      .atHour(23)
      .everyDays(1)
      .create();
    AppLogger.info('MEMORY_TRIGGER_SETUP', 'Nightly trigger created (23:00 WIB)');
  },

  _deleteExistingTriggers: function() {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'runNightlySummarizerWrapper') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
};

function runNightlySummarizerWrapper() { MemorySpecialist.summarizeToday(); }
function setupNightlySummarizer() { MemorySummarizerTrigger.setupNightlyTrigger(); }

// -------------------------------------------------------------------
// 6. WEEKLY CHANGE CHECK
// -------------------------------------------------------------------
var WeeklyChangeCheckTrigger = {
  setupWeeklyTrigger: function() {
    this._deleteExistingTriggers();
    ScriptApp.newTrigger('runWeeklyChangeCheckWrapper')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(8)
      .create();
    AppLogger.info('WEEKLY_CHECK_SETUP', 'Weekly trigger created (Senin 08:00 WIB)');
  },

  _deleteExistingTriggers: function() {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'runWeeklyChangeCheckWrapper') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
};

function runWeeklyChangeCheckWrapper() { ChangeDetector.runScheduledDetection(); }
function setupWeeklyChangeCheck() { WeeklyChangeCheckTrigger.setupWeeklyTrigger(); }