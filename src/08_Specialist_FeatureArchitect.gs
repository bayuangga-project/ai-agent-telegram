/**
 * SPECIALIST: FEATURE ARCHITECT
 * Tanggung jawab: menerima ide baru dari user, brainstorming,
 * generate blueprint terstruktur, dan mengimplementasikan
 * fitur baru secara otomatis ke GitHub.
 *
 * Alur:
 * 1. User usulkan ide → ProjectBrain.adaptRoadmapForNewIdea()
 * 2. User setuju → FeatureArchitect.generateBlueprint()
 * 3. User konfirmasi → FeatureArchitect.implementBlueprint()
 * 4. Bot commit ke branch + buat PR + update roadmap
 */
var FeatureArchitect = {

  /**
   * Generate blueprint terstruktur dari ide user.
   * Blueprint berisi daftar file baru dan file yang perlu diubah.
   * @param {string} idea - Deskripsi fitur yang ingin dibangun
   * @returns {string} Blueprint untuk ditampilkan ke user
   */
  generateBlueprint: function(idea) {
    AppLogger.info('FEATURE_ARCHITECT_BLUEPRINT', idea);

    var context = this._gatherProjectContext();

    var prompt =
      'Kamu adalah senior software architect untuk proyek AI Agent Telegram ' +
      'berbasis Google Apps Script.\n\n' +
      'ATURAN DESAIN PROYEK (WAJIB DIPATUHI):\n' +
      '- Semua modul = object literal (var/const X = {...}), BUKAN class\n' +
      '- Lazy Evaluation: referensi modul lain dibungkus method\n' +
      '- Repository = CRUD murni ke Sheet, tidak tahu Telegram/LLM\n' +
      '- Specialist = business logic, boleh format teks, tidak kirim Telegram\n' +
      '- Service = titik akses ke API eksternal (Telegram, LLM, GitHub)\n' +
      '- Waktu selalu WIB via DateTimeUtils\n' +
      '- Semua insert pakai SpreadsheetGateway.appendRowSafe()\n' +
      '- Soft delete (ubah status), jangan hapus baris\n' +
      '- ID format PREFIX-timestamp via IdGenerator.generate()\n\n' +
      'STRUKTUR FILE SAAT INI:\n' +
      context.fileList + '\n\n' +
      'SHEET SAAT INI:\n' +
      context.sheetList + '\n\n' +
      'INTENT YANG SUDAH ADA:\n' +
      context.intentList + '\n\n' +
      'COMMAND YANG SUDAH ADA:\n' +
      context.commandList + '\n\n' +
      'IDE FITUR BARU:\n"' + idea + '"\n\n' +
      'TUGAS:\n' +
      'Buat blueprint implementasi yang detail dan realistis.\n\n' +
      'FORMAT OUTPUT (JSON tanpa wrapper markdown):\n' +
      '{\n' +
      '  "featureName": "nama fitur singkat",\n' +
      '  "description": "deskripsi 1-2 kalimat",\n' +
      '  "newFiles": [\n' +
      '    {\n' +
      '      "fileName": "nama file .gs",\n' +
      '      "type": "Repository | Specialist | Service | Trigger",\n' +
      '      "description": "tanggung jawab file ini"\n' +
      '    }\n' +
      '  ],\n' +
      '  "modifiedFiles": [\n' +
      '    {\n' +
      '      "fileName": "nama file .gs yang sudah ada",\n' +
      '      "changes": ["perubahan 1", "perubahan 2"]\n' +
      '    }\n' +
      '  ],\n' +
      '  "newSheets": [\n' +
      '    {"sheetName": "nama sheet", "columns": ["kol1", "kol2"]}\n' +
      '  ],\n' +
      '  "newIntents": ["tipe intent baru yang perlu ditambahkan"],\n' +
      '  "newCommands": ["/command baru"],\n' +
      '  "estimatedComplexity": "low | medium | high",\n' +
      '  "exampleConversation": "contoh percakapan user-bot setelah fitur jadi"\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.3, 'advanced');

    if (!llmResult || !llmResult.text) {
      return '❌ Gagal generate blueprint. Coba lagi nanti.';
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '')
                                  .replace(/```\n?/g, '').trim();
      var blueprint = JSON.parse(cleaned);

      // Simpan blueprint ke sheet untuk referensi saat implementasi
      this._saveBlueprint(blueprint, idea);

      return this._formatBlueprintForChat(blueprint);

    } catch (e) {
      AppLogger.error('FEATURE_ARCHITECT_BLUEPRINT_FAIL', e.message);
      return '❌ Gagal parse blueprint: ' + e.message;
    }
  },

  /**
   * Implementasi blueprint yang sudah dikonfirmasi user.
   * Generate kode untuk setiap file, commit ke branch, buat PR.
   * @param {string} idea - Ide fitur (untuk konteks)
   * @returns {string} Laporan implementasi
   */
  implementBlueprint: function(idea) {
    AppLogger.info('FEATURE_ARCHITECT_IMPLEMENT', idea);

    var blueprint = this._getLatestBlueprint();
    if (!blueprint) {
      return '❌ Tidak ada blueprint yang tersimpan. Jalankan generate blueprint dulu.';
    }

    var context = this._gatherProjectContext();
    var timestamp = new Date().getTime();
    var branchName = 'feature/' +
      blueprint.featureName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() +
      '-' + timestamp;

    // STEP 1: Buat backup + feature branch
    var backupBranch = GitHubOpsService.createBackupBranch('feature-' + timestamp);
    var branchOk = GitHubOpsService.createBranch(branchName);
    if (!branchOk) {
      return '❌ Gagal buat branch. Coba lagi nanti.';
    }

    // STEP 2: Generate kode untuk semua file
    var generatedFiles = this._generateAllCode(blueprint, context, idea);

    if (!generatedFiles || generatedFiles.length === 0) {
      return '❌ Gagal generate kode. Coba lagi nanti.';
    }

    // STEP 3: Validasi semua file
    var validFiles = [];
    var rejectedFiles = [];

    generatedFiles.forEach(function(file) {
      var original = GitHubOpsService.readFile('src/' + file.fileName);
      var originalContent = original ? original.content : null;

      var validation = PatchValidator.validate(
        file.code, originalContent, file.fileName
      );

      if (validation.valid) {
        validFiles.push({
          file: file,
          sha: original ? original.sha : null,
          validation: validation
        });
      } else {
        rejectedFiles.push({
          file: file,
          validation: validation
        });
      }
    });

    if (validFiles.length === 0) {
      return '🚫 Semua file ditolak validator. Tidak ada yang di-commit.';
    }

    // STEP 4: Commit semua file yang lolos
    var successCount = 0;
    var failCount = 0;
    var commitLog = [];

    validFiles.forEach(function(item) {
      var isNew = !item.sha;
      var ok = GitHubOpsService.commitFile(
        'src/' + item.file.fileName,
        item.file.code,
        (isNew ? 'feat: ' : 'update: ') + item.file.fileName,
        branchName,
        item.sha
      );

      if (ok) {
        successCount++;
        commitLog.push((isNew ? '🟢' : '🟡') + ' `' + item.file.fileName + '`');
      } else {
        failCount++;
        commitLog.push('❌ `' + item.file.fileName + '`');
      }

      Utilities.sleep(1000);
    });

    // STEP 5: Buat PR
    var prBody = '## 🚀 New Feature: ' + blueprint.featureName + '\n\n' +
                 blueprint.description + '\n\n' +
                 '## Files\n' + commitLog.join('\n') + '\n\n';

    if (blueprint.newSheets && blueprint.newSheets.length > 0) {
      prBody += '## ⚠️ Sheet Baru yang Perlu Dibuat Manual\n';
      blueprint.newSheets.forEach(function(s) {
        prBody += '- **' + s.sheetName + '**: ' + s.columns.join(', ') + '\n';
      });
      prBody += '\n';
    }

    if (rejectedFiles.length > 0) {
      prBody += '## 🚫 File yang Ditolak Validator\n';
      rejectedFiles.forEach(function(rf) {
        prBody += '- `' + rf.file.fileName + '`: ' +
                  rf.validation.errors.join('; ') + '\n';
      });
      prBody += '\n';
    }

    if (backupBranch) {
      prBody += '## Backup\n`' + backupBranch + '`\n\n';
    }

    prBody += '---\n_Generated by Feature Architect Agent_';

    var prUrl = GitHubOpsService.createPullRequest(
      '🚀 Feature: ' + blueprint.featureName,
      prBody,
      branchName,
      null
    );

    // STEP 6: Update roadmap
    ProjectBrain.updateRoadmapStatus(blueprint.featureName, 'in-progress');

    // STEP 7: Build reply
    var reply = '🚀 *Implementasi Selesai!*\n\n';
    reply += '📦 *Fitur:* ' + blueprint.featureName + '\n';
    reply += '🌿 *Branch:* `' + branchName + '`\n';
    if (prUrl) reply += '🔗 *PR:* ' + prUrl + '\n';
    reply += '\n📋 *File:*\n' + commitLog.join('\n') + '\n';

    if (blueprint.newSheets && blueprint.newSheets.length > 0) {
      reply += '\n⚠️ *Sheet yang perlu kamu buat manual:*\n';
      blueprint.newSheets.forEach(function(s) {
        reply += '• **' + s.sheetName + '** (kolom: ' + s.columns.join(', ') + ')\n';
      });
    }

    reply += '\n📌 *Langkah selanjutnya:*\n';
    reply += '1. Review PR di GitHub\n';
    reply += '2. Buat sheet baru jika ada (lihat di atas)\n';
    reply += '3. Merge PR\n';
    reply += '4. Deploy versi baru di GAS\n';
    reply += '5. Test fitur baru!';

    return reply;
  },

  /**
   * ============================================================
   * INTERNAL: Generate kode untuk semua file
   * ============================================================
   */
  _generateAllCode: function(blueprint, context, idea) {
    var filesToGenerate = [];

    // File baru
    if (blueprint.newFiles) {
      blueprint.newFiles.forEach(function(f) {
        filesToGenerate.push({
          fileName: f.fileName,
          isNew: true,
          description: f.description,
          type: f.type
        });
      });
    }

    // File yang perlu diubah
    if (blueprint.modifiedFiles) {
      blueprint.modifiedFiles.forEach(function(f) {
        var existing = GitHubOpsService.readFile('src/' + f.fileName);
        filesToGenerate.push({
          fileName: f.fileName,
          isNew: false,
          changes: f.changes,
          existingCode: existing ? existing.content : null
        });
      });
    }

    if (filesToGenerate.length === 0) return [];

    // Generate kode per file (1 LLM call per file untuk kualitas terbaik)
    var results = [];

    filesToGenerate.forEach(function(fileSpec) {
      AppLogger.info('FEATURE_ARCHITECT_GENERATE', fileSpec.fileName);

      var code = this._generateSingleFile(fileSpec, blueprint, context, idea);
      if (code) {
        results.push({
          fileName: fileSpec.fileName,
          code: code
        });
      }

      Utilities.sleep(500);
    }.bind(this));

    return results;
  },

  _generateSingleFile: function(fileSpec, blueprint, context, idea) {
    var prompt;

    if (fileSpec.isNew) {
      prompt =
        'Buat file Google Apps Script BARU untuk proyek AI Agent Telegram.\n\n' +
        'ATURAN: object literal (var X = {...}), bukan class. ' +
        'Lazy Evaluation untuk referensi modul lain.\n\n' +
        'NAMA FILE: ' + fileSpec.fileName + '\n' +
        'TIPE: ' + fileSpec.type + '\n' +
        'TANGGUNG JAWAB: ' + fileSpec.description + '\n' +
        'FITUR: ' + blueprint.featureName + ' — ' + blueprint.description + '\n\n' +
        'KONTEKS PROYEK:\n' +
        'File yang ada: ' + context.fileList + '\n' +
        'Sheet yang ada: ' + context.sheetList + '\n\n' +
        'Berikan kode LENGKAP siap pakai. Output LANGSUNG kode, tanpa wrapper.';
    } else {
      prompt =
        'Update file Google Apps Script yang sudah ada.\n\n' +
        'ATURAN: object literal, Lazy Evaluation. ' +
        'HANYA tambahkan/ubah yang diperlukan, pertahankan semua yang sudah ada.\n\n' +
        'NAMA FILE: ' + fileSpec.fileName + '\n' +
        'PERUBAHAN YANG DIPERLUKAN:\n' +
        (fileSpec.changes || []).map(function(c) { return '- ' + c; }).join('\n') + '\n\n' +
        'KODE SAAT INI:\n' +
        (fileSpec.existingCode || '(tidak terbaca)') + '\n\n' +
        'FITUR BARU: ' + blueprint.featureName + '\n\n' +
        'Berikan kode LENGKAP file yang sudah diupdate. Output LANGSUNG kode.';
    }

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.2, 'advanced');

    if (!llmResult || !llmResult.text) return null;

    // Bersihkan wrapper markdown jika ada
    var code = llmResult.text;
    code = code.replace(/^```javascript\n?/m, '');
    code = code.replace(/^```gs\n?/m, '');
    code = code.replace(/```\s*$/m, '');
    return code.trim();
  },

  /**
   * ============================================================
   * INTERNAL: Context & Storage
   * ============================================================
   */
  _gatherProjectContext: function() {
    var files = GitHubOpsService.listDirectory('src');
    var fileList = files.map(function(f) { return f.name; }).join(', ');

    var sheetList = '';
    try {
      var ss = SpreadsheetApp.openById(Config.load().spreadsheetId);
      sheetList = ss.getSheets().map(function(s) { return s.getName(); }).join(', ');
    } catch (e) {
      sheetList = '(tidak terbaca)';
    }

    return {
      fileList: fileList,
      sheetList: sheetList,
      intentList: 'ack_reminder, buat_reminder, chat_biasa, diagnose_error, ' +
                  'update_docs, audit_code, fix_audit, check_changes, ' +
                  'roadmap_query, implement_feature',
      commandList: '/ingat, /reminder, /diagnose, /logs, /patch, /audit, ' +
                   '/fix, /build'
    };
  },

  _saveBlueprint: function(blueprint, idea) {
    try {
      var sheet = SpreadsheetGateway.getSheet('SelfHeal_Patches');
      var id = IdGenerator.generate('BLUE');
      var timestamp = DateTimeUtils.nowWIB();
      SpreadsheetGateway.appendRowSafe('SelfHeal_Patches', [
        id,
        timestamp,
        'BLUEPRINT: ' + blueprint.featureName,
        idea,
        JSON.stringify(blueprint),
        'pending'
      ]);
    } catch (e) {
      AppLogger.error('FEATURE_ARCHITECT_SAVE_FAIL', e.message);
    }
  },

  _getLatestBlueprint: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('SelfHeal_Patches');
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][2]).indexOf('BLUEPRINT:') === 0 &&
            data[i][5] === 'pending') {
          return JSON.parse(data[i][4]);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  _formatBlueprintForChat: function(bp) {
    var reply = '📐 *Blueprint: ' + bp.featureName + '*\n\n';
    reply += bp.description + '\n\n';

    if (bp.newFiles && bp.newFiles.length > 0) {
      reply += '🟢 *File Baru (' + bp.newFiles.length + '):*\n';
      bp.newFiles.forEach(function(f) {
        reply += '• `' + f.fileName + '` (' + f.type + ')\n';
        reply += '  ' + f.description + '\n';
      });
      reply += '\n';
    }

    if (bp.modifiedFiles && bp.modifiedFiles.length > 0) {
      reply += '🟡 *File yang Diubah (' + bp.modifiedFiles.length + '):*\n';
      bp.modifiedFiles.forEach(function(f) {
        reply += '• `' + f.fileName + '`\n';
        f.changes.forEach(function(c) { reply += '  - ' + c + '\n'; });
      });
      reply += '\n';
    }

    if (bp.newSheets && bp.newSheets.length > 0) {
      reply += '📊 *Sheet Baru:*\n';
      bp.newSheets.forEach(function(s) {
        reply += '• ' + s.sheetName + ' (' + s.columns.join(', ') + ')\n';
      });
      reply += '\n';
    }

    if (bp.newIntents && bp.newIntents.length > 0) {
      reply += '🧠 *Intent Baru:* ' + bp.newIntents.join(', ') + '\n';
    }

    if (bp.newCommands && bp.newCommands.length > 0) {
      reply += '⌨️ *Command Baru:* ' + bp.newCommands.join(', ') + '\n';
    }

    reply += '\n⚙️ *Kompleksitas:* ' + (bp.estimatedComplexity || 'medium') + '\n';

    if (bp.exampleConversation) {
      reply += '\n💬 *Contoh Percakapan:*\n_' + bp.exampleConversation + '_\n';
    }

    reply += '\nSetuju dengan blueprint ini? Reply *"ya implement"* untuk mulai, ' +
             'atau kasih masukan kalau ada yang mau diubah.';

    return reply;
  }
};