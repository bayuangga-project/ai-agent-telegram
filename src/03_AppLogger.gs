/**
 * ===================================================================
 * APP LOGGER (FAST DIRECT LOGGING - ZERO LOCK DEADLOCK)
 * ===================================================================
 */
const AppLogger = {
  SHEET_NAME: 'Log_System',

  write(jenisEvent, detail, status) {
    try {
      var sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
      sheet.appendRow([new Date(), jenisEvent, detail, status]);
    } catch (e) {
      // Swallow error agar kegagalan logging tidak mematikan eksekusi utama
    }
  },

  info(jenisEvent, detail) { this.write(jenisEvent, detail, 'INFO'); },
  warning(jenisEvent, detail) { this.write(jenisEvent, detail, 'WARNING'); },
  error(jenisEvent, detail) { this.write(jenisEvent, detail, 'ERROR'); }
};