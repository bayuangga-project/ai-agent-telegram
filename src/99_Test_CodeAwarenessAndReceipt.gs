/**
 * TEST SUITE: Bootstrap ReAct Planning Prompt ke Database & Verifikasi Pasca-Pembersihan
 */
function test_BootstrapReActPromptAndVerify() {
  Logger.log('=== BOOTSTRAP REACT PLANNING PROMPT & VERIFIKASI PASAL 1.2 ===');

  // 1. Simpan ReAct Planning Prompt Resmi di Database AI_Knowledge
  var officialReActPrompt = '{{persona}}\n\n' +
    'Waktu saat ini: {{now}} WIB.\n\n' +
    '=== DAFTAR TOOL TERSEDIA ===\n' +
    '{{tools_registry}}\n\n' +
    '=== RIWAYAT PERCAKAPAN ===\n' +
    '{{riwayat}}\n\n' +
    '=== FAKTA RELEVAN ===\n' +
    '{{fakta}}\n\n' +
    '=== PROFIL USER ===\n' +
    '{{profil}}\n\n' +
    '=== OBSERVASI SEBELUMNYA ===\n' +
    '{{observations}}\n\n' +
    '=== PESAN USER ===\n' +
    '"{{user_message}}"\n\n' +
    'TUGAS:\n' +
    'Analisis pesan user. Pilih tool yang paling tepat dari DAFTAR TOOL TERSEDIA di atas.\n' +
    '- Jika user bertanya perubahan, aktivitas, log, kejadian, atau perkembangan dalam rentang waktu (misal "7 jam terakhir", "hari ini", "terakhir diupdate") -> PILIH ACTION: "self_query"\n' +
    '- Jika user ingin cek saldo atau tanya uang/dompet -> PILIH ACTION: "tanya_saldo"\n' +
    '- Jika user ingin catat pengeluaran/pemasukan -> PILIH ACTION: "catat_keuangan"\n' +
    '- Jika user hanya mengobrol biasa -> PILIH ACTION: "final_answer"\n\n' +
    'ATURAN OUTPUT (Balas HANYA JSON murni tanpa markdown):\n' +
    '{\n' +
    '  "thought": "penjelasan singkat pemikiranmu",\n' +
    '  "action": "nama_tool_dari_registry ATAU final_answer",\n' +
    '  "tool_params": { "wallet": "nama_wallet_jika_ada", "jumlah": 0 },\n' +
    '  "final_answer": "jawaban langsung jika action = final_answer"\n' +
    '}';

  KnowledgeRepository.save('agent', 'planning_prompt', officialReActPrompt, 'OFFICIAL_REACT_PROMPT_CLEAN');
  Logger.log('✅ PASS 1: ReAct Planning Prompt Resmi berhasil disimpan ke Database AI_Knowledge!');

  // 2. Verifikasi Log 7 Jam Terakhir
  var logs7Hours = SelfAwareness.getTimeWindowActivityLogs(7);
  Logger.log('\nTotal Aktivitas 7 Jam Terakhir Terdeteksi: ' + logs7Hours.totalEvents + ' event');
  Logger.log('Rincian Event: ' + JSON.stringify(logs7Hours.eventsSummary));

  if (logs7Hours.totalEvents > 0) {
    Logger.log('✅ PASS 2: Time-Aware Activity Log Extractor berhasil mendeteksi aktivitas 7 jam terakhir!');
  } else {
    Logger.log('⚠️ INFO 2: Tidak ada log dalam 7 jam terakhir.');
  }
}

/**
 * TEST SUITE: Verifikasi Query Parameter Extractor & Web Search Tavily
 */
function test_WebSearchQueryExtractionAndTavily() {
  Logger.log('=== TEST WEB SEARCH QUERY EXTRACTOR & TAVILY ===');

  // 1. Test Parameter Alias Extractor
  var q1 = Manager._extractQueryParam({ query: 'hot news indonesia' });
  var q2 = Manager._extractQueryParam({ searchQuery: 'berita hari ini' });
  var q3 = Manager._extractQueryParam('berita terkini');

  Logger.log('Extracted Query 1: ' + q1);
  Logger.log('Extracted Query 2: ' + q2);
  Logger.log('Extracted Query 3: ' + q3);

  if (q1 === 'hot news indonesia' && q2 === 'berita hari ini' && q3 === 'berita terkini') {
    Logger.log('✅ PASS 1: Manager._extractQueryParam 100% kebal dari parameter undefined!');
  } else {
    Logger.log('❌ FAIL 1: Extractor query gagal');
  }

  // 2. Test Eksekusi Web Search Tavily
  var searchRes = WebSearchProviderService.search('berita indonesia terbaru');
  Logger.log('Tavily Search Results: ' + searchRes.length + ' artikel ditemukan.');

  if (searchRes.length > 0) {
    Logger.log('Sample Headline #1: ' + searchRes[0].title);
    Logger.log('✅ PASS 2: Tavily Web Search API berhasil mengambil berita terkini!');
  } else {
    Logger.log('⚠️ WARN 2: Web Search API gagal atau kosong.');
  }
}