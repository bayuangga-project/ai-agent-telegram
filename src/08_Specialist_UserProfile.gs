/**
 * SPECIALIST: USER PROFILE
 * Tanggung jawab: menyimpan dan mengelola profil user secara otomatis.
 * Data diekstrak oleh LLM dari percakapan sehari-hari.
 */
var UserProfileSpecialist = {

  /**
   * Simpan atau update profile entries dari LLM.
   * @param {array} updates - Array of { key, value, category }
   */
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

  /**
   * Ambil semua profil aktif untuk dimasukkan ke prompt LLM.
   * @param {number} maxItems - jumlah maksimal
   * @returns {array} Array of string
   */
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

      // Ambil yang paling baru (baris terakhir)
      if (profiles.length > maxItems) {
        profiles = profiles.slice(profiles.length - maxItems);
      }

      return profiles;
    } catch (e) {
      AppLogger.error('USER_PROFILE_READ_FAIL', e.message);
      return [];
    }
  },

  /**
   * Ambil profil berdasarkan kategori.
   * @param {string} category - misal 'goal', 'preference', 'schedule'
   * @returns {array}
   */
  getByCategory: function(category) {
    try {
      var sheet = SpreadsheetGateway.getSheet('User_Profile');
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
   * Internal: Insert atau update satu profile entry.
   * Jika key sudah ada, update value-nya. Jika belum, insert baru.
   */
  _upsertProfile: function(key, value, category) {
    try {
      var sheet = SpreadsheetGateway.getSheet('User_Profile');
      var data = sheet.getDataRange().getValues();
      var timestamp = DateTimeUtils.nowWIB();

      // Cek apakah key sudah ada
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          // Update existing
          sheet.getRange(i + 1, 2).setValue(value);
          sheet.getRange(i + 1, 3).setValue(category);
          sheet.getRange(i + 1, 4).setValue(0.8);
          sheet.getRange(i + 1, 5).setValue(timestamp);
          AppLogger.info('USER_PROFILE_UPDATE', key + ' = ' + value);
          return;
        }
      }

      // Insert baru
      SpreadsheetGateway.appendRowSafe('User_Profile', [
        key, value, category, 0.8, timestamp
      ]);
      AppLogger.info('USER_PROFILE_INSERT', key + ' = ' + value);

    } catch (e) {
      AppLogger.error('USER_PROFILE_SAVE_FAIL', e.message);
    }
  }
};