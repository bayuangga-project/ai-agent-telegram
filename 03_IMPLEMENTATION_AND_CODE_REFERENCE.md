# 03 ? Implementation, Module / Function Reference, Prompts & Schemas

## 1. Inventaris source

| File | LOC | Object tingkat atas |
| --- | --- | --- |
| 00_Config.gs | 48 | Config |
| 01_SpreadsheetGateway.gs | 45 | SpreadsheetGateway |
| 02_Utils.gs | 51 | IdGenerator, DateTimeUtils |
| 03_AppLogger.gs | 23 | AppLogger |
| 04_Repository_Budget.gs | 57 | BudgetRepository |
| 04_Repository_ChatHistory.gs | 26 | ChatHistoryRepository |
| 04_Repository_Documentation.gs | 23 | DocumentationRepository |
| 04_Repository_Facts.gs | 31 | FactsRepository |
| 04_Repository_Reminder.gs | 125 | ReminderRepository, AckPatternsRepository |
| 04_Repository_Transaction.gs | 96 | TransactionRepository |
| 04_Repository_Wallet.gs | 44 | WalletRepository |
| 05_Service_Telegram.gs | 115 | TelegramService |
| 06_Service_LLMProvider.gs | 99 | LLMProviderService |
| 06_Service_LLM_Gemini.gs | 56 | GeminiProvider |
| 06_Service_LLM_Groq.gs | 61 | GroqProvider |
| 06_Service_LLM_OpenRouter.gs | 82 | OpenRouterProvider |
| 07_Service_WebSearchProvider.gs | 47 | WebSearchProviderService |
| 07_Service_WebSearch_Google.gs | 48 | GoogleSearchProvider |
| 07_Service_WebSearch_Tavily.gs | 55 | TavilySearchProvider |
| 08_Specialist_ChangeDetector.gs | 206 | ChangeDetector |
| 08_Specialist_Chat.gs | 46 | ChatSpecialist |
| 08_Specialist_CodeAuditor.gs | 680 | CodeAuditor |
| 08_Specialist_FeatureArchitect.gs | 458 | FeatureArchitect |
| 08_Specialist_Finance.gs | 217 | FinanceSpecialist |
| 08_Specialist_Knowledge.gs | 39 | KnowledgeSpecialist |
| 08_Specialist_Memory.gs | 178 | MemorySpecialist |
| 08_Specialist_ProjectBrain.gs | 430 | ProjectBrain |
| 08_Specialist_Reminder.gs | 133 | ReminderSpecialist |
| 08_Specialist_SelfAwareness.gs | 393 | SelfAwareness |
| 08_Specialist_SelfHealing.gs | 464 | SelfHealingSpecialist |
| 08_Specialist_UserProfile.gs | 120 | UserProfileSpecialist |
| 08_Utils_PatchValidator.gs | 208 | PatchValidator |
| 09_CommandRouter.gs | 63 | CommandRouter |
| 09_Manager.gs | 181 | Manager |
| 09_Manager_IntentAnalyzer.gs | 145 | IntentAnalyzer |
| 10_Handler_Webhook.gs | 79 | WebhookHandler |
| 11_Trigger_AuditScheduler.gs | 64 | AuditScheduler |
| 11_Trigger_MemorySummarizer.gs | 38 | MemorySummarizerTrigger |
| 11_Trigger_ReminderChecker.gs | 31 | ? |
| 11_Trigger_WeeklyChangeCheck.gs | 37 | WeeklyChangeCheckTrigger |
| 12_Service_GitHubBackup.gs | 186 | GitHubBackupService |
| 13_Service_GitHubOps.gs | 297 | GitHubOpsService |
| 99_Tests.gs | 138 | ? |


## 2. Object-level reference

