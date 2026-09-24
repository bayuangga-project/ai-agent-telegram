# ARCHITECTURE — Rekonsiliasi Source Code Aktual

> **Status:** Source-of-truth teknis untuk snapshot repository yang diaudit pada 24 September 2026 (Asia/Jakarta).
>
> **Dasar audit:** ZIP yang diunggah pengguna, SHA-256 `39ef1a95d3d3e2dc49aa192ee8691f71282a7992994721fcc6e0ed49ca1fe173`. Tidak ada `.git` metadata di dalam ZIP; audit ini memverifikasi snapshot file yang tersedia, bukan state deployment/live GAS yang tidak ikut diunggah.
>
> **Cakupan:** 55 file `.gs`, `appsscript.json`, dan 10 Markdown awal. Total source `8,333` baris. Seluruh 55 file `.gs` lolos pemeriksaan sintaks JavaScript statis dengan `node --check`; ini **bukan** bukti bahwa semua jalur GAS runtime/API Google berjalan.

## 1. Tujuan sistem

Project adalah AI Agent berbasis Telegram + Google Apps Script dengan Spreadsheet sebagai persistence utama dan GitHub sebagai repository source/dokumentasi/knowledge backup. Sistem menggabungkan intent routing berbasis LLM, conversational chat, web search, finance, reminder, memory, soul/self-awareness, code audit, self-healing, documentation sync, roadmap/feature architect, dan GitHub operations.

Karakter utama arsitektur adalah **LLM sebagai interpreter/orchestrator yang tetap dibatasi oleh specialist deterministic**. Intent LLM menghasilkan JSON; `Manager` memetakan `tipe` ke handler specialist. Mutasi data utama seharusnya terjadi melalui repository/domain service, bukan melalui free-form text.

## 2. Stack dan boundary

- Runtime: Google Apps Script V8.
- Web app: execute as `USER_DEPLOYING`, access `ANYONE_ANONYMOUS`.
- Timezone manifest: `Asia/Jakarta`.
- Persistence: Google Spreadsheet, terutama sheet `Knowledge`, `Chat_History`, reminder, finance, audit, soul, roadmap.
- External APIs: Telegram Bot API, Gemini, Groq, OpenRouter, Google Custom Search, Tavily, GitHub Contents/Refs/Pulls API, Apps Script API.
- Configuration: Script Properties via `Config.load()`.

## 3. Layer architecture

```text
Telegram Webhook / Time Triggers
        |
        v
10_Handler_Webhook / 11_Trigger_*
        |
        v
CommandRouter (explicit slash fast-path)
        |
        v
Manager
  |-- IntentAnalyzer -> LLMProviderService -> LLMIntelligence ranking
  |-- Context: ChatHistory + Facts + Profile + LTM + Reminders + AckPatterns
  |-- Specialist routing
        |
        +--> Chat / WebSearch
        +--> Finance
        +--> Reminder
        +--> Memory / Knowledge / Soul
        +--> Audit / ChangeDetector / SelfHealing
        +--> DocSync / SyncOrchestrator / KnowledgeSync
        +--> ProjectBrain / FeatureArchitect
        +--> GitHubBackup / GitHubOps
        |
        v
Repositories + Google Sheets + GitHub
```

### Aturan dependency praktis

1. `Manager` adalah orchestrator utama percakapan.
2. `Repository_*` adalah boundary data Spreadsheet yang paling mudah diuji secara unit/E2E.
3. `Service_*` menangani external API/protocol.
4. `Specialist_*` berisi domain use-case atau intelligence.
5. `Trigger_*` hanya entrypoint terjadwal/wrapper.
6. `99_*` adalah test/debug; jangan dianggap production domain API.

## 4. Manifest dan konfigurasi

`src/appsscript.json` menetapkan:

```json
{
  "timeZone": "Asia/Jakarta",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
```

OAuth scopes yang dideklarasikan:

- spreadsheets
- script.external_request
- script.scriptapp
- script.projects.readonly
- drive.readonly

Script Properties yang dibaca oleh `Config.load()`:

`TELEGRAM_BOT_TOKEN, MY_TELEGRAM_CHAT_ID, GEMINI_API_KEY, GROQ_API_KEY, SPREADSHEET_ID, SHARED_SECRET, GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID, TAVILY_API_KEY, GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_BRANCH, OPENROUTER_API_KEY, CF_ACCOUNT_ID, CF_API_TOKEN, TOGETHER_API_KEY, HF_API_TOKEN`.

**Catatan:** `OPENROUTER_MODEL_FAST` tidak dibaca oleh `Config.load()`, padahal adapter OpenRouter dapat merujuk `config.openrouterModelFast`. Ini adalah konfigurasi yang belum konsisten.

## 5. Data model / Spreadsheet

