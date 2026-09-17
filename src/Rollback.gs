// ==================== KONFIGURASI ====================
const CONFIG = {
  GITHUB_USERNAME: 'bayuangga-project',   // Ganti dengan username GitHub Anda
  GITHUB_REPO:     'ai-agent-telegram',         // Ganti dengan nama repository
  GITHUB_BRANCH:   'main',                   // Branch (biasanya 'main' atau 'master')
  
  // Isi TOKEN jika repo Anda PRIVATE. Jika repo PUBLIC, biarkan KOSONG ('')
  // Cara buat token: GitHub -> Settings -> Developer Settings -> Personal Access Tokens (Classic) -> centang 'repo'
  GITHUB_TOKEN:    '' 
};
// ====================================================

function rollbackFromGitHub() {
  const scriptId = ScriptApp.getScriptId();
  Logger.log(`🔄 Memulai proses rollback untuk Script ID: ${scriptId}`);
  
  // 1. Ambil daftar file dari GitHub
  const files = getFilesFromGitHub();
  
  if (!files || files.length === 0) {
    Logger.log('❌ Gagal: Tidak ada file yang ditemukan di GitHub.');
    return;
  }
  
  Logger.log(`📦 Ditemukan ${files.length} file di GitHub. Menimpa kode di GAS...`);

  // 2. Timpa (overwrite) kode di GAS via Apps Script API
  const url = `https://script.googleapis.com/v1/projects/${scriptId}/content`;
  const options = {
    method: 'PUT',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    payload: JSON.stringify({ files: files }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode === 200) {
    Logger.log('==================================================');
    Logger.log('✅ ROLLBACK BERHASIL!');
    Logger.log('👉 Silakan REFRESH browser Anda (Tekan F5) untuk melihat kode terbaru.');
    Logger.log('==================================================');
  } else {
    Logger.log(`❌ Gagal menimpa code (Error ${responseCode}): ${response.getContentText()}`);
  }
}

// Fungsi pembantu untuk membaca seluruh file dari GitHub
function getFilesFromGitHub() {
  const treeUrl = `https://api.github.com/repos/${CONFIG.GITHUB_USERNAME}/${CONFIG.GITHUB_REPO}/git/trees/${CONFIG.GITHUB_BRANCH}?recursive=1`;
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GAS-Rollback'
  };
  
  if (CONFIG.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${CONFIG.GITHUB_TOKEN}`;
  }

  const res = UrlFetchApp.fetch(treeUrl, { headers: headers, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    Logger.log(`Error fetch GitHub tree: ${res.getContentText()}`);
    return null;
  }

  const treeData = JSON.parse(res.getContentText());
  const files = [];

  treeData.tree.forEach(item => {
    // Hanya proses file .gs, .js, .html, dan appsscript.json
    if (item.type === 'blob') {
      let type = null;
      let name = null;

      if (item.path.endsWith('.gs') || item.path.endsWith('.js')) {
        type = 'SERVER_JS';
        name = item.path.replace(/\.(gs|js)$/, '');
      } else if (item.path.endsWith('.html')) {
        type = 'HTML';
        name = item.path.replace(/\.html$/, '');
      } else if (item.path === 'appsscript.json') {
        type = 'JSON';
        name = 'appsscript';
      }

      if (type && name) {
        // Ambil isi teks file dari GitHub
        const rawUrl = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/${item.path}`;
        const fileContent = UrlFetchApp.fetch(rawUrl, { headers: headers }).getContentText();
        
        files.push({
          name: name,
          type: type,
          source: fileContent
        });
        Logger.log(`  -> Berhasil fetch: ${item.path}`);
      }
    }
  });

  return files;
}