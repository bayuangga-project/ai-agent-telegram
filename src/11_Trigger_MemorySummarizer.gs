/**
 * TRIGGER: MEMORY SUMMARIZER
 * Tanggung jawab: menjalankan ringkasan percakapan harian.
 * Dijadwalkan setiap malam jam 23:30 WIB.
 */
var MemorySummarizerTrigger = {

  setupNightlyTrigger: function() {
    this._deleteExistingTriggers();

    ScriptApp.newTrigger('runNightlySummarizerWrapper')
      .timeBased()
      .atHour(23)
      .nearMinute(30)
      .everyDays(1)
      .create();

    AppLogger.info('LTM_TRIGGER_SETUP', 'Nightly trigger created (23:30 WIB)');
    Logger.log('✅ Trigger memory summarizer berhasil dibuat!');
  },

  _deleteExistingTriggers: function() {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'runNightlySummarizerWrapper') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
};

function runNightlySummarizerWrapper() {
  MemorySpecialist.summarizeToday();
}

function setupNightlySummarizer() {
  MemorySummarizerTrigger.setupNightlyTrigger();
}