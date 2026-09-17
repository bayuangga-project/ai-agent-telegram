const Manager = {
  processConversationalMessage(chatId, text) {
    try {
      if (CommandRouter.isKnownCommand(text)) {
        return CommandRouter.handle(chatId, text);
      }
      var context = this._gatherContext();
      var intent = IntentAnalyzer.analyze(text, context);

      if (!intent || !intent.tipe) {
        return this._handleIntentFailure(chatId, text, context.riwayat);
      }

      this._persistAutoFacts(chatId, intent);
      try {
        SoulMemory.recordEpisode('intent_processed', intent.tipe, 'success', null, null);
      } catch (e) { /* silent */ }
      return this._routeIntent(chatId, text, intent, context);
    } catch (err) {
      AppLogger.error('MANAGER_PROCESS_ERROR', JSON.stringify({
        chatId: chatId,
        error: err.message,
        stack: err.stack
      }));
    }
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
    if (intent.tipe === 'catat_keuangan')
      return this._handleCatatKeuangan(chatId, text, intent);
    if (intent.tipe === 'tanya_saldo')
      return this._handleTanyaSaldo(chatId, text, intent);
    if (intent.tipe === 'ringkasan_keuangan')
      return this._handleRingkasanKeuangan(chatId, text, intent);
    if (intent.tipe === 'atur_budget')
      return this._handleAturBudget(chatId, text, intent);
    if (intent.tipe === 'edit_transaksi')
      return this._handleEditTransaksi(chatId, text, intent);
    if (intent.tipe === 'sync_documentation')
      return this._handleSyncDocumentation(chatId, text, intent);
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
    if (intent.tipe === 'soul_query')
      return this._handleSoulQuery(chatId, text, intent);
    if (intent.tipe === 'soul_init')
      return this._handleSoulInit(chatId, text);
    if (intent.tipe === 'backup_knowledge')
      return this._handleBackupKnowledge(chatId, text);
    if (intent.tipe === 'restore_knowledge')
      return this._handleRestoreKnowledge(chatId, text);
    if (intent.tipe === 'soul_memory_query')
      return this._handleSoulMemoryQuery(chatId, text, intent);

    return this._handleChatBiasa(chatId, text, intent, context.riwayat);
  },

  _askLLMWithKnowledge(chatId, userText, namespace, key, rawData) {
    var template = KnowledgeRepository.get(namespace, key);
    if (!template) {
      AppLogger.error('MANAGER_KNOWLEDGE_MISSING', namespace + ':' + key);
      return null;
    }

    var systemInstruction = TemplateEngine.render(template, {
      data: JSON.stringify(rawData, null, 2)
    });

    var response = LLMProviderService.generate({
      taskType: namespace === 'finance' ? 'finance_response' : 'chat_light',
      chain: 'fast',
      systemInstruction: systemInstruction,
      messages: [{ role: 'user', text: userText }],
      temperature: 0.7
    });

    var finalText = (response && response.text) ? response.text : null;
    if (finalText) {
      ChatHistoryRepository.save(chatId, 'user', userText);
      ChatHistoryRepository.save(chatId, 'ai', finalText);
    }
    return finalText;
  },

  _handleCatatKeuangan(chatId, text, intent) {
    var k = intent.keuangan || {};
    var nominal = Number(k.jumlah);

    if (isNaN(nominal) || nominal <= 0) {
      return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
        code: 'INVALID_AMOUNT',
        attempted_value: k.jumlah
      });
    }

    var wallet = FinanceSpecialist.resolveWallet(k.wallet);
    var payload = {
      walletNama: wallet.nama,
      tipe: k.tipe_transaksi === 'pemasukan' ? TransactionRepository.TIPE_INCOME : TransactionRepository.TIPE_EXPENSE,
      kategori: k.kategori || 'Lainnya',
      jumlah: nominal,
      deskripsi: k.deskripsi || text,
      tanggalTransaksi: DateTimeUtils.nowWIB()
    };

    var result = FinanceSpecialist.recordTransaction(payload);
    return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', result.data);
  },

  _handleTanyaSaldo(chatId, text, intent) {
    var k = intent.keuangan || {};

    if (k.wallet && k.wallet.trim().length > 0) {
      var wallet = WalletRepository.findByName(k.wallet.trim());
      if (!wallet) {
        return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
          code: 'WALLET_NOT_FOUND',
          attempted_wallet: k.wallet
        });
      }
      var saldo = FinanceSpecialist.getSaldoWallet(wallet.id);
      return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', {
        action: 'check_single_wallet',
        wallet: wallet.nama,
        saldo: saldo
      });
    }

    var semua = FinanceSpecialist.getAllSaldo();
    return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', {
      action: 'check_all_wallets',
      data: semua
    });
  },

  _handleRingkasanKeuangan(chatId, text, intent) {
    var k = intent.keuangan || {};
    var periode = (k.periode && k.periode.trim().length > 0)
      ? k.periode.trim()
      : DateTimeUtils.formatPeriode(DateTimeUtils.nowWIB());

    var ringkasan = FinanceSpecialist.getRingkasanPeriode(periode);
    return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', {
      action: 'financial_summary',
      ringkasan: ringkasan
    });
  },

  _handleAturBudget(chatId, text, intent) {
    var k = intent.keuangan || {};
    var nominal = Number(k.jumlah);

    if (!k.kategori || isNaN(nominal) || nominal <= 0) {
      return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
        code: 'INVALID_BUDGET_PARAMS',
        attempted_kategori: k.kategori,
        attempted_jumlah: k.jumlah
      });
    }

    var periode = (k.periode && k.periode.trim().length > 0)
      ? k.periode.trim()
      : DateTimeUtils.formatPeriode(DateTimeUtils.nowWIB());

    var hasil = FinanceSpecialist.createOrUpdateBudget(k.kategori, nominal, periode);
    return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', hasil);
  },

  _handleEditTransaksi(chatId, text, intent) {
    var k = intent.keuangan || {};

    if (k.aksi_edit === 'hapus') {
      var last = TransactionRepository.getLastActive();
      if (!last) {
        return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
          code: 'NO_ACTIVE_TRANSACTION'
        });
      }
      TransactionRepository.softDelete(last._rowIndex);
      return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', {
        action: 'delete_transaction',
        deleted_transaction: {
          id: last.id,
          kategori: last.kategori,
          jumlah: last.jumlah,
          deskripsi: last.deskripsi
        }
      });
    }

    if (k.aksi_edit === 'edit' && k.field_edit) {
      var fields = {};
      var val = k.nilai_baru;
      if (k.field_edit === 'jumlah') {
        val = Number(val);
        if (isNaN(val) || val <= 0) {
          return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
            code: 'INVALID_EDIT_AMOUNT',
            attempted_value: k.nilai_baru
          });
        }
      }
      fields[k.field_edit] = val;
      var hasil = FinanceSpecialist.editLastTransaction(fields);
      if (!hasil.success) {
        return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
          code: hasil.code
        });
      }
      return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', hasil.data);
    }

    return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
      code: 'AMBIGUOUS_EDIT_REQUEST',
      received_params: k
    });
  },

  _handleSyncDocumentation(chatId, text, intent) {
    var result = DocSyncSpecialist.sync();

    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'docsync', 'error', result);
    }

    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', result);
  },

  _handleBackupKnowledge(chatId, text) {
    var result = KnowledgeSyncSpecialist.pushSheetToGitHub();
    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', {
      action: 'backup_knowledge',
      result: result
    });
  },

  _handleRestoreKnowledge(chatId, text) {
    var result = KnowledgeSyncSpecialist.bootstrap();
    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', {
      action: 'restore_knowledge',
      result: result
    });
  },

  _handleSoulInit(chatId, text) {
    var result = SoulSpecialist.initializeSelf();
    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', {
      action: 'soul_initialization',
      result: result
    });
  },

  _handleSoulQuery(chatId, text, intent) {
    var soulContext = SoulSpecialist.getFullContext();
    var episodes = SoulMemory.getRecentEpisodes(10);
    var metaInsights = SoulMemory.getMetaInsights(5);

    return this._askLLMWithKnowledge(chatId, text, 'soul', 'response', {
      action: 'soul_query',
      soul_context: soulContext,
      recent_episodes: episodes,
      meta_insights: metaInsights
    });
  },

  _handleSoulMemoryQuery(chatId, text, intent) {
    var episodes = SoulMemory.getRecentEpisodes(20);
    var metaInsights = SoulMemory.getMetaInsights(10);

    return this._askLLMWithKnowledge(chatId, text, 'soul', 'response', {
      action: 'memory_query',
      episodes: episodes,
      meta_insights: metaInsights
    });
  },

  _handleAckReminder(chatId, text, intent, context) {
    var hasil = ReminderSpecialist.acknowledge(text, intent, context.reminderMenunggu);
    if (hasil.success) return hasil.text;
    return this._handleChatBiasa(chatId, text, intent, context.riwayat);
  },

  _handleBuatReminder(intent) {
    return ReminderSpecialist.create(intent).text;
  },

  _handleDiagnoseError(chatId, text, intent) {
    var keluhan = (intent.diagnose_error && intent.diagnose_error.keluhanUser) || text;
    var result = SelfHealingSpecialist.diagnose(keluhan);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleUpdateDocs(chatId, text, intent) {
    var instruksi = (intent.update_docs && intent.update_docs.instruksi) || text;
    var result = SelfHealingSpecialist.updateDocumentation(instruksi);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleAuditCode(chatId, text, intent) {
    var scope = (intent.audit_code && intent.audit_code.scope) || 'full';
    var result = CodeAuditor.runAudit(scope);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleFixAudit(chatId, text, intent) {
    var scope = (intent.fix_audit && intent.fix_audit.scope) || 'all';
    var result = CodeAuditor.fixIssues(scope);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleCheckChanges(chatId, text, intent) {
    var mode = (intent.check_changes && intent.check_changes.mode) || 'full';
    var result = ChangeDetector.runDetection(mode);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleRoadmapQuery(chatId, text, intent) {
    var rq = intent.roadmap_query || {};
    var action = rq.action || 'ask';
    var question = rq.question || text;
    var result;
    if (action === 'build') result = ProjectBrain.buildRoadmapFromDiscussion(question);
    else if (action === 'check_alignment' || action === 'adapt')
      result = ProjectBrain.adaptRoadmapForNewIdea(question);
    else result = ProjectBrain.answerQuestion(question);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleImplementFeature(chatId, text, intent) {
    var idea = (intent.implement_feature && intent.implement_feature.idea) || text;
    var result = FeatureArchitect.implementBlueprint(idea);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleSelfQuery(chatId, text, intent) {
    var focus = (intent.self_query && intent.self_query.focus) || 'all';
    var result = SelfAwareness.review(focus);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleChatBiasa(chatId, text, intent, riwayat) {
    var finalText;
    if (ChatSpecialist.needsWebSearch(intent))
      finalText = this._handleChatWithWebSearch(text, intent, riwayat);
    else if (intent.complexity === 'heavy')
      finalText = this._handleHeavyChat(text, intent, riwayat);
    else
      finalText = intent.jawabanChat || '';

    if (finalText) {
      ChatHistoryRepository.save(chatId, 'user', text);
      ChatHistoryRepository.save(chatId, 'ai', finalText);
    }
    return finalText;
  },

  _handleHeavyChat(text, intent, riwayat) {
    AppLogger.info('MANAGER_HEAVY_CHAT', 'chain:advanced');
    var result = LLMProviderService.generate({
      taskType: 'chat_heavy',
      chain: 'advanced',
      systemInstruction: ChatSpecialist.buildSystemPersona(),
      messages: riwayat.concat([{ role: 'user', text: text }]),
      temperature: 0.7
    });
    return (result && result.text) ? result.text : (intent.jawabanChat || '');
  },

  _handleChatWithWebSearch(text, intent, riwayat) {
    var results = WebSearchProviderService.search(intent.searchQuery);
    return ChatSpecialist.respondWithSearchContext(text, results, riwayat);
  },

  _handleIntentFailure(chatId, text, riwayat) {
    AppLogger.error('MANAGER_INTENT_FAILURE', 'fallback:advanced');
    var result = LLMProviderService.generate({
      taskType: 'chat_light',
      chain: 'advanced',
      systemInstruction: ChatSpecialist.buildSystemPersona(),
      messages: riwayat.concat([{ role: 'user', text: text }]),
      temperature: 0.7
    });
    var finalText = result ? result.text : '';
    if (finalText) {
      ChatHistoryRepository.save(chatId, 'user', text);
      ChatHistoryRepository.save(chatId, 'ai', finalText);
    }
    return finalText;
  }
};