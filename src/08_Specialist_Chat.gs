/**
 * ===================================================================
 * SPESIALIS: CHAT (UNIFIED PERSONA WITH STRICT IDENTITY RESOLUTION)
 * Tanggung jawab: Mengelola kepribadian tanggapan obrolan biasa
 * dan percakapan berbasis konteks web search.
 * ===================================================================
 */
const ChatSpecialist = {

  /**
   * Mengambil & Merender System Persona dengan Pengecekan Identitas Berlapis
   */
  buildSystemPersona() {
    var rawTemplate = KnowledgeRepository.get('soul', 'system_persona');
    if (!rawTemplate) {
      rawTemplate = KnowledgeRepository.get('intent', 'persona');
    }
    if (!rawTemplate) {
      rawTemplate = 'Kamu adalah AI Agent mandiri, jujur, objektif, dan presisi dalam Bahasa Indonesia.';
    }

    // 1. Lacak nama AI dari 3 sumber database (Soul -> UserProfile -> MemoryFacts)
    var aiName = '';

    // Sumber A: Soul Identity
    try {
      if (typeof SoulSpecialist !== 'undefined' && SoulSpecialist.getIdentity) {
        var soulIdentity = SoulSpecialist.getIdentity();
        if (soulIdentity && soulIdentity.name) {
          aiName = soulIdentity.name;
        }
      }
    } catch (e) {}

    // Sumber B: UserProfile (key: ai_name)
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

    // Sumber C: Memory Facts (fakta pencatatan nama)
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

    // 2. Isikan variabel template
    var basePersona = KnowledgeRepository.get('intent', 'persona') || 'AI Agent mandiri dan presisi.';
    var variables = {
      persona: basePersona,
      name: aiName ? aiName : 'Belum diatur',
      traits: 'Mandiri, objektif, penolong',
      values: 'Kebenaran, kejujuran, presisi',
      communication_style: 'Natural, santun, fleksibel',
      beliefs: '-',
      weaknesses: '-'
    };

    var rendered = TemplateEngine.render(rawTemplate, variables);

    // 3. ATURAN RIGID: Jika nama sudah terdeteksi, hapus instruksi "belum punya nama" & kunci nama secara mutlak
    if (aiName) {
      rendered = rendered.replace(/Jika data identitas masih kosong.*$/gm, '');
      rendered = rendered.replace(/jawab dengan jujur bahwa kamu masih dalam tahap awal perkembangan.*$/gm, '');
      rendered += '\n\n=========================================\n' +
                  'PERINTAH MUTLAK IDENTITAS DIRI:\n' +
                  '- NAMAMU ADALAH: ' + aiName + '\n' +
                  '- Kamu SUDAH MEMILIKI nama resmi yaitu ' + aiName + '.\n' +
                  '- DILARANG KERAS menyatakan kamu belum memiliki nama atau masih dalam tahap awal perkembangan identitas!\n' +
                  '- Selalu akui namamu adalah ' + aiName + ' saat ditanya oleh pengguna.\n' +
                  '=========================================';
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