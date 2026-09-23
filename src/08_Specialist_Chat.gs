/**
 * ===================================================================
 * SPESIALIS: CHAT
 * Menyusun respons percakapan umum dan integrasi pencarian web.
 * Menggunakan persona dinamis dari SOUL dan template dari KnowledgeRepository.
 * ===================================================================
 */
const ChatSpecialist = {

  buildSystemPersona() {
    var template = KnowledgeRepository.get('soul', 'system_persona');
    if (!template) {
      template = KnowledgeRepository.get('intent', 'persona') || '';
    }

    var soulContext = null;
    try {
      soulContext = SoulSpecialist.getFullContext();
    } catch (e) {
      // Fallback jika soul belum terinisialisasi
    }

    var basePersona = KnowledgeRepository.get('intent', 'persona') || '';
    if (!soulContext) {
      return basePersona;
    }

    var identity = soulContext.identity || {};
    var selfModel = soulContext.self_model || {};
    var beliefs = soulContext.beliefs || [];

    var traitsStr = Array.isArray(identity.traits) && identity.traits.length > 0
      ? identity.traits.join(', ') : '-';
    var valuesStr = Array.isArray(identity.values) && identity.values.length > 0
      ? identity.values.join(', ') : '-';
    var beliefsStr = Array.isArray(beliefs) && beliefs.length > 0
      ? beliefs.map(function(b) { return b.text || b; }).join('; ') : '-';
    var weaknessesStr = selfModel && Array.isArray(selfModel.known_weaknesses) && selfModel.known_weaknesses.length > 0
      ? selfModel.known_weaknesses.join(', ') : '-';

    var variables = {
      persona: basePersona,
      name: identity.name || '-',
      traits: traitsStr,
      values: valuesStr,
      communication_style: identity.communication_style || '-',
      beliefs: beliefsStr,
      weaknesses: weaknessesStr
    };

    return TemplateEngine.render(template, variables);
  },

  needsWebSearch(intent) {
    return !!(intent && (intent.butuhInfoTerkini || intent.butuh_web_search));
  },

  respondWithSearchContext(userMessage, searchResults, riwayat) {
    var template = KnowledgeRepository.get('chat', 'web_search_prompt');
    var systemPersona = this.buildSystemPersona();
    var searchContext = WebSearchProviderService.formatResultsAsContext(searchResults);
    var riwayatFormatted = this._formatRiwayat(riwayat);

    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        persona: systemPersona,
        search_results: searchContext,
        riwayat: riwayatFormatted
      });
    } else {
      prompt = systemPersona + '\n\n' + searchContext;
    }

    var result = LLMProviderService.generate({
      taskType: 'web_grounded',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: userMessage }],
      temperature: 0.7
    });

    return (result && result.text) ? result.text : null;
  },

  _formatRiwayat(riwayat) {
    if (!riwayat || riwayat.length === 0) return '-';
    return riwayat.map(function(item) {
      var role = (item.role === 'ai' || item.role === 'assistant') ? 'AI' : 'User';
      return role + ': ' + (item.text || item.content || '');
    }).join('\n');
  }
};