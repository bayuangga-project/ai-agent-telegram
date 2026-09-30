# AI_DEVELOPMENT_HANDOVER — Instruksi untuk AI Pengembang Berikutnya

> **Gunakan dokumen ini sebagai briefing engineering.** Jangan mulai mengedit code sebelum membaca bagian "source-of-truth", "current defects", dan "development protocol".

## 0. Source-of-truth

Repository yang sedang dikembangkan adalah snapshot AI Agent Telegram (Vexa) berbasis Google Apps Script V8.

- Snapshot Kode: 43 `.gs` file (Telah dirampingkan & dioptimalkan)
- Tanggal Audit & Penyelarasan: 30 September 2026
- Source: 43 `.gs` files, ~8.500 LOC
- Manifest: `src/appsscript.json`
- Syntax Check Snapshot: 43/43 file `.gs` lolos syntax check & 32/32 PASS Audit
- Target Database: Google Spreadsheet (Persistence utama) & Money Tracker V19.3

**Otoritas:** source code aktual > manifest > runtime knowledge `ai_knowledge.md` > consolidated docs > legacy archive.

Jangan menganggap sesuatu ada hanya karena tertulis di dokumentasi lama. Cari symbol pada source dan verifikasi caller/callee-nya.

## 1. Tujuan sistem

AI Agent (Vexa) menerima pesan Telegram (Teks, Voice Note via Groq Whisper API, & Foto Struk via Gemini Vision API), memproses context (history/facts/profile/LTM/reminder/patterns/vector_rag), menggunakan Autonomous ReAct Agent Engine (Plan -> Act -> Observe) untuk intent/routing atau chat, lalu menjalankan specialist deterministic untuk finance (Tracker V19.3), reminder, memory, soul, audit, self-healing, docs, roadmap, feature implementation, web search, dan GitHub operations.

Persistence utama adalah Google Spreadsheet; source/docs/knowledge backup berada di GitHub.

## 2. Contract utama

### Entry points
- `doPost(e)` -> webhook entry point (Teks, Voice, Foto).
- `runDailyAutoSync()` -> sync harian jam 04:00.
- `runDailyLLMDiscovery()` -> pipeline LLM harian jam 03:00.
- `runNightlySummarizerWrapper()` -> memory summary harian jam 23:00.
- `cekDanKirimReminder()` -> reminder checker tiap 1 menit.
- `runScheduledAuditWrapper()` -> audit mingguan Senin & bulanan tanggal 1.
- `runWeeklyChangeCheckWrapper()` -> change detection mingguan.
- `runFullBackup()` -> backup source/docs.
- `runDailySelfDocCheck()` -> SelfDocSync harian jam 10:00.

### Commands aktual
`diagnose`, `heal`, `logs`, `patch`, `build`, `ingat`, `soul`, `init-soul`, `backup`, `restore`, `memory`, `export_ns`, `help`, `llm`.

### Intent aktual yang harus dikenali knowledge/schema
`ack_reminder`, `buat_reminder`, `chat_biasa`, `catat_keuangan`, `tanya_saldo`, `ringkasan_keuangan`, `atur_budget`, `edit_transaksi`, `sync_documentation`, `diagnose_error`, `update_docs`, `audit_code`, `fix_audit`, `check_changes`, `roadmap_query`, `implement_feature`, `self_query`, `soul_query`, `soul_init`, `backup_knowledge`, `restore_knowledge`, `soul_memory_query`

## 3. Complete module/function inventory (43 File `.gs` Aktif)