| Sheet | Peran / schema utama |
|---|---|
| `Chat_History` | `id, timestamp, chatid, role, text` |
| `Memory_Facts` | `id, timestamp, chatid, category, fact, status` |
| `User_Profile` | `key, value, category, confidence, lastUpdated` |
| `Memory_Summaries` | `id, date, summary, topics, messageCount` |
| `Reminder_RawData` | `ID,TIMESTAMP,DESKRIPSI,WAKTU,STATUS,PRIORITAS,TERAKHIR_DIINGATKAN,CATATAN,JENIS_RECURRING,RECURRING_CONFIG,JUMLAH_DIINGATKAN` |
| `Reminder_AckPatterns` | `id,timestamp,pesanUser,interpretasi,aksi` |
| `Finance_Wallets` | `id,nama,saldoAwal,createdAt` |
| `Finance_Transactions` | `id,timestamp,walletId,tanggalTransaksi,tipe,kategori,jumlah,deskripsi,status` |
| `Finance_Budgets` | `id,kategori,batasJumlah,periode,createdAt` |
| `Log_System` | `timestamp,jenisEvent,detail,status` |
| `Knowledge` | `id,namespace,key,content,version,active,updated_at,notes` |
| `Documentation` | `fileName,content` |
| `SelfHeal_Patches` | `id,timestamp,fileName,diagnosis,patchedCode,status` |
| `Audit_Reports` | Report hasil audit kode |
| `Audit_Findings` | Findings audit + status |
| `Code_Snapshots` | Snapshot/hashes source untuk ChangeDetector |
| `Roadmap_Items` | Item roadmap yang disinkronkan ProjectBrain |
| `Self_Reviews` | Hasil self review |
| `Soul_Episodic_Memory` | Episode memory soul |
| `Soul_Meta_Memory` | Meta insight soul |
| `Soul_User_Patterns` | Pola user terkait soul |
| `AI_Knowledge` | Disebut dalam provisioning SyncOrchestrator; perlu diverifikasi apakah masih dipakai sebagai store aktual selain `Knowledge`. |


`SyncOrchestrator._ensureSheets()` hanya memanggil `ensureSheet(name, null)` untuk sheet yang belum ada. Karena banyak repository menganggap baris 1 sebagai header, pembuatan sheet baru tanpa header perlu dianggap **risiko struktur data** sampai ada inisialisasi header yang eksplisit.

## 6. Alur end-to-end utama

### 6.1 Incoming Telegram message

`doPost(e)` -> `WebhookHandler.handle(e)` -> validasi `secret` -> validasi `MY_TELEGRAM_CHAT_ID` -> dedup `update_id` -> baca `contents.message.text` -> placeholder Telegram -> `Manager.processConversationalMessage()` -> `TelegramService.editMessage()`.

`WebhookHandler` hanya menangani payload dengan `contents.message` dan `message.text`; tidak terlihat handler untuk `edited_message`, callback query, channel post, atau message non-text.

### 6.2 Conversational routing

`Manager.processConversationalMessage()` mengumpulkan:

- sekitar 15 histori terakhir;
- sampai 50 active facts;
- sampai 30 profile entries;
- LTM hingga 7 hari;
- reminder yang menunggu respon;
- sampai 10 acknowledgment patterns.

Context tersebut diteruskan ke `IntentAnalyzer.analyze()`. Hasil intent dipersist/dirouting lalu satu handler dipanggil.

### 6.3 LLM routing

`LLMProviderService.generate()` mengambil ranked model berdasarkan `taskType`. `LLMIntelligence.getRankedModelsForTask()` mengembalikan matrix task atau fallback `chat_light`.

Matrix yang dibangun `rankModels()` saat ini hanya memiliki:

`chat_light`, `chat_heavy`, `intent_analysis`, `code_analysis`, `code_generation`, `documentation`, `web_grounded`.

Dengan demikian taskType seperti `finance_response`, `docsync_analysis`, `benchmark_probe`, dan `fast` jatuh ke fallback `chat_light` kecuali ada perilaku lain dari knowledge yang mengintervensi. Ini adalah **fallback by design**, bukan bucket ranking terpisah.

Urutan provider aktual di `generate()`:

1. OpenRouter — hanya kandidat model yang id-nya mengandung `:free`, dengan circuit-breaker pada 429.
2. Gemini jika API key tersedia.
3. Groq jika API key tersedia.
4. `null` jika semua gagal.

### 6.4 Finance

Intent yang di-route langsung:

`catat_keuangan`, `tanya_saldo`, `ringkasan_keuangan`, `atur_budget`, `edit_transaksi`.

Finance memakai wallet berdasarkan nama (case-insensitive), dapat membuat wallet otomatis bila belum ada, menghitung saldo dari saldo awal + income - expense, dan memberikan alert budget pada ambang 80%/100%.

