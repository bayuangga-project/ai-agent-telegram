const FinanceSpecialist = {
  DEFAULT_WALLET_NAME: 'Cash',
  BUDGET_WARNING_THRESHOLD: 0.8,
  BUDGET_EXCEEDED_THRESHOLD: 1.0,

  resolveWallet(namaWallet) {
    var nama = (namaWallet && namaWallet.trim().length > 0)
      ? namaWallet.trim() : this.DEFAULT_WALLET_NAME;

    var wallet = WalletRepository.findByName(nama);
    if (!wallet) {
      var id = WalletRepository.create(nama, 0);
      wallet = WalletRepository.findById(id);
      AppLogger.info('WALLET_AUTO_CREATED', 'wallet_id:' + id);
    }
    return wallet;
  },

  getSaldoWallet(walletId) {
    var wallet = WalletRepository.findById(walletId);
    if (!wallet) return 0;

    var transaksi = TransactionRepository.getByWallet(walletId);
    var totalMasuk = transaksi
      .filter(function(t) { return t.tipe === TransactionRepository.TIPE_INCOME; })
      .reduce(function(sum, t) { return sum + t.jumlah; }, 0);
    var totalKeluar = transaksi
      .filter(function(t) { return t.tipe === TransactionRepository.TIPE_EXPENSE; })
      .reduce(function(sum, t) { return sum + t.jumlah; }, 0);

    return wallet.saldoAwal + totalMasuk - totalKeluar;
  },

  getAllSaldo() {
    var wallets = WalletRepository.getAll();
    var self = this;
    var list = wallets.map(function(w) {
      return {
        id: w.id,
        nama: w.nama,
        saldo: self.getSaldoWallet(w.id)
      };
    });
    var total = list.reduce(function(sum, w) { return sum + w.saldo; }, 0);
    return { wallets: list, total: total };
  },

  recordTransaction(data) {
    var wallet = this.resolveWallet(data.walletNama);
    var tanggalTransaksi = data.tanggalTransaksi || DateTimeUtils.nowWIB();

    var trxId = TransactionRepository.create({
      walletId: wallet.id,
      tanggalTransaksi: tanggalTransaksi,
      tipe: data.tipe,
      kategori: data.kategori,
      jumlah: data.jumlah,
      deskripsi: data.deskripsi
    });

    AppLogger.info('TRANSACTION_CREATED', 'trx_id:' + trxId);

    var saldoTerbaru = this.getSaldoWallet(wallet.id);
    var alertData = null;

    if (data.tipe === TransactionRepository.TIPE_EXPENSE) {
      alertData = this._checkBudgetAlert(data.kategori, tanggalTransaksi);
    }

    return {
      success: true,
      data: {
        transactionId: trxId,
        wallet: wallet.nama,
        walletId: wallet.id,
        tipe: data.tipe,
        kategori: data.kategori,
        jumlah: data.jumlah,
        deskripsi: data.deskripsi,
        saldoTerbaru: saldoTerbaru,
        budgetAlert: alertData
      }
    };
  },

  editLastTransaction(updatedFields) {
    var lastTrx = TransactionRepository.getLastActive();
    if (!lastTrx) {
      return { success: false, code: 'NO_ACTIVE_TRANSACTION' };
    }

    TransactionRepository.update(lastTrx._rowIndex, updatedFields);
    AppLogger.info('TRANSACTION_EDITED', 'trx_id:' + lastTrx.id);

    var updated = TransactionRepository.findById(lastTrx.id);
    var wallet = WalletRepository.findById(updated.walletId);
    var saldoTerbaru = this.getSaldoWallet(wallet.id);

    return {
      success: true,
      data: {
        transactionId: updated.id,
        wallet: wallet.nama,
        kategori: updated.kategori,
        jumlah: updated.jumlah,
        deskripsi: updated.deskripsi,
        saldoTerbaru: saldoTerbaru
      }
    };
  },

  getRingkasanPeriode(periode) {
    var semuaTransaksi = TransactionRepository.getActive().filter(function(t) {
      return DateTimeUtils.formatPeriode(t.tanggalTransaksi) === periode;
    });

    var totalMasuk = semuaTransaksi
      .filter(function(t) { return t.tipe === TransactionRepository.TIPE_INCOME; })
      .reduce(function(sum, t) { return sum + t.jumlah; }, 0);
    var totalKeluar = semuaTransaksi
      .filter(function(t) { return t.tipe === TransactionRepository.TIPE_EXPENSE; })
      .reduce(function(sum, t) { return sum + t.jumlah; }, 0);

    var perKategori = {};
    semuaTransaksi
      .filter(function(t) { return t.tipe === TransactionRepository.TIPE_EXPENSE; })
      .forEach(function(t) {
        perKategori[t.kategori] = (perKategori[t.kategori] || 0) + t.jumlah;
      });

    return {
      periode: periode,
      totalMasuk: totalMasuk,
      totalKeluar: totalKeluar,
      saldoBersih: totalMasuk - totalKeluar,
      perKategori: perKategori
    };
  },

  createOrUpdateBudget(kategori, batasJumlah, periode) {
    var existing = BudgetRepository.findByKategoriAndPeriode(kategori, periode);
    var action = 'CREATE';

    if (existing) {
      BudgetRepository.updateBatasJumlah(existing._rowIndex, batasJumlah);
      action = 'UPDATE';
      AppLogger.info('BUDGET_UPDATED', 'kategori:' + kategori);
    } else {
      BudgetRepository.create(kategori, batasJumlah, periode);
      AppLogger.info('BUDGET_CREATED', 'kategori:' + kategori);
    }

    return {
      success: true,
      action: action,
      kategori: kategori,
      batasJumlah: batasJumlah,
      periode: periode
    };
  },

  _checkBudgetAlert(kategori, tanggalTransaksi) {
    var periode = DateTimeUtils.formatPeriode(tanggalTransaksi);
    var budget = BudgetRepository.findByKategoriAndPeriode(kategori, periode);
    if (!budget) return null;

    var transaksiKategori = TransactionRepository.getByKategoriAndPeriode(kategori, periode);
    var totalTerpakai = transaksiKategori.reduce(function(sum, t) { return sum + t.jumlah; }, 0);
    var persentase = totalTerpakai / budget.batasJumlah;

    if (persentase >= this.BUDGET_EXCEEDED_THRESHOLD) {
      AppLogger.warning('BUDGET_ALERT_EXCEEDED', 'kategori:' + kategori);
      return {
        status: 'EXCEEDED',
        kategori: kategori,
        periode: periode,
        totalTerpakai: totalTerpakai,
        batasBudget: budget.batasJumlah,
        persentase: Math.round(persentase * 100)
      };
    }
    if (persentase >= this.BUDGET_WARNING_THRESHOLD) {
      AppLogger.warning('BUDGET_ALERT_WARNING', 'kategori:' + kategori);
      return {
        status: 'WARNING',
        kategori: kategori,
        periode: periode,
        totalTerpakai: totalTerpakai,
        batasBudget: budget.batasJumlah,
        persentase: Math.round(persentase * 100)
      };
    }
    return null;
  }
};