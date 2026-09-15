/**
 * SPECIALIST: MEMORY (STM + LTM)
 * Tanggung jawab: mengelola ingatan jangka pendek dan panjang.
 * - STM: pesan mentah terakhir (sudah ada di Chat_History)
 * - LTM: ringkasan harian yang di-generate oleh LLM
 */
var MemorySpecialist = {

  /**
   * Ambil ringkasan LTM untuk dimasukkan ke prompt.
   * @param {number} maxDays - jumlah hari terakhir
   * @returns {array} Array of string
   */
  getLongTermMemory: function(maxDays) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Memory_Summaries');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      var summaries = [];
      var limit = Math.min(maxDays || 7, data.length - 1);

      // Ambil N baris terakhir (paling baru)
      for (var i = data.length - 1; i >= data.length - limit; i--) {
        if (i < 1) break;
        var date = data[i][1];
        var summary = data[i][2];
        var topics = data[i][3];
        if (summary) {
          var dateStr = date instanceof Date
            ? DateTimeUtils.formatTanggal(date)
            : String(date);
          summaries.push('[' + dateStr + '] ' + summary +
            (topics ? ' (topik: ' + topics + ')' : ''));
        }
      }

      return summaries;
    } catch (e) {
      AppLogger.error('LTM_READ_FAIL', e.message);
      return [];
    }
  },

  /**
   * Ringkas percakapan hari ini dan simpan ke LTM.
   * Dipanggil oleh trigger nightly.
   */
  summarizeToday: function() {
    AppLogger.info('LTM_SUMMARIZE_START', 'Memulai ringkasan harian');

    // Ambil semua chat hari ini
    var todayChats = this._getTodayChats();

    if (todayChats.length < 4) {
      AppLogger.info('LTM_SUMMARIZE_SKIP',
        'Terlalu sedikit chat hari ini (' + todayChats.length + '). Skip.');
      return;
    }

    // Cek apakah sudah ada ringkasan untuk hari ini
    if (this._hasSummaryForToday()) {
      AppLogger.info('LTM_SUMMARIZE_SKIP', 'Ringkasan hari ini sudah ada.');
      return;
    }

    // Minta LLM ringkas
    var chatText = todayChats.map(function(c) {
      return (c.role === 'ai' ? 'AI' : 'User') + ': ' + c.text;
    }).join('\n');

    var prompt =
      'Ringkas percakapan berikut menjadi 3-5 kalimat singkat.\n' +
      'Fokus pada: topik utama, keputusan yang dibuat, rencana yang disebutkan, ' +
      'dan informasi penting tentang user.\n' +
      'Jangan sertakan detail teknis atau log sistem.\n\n' +
      'PERCAKAPAN:\n' + chatText + '\n\n' +
      'FORMAT OUTPUT (JSON tanpa wrapper markdown):\n' +
      '{\n' +
      '  "summary": "ringkasan 3-5 kalimat",\n' +
      '  "topics": "topik1, topik2, topik3"\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.3, 'fast');

    if (!llmResult || !llmResult.text) {
      AppLogger.error('LTM_SUMMARIZE_LLM_FAIL', 'LLM gagal merespons');
      return;
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '')
                                  .replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      this._saveSummary(result.summary, result.topics, todayChats.length);
      AppLogger.info('LTM_SUMMARIZE_DONE',
        'Ringkasan tersimpan (' + todayChats.length + ' pesan)');

    } catch (e) {
      AppLogger.error('LTM_SUMMARIZE_PARSE_FAIL', e.message);
    }
  },

  /**
   * Ambil semua chat hari ini dari Chat_History.
   */
  _getTodayChats: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Chat_History');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      var today = DateTimeUtils.formatTanggal(DateTimeUtils.nowWIB());
      var chats = [];

      for (var i = 1; i < data.length; i++) {
        var timestamp = data[i][1];
        var chatDate = '';

        if (timestamp instanceof Date) {
          chatDate = DateTimeUtils.formatTanggal(timestamp);
        } else {
          chatDate = String(timestamp).substring(0, 10);
        }

        if (chatDate === today) {
          chats.push({
            role: data[i][3],
            text: String(data[i][4] || '').substring(0, 500)
          });
        }
      }

      return chats;
    } catch (e) {
      AppLogger.error('LTM_TODAY_CHAT_FAIL', e.message);
      return [];
    }
  },

  /**
   * Cek apakah sudah ada ringkasan untuk hari ini.
   */
  _hasSummaryForToday: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Memory_Summaries');
      var data = sheet.getDataRange().getValues();
      var today = DateTimeUtils.formatTanggal(DateTimeUtils.nowWIB());

      for (var i = 1; i < data.length; i++) {
        var date = data[i][1];
        var dateStr = date instanceof Date
          ? DateTimeUtils.formatTanggal(date)
          : String(date);
        if (dateStr === today) return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Simpan ringkasan ke sheet.
   */
  _saveSummary: function(summary, topics, messageCount) {
    try {
      var id = IdGenerator.generate('MEM');
      var today = DateTimeUtils.formatTanggal(DateTimeUtils.nowWIB());
      SpreadsheetGateway.appendRowSafe('Memory_Summaries', [
        id, today, summary, topics || '', messageCount || 0
      ]);
    } catch (e) {
      AppLogger.error('LTM_SAVE_FAIL', e.message);
    }
  }
};