# 03 — Implementation, Module / Function Reference, Prompts & Schemas

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
| 11_Trigger_ReminderChecker.gs | 31 | — |
| 11_Trigger_WeeklyChangeCheck.gs | 37 | WeeklyChangeCheckTrigger |
| 12_Service_GitHubBackup.gs | 186 | GitHubBackupService |
| 13_Service_GitHubOps.gs | 297 | GitHubOpsService |
| 99_Tests.gs | 138 | — |


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
| load | — | 10 | Memuat dan melakukan cache pada Script Properties. |
| clearCache | — | 40 | Membersihkan cache konfigurasi di memori. |
| reload | — | 44 | Membersihkan cache lalu segera memuat ulang konfigurasi. |


### `01_SpreadsheetGateway.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getSpreadsheet | — | 10 | Membuka Google Spreadsheet yang dikonfigurasi sekali lalu menyimpan object-nya di cache. |
| getSheet | sheetName | 17 | Mengembalikan sheet berdasarkan nama dan menyimpannya di cache; melempar kesalahan jika tidak ditemukan. |
| appendRowSafe | sheetName, rowData | 31 | Mengambil script lock lalu menambahkan satu baris dengan aman. |


### `02_Utils.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| generate | prefix | 16 | Memilih rantai lalu menjalankan fallback provider. |
| toWIB | date | 24 | Mengonversi Date dengan menerapkan offset +7 jam. |
| nowWIB | — | 28 | Mengembalikan waktu saat ini yang dikonversi melalui `toWIB`. |
| formatWaktu | date | 32 | Memformat tanggal untuk keluaran reminder yang mudah dibaca manusia. |
| formatUntukPrompt | date | 37 | Memformat tanggal/waktu untuk konteks prompt. |
| formatPeriode | date | 48 | Memformat tanggal sebagai kunci periode (tahun-bulan). |


### `03_AppLogger.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| write | jenisEvent, detail, status | 9 | Menulis peristiwa sistem terstruktur ke Log_System dan menahan kegagalan logger. |
| info | jenisEvent, detail | 20 | Menulis log INFO. |
| warning | jenisEvent, detail | 21 | Menulis log WARNING. |
| error | jenisEvent, detail | 22 | Menulis log ERROR. |


### `04_Repository_Budget.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| create | kategori, batasJumlah, periode | 9 | Menyimpan entity baru secara persisten. |
| getAll | — | 17 | Membaca seluruh baris menjadi object yang dinormalisasi. |
| _normalizePeriode | value | 39 | Menormalkan nilai periode ke representasi periode yang diharapkan. |
| findByKategoriAndPeriode | kategori, periode | 46 | Mencari catatan budget/transaksi berdasarkan kategori dan periode. |
| getByPeriode | periode | 50 | Mengembalikan budget untuk suatu periode. |
| updateBatasJumlah | rowIndex, batasJumlahBaru | 54 | Memperbarui batas budget secara langsung pada catatan yang ada. |


### `04_Repository_ChatHistory.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getRecent | limit | 9 | Mengembalikan N catatan chat terbaru. |
| save | chatId, role, text | 21 | Menyimpan fakta/pesan/riwayat/pola acknowledgement sesuai kebutuhan. |


### `04_Repository_Documentation.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getAll | — | 13 | Membaca seluruh baris menjadi object yang dinormalisasi. |


### `04_Repository_Facts.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| save | chatId, factText, category | 10 | Menyimpan fakta/pesan/riwayat/pola acknowledgement sesuai kebutuhan. |
| getActive | maxFacts | 17 | Mengembalikan hanya catatan yang aktif. |


### `04_Repository_Reminder.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| create | data | 17 | Menyimpan entity baru secara persisten. |
| _mapRow | row, rowIndex | 27 | Memetakan baris mentah dari sheet menjadi object domain. |
| getAll | — | 43 | Membaca seluruh baris menjadi object yang dinormalisasi. |
| getActive | — | 52 | Mengembalikan hanya catatan yang aktif. |
| getMenungguRespon | batasMenit | 56 | Mencari reminder yang menunggu acknowledgement dalam jendela waktu tertentu. |
| updateStatus | rowIndex, status | 67 | Memperbarui status reminder/catatan berdasarkan baris. |
| updateTerakhirDiingatkan | rowIndex, jumlahBaru | 72 | Memperbarui jumlah notifikasi/metadata waktu reminder. |
| updateWaktu | rowIndex, waktuBaru | 78 | Mengubah waktu reminder. |
| hitungWaktuBerikutnya | reminder | 83 | Menghitung kejadian berikutnya untuk reminder berulang. |
| formatDaftarAktifSebagaiTeks | — | 91 | Merender reminder aktif menjadi teks. |
| save | pesanUser, interpretasi, aksi | 108 | Menyimpan fakta/pesan/riwayat/pola acknowledgement sesuai kebutuhan. |
| getRecent | limit | 114 | Mengembalikan N catatan chat terbaru. |


