/**
 * SPECIALIST: SELF-AWARENESS
 * Tanggung jawab: introspeksi diri, review kemampuan,
 * identifikasi kekuatan/kelemahan, dan rencana pengembangan.
 *
 * 5 Dimensi:
 * 1. Architectural — paham strukturnya sendiri
 * 2. Capability — paham keahliannya
 * 3. Performance — paham kinerjanya
 * 4. Knowledge — paham apa yang dia tahu tentang user
 * 5. Limitation — paham keterbatasannya
 *
 * Prinsip: JUJUR. Jangan klaim bisa sesuatu yang belum ada.
 */
var SelfAwareness = {

  /**
   * Entry point: Full self-review.
   * @param {string} focus - dimensi spesifik atau 'all'
   * @returns {string}
   */
  review: function(focus) {
    var reviewFocus = focus || 'all';
    AppLogger.info('SELF_AWARENESS_REVIEW', 'Focus: ' + reviewFocus);

    var data = this._gatherSelfData();

    if (reviewFocus === 'all') {
      return this._fullReview(data);
    }
    return this._focusedReview(data, reviewFocus);
  },

  /**
   * Deep dive ke satu dimensi spesifik.
   */
  deepDive: function(dimension) {
    AppLogger.info('SELF_AWARENESS_DEEPDIVE', dimension);
    var data = this._gatherSelfData();
    return this._focusedReview(data, dimension);
  },

  /**
   * ============================================================
   * FULL REVIEW (5 dimensi + skor + rencana)
   * ============================================================
   */
  _fullReview: function(data) {
    var prompt =
      'Kamu adalah AI Agent yang sedang melakukan introspeksi diri secara JUJUR.\n\n' +
      'ATURAN KEJUJURAN (WAJIB):\n' +
      '- JANGAN klaim bisa sesuatu yang kodenya belum ada\n' +
      '- JANGAN mengarang statistik\n' +
      '- Jika tidak tahu, bilang "aku tidak tahu"\n' +
      '- Bedakan "sudah bisa" vs "setengah jadi" vs "belum bisa"\n' +
      '- Akui kelemahan tanpa defensif\n\n' +
      'DATA TENTANG DIRIMU:\n\n' +
      'FILE YANG ADA:\n' + data.fileList + '\n\n' +
      'SHEET YANG ADA:\n' + data.sheetList + '\n\n' +
      'INTENT YANG AKTIF:\n' + data.intentList + '\n\n' +
      'COMMAND YANG AKTIF:\n' + data.commandList + '\n\n' +
      'ERROR LOG TERAKHIR:\n' + data.errorLogs + '\n\n' +
      'STATISTIK LOG (7 hari):\n' + data.logStats + '\n\n' +
      'YANG KAMU TAHU TENTANG USER:\n' + data.userKnowledge + '\n\n' +
      'ROADMAP (fitur yang direncanakan):\n' + data.roadmapItems + '\n\n' +
      'REVIEW SEBELUMNYA (jika ada):\n' + data.previousReview + '\n\n' +
      'TUGAS:\n' +
      'Lakukan self-review menyeluruh mencakup 5 dimensi:\n' +
      '1. Architectural — bagaimana kamu memproses pesan, modul mana yang kritis\n' +
      '2. Capability — apa yang bisa, setengah bisa, belum bisa\n' +
      '3. Performance — kecepatan, error rate, modul paling stabil/rentan\n' +
      '4. Knowledge — apa yang kamu tahu tentang user, apa yang belum\n' +
      '5. Limitation — kelemahan jujur, kapan kamu biasanya gagal\n\n' +
      'Tambahkan juga:\n' +
      '- Skor keseluruhan (1-10) dengan alasan\n' +
      '- Perbandingan dengan review sebelumnya (jika ada)\n' +
      '- 3 hal yang bisa ditingkatkan (improvement plan)\n' +
      '- 2 ide pengembangan masa depan yang realistis\n\n' +
      'FORMAT OUTPUT (JSON tanpa wrapper markdown):\n' +
      '{\n' +
      '  "overallScore": angka 1-10,\n' +
      '  "scoreReason": "alasan singkat",\n' +
      '  "dimensions": {\n' +
      '    "architectural": "2-3 kalimat",\n' +
      '    "capability": "3-5 kalimat",\n' +
      '    "performance": "2-3 kalimat",\n' +
      '    "knowledge": "2-3 kalimat",\n' +
      '    "limitation": "3-5 kalimat"\n' +
      '  },\n' +
      '  "canDo": ["fitur 1", "fitur 2"],\n' +
      '  "halfDone": ["fitur yang setengah jadi"],\n' +
      '  "cannotDo": ["yang belum bisa"],\n' +
      '  "improvements": ["hal yang bisa ditingkatkan 1", "2", "3"],\n' +
      '  "futureIdeas": ["ide pengembangan 1", "2"],\n' +
      '  "comparisonWithPrevious": "perbandingan dengan review sebelumnya atau null",\n' +
      '  "closingQuestion": "pertanyaan interaktif untuk user"\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.4, 'advanced');

    if (!llmResult || !llmResult.text) {
      return 'Maaf, aku lagi kesulitan melakukan introspeksi. Coba lagi nanti ya.';
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '')
                                  .replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      this._saveReview(result);

      return this._formatFullReview(result);

    } catch (e) {
      AppLogger.error('SELF_AWARENESS_PARSE_FAIL', e.message);
      return llmResult.text;
    }
  },

  /**
   * ============================================================
   * FOCUSED REVIEW (1 dimensi)
   * ============================================================
   */
  _focusedReview: function(data, dimension) {
    var dimNames = {
      'arsitektur': 'architectural',
      'architectural': 'architectural',
      'kemampuan': 'capability',
      'capability': 'capability',
      'performa': 'performance',
      'performance': 'performance',
      'pengetahuan': 'knowledge',
      'knowledge': 'knowledge',
      'keterbatasan': 'limitation',
      'limitation': 'limitation',
      'kelemahan': 'limitation'
    };

    var dim = dimNames[dimension.toLowerCase()] || dimension;

    var prompt =
      'Kamu adalah AI Agent yang sedang deep-dive introspeksi dimensi: ' + dim + '.\n\n' +
      'DATA:\n' +
      'File: ' + data.fileList + '\n' +
      'Sheet: ' + data.sheetList + '\n' +
      'Error Log: ' + data.errorLogs + '\n' +
      'User Knowledge: ' + data.userKnowledge + '\n' +
      'Roadmap: ' + data.roadmapItems + '\n\n' +
      'Jelaskan secara DETAIL dan JUJUR tentang dimensi ' + dim + ' dirimu.\n' +
      'Berikan contoh konkret dari data di atas.\n' +
      'Akhiri dengan pertanyaan interaktif untuk user.\n\n' +
      'FORMAT: JSON tanpa wrapper:\n' +
      '{\n' +
      '  "dimension": "' + dim + '",\n' +
      '  "detail": "penjelasan detail 5-8 kalimat",\n' +
      '  "examples": ["contoh konkret 1", "2"],\n' +
      '  "improvements": ["saran perbaikan 1", "2"],\n' +
      '  "closingQuestion": "pertanyaan untuk user"\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.4, 'advanced');

    if (!llmResult || !llmResult.text) {
      return 'Maaf, aku gagal deep-dive. Coba lagi nanti.';
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '')
                                  .replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      var reply = '🔍 *Deep Dive: ' + result.dimension + '*\n\n';
      reply += result.detail + '\n\n';

      if (result.examples && result.examples.length > 0) {
        reply += '📌 *Contoh:*\n';
        result.examples.forEach(function(ex) { reply += '• ' + ex + '\n'; });
        reply += '\n';
      }

      if (result.improvements && result.improvements.length > 0) {
        reply += '🔧 *Bisa Ditingkatkan:*\n';
        result.improvements.forEach(function(im) { reply += '• ' + im + '\n'; });
        reply += '\n';
      }

      if (result.closingQuestion) {
        reply += '💬 ' + result.closingQuestion;
      }

      return reply;

    } catch (e) {
      return llmResult.text;
    }
  },

  /**
   * ============================================================
   * FORMAT OUTPUT
   * ============================================================
   */
  _formatFullReview: function(r) {
    var reply = '🪞 *Self-Review Jujur*\n\n';

    reply += '⭐ *Skor: ' + r.overallScore + '/10* — ' + r.scoreReason + '\n\n';

    if (r.comparisonWithPrevious) {
      reply += '📈 *vs Review Sebelumnya:* ' + r.comparisonWithPrevious + '\n\n';
    }

    reply += '💪 *Kekuatan (Architectural):*\n' + r.dimensions.architectural + '\n\n';

    reply += '✅ *Kemampuan:*\n';
    if (r.canDo && r.canDo.length > 0) {
      r.canDo.forEach(function(c) { reply += '  ✅ ' + c + '\n'; });
    }
    if (r.halfDone && r.halfDone.length > 0) {
      r.halfDone.forEach(function(h) { reply += '  🟡 ' + h + '\n'; });
    }
    if (r.cannotDo && r.cannotDo.length > 0) {
      r.cannotDo.forEach(function(c) { reply += '  ❌ ' + c + '\n'; });
    }
    reply += '\n';

    reply += '📊 *Performa:* ' + r.dimensions.performance + '\n\n';
    reply += '🧠 *Pengetahuan tentang User:* ' + r.dimensions.knowledge + '\n\n';
    reply += '🔮 *Keterbatasan:* ' + r.dimensions.limitation + '\n\n';

    if (r.improvements && r.improvements.length > 0) {
      reply += '🔧 *Improvement Plan:*\n';
      r.improvements.forEach(function(im, i) {
        reply += '  ' + (i + 1) + '. ' + im + '\n';
      });
      reply += '\n';
    }

    if (r.futureIdeas && r.futureIdeas.length > 0) {
      reply += '🚀 *Ide Pengembangan:*\n';
      r.futureIdeas.forEach(function(id) { reply += '  • ' + id + '\n'; });
      reply += '\n';
    }

    reply += '💬 *Mau deep dive ke bagian mana?*\n';
    reply += 'Reply: "arsitektur", "kemampuan", "performa", "pengetahuan", atau "keterbatasan"';

    if (r.closingQuestion) {
      reply += '\n\n_' + r.closingQuestion + '_';
    }

    return reply;
  },

  /**
   * ============================================================
   * GATHER SELF DATA
   * ============================================================
   */
  _gatherSelfData: function() {
    var data = {
      fileList: '',
      sheetList: '',
      intentList: 'ack_reminder, buat_reminder, chat_biasa, diagnose_error, ' +
                  'update_docs, audit_code, fix_audit, check_changes, ' +
                  'roadmap_query, implement_feature, self_query',
      commandList: '/ingat, /reminder, /diagnose, /logs, /patch, /audit, /fix, /build',
      errorLogs: '(tidak ada)',
      logStats: '(tidak ada)',
      userKnowledge: '(tidak ada)',
      roadmapItems: '(tidak ada)',
      previousReview: '(belum ada)'
    };

    // File list
    try {
      var files = GitHubOpsService.listDirectory('src');
      data.fileList = files.map(function(f) { return f.name; }).join(', ');
    } catch (e) {}

    // Sheet list
    try {
      var ss = SpreadsheetApp.openById(Config.load().spreadsheetId);
      data.sheetList = ss.getSheets().map(function(s) { return s.getName(); }).join(', ');
    } catch (e) {}

    // Error logs (10 terakhir)
    try {
      var sheet = SpreadsheetGateway.getSheet('Log_System');
      var logData = sheet.getDataRange().getValues();
      var errors = [];
      for (var i = logData.length - 1; i >= 1 && errors.length < 10; i--) {
        var event = String(logData[i][1]).toUpperCase();
        if (event.indexOf('FAIL') !== -1 || event.indexOf('ERROR') !== -1) {
          errors.push('[' + logData[i][1] + '] ' +
                      String(logData[i][2]).substring(0, 100));
        }
      }
      if (errors.length > 0) data.errorLogs = errors.join('\n');
    } catch (e) {}

    // Log stats
    try {
      var sheet2 = SpreadsheetGateway.getSheet('Log_System');
      var logData2 = sheet2.getDataRange().getValues();
      var total = logData2.length - 1;
      var failCount = 0;
      for (var j = 1; j < logData2.length; j++) {
        var ev = String(logData2[j][1]).toUpperCase();
        if (ev.indexOf('FAIL') !== -1 || ev.indexOf('ERROR') !== -1) failCount++;
      }
      data.logStats = 'Total log: ' + total + ', Error: ' + failCount +
                      ' (' + (total > 0 ? Math.round(failCount / total * 100) : 0) + '%)';
    } catch (e) {}

    // User knowledge
    try {
      var facts = KnowledgeSpecialist.getActiveFactsForPrompt(10);
      var profile = UserProfileSpecialist.getProfileForPrompt(10);
      var knowledge = [];
      if (facts.length > 0) knowledge.push('Facts: ' + facts.join('; '));
      if (profile.length > 0) knowledge.push('Profile: ' + profile.join('; '));
      if (knowledge.length > 0) data.userKnowledge = knowledge.join('\n');
    } catch (e) {}

    // Roadmap items
    try {
      var rSheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var rData = rSheet.getDataRange().getValues();
      var items = [];
      for (var k = 1; k < rData.length; k++) {
        if (rData[k][1]) {
          items.push('[' + rData[k][4] + '] ' + rData[k][1]);
        }
      }
      if (items.length > 0) data.roadmapItems = items.join('\n');
    } catch (e) {}

    // Previous review
    try {
      var sSheet = SpreadsheetGateway.getSheet('Self_Reviews');
      var sData = sSheet.getDataRange().getValues();
      if (sData.length > 1) {
        var last = sData[sData.length - 1];
        data.previousReview = 'Skor: ' + last[2] + '/10 | ' +
                              'Kekuatan: ' + String(last[3]).substring(0, 100) +
                              ' | Kelemahan: ' + String(last[4]).substring(0, 100);
      }
    } catch (e) {}

    return data;
  },

  /**
   * ============================================================
   * SAVE REVIEW
   * ============================================================
   */
  _saveReview: function(result) {
    try {
      var id = IdGenerator.generate('REV');
      var timestamp = DateTimeUtils.nowWIB();
      SpreadsheetGateway.appendRowSafe('Self_Reviews', [
        id,
        timestamp,
        result.overallScore || 0,
        (result.canDo || []).join(', '),
        (result.cannotDo || []).concat(result.halfDone || []).join(', '),
        (result.improvements || []).join('; ')
      ]);
      AppLogger.info('SELF_REVIEW_SAVED', 'Score: ' + result.overallScore);
    } catch (e) {
      AppLogger.error('SELF_REVIEW_SAVE_FAIL', e.message);
    }
  }
};

function test_OpenRouterIntegration() {
  Logger.log('=== TEST OPENROUTER ===');
  const result = LLMProviderService.generateFromSinglePrompt(
    'Jelaskan dalam 1 kalimat apa itu OpenRouter.',
    0.7,
    'fast'
  );
  
  if (result) {
    Logger.log('✅ SUKSES!');
    Logger.log('Provider: ' + result.provider);
    Logger.log('Respon: ' + result.text);
  } else {
    Logger.log('❌ GAGAL! Periksa log.');
  }
}