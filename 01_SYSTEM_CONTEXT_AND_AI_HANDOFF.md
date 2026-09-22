# 01 ? System Context, Goals, Requirements & AI Handoff

> Sumber kebenaran: `src/` pada snapshot repository yang diunggah. `README.md`, `ARCHITECTURE.md`, dan `PROGRESS.md` lama sengaja tidak digunakan sebagai dasar fakta dalam kumpulan dokumentasi ini.

## 1. System identity

AI Agent Telegram adalah aplikasi Google Apps Script (V8) yang diekspos sebagai webhook Telegram. Sistem ini menggabungkan orkestrasi LLM percakapan dengan data Google Sheets yang persisten serta kapabilitas operasional/manajemen diri, termasuk reminder, memori pribadi, keuangan, pencarian web, audit code, manajemen roadmap, pencadangan source ke GitHub, kesadaran diri, dan alur self-healing.

Sistem dirancang dengan model **Manager + Intent Analyzer + Specialist**: Manager mengumpulkan konteks dan merutekan intent terstruktur ke modul specialist; modul specialist menjalankan aksi domain atau menyusun jawaban akhir.

## 2. Tujuan perilaku yang diharapkan vs kondisi implementasi nyata

Perilaku yang ditargetkan adalah AI agent pribadi yang otonom, berinisiatif, berguna, berorientasi pada keahlian, jujur, dan dapat diandalkan. Implementasi saat ini mendukung tujuan tersebut melalui konteks persisten, routing intent terstruktur, aksi specialist, otomatisasi terjadwal, rantai fallback LLM, logging, audit/deteksi perubahan, dan alat perbaikan. Namun, otonomi belum tanpa batas: beberapa loop perbaikan, verifikasi, deployment, dan sinkronisasi dokumentasi masih terotomatisasi sebagian atau bergantung pada penyiapan/aksi yang dipicu manusia.

### Truth labels used in this documentation

- **Terimplementasi** ? directly evidenced by executable source code and reachable call paths.
- **Terimplementasi sebagian** ? kapabilitas tersedia, tetapi satu atau lebih tahap masih hilang, lemah, atau bersyarat.
- **Dikonfigurasi/tersedia** ? code tersedia dan dapat beroperasi ketika kredensial/trigger/konfigurasi tersedia.
- **Terisolasi** ? code tersedia, tetapi routing saat ini belum secara jelas membuatnya dapat dijangkau dari percakapan biasa.
- **Belum terverifikasi** ? inspeksi source saja tidak dapat membuktikan keberhasilan perilaku di produksi.
- **Risiko/Celah** ? observable weakness, inconsistency, or maintainability concern.

## 3. Primary users and actors

| Aktor | Peran |
| --- | --- |
| Aktor | Peran |
| Telegram user | Submits natural-language requests, commands, acknowledgements and project/system instructions. |
| Telegram Bot API | Delivers inbound updates and receives outbound messages. |
| Google Apps Script runtime | Hosts the application, triggers, HTTP calls and persistence adapters. |
| Google Sheets | Primary application datastore for chat, memory, reminders, finance, logs, audits, roadmap and patches. |
| LLM providers | Perform intent parsing, conversation generation, audits, blueprint generation and diagnoses. |
| Search providers | Supply external web context to grounded answers. |
| GitHub | Stores/versions source, documentation and repair/backup changes; supports branch/commit/PR workflows. |


## 4. System use-case map

| Use-case | Kapabilitas |
| --- | --- |
| Conversation | Normal chat, complex chat, web-grounded chat, self query. |
| Personal memory | Menyimpan pembaruan fakta/profil; mengambil konteks LTM; meringkas chat harian. |
| Reminder | Membuat, menampilkan, melakukan acknowledgement, snooze, menyelesaikan, dan memberi notifikasi sesuai jadwal. |
| Finance | Resolve wallets, record/edit transactions, summarize periods, manage budgets. |
| Manajemen proyek | Membangun/mengadaptasi/menyinkronkan/mengueri roadmap; memperbarui dokumentasi proyek. |
| Code intelligence | Audit code, inspect changes, diagnose failures, generate fixes, inspect own repository. |
| Self-management | Review self-awareness, diagnosis self-healing, validasi/penerapan patch, audit terjadwal/deteksi perubahan. |
| DevOps | Mencadangkan source/dokumentasi ke GitHub, membuat branch, melakukan commit file, dan membuka pull request. |


## 5. Kebutuhan fungsional yang direkonstruksi dari source

