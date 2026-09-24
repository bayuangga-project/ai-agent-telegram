/**
 * ===================================================================
 * REPOSITORY: BUDGET
 * ===================================================================
 */
const BudgetRepository = {
  SHEET_NAME: 'Finance_Budgets',

  create(kategori, batasJumlah, periode) {
    const id = IdGenerator.generate('BUD');
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      id, kategori, batasJumlah, periode, new Date()
    ]);
    return id;
  },

  getAll() {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    return data.map((row, index) => ({
      rowIndex: index + 2,
      _rowIndex: index + 2, // Solusi defensif untuk ketidaksesuaian pemanggilan _rowIndex
      id: row[0],
      kategori: row[1],
      batasJumlah: row[2],
      periode: this._normalizePeriode(row[3]),
      createdAt: row[4]
    }));
  },

  /**
   * Google Sheets kadang auto-convert string "yyyy-MM" jadi Date object
   * saat ditulis. Method ini menormalisasi kembali ke string konsisten,
   * supaya perbandingan periode selalu akurat terlepas dari bagaimana
   * Sheets menyimpannya secara internal.
   */
  _normalizePeriode(value) {
    if (value instanceof Date) {
      return DateTimeUtils.formatPeriode(value);
    }
    return value;
  },

  findByKategoriAndPeriode(kategori, periode) {
    return this.getAll().find(b => b.kategori === kategori && b.periode === periode) || null;
  },

  getByPeriode(periode) {
    return this.getAll().filter(b => b.periode === periode);
  },

  updateBatasJumlah(rowIndex, batasJumlahBaru) {
    SpreadsheetGateway.getSheet(this.SHEET_NAME).getRange(rowIndex, 3).setValue(batasJumlahBaru);
  }
};