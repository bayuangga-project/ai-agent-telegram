/**
 * ===================================================================
 * MANAGER (ORCHESTRATOR)
 * Tanggung jawab: terima pesan natural language, panggil
 * IntentAnalyzer, routing ke Specialist yang sesuai, kembalikan
 * jawaban final.
 * ===================================================================
 */
const Manager = {
  // --- LAZY EVALUATION GETTERS ---
  _getIntentAnalyzer() {
    return IntentAnalyzer;
  },
  _getKnowledgeSpecialist() {
    return KnowledgeSpecialist;
  },
  _getReminderSpecialist() {
    return ReminderSpecialist;
  },
  _getSelfHealingSpecialist() {
    return SelfHealingSpecialist;
  },
  _getChatHistoryRepository() {
    return ChatHistoryRepository;
  },
  _getChatSpecialist() {
    return ChatSpecialist;
  },
  _getWebSearchProviderService() {
    return WebSearchProviderService;
  },
  _getAppLogger() {
    return AppLogger;
  },
  _getLLMProviderService() {
    return LLMProviderService;
  },

  processConversationalMessage(chatId, text) {
    const context = this._gatherContext();
    const intent = this._getIntentAnalyzer().analyze(text, context);

    if (!intent) {
      return this._handleIntentFailure(chatId, text, context.riwayat);
    }

    this._persistAutoFacts(chatId, intent);
    return this._routeIntent(chatId, text, intent, context);
  },

  _gatherContext() {
    return {
      riwayat: this._getChatHistoryRepository().getRecent(15),
      facts: this._getKnowledgeSpecialist().getActiveFactsForPrompt(50),
      reminderMenunggu: this._getReminderSpecialist().getMenungguRespon(),
      ackPatterns: this._getReminderSpecialist().getAckPatternsForPrompt(10)
    };
  },

  _persistAutoFacts(chatId, intent) {
    if (intent.factsBaru && intent.factsBaru.length > 0) {
      this._getKnowledgeSpecialist().saveAutoDetectedFacts(chatId, intent.factsBaru);
    }
  },

  _routeIntent(chatId, text, intent, context) {
    if (intent.tipe === 'ack_reminder' && context.reminderMenunggu.length > 0) {
      return this._handleAckReminder(chatId, text, intent, context);
    }
    if (intent.tipe === 'buat_reminder') {
      return this._handleBuatReminder(intent);
    }
    if (intent.tipe === 'diagnose_error') {
      return this._handleDiagnoseError(chatId, text, intent);
    }
    if (intent.tipe === 'update_docs') {
      return this._handleUpdateDocs(chatId, text, intent);
    }
    return this._handleChatBiasa(chatId, text, intent, context.riwayat);
  },

  _handleAckReminder(chatId, text, intent, context) {
    const hasil = this._getReminderSpecialist().acknowledge(text, intent, context.reminderMenunggu);
    if (hasil.success) return hasil.text;
    return this._handleChatBiasa(chatId, text, intent, context.riwayat);
  },

  _handleBuatReminder(intent) {
    const hasil = this._getReminderSpecialist().create(intent);
    return hasil.text;
  },

  _handleDiagnoseError(chatId, text, intent) {
    const keluhan = (intent.diagnose_error && intent.diagnose_error.keluhanUser)
                    ? intent.diagnose_error.keluhanUser
                    : text;
    const result = this._getSelfHealingSpecialist().diagnose(keluhan);

    this._getChatHistoryRepository().save(chatId, 'user', text);
    this._getChatHistoryRepository().save(chatId, 'ai', result);
    return result;
  },

  _handleUpdateDocs(chatId, text, intent) {
    const instruksi = (intent.update_docs && intent.update_docs.instruksi)
                      ? intent.update_docs.instruksi
                      : text;
    const result = this._getSelfHealingSpecialist().updateDocumentation(instruksi);

    this._getChatHistoryRepository().save(chatId, 'user', text);
    this._getChatHistoryRepository().save(chatId, 'ai', result);
    return result;
  },

  _handleChatBiasa(chatId, text, intent, riwayat) {
    const finalText = this._getChatSpecialist().needsWebSearch(intent)
      ? this._handleChatWithWebSearch(text, intent, riwayat)
      : (intent.jawabanChat || 'Hmm, boleh diulang lagi?');

    this._getChatHistoryRepository().save(chatId, 'user', text);
    this._getChatHistoryRepository().save(chatId, 'ai', finalText);
    return finalText;
  },

  _handleChatWithWebSearch(text, intent, riwayat) {
    const results = this._getWebSearchProviderService().search(intent.searchQuery);
    return this._getChatSpecialist().respondWithSearchContext(text, results, riwayat);
  },

  _handleIntentFailure(chatId, text, riwayat) {
    this._getAppLogger().error('MANAGER_INTENT_FAILURE', 'Fallback ke chat sederhana tanpa intent');

    const result = this._getLLMProviderService().generate({
      chain: 'advanced',
      systemInstruction: this._getChatSpecialist().buildSystemPersona(),
      messages: riwayat.concat([{ role: 'user', text: text }]),
      temperature: 0.7
    });
    const finalText = result ? result.text : 'Waduh, semua layanan AI lagi bermasalah nih. Coba lagi sebentar ya.';

    this._getChatHistoryRepository().save(chatId, 'user', text);
    this._getChatHistoryRepository().save(chatId, 'ai', finalText);
    return finalText;
  }
};