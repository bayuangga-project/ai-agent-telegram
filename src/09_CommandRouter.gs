/**
 * ===================================================================
 * COMMAND ROUTER (WITH BOT USERNAME SANITIZER & MULTI-SPACE CLEANER)
 * Tanggung jawab: Menangani perintah eksplisit Telegram (/command).
 * Membuang suffix @botusername otomatis dan menormalisasi spasi.
 * ===================================================================
 */
const CommandRouter = {
  
  /**
   * Sanitasi Perintah: Membuang spasi awal & suffix @botusername dari Telegram
   */
  _cleanCommand(text) {
    if (!text) return '';
    var trimmed = text.trim();
    if (trimmed.charAt(0) !== '/') return '';
    
    // Split berdasarkan spasi pertama
    var firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    // Buang suffix @botusername jika ada (misal: /llm@dyarassistant_bot -> /llm)
    return firstWord.split('@')[0];
  },

  isKnownCommand(text) {
    var cmd = this._cleanCommand(text);
    if (!cmd) return false;
    var knownList = ['/ingat', '/diagnose', '/logs', '/patch', '/build', '/soul', '/init-soul', '/memory', '/export_ns', '/help', '/bantuan', '/llm'];
    return knownList.indexOf(cmd) !== -1;
  },

  handle(chatId, text) {
    if (!text) return 'Pesan kosong.';
    
    // Normalisasi spasi & pisahkan perintah dari argumen
    var cleanedText = text.trim();
    var parts = cleanedText.split(/\s+/);
    var rawCmd = parts[0].toLowerCase();
    var cmd = rawCmd.split('@')[0]; // Sanitasi suffix @botusername
    
    var args = parts.slice(1).join(' ').trim();
    
    AppLogger.info('COMMAND_ROUTER', 'cmd:' + cmd + '|args:' + args);

    if (cmd === '/llm') {
      return LLMIntelligence.handleCommand(parts[1] ? parts[1].toLowerCase() : 'list', parts[2], parts[3]);
    }

    if (cmd === '/ingat') {
      return this._handleIngat(chatId, args);
    }
    
    if (cmd === '/export_ns') {
      return KnowledgeSyncSpecialist.handleCommand(parts[1] ? parts[1].toLowerCase() : 'list', parts[2], parts[3]);
    }
    
    if (cmd === '/help' || cmd === '/bantuan') {
      return this._handleHelp();
    }

    if (cmd === '/diagnose') {
      var result = SelfHealingSpecialist.diagnose(args || 'Cek error log terbaru');
      return result.success ? result.diagnosis : 'Gagal mendiagnosis: ' + result.code;
    }

    if (cmd === '/logs') {
      var logs = SelfHealingSpecialist._getRecentLogs(10);
      return '📝 *10 Log Terakhir:*\n\n' + logs.map(function(l) { return '[' + l.timestamp + '] ' + l.event; }).join('\n');
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
      'Berikut daftar perintah yang bisa lo pakai secara langsung:\n\n' +
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