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
  }
};