/**
 * ===================================================================
 * REPOSITORY: CHAT HISTORY
 * ===================================================================
 */
const ChatHistoryRepository = {
  SHEET_NAME: 'Chat_History',

  getRecent(limit) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const startRow = Math.max(2, lastRow - limit + 1);
    const numRows = lastRow - startRow + 1;
    const data = sheet.getRange(startRow, 1, numRows, 5).getValues();

    return data.map(row => ({ role: row[3], text: row[4] }));
  },

  save(chatId, role, text) {
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      IdGenerator.generate('MSG'), new Date(), chatId, role, text
    ]);
  }
};