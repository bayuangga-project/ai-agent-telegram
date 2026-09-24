/**
 * ===================================================================
 * REPOSITORY: FINANCE TRANSACTION
 * ===================================================================
 */
const TransactionRepository = {
  SHEET_NAME: 'Finance_Transactions',
  STATUS_ACTIVE: 'active',
  STATUS_DELETED: 'deleted',
  TIPE_INCOME: 'income',
  TIPE_EXPENSE: 'expense',

  COL: {
    ID: 1, TIMESTAMP: 2, WALLET_ID: 3, TANGGAL_TRANSAKSI: 4,
    TIPE: 5, KATEGORI: 6, JUMLAH: 7, DESKRIPSI: 8, STATUS: 9
  },

  create(data) {
    const id = IdGenerator.generate('TRX');
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      id, new Date(), data.walletId, data.tanggalTransaksi,
      data.tipe, data.kategori, data.jumlah, data.deskripsi || '',
      this.STATUS_ACTIVE
    ]);
    return id;
  },

  _mapRow(row, rowIndex) {
    return {
      rowIndex,
      _rowIndex: rowIndex, // Solusi defensif untuk ketidaksesuaian pemanggilan _rowIndex
      id: row[0],
      timestamp: new Date(row[1]),
      walletId: row[2],
      tanggalTransaksi: new Date(row[3]),
      tipe: row[4],
      kategori: row[5],
      jumlah: row[6],
      deskripsi: row[7],
      status: row[8]
    };
  },

  getAll() {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    return data.map((row, index) => this._mapRow(row, index + 2));
  },

  getActive() {
    return this.getAll().filter(t => t.status === this.STATUS_ACTIVE);
  },

  getLastActive() {
    const active = this.getActive();
    return active.length > 0 ? active[active.length - 1] : null;
  },

  findById(id) {
    return this.getActive().find(t => t.id === id) || null;
  },

  getByWallet(walletId) {
    return this.getActive().filter(t => t.walletId === walletId);
  },

  getByKategoriAndPeriode(kategori, tahunBulan) {
    return this.getActive().filter(t => {
      const txTahunBulan = DateTimeUtils.formatPeriode(t.tanggalTransaksi);
      return t.kategori === kategori && txTahunBulan === tahunBulan;
    });
  },

  softDelete(rowIndex) {
    SpreadsheetGateway.getSheet(this.SHEET_NAME)
      .getRange(rowIndex, this.COL.STATUS).setValue(this.STATUS_DELETED);
  },

  update(rowIndex, updatedFields) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    if (updatedFields.kategori !== undefined) {
      sheet.getRange(rowIndex, this.COL.KATEGORI).setValue(updatedFields.kategori);
    }
    if (updatedFields.jumlah !== undefined) {
      sheet.getRange(rowIndex, this.COL.JUMLAH).setValue(updatedFields.jumlah);
    }
    if (updatedFields.deskripsi !== undefined) {
      sheet.getRange(rowIndex, this.COL.DESKRIPSI).setValue(updatedFields.deskripsi);
    }
    if (updatedFields.walletId !== undefined) {
      sheet.getRange(rowIndex, this.COL.WALLET_ID).setValue(updatedFields.walletId);
    }
  }
};