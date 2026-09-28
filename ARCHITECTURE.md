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
- Pencatatan keuangan (wallet, transaksi, budget) ? **backend sudah jadi, tapi belum tersambung ke jalur percakapan**, lihat ?8 dan PROGRESS.md
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
| LLM | Gemini (Pro Preview / Flash / Flash-Lite) dengan fallback ke Groq (`openai/gpt-oss-20b`) dan OpenRouter |
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

## 4. Peta Modul & Komponen Script

Penomoran prefix (`00_`, `01_`, ... `13_`) dipakai untuk memudahkan
navigasi manusia di editor GAS (file diurutkan alfabetis), merepresentasikan
lapisan dari "paling dasar" ke "paling luar".

| Nama File | Deskripsi Komponen & Tanggung Jawab |
|---|---|
| `00_Config.gs` | Pengelolaan konfigurasi environment (Script Properties) dengan caching. |
| `01_SpreadsheetGateway.gs` | Abstraksi akses low-level ke Google Sheets dengan mekanisme retry logic. |
| `02_Utils.gs` | Utility helper: `IdGenerator` (ID unik) & `DateTimeUtils` (pengelolaan waktu WIB/UTC+7). |
| `03_AppLogger.gs` | Sistem pencatatan log (logging) ke sheet `Log_System` secara fail-silent. |
| `04_Repository_Budget.gs` | Akses data anggaran/budget bulanan di sheet `Finance_Budgets`. |
| `04_Repository_ChatHistory.gs` | Akses data riwayat percakapan Telegram di sheet `Chat_History`. |
| `04_Repository_Documentation.gs` | Akses data dokumen arsitektur dan progres di sheet `Documentation`. |
| `04_Repository_Facts.gs` | Akses data fakta & memori jangka panjang di sheet `Memory_Facts`. |
| `04_Repository_Reminder.gs` | Akses data pengingat/reminder di sheet `Reminder_RawData`. |
| `04_Repository_Transaction.gs` | Akses data transaksi keuangan (pemasukan/pengeluaran) di sheet `Finance_Transactions`. |
| `04_Repository_Wallet.gs` | Akses data dompet/kas di sheet `Finance_Wallets`. |
| `05_Service_Telegram.gs` | Integrasi Telegram Bot API (kirim/edit pesan) + Telegram Payload Fallback Parser. |
| `06_Service_LLMProvider.gs` | LLM Orchestrator utama & pencetus fallback chain (`advanced` vs `fast`). |
| `06_Service_LLM_Gemini.gs` | Provider LLM untuk Google Gemini API (Pro Preview, Flash, Flash-Lite). |
| `06_Service_LLM_Groq.gs` | Provider LLM fallback menggunakan Groq API (`openai/gpt-oss-20b`). |
| `06_Service_LLM_OpenRouter.gs` | Provider LLM fallback menggunakan OpenRouter API. |
| `07_Service_WebSearchProvider.gs` | Web Search Orchestrator dengan fallback antar provider search. |
| `07_Service_WebSearch_Google.gs` | Provider pencarian web menggunakan Google Custom Search Engine (CSE) API. |
| `07_Service_WebSearch_Tavily.gs` | Provider pencarian web fallback menggunakan Tavily API. |
| `08_Specialist_ChangeDetector.gs` | Deteksi perubahan kode sumber vs snapshot dokumentasi. |
| `08_Specialist_Chat.gs` | Business logic respons percakapan umum & integrasi search context. |
| `08_Specialist_CodeAuditor.gs` | Business logic audit kode sumber secara batch. |
| `08_Specialist_DocSync.gs` | Business logic sinkronisasi dokumentasi kanonik. |
| `08_Specialist_FeatureArchitect.gs` | Business logic generasi blueprint & implementasi fitur. |
| `08_Specialist_Finance.gs` | Business logic manajemen keuangan (wallet, transaksi, laporan, budget). |
| `08_Specialist_Knowledge.gs` | Business logic ekstraksi dan pengelolaan memori fakta user. |
| `08_Specialist_KnowledgeSync.gs` | Sinkronisasi knowledge antara Google Sheets dan GitHub. |
| `08_Specialist_LLMIntelligence.gs` | Business logic discovery, benchmarking, dan ranking model LLM. |
| `08_Specialist_Memory.gs` | Business logic memory jangka panjang & summarization harian. |
| `08_Specialist_ProjectBrain.gs` | Business logic roadmap proyek & sinkronisasi dengan kode. |
| `08_Specialist_Reminder.gs` | Business logic siklus pengingat, notifikasi, ack status, dan recurring context. |
| `08_Specialist_SelfAwareness.gs` | Business logic self-assessment & review kemampuan sistem. |
| `08_Specialist_SelfDocSync.gs.gs` | Business logic sinkronisasi dokumentasi mandiri (self-doc-sync) dengan draft & approval. |
| `08_Specialist_SelfHealing.gs` | Deteksi error, pemulihan otomatis (auto-recovery trigger), dan pemantauan kesehatan sistem. |
| `08_Specialist_Soul.gs` | Business logic persona/soul AI: identity, beliefs, growth, emotional state. |
| `08_Specialist_SoulMemory.gs` | Business logic episode memory untuk soul. |
| `08_Specialist_SyncOrchestrator.gs` | Orkestrasi sinkronisasi menyeluruh: knowledge, documentation, sheet structure. |
| `08_Specialist_UserProfile.gs` | Business logic profil pengguna & update profile. |
| `08_Utils_PatchValidator.gs` | Validasi patch kode: syntax check, structural sanity, suspicious pattern detection. |
| `08_Utils_TemplateEngine.gs` | Mesin template sederhana untuk render variabel ke template. |
| `09_CommandRouter.gs` | Fast-path handler untuk perintah eksplisit (misal `/ingat`, `/reminder`). |
| `09_Manager.gs` | Orchestrator utama alur percakapan natural dan koordinasi modul Specialist. |
| `09_Manager_IntentAnalyzer.gs` | Komponen penentu intent user berbasis LLM dengan output JSON terstruktur. |
| `10_Handler_Webhook.gs` | Entry point `doPost(e)` HTTP POST dari Telegram webhook. |
| `11_Trigger_AuditScheduler.gs` | Entry point time-based trigger mingguan untuk audit kode. |
| `11_Trigger_LLMIntelligence.gs` | Entry point time-based trigger harian untuk LLM discovery pipeline. |
| `11_Trigger_MemorySummarizer.gs` | Entry point time-based trigger malam hari untuk memory summarization. |
| `11_Trigger_ReminderChecker.gs` | Entry point time-based trigger per menit untuk pengecekan reminder. |
| `11_Trigger_ScheduledSync.gs` | Entry point time-based trigger untuk scheduled sync. |
| `11_Trigger_WeeklyChangeCheck.gs` | Entry point time-based trigger mingguan untuk change detection. |
| `12_Service_GitHubBackup.gs` | Backup otomatis kode sumber ke GitHub. |
| `13_Service_GitHubOps.gs` | Operasi GitHubOps: read, list, commit, PR, doc sync, restore. |
| `99_TestSuite_Full.gs` | Suite pengujian otomatis penuh. |
| `99_Test_SelfDocSync.gs` | Pengujian khusus modul SelfDocSync. |
| `99_Tests.gs` | Script manual testing & verifikasi integrasi internal. |
| `Rollback.gs` | Mekanisme rollback darurat dari GitHub. |

