/**
 * ===================================================================
 * SERVICE: GITHUB BACKUP (WITH AUTO-DELETE SYNC & SAFETY GUARD)
 * Tanggung jawab: Backup otomatis source code & docs dari GAS ke GitHub.
 * Otomatis menghapus file di GitHub yang sudah dihapus di GAS Editor.
 * ===================================================================
 */
const GitHubBackupService = {
  APPS_SCRIPT_API_BASE: 'https://script.googleapis.com/v1/projects/',
  GITHUB_API_BASE: 'https://api.github.com/repos/',
  MIN_LOCAL_FILES_SAFETY_THRESHOLD: 30, // Guard 1: Batas minimal file lokal agar delete sync diizinkan

  backupAllFiles() {
    const config = this._loadGitHubConfig();
    const files = this._fetchOwnSourceFiles();
    
    // SAFETY GUARD: Jika file lokal < 30, batalkan untuk mencegah kecelakaan terhapusnya repo
    if (!files || files.length < this.MIN_LOCAL_FILES_SAFETY_THRESHOLD) {
      AppLogger.error('GITHUB_BACKUP_ABORT', 'Safety Guard Triggered: File lokal terlalu sedikit (' + (files ? files.length : 0) + ' < ' + this.MIN_LOCAL_FILES_SAFETY_THRESHOLD + ')');
      return [{ path: 'ALL', status: 'ABORTED_SAFETY_GUARD' }];
    }

    const results = [];
    const localPaths = [];

    // 1. Push / Update file lokal ke GitHub
    files.forEach(file => {
      const path = this._resolveFilePath(file);
      localPaths.push(path);
      try {
        this._pushFileToGitHub(config, path, file.source);
        results.push({ path: path, status: 'OK' });
        AppLogger.info('GITHUB_BACKUP_FILE_OK', path);
      } catch (err) {
        results.push({ path: path, status: 'FAILED: ' + err.message });
        AppLogger.error('GITHUB_BACKUP_FILE_FAILED', path + ': ' + err.message);
      }
      Utilities.sleep(200);
    });

    // 2. Deteksi & Hapus file Yatim di GitHub (File yang sudah dihapus di GAS)
    this._syncDeletedFilesToGitHub(config, localPaths, results);

    return results;
  },

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
      Utilities.sleep(200);
    });

    return results;
  },

  _syncDeletedFilesToGitHub(config, localPaths, results) {
    try {
      const githubSrcFiles = GitHubOpsService.listDirectory('src');
      if (!githubSrcFiles || !Array.isArray(githubSrcFiles)) return;

      githubSrcFiles.forEach(ghFile => {
        if (ghFile.type === 'file') {
          const ghPath = ghFile.path;
          
          // Jika file di GitHub TIDAK ADA di daftar file lokal GAS -> Hapus dari GitHub!
          if (localPaths.indexOf(ghPath) === -1) {
            var deletedOk = this._deleteFileFromGitHub(config, ghPath, ghFile.sha);
            if (deletedOk) {
              results.push({ path: ghPath, status: 'DELETED_FROM_GITHUB' });
              AppLogger.info('GITHUB_BACKUP_FILE_DELETED', ghPath);
            }
          }
        }
      });
    } catch (e) {
      AppLogger.warning('GITHUB_BACKUP_DELETE_SYNC_WARN', e.message);
    }
  },

  _deleteFileFromGitHub(config, path, sha) {
    const url = this.GITHUB_API_BASE + config.owner + '/' + config.repo + '/contents/' + path;
    const payload = {
      message: 'Auto cleanup dari GAS — file dihapus di editor',
      sha: sha,
      branch: config.branch
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'delete',
      contentType: 'application/json',
      headers: {
        Authorization: 'token ' + config.token,
        Accept: 'application/vnd.github+json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    return response.getResponseCode() === 200;
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
      message: 'Auto backup dari GAS — ' + new Date().toISOString(),
      content: Utilities.base64Encode(Utilities.newBlob(content, "text/plain", "UTF-8").getBytes()),
      branch: config.branch
    };
    if (existingSha) payload.sha = existingSha;

    const response = UrlFetchApp.fetch(url, {
      method: 'put',
      contentType: 'application/json',
      headers: {
        Authorization: 'token ' + config.token,
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
        Authorization: 'token ' + config.token,
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