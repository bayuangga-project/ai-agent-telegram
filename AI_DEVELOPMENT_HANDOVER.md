# AI_DEVELOPMENT_HANDOVER — Instruksi untuk AI Pengembang Berikutnya

> **Gunakan dokumen ini sebagai briefing engineering.** Jangan mulai mengedit code sebelum membaca bagian “source-of-truth”, “current defects”, dan “development protocol”.

## 0. Source-of-truth

Repository yang sedang dikembangkan adalah snapshot AI Agent Telegram berbasis Google Apps Script V8.

- Snapshot ZIP: `39ef1a95d3d3e2dc49aa192ee8691f71282a7992994721fcc6e0ed49ca1fe173`
- Tanggal audit: 24 September 2026
- Source: 55 `.gs`, 8,333 LOC
- Manifest: `src/appsscript.json`
- Syntax check snapshot: 55/55 file `.gs` lolos `node --check`
- Tidak ada `.git` metadata dalam ZIP.

**Otoritas:** source code aktual > manifest > runtime knowledge `ai_knowledge.md` > consolidated docs > legacy archive.

Jangan menganggap sesuatu ada hanya karena tertulis di dokumentasi lama. Cari symbol pada source dan verifikasi caller/callee-nya.

## 1. Tujuan sistem

AI Agent menerima pesan Telegram, memproses context (history/facts/profile/LTM/reminder/patterns), menggunakan LLM untuk intent/routing atau chat, lalu menjalankan specialist deterministic untuk finance, reminder, memory, soul, audit, self-healing, docs, roadmap, feature implementation, web search, dan GitHub operations.

Persistence utama adalah Google Spreadsheet; source/docs/knowledge backup berada di GitHub.

## 2. Contract utama

### Entry points
- `doPost(e)` -> webhook.
- `runDailyAutoSync()` -> sync harian.
- `runDailyLLMDiscovery()` -> pipeline LLM harian.
- `runNightlySummarizerWrapper()` -> memory summary.
- `cekDanKirimReminder()` -> reminder checker tiap menit.
- `runScheduledAuditWrapper()` -> audit mingguan.
- `runWeeklyChangeCheckWrapper()` -> change detection mingguan.
- `runFullBackup()` -> backup source/docs.
- `rollbackFromGitHub()` -> rollback.

### Commands aktual
`diagnose`, `heal`, `logs`, `patch`, `build`, `ingat`, `soul`, `init-soul`, `backup`, `restore`, `memory`.

Tidak ada command `/sync` atau `/reminder` pada `CommandRouter` aktual.

### Intent aktual yang harus dikenali knowledge/schema
`ack_reminder`, `buat_reminder`, `chat_biasa`, `catat_keuangan`, `tanya_saldo`, `ringkasan_keuangan`, `atur_budget`, `edit_transaksi`, `sync_documentation`, `diagnose_error`, `update_docs`, `audit_code`, `fix_audit`, `check_changes`, `roadmap_query`, `implement_feature`, `self_query`, `soul_query`, `soul_init`, `backup_knowledge`, `restore_knowledge`, `soul_memory_query`

## 3. Current critical defects — jangan lewatkan

### P0 — Memory/date formatter
`08_Specialist_Memory.gs` memanggil `DateTimeUtils.formatTanggal(...)` tetapi `02_Utils.gs` tidak mendefinisikan method itu. Ini mempengaruhi `getLongTermMemory`, `_getTodayChats`, `_hasSummaryForToday`, `_saveSummary`, dan nightly summarizer.

**Sebelum mengklaim memory sehat, perbaiki dan test jalur tersebut.**

### P1 — Finance test mismatch
`test_Batch7b_FinanceSpecialist` memanggil `FinanceSpecialist.getAllSaldoAsText()` dan `FinanceSpecialist.formatRingkasanAsText()`, yang tidak ada. Perbaiki test terhadap API aktual; jangan menambah shim hanya agar test lama hijau tanpa kebutuhan source.

### P1 — Sync assessment type mismatch
`GitHubOpsService.readAllSourceFiles()` -> object map. `SyncOrchestrator._assessDocumentation()` -> menggunakan `files.length`. Ganti ke `Object.keys(files).length`.

