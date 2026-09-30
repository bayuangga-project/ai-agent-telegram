/**
 * SPECIALIST: USER PROFILE (TEXTFINDER FAST UPSERT)
 * Tanggung jawab: menyimpan dan mengelola profil user secara otomatis.
 * Data diekstrak oleh LLM dari percakapan sehari-hari.
 */
var UserProfileSpecialist = {

  saveUpdates: function(updates) {
    if (!updates || !Array.isArray(updates) || updates.length === 0) return;

    var self = this;
    updates.forEach(function(update) {
      if (!update.key || !update.value) return;
      self._upsertProfile(
        update.key,
        update.value,
        update.category || 'general'
      );
    });
  },

  getProfileForPrompt: function(maxItems) {
    try {
      var sheet = SpreadsheetGateway.getSheet('User_Profile');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      var profiles = [];
      for (var i = 1; i < data.length; i++) {
        var key = data[i][0];
        var value = data[i][1];
        var category = data[i][2];
        if (key && value) {
          profiles.push('[' + category + '] ' + key + ': ' + value);
        }
      }

      if (profiles.length > maxItems) {
        profiles = profiles.slice(profiles.length - maxItems);
      }

      return profiles;
    } catch (e) {
      AppLogger.error('USER_PROFILE_READ_FAIL', e.message);
      return [];
    }
  },

  getByCategory: function(category) {
    try {
      var sheet = SpreadsheetGateway.getSheet('User_Profile');
      if (sheet.getLastRow() < 2) return [];

      var cell = sheet.getRange('C:C')
        .createTextFinder(String(category).trim())
        .matchEntireCell(true)
        .matchCase(false)
        .findNext();

      if (!cell) return [];

      var data = sheet.getDataRange().getValues();
      var results = [];

      for (var i = 1; i < data.length; i++) {
        if (data[i][2] === category && data[i][0] && data[i][1]) {
          results.push({
            key: data[i][0],
            value: data[i][1],
            category: data[i][2],
            confidence: data[i][3],
            lastUpdated: data[i][4]
          });
        }
      }
      return results;
    } catch (e) {
      return [];
    }
  },

  /**
   * Fast Upsert Profile menggunakan TextFinder di Kolom A (0ms latency)
   * Dilengkapi LockService untuk write safety.
   */
  _upsertProfile: function(key, value, category) {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = SpreadsheetGateway.getSheet('User_Profile');
      var timestamp = DateTimeUtils.nowWIB();
      var cleanKey = String(key).trim();

      if (sheet.getLastRow() >= 2) {
        var cell = sheet.getRange('A:A')
          .createTextFinder(cleanKey)
          .matchEntireCell(true)
          .matchCase(true)
          .findNext();

        if (cell) {
          var rowIndex = cell.getRow();
          if (rowIndex >= 2) {
            sheet.getRange(rowIndex, 2).setValue(value);
            sheet.getRange(rowIndex, 3).setValue(category);
            sheet.getRange(rowIndex, 4).setValue(0.8);
            sheet.getRange(rowIndex, 5).setValue(timestamp);
            AppLogger.info('USER_PROFILE_UPDATE', cleanKey + ' = ' + value);
            return;
          }
        }
      }

      SpreadsheetGateway.appendRowSafe('User_Profile', [
        cleanKey, value, category, 0.8, timestamp
      ]);
      AppLogger.info('USER_PROFILE_INSERT', cleanKey + ' = ' + value);

    } catch (e) {
      AppLogger.error('USER_PROFILE_SAVE_FAIL', e.message);
    } finally {
      lock.releaseLock();
    }
  }
};