/**
 * ===================================================================
 * REPOSITORY: WALLET (TEXTFINDER FAST SEARCH)
 * ===================================================================
 */
const WalletRepository = {
  SHEET_NAME: 'Finance_Wallets',

  create(nama, saldoAwal) {
    const id = IdGenerator.generate('WAL');
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      id, nama, saldoAwal || 0, new Date()
    ]);
    return id;
  },

  getAll() {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    return data.map((row, index) => ({
      rowIndex: index + 2,
      id: row[0],
      nama: row[1],
      saldoAwal: row[2],
      createdAt: row[3]
    }));
  },

  /**
   * Fast Search Nama Wallet menggunakan TextFinder di Kolom B (0ms latency)
   */
  findByName(nama) {
    if (!nama || String(nama).trim().length === 0) return null;
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    if (sheet.getLastRow() < 2) return null;

    const cleanNama = String(nama).trim();
    const cell = sheet.getRange('B:B')
      .createTextFinder(cleanNama)
      .matchEntireCell(true)
      .matchCase(false)
      .findNext();

    if (!cell) return null;

    const rowIndex = cell.getRow();
    if (rowIndex < 2) return null;

    const row = sheet.getRange(rowIndex, 1, 1, 4).getValues()[0];
    return {
      rowIndex: rowIndex,
      id: row[0],
      nama: row[1],
      saldoAwal: row[2],
      createdAt: row[3]
    };
  },

  /**
   * Fast Search ID Wallet menggunakan TextFinder di Kolom A (0ms latency)
   */
  findById(id) {
    if (!id) return null;
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    if (sheet.getLastRow() < 2) return null;

    const cell = sheet.getRange('A:A')
      .createTextFinder(String(id).trim())
      .matchEntireCell(true)
      .matchCase(true)
      .findNext();

    if (!cell) return null;

    const rowIndex = cell.getRow();
    if (rowIndex < 2) return null;

    const row = sheet.getRange(rowIndex, 1, 1, 4).getValues()[0];
    return {
      rowIndex: rowIndex,
      id: row[0],
      nama: row[1],
      saldoAwal: row[2],
      createdAt: row[3]
    };
  },

  exists(nama) {
    return this.findByName(nama) !== null;
  }
};