### P1 — New sheet headers
`SyncOrchestrator._ensureSheets()` membuat sheet dengan `ensureSheet(name, null)`. Repository membaca row pertama sebagai header. Buat schema/header eksplisit atau mekanisme bootstrap yang aman.

### P1 — Canonical docs migration
Runtime masih memiliki hardcode/list legacy di:
- Knowledge key `docsync:canonical_files` (sudah harus dimigrasikan di `ai_knowledge.md`);
- `SelfHealingSpecialist.updateDocumentation()`.

Canonical target sekarang adalah:
- `ARCHITECTURE.md`
- `PROGRESS.md`
- `ROADMAP.md`
- `AI_DEVELOPMENT_HANDOFF.md`
- `ai_knowledge.md`

### P2 — LLM ranking
`rankModels()` membuat 7 bucket. Task `finance_response`, `docsync_analysis`, `benchmark_probe`, `fast` fallback ke `chat_light`. Tentukan apakah ini intentional atau tambahkan ranking bucket.

### P2 — Scheduler
`adaptiveReRank()` tidak dipanggil oleh `runDailyLLMDiscovery()`.

Full audit “tanggal 1” hanya diperiksa saat trigger mingguan Senin aktif; tidak ada trigger tanggal 1 terpisah.

### P2 — ChangeDetector
Snapshot source berasal dari `.gs`; `appsscript.json` tidak ikut.

### P2 — Command context drift
`08_Specialist_FeatureArchitect.gs` dan `08_Specialist_SelfAwareness.gs` masih menyebut `/sync` pada command list/context.

## 4. Complete module/function inventory

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

### Detailed declaration list

#### `00_Config.gs`
- L10: `load()` — method
- L39: `clearCache()` — method
- L43: `reload()` — method

#### `01_SpreadsheetGateway.gs`
- L11: `getSpreadsheet()` — method
- L19: `getSheet(sheetName)` — method
- L28: `appendRowSafe(sheetName, rowData)` — method
- L40: `ensureSheet(sheetName, headers)` — method

#### `02_Utils.gs`
- L8: `generate(prefix)` — method
- L17: `toWIB(date)` — method
- L24: `nowWIB()` — method
- L28: `formatWaktu(date)` — method
- L33: `formatUntukPrompt(date)` — method
- L38: `formatPeriode(date)` — method

#### `03_AppLogger.gs`
- L9: `write(jenisEvent, detail, status)` — method
- L20: `info(jenisEvent, detail)` — method
- L21: `warning(jenisEvent, detail)` — method
- L22: `error(jenisEvent, detail)` — method

#### `04_Repository_Budget.gs`
- L9: `create(kategori, batasJumlah, periode)` — method
- L17: `getAll()` — method
- L40: `_normalizePeriode(value)` — method
- L47: `findByKategoriAndPeriode(kategori, periode)` — method
- L51: `getByPeriode(periode)` — method
- L55: `updateBatasJumlah(rowIndex, batasJumlahBaru)` — method

#### `04_Repository_ChatHistory.gs`
- L9: `getRecent(limit)` — method
- L21: `save(chatId, role, text)` — method

#### `04_Repository_Documentation.gs`
- L13: `getAll()` — method

#### `04_Repository_Facts.gs`
- L10: `save(chatId, factText, category)` — method
- L17: `getActive(maxFacts)` — method

#### `04_Repository_Knowledge.gs`
- L10: `_getSheet()` — method
- L14: `_getAllRows()` — method
- L21: `get(namespace, key)` — method
- L32: `getByNamespace(namespace)` — method
- L44: `getAll()` — method
- L63: `save(namespace, key, content, notes)` — method
- L90: `deactivate(namespace, key)` — method

#### `04_Repository_Reminder.gs`
- L18: `create(data)` — method
- L28: `_mapRow(row, rowIndex)` — method
- L44: `getAll()` — method
- L53: `getActive()` — method
- L57: `getMenungguRespon(batasMenit)` — method
- L68: `updateStatus(rowIndex, status)` — method
- L73: `updateTerakhirDiingatkan(rowIndex, jumlahBaru)` — method
- L79: `updateWaktu(rowIndex, waktuBaru)` — method
- L84: `hitungWaktuBerikutnya(reminder)` — method
- L92: `formatDaftarAktifSebagaiTeks()` — method
- L110: `save(pesanUser, interpretasi, aksi)` — method
- L116: `getRecent(limit)` — method

