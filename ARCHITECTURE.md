# ARCHITECTURE.md — ai-agent-telegram

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
- Pencatatan keuangan (wallet, transaksi, budget) — **backend sudah jadi,
  tapi belum tersambung ke jalur percakapan**, lihat §8 dan PROGRESS.md
- Penyimpanan "fakta" tentang user (memory jangka panjang sederhana)
- Web search sebagai konteks tambahan saat user butuh info terkini
- Backup otomatis source code + dokumentasi dirinya sendiri ke GitHub

## 2. Tech Stack

| Lapisan | Teknologi |
|---|---|
| Runtime | Google Apps Script (V8 runtime) |
| Database | Google Sheets (1 spreadsheet, banyak sheet/tab sebagai "tabel") |
| Channel/UI | Telegram Bot API (webhook, bukan polling) |
| LLM | Gemini (Pro Preview / Flash / Flash-Lite) dengan fallback ke Groq (`openai/gpt-oss-20b`) |
| Web search | Google Custom Search API dengan fallback ke Tavily |
| Backup | GitHub REST API + Apps Script API (self-read source) |
| Trigger terjadwal | GAS time-based triggers (`ScriptApp.newTrigger`) |
| Timezone | Asia/Jakarta (WIB, UTC+7), di-hardcode di `appsscript.json` dan `DateTimeUtils` |

Tidak ada framework eksternal, tidak ada `npm`/build step. Semua file
`.gs` di-deploy langsung sebagai satu GAS project.

## 3. Model Deployment

- Dideploy sebagai **Web App** (`doPost`), `executeAs: USER_DEPLOYING`,
  `access: ANYONE_ANONYMOUS` (lihat `appsscript.json`).
- Karena aksesnya anonim secara Google-level, keamanan diserahkan ke
  aplikasi sendiri: **shared secret di query param** + **allowlist satu
  chat ID** (lihat §9 Security Model).
- Reminder checker dan backup harian berjalan lewat **time-based trigger**,
  bukan dipicu oleh request user.

## 4. Peta Modul (urutan angka di nama file = urutan tanggung jawab, BUKAN urutan load yang wajib)

Penomoran prefix (`00_`, `01_`, ... `12_`) dipakai untuk memudahkan
navigasi manusia di editor GAS (file diurutkan alfabetis), merepresentasikan
lapisan dari "paling dasar" ke "paling luar". Bukan berarti file 05 boleh
memanggil isi file 09 secara langsung di top-level — lihat **Lazy
Evaluation Rule** di §7.

```
00_Config.gs                   → baca Script Properties (env vars), di-cache
01_SpreadsheetGateway.gs       → satu-satunya titik akses low-level ke Google Sheets
02_Utils.gs                    → IdGenerator, DateTimeUtils (WIB handling)
03_AppLogger.gs                → tulis log ke sheet "Log_System"
04_Repository_*.gs (7 file)    → satu repository per domain data (lihat §6)
05_Service_Telegram.gs         → satu-satunya titik kirim/edit pesan Telegram
06_Service_LLM*.gs (3 file)    → orchestrator + 2 provider LLM (Gemini, Groq)
07_Service_WebSearch*.gs (3 file) → orchestrator + 2 provider search (Google, Tavily)
08_Specialist_*.gs (4 file)    → business logic per domain (Chat, Finance, Knowledge, Reminder)
09_Manager*.gs (2 file)        → orchestrator percakapan + intent analyzer (LLM-based)
09_CommandRouter.gs            → fast path untuk command eksplisit (mis. /ingat)
10_Handler_Webhook.gs          → entry point doPost() dari Telegram
11_Trigger_ReminderChecker.gs  → entry point time-based trigger (tiap 1 menit)
12_Service_GitHubBackup.gs     → backup source code + docs ke GitHub
99_Tests.gs                    → fungsi test manual (dijalankan dari editor GAS)
```

Semua modul ditulis sebagai **object literal** (`const X = {...}`), bukan
`class`. Tidak ada dependency injection — modul saling memanggil lewat
nama global langsung (mis. `WalletRepository.findByName(...)`).

## 5. Alur Data Utama (Request Lifecycle)

### 5a. Pesan masuk dari Telegram (jalur percakapan)

