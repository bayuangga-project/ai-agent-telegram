/**
 * ===================================================================
 * WEB SEARCH PROVIDER SERVICE (ORCHESTRATOR)
 * Tanggung jawab: coba Google dulu, kalau gagal/kuota habis,
 * fallback ke Tavily.
 *
 * PENTING: daftar provider dibungkus method getProviders(), BUKAN
 * property array langsung. Ini SENGAJA untuk menghindari
 * ReferenceError akibat urutan load file GAS (lihat ARCHITECTURE.md
 * bagian "Lazy Evaluation Rule"). Referensi ke provider lain hanya
 * boleh terjadi saat method dipanggil, bukan saat file dimuat.
 * ===================================================================
 */
const WebSearchProviderService = {
  getProviders() {
    return [GoogleSearchProvider, TavilySearchProvider];
  },

  search(query) {
    const providers = this.getProviders();
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      try {
        const results = provider.search(query);
        AppLogger.info('WEBSEARCH_PROVIDER_SUCCESS', provider.NAME);
        return results;
      } catch (err) {
        AppLogger.warning('WEBSEARCH_PROVIDER_FAIL', provider.NAME + ': ' + err.message);
      }
    }

    AppLogger.error('WEBSEARCH_PROVIDER_ALL_FAILED', 'Query: ' + query);
    return [];
  },

  formatResultsAsContext(results) {
    if (results.length === 0) return 'Tidak ada hasil pencarian ditemukan.';

    return results.map((r, i) =>
      (i + 1) + '. ' + r.title + '\n   ' + r.snippet + '\n   Sumber: ' + r.link
    ).join('\n\n');
  },

  isAnyConfigured() {
    return this.getProviders().some(p => p.isConfigured());
  }
};