/**
 * ===================================================================
 * REPOSITORY: KNOWLEDGE (PURE PERSISTENCE LAYER)
 * ===================================================================
 */
const KnowledgeRepository = {
  SHEET_NAME: 'AI_Knowledge',
  COL: { ID: 1, NAMESPACE: 2, KEY: 3, CONTENT: 4, VERSION: 5, ACTIVE: 6, UPDATED_AT: 7, NOTES: 8 },

  _getSheet() {
    return SpreadsheetGateway.getSheet(this.SHEET_NAME);
  },

  _getAllRows() {
    var sheet = this._getSheet();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1);
  },

  get(namespace, key) {
    var rows = this._getAllRows();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[1] === namespace && r[2] === key && (r[5] === true || r[5] === 'TRUE')) {
        return r[3];
      }
    }
    return null;
  },

  getByNamespace(namespace) {
    var rows = this._getAllRows();
    var result = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[1] === namespace && (r[5] === true || r[5] === 'TRUE')) {
        result[r[2]] = r[3];
      }
    }
    return result;
  },

  getAll() {
    var rows = this._getAllRows();
    var result = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      result.push({
        id: r[0],
        namespace: r[1],
        key: r[2],
        content: r[3],
        version: r[4],
        active: r[5],
        updated_at: r[6],
        notes: r[7]
      });
    }
    return result;
  },

  save(namespace, key, content, notes) {
    var sheet = this._getSheet();
    var rows = this._getAllRows();
    var now = DateTimeUtils.nowWIB();
    var maxVersion = 0;
    var activeRowIndex = -1;

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[1] === namespace && r[2] === key) {
        var v = Number(r[4]) || 0;
        if (v > maxVersion) maxVersion = v;
        if (r[5] === true || r[5] === 'TRUE') activeRowIndex = i + 2;
      }
    }

    if (activeRowIndex > 0) {
      sheet.getRange(activeRowIndex, this.COL.ACTIVE).setValue(false);
    }

    var newId = IdGenerator.generate('KNW');
    var newVersion = maxVersion + 1;
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      newId, namespace, key, content, newVersion, true, now, notes || ''
    ]);
  },

  deactivate(namespace, key) {
    var sheet = this._getSheet();
    var rows = this._getAllRows();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[1] === namespace && r[2] === key && (r[5] === true || r[5] === 'TRUE')) {
        sheet.getRange(i + 2, this.COL.ACTIVE).setValue(false);
      }
    }
  }
};