#### `04_Repository_Transaction.gs`
- L18: `create(data)` — method
- L28: `_mapRow(row, rowIndex)` — method
- L44: `getAll()` — method
- L53: `getActive()` — method
- L57: `getLastActive()` — method
- L62: `findById(id)` — method
- L66: `getByWallet(walletId)` — method
- L70: `getByKategoriAndPeriode(kategori, tahunBulan)` — method
- L77: `softDelete(rowIndex)` — method
- L82: `update(rowIndex, updatedFields)` — method

#### `04_Repository_Wallet.gs`
- L9: `create(nama, saldoAwal)` — method
- L17: `getAll()` — method
- L32: `findByName(nama)` — method
- L37: `findById(id)` — method
- L41: `exists(nama)` — method

#### `05_Service_Telegram.gs`
- L14: `pickPlaceholder()` — method
- L19: `sendMessage(chatId, text)` — method
- L67: `editMessage(chatId, messageId, text)` — method

#### `06_Service_LLMProvider.gs`
- L10: `call(sys, msgs, temp, model)` — method
- L16: `call(sys, msgs, temp, model)` — method
- L22: `call(sys, msgs, temp)` — method
- L28: `generate(params)` — method
- L103: `generateFromSinglePrompt(promptText, temperature, taskType)` — method
- L111: `_recordStatSafe(taskType, modelId, success, latency)` — method

#### `06_Service_LLM_Gemini.gs`
- L11: `_discoverActiveModel()` — method
- L80: `call(systemInstruction, messages, temperature, modelName)` — method

#### `06_Service_LLM_Groq.gs`
- L11: `call(systemInstruction, messages, temperature)` — method

#### `06_Service_LLM_OpenRouter.gs`
- L19: `call(systemInstruction, messages, temperature, modelName)` — method

#### `07_Service_WebSearchProvider.gs`
- L15: `getProviders()` — method
- L19: `search(query)` — method
- L36: `formatResultsAsContext(results)` — method
- L44: `isAnyConfigured()` — method

#### `07_Service_WebSearch_Google.gs`
- L11: `isConfigured()` — method
- L16: `search(query)` — method

#### `07_Service_WebSearch_Tavily.gs`
- L12: `isConfigured()` — method
- L16: `search(query)` — method

#### `08_Specialist_ChangeDetector.gs`
- L9: `runDetection(mode)` — method
- L53: `runScheduledDetection()` — method
- L96: `_getCurrentFiles()` — method
- L111: `_simpleHash(str)` — method
- L121: `_getLatestSnapshot()` — method
- L138: `_saveSnapshot(currentFiles)` — method
- L159: `_compareWithSnapshot(currentFiles, snapshot)` — method
- L172: `_buildReport(changes)` — method
- L193: `_checkDocSync(changes)` — method

#### `08_Specialist_Chat.gs`
- L10: `buildSystemPersona()` — method
- L54: `needsWebSearch(intent)` — method
- L58: `respondWithSearchContext(userMessage, searchResults, riwayat)` — method
- L85: `_formatRiwayat(riwayat)` — method

#### `08_Specialist_CodeAuditor.gs`
- L10: `runAudit(type)` — method
- L43: `runScheduledAudit()` — method
- L54: `fixIssues(scope)` — method
- L81: `shouldOfferAudit()` — method
- L90: `_collectData()` — method
- L135: `_getSheetNames()` — method
- L144: `_analyzeInBatches(data, categories)` — method
- L173: `_splitIntoBatches(files)` — method
- L200: `_buildAuditPrompt(batch, data, categories)` — method
- L226: `_parseFindings(rawText)` — method
- L242: `_deduplicateFindings(findings)` — method
- L252: `_filterByScope(findings, scope)` — method
- L265: `_generateFixes(findings)` — method
- L333: `_applyFixes(fixes, scope)` — method
- L439: `_saveReport(findings, type)` — method
- L459: `_saveFindings(reportId, findings)` — method
- L473: `_getLatestPendingFindings()` — method
- L497: `_markFindingsFixed(findings)` — method
- L515: `_getLastAuditDate()` — method

