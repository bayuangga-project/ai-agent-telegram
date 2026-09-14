# ARCHITECTURE.md ? ai-agent-telegram

> Dokumen ini menjelaskan arsitektur sistem apa adanya, berdasarkan pembacaan
> langsung terhadap seluruh source code di `src/`. Tujuannya supaya AI atau
> developer lain bisa langsung paham struktur & aturan main proyek tanpa
> perlu membaca ulang semua file dari nol.

## 1. Ringkasan

`ai-agent-telegram` adalah **asisten pribadi berbasis Telegram**, dijalankan
100% di **Google Apps Script (GAS)**, dengan **Google Sheets sebagai
database**. Satu pemilik/satu chat ID (bukan multi-tenant). Fitur utama:

- Percakapan natural language dengan pemahaman intent (via LLM)
- Reminder/pengingat dengan pola recurring & acknowledge natural
- Pencatatan keuangan (wallet, transaksi, budget) ? **backend sudah jadi,
  tapi belum tersambung ke jalur percakapan**, lihat ?8 dan PROGRESS.md
- Penyimpanan "fakta" tentang user (memory jangka panjang sederhana)
- Web search sebagai konteks tambahan saat user butuh info terkini
- Backup & otomatisasi repositori via **GitHubOps Service** (source code + dokumentasi)
- Ketahanan sistem mandiri melalui modul **Self-Healing** & **Fallback Parser Telegram**

## 2. Tech Stack

| Lapisan | Teknologi |
|---|---|
| Runtime | Google Apps Script (V8 runtime) |
| Database | Google Sheets (1 spreadsheet, banyak sheet/tab sebagai "tabel") |
| Channel/UI | Telegram Bot API (webhook, bukan polling) dengan Telegram Fallback Parser |
| LLM | Gemini (Pro Preview / Flash / Flash-Lite) dengan fallback ke Groq (`openai/gpt-oss-20b`) |
| Web search | Google Custom Search API dengan fallback ke Tavily |
| Ops & Backup | GitHubOps Service (GitHub REST API + Apps Script API) |
| Self-Healing | System Health Monitor & Auto-Recovery Trigger/Error Handlers |
| Trigger terjadwal | GAS time-based triggers (`ScriptApp.newTrigger`) |
| Timezone | Asia/Jakarta (WIB, UTC+7), di-hardcode di `appsscript.json` dan `DateTimeUtils` |

Tidak ada framework eksternal, tidak ada `npm`/build step. Semua file
`.gs` di-deploy langsung sebagai satu GAS project.

## 3. Model Deployment

- Dideploy sebagai **Web App** (`doPost`), `executeAs: USER_DEPLOYING`,
  `access: ANYONE_ANONYMOUS` (lihat `appsscript.json`).
- Karena aksesnya anonim secara Google-level, keamanan diserahkan ke
  aplikasi sendiri: **shared secret di query param** + **allowlist satu
  chat ID** (lihat ?9 Security Model).
- Reminder checker, pemantauan Self-Healing, dan GitHubOps berjalan lewat **time-based trigger**,
  bukan dipicu oleh request user.

## 4. Peta Modul (urutan angka di nama file = urutan tanggung jawab, BUKAN urutan load yang wajib)

Penomoran prefix (`00_`, `01_`, ... `12_`) dipakai untuk memudahkan
navigasi manusia di editor GAS (file diurutkan alfabetis), merepresentasikan
lapisan dari "paling dasar" ke "paling luar". Bukan berarti file 05 boleh
memanggil isi file 09 secara langsung di top-level ? lihat **Lazy
Evaluation Rule** di ?7.


00_Config.gs                   ? baca Script Properties (env vars), di-cache
01_SpreadsheetGateway.gs       ? satu-satunya titik akses low-level ke Google Sheets
02_Utils.gs                    ? IdGenerator, DateTimeUtils (WIB handling)
03_AppLogger.gs                ? tulis log ke sheet "Log_System"
03_Service_SelfHealing.gs      ? deteksi error, pemulihan otomatis (auto-recovery) & kesehatan sistem
04_Repository_*.gs (7 file)    ? satu repository per domain data (lihat ?6)
05_Service_Telegram.gs         ? titik kirim/edit pesan + Fallback Parser Telegram payload
06_Service_LLM*.gs (3 file)    ? orchestrator + 2 provider LLM (Gemini, Groq)
07_Service_WebSearch*.gs (3 file) ? orchestrator + 2 provider search (Google, Tavily)
08_Specialist_*.gs (4 file)    ? business logic per domain (Chat, Finance, Knowledge, Reminder)
09_Manager*.gs (2 file)        ? orchestrator percakapan + intent analyzer (LLM-based)
09_CommandRouter.gs            ? fast path untuk command eksplisit (mis. /ingat)
10_Handler_Webhook.gs          ? entry point doPost() dari Telegram (menggunakan Fallback Parser)
11_Trigger_ReminderChecker.gs  ? entry point time-based trigger (tiap 1 menit)
12_Service_GitHubOps.gs        ? GitHubOps: backup source code, sync docs, dan otomatisasi repo GitHub
99_Tests.gs                    ? fungsi test manual (dijalankan dari editor GAS)


