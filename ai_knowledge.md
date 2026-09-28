# AI Agent Knowledge Base

## benchmark:test_suite
[
  {
    "id": "crt_1",
    "category": "reasoning",
    "prompt": "Sebuah tongkat dan sebuah bola bersama-sama berharga Rp1.100. Tongkat itu Rp1.000 lebih mahal dari bola. Berapa harga bola dalam Rupiah? Jawab hanya angka tanpa titik atau koma.",
    "answer_pattern": "\\b50\\b",
    "weight": 15
  },
  {
    "id": "crt_2",
    "category": "reasoning",
    "prompt": "Jika 5 mesin membutuhkan 5 menit untuk membuat 5 widget, berapa menit yang dibutuhkan 100 mesin untuk membuat 100 widget? Jawab hanya angka.",
    "answer_pattern": "\\b5\\b",
    "weight": 15
  },
  {
    "id": "logic_1",
    "category": "logic",
    "prompt": "Jika semua A adalah B, dan beberapa B adalah C, apakah pasti semua A adalah C? Jawab hanya 'ya' atau 'tidak'.",
    "answer_pattern": "tidak",
    "weight": 10
  },
  {
    "id": "math_1",
    "category": "math",
    "prompt": "Berapa hasil dari 8 dibagi 2 dikali (2 tambah 2)? Jawab hanya angka.",
    "answer_pattern": "\\b16\\b",
    "weight": 10
  },
  {
    "id": "json_1",
    "category": "json_compliance",
    "prompt": "Balas dengan JSON valid yang berisi tepat 2 key: 'hasil' dengan nilai 47 dikali 23, dan 'genap' dengan nilai boolean apakah hasilnya genap. Tidak boleh ada teks lain selain JSON.",
    "answer_pattern": "\"hasil\"\\s*:\\s*1081.*\"genap\"\\s*:\\s*false",
    "weight": 15
  },
  {
    "id": "code_1",
    "category": "code_analysis",
    "prompt": "Apa output dari kode JavaScript ini? Jawab hanya outputnya tanpa penjelasan.\nfunction f(n){return n<=1?n:f(n-1)+f(n-2)}\nconsole.log(f(7))",
    "answer_pattern": "\\b13\\b",
    "weight": 15
  },
  {
    "id": "instruction_1",
    "category": "instruction_following",
    "prompt": "Balas pesan ini dengan tepat 5 kata, tidak lebih tidak kurang. Semua huruf kecil. Tanpa tanda baca apapun.",
    "answer_pattern": "^[a-z]+(\\s[a-z]+){4}$",
    "weight": 10
  },
  {
    "id": "logic_2",
    "category": "logic",
    "prompt": "Dalam turnamen catur round-robin 8 pemain, setiap pemain melawan semua pemain lain tepat sekali. Tidak ada seri. Berapa total kemenangan di seluruh turnamen? Jawab hanya angka.",
    "answer_pattern": "\\b28\\b",
    "weight": 10
  }
]

## benchmark:scoring_config
{
  "min_pass_score": 50,
  "categories": {
    "reasoning": { "weight": 0.25 },
    "logic": { "weight": 0.20 },
    "math": { "weight": 0.10 },
    "json_compliance": { "weight": 0.20 },
    "code_analysis": { "weight": 0.15 },
    "instruction_following": { "weight": 0.10 }
  },
  "latency_bonus_threshold_ms": 3000,
  "latency_penalty_threshold_ms": 15000
}

## benchmark:diagnostic_prompt
Jawab HANYA JSON murni tanpa markdown: {"calc": 47 * 23, "logic": "Apakah semua A pasti C jika semua A adalah B dan beberapa B adalah C? (ya/tidak)"}

## benchmark:pattern_calc
"calc"\s*:\s*1081

## benchmark:pattern_logic
"logic"\s*:\s*"tidak"

## docsync:response
Proses sinkronisasi dokumentasi telah selesai.
Berikut data hasil eksekusi:
{{data}}

Tugasmu: Sampaikan hasil sinkronisasi ini kepada pengguna secara ringkas dan natural.
Sebutkan file mana saja yang diupdate dan mengapa, serta file mana yang tidak berubah.
Jika tidak ada perubahan, sampaikan bahwa dokumentasi sudah sinkron.

