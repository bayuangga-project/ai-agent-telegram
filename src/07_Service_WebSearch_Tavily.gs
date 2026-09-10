/**
 * ===================================================================
 * SEARCH PROVIDER: TAVILY
 * Didesain khusus untuk konsumsi AI/LLM.
 * ===================================================================
 */
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