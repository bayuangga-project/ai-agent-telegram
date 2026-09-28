# AI_DEVELOPMENT_HANDOVER ? Instruksi untuk AI Pengembang Berikutnya

> **Gunakan dokumen ini sebagai briefing engineering.** Jangan mulai mengedit code sebelum membaca bagian ?source-of-truth?, ?current defects?, dan ?development protocol?.

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

## 3. Current critical defects ? jangan lewatkan

### P0 ? Memory/date formatter
`08_Specialist_Memory.gs` memanggil `DateTimeUtils.formatTanggal(...)` tetapi `02_Utils.gs` tidak mendefinisikan method itu. Ini mempengaruhi `getLongTermMemory`, `_getTodayChats`, `_hasSummaryForToday`, `_saveSummary`, dan nightly summarizer.

**Sebelum mengklaim memory sehat, perbaiki dan test jalur tersebut.**

### P1 ? Finance test mismatch
`test_Batch7b_FinanceSpecialist` memanggil `FinanceSpecialist.getAllSaldoAsText()` dan `FinanceSpecialist.formatRingkasanAsText()`, yang tidak ada. Perbaiki test terhadap API aktual; jangan menambah shim hanya agar test lama hijau tanpa kebutuhan source.

### P1 ? Sync assessment type mismatch
`GitHubOpsService.readAllSourceFiles()` -> object map. `SyncOrchestrator._assessDocumentation()` -> menggunakan `files.length`. Ganti ke `Object.keys(files).length`.

### P1 ? New sheet headers
`SyncOrchestrator._ensureSheets()` membuat sheet dengan `ensureSheet(name, null)`. Repository membaca row pertama sebagai header. Buat schema/header eksplisit atau mekanisme bootstrap yang aman.

### P1 ? Canonical docs migration
Runtime masih memiliki hardcode/list legacy di:
- Knowledge key `docsync:canonical_files` (sudah harus dimigrasikan di `ai_knowledge.md`);
- `SelfHealingSpecialist.updateDocumentation()`.

Canonical target sekarang adalah:
- `ARCHITECTURE.md`
- `PROGRESS.md`
- `ROADMAP.md`
- `AI_DEVELOPMENT_HANDOVER.md`
- `ai_knowledge.md`

### P2 ? LLM ranking
`rankModels()` membuat 7 bucket. Task `finance_response`, `docsync_analysis`, `benchmark_probe`, `fast` fallback ke `chat_light`. Tentukan apakah ini intentional atau tambahkan ranking bucket.

### P2 ? Scheduler
`adaptiveReRank()` tidak dipanggil oleh `runDailyLLMDiscovery()`.

Full audit ?tanggal 1? hanya diperiksa saat trigger mingguan Senin aktif; tidak ada trigger tanggal 1 terpisah.

### P2 ? ChangeDetector
Snapshot source berasal dari `.gs`; `appsscript.json` tidak ikut.

### P2 ? Command context drift
`08_Specialist_FeatureArchitect.gs` dan `08_Specialist_SelfAwareness.gs` masih menyebut `/sync` pada command list/context.

## 4. Complete module/function inventory

