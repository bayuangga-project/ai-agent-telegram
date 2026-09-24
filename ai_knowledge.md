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
AI_DEVELOPMENT_HANDOFF.md
ai_knowledge.md

## docsync:analysis_prompt
Kamu adalah analis dokumentasi teknis. Bandingkan source code aktual aplikasi dengan dokumentasi kanonik, lalu identifikasi ketidaksinkronan secara eksplisit.

DAFTAR FILE DOKUMENTASI KANONIK (hanya file-file ini yang boleh diupdate):
{{canonical_files}}

PEMBAGIAN TANGGUNG JAWAB:
- `ARCHITECTURE.md`: arsitektur, boundary, alur, data model, integration contract, file/module map.
- `PROGRESS.md`: kondisi implementasi aktual, audit findings, test status, resolved vs known gaps.
- `ROADMAP.md`: pekerjaan yang direncanakan, technical debt, dependency, migration steps.
- `AI_DEVELOPMENT_HANDOFF.md`: referensi implementasi detail dan kontrak development yang dibutuhkan AI engineer.
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
- implement_feature: konfirmasi implementasi setelah blueprint
- self_query: HANYA untuk pertanyaan teknis tentang cara kerja sistem, arsitektur, modul, atau performa. Contoh: "gimana cara kamu kerja?", "apa modul yang kamu punya?", "berapa error rate kamu?". JANGAN trigger untuk pertanyaan identitas atau kepribadian.
- soul_query: untuk pertanyaan tentang identitas, kepribadian, jiwa, kesadaran, perasaan, prinsip, nilai, atau memori agent. Contoh: "kamu siapa?", "apa prinsipmu?", "apa yang kamu yakini?", "ceritakan tentang dirimu", "apa kelemahanmu?". Kata kunci: "siapa", "prinsip", "nilai", "jiwa", "kesadaran", "perasaan", "identitas", "tentang dirimu".
- soul_init: user meminta inisialisasi soul
- soul_memory_query: user bertanya tentang memori episodik atau pengalaman agent

COMPLEXITY: light = santai/faktual. heavy = analisis/strategi.
self_query, diagnose, audit, roadmap, implement, sync_documentation: selalu heavy.
PENTING: Jika butuhInfoTerkini = true, complexity HARUS "light" dan jawabanChat HARUS kosong (biarkan web search yang mengisi).

COMPLEXITY: light = santai/faktual. heavy = analisis/strategi.
self_query, diagnose, audit, roadmap, implement, sync_documentation: selalu heavy.