### `04_Repository_Transaction.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| create | data | 18 | Menyimpan entity baru secara persisten. |
| _mapRow | row, rowIndex | 28 | Memetakan baris mentah dari sheet menjadi object domain. |
| getAll | — | 43 | Membaca seluruh baris menjadi object yang dinormalisasi. |
| getActive | — | 52 | Mengembalikan hanya catatan yang aktif. |
| getLastActive | — | 56 | Mengambil transaksi aktif terbaru. |
| findById | id | 61 | Mencari wallet berdasarkan ID. |
| getByWallet | walletId | 65 | Mengueri transaksi untuk suatu wallet. |
| getByKategoriAndPeriode | kategori, tahunBulan | 69 | Mengueri transaksi berdasarkan kategori dan periode YYYY-MM. |
| softDelete | rowIndex | 76 | Menandai transaksi sebagai terhapus tanpa menghapus baris. |
| update | rowIndex, updatedFields | 81 | Memperbarui field transaksi yang dipilih. |


### `04_Repository_Wallet.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| create | nama, saldoAwal | 9 | Menyimpan entity baru secara persisten. |
| getAll | — | 17 | Membaca seluruh baris menjadi object yang dinormalisasi. |
| findByName | nama | 32 | Mencari wallet berdasarkan logika pencocokan nama yang tepat. |
| findById | id | 37 | Mencari wallet berdasarkan ID. |
| exists | nama | 41 | Memeriksa keberadaan wallet. |


### `05_Service_Telegram.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| pickPlaceholder | — | 14 | Memilih placeholder pemrosesan secara acak. |
| sendMessage | chatId, text | 19 | Mengirim pesan Telegram menggunakan Markdown dengan perilaku fallback. |
| editMessage | chatId, messageId, text | 67 | Mengedit pesan Telegram dengan perilaku Markdown/fallback. |


### `06_Service_LLMProvider.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| generate | params | 69 | Memilih rantai lalu menjalankan fallback provider. |
| generateFromSinglePrompt | promptText, temperature, chain | 92 | Convenience wrapper for a single prompt call. |


### `06_Service_LLM_Gemini.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| call | systemInstruction, messages, temperature, modelName | 12 | Menjalankan permintaan HTTP langsung ke provider LLM tertentu. |


### `06_Service_LLM_Groq.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| call | systemInstruction, messages, temperature | 11 | Menjalankan permintaan HTTP langsung ke provider LLM tertentu. |


### `06_Service_LLM_OpenRouter.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| call | systemInstruction, messages, temperature, modelName | 19 | Menjalankan permintaan HTTP langsung ke provider LLM tertentu. |


### `07_Service_WebSearchProvider.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getProviders | — | 15 | Mengembalikan object provider pencarian yang dikonfigurasi secara lazy. |
| search | query | 19 | Menjalankan pencarian dengan fallback provider. |
| formatResultsAsContext | results | 36 | Mengonversi hasil pencarian menjadi teks konteks yang siap digunakan LLM. |
| isAnyConfigured | — | 44 | Memeriksa apakah setidaknya satu provider pencarian telah dikonfigurasi. |


### `07_Service_WebSearch_Google.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| isConfigured | — | 11 | Mengembalikan apakah provider memiliki kredensial yang diperlukan. |
| search | query | 16 | Menjalankan pencarian dengan fallback provider. |


### `07_Service_WebSearch_Tavily.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| isConfigured | — | 12 | Mengembalikan apakah provider memiliki kredensial yang diperlukan. |
| search | query | 16 | Menjalankan pencarian dengan fallback provider. |


### `08_Specialist_ChangeDetector.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| runDetection | mode | 9 | Membandingkan source saat ini dengan snapshot terakhir dan melaporkan perubahan/sinkronisasi dokumentasi. |
| runScheduledDetection | — | 53 | Titik masuk deteksi perubahan terjadwal. |
| _getCurrentFiles | — | 96 | Mengambil file source saat ini dari lingkungan/repository yang dikonfigurasi. |
| _simpleHash | str | 111 | Membuat hash string sederhana untuk deteksi perubahan. |
| _getLatestSnapshot | — | 121 | Memuat snapshot tersimpan yang paling baru. |
| _saveSnapshot | currentFiles | 138 | Menyimpan snapshot source saat ini. |
| _compareWithSnapshot | currentFiles, snapshot | 159 | Menghitung file yang ditambahkan/diubah/dihapus. |
| _buildReport | changes | 172 | Merender laporan perubahan yang mudah dibaca manusia. |
| _checkDocSync | changes | 193 | Mendeteksi celah sinkronisasi dokumentasi. |


