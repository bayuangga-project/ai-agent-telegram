/**
 * ===================================================================
 * SEARCH PROVIDER: GOOGLE (Custom Search API)
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