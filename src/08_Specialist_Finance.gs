/**
 * ===================================================================
 * SPESIALIS: FINANCE (MONEY TRACKER V19.3 ADAPTER WITH WALLET RESOLVER)
 * Tanggung jawab: Akses ke Tracker V19.3, pencocokan otomatis nama wallet
 * (misal "QRIS BCA" -> "BCA [Bayu]"), pembersihan catatan struk belanja,
 * dan penulisan LockService. 100% Pasal 1.2 Compliant.
 * ===================================================================
 */
const FinanceSpecialist = {
  RESPONSES_SHEET: 'Responses',
  OPTIONS_SHEET: 'Options',
  WALLETS_SHEET: 'Wallets',
  EXPECTED_COLUMNS: 13,

  _getTrackerSS() {
    var id = Config.load().trackingSpreadsheetId;
    if (!id) throw new Error('TRACKING_SPREADSHEET_ID_MISSING');
    return SpreadsheetApp.openById(id);
  },

  getValidOptions() {
    try {
      var ss = this._getTrackerSS();
      var sheet = ss.getSheetByName(this.OPTIONS_SHEET);
      if (!sheet) return { incomeCategories: [], expenseCategories: [], accounts: [] };

      var data = sheet.getDataRange().getValues();
      var result = { incomeCategories: [], expenseCategories: [], accounts: [] };

      for (var i = 1; i < data.length; i++) {
        if (data[i][0]) result.incomeCategories.push(String(data[i][0]).trim());
        if (data[i][1]) result.expenseCategories.push(String(data[i][1]).trim());
        if (data[i][2]) result.accounts.push(String(data[i][2]).trim());
      }
      return result;
    } catch (e) {
      AppLogger.error('TRACKER_OPTIONS_READ_FAIL', e.message);
      return { incomeCategories: [], expenseCategories: [], accounts: [] };
    }
  },

  getAllSaldo() {
    try {
      var ss = this._getTrackerSS();
      var sheet = ss.getSheetByName(this.WALLETS_SHEET);
      if (!sheet) return { wallets: [], total: 0 };

      var data = sheet.getDataRange().getValues();
      var list = [];
      var total = 0;

      for (var i = 1; i < data.length; i++) {
        var accName = data[i][0];
        if (accName) {
          var balance = Number(data[i][4]) || 0;
          list.push({ nama: String(accName).trim(), saldo: balance });
          total += balance;
        }
      }
      return { wallets: list, total: total };
    } catch (e) {
      AppLogger.error('TRACKER_WALLETS_READ_FAIL', e.message);
      return { wallets: [], total: 0 };
    }
  },

  getSaldoWallet(namaWallet) {
    if (!namaWallet) return 0;
    var all = this.getAllSaldo();
    var clean = String(namaWallet).toLowerCase().trim();
    for (var i = 0; i < all.wallets.length; i++) {
      if (all.wallets[i].nama.toLowerCase() === clean) {
        return all.wallets[i].saldo;
      }
    }
    return 0;
  },

  /**
   * Smart Wallet Resolver: Mencocokkan teks pembayaran (misal "QRIS BCA") ke Akun Resmi Tracker V19.3
   */
  resolveWalletAccount(inputText, validAccounts) {
    if (!validAccounts || !Array.isArray(validAccounts) || validAccounts.length === 0) {
      return '';
    }

    if (!inputText || String(inputText).trim().length === 0) {
      return validAccounts[0]; // Fallback ke akun pertama jika kosong
    }

    var clean = String(inputText).toLowerCase().trim();

    // 1. Exact / Full match
    for (var i = 0; i < validAccounts.length; i++) {
      if (validAccounts[i].toLowerCase() === clean) return validAccounts[i];
    }

    // 2. Substring match (misal "BCA" cocok ke "BCA [Bayu]")
    for (var j = 0; j < validAccounts.length; j++) {
      var accLower = validAccounts[j].toLowerCase();
      if (clean.indexOf(accLower) !== -1 || accLower.indexOf(clean) !== -1) {
        return validAccounts[j];
      }
    }

    // 3. Keyword extraction (misal "QRIS BCA" -> cari kata "bca" atau "qris")
    var words = clean.split(/\s+/);
    for (var w = 0; w < words.length; w++) {
      var word = words[w];
      if (word.length <= 2) continue;
      for (var k = 0; k < validAccounts.length; k++) {
        if (validAccounts[k].toLowerCase().indexOf(word) !== -1) {
          return validAccounts[k];
        }
      }
    }

    return validAccounts[0];
  },

  prepareDraft(data) {
    var rawText = data.deskripsi || data.text || '';
    
    var amountInput = data.jumlah !== undefined ? data.jumlah : (data.amount !== undefined ? data.amount : (data.nominal !== undefined ? data.nominal : data.value));
    var walletInput = data.wallet || data.account || data.dompet || data.from || data.to || '';
    var tipeInput = data.tipe_transaksi || data.tipe || data.type || data.transaction_type || 'pengeluaran';
    var categoryInput = data.kategori || data.category || '';
    var notesInput = data.deskripsi || data.notes || data.description || data.catatan || rawText;

    var rawAmt = this._parseAmount(amountInput, rawText);
    if (isNaN(rawAmt) || rawAmt <= 0) {
      return { success: false, code: 'INVALID_AMOUNT' };
    }

    var options = this.getValidOptions();
    var tipe = String(tipeInput).toLowerCase().trim();
    var typeFormatted = 'Expense';
    if (tipe === 'pemasukan' || tipe === 'income') typeFormatted = 'Income';
    else if (tipe === 'transfer') typeFormatted = 'Transfer';

    var category = String(categoryInput).trim();
    var account = String(walletInput).trim();
    var fromAccount = String(data.from || account).trim();
    var toAccount = String(data.to || (typeFormatted === 'Income' ? account : '')).trim();

    var validCats = typeFormatted === 'Income' ? options.incomeCategories : options.expenseCategories;
    var matchedCat = this._findMatch(category, validCats);
    
    // Smart Wallet Resolver ke Akun Resmi Tracker V19.3
    var matchedAcc = this.resolveWalletAccount(account, options.accounts);

    var cleanNotesText = this._cleanNotes(notesInput, matchedAcc || account, rawAmt);

    var baseDraft = {
      id: Utilities.getUuid(),
      date: DateTimeUtils.formatTanggal(data.tanggalTransaksi || DateTimeUtils.nowWIB()),
      type: typeFormatted,
      category: matchedCat || category || '',
      amount: rawAmt,
      from: typeFormatted === 'Income' ? '' : (typeFormatted === 'Transfer' ? fromAccount : (matchedAcc || account || options.accounts[0] || '')),
      to: typeFormatted === 'Expense' ? '' : (typeFormatted === 'Transfer' ? toAccount : (matchedAcc || account || options.accounts[0] || '')),
      fee: Number(data.fee) || 0,
      notes: cleanNotesText
    };

    if (!matchedCat && (typeFormatted === 'Expense' || typeFormatted === 'Income')) {
      baseDraft.pendingField = 'CATEGORY';
      baseDraft.validOptions = validCats;
      KnowledgeRepository.save('finance', 'pending_draft', JSON.stringify(baseDraft), 'AWAITING_CATEGORY');
      return {
        success: false,
        code: 'AWAITING_CATEGORY',
        attempted: category,
        validOptions: validCats,
        draft: baseDraft
      };
    }

    delete baseDraft.pendingField;
    delete baseDraft.validOptions;
    KnowledgeRepository.save('finance', 'pending_draft', JSON.stringify(baseDraft), 'AWAITING_APPROVAL');

    return {
      success: true,
      draft: baseDraft
    };
  },

  getPendingDraft() {
    try {
      var raw = KnowledgeRepository.get('finance', 'pending_draft');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  clearDraft() {
    try {
      KnowledgeRepository.deactivate('finance', 'pending_draft');
    } catch (e) {}
  },

  fulfillPendingField(userText) {
    var draft = this.getPendingDraft();
    if (!draft || !draft.pendingField || !draft.validOptions) {
      return { success: false, reason: 'NO_PENDING_SLOT' };
    }

    var cleanInput = String(userText).trim();
    var selectedOption = null;

    var numIndex = parseInt(cleanInput, 10);
    if (!isNaN(numIndex) && numIndex >= 1 && numIndex <= draft.validOptions.length) {
      selectedOption = draft.validOptions[numIndex - 1];
    }

    if (!selectedOption) {
      selectedOption = this._findMatch(cleanInput, draft.validOptions);
    }

    if (!selectedOption) {
      return {
        success: false,
        reason: 'OPTION_NOT_MATCHED',
        attempted: cleanInput,
        pendingField: draft.pendingField,
        validOptions: draft.validOptions
      };
    }

    if (draft.pendingField === 'CATEGORY') {
      draft.category = selectedOption;
    } else if (draft.pendingField === 'ACCOUNT') {
      if (draft.type === 'Income') draft.to = selectedOption;
      else draft.from = selectedOption;
    }

    delete draft.pendingField;
    delete draft.validOptions;

    KnowledgeRepository.save('finance', 'pending_draft', JSON.stringify(draft), 'AWAITING_APPROVAL');

    return {
      success: true,
      draft: draft
    };
  },

  approveDraft() {
    var draft = this.getPendingDraft();
    if (!draft || draft.pendingField) return { success: false, code: 'NO_PENDING_DRAFT' };

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var ss = this._getTrackerSS();
      var sheet = ss.getSheetByName(this.RESPONSES_SHEET);
      if (!sheet) throw new Error('RESPONSES_SHEET_NOT_FOUND');

      var config = Config.load();
      var row = new Array(this.EXPECTED_COLUMNS).fill('');

      var pureDateObj = this._parsePureDate(draft.date);

      row[0] = draft.id || Utilities.getUuid();
      row[1] = new Date();
      row[2] = '';
      row[3] = pureDateObj;
      row[4] = draft.type;
      row[5] = draft.category;
      row[6] = draft.amount;
      row[7] = draft.from || '';
      row[8] = draft.to || '';
      row[9] = draft.fee && Number(draft.fee) > 0 ? Number(draft.fee) : '';
      row[10] = draft.notes || '';
      row[11] = config.myEmail || '';
      row[12] = 'AI-Agent-Telegram';

      sheet.appendRow(row);
      SpreadsheetApp.flush();

      this.clearDraft();
      AppLogger.info('TRACKER_TRANSACTION_WRITTEN', 'id:' + draft.id + '|type:' + draft.type + '|amount:' + draft.amount);

      var updatedSaldo = this.getSaldoWallet(draft.type === 'Income' ? draft.to : draft.from);

      return {
        success: true,
        data: {
          id: draft.id,
          type: draft.type,
          category: draft.category,
          amount: draft.amount,
          account: draft.type === 'Income' ? draft.to : draft.from,
          notes: draft.notes,
          updatedSaldo: updatedSaldo
        }
      };
    } catch (e) {
      AppLogger.error('TRACKER_WRITE_FAIL', e.message);
      return { success: false, code: 'WRITE_FAILED', error: e.message };
    } finally {
      lock.releaseLock();
    }
  },

  _parseAmount(val, rawText) {
    if (val !== undefined && val !== null && val !== '') {
      if (typeof val === 'number' && !isNaN(val) && val > 0) return val;

      var strVal = String(val).trim().toLowerCase();

      if (strVal.indexOf('jt') !== -1) {
        var numJt = parseFloat(strVal.replace(/[^0-9.]/g, ''));
        if (!isNaN(numJt)) return Math.round(numJt * 1000000);
      }

      if (strVal.indexOf('rb') !== -1 || strVal.indexOf('k') !== -1) {
        var numRb = parseFloat(strVal.replace(/[^0-9.]/g, ''));
        if (!isNaN(numRb)) return Math.round(numRb * 1000);
      }

      var cleanStr = strVal.replace(/\./g, '').replace(/,/g, '').replace(/[^0-9]/g, '');
      var parsed = parseInt(cleanStr, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    if (rawText) {
      var strText = String(rawText).toLowerCase();

      var mJt = strText.match(/(\d+([.,]\d+)?)\s*jt/);
      if (mJt) {
        var valJt = parseFloat(mJt[1].replace(',', '.'));
        if (!isNaN(valJt)) return Math.round(valJt * 1000000);
      }

      var mRb = strText.match(/(\d+([.,]\d+)?)\s*(rb|k)/);
      if (mRb) {
        var valRb = parseFloat(mRb[1].replace(',', '.'));
        if (!isNaN(valRb)) return Math.round(valRb * 1000);
      }

      var mNum = strText.match(/(\d{1,3}(\.\d{3})+|\d{4,})/);
      if (mNum) {
        var valNum = parseInt(mNum[0].replace(/\./g, ''), 10);
        if (!isNaN(valNum) && valNum > 0) return valNum;
      }
    }

    return 0;
  },

  _cleanNotes(rawText, walletName, amount) {
    var defaultNote = KnowledgeRepository.get('finance', 'default_notes') || 'Transaksi';
    if (!rawText) return defaultNote;
    var str = String(rawText).trim();

    str = str.replace(/^\[Analisis Foto\/Struk\/Dokumen\]:\s*/i, '');
    str = str.replace(/[\*\+]/g, '');
    str = str.replace(/\b(hari ini|kemarin|besok|lusa|tadi|pagi ini|siang ini|sore ini|malam ini)\b/gi, '');

    if (walletName && walletName.length > 0) {
      var rxWallet = new RegExp(walletName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
      str = str.replace(rxWallet, '');
    }

    str = str.replace(/rp\.?\s*/gi, '');
    if (amount) {
      var amtStr = String(amount);
      var rxAmt = new RegExp('\\b' + amtStr + '\\b', 'g');
      str = str.replace(rxAmt, '');
      var ribuan = Math.round(amount / 1000);
      if (ribuan > 0) {
        str = str.replace(new RegExp('\\b' + ribuan + '\\s*(rb|k)\\b', 'gi'), '');
      }
    }
    str = str.replace(/\b\d+([.,]\d+)?\s*(rb|k|jt)?\b/gi, '');
    str = str.replace(/\b(pake|pakai|via|pencatatan|catat|menggunakan|dengan)\b/gi, '');
    str = str.replace(/\s+/g, ' ').trim();

    if (str.length === 0) return defaultNote;
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Parse Tanggal Midnight 00:00:00 WIB Murni (Metode Identik Web App Tracker V19.3)
   * Kebal terhadap Date Offset GMT+7 (Jam 07:00:00 Leaking).
   */
  _parsePureDate(dateInput) {
    if (!dateInput) return new Date();
    
    var year, month, day;

    if (typeof dateInput === 'string') {
      var parts = dateInput.trim().split('T')[0].split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      }
    } else if (dateInput instanceof Date) {
      var wib = DateTimeUtils.toWIB(dateInput);
      year = wib.getFullYear();
      month = wib.getMonth();
      day = wib.getDate();
    }

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      var nowWib = DateTimeUtils.nowWIB();
      year = nowWib.getFullYear();
      month = nowWib.getMonth();
      day = nowWib.getDate();
    }

    // Konstruktor Numerik Lokal: Tepat Jam 00:00:00 WIB
    return new Date(year, month, day);
  },

  _findMatch(query, validList) {
    if (!query || !validList || !Array.isArray(validList)) return null;
    var cleanQuery = String(query).toLowerCase().trim();
    for (var i = 0; i < validList.length; i++) {
      if (validList[i].toLowerCase() === cleanQuery) {
        return validList[i];
      }
    }
    return null;
  }
};