### `08_Specialist_Chat.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| buildSystemPersona | — | 9 | Membangun persona percakapan/instruksi sistem. |
| needsWebSearch | intent | 13 | Menentukan apakah intent memerlukan pencarian web. |
| respondWithSearchContext | userMessage, searchResults, riwayat | 17 | Menjawab menggunakan hasil pencarian ditambah riwayat percakapan. |
| _formatRiwayat | riwayat | 40 | Memformat percakapan terbaru untuk konteks prompt. |


### `08_Specialist_CodeAuditor.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| runAudit | type | 12 | Menjalankan audit code/sistem yang diminta. |
| runScheduledAudit | — | 41 | Menjalankan wrapper audit terjadwal. |
| fixIssues | scope | 56 | Menghasilkan/menerapkan kandidat perbaikan untuk temuan audit. |
| shouldOfferAudit | — | 85 | Menentukan apakah audit perlu ditawarkan. |
| _collectData | — | 99 | Mengumpulkan data source/sistem untuk audit. |
| _getSheetNames | — | 137 | Mendaftar Sheet yang tersedia. |
| _analyzeInBatches | data, categories | 151 | Menganalisis source dalam beberapa batch untuk mengendalikan ukuran prompt. |
| _splitIntoBatches | files | 177 | Membagi file menjadi batch audit. |
| _buildAuditPrompt | batch, data, categories | 198 | Membangun prompt audit untuk satu batch. |
| _parseFindings | rawText | 245 | Mengurai temuan LLM terstruktur. |
| _deduplicateFindings | findings | 262 | Menghapus temuan duplikat. |
| _filterByScope | findings, scope | 372 | Menyaring temuan berdasarkan cakupan yang diminta. |
| _generateFixes | findings | 385 | Menghasilkan usulan perbaikan dari temuan. |
| _saveReport | findings, type | 591 | Menyimpan laporan audit. |
| _saveFindings | reportId, findings | 611 | Menyimpan temuan individual. |
| _getLatestPendingFindings | — | 626 | Memuat temuan tertunda terbaru. |
| _markFindingsFixed | findings | 649 | Menandai temuan sebagai telah diperbaiki. |
| _getLastAuditDate | — | 667 | Membaca timestamp audit terakhir. |


### `08_Specialist_FeatureArchitect.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| generateBlueprint | idea | 21 | Menghasilkan blueprint fitur/implementasi terstruktur. |
| implementBlueprint | idea | 104 | Mengimplementasikan blueprint dengan menghasilkan file code. |
| _generateAllCode | blueprint, context, idea | 255 | Menghasilkan semua file yang dijelaskan oleh blueprint. |
| _generateSingleFile | fileSpec, blueprint, context, idea | 305 | Menghasilkan implementasi satu file. |
| _gatherProjectContext | — | 352 | Mengumpulkan konteks arsitektur/source/dokumentasi untuk pembuatan fitur. |
| _saveBlueprint | blueprint, idea | 375 | Menyimpan blueprint. |
| _getLatestBlueprint | — | 393 | Memuat blueprint terbaru. |
| _formatBlueprintForChat | bp | 409 | Merender blueprint untuk respons yang ditampilkan kepada pengguna. |


### `08_Specialist_Finance.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| resolveWallet | namaWallet | 22 | Menyelesaikan referensi wallet menjadi ID/object wallet. |
| getSaldoWallet | walletId | 35 | Menghitung saldo wallet. |
| getAllSaldoAsText | — | 50 | Merender seluruh saldo wallet. |
| recordTransaction | data | 68 | Menyimpan transaksi keuangan dan menjalankan pemeriksaan peringatan budget. |
| editLastTransaction | updatedFields | 95 | Mengubah transaksi aktif terbaru. |
| getRingkasanPeriode | periode | 114 | Mengagregasikan status keuangan untuk suatu periode. |
| formatRingkasanAsText | ringkasan | 140 | Merender ringkasan keuangan. |
| createOrUpdateBudget | kategori, batasJumlah, periode | 161 | Membuat atau memperbarui budget kategori. |
| _checkBudgetAlert | kategori, tanggalTransaksi | 174 | Memeriksa apakah transaksi melewati kondisi budget. |
| _buildTransactionConfirmation | data, wallet, saldoTerbaru | 202 | Membangun teks konfirmasi transaksi. |
| _formatRupiah | angka | 214 | Memformat angka sebagai Rupiah Indonesia. |