Semua modul ditulis sebagai **object literal** (`const X = {...}`), bukan
`class`. Tidak ada dependency injection ? modul saling memanggil lewat
nama global langsung (mis. `WalletRepository.findByName(...)`).

## 5. Alur Data Utama (Request Lifecycle)

### 5a. Pesan masuk dari Telegram (jalur percakapan & parsing resilient)


Telegram ? doPost(e) [10_Handler_Webhook]
  1. Validasi secret param vs Config.sharedSecret     ? tolak jika salah
  2. Ekstraksi Payload via Telegram Fallback Parser  ? parse aman (message, edited_message, callback_query)
  3. Cek duplikasi update_id via CacheService (TTL 6 jam) ? skip jika duplikat
  4. Cek chatId vs Config.myChatId (allowlist 1 user) ? tolak jika bukan owner
  5. Jika teks cocok command eksplisit (CommandRouter.isKnownCommand)
       ? CommandRouter.handle() ? balas langsung (fast path, TANPA panggil LLM)
  6. Selain itu (conversational path):
       a. Kirim placeholder message dulu ("? Bentar, lagi mikir...")
       b. Manager.processConversationalMessage(chatId, text):
          - _gatherContext(): ambil 15 riwayat chat terakhir, 50 fakta aktif,
            reminder yang sedang menunggu respon, 10 pola ack terakhir
          - IntentAnalyzer.analyze(text, context):
              ? bangun 1 prompt besar (persona + semua konteks di atas + pesan user
                + skema output JSON yang diminta)
              ? panggil LLMProviderService.generate({chain:'advanced', ...})
              ? parse response jadi objek intent (JSON)
          - Jika intent gagal di-parse ? fallback: panggil LLM chain 'advanced'
            langsung dengan riwayat chat mentah (tanpa struktur intent)
          - _routeIntent() berdasar intent.tipe:
              "ack_reminder"  ? ReminderSpecialist.acknowledge(...)
              "buat_reminder" ? ReminderSpecialist.create(...)
              lainnya (termasuk "chat_biasa") ? _handleChatBiasa()
                ? jika intent butuh info terkini ? WebSearchProviderService.search()
                  lalu ChatSpecialist.respondWithSearchContext()
                ? jika tidak ? pakai intent.jawabanChat langsung (LLM sudah
                  menjawab sekaligus saat analisis intent, hemat 1 API call)
          - Simpan fakta baru yang terdeteksi (KnowledgeSpecialist.saveAutoDetectedFacts)
          - Simpan riwayat chat (ChatHistoryRepository.save, role user & ai)
       c. TelegramService.editMessage() ? placeholder diedit jadi jawaban final


Poin penting: jika terjadi kegagalan tak terduga selama alur di atas, modul **Self-Healing** akan menangkap exception, melakukan logging fail-safe, dan mencoba memulihkan status sesi atau memberikan tanggapan aman ke Telegram.

### 5b. Reminder checker (jalur terjadwal, tiap 1 menit)


Time trigger ? cekDanKirimReminder() [11_Trigger_ReminderChecker]
  1. ReminderSpecialist.getRemindersDueNow()
     ? ReminderRepository.getActive() difilter: waktu <= sekarang (WIB) DAN
       (belum pernah diingatkan ATAU sudah lewat cooldown 5 menit sejak
       terakhir diingatkan)
  2. Untuk tiap reminder due:
     ? ReminderSpecialist.buildNotificationText() (sisipkan 1 fakta relevan
       jika ada, dicari dari kata pertama deskripsi reminder)
     ? TelegramService.sendMessage()
     ? ReminderSpecialist.markAsNotified() ? increment jumlahDiingatkan,
       update terakhirDiingatkan


### 5c. Operasi & Backup GitHubOps (manual atau terjadwal harian jam 23:00)


runFullGitHubOps() [12_Service_GitHubOps]
  1. Sync Source Code: baca seluruh file .gs dari Apps Script API,
     push otomatis ke folder src/ di repositori GitHub.
  2. Sync Dokumentasi: baca tab sheet "Documentation", push/update file markdown
     (ARCHITECTURE.md, PROGRESS.md) ke root repositori GitHub.
  3. Self-Check Repositori: pastikan integritas file dan kelengkapan repositori.


## 6. Data Model (Google Sheets sebagai "tabel")

Skema berikut disimpulkan dari urutan kolom yang dipakai tiap Repository:

