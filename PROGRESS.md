# PROGRESS.md — ai-agent-telegram

> Snapshot status berdasarkan pembacaan penuh source code di repo GitHub
> per commit `628e496` ("Auto backup dari GAS — 2026-09-11T10:11:49Z").
> Catatan: repo ini hanya berisi **satu commit** (hasil auto-backup
> penuh dari GAS), jadi riwayat perubahan dari waktu ke waktu **tidak**
> tercermin di git log — semua status di bawah adalah kondisi terkini,
> bukan hasil membandingkan versi lama vs baru.

## 1. Status Modul

| Modul | Status | Catatan |
|---|---|---|
| Config & Spreadsheet Gateway | ✅ Selesai | Termasuk retry logic untuk kuota Sheets |
| Logging (`AppLogger`) | ✅ Selesai | Fail-silent by design, tidak boleh crash app utama |
| Webhook entry point | ✅ Selesai | Secret validation, dedup, chatId allowlist, semua ada |
| Command Router (fast path) | ✅ Selesai | Baru 2 command: `/ingat`, `/reminder(s)` |
| Percakapan natural + intent analysis | ✅ Selesai | 1 LLM call gabungan intent+jawaban, fallback ke chat mentah jika parse gagal |
| LLM fallback chain (Gemini x3 + Groq) | ✅ Selesai | Chain `advanced` & `fast`, sudah dipakai konsisten |
| Web search fallback (Google CSE + Tavily) | ✅ Selesai | Terintegrasi ke `ChatSpecialist` saat `butuhInfoTerkini` |
| Reminder (buat, recurring, ack done/snooze) | ✅ Selesai | Termasuk time-based trigger tiap 1 menit + cooldown notifikasi |
| Knowledge/Facts (memory fakta user) | ✅ Selesai | Manual (`/ingat`) & auto-detect dari intent LLM |
| **Finance (wallet, transaksi, budget)** | 🟡 **Backend selesai, TIDAK terintegrasi ke chat** | Lihat §2 — gap paling signifikan saat ini |
| GitHub self-backup (kode + docs) | ✅ Selesai | Manual (`runFullBackup`) & terjadwal harian jam 23:00 (opsional, perlu `setupDailyBackupTrigger()` dijalankan sekali) |
| Automated test suite | ❌ Belum ada | Yang ada cuma fungsi manual `test_Batch7b_FinanceSpecialist` + 2 fungsi debug, dijalankan manual dari editor GAS, tanpa assertion otomatis |

## 2. Gap Terbesar: Finance Belum Bisa Diakses Lewat Chat

`FinanceSpecialist`, `TransactionRepository`, `WalletRepository`, dan
`BudgetRepository` semuanya sudah lengkap secara logic — sudah bisa:
mencatat transaksi, resolve/auto-create wallet, hitung saldo per wallet,
cek & kirim alert budget (warning 80%, exceeded 100%), edit transaksi
terakhir, dan bikin ringkasan per periode.

Tapi **tidak ada jalan masuk dari user** ke fitur ini:
- `IntentAnalyzer` tidak punya tipe intent untuk transaksi (skema JSON
  hanya kenal `ack_reminder` / `buat_reminder` / `chat_biasa`).
- `Manager._routeIntent()` tidak pernah memanggil `FinanceSpecialist`.
- `CommandRouter` juga tidak punya command eksplisit untuk finance
  (berbeda dengan reminder yang punya `/reminder`).

**Untuk lanjut development**, opsi yang paling konsisten dengan pola
yang sudah ada di proyek ini (menambahkan tipe intent baru + cabang
routing baru, sama seperti pola `buat_reminder`):
1. Tambah tipe intent baru, misalnya `catat_transaksi` (dan mungkin
   `cek_saldo`, `buat_budget`) di `IntentAnalyzer._outputSchemaSection()`.
2. Tambah field yang relevan ke skema JSON (tipe, kategori, jumlah,
   deskripsi, nama wallet).
3. Tambah cabang di `Manager._routeIntent()` yang memanggil
   `FinanceSpecialist.recordTransaction()` dsb, mengikuti pola
   `_handleBuatReminder()`.
