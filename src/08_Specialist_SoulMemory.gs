const SoulMemory = {
  EPISODIC_SHEET: 'Soul_Episodic_Memory',
  META_SHEET: 'Soul_Meta_Memory',
  EPISODIC_HEADERS: ['id', 'timestamp', 'event_type', 'context', 'outcome', 'emotional_state', 'details'],
  META_HEADERS: ['id', 'timestamp', 'insight', 'source', 'confidence', 'applied'],

  _ensureSheets() {
    SpreadsheetGateway.ensureSheet(this.EPISODIC_SHEET, this.EPISODIC_HEADERS);
    SpreadsheetGateway.ensureSheet(this.META_SHEET, this.META_HEADERS);
  },

  recordEpisode(eventType, context, outcome, emotionalState, details) {
    try {
      this._ensureSheets();
      var id = IdGenerator.generate('EP');
      var now = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
      SpreadsheetGateway.appendRowSafe(this.EPISODIC_SHEET, [
        id,
        now,
        eventType || 'unknown',
        context || '',
        outcome || '',
        emotionalState || '',
        details || ''
      ]);
    } catch (e) {
      AppLogger.warning('SOUL_EPISODE_RECORD_FAIL', e.message);
    }
  },

  getRecentEpisodes(limit) {
    try {
      this._ensureSheets();
      var sheet = SpreadsheetGateway.getSheet(this.EPISODIC_SHEET);
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];
      var rows = data.slice(1);
      var start = Math.max(0, rows.length - (limit || 20));
      return rows.slice(start).map(function(r) {
        return {
          id: r[0],
          timestamp: r[1],
          event_type: r[2],
          context: r[3],
          outcome: r[4],
          emotional_state: r[5],
          details: r[6]
        };
      });
    } catch (e) {
      AppLogger.warning('SOUL_EPISODE_READ_FAIL', e.message);
      return [];
    }
  },

  getEpisodesByType(eventType, limit) {
    var all = this.getRecentEpisodes(200);
    var filtered = all.filter(function(ep) {
      return ep.event_type === eventType;
    });
    return filtered.slice(-(limit || 10));
  },

  addMetaInsight(insight, source, confidence) {
    try {
      this._ensureSheets();
      var id = IdGenerator.generate('MI');
      var now = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
      SpreadsheetGateway.appendRowSafe(this.META_SHEET, [
        id,
        now,
        insight,
        source || '',
        confidence || 0.5,
        false
      ]);
    } catch (e) {
      AppLogger.warning('SOUL_META_RECORD_FAIL', e.message);
    }
  },

  getMetaInsights(limit) {
    try {
      this._ensureSheets();
      var sheet = SpreadsheetGateway.getSheet(this.META_SHEET);
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];
      var rows = data.slice(1);
      var start = Math.max(0, rows.length - (limit || 20));
      return rows.slice(start).map(function(r) {
        return {
          id: r[0],
          timestamp: r[1],
          insight: r[2],
          source: r[3],
          confidence: r[4],
          applied: r[5]
        };
      });
    } catch (e) {
      AppLogger.warning('SOUL_META_READ_FAIL', e.message);
      return [];
    }
  }
};