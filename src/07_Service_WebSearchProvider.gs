/**
 * ===================================================================
 * WEB SEARCH PROVIDER SERVICE (ORCHESTRATOR & PROVIDERS)
 * Tanggung jawab: coba Google dulu, kalau gagal/kuota habis,
 * fallback ke Tavily.
 * ===================================================================
 */

const GoogleSearchProvider = {
  NAME: 'google',
  ENDPOINT: 'https://www.googleapis.com/customsearch/v1',
  MAX_RESULTS: 5,

  isConfigured() {
    const config = Config.load();
    return !!(config.googleSearchApiKey && config.googleSearchEngineId);
  },

  search(query) {
    if (!this.isConfigured()) {
      throw new Error('Google Search belum dikonfigurasi (API key/Engine ID kosong)');
    }

    const config = Config.load();
    const url = this.ENDPOINT +
      '?key=' + encodeURIComponent(config.googleSearchApiKey) +
      '&cx=' + encodeURIComponent(config.googleSearchEngineId) +
      '&q=' + encodeURIComponent(query) +
      '&num=' + this.MAX_RESULTS;

    const options = { method: 'get', muteHttpExceptions: true };
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();

    if (code === 429) {
      throw new Error('Google Search kuota habis (HTTP 429)');
    }
    if (code !== 200) {
      throw new Error('Google Search HTTP error ' + code);
    }

    const data = JSON.parse(response.getContentText());
    if (!data.items) return [];

    return data.items.map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    }));
  }
};

const TavilySearchProvider = {
  NAME: 'tavily',
  ENDPOINT: 'https://api.tavily.com/search',
  MAX_RESULTS: 5,

  isConfigured() {
    return !!Config.load().tavilyApiKey;
  },

  search(query) {
    if (!this.isConfigured()) {
      throw new Error('Tavily belum dikonfigurasi (API key kosong)');
    }

    const config = Config.load();
    const payload = {
      api_key: config.tavilyApiKey,
      query: query,
      max_results: this.MAX_RESULTS,
      include_answer: false
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(this.ENDPOINT, options);
    const code = response.getResponseCode();

    if (code === 429) {
      throw new Error('Tavily kuota habis (HTTP 429)');
    }
    if (code !== 200) {
      throw new Error('Tavily HTTP error ' + code);
    }

    const data = JSON.parse(response.getContentText());
    if (!data.results) return [];

    return data.results.map(item => ({
      title: item.title,
      snippet: item.content,
      link: item.url
    }));
  }
};

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
    if (!results || results.length === 0) return 'Tidak ada hasil pencarian ditemukan.';

    return results.map((r, i) =>
      (i + 1) + '. ' + r.title + '\n   ' + r.snippet + '\n   Sumber: ' + r.link
    ).join('\n\n');
  },

  isAnyConfigured() {
    return this.getProviders().some(p => p.isConfigured());
  }
};