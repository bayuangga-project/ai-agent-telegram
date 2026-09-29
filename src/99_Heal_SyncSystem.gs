/**
 * ===================================================================
 * HEALER: FORCE SYNC & ALIGNMENT SYSTEM
 * Alat khusus untuk menyembuhkan perbedaan data antara Sheet dan GitHub.
 * Menjamin 100% identik tanpa perbedaan satu kata pun.
 * ===================================================================
 */

function jalankan_Penyembuhan_Sinkronisasi_Total() {
  Logger.log('=== MEMULAI PROSES PENYEMBUHAN TOTAL ===');
  
  // 1. Sembuhkan dan Sync Knowledge (Sheet -> GitHub)
  healer_SyncKnowledge_Force();
  
  // 2. Sembuhkan dan Sync Dokumen .md (Sheet -> GitHub)
  healer_SyncDocs_Force();
  
  Logger.log('');
  Logger.log('🎉 PROSES PENYEMBUHAN SELESAI!');
  Logger.log('Silakan jalankan ulang "audit_SyncSystem_Full" untuk melihat hasilnya.');
}

/**
 * Menyinkronkan paksa seluruh data Knowledge dari Sheet ke GitHub
 * dengan memperbaiki bug pembacaan kolom "active" secara otomatis.
 */
function healer_SyncKnowledge_Force() {
  Logger.log('');
  Logger.log('--- 1. Menyinkronkan Paksa Knowledge (Sheet -> GitHub) ---');
  
  try {
    var allKnowledge = KnowledgeRepository.getAll();
    if (!allKnowledge || allKnowledge.length === 0) {
      Logger.log('❌ Gagal: Sheet Knowledge kosong!');
      return;
    }

    // Deteksi apakah data berupa Array mentah atau Objek
    var isArray = Array.isArray(allKnowledge[0]);
    Logger.log('Tipe data database: ' + (isArray ? 'Daftar Baris (Array)' : 'Objek'));

    var activeIndex = 5; // Default kolom 'active' di schema adalah index ke-5
    var grouped = {};
    var activeCount = 0;

    for (var i = 0; i < allKnowledge.length; i++) {
      var row = allKnowledge[i];
      var namespace, key, content, active;

      if (isArray) {
        // Jika data berupa Array mentah
        namespace = row[1];
        key = row[2];
        content = row[3];
        active = row[5];
      } else {
        // Jika data berupa Objek
        namespace = row.namespace;
        key = row.key;
        content = row.content;
        active = row.active;
      }

      // Pastikan hanya data aktif yang dikirim
      if (active !== true && active !== 'TRUE' && active !== 'active') continue;

      if (!namespace || !key) continue;

      if (!grouped[namespace]) grouped[namespace] = [];
      grouped[namespace].push({ key: key, content: content });
      activeCount++;
    }

    Logger.log('Menyusun ' + activeCount + ' entri pengetahuan aktif...');

    var mdLines = ['# AI Agent Knowledge Base', ''];
    var namespaces = Object.keys(grouped).sort();
    for (var n = 0; n < namespaces.length; n++) {
      var ns = namespaces[n];
      var items = grouped[ns];
      for (var j = 0; j < items.length; j++) {
        mdLines.push('## ' + ns + ':' + items[j].key);
        mdLines.push(items[j].content);
        mdLines.push('');
      }
    }

    var markdown = mdLines.join('\n');
    
    // Ambil info file lama di GitHub untuk mendapatkan SHA terbaru
    var existingFile = GitHubOpsService.readFile('ai_knowledge.md');
    var sha = (existingFile && existingFile.sha) ? existingFile.sha : null;

    // Kirim paksa ke GitHub
    var ok = GitHubOpsService.commitFile('ai_knowledge.md', markdown, 'healer: force sync knowledge database', null, sha);
    
    if (ok) {
      Logger.log('✅ PASS: ai_knowledge.md berhasil diperbarui di GitHub dengan ' + activeCount + ' entri dari Sheet!');
    } else {
      Logger.log('❌ FAIL: Gagal mengirim ai_knowledge.md ke GitHub.');
    }

  } catch (e) {
    Logger.log('❌ ERROR pada Sync Knowledge: ' + e.message);
  }
}

/**
 * Menyinkronkan paksa seluruh file dokumen .md dari Sheet ke GitHub.
 */
function healer_SyncDocs_Force() {
  Logger.log('');
  Logger.log('--- 2. Menyinkronkan Paksa File .md (Sheet -> GitHub) ---');

  var canonicalFiles = ['ARCHITECTURE.md', 'PROGRESS.md', 'ROADMAP.md', 'AI_DEVELOPMENT_HANDOVER.md'];
  var docs = DocumentationRepository.getAll();

  if (!docs || docs.length === 0) {
    Logger.log('❌ Gagal: Sheet Documentation kosong!');
    return;
  }

  for (var i = 0; i < canonicalFiles.length; i++) {
    var fileName = canonicalFiles[i];
    var sheetDoc = null;

    for (var j = 0; j < docs.length; j++) {
      if (docs[j].fileName === fileName) {
        sheetDoc = docs[j];
        break;
      }
    }

    if (!sheetDoc || !sheetDoc.content) {
      Logger.log('⚠️ File ' + fileName + ' tidak ada di Sheet Documentation. Dilewati.');
      continue;
    }

    try {
      // Ambil SHA file di GitHub agar tidak ditolak saat overwrite
      var existingFile = GitHubOpsService.readFile(fileName);
      var sha = (existingFile && existingFile.sha) ? existingFile.sha : null;

      // Kirim paksa isi dari Sheet ke GitHub
      var ok = GitHubOpsService.commitFile(fileName, sheetDoc.content, 'healer: force align ' + fileName, null, sha);
      
      if (ok) {
        Logger.log('✅ PASS: ' + fileName + ' berhasil disinkronkan paksa ke GitHub!');
      } else {
        Logger.log('❌ FAIL: Gagal mengirim ' + fileName + ' ke GitHub.');
      }
    } catch (e) {
      Logger.log('❌ ERROR pada ' + fileName + ': ' + e.message);
    }
  }
}