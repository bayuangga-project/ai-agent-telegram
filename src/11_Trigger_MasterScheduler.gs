/**
 * ===================================================================
 * MASTER SCHEDULER & TRIGGERS (WITH SELF-DELETING ASYNC TASK WORKER)
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

// -------------------------------------------------------------------
// AUDIT SCHEDULER (MINGGUAN / TANGGAL 1)
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
// REMINDER CHECKER (TIAP MENIT)
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
// LLM INTELLIGENCE DISCOVERY (DAILY 03:00)
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
// MEMORY NIGHTLY SUMMARIZER
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
// WEEKLY CHANGE CHECK
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

// -------------------------------------------------------------------
// FASE C: ASYNC TASK QUEUE BACKGROUND WORKER (SELF-DELETING TRIGGER)
// -------------------------------------------------------------------
function runAsyncTaskWorkerWrapper() {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var cache = CacheService.getScriptCache();
    var rawTask = cache.get('PENDING_ASYNC_TASK');
    if (!rawTask) {
      AppLogger.warning('ASYNC_WORKER_NO_TASK', 'pending_task_cache_empty');
      return;
    }
    var task = JSON.parse(rawTask);
    cache.remove('PENDING_ASYNC_TASK');

    AppLogger.info('ASYNC_WORKER_START', 'task_id:' + task.id + '|type:' + task.type);

    var resultText = '';
    if (task.type === 'web_research') {
      var searchResults = WebSearchProviderService.search(task.query);
      resultText = ChatSpecialist.respondWithSearchContext(task.query, searchResults, task.riwayat || []);
    } else {
      var llmRes = LLMProviderService.generate({
        taskType: 'chat_heavy',
        systemInstruction: ChatSpecialist.buildSystemPersona(),
        messages: [{ role: 'user', text: task.prompt }],
        temperature: 0.7
      });
      resultText = (llmRes && llmRes.text) ? llmRes.text : '';
    }

    if (resultText && task.chatId) {
      var tplDone = KnowledgeRepository.get('async_task', 'task_completed_template') || '🔔 *Tugas Background Selesai:*\n\n{{result}}';
      var finalMsg = TemplateEngine.render(tplDone, { result: resultText });
      TelegramService.sendMessage(task.chatId, finalMsg);
    }
  } catch (err) {
    AppLogger.error('ASYNC_WORKER_ERROR', err.message);
  } finally {
    // 100% PASTI MENGHAPUS TRIGGER DIRINYA SENDIRI
    try {
      var triggers = ScriptApp.getProjectTriggers();
      triggers.forEach(function(t) {
        if (t.getHandlerFunction() === 'runAsyncTaskWorkerWrapper') {
          ScriptApp.deleteTrigger(t);
        }
      });
      AppLogger.info('ASYNC_WORKER_TRIGGER_CLEANED', 'self_deleted_successfully');
    } catch (eClean) {}
    lock.releaseLock();
  }
}