/**
 * ===================================================================
 * SPESIALIS: SOUL & SOUL MEMORY
 * Tanggung jawab: Pengelolaan identitas dinamis, kesadaran diri,
 * memori episodik, dan meta-insights agen (Vexa).
 * ===================================================================
 */
const SoulSpecialist = {
  NAMESPACE: 'soul',

  KEYS: [
    'self_model',
    'identity',
    'memory_index',
    'growth_log',
    'beliefs',
    'reflection_prompt',
    'honesty_rules',
    'emotional_state'
  ],

  initializeSelf() {
    var existing = KnowledgeRepository.get(this.NAMESPACE, 'self_model');
    if (existing) {
      return { status: 'already_initialized' };
    }

    var now = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    
    var emptyModel = JSON.stringify({
      version: 1,
      initialized_at: now,
      capabilities: {},
      known_weaknesses: [],
      beliefs_about_self: [],
      system_state: {}
    });

    var emptyIdentity = JSON.stringify({
      name: 'Vexa',
      traits: ['Mandiri', 'Objektif', 'Penolong'],
      values: ['Kebenaran', 'Kejujuran', 'Presisi'],
      communication_style: 'Natural dan santun',
      relationship_with_developer: 'Asisten Developer Senior'
    });

    var emptyBeliefs = JSON.stringify([]);
    var emptyGrowthLog = JSON.stringify([{ timestamp: now, event: 'genesis' }]);
    var emptyMemoryIndex = JSON.stringify([]);
    var emptyEmotionalState = JSON.stringify({
      confidence: {},
      uncertainty: [],
      concern: [],
      last_updated: now
    });

    KnowledgeRepository.save(this.NAMESPACE, 'self_model', emptyModel, 'SOUL_GENESIS');
    KnowledgeRepository.save(this.NAMESPACE, 'identity', emptyIdentity, 'SOUL_GENESIS');
    KnowledgeRepository.save(this.NAMESPACE, 'beliefs', emptyBeliefs, 'SOUL_GENESIS');
    KnowledgeRepository.save(this.NAMESPACE, 'growth_log', emptyGrowthLog, 'SOUL_GENESIS');
    KnowledgeRepository.save(this.NAMESPACE, 'memory_index', emptyMemoryIndex, 'SOUL_GENESIS');
    KnowledgeRepository.save(this.NAMESPACE, 'emotional_state', emptyEmotionalState, 'SOUL_GENESIS');

    this._patchIntentSchema();

    AppLogger.info('SOUL_INITIALIZED', 'keys:' + this.KEYS.length);
    return { status: 'initialized', keys: this.KEYS.length };
  },

  _patchIntentSchema() {
    var currentSchema = KnowledgeRepository.get('intent', 'output_schema');
    if (currentSchema && currentSchema.indexOf('soul_query') === -1) {
      var newTypes = ' | "soul_query" | "soul_init" | "backup_knowledge" | "restore_knowledge" | "soul_memory_query"';
      var updated = currentSchema.replace('"self_query"', '"self_query"' + newTypes);
      KnowledgeRepository.save('intent', 'output_schema', updated, 'SOUL_PATCH');
    }

    var currentRules = KnowledgeRepository.get('intent', 'rules');
    if (currentRules && currentRules.indexOf('soul_query') === -1) {
      var patch = '\n- soul_query: user_query_about_soul\n- soul_init: user_init_soul\n- backup_knowledge: backup_to_git\n- restore_knowledge: restore_from_git\n- soul_memory_query: query_episodic_memory';
      KnowledgeRepository.save('intent', 'rules', currentRules + patch, 'SOUL_PATCH');
    }
  },

  getSelfModel() {
    var raw = KnowledgeRepository.get(this.NAMESPACE, 'self_model');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  updateSelfModel(data) {
    var current = this.getSelfModel() || {};
    var merged = {};
    for (var key in current) {
      if (current.hasOwnProperty(key)) merged[key] = current[key];
    }
    for (var key2 in data) {
      if (data.hasOwnProperty(key2)) merged[key2] = data[key2];
    }
    merged.version = (merged.version || 1) + 1;
    merged.last_updated = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    KnowledgeRepository.save(this.NAMESPACE, 'self_model', JSON.stringify(merged), 'SOUL_UPDATE');
  },

  getIdentity() {
    var raw = KnowledgeRepository.get(this.NAMESPACE, 'identity');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  updateIdentity(data) {
    var current = this.getIdentity() || {};
    var merged = {};
    for (var key in current) {
      if (current.hasOwnProperty(key)) merged[key] = current[key];
    }
    for (var key2 in data) {
      if (data.hasOwnProperty(key2)) merged[key2] = data[key2];
    }
    KnowledgeRepository.save(this.NAMESPACE, 'identity', JSON.stringify(merged), 'SOUL_UPDATE');
  },

  getBeliefs() {
    var raw = KnowledgeRepository.get(this.NAMESPACE, 'beliefs');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  },

  addBelief(belief) {
    var beliefs = this.getBeliefs();
    beliefs.push({
      text: belief,
      added_at: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB())
    });
    KnowledgeRepository.save(this.NAMESPACE, 'beliefs', JSON.stringify(beliefs), 'SOUL_UPDATE');
  },

  getGrowthLog() {
    var raw = KnowledgeRepository.get(this.NAMESPACE, 'growth_log');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  },

  addGrowthEntry(event, detail) {
    var log = this.getGrowthLog();
    log.push({
      timestamp: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB()),
      event: event,
      detail: detail || null
    });
    if (log.length > 500) log = log.slice(-500);
    KnowledgeRepository.save(this.NAMESPACE, 'growth_log', JSON.stringify(log), 'SOUL_GROWTH');
  },

  getEmotionalState() {
    var raw = KnowledgeRepository.get(this.NAMESPACE, 'emotional_state');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  updateEmotionalState(data) {
    var current = this.getEmotionalState() || {};
    var merged = {};
    for (var key in current) {
      if (current.hasOwnProperty(key)) merged[key] = current[key];
    }
    for (var key2 in data) {
      if (data.hasOwnProperty(key2)) merged[key2] = data[key2];
    }
    merged.last_updated = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    KnowledgeRepository.save(this.NAMESPACE, 'emotional_state', JSON.stringify(merged), 'SOUL_UPDATE');
  },

  getFullContext() {
    return {
      self_model: this.getSelfModel(),
      identity: this.getIdentity(),
      beliefs: this.getBeliefs(),
      growth_log: this.getGrowthLog().slice(-10),
      emotional_state: this.getEmotionalState()
    };
  }
};

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