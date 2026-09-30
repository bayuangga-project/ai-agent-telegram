/**
 * ===================================================================
 * MANAGER: RE-ACT AUTONOMOUS AGENT ENGINE (SLOT-FILLING INTEGRATED)
 * ===================================================================
 */
const Manager = {

  processConversationalMessage(chatId, text) {
    try {
      this._checkAndSaveIdentityUpdate(chatId, text);

      // 1. Pengecekan approval pending draft SelfDocSync
      var pendingDraftDoc = SelfDocSync.getPendingDraft();
      if (pendingDraftDoc) {
        var approvalActionDoc = SelfDocSync.parseApproval(text);
        if (approvalActionDoc) {
          return this._handleSyncApproval(chatId, text, approvalActionDoc);
        }
      }

      // 2. Pengecekan Slot-Filling / Approval Pending Draft Finance Tracker
      var pendingFinance = FinanceSpecialist.getPendingDraft();
      if (pendingFinance) {
        // A. Jika draft memiliki field tertunda (SLOT-FILLING STATE)
        if (pendingFinance.pendingField) {
          var cleanLower = String(text).toLowerCase().trim();
          if (cleanLower === 'batal' || cleanLower === 'cancel' || cleanLower === 'ga jadi') {
            FinanceSpecialist.clearDraft();
            var msgCancelSlot = '❌ Draft transaksi dibatalkan.';
            ChatHistoryRepository.save(chatId, 'user', text);
            ChatHistoryRepository.save(chatId, 'ai', msgCancelSlot);
            return msgCancelSlot;
          }

          var fulfillRes = FinanceSpecialist.fulfillPendingField(text);
          if (fulfillRes.success) {
            var completedDraft = fulfillRes.draft;
            var confirmText = '📝 *Draft Transaksi Keuangan Lengkap (Tracker V19.3)*\n\n' +
              '📌 Jenis: *' + completedDraft.type + '*\n' +
              '💵 Nominal: *Rp ' + completedDraft.amount.toLocaleString('id-ID') + '*\n' +
              '📂 Kategori: *' + completedDraft.category + '*\n' +
              '💳 Akun: *' + (completedDraft.from || completedDraft.to || '-') + '*\n' +
              '📝 Catatan: ' + (completedDraft.notes || '-') + '\n' +
              '📅 Tanggal: ' + completedDraft.date + '\n\n' +
              'Reply *ya* untuk simpan ke database Tracker, atau *batal* untuk membatalkan.';

            ChatHistoryRepository.save(chatId, 'user', text);
            ChatHistoryRepository.save(chatId, 'ai', confirmText);
            return confirmText;
          } else if (CommandRouter.isKnownCommand(text)) {
            // Jika user mengetik command lain, batalkan draft parsial lama
            FinanceSpecialist.clearDraft();
          } else {
            // Jika opsi tidak cocok, tapi user mungkin berganti topik, batalkan draft lama & alihkan
            FinanceSpecialist.clearDraft();
          }
        } else {
          // B. Jika draft sudah lengkap (AWAITED APPROVAL)
          var approvalActionFin = SelfDocSync.parseApproval(text);
          if (approvalActionFin) {
            return this._handleFinanceApproval(chatId, text, approvalActionFin);
          }
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

  _checkAndSaveIdentityUpdate(chatId, text) {
    if (!text) return;
    var lower = text.toLowerCase().trim();
    var match = lower.match(/^(?:namamu|nama kamu|panggil kamu|panggilmu|nama mu)\s+([a-zA-Z0-9\s]+)$/i);
    if (match && match[1]) {
      var newName = match[1].trim();
      newName = newName.charAt(0).toUpperCase() + newName.slice(1);
      
      try {
        if (typeof SoulSpecialist !== 'undefined' && SoulSpecialist.updateIdentity) {
          SoulSpecialist.updateIdentity({ name: newName });
        }
        KnowledgeSpecialist.saveFact(chatId, 'Nama AI Agent ini adalah ' + newName, 'identitas');
        UserProfileSpecialist.saveUpdates([{ key: 'ai_name', value: newName, category: 'identitas' }]);
        AppLogger.info('IDENTITY_NAME_SAVED', 'name:' + newName);
      } catch (e) {
        AppLogger.error('IDENTITY_SAVE_FAIL', e.message);
      }
    }
  },

  _handleFinanceApproval(chatId, text, action) {
    ChatHistoryRepository.save(chatId, 'user', text);

    if (action === 'approve') {
      var result = FinanceSpecialist.approveDraft();
      if (result.success) {
        var tplSuccess = KnowledgeRepository.get('finance', 'success_written') ||
          '✅ Transaksi berhasil dicatat!\n📌 {{type}}: Rp {{amount}}\n📂 Kategori: {{category}}\n💳 Akun: {{account}}\n💰 Saldo Terbaru: Rp {{updatedSaldo}}';
        
        var msgSuccess = TemplateEngine.render(tplSuccess, {
          type: result.data.type,
          amount: result.data.amount.toLocaleString('id-ID'),
          category: result.data.category,
          account: result.data.account,
          updatedSaldo: result.data.updatedSaldo.toLocaleString('id-ID')
        });

        ChatHistoryRepository.save(chatId, 'ai', msgSuccess);
        return msgSuccess;
      } else {
        var tplFail = KnowledgeRepository.get('finance', 'error_write_fail') || '⚠️ Gagal mencatat: {{error}}';
        var msgFail = TemplateEngine.render(tplFail, { error: result.error || result.code });
        ChatHistoryRepository.save(chatId, 'ai', msgFail);
        return msgFail;
      }
    }

    if (action === 'reject') {
      FinanceSpecialist.clearDraft();
      var msgCancel = KnowledgeRepository.get('finance', 'cancel_draft') || '❌ Draft transaksi dibatalkan.';
      ChatHistoryRepository.save(chatId, 'ai', msgCancel);
      return msgCancel;
    }

    if (action === 'detail') {
      var draft = FinanceSpecialist.getPendingDraft();
      if (!draft) return 'Tidak ada draft.';

      var tplDetail = KnowledgeRepository.get('finance', 'detail_draft') ||
        '📋 *Detail Draft:*\n📌 Jenis: {{type}}\n💵 Nominal: Rp {{amount}}\n📂 Kategori: {{category}}\n💳 Akun: {{account}}\n📝 Catatan: {{notes}}\n📅 Tanggal: {{date}}';

      var detailText = TemplateEngine.render(tplDetail, {
        type: draft.type,
        amount: draft.amount.toLocaleString('id-ID'),
        category: draft.category,
        account: draft.from || draft.to || '-',
        notes: draft.notes || '-',
        date: draft.date
      });

      ChatHistoryRepository.save(chatId, 'ai', detailText);
      return detailText;
    }

    return null;
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
        temperature: 0.2
      });

      if (!llmResult || !llmResult.text) break;

      var plan = this._parseAgentPlan(llmResult.text);
      if (!plan || !plan.action) break;

      AppLogger.info('AGENT_PLAN_ACTION', 'step:' + step + '|action:' + plan.action);

      if (plan.action === 'final_answer' || plan.action === 'chat') {
        var finalResponse = plan.final_answer || plan.jawabanChat || (plan.tool_params && plan.tool_params.jawabanChat) || null;
        if (finalResponse && finalResponse.trim().length > 0) {
          ChatHistoryRepository.save(chatId, 'user', userText);
          ChatHistoryRepository.save(chatId, 'ai', finalResponse);
          return finalResponse;
        }
        break;
      }

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

    return this._handleFallback(chatId, userText, context, observations, lastToolResult);
  },

  _executeTool(toolName, params, chatId, userText, context) {
    try {
      var intentMock = { tipe: toolName, keuangan: params, diagnose_error: params, update_docs: params, audit_code: params, fix_audit: params, check_changes: params, roadmap_query: params, implement_feature: params, self_query: params, searchQuery: params.searchQuery, jawabanChat: params.jawabanChat };

      if (toolName === 'catat_keuangan') return this._handleCatatKeuangan(chatId, userText, intentMock);
      if (toolName === 'tanya_saldo') return this._handleTanyaSaldo(chatId, userText, intentMock);
      if (toolName === 'ringkasan_keuangan') return this._handleRingkasanKeuangan(chatId, userText, intentMock);
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

  _buildPlanningPrompt(userText, context, observations) {
    var persona = ChatSpecialist.buildSystemPersona();
    var toolsRegistry = KnowledgeRepository.get('tools', 'registry') || '[]';
    var template = KnowledgeRepository.get('agent', 'planning_prompt');

    if (!template) {
      template = '{{persona}}\n\n' +
        'Waktu saat ini: {{now}} WIB.\n\n' +
        '=== DAFTAR TOOL TERSEDIA ===\n' +
        '{{tools_registry}}\n\n' +
        '=== RIWAYAT PERCAKAPAN ===\n' +
        '{{riwayat}}\n\n' +
        '=== FAKTA RELEVAN ===\n' +
        '{{fakta}}\n\n' +
        '=== PROFIL USER ===\n' +
        '{{profil}}\n\n' +
        '=== OBSERVASI SEBELUMNYA ===\n' +
        '{{observations}}\n\n' +
        '=== PESAN USER ===\n' +
        '"{{user_message}}"\n\n' +
        'TUGAS:\n' +
        'Analisis pesan user. Pilih tool yang paling tepat dari DAFTAR TOOL TERSEDIA di atas.\n' +
        '- Jika user ingin cek saldo atau tanya uang/dompet -> PILIH ACTION: "tanya_saldo"\n' +
        '- Jika user ingin catat pengeluaran/pemasukan -> PILIH ACTION: "catat_keuangan"\n' +
        '- Jika user hanya mengobrol biasa -> PILIH ACTION: "final_answer"\n\n' +
        'ATURAN OUTPUT (Balas HANYA JSON murni tanpa markdown):\n' +
        '{\n' +
        '  "thought": "penjelasan singkat pemikiranmu",\n' +
        '  "action": "nama_tool_dari_registry ATAU final_answer",\n' +
        '  "tool_params": { "wallet": "nama_wallet_jika_ada", "jumlah": 0 },\n' +
        '  "final_answer": "jawaban langsung jika action = final_answer"\n' +
        '}';

      KnowledgeRepository.save('agent', 'planning_prompt', template, 'AUTO_BOOTSTRAP_REACT_PROMPT');
    }

    var variables = {
      persona: persona,
      now: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB()),
      tools_registry: toolsRegistry,
      riwayat: IntentAnalyzer._formatRiwayat(context.riwayat),
      fakta: IntentAnalyzer._formatList(context.facts),
      profil: IntentAnalyzer._formatList(context.profile),
      ltm: IntentAnalyzer._formatList(context.ltm),
      observations: JSON.stringify(observations, null, 2),
      user_message: userText
    };

    return TemplateEngine.render(template, variables);
  },

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
        if (cleaned.length > 0 && cleaned.indexOf('{') === -1) {
          return { thought: 'LLM direct conversational text response', action: 'final_answer', final_answer: cleaned };
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
      var msg = result.success ? '✅ Dokumentasi berhasil diterbitkan ke GitHub.' : '⚠️ Gagal menerbitkan: ' + (result.reason || 'unknown');
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
      if (!draft) return 'Tidak ada draft yang tertunda.';
      var parts = draft.files.map(function(f) { return '📄 *' + f.fileName + '*\nPanjang: ' + f.content.length + ' karakter'; });
      var detailMsg = '📋 *Detail Draft (' + draft.files.length + ' file):*\n\n' + parts.join('\n\n') + '\n\nReply *ya* untuk terbitkan, *batal* untuk batalkan.';
      ChatHistoryRepository.save(chatId, 'ai', detailMsg);
      return detailMsg;
    }
    return null;
  },

  _askLLMWithKnowledge(chatId, userText, namespace, key, rawData) {
    var template = KnowledgeRepository.get(namespace, key) || 'Response: {{data}}';
    var systemInstruction = TemplateEngine.render(template, { data: JSON.stringify(rawData, null, 2) });
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

  /**
   * HANDLER KEUANGAN DENGAN PENYELAMATAN SLOT PARSIAL
   */
  _handleCatatKeuangan(chatId, text, intent) {
    var k = intent.keuangan || {};
    var draftRes = FinanceSpecialist.prepareDraft({
      wallet: k.wallet || k.account || k.dompet || k.from || k.to || '',
      tipe_transaksi: k.tipe_transaksi || k.tipe || k.type || 'pengeluaran',
      kategori: k.kategori || k.category || '',
      jumlah: k.jumlah !== undefined ? k.jumlah : (k.amount !== undefined ? k.amount : (k.nominal !== undefined ? k.nominal : k.value)),
      deskripsi: k.deskripsi || k.notes || k.description || k.catatan || text,
      tanggalTransaksi: DateTimeUtils.nowWIB(),
      text: text
    });

    if (!draftRes.success) {
      var optionsListText = (draftRes.validOptions && draftRes.validOptions.length > 0)
        ? draftRes.validOptions.map(function(opt, idx) { return (idx + 1) + '. ' + opt; }).join('\n')
        : '';

      if (draftRes.code === 'INVALID_AMOUNT') {
        var tplInvAmt = KnowledgeRepository.get('finance', 'error_invalid_amount') || '⚠️ Nominal transaksi harus berupa angka lebih dari 0.';
        return tplInvAmt;
      }

      if (draftRes.code === 'AWAITING_CATEGORY') {
        var tplAwaitingCat = KnowledgeRepository.get('finance', 'awaiting_category') ||
          '⚠️ Kategori untuk transaksi *Rp {{amount}}* belum dipilih.\n\nPilihan Valid:\n{{options}}\n\nReply dengan Nama atau Nomor Urut.';
        
        var msgCat = TemplateEngine.render(tplAwaitingCat, {
          amount: draftRes.draft.amount.toLocaleString('id-ID'),
          options: optionsListText
        });

        ChatHistoryRepository.save(chatId, 'user', text);
        ChatHistoryRepository.save(chatId, 'ai', msgCat);
        return msgCat;
      }

      if (draftRes.code === 'AWAITING_ACCOUNT') {
        var tplAwaitingAcc = KnowledgeRepository.get('finance', 'awaiting_account') ||
          '⚠️ Akun wallet untuk transaksi *Rp {{amount}}* belum dipilih.\n\nPilihan Valid:\n{{options}}\n\nReply dengan Nama atau Nomor Urut.';
        
        var msgAcc = TemplateEngine.render(tplAwaitingAcc, {
          amount: draftRes.draft.amount.toLocaleString('id-ID'),
          options: optionsListText
        });

        ChatHistoryRepository.save(chatId, 'user', text);
        ChatHistoryRepository.save(chatId, 'ai', msgAcc);
        return msgAcc;
      }

      return '⚠️ Gagal: ' + (draftRes.message || draftRes.code);
    }

    var draft = draftRes.draft;
    var tplConfirm = KnowledgeRepository.get('finance', 'confirm_draft') ||
      '📝 *Draft Transaksi Keuangan (Tracker V19.3)*\n\n📌 Jenis: *{{type}}*\n💵 Nominal: *Rp {{amount}}*\n📂 Kategori: *{{category}}*\n💳 Akun: *{{account}}*\n📝 Catatan: {{notes}}\n📅 Tanggal: {{date}}\n\nReply *ya* untuk simpan, atau *batal* untuk membatalkan.';

    var confirmText = TemplateEngine.render(tplConfirm, {
      type: draft.type,
      amount: draft.amount.toLocaleString('id-ID'),
      category: draft.category,
      account: draft.from || draft.to || '-',
      notes: draft.notes || '-',
      date: draft.date
    });

    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', confirmText);
    return confirmText;
  },

  _handleTanyaSaldo(chatId, text, intent) {
    var k = intent.keuangan || {};
    if (k.wallet && k.wallet.trim().length > 0) {
      var saldo = FinanceSpecialist.getSaldoWallet(k.wallet.trim());
      var msgSingle = '💰 *Saldo Live ' + k.wallet.trim() + '*: Rp ' + saldo.toLocaleString('id-ID');
      ChatHistoryRepository.save(chatId, 'user', text);
      ChatHistoryRepository.save(chatId, 'ai', msgSingle);
      return msgSingle;
    }

    var semua = FinanceSpecialist.getAllSaldo();
    if (!semua.wallets || semua.wallets.length === 0) {
      return 'Belum ada data wallet di Tracker V19.3.';
    }

    var lines = semua.wallets.map(function(w) {
      return '• *' + w.nama + '*: Rp ' + w.saldo.toLocaleString('id-ID');
    });

    var msgAll = '📊 *Ringkasan Saldo Live Tracker V19.3*\n\n' +
      lines.join('\n') + '\n\n' +
      '💵 *Total Keseluruhan*: Rp ' + semua.total.toLocaleString('id-ID');

    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', msgAll);
    return msgAll;
  },

  _handleRingkasanKeuangan(chatId, text, intent) {
    return this._handleTanyaSaldo(chatId, text, intent);
  },

  _handleSyncDocumentation(chatId, text, intent) {
    var result = DocSyncSpecialist.sync();
    if (!result.success) return this._askLLMWithKnowledge(chatId, text, 'docsync', 'error', result);
    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', result);
  },

  _handleBackupKnowledge(chatId, text) {
    var result = KnowledgeSyncSpecialist.pushSheetToGitHub();
    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', { action: 'backup_knowledge', result: result });
  },

  _handleRestoreKnowledge(chatId, text) {
    var result = KnowledgeSyncSpecialist.bootstrap();
    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', { action: 'restore_knowledge', result: result });
  },

  _handleSoulInit(chatId, text) {
    var result = SoulSpecialist.initializeSelf();
    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', { action: 'soul_initialization', result: result });
  },

  _handleSoulQuery(chatId, text, intent) {
    var soulContext = SoulSpecialist.getFullContext();
    return this._askLLMWithKnowledge(chatId, text, 'soul', 'response', { action: 'soul_query', soul_context: soulContext });
  },

  _handleSoulMemoryQuery(chatId, text, intent) {
    var episodes = SoulMemory.getRecentEpisodes(20);
    return this._askLLMWithKnowledge(chatId, text, 'soul', 'response', { action: 'memory_query', episodes: episodes });
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
    if (!result.success) return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'error', result);
    return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'response', result);
  },

  _handleUpdateDocs(chatId, text, intent) {
    var instruksi = (intent.update_docs && intent.update_docs.instruksi) || text;
    var result = SelfHealingSpecialist.updateDocumentation(instruksi);
    if (!result.success) return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'error', result);
    return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'doc_update_response', result);
  },

  _handleAuditCode(chatId, text, intent) {
    var scope = (intent.audit_code && intent.audit_code.scope) || 'full';
    var result = CodeAuditor.runAudit(scope);
    if (!result.success) return this._askLLMWithKnowledge(chatId, text, 'audit', 'error', result);
    return this._askLLMWithKnowledge(chatId, text, 'audit', 'report_response', result);
  },

  _handleFixAudit(chatId, text, intent) {
    var scope = (intent.fix_audit && intent.fix_audit.scope) || 'all';
    var result = CodeAuditor.fixIssues(scope);
    if (!result.success) return this._askLLMWithKnowledge(chatId, text, 'audit', 'error', result);
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
    if (action === 'build') result = ProjectBrain.buildRoadmapFromDiscussion(question);
    else if (action === 'check_alignment' || action === 'adapt') result = ProjectBrain.adaptRoadmapForNewIdea(question);
    else if (action === 'sync') result = ProjectBrain.syncRoadmapWithCode();
    else {
      var answer = ProjectBrain.answerQuestion(question);
      if (answer) {
        ChatHistoryRepository.save(chatId, 'user', text);
        ChatHistoryRepository.save(chatId, 'ai', answer);
        return answer;
      }
      result = { success: false, code: 'QUERY_FAILED' };
    }
    if (result && !result.success) return this._askLLMWithKnowledge(chatId, text, 'roadmap', 'error', result);
    return this._askLLMWithKnowledge(chatId, text, 'roadmap', 'response', result);
  },

  _handleImplementFeature(chatId, text, intent) {
    var idea = (intent.implement_feature && intent.implement_feature.idea) || text;
    var isConfirmImplement = text.toLowerCase().indexOf('implement') >= 0 || text.toLowerCase().indexOf('terapkan') >= 0;
    var result;
    if (isConfirmImplement) {
      result = FeatureArchitect.implementBlueprint(idea);
      if (!result.success) return this._askLLMWithKnowledge(chatId, text, 'feature', 'error', result);
      return this._askLLMWithKnowledge(chatId, text, 'feature', 'implement_response', result);
    }
    result = FeatureArchitect.generateBlueprint(idea);
    if (!result.success) return this._askLLMWithKnowledge(chatId, text, 'feature', 'error', result);
    return this._askLLMWithKnowledge(chatId, text, 'feature', 'blueprint_response', result);
  },

  _handleSelfQuery(chatId, text, intent) {
    var focus = (intent.self_query && intent.self_query.focus) || 'all';
    var result = SelfAwareness.review(focus);
    return this._askLLMWithKnowledge(chatId, text, 'selfaware', 'review_response', result);
  },

  _handleChatBiasa(chatId, text, intent, riwayat) {
    var finalText;
    if (ChatSpecialist.needsWebSearch(intent)) finalText = this._handleChatWithWebSearch(text, intent, riwayat);
    else if (intent.complexity === 'heavy') finalText = this._handleHeavyChat(text, intent, riwayat);
    else if (intent.jawabanChat && intent.jawabanChat.trim().length > 0) finalText = intent.jawabanChat;
    else finalText = this._handleIntentFailure(chatId, text, riwayat);

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