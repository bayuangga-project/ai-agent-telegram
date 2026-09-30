/**
 * ===================================================================
 * SPESIALIS: CHAT (UNIFIED PERSONA & WEB SEARCH CONTEXT GROUNDING)
 * Tanggung jawab: Mengelola kepribadian tanggapan obrolan biasa
 * dan percakapan berbasis konteks web search.
 * 100% PATUH PASAL 1.2 (ZERO HARDCODE HUMAN LANGUAGE STRINGS IN THIS FILE).
 * ===================================================================
 */
const ChatSpecialist = {

  buildSystemPersona() {
    var rawTemplate = KnowledgeRepository.get('soul', 'system_persona');
    if (!rawTemplate) {
      rawTemplate = KnowledgeRepository.get('intent', 'persona');
    }
    if (!rawTemplate) {
      return '';
    }

    var aiName = '';
    var traits = '-';
    var values = '-';

    try {
      if (typeof SoulSpecialist !== 'undefined' && SoulSpecialist.getIdentity) {
        var soulIdentity = SoulSpecialist.getIdentity();
        if (soulIdentity && soulIdentity.name) {
          aiName = soulIdentity.name;
        }
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

    if (!aiName) {
      try {
        var facts = KnowledgeSpecialist.getActiveFactsForPrompt(50) || [];
        for (var f = 0; f < facts.length; f++) {
          var match = String(facts[f]).match(/Nama AI Agent ini adalah\s+([a-zA-Z0-9\s]+)/i);
          if (match && match[1]) {
            aiName = match[1].trim();
            break;
          }
        }
      } catch (e) {}
    }

    var basePersona = KnowledgeRepository.get('intent', 'persona') || '';
    var variables = {
      persona: basePersona,
      name: aiName ? aiName : '',
      traits: traits,
      values: values,
      communication_style: '',
      beliefs: '-',
      weaknesses: '-'
    };

    var rendered = TemplateEngine.render(rawTemplate, variables);

    if (aiName) {
      rendered = rendered.replace(/Jika data identitas masih kosong.*$/gm, '');
      rendered = rendered.replace(/jawab dengan jujur bahwa kamu masih dalam tahap awal perkembangan.*$/gm, '');
    }

    return rendered;
  },

  needsWebSearch(intent) {
    if (!intent) return false;
    return intent.butuhInfoTerkini === true || intent.butuhInfoTerkini === 'true';
  },

  respondWithSearchContext(userMessage, searchResults, riwayat) {
    var persona = this.buildSystemPersona();
    var contextText = WebSearchProviderService.formatResultsAsContext(searchResults);

    var promptTemplate = KnowledgeRepository.get('websearch', 'prompt_template');
    var systemPrompt = '';

    if (promptTemplate) {
      systemPrompt = TemplateEngine.render(promptTemplate, {
        persona: persona,
        context_text: contextText
      });
    } else {
      systemPrompt = persona + '\n\nKONTEKS PENCARIAN REAL-TIME:\n' + contextText;
    }

    var formattedHistory = this._formatRiwayat(riwayat);

    var response = LLMProviderService.generate({
      taskType: 'web_grounded',
      systemInstruction: systemPrompt,
      messages: formattedHistory.concat([{ role: 'user', text: userMessage }]),
      temperature: 0.5
    });

    return (response && response.text) ? response.text : '';
  },

  _formatRiwayat(riwayat) {
    if (!riwayat || !Array.isArray(riwayat)) return [];
    return riwayat.map(function(item) {
      return {
        role: item.role === 'ai' || item.role === 'assistant' ? 'assistant' : 'user',
        text: item.text || item.content || ''
      };
    });
  }
};