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
- Pencatatan keuangan lengkap (wallet, transaksi, budget) yang terintegrasi secara penuh melalui jalur intent dan percakapan Telegram
- Penyimpanan "fakta" tentang user (memory jangka panjang sederhana)
- Web search sebagai konteks tambahan saat user butuh info terkini
- Backup & otomatisasi repositori via **GitHubOps & GitHubBackup Service** (source code + dokumentasi)
- Ketahanan sistem mandiri melalui modul **Self-Healing** & **Fallback Parser Telegram**

## 2. Tech Stack

| Lapisan | Teknologi |
|---|---|
| Runtime | Google Apps Script (V8 runtime) |
| Database | Google Sheets (1 spreadsheet, banyak sheet/tab sebagai "tabel") |
| Channel/UI | Telegram Bot API (webhook, bukan polling) dengan Telegram Fallback Parser |
| LLM | Gemini (Pro Preview / Flash / Flash-Lite) dengan fallback ke Groq / model cerdas multi-provider |
| Web search | Google Custom Search API dengan fallback ke Tavily |
| Ops & Backup | GitHubOps & GitHubBackup Service (GitHub REST API + Apps Script API) |
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
  chat ID** (lihat §9 Security Model).
- Reminder checker, pemantauan Self-Healing, dan GitHubOps berjalan lewat **time-based trigger**,
bukan dipicu oleh request user.

## 4. Peta Modul & Komponen Script

Penomoran prefix (`00_`, `01_`, ... `99_`) dipakai untuk memudahkan
navigasi manusia di editor GAS (file diurutkan alfabetis), merepresentasikan
lapisan dari "paling dasar" ke "paling luar".

| Nama File | Deskripsi Komponen & Tanggung Jawab |
|---|---|
| `00_Config.gs` | Pengelolaan konfigurasi environment (Script Properties) dengan caching. |
| `01_SpreadsheetGateway.gs` | Abstraksi akses low-level ke Google Sheets dengan mekanisme retry logic. |
| `02_Utils.gs` | Utility helper: `IdGenerator` (ID unik) & `DateTimeUtils` (pengelolaan waktu WIB/UTC+7). |
| `03_AppLogger.gs` | Sistem pencatatan log (logging) ke sheet `Log_System` secara fail-silent. |
| `04_Repository_*.gs` | Kumpulan repository data (Budget, ChatHistory, Documentation, Facts, Knowledge, Reminder, Transaction, Wallet). |
| `05_Service_Telegram.gs` | Integrasi Telegram Bot API (kirim/edit pesan) + Telegram Payload Fallback Parser. |
| `06_Service_LLMProvider.gs` | LLM Orchestrator utama & pencetus fallback chain (`advanced` vs `fast`). |
| `07_Service_WebSearchProvider.gs` | Web Search Orchestrator dengan fallback antar provider search. |
| `08_Specialist_*.gs` | Modul agen spesialis (Chat, Finance, Knowledge, Reminder, CodeAuditor, DocSync, FeatureArchitect, LLMIntelligence, Memory, ProjectBrain, SelfAwareness, Soul, SoulMemory, SyncOrchestrator, UserProfile, ChangeDetector, SelfDocSync, SelfHealing, dll). |
| `09_CommandRouter.gs` | Fast-path handler untuk perintah eksplisit. |
| `09_Manager.gs` & `09_Manager_IntentAnalyzer.gs` | Orchestrator utama alur percakapan natural, analisis intent, dan koordinasi modul Specialist. |
| `10_Handler_Webhook.gs` | Entry point `doPost(e)` HTTP POST dari Telegram webhook. |
| `11_Trigger_MasterScheduler.gs` | Master penjadwal time-based trigger terpusat. |
| `12_Service_GitHubBackup.gs` & `13_Service_GitHubOps.gs` | Otomatisasi backup repositori dan GitHub operations. |
| `99_*.gs` | Rangkaian audit, skrip pemulihan (heal), dan test suite komprehensif. |

Semua modul ditulis sebagai **object literal** (`const X = {...}`), bukan `class`. Tidak ada dependency injection — modul saling memanggil lewat nama global langsung.

## 5. Alur Data Utama (Request Lifecycle)

### 5a. Pesan masuk dari Telegram (jalur percakapan & parsing resilient)

Telegram -> doPost(e) [10_Handler_Webhook]
  1. Validasi secret param vs Config.sharedSecret -> tolak jika salah
  2. Ekstraksi Payload via Telegram Fallback Parser -> parse aman (message, edited_message, callback_query)
  3. Cek duplikasi update_id via CacheService (TTL 6 jam) -> skip jika duplikat
  4. Cek chatId vs Config.myChatId (allowlist 1 user) -> tolak jika bukan owner
  5. Jika teks cocok command eksplisit (CommandRouter.isKnownCommand)
       -> CommandRouter.handle() -> balas langsung (fast path, TANPA panggil LLM)
  6. Selain itu (conversational path):
       a. Kirim placeholder message dulu ("⏳ Bentar, lagi mikir...")
       b. Manager.processConversationalMessage(chatId, text):
          - _gatherContext(): ambil riwayat chat terakhir, fakta aktif, profil, dll.
          - IntentAnalyzer.analyze(text, context) -> Intent terstruktur (JSON)
          - _routeIntent() berdasar intent.tipe (mencakup ack_reminder, buat_reminder, catat_keuangan, tanya_saldo, atur_budget, chat_biasa, dll.).
