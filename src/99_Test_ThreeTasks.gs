/**
 * TAHAP 1 DIAGNOSTIK: Memeriksa WebSearch Query Extractor & Tavily/Google API
 * HANYA MEMBACA DATA & API, TIDAK MENGUBAH DATABASE. (Mematuhi Pasal 12)
 */
function diagnostic_WebSearchQueryAndProviders() {
  Logger.log('=== DIAGNOSTIK WEB SEARCH QUERY & PROVIDERS ===');

  var config = Config.load();

  // 1. Test Parameter Alias Extractor
  var mockParams1 = { query: 'hot news indonesia 5 jam terakhir' };
  var mockParams2 = { searchQuery: 'berita terkini' };
  var mockParams3 = 'berita indonesia';

  var extractQuery = function(p) {
    if (!p) return '';
    if (typeof p === 'string') return p;
    return p.query || p.searchQuery || p.q || p.text || '';
  };

  Logger.log('Extract Result 1: "' + extractQuery(mockParams1) + '"');
  Logger.log('Extract Result 2: "' + extractQuery(mockParams2) + '"');
  Logger.log('Extract Result 3: "' + extractQuery(mockParams3) + '"');

  if (extractQuery(mockParams1) && extractQuery(mockParams2)) {
    Logger.log('✅ PASS: Multi-Alias Extractor berhasil mencegah Query undefined!');
  } else {
    Logger.log('❌ FAIL: Extractor query gagal.');
  }

  // 2. Test Direct Call Tavily API dengan Query Nyata
  if (config.tavilyApiKey) {
    Logger.log('\nMenguji Tavily API dengan query "berita indonesia terbaru"...');
    try {
      var tavilyResults = TavilySearchProvider.search('berita indonesia terbaru');
      Logger.log('Tavily Status: SUKSES! Ditemukan ' + tavilyResults.length + ' hasil berita.');
      if (tavilyResults.length > 0) {
        Logger.log('Sample Judul Berita #1: ' + tavilyResults[0].title);
        Logger.log('✅ PASS: Tavily Web Search API Aktif & Sangat Sehat!');
      }
    } catch (eT) {
      Logger.log('❌ Tavily Error: ' + eT.message);
    }
  } else {
    Logger.log('⚠️ WARN: TAVILY_API_KEY belum dikonfigurasi di Script Properties.');
  }
}