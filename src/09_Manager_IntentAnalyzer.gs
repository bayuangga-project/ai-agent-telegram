/**
 * ===================================================================
 * SERVICE: INTENT ANALYZER (UNIFIED PERSONA & SELECTIVE TRUNCATED FORMATTER)
 * Tanggung jawab: Mengubah pesan pengguna menjadi struktur intent/params
 * dan menyediakan fungsi pembantu format konteks ringan.
 * 100% PATUH PASAL 1.2 (ZERO HARDCODE HUMAN LANGUAGE STRINGS IN THIS FILE).
 * ===================================================================
 */
const IntentAnalyzer = {
  NAMESPACE: 'intent',

  analyze(userMessage, context) {
    var prompt = this._buildPrompt(userMessage, context);
    var result = LLMProviderService.generateFromSinglePrompt(prompt, 0.3, 'intent_analysis');
    if (!result) {
      AppLogger.error('INTENT_ANALYZER_ALL_PROVIDERS_FAILED', 'all_providers_failed');
      return null;
    }
    return this._parseResponse(result.text, result.provider);
  },

  _parseResponse(rawText, providerName) {
    var cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      var parsed = JSON.parse(cleaned);
      AppLogger.info('INTENT_ANALYZER_SUCCESS',
        'provider:' + providerName + '|complexity:' + (parsed.complexity || 'light'));
      return parsed;
    } catch (err) {
      try {
        var repaired = cleaned
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/,(\s*)"([^"]*)":\s*""(\s*[,}])/g, ',$1"$2":""$3');
        var parsed2 = JSON.parse(repaired);
        AppLogger.warning('INTENT_ANALYZER_REPAIRED',
          'provider:' + providerName + '|complexity:' + (parsed2.complexity || 'light'));
        return parsed2;
      } catch (err2) {
        AppLogger.warning('INTENT_ANALYZER_PARSE_ERROR',
          providerName + ':' + err.message + '|raw:' + cleaned.substring(0, 300));
        return null;
      }
    }
  },

  _buildPrompt(userMessage, context) {
    var knowledge = KnowledgeRepository.getByNamespace(this.NAMESPACE);
    var template = knowledge['master_prompt'];
    if (!template) {
      AppLogger.error('INTENT_ANALYZER_NO_TEMPLATE', 'master_prompt_missing');
      return userMessage;
    }

    var nowStr = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    var persona = KnowledgeRepository.get('soul', 'system_persona') || knowledge['persona'] || '';

    var variables = {
      persona: persona,
      now: nowStr,
      riwayat: this._formatRiwayat(context.riwayat),
      fakta: this._formatList(context.facts),
      profil: this._formatList(context.profile),
      ltm: this._formatList(context.ltm),
      reminder: this._formatReminder(context.reminderMenunggu),
      pola: this._formatPola(context.ackPatterns),
      user_message: userMessage,
      output_schema: knowledge['output_schema'] || '',
      rules: knowledge['rules'] || ''
    };

    return TemplateEngine.render(template, variables);
  },

  /**
   * FORMATTER RIWAYAT DENGAN TRUNCATE RESPOR AI (> 300 KARAKTER)
   * Mengamankan Prompt ReAct Agent agar tidak mengalami Context Bloat.
   * Pesan User TIDAK DIPOTONG agar instruksi tetap 100% utuh.
   */
  _formatRiwayat(r) {
    if (!r || !Array.isArray(r) || r.length === 0) return '-';
    return r.map(function(i) {
      var roleLabel = (i.role === 'ai' || i.role === 'assistant') ? 'AI' : 'User';
      var textContent = String(i.text || i.content || '').trim();
      
      // Potong HANYA respon AI jika lebih dari 300 karakter demi efisiensi prompt
      if (roleLabel === 'AI' && textContent.length > 300) {
        textContent = textContent.substring(0, 297) + '...';
      }
      return roleLabel + ': ' + textContent;
    }).join('\n');
  },

  _formatList(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return '-';
    return arr.map(function(x) { return '- ' + x; }).join('\n');
  },

  _formatReminder(r) {
    if (!r || !Array.isArray(r) || r.length === 0) return '-';
    return r.map(function(x) { return '- ' + x.deskripsi; }).join('\n');
  },

  _formatPola(p) {
    if (!p || !Array.isArray(p) || p.length === 0) return '-';
    return p.map(function(x) { return '- ' + x.pesan + ' -> ' + x.aksi; }).join('\n');
  }
};