### `08_Specialist_Knowledge.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| saveFact | chatId, factText, category | 11 | Menyimpan fakta ke memori jangka panjang. |
| saveManualFact | chatId, factText | 17 | Menyimpan fakta yang diberikan secara eksplisit. |
| saveAutoDetectedFacts | chatId, facts | 21 | Menyimpan fakta yang terdeteksi otomatis. |
| getActiveFactsForPrompt | limit | 30 | Mengembalikan fakta aktif dengan jumlah terbatas untuk konteks. |
| findRelevantToKeyword | keyword, limit | 34 | Mencari fakta yang relevan dengan kata kunci. |


### `08_Specialist_Memory.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getLongTermMemory | maxDays | 14 | Membangun konteks memori jangka panjang dari ringkasan. |
| summarizeToday | — | 49 | Meringkas riwayat chat hari ini dan menyimpan hasilnya. |
| _getTodayChats | — | 108 | Memuat pesan hari ini. |
| _hasSummaryForToday | — | 145 | Mendeteksi apakah hari ini sudah memiliki ringkasan. |
| _saveSummary | summary, topics, messageCount | 167 | Menyimpan metadata dan isi ringkasan. |


### `08_Specialist_ProjectBrain.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| buildRoadmapFromDiscussion | userInput | 23 | Membuat item roadmap dari suatu diskusi. |
| syncRoadmapWithCode | — | 107 | Menyelaraskan status roadmap dengan code saat ini. |
| adaptRoadmapForNewIdea | idea | 201 | Mengadaptasi roadmap terhadap ide baru yang diajukan. |
| answerQuestion | question | 296 | Menjawab pertanyaan tentang status roadmap/proyek. |
| _readDoc | fileName | 325 | Membaca dokumen dokumentasi dari repository/penyimpanan. |
| _readItems | — | 330 | Membaca item roadmap. |
| _addItem | feature, category, priority, status, notes | 350 | Menambahkan item roadmap. |
| _updateItemStatus | feature, newStatus | 364 | Mengubah status item roadmap. |
| _syncItemsToSheet | items | 382 | Menyimpan item roadmap ke sheet penyimpanan. |
| _updateRoadmapContent | changesDescription | 408 | Menulis perubahan roadmap/dokumentasi. |


### `08_Specialist_Reminder.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getMenungguRespon | — | 12 | Mencari reminder yang menunggu acknowledgement dalam jendela waktu tertentu. |
| listActiveAsText | — | 16 | Lihat implementasi pada source. |
| getAckPatternsForPrompt | limit | 20 | Lihat implementasi pada source. |
| create | reminderData | 24 | Menyimpan entity baru secara persisten. |
| acknowledge | pesanUserAsli, ackIntent, remindersMenunggu | 44 | Memproses acknowledgement pengguna terhadap reminder yang tertunda. |
| getReminderDueNow | — | 57 | Lihat implementasi pada source. |
| buildNotificationText | reminder | 62 | Membangun teks notifikasi reminder. |
| markAsNotified | reminder | 72 | Mencatat notifikasi reminder. |
| _isDueNow | reminder, now | 79 | Memeriksa kelayakan berdasarkan jendela jatuh tempo. |
| _buildRelevantFactContext | reminder | 90 | Melampirkan fakta yang relevan ke konteks reminder. |
| _buildConfirmationText | data | 96 | Membangun konfirmasi reminder. |
| _handleDone | pesanUserAsli, intent, target | 105 | Menangani acknowledgement reminder yang selesai. |
| _handleSnooze | pesanUserAsli, intent, target | 122 | Menangani acknowledgement snooze. |


### `08_Specialist_SelfAwareness.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| review | focus | 22 | Menjalankan self-review. |
| deepDive | dimension | 37 | Menjalankan review terfokus untuk satu dimensi. |
| _fullReview | data | 48 | Melakukan analisis self-review penuh. |
| _focusedReview | data, dimension | 125 | Melakukan self-review khusus suatu dimensi. |
| _formatFullReview | r | 204 | Memformat hasil review. |
| _gatherSelfData | — | 260 | Mengumpulkan data status/kapabilitas sistem. |
| _saveReview | result | 359 | Menyimpan review. |


