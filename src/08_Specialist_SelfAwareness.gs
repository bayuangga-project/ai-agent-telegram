/**
 * ===================================================================
 * SPESIALIS: SELF-AWARENESS (PURE METRICS GATHERING)
 * Tanggung jawab: Mengumpulkan data kondisi internal sistem secara mekanis.
 * tidak melakukan pemformatan teks atau interaksi bahasa manusia.
 * ===================================================================
 */
const SelfAwareness = {

  review(focus) {
    var reviewFocus = focus || 'all';
    AppLogger.info('SELF_AWARENESS_REVIEW', 'focus:' + reviewFocus);

    var metrics = this._gatherSelfData();
    return {
      focus: reviewFocus,
      timestamp: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB()),
      system_metrics: metrics
    };
  },

  _gatherSelfData() {
    var data = {
      fileList: [],
      sheetList: [],
      intentList: [
        'ack_reminder', 'buat_reminder', 'chat_biasa', 'catat_keuangan',
        'tanya_saldo', 'ringkasan_keuangan', 'atur_budget', 'edit_transaksi',
        'sync_documentation', 'diagnose_error', 'update_docs', 'audit_code',
        'fix_audit', 'check_changes', 'roadmap_query', 'implement_feature',
        'self_query', 'soul_query', 'soul_init', 'soul_memory_query'
      ],
      commandList: ['/ingat', '/diagnose', '/logs', '/patch', '/build', '/soul', '/init-soul', '/memory', '/sync'],
      errorLogs: [],
      logStats: { total: 0, errors: 0, errorRatePercent: 0 },
      userKnowledge: { facts: [], profile: [] },
      roadmapItems: [],
      previousReview: null
    };

    // 1. Ambil daftar file dari GitHub
    try {
      var files = GitHubOpsService.listDirectory('src');
      if (Array.isArray(files)) {
        data.fileList = files.map(function(f) { return f.name || f.path || ''; });
      }
    } catch (e) {}

    // 2. Ambil daftar Sheet
    try {
      var ss = SpreadsheetGateway.getSpreadsheet();
      data.sheetList = ss.getSheets().map(function(s) { return s.getName(); });
    } catch (e) {}

    // 3. Ambil log error terakhir (10 log)
    try {
      var sheet = SpreadsheetGateway.getSheet('Log_System');
      var logData = sheet.getDataRange().getValues();
      if (logData.length > 1) {
        var errors = [];
        var totalLogs = logData.length - 1;
        var errCount = 0;

        for (var i = logData.length - 1; i >= 1; i--) {
          var event = String(logData[i][1]).toUpperCase();
          var status = String(logData[i][3]).toUpperCase();
          var isError = event.indexOf('FAIL') !== -1 || event.indexOf('ERROR') !== -1 || status === 'ERROR';

          if (isError) {
            errCount++;
            if (errors.length < 10) {
              errors.push({
                timestamp: logData[i][0],
                event: logData[i][1],
                detail: String(logData[i][2]).substring(0, 100)
              });
            }
          }
        }
        data.errorLogs = errors;
        data.logStats = {
          total: totalLogs,
          errors: errCount,
          errorRatePercent: totalLogs > 0 ? Math.round((errCount / totalLogs) * 100) : 0
        };
      }
    } catch (e) {}

    // 4. Ambil data user
    try {
      data.userKnowledge.facts = KnowledgeSpecialist.getActiveFactsForPrompt(10) || [];
      data.userKnowledge.profile = UserProfileSpecialist.getProfileForPrompt(10) || [];
    } catch (e) {}

    // 5. Ambil data roadmap
    try {
      var rSheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var rData = rSheet.getDataRange().getValues();
      if (rData.length > 1) {
        var items = [];
        for (var k = 1; k < rData.length; k++) {
          if (rData[k][1]) {
            items.push({
              feature: rData[k][1],
              status: rData[k][4] || 'planned'
            });
          }
        }
        data.roadmapItems = items;
      }
    } catch (e) {}

    // 6. Ambil review sebelumnya
    try {
      var sSheet = SpreadsheetGateway.getSheet('Self_Reviews');
      var sData = sSheet.getDataRange().getValues();
      if (sData.length > 1) {
        var last = sData[sData.length - 1];
        data.previousReview = {
          id: last[0],
          timestamp: last[1],
          score: last[2],
          canDo: last[3],
          cannotDo: last[4]
        };
      }
    } catch (e) {}

    return data;
  }
};