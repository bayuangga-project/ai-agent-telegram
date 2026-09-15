/**
 * ===================================================================
 * REPOSITORY: WALLET
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

  findByName(nama) {
    const lowerNama = nama.toLowerCase().trim();
    return this.getAll().find(w => w.nama.toLowerCase().trim() === lowerNama) || null;
  },

  findById(id) {
    return this.getAll().find(w => w.id === id) || null;
  },

  exists(nama) {
    return this.findByName(nama) !== null;
  }
};