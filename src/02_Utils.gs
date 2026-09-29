/**
 * ===================================================================
 * UTILITIES: ID GENERATOR, DATE TIME, & TEMPLATE ENGINE
 * Utilitas umum penanganan ID, Waktu (Asia/Jakarta), dan Rendering Template.
 * ===================================================================
 */
const IdGenerator = {
  generate(prefix) {
    var p = prefix ? prefix + '-' : '';
    return p + new Date().getTime();
  }
};

const DateTimeUtils = {
  TIMEZONE: 'Asia/Jakarta',

  toWIB(date) {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    var parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  },

  nowWIB() {
    return new Date();
  },

  formatWaktu(date) {
    var d = this.toWIB(date);
    return Utilities.formatDate(d, this.TIMEZONE, 'dd MMM yyyy, HH:mm') + ' WIB';
  },

  formatUntukPrompt(date) {
    var d = this.toWIB(date);
    return Utilities.formatDate(d, this.TIMEZONE, 'yyyy-MM-dd HH:mm:ss') + ' WIB';
  },

  formatPeriode(date) {
    var d = this.toWIB(date);
    return Utilities.formatDate(d, this.TIMEZONE, 'yyyy-MM');
  },

  formatTanggal(date) {
    var d = this.toWIB(date);
    return Utilities.formatDate(d, this.TIMEZONE, 'yyyy-MM-dd');
  }
};

const TemplateEngine = {
  render(template, variables) {
    if (!template) return '';
    let result = template;
    for (const key in variables) {
      if (variables.hasOwnProperty(key)) {
        const regex = new RegExp('\\{\\{' + key + '\\}\\}', 'g');
        result = result.replace(regex, variables[key]);
      }
    }
    return result;
  }
};