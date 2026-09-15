/**
 * ===================================================================
 * REPOSITORY: REMINDER (+ ACK PATTERNS)
 * ===================================================================
 */
const ReminderRepository = {
  SHEET_NAME: 'Reminder_RawData',
  STATUS_AKTIF: 'Aktif',
  STATUS_DONE: 'Done',

  COL: {
    ID: 1, TIMESTAMP: 2, DESKRIPSI: 3, WAKTU: 4, STATUS: 5,
    PRIORITAS: 6, TERAKHIR_DIINGATKAN: 7, CATATAN: 8,
    JENIS_RECURRING: 9, RECURRING_CONFIG: 10, JUMLAH_DIINGATKAN: 11
  },

  create(data) {
    const id = IdGenerator.generate('REM');
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      id, new Date(), data.deskripsi, data.waktuPertama, this.STATUS_AKTIF,
      data.prioritas || 'Normal', '', data.catatan || '',
      data.jenisRecurring || 'none', data.recurringConfig || '', 0
    ]);
    return id;
  },

  _mapRow(row, rowIndex) {
    return {
      rowIndex,
      id: row[0],
      deskripsi: row[2],
      waktuPertama: new Date(row[3]),
      status: row[4],
      prioritas: row[5],
      terakhirDiingatkan: row[6] ? new Date(row[6]) : null,
      catatan: row[7],
      jenisRecurring: row[8],
      recurringConfig: row[9],
      jumlahDiingatkan: row[10] || 0
    };
  },

  getAll() {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
    return data.map((row, index) => this._mapRow(row, index + 2));
  },

  getActive() {
    return this.getAll().filter(r => r.status === this.STATUS_AKTIF);
  },

  getMenungguRespon(batasMenit) {
    const now = DateTimeUtils.nowWIB();
    const batasMs = (batasMenit || 30) * 60 * 1000;

    return this.getActive().filter(r => {
      if (!r.terakhirDiingatkan) return false;
      const selisih = now.getTime() - DateTimeUtils.toWIB(r.terakhirDiingatkan).getTime();
      return selisih <= batasMs;
    });
  },

  updateStatus(rowIndex, status) {
    SpreadsheetGateway.getSheet(this.SHEET_NAME)
      .getRange(rowIndex, this.COL.STATUS).setValue(status);
  },

  updateTerakhirDiingatkan(rowIndex, jumlahBaru) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    sheet.getRange(rowIndex, this.COL.TERAKHIR_DIINGATKAN).setValue(new Date());
    sheet.getRange(rowIndex, this.COL.JUMLAH_DIINGATKAN).setValue(jumlahBaru);
  },

  updateWaktu(rowIndex, waktuBaru) {
    SpreadsheetGateway.getSheet(this.SHEET_NAME)
      .getRange(rowIndex, this.COL.WAKTU).setValue(waktuBaru);
  },

  hitungWaktuBerikutnya(reminder) {
    const waktu = new Date(reminder.waktuPertama);
    if (reminder.jenisRecurring === 'daily') waktu.setDate(waktu.getDate() + 1);
    else if (reminder.jenisRecurring === 'weekly') waktu.setDate(waktu.getDate() + 7);
    else if (reminder.jenisRecurring === 'monthly') waktu.setMonth(waktu.getMonth() + 1);
    return waktu;
  }
};

const AckPatternsRepository = {
  SHEET_NAME: 'Reminder_AckPatterns',

  save(pesanUser, interpretasi, aksi) {
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      IdGenerator.generate('ACK'), new Date(), pesanUser, interpretasi, aksi
    ]);
  },

  getRecent(limit) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const startRow = Math.max(2, lastRow - limit + 1);
    const numRows = lastRow - startRow + 1;
    const data = sheet.getRange(startRow, 1, numRows, 5).getValues();

    return data.map(row => ({ pesan: row[2], interpretasi: row[3], aksi: row[4] }));
  }
};