| File | LOC | Objects | Public/global/method declarations |
|---|---:|---|---|
| `00_Config.gs` | 47 | Config | load(), clearCache(), reload() |
| `01_SpreadsheetGateway.gs` | 52 | SpreadsheetGateway | getSpreadsheet(), getSheet(sheetName), appendRowSafe(sheetName, rowData), ensureSheet(sheetName, headers), clearCache() |
| `02_Utils.gs` | 55 | IdGenerator, DateTimeUtils, TemplateEngine | generate(prefix), toWIB(date), nowWIB(), formatWaktu(date), formatUntukPrompt(date), formatPeriode(date), formatTanggal(date), render(template, variables) |
| `03_AppLogger.gs` | 23 | AppLogger | write(jenisEvent, detail, status), info(jenisEvent, detail), warning(jenisEvent, detail), error(jenisEvent, detail) |
| `04_Repository_Budget.gs` | 58 | BudgetRepository | create(), getAll(), _normalizePeriode(), findByKategoriAndPeriode(), getByPeriode(), updateBatasJumlah() |
| `04_Repository_ChatHistory.gs` | 26 | ChatHistoryRepository | getRecent(limit), save(chatId, role, text) |
| `04_Repository_Documentation.gs` | 76 | DocumentationRepository | getAll(), getAllWithMeta(), upsert(), ensureHeaders() |
| `04_Repository_Facts.gs` | 85 | FactsRepository | save(), getActive(), getSemanticFacts(), _cosineSimilarity() |
| `04_Repository_Knowledge.gs` | 130 | KnowledgeRepository | _getSheet(), _getAllRows(), get(), getByNamespace(), getAll(), save(), deactivate(), purgeInactive() |
| `04_Repository_Reminder.gs` | 127 | ReminderRepository, AckPatternsRepository | create(), _mapRow(), getAll(), getActive(), getMenungguRespon(), updateStatus(), updateTerakhirDiingatkan(), updateWaktu(), hitungWaktuBerikutnya(), formatDaftarAktifSebagaiTeks(), save(), getRecent() |
| `04_Repository_Transaction.gs` | 115 | TransactionRepository | create(), _mapRow(), getAll(), getActive(), getLastActive(), findById(), getByWallet(), getByKategoriAndPeriode(), softDelete(), update() |
| `04_Repository_Wallet.gs` | 85 | WalletRepository | create(), getAll(), findByName(), findById(), exists() |
| `05_Service_Telegram.gs` | 220 | TelegramService | pickPlaceholder(), sendMessage(), editMessage(), getFile(), downloadFileBlob(), transcribeVoiceNote(), analyzePhoto() |
| `06_Service_LLMProvider.gs` | 380 | LLMProviderService, OpenRouterProvider, GeminiProvider, GroqProvider | generate(), generateFromSinglePrompt(), getEmbedding(), _isModelBlacklisted(), _blacklistModel(), _shouldBlacklist() |
| `07_Service_WebSearchProvider.gs` | 130 | WebSearchProviderService, GoogleSearchProvider, TavilySearchProvider | getProviders(), search(), formatResultsAsContext(), isAnyConfigured() |
| `08_Specialist_ChangeDetector.gs` | 206 | ChangeDetector | runDetection(), runScheduledDetection(), _getCurrentFiles(), _simpleHash(), _getLatestSnapshot(), _saveSnapshot(), _compareWithSnapshot(), _buildReport(), _checkDocSync() |
| `08_Specialist_Chat.gs` | 92 | ChatSpecialist | buildSystemPersona(), needsWebSearch(), respondWithSearchContext(), _formatRiwayat() |
| `08_Specialist_CodeAuditor.gs` | 528 | CodeAuditor | runAudit(), runScheduledAudit(), fixIssues(), shouldOfferAudit(), _collectData(), _getSheetNames(), _analyzeInBatches(), _splitIntoBatches(), _buildAuditPrompt(), _parseFindings(), _deduplicateFindings(), _filterByScope(), _generateFixes(), _applyFixes(), _saveReport(), _saveFindings(), _getLatestPendingFindings(), _markFindingsFixed(), _getLastAuditDate() |
| `08_Specialist_DocSync.gs` | 181 | DocSyncSpecialist | sync(), _getCanonicalFiles(), _isCanonical(), _collectSourceMetadata(), _extractMethodSignatures(), _collectCurrentDocs(), _analyzeWithLLM(), _commitDocUpdate() |
| `08_Specialist_FeatureArchitect.gs` | 308 | FeatureArchitect | generateBlueprint(), implementBlueprint(), _generateAllCode(), _generateSingleFile(), _gatherProjectContext(), _saveBlueprint(), _getLatestBlueprint() |
| `08_Specialist_Finance.gs` | 280 | FinanceSpecialist | getValidOptions(), getAllSaldo(), getSaldoWallet(), resolveWalletAccount(), prepareDraft(), getPendingDraft(), clearDraft(), fulfillPendingField(), approveDraft(), _parseAmount(), _cleanNotes(), _parsePureDate() |
| `08_Specialist_Knowledge.gs` | 45 | KnowledgeSpecialist | saveFact(), saveManualFact(), saveAutoDetectedFacts(), getActiveFactsForPrompt(), findRelevantToKeyword() |
| `08_Specialist_KnowledgeSync.gs` | 150 | KnowledgeSyncSpecialist | sync(), bootstrap(), getExportNamespaces(), _pullFromGitHub(), pushSheetToGitHub(), handleCommand() |
| `08_Specialist_LLMIntelligence.gs` | 390 | LLMIntelligence | discoverModels(), benchmarkBatch(), rankModels(), setCooldown(), setDeprecated(), getRankedModelsForTask(), getRankedModelObjectsForTask(), runFullPipeline(), recordStat(), handleCommand() |
| `08_Specialist_Memory.gs` | 178 | MemorySpecialist | getLongTermMemory(), summarizeToday(), _getTodayChats(), _hasSummaryForToday(), _saveSummary() |
| `08_Specialist_ProjectBrain.gs` | 315 | ProjectBrain | buildRoadmapFromDiscussion(), syncRoadmapWithCode(), adaptRoadmapForNewIdea(), answerQuestion(), updateRoadmapStatus(), _readDoc(), _readItems(), _addItem(), _updateItemStatus(), _syncItemsToSheet(), _updateRoadmapContent() |
| `08_Specialist_Reminder.gs` | 155 | ReminderSpecialist | getMenungguRespon(), getReminderDueNow(), listActiveAsText(), getAckPatternsForPrompt(), create(), acknowledge(), getRemindersDueNow(), buildNotificationText(), markAsNotified(), _extractCleanKeywords(), _buildRelevantFactContext() |
| `08_Specialist_SelfAwareness.gs` | 185 | SelfAwareness | review(), buildCodeLineIndex(), searchCodeLocation(), _gatherSelfData() |
| `08_Specialist_SelfDocSync.gs` | 500 | SelfDocSync | runDailyCheck(), forceDocSync(), validateToolSchemaConsistency(), _readCodeStructure(), _repairLLMDocJSON(), _generateDocUpdate(), _collectCurrentDocs(), _saveDraft(), getPendingDraft(), parseApproval(), approveDraft(), rejectDraft() |
| `08_Specialist_SelfHealing.gs` | 395 | SelfHealingSpecialist | getLevel(), diagnose(), updateDocumentation(), applyPendingPatch(), _getRecentLogs(), _filterErrorLogs(), _identifySuspectFiles(), _askLLMForDiagnosis(), _applyToGitHub(), _savePatch(), _getPatchById(), _updatePatchStatus() |
| `08_Specialist_Soul.gs` | 460 | SoulSpecialist, SoulMemory | initializeSelf(), _patchIntentSchema(), getSelfModel(), updateSelfModel(), getIdentity(), updateIdentity(), getBeliefs(), addBelief(), getGrowthLog(), addGrowthEntry(), getEmotionalState(), updateEmotionalState(), getFullContext(), recordEpisode(), getRecentEpisodes(), getEpisodesByType(), addMetaInsight(), getMetaInsights() |
| `08_Specialist_SyncOrchestrator.gs` | 211 | SyncOrchestrator | assessState(), executeSync(), autoDocument(), _assessKnowledge(), _assessDocumentation(), _assessSheetStructure(), _getLastSyncTimestamp(), _saveSyncTimestamp(), _pullKnowledge(), _backupKnowledge(), _syncDocumentation(), _ensureSheets() |
| `08_Specialist_UserProfile.gs` | 145 | UserProfileSpecialist | saveUpdates(), getProfileForPrompt(), getByCategory(), _upsertProfile() |
| `08_Utils_PatchValidator.gs` | 208 | PatchValidator | validate(), _checkSyntax(), _checkStructuralSanity(), _checkSuspiciousPatterns(), formatResult() |
| `09_CommandRouter.gs` | 115 | CommandRouter | isKnownCommand(), handle(), _cleanCommand(), _handleIngat(), _getAIName(), _handleHelp() |
| `09_Manager.gs` | 580 | Manager | processConversationalMessage(), _checkAndSaveIdentityUpdate(), _handleFinanceApproval(), _gatherContext(), _planAndExecute(), _executeTool(), _buildPlanningPrompt(), _parseAgentPlan(), _handleFallback(), _enqueueAsyncTask(), _handleCatatKeuangan(), _handleTanyaSaldo() |
| `09_Manager_IntentAnalyzer.gs` | 95 | IntentAnalyzer | analyze(), _parseResponse(), _buildPrompt(), _formatRiwayat(), _formatList(), _formatReminder(), _formatPola() |
| `10_Handler_Webhook.gs` | 135 | WebhookHandler | handle(), _isAuthorized(), _isDuplicateUpdate(), _extractMessageContent(), _processMessage(), doPost() |
| `11_Trigger_MasterScheduler.gs` | 190 | MasterScheduler, Triggers | runDailyAutoSync(), setupDailyAutoSyncTrigger(), runDailySelfDocCheck(), setupDailySelfDocTrigger(), runScheduledAuditWrapper(), setupWeeklyTrigger(), cekDanKirimReminder(), setupReminderTrigger(), runDailyLLMDiscovery(), setupDailyLLMDiscovery(), runNightlySummarizerWrapper(), setupNightlySummarizer(), runWeeklyChangeCheckWrapper(), setupWeeklyChangeCheck(), runAsyncTaskWorkerWrapper() |
| `12_Service_GitHubBackup.gs` | 195 | GitHubBackupService | backupAllFiles(), backupDocs(), _syncDeletedFilesToGitHub(), _syncDeletedDocsToGitHub(), _deleteFileFromGitHub(), runFullBackup(), setupDailyBackupTrigger() |
| `13_Service_GitHubOps.gs` | 297 | GitHubOpsService | _getHeaders(), _getRepoUrl(), readFile(), listDirectory(), readAllSourceFiles(), createBranch(), createBackupBranch(), commitFile(), createPullRequest(), readDocFile(), updateDocFile() |
| `99_Audit_SyncSystem.gs` | 420 | AuditSyncSystem | audit_SyncSystem_Full(), audit_1_KoneksiSheet(), audit_2_KoneksiGitHub(), audit_3_GitHubKeSheet_Knowledge(), audit_4_SheetKeGitHub_Dokumentasi(), audit_5_FileMd_Identik(), audit_6_SelfDocSync(), audit_7_ChangeDetector(), audit_8_TriggerAktif() |
| `99_Heal_SyncSystem.gs` | 140 | HealSyncSystem | jalankan_Penyembuhan_Sinkronisasi_Total(), healer_SyncKnowledge_Force(), healer_SyncDocs_Force() |
| `99_TestSuite_Full.gs` | 922 | TestSuiteFull | _tLog(), _cleanupTestData(), test_Batch1_RepositoryCRUD(), test_Batch2_IntentDetection(), test_Batch3_LLMRouting(), test_Batch4_FinanceE2E(), test_Batch5_MemoryContext(), test_Batch6_Integration() |