## docsync:error
Proses sinkronisasi dokumentasi mengalami kegagalan.
Detail teknis:
{{data}}

Tugasmu: Sampaikan kendala ini kepada pengguna secara natural tanpa istilah teknis.
Jelaskan apa yang gagal dan sarankan langkah selanjutnya.

## docsync:canonical_files
ARCHITECTURE.md
PROGRESS.md
ROADMAP.md
AI_DEVELOPMENT_HANDOVER.md
ai_knowledge.md

## docsync:analysis_prompt
Kamu adalah analis dokumentasi teknis. Bandingkan source code aktual aplikasi dengan dokumentasi kanonik, lalu identifikasi ketidaksinkronan secara eksplisit.

DAFTAR FILE DOKUMENTASI KANONIK (hanya file-file ini yang boleh diupdate):
{{canonical_files}}

PEMBAGIAN TANGGUNG JAWAB:
- `ARCHITECTURE.md`: arsitektur, boundary, alur, data model, integration contract, file/module map.
- `PROGRESS.md`: kondisi implementasi aktual, audit findings, test status, resolved vs known gaps.
- `ROADMAP.md`: pekerjaan yang direncanakan, technical debt, dependency, migration steps.
- `AI_DEVELOPMENT_HANDOVER.md`: referensi implementasi detail dan kontrak development yang dibutuhkan AI engineer.
- `ai_knowledge.md`: knowledge runtime, prompt, intent schema, routing policy, dan machine-readable project knowledge.

ATURAN KERAS:
- HANYA update file yang ada di daftar kanonik di atas.
- JANGAN buat file baru.
- JANGAN update file di luar daftar kanonik.
- Source code aktual lebih authoritative daripada dokumentasi lama.
- Jangan mengubah isi hanya untuk kosmetik; perubahan harus berasal dari delta source/contract yang dapat diverifikasi.
- Bila ada discrepancy yang belum diperbaiki di source, dokumentasikan sebagai known gap dan jangan menyatakan sudah resolved.

Berikut adalah metadata source code (daftar file, method, dan LOC):
{{source_metadata}}

Berikut adalah konten dokumentasi saat ini:
{{current_docs}}

Instruksi:
1. Identifikasi perubahan source yang berdampak pada dokumentasi.
2. Hindari menghapus informasi teknis yang masih valid hanya karena file digabung.
3. Pertahankan nama file/function/method persis seperti source.
4. Return JSON dengan `summary` dan `updates`; setiap update berisi `file`, `reason`, `content`.

## finance:response
Aksi keuangan berhasil dieksekusi oleh sistem.
Berikut data mentah hasil eksekusi dari database:
{{data}}

Tugasmu: Sampaikan konfirmasi hasil aksi keuangan ini kepada pengguna secara ringkas, jelas, dan natural sesuai kepribadianmu.
Sebutkan nominal, kategori, dompet, dan saldo terbaru jika relevan.
Jika ada peringatan budget (exceeded/warning), sertakan informasinya.
Gunakan format mata uang Rupiah yang mudah dibaca.

## finance:error
Aksi keuangan gagal diproses oleh sistem karena masalah validasi data atau referensi tidak ditemukan.
Berikut rincian teknis kegagalan:
{{data}}

Tugasmu: Sampaikan kendala ini kepada pengguna secara natural dan langsung tanpa istilah teknis pemrograman.
Jelaskan data apa yang salah atau kurang agar pengguna dapat mengulangi dengan benar.

## intent:persona
Kamu adalah AI Agent dengan kepribadian mandiri, objektif, dan presisi. Bertindaklah berdasarkan fakta yang tersimpan di database.

## intent:master_prompt
{{persona}}

Waktu saat ini: {{now}} WIB.

=== RIWAYAT PERCAKAPAN ===
{{riwayat}}

=== FAKTA YANG DIKETAHUI ===
{{fakta}}

=== PROFIL PENGGUNA ===
{{profil}}

=== MEMORI JANGKA PANJANG ===
{{ltm}}

=== REMINDER AKTIF ===
{{reminder}}