| Object | File | Tanggung jawab |
| --- | --- | --- |
| Config | 00_Config.gs | Memuat Script Properties sekali, menyediakan konfigurasi runtime, serta mendukung penghapusan cache dan pemuatan ulang. |
| SpreadsheetGateway | 01_SpreadsheetGateway.gs | Lapisan akses Google Sheets terpusat dengan cache spreadsheet/sheet dan penambahan baris aman yang dilindungi lock. |
| IdGenerator | 02_Utils.gs | Menghasilkan ID berbasis timestamp dengan prefix yang diberikan oleh pemanggil. |
| DateTimeUtils | 02_Utils.gs | Pembantu konversi WIB serta pemformatan tanggal untuk manusia, prompt, dan periode. |
| AppLogger | 03_AppLogger.gs | Pencatatan peristiwa secara best-effort ke Log_System; kegagalan logging ditahan agar tidak menghentikan alur utama. |
| BudgetRepository | 04_Repository_Budget.gs | Penyimpanan dan kueri untuk anggaran berdasarkan kategori/periode. |
| ChatHistoryRepository | 04_Repository_ChatHistory.gs | Menyimpan pesan chat dan mengembalikan pesan terbaru. |
| DocumentationRepository | 04_Repository_Documentation.gs | Membaca catatan dokumentasi yang disimpan pada sheet Documentation. |
| FactsRepository | 04_Repository_Facts.gs | Menyimpan fakta jangka panjang yang aktif dan mengembalikan kumpulan aktif yang dibatasi jumlahnya. |
| ReminderRepository | 04_Repository_Reminder.gs | Penyimpanan, perubahan status, penjadwalan pengulangan, pola acknowledgement, dan riwayat reminder. |
| AckPatternsRepository | 04_Repository_Reminder.gs | Menyimpan/mengambil pola perilaku acknowledgement reminder. |
| TransactionRepository | 04_Repository_Transaction.gs | Penyimpanan dan kueri untuk transaksi keuangan aktif/terhapus. |
| WalletRepository | 04_Repository_Wallet.gs | Pembantu CRUD/pembacaan untuk dompet keuangan. |
| TelegramService | 05_Service_Telegram.gs | Adaptor Telegram Bot API dengan perilaku kirim/edit Markdown dan fallback Markdown. |
| LLMProviderService | 06_Service_LLMProvider.gs | Orkestrator fallback LLM berorientasi tugas untuk OpenRouter, Gemini, dan Groq. |
| GeminiProvider | 06_Service_LLM_Gemini.gs | Adaptor HTTP langsung untuk `generateContent` Google Gemini. |
| GroqProvider | 06_Service_LLM_Groq.gs | Adaptor chat completion Groq yang kompatibel dengan OpenAI. |
| OpenRouterProvider | 06_Service_LLM_OpenRouter.gs | Adaptor chat completion OpenRouter yang kompatibel dengan OpenAI. |
| WebSearchProviderService | 07_Service_WebSearchProvider.gs | Orkestrator pencarian; mencoba provider yang dikonfigurasi secara berurutan dan memformat hasil sebagai konteks LLM. |
| GoogleSearchProvider | 07_Service_WebSearch_Google.gs | Adaptor Google Custom Search JSON API. |
| TavilySearchProvider | 07_Service_WebSearch_Tavily.gs | Adaptor Tavily Search API. |
| ChangeDetector | 08_Specialist_ChangeDetector.gs | Membandingkan source Apps Script saat ini dengan snapshot yang disimpan dan memeriksa sinkronisasi dokumentasi. |
| ChatSpecialist | 08_Specialist_Chat.gs | Lapisan respons percakapan umum; menentukan apakah pencarian web diperlukan dan menyusun respons berbasis hasil pencarian. |
| CodeAuditor | 08_Specialist_CodeAuditor.gs | Audit code/sistem berbantuan LLM, penyimpanan temuan, penyaringan cakupan, dan pembuatan perbaikan. |
| FeatureArchitect | 08_Specialist_FeatureArchitect.gs | Mengubah ide fitur menjadi blueprint dan, bila dipilih, menghasilkan code implementasi. |
| FinanceSpecialist | 08_Specialist_Finance.gs | Resolusi wallet, pencatatan/pengeditan transaksi, ringkasan periode, dan operasi anggaran. |
| KnowledgeSpecialist | 08_Specialist_Knowledge.gs | Antarmuka fakta/memori yang digunakan saat pengumpulan konteks agent dan pengambilan berdasarkan kata kunci. |
| MemorySpecialist | 08_Specialist_Memory.gs | Membangun konteks memori jangka panjang dan ringkasan harian malam dari riwayat chat. |
| ProjectBrain | 08_Specialist_ProjectBrain.gs | Pembuatan roadmap, sinkronisasi/adaptasi terhadap code, jawaban atas pertanyaan roadmap, dan pemeliharaan dokumentasi. |
| ReminderSpecialist | 08_Specialist_Reminder.gs | Siklus hidup reminder, acknowledgement, deteksi reminder yang jatuh tempo, notifikasi, dan penanganan pengulangan. |
| SelfAwareness | 08_Specialist_SelfAwareness.gs | Meninjau status/kapabilitas sistem dan menyimpan laporan self-review. |
| SelfHealingSpecialist | 08_Specialist_SelfHealing.gs | Mendiagnosis kesalahan yang dilaporkan, menghasilkan dokumentasi atau patch, memvalidasi patch, dan mengelola status patch. |
| UserProfileSpecialist | 08_Specialist_UserProfile.gs | Menyimpan/upsert atribut profil pengguna dan memformat konteks prompt yang dibatasi. |
| PatchValidator | 08_Utils_PatchValidator.gs | Pemeriksaan sintaks/struktur/pola mencurigakan secara statis untuk patch yang dihasilkan; bukan validasi runtime/perilaku. |
| CommandRouter | 09_CommandRouter.gs | Menangani perintah slash eksplisit secara terpisah dari routing intent percakapan. |
| Manager | 09_Manager.gs | Lapisan orkestrasi percakapan utama mulai dari pengumpulan konteks hingga dispatch intent dan eksekusi specialist. |
| IntentAnalyzer | 09_Manager_IntentAnalyzer.gs | Classifier/parser intent berbasis LLM dengan skema JSON terstruktur dan bagian konteks yang lengkap. |
| WebhookHandler | 10_Handler_Webhook.gs | Memvalidasi permintaan webhook Telegram yang masuk, menekan duplikat, dan meneruskan pesan ke Manager. |
| AuditScheduler | 11_Trigger_AuditScheduler.gs | Penyiapan trigger audit berbasis waktu dan wrapper eksekusi terjadwal. |
| MemorySummarizerTrigger | 11_Trigger_MemorySummarizer.gs | Penyiapan trigger ringkasan memori malam hari. |
| WeeklyChangeCheckTrigger | 11_Trigger_WeeklyChangeCheck.gs | Penyiapan trigger deteksi perubahan source mingguan. |
| GitHubBackupService | 12_Service_GitHubBackup.gs | Mencadangkan source/dokumentasi Apps Script ke GitHub menggunakan pembaruan berbasis SHA konten. |
| GitHubOpsService | 13_Service_GitHubOps.gs | Membaca file/direktori repository, membaca seluruh file source, membuat branch, melakukan commit file, membuka PR, dan memperbarui dokumentasi. |


