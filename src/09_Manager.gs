/**
 * ===================================================================
 * MANAGER (ORCHESTRATOR)
 * Tanggung jawab: terima pesan natural language, panggil
 * IntentAnalyzer, routing ke Specialist yang sesuai, kembalikan
 * jawaban final.
 *
 * OPTIMASI KECEPATAN:
 * - Intent analysis pakai chain "fast" (~3-5 detik)
 * - Untuk chat_biasa dengan complexity "light": pakai jawabanChat langsung
 * - Untuk chat_biasa dengan complexity "heavy": panggil LLM advanced
 *   untuk jawaban yang lebih mendalam
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
      profile: UserProfileSpecialist.getProfileForPrompt(30),
      ltm: MemorySpecialist.getLongTermMemory(7),
      reminderMenunggu: ReminderSpecialist.getMenungguRespon(),
      ackPatterns: ReminderSpecialist.getAckPatternsForPrompt(10)
    };
  },

  _persistAutoFacts(chatId, intent) {
    if (intent.factsBaru && intent.factsBaru.length > 0) {
      KnowledgeSpecialist.saveAutoDetectedFacts(chatId, intent.factsBaru);
    }
    if (intent.profileUpdates && intent.profileUpdates.length > 0) {
      UserProfileSpecialist.saveUpdates(intent.profileUpdates);
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
    if (intent.tipe === 'audit_code') {
      return this._handleAuditCode(chatId, text, intent);
    }
    if (intent.tipe === 'fix_audit') {
      return this._handleFixAudit(chatId, text, intent);
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

  _handleAuditCode(chatId, text, intent) {
    const scope = (intent.audit_code && intent.audit_code.scope)
                  ? intent.audit_code.scope
                  : 'full';
    const result = CodeAuditor.runAudit(scope);

    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleFixAudit(chatId, text, intent) {
    const scope = (intent.fix_audit && intent.fix_audit.scope)
                  ? intent.fix_audit.scope
                  : 'all';
    const result = CodeAuditor.fixIssues(scope);

    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleChatBiasa(chatId, text, intent, riwayat) {
    let finalText;

    if (ChatSpecialist.needsWebSearch(intent)) {
      finalText = this._handleChatWithWebSearch(text, intent, riwayat);
    } else if (intent.complexity === 'heavy') {
      finalText = this._handleHeavyChat(text, intent, riwayat);
    } else {
      finalText = intent.jawabanChat || 'Hmm, boleh diulang lagi?';
    }

    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', finalText);
    return finalText;
  },

  _handleHeavyChat(text, intent, riwayat) {
    AppLogger.info('MANAGER_HEAVY_CHAT', 'Escalating to advanced chain');
    const result = LLMProviderService.generate({
      chain: 'advanced',
      systemInstruction: ChatSpecialist.buildSystemPersona(),
      messages: riwayat.concat([{ role: 'user', text: text }]),
      temperature: 0.7
    });
    if (result && result.text) {
      return result.text;
    }
    return intent.jawabanChat || 'Waduh, aku lagi kesulitan mikir yang dalam nih. Coba lagi ya.';
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