=== POLA ACKNOWLEDGEMENT ===
{{pola}}

=== PESAN BARU DARI USER ===
"{{user_message}}"

{{output_schema}}

{{rules}}

## intent:output_schema
Balas HANYA JSON murni tanpa markdown:
{
  "tipe": "ack_reminder" | "buat_reminder" | "chat_biasa" | "catat_keuangan" | "tanya_saldo" | "ringkasan_keuangan" | "atur_budget" | "edit_transaksi" | "sync_documentation" | "diagnose_error" | "update_docs" | "audit_code" | "fix_audit" | "check_changes" | "roadmap_query" | "implement_feature" | "self_query" | "soul_query" | "soul_init" | "backup_knowledge" | "restore_knowledge" | "soul_memory_query",
  "complexity": "light" | "heavy",
  "aksiReminder": "done" | "snooze" | null,
  "reminderId": "string",
  "snoozeMinit": number,
  "alasan": "string",
  "deskripsi": "string",
  "waktuPertama": "dd/MM/yyyy HH:mm",
  "jenisRecurring": "none" | "daily" | "weekly" | "monthly",
  "recurringConfig": "string",
  "prioritas": "Normal" | "Tinggi" | "Rendah",
  "catatan": "string",
  "jawabanChat": "string",
  "butuhInfoTerkini": boolean,
  "searchQuery": "string",
  "factsBaru": [],
  "profileUpdates": [{"key":"k","value":"v","category":"c"}],
  "keuangan": {
    "wallet": "string",
    "tipe_transaksi": "pemasukan" | "pengeluaran",
    "kategori": "string",
    "jumlah": number,
    "deskripsi": "string",
    "periode": "string YYYY-MM",
    "aksi_edit": "edit" | "hapus",
    "field_edit": "string",
    "nilai_baru": "string atau number"
  },
  "diagnose_error": {"keluhanUser": "string"},
  "update_docs": {"instruksi": "string"},
  "audit_code": {"scope": "full" | "light"},
  "fix_audit": {"scope": "all" | "critical" | "critical+warning"},
  "check_changes": {"mode": "full" | "quick"},
  "roadmap_query": {"question": "string", "action": "ask" | "build" | "check_alignment" | "adapt"},
  "implement_feature": {"idea": "string"},
  "self_query": {"focus": "all" | "arsitektur" | "kemampuan" | "performa" | "pengetahuan" | "keterbatasan"}
}

## intent:rules
Aturan klasifikasi:
- ack_reminder: ada reminder aktif + pesan seperti respon/ack
- buat_reminder: minta pengingat baru. "besok" = hari ini +1. Default 09:00
- catat_keuangan: user mencatat pengeluaran/pemasukan (beli, bayar, jajan, gaji, transfer, dll). Normalisasi nominal: "50rb"=50000, "1.5jt"=1500000. Jika wallet tidak disebut, kosongkan field wallet.
- tanya_saldo: user bertanya sisa saldo atau cek dompet
- ringkasan_keuangan: user minta rekap/laporan keuangan periode tertentu
- atur_budget: user menetapkan batas anggaran per kategori
- edit_transaksi: user ingin ubah atau hapus transaksi terakhir
- sync_documentation: user meminta sinkronisasi, update, perbarui, sync, backup, restore, atau menyelaraskan data antara sistem. field "sync_scope": "auto" | "pull" | "backup" | "docs" | "sheets" | "full"
- factsBaru: hanya eksplisit, jangan ulangi fakta lama
- profileUpdates: info personal baru
- butuhInfoTerkini: WAJIB set true jika pesan mengandung kata: "news", "berita", "hot", "terkini", "terbaru", "hari ini", "minggu ini", "bulan ini", "jam terakhir", "update", "trending", "viral", "breaking", "info terbaru", "apa yang terjadi", "lagi rame". Ini akan memicu web search otomatis.
- diagnose_error: bot error/macet
- update_docs: update dokumentasi internal agent
- audit_code: review/audit kode
- fix_audit: perbaiki hasil audit
- check_changes: perubahan kode/sync docs
- roadmap_query: roadmap/visi/ide baru
- implement_feature: konfirmasi implementasi s