```
Telegram → doPost(e) [10_Handler_Webhook]
  1. Validasi secret param vs Config.sharedSecret     → tolak jika salah
  2. Cek duplikasi update_id via CacheService (TTL 6 jam) → skip jika duplikat
  3. Cek chatId vs Config.myChatId (allowlist 1 user) → tolak jika bukan owner
  4. Jika teks cocok command eksplisit (CommandRouter.isKnownCommand)
       → CommandRouter.handle() → balas langsung (fast path, TANPA panggil LLM)
  5. Selain itu (conversational path):
       a. Kirim placeholder message dulu ("🤔 Bentar, lagi mikir...")
       b. Manager.processConversationalMessage(chatId, text):
          - _gatherContext(): ambil 15 riwayat chat terakhir, 50 fakta aktif,
            reminder yang sedang menunggu respon, 10 pola ack terakhir
          - IntentAnalyzer.analyze(text, context):
              → bangun 1 prompt besar (persona + semua konteks di atas + pesan user
                + skema output JSON yang diminta)
              → panggil LLMProviderService.generate({chain:'advanced', ...})
              → parse response jadi objek intent (JSON)
          - Jika intent gagal di-parse → fallback: panggil LLM chain 'advanced'
            langsung dengan riwayat chat mentah (tanpa struktur intent)
          - _routeIntent() berdasar intent.tipe:
              "ack_reminder"  → ReminderSpecialist.acknowledge(...)
              "buat_reminder" → ReminderSpecialist.create(...)
              lainnya (termasuk "chat_biasa") → _handleChatBiasa()
                → jika intent butuh info terkini → WebSearchProviderService.search()
                  lalu ChatSpecialist.respondWithSearchContext()
                → jika tidak → pakai intent.jawabanChat langsung (LLM sudah
                  menjawab sekaligus saat analisis intent, hemat 1 API call)
          - Simpan fakta baru yang terdeteksi (KnowledgeSpecialist.saveAutoDetectedFacts)
          - Simpan riwayat chat (ChatHistoryRepository.save, role user & ai)
       c. TelegramService.editMessage() — placeholder diedit jadi jawaban final
```

Poin penting: **satu panggilan LLM (chain `advanced`) dipakai untuk DUA hal
sekaligus** — menentukan intent (structured JSON) DAN menghasilkan jawaban
natural (`jawabanChat`) dalam satu response. Ini optimasi biaya/latency,
tapi konsekuensinya prompt-nya besar dan schema-nya harus selalu disiplin
dijaga konsisten oleh LLM.

### 5b. Reminder checker (jalur terjadwal, tiap 1 menit)

```
Time trigger → cekDanKirimReminder() [11_Trigger_ReminderChecker]
  1. ReminderSpecialist.getRemindersDueNow()
     → ReminderRepository.getActive() difilter: waktu <= sekarang (WIB) DAN
       (belum pernah diingatkan ATAU sudah lewat cooldown 5 menit sejak
       terakhir diingatkan)
  2. Untuk tiap reminder due:
     → ReminderSpecialist.buildNotificationText() (sisipkan 1 fakta relevan
       jika ada, dicari dari kata pertama deskripsi reminder)
     → TelegramService.sendMessage()
     → ReminderSpecialist.markAsNotified() → increment jumlahDiingatkan,
       update terakhirDiingatkan
```

Reminder TIDAK otomatis selesai setelah dikirim — status tetap `Aktif`
sampai user membalas (ditangkap sebagai `ack_reminder` di jalur 5a) atau
di-snooze. Reminder recurring (`daily`/`weekly`/`monthly`) akan
menghitung `waktuBerikutnya` saat user bilang "done", bukan otomatis.

### 5c. Backup ke GitHub (manual atau terjadwal harian jam 23:00)

```
runFullBackup() [12_Service_GitHubBackup]
  1. backupAllFiles(): baca source code project sendiri via Apps Script API
     (ScriptApp.getScriptId() + OAuth token), push tiap file ke src/ di GitHub
  2. backupDocs(): baca sheet "Documentation" (kolom fileName, content),
     push tiap baris sebagai file ke ROOT repo GitHub (bukan src/)
```

**Implikasi penting**: dokumentasi (`ARCHITECTURE.md`, `PROGRESS.md`)
idealnya disimpan sebagai isi sel di sheet **Documentation**, bukan
diedit manual di GitHub — supaya proses backup otomatis tidak menimpanya
kembali dengan versi lama. Lihat §10.

## 6. Data Model (Google Sheets sebagai "tabel")

