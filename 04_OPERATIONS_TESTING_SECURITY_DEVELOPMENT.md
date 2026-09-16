# 04 — Operations, Testing, Security, Deployment & Development Guide

## 1. Model deployment

Proyek ini adalah web app Google Apps Script yang dikonfigurasi di `appsscript.json` dengan runtime V8, zona waktu `Asia/Jakarta`, akses web app anonim, dan eksekusi `USER_DEPLOYING`. Sistem memerlukan deployment Apps Script yang sesuai, Script Properties, Spreadsheet sebagai penyimpanan data, konfigurasi webhook bot Telegram, serta kredensial API eksternal bila diperlukan.

## 2. Required setup domains

| Domain | Aksi yang diperlukan |
| --- | --- |
| Apps Script | Deploy web app; configure Script Properties; enable triggers. |
| Google Sheets | Membuat/memelihara seluruh tab Sheet yang diperlukan beserta kolom yang diharapkan. |
| Telegram | Membuat bot, mengonfigurasi URL webhook, dan memastikan chat ID target benar. |
| LLM | Mengonfigurasi satu atau lebih key/model provider. |
| Search | Mengonfigurasi Google CSE dan/atau Tavily jika grounding web diperlukan. |
| GitHub | Mengonfigurasi token/owner/repository/branch jika backup atau pengembangan mandiri diperlukan. |


## 3. Trigger setup

| Setup function | Dampak |
| --- | --- |
| `setupReminderTrigger()` | Membuat pemeriksa reminder setiap satu menit; terlebih dahulu menghapus trigger lama yang cocok. |
| `setupNightlySummarizer()` | Membuat trigger malam hari sekitar pukul 23:30. |
| `setupWeeklyTrigger()` | Membuat trigger audit Senin pukul 07:00. |
| `setupWeeklyChangeCheck()` | Membuat trigger pemeriksaan perubahan Minggu pukul 20:00. |
| `setupDailyBackupTrigger()` | Helper penyiapan trigger backup tersedia; eksekusinya harus diaktifkan secara eksplisit. |


## 4. Operational data stores

Minimal, deployment operasional harus memiliki tab Sheet yang dirujuk oleh repository dan code specialist. Sheet yang tidak tersedia menyebabkan kegagalan di `SpreadsheetGateway.getSheet()` dan dapat menghentikan alur yang bergantung padanya.

Expected sheet names observed directly in source:

`Chat_History`, `Documentation`, `Finance_Budgets`, `Finance_Transactions`, `Finance_Wallets`, `Log_System`, `Memory_Facts`, `Reminder_AckPatterns`, `Reminder_RawData`, `Audit_Findings`, `Audit_Reports`, `Code_Snapshots`, `Memory_Summaries`, `Roadmap_Items`, `SelfHeal_Patches`, `Self_Reviews`, `User_Profile`.

## 5. Inventaris pengujian

| Pengujian/helper | Function | Tujuan |
| --- | --- | --- |
| Finance specialist manual test | `test_Batch7b_FinanceSpecialist` | Finance behavior. |
| Telegram Markdown fallback | `test_TelegramMarkdownFallback` | Outbound formatting resilience. |
| Debug OAuth scope | `debug_CheckOAuthScopes` | Troubleshooting deployment/perizinan. |
| GitHub config debug | `debug_CheckGitHubConfig` | GitHub integration configuration. |


Source berisi sejumlah kecil helper yang dapat dieksekusi secara manual, tetapi inspeksi source tidak membuktikan cakupan pengujian unit/integrasi otomatis yang menyeluruh. Karena itu, kesiapan produksi perlu mencakup pengujian tambahan untuk routing, repository, pengulangan, fallback LLM, mutasi GitHub, dan keamanan perbaikan.

## 6. Recommended verification matrix

| Area | Skenario | Kondisi lulus |
| --- | --- | --- |
| Otorisasi webhook | Secret valid / secret tidak valid / secret tidak ada | Tidak ada pemrosesan tanpa otorisasi. |
| Duplicate updates | Replay same Telegram update ID | Tepat satu percobaan pemrosesan logis. |
| Penguraian intent | JSON valid / JSON rusak / JSON parsial | Fallback yang terkendali tanpa aksi yang tidak disengaja. |
| LLM fallback | Primary provider failure / timeout / malformed output | Provider pada rantai berikutnya dijalankan. |
| Search fallback | Google unavailable / Tavily unavailable | Fallback provider yang diharapkan atau status eksplisit bahwa pencarian tidak tersedia. |
| Finance | Income/expense/edit/soft-delete/budget crossing | Saldo dan ringkasan tetap konsisten. |
| Reminder | Buat/ack/snooze/selesai/berulang/jendela jatuh tempo | Tidak ada notifikasi yang terlewat atau duplikat. |
| Memory | Fact/profile persistence / nightly summary | Konteks tetap terbatas ukurannya dan benar. |
| GitHub | Baca/tampilkan/branch/commit/PR | Tidak ada mutasi repository yang tidak disengaja. |
| Self-healing | Diagnosis → patch → validation → apply | Gerbang keamanan eksplisit dan status yang dapat diaudit. |
| Change detector | Added/changed/deleted source files | Snapshot delta accurately represented. |
| Documentation | Code change + doc sync | Dokumentasi mencerminkan status implementasi. |