#### `08_Specialist_DocSync.gs`
- L9: `sync()` — method
- L53: `_getCanonicalFiles()` — method
- L63: `_isCanonical(fileName, canonicalFiles)` — method
- L70: `_collectSourceMetadata()` — method
- L96: `_extractMethodSignatures(content)` — method
- L114: `_collectCurrentDocs(canonicalFiles)` — method
- L136: `_analyzeWithLLM(sourceMetadata, currentDocs, canonicalFiles)` — method
- L167: `_commitDocUpdate(fileName, content, reason)` — method

#### `08_Specialist_FeatureArchitect.gs`
- L10: `generateBlueprint(idea)` — method
- L56: `implementBlueprint(idea)` — method
- L167: `_generateAllCode(blueprint, context, idea)` — method
- L215: `_generateSingleFile(fileSpec, blueprint, context, idea)` — method
- L259: `_gatherProjectContext()` — method
- L277: `_saveBlueprint(blueprint, idea)` — method
- L294: `_getLatestBlueprint()` — method

#### `08_Specialist_Finance.gs`
- L6: `resolveWallet(namaWallet)` — method
- L19: `getSaldoWallet(walletId)` — method
- L34: `getAllSaldo()` — method
- L48: `recordTransaction(data)` — method
- L86: `editLastTransaction(updatedFields)` — method
- L112: `getRingkasanPeriode(periode)` — method
- L140: `createOrUpdateBudget(kategori, batasJumlah, periode)` — method
- L162: `_checkBudgetAlert(kategori, tanggalTransaksi)` — method

#### `08_Specialist_Knowledge.gs`
- L11: `saveFact(chatId, factText, category)` — method
- L17: `saveManualFact(chatId, factText)` — method
- L21: `saveAutoDetectedFacts(chatId, facts)` — method
- L30: `getActiveFactsForPrompt(limit)` — method
- L34: `findRelevantToKeyword(keyword, limit)` — method

#### `08_Specialist_KnowledgeSync.gs`
- L11: `sync()` — method
- L15: `bootstrap()` — method
- L25: `_pullFromGitHub()` — method
- L59: `pushSheetToGitHub()` — method

#### `08_Specialist_LLMIntelligence.gs`
- L13: `discoverAndBenchmark()` — method
- L17: `runFullPipeline()` — method
- L24: `discoverModels()` — method
- L61: `benchmarkBatch()` — method
- L128: `rankModels()` — method
- L174: `_testSingleModel(modelId, promptText, patCalc, patLogic)` — method
- L217: `_loadCandidateIds()` — method
- L232: `_loadExistingResults()` — method
- L238: `_saveResults(results)` — method
- L242: `getRankedModelsForTask(taskType)` — method
- L257: `recordStat(taskType, modelId, success, latencyMs)` — method
- L282: `adaptiveReRank()` — method

#### `08_Specialist_Memory.gs`
- L14: `getLongTermMemory(maxDays)` — method
- L49: `summarizeToday()` — method
- L108: `_getTodayChats()` — method
- L145: `_hasSummaryForToday()` — method
- L167: `_saveSummary(summary, topics, messageCount)` — method

#### `08_Specialist_ProjectBrain.gs`
- L10: `buildRoadmapFromDiscussion(userInput)` — method
- L64: `syncRoadmapWithCode()` — method
- L128: `adaptRoadmapForNewIdea(idea)` — method
- L179: `answerQuestion(question)` — method
- L206: `updateRoadmapStatus(feature, status)` — method
- L210: `_readDoc(fileName)` — method
- L215: `_readItems()` — method
- L233: `_addItem(feature, category, priority, status, notes)` — method
- L247: `_updateItemStatus(feature, newStatus)` — method
- L265: `_syncItemsToSheet(items)` — method
- L289: `_updateRoadmapContent(changesDescription)` — method

