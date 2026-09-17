function runDailyLLMDiscovery() {
  var result = LLMIntelligence.discoverAndBenchmark();
  AppLogger.info('LLM_DAILY_TRIGGER', JSON.stringify(result));
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
  AppLogger.info('LLM_TRIGGER_SETUP', 'daily_03:00');
}