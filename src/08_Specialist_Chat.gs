/**
 * ===================================================================
 * SPESIALIS: CHAT (UNIFIED PERSONA)
 * Tanggung jawab: Mengelola kepribadian tanggapan obrolan biasa
 * dan percakapan berbasis konteks web search.
 * ===================================================================
 */
const ChatSpecialist = {

  /**
   * Mengambil System Persona secara dinamis dari Knowledge Repository (Single Source of Truth)
   */
  buildSystemPersona() {
    var persona = KnowledgeRepository.get('soul', 'system_persona');
    if (!persona) {
      persona = KnowledgeRepository.get('intent', 'persona');
    }
    if (!persona) {
      persona = 'Kamu adalah AI Agent mandiri, jujur, objektif, dan presisi dalam Bahasa Indonesia.';
    }
    return persona;
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