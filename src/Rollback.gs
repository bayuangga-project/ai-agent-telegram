/**
 * ===================================================================
 * UTILITY DARURAT: ROLLBACK SYSTEM
 * Membaca repository GitHub dan menimpa Apps Script via API.
 * Menggunakan kredensial Script Properties dan penanganan defensif.
 * ===================================================================
 */
function rollbackFromGitHub() {
  const scriptId = ScriptApp.getScriptId();
  const config = Config.load();

  if (!config.githubRepoOwner || !config.githubRepoName) {
    Logger.log('ROLLBACK_FAILED: GITHUB_REPO_OWNER_OR_NAME_MISSING');
    return;
  }

  // 1. Ambil daftar file dari GitHub
  const files = _getRollbackFilesFromGitHub(config);

  if (!files || files.length === 0) {
    Logger.log('ROLLBACK_ABORTED: NO_FILES_FOUND_OR_FETCH_ERROR');
    return;
  }

  // 2. Timpa (overwrite) kode di GAS via Apps Script API
  const url = 'https://script.googleapis.com/v1/projects/' + scriptId + '/content';
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
    Logger.log('ROLLBACK_SUCCESS: FILES_OVERWRITTEN_' + files.length);
  } else {
    Logger.log('ROLLBACK_API_ERROR: HTTP_' + responseCode + ' -> ' + response.getContentText().substring(0, 300));
  }
}

function _getRollbackFilesFromGitHub(config) {
  const branch = config.githubBranch || 'main';
  const treeUrl = 'https://api.github.com/repos/' + config.githubRepoOwner + '/' + config.githubRepoName + '/git/trees/' + branch + '?recursive=1';

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GAS-Rollback-Service'
  };

  if (config.githubToken) {
    headers['Authorization'] = 'token ' + config.githubToken;
  }

  const res = UrlFetchApp.fetch(treeUrl, { headers: headers, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    Logger.log('ROLLBACK_TREE_FETCH_FAIL: HTTP_' + res.getResponseCode());
    return null;
  }

  const treeData = JSON.parse(res.getContentText());
  if (!treeData.tree || !Array.isArray(treeData.tree)) return null;

  const files = [];

  for (let i = 0; i < treeData.tree.length; i++) {
    const item = treeData.tree[i];
    if (item.type !== 'blob') continue;

    let type = null;
    let name = null;

    if (item.path.endsWith('.gs') || item.path.endsWith('.js')) {
      type = 'SERVER_JS';
      name = item.path.replace(/^(src\/)?/, '').replace(/\.(gs|js)$/, '');
    } else if (item.path.endsWith('.html')) {
      type = 'HTML';
      name = item.path.replace(/^(src\/)?/, '').replace(/\.html$/, '');
    } else if (item.path === 'appsscript.json' || item.path === 'src/appsscript.json') {
      type = 'JSON';
      name = 'appsscript';
    }

    if (type && name) {
      const rawUrl = 'https://raw.githubusercontent.com/' + config.githubRepoOwner + '/' + config.githubRepoName + '/' + branch + '/' + item.path;
      const fileRes = UrlFetchApp.fetch(rawUrl, { headers: headers, muteHttpExceptions: true });

      // Validasi ketat: jangan terima file jika bukan HTTP 200 (mencegah HTML error menimpa script)
      if (fileRes.getResponseCode() !== 200) {
        Logger.log('ROLLBACK_FILE_FETCH_REJECTED: ' + item.path + ' (HTTP ' + fileRes.getResponseCode() + ')');
        return null; // Batalkan seluruh rollback jika ada satu file yang korup/gagal
      }

      files.push({
        name: name,
        type: type,
        source: fileRes.getContentText()
      });
    }
  }

  return files;
}