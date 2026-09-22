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
      name: null,
      traits: [],
      values: [],
      communication_style: null,
      relationship_with_developer: null
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

function runFullCodeAudit() {
  var scriptId = ScriptApp.getScriptId();
  var token = ScriptApp.getOAuthToken();
  var url = 'https://script.googleapis.com/v1/projects/' + scriptId + '/content';

  var response;
  try {
    response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token },
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log(JSON.stringify({ status: 'FETCH_ERROR', message: e.message }));
    return;
  }

  if (response.getResponseCode() !== 200) {
    Logger.log(JSON.stringify({
      status: 'API_ERROR',
      code: response.getResponseCode(),
      body: response.getContentText().substring(0, 500)
    }));
    return;
  }

  var projectData = JSON.parse(response.getContentText());
  var allFiles = projectData.files || [];
  var gsFiles = allFiles.filter(function(f) { return f.type === 'SERVER_JS'; });

  var report = {
    timestamp: new Date().toISOString(),
    total_files: gsFiles.length,
    total_loc: 0,
    total_methods: 0,
    issues: [],
    files: []
  };

  var allMethodDefs = {};
  var allMethodCalls = {};
  var allModuleRefs = {};

  for (var i = 0; i < gsFiles.length; i++) {
    var f = gsFiles[i];
    var name = f.name || 'unknown';
    var source = f.source || '';
    var lines = source.split('\n');
    var loc = lines.length;
    report.total_loc += loc;

    var methods = [];
    var stringViolations = [];
    var emojiViolations = [];
    var hardcodedSecrets = [];
    var missingTryCatch = [];

    for (var l = 0; l < lines.length; l++) {
      var line = lines[l];
      var trimmed = line.trim();

      // Extract methods
      var m1 = trimmed.match(/^(\w+)\s*[:=]\s*function\s*\(([^)]*)\)/);
      if (m1) {
        methods.push(m1[1]);
        allMethodDefs[m1[1]] = name;
        continue;
      }
      var m2 = trimmed.match(/^function\s+(\w+)\s*\(([^)]*)\)/);
      if (m2) {
        methods.push(m2[1]);
        allMethodDefs[m2[1]] = name;
      }

      // Detect string violations (human language in code)
      var strings = trimmed.match(/'([^'\\]{20,})'|"([^"\\]{20,})"/g) || [];
      for (var s = 0; s < strings.length; s++) {
        var str = strings[s].slice(1, -1);
        if (str.indexOf('http') === 0) continue;
        if (str.indexOf('{{') >= 0) continue;
        if (str.indexOf('application/') >= 0) continue;
        if (str.indexOf('Bearer ') === 0) continue;
        if (/^[A-Z_]+$/.test(str)) continue;
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) continue;
        if (str.indexOf('===') >= 0) continue;
        if (str.indexOf('function') >= 0) continue;
        if (/[\u{1F300}-\u{1FAD6}]/u.test(str)) {
          emojiViolations.push({ line: l + 1, text: str.substring(0, 50) });
        }
        var wordCount = str.split(/\s+/).length;
        if (wordCount >= 4 && /[a-zA-Z]{3,}/.test(str)) {
          stringViolations.push({ line: l + 1, text: str.substring(0, 60) });
        }
      }

      // Detect hardcoded secrets
      if (/api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{10,}['"]/i.test(trimmed)) {
        hardcodedSecrets.push({ line: l + 1 });
      }
      if (/token\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/i.test(trimmed)) {
        hardcodedSecrets.push({ line: l + 1 });
      }
    }

    // Detect module references
    var modulePattern = /([A-Z][a-zA-Z]+)\.(\w+)\s*\(/g;
    var match;
    while ((match = modulePattern.exec(source)) !== null) {
      var modName = match[1];
      var methodName = match[2];
      if (!allModuleRefs[modName]) allModuleRefs[modName] = [];
      if (allModuleRefs[modName].indexOf(methodName) === -1) {
        allModuleRefs[modName].push(methodName);
      }
      var callKey = modName + '.' + methodName;
      if (!allMethodCalls[callKey]) allMethodCalls[callKey] = [];
      allMethodCalls[callKey].push(name);
    }

    report.total_methods += methods.length;

    var fileReport = {
      file: name,
      loc: loc,
      methods: methods.length
    };

    if (stringViolations.length > 0) {
      fileReport.string_violations = stringViolations.length;
      fileReport.string_samples = stringViolations.slice(0, 3);
      report.issues.push({ file: name, type: 'STRING_VIOLATION', count: stringViolations.length });
    }
    if (emojiViolations.length > 0) {
      fileReport.emoji_violations = emojiViolations.length;
      fileReport.emoji_samples = emojiViolations.slice(0, 3);
      report.issues.push({ file: name, type: 'EMOJI_IN_CODE', count: emojiViolations.length });
    }
    if (hardcodedSecrets.length > 0) {
      fileReport.hardcoded_secrets = hardcodedSecrets.length;
      report.issues.push({ file: name, type: 'HARDCODED_SECRET', count: hardcodedSecrets.length });
    }

    report.files.push(fileReport);
  }

  // Cross-file analysis: detect orphan modules
  var knownModules = Object.keys(allModuleRefs);
  var definedModules = {};
  for (var k in allMethodDefs) {
    if (allMethodDefs.hasOwnProperty(k)) {
      definedModules[allMethodDefs[k]] = true;
    }
  }

  report.summary = {
    total_files: gsFiles.length,
    total_loc: report.total_loc,
    total_methods: report.total_methods,
    total_issues: report.issues.length,
    issue_types: {}
  };

  for (var q = 0; q < report.issues.length; q++) {
    var t = report.issues[q].type;
    report.summary.issue_types[t] = (report.summary.issue_types[t] || 0) + 1;
  }

  var output = JSON.stringify(report, null, 2);

  // Split output jika terlalu besar untuk Logger
  var maxChunk = 45000;
  if (output.length <= maxChunk) {
    Logger.log(output);
  } else {
    var chunks = Math.ceil(output.length / maxChunk);
    for (var c = 0; c < chunks; c++) {
      Logger.log('=== CHUNK ' + (c + 1) + '/' + chunks + ' ===');
      Logger.log(output.substring(c * maxChunk, (c + 1) * maxChunk));
    }
  }
}