Skema berikut disimpulkan dari urutan kolom yang dipakai tiap Repository
(bukan dari melihat spreadsheet langsung — pastikan urutan kolom di
Sheet betul-betul sama dengan asumsi ini).

| Sheet | Dipakai oleh | Kolom (urutan) |
|---|---|---|
| `Log_System` | AppLogger | timestamp, jenisEvent, detail, status |
| `Finance_Budgets` | BudgetRepository | id, kategori, batasJumlah, periode (`yyyy-MM`), createdAt |
| `Chat_History` | ChatHistoryRepository | id, timestamp, chatId, role (`user`/`ai`), text |
| `Documentation` | DocumentationRepository | fileName, content |
| `Memory_Facts` | FactsRepository | id, timestamp, chatId, category (`manual`/`auto`), factText, status (`Active`) |
| `Reminder_RawData` | ReminderRepository | id, timestamp, deskripsi, waktu, status (`Aktif`/`Done`), prioritas, terakhirDiingatkan, catatan, jenisRecurring, recurringConfig, jumlahDiingatkan |
| `Reminder_AckPatterns` | AckPatternsRepository | id, timestamp, pesanUser, interpretasi, aksi |
| `Finance_Transactions` | TransactionRepository | id, timestamp, walletId, tanggalTransaksi, tipe (`income`/`expense`), kategori, jumlah, deskripsi, status (`active`/`deleted`) |
| `Finance_Wallets` | WalletRepository | id, nama, saldoAwal, createdAt |

Konvensi umum semua repository:
- Baris 1 = header (selalu di-skip, baca mulai baris 2).
- ID format `PREFIX-<timestamp_ms>` (mis. `TRX-1234567890`), lihat `IdGenerator`.
- "Delete" selalu **soft delete** (ubah kolom status), tidak pernah hapus baris.
- `SpreadsheetGateway.appendRowSafe()` **wajib** dipakai untuk semua insert
  (bukan `sheet.appendRow()` langsung) — ada retry 3x + sleep 1.5s untuk
  menghindari error kuota "Service invoked too many times for one second".

## 7. Pola Desain Penting

### 7.1 Lazy Evaluation Rule (WAJIB dipatuhi)
GAS memuat semua file `.gs` sebagai satu scope global, dan urutan load
antar file tidak dijamin sama seperti urutan penomoran nama file. Karena
itu: **referensi ke modul lain TIDAK BOLEH ditulis sebagai property array
langsung di top-level**, harus dibungkus method yang baru dievaluasi saat
dipanggil. Contoh nyata di `WebSearchProviderService`:

```js
// BENAR — dibungkus method, baru resolve saat search() dipanggil
getProviders() { return [GoogleSearchProvider, TavilySearchProvider]; }

// SALAH — kalau ditulis sebagai property literal, berisiko ReferenceError
// jika file GoogleSearchProvider belum sempat dievaluasi
providers: [GoogleSearchProvider, TavilySearchProvider]
```
Pola yang sama dipakai di `LLMProviderService.CHAINS` (tiap step berupa
fungsi `execute`, bukan referensi langsung ke hasil pemanggilan).

### 7.2 Fallback Chain Pattern
Dipakai di dua tempat: `LLMProviderService.generate()` (chain `advanced`
vs `fast`) dan `WebSearchProviderService.search()`. Polanya sama: iterasi
daftar provider berurutan, `try/catch` tiap step, log warning kalau gagal
lalu lanjut ke step berikutnya, log error kalau semua gagal, return
`null`/`[]` sebagai sinyal "semua provider mati" ke pemanggil.

- Chain `advanced` (reasoning terbaik): Gemini Pro Preview → Gemini Flash
  → Gemini Flash-Lite → Groq
- Chain `fast` (tugas mekanis/sempit, mis. meringkas hasil search):
  Gemini Flash → Gemini Flash-Lite → Groq

### 7.3 Waktu selalu dalam WIB
`DateTimeUtils` adalah satu-satunya tempat yang boleh melakukan
konversi/format waktu terkait zona. **Jangan** panggil
`Utilities.formatDate()` langsung dengan zona `'UTC'` pada `Date` mentah
untuk menentukan "bulan berapa" — ada bug historis soal ini (dekat
pergantian hari/bulan) yang sudah diperbaiki via `DateTimeUtils.formatPeriode()`
dan `BudgetRepository._normalizePeriode()` (Google Sheets kadang
auto-convert string `"yyyy-MM"` jadi objek Date saat ditulis — perlu
dinormalisasi ulang saat dibaca).