Semua modul ditulis sebagai **object literal** (`const X = {...}`), bukan `class`. Tidak ada dependency injection ? modul saling memanggil lewat nama global langsung.

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
       a. Kirim placeholder message dulu ("? Bentar, lagi mikir...")
       b. Manager.processConversationalMessage(chatId, text):
          - _gatherContext(): ambil 15 riwayat chat terakhir, 50 fakta aktif,
            reminder yang sedang menunggu respon, 10 pola ack terakhir
          - IntentAnalyzer.analyze(text, context):
              - bangun 1 prompt besar (persona + semua konteks di atas + pesan user + skema output JSON)
              - panggil LLMProviderService.generate({chain:'advanced', ...})
              - parse response jadi objek intent (JSON)
          - Jika intent gagal di-parse -> fallback: panggil LLM chain 'advanced'
            langsung dengan riwayat chat mentah (tanpa struktur intent)
          - _routeIntent() berdasar intent.tipe:
              "ack_reminder"  -> ReminderSpecialist.acknowledge(...)
              "buat_reminder" -> ReminderSpecialist.create(...)
              lainnya (termasuk "chat_biasa") -> _handleChatBiasa()
                - jika intent butuh info terkini -> WebSearchProviderService.search() lalu ChatSpecialist.respondWithSearchContext()
                - jika tidak -> pakai intent.jawabanChat langsung (LLM sudah menjawab sekaligus saat analisis intent, hemat 1 API call)
          - Simpan fakta baru yang terdeteksi (KnowledgeSpecialist.saveAutoDetectedFacts)
          - Simpan riwayat chat (ChatHistoryRepository.save, role user & ai)
       c. TelegramService.editMessage() -> placeholder diedit jadi jawaban final

