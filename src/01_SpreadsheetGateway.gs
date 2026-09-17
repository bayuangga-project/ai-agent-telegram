/**
 * ===================================================================
 * SPREADSHEET GATEWAY
 * Lapisan akses Google Sheets terpusat dengan safe lock.
 * ===================================================================
 */
const SpreadsheetGateway = {
  _spreadsheet: null,
  _sheets: {},

  getSpreadsheet() {
    if (this._spreadsheet) return this._spreadsheet;
    var id = Config.load().spreadsheetId;
    if (!id) throw new Error('SPREADSHEET_ID_MISSING');
    this._spreadsheet = SpreadsheetApp.openById(id);
    return this._spreadsheet;
  },

  getSheet(sheetName) {
    if (this._sheets[sheetName]) return this._sheets[sheetName];
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error('SHEET_NOT_FOUND:' + sheetName);
    this._sheets[sheetName] = sheet;
    return sheet;
  },

  appendRowSafe(sheetName, rowData) {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = this.getSheet(sheetName);
      sheet.appendRow(rowData);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  },

  ensureSheet(sheetName, headers) {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (headers && headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
      AppLogger.info('SHEET_CREATED', sheetName);
    }
    return sheet;
  }
};