### `08_Specialist_SelfHealing.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getLevel | — | 8 | Membaca level self-healing yang dikonfigurasi. |
| diagnose | keluhanUser | 18 | Mendiagnosis masalah yang dilaporkan dan mengusulkan jalur perbaikan. |
| updateDocumentation | instruction | 56 | Menghasilkan/memperbarui dokumentasi berdasarkan instruksi. |
| applyPendingPatch | patchId | 131 | Memvalidasi/menerapkan patch tertunda melalui alur GitHub. |
| _getRecentLogs | count | 148 | Membaca log sistem terbaru. |
| _filterErrorLogs | logs | 169 | Memilih log kesalahan yang relevan. |
| _identifySuspectFiles | errorLogs, keluhan | 180 | Mengidentifikasi file yang kemungkinan terdampak. |
| _askLLMForDiagnosis | keluhan, errorLogs, sourceMap | 208 | Meminta informasi diagnosis/patch kepada LLM. |
| _formatPatchForChat | diagnosis | 374 | Merender usulan patch untuk chat. |
| _formatDiagnosisOnly | diagnosis, errorLogs | 390 | Merender diagnosis saja. |
| _savePatch | diagnosis | 409 | Menyimpan patch yang dihasilkan. |
| _getPatchById | patchId | 428 | Memuat patch berdasarkan ID. |
| _updatePatchStatus | fileName, newStatus | 450 | Memperbarui status siklus hidup patch. |


### `08_Specialist_UserProfile.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| saveUpdates | updates | 12 | Menyimpan pembaruan profil. |
| getProfileForPrompt | maxItems | 31 | Memformat konteks profil pengguna yang dibatasi. |
| getByCategory | category | 64 | Mengembalikan nilai profil berdasarkan kategori. |
| _upsertProfile | key, value, category | 91 | Menambah atau memperbarui satu kunci profil. |


### `08_Utils_PatchValidator.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| validate | patchedCode, originalCode, fileName | 15 | Menjalankan validasi sintaks, struktur, dan pola mencurigakan pada code yang dihasilkan. |
| _checkSyntax | code | 77 | Melakukan validasi sintaks ringan. |
| _checkStructuralSanity | patched, original | 95 | Memeriksa struktur patch terhadap source asli. |
| _checkSuspiciousPatterns | code | 138 | Mendeteksi pola code yang berisiko/mencurigakan. |
| formatResult | result | 190 | Memformat hasil validator. |


### `09_CommandRouter.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| isKnownCommand | text | 10 | Mengenali perintah slash yang didukung. |
| handle | chatId, text | 20 | Menangani payload webhook. |
| _handleIngat | chatId, text | 56 | Menangani perintah pembuatan reminder. |


### `09_Manager.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| processConversationalMessage | chatId, text | 7 | Orkestrasi percakapan end-to-end. |
| _gatherContext | — | 15 | Mengumpulkan riwayat, fakta, profil, LTM, dan reminder untuk analisis intent. |
| _persistAutoFacts | chatId, intent | 26 | Menyimpan pembaruan fakta/profil yang dikembalikan analisis intent. |
| _routeIntent | chatId, text, intent, context | 33 | Mendispatch intent yang telah diurai ke handler specialist. |
| _handleAckReminder | chatId, text, intent, context | 57 | Menangani acknowledgement reminder. |
| _handleBuatReminder | intent | 63 | Membuat reminder. |
| _handleDiagnoseError | chatId, text, intent | 67 | Menjalankan diagnosis self-healing. |
| _handleUpdateDocs | chatId, text, intent | 75 | Memperbarui dokumentasi. |
| _handleAuditCode | chatId, text, intent | 83 | Menjalankan audit code. |
| _handleFixAudit | chatId, text, intent | 91 | Memperbaiki temuan audit. |
| _handleCheckChanges | chatId, text, intent | 99 | Memeriksa perubahan code. |
| _handleRoadmapQuery | chatId, text, intent | 107 | Mengueri/membangun/mengadaptasi/menyinkronkan roadmap. |
| _handleImplementFeature | chatId, text, intent | 121 | Menghasilkan/mengimplementasikan blueprint fitur. |
| _handleSelfQuery | chatId, text, intent | 129 | Menjawab kueri self-awareness. |
| _handleChatBiasa | chatId, text, intent, riwayat | 137 | Menangani chat normal. |
| _handleHeavyChat | text, intent, riwayat | 150 | Menangani chat dengan kompleksitas tinggi melalui rantai LLM lanjutan. |
| _handleChatWithWebSearch | text, intent, riwayat | 162 | Menangani chat berbasis web. |
| _handleIntentFailure | chatId, text, riwayat | 167 | Respons fallback ketika penguraian intent gagal. |


