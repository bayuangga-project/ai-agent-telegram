/**
 * ===================================================================
 * SPESIALIS: CHAT (UNIFIED PERSONA WITH DYNAMIC RENDERING)
 * Tanggung jawab: Mengelola kepribadian tanggapan obrolan biasa
 * dan percakapan berbasis konteks web search.
 * ===================================================================
 */
const ChatSpecialist = {

  /**
   * Mengambil dan MERENDER System Persona secara dinamis dengan data identitas nyata
   */
  buildSystemPersona() {
    var rawTemplate = KnowledgeRepository.get('soul', 'system_persona');
    if (!rawTemplate) {
      rawTemplate = KnowledgeRepository.get('intent', 'persona');
    }
    if (!rawTemplate) {
      rawTemplate = 'Kamu adalah AI Agent mandiri, jujur, objektif, dan presisi dalam Bahasa Indonesia.';
    }

    // 1. Ambil data identitas nyata dari Soul / UserProfile
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

    // Fallback pencarian nama di UserProfile jika Soul belum terisi
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

    // 2. Isikan data ke variabel template
    var basePersona = KnowledgeRepository.get('intent', 'persona') || 'AI Agent mandiri dan presisi.';
    var variables = {
      persona: basePersona,
      name: aiName ? aiName : 'Belum diatur',
      traits: traits,
      values: values,
      communication_style: 'Natural dan santun',
      beliefs: '-',
      weaknesses: '-'
    };

    var rendered = TemplateEngine.render(rawTemplate, variables);

    // 3. Jika nama sudah ada, bersihkan aturan "masih tahap awal" agar LLM tidak bingung/halu
    if (aiName) {
      rendered = rendered.replace(/Jika data identitas masih kosong.*$/gm, '');
      rendered += '\n\nIDENTITAS RESMI: Namamu adalah ' + aiName + '. Selalu akui dan gunakan nama ini jika ditanya oleh user.';
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

    var systemPrompt = persona + '\n\nKONTEKS HASIL PENCARIAN WEB REAL-TIME:\n' + contextText +
      '\n\nTugasmu: Jawab pertanyaan pengguna berdasarkan konteks pencarian web di atas secara faktual, ringkas, dan natural dalam Bahasa Indonesia.';

    var formattedHistory = this._formatRiwayat(riwayat);

    var response = LLMProviderService.generate({
      taskType: 'web_grounded',
      systemInstruction: systemPrompt,
      messages: formattedHistory.concat([{ role: 'user', text: userMessage }]),
      temperature: 0.5
    });

    return (response && response.text) ? response.text : 'Maaf, saya tidak dapat menemukan informasi terbaru saat ini.';
  },

  _formatRiwayat(riwayat) {
    if (!riwayat || !Array.isArray(riwayat)) return [];
    return riwayat.map(function(item) {
      return {
        role: item.role === 'ai' ? 'assistant' : 'user',
        text: item.text || item.content || ''
      };
    });
  }
};