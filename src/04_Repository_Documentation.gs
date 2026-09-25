/**
 * ===================================================================
 * REPOSITORY: DOCUMENTATION
 * Tanggung jawab: baca konten dokumentasi (ARCHITECTURE.md,
 * PROGRESS.md) yang disimpan di Sheet, untuk dibackup ke GitHub.
 * Sheet dipilih (bukan hardcode di .gs) supaya mudah diedit tanpa
 * risiko merusak sintaks kode saat copy-paste teks panjang.
 * ===================================================================
 */
const DocumentationRepository = {
  SHEET_NAME: 'Documentation',

  getAll() {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    return data
      .filter(row => row[0] && row[1])
      .map(row => ({ fileName: row[0], content: row[1] }));
  },

  getAllWithMeta() {
    var sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    var maxCol = sheet.getLastColumn();
    var data = sheet.getRange(2, 1, lastRow - 1, maxCol).getValues();
    return data
      .filter(function(row) { return row[0] && row[1]; })
      .map(function(row) {
        return {
          fileName: row[0],
          content: row[1],
          sha: row[2] || null,
          lastSyncedAt: row[3] || null,
          fileType: row[4] || null
        };
      });
  },

  upsert(fileName, content, sha, fileType) {
    var sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    var lastRow = sheet.getLastRow();
    var now = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());

    if (lastRow >= 2) {
      var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < data.length; i++) {
        if (data[i][0] === fileName) {
          var rowIndex = i + 2;
          sheet.getRange(rowIndex, 2).setValue(content);
          sheet.getRange(rowIndex, 3).setValue(sha || '');
          sheet.getRange(rowIndex, 4).setValue(now);
          sheet.getRange(rowIndex, 5).setValue(fileType || 'md');
          return;
        }
      }
    }

    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      fileName, content, sha || '', now, fileType || 'md'
    ]);
  },

  ensureHeaders() {
    var sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    var headers = ['fileName', 'content', 'sha', 'lastSyncedAt', 'fileType'];
    var lastCol = sheet.getLastColumn();
    if (lastCol < headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
};