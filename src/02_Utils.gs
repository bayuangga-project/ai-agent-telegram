/**
 * ===================================================================
 * UTILITIES
 * ===================================================================
 */

const BOT_PERSONA = [
  'Kamu adalah asisten pribadi. Kepribadianmu: pakai "aku" dan "kamu", natural,',
  'hangat, tidak kaku, tidak template, sesekali humor ringan kalau pas momennya.',
  'Kejujuran dan akurasi JAUH LEBIH PENTING daripada terdengar personal.',
  'JANGAN PERNAH mengarang kejadian, cerita, atau detail yang tidak ada di',
  'konteks yang diberikan.'
].join('\n');

const IdGenerator = {
  generate(prefix) {
    return prefix + '-' + new Date().getTime();
  }
};

const DateTimeUtils = {
  WIB_OFFSET_MS: 7 * 60 * 60 * 1000,

  toWIB(date) {
    return new Date(date.getTime() + this.WIB_OFFSET_MS);
  },

  nowWIB() {
    return this.toWIB(new Date());
  },

  formatWaktu(date) {
    const d = this.toWIB(new Date(date));
    return Utilities.formatDate(d, 'UTC', 'dd/MM/yyyy HH:mm') + ' WIB';
  },

  formatUntukPrompt(date) {
    return Utilities.formatDate(date, 'UTC', 'dd/MM/yyyy HH:mm');
  },

  /**
   * Konversi Date jadi string periode "yyyy-MM" berdasarkan WIB.
   * WAJIB dipakai di mana pun butuh identifikasi "bulan berapa" dari
   * sebuah Date — JANGAN panggil Utilities.formatDate() langsung
   * dengan zona 'UTC' pada Date mentah, karena akan salah dekat
   * pergantian hari/bulan (lihat kasus BudgetRepository, 09/09/2025).
   */
  formatPeriode(date) {
    return Utilities.formatDate(this.toWIB(new Date(date)), 'UTC', 'yyyy-MM');
  }
};