#### `08_Specialist_Reminder.gs`
- L12: `getMenungguRespon()` — method
- L16: `getReminderDueNow()` — method
- L29: `listActiveAsText()` — method
- L33: `getAckPatternsForPrompt(limit)` — method
- L37: `create(reminderData)` — method
- L57: `acknowledge(pesanUserAsli, ackIntent, remindersMenunggu)` — method
- L70: `getRemindersDueNow()` — method
- L75: `buildNotificationText(reminder)` — method
- L85: `markAsNotified(reminder)` — method
- L92: `_isDueNow(reminder, now)` — method
- L103: `_buildRelevantFactContext(reminder)` — method
- L109: `_buildConfirmationText(data)` — method
- L118: `_handleDone(pesanUserAsli, intent, target)` — method
- L135: `_handleSnooze(pesanUserAsli, intent, target)` — method

#### `08_Specialist_SelfAwareness.gs`
- L10: `review(focus)` — method
- L22: `_gatherSelfData()` — method

#### `08_Specialist_SelfHealing.gs`
- L10: `getLevel()` — method
- L20: `diagnose(keluhanUser)` — method
- L73: `updateDocumentation(instruction)` — method
- L135: `applyPendingPatch(patchId)` — method
- L152: `_getRecentLogs(count)` — method
- L173: `_filterErrorLogs(logs)` — method
- L184: `_identifySuspectFiles(errorLogs, keluhan)` — method
- L224: `_askLLMForDiagnosis(keluhan, errorLogs, sourceMap)` — method
- L266: `_applyToGitHub(diagnosis)` — method
- L336: `_savePatch(diagnosis)` — method
- L355: `_getPatchById(patchId)` — method
- L377: `_updatePatchStatus(fileName, newStatus)` — method

#### `08_Specialist_Soul.gs`
- L15: `initializeSelf()` — method
- L63: `_patchIntentSchema()` — method
- L78: `getSelfModel()` — method
- L84: `updateSelfModel(data)` — method
- L98: `getIdentity()` — method
- L104: `updateIdentity(data)` — method
- L116: `getBeliefs()` — method
- L122: `addBelief(belief)` — method
- L131: `getGrowthLog()` — method
- L137: `addGrowthEntry(event, detail)` — method
- L148: `getEmotionalState()` — method
- L154: `updateEmotionalState(data)` — method
- L167: `getFullContext()` — method
- L178: `runFullCodeAudit()` — global

#### `08_Specialist_SoulMemory.gs`
- L7: `_ensureSheets()` — method
- L12: `recordEpisode(eventType, context, outcome, emotionalState, details)` — method
- L31: `getRecentEpisodes(limit)` — method
- L56: `getEpisodesByType(eventType, limit)` — method
- L64: `addMetaInsight(insight, source, confidence)` — method
- L82: `getMetaInsights(limit)` — method

#### `08_Specialist_SyncOrchestrator.gs`
- L9: `assessState()` — method
- L18: `executeSync(scope)` — method
- L63: `autoDocument(changeDescription)` — method
- L79: `_assessKnowledge()` — method
- L88: `_assessDocumentation()` — method
- L97: `_assessSheetStructure()` — method
- L107: `_getLastSyncTimestamp()` — method
- L111: `_saveSyncTimestamp()` — method
- L116: `_pullKnowledge()` — method
- L135: `_backupKnowledge()` — method
- L149: `_syncDocumentation()` — method
- L163: `_ensureSheets()` — method

#### `08_Specialist_UserProfile.gs`
- L12: `saveUpdates(updates)` — method
- L31: `getProfileForPrompt(maxItems)` — method
- L64: `getByCategory(category)` — method
- L91: `_upsertProfile(key, value, category)` — method

#### `08_Utils_PatchValidator.gs`
- L15: `validate(patchedCode, originalCode, fileName)` — method
- L77: `_checkSyntax(code)` — method
- L95: `_checkStructuralSanity(patched, original)` — method
- L138: `_checkSuspiciousPatterns(code)` — method
- L190: `formatResult(result)` — method

#### `08_Utils_TemplateEngine.gs`
- L2: `render(template, variables)` — method

#### `09_CommandRouter.gs`
- L9: `isKnownCommand(text)` — method
- L15: `handle(chatId, text)` — method
- L34: `_handleIngat(chatId, args)` — method

