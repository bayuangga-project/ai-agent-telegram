/**
 * SERVICE: GITHUB OPS
 * Tanggung jawab: operasi read/write ke repository GitHub.
 * Digunakan oleh SelfHealingSpecialist untuk membaca source code
 * dan mengcommit perbaikan.
 */
var GitHubOpsService = {

  _getHeaders: function() {
    var config = Config.load();
    return {
      'Authorization': 'Bearer ' + config.githubToken,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ai-agent-telegram'
    };
  },

  _getRepoUrl: function() {
    var config = Config.load();
    return 'https://api.github.com/repos/' +
           config.githubRepoOwner + '/' +
           config.githubRepoName;
  },

  _encodePath: function(path) {
    if (!path) return '';
    return path.split('/').map(function(segment) {
      return encodeURIComponent(segment);
    }).join('/');
  },

  readFile: function(path, ref) {
    var config = Config.load();
    var branch = ref || config.githubBranch || 'main';
    var url = this._getRepoUrl() + '/contents/' +
              this._encodePath(path) + '?ref=' + branch;

    try {
      var response = UrlFetchApp.fetch(url, {
        headers: this._getHeaders(),
        muteHttpExceptions: true
      });

      var data = JSON.parse(response.getContentText());

      if (response.getResponseCode() === 200 && data.content) {
        var decoded = Utilities.newBlob(
          Utilities.base64Decode(data.content)
        ).getDataAsString();

        return {
          content: decoded,
          sha: data.sha,
          path: data.path
        };
      }

      AppLogger.error('GITHUB_READ_FAIL',
        'Path: ' + path + ' HTTP ' + response.getResponseCode());
      return null;

    } catch (e) {
      AppLogger.error('GITHUB_READ_ERROR', e.message);
      return null;
    }
  },

  listDirectory: function(path) {
    var config = Config.load();
    var url = this._getRepoUrl() + '/contents/' +
              this._encodePath(path) + '?ref=' +
              (config.githubBranch || 'main');

    try {
      var response = UrlFetchApp.fetch(url, {
        headers: this._getHeaders(),
        muteHttpExceptions: true
      });

      var data = JSON.parse(response.getContentText());

      if (response.getResponseCode() === 200 && Array.isArray(data)) {
        return data.map(function(item) {
          return {
            name: item.name,
            path: item.path,
            type: item.type,
            sha: item.sha
          };
        });
      }

      return [];
    } catch (e) {
      AppLogger.error('GITHUB_LIST_ERROR', e.message);
      return [];
    }
  },

  readAllSourceFiles: function() {
    var files = this.listDirectory('src');
    var result = {};
    var self = this;

    files.forEach(function(file) {
      if (file.type === 'file' && file.name.indexOf('.gs') !== -1) {
        var fileData = self.readFile(file.path);
        if (fileData) {
          result[file.name] = {
            content: fileData.content,
            sha: fileData.sha
          };
        }
      }
    });

    return result;
  },

  createBranch: function(branchName) {
    var config = Config.load();
    var baseBranch = config.githubBranch || 'main';

    try {
      var refUrl = this._getRepoUrl() + '/git/ref/heads/' + baseBranch;
      var refResponse = UrlFetchApp.fetch(refUrl, {
        headers: this._getHeaders(),
        muteHttpExceptions: true
      });
      var refData = JSON.parse(refResponse.getContentText());

      if (!refData.object || !refData.object.sha) {
        AppLogger.error('GITHUB_BRANCH_FAIL', 'Cannot get base SHA');
        return false;
      }

      var baseSha = refData.object.sha;
      var createUrl = this._getRepoUrl() + '/git/refs';
      var createResponse = UrlFetchApp.fetch(createUrl, {
        method: 'post',
        headers: this._getHeaders(),
        payload: JSON.stringify({
          ref: 'refs/heads/' + branchName,
          sha: baseSha
        }),
        muteHttpExceptions: true
      });

      var createData = JSON.parse(createResponse.getContentText());

      if (createResponse.getResponseCode() === 201) {
        AppLogger.info('GITHUB_BRANCH_CREATED', branchName);
        return true;
      }

      if (createData.message &&
          createData.message.indexOf('already exists') !== -1) {
        AppLogger.info('GITHUB_BRANCH_EXISTS', branchName);
        return true;
      }

      AppLogger.error('GITHUB_BRANCH_FAIL',
        createData.message || 'unknown');
      return false;

    } catch (e) {
      AppLogger.error('GITHUB_BRANCH_ERROR', e.message);
      return false;
    }
  },

  commitFile: function(path, content, message, branch, sha) {
    var url = this._getRepoUrl() + '/contents/' +
              this._encodePath(path);
    var config = Config.load();
    var targetBranch = branch || config.githubBranch || 'main';

    var payload = {
      message: message,
      content: Utilities.base64Encode(content),
      branch: targetBranch
    };

    if (sha) {
      payload.sha = sha;
    }

    try {
      var response = UrlFetchApp.fetch(url, {
        method: 'put',
        headers: this._getHeaders(),
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      var data = JSON.parse(response.getContentText());

      if (response.getResponseCode() === 200 ||
          response.getResponseCode() === 201) {
        AppLogger.info('GITHUB_COMMIT_SUCCESS',
          path + ' -> ' + targetBranch);
        return true;
      }

      AppLogger.error('GITHUB_COMMIT_FAIL',
        path + ' | ' + (data.message || 'unknown'));
      return false;

    } catch (e) {
      AppLogger.error('GITHUB_COMMIT_ERROR', e.message);
      return false;
    }
  },

  createPullRequest: function(title, body, head, base) {
    var config = Config.load();
    var targetBase = base || config.githubBranch || 'main';
    var url = this._getRepoUrl() + '/pulls';

    try {
      var response = UrlFetchApp.fetch(url, {
        method: 'post',
        headers: this._getHeaders(),
        payload: JSON.stringify({
          title: title,
          body: body,
          head: head,
          base: targetBase
        }),
        muteHttpExceptions: true
      });

      var data = JSON.parse(response.getContentText());

      if (response.getResponseCode() === 201 && data.html_url) {
        AppLogger.info('GITHUB_PR_CREATED', data.html_url);
        return data.html_url;
      }

      AppLogger.error('GITHUB_PR_FAIL', data.message || 'unknown');
      return null;

    } catch (e) {
      AppLogger.error('GITHUB_PR_ERROR', e.message);
      return null;
    }
  },

  readDocFile: function(fileName) {
    return this.readFile(fileName);
  },

  updateDocFile: function(fileName, newContent, commitMessage) {
    var existing = this.readDocFile(fileName);
    var sha = existing ? existing.sha : null;
    var config = Config.load();

    var ok = this.commitFile(
      fileName, newContent, commitMessage,
      config.githubBranch || 'main', sha
    );

    if (ok) {
      try {
        var docSheet = SpreadsheetGateway.getSheet('Documentation');
        var data = docSheet.getDataRange().getValues();
        var found = false;

        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === fileName) {
            docSheet.getRange(i + 1, 2).setValue(newContent);
            found = true;
            break;
          }
        }

        if (!found) {
          SpreadsheetGateway.appendRowSafe('Documentation',
            [fileName, newContent]);
        }
      } catch (e) {
        AppLogger.error('DOC_SHEET_SYNC_FAIL', e.message);
      }
    }

    return ok;
  }
};