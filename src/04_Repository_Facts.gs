/**
 * ===================================================================
 * REPOSITORY: MEMORY FACTS (WITH VECTOR COSINE SIMILARITY RAG)
 * ===================================================================
 */
const FactsRepository = {
  SHEET_NAME: 'Memory_Facts',
  STATUS_ACTIVE: 'Active',

  save(chatId, factText, category) {
    var cleanFact = String(factText || '').trim();
    if (!cleanFact) return;

    // Hitung Vector Embedding secara otomatis
    var embeddingArr = null;
    try {
      if (typeof LLMProviderService !== 'undefined' && LLMProviderService.getEmbedding) {
        embeddingArr = LLMProviderService.getEmbedding(cleanFact);
      }
    } catch (e) {}

    var embeddingJson = embeddingArr ? JSON.stringify(embeddingArr) : '';

    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      IdGenerator.generate('MEM'), new Date(), chatId,
      category || 'general', cleanFact, this.STATUS_ACTIVE, embeddingJson
    ]);
  },

  getActive(maxFacts) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    const activeFacts = data
      .filter(row => row[5] === this.STATUS_ACTIVE)
      .map(row => row[4]);

    return activeFacts.length > maxFacts
      ? activeFacts.slice(activeFacts.length - maxFacts)
      : activeFacts;
  },

  /**
   * Vector RAG Search: Mengambil fakta relevan berdasarkan Cosine Similarity Vektor
   * Fallback otomatis ke Keyword Matching jika Vektor API offline
   */
  getSemanticFacts(queryText, limit) {
    var maxLimit = limit || 15;
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    var activeRows = data.filter(row => row[5] === this.STATUS_ACTIVE);
    if (activeRows.length === 0) return [];

    // 1. Coba ambil Vektor Embedding dari Query User
    var queryVec = null;
    try {
      if (typeof LLMProviderService !== 'undefined' && LLMProviderService.getEmbedding) {
        queryVec = LLMProviderService.getEmbedding(queryText);
      }
    } catch (e) {}

    // 2. JALUR A: Vector Cosine Similarity Search
    if (queryVec && Array.isArray(queryVec) && queryVec.length > 0) {
      var scoredFacts = [];
      for (var i = 0; i < activeRows.length; i++) {
        var row = activeRows[i];
        var factText = row[4];
        var rawEmbed = row[6];
        var factVec = null;

        if (rawEmbed) {
          try { factVec = JSON.parse(rawEmbed); } catch (e) {}
        }

        var score = 0;
        if (factVec && Array.isArray(factVec)) {
          score = this._cosineSimilarity(queryVec, factVec);
        } else {
          // Fallback keyword match score jika fakta belum punya vektor
          score = String(factText).toLowerCase().indexOf(String(queryText).toLowerCase()) !== -1 ? 0.5 : 0;
        }

        scoredFacts.push({ fact: factText, score: score });
      }

      scoredFacts.sort(function(a, b) { return b.score - a.score; });
      var topSemantic = scoredFacts.slice(0, maxLimit).map(function(item) { return item.fact; });
      if (topSemantic.length > 0) return topSemantic;
    }

    // 3. JALUR B: Fallback Keyword Matching
    var lowerKw = String(queryText).toLowerCase().trim();
    var keywordMatches = activeRows
      .map(row => row[4])
      .filter(fact => String(fact).toLowerCase().indexOf(lowerKw) !== -1);

    return keywordMatches.slice(-maxLimit);
  },

  _cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    var dot = 0, normA = 0, normB = 0;
    for (var i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
};