/**
 * ===================================================================
 * SERVICE: GITHUB BACKUP
 * Tanggung jawab: baca source code project GAS ini sendiri (via Apps
 * Script API), lalu push ke repo GitHub (via GitHub REST API).
 * Juga bisa backup dokumentasi (ARCHITECTURE.md, PROGRESS.md) yang
 * disimpan di Sheet "Documentation".
 * Berjalan 100% di GAS, tidak butuh local computer.
 * ===================================================================
 */
const GitHubBackupService = {
  APPS_SCRIPT_API_BASE: 'https://script.googleapis.com/v1/projects/**',
  GITHUB_API_BASE: 'https://api.github.com/repos/**',

  backupAllFiles() {
    const config = this._loadGitHubConfig();
    const files = this._fetchOwnSourceFiles();
    const results = [];

    files.forEach(file => {
      const path = this._resolveFilePath(file);
      try {
        this._pushFileToGitHub(config, path, file.source);
        results.push({ path: path, status: 'OK' });
        AppLogger.info('GITHUB_BACKUP_FILE_OK', path);
      } catch (err) {
        results.push({ path: path, status: 'FAILED: ' + err.message });
        AppLogger.error('GITHUB_BACKUP_FILE_FAILED', path + ': ' + err.message);
      }
      Utilities.sleep(400);
    });

    return results;
  },

  /**
   * Push isi dokumentasi (ARCHITECTURE.md, PROGRESS.md) dari Sheet
   * "Documentation" ke root repo GitHub (bukan folder src/).
   */
  backupDocs() {
    const config = this._loadGitHubConfig();
    const docs = DocumentationRepository.getAll();
    const results = [];

    if (docs.length === 0) {
      AppLogger.warning('GITHUB_BACKUP_DOCS_EMPTY', 'Sheet Documentation kosong');
      return results;
    }

    docs.forEach(doc => {
      try {
        this._pushFileToGitHub(config, doc.fileName, doc.content);
        results.push({ path: doc.fileName, status: 'OK' });
        AppLogger.info('GITHUB_BACKUP_DOC_OK', doc.fileName);
      } catch (err) {
        results.push({ path: doc.fileName, status: 'FAILED: ' + err.message });
        AppLogger.error('GITHUB_BACKUP_DOC_FAILED', doc.fileName + ': ' + err.message);
      }
      Utilities.sleep(400);
    });

    return results;
  },

  _loadGitHubConfig() {
    const props = PropertiesService.getScriptProperties();
    const config = {
      token: props.getProperty('GITHUB_TOKEN'),
      owner: props.getProperty('GITHUB_REPO_OWNER'),
      repo: props.getProperty('GITHUB_REPO_NAME'),
      branch: props.getProperty('GITHUB_BRANCH') || 'main'
    };
    if (!config.token || !config.owner || !config.repo) {
      throw new Error('GitHub config belum lengkap di Script Properties');
    }
    return config;
  },

  _fetchOwnSourceFiles() {
    const scriptId = ScriptApp.getScriptId();
    const url = this.APPS_SCRIPT_API_BASE + scriptId + '/content';
    const token = ScriptApp.getOAuthToken();

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code !== 200) {
      throw new Error('Gagal ambil source sendiri (HTTP ' + code + '): ' +
        response.getContentText().substring(0, 300));
    }

    const data = JSON.parse(response.getContentText());
    return data.files || [];
  },

  _resolveFilePath(file) {
    if (file.type === 'JSON') return 'src/appsscript.json';
    if (file.type === 'SERVER_JS') return 'src/' + file.name + '.gs';
    return 'src/' + file.name + '.txt';
  },

  _pushFileToGitHub(config, path, content) {
    const url = this.GITHUB_API_BASE + config.owner + '/' + config.repo + '/contents/' + path;
    const existingSha = this._getExistingFileSha(config, url);

    const payload = {
      message: 'Auto backup dari GAS ? ' + new Date().toISOString(),
      content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
      branch: config.branch
    };
    if (existingSha) payload.sha = existingSha;

    const response = UrlFetchApp.fetch(url, {
      method: 'put',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + config.token,
        Accept: 'application/vnd.github+json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code !== 200 && code !== 201) {
      throw new Error('GitHub PUT gagal (HTTP ' + code + '): ' +
        response.getContentText().substring(0, 300));
    }
  },

  _getExistingFileSha(config, url) {
    const response = UrlFetchApp.fetch(url + '?ref=' + config.branch, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + config.token,
        Accept: 'application/vnd.github+json'
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText()).sha;
    }
    return null;
  }
};

/**
 * Backup lengkap: source code + dokumentasi, sekali jalan.
 * Jalankan fungsi ini dari dropdown GAS setiap mau backup manual.
 */
function runFullBackup() {
  Logger.log('--- Backup Source Code ---');
  const codeResults = GitHubBackupService.backupAllFiles();
  codeResults.forEach(r => Logger.log(r.path + ' -> ' + r.status));

  Logger.log('--- Backup Dokumentasi ---');
  const docsResults = GitHubBackupService.backupDocs();
  docsResults.forEach(r => Logger.log(r.path + ' -> ' + r.status));

  Logger.log('=== FULL BACKUP SELESAI: ' +
    (codeResults.length + docsResults.length) + ' file diproses ===');
}

/**
 * Jalankan fungsi ini SEKALI SAJA untuk mengaktifkan backup otomatis
 * setiap hari jam 23:00. Opsional ? boleh diabaikan kalau mau backup
 * manual saja.
 */
function setupDailyBackupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runFullBackup') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('runFullBackup')
    .timeBased()
    .everyDays(1)
    .atHour(23)
    .create();
  Logger.log('Trigger backup harian berhasil dibuat (jam 23:00)!');
}