## 3. Referensi Function/method

Inventaris berikut dibuat dari source yang dapat dieksekusi dengan memindai deklarasi method pada object literal. Nomor baris adalah penanda lokasi pada source, bukan jaminan bahwa posisi atau maknanya akan tetap stabil setelah perubahan.

### `00_Config.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| load | ? | 10 | Memuat dan melakukan cache pada Script Properties. |
| clearCache | ? | 40 | Membersihkan cache konfigurasi di memori. |
| reload | ? | 44 | Membersihkan cache lalu segera memuat ulang konfigurasi. |


### `01_SpreadsheetGateway.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getSpreadsheet | ? | 10 | Membuka Google Spreadsheet yang dikonfigurasi sekali lalu menyimpan object-nya di cache. |
| getSheet | sheetName | 17 | Mengembalikan sheet berdasarkan nama dan menyimpannya di cache; melempar kesalahan jika tidak ditemukan. |
| appendRowSafe | sheetName, rowData | 31 | Mengambil script lock lalu menambahkan satu baris dengan aman. |


### `02_Utils.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| generate | prefix | 16 | Menghasilkan ID berbasis timestamp dengan prefix yang diberikan oleh pemanggil. |
| toWIB | date | 24 | Mengonversi Date dengan menerapkan offset +7 jam. |
| nowWIB | ? | 28 | Mengembalikan waktu saat ini yang dikonversi melalui `toWIB`. |
| formatWaktu | date | 32 | Memformat tanggal untuk manusia, prompt, dan periode. |


### `03_AppLogger.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| log | message, level | 10 | Mencatat peristiwa sistem secara best-effort. |


