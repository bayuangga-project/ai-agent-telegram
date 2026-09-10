/**
 * ===================================================================
 * SPESIALIS: CHAT / BRAINSTORM
 * Tanggung jawab: obrolan natural + kemampuan browsing internet
 * untuk info terkini (via WebSearchService).
 * ===================================================================
 */
const ChatSpecialist = {
  buildSystemPersona() {
    return [
      'Kamu adalah asisten pribadi. Kepribadianmu: pakai "aku" dan "kamu", natural,',
      'hangat, tidak kaku, tidak template, sesekali humor ringan kalau pas momennya.',
      'Kejujuran dan akurasi JAUH LEBIH PENTING daripada terdengar personal.',
      'JANGAN PERNAH mengarang kejadian, cerita, atau detail yang tidak ada di',
      'konteks yang diberikan.'
    ].join('\n');
  },

  needsWebSearch(intent) {
    return !!(intent.butuhInfoTerkini && intent.searchQuery);
  },

  respondWithSearchContext(userMessage, searchResults, riwayat) {
  const searchContext = WebSearchProviderService.formatResultsAsContext(searchResults);
  const prompt = [
    this.buildSystemPersona(),
    '',
    '=== HASIL PENCARIAN INTERNET TERKINI ===',
    searchContext,
    '',
    '=== RIWAYAT PERCAKAPAN ===',
    this._formatRiwayat(riwayat),
    '',
    '=== PESAN USER ===',
    userMessage,
    '',
    'Jawab pertanyaan user menggunakan hasil pencarian di atas sebagai sumber',
    'informasi utama. Sebutkan secara natural kalau info ini dari hasil pencarian',
    'terkini. Jangan mengarang di luar hasil pencarian yang tersedia.'
  ].join('\n');

  const result = LLMProviderService.generateFromSinglePrompt(prompt, 0.7, 'fast');
  return result ? result.text : 'Maaf, aku lagi kesulitan mengolah hasil pencarian ini.';
},

  _formatRiwayat(riwayat) {
    if (!riwayat || riwayat.length === 0) return 'Belum ada riwayat percakapan.';
    return riwayat.map(item =>
      (item.role === 'ai' ? 'AI' : 'User') + ': ' + item.text
    ).join('\n');
  }
};