4. Update `_rulesSection()` di `IntentAnalyzer` dengan aturan kapan
   `catat_transaksi` harus dipicu.

## 3. Bug Historis yang Sudah Diperbaiki (jangan diulang)

- **Kesalahan perhitungan periode (`yyyy-MM`) dekat pergantian
  hari/bulan** — akar masalah: memanggil `Utilities.formatDate()`
  langsung dengan zona `'UTC'` pada `Date` mentah tanpa konversi WIB
  dulu. Sudah diperbaiki lewat `DateTimeUtils.formatPeriode()` (selalu
  konversi ke WIB dulu) dan `BudgetRepository._normalizePeriode()`
  (menangani kasus Google Sheets auto-convert string periode jadi
  `Date` object). **Jangan** menambahkan pemanggilan format tanggal baru
  yang melewati dua fungsi ini.

## 4. Tech Debt / Risiko yang Perlu Diketahui

- **Duplikasi system persona**: teks persona asisten ("Kamu adalah
  asisten pribadi...") ditulis identik di dua tempat —
  `ChatSpecialist.buildSystemPersona()` dan
  `IntentAnalyzer._personaSection()`. Kalau salah satu diubah, yang lain
  gampang lupa ikut diubah → kepribadian bot bisa terasa tidak konsisten
  tergantung jalur mana yang dipakai.
- **Tidak ada automated test** — perubahan pada `IntentAnalyzer` (prompt
  besar dengan skema JSON ketat) berisiko silent-break kalau LLM mulai
  keluar dari format yang diharapkan; satu-satunya pengaman saat ini
  adalah `try/catch` di `_parseResponse()` yang fallback ke chat biasa,
  bukan validasi skema eksplisit.
- **Dokumentasi (`ARCHITECTURE.md`/`PROGRESS.md`) berpotensi out-of-sync
  dengan GitHub** kalau diedit langsung di GitHub tanpa disalin balik ke
  sheet `Documentation` — akan tertimpa backup otomatis berikutnya
  (lihat ARCHITECTURE.md §10).
- **Single-commit history**: karena repo GitHub hanya hasil snapshot
  auto-backup, tidak ada jejak "kapan fitur X ditambahkan" di git log.
  Kalau butuh riwayat perubahan yang berguna, pertimbangkan commit
  message yang lebih deskriptif dari GAS, atau commit manual terpisah
  untuk milestone penting.

## 5. Rekomendasi Langkah Berikutnya (belum dikerjakan, sekadar usulan)

1. Integrasikan Finance ke jalur percakapan (§2) — ini yang paling
   bernilai karena backend-nya sudah 100% siap pakai.
2. Satukan sumber persona (`buildSystemPersona`) jadi satu tempat yang
   dipanggil kedua modul, hilangkan duplikasi.
3. Pertimbangkan command eksplisit untuk cek saldo/ringkasan finance
   (mengikuti pola `/reminder`), sebagai fast path yang tidak butuh LLM.
4. Kalau mau riwayat progress yang lebih berguna dari git log,
   pertimbangkan commit manual bertahap alih-alih hanya mengandalkan
   auto-backup snapshot.

## 6. Cara Memakai Dokumen Ini untuk Melanjutkan dengan AI Lain

Urutan baca yang disarankan untuk AI/developer baru yang mau lanjutkan
proyek ini:
1. `ARCHITECTURE.md` — pahami struktur modul, alur data, dan aturan
   desain (terutama §7 Lazy Evaluation Rule — ini gampang dilanggar
   tanpa sadar oleh siapapun yang belum familiar dengan GAS).
2. `PROGRESS.md` (dokumen ini) — pahami apa yang sudah jadi vs yang
   masih gap, supaya tidak membangun ulang sesuatu yang sudah ada
   (Finance) atau melewatkan sesuatu yang terlihat ada tapi sebenarnya
   belum tersambung.
3. Baca source code modul yang relevan dengan task spesifik, mulai dari
   `09_Manager.gs` sebagai pusat orkestrasi kalau tugasnya soal
   percakapan, atau langsung ke `08_Specialist_*.gs` kalau tugasnya soal
   business logic satu domain.