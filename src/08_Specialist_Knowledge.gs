/**
 * ===================================================================
 * SPESIALIS: KNOWLEDGE (USER FACTS & SEMANTIC RAG INTEGRATED)
 * Tanggung jawab: simpan & ambil fakta tentang user dengan dukungan
 * Vector Cosine Similarity RAG.
 * ===================================================================
 */
const KnowledgeSpecialist = {
  CATEGORY_MANUAL: 'manual',
  CATEGORY_AUTO: 'auto',

  saveFact(chatId, factText, category) {
    if (!factText || factText.trim().length === 0) return false;
    FactsRepository.save(chatId, factText.trim(), category || 'general');
    return true;
  },

  saveManualFact(chatId, factText) {
    return this.saveFact(chatId, factText, this.CATEGORY_MANUAL);
  },

  saveAutoDetectedFacts(chatId, facts) {
    if (!facts || facts.length === 0) return 0;
    let saved = 0;
    facts.forEach(f => {
      if (this.saveFact(chatId, f, this.CATEGORY_AUTO)) saved++;
    });
    return saved;
  },

  getActiveFactsForPrompt(limit) {
    return FactsRepository.getActive(limit || 15);
  },

  findRelevantToKeyword(keyword, limit) {
    return FactsRepository.getSemanticFacts(keyword, limit || 15);
  }
};