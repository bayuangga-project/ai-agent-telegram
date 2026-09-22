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
| formatWaktu | date | 32 | Memformat tanggal untuk keluaran reminder yang sesuai. |


### `06_Service_LLMProvider.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| generate | prompt, chain | ? | Memilih rantai provider lalu menjalankan fallback provider. |


### `09_Manager.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| processConversationalMessage | text, chatId | ? | Menjadi entry point untuk pemrosesan percakapan natural language. |
| _gatherContext | chatId | ? | Mengumpulkan riwayat chat dan konteks persisten yang relevan. |
| _routeIntent | intent | ? | Mendispatch intent berdasarkan `intent.tipe` dan field intent lainnya. |
| _persistAutoFacts | intent, context | ? | Menyimpan pembaruan memori/profil yang dikembalikan sebelum/sekitar proses routing. |


### `10_Handler_Webhook.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| handle | e | ? | Memvalidasi permintaan webhook Telegram yang masuk, menekan duplikat, dan meneruskan pesan ke Manager. |
| _isAuthorized | e | ? | Memvalidasi otorisasi shared-secret webhook. |
| _processMessage | e | ? | Mengekstrak chatId dan teks dari update Telegram. |