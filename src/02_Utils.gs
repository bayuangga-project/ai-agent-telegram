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

/**
 * Utilitas penanganan waktu dan tanggal.
 * Disesuaikan dengan runtime Google Apps Script (Asia/Jakarta).
 */
const DateTimeUtils = {
  /**
   * Zona waktu standar aplikasi
   */
  TIMEZONE: "Asia/Jakarta",

  /**
   * Memastikan input menjadi objek Date yang valid.
   * Tidak menambahkan offset manual karena runtime sudah Asia/Jakarta.
   * @param {Date|string|number} date
   * @return {Date}
   */
  toWIB(date) {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  },

  /**
   * Mengembalikan waktu saat ini dalam objek Date.
   * @return {Date}
   */
  nowWIB() {
    return new Date();
  },

  /**
   * Format untuk pesan ramah pengguna / reminder (contoh: "16 Sep 2026, 13:29 WIB")
   * @param {Date|string} date
   * @return {string}
   */
  formatWaktu(date) {
    const d = this.toWIB(date);
    return Utilities.formatDate(d, this.TIMEZONE, "dd MMM yyyy, HH:mm") + " WIB";
  },

  /**
   * Format lengkap untuk prompt LLM (contoh: "2026-09-16 13:29:34 WIB")
   * @param {Date|string} date
   * @return {string}
   */
  formatUntukPrompt(date) {
    const d = this.toWIB(date);
    return Utilities.formatDate(d, this.TIMEZONE, "yyyy-MM-dd HH:mm:ss") + " WIB";
  },

  /**
   * Format periode untuk keuangan dan pengelompokan (contoh: "2026-09")
   * @param {Date|string} date
   * @return {string}
   */
  formatPeriode(date) {
    const d = this.toWIB(date);
    return Utilities.formatDate(d, this.TIMEZONE, "yyyy-MM");
  }
};