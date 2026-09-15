# PROGRESS.md — ai-agent-telegram

> Snapshot per commit `99d37a1` ("docs: Melakukan sinkronisasi dan
> verifikasi file ARCHITECTURE.md dan PROGRESS.md..."). Ditulis ulang
> dari nol dengan membaca seluruh source code aktual — **versi
> ARCHITECTURE.md/PROGRESS.md sebelumnya di repo ini diabaikan
> sepenuhnya** sebagai input, karena isinya terbukti tidak akurat
> (menyebut nama file yang tidak ada, mengklaim fitur yang lebih
> canggih dari implementasinya — ironisnya persis commit itu yang judulnya
> "verifikasi... dengan format JSON ketat", tapi isinya sendiri tidak
> terverifikasi terhadap kode).

## 1. Status Modul

| Modul | Status | Catatan |
|---|---|---|
| Config, Spreadsheet Gateway, Logger | ✅ Selesai | Termasuk field GitHub baru di `Config` |
| Webhook entry point | ✅ Selesai | Hanya proses `message`, mengabaikan `edited_message`/`callback_query` |
| Command Router | ✅ Selesai, bertambah | 8 command: `/ingat`, `/reminder(s)`, `/diagnose`, `/heal`, `/logs`, `/patch`, `/audit`, `/fix` |
| Percakapan natural + intent analysis | ✅ Selesai, skema bertambah | Sekarang 5 tipe intent (tambah `diagnose_error`, `update_docs`) |
| LLM fallback chain, Web search fallback | ✅ Selesai | Tidak berubah |
| Reminder (buat, recurring, ack) | ✅ Selesai | Tidak berubah |
| Knowledge/Facts | ✅ Selesai | Tidak berubah |
| **Finance (wallet, transaksi, budget)** | 🟡 **Backend selesai, MASIH TIDAK terintegrasi ke chat** | Sama seperti sebelumnya — tidak ada progres di area ini sejak snapshot terakhir |
| **Code Auditor** (`/audit`, `/fix`) | 🟡 **Berfungsi, tapi punya beberapa gap operasional serius** | Bisa audit + generate PR fix, tapi lihat §2 dan §3 |
| **Self-Healing** (`/diagnose`, `/heal`, `/patch`) | 🟡 **Berfungsi, tapi loop-nya tidak tertutup** | Bisa diagnosis + generate PR, tapi tidak ada jalur balik ke GAS live, lihat §2 |
| GitHub backup (lama, `12_`) | ✅ Selesai, TIDAK berubah | Manual (`runFullBackup`) & harian jam 23:00 |
| GitHub Ops (baru, `13_`) | ✅ Selesai secara fungsi individual | Tapi tidak disatukan dengan mekanisme lama — lihat §2 |
| Automated test suite | ❌ Masih belum ada | Tetap hanya fungsi manual + 1 fungsi baru (`test_TelegramMarkdownFallback`) |

## 2. Tiga Gap Paling Signifikan Saat Ini

### 2.1 Finance masih orphan (tidak berubah dari analisis sebelumnya)
`FinanceSpecialist`/`TransactionRepository`/`WalletRepository`/`BudgetRepository`
tetap lengkap secara logic, tapi `IntentAnalyzer` tidak punya tipe intent
untuk transaksi dan `Manager._routeIntent()` tidak pernah memanggilnya.
**Tidak ada progres di sini sejak sesi analisis sebelumnya** — dua fitur
besar baru (Auditor, Self-Healing) dibangun di atas basis kode yang sama,
tapi gap Finance ini tidak tersentuh.

### 2.2 Audit & Self-Healing bekerja dari snapshot GitHub, bukan kode GAS live
`CodeAuditor` dan `SelfHealingSpecialist` SELALU membaca source code lewat
`GitHubOpsService` (dari repo GitHub), bukan dari project GAS yang
sedang berjalan. Kalau kamu sedang mengedit kode di editor GAS dan belum
menjalankan `runFullBackup()` (mekanisme LAMA, `12_Service_GitHubBackup.gs`),
maka:
- `/audit` akan mengaudit kode versi **lama** (bisa memberi laporan false
  positive tentang bug yang sudah kamu perbaiki, atau melewatkan bug baru
  yang baru kamu masukkan).
- `/diagnose` akan mendiagnosis pakai source code versi **lama**, berpotensi
  menghasilkan patch yang tidak relevan dengan kode yang benar-benar error.

**Ini bukan bug dalam arti "salah kode"** — ini adalah konsekuensi
arsitektural dari memisahkan dua mekanisme GitHub (`12_` lama vs `13_`
baru) tanpa menyatukan sumber kebenarannya. Selama belum disatukan,
**urutan operasi yang wajib diingat**: edit kode di GAS → `runFullBackup()`
→ baru pakai `/audit` atau `/diagnose`.

### 2.3 Loop Self-Healing tidak tertutup (GitHub → GAS tidak ada)
`SelfHealingSpecialist._applyToGitHub()` dan `CodeAuditor._applyFixes()`
sama-sama berhenti di titik "PR dibuat di GitHub". Tidak ada kode apa pun
yang menerapkan hasil merge PR itu balik ke project GAS yang live — Apps
Script tidak "menarik" perubahan dari GitHub secara otomatis (dan memang
GAS tidak punya API native untuk itu tanpa effort tambahan, mis. Clasp +
CI/CD eksternal, yang belum ada di proyek ini). Praktiknya: setelah PR
di-merge di GitHub, **kamu masih harus salin manual isi file yang
diperbaiki dari GitHub kembali ke editor GAS**. Fitur ini secara jujur
lebih tepat disebut "Diagnosis & Draft-Fix Assistant" ketimbang
"Self-Healing" murni.

## 3. Bug/Inkonsistensi Konkret yang Ditemukan (bukan spekulasi — dicek langsung ke kode)

| # | Temuan | Lokasi | Dampak |
|---|---|---|---|
| 1 | Mapping suspect-file salah nama untuk kategori `LLM` dan `SEARCH` (menunjuk `06_Service_LLM.gs`/`07_Service_WebSearch.gs` yang tidak ada; nama asli `06_Service_LLMProvider.gs`/`07_Service_WebSearchProvider.gs`) | `SelfHealingSpecialist._identifySuspectFiles` | Kalau error sebenarnya ada di file LLM atau Web Search provider, `GitHubOpsService.readFile()` akan 404 untuk nama yang salah, dan LLM diagnosis tidak akan melihat source code file yang sebenarnya bermasalah |
| 2 | Trigger audit bulanan (`type='full'` saat tanggal 1) tidak akan pernah jalan kecuali tanggal 1 kebetulan jatuh hari Senin, karena satu-satunya trigger terjadwal adalah mingguan (Senin 07:00) | `AuditScheduler.setupWeeklyTrigger` + `CodeAuditor.runScheduledAudit` | Audit terjadwal praktiknya SELALU `'light'`, audit `'full'` otomatis nyaris tidak pernah terjadi (harus dipicu manual via `/audit`) |
| 3 | `CodeAuditor.shouldOfferAudit()` didefinisikan tapi tidak dipanggil dari mana pun | `08_Specialist_CodeAuditor.gs` | Dead code — sepertinya dimaksudkan untuk menawarkan audit proaktif di tengah chat biasa, tapi belum ada wiring ke `Manager`/`IntentAnalyzer` |
| 4 | Variabel `dayOfWeek` dihitung tapi tidak dipakai | `CodeAuditor.runScheduledAudit` | Kosmetik, tidak berdampak fungsional |
| 5 | Kolom ke-4 di setiap baris `Audit_Reports` selalu hardcode `0`, tidak ada dokumentasi maksudnya apa dan tidak pernah dibaca balik di kode manapun | `CodeAuditor._saveReport` | Kolom mubazir/membingungkan buat siapa pun yang baca sheet-nya langsung |
| 6 | `SELF_HEAL_LEVEL` level 2 dan level 3 memicu kode yang identik — tidak ada percabangan yang membedakan keduanya | `SelfHealingSpecialist.getLevel`/`diagnose` | Kalau level 3 dimaksudkan untuk perilaku lebih agresif (mis. auto-merge tanpa PR review), itu belum diimplementasikan |
| 7 | `_formatReportForChat` (hasil `/audit`) menyarankan user membalas dengan kalimat natural ("ya semua", "yang kritis aja"), tapi `IntentAnalyzer` tidak punya intent type untuk menangkap balasan itu dan meneruskannya ke `CodeAuditor.fixIssues()` | `CodeAuditor._formatReportForChat` vs `IntentAnalyzer._outputSchemaSection` | User yang membalas dengan kalimat natural sesuai saran bot TIDAK akan memicu fix apa pun — bot kemungkinan akan menjawabnya sebagai chat biasa. Satu-satunya jalan yang benar-benar berfungsi adalah command eksplisit `/fix <scope>` |
| 8 | `12_Service_GitHubBackup.gs` baca config GitHub langsung dari `PropertiesService`, sedangkan `13_Service_GitHubOps.gs` baca dari `Config.load()` — dua jalur baca config yang independen untuk key Script Property yang sama | `12_` vs `13_`, `00_Config.gs` | Tidak salah secara fungsional (keduanya baca key yang sama), tapi kalau salah satu diubah caranya di masa depan (mis. tambah validasi di `Config.load()`), yang satu lagi tidak ikut kebagian |
| 9 | `CommandRouter` (`/logs`) memanggil `SelfHealingSpecialist._getRecentLogs()` — method dengan prefix `_` (konvensi privat) — langsung dari luar modulnya | `09_CommandRouter.gs` | Pelanggaran konvensi penamaan yang dipakai proyek ini sendiri (prefix `_` = privat/internal), bukan bug fungsional |

## 4. Hal yang Perlu Diverifikasi, Bukan Bug Pasti

- `GitHubOpsService.readFile`/`commitFile` memakai `encodeURIComponent()`
  pada path yang mengandung `/` (mis. `'src/09_Manager.gs'`), yang akan
  meng-encode slash jadi `%2F`. Sejauh yang bisa dibaca dari kode ini
  sepertinya tetap berfungsi (asumsi: GitHub API mendekode `%2F` di
  path), tapi ini murni asumsi arsitektural yang belum diverifikasi
  terhadap dokumentasi resmi GitHub REST API — kalau suatu saat ada
  laporan `readFile`/`commitFile` gagal 404 untuk path bersegmen banyak,
  ini titik pertama yang layak dicek.

## 5. Bug Historis yang Sudah Diperbaiki (jangan diulang — carry-over dari sesi sebelumnya)

- **Kesalahan perhitungan periode (`yyyy-MM`) dekat pergantian
  hari/bulan** — sudah diperbaiki via `DateTimeUtils.formatPeriode()`
  (konversi WIB dulu) dan `BudgetRepository._normalizePeriode()`
  (menangani auto-convert string periode jadi `Date` oleh Google Sheets).
  Jangan menambahkan pemanggilan format tanggal baru yang melewati dua
  fungsi ini.

## 6. Tech Debt Tambahan (di luar bug konkret §3)

- **Duplikasi persona** — `ChatSpecialist.buildSystemPersona()` dan
  `IntentAnalyzer._personaSection()` masih identik dan terpisah,
  belum disatukan.
- **Repository bypass** — modul baru (`CodeAuditor`, `SelfHealingSpecialist`)
  mengakses `SpreadsheetGateway.getSheet()` langsung untuk 3 sheet baru
  (`Audit_Reports`, `Audit_Findings`, `SelfHeal_Patches`), tidak lewat
  Repository (`04_*`) seperti pola yang konsisten dipakai modul lama.
  Kalau proyek ini ingin tetap konsisten, idealnya dibuat
  `AuditRepository`/`SelfHealRepository` terpisah.
- **Tidak ada automated test** — masih sama seperti sebelumnya, ditambah
  sekarang ada 2 fitur baru (Auditor, Self-Healing) yang keduanya
  bergantung pada parsing JSON ketat dari LLM (`_parseFindings`,
  `_askLLMForDiagnosis`, dll) — kalau LLM sedikit saja menyimpang dari
  format, fallback-nya hanya log error dan return array/objek kosong,
  tanpa validasi skema eksplisit.

## 7. Rekomendasi Prioritas (belum dikerjakan, sekadar usulan, urut dari yang paling bernilai)

1. **Perbaiki mapping suspect-file** di `_identifySuspectFiles` (Temuan #1)
   — perbaikan kecil, dampak langsung ke akurasi self-healing.
2. **Satukan sumber kebenaran kode** untuk Audit/Self-Healing — entah
   dengan (a) selalu jalankan `runFullBackup()` otomatis sebelum
   `/audit`/`/diagnose`, atau (b) alihkan `GitHubOpsService.readAllSourceFiles()`
   supaya baca langsung dari Apps Script API (seperti `12_` lakukan),
   bukan dari GitHub.
3. **Perbaiki trigger audit bulanan** — buat trigger terpisah yang
   mengecek tanggal 1 setiap hari (via trigger harian), bukan bergantung
   pada kebetulan tanggal 1 jatuh di hari Senin.
4. **Sambungkan Finance ke intent router** (gap dari sesi sebelumnya,
   masih relevan) — tambah tipe intent baru (mis. `catat_transaksi`) di
   `IntentAnalyzer` + cabang routing di `Manager._routeIntent()`,
   mengikuti pola `buat_reminder`.
5. **Tutup loop self-healing**, atau ubah framing fiturnya jadi jujur
   sebagai "diagnosis + draft PR" di pesan yang ditampilkan ke user
   (supaya ekspektasi user sesuai kenyataan sistem).
6. **Sambungkan balasan natural ke `CodeAuditor.fixIssues()`** (Temuan
   #7) — supaya saran "ya semua"/"yang kritis aja" di `_formatReportForChat`
   benar-benar berfungsi, bukan cuma teks yang menyesatkan.

## 8. Cara Memakai Dokumen Ini untuk Melanjutkan dengan AI Lain

1. Baca `ARCHITECTURE.md` dulu — terutama §5 (referensi per file sampai
   level method) dan §8 (catatan arsitektural: lazy evaluation, dua
   mekanisme GitHub, dll).
2. Baca `PROGRESS.md` ini — terutama §2 (tiga gap besar) dan §3 (bug
   konkret) supaya tidak membangun ulang sesuatu yang sudah ada
   (Finance) atau salah asumsi soal apa yang benar-benar berfungsi
   end-to-end (Self-Healing, Audit auto-fix).
3. **Sebelum mengklaim sesuatu "sudah berfungsi" atau "sudah diperbaiki"
   di update dokumentasi berikutnya, verifikasi ke source code
   langsung** — riwayat proyek ini menunjukkan dokumentasi bisa dengan
   mudah menyimpang dari kode aktual (persis masalah yang membuat
   dokumen sebelumnya harus ditulis ulang total di sesi ini).
4. Kalau task-nya menyentuh Audit/Self-Healing, ingat urutan operasi di
   §2.2: edit GAS → `runFullBackup()` → baru `/audit`/`/diagnose`.
