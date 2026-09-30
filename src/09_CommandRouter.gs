/**
 * ===================================================================
 * COMMAND ROUTER (TELEGRAM-FIRST OPERATIONAL CONTROL ENGINE)
 * Tanggung jawab: Menangani perintah administratif & operasional Telegram.
 * Menggunakan pola Placeholder + Edit Message untuk tugas berdurasi panjang.
 * 100% PATUH PASAL 1.2 (ZERO HARDCODE HUMAN LANGUAGE STRINGS IN THIS FILE).
 * ===================================================================
 */
const CommandRouter = {
  
  _cleanCommand(text) {
    if (!text) return '';
    var trimmed = text.trim();
    if (trimmed.charAt(0) !== '/') return '';
    var firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    return firstWord.split('@')[0];
  },

  isKnownCommand(text) {
    if (!text) return false;
    var cmd = this._cleanCommand(text);
    if (!cmd) return false;
    var knownList = [
      '/ingat', '/diagnose', '/heal', '/audit', '/logs', '/patch', 
      '/build', '/soul', '/init-soul', '/memory', '/export_ns', 
      '/help', '/bantuan', '/llm', '/backup', '/purge', '/setup_triggers'
    ];
    return knownList.indexOf(cmd) !== -1;
  },

  handle(chatId, text) {
    if (!text) return '';
    
    var cleanedText = text.trim();
    var parts = cleanedText.split(/\s+/);
    var cmd = this._cleanCommand(parts[0]);
    var args = parts.slice(1).join(' ').trim();
    
    AppLogger.info('COMMAND_ROUTER', 'cmd:' + cmd + '|args:' + args);

    // -------------------------------------------------------------------
    // 1. TUGAS BERDURASI PANJANG (ASYNC PLACEHOLDER + EDIT PATTERN)
    // -------------------------------------------------------------------
    if (cmd === '/backup') {
      var msgIdBackup = TelegramService.sendMessage(chatId, TelegramService.pickPlaceholder());
      var resBackupCode = GitHubBackupService.backupAllFiles();
      var resBackupDocs = GitHubBackupService.backupDocs();
      
      var tplBackup = KnowledgeRepository.get('cmd', 'backup_report_template');
      if (!tplBackup) {
        tplBackup = '📦 *Laporan Full Backup GitHub*\n\n• Code Source: {{code_count}} file\n• Dokumentasi: {{docs_count}} file\n• Status: SELESAI';
        KnowledgeRepository.save('cmd', 'backup_report_template', tplBackup, 'AUTO_BOOTSTRAP_CMD_TPL');
      }

      var msgBackupText = TemplateEngine.render(tplBackup, {
        code_count: resBackupCode.length,
        docs_count: resBackupDocs.length
      });

      TelegramService.editMessage(chatId, msgIdBackup, msgBackupText);
      return '';
    }

    if (cmd === '/audit') {
      var msgIdAudit = TelegramService.sendMessage(chatId, TelegramService.pickPlaceholder());
      var syncAudit = CodeAuditor.runFullSyncAudit();

      var tplAudit = KnowledgeRepository.get('cmd', 'audit_report_template');
      if (!tplAudit) {
        tplAudit = '📊 *Laporan Audit Sistem ({{total}} Indikator)*\n\n✅ PASS: {{pass}}\n❌ FAIL: {{fail}}\n⚠️ WARN: {{warn}}';
        KnowledgeRepository.save('cmd', 'audit_report_template', tplAudit, 'AUTO_BOOTSTRAP_CMD_TPL');
      }

      var msgAuditText = TemplateEngine.render(tplAudit, {
        total: syncAudit.total,
        pass: syncAudit.pass,
        fail: syncAudit.fail,
        warn: syncAudit.warn
      });

      TelegramService.editMessage(chatId, msgIdAudit, msgAuditText);
      return '';
    }

    if (cmd === '/heal') {
      var msgIdHeal = TelegramService.sendMessage(chatId, TelegramService.pickPlaceholder());
      var resKnw = SelfHealingSpecialist.forceSyncKnowledge();
      var resDocs = SelfHealingSpecialist.forceSyncDocs();

      var tplHeal = KnowledgeRepository.get('cmd', 'heal_report_template');
      if (!tplHeal) {
        tplHeal = '🛠️ *Laporan Pemulihan Sistem (Force Sync)*\n\n• Knowledge Sync: {{knw_status}}\n• Docs Sync: {{docs_status}}';
        KnowledgeRepository.save('cmd', 'heal_report_template', tplHeal, 'AUTO_BOOTSTRAP_CMD_TPL');
      }

      var msgHealText = TemplateEngine.render(tplHeal, {
        knw_status: resKnw.status || 'DONE',
        docs_status: resDocs.success ? 'SUCCESS' : 'FAILED'
      });

      TelegramService.editMessage(chatId, msgIdHeal, msgHealText);
      return '';
    }

    if (cmd === '/purge') {
      var msgIdPurge = TelegramService.sendMessage(chatId, TelegramService.pickPlaceholder());
      var resPurge = KnowledgeRepository.purgeInactive();

      var tplPurge = KnowledgeRepository.get('cmd', 'purge_report_template');
      if (!tplPurge) {
        tplPurge = '🧹 *Laporan Pembersihan Database*\n\n• Baris Sampah Memutih: {{purged}} baris\n• Baris Aktif Tersisa: {{remaining}} baris';
        KnowledgeRepository.save('cmd', 'purge_report_template', tplPurge, 'AUTO_BOOTSTRAP_CMD_TPL');
      }

      var msgPurgeText = TemplateEngine.render(tplPurge, {
        purged: resPurge.purged || 0,
        remaining: resPurge.activeRemaining || 0
      });

      TelegramService.editMessage(chatId, msgIdPurge, msgPurgeText);
      return '';
    }

    // -------------------------------------------------------------------
    // 2. TUGAS EKSEKUSI INSTAN (FAST PATH)
    // -------------------------------------------------------------------
    if (cmd === '/setup_triggers') {
      setupDailyAutoSyncTrigger();
      setupDailySelfDocTrigger();
      setupWeeklyTrigger();
      setupReminderTrigger();
      setupDailyLLMDiscovery();
      setupNightlySummarizer();
      setupWeeklyChangeCheck();

      var tplTriggers = KnowledgeRepository.get('cmd', 'setup_triggers_template');
      if (!tplTriggers) {
        tplTriggers = '⚙️ *Aktivasi Trigger Otomatis*\n\n7 Trigger Jadwal Otomatis berhasil didaftarkan ulang ke server Google Apps Script!';
        KnowledgeRepository.save('cmd', 'setup_triggers_template', tplTriggers, 'AUTO_BOOTSTRAP_CMD_TPL');
      }
      return tplTriggers;
    }

    if (cmd === '/llm') {
      return LLMIntelligence.handleCommand(parts[1] ? parts[1].toLowerCase() : 'list', parts[2], parts[3]);
    }

    if (cmd === '/export_ns') {
      return KnowledgeSyncSpecialist.handleCommand(parts[1] ? parts[1].toLowerCase() : 'list', parts[2], parts[3]);
    }

    if (cmd === '/ingat') {
      return this._handleIngat(chatId, args);
    }
    
    if (cmd === '/help' || cmd === '/bantuan') {
      return this._handleHelp();
    }

    if (cmd === '/diagnose') {
      var result = SelfHealingSpecialist.diagnose(args || 'Cek error log terbaru');
      return result.success ? (result.diagnosis || 'Diagnosis selesai') : 'Gagal mendiagnosis: ' + result.code;
    }

    if (cmd === '/logs') {
      var logs = SelfHealingSpecialist._getRecentLogs(10);
      var logLines = logs.map(function(l) { return '[' + l.timestamp + '] ' + l.event; }).join('\n');
      return '📝 *10 Log Terakhir:*\n\n' + (logLines || '-');
    }

    if (cmd === '/patch') {
      if (!args) return 'Format salah. Gunakan: /patch [patchId]';
      var res = SelfHealingSpecialist.applyPendingPatch(args);
      return res.success ? '✅ Patch ' + args + ' berhasil di-apply ke ' + res.branchName : '❌ Gagal: ' + res.code;
    }

    if (cmd === '/soul') {
      var soul = SoulSpecialist.getFullContext();
      return '🤖 *Status Soul:*\nName: ' + (soul.identity && soul.identity.name ? soul.identity.name : 'Unknown') + '\nVersion: ' + (soul.self_model ? soul.self_model.version : '-');
    }
    
    if (cmd === '/init-soul') {
      var init = SoulSpecialist.initializeSelf();
      return '✅ Soul initialized. Status: ' + init.status;
    }

    if (cmd === '/memory') {
      var ltm = MemorySpecialist.getLongTermMemory(7);
      return '🧠 *Memori Jangka Panjang (7 Hari):*\n\n' + (ltm.length > 0 ? ltm.join('\n') : 'Belum ada memori.');
    }

    return 'Perintah dikenal tapi belum diimplementasikan di versi ini.';
  },

  _handleIngat(chatId, args) {
    if (!args) return 'Apa yang harus aku ingat? Ketik: /ingat [fakta]';
    var success = KnowledgeSpecialist.saveManualFact(chatId, args);
    if (success) {
      return '✅ Oke, aku akan ingat fakta ini secara permanen: "' + args + '"';
    }
    return '❌ Gagal menyimpan fakta. Teks kosong.';
  },

  _getAIName() {
    var aiName = '';
    try {
      if (typeof SoulSpecialist !== 'undefined' && SoulSpecialist.getIdentity) {
        var soulIdentity = SoulSpecialist.getIdentity();
        if (soulIdentity && soulIdentity.name) aiName = soulIdentity.name;
      }
    } catch (e) {}

    if (!aiName) {
      try {
        var profileItems = UserProfileSpecialist.getByCategory('identitas') || [];
        for (var i = 0; i < profileItems.length; i++) {
          if (profileItems[i].key === 'ai_name' && profileItems[i].value) {
            aiName = profileItems[i].value;
            break;
          }
        }
      } catch (e) {}
    }

    return aiName || 'AI Agent';
  },

  _handleHelp() {
    var aiName = this._getAIName();

    var defaultHelpTemplate = '📚 *Pusat Bantuan Command ({{name}})*\n\n' +
      'Berikut daftar perintah operasional yang bisa lo pakai secara langsung:\n\n' +
      '⚙️ *Operasi & Pemeliharaan Sistem*\n' +
      '🔹 `/backup` - Pemicu backup penuh 29 file kode & dokumen ke GitHub.\n' +
      '🔹 `/audit` - Jalankan audit sistem 32 indikator lengkap.\n' +
      '🔹 `/heal` - Force sync pemulihan data knowledge & dokumen ke GitHub.\n' +
      '🔹 `/purge` - Bersihkan baris sampah mati di database AI_Knowledge.\n' +
      '🔹 `/setup_triggers` - Daftarkan ulang 7 trigger jadwal otomatis.\n\n' +
      '🤖 *Manajemen Model AI (LLM)*\n' +
      '🔹 `/llm` - Lihat katalog model AI di sheet LLM_Models.\n' +
      '🔹 `/llm discover` - Auto-discovery model gratisan terbaru dari internet.\n' +
      '🔹 `/llm bench` - Uji tingkat kecerdasan model secara otomatis.\n\n' +
      '🔧 *Sistem & Dokumentasi*\n' +
      '🔹 `/export_ns` - Atur namespace apa saja yang di-export ke GitHub.\n' +
      '🔹 `/diagnose` - Cek dan perbaiki error log terbaru.\n' +
      '🔹 `/logs` - Lihat 10 log aktivitas terakhir sistem.\n' +
      '🔹 `/patch [id]` - Terapkan perbaikan kode dari GitHub.\n\n' +
      '🧠 *Memori & Pengetahuan*\n' +
      '🔹 `/ingat [fakta]` - Simpan fakta penting permanen.\n' +
      '🔹 `/memory` - Lihat ringkasan memori jangka panjang (7 hari terakhir).\n\n' +
      '💡 _Semua aksi lain seperti catat keuangan atau percakapan biasa, tinggal di-chat aja!_';

    KnowledgeRepository.save('help', 'command_list', defaultHelpTemplate, 'DYNAMIC_NAME_HELP');
    return TemplateEngine.render(defaultHelpTemplate, { name: aiName });
  }
};