#### `09_Manager.gs`
- L2: `processConversationalMessage(chatId, text)` — method
- L28: `_gatherContext()` — method
- L39: `_persistAutoFacts(chatId, intent)` — method
- L46: `_routeIntent(chatId, text, intent, context)` — method
- L93: `_askLLMWithKnowledge(chatId, userText, namespace, key, rawData)` — method
- L119: `_handleCatatKeuangan(chatId, text, intent)` — method
- L144: `_handleTanyaSaldo(chatId, text, intent)` — method
- L170: `_handleRingkasanKeuangan(chatId, text, intent)` — method
- L183: `_handleAturBudget(chatId, text, intent)` — method
- L203: `_handleEditTransaksi(chatId, text, intent)` — method
- L253: `_handleSyncDocumentation(chatId, text, intent)` — method
- L263: `_handleBackupKnowledge(chatId, text)` — method
- L271: `_handleRestoreKnowledge(chatId, text)` — method
- L279: `_handleSoulInit(chatId, text)` — method
- L287: `_handleSoulQuery(chatId, text, intent)` — method
- L300: `_handleSoulMemoryQuery(chatId, text, intent)` — method
- L311: `_handleAckReminder(chatId, text, intent, context)` — method
- L317: `_handleBuatReminder(intent)` — method
- L321: `_handleDiagnoseError(chatId, text, intent)` — method
- L331: `_handleUpdateDocs(chatId, text, intent)` — method
- L341: `_handleAuditCode(chatId, text, intent)` — method
- L352: `_handleFixAudit(chatId, text, intent)` — method
- L363: `_handleCheckChanges(chatId, text, intent)` — method
- L371: `_handleRoadmapQuery(chatId, text, intent)` — method
- L399: `_handleImplementFeature(chatId, text, intent)` — method
- L421: `_handleSelfQuery(chatId, text, intent)` — method
- L429: `_handleChatBiasa(chatId, text, intent, riwayat)` — method
- L445: `_handleHeavyChat(text, intent, riwayat)` — method
- L456: `_handleChatWithWebSearch(text, intent, riwayat)` — method
- L461: `_handleIntentFailure(chatId, text, riwayat)` — method

#### `09_Manager_IntentAnalyzer.gs`
- L4: `analyze(userMessage, context)` — method
- L14: `_parseResponse(rawText, providerName)` — method
- L42: `_buildPrompt(userMessage, context)` — method
- L69: `_formatRiwayat(r)` — method
- L76: `_formatList(arr)` — method
- L81: `_formatReminder(r)` — method
- L86: `_formatPola(p)` — method

#### `10_Handler_Webhook.gs`
- L11: `handle(e)` — method
- L48: `_isAuthorized(e, config)` — method
- L52: `_isDuplicateUpdate(contents)` — method
- L64: `_processMessage(chatId, text)` — method
- L77: `doPost(e)` — global

#### `11_Trigger_AuditScheduler.gs`
- L13: `runScheduledAudit()` — method
- L28: `setupWeeklyTrigger()` — method
- L44: `_deleteExistingTriggers()` — method
- L58: `runScheduledAuditWrapper()` — global
- L62: `setupWeeklyTrigger()` — global

#### `11_Trigger_LLMIntelligence.gs`
- L7: `runDailyLLMDiscovery()` — global
- L13: `setupDailyLLMDiscovery()` — global

#### `11_Trigger_MemorySummarizer.gs`
- L8: `setupNightlyTrigger()` — method
- L22: `_deleteExistingTriggers()` — method
- L32: `runNightlySummarizerWrapper()` — global
- L36: `setupNightlySummarizer()` — global

#### `11_Trigger_ReminderChecker.gs`
- L6: `cekDanKirimReminder()` — global
- L44: `setupReminderTrigger()` — global

#### `11_Trigger_ScheduledSync.gs`
- L7: `runDailyAutoSync()` — global
- L17: `setupDailyAutoSyncTrigger()` — global

#### `11_Trigger_WeeklyChangeCheck.gs`
- L8: `setupWeeklyTrigger()` — method
- L21: `_deleteExistingTriggers()` — method
- L31: `runWeeklyChangeCheckWrapper()` — global
- L35: `setupWeeklyChangeCheck()` — global

