/**
 * UTILS: PATCH VALIDATOR
 * Tanggung jawab: validasi patch sebelum di-commit ke GitHub.
 * Digunakan oleh SelfHealingSpecialist dan CodeAuditor.
 */
var PatchValidator = {

  /**
   * Validasi patch. Return object dengan hasil detail.
   * @param {string} patchedCode - Kode baru dari LLM
   * @param {string} originalCode - Kode asli dari GitHub (bisa null)
   * @param {string} fileName - Nama file untuk logging
   * @returns {object} { valid: bool, errors: [], warnings: [] }
   */
  validate: function(patchedCode, originalCode, fileName) {
    var result = {
      valid: true,
      errors: [],
      warnings: [],
      fileName: fileName
    };

    // Cek 1: Kode tidak kosong
    if (!patchedCode || patchedCode.trim().length === 0) {
      result.valid = false;
      result.errors.push('Kode patch kosong');
      return result;
    }

    // Cek 2: Syntax validator
    var syntaxCheck = this._checkSyntax(patchedCode);
    if (!syntaxCheck.valid) {
      result.valid = false;
      result.errors.push('Syntax error: ' + syntaxCheck.error);
    }

    // Cek 3: Structural sanity (jika ada original untuk dibandingkan)
    if (originalCode) {
      var structCheck = this._checkStructuralSanity(patchedCode, originalCode);
      if (structCheck.severity === 'error') {
        result.valid = false;
        result.errors.push(structCheck.message);
      } else if (structCheck.severity === 'warning') {
        result.warnings.push(structCheck.message);
      }
    }

    // Cek 4: Detect suspicious patterns
    var suspiciousCheck = this._checkSuspiciousPatterns(patchedCode);
    suspiciousCheck.forEach(function(issue) {
      if (issue.severity === 'error') {
        result.valid = false;
        result.errors.push(issue.message);
      } else {
        result.warnings.push(issue.message);
      }
    });

    // Log hasil
    if (!result.valid) {
      AppLogger.warning('PATCH_VALIDATION_FAIL',
        fileName + ' | Errors: ' + result.errors.join('; '));
    } else if (result.warnings.length > 0) {
      AppLogger.info('PATCH_VALIDATION_WARN',
        fileName + ' | Warnings: ' + result.warnings.join('; '));
    } else {
      AppLogger.info('PATCH_VALIDATION_OK', fileName);
    }

    return result;
  },

  /**
   * CHECK 1: Validasi syntax dengan Function() constructor.
   * Jika kode ada SyntaxError, Function() akan throw.
   */
  _checkSyntax: function(code) {
    try {
      // Function() constructor akan parse tanpa execute.
      // Jika SyntaxError, akan throw di sini.
      new Function(code);
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: e.message
      };
    }
  },

  /**
   * CHECK 2: Structural sanity check.
   * Bandingkan panjang dan struktur dengan kode asli.
   */
  _checkStructuralSanity: function(patched, original) {
    var patchedLen = patched.length;
    var originalLen = original.length;
    var ratio = patchedLen / originalLen;

    // Kalau patch < 30% dari asli, kemungkinan besar ada yang dihapus banyak
    if (ratio < 0.3) {
      return {
        severity: 'error',
        message: 'Patch terlalu pendek: hanya ' +
                 Math.round(ratio * 100) + '% dari kode asli. ' +
                 'Kemungkinan LLM menghapus banyak fungsi.'
      };
    }

    // Kalau patch < 60%, warning saja
    if (ratio < 0.6) {
      return {
        severity: 'warning',
        message: 'Patch hanya ' + Math.round(ratio * 100) +
                 '% dari kode asli. Review dengan hati-hati.'
      };
    }

    // Cek jumlah fungsi/method (crude check pakai regex)
    var originalFuncCount = (original.match(/function\s+\w+|:\s*function\s*\(|=>\s*{/g) || []).length;
    var patchedFuncCount = (patched.match(/function\s+\w+|:\s*function\s*\(|=>\s*{/g) || []).length;

    if (originalFuncCount > 0 && patchedFuncCount < originalFuncCount * 0.7) {
      return {
        severity: 'warning',
        message: 'Jumlah fungsi berkurang drastis: ' +
                 originalFuncCount + ' → ' + patchedFuncCount +
                 '. Kemungkinan ada fungsi yang dihapus.'
      };
    }

    return { severity: 'none', message: '' };
  },

  /**
   * CHECK 3: Deteksi pattern mencurigakan yang tidak sesuai pola proyek.
   */
  _checkSuspiciousPatterns: function(code) {
    var issues = [];

    // Pattern 1: import/require (tidak ada di GAS)
    if (/^\s*(import|require)\s*\(/m.test(code) ||
        /^\s*import\s+\w+\s+from/m.test(code)) {
      issues.push({
        severity: 'error',
        message: 'Kode mengandung import/require, padahal GAS tidak support ES6 modules'
      });
    }

    // Pattern 2: class declaration (proyek pakai object literal)
    if (/^\s*class\s+\w+/m.test(code)) {
      issues.push({
        severity: 'warning',
        message: 'Kode mengandung class declaration. Proyek ini pakai object literal (const X = {...}).'
      });
    }

    // Pattern 3: TODO/FIXME/XXX comments (indikasi kode belum selesai)
    var todoMatches = code.match(/\/\/\s*(TODO|FIXME|XXX|HACK)/gi);
    if (todoMatches && todoMatches.length > 0) {
      issues.push({
        severity: 'warning',
        message: 'Kode mengandung ' + todoMatches.length +
                 ' TODO/FIXME comment. Mungkin belum selesai.'
      });
    }

    // Pattern 4: console.log (harusnya pakai AppLogger)
    if (/console\.(log|error|warn|info)/.test(code)) {
      issues.push({
        severity: 'warning',
        message: 'Kode pakai console.log. Proyek ini pakai AppLogger.'
      });
    }

    // Pattern 5: placeholder strings yang mencurigakan
    if (/YOUR_API_KEY|YOUR_TOKEN|PLACEHOLDER|<INSERT/i.test(code)) {
      issues.push({
        severity: 'error',
        message: 'Kode mengandung placeholder string (YOUR_API_KEY, PLACEHOLDER, dll). LLM belum isi nilai sebenarnya.'
      });
    }

    return issues;
  },

  /**
   * Helper: format hasil validasi jadi teks untuk laporan.
   */
  formatResult: function(result) {
    if (result.valid && result.warnings.length === 0) {
      return '✅ ' + result.fileName + ': lolos semua pengecekan';
    }

    var lines = [];
    lines.push((result.valid ? '⚠️' : '❌') + ' ' + result.fileName + ':');

    result.errors.forEach(function(err) {
      lines.push('   ❌ ' + err);
    });

    result.warnings.forEach(function(warn) {
      lines.push('   ⚠️ ' + warn);
    });

    return lines.join('\n');
  }
};