## 4. Sheet/data contracts (13 Active Sheets)

| Sheet | Peran / Schema Utama |
|---|---|
| `Chat_History` | `id, timestamp, chatId, role, text` |
| `Memory_Facts` | `id, timestamp, chatId, category, fact, status, embedding` |
| `User_Profile` | `key, value, category, confidence, lastUpdated` |
| `Memory_Summaries` | `id, date, summary, topics, messageCount` |
| `Reminder_RawData` | `ID, TIMESTAMP, DESKRIPSI, WAKTU, STATUS, PRIORITAS, TERAKHIR_DIINGATKAN, CATATAN, JENIS_RECURRING, RECURRING_CONFIG, JUMLAH_DIINGATKAN` |
| `Reminder_AckPatterns` | `id, timestamp, pesanUser, interpretasi, aksi` |
| `Log_System` | `timestamp, jenisEvent, detail, status` |
| `AI_Knowledge` | `id, namespace, key, content, version, active, updated_at, notes` |
| `Documentation` | `fileName, content, sha, lastSyncedAt, fileType` |
| `LLM_Models` | `model_id, provider, display_name, is_free, context_length, quality_score, avg_latency_ms, status, cooldown_until, last_tested_at` |
| `SelfHeal_Patches` | `id, timestamp, fileName, diagnosis, patchedCode, status` |
| `Soul_Episodic_Memory` | `id, timestamp, event_type, context, outcome, emotional_state, details` |
| `Soul_Meta_Memory` | `id, timestamp, insight, source, confidence, applied` |

