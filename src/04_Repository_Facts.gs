/**
 * ===================================================================
 * REPOSITORY: MEMORY FACTS
 * ===================================================================
 */
const FactsRepository = {
  SHEET_NAME: 'Memory_Facts',
  STATUS_ACTIVE: 'Active',

  save(chatId, factText, category) {
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      IdGenerator.generate('MEM'), new Date(), chatId,
      category || 'general', factText, this.STATUS_ACTIVE
    ]);
  },

  getActive(maxFacts) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    const activeFacts = data
      .filter(row => row[5] === this.STATUS_ACTIVE)
      .map(row => row[4]);

    return activeFacts.length > maxFacts
      ? activeFacts.slice(activeFacts.length - maxFacts)
      : activeFacts;
  }
};