### 5b. Reminder checker (jalur terjadwal, tiap 1 menit)

Time trigger -> cekDanKirimReminder() [11_Trigger_ReminderChecker]
  1. ReminderSpecialist.getRemindersDueNow()
     -> ReminderRepository.getActive() difilter: waktu <= sekarang (WIB) DAN (belum pernah diingatkan ATAU sudah lewat cooldown 5 menit sejak terakhir diingatkan)
  2. Untuk tiap reminder due:
     -> ReminderSpecialist.buildNotificationText() (sisipkan 1 fakta relevan jika ada)
     -> TelegramService.sendMessage()
     -> ReminderSpecialist.markAsNotified() -> increment jumlahDiingatkan, update terakhirDiingatkan

### 5c. Operasi & Backup GitHubOps (manual / terjadwal harian jam 23:00 WIB)

runFullGitHubOps() [13_Service_GitHubOps]
  1. Sync Source Code: baca seluruh file `.gs` dari Apps Script API, push otomatis ke folder `src/` di repositori GitHub.
  2. Sync Dokumentasi: baca tab sheet `Documentation`, push/update file markdown (`ARCHITECTURE.md`, `PROGRESS.md`) ke root repositori GitHub.
  3. Self-Check Repositori: pastikan integritas file dan kelengkapan repositori GitHub.

## 6. Data Model (Google Sheets sebagai "tabel")

| Sheet | Dipakai oleh | Kolom (urutan) |
|---|---|---|
| `Log_System` | AppLogger & SelfHealing | timestamp, jenisEvent, detail, status |
| `Finance_Budgets` | BudgetRepository | id, kategori, batasJumlah, periode (`yyyy-MM`), createdAt |
| `Chat_History` | ChatHistoryRepository | id, timestamp, chatId, role (`user`/`ai`), text |
| `Documentation` | DocumentationRepository | fileName, content |
| `Memory_Facts` | FactsRepository | id, timestamp, chatId, category (`manual`/`auto`), factText, status (`Active`) |
| `Reminder_RawData` | ReminderRepository | id, timestamp, deskripsi, waktu, status (`Aktif`/`Done` |

## 7. Security Model

- Satu pemilik/satu chat ID (allowlist).
- Shared secret di query parameter untuk validasi webhook.
- Tidak ada multi-tenant.

## 8. Gap & Catatan

- Modul Finance sudah lengkap secara backend tapi belum terintegrasi ke jalur percakapan Telegram.
- Tidak ada automated test suite yang berjalan otomatis.
- Dokumentasi wajib diperbarui di sheet `Documentation` agar GitHubOps dapat melakukan sync dua arah.