### 6.5 Reminder

Reminder memakai status `Aktif`/`Done`, recurring `none/daily/weekly/monthly`, due-now checker, acknowledgment, snooze, dan notifikasi Telegram. Trigger `cekDanKirimReminder` berjalan setiap menit dengan `ScriptLock`.

### 6.6 Memory

`MemorySpecialist` memisahkan STM (raw chat di `Chat_History`) dan LTM (summary harian di `Memory_Summaries`). Namun jalur aktual mengandung referensi method yang tidak tersedia:

`DateTimeUtils.formatTanggal(...)` dipanggil di `getLongTermMemory`, `_getTodayChats`, `_hasSummaryForToday`, `_saveSummary`, tetapi `02_Utils.gs` hanya menyediakan `formatWaktu`, `formatUntukPrompt`, `formatPeriode`.

Ini adalah **bug runtime yang terkonfirmasi secara source-level**. Karena `summarizeToday()` dipanggil nightly trigger, fitur LTM tidak dapat dianggap sehat sampai helper tanggal ditambahkan atau call site diperbaiki.

### 6.7 Documentation sync

`DocSyncSpecialist.sync()`:

1. membaca `docsync:canonical_files` dari Knowledge;
2. mengambil source melalui `GitHubOpsService.readAllSourceFiles()`;
3. membangun metadata file/LOC/method;
4. mengambil current canonical docs;
5. meminta LLM menganalisis delta;
6. commit update hanya bila file dianggap canonical.

Implementasi `_collectSourceMetadata()` **sudah benar** terhadap return type saat ini: `readAllSourceFiles()` mengembalikan object map, sehingga `Object.keys(files)` memang tepat. Ini menyelesaikan ketidaksesuaian yang tercatat di dokumen lama.

Tetapi canonical list pada knowledge lama masih menunjuk 5 file legacy dan `SelfHealingSpecialist.updateDocumentation()` juga hardcode daftar legacy. Keduanya wajib dimigrasikan ke target 5 file baru.

### 6.8 GitHub operations

`GitHubOpsService.readAllSourceFiles()` hanya membaca file `.gs` di folder `src`; `appsscript.json` tidak ikut. Branch/commit/PR menggunakan GitHub REST API dan `GITHUB_BRANCH` (default `main`). `FeatureArchitect` membuat backup branch sebelum feature branch/commit/PR.

### 6.9 Audit & change detection

`CodeAuditor` mengambil source, membagi batch, menganalisis via LLM, menyimpan `Audit_Reports`/`Audit_Findings`, dan dapat membuat/menerapkan fix. `PatchValidator` hanya memeriksa sintaks/struktur/pola mencurigakan; bukan sandbox.

`ChangeDetector` menyimpan snapshot hash source .gs dan membandingkan dengan snapshot terakhir; manifest tidak ikut snapshot. `ProjectBrain.syncRoadmapWithCode()` dipakai untuk alignment roadmap.

## 7. Scheduler matrix

| Trigger | Handler | Schedule | Runtime path | Catatan audit |
|---|---|---|---|---|
| Audit | `runScheduledAuditWrapper` | Senin 07:00 | `AuditScheduler` -> `CodeAuditor.runScheduledAudit()` | Full audit hanya ketika logic melihat tanggal 1; tidak ada trigger tanggal 1 terpisah. |
| LLM intelligence | `runDailyLLMDiscovery` | Harian sekitar 03:00 | `LLMIntelligence.runFullPipeline()` | Pipeline discovery -> benchmark -> rank; `adaptiveReRank()` tidak dipanggil scheduler. |
| Memory | `runNightlySummarizerWrapper` | Harian sekitar 23:30 | `MemorySpecialist.summarizeToday()` | Saat ini jalur gagal/skip karena referensi `formatTanggal` undefined. |
| Reminder | `cekDanKirimReminder` | Setiap menit | `ReminderSpecialist.getReminderDueNow()` -> Telegram send -> mark notified | Lock 2 detik. |
| Sync | `runDailyAutoSync` | Harian sekitar 04:00 | `SyncOrchestrator.executeSync('auto')` | Pull knowledge + backup knowledge + DocSync + ensure sheets. |
| Change check | `runWeeklyChangeCheckWrapper` | Minggu 20:00 | `ChangeDetector.runScheduledDetection()` | Snapshot source .gs; manifest tidak ikut. |
| Backup | `setupDailyBackupTrigger` | Didefinisikan oleh setup | `runFullBackup()` | Entry point backup source/docs. |


## 8. Complete source file inventory

