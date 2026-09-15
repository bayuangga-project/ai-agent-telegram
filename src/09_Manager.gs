/**
 * ===================================================================
 * MANAGER (ORCHESTRATOR)
 * ===================================================================
 */
const Manager = {
  processConversationalMessage(chatId, text) {
    const context = this._gatherContext();
    const intent = IntentAnalyzer.analyze(text, context);
    if (!intent) return this._handleIntentFailure(chatId, text, context.riwayat);
    this._persistAutoFacts(chatId, intent);
    return this._routeIntent(chatId, text, intent, context);
  },

  _gatherContext() {
    return {
      riwayat: ChatHistoryRepository.getRecent(15),
      facts: KnowledgeSpecialist.getActiveFactsForPrompt(50),
      profile: UserProfileSpecialist.getProfileForPrompt(30),
      ltm: MemorySpecialist.getLongTermMemory(7),
      reminderMenunggu: ReminderSpecialist.getMenungguRespon(),
      ackPatterns: ReminderSpecialist.getAckPatternsForPrompt(10)
    };
  },

  _persistAutoFacts(chatId, intent) {
    if (intent.factsBaru && intent.factsBaru.length > 0)
      KnowledgeSpecialist.saveAutoDetectedFacts(chatId, intent.factsBaru);
    if (intent.profileUpdates && intent.profileUpdates.length > 0)
      UserProfileSpecialist.saveUpdates(intent.profileUpdates);
  },

  _routeIntent(chatId, text, intent, context) {
    if (intent.tipe === 'ack_reminder' && context.reminderMenunggu.length > 0)
      return this._handleAckReminder(chatId, text, intent, context);
    if (intent.tipe === 'buat_reminder')
      return this._handleBuatReminder(intent);
    if (intent.tipe === 'diagnose_error')
      return this._handleDiagnoseError(chatId, text, intent);
    if (intent.tipe === 'update_docs')
      return this._handleUpdateDocs(chatId, text, intent);
    if (intent.tipe === 'audit_code')
      return this._handleAuditCode(chatId, text, intent);
    if (intent.tipe === 'fix_audit')
      return this._handleFixAudit(chatId, text, intent);
    if (intent.tipe === 'check_changes')
      return this._handleCheckChanges(chatId, text, intent);
    if (intent.tipe === 'roadmap_query')
      return this._handleRoadmapQuery(chatId, text, intent);
    if (intent.tipe === 'implement_feature')
      return this._handleImplementFeature(chatId, text, intent);
    if (intent.tipe === 'self_query')
      return this._handleSelfQuery(chatId, text, intent);
    return this._handleChatBiasa(chatId, text, intent, context.riwayat);
  },

  _handleAckReminder(chatId, text, intent, context) {
    const hasil = ReminderSpecialist.acknowledge(text, intent, context.reminderMenunggu);
    if (hasil.success) return hasil.text;
    return this._handleChatBiasa(chatId, text, intent, context.riwayat);
  },

  _handleBuatReminder(intent) {
    return ReminderSpecialist.create(intent).text;
  },

  _handleDiagnoseError(chatId, text, intent) {
    const keluhan = (intent.diagnose_error && intent.diagnose_error.keluhanUser) || text;
    const result = SelfHealingSpecialist.diagnose(keluhan);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleUpdateDocs(chatId, text, intent) {
    const instruksi = (intent.update_docs && intent.update_docs.instruksi) || text;
    const result = SelfHealingSpecialist.updateDocumentation(instruksi);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleAuditCode(chatId, text, intent) {
    const scope = (intent.audit_code && intent.audit_code.scope) || 'full';
    const result = CodeAuditor.runAudit(scope);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleFixAudit(chatId, text, intent) {
    const scope = (intent.fix_audit && intent.fix_audit.scope) || 'all';
    const result = CodeAuditor.fixIssues(scope);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleCheckChanges(chatId, text, intent) {
    const mode = (intent.check_changes && intent.check_changes.mode) || 'full';
    const result = ChangeDetector.runDetection(mode);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleRoadmapQuery(chatId, text, intent) {
    const rq = intent.roadmap_query || {};
    const action = rq.action || 'ask';
    const question = rq.question || text;
    let result;
    if (action === 'build') result = ProjectBrain.buildRoadmapFromDiscussion(question);
    else if (action === 'check_alignment' || action === 'adapt')
      result = ProjectBrain.adaptRoadmapForNewIdea(question);
    else result = ProjectBrain.answerQuestion(question);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleImplementFeature(chatId, text, intent) {
    const idea = (intent.implement_feature && intent.implement_feature.idea) || text;
    const result = FeatureArchitect.implementBlueprint(idea);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleSelfQuery(chatId, text, intent) {
    const focus = (intent.self_query && intent.self_query.focus) || 'all';
    const result = SelfAwareness.review(focus);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleChatBiasa(chatId, text, intent, riwayat) {
    let finalText;
    if (ChatSpecialist.needsWebSearch(intent))
      finalText = this._handleChatWithWebSearch(text, intent, riwayat);
    else if (intent.complexity === 'heavy')
      finalText = this._handleHeavyChat(text, intent, riwayat);
    else
      finalText = intent.jawabanChat || 'Hmm, boleh diulang lagi?';
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', finalText);
    return finalText;
  },

  _handleHeavyChat(text, intent, riwayat) {
    AppLogger.info('MANAGER_HEAVY_CHAT', 'Escalating to advanced');
    const result = LLMProviderService.generate({
      chain: 'advanced',
      systemInstruction: ChatSpecialist.buildSystemPersona(),
      messages: riwayat.concat([{ role: 'user', text: text }]),
      temperature: 0.7
    });
    return (result && result.text) ? result.text :
      (intent.jawabanChat || 'Waduh, aku lagi kesulitan. Coba lagi ya.');
  },

  _handleChatWithWebSearch(text, intent, riwayat) {
    const results = WebSearchProviderService.search(intent.searchQuery);
    return ChatSpecialist.respondWithSearchContext(text, results, riwayat);
  },

  _handleIntentFailure(chatId, text, riwayat) {
    AppLogger.error('MANAGER_INTENT_FAILURE', 'Fallback');
    const result = LLMProviderService.generate({
      chain: 'advanced',
      systemInstruction: ChatSpecialist.buildSystemPersona(),
      messages: riwayat.concat([{ role: 'user', text: text }]),
      temperature: 0.7
    });
    const finalText = result ? result.text :
      'Waduh, semua layanan AI bermasalah. Coba lagi ya.';
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', finalText);
    return finalText;
  }
};