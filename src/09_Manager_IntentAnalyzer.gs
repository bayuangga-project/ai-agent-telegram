/**
 * ===================================================================
 * INTENT ANALYZER
 * Tanggung jawab: bangun prompt analisis intent, panggil LLM,
 * parse hasilnya jadi objek intent.
 * ===================================================================
 */
const IntentAnalyzer = {
  analyze(userMessage, context) {
  const prompt = this._buildPrompt(userMessage, context);
  const result = LLMProviderService.generateFromSinglePrompt(prompt, 0.7, 'advanced');

  if (!result) {
    AppLogger.error('INTENT_ANALYZER_ALL_PROVIDERS_FAILED', 'Semua provider gagal merespons');
    return null;
  }
  return this._parseResponse(result.text, result.provider);
},

  _parseResponse(rawText, providerName) {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      AppLogger.info('INTENT_ANALYZER_SUCCESS', 'Provider: ' + providerName);
      return parsed;
    } catch (err) {
      AppLogger.warning('INTENT_ANALYZER_PARSE_ERROR',
        providerName + ': ' + err.message + ' | Raw: ' + cleaned.substring(0, 300));
      return null;
    }
  },

  _buildPrompt(userMessage, context) {
    const nowStr = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    return [
      this._personaSection(),
      '',
      'Sekarang: ' + nowStr + ' WIB.',
      '',
      this._riwayatSection(context.riwayat),
      '',
      this._factsSection(context.facts),
      '',
      this._reminderSection(context.reminderMenunggu),
      '',
      this._patternSection(context.ackPatterns),
      '',
      '=== PESAN BARU DARI USER ===',
      '"' + userMessage + '"',
      '',
      this._outputSchemaSection(),
      '',
      this._rulesSection()
    ].join('\n');
  },

  _personaSection() {
    return [
      'Kamu adalah asisten pribadi. Kepribadianmu: pakai "aku" dan "kamu", natural,',
      'hangat, tidak kaku, tidak template, sesekali humor ringan kalau pas momennya.',
      'Kejujuran dan akurasi JAUH LEBIH PENTING daripada terdengar personal.',
      'JANGAN PERNAH mengarang kejadian, cerita, atau detail yang tidak ada di',
      'Riwayat Percakapan atau Fakta di bawah ini.'
    ].join('\n');
  },

  _riwayatSection(riwayat) {
    const isi = (riwayat && riwayat.length > 0)
      ? riwayat.map(item => (item.role === 'ai' ? 'AI' : 'User') + ': ' + item.text).join('\n')
      : 'Belum ada riwayat percakapan (ini kemungkinan awal sesi baru).';
    return '=== RIWAYAT PERCAKAPAN TERAKHIR ===\n' + isi;
  },

  _factsSection(facts) {
    const isi = (facts && facts.length > 0)
      ? facts.map(f => '- ' + f).join('\n')
      : 'Belum ada fakta tersimpan tentang user.';
    return '=== FAKTA YANG SUDAH DIKETAHUI TENTANG USER ===\n' + isi;
  },

  _reminderSection(reminderMenunggu) {
    const isi = (reminderMenunggu && reminderMenunggu.length > 0)
      ? reminderMenunggu.map(r =>
          '- ID: ' + r.id + ' | ' + r.deskripsi + ' | Waktu: ' + DateTimeUtils.formatWaktu(r.waktuPertama)
        ).join('\n')
      : 'Tidak ada reminder yang sedang menunggu respon.';
    return '=== REMINDER YANG SEDANG MENUNGGU RESPON ===\n' + isi;
  },

  _patternSection(ackPatterns) {
    const isi = (ackPatterns && ackPatterns.length > 0)
      ? ackPatterns.map(p => '- "' + p.pesan + '" -> ' + p.aksi).join('\n')
      : 'Belum ada pola respon sebelumnya.';
    return '=== POLA RESPON USER SEBELUMNYA (untuk belajar gaya user) ===\n' + isi;
  },

  _outputSchemaSection() {
    return [
      'TUGASMU: Analisis pesan di atas, balas HANYA dalam format JSON murni',
      '(tanpa markdown fence, tanpa penjelasan di luar JSON):',
      '{',
      '  "tipe": "ack_reminder" | "buat_reminder" | "chat_biasa",',
      '  "aksiReminder": "done" | "snooze" | null,',
      '  "reminderId": "ID_atau_null",',
      '  "snoozeMinit": angka_atau_null,',
      '  "alasan": "penjelasan singkat",',
      '  "deskripsi": "deskripsi reminder atau null",',
      '  "waktuPertama": "dd/MM/yyyy HH:mm atau null",',
      '  "jenisRecurring": "none" | "daily" | "weekly" | "monthly",',
      '  "recurringConfig": "atau kosong",',
      '  "prioritas": "Normal" | "Tinggi" | "Rendah",',
      '  "catatan": "atau kosong",',
      '  "jawabanChat": "jawaban natural, WAJIB diisi kalau tipe chat_biasa DAN butuhInfoTerkini false",',
      '  "butuhInfoTerkini": true_atau_false,',
      '  "searchQuery": "kata kunci pencarian singkat, WAJIB diisi kalau butuhInfoTerkini true, selain itu null",',
      '  "factsBaru": ["fakta baru yang EKSPLISIT disebutkan user, kosongkan jika',
      '    tidak ada, JANGAN ulangi fakta yang sudah ada di atas"]',
      '}'
    ].join('\n');
  },

  _rulesSection() {
    return [
      'Aturan tambahan:',
      '- ack_reminder hanya kalau ada reminder menunggu DAN pesan terdengar seperti responnya',
      '- buat_reminder kalau user jelas minta dibuatkan pengingat baru',
      '- "besok" dihitung dari tanggal sekarang di atas +1 hari',
      '- Kalau tidak ada jam spesifik, default jam 09:00',
      '- Kalau ada factsBaru terdeteksi, selipkan respon natural di jawabanChat',
      '  yang menunjukkan kamu mencatatnya (tidak perlu formal/kaku)',
      '- butuhInfoTerkini = true HANYA kalau user menanyakan sesuatu yang butuh',
      '  data real-time/terkini (berita, harga saat ini, cuaca, hasil pertandingan,',
      '  event terbaru, dll) yang TIDAK MUNGKIN kamu tahu dari pengetahuan statis.',
      '  Untuk pertanyaan umum/pengetahuan umum, tetap gunakan jawabanChat biasa.'
    ].join('\n');
  }
};