| File | LOC | Objects | Public/global/method declarations |
|---|---:|---|---|
| `00_Config.gs` | 47 | Config | load(), clearCache(), reload() |
| `01_SpreadsheetGateway.gs` | 52 | SpreadsheetGateway | getSpreadsheet(), getSheet(sheetName), appendRowSafe(sheetName, rowData), ensureSheet(sheetName, headers) |
| `02_Utils.gs` | 47 | IdGenerator, DateTimeUtils | generate(prefix), toWIB(date), nowWIB(), formatWaktu(date), formatUntukPrompt(date), formatPeriode(date), formatTanggal(date) |
| `03_AppLogger.gs` | 23 | AppLogger | write(jenisEvent, detail, status), info(jenisEvent, detail), warning(jenisEvent, detail), error(jenisEvent, detail) |
| `04_Repository_Budget.gs` | 58 | BudgetRepository | create(kategori, batasJumlah, periode), getAll(), _normalizePeriode(value), findByKategoriAndPeriode(kategori, periode), getByPeriode(periode), updateBatasJumlah(rowIndex, batasJumlahBaru) |
| `04_Repository_ChatHistory.gs` | 26 | ChatHistoryRepository | getRecent(limit), save(chatId, role, text) |
| `04_Repository_Documentation.gs` | 76 | DocumentationRepository | getAll(), getAllWithMeta(), upsert(fileName, content, sha, fileType), ensureHeaders() |
| `04_Repository_Facts.gs` | 31 | FactsRepository | save(chatId, factText, category), getActive(maxFacts) |
| `04_Repository_Knowledge.gs` | 100 | KnowledgeRepository, result | _getSheet(), _getAllRows(), get(namespace, key), getByNamespace(namespace), getAll(), save(namespace, key, content, notes), deactivate(namespace, key) |
| `04_Repository_Reminder.gs` | 127 | ReminderRepository | create(data), _mapRow(row, rowIndex), getAll(), getActive(), getMenungguRespon(batasMenit), updateStatus(rowIndex, status), updateTerakhirDiingatkan(rowIndex, jumlahBaru), updateWaktu(rowIndex, waktuBaru), hitungWaktuBerikutnya(reminder), formatDaftarAktifSebagaiTeks(), save(pesanUser, interpretasi, aksi), getRecent(limit) |
| `04_Repository_Transaction.gs` | 97 | TransactionRepository | create(data), _mapRow(row, rowIndex), getAll(), getActive(), getLastActive(), findById(id), getByWallet(walletId), getByKategoriAndPeriode(kategori, tahunBulan), softDelete(rowIndex), update(rowIndex, updatedFields) |
| `04_Repository_Wallet.gs` | 44 | WalletRepository | create(nama, saldoAwal), getAll(), findByName(nama), findById(id), exists(nama) |
| `05_Service_Telegram.gs` | 115 | TelegramService, payload, options | pickPlaceholder(), sendMessage(chatId, text), editMessage(chatId, messageId, text) |
| `06_Service_LLMProvider.gs` | 118 | LLMProviderService | call(sys, msgs, temp, model), call(sys, msgs, temp), generate(params), generateFromSinglePrompt(promptText, temperature, taskType), _recordStatSafe(taskType, modelId, success, latency) |
| `06_Service_LLM_Gemini.gs` | 136 | GeminiProvider | _discoverActiveModel(), call(systemInstruction, messages, temperature, modelName) |
| `06_Service_LLM_Groq.gs` | 61 | GroqProvider | call(systemInstruction, messages, temperature) |
| `06_Service_LLM_OpenRouter.gs` | 82 | OpenRouterProvider | call(systemInstruction, messages, temperature, modelName) |
| `07_Service_WebSearchProvider.gs` | 47 | WebSearchProviderService | getProviders(), search(query), formatResultsAsContext(results), isAnyConfigured() |
| `07_Service_WebSearch_Google.gs` | 48 | GoogleSearchProvider | isConfigured(), search(query) |
| `07_Service_WebSearch_Tavily.gs` | 55 | TavilySearchProvider | isConfigured(), search(query) |
| `08_Specialist_ChangeDetector.gs` | 206 | ChangeDetector | runDetection(mode), runScheduledDetection(), _getCurrentFiles(), _simpleHash(str), _getLatestSnapshot(), _saveSnapshot(currentFiles), _compareWithSnapshot(currentFiles, snapshot), _buildReport(changes), _checkDocSync(changes) |
| `08_Specialist_Chat.gs` | 92 | ChatSpecialist | buildSystemPersona(), needsWebSearch(intent), respondWithSearchContext(userMessage, searchResults, riwayat), _formatRiwayat(riwayat) |
| `08_Specialist_CodeAuditor.gs` | 528 | CodeAuditor | runAudit(type), runScheduledAudit(), fixIssues(scope), shouldOfferAudit(), _collectData(), _getSheetNames(), _analyzeInBatches(data, categories), _splitIntoBatches(files), _buildAuditPrompt(batch, data, categories), _parseFindings(rawText), _deduplicateFindings(findings), _filterByScope(findings, scope), _generateFixes(findings), _applyFixes(fixes, scope), _saveReport(findings, type), _saveFindings(reportId, findings), _getLatestPendingFindings(), _markFindingsFixed(findings), _getLastAuditDate() |
| `08_Specialist_DocSync.gs` | 181 | DocSyncSpecialist | sync(), _getCanonicalFiles(), _isCanonical(fileName, canonicalFiles), _collectSourceMetadata(), _extractMethodSignatures(content), _collectCurrentDocs(canonicalFiles), _analyzeWithLLM(sourceMetadata, currentDocs, canonicalFiles), _commitDocUpdate(fileName, content, reason) |
| `08_Specialist_FeatureArchitect.gs` | 308 | FeatureArchitect | generateBlueprint(idea), implementBlueprint(idea), _generateAllCode(blueprint, context, idea), _generateSingleFile(fileSpec, blueprint, context, idea), _gatherProjectContext(), _saveBlueprint(blueprint, idea), _getLatestBlueprint() |
| `08_Specialist_Finance.gs` | 195 | FinanceSpecialist | resolveWallet(namaWallet), getSaldoWallet(walletId), getAllSaldo(), recordTransaction(data), editLastTransaction(updatedFields), getRingkasanPeriode(periode), createOrUpdateBudget(kategori, batasJumlah, periode), _checkBudgetAlert(kategori, tanggalTransaksi) |
| `08_Specialist_Knowledge.gs` | 39 | KnowledgeSpecialist | saveFact(chatId, factText, category), saveManualFact(chatId, factText), saveAutoDetectedFacts(chatId, facts), getActiveFactsForPrompt(limit), findRelevantToKeyword(keyword, limit) |
| `08_Specialist_KnowledgeSync.gs` | 98 | KnowledgeSyncSpecialist | sync(), bootstrap(), _pullFromGitHub(), pushSheetToGitHub() |
| `08_Specialist_LLMIntelligence.gs` | 319 | LLMIntelligenceSpecialist | discoverAndBenchmark(), runFullPipeline(), discoverModels(), benchmarkBatch(), rankModels(), _testSingleModel(modelId, promptText, patCalc, patLogic), _loadCandidateIds(), _loadExistingResults(), _saveResults(results), getRankedModelsForTask(taskType), recordStat(taskType, modelId, success, latencyMs), adaptiveReRank() |
| `08_Specialist_Memory.gs` | 178 | MemorySpecialist | getLongTermMemory(maxDays), summarizeToday(), _getTodayChats(), _hasSummaryForToday(), _saveSummary(summary, topics, messageCount) |
| `08_Specialist_ProjectBrain.gs` | 315 | ProjectBrainSpecialist | buildRoadmapFromDiscussion(userInput), syncRoadmapWithCode(), adaptRoadmapForNewIdea(idea), answerQuestion(question), updateRoadmapStatus(feature, status), _readDoc(fileName), _readItems(), _addItem(feature, category, priority, status, notes), _updateItemStatus(feature, newStatus), _syncItemsToSheet(items), _updateRoadmapContent(changesDescription) |
| `08_Specialist_Reminder.gs` | 146 | ReminderSpecialist | getMenungguRespon(), getReminderDueNow(), listActiveAsText(), getAckPatternsForPrompt(limit), create(reminderData), acknowledge(pesanUserAsli, ackIntent, remindersMenunggu), getRemindersDueNow(), buildNotificationText(reminder), markAsNotified(reminder), _isDueNow(reminder, now), _buildRelevantFactContext(reminder), _buildConfirmationText(data), _handleDone(pesanUserAsli, intent, target), _handleSnooze(pesanUserAsli, intent, target) |
| `08_Specialist_SelfAwareness.gs` | 131 | SelfAwarenessSpecialist | review(focus), _gatherSelfData() |
| `08_Specialist_SelfDocSync.gs.gs` | 501 | SelfDocSyncSpecialist | runDailyCheck(), _readCodeStructure(), _extractObjects(content), _extractMethods(content), _extractDependencies(content, allObjects, selfObjects), _getPreviousStructure(), _saveStructure(structure), _compareStructure(current, previous), _generateDocUpdate(diff), _collectCurrentDocs(), _saveDraft(draft), getPendingDraft(), parseApproval(text), approveDraft(), rejectDraft(), getDraftDetail(), _clearDraft(), _sendNotification(draft), _sendReminder(draft), _formatFileList(draft) |
| `08_Specialist_SelfHealing.gs` | 395 | SelfHealingSpecialist | getLevel(), diagnose(keluhanUser), updateDocumentation(instruction), applyPendingPatch(patchId), _getRecentLogs(count), _filterErrorLogs(logs), _identifySuspectFiles(errorLogs, keluhan), _askLLMForDiagnosis(keluhan, errorLogs, sourceMap), _applyToGitHub(diagnosis), _savePatch(diagnosis), _getPatchById(patchId), _updatePatchStatus(fileName, newStatus) |
| `08_Specialist_Soul.gs` | 357 | SoulSpecialist | initializeSelf(), _patchIntentSchema(), getSelfModel(), updateSelfModel(data), getIdentity(), updateIdentity(data), getBeliefs(), addBelief(belief), getGrowthLog(), addGrowthEntry(event, detail), getEmotionalState(), updateEmotionalState(data), getFullContext() |
| `08_Specialist_SoulMemory.gs` | 105 | SoulMemorySpecialist | _ensureSheets(), recordEpisode(eventType, context, outcome, emotionalState, details), getRecentEpisodes(limit), getEpisodesByType(eventType, limit), addMetaInsight(insight, source, confidence), getMetaInsights(limit) |
| `08_Specialist_SyncOrchestrator.gs` | 211 | SyncOrchestrator | assessState(), executeSync(scope), autoDocument(changeDescription), _assessKnowledge(), _assessDocumentation(), _assessSheetStructure(), _getLastSyncTimestamp(), _saveSyncTimestamp(), _pullKnowledge(), _backupKnowledge(), _syncDocumentation(), _ensureSheets() |
| `08_Specialist_UserProfile.gs` | 120 | UserProfileSpecialist | saveUpdates(updates), getProfileForPrompt(maxItems), getByCategory(category), _upsertProfile(key, value, category) |
| `08_Utils_PatchValidator.gs` | 208 | PatchValidator | validate(patchedCode, originalCode, fileName), _checkSyntax(code), _checkStructuralSanity(patched, original), _checkSuspiciousPatterns(code), formatResult(result) |
| `08_Utils_TemplateEngine.gs` | 8 | TemplateEngine | render(template, variables) |
| `09_CommandRouter.gs` | 44 | CommandRouter | isKnownCommand(text), handle(chatId, text), _handleIngat(chatId, args) |
| `09_Manager.gs` | 534 | Manager | processConversationalMessage(chatId, text), _gatherContext(), _persistAutoFacts(chatId, intent), _routeIntent(chatId, text, intent, context), _handleSyncApproval(chatId, text, action), _askLLMWithKnowledge(chatId, userText, namespace, key, rawData), _handleCatatKeuangan(chatId, text, intent), _handleTanyaSaldo(chatId, text, intent), _handleRingkasanKeuangan(chatId, text, intent), _handleAturBudget(chatId, text, intent), _handleEditTransaksi(chatId, text, intent), _handleSyncDocumentation(chatId, text, intent), _handleBackupKnowledge(chatId, text), _handleRestoreKnowledge(chatId, text), _handleSoulInit(chatId, text), _handleSoulQuery(chatId, text, intent), _handleSoulMemoryQuery(chatId, text, intent), _handleAckReminder(chatId, text, intent, context), _handleBuatReminder(intent), _handleDiagnoseError(chatId, text, intent), _handleUpdateDocs(chatId, text, intent), _handleAuditCode(chatId, text, intent), _handleFixAudit(chatId, text, intent), _handleCheckChanges(chatId, text, intent), _handleRoadmapQuery(chatId, text, intent), _handleImplementFeature(chatId, text, intent), _handleSelfQuery(chatId, text, intent), _handleChatBiasa(chatId, text, intent, riwayat), _handleHeavyChat(text, intent, riwayat), _handleChatWithWebSearch(text, intent, riwayat), _handleIntentFailure(chatId, text, riwayat) |
| `09_Manager_IntentAnalyzer.gs` | 90 | IntentAnalyzer | analyze(userMessage, context), _parseResponse(rawText, providerName), _buildPrompt(userMessage, context), _formatRiwayat(r), _formatList(arr), _formatReminder(r), _formatPola(p) |
| `10_Handler_Webhook.gs` | 79 | WebhookHandler | handle(e), _isAuthorized(e, config), _isDuplicateUpdate(contents), _processMessage(chatId, text) |
| `11_Trigger_AuditScheduler.gs` | 64 | AuditScheduler | runScheduledAudit(), setupWeeklyTrigger(), _deleteExistingTriggers() |
| `11_Trigger_LLMIntelligence.gs` | 25 | LLMIntelligenceTrigger | (no methods) |
| `11_Trigger_MemorySummarizer.gs` | 38 | MemorySummarizerTrigger | setupNightlyTrigger(), _deleteExistingTriggers() |
| `11_Trigger_ReminderChecker.gs` | 51 | ReminderCheckerTrigger | (no methods) |
| `11_Trigger_ScheduledSync.gs` | 53 | ScheduledSyncTrigger | (no methods) |
| `11_Trigger_WeeklyChangeCheck.gs` | 37 | WeeklyChangeCheckTrigger | setupWeeklyTrigger(), _deleteExistingTriggers() |
| `12_Service_GitHubBackup.gs` | 186 | GitHubBackupService | backupAllFiles(), backupDocs(), _loadGitHubConfig(), _fetchOwnSourceFiles(), _resolveFilePath(file), _pushFileToGitHub(config, path, content), _getExistingFileSha(config, url) |
| `13_Service_GitHubOps.gs` | 297 | GitHubOpsService | _getHeaders(), _getRepoUrl(), readFile(path, ref), listDirectory(path), readAllSourceFiles(), createBranch(branchName), createBackupBranch(suffix), commitFile(path, content, message, branch, sha), createPullRequest(title, body, head, base), readDocFile(fileName), updateDocFile(fileName, newContent, commitMessage) |
| `99_TestSuite_Full.gs` | 922 | TestSuite | (no methods) |
| `99_Test_SelfDocSync.gs` | 190 | TestSelfDocSync | (no methods) |
| `99_Tests.gs` | 439 | Tests | (no methods) |
| `Rollback.gs` | 108 | Rollback | (no methods) |

## 5. Catatan Penting

- Semua modul ditulis sebagai **object literal** (`const X = {...}`), bukan `class`.
- Tidak ada dependency injection ? modul saling memanggil lewat nama global langsung.
- `04_Repository_Reminder.gs` berisi `ReminderRepository` saja (bukan `AckPatternsRepository`). Tidak ada file `04_Repository_AckPatterns.gs` terpisah di source code.
- `06_Service_LLMProvider.gs` adalah orchestrator utama (bukan `06_Service_LLM.gs`).
- `07_Service_WebSearchProvider.gs` adalah orchestrator web search (bukan `07_Service_WebSearch.gs`).
- `08_Specialist_SelfHealing.gs` dan `08_Specialist_SelfDocSync.gs.gs` adalah file yang ada di source tetapi sering terlewat dalam dokumentasi lama.