## 5. Configuration contract (Script Properties & Tracker V19.3)

Script Properties dibaca oleh `Config.load()`:
`TELEGRAM_BOT_TOKEN`, `MY_TELEGRAM_CHAT_ID`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `SPREADSHEET_ID`, `SHARED_SECRET`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`, `TAVILY_API_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BRANCH`, `OPENROUTER_API_KEY`, `TRACKING_SPREADSHEET_ID`, `MY_EMAIL`

## 6. Provider contract

### LLM
- OpenRouter: Live Discovery `:free` models dari ranked list + Native Function Calling.
- Gemini: Active model discovery dari `/models` + Gemini Vision API + Gemini Embedding API.
- Groq: Llama-3.3-70b-versatile + Groq Whisper API (Voice Note Transcriber).
- Fallback order: OpenRouter -> Gemini -> Groq.

### Web search
`WebSearchProviderService` mencoba provider configured secara berurutan: Google -> Tavily.

### Telegram
`sendMessage` dan `editMessage`; webhook mendukung Teks, Voice Note, & Foto Struk Belanja.

### GitHub
`readFile`, `listDirectory`, `readAllSourceFiles`, `createBranch`, `createBackupBranch`, `commitFile`, `createPullRequest`, `readDocFile`, `updateDocFile`.

## 7. Development protocol A-Z

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

## 8. Canonical documentation map

| File | Tugas |
|---|---|
| `ARCHITECTURE.md` | System design, flows, schemas, dependencies, source map. |
| `PROGRESS.md` | Current status, audit findings, tests, resolved gaps. |
| `ROADMAP.md` | Future work, migrations, technical debt. |
| `AI_DEVELOPMENT_HANDOVER.md` | Deep implementation/code reference. |
| `ai_knowledge.md` | Runtime knowledge/prompts/schema/routing. |

## 9. Working rule for future AI

1. baca `ARCHITECTURE.md` + `PROGRESS.md` untuk kondisi aktual;
2. baca `AI_DEVELOPMENT_HANDOVER.md` untuk implementation detail;
3. baca `ai_knowledge.md` untuk prompt/intent/runtime knowledge;
4. baca `ROADMAP.md` untuk konteks perubahan;
5. cari source symbol yang akan disentuh;
6. audit semua callers/callees;
7. implementasi minimal yang konsisten;
8. update tests;
9. update docs canonical yang terdampak;
10. laporkan changed files, behavior, tests, unresolved gaps.