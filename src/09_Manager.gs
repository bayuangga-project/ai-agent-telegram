/**
 * ===================================================================
 * MANAGER: RE-ACT AUTONOMOUS AGENT ENGINE (SMART PARSER & SAFE FALLBACK)
 * ===================================================================
 */
const Manager = {

    processConversationalMessage(chatId, text) {
    try {
      // Pengecekan pemicu ubah nama otomatis ("Namamu X" / "Nama kamu X")
      this._checkAndSaveIdentityUpdate(chatId, text);

      var pendingDraft = SelfDocSync.getPendingDraft();
      if (pendingDraft) {
        var approvalAction = SelfDocSync.parseApproval(text);
        if (approvalAction) {
          return this._handleSyncApproval(chatId, text, approvalAction);
        }
      }

      if (CommandRouter.isKnownCommand(text)) {
        return CommandRouter.handle(chatId, text);
      }

      var context = this._gatherContext();
      return this._planAndExecute(chatId, text, context);

    } catch (err) {
      AppLogger.error('MANAGER_PROCESS_ERROR', JSON.stringify({
        chatId: chatId,
        error: err.message,
        stack: err.stack
      }));
      return this._askLLMWithKnowledge(chatId, text, 'chat', 'error', { code: 'CRITICAL_MANAGER_ERROR', message: err.message });
    }
  },

  /**
   * Deteksi & Simpan Perubahan Identitas/Nama AI Otomatis
   */
  _checkAndSaveIdentityUpdate(chatId, text) {
    if (!text) return;
    var lower = text.toLowerCase().trim();
    var match = lower.match(/^(?:namamu|nama kamu|panggil kamu|panggilmu)\s+([a-zA-Z0-9\s]+)$/i);
    if (match && match[1]) {
      var newName = match[1].trim();
      newName = newName.charAt(0).toUpperCase() + newName.slice(1);
      
      try {
        // 1. Simpan ke Soul Identity
        if (typeof SoulSpecialist !== 'undefined' && SoulSpecialist.updateIdentity) {
          SoulSpecialist.updateIdentity({ name: newName });
        }
        // 2. Simpan ke Fact Repository
        KnowledgeSpecialist.saveFact(chatId, 'Nama AI Agent ini adalah ' + newName, 'identitas');
        // 3. Simpan ke User Profile
        UserProfileSpecialist.saveUpdates([{ key: 'ai_name', value: newName, category: 'identitas' }]);
        
        AppLogger.info('IDENTITY_NAME_SAVED', 'name:' + newName);
      } catch (e) {
        AppLogger.error('IDENTITY_SAVE_FAIL', e.message);
      }
    }
  },

  _gatherContext() {
    return {
      riwayat: ChatHistoryRepository.getRecent(10),
      facts: KnowledgeSpecialist.getActiveFactsForPrompt(15),
      profile: UserProfileSpecialist.getProfileForPrompt(10),
      ltm: MemorySpecialist.getLongTermMemory(3),
      reminderMenunggu: ReminderSpecialist.getMenungguRespon(),
      ackPatterns: ReminderSpecialist.getAckPatternsForPrompt(5)
    };
  },

  _planAndExecute(chatId, userText, context) {
    var maxSteps = 3;
    var step = 1;
    var observations = [];
    var lastToolResult = null;

    while (step <= maxSteps) {
      AppLogger.info('AGENT_STEP_START', 'step:' + step + '|user:' + userText.substring(0, 50));

      var planPrompt = this._buildPlanningPrompt(userText, context, observations);
      var llmResult = LLMProviderService.generate({
        taskType: 'chat_heavy',
        systemInstruction: planPrompt,
        messages: [{ role: 'user', text: userText }],
        temperature: 0.3
      });

      if (!llmResult || !llmResult.text) {
        AppLogger.warning('AGENT_PLAN_FAIL', 'step:' + step + '|llm_empty');
        break;
      }

      var plan = this._parseAgentPlan(llmResult.text);
      if (!plan || !plan.action) {
        AppLogger.warning('AGENT_PLAN_PARSE_FAIL', 'step:' + step + '|raw:' + llmResult.text.substring(0, 100));
        break;
      }

      AppLogger.info('AGENT_THOUGHT', 'step:' + step + '|thought:' + (plan.thought || '-'));

      if (plan.action === 'final_answer' || plan.action === 'chat') {
        var finalResponse = plan.final_answer || plan.jawabanChat || (plan.tool_params && plan.tool_params.jawabanChat) || null;
        if (finalResponse && finalResponse.trim().length > 0) {
          ChatHistoryRepository.save(chatId, 'user', userText);
          ChatHistoryRepository.save(chatId, 'ai', finalResponse);
          return finalResponse;
        }
        break;
      }

      AppLogger.info('AGENT_ACTION_SELECT', 'step:' + step + '|tool:' + plan.action);
      var toolResult = this._executeTool(plan.action, plan.tool_params || {}, chatId, userText, context);

      observations.push({
        step: step,
        thought: plan.thought,
        toolUsed: plan.action,
        paramsUsed: plan.tool_params,
        outcome: toolResult
      });

      lastToolResult = toolResult;

      if (typeof toolResult === 'string' && toolResult.length > 0) {
        return toolResult;
      }

      step++;
    }

    AppLogger.warning('AGENT_FALLBACK_TRIGGERED', 'userText:' + userText);
    return this._handleFallback(chatId, userText, context, observations, lastToolResult);
  },

  _executeTool(toolName, params, chatId, userText, context) {
    try {
      var intentMock = { tipe: toolName, keuangan: params, diagnose_error: params, update_docs: params, audit_code: params, fix_audit: params, check_changes: params, roadmap_query: params, implement_feature: params, self_query: params, searchQuery: params.searchQuery, jawabanChat: params.jawabanChat };

      if (toolName === 'catat_keuangan') return this._handleCatatKeuangan(chatId, userText, intentMock);
      if (toolName === 'tanya_saldo') return this._handleTanyaSaldo(chatId, userText, intentMock);
      if (toolName === 'ringkasan_keuangan') return this._handleRingkasanKeuangan(chatId, userText, intentMock);
      if (toolName === 'atur_budget') return this._handleAturBudget(chatId, userText, intentMock);
      if (toolName === 'edit_transaksi') return this._handleEditTransaksi(chatId, userText, intentMock);
      if (toolName === 'sync_documentation') return this._handleSyncDocumentation(chatId, userText, intentMock);
      if (toolName === 'ack_reminder') return this._handleAckReminder(chatId, userText, intentMock, context);
      if (toolName === 'buat_reminder') return this._handleBuatReminder(intentMock);
      if (toolName === 'diagnose_error') return this._handleDiagnoseError(chatId, userText, intentMock);
      if (toolName === 'update_docs') return this._handleUpdateDocs(chatId, userText, intentMock);
      if (toolName === 'audit_code') return this._handleAuditCode(chatId, userText, intentMock);
      if (toolName === 'fix_audit') return this._handleFixAudit(chatId, userText, intentMock);
      if (toolName === 'check_changes') return this._handleCheckChanges(chatId, userText, intentMock);
      if (toolName === 'roadmap_query') return this._handleRoadmapQuery(chatId, userText, intentMock);
      if (toolName === 'implement_feature') return this._handleImplementFeature(chatId, userText, intentMock);
      if (toolName === 'self_query') return this._handleSelfQuery(chatId, userText, intentMock);
      if (toolName === 'web_search') return this._handleChatWithWebSearch(userText, intentMock, context.riwayat);

      return this._handleChatBiasa(chatId, userText, intentMock, context.riwayat);

    } catch (err) {
      AppLogger.error('TOOL_EXECUTION_ERROR', 'tool:' + toolName + '|error:' + err.message);
      return { success: false, error: err.message, tool: toolName };
    }
  },

    /**
   * PENTING: Menggunakan ChatSpecialist.buildSystemPersona() 
   * agar variabel {{name}} dan aturan identitas di-render 100% presisi!
   */
  _buildPlanningPrompt(userText, context, observations) {
    // 1. Panggil persona yang SUDAH DI-RENDER dinamis oleh ChatSpecialist
    var persona = ChatSpecialist.buildSystemPersona();
    var toolsRegistry = KnowledgeRepository.get('tools', 'registry') || '[]';
    var template = KnowledgeRepository.get('agent', 'planning_prompt');

    var nowStr = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());

    var variables = {
      persona: persona,
      now: nowStr,
      tools_registry: toolsRegistry,
      riwayat: IntentAnalyzer._formatRiwayat(context.riwayat),
      fakta: IntentAnalyzer._formatList(context.facts),
      profil: IntentAnalyzer._formatList(context.profile),
      ltm: IntentAnalyzer._formatList(context.ltm),
      observations: JSON.stringify(observations, null, 2),
      user_message: userText
    };

    if (template) {
      return TemplateEngine.render(template, variables);
    }

    return persona + '\nTools: ' + toolsRegistry + '\nUser: ' + userText;
  },

  /**
   * SMART PARSER: Jika LLM menjawab dalam teks biasa (bukan JSON), 
   * otomatis bungkus sebagai final_answer agar pesan tidak hilang!
   */
  _parseAgentPlan(rawText) {
    if (!rawText) return null;
    var cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      try {
        var repaired = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        return JSON.parse(repaired);
      } catch (e2) {
        // Jika LLM merespons dengan kalimat teks biasa (bukan format JSON),
        // terima teks tersebut secara cerdas sebagai final_answer!
        if (cleaned.length > 0 && cleaned.indexOf('{') === -1) {
          return {
            thought: 'LLM direct conversational text response',
            action: 'final_answer',
            final_answer: cleaned
          };
        }
        return null;
      }
    }
  },

  _handleFallback(chatId, userText, context, observations, lastToolResult) {
    if (lastToolResult && typeof lastToolResult === 'object' && lastToolResult.error) {
      return this._askLLMWithKnowledge(chatId, userText, 'chat', 'error', {
        code: 'TOOL_EXECUTION_FAILED',
        tool: lastToolResult.tool,
        error: lastToolResult.error
      });
    }

    return this._handleChatBiasa(chatId, userText, { tipe: 'chat_biasa', complexity: 'light' }, context.riwayat);
  },

  _handleSyncApproval(chatId, text, action) {
    ChatHistoryRepository.save(chatId, 'user', text);

    if (action === 'approve') {
      var result = SelfDocSync.approveDraft();
      var msg = result.success
        ? '✅ Dokumentasi berhasil diterbitkan ke GitHub.'
        : '⚠️ Gagal menerbitkan: ' + (result.reason || 'unknown');
      ChatHistoryRepository.save(chatId, 'ai', msg);
      return msg;
    }

    if (action === 'reject') {
      SelfDocSync.rejectDraft();
      var msgReject = '❌ Draft dokumentasi dibatalkan.';
      ChatHistoryRepository.save(chatId, 'ai', msgReject);
      return msgReject;
    }

    if (action === 'detail') {
      var draft = SelfDocSync.getDraftDetail();
      if (!draft) {
        var msgNoDraft = 'Tidak ada draft yang tertunda.';
        ChatHistoryRepository.save(chatId, 'ai', msgNoDraft);
        return msgNoDraft;
      }

      var parts = [];
      for (var i = 0; i < draft.files.length; i++) {
        var f = draft.files[i];
        var chunk = '📄 *' + f.fileName + '*\n' +
          (f.reason ? 'Alasan: ' + f.reason + '\n' : '') +
          'Panjang: ' + f.content.length + ' karakter';
        parts.push(chunk);
      }

      var detailMsg = '📋 *Detail Draft (' + draft.files.length + ' file):*\n\n' +
        parts.join('\n\n') +
        '\n\nTerdeteksi: ' + (draft.detectedAt || '-') +
        '\n\nReply *ya* untuk terbitkan, *batal* untuk batalkan.';

      if (detailMsg.length > 3800) {
        detailMsg = detailMsg.substring(0, 3797) + '...';
      }

      ChatHistoryRepository.save(chatId, 'ai', detailMsg);
      return detailMsg;
    }

    return null;
  },

  _askLLMWithKnowledge(chatId, userText, namespace, key, rawData) {
    var template = KnowledgeRepository.get(namespace, key);
    if (!template) {
      template = 'Response: {{data}}';
    }

    var systemInstruction = TemplateEngine.render(template, {
      data: JSON.stringify(rawData, null, 2)
    });

    var response = LLMProviderService.generate({
      taskType: namespace === 'finance' ? 'finance_response' : 'chat_light',
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

    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'error', result);
    }
    return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'response', result);
  },

  _handleUpdateDocs(chatId, text, intent) {
    var instruksi = (intent.update_docs && intent.update_docs.instruksi) || text;
    var result = SelfHealingSpecialist.updateDocumentation(instruksi);

    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'error', result);
    }
    return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'doc_update_response', result);
  },

  _handleAuditCode(chatId, text, intent) {
    var scope = (intent.audit_code && intent.audit_code.scope) || 'full';
    var result = CodeAuditor.runAudit(scope);

    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'audit', 'error', result);
    }

    return this._askLLMWithKnowledge(chatId, text, 'audit', 'report_response', result);
  },

  _handleFixAudit(chatId, text, intent) {
    var scope = (intent.fix_audit && intent.fix_audit.scope) || 'all';
    var result = CodeAuditor.fixIssues(scope);

    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'audit', 'error', result);
    }

    return this._askLLMWithKnowledge(chatId, text, 'audit', 'fix_response', result);
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

    if (action === 'build') {
      result = ProjectBrain.buildRoadmapFromDiscussion(question);
    } else if (action === 'check_alignment' || action === 'adapt') {
      result = ProjectBrain.adaptRoadmapForNewIdea(question);
    } else if (action === 'sync') {
      result = ProjectBrain.syncRoadmapWithCode();
    } else {
      var answer = ProjectBrain.answerQuestion(question);
      if (answer) {
        ChatHistoryRepository.save(chatId, 'user', text);
        ChatHistoryRepository.save(chatId, 'ai', answer);
        return answer;
      }
      result = { success: false, code: 'QUERY_FAILED' };
    }

    if (result && !result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'roadmap', 'error', result);
    }
    return this._askLLMWithKnowledge(chatId, text, 'roadmap', 'response', result);
  },

  _handleImplementFeature(chatId, text, intent) {
    var idea = (intent.implement_feature && intent.implement_feature.idea) || text;
    
    var isConfirmImplement = text.toLowerCase().indexOf('implement') >= 0 || text.toLowerCase().indexOf('terapkan') >= 0;
    var result;

    if (isConfirmImplement) {
      result = FeatureArchitect.implementBlueprint(idea);
      if (!result.success) {
        return this._askLLMWithKnowledge(chatId, text, 'feature', 'error', result);
      }
      return this._askLLMWithKnowledge(chatId, text, 'feature', 'implement_response', result);
    }

    result = FeatureArchitect.generateBlueprint(idea);
    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'feature', 'error', result);
    }
    return this._askLLMWithKnowledge(chatId, text, 'feature', 'blueprint_response', result);
  },

  _handleSelfQuery(chatId, text, intent) {
    var focus = (intent.self_query && intent.self_query.focus) || 'all';
    var result = SelfAwareness.review(focus);

    return this._askLLMWithKnowledge(chatId, text, 'selfaware', 'review_response', result);
  },

  _handleChatBiasa(chatId, text, intent, riwayat) {
    var finalText;
    if (ChatSpecialist.needsWebSearch(intent)) {
      finalText = this._handleChatWithWebSearch(text, intent, riwayat);
    } else if (intent.complexity === 'heavy') {
      finalText = this._handleHeavyChat(text, intent, riwayat);
    } else if (intent.jawabanChat && intent.jawabanChat.trim().length > 0) {
      finalText = intent.jawabanChat;
    } else {
      finalText = this._handleIntentFailure(chatId, text, riwayat);
    }

    if (!finalText || finalText.trim().length === 0) {
      finalText = 'Halo! Ada yang bisa saya bantu terkait tugas, pengingat, atau pertanyaan teknis hari ini?';
    }

    if (finalText) {
      ChatHistoryRepository.save(chatId, 'user', text);
      ChatHistoryRepository.save(chatId, 'ai', finalText);
    }
    return finalText;
  },

  _handleHeavyChat(text, intent, riwayat) {
    AppLogger.info('MANAGER_HEAVY_CHAT', 'task:chat_heavy');
    var result = LLMProviderService.generate({
      taskType: 'chat_heavy',
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
    AppLogger.error('MANAGER_INTENT_FAILURE', 'task:chat_light');
    var result = LLMProviderService.generate({
      taskType: 'chat_light',
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