#### `12_Service_GitHubBackup.gs`
- L15: `backupAllFiles()` — method
- L40: `backupDocs()` — method
- L65: `_loadGitHubConfig()` — method
- L79: `_fetchOwnSourceFiles()` — method
- L100: `_resolveFilePath(file)` — method
- L106: `_pushFileToGitHub(config, path, content)` — method
- L135: `_getExistingFileSha(config, url)` — method
- L156: `runFullBackup()` — global
- L174: `setupDailyBackupTrigger()` — global

#### `13_Service_GitHubOps.gs`
- L9: `_getHeaders()` — method
- L18: `_getRepoUrl()` — method
- L25: `readFile(path, ref)` — method
- L61: `listDirectory(path)` — method
- L93: `readAllSourceFiles()` — method
- L113: `createBranch(branchName)` — method
- L171: `createBackupBranch(suffix)` — method
- L181: `commitFile(path, content, message, branch, sha)` — method
- L224: `createPullRequest(title, body, head, base)` — method
- L258: `readDocFile(fileName)` — method
- L262: `updateDocFile(fileName, newContent, commitMessage)` — method

#### `99_TestSuite_Full.gs`
- L9: `_tLog(batch, name, status, detail, ms)` — global
- L16: `_cleanupTestData()` — global
- L53: `test_Batch1_RepositoryCRUD()` — global
- L281: `test_Batch2_IntentDetection()` — global
- L390: `test_Batch3_LLMRouting()` — global
- L486: `test_Batch4_FinanceE2E()` — global
- L674: `test_Batch5_MemoryContext()` — global
- L860: `test_Batch6_Integration()` — global

#### `99_Tests.gs`
- L1: `test_Batch7b_FinanceSpecialist()` — global
- L49: `debug_CheckOAuthScopes()` — global
- L58: `debug_CheckGitHubConfig()` — global
- L89: `test_TelegramMarkdownFallback()` — global
- L129: `debug_TimezoneAudit()` — global
- L160: `triggerKnowledgeSync()` — global
- L165: `triggerManualDiscoveryAndBenchmark()` — global
- L173: `test_Stage1_Discover()` — global
- L183: `test_Stage2_BenchmarkBatch()` — global
- L193: `test_Stage3_Rank()` — global
- L203: `test_CheckGitHubRateLimitAndAuth()` — global
- L223: `fix_CleanBenchmarkData()` — global
- L274: `resetAndCleanSystemCounters()` — global
- L304: `forceSyncKnowledgeFromGitHub()` — global
- L318: `test_DocSync_CollectSourceMetadata()` — global
- L342: `test_DetectDuplicateGlobalFunctions()` — global
- L426: `debug_DumpIntentKnowledge()` — global

#### `Rollback.gs`
- L8: `rollbackFromGitHub()` — global
- L47: `_getRollbackFilesFromGitHub(config)` — global


## 5. Sheet/data contracts

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


## 6. Configuration contract

Script Properties dibaca oleh `Config.load()`:

``TELEGRAM_BOT_TOKEN`, `MY_TELEGRAM_CHAT_ID`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `SPREADSHEET_ID`, `SHARED_SECRET`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`, `TAVILY_API_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BRANCH`, `OPENROUTER_API_KEY`, `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `TOGETHER_API_KEY`, `HF_API_TOKEN``

`GITHUB_BRANCH` default `main`. `OPENROUTER_MODEL_FAST` belum di-load ke config.

## 7. Provider contract

### LLM
- OpenRouter: candidate free models (`:free`) dari ranked list.
- Gemini: active model discovery dari `/models`, lalu generateContent.
- Groq: model hardcoded `openai/gpt-oss-20b`.
- Fallback order: OpenRouter -> Gemini -> Groq.

### Web search
`WebSearchProviderService` mencoba provider configured secara berurutan: Google -> Tavily.

### Telegram
`sendMessage` dan `editMessage`; webhook memakai placeholder lalu edit response.

### GitHub
`readFile`, `listDirectory`, `readAllSourceFiles`, `createBranch`, `createBackupBranch`, `commitFile`, `createPullRequest`, `readDocFile`, `updateDocFile`.