### `09_Manager_IntentAnalyzer.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| analyze | userMessage, context | 7 | Menganalisis pesan pengguna menjadi intent terstruktur. |
| _parseResponse | rawText, providerName | 17 | Mengurai/memvalidasi JSON intent mentah dari LLM. |
| _buildPrompt | userMessage, context | 31 | Membangun prompt analisis intent. |
| _personaSection | — | 49 | Menyisipkan aturan persona. |
| _riwayatSection | r | 51 | Menyisipkan percakapan terbaru. |
| _factsSection | f | 58 | Menyisipkan fakta. |
| _profileSection | p | 63 | Menyisipkan profil. |
| _ltmSection | l | 68 | Menyisipkan memori jangka panjang. |
| _reminderSection | r | 73 | Menyisipkan reminder. |
| _patternSection | p | 79 | Menyisipkan pola yang telah dipelajari. |
| _outputSchemaSection | — | 85 | Mendefinisikan skema JSON keluaran. |
| _rulesSection | — | 118 | Mendefinisikan aturan klasifikasi. |


### `10_Handler_Webhook.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| handle | e | 11 | Menangani payload webhook. |
| _isAuthorized | e, config | 48 | Memvalidasi otorisasi shared-secret webhook. |
| _isDuplicateUpdate | contents | 52 | Mencegah pemrosesan ID update Telegram yang duplikat. |
| _processMessage | chatId, text | 64 | Mengekstrak dan memproses teks pesan. |


### `11_Trigger_AuditScheduler.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| runScheduledAudit | — | 13 | Menjalankan wrapper audit terjadwal. |
| setupWeeklyTrigger | — | 28 | Membuat trigger berbasis waktu yang sesuai. |
| _deleteExistingTriggers | — | 44 | Menghapus trigger lama yang duplikat. |


### `11_Trigger_MemorySummarizer.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| setupNightlyTrigger | — | 8 | Membuat trigger peringkas memori malam hari. |
| _deleteExistingTriggers | — | 22 | Menghapus trigger lama yang duplikat. |


### `11_Trigger_ReminderChecker.gs`
| Function | Argumen | Tujuan |
| --- | --- | --- |
| cekDanKirimReminder |  | Mencari reminder yang jatuh tempo dan mengirim notifikasi. |
| setupReminderTrigger |  | Membuat trigger pemeriksa reminder setiap satu menit. |


### `11_Trigger_WeeklyChangeCheck.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| setupWeeklyTrigger | — | 8 | Membuat trigger berbasis waktu yang sesuai. |
| _deleteExistingTriggers | — | 21 | Menghapus trigger lama yang duplikat. |


### `12_Service_GitHubBackup.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| backupAllFiles | — | 15 | Mencadangkan seluruh file source proyek ke GitHub. |
| backupDocs | — | 40 | Mencadangkan catatan dokumentasi ke GitHub. |
| _loadGitHubConfig | — | 65 | Memuat konfigurasi repository/token GitHub. |
| _fetchOwnSourceFiles | — | 79 | Mengambil file source proyek Apps Script. |
| _resolveFilePath | file | 100 | Memetakan metadata file Apps Script ke path GitHub. |
| _pushFileToGitHub | config, path, content | 106 | Membuat/memperbarui satu file GitHub. |
| _getExistingFileSha | config, url | 135 | Membaca SHA blob GitHub untuk operasi pembaruan. |


### `13_Service_GitHubOps.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| _getHeaders | — | 9 | Membangun header HTTP GitHub yang terautentikasi. |
| _getRepoUrl | — | 18 | Membangun URL repository API GitHub yang dikonfigurasi. |
| readFile | path, ref | 25 | Membaca satu file repository. |
| listDirectory | path | 61 | Menampilkan isi satu direktori repository. |
| readAllSourceFiles | — | 93 | Membaca file codebase secara rekursif untuk operasi agent. |
| createBranch | branchName | 113 | Membuat branch Git. |
| createBackupBranch | suffix | 171 | Membuat branch cadangan dengan timestamp. |
| commitFile | path, content, message, branch, sha | 181 | Membuat/memperbarui commit untuk satu file. |
| createPullRequest | title, body, head, base | 224 | Membuka pull request GitHub. |
| readDocFile | fileName | 258 | Membaca satu file dokumentasi. |
| updateDocFile | fileName, newContent, commitMessage | 262 | Memperbarui dan melakukan commit pada satu file dokumentasi. |