### `04_Repository_Budget.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getBudgets | ? | 10 | Mengembalikan seluruh budget yang tersimpan. |
| getBudget | category, period | 18 | Mengembalikan budget berdasarkan kunci kategori/periode. |
| upsertBudget | budgetData | 30 | Menyimpan atau memperbarui budget. |
| deleteBudget | category, period | 48 | Menghapus budget berdasarkan kunci. |
| checkBudgetCrossing | category, period, amount | 52 | Memeriksa apakah transaksi akan melampaui budget. |


### `04_Repository_ChatHistory.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| appendChat | chatId, message | 10 | Menambahkan pesan chat baru. |
| getRecentChats | chatId, limit | 20 | Mengembalikan pesan chat terbaru berdasarkan batas. |


### `04_Repository_Documentation.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getDocumentation | fileName | 10 | Membaca catatan dokumentasi berdasarkan nama file. |
| upsertDocumentation | fileName, content | 18 | Menyimpan atau memperbarui catatan dokumentasi. |


### `04_Repository_Facts.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getActiveFacts | ? | 10 | Mengembalikan fakta aktif yang dibatasi jumlahnya. |
| upsertFact | fact | 20 | Menyimpan atau memperbarui fakta. |
| deactivateFact | id | 28 | Menonaktifkan fakta berdasarkan ID. |


### `04_Repository_Reminder.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getReminders | chatId | 10 | Mengembalikan reminder berdasarkan chat ID. |
| getReminder | id | 18 | Mengembalikan reminder berdasarkan ID. |
| upsertReminder | reminderData | 25 | Menyimpan atau memperbarui reminder. |
| updateStatus | id, status | 45 | Memperbarui status reminder. |
| getAckPatterns | ? | 55 | Mengembalikan pola acknowledgement yang tersimpan. |
| upsertAckPattern | patternData | 65 | Menyimpan atau memperbarui pola acknowledgement. |
| getReminderHistory | chatId | 75 | Mengembalikan riwayat reminder. |


### `04_Repository_Transaction.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getTransactions | walletId | 10 | Mengembalikan transaksi berdasarkan wallet ID. |
| getTransaction | id | 20 | Mengembalikan transaksi berdasarkan ID. |
| upsertTransaction | transactionData | 30 | Menyimpan atau memperbarui transaksi. |
| softDeleteTransaction | id | 50 | Menandai transaksi sebagai terhapus secara lunak. |
| getBalance | walletId | 60 | Menghitung saldo dari transaksi aktif. |
| getPeriodSummary | walletId, period | 70 | Mengembalikan ringkasan periode. |


### `04_Repository_Wallet.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getWallets | ? | 10 | Mengembalikan seluruh wallet. |
| getWallet | id | 18 | Mengembalikan wallet berdasarkan ID. |
| upsertWallet | walletData | 28 | Menyimpan atau memperbarui wallet. |
| deleteWallet | id | 40 | Menghapus wallet. |


### `05_Service_Telegram.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| sendMessage | chatId, text | 10 | Mengirim pesan ke Telegram dengan format Markdown. |
| editMessage | chatId, messageId, text | 30 | Mengedit pesan yang sudah dikirim. |
| sendMessageWithFallback | chatId, text | 50 | Mengirim pesan dengan fallback ke format teks biasa jika Markdown gagal. |


### `06_Service_LLMProvider.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getProviders | ? | 10 | Mengembalikan daftar provider LLM yang tersedia. |
| getAdvancedChain | ? | 20 | Mengembalikan rantai provider untuk mode advanced. |
| getFastChain | ? | 30 | Mengembalikan rantai provider untuk mode fast. |
| generate | prompt, chain | 40 | Menghasilkan respons dari rantai provider LLM. |


### `06_Service_LLM_Gemini.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| generateContent | prompt | 10 | Mengirim prompt ke Gemini API dan mengembalikan konten yang dihasilkan. |


### `06_Service_LLM_Groq.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| chatCompletion | prompt | 10 | Mengirim prompt ke Groq API dan mengembalikan chat completion. |


### `06_Service_LLM_OpenRouter.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| chatCompletion | prompt | 10 | Mengirim prompt ke OpenRouter API dan mengembalikan chat completion. |


### `07_Service_WebSearchProvider.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getProviders | ? | 10 | Mengembalikan daftar provider pencarian yang tersedia. |
| search | query | 20 | Menjalankan pencarian berurutan melalui provider yang tersedia. |


### `07_Service_WebSearch_Google.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| search | query | 10 | Menjalankan pencarian melalui Google Custom Search JSON API. |