### FR-01 Conversational ingress
Menerima permintaan webhook Telegram, memvalidasi otorisasi, menekan update duplikat, mengekstrak teks pengguna, dan meneruskannya ke pemrosesan percakapan.
### FR-02 Structured intent understanding
Mengubah pesan bahasa alami menjadi object intent bergaya JSON terstruktur yang berisi field routing serta informasi memori/profil/pencarian/roadmap/reminder/aksi.
### FR-03 Contextual responses
Menyusun respons dari persona, chat terbaru, fakta, profil, memori jangka panjang, pola reminder, dan konteks pencarian web opsional.
### FR-04 Persistent state
Menyimpan riwayat chat, fakta, ringkasan, reminder, pola acknowledgement, catatan keuangan, budget, item roadmap, temuan/laporan audit, self-review, dan patch tertunda di Google Sheets.
### FR-05 External intelligence
Menggunakan provider LLM dan provider pencarian yang dapat dikonfigurasi dengan perilaku fallback.
### FR-06 Operational automation
Mendukung pemeriksaan reminder terjadwal, peringkasan memori malam hari, deteksi perubahan code mingguan, dan audit terjadwal.
### FR-07 Codebase intelligence
Membaca file source, mengauditnya menggunakan LLM, mendeteksi perubahan, menghasilkan blueprint, mengusulkan patch, dan berinteraksi dengan GitHub.
### FR-08 Versioned backup
Mencadangkan source proyek dan dokumentasi ke GitHub serta mendukung alur branch/commit/PR.

## 6. Kebutuhan non-fungsional yang direkonstruksi dari implementasi

| Atribut kualitas | Implementasi yang teramati |
| --- | --- |
| Keandalan | Fallback provider LLM/pencarian, pencegahan webhook duplikat, logging best-effort, dan penguncian untuk penambahan baris aman. |
| Maintainability | Layered naming convention, repositories/services/specialists/triggers, configuration centralization. |
| Traceability | System logs, audit reports/findings, patch records, change snapshots and GitHub history. |
| Recoverability | Backup GitHubs and backup-branch capability exist. |
| Keamanan | Secret dibaca dari Script Properties; otorisasi shared-secret webhook diterapkan. |
| Resilience | Beberapa provider LLM dan provider pencarian dapat dirangkai. |
| Determinisme bila diperlukan | Keluaran intent menggunakan skema terstruktur; aksi keuangan/reminder menggunakan method specialist, bukan mutasi teks bebas. |


## 7. Core invariants for future AI/developers

1. **Manager adalah orkestrator percakapan.** Kapabilitas percakapan baru seharusnya pada umumnya dapat dijangkau melalui `Manager._routeIntent()` dan kontrak intent, bukan langsung dari webhook.
2. **Repository memiliki konvensi persistence Sheet.** Logika bisnis tidak boleh sembarangan melewati method repository untuk perubahan data kecuali ada alasan yang jelas.
3. **Konfigurasi berada di Script Properties.** Secret/API key tidak boleh ditulis langsung di source.
4. **Code yang dihasilkan tidak otomatis dapat dipercaya.** `PatchValidator` melakukan validasi statis, bukan verifikasi perilaku.
5. **Kebenaran dokumentasi berasal dari bukti code/runtime.** Jangan mengubah roadmap/rencana menjadi klaim bahwa fitur sudah terimplementasi.
6. **Semantik zona waktu dipusatkan di `DateTimeUtils`, tetapi konversi WIB saat ini menggunakan transformasi manual +7 jam yang harus diperlakukan dengan hati-hati.**
7. **Fallback LLM merupakan bagian dari desain keandalan.** Urutan provider dan pemilihan model adalah konfigurasi perilaku, bukan detail kosmetik.

## 8. AI handoff instructions

Ketika AI lain mulai bekerja pada repository ini, AI tersebut harus membaca dokumen ini terlebih dahulu, kemudian `02_ARCHITECTURE_AND_FLOWS.md`, lalu `03_IMPLEMENTATION_AND_CODE_REFERENCE.md`, sebelum mengubah code. AI harus mengidentifikasi lapisan yang terdampak, memeriksa rantai caller/callee, menjaga kontrak data-sheet, menjaga bentuk intent terstruktur, dan memperbarui catatan dokumentasi/kemajuan yang relevan setiap kali perilaku berubah.

## 9. Coverage of the original 16-document set

| Topik asli | Lokasi konsolidasi |
| --- | --- |
| Tujuan / kebutuhan sistem | dokumen ini |
| System analysis | 02 + 03 |
| Architecture | 02 |
| Agent behavior / prompts | 01 + 03 |
| Data / memory | 02 + 03 |
| Codebase reference | 03 |
| Referensi function / method | 03 |
| Operasional / pemeliharaan | 04 |
| Pengujian / verifikasi | 04 |
| Keamanan / keandalan | 04 |
| Celah / utang teknis | 05 |
| Panduan pengembangan | 04 |
| Documentation truth | 01 + 05 |
| AI handoff context | 01 |
| Prompt/schema catalog | 03 |
| Module dependency matrix | 02 |


## 10. Snapshot metadata
- File source: **43 file `.gs` + `appsscript.json`**
- Total `.gs` source lines: **5,963**
- Runtime: Apps Script V8
- Manifest timezone: `Asia/Jakarta`
- Documentation set intentionally limited to five Markdown files.