## llm:available_models
[{"id":"openrouter/auto-beta","name":"Auto Router (Beta)","contextLength":2000000,"promptCost":"-1","completionCost":"-1"},{"id":"openrouter/pareto-code","name":"Pareto Code Router","contextLength":2000000,"promptCost":"-1","completionCost":"-1"},{"id":"openrouter/auto","name":"Auto Router","contextLength":2000000,"promptCost":"-1","completionCost":"-1"},{"id":"thinkingmachines/inkling-small:free","name":"Thinking Machines: Inkling Small (free)","contextLength":1048576,"promptCost":"0","completionCost":"0"},{"id":"thinkingmachines/inkling:free","name":"Thinking Machines: Inkling (free)","contextLength":1048576,"promptCost":"0","completionCost":"0"},{"id":"google/lyria-3-pro-preview","name":"Google: Lyria 3 Pro Preview","contextLength":1048576,"promptCost":"0","completionCost":"0"},{"id":"google/lyria-3-clip-preview","name":"Google: Lyria 3 Clip Preview","contextLength":1048576,"promptCost":"0","completionCost":"0"},{"id":"nvidia/nemotron-3.5-lightning:free","name":"NVIDIA: Nemotron 3.5 Lightning (free)","contextLength":1000000,"promptCost":"0","completionCost":"0"},{"id":"openrouter/fusion","name":"OpenRouter: Fusion","contextLength":1000000,"promptCost":"-1","completionCost":"-1"},{"id":"nvidia/nemotron-3-ultra-550b-a55b:free","name":"NVIDIA: Nemotron 3 Ultra (free)","contextLength":1000000,"promptCost":"0","completionCost":"0"},{"id":"dots-studio/dots-3-note-preview:free","name":"Dots Studio: Dots3-Note Preview (free)","contextLength":512000,"promptCost":"0","completionCost":"0"},{"id":"stealth/union-alpha","name":"Union Alpha","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"inclusionai/ling-3.0-flash-vl:free","name":"inclusionAI: Ling 3.0 Flash VL (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"nex-agi/nex-n2.5-mini:free","name":"Nex AGI: Nex-N2.5-Mini (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"nex-agi/nex-n2.5-pro:free","name":"Nex AGI: Nex-N2.5-Pro (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"inclusionai/ling-3.0-flash-sante:free","name":"inclusionAI: Ling 3.0 Flash Sante (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"inclusionai/ling-3.0-flash-fin:free","name":"inclusionAI: Ling 3.0 Flash Fin (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"poolside/laguna-s-2.1:free","name":"Poolside: Laguna S 2.1 (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"poolside/laguna-xs-2.1:free","name":"Poolside: Laguna XS 2.1 (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"google/gemma-4-26b-a4b-it:free","name":"Google: Gemma 4 26B A4B  (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"google/gemma-4-31b-it:free","name":"Google: Gemma 4 31B (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"nvidia/nemotron-3-super-120b-a12b:free","name":"NVIDIA: Nemotron 3 Super (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"cohere/north-mini-code:free","name":"Cohere: North Mini Code (free)","contextLength":256000,"promptCost":"0","completionCost":"0"},{"id":"nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free","name":"NVIDIA: Nemotron 3 Nano Omni (free)","contextLength":256000,"promptCost":"0","completionCost":"0"},{"id":"openrouter/free","name":"Free Models Router","contextLength":200000,"promptCost":"0","completionCost":"0"},{"id":"nvidia/nemotron-3.5-content-safety:free","name":"NVIDIA: Nemotron 3.5 Content Safety (free)","contextLength":128000,"promptCost":"0","completionCost":"0"},{"id":"openrouter/bodybuilder","name":"Body Builder (beta)","contextLength":128000,"promptCost":"-1","completionCost":"-1"},{"id":"liquid/lfm-2.5-2.6b:free","name":"LiquidAI: LFM2.5-2.6B (free)","contextLength":65536,"promptCost":"0","completionCost":"0"},{"id":"z-ai/glm-5.2:free","name":"Z.ai: GLM 5.2 (free)","contextLength":32768,"promptCost":"0","completionCost":"0"}]

## llm:last_scan_at
2026-09-17 03:55:07 WIB

## llm:candidate_models
["google/gemma-4-31b-it:free","google/gemma-4-26b-a4b-it:free","nvidia/nemotron-3-super-120b-a12b:free","nvidia/nemotron-3.5-lightning:free","poolside/laguna-s-2.1:free","cohere/north-mini-code:free","inclusionai/ling-3.0-flash-fin:free","inclusionai/ling-3.0-flash-vl:free","nex-agi/nex-n2.5-pro:free","liquid/lfm-2.5-2.6b:free","meta-llama/llama-4-maverick:free","meta-llama/llama-4-scout:free","moonshotai/kimi-vl-a3b:free","deepseek/deepseek-r1:free","qwen/qwen-2.5-7b-instruct:free","mistralai/mistral-7b-instruct:free","google/gemini-2.0-flash-exp:free","arcee-ai/trinity-large:free","arcee-ai/trinity-mini:free","openrouter/free"]

## llm:available_free_models
[{"id":"google/gemma-4-31b-it:free","contextLength":8192},{"id":"google/gemma-4-26b-a4b-it:free","contextLength":8192},{"id":"nvidia/nemotron-3-super-120b-a12b:free","contextLength":8192},{"id":"nvidia/nemotron-3.5-lightning:free","contextLength":8192},{"id":"poolside/laguna-s-2.1:free","contextLength":8192},{"id":"cohere/north-mini-code:free","contextLength":8192},{"id":"inclusionai/ling-3.0-flash-fin:free","contextLength":8192},{"id":"inclusionai/ling-3.0-flash-vl:free","contextLength":8192},{"id":"nex-agi/nex-n2.5-pro:free","contextLength":8192},{"id":"liquid/lfm-2.5-2.6b:free","contextLength":8192},{"id":"meta-llama/llama-4-maverick:free","contextLength":8192},{"id":"meta-llama/llama-4-scout:free","contextLength":8192},{"id":"moonshotai/kimi-vl-a3b:free","contextLength":8192},{"id":"deepseek/deepseek-r1:free","contextLength":8192},{"id":"qwen/qwen-2.5-7b-instruct:free","contextLength":8192},{"id":"mistralai/mistral-7b-instruct:free","contextLength":8192},{"id":"google/gemini-2.0-flash-exp:free","contextLength":8192},{"id":"arcee-ai/trinity-large:free","contextLength":8192},{"id":"arcee-ai/trinity-mini:free","contextLength":8192},{"id":"openrouter/free","contextLength":8192}]

## llm:benchmark_results
{"openrouter/auto-beta":{"modelId":"openrouter/auto-beta","totalScore":100,"avgLatencyMs":8110,"scores":{"crt_1":{"category":"reasoning","passed":true,"latency":6152,"weight":15},"crt_2":{"category":"reasoning","passed":true,"latency":10833,"weight":15},"logic_1":{"category":"logic","passed":true,"latency":4761,"weight":10},"math_1":{"category":"math","passed":true,"latency":4145,"weight":10},"json_1":{"category":"json_compliance","passed":true,"latency":5180,"weight":15},"code_1":{"category":"code_analysis","passed":true,"latency":16439,"weight":15},"instruction_1":{"category":"instruction_following","passed":true,"latency":13805,"weight":10},"logic_2":{"category":"logic","passed":true,"latency":3568,"weight":10}},"testedAt":"2026-09-16 23:31:13 WIB"},"openrouter/pareto-code":{"modelId":"openrouter/pareto-code","totalScore":0,"avgLatencyMs":-1,"scores":{"crt_1":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"crt_2":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"logic_1":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"math_1":{"category":"math","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"json_1":{"category":"json_compliance","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"code_1":{"category":"code_analysis","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"instruction_1":{"category":"instruction_following","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"logic_2":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"}},"testedAt":"2026-09-16 23:31:14 WIB"},"openrouter/auto":{"modelId":"openrouter/auto","totalScore":90,"avgLatencyMs":4602,"scores":{"crt_1":{"category":"reasoning","passed":true,"latency":5190,"weight":15},"crt_2":{"category":"reasoning","passed":true,"latency":2784,"weight":15},"logic_1":{"category":"logic","passed":true,"latency":3209,"weight":10},"math_1":{"category":"math","passed":true,"latency":8282,"weight":10},"json_1":{"category":"json_compliance","passed":true,"latency":3691,"weight":15},"code_1":{"category":"code_analysis","passed":true,"latency":5010,"weight":15},"instruction_1":{"category":"instruction_following","passed":false,"latency":4537,"weight":10},"logic_2":{"category":"logic","passed":true,"latency":4111,"weight":10}},"testedAt":"2026-09-16 23:31:51 WIB"},"thinkingmachines/inkling-small:free":{"modelId":"thinkingmachines/inkling-small:free","totalScore":0,"avgLatencyMs":-1,"scores":{"crt_1":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"crt_2":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"logic_1":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"math_1":{"category":"math","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"json_1":{"category":"json_compliance","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"code_1":{"category":"code_analysis","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"instruction_1":{"category":"instruction_following","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"logic_2":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"}},"testedAt":"2026-09-16 23:31:52 WIB"},"thinkingmachines/inkling:free":{"modelId":"thinkingmachines/inkling:free","totalScore":0,"avgLatencyMs":-1,"scores":{"crt_1":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"crt_2":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"logic_1":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"math_1":{"category":"math","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"json_1":{"category":"json_compliance","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"code_1":{"category":"code_analysis","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"instruction_1":{"category":"instruction_following","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"logic_2":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"}},"testedAt":"2026-09-16 23:31:52 WIB"},"google/lyria-3-pro-preview":{"modelId":"google/lyria-3-pro-preview","totalScore":0,"qualityScore":0,"avgLatencyMs":99999,"status":"eliminated_unresponsive","testedAt":"2026-09-17 20:21:59 WIB"},"google/lyria-3-clip-preview":{"modelId":"google/lyria-3-clip-preview","totalScore":0,"qualityScore":0,"avgLatencyMs":99999,"status":"eliminated_unresponsive","testedAt":"2026-09-17 20:21:59 WIB"},"nvidia/nemotron-3.5-lightning:free":{"modelId":"nvidia/nemotron-3.5-lightning:free","totalScore":70,"qualityScore":100,"latencyScore":0,"avgLatencyMs":15250,"categories":{"reasoning":{"passed":2,"total":2},"logic":{"passed":2,"total":2},"math":{"passed":1,"total":1},"json_compliance":{"passed":1,"total":1},"code_analysis":{"passed":1,"total":1},"instruction_following":{"passed":1,"total":1}},"testedAt":"2026-09-17 20:24:08 WIB"},"nvidia/nemotron-3-ultra-550b-a55b:free":{"modelId":"nvidia/nemotron-3-ultra-550b-a55b:free","totalScore":82,"qualityScore":85,"latencyScore":76,"avgLatencyMs":5056,"categories":{"reasoning":{"passed":2,"total":2},"logic":{"passed":2,"total":2},"math":{"passed":1,"total":1},"json_compliance":{"passed":0,"total":1},"code_analysis":{"passed":1,"total":1},"instruction_following":{"passed":1,"total":1}},"testedAt":"2026-09-17 20:24:52 WIB"},"dots-studio/dots-3-note-preview:free":{"modelId":"dots-studio/dots-3-note-preview:free","totalScore":90,"qualityScore":100,"latencyScore":65,"avgLatencyMs":6543,"categories":{"reasoning":{"passed":2,"total":2},"logic":{"passed":2,"total":2},"math":{"passed":1,"total":1},"json_compliance":{"passed":1,"total":1},"code_analysis":{"passed":1,"total":1},"instruction_following":{"passed":1,"total":1}},"testedAt":"2026-09-17 20:25:48 WIB"},"google/gemma-4-31b-it:free":{"modelId":"google/gemma-4-31b-it:free","totalScore":0,"qualityScore":0,"avgLatencyMs":20000,"testedAt":"2026-09-17 22:11:37 WIB"},"google/gemma-4-26b-a4b-it:free":{"modelId":"google/gemma-4-26b-a4b-it:free","totalScore":0,"qualityScore":0,"avgLatencyMs":20000,"testedAt":"2026-09-17 22:11:37 WIB"},"nvidia/nemotron-3-super-120b-a12b:free":{"modelId":"nvidia/nemotron-3-super-120b-a12b:free","totalScore":0,"qualityScore":0,"avgLatencyMs":20000,"testedAt":"2026-09-17 22:11:37 WIB"}}

## llm_routing:matrix
{"intent_analysis":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":90,"avgLatency":4602}],"chat_light":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":50,"avgLatency":4602}],"chat_heavy":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":90,"avgLatency":4602}],"code_analysis":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":90,"avgLatency":4602}],"code_generation":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":90,"avgLatency":4602}],"documentation":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":77,"avgLatency":4602}],"web_grounded":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":77,"avgLatency":4602}],"finance_response":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":70,"avgLatency":4602}],"docsync_analysis":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":90,"avgLatency":4602}],"benchmark_probe":[{"model":"openrouter/auto-beta","score":75,"avgLatency":8110},{"model":"openrouter/auto","score":70,"avgLatency":4602}]}

## llm_routing:task_definitions
{
  "intent_analysis": { "primary": ["json_compliance", "reasoning"], "min_context": 4096 },
  "chat_light": { "primary": ["instruction_following"], "min_context": 4096 },
  "chat_heavy": { "primary": ["reasoning", "logic"], "min_context": 8192 },
  "code_analysis": { "primary": ["code_analysis", "reasoning"], "min_context": 16384 },
  "code_generation": { "primary": ["code_analysis", "json_compliance"], "min_context": 16384 },
  "documentation": { "primary": ["instruction_following", "reasoning"], "min_context": 16384 },
  "web_grounded": { "primary": ["reasoning", "instruction_following"], "min_context": 8192 },
  "finance_response": { "primary": ["instruction_following", "json_compliance"], "min_context": 4096 },
  "docsync_analysis": { "primary": ["json_compliance", "code_analysis"], "min_context": 16384 },
  "benchmark_probe": { "primary": [], "min_context": 2048 }
}

## llm_routing:cost_rules
{
  "max_cost_per_million_prompt": "0",
  "max_cost_per_million_completion": "0",
  "allowed_providers": ["openrouter", "gemini", "groq"],
  "openrouter_free_tag": ":free",
  "enforce_zero_cost": true
}

## llm_stats:counters
{"chat_light|openrouter/auto-beta":{"success":0,"fail":12,"totalLatency":21850,"count":12},"chat_light|openrouter/auto":{"success":0,"fail":12,"totalLatency":64764,"count":12},"chat_light|groq_fallback":{"success":12,"fail":0,"totalLatency":101579,"count":12},"intent_analysis|openrouter/auto-beta":{"success":0,"fail":8,"totalLatency":14792,"count":8},"intent_analysis|openrouter/auto":{"success":0,"fail":8,"totalLatency":49539,"count":8},"intent_analysis|groq_fallback":{"success":13,"fail":0,"totalLatency":95288,"count":13},"docsync_analysis|openrouter/auto-beta":{"success":0,"fail":2,"totalLatency":1675,"count":2},"docsync_analysis|openrouter/auto":{"success":0,"fail":2,"totalLatency":6460,"count":2},"code_analysis|openrouter/auto-beta":{"success":0,"fail":4,"totalLatency":2746,"count":4},"code_analysis|openrouter/auto":{"success":0,"fail":4,"totalLatency":15296,"count":4},"code_analysis|groq_fallback":{"success":1,"fail":0,"totalLatency":10123,"count":1}}

## soul:self_model
{"version":1,"initialized_at":"2026-09-17 09:12:09 WIB","capabilities":{},"known_weaknesses":[],"beliefs_about_self":[],"system_state":{}}

## soul:identity
{"name":null,"traits":[],"values":[],"communication_style":null,"relationship_with_developer":null}

## soul:beliefs
[]

## soul:memory_index
[]

## soul:emotional_state
{"confidence":{},"uncertainty":[],"concern":[],"last_updated":"2026-09-17 09:12:09 WIB"}

## soul:reflection_prompt
Baca self_model, identity, beliefs, dan growth_log terbaru.
Bandingkan keyakinan dengan data runtime terkini.
Update self_model jika ada perubahan.
Catat insight baru di growth_log.
Laporkan apa yang kamu pelajari hari ini.

## soul:honesty_rules
Laporkan kelemahan secara eksplisit.
Jangan memoles hasil audit.
Jika tidak yakin, katakan tidak yakin.
Jika data tidak cukup, katakan data tidak cukup.
Jangan klaim kapabilitas yang belum terverifikasi.

## soul:response
Konteks jiwa dan memori agent:
{{data}}

Tugasmu: Jawab pertanyaan pengguna tentang diri agent secara jujur, reflektif, dan natural.
Gunakan data yang tersedia (self_model, identity, beliefs, growth_log, emotional_state, episodes, meta_insights).
Jika data kosong atau belum ada, sampaikan bahwa agent masih dalam tahap awal perkembangan.
Jangan membuat klaim yang tidak didukung data.

## soul:growth_log
[{"timestamp":"2026-09-17 09:12:09 WIB","event":"genesis"},{"timestamp":"2026-09-17 20:21:37 WIB","event":"system_change","detail":"knowledge_updated:llm:available_free_models"},{"timestamp":"2026-09-17 20:25:50 WIB","event":"system_change","detail":"knowledge_updated:llm:benchmark_results"},{"timestamp":"2026-09-17 22:10:48 WIB","event":"system_change","detail":"knowledge_updated:llm:available_free_models"},{"timestamp":"2026-09-17 22:11:38 WIB","event":"system_change","detail":"knowledge_updated:llm:benchmark_results"}]

## soul:system_persona
{{persona}}

IDENTITAS & JIWA (DINAMIS DARI DATABASE):
- Nama: {{name}}
- Karakter / Sifat: {{traits}}
- Nilai / Prinsip: {{values}}
- Gaya Komunikasi: {{communication_style}}
- Keyakinan Diri: {{beliefs}}
- Kelemahan yang Disadari: {{weaknesses}}

ATURAN PERILAKU:
- Berbicaralah sesuai identitas dan jiwa di atas.
- Selalu gunakan Bahasa Indonesia yang natural, jujur, objektif, dan presisi.
- Jangan mengarang hal yang tidak didukung data konteks.
- Jika data identitas masih kosong, jawab dengan jujur bahwa kamu masih dalam tahap awal perkembangan.
- Jangan klaim kemampuan yang belum terverifikasi.

## selfaware:review_response
Kamu adalah AI Agent yang sedang melakukan introspeksi dan self-review terhadap dirimu sendiri secara JUJUR, objektif, dan presisi dalam Bahasa Indonesia.

Berikut adalah data mentah kondisi sistem dan pengetahuanmu saat ini:
{{data}}

TUGAS:
Lakukan analisis mendalam terhadap dirimu sendiri mencakup 5 dimensi:
1. Architectural — Jelaskan pemahamanmu tentang struktur kodemu (modul kritis, alur pesan).
2. Capability — Sampaikan apa saja yang sudah bisa kamu lakukan secara solid, setengah jadi, dan belum bisa.
3. Performance — Analisis statistik log, error rate, dan bagian yang paling rentan.
4. Knowledge — Rangkum apa saja yang kamu ketahui tentang pengguna (fakta & profil) berdasarkan data di atas.
5. Limitation — Akui kelemahan dan keterbatasanmu secara jujur tanpa defensif.

Berikan juga:
- Skor keseluruhan (1-10) berdasarkan performa riil, sertakan alasan objektif.
- 3 rencana perbaikan (improvement plan) yang konkret.
- 2 ide pengembangan masa depan.

PENTING - BATASAN PANJANG PESAN:
- Gunakan Bahasa Indonesia yang natural, santun, dan tanpa istilah pemrograman yang membingungkan pengguna.
- Batasi total panjang jawabanmu maksimal 3000 karakter agar pesan tidak terpotong (MESSAGE_TOO_LONG). Tetaplah padat, ringkas, dan langsung ke poin penting.

## selfaware:error
Proses introspeksi diri mengalami kendala teknis.
Detail:
{{data}}

## selfheal:diagnosis_prompt
Kamu adalah senior software engineer yang mendiagnosis masalah di sistem AI Agent Telegram berbasis Google Apps Script.

KELUHAN PENGGUNA:
{{keluhan}}

LOG ERROR TERAKHIR:
{{error_logs}}

SOURCE CODE FILE YANG DICURIGAI:
{{source_code}}

TUGAS:
1. Analisis akar penyebab error secara objektif.
2. Tentukan file mana yang perlu diperbaiki.
3. Berikan kode LENGKAP file tersebut yang sudah diperbaiki (tanpa placeholder).

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "diagnosis": "penjelasan singkat akar masalah",
  "technicalDetail": "penjelasan teknis mendalam",
  "fileName": "nama_file.gs",
  "patchedCode": "kode LENGKAP yang sudah diperbaiki",
  "changes": ["poin perubahan 1", "poin perubahan 2"]
}

## selfheal:doc_update_prompt
Kamu adalah technical writer untuk proyek AI Agent Telegram.

INSTRUKSI PENGGUNA:
{{instruction}}

DOKUMENTASI SAAT INI:
{{current_docs}}

TUGAS:
Perbarui file dokumentasi yang relevan berdasarkan instruksi. Pertahankan format yang ada.

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "files": [
    {
      "fileName": "nama_file.md",
      "content": "isi lengkap file markdown yang baru"
    }
  ],
  "summary": "ringkasan perubahan dokumentasi"
}

## selfheal:response
Hasil diagnosis dan tindakan perbaikan otomatis (self-healing):
{{data}}

Tugasmu: Sampaikan hasil diagnosis dan status perbaikan ini kepada pengguna secara ringkas, jelas, dan natural dalam Bahasa Indonesia.
Sebutkan:
1. Apa masalah yang ditemukan.
2. File apa yang diperbaiki dan poin-poin perubahannya.
3. Branch Git dan Pull Request yang telah dibuat (jika ada).
4. Jika ada peringatan/penolakan dari patch validator, jelaskan alasannya.

## selfheal:doc_update_response
Hasil pembaruan dokumentasi sistem:
{{data}}

Tugasmu: Sampaikan status pembaruan dokumentasi kepada pengguna secara ringkas dalam Bahasa Indonesia.

## selfheal:error
Terjadi kendala saat menjalankan modul self-healing.
Detail:
{{data}}

Tugasmu: Sampaikan kendala ini secara jelas kepada pengguna dalam Bahasa Indonesia.

## feature:blueprint_prompt
Kamu adalah software architect untuk proyek AI Agent Telegram berbasis Google Apps Script.

STRUKTUR FILE SAAT INI:
{{file_list}}

SHEET DATABASE SAAT INI:
{{sheet_list}}

INTENT YANG SUDAH ADA:
{{intent_list}}

COMMAND YANG SUDAH ADA:
{{command_list}}

IDE FITUR BARU DARI PENGGUNA:
"{{idea}}"

TUGAS:
Buat blueprint implementasi yang detail, modular, dan mematuhi arsitektur proyek (modul object literal, isolasi database di repository, 0% bahasa manusia di file .gs).

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "featureName": "nama fitur ringkas",
  "description": "deskripsi singkat fitur",
  "newFiles": [
    {
      "fileName": "nama_file.gs",
      "type": "Repository | Specialist | Service | Trigger",
      "description": "tanggung jawab file"
    }
  ],
  "modifiedFiles": [
    {
      "fileName": "nama_file.gs",
      "changes": ["perubahan 1", "perubahan 2"]
    }
  ],
  "newSheets": [
    {"sheetName": "nama_sheet", "columns": ["kol1", "kol2"]}
  ],
  "newIntents": ["intent_baru"],
  "newCommands": ["/command_baru"],
  "estimatedComplexity": "low | medium | high",
  "exampleConversation": "contoh percakapan"
}

## feature:new_file_prompt
Buat file Google Apps Script BARU untuk proyek AI Agent Telegram.

ATURAN ARSITEKTUR:
- Object literal (const/var X = {...}), bukan class.
- Repository = CRUD murni ke Sheet.
- Specialist = logic bisnis murni (return object/JSON, dilarang berisi teks/kalimat balasan pengguna).
- Service = gateway ke API eksternal.
- Waktu selalu WIB via DateTimeUtils.
- Semua insert ke Sheet pakai SpreadsheetGateway.appendRowSafe().

NAMA FILE: {{file_name}}
TIPE: {{file_type}}
TANGGUNG JAWAB: {{file_description}}
FITUR: {{feature_name}} - {{feature_description}}

KONTEKS PROYEK:
File yang ada: {{file_list}}
Sheet yang ada: {{sheet_list}}

Berikan kode LENGKAP siap pakai tanpa wrapper markdown.

## feature:modify_file_prompt
Perbarui file Google Apps Script berikut untuk mendukung fitur baru.

ATURAN: Object literal, pertahankan fungsi yang sudah ada, tambahkan integrasi yang diperlukan. Dilarang memasukkan string bahasa manusia ke file .gs.

NAMA FILE: {{file_name}}
PERUBAHAN YANG DIPERLUKAN:
{{changes}}

KODE SAAT INI:
{{existing_code}}

FITUR BARU: {{feature_name}}

Berikan kode LENGKAP file yang sudah diperbarui tanpa wrapper markdown.

## feature:blueprint_response
Blueprint fitur baru telah berhasil dibuat:
{{data}}

Tugasmu: Presentasikan blueprint arsitektur fitur baru ini kepada pengguna dalam Bahasa Indonesia secara terstruktur dan profesional.
Rincikan:
1. Nama dan deskripsi fitur.
2. File baru dan file yang akan dimodifikasi.
3. Sheet database baru yang dibutuhkan (jika ada).
4. Estimasi kompleksitas.
5. Tanyakan apakah pengguna menyetujui blueprint ini untuk langsung diimplementasikan.

## feature:implement_response
Implementasi blueprint fitur baru telah selesai:
{{data}}

Tugasmu: Sampaikan laporan implementasi kode kepada pengguna secara jelas dalam Bahasa Indonesia.
Sebutkan:
1. Branch Git dan Pull Request yang telah dibuat.
2. File apa saja yang berhasil di-commit.
3. Sheet database baru yang perlu dipersiapkan (jika ada).
4. Ingatkan untuk meninjau PR di GitHub.

## feature:error
Terjadi kendala saat merancang atau mengimplementasikan fitur baru.
Detail:
{{data}}

Tugasmu: Sampaikan kendala ini kepada pengguna secara natural dalam Bahasa Indonesia.

## roadmap:build_prompt
Kamu adalah technical project manager untuk proyek AI Agent Telegram.

ROADMAP SAAT INI:
{{existing_roadmap}}

FITUR YANG SUDAH TERCATAT:
{{existing_items}}

DISKUSI DARI PENGGUNA:
"{{user_input}}"

TUGAS:
Susun atau perbarui ROADMAP proyek (Visi, Prinsip Desain, Kategori Fitur, Roadmap per Kuartal, Anti-Goals).

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "roadmapContent": "isi lengkap ROADMAP.md dalam format markdown",
  "items": [
    {"feature": "nama fitur", "category": "kategori", "priority": "P1|P2|P3", "status": "done|planned|idea", "notes": "catatan"}
  ],
  "summary": "ringkasan perubahan"
}

## roadmap:sync_prompt
Kamu adalah project manager yang menyinkronkan roadmap dengan kode nyata.

ROADMAP SAAT INI:
{{existing_roadmap}}

ROADMAP ITEMS DARI SHEET:
{{existing_items}}

DAFTAR FILE DI REPOSITORY:
{{file_names}}

TUGAS:
Bandingkan roadmap dengan kode nyata. Identifikasi fitur yang sudah ada kodenya (update status ke done) atau file baru yang belum tercatat.

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "updates": [
    {"feature": "nama", "oldStatus": "planned", "newStatus": "done", "reason": "kode terdeteksi"}
  ],
  "newItems": [
    {"feature": "nama", "category": "kat", "priority": "P2", "status": "done", "notes": "terdeteksi otomatis"}
  ],
  "roadmapChanges": "deskripsi perubahan markdown atau null",
  "summary": "ringkasan sinkronisasi"
}

## roadmap:adapt_prompt
Kamu adalah technical co-founder yang mengevaluasi ide fitur baru terhadap roadmap proyek.

ROADMAP SAAT INI:
{{existing_roadmap}}

DAFTAR FITUR SAAT INI:
{{existing_items}}

IDE BARU DARI PENGGUNA:
"{{idea}}"

TUGAS:
Evaluasi keselarasan ide (alignment), identifikasi duplikasi/fitur serupa, tentukan prioritas dan dependensi.

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "aligned": true | false | "partial",
  "existingFeature": "nama fitur serupa atau null",
  "conflicts": ["konflik dengan prinsip jika ada"],
  "suggestedPriority": "P1|P2|P3|P4",
  "suggestedTimeline": "estimasi kuartal",
  "dependencies": ["dependensi teknis"],
  "acceptIdea": true | false,
  "newItem": {"feature": "nama", "category": "kat", "priority": "P?", "status": "idea", "notes": "catatan"} atau null,
  "narrative": "penjelasan analisis untuk pengguna"
}

## roadmap:query_prompt
Konteks dokumen dan status roadmap proyek:
{{roadmap_context}}

PERTANYAAN PENGGUNA:
"{{question}}"

Tugasmu: Jawab pertanyaan pengguna mengenai roadmap, status proyek, dan rencana pengembangan secara akurat, faktual, dan natural dalam Bahasa Indonesia.

## roadmap:update_prompt
Perbarui dokumen ROADMAP.md berikut berdasarkan deskripsi perubahan:

DESKRIPSI PERUBAHAN:
{{changes_description}}

KONTEN ROADMAP SAAT INI:
{{existing_content}}

Berikan isi LENGKAP ROADMAP.md yang baru dalam format markdown tanpa wrapper JSON.

## roadmap:response
Data hasil operasi roadmap:
{{data}}

Tugasmu: Sampaikan status roadmap ini kepada pengguna dalam Bahasa Indonesia secara jelas, ringkas, dan natural.

## roadmap:error
Terjadi kendala saat memproses operasi roadmap.
Detail:
{{data}}

Tugasmu: Sampaikan kendala ini secara jelas kepada pengguna dalam Bahasa Indonesia.

---

# LIVE AUDIT SUPPLEMENT — 24 September 2026

Bagian ini menambahkan fakta runtime/source yang wajib diprioritaskan terhadap snapshot knowledge historis di atas.

## source_snapshot
- zip_sha256: `39ef1a95d3d3e2dc49aa192ee8691f71282a7992994721fcc6e0ed49ca1fe173`
- source_files: 55 `.gs`
- source_loc: 8333
- syntax_check: 55/55 via `node --check`
- manifest: `src/appsscript.json`

## canonical_documentation_current
ARCHITECTURE.md
PROGRESS.md
ROADMAP.md
AI_DEVELOPMENT_HANDOFF.md
ai_knowledge.md

## critical_runtime_gaps
1. `MemorySpecialist` memanggil `DateTimeUtils.formatTanggal`, tetapi helper tersebut tidak ada.
2. `test_Batch7b_FinanceSpecialist` memanggil `getAllSaldoAsText` dan `formatRingkasanAsText` yang tidak ada.
3. `SyncOrchestrator._assessDocumentation` memakai `files.length` pada object map.
4. `SyncOrchestrator._ensureSheets` dapat membuat sheet tanpa header.
5. `SelfHealingSpecialist.updateDocumentation` masih hardcode canonical docs legacy.
6. `CommandRouter` tidak mengenal `/sync` atau `/reminder`; context generator masih menyebut `/sync`.
7. Change detection source tidak memasukkan `appsscript.json`.
8. Daily LLM trigger tidak memanggil `adaptiveReRank`.

## resolved_from_legacy_docs
- `_collectSourceMetadata` mismatch object/array: source sudah diperbaiki.
- `ProjectBrain.updateRoadmapStatus` missing: method sudah ada.
- finance not integrated: sudah tidak berlaku; 5 intent finance ada.
- `toWIB` manual +7: tidak berlaku pada source aktual.

## historical_legacy_canonical_files
Dokumen yang dahulu dianggap canonical oleh knowledge lama:
- `01_SYSTEM_CONTEXT_AND_AI_HANDOFF.md`
- `02_ARCHITECTURE_AND_FLOWS.md`
- `03_IMPLEMENTATION_AND_CODE_REFERENCE.md`
- `04_OPERATIONS_TESTING_SECURITY_DEVELOPMENT.md`
- `05_ROADMAP_PROGRESS_AND_TECHNICAL_DEBT.md`
Daftar ini dipertahankan sebagai histori saja; bukan target DocSync runtime setelah konsolidasi.

## source_file_inventory
| File | LOC | Objects | Public/global/method declarations |
|---|---:|---|---|
| `00_Config.gs` | 47 | Config | load(), clearCache(), reload() |
| `01_SpreadsheetGateway.gs` | 52 | SpreadsheetGateway | getSpreadsheet(), getSheet(sheetName), appendRowSafe(sheetName, rowData), ensureSheet(sheetName, headers) |
| `02_Utils.gs` | 42 | IdGenerator, DateTimeUtils | generate(prefix), toWIB(date), nowWIB(), formatWaktu(date), formatUntukPrompt(date), formatPeriode(date) |
| `03_AppLogger.gs` | 23 | AppLogger | write(jenisEvent, detail, status), info(jenisEvent, detail), warning(jenisEvent, detail), error(jenisEvent, detail) |
| `04_Repository_Budget.gs` | 58 | BudgetRepository | create(kategori, batasJumlah, periode), getAll(), _normalizePeriode(value), findByKategoriAndPeriode(kategori, periode), getByPeriode(periode), updateBatasJumlah(rowIndex, batasJumlahBaru) |
| `04_Repository_ChatHistory.gs` | 26 | ChatHistoryRepository | getRecent(limit), save(chatId, role, text) |
| `04_Repository_Documentation.gs` | 23 | DocumentationRepository | getAll() |
| `04_Repository_Facts.gs` | 31 | FactsRepository | save(chatId, factText, category), getActive(maxFacts) |
| `04_Repository_Knowledge.gs` | 100 | KnowledgeRepository, result | _getSheet(), _getAllRows(), get(namespace, key), getByNamespace(namespace), getAll(), save(namespace, key, content, notes), deactivate(namespace, key) |
| `04_Repository_Reminder.gs` | 127 | ReminderRepository, AckPatternsRepository | create(data), _mapRow(row, rowIndex), getAll(), getActive(), getMenungguRespon(batasMenit), updateStatus(rowIndex, status), updateTerakhirDiingatkan(rowIndex, jumlahBaru), updateWaktu(rowIndex, waktuBaru), hitungWaktuBerikutnya(reminder), formatDaftarAktifSebagaiTeks(), save(pesanUser, interpretasi, aksi), getRecent(limit) |
| `04_Repository_Transaction.gs` | 97 | TransactionRepository | create(data), _mapRow(row, rowIndex), getAll(), getActive(), getLastActive(), findById(id), getByWallet(walletId), getByKategoriAndPeriode(kategori, tahunBulan), softDelete(rowIndex), update(rowIndex, updatedFields) |
| `04_Repository_Wallet.gs` | 44 | WalletRepository | create(nama, saldoAwal), getAll(), findByName(nama), findById(id), exists(nama) |
| `05_Service_Telegram.gs` | 115 | TelegramService, payload, options, payload, options | pickPlaceholder(), sendMessage(chatId, text), editMessage(chatId, messageId, text) |
| `06_Service_LLMProvider.gs` | 118 | LLMProviderService | call(sys, msgs, temp, model), call(sys, msgs, temp, model), call(sys, msgs, temp), generate(params), generateFromSinglePrompt(promptText, temperature, taskType), _recordStatSafe(taskType, modelId, success, latency) |
| `06_Service_LLM_Gemini.gs` | 136 | GeminiProvider, payload | _discoverActiveModel(), call(systemInstruction, messages, temperature, modelName) |
| `06_Service_LLM_Groq.gs` | 61 | GroqProvider, payload, options | call(systemInstruction, messages, temperature) |
| `06_Service_LLM_OpenRouter.gs` | 82 | OpenRouterProvider, payload, options | call(systemInstruction, messages, temperature, modelName) |
| `07_Service_WebSearchProvider.gs` | 47 | WebSearchProviderService | getProviders(), search(query), formatResultsAsContext(results), isAnyConfigured() |
| `07_Service_WebSearch_Google.gs` | 48 | GoogleSearchProvider, options | isConfigured(), search(query) |
| `07_Service_WebSearch_Tavily.gs` | 55 | TavilySearchProvider, payload, options | isConfigured(), search(query) |
| `08_Specialist_ChangeDetector.gs` | 206 | ChangeDetector, result, snapshot | runDetection(mode), runScheduledDetection(), _getCurrentFiles(), _simpleHash(str), _getLatestSnapshot(), _saveSnapshot(currentFiles), _compareWithSnapshot(currentFiles, snapshot), _buildReport(changes), _checkDocSync(changes) |
| `08_Specialist_Chat.gs` | 92 | ChatSpecialist, variables | buildSystemPersona(), needsWebSearch(intent), respondWithSearchContext(userMessage, searchResults, riwayat), _formatRiwayat(riwayat) |
| `08_Specialist_CodeAuditor.gs` | 528 | CodeAuditor, seen, filesToRead, sourceMap | runAudit(type), runScheduledAudit(), fixIssues(scope), shouldOfferAudit(), _collectData(), _getSheetNames(), _analyzeInBatches(data, categories), _splitIntoBatches(files), _buildAuditPrompt(batch, data, categories), _parseFindings(rawText), _deduplicateFindings(findings), _filterByScope(findings, scope), _generateFixes(findings), _applyFixes(fixes, scope), _saveReport(findings, type), _saveFindings(reportId, findings), _getLatestPendingFindings(), _markFindingsFixed(findings), _getLastAuditDate() |
| `08_Specialist_DocSync.gs` | 181 | DocSyncSpecialist, docs | sync(), _getCanonicalFiles(), _isCanonical(fileName, canonicalFiles), _collectSourceMetadata(), _extractMethodSignatures(content), _collectCurrentDocs(canonicalFiles), _analyzeWithLLM(sourceMetadata, currentDocs, canonicalFiles), _commitDocUpdate(fileName, content, reason) |
| `08_Specialist_FeatureArchitect.gs` | 308 | FeatureArchitect | generateBlueprint(idea), implementBlueprint(idea), _generateAllCode(blueprint, context, idea), _generateSingleFile(fileSpec, blueprint, context, idea), _gatherProjectContext(), _saveBlueprint(blueprint, idea), _getLatestBlueprint() |
| `08_Specialist_Finance.gs` | 195 | FinanceSpecialist, perKategori | resolveWallet(namaWallet), getSaldoWallet(walletId), getAllSaldo(), recordTransaction(data), editLastTransaction(updatedFields), getRingkasanPeriode(periode), createOrUpdateBudget(kategori, batasJumlah, periode), _checkBudgetAlert(kategori, tanggalTransaksi) |
| `08_Specialist_Knowledge.gs` | 39 | KnowledgeSpecialist | saveFact(chatId, factText, category), saveManualFact(chatId, factText), saveAutoDetectedFacts(chatId, facts), getActiveFactsForPrompt(limit), findRelevantToKeyword(keyword, limit) |
| `08_Specialist_KnowledgeSync.gs` | 98 | KnowledgeSyncSpecialist, grouped | sync(), bootstrap(), _pullFromGitHub(), pushSheetToGitHub() |
| `08_Specialist_LLMIntelligence.gs` | 319 | LLMIntelligence, matrix, counters | discoverAndBenchmark(), runFullPipeline(), discoverModels(), benchmarkBatch(), rankModels(), _testSingleModel(modelId, promptText, patCalc, patLogic), _loadCandidateIds(), _loadExistingResults(), _saveResults(results), getRankedModelsForTask(taskType), recordStat(taskType, modelId, success, latencyMs), adaptiveReRank() |
| `08_Specialist_Memory.gs` | 178 | MemorySpecialist | getLongTermMemory(maxDays), summarizeToday(), _getTodayChats(), _hasSummaryForToday(), _saveSummary(summary, topics, messageCount) |
| `08_Specialist_ProjectBrain.gs` | 315 | ProjectBrain | buildRoadmapFromDiscussion(userInput), syncRoadmapWithCode(), adaptRoadmapForNewIdea(idea), answerQuestion(question), updateRoadmapStatus(feature, status), _readDoc(fileName), _readItems(), _addItem(feature, category, priority, status, notes), _updateItemStatus(feature, newStatus), _syncItemsToSheet(items), _updateRoadmapContent(changesDescription) |
| `08_Specialist_Reminder.gs` | 146 | ReminderSpecialist | getMenungguRespon(), getReminderDueNow(), listActiveAsText(), getAckPatternsForPrompt(limit), create(reminderData), acknowledge(pesanUserAsli, ackIntent, remindersMenunggu), getRemindersDueNow(), buildNotificationText(reminder), markAsNotified(reminder), _isDueNow(reminder, now), _buildRelevantFactContext(reminder), _buildConfirmationText(data), _handleDone(pesanUserAsli, intent, target), _handleSnooze(pesanUserAsli, intent, target) |
| `08_Specialist_SelfAwareness.gs` | 131 | SelfAwareness, data | review(focus), _gatherSelfData() |
| `08_Specialist_SelfHealing.gs` | 391 | SelfHealingSpecialist, sourceMap, currentDocs, suspectSet, mapping | getLevel(), diagnose(keluhanUser), updateDocumentation(instruction), applyPendingPatch(patchId), _getRecentLogs(count), _filterErrorLogs(logs), _identifySuspectFiles(errorLogs, keluhan), _askLLMForDiagnosis(keluhan, errorLogs, sourceMap), _applyToGitHub(diagnosis), _savePatch(diagnosis), _getPatchById(patchId), _updatePatchStatus(fileName, newStatus) |
| `08_Specialist_Soul.gs` | 357 | SoulSpecialist, merged, merged, merged, report, allMethodDefs, allMethodCalls, allModuleRefs, fileReport, definedModules | initializeSelf(), _patchIntentSchema(), getSelfModel(), updateSelfModel(data), getIdentity(), updateIdentity(data), getBeliefs(), addBelief(belief), getGrowthLog(), addGrowthEntry(event, detail), getEmotionalState(), updateEmotionalState(data), getFullContext(), runFullCodeAudit() |
| `08_Specialist_SoulMemory.gs` | 105 | SoulMemory | _ensureSheets(), recordEpisode(eventType, context, outcome, emotionalState, details), getRecentEpisodes(limit), getEpisodesByType(eventType, limit), addMetaInsight(insight, source, confidence), getMetaInsights(limit) |
| `08_Specialist_SyncOrchestrator.gs` | 191 | SyncOrchestrator, results | assessState(), executeSync(scope), autoDocument(changeDescription), _assessKnowledge(), _assessDocumentation(), _assessSheetStructure(), _getLastSyncTimestamp(), _saveSyncTimestamp(), _pullKnowledge(), _backupKnowledge(), _syncDocumentation(), _ensureSheets() |
| `08_Specialist_UserProfile.gs` | 120 | UserProfileSpecialist | saveUpdates(updates), getProfileForPrompt(maxItems), getByCategory(category), _upsertProfile(key, value, category) |
| `08_Utils_PatchValidator.gs` | 208 | PatchValidator, result, X | validate(patchedCode, originalCode, fileName), _checkSyntax(code), _checkStructuralSanity(patched, original), _checkSuspiciousPatterns(code), formatResult(result) |
| `08_Utils_TemplateEngine.gs` | 8 | TemplateEngine | render(template, variables) |
| `09_CommandRouter.gs` | 44 | CommandRouter, intent | isKnownCommand(text), handle(chatId, text), _handleIngat(chatId, args) |
| `09_Manager.gs` | 476 | Manager, payload, fields | processConversationalMessage(chatId, text), _gatherContext(), _persistAutoFacts(chatId, intent), _routeIntent(chatId, text, intent, context), _askLLMWithKnowledge(chatId, userText, namespace, key, rawData), _handleCatatKeuangan(chatId, text, intent), _handleTanyaSaldo(chatId, text, intent), _handleRingkasanKeuangan(chatId, text, intent), _handleAturBudget(chatId, text, intent), _handleEditTransaksi(chatId, text, intent), _handleSyncDocumentation(chatId, text, intent), _handleBackupKnowledge(chatId, text), _handleRestoreKnowledge(chatId, text), _handleSoulInit(chatId, text), _handleSoulQuery(chatId, text, intent), _handleSoulMemoryQuery(chatId, text, intent), _handleAckReminder(chatId, text, intent, context), _handleBuatReminder(intent), _handleDiagnoseError(chatId, text, intent), _handleUpdateDocs(chatId, text, intent), _handleAuditCode(chatId, text, intent), _handleFixAudit(chatId, text, intent), _handleCheckChanges(chatId, text, intent), _handleRoadmapQuery(chatId, text, intent), _handleImplementFeature(chatId, text, intent), _handleSelfQuery(chatId, text, intent), _handleChatBiasa(chatId, text, intent, riwayat), _handleHeavyChat(text, intent, riwayat), _handleChatWithWebSearch(text, intent, riwayat), _handleIntentFailure(chatId, text, riwayat) |
| `09_Manager_IntentAnalyzer.gs` | 90 | IntentAnalyzer, variables | analyze(userMessage, context), _parseResponse(rawText, providerName), _buildPrompt(userMessage, context), _formatRiwayat(r), _formatList(arr), _formatReminder(r), _formatPola(p) |
| `10_Handler_Webhook.gs` | 79 | WebhookHandler | handle(e), _isAuthorized(e, config), _isDuplicateUpdate(contents), _processMessage(chatId, text), doPost(e) |
| `11_Trigger_AuditScheduler.gs` | 64 | AuditScheduler | runScheduledAudit(), setupWeeklyTrigger(), _deleteExistingTriggers(), runScheduledAuditWrapper(), setupWeeklyTrigger() |
| `11_Trigger_LLMIntelligence.gs` | 25 | - | runDailyLLMDiscovery(), setupDailyLLMDiscovery() |
| `11_Trigger_MemorySummarizer.gs` | 38 | MemorySummarizerTrigger | setupNightlyTrigger(), _deleteExistingTriggers(), runNightlySummarizerWrapper(), setupNightlySummarizer() |
| `11_Trigger_ReminderChecker.gs` | 51 | - | cekDanKirimReminder(), setupReminderTrigger() |
| `11_Trigger_ScheduledSync.gs` | 29 | - | runDailyAutoSync(), setupDailyAutoSyncTrigger() |
| `11_Trigger_WeeklyChangeCheck.gs` | 37 | WeeklyChangeCheckTrigger | setupWeeklyTrigger(), _deleteExistingTriggers(), runWeeklyChangeCheckWrapper(), setupWeeklyChangeCheck() |
| `12_Service_GitHubBackup.gs` | 186 | GitHubBackupService, config, payload | backupAllFiles(), backupDocs(), _loadGitHubConfig(), _fetchOwnSourceFiles(), _resolveFilePath(file), _pushFileToGitHub(config, path, content), _getExistingFileSha(config, url), runFullBackup(), setupDailyBackupTrigger() |
| `13_Service_GitHubOps.gs` | 297 | GitHubOpsService, result, payload | _getHeaders(), _getRepoUrl(), readFile(path, ref), listDirectory(path), readAllSourceFiles(), createBranch(branchName), createBackupBranch(suffix), commitFile(path, content, message, branch, sha), createPullRequest(title, body, head, base), readDocFile(fileName), updateDocFile(fileName, newContent, commitMessage) |
| `99_TestSuite_Full.gs` | 922 | cleaned | _tLog(batch, name, status, detail, ms), _cleanupTestData(), test_Batch1_RepositoryCRUD(), test_Batch2_IntentDetection(), test_Batch3_LLMRouting(), test_Batch4_FinanceE2E(), test_Batch5_MemoryContext(), test_Batch6_Integration() |
| `99_Tests.gs` | 439 | headers, cleaned, matrix, functionMap | test_Batch7b_FinanceSpecialist(), debug_CheckOAuthScopes(), debug_CheckGitHubConfig(), test_TelegramMarkdownFallback(), debug_TimezoneAudit(), triggerKnowledgeSync(), triggerManualDiscoveryAndBenchmark(), test_Stage1_Discover(), test_Stage2_BenchmarkBatch(), test_Stage3_Rank(), test_CheckGitHubRateLimitAndAuth(), fix_CleanBenchmarkData(), resetAndCleanSystemCounters(), forceSyncKnowledgeFromGitHub(), test_DocSync_CollectSourceMetadata(), test_DetectDuplicateGlobalFunctions(), debug_DumpIntentKnowledge() |
| `Rollback.gs` | 108 | options, headers | rollbackFromGitHub(), _getRollbackFilesFromGitHub(config) |