### `07_Service_WebSearch_Tavily.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| search | query | 10 | Menjalankan pencarian melalui Tavily Search API. |


### `08_Specialist_ChangeDetector.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| detectChanges | ? | 10 | Membandingkan source saat ini dengan snapshot dan mendeteksi perubahan. |
| getSnapshot | ? | 40 | Mengembalikan snapshot source yang tersimpan. |
| createSnapshot | ? | 60 | Membuat snapshot source baru. |
| checkDocSync | ? | 80 | Memeriksa sinkronisasi dokumentasi terhadap source. |


### `08_Specialist_Chat.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| respond | context | 10 | Menyusun respons percakapan umum. |
| needsWebSearch | context | 30 | Menentukan apakah pencarian web diperlukan. |
| buildSearchContext | results | 40 | Menyusun konteks dari hasil pencarian web. |


### `08_Specialist_CodeAuditor.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| audit | scope | 10 | Melakukan audit code/sistem berbantuan LLM. |
| storeFindings | findings | 40 | Menyimpan temuan audit ke sheet. |
| filterScope | scope | 60 | Menyaring cakupan audit. |
| generateFix | finding | 80 | Menghasilkan perbaikan berdasarkan temuan. |


### `08_Specialist_FeatureArchitect.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| buildBlueprint | idea | 10 | Mengubah ide fitur menjadi blueprint. |
| generateCode | blueprint | 40 | Menghasilkan code implementasi dari blueprint. |
| getProjectContext | ? | 60 | Mengembalikan konteks proyek. |


### `08_Specialist_Finance.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| resolveWallet | identifier | 10 | Menyelesaikan wallet berdasarkan identifier. |
| recordTransaction | transactionData | 25 | Mencatat transaksi baru. |
| editTransaction | id, updates | 45 | Mengedit transaksi yang sudah ada. |
| summarizePeriod | walletId, period | 65 | Merangkum periode keuangan. |
| manageBudget | budgetData | 85 | Mengelola anggaran. |


### `08_Specialist_Knowledge.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getFacts | ? | 10 | Mengembalikan fakta aktif. |
| getMemoryContext | ? | 20 | Mengembalikan konteks memori untuk pengumpulan konteks agent. |
| searchByKeyword | keyword | 30 | Mengambil data berdasarkan kata kunci. |


### `08_Specialist_Memory.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| buildContext | chatId | 10 | Membangun konteks memori jangka panjang. |
| getDailySummary | date | 40 | Mengembalikan ringkasan harian malam. |
| persistSummary | summary | 60 | Menyimpan ringkasan harian. |


### `08_Specialist_ProjectBrain.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| buildRoadmap | ? | 10 | Membangun roadmap proyek. |
| syncWithCode | ? | 40 | Menyinkronkan roadmap dengan source code. |
| adaptRoadmap | ? | 60 | Mengadaptasi roadmap terhadap perubahan code. |
| queryRoadmap | question | 80 | Menjawab pertanyaan tentang roadmap. |
| updateDocumentation | ? | 100 | Memelihara dokumentasi proyek. |


### `08_Specialist_Reminder.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getDueReminders | ? | 10 | Mengembalikan reminder yang jatuh tempo. |
| acknowledge | id | 25 | Mengakui reminder. |
| complete | id | 40 | Menyelesaikan reminder. |
| snooze | id, duration | 55 | Menunda reminder. |
| notify | reminder | 70 | Mengirim notifikasi reminder. |
| handleRecurrence | reminder | 90 | Menangani pengulangan reminder. |


### `08_Specialist_SelfAwareness.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| review | ? | 10 | Meninjau status/kapabilitas sistem. |
| deepDive | ? | 40 | Melakukan analisis mendalam terhadap sistem. |
| storeReview | report | 60 | Menyimpan laporan self-review. |


### `08_Specialist_SelfHealing.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| diagnose | error | 10 | Mendiagnosis kesalahan yang dilaporkan. |
| generateDocumentation | issue | 30 | Menghasilkan dokumentasi perbaikan. |
| generatePatch | issue | 50 | Menghasilkan patch perbaikan. |
| validatePatch | patch | 70 | Memvalidasi patch secara statis. |
| managePatchStatus | patch | 90 | Mengelola status patch. |