### `99_Tests.gs`
| Function | Argumen | Tujuan |
| --- | --- | --- |
| test_Batch7b_FinanceSpecialist |  | Function global untuk entry point/test/debug. |
| debug_CheckOAuthScopes |  | Function global untuk entry point/test/debug. |
| debug_CheckGitHubConfig |  | Function global untuk entry point/test/debug. |
| test_TelegramMarkdownFallback |  | Function global untuk entry point/test/debug. |


## 4. Global entry points

| Function global | Peran |
| --- | --- |
| `doPost(e)` | Webhook entry point. |
| `runScheduledAuditWrapper()` | Global trigger wrapper → `AuditScheduler.runScheduledAudit()`. |
| `setupWeeklyTrigger()` | Global setup wrapper. |
| `runNightlySummarizerWrapper()` | Global trigger wrapper → `MemorySpecialist.summarizeToday()`. |
| `setupNightlySummarizer()` | Global setup wrapper. |
| `cekDanKirimReminder()` | Reminder trigger entry point. |
| `setupReminderTrigger()` | Creates one-minute reminder trigger. |
| `runWeeklyChangeCheckWrapper()` | Global trigger wrapper → `ChangeDetector.runScheduledDetection()`. |
| `setupWeeklyChangeCheck()` | Global setup wrapper. |
| `runFullBackup()` | Global Backup GitHub entry point. |
| `setupDailyBackupTrigger()` | Creates daily backup trigger. |
| `test_Batch7b_FinanceSpecialist()` | Manual finance test helper. |
| `debug_CheckOAuthScopes()` | Debug helper. |
| `debug_CheckGitHubConfig()` | Debug helper. |
| `test_TelegramMarkdownFallback()` | Manual Telegram formatting/fallback test. |


## 5. Prompt / schema catalog

### Intent analysis contract
`IntentAnalyzer._buildPrompt()` menyusun persona, riwayat, fakta, profil, LTM, reminder, pola acknowledgement yang dipelajari, skema keluaran, dan aturan klasifikasi. `_parseResponse()` kemudian mengurai keluaran LLM. Sifat arsitektural pentingnya adalah **intent dibuat terstruktur sebelum aksi domain dijalankan**.

### Prompt-producing subsystems
| Subsystem | Output type | Primary use |
| --- | --- | --- |
| IntentAnalyzer | Intent JSON | Routing dan mutasi konteks. |
| ChatSpecialist | Conversational response | Jawaban umum dan jawaban berbasis web. |
| CodeAuditor | Audit findings | Audit code/sistem. |
| FeatureArchitect | Blueprint + file generation | Perencanaan/implementasi fitur. |
| ProjectBrain | Roadmap/project analysis | Status proyek dan dokumentasi. |
| SelfAwareness | Keluaran self-review | Review kapabilitas/status. |
| SelfHealingSpecialist | Diagnosis / patch | Repair proposal. |
| MemorySpecialist | Daily summary | Long-term memory compression. |


### Generated code contract
`FeatureArchitect` menghasilkan implementasi tingkat file dari blueprint; `PatchValidator` memvalidasi patch yang dihasilkan secara sintaks/struktur dan terhadap pola mencurigakan. Karena itu, rantai pembuatan code harus dipahami sebagai **usulan LLM → validasi statis → jalur penerapan eksplisit**, bukan “LLM menulis code produksi yang langsung dipercaya”.

## 6. Configuration contract

Semua secret dan nilai khusus deployment dibaca melalui `Config.load()` dari Script Properties. Kunci yang ditemukan dari source:

| Property | Makna |
| --- | --- |
| TELEGRAM_BOT_TOKEN | Telegram API token. |
| MY_TELEGRAM_CHAT_ID | Target chat for automated notifications. |
| GEMINI_API_KEY | Gemini credentials. |
| GEMINI_MODEL_PRO_PREVIEW | Gemini advanced model. |
| GEMINI_MODEL_FLASH | Gemini fast model. |
| GEMINI_MODEL_FLASH_LITE | Dikonfigurasi, tetapi hanya berguna pada bagian code yang mereferensikannya. |
| GROQ_API_KEY | Groq credentials. |
| SPREADSHEET_ID | Primary datastore spreadsheet. |
| SHARED_SECRET | Webhook authorization secret. |
| GOOGLE_SEARCH_API_KEY | Google search credentials. |
| GOOGLE_SEARCH_ENGINE_ID | Google CSE ID. |
| TAVILY_API_KEY | Tavily credentials. |
| GITHUB_TOKEN | GitHub token. |
| GITHUB_REPO_OWNER | GitHub owner. |
| GITHUB_REPO_NAME | GitHub repository. |
| GITHUB_BRANCH | GitHub target branch. |
| OPENROUTER_API_KEY | OpenRouter credentials. |
| OPENROUTER_MODEL_ADVANCED | Model OpenRouter untuk tugas lanjutan; nilai default tersedia di source. |
| OPENROUTER_MODEL_FAST | Model OpenRouter untuk tugas cepat; nilai default tersedia di source. |


## 7. Implementation patterns to preserve

- Singleton-like object literals provide module namespaces.
- `Config` and `SpreadsheetGateway` cache remote objects/config for runtime efficiency.
- Lock diterapkan di `SpreadsheetGateway.appendRowSafe()` untuk melindungi operasi penambahan baris.
- `TelegramService` centralizes Markdown and fallback handling.
- Referensi provider pencarian web dibuat secara lazy untuk mengurangi masalah urutan pemuatan file Apps Script.
- Soft deletion digunakan untuk transaksi, bukan penghapusan baris.
- Logika khusus trigger dibungkus oleh function global.
- Status audit dan deteksi perubahan disimpan di Sheets.
- Operasi GitHub menggunakan akses file berbasis API, bukan Git lokal.

## 8. Important source-level inconsistencies / contracts

| Observed item | Severity | Implication |
| --- | --- | --- |
| `ProjectBrain.updateRoadmapStatus()` referenced but absent | High | Jalur implementasi fitur/proyek dapat gagal saat runtime ketika pemanggilan tersebut dijalankan. |
| `FinanceSpecialist` keterjangkauan routing tidak jelas | Medium | Code tersedia, tetapi rute intent khusus tersebut tidak terlihat jelas pada dispatch Manager saat ini. |
| `PatchValidator` hanya melakukan validasi statis | High | Lolos validasi tidak membuktikan perilaku runtime benar. |
| `DocumentationRepository` masih bergantung pada legacy | Medium | Komentar menyatakan ARCHITECTURE/PROGRESS disimpan untuk backup; strategi dokumentasi baru seharusnya mengganti ketergantungan tersebut secara eksplisit. |
| Offset WIB manual | Medium | `toWIB()` menerapkan +7 jam pada Date; dalam proyek Apps Script berzona `Asia/Jakarta`, hal ini dapat menimbulkan pergeseran ganda tergantung representasi Date dari source. |
| ChangeDetector scope | Medium | Logika detector berfokus pada file source; perubahan manifest/konfigurasi perlu diperlakukan secara eksplisit agar laporan perubahan tidak menjadi tidak lengkap. |
| Self-healing level behavior | Medium | Level yang dikonfigurasi belum membentuk model keamanan/otonomi yang benar-benar berbeda pada seluruh loop perbaikan. |


## 9. Change impact guide

| Area | Likely files | Impact note |
| --- | --- | --- |
| Change intent taxonomy | IntentAnalyzer + Manager + tests + docs | Perubahan kontrak routing berdampak luas. |
| Add a new specialist | Specialist file + Manager route + intent schema/prompt + persistence if needed + tests + docs | Harus dapat dijangkau, bukan sekadar didefinisikan. |
| Change sheet schema | Repository + all callers + setup/migration + docs | Risiko kompatibilitas data. |
| Change provider order/model | LLMProviderService + Config + tests/observability | Reliability/cost/latency behavior changes. |
| Change patch application | SelfHealingSpecialist + PatchValidator + GitHubOps + audit | High safety/rollback impact. |
| Change reminder scheduling | ReminderSpecialist + trigger + time utilities | Potential user-facing missed/duplicate notifications. |
| Change documentation mechanism | ProjectBrain + DocumentationRepository + Backup GitHub/update flows | Can affect self-management capabilities. |
| Change webhook security | WebhookHandler + deployment + secret config | Batas akses kritis. |


## 10. AI coding contract

Untuk setiap patch yang dihasilkan AI: identifikasi rantai caller; pertahankan nama object/method publik kecuali memang sedang dimigrasikan; tambahkan atau perbarui routing/skema ketika menambahkan kapabilitas; jalankan pengujian yang tersedia; periksa kolom Sheet terkait; perbarui dokumentasi terkonsolidasi; dan catat secara eksplisit setiap ketidakpastian yang belum terselesaikan di `05_ROADMAP_PROGRESS_AND_TECHNICAL_DEBT.md`.