### 7.4 Repository tidak tahu apa-apa soal Telegram/LLM
Repository (`04_*`) murni CRUD ke Sheet. Specialist (`08_*`) berisi
business logic dan boleh mem-format teks siap-kirim, tapi **tidak** tahu
cara mengirim ke Telegram — itu tanggung jawab `TelegramService` yang
dipanggil dari `WebhookHandler`/`Manager`. `FinanceSpecialist` secara
eksplisit mendokumentasikan aturan ini di komentar filenya.

## 8. Batas Integrasi Saat Ini (Known Gap)

`FinanceSpecialist` + `TransactionRepository` + `WalletRepository` +
`BudgetRepository` **berfungsi penuh dan sudah ada test manual**
(`test_Batch7b_FinanceSpecialist` di `99_Tests.gs`), TAPI:

- Skema output JSON di `IntentAnalyzer._outputSchemaSection()` hanya
  mengenal `tipe: "ack_reminder" | "buat_reminder" | "chat_biasa"` —
  tidak ada tipe untuk transaksi keuangan.
- `Manager._routeIntent()` tidak punya cabang untuk memanggil
  `FinanceSpecialist` sama sekali.

Artinya: **user tidak bisa mencatat transaksi lewat chat natural**
saat ini. Satu-satunya cara memanggil `FinanceSpecialist` adalah
manual lewat fungsi test di editor GAS. Detail & rekomendasi ada di
`PROGRESS.md`.

## 9. Security Model

- Web App diakses anonim di level Google (`ANYONE_ANONYMOUS`), diamankan
  via `?secret=` query param yang dicocokkan ke `SHARED_SECRET` (Script
  Property) — bukan OAuth/login.
- Setelah lolos secret, pesan juga difilter berdasarkan `chat.id` vs
  `MY_TELEGRAM_CHAT_ID` — bot ini didesain **single-user**, siapapun
  yang chat ke bot dengan chat ID lain akan diabaikan (di-log sebagai
  `SECURITY_BLOCK` tapi tetap dibalas HTTP 200 "OK" ke Telegram supaya
  Telegram tidak retry).
- Dedup `update_id` via `CacheService` (TTL 6 jam) mencegah double-processing
  kalau Telegram mengirim ulang webhook yang sama.
- Semua API key/token disimpan di **Script Properties**, tidak pernah
  di-hardcode di source (lihat daftar lengkap di §11).

## 10. Dokumentasi Ini Disimpan Di Mana?

Repo GitHub ini adalah **hasil backup otomatis** dari GAS project (lihat
commit message `"Auto backup dari GAS — <timestamp>"`), bukan tempat
editing utama. Source of truth kode ada di GAS Editor; source of truth
dokumentasi (`ARCHITECTURE.md`, `PROGRESS.md`) idealnya ada di sheet
**Documentation** (kolom `fileName`, `content`), supaya
`GitHubBackupService.backupDocs()` bisa terus menyinkronkannya ke root
repo tiap kali `runFullBackup()` dijalankan. Kalau file ini diedit
langsung di GitHub tanpa disalin balik ke sheet, perubahan itu akan
tertimpa oleh backup otomatis berikutnya.

## 11. Referensi Konfigurasi (Script Properties)

| Key | Dipakai untuk |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Kirim/edit pesan Telegram |
| `MY_TELEGRAM_CHAT_ID` | Allowlist satu-satunya user yang dilayani |
| `GEMINI_API_KEY` | Autentikasi ke Gemini API |
| `GEMINI_MODEL_PRO_PREVIEW` / `GEMINI_MODEL_FLASH` / `GEMINI_MODEL_FLASH_LITE` | Nama model per tier di chain fallback |
| `GROQ_API_KEY` | Fallback terakhir chain LLM |
| `SPREADSHEET_ID` | ID spreadsheet database utama |
| `SHARED_SECRET` | Validasi webhook Telegram |
| `GOOGLE_SEARCH_API_KEY` / `GOOGLE_SEARCH_ENGINE_ID` | Web search primer |
| `TAVILY_API_KEY` | Web search fallback |
| `GITHUB_TOKEN` / `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` / `GITHUB_BRANCH` | Backup ke GitHub (branch default `main`) |

Tidak ada satupun dari key ini yang boleh ditulis di kode/dokumen ini.