### `08_Specialist_UserProfile.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getProfile | chatId | 10 | Mengembalikan profil pengguna. |
| upsertProfile | profileData | 25 | Menyimpan atau memperbarui profil pengguna. |
| formatContext | profile | 45 | Memformat konteks prompt yang dibatasi. |


### `08_Utils_PatchValidator.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| validate | patch | 10 | Memeriksa sintaks/struktur/pola mencurigakan secara statis. |
| checkSuspiciousPatterns | patch | 40 | Memeriksa pola mencurigakan dalam patch. |
| verifyStructure | patch | 60 | Memverifikasi struktur patch. |


### `09_CommandRouter.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| isKnownCommand | text | 10 | Mengenali apakah teks merupakan perintah slash yang dikenal. |
| routeCommand | text | 25 | Merutekan perintah ke handler yang sesuai. |
| handlePatchApply | args | 40 | Menangani jalur aksi `/patch apply`. |


### `09_Manager.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| processConversationalMessage | chatId, text | 10 | Memproses pesan percakapan sebagai entri aplikasi. |
| _gatherContext | chatId | 30 | Mengumpulkan konteks terbaru dan persisten. |
| _routeIntent | intent | 50 | Merutekan intent ke specialist yang sesuai. |
| _persistAutoFacts | facts | 70 | Menyimpan pembaruan memori/profil otomatis. |


### `09_Manager_IntentAnalyzer.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| analyze | text, context | 10 | Membangun klasifikasi intent berbasis LLM dengan skema JSON terstruktur. |
| _buildPrompt | text, context | 35 | Menyusun prompt klasifikasi dengan bagian konteks yang lengkap. |
| _parseResponse | response | 55 | Mengurai respons LLM menjadi object intent terstruktur. |
| _handleIntentFailure | error | 75 | Menangani kegagalan parsing intent. |


### `10_Handler_Webhook.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| handle | e | 10 | Menangani permintaan webhook Telegram masuk. |
| _isAuthorized | e | 30 | Memvalidasi otorisasi berdasarkan shared-secret. |
| _processMessage | e | 50 | Mengekstrak chatId dan teks dari update. |


### `11_Trigger_AuditScheduler.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| setupAuditTrigger | ? | 10 | Menyiapkan trigger audit berbasis waktu. |
| runScheduledAudit | ? | 30 | Wrapper eksekusi audit terjadwal. |


### `11_Trigger_MemorySummarizer.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| setupNightlySummarizer | ? | 10 | Menyiapkan trigger ringkasan memori malam hari. |
| runNightlySummarizer | ? | 25 | Wrapper eksekusi ringkasan malam hari. |


### `11_Trigger_WeeklyChangeCheck.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| setupWeeklyChangeCheck | ? | 10 | Menyiapkan trigger deteksi perubahan source mingguan. |
| runWeeklyChangeCheck | ? | 25 | Wrapper eksekusi deteksi perubahan mingguan. |


### `12_Service_GitHubBackup.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| backupSource | ? | 10 | Mencadangkan source Apps Script ke GitHub. |
| backupDocumentation | ? | 40 | Mencadangkan dokumentasi ke GitHub. |
| getFileSha | path | 60 | Mengambil SHA konten file untuk pembaruan berbasis diff. |
| updateFile | path, content, sha | 80 | Memperbarui file di GitHub berdasarkan SHA. |


### `13_Service_GitHubOps.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| readFile | path | 10 | Membaca file di repository GitHub. |
| listDirectory | path | 30 | Mendaftar isi direktori repository. |
| aggregateSource | ? | 50 | Mengagregasi seluruh file source. |
| createBranch | branchName | 80 | Membuat branch baru. |
| createBackupBranch | ? | 100 | Membuat branch cadangan. |
| commitFile | path, content, branch | 120 | Melakukan commit file di branch. |
| createPullRequest | title, body, branch | 150 | Membuka pull request. |
| updateDocumentation | fileName, content | 180 | Memperbarui dokumentasi di repository. |


### `99_Tests.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| test_Batch7b_FinanceSpecialist | ? | 10 | Finance behavior manual test. |
| test_TelegramMarkdownFallback | ? | 30 | Outbound formatting resilience test. |
| debug_CheckOAuthScopes | ? | 50 | Troubleshooting deployment/perizinan. |
| debug_CheckGitHubConfig | ? | 70 | GitHub integration configuration debug. |
