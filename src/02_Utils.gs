/**
 * ===================================================================
 * UTILITIES
 * ===================================================================
 */
const IdGenerator = {
  generate(prefix) {
    return prefix + '-' + new Date().getTime();
  }
};

const DateTimeUtils = {
  WIB_OFFSET_MS: 7 * 60 * 60 * 1000,

  toWIB(date) {
    const d = date instanceof Date ? date : new Date(date);
    return new Date(d.getTime() + this.WIB_OFFSET_MS);
  },

  nowWIB() {
    return new Date(new Date().getTime() + this.WIB_OFFSET_MS);
  },

  formatWaktu(date) {
    const d = this.toWIB(date);
    return Utilities.formatDate(d, 'UTC', 'dd/MM/yyyy HH:mm') + ' WIB';
  },

  formatUntukPrompt(date) {
    const d = date instanceof Date ? date : new Date(date);
    return Utilities.formatDate(d, 'UTC', 'dd/MM/yyyy HH:mm');
  },

  /**
   * Konversi Date jadi string periode "yyyy-MM" berdasarkan WIB.
   * WAJIB dipakai di mana pun butuh identifikasi "bulan berapa" dari
   * sebuah Date ? JANGAN panggil Utilities.formatDate() langsung
   * dengan zona 'UTC' pada Date mentah, karena akan salah dekat
   * pergantian hari/bulan (lihat kasus BudgetRepository, 09/09/2025).
   */
  formatPeriode(date) {
    const d = date instanceof Date ? date : new Date(date);
    return Utilities.formatDate(this.toWIB(d), 'UTC', 'yyyy-MM');
  }
};