| Sheet | Dipakai oleh | Kolom (urutan) |
|---|---|---|
| `Log_System` | AppLogger & SelfHealing | timestamp, jenisEvent, detail, status |
| `Finance_Budgets` | BudgetRepository | id, kategori, batasJumlah, periode (`yyyy-MM`), createdAt |
| `Chat_History` | ChatHistoryRepository | id, timestamp, chatId, role (`user`/`ai`), text |
| `Documentation` | DocumentationRepository | fileName, content |
| `Memory_Facts` | FactsRepository | id, timestamp, chatId, category (`manual`/`auto`), factText, status (`Active`) |
| `Reminder_RawData` | ReminderRepository | id, timestamp, deskripsi, waktu, status (`Aktif`/`Done`), prioritas, terakhirDiingatkan, catatan, jenisRecurring, recurringConfig, jumlahDiingatkan |
| `Reminder_AckPatterns` | AckPatternsRepository | id, timestamp, pesanUser, interpretasi, aksi |
| `Finance_Transactions` | TransactionRepository | id, timestamp, walletId, tanggalTransaksi, tipe (`income`/`expense`), kategori, jumlah, deskripsi, status (`active`/`deleted`) |
| `Finance_Wallets` | WalletRepository | id, nama, saldoAwal, createdAt |

## 7. Pola Desain Penting

### 7.1 Lazy Evaluation Rule (WAJIB dipatuhi)
GAS memuat semua file `.gs` sebagai satu scope global. Referensi ke modul lain TIDAK BOLEH ditulis sebagai property array langsung di top-level, harus dibungkus method yang baru dievaluasi saat dipanggil.

### 7.2 Fallback Chain Pattern
Dipakai di LLM Provider (`advanced` vs `fast`), Web Search Provider, dan **Telegram Fallback Parser**.

### 7.3 Waktu selalu dalam WIB
`DateTimeUtils` adalah satu-satunya tempat yang boleh melakukan konversi/format waktu terkait zona WIB.

### 7.4 Self-Healing & System Resilience Pattern
`SelfHealingService` memantau kesehatan eksekusi runtime. Jika terjadi unhandled runtime error, kuota API terlampaui, atau trigger terhenti, `SelfHealingService` akan secara otomatis:
- Melakukan retry bertahap (exponential backoff).
- Melakukan reset/repair trigger terjadwal yang rusak atau terlewat.
- Mengisolasi kesalahan tanpa membuat Webhook Telegram mati (tetap me-return HTTP 200 ke Telegram).

### 7.5 Telegram Payload Fallback Parser
Payload Webhook dari Telegram memiliki beragam variasi (`message`, `edited_message`, `callback_query`, `channel_post`). Telegram Fallback Parser di `TelegramService` secara fleksibel mengekstrak `chatId`, `text`, `user`, dan `messageId` melalui inspeksi struktur bertingkat sehingga mencegah `TypeError` saat struktur payload tidak biasa.

### 7.6 GitHubOps Architecture Pattern
Modul `GitHubOpsService` menggantikan skrip backup pasif dengan pola GitHubOps terintegrasi. Selain melakukan push kode dan dokumen secara berkala ke GitHub, modul ini menyediakan mekanisme otomatisasi synchronization untuk menjaga agar repositori GitHub dan Google Apps Script tetap selaras.

## 8. Batas Integrasi Saat Ini (Known Gap)

`FinanceSpecialist` + `TransactionRepository` + `WalletRepository` + `BudgetRepository` **berfungsi penuh dan sudah ada test manual**, TAPI belum tersambung ke `IntentAnalyzer` & `Manager._routeIntent()`.

## 9. Security Model

- Web App diakses anonim di level Google (`ANYONE_ANONYMOUS`), diamankan via `?secret=` query param vs `SHARED_SECRET`.
- Filter `chat.id` vs `MY_TELEGRAM_CHAT_ID` (single user).
- Dedup `update_id` via `CacheService` (TTL 6 jam).
- API Key disimpan aman di **Script Properties**.

## 10. Dokumentasi Ini Disimpan Di Mana?

Source of truth dokumentasi (`ARCHITECTURE.md`, `PROGRESS.md`) ada di sheet **Documentation** (kolom `fileName`, `content`), disinkronkan secara otomatis ke root repo GitHub melalui `GitHubOpsService`.

## 11. Referensi Konfigurasi (Script Properties)

| Key | Dipakai untuk |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Kirim/edit pesan Telegram |
| `MY_TELEGRAM_CHAT_ID` | Allowlist satu-satunya user |
| `GEMINI_API_KEY` | Autentikasi ke Gemini API |
| `GEMINI_MODEL_PRO_PREVIEW` / `GEMINI_MODEL_FLASH` / `GEMINI_MODEL_FLASH_LITE` | Nama model Gemini |
| `GROQ_API_KEY` | Fallback LLM |
| `SPREADSHEET_ID` | ID database Google Sheets |
| `SHARED_SECRET` | Validasi webhook Telegram |
| `GOOGLE_SEARCH_API_KEY` / `GOOGLE_SEARCH_ENGINE_ID` | Web search primer |
| `TAVILY_API_KEY` | Web search fallback |
| `GITHUB_TOKEN` / `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` / `GITHUB_BRANCH` | Operasi GitHubOps & backup |
