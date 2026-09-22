/**
 * ===================================================================
 * TRIGGER: DAILY LLM INTELLIGENCE PIPELINE
 * Menjalankan Discovery -> Benchmark 3 Model -> Update Ranking pada jam 03:00.
 * ===================================================================
 */
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