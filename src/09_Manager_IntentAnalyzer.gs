/**
 * ===================================================================
 * INTENT ANALYZER
 * ===================================================================
 */
const IntentAnalyzer = {
  analyze(userMessage, context) {
    const prompt = this._buildPrompt(userMessage, context);
    const result = LLMProviderService.generateFromSinglePrompt(prompt, 0.7, 'fast');
    if (!result) {
      AppLogger.error('INTENT_ANALYZER_ALL_PROVIDERS_FAILED', 'Semua provider gagal');
      return null;
    }
    return this._parseResponse(result.text, result.provider);
  },

  _parseResponse(rawText, providerName) {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      AppLogger.info('INTENT_ANALYZER_SUCCESS',
        'Provider: ' + providerName + ' | Complexity: ' + (parsed.complexity || 'light'));
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
      this._personaSection(), '',
      'Sekarang: ' + nowStr + ' WIB.', '',
      this._riwayatSection(context.riwayat), '',
      this._factsSection(context.facts), '',
      this._profileSection(context.profile), '',
      this._ltmSection(context.ltm), '',
      this._reminderSection(context.reminderMenunggu), '',
      this._patternSection(context.ackPatterns), '',
      '=== PESAN BARU DARI USER ===',
      '"' + userMessage + '"', '',
      this._outputSchemaSection(), '',
      this._rulesSection()
    ].join('\n');
  },

  _personaSection() { return BOT_PERSONA; },

  _riwayatSection(r) {
    const isi = (r && r.length > 0)
      ? r.map(i => (i.role === 'ai' ? 'AI' : 'User') + ': ' + i.text).join('\n')
      : 'Belum ada.';
    return '=== RIWAYAT ===\n' + isi;
  },

  _factsSection(f) {
    const isi = (f && f.length > 0) ? f.map(x => '- ' + x).join('\n') : 'Belum ada.';
    return '=== FAKTA ===\n' + isi;
  },

  _profileSection(p) {
    const isi = (p && p.length > 0) ? p.map(x => '- ' + x).join('\n') : 'Belum ada.';
    return '=== PROFIL ===\n' + isi;
  },

  _ltmSection(l) {
    const isi = (l && l.length > 0) ? l.map(x => '- ' + x).join('\n') : 'Belum ada.';
    return '=== LTM ===\n' + isi;
  },

  _reminderSection(r) {
    const isi = (r && r.length > 0)
      ? r.map(x => '- ' + x.deskripsi).join('\n') : 'Tidak ada.';
    return '=== REMINDER ===\n' + isi;
  },

  _patternSection(p) {
    const isi = (p && p.length > 0)
      ? p.map(x => '- "' + x.pesan + '" -> ' + x.aksi).join('\n') : 'Belum ada.';
    return '=== POLA ===\n' + isi;
  },

  _outputSchemaSection() {
    return [
      'Balas HANYA JSON murni:',
      '{',
      '  "tipe": "ack_reminder" | "buat_reminder" | "chat_biasa" | "diagnose_error" | "update_docs" | "audit_code" | "fix_audit" | "check_changes" | "roadmap_query" | "implement_feature" | "self_query",',
      '  "complexity": "light" | "heavy",',
      '  "aksiReminder": "done" | "snooze" | null,',
      '  "reminderId": "string",',
      '  "snoozeMinit": number,',
      '  "alasan": "string",',
      '  "deskripsi": "string",',
      '  "waktuPertama": "dd/MM/yyyy HH:mm",',
      '  "jenisRecurring": "none" | "daily" | "weekly" | "monthly",',
      '  "recurringConfig": "string",',
      '  "prioritas": "Normal" | "Tinggi" | "Rendah",',
      '  "catatan": "string",',
      '  "jawabanChat": "string",',
      '  "butuhInfoTerkini": boolean,',
      '  "searchQuery": "string",',
      '  "factsBaru": [],',
      '  "profileUpdates": [{"key":"k","value":"v","category":"c"}],',
      '  "diagnose_error": {"keluhanUser": "string"},',
      '  "update_docs": {"instruksi": "string"},',
      '  "audit_code": {"scope": "full" | "light"},',
      '  "fix_audit": {"scope": "all" | "critical" | "critical+warning"},',
      '  "check_changes": {"mode": "full" | "quick"},',
      '  "roadmap_query": {"question": "string", "action": "ask" | "build" | "check_alignment" | "adapt"},',
      '  "implement_feature": {"idea": "string"},',
      '  "self_query": {"focus": "all" | "arsitektur" | "kemampuan" | "performa" | "pengetahuan" | "keterbatasan"}',
      '}'
    ].join('\n');
  },

  _rulesSection() {
    return [
      'Aturan:',
      '- ack_reminder: ada reminder + pesan seperti respon',
      '- buat_reminder: minta pengingat baru',
      '- "besok" = hari ini +1. Default 09:00',
      '- factsBaru: hanya eksplisit, jangan ulangi',
      '- profileUpdates: info personal baru',
      '- butuhInfoTerkini: hanya data real-time',
      '- diagnose_error: bot error/macet',
      '- update_docs: update dokumentasi',
      '- audit_code: review/audit kode',
      '- fix_audit: perbaiki hasil audit',
      '- check_changes: perubahan kode/sync docs',
      '- roadmap_query: roadmap/visi/ide baru',
      '- implement_feature: konfirmasi implementasi setelah blueprint',
      '- self_query: user bertanya tentang dirimu sendiri, kemampuanmu,',
      '  kelemahanmu, cara kerjamu, review dirimu, atau minta introspeksi.',
      '  Contoh: "kamu bisa apa?", "review dirimu", "apa kelemahanmu?",',
      '  "gimana cara kamu kerja?", "kamu tahu apa tentang aku?".',
      '  focus "all" untuk review lengkap, atau dimensi spesifik jika user',
      '  minta deep dive ke satu aspek.',
      '',
      'COMPLEXITY: light = santai/faktual. heavy = analisis/strategi.',
      'self_query, diagnose, audit, roadmap, implement: selalu heavy.'
    ].join('\n');
  }
};