## 7. Model keamanan

### Secrets
Token/key API dibaca dari Script Properties, bukan dari konstanta yang disimpan di source.

### Webhook boundary
`WebhookHandler._isAuthorized()` secara khusus digunakan untuk menolak pemanggilan webhook tanpa otorisasi ketika mekanisme shared-secret dikonfigurasi/ditegakkan.

### Telegram authorization
Manifest menggunakan `ANYONE_ANONYMOUS`, sehingga otorisasi pada lapisan aplikasi sangat penting. Perlakukan endpoint webhook itu sendiri sebagai paparan ke internet publik.

### GitHub mutation boundary
Kredensial token GitHub memberikan agent kemampuan kontrol source. Ini adalah batas keamanan berdampak tinggi. Setiap fitur yang dapat menghasilkan patch atau commit harus diperlakukan sebagai fitur yang berpotensi mengubah source produksi.

### Prompt injection
Konten berbasis web, code repository, log, dan pesan pengguna dapat menjadi input prompt. Code saat ini memiliki bagian persona/rules, tetapi inspeksi source tidak membuktikan adanya pertahanan prompt-injection adversarial yang menyeluruh. Perlakukan teks eksternal sebagai konteks yang tidak tepercaya.

### Generated code
`PatchValidator` menggunakan pemeriksaan sintaks/struktur/pola mencurigakan. Komponen ini bukan sandbox, bukan semantic analyzer, dan bukan lingkungan pengujian runtime.

## 8. Reliability model

- LLM provider fallback improves availability.
- Search provider fallback improves search availability.
- Webhook duplicate detection reduces replay effects.
- Logging best-effort mencegah kegagalan logging menghentikan alur utama.
- Safe append locking reduces concurrent write collisions for append operations.
- Backup GitHub/branch operations support recoverability.
- Keandalan tetap dibatasi oleh batas eksekusi Apps Script, perilaku API eksternal, konsistensi Sheet, kualitas prompt, dan jalur integrasi produksi yang belum diverifikasi.

## 9. Panduan pemeliharaan

### Diagnose a production issue
1. Inspect `Log_System` for the event window.
2. Identify the Manager/specialist path involved.
3. Memeriksa Script Properties dan keberadaan Sheet yang dirujuk.
4. Mereproduksi melalui command/function terkait jika aman.
5. Untuk defect code, gunakan alat audit/self-healing tetapi wajibkan validasi eksplisit sebelum menerapkan perubahan.
6. Mencatat hasil dan memperbarui dokumen kemajuan/utang teknis terkonsolidasi.

### Safe source change
1. Menentukan lapisan dan caller yang terdampak.
2. Memperbarui source.
3. Menjalankan pengujian manual/debug yang relevan.
4. Menjalankan skenario integrasi.
5. Meninjau diff GitHub.
6. Melakukan deployment versi Apps Script jika diperlukan.
7. Memverifikasi perilaku webhook/trigger.
8. Memperbarui dokumentasi dan kemajuan.

## 10. Rollback / recovery

Integrasi repository mendukung branch cadangan dan commit file. Rollback operasional yang kuat seharusnya menggunakan riwayat Git/branch cadangan untuk mengembalikan source sebelumnya, kemudian melakukan redeploy versi Apps Script yang telah terbukti baik dan menjalankan ulang pemeriksaan integrasi yang terdampak. Source sendiri belum menerapkan rollback transaksional otomatis penuh yang mencakup deployment Apps Script + status Sheets + status GitHub.

## 11. Konvensi pengembangan

- Mempertahankan penamaan lapisan modul dan tanggung jawabnya.
- Menjaga secret di luar kontrol source.
- Utamakan akses repository/gateway dibanding mutasi Sheet langsung pada fitur bisnis baru.
- Tambahkan pengujian untuk tipe intent baru yang dapat dijangkau dan efek samping berbahaya.
- Tambahkan log eksplisit untuk operasi otonom.
- Utamakan function setup trigger yang idempotent (hapus trigger lama yang cocok sebelum membuat yang baru).
- Perlakukan keluaran intent bahasa alami sebagai input hasil parsing yang tidak tepercaya dan validasi sebelum menjalankan aksi.
- Pisahkan respons yang ditujukan kepada pengguna dari mutasi status operasional jika memungkinkan.

## 12. Operational limitations

Dokumentasi ini berbasis source; dokumentasi ini tidak dapat membuktikan keberhasilan runtime API, skema Sheet, pengaturan webhook yang telah di-deploy, kuota, validitas kredensial, atau eksekusi trigger produksi tanpa lingkungan yang benar-benar telah di-deploy. Hal-hal tersebut merupakan tugas verifikasi operasional, bukan fakta dari source code.