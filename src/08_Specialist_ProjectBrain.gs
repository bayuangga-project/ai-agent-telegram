/**
 * SPECIALIST: PROJECT BRAIN
 * Tanggung jawab: memahami grand design, roadmap, dan status proyek.
 *
 * 3 Kemampuan Utama:
 * 1. buildRoadmap - Generate ROADMAP.md dari diskusi brainstorming
 * 2. syncRoadmap  - Sinkronkan roadmap vs kode, auto-update
 * 3. adaptRoadmap - Diskusi ide baru, sesuaikan roadmap dinamis
 *
 * Sumber data:
 * - ROADMAP.md dari GitHub (visi & narasi)
 * - Roadmap_Items dari Sheet (daftar fitur terstruktur)
 * - PROGRESS.md, ARCHITECTURE.md dari GitHub
 */
var ProjectBrain = {

  /**
   * ============================================================
   * KEMAMPUAN 1: BANGUN ROADMAP DARI DISKUSI
   * ============================================================
   * Dipicu saat user bilang "ayo susun roadmap", "buat roadmap", dll.
   */
  buildRoadmapFromDiscussion: function(userInput) {
    AppLogger.info('PROJECT_BRAIN_BUILD', 'Mulai build roadmap dari diskusi');

    var existingRoadmap = this._readDoc('ROADMAP.md');
    var existingProgress = this._readDoc('PROGRESS.md');
    var existingArch = this._readDoc('ARCHITECTURE.md');
    var existingItems = this._readItems();

    var prompt =
      'Kamu adalah co-founder teknis AI Agent Telegram.\n' +
      'User ingin menyusun/mengupdate ROADMAP proyek ini.\n\n' +
      'ROADMAP.md SAAT INI:\n' +
      (existingRoadmap || '(belum ada)') + '\n\n' +
      'PROGRESS.md SAAT INI:\n' +
      (existingProgress || '(belum ada)') + '\n\n' +
      'ARCHITECTURE.md (ringkasan):\n' +
      (existingArch ? existingArch.substring(0, 2000) : '(belum ada)') + '\n\n' +
      'FITUR YANG SUDAH ADA DI ROADMAP:\n' +
      (existingItems || '(kosong)') + '\n\n' +
      'INPUT DARI USER:\n"' + userInput + '"\n\n' +
      'TUGAS:\n' +
      'Berdasarkan input user dan kondisi proyek saat ini, buat atau update ROADMAP.md.\n' +
      'ROADMAP harus mencakup:\n' +
      '1. Visi (1-2 kalimat)\n' +
      '2. Prinsip Desain (3-5 poin)\n' +
      '3. Kategori Fitur\n' +
      '4. Roadmap per Kuartal (Q3 2026, Q4 2026, Q1 2027, dst)\n' +
      '5. Anti-Goals (yang TIDAK akan dibangun)\n\n' +
      'FORMAT OUTPUT (JSON tanpa wrapper markdown):\n' +
      '{\n' +
      '  "roadmapContent": "isi lengkap ROADMAP.md dalam format markdown",\n' +
      '  "items": [\n' +
      '    {"feature": "nama fitur", "category": "kategori", "priority": "P1/P2/P3", "status": "done/planned/idea", "notes": "catatan"}\n' +
      '  ],\n' +
      '  "summary": "ringkasan perubahan untuk user"\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.3, 'advanced');

    if (!llmResult || !llmResult.text) {
      return '❌ Gagal generate roadmap. Coba lagi nanti.';
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '')
                                  .replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      // Commit ROADMAP.md ke GitHub
      var commitOk = false;
      if (result.roadmapContent) {
        commitOk = GitHubOpsService.updateDocFile(
          'ROADMAP.md',
          result.roadmapContent,
          'docs: update ROADMAP.md dari diskusi'
        );
      }

      // Simpan items ke sheet
      if (result.items && result.items.length > 0) {
        this._syncItemsToSheet(result.items);
      }

      var reply = '🗺️ *Roadmap Berhasil Dibuat/Updated!*\n\n';
      reply += result.summary + '\n\n';
      reply += '📄 ROADMAP.md: ' + (commitOk ? '✅ ter-commit ke GitHub' : '❌ gagal commit') + '\n';
      reply += '📊 Roadmap Items: ' + (result.items ? result.items.length : 0) + ' fitur tersimpan\n\n';
      reply += 'Mau review isinya atau langsung lanjut ngobrol soal fitur?';

      return reply;

    } catch (e) {
      AppLogger.error('PROJECT_BRAIN_BUILD_FAIL', e.message);
      return '❌ Gagal parse hasil roadmap: ' + e.message;
    }
  },

  /**
   * ============================================================
   * KEMAMPUAN 2: SYNC ROADMAP DENGAN KODE
   * ============================================================
   * Dipanggil oleh ChangeDetector setiap minggu atau manual.
   * Membandingkan roadmap vs kode nyata, auto-update yang tidak sinkron.
   */
  syncRoadmapWithCode: function() {
    AppLogger.info('PROJECT_BRAIN_SYNC', 'Mulai sinkronisasi roadmap vs kode');

    var roadmap = this._readDoc('ROADMAP.md');
    var progress = this._readDoc('PROGRESS.md');
    var items = this._readItems();

    // Baca daftar file dari GitHub
    var allFiles = GitHubOpsService.listDirectory('src');
    var fileNames = allFiles.map(function(f) { return f.name; });

    var prompt =
      'Kamu adalah project manager yang menyinkronkan roadmap dengan kode nyata.\n\n' +
      'ROADMAP.md SAAT INI:\n' +
      (roadmap || '(belum ada)') + '\n\n' +
      'PROGRESS.md SAAT INI:\n' +
      (progress || '(belum ada)') + '\n\n' +
      'ROADMAP ITEMS (dari sheet):\n' +
      (items || '(kosong)') + '\n\n' +
      'FILE YANG ADA DI REPO (src/):\n' +
      fileNames.join('\n') + '\n\n' +
      'TUGAS:\n' +
      'Bandingkan roadmap dengan kode nyata. Identifikasi:\n' +
      '1. Fitur yang statusnya "planned"/"idea" di roadmap tapi KODENYA SUDAH ADA\n' +
      '   → harus diupdate ke "done"\n' +
      '2. File baru di repo yang TIDAK ADA di roadmap\n' +
      '   → harus ditambahkan ke roadmap\n' +
      '3. Fitur di roadmap yang kodenya BELUM ADA\n' +
      '   → tetap "planned", tidak masalah\n' +
      '4. Inkonsistensi antara ROADMAP.md dan Roadmap_Items\n' +
      '   → harus disinkronkan\n\n' +
      'FORMAT OUTPUT (JSON tanpa wrapper markdown):\n' +
      '{\n' +
      '  "updates": [\n' +
      '    {"feature": "nama", "oldStatus": "planned", "newStatus": "done", "reason": "kode sudah ada"}\n' +
      '  ],\n' +
      '  "newItems": [\n' +
      '    {"feature": "nama", "category": "kat", "priority": "P2", "status": "done", "notes": "terdeteksi dari kode"}\n' +
      '  ],\n' +
      '  "roadmapChanges": "deskripsi perubahan yang perlu dilakukan pada ROADMAP.md, atau null jika tidak perlu",\n' +
      '  "summary": "ringkasan untuk user"\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.2, 'advanced');

    if (!llmResult || !llmResult.text) {
      AppLogger.error('PROJECT_BRAIN_SYNC_LLM_FAIL', 'LLM gagal');
      return null;
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '')
                                  .replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      var changesMade = 0;

      // Update status items
      if (result.updates && result.updates.length > 0) {
        result.updates.forEach(function(u) {
          var ok = this._updateItemStatus(u.feature, u.newStatus);
          if (ok) changesMade++;
        }.bind(this));
      }

      // Tambah item baru
      if (result.newItems && result.newItems.length > 0) {
        result.newItems.forEach(function(item) {
          this._addItem(item.feature, item.category, item.priority, item.status, item.notes);
          changesMade++;
        }.bind(this));
      }

      // Update ROADMAP.md jika perlu
      if (result.roadmapChanges) {
        this._updateRoadmapContent(result.roadmapChanges);
        changesMade++;
      }

      AppLogger.info('PROJECT_BRAIN_SYNC_DONE', changesMade + ' changes');
      return result.summary || 'Sync selesai. ' + changesMade + ' perubahan dilakukan.';

    } catch (e) {
      AppLogger.error('PROJECT_BRAIN_SYNC_PARSE_FAIL', e.message);
      return null;
    }
  },

  /**
   * ============================================================
   * KEMAMPUAN 3: ADAPTASI ROADMAP UNTUK IDE BARU
   * ============================================================
   * Dipicu saat user usulkan ide baru.
   */
  adaptRoadmapForNewIdea: function(idea) {
    AppLogger.info('PROJECT_BRAIN_ADAPT', 'Ide baru: ' + idea);

    var roadmap = this._readDoc('ROADMAP.md');
    var items = this._readItems();
    var progress = this._readDoc('PROGRESS.md');

    var prompt =
      'Kamu adalah co-founder teknis yang mengevaluasi ide baru terhadap roadmap.\n\n' +
      'ROADMAP.md:\n' +
      (roadmap || '(belum ada)') + '\n\n' +
      'ROADMAP ITEMS:\n' +
      (items || '(kosong)') + '\n\n' +
      'PROGRESS:\n' +
      (progress || '(belum ada)') + '\n\n' +
      'IDE BARU DARI USER:\n"' + idea + '"\n\n' +
      'TUGAS:\n' +
      '1. Evaluasi apakah ide ini sejalan dengan visi\n' +
      '2. Cek apakah ada fitur serupa yang sudah ada\n' +
      '3. Tentukan prioritas dan timeline\n' +
      '4. Identifikasi dependency\n' +
      '5. Jika ide diterima, tentukan perubahan yang perlu dilakukan pada roadmap\n\n' +
      'FORMAT OUTPUT (JSON tanpa wrapper markdown):\n' +
      '{\n' +
      '  "aligned": true | false | "partial",\n' +
      '  "existingFeature": "nama fitur serupa atau null",\n' +
      '  "conflicts": ["konflik dengan prinsip/anti-goals, kosongkan jika tidak ada"],\n' +
      '  "suggestedPriority": "P1/P2/P3/P4",\n' +
      '  "suggestedTimeline": "kapan sebaiknya",\n' +
      '  "dependencies": ["hal yang harus siap dulu"],\n' +
      '  "acceptIdea": true | false,\n' +
      '  "newItem": {"feature": "nama", "category": "kat", "priority": "P?", "status": "idea", "notes": "catatan"} atau null,\n' +
      '  "roadmapUpdate": "perubahan pada ROADMAP.md jika ide diterima, atau null",\n' +
      '  "narrative": "penjelasan natural 3-5 kalimat untuk user"\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.3, 'advanced');

    if (!llmResult || !llmResult.text) {
      return 'Maaf, aku gagal menganalisis ide ini. Coba lagi nanti.';
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '')
                                  .replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      var reply = '💡 *Evaluasi Ide Baru*\n\n';
      reply += result.narrative + '\n\n';

      var alignIcon = result.aligned === true ? '✅' :
                      result.aligned === 'partial' ? '⚠️' : '❌';
      reply += alignIcon + ' *Alignment:* ' +
               (result.aligned === true ? 'Sejalan' :
                result.aligned === 'partial' ? 'Sebagian sejalan' : 'Tidak sejalan') + '\n';

      if (result.existingFeature) {
        reply += '📌 *Fitur serupa:* ' + result.existingFeature + '\n';
      }
      reply += '🏷️ *Prioritas:* ' + result.suggestedPriority + '\n';
      reply += '📅 *Timeline:* ' + result.suggestedTimeline + '\n';

      if (result.conflicts && result.conflicts.length > 0) {
        reply += '\n⚠️ *Konflik:*\n';
        result.conflicts.forEach(function(c) { reply += '• ' + c + '\n'; });
      }

      if (result.dependencies && result.dependencies.length > 0) {
        reply += '\n🔗 *Dependency:*\n';
        result.dependencies.forEach(function(d) { reply += '• ' + d + '\n'; });
      }

      if (result.acceptIdea && result.newItem) {
        reply += '\n✅ *Ide diterima!* Mau aku langsung tambahkan ke roadmap?';
        // Simpan sementara di sheet dengan status 'idea'
        this._addItem(
          result.newItem.feature,
          result.newItem.category,
          result.newItem.priority,
          'idea',
          result.newItem.notes
        );
      }

      return reply;

    } catch (e) {
      AppLogger.error('PROJECT_BRAIN_ADAPT_FAIL', e.message);
      return llmResult.text;
    }
  },

  /**
   * Jawab pertanyaan umum tentang roadmap.
   */
  answerQuestion: function(question) {
    AppLogger.info('PROJECT_BRAIN_QUERY', question);

    var roadmap = this._readDoc('ROADMAP.md');
    var items = this._readItems();
    var progress = this._readDoc('PROGRESS.md');

    var prompt =
      'Kamu adalah co-founder teknis AI Agent Telegram.\n\n' +
      'ROADMAP:\n' + (roadmap || '(belum ada)') + '\n\n' +
      'ITEMS:\n' + (items || '(kosong)') + '\n\n' +
      'PROGRESS:\n' + (progress || '(belum ada)') + '\n\n' +
      'PERTANYAAN: "' + question + '"\n\n' +
      'Jawab dengan bahasa natural, pakai "aku"/"kamu", rujuk data spesifik.';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.5, 'advanced');

    if (!llmResult || !llmResult.text) {
      return 'Maaf, aku kesulitan mengakses dokumen strategis. Coba lagi nanti.';
    }

    return llmResult.text;
  },

  /**
   * ============================================================
   * INTERNAL HELPERS
   * ============================================================
   */
  _readDoc: function(fileName) {
    var file = GitHubOpsService.readDocFile(fileName);
    return file ? file.content : null;
  },

  _readItems: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return '(kosong)';

      var lines = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][1]) {
          lines.push('- [' + data[i][4] + '] ' + data[i][1] +
            ' (' + data[i][2] + ', ' + data[i][3] + ')' +
            (data[i][6] ? ' — ' + data[i][6] : ''));
        }
      }
      return lines.length > 0 ? lines.join('\n') : '(kosong)';
    } catch (e) {
      return '(kosong)';
    }
  },

  _addItem: function(feature, category, priority, status, notes) {
    try {
      var id = 'RD-' + String(new Date().getTime()).slice(-4);
      SpreadsheetGateway.appendRowSafe('Roadmap_Items', [
        id, feature, category || 'General',
        priority || 'P3', status || 'idea', '', notes || ''
      ]);
      return true;
    } catch (e) {
      AppLogger.error('ROADMAP_ADD_FAIL', e.message);
      return false;
    }
  },

  _updateItemStatus: function(feature, newStatus) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var data = sheet.getDataRange().getValues();
      var featureLower = feature.toLowerCase();

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1]).toLowerCase().indexOf(featureLower) !== -1) {
          sheet.getRange(i + 1, 5).setValue(newStatus);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  _syncItemsToSheet: function(items) {
    var self = this;
    items.forEach(function(item) {
      // Cek apakah sudah ada
      var sheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var data = sheet.getDataRange().getValues();
      var found = false;

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1]).toLowerCase() === item.feature.toLowerCase()) {
          // Update existing
          sheet.getRange(i + 1, 3).setValue(item.category || data[i][2]);
          sheet.getRange(i + 1, 4).setValue(item.priority || data[i][3]);
          sheet.getRange(i + 1, 5).setValue(item.status || data[i][4]);
          sheet.getRange(i + 1, 7).setValue(item.notes || data[i][6]);
          found = true;
          break;
        }
      }

      if (!found) {
        self._addItem(item.feature, item.category, item.priority, item.status, item.notes);
      }
    });
  },

  _updateRoadmapContent: function(changesDescription) {
    var existing = this._readDoc('ROADMAP.md');
    if (!existing) return;

    var prompt =
      'Update ROADMAP.md berikut berdasarkan perubahan ini:\n\n' +
      'PERUBAHAN:\n' + changesDescription + '\n\n' +
      'ROADMAP.md SAAT INI:\n' + existing + '\n\n' +
      'Berikan isi LENGKAP ROADMAP.md yang sudah diupdate. ' +
      'Pertahankan format yang ada. Hanya ubah bagian yang relevan.\n\n' +
      'Output LANGSUNG isi markdown, tanpa JSON wrapper.';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.2, 'advanced');

    if (llmResult && llmResult.text) {
      GitHubOpsService.updateDocFile(
        'ROADMAP.md',
        llmResult.text.trim(),
        'docs: auto-sync roadmap dengan kode'
      );
    }
  }
};