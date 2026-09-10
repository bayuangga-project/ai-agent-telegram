/**
 * ===================================================================
 * APP LOGGER
 * ===================================================================
 */
const AppLogger = {
  SHEET_NAME: 'Log_System',

  write(jenisEvent, detail, status) {
    try {
      SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
        new Date(), jenisEvent, detail, status
      ]);
    } catch (e) {
      // Jika logger gagal total, biarkan saja (swallow error).
      // Jangan sampai kegagalan mencatat log malah membunuh aplikasi utama.
    }
  },

  info(jenisEvent, detail) { this.write(jenisEvent, detail, 'INFO'); },
  warning(jenisEvent, detail) { this.write(jenisEvent, detail, 'WARNING'); },
  error(jenisEvent, detail) { this.write(jenisEvent, detail, 'ERROR'); }
};