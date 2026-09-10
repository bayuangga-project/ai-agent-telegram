/**
 * ===================================================================
 * SPESIALIS: FINANCE
 * Tanggung jawab: logic bisnis pencatatan transaksi, hitung saldo
 * wallet, cek budget alert. Tidak tahu cara format pesan Telegram
 * atau parsing natural language — itu tugas Manager (Sub-Batch 7e).
 * ===================================================================
 */
const FinanceSpecialist = {
  DEFAULT_WALLET_NAME: 'Cash',
  BUDGET_WARNING_THRESHOLD: 0.8,
  BUDGET_EXCEEDED_THRESHOLD: 1.0,

  EXPENSE_CATEGORIES: ['Makanan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Lainnya'],
  INCOME_CATEGORIES: ['Gaji', 'Bonus', 'Hadiah', 'Lainnya'],

  /**
   * =================================================================
   * WALLET
   * =================================================================
   */
  resolveWallet(namaWallet) {
    const nama = (namaWallet && namaWallet.trim().length > 0)
      ? namaWallet.trim() : this.DEFAULT_WALLET_NAME;

    let wallet = WalletRepository.findByName(nama);
    if (!wallet) {
      const id = WalletRepository.create(nama, 0);
      wallet = WalletRepository.findById(id);
      AppLogger.info('WALLET_AUTO_CREATED', 'Nama: ' + nama + ' | ID: ' + id);
    }
    return wallet;
  },

  getSaldoWallet(walletId) {
    const wallet = WalletRepository.findById(walletId);
    if (!wallet) return 0;

    const transaksi = TransactionRepository.getByWallet(walletId);
    const totalMasuk = transaksi
      .filter(t => t.tipe === TransactionRepository.TIPE_INCOME)
      .reduce((sum, t) => sum + t.jumlah, 0);
    const totalKeluar = transaksi
      .filter(t => t.tipe === TransactionRepository.TIPE_EXPENSE)
      .reduce((sum, t) => sum + t.jumlah, 0);

    return wallet.saldoAwal + totalMasuk - totalKeluar;
  },

  getAllSaldoAsText() {
    const wallets = WalletRepository.getAll();
    if (wallets.length === 0) return 'Belum ada wallet yang tercatat.';

    const lines = wallets.map(w => {
      const saldo = this.getSaldoWallet(w.id);
      return '💰 *' + w.nama + '*: Rp' + this._formatRupiah(saldo);
    });

    const totalSemua = wallets.reduce((sum, w) => sum + this.getSaldoWallet(w.id), 0);
    return lines.join('\n') + '\n\n*Total Semua Wallet: Rp' + this._formatRupiah(totalSemua) + '*';
  },

  /**
   * =================================================================
   * TRANSAKSI
   * =================================================================
   */
  recordTransaction(data) {
    const wallet = this.resolveWallet(data.walletNama);
    const tanggalTransaksi = data.tanggalTransaksi || new Date();

    const trxId = TransactionRepository.create({
      walletId: wallet.id,
      tanggalTransaksi: tanggalTransaksi,
      tipe: data.tipe,
      kategori: data.kategori,
      jumlah: data.jumlah,
      deskripsi: data.deskripsi
    });

    AppLogger.info('TRANSACTION_CREATED',
      'ID: ' + trxId + ' | ' + data.tipe + ' | ' + data.kategori + ' | Rp' + data.jumlah);

    const saldoTerbaru = this.getSaldoWallet(wallet.id);
    let responseText = this._buildTransactionConfirmation(data, wallet, saldoTerbaru);

    if (data.tipe === TransactionRepository.TIPE_EXPENSE) {
      const alertText = this._checkBudgetAlert(data.kategori, tanggalTransaksi);
      if (alertText) responseText += '\n\n' + alertText;
    }

    return { success: true, text: responseText, transactionId: trxId };
  },

  editLastTransaction(updatedFields) {
    const lastTrx = TransactionRepository.getLastActive();
    if (!lastTrx) {
      return { success: false, text: 'Belum ada transaksi yang bisa diedit.' };
    }

    TransactionRepository.update(lastTrx.rowIndex, updatedFields);
    AppLogger.info('TRANSACTION_EDITED', 'ID: ' + lastTrx.id + ' | Fields: ' + JSON.stringify(updatedFields));

    const updated = TransactionRepository.findById(lastTrx.id);
    const wallet = WalletRepository.findById(updated.walletId);
    const saldoTerbaru = this.getSaldoWallet(wallet.id);

    const text = '✏️ Transaksi berhasil diedit!\n\n' +
      this._buildTransactionConfirmation(updated, wallet, saldoTerbaru);

    return { success: true, text: text };
  },

  getRingkasanPeriode(periode) {
    const semuaTransaksi = TransactionRepository.getActive().filter(t =>
      DateTimeUtils.formatPeriode(t.tanggalTransaksi) === periode
    );

    const totalMasuk = semuaTransaksi
      .filter(t => t.tipe === TransactionRepository.TIPE_INCOME)
      .reduce((sum, t) => sum + t.jumlah, 0);
    const totalKeluar = semuaTransaksi
      .filter(t => t.tipe === TransactionRepository.TIPE_EXPENSE)
      .reduce((sum, t) => sum + t.jumlah, 0);

    const perKategori = {};
    semuaTransaksi
      .filter(t => t.tipe === TransactionRepository.TIPE_EXPENSE)
      .forEach(t => {
        perKategori[t.kategori] = (perKategori[t.kategori] || 0) + t.jumlah;
      });

    return {
      periode, totalMasuk, totalKeluar,
      saldoBersih: totalMasuk - totalKeluar,
      perKategori
    };
  },

  formatRingkasanAsText(ringkasan) {
    let text = '📊 *Ringkasan ' + ringkasan.periode + '*\n\n' +
      '📥 Pemasukan: Rp' + this._formatRupiah(ringkasan.totalMasuk) + '\n' +
      '📤 Pengeluaran: Rp' + this._formatRupiah(ringkasan.totalKeluar) + '\n' +
      '💵 Saldo Bersih: Rp' + this._formatRupiah(ringkasan.saldoBersih);

    const kategoriKeys = Object.keys(ringkasan.perKategori);
    if (kategoriKeys.length > 0) {
      text += '\n\n*Rincian Pengeluaran:*\n';
      text += kategoriKeys
        .map(k => '- ' + k + ': Rp' + this._formatRupiah(ringkasan.perKategori[k]))
        .join('\n');
    }
    return text;
  },

  /**
   * =================================================================
   * BUDGET
   * =================================================================
   */
  createOrUpdateBudget(kategori, batasJumlah, periode) {
    const existing = BudgetRepository.findByKategoriAndPeriode(kategori, periode);
    if (existing) {
      BudgetRepository.updateBatasJumlah(existing.rowIndex, batasJumlah);
      AppLogger.info('BUDGET_UPDATED', kategori + ' | ' + periode + ' | Rp' + batasJumlah);
      return '✅ Budget *' + kategori + '* untuk ' + periode + ' diupdate jadi Rp' + this._formatRupiah(batasJumlah);
    }

    BudgetRepository.create(kategori, batasJumlah, periode);
    AppLogger.info('BUDGET_CREATED', kategori + ' | ' + periode + ' | Rp' + batasJumlah);
    return '✅ Budget *' + kategori + '* untuk ' + periode + ' dibuat: Rp' + this._formatRupiah(batasJumlah);
  },

  _checkBudgetAlert(kategori, tanggalTransaksi) {
    const periode = DateTimeUtils.formatPeriode(tanggalTransaksi);
    const budget = BudgetRepository.findByKategoriAndPeriode(kategori, periode);
    if (!budget) return null;

    const transaksiKategori = TransactionRepository.getByKategoriAndPeriode(kategori, periode);
    const totalTerpakai = transaksiKategori.reduce((sum, t) => sum + t.jumlah, 0);
    const persentase = totalTerpakai / budget.batasJumlah;

    if (persentase >= this.BUDGET_EXCEEDED_THRESHOLD) {
      AppLogger.warning('BUDGET_ALERT_EXCEEDED', kategori + ' | ' + periode + ' | ' + Math.round(persentase * 100) + '%');
      return '🚨 *Budget Terlampaui!* Kategori *' + kategori + '* sudah Rp' +
        this._formatRupiah(totalTerpakai) + ' dari budget Rp' +
        this._formatRupiah(budget.batasJumlah) + ' (' + Math.round(persentase * 100) + '%)';
    }
    if (persentase >= this.BUDGET_WARNING_THRESHOLD) {
      AppLogger.warning('BUDGET_ALERT_WARNING', kategori + ' | ' + periode + ' | ' + Math.round(persentase * 100) + '%');
      return '⚠️ Budget *' + kategori + '* sudah terpakai ' + Math.round(persentase * 100) +
        '% (Rp' + this._formatRupiah(totalTerpakai) + ' dari Rp' + this._formatRupiah(budget.batasJumlah) + ')';
    }
    return null;
  },

  /**
   * =================================================================
   * HELPERS
   * =================================================================
   */
  _buildTransactionConfirmation(data, wallet, saldoTerbaru) {
    const emoji = data.tipe === TransactionRepository.TIPE_INCOME ? '📥' : '📤';
    const label = data.tipe === TransactionRepository.TIPE_INCOME ? 'Pemasukan' : 'Pengeluaran';

    return emoji + ' *' + label + ' Tercatat*\n\n' +
      '💵 Rp' + this._formatRupiah(data.jumlah) + '\n' +
      '🏷 ' + data.kategori + '\n' +
      '📝 ' + (data.deskripsi || '-') + '\n' +
      '👛 ' + wallet.nama + '\n\n' +
      'Saldo ' + wallet.nama + ' sekarang: Rp' + this._formatRupiah(saldoTerbaru);
  },

  _formatRupiah(angka) {
    return Math.round(angka).toLocaleString('id-ID');
  }
};