## 8. Development protocol A-Z

### A — Audit dulu
Search symbol, caller, callee, trigger, knowledge key, sheet schema.

### B — Backward compatibility
Jangan rename global function/method tanpa migration map.

### C — Contracts
Setiap perubahan API harus update caller + test + docs.

### D — Data
Jika sheet baru dibuat, header/schema harus jelas.

### E — External APIs
Selalu tangani HTTP non-2xx, null response, rate limit, auth failure.

### F — Functionality
Pastikan command, intent, taskType, sheet, dan trigger benar-benar punya handler.

### G — GitHub
Commit dengan SHA bila update file existing; gunakan branch untuk perubahan engineering.

### H — History
Pertahankan audit trail di Log/Audit sheets.

### I — Intent
Enum intent harus sinkron dengan `ai_knowledge.md` dan `Manager._routeIntent`.

### J — Jobs
Verifikasi setiap scheduled entrypoint adalah global GAS function atau wrapper.

### K — Knowledge
Knowledge snapshot diberi konteks waktu; jangan pakai data runtime historis sebagai fact terkini tanpa timestamp.

### L — LLM
Perubahan `taskType` harus memeriksa matrix, fallback, benchmark, dan stats.

### M — Memory
Pastikan formatter/date helper tersedia sebelum menjadikan LTM dependency mandatory.

### N — Notifications
Reminder harus idempotent dan memiliki anti-duplication/cooldown semantics.

### O — Observability
Log failure dengan event key dan detail, tetapi jangan log secret/token.

### P — Patch safety
PatchValidator hanya static; review branch/PR tetap diperlukan.

### Q — Quality
Static syntax check bukan runtime proof.

### R — Rollback
Setiap automated source mutation sebaiknya punya backup/rollback path.

### S — Security
Webhook public endpoint harus tetap memakai secret + chat allowlist; token di Script Properties.

### T — Tests
Perbaiki stale tests; tambah contract tests untuk method/intent/taskType/sheet/trigger.

### U — Update docs
Canonical docs hanya 5 target; jangan reintroduce legacy canonical list.

### V — Verification
Setelah perubahan: syntax -> static reference checks -> targeted GAS tests -> integration smoke test.

### W — Web/API
External API response schema jangan diasumsikan tanpa pengecekan.

### X — eXceptions
Jangan menelan exception secara diam-diam pada operation-critical path; log + return structured error.

### Y — Yield/runtime limits
Pertimbangkan quotas/timeouts GAS saat batch source, benchmark, sync, dan Telegram loops.

### Z — Zero-assumption rule
Jangan menganggap docs, test lama, atau nama file lama benar. Source actual dan runtime evidence harus memutuskan.

## 9. Canonical documentation map

| File | Tugas |
|---|---|
| `ARCHITECTURE.md` | System design, flows, schemas, dependencies, source map. |
| `PROGRESS.md` | Current status, audit findings, tests, resolved gaps. |
| `ROADMAP.md` | Future work, migrations, technical debt. |
| `AI_DEVELOPMENT_HANDOFF.md` | Deep implementation/code reference. |
| `ai_knowledge.md` | Runtime knowledge/prompts/schema/routing. |

`AI_DEVELOPMENT_HANDOVER.md` ini adalah briefing AI, bukan canonical DocSync target.

## 10. Working rule for future AI

Saat menerima task baru:

1. baca `ARCHITECTURE.md` + `PROGRESS.md` untuk kondisi aktual;
2. baca `AI_DEVELOPMENT_HANDOFF.md` untuk implementation detail;
3. baca `ai_knowledge.md` untuk prompt/intent/runtime knowledge;
4. baca `ROADMAP.md` untuk konteks perubahan;
5. cari source symbol yang akan disentuh;
6. audit semua callers/callees;
7. implementasi minimal yang konsisten;
8. update tests;
9. update docs canonical yang terdampak;
10. laporkan changed files, behavior, tests, unresolved gaps.

Jangan menyatakan “selesai” hanya karena syntax pass atau dokumentasi sudah diperbarui. Untuk behavior yang bergantung Google Apps Script/external APIs, gunakan execution evidence.
