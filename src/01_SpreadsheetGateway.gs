/**
 * ===================================================================
 * SPREADSHEET GATEWAY
 * ===================================================================
 */
const SpreadsheetGateway = {
  _spreadsheet: null,
  _sheets: {},

  getSpreadsheet() {
    if (!this._spreadsheet) {
      this._spreadsheet = SpreadsheetApp.openById(Config.load().spreadsheetId);
    }
    return this._spreadsheet;
  },

  getSheet(sheetName) {
    if (!this._sheets[sheetName]) {
      const sheet = this.getSpreadsheet().getSheetByName(sheetName);
      if (!sheet) throw new Error('Sheet tidak ditemukan: ' + sheetName);
      this._sheets[sheetName] = sheet;
    }
    return this._sheets[sheetName];
  },

  /**
   * Method ini WAJIB dipakai untuk mencegah error kuota Google Sheets
   * "Service invoked too many times for one second". 
   * Jika gagal, akan otomatis mencoba ulang sampai 3x.
   */
  appendRowSafe(sheetName, rowData) {
    const sheet = this.getSheet(sheetName);
    let retries = 3;
    while (retries > 0) {
      try {
        sheet.appendRow(rowData);
        return; // Sukses, keluar dari loop
      } catch (e) {
        retries--;
        if (retries === 0) throw e; // Gagal total setelah 3 percobaan
        Utilities.sleep(1500); // Tunggu 1.5 detik, beri nafas ke API Google
      }
    }
  }
};