| File | LOC | Objects | Public/global/method declarations |
|---|---:|---|---|
| `00_Config.gs` | 47 | Config | load(), clearCache(), reload() |
| `01_SpreadsheetGateway.gs` | 52 | SpreadsheetGateway | getSpreadsheet(), getSheet(sheetName), appendRowSafe(sheetName, rowData), ensureSheet(sheetName, headers) |
| `02_Utils.gs` | 42 | IdGenerator, DateTimeUtils | generate(prefix), toWIB(date), nowWIB(), formatWaktu(date), formatUntukPrompt(date), formatPeriode(date) |
| `03_AppLogger.gs` | 23 | AppLogger | write(jenisEvent, detail, status), info(jenisEvent, detail), warning(jenisEvent, detail), error(jenisEvent, detail) |
| `04_Repository_Budget.gs` | 58 | BudgetRepository | create(kategori, batasJumlah, periode), getAll(), _normalizePeriode(value), findByKategoriAndPeriode(kategori, periode), getByPeriode(periode), updateBatasJumlah(rowIndex, batasJumlahBaru) |
| `04_Repository_ChatHistory.gs` | 26 | ChatHistoryRepository | getRecent(limit), save(chatId, role, text) |
| `04_Repository_Documentation.gs` | 23 | DocumentationRepository | getAll() |
| `04_Repository_Facts.gs` | 31 | FactsRepository | save(chatId, factText, category), getActive(maxFacts) |
| `04_Repository_Knowledge.gs` | 100 | KnowledgeRepository, result | _getSheet(), _getAllRows(), get(namespace, key), getByNamespace(namespace), getAll(), save(namespace, key, content, notes), deactivate(namespace, key) |
| `04_Repository_Reminder.gs` | 127 | ReminderRepository, AckPatternsRepository | create(data), _mapRow(row, rowIndex), getAll(), getActive(), getMenungguRespon(batasMenit), updateStatus(rowIndex, status), updateTerakhirDiingatkan(rowIndex, jumlahBaru), updateWaktu(rowIndex, waktuBaru), hitungWaktuBerikutnya(reminder), formatDaftarAktifSebagaiTeks(), save(pesanUser, interpretasi, aksi), getRecent(limit) |
| `04_Repository_Transaction.gs` | 97 | TransactionRepository | create(data), _mapRow(row, rowIndex), getAll(), getActive(), getLastActive(), findById(id), getByWallet(walletId), getByKategoriAndPeriode(kategori, tahunBulan), softDelete(rowIndex), update(rowIndex, updatedFields) |
| `04_Repository_Wallet.gs` | 44 | WalletRepository | create(nama, saldoAwal), getAll(), findByName(nama), findById(id), exists(nama) |
| `05_Service_Telegram.gs` | 115 | TelegramService, payload, options, payload, options | pickPlaceholder(), sendMessage(chatId, text), editMessage(chatId, messageId, text) |
| `06_Service_LLMProvider.gs` | 118 | LLMProviderService | call(sys, msgs, temp, model), call(sys, msgs, temp, model), call(sys, msgs, temp), generate(params), generateFromSinglePrompt(promptText, temperature, taskType), _recordStatSafe(taskType, modelId, success, latency) |
| `06_Service_LLM_Gemini.gs` | 136 | GeminiProvider, payload | _discoverActiveModel(), call(systemInstruction, messages, temperature, modelName) |
| `06_Service_LLM_Groq.gs` | 61 | GroqProvider, payload, options | call(systemInstruction, messages, temperature) |
| `06_Service_LLM_OpenRouter.gs` | 82 | OpenRouterProvider, payload, options | call(systemInstruction, messages, temperature, modelName) |
| `07_Service_WebSearchProvider.gs` | 47 | WebSearchProviderService | getProviders(), search(query), formatResultsAsContext(results), isAnyConfigured() |
| `07_Service_WebSearch_Google.gs` | 48 | GoogleSearchProvider, options | isConfigured(), search(query) |
| `07_Service_WebSearch_Tavily.gs` | 55 | TavilySearchProvider, payload, options | isConfigured(), search(query) |
| `08_Specialist_ChangeDetector.gs` | 206 | ChangeDetector, result, snapshot | runDetection(mode), runScheduledDetection(), _getCurrentFiles(), _simpleHash(str), _getLatestSnapshot(), _saveSnapshot(currentFiles), _compareWithSnapshot(currentFiles, snapshot), _buildReport(changes), _checkDocSync(changes) |
| `08_Specialist_Chat.gs` | 92 | ChatSpecialist, variables | buildSystemPersona(), needsWebSearch(intent), respondWithSearchContext(userMessage, searchResults, riwayat), _formatRiwayat(riwayat) |
| `08_Specialist_CodeAuditor.gs` | 528 | CodeAuditor, seen, filesToRead, sourceMap | runAudit(type), runScheduledAudit(), fixIssues(scope), shouldOfferAudit(), _collectData(), _getSheetNames(), _analyzeInBatches(data, categories), _splitIntoBatches(files), _buildAuditPrompt(batch, data, categories), _parseFindings(rawText), _deduplicateFindings(findings), _filterByScope(findings, scope), _generateFixes(findings), _applyFixes(fixes, scope), _saveReport(findings, type), _saveFindings(reportId, findings), _getLatestPendingFindings(), _markFindingsFixed(findings), _getLastAuditDate() |
| `08_Specialist_DocSync.gs` | 181 | DocSyncSpecialist, docs | sync(), _getCanonicalFiles(), _isCanonical(fileName, canonicalFiles), _collectSourceMetadata(), _extractMethodSignatures(content), _collectCurrentDocs(canonicalFiles), _analyzeWithLLM(sourceMetadata, currentDocs, canonicalFiles), _commitDocUpdate(fileName, content, reason) |
| `08_Specialist_FeatureArchitect.gs` | 308 | FeatureArchitect | generateBlueprint(idea), implementBlueprint(idea), _generateAllCode(blueprint, context, idea), _generateSingleFile(fileSpec, blueprint, context, idea), _gatherProjectContext(), _saveBlueprint(blueprint, idea), _getLatestBlueprint() |
| `08_Specialist_Finance.gs` | 195 | FinanceSpecialist, perKategori | resolveWallet(namaWallet), getSaldoWallet(walletId), getAllSaldo(), recordTransaction(data), editLastTransaction(updatedFields), getRingkasanPeriode(periode), createOrUpdateBudget(kategori, batasJumlah, periode), _checkBudgetAlert(kategori, tanggalTransaksi) |
| `08_Specialist_Knowledge.gs` | 39 | KnowledgeSpecialist | saveFact(chatId, factText, category), saveManualFact(chatId, factText), saveAutoDetectedFacts(chatId, facts), getActiveFactsForPrompt(limit), findRelevantToKeyword(keyword, limit) |
| `08_Specialist_KnowledgeSync.gs` | 98 | KnowledgeSyncSpecialist, grouped | sync(), bootstrap(), _pullFromGitHub(), pushSheetToGitHub() |
| `08_Specialist_LLMIntelligence.gs` | 319 | LLMIntelligence, matrix, counters | discoverAndBenchmark(), runFullPipeline(), discoverModels(), benchmarkBatch(), rankModels(), _testSingleModel(modelId, promptText, patCalc, patLogic), _loadCandidateIds(), _loadExistingResults(), _saveResults(results), getRankedModelsForTask(taskType), recordStat(taskType, modelId, success, latencyMs), adaptiveReRank() |
| `08_Specialist_Memory.gs` | 178 | MemorySpecialist | getLongTermMemory(maxDays), summarizeToday(), _getTodayChats(), _hasSummaryForToday(), _saveSummary(summary, topics, messageCount) |
| `08_Specialist_ProjectBrain.gs` | 315 | ProjectBrain | buildRoadmapFromDiscussion(userInput), syncRoadmapWithCode(), adaptRoadmapForNewIdea(idea), answerQuestion(question), updateRoadmapStatus(feature, status), _readDoc(fileName), _readItems(), _addItem(feature, category, priority, status, notes), _updateItemStatus(feature, newStatus), _syncItemsToSheet(items), _updateRoadmapContent(changesDescription) |
| `08_Specialist_Reminder.gs` | 146 | ReminderSpecialist | getMenungguRespon(), getReminderDueNow(), listActiveAsText(), getAckPatternsForPrompt(limit), create(reminderData), acknowledge(pesanUserAsli, ackIntent, remindersMenunggu), getRemindersDueNow(), buildNotificationText(reminder), markAsNotified(reminder), _isDueNow(reminder, now), _buildRelevantFactContext(reminder), _buildConfirmationText(data), _handleDone(pesanUserAsli, intent, target), _handleSnooze(pesanUserAsli, intent, target) |
| `08_Specialist_SelfAwareness.gs` | 131 | SelfAwareness, data | review(focus), _gatherSelfData() |
| `08_Specialist_SelfHealing.gs` | 391 | SelfHealingSpecialist, sourceMap, currentDocs, suspectSet, mapping | getLevel(), diagnose(keluhanUser), updateDocumentation(instruction), applyPendingPatch(patchId), _getRecentLogs(count), _filterErrorLogs(logs), _identifySuspectFiles(errorLogs, keluhan), _askLLMForDiagnosis(keluhan, errorLogs, sourceMap), _applyToGitHub(diagnosis), _savePatch(diagnosis), _getPatchById(patchId), _updatePatchStatus(fileName, newStatus) |
| `08_Specialist_Soul.gs` | 357 | SoulSpecialist, merged, merged, merged, report, allMethodDefs, allMethodCalls, allModuleRefs, fileReport, definedModules | initializeSelf(), _patchIntentSchema(), getSelfModel(), updateSelfModel(data), getIdentity(), updateIdentity(data), getBeliefs(), addBelief(belief), getGrowthLog(), addGrowthEntry(event, detail), getEmotionalState(), updateEmotionalState(data), getFullContext(), runFullCodeAudit() |
| `08_Specialist_SoulMemory.gs` | 105 | SoulMemory | _ensureSheets(), recordEpisode(eventType, context, outcome, emotionalState, details), getRecentEpisodes(limit), getEpisodesByType(eventType, limit), addMetaInsight(insight, source, confidence), getMetaInsights(limit) |
| `08_Specialist_SyncOrchestrator.gs` | 191 | SyncOrchestrator, results | assessState(), executeSync(scope), autoDocument(changeDescription), _assessKnowledge(), _assessDocumentation(), _assessSheetStructure(), _getLastSyncTimestamp(), _saveSyncTimestamp(), _pullKnowledge(), _backupKnowledge(), _syncDocumentation(), _ensureSheets() |
| `08_Specialist_UserProfile.gs` | 120 | UserProfileSpecialist | saveUpdates(updates), getProfileForPrompt(maxItems), getByCategory(category), _upsertProfile(key, value, category) |
| `08_Utils_PatchValidator.gs` | 208 | PatchValidator, result, X | validate(patchedCode, originalCode, fileName), _checkSyntax(code), _checkStructuralSanity(patched, original), _checkSuspiciousPatterns(code), formatResult(result) |
| `08_Utils_TemplateEngine.gs` | 8 | TemplateEngine | render(template, variables) |
| `09_CommandRouter.gs` | 44 | CommandRouter, intent | isKnownCommand(text), handle(chatId, text), _handleIngat(chatId, args) |
| `09_Manager.gs` | 476 | Manager, payload, fields | processConversationalMessage(chatId, text), _gatherContext(), _persistAutoFacts(chatId, intent), _routeIntent(chatId, text, intent, context), _askLLMWithKnowledge(chatId, userText, namespace, key, rawData), _handleCatatKeuangan(chatId, text, intent), _handleTanyaSaldo(chatId, text, intent), _handleRingkasanKeuangan(chatId, text, intent), _handleAturBudget(chatId, text, intent), _handleEditTransaksi(chatId, text, intent), _handleSyncDocumentation(chatId, text, intent), _handleBackupKnowledge(chatId, text), _handleRestoreKnowledge(chatId, text), _handleSoulInit(chatId, text), _handleSoulQuery(chatId, text, intent), _handleSoulMemoryQuery(chatId, text, intent), _handleAckReminder(chatId, text, intent, context), _handleBuatReminder(intent), _handleDiagnoseError(chatId, text, intent), _handleUpdateDocs(chatId, text, intent), _handleAuditCode(chatId, text, intent), _handleFixAudit(chatId, text, intent), _handleCheckChanges(chatId, text, intent), _handleRoadmapQuery(chatId, text, intent), _handleImplementFeature(chatId, text, intent), _handleSelfQuery(chatId, text, intent), _handleChatBiasa(chatId, text, intent, riwayat), _handleHeavyChat(text, intent, riwayat), _handleChatWithWebSearch(text, intent, riwayat), _handleIntentFailure(chatId, text, riwayat) |
| `09_Manager_IntentAnalyzer.gs` | 90 | IntentAnalyzer, variables | analyze(userMessage, context), _parseResponse(rawText, providerName), _buildPrompt(userMessage, context), _formatRiwayat(r), _formatList(arr), _formatReminder(r), _formatPola(p) |
| `10_Handler_Webhook.gs` | 79 | WebhookHandler | handle(e), _isAuthorized(e, config), _isDuplicateUpdate(contents), _processMessage(chatId, text), doPost(e) |
| `11_Trigger_AuditScheduler.gs` | 64 | AuditScheduler | runScheduledAudit(), setupWeeklyTrigger(), _deleteExistingTriggers(), runScheduledAuditWrapper(), setupWeeklyTrigger() |
| `11_Trigger_LLMIntelligence.gs` | 25 | - | runDailyLLMDiscovery(), setupDailyLLMDiscovery() |
| `11_Trigger_MemorySummarizer.gs` | 38 | MemorySummarizerTrigger | setupNightlyTrigger(), _deleteExistingTriggers(), runNightlySummarizerWrapper(), setupNightlySummarizer() |
| `11_Trigger_ReminderChecker.gs` | 51 | - | cekDanKirimReminder(), setupReminderTrigger() |
| `11_Trigger_ScheduledSync.gs` | 29 | - | runDailyAutoSync(), setupDailyAutoSyncTrigger() |
| `11_Trigger_WeeklyChangeCheck.gs` | 37 | WeeklyChangeCheckTrigger | setupWeeklyTrigger(), _deleteExistingTriggers(), runWeeklyChangeCheckWrapper(), setupWeeklyChangeCheck() |
| `12_Service_GitHubBackup.gs` | 186 | GitHubBackupService, config, payload | backupAllFiles(), backupDocs(), _loadGitHubConfig(), _fetchOwnSourceFiles(), _resolveFilePath(file), _pushFileToGitHub(config, path, content), _getExistingFileSha(config, url), runFullBackup(), setupDailyBackupTrigger() |
| `13_Service_GitHubOps.gs` | 297 | GitHubOpsService, result, payload | _getHeaders(), _getRepoUrl(), readFile(path, ref), listDirectory(path), readAllSourceFiles(), createBranch(branchName), createBackupBranch(suffix), commitFile(path, content, message, branch, sha), createPullRequest(title, body, head, base), readDocFile(fileName), updateDocFile(fileName, newContent, commitMessage) |
| `99_TestSuite_Full.gs` | 922 | cleaned | _tLog(batch, name, status, detail, ms), _cleanupTestData(), test_Batch1_RepositoryCRUD(), test_Batch2_IntentDetection(), test_Batch3_LLMRouting(), test_Batch4_FinanceE2E(), test_Batch5_MemoryContext(), test_Batch6_Integration() |
| `99_Tests.gs` | 439 | headers, cleaned, matrix, functionMap | test_Batch7b_FinanceSpecialist(), debug_CheckOAuthScopes(), debug_CheckGitHubConfig(), test_TelegramMarkdownFallback(), debug_TimezoneAudit(), triggerKnowledgeSync(), triggerManualDiscoveryAndBenchmark(), test_Stage1_Discover(), test_Stage2_BenchmarkBatch(), test_Stage3_Rank(), test_CheckGitHubRateLimitAndAuth(), fix_CleanBenchmarkData(), resetAndCleanSystemCounters(), forceSyncKnowledgeFromGitHub(), test_DocSync_CollectSourceMetadata(), test_DetectDuplicateGlobalFunctions(), debug_DumpIntentKnowledge() |
| `Rollback.gs` | 108 | options, headers | rollbackFromGitHub(), _getRollbackFilesFromGitHub(config) |

## 9. Critical method contracts

- **`Config.load`** — Baca Script Properties; hasil di-cache. Default githubBranch=main. Tidak memuat OPENROUTER_MODEL_FAST walaupun adapter OpenRouter dapat merujuk config.openrouterModelFast.
- **`DateTimeUtils.toWIB`** — Tidak menambahkan offset +7 secara manual; bila Date sudah berupa Date dikembalikan apa adanya. Normalisasi hanya mempertahankan semantik object Date/parse string.
- **`DateTimeUtils.formatTanggal`** — Tidak ada di source, tetapi dipanggil oleh MemorySpecialist.getLongTermMemory/_getTodayChats/_hasSummaryForToday/_saveSummary.
- **`LLMProviderService.generate`** — taskType menjadi kunci ranking. Jika taskType tidak ada di matrix, getRankedModelsForTask fallback ke chat_light. Karena itu finance_response, docsync_analysis, benchmark_probe tidak punya bucket khusus di rankModels().
- **`MemorySpecialist.summarizeToday`** — Menggunakan taskType fast; matrix tidak punya key fast sehingga fallback ke chat_light setelah generateFromSinglePrompt.
- **`DocSyncSpecialist._collectSourceMetadata`** — Sudah benar memakai Object.keys(files) terhadap object map dari GitHubOpsService.readAllSourceFiles(); klaim mismatch lama sudah resolved di source.
- **`SelfHealingSpecialist.updateDocumentation`** — Hardcode 5 dokumen legacy, sehingga setelah migrasi canonical docs harus diubah agar update otomatis mengarah ke 5 file baru.
- **`CommandRouter.COMMANDS`** — Tidak berisi sync/reminder; dokumentasi lama yang menyatakan /sync atau /reminder sebagai command eksplisit tidak cocok dengan router aktual.
- **`Finance test batch 7b`** — Memanggil FinanceSpecialist.getAllSaldoAsText() dan formatRingkasanAsText(), dua method tidak ada. Test tersebut stale terhadap API FinanceSpecialist saat ini.
- **`SyncOrchestrator._assessDocumentation`** — Menganggap return GitHubOpsService.readAllSourceFiles() memiliki .length, padahal return adalah object map; source_files menjadi undefined.
- **`SyncOrchestrator._ensureSheets`** — ensureSheet(requiredSheet, null) membuat sheet tanpa header; repository umumnya menganggap row 1 adalah header, sehingga sheet baru kosong berpotensi membuat row pertama data yang ditulis terlewati/terbaca salah.
- **`AuditScheduler`** — Komentar/source menyebut Senin + tanggal 1; implementasi hanya membuat trigger Senin 07:00, sedangkan tanggal 1 diperiksa di CodeAuditor.runScheduledAudit. Akibatnya full audit bulanan hanya terjadi bila tanggal 1 jatuh Senin.
- **`ChangeDetector._getCurrentFiles`** — Membaca source .gs saja melalui readAllSourceFiles; manifest appsscript.json tidak ikut snapshot/hash.
- **`FeatureArchitect._gatherProjectContext / SelfAwareness`** — Keduanya masih memiliki daftar command yang menyebut /sync yang tidak tersedia pada CommandRouter.

## 10. Current intent types

Schema intent yang dipakai sistem harus mencakup sekurang-kurangnya ``ack_reminder`, `buat_reminder`, `chat_biasa`, `catat_keuangan`, `tanya_saldo`, `ringkasan_keuangan`, `atur_budget`, `edit_transaksi`, `sync_documentation`, `diagnose_error`, `update_docs`, `audit_code`, `fix_audit`, `check_changes`, `roadmap_query`, `implement_feature`, `self_query`, `soul_query`, `soul_init`, `backup_knowledge`, `restore_knowledge`, `soul_memory_query``. `SoulSpecialist._patchIntentSchema()` juga menambahkan lima tipe soul/backup/restore bila schema belum memuatnya.

## 11. Command surface aktual

`CommandRouter.COMMANDS` aktual:

```text
diagnose, heal, logs, patch, build, ingat, soul, init-soul, backup, restore, memory
```

`/ingat` membangun intent `buat_reminder` langsung. Tidak ada `/sync` atau `/reminder` di `CommandRouter.COMMANDS`, sehingga dokumentasi yang menyatakan command tersebut sebagai fast-path aktual perlu dianggap legacy. `/patch` saat ini diarahkan ke `_handleDiagnoseError`, bukan apply-patch langsung.

## 12. Security / operational boundaries

- Secret utama berada di Script Properties, bukan hardcoded di source normal.
- Webhook memakai `SHARED_SECRET` + allowlist `MY_TELEGRAM_CHAT_ID`.
- `ANYONE_ANONYMOUS` membuat endpoint webapp publik secara transport-level, sehingga secret validation menjadi kontrol penting.
- `GitHubOpsService` mengirim token pada Authorization header; debug function `debug_CheckGitHubConfig()` hanya menampilkan 4 karakter pertama token.
- `runFullCodeAudit()` meminta OAuth token melalui `ScriptApp.getOAuthToken()` dan memanggil Apps Script API; scope `script.projects.readonly` relevan.
- `PatchValidator` bukan security sandbox; patch tetap harus melalui review/branch/PR flow.

## 13. Source-vs-documentation reconciliation summary

Dokumentasi lama mengandung beberapa stale claims utama:

| Area | Klaim lama | Implementasi aktual |
|---|---|---|
| File source | Nama `03_Service_SelfHealing.gs`, `12_Service_GitHubOps.gs`, dll. | Nama aktual seperti `08_Specialist_SelfHealing.gs`, `13_Service_GitHubOps.gs`. |
| LTM | Digambarkan tersedia penuh | Memanggil method `formatTanggal` yang tidak ada. |
| DocSync collector | Mismatch array/object | Source saat ini sudah memakai `Object.keys(files)`. |
| Roadmap | `updateRoadmapStatus` belum ada | Method sudah ada di `ProjectBrain`. |
| Finance | Disebut belum terintegrasi | 5 finance intents sudah di-route Manager. |
| Command | `/sync`, `/reminder`, `/patch apply` | Tidak tercantum sebagai command aktual pada router. |
| GitHubOps | `runFullGitHubOps()` | Tidak ada function tersebut; backup memiliki `runFullBackup()`. |
| Timezone | `toWIB` menambah +7 | Source tidak melakukan penambahan manual. |
| Canonical docs | 5 file legacy | Target konsolidasi baru adalah `ARCHITECTURE.md`, `PROGRESS.md`, `ROADMAP.md`, `AI_DEVELOPMENT_HANDOFF.md`, `ai_knowledge.md`. |

## 14. Rule of truth untuk pengembangan berikutnya

Urutan otoritas: **source code aktual > `appsscript.json` > knowledge runtime (`ai_knowledge.md`) > dokumen consolidated > arsip historis**. Bila dokumentasi bertentangan dengan source, jangan mengubah source hanya demi membuat dokumentasi tampak konsisten; tandai discrepancy lalu tentukan perubahan kode secara sengaja.
