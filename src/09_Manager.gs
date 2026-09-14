/**
 * ===================================================================
 * MANAGER (ORCHESTRATOR)
 * Tanggung jawab: terima pesan natural language, panggil
 * IntentAnalyzer, routing ke Specialist yang sesuai, kembalikan
 * jawaban final.
 * ===================================================================
 */
const Manager = {
  processConversationalMessage(chatId, text) {
    const context = this._gatherContext();
    const intent = IntentAnalyzer.analyze(text, context);

    if (!intent) {
      return this._handleIntentFailure(chatId, text, context.riwayat);
    }

    this._persistAutoFacts(chatId, intent);
    return this._routeIntent(chatId, text, intent, context);
  },

  _gatherContext() {
    return {
      riwayat: ChatHistoryRepository.getRecent(15),
      facts: KnowledgeSpecialist.getActiveFactsForPrompt(50),
      reminderMenunggu: ReminderSpecialist.getMenungguRespon(),
      ackPatterns: ReminderSpecialist.getAckPatternsForPrompt(10)
    };
  },

  _persistAutoFacts(chatId, intent) {
    if (intent.factsBaru && intent.factsBaru.length > 0) {
      KnowledgeSpecialist.saveAutoDetectedFacts(chatId, intent.factsBaru);
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
    const hasil = ReminderSpecialist.acknowledge(text, intent, context.reminderMenunggu);
    if (hasil.success) return hasil.text;
    return this._handleChatBiasa(chatId, text, intent, context.riwayat);
  },

  _handleBuatReminder(intent) {
    const hasil = ReminderSpecialist.create(intent);
    return hasil.text;
  },

  _handleDiagnoseError(chatId, text, intent) {
    const keluhan = (intent.diagnose_error && intent.diagnose_error.keluhanUser)
                    ? intent.diagnose_error.keluhanUser
                    : text;
    const result = SelfHealingSpecialist.diagnose(keluhan);

    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleUpdateDocs(chatId, text, intent) {
    const instruksi = (intent.update_docs && intent.update_docs.instruksi)
                      ? intent.update_docs.instruksi
                      : text;
    const result = SelfHealingSpecialist.updateDocumentation(instruksi);

    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleChatBiasa(chatId, text, intent, riwayat) {
    const finalText = ChatSpecialist.needsWebSearch(intent)
      ? this._handleChatWithWebSearch(text, intent, riwayat)
      : (intent.jawabanChat || 'Hmm, boleh diulang lagi?');

    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', finalText);
    return finalText;
  },

  _handleChatWithWebSearch(text, intent, riwayat) {
    const results = WebSearchProviderService.search(intent.searchQuery);
    return ChatSpecialist.respondWithSearchContext(text, results, riwayat);
  },

  _handleIntentFailure(chatId, text, riwayat) {
    AppLogger.error('MANAGER_INTENT_FAILURE', 'Fallback ke chat sederhana tanpa intent');

    const result = LLMProviderService.generate({
      chain: 'advanced',
      systemInstruction: ChatSpecialist.buildSystemPersona(),
      messages: riwayat.concat([{ role: 'user', text: text }]),
      temperature: 0.7
    });
    const finalText = result ? result.text : 'Waduh, semua layanan AI lagi bermasalah nih. Coba lagi sebentar ya.';

    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', finalText);
    return finalText;
  }
};