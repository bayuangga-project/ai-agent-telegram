# 07 — Function & Method Reference

This index is derived from direct source inspection. Line numbers are intentionally omitted here because code changes can shift them; the authoritative target is the named function in the named file.

## `00_Config.gs`

| Symbol | Responsibility |
|---|---|
| `Config.load` | Loads Script Properties into a cached config object. |
| `Config.clearCache` | Clears config cache. |
| `Config.reload` | Clears then reloads config. |

## `01_SpreadsheetGateway.gs`

| Symbol | Responsibility |
|---|---|
| `SpreadsheetGateway.getSpreadsheet` | Opens configured spreadsheet lazily and caches Spreadsheet object. |
| `SpreadsheetGateway.getSheet` | Gets and caches a named sheet; throws when missing. |
| `SpreadsheetGateway.appendRowSafe` | Appends with up to 3 attempts and 1.5s sleep between failures. |

## `02_Utils.gs`

| Symbol | Responsibility |
|---|---|
| `IdGenerator.generate` | Creates PREFIX-timestamp identifiers. |
| `DateTimeUtils.toWIB` | Adds fixed +07:00 offset to a Date object. |
| `DateTimeUtils.nowWIB` | Returns current Date shifted by +7 hours. |
| `DateTimeUtils.formatWaktu` | Formats a Date as dd/MM/yyyy HH:mm WIB after applying toWIB. |
| `DateTimeUtils.formatUntukPrompt` | Formats a Date as dd/MM/yyyy HH:mm using UTC formatter. |
| `DateTimeUtils.formatPeriode` | Formats a Date as yyyy-MM after applying WIB conversion. |

## `03_AppLogger.gs`

| Symbol | Responsibility |
|---|---|
| `AppLogger.write` | Writes timestamp, event, detail, status to Log_System; swallows logger failures. |
| `AppLogger.info` | INFO wrapper. |
| `AppLogger.warning` | WARNING wrapper. |
| `AppLogger.error` | ERROR wrapper. |

## `04_Repository_Budget.gs`

| Symbol | Responsibility |
|---|---|
| `BudgetRepository.create` | Inserts budget row. |
| `BudgetRepository.getAll` | Reads all budget rows. |
| `BudgetRepository._normalizePeriode` | Normalizes Date/string period. |
| `BudgetRepository.findByKategoriAndPeriode` | Finds budget by category and yyyy-MM period. |
| `BudgetRepository.getByPeriode` | Lists budgets for a period. |
| `BudgetRepository.updateBatasJumlah` | Updates budget amount. |

## `04_Repository_ChatHistory.gs`

| Symbol | Responsibility |
|---|---|
| `ChatHistoryRepository.getRecent` | Reads last N chat records. |
| `ChatHistoryRepository.save` | Appends a chat message record. |

## `04_Repository_Documentation.gs`

| Symbol | Responsibility |
|---|---|
| `DocumentationRepository.getAll` | Reads fileName/content pairs from Documentation sheet. |

## `04_Repository_Facts.gs`

| Symbol | Responsibility |
|---|---|
| `FactsRepository.save` | Stores a fact with category and Active status. |
| `FactsRepository.getActive` | Reads active facts and returns the newest maxFacts entries. |

## `04_Repository_Reminder.gs`

| Symbol | Responsibility |
|---|---|
| `ReminderRepository.create` | Creates active reminder row. |
| `ReminderRepository._mapRow` | Maps sheet row into reminder object. |
| `ReminderRepository.getAll` | Reads all reminder rows. |
| `ReminderRepository.getActive` | Filters active reminders. |
| `ReminderRepository.getMenungguRespon` | Finds active reminders notified within configured window. |
| `ReminderRepository.updateStatus` | Updates reminder status. |
| `ReminderRepository.updateTerakhirDiingatkan` | Updates notification timestamp and count. |
| `ReminderRepository.updateWaktu` | Changes reminder time. |
| `ReminderRepository.hitungWaktuBerikutnya` | Advances recurring reminder by day/week/month. |
| `ReminderRepository.formatDaftarAktifSebagaiTeks` | Formats active reminders for Telegram. |
| `AckPatternsRepository.save` | Stores user acknowledgement phrase and inferred action. |
| `AckPatternsRepository.getRecent` | Reads recent acknowledgement patterns. |

## `04_Repository_Transaction.gs`

| Symbol | Responsibility |
|---|---|
| `TransactionRepository.create` | Creates active income/expense transaction. |
| `TransactionRepository._mapRow` | Maps transaction row. |
| `TransactionRepository.getAll` | Reads all transactions. |
| `TransactionRepository.getActive` | Filters active transactions. |
| `TransactionRepository.getLastActive` | Returns last active transaction. |
| `TransactionRepository.findById` | Finds active transaction by ID. |
| `TransactionRepository.getByWallet` | Filters active transactions by wallet. |
| `TransactionRepository.getByKategoriAndPeriode` | Filters active expenses/income by category and period. |
| `TransactionRepository.softDelete` | Marks transaction deleted. |
| `TransactionRepository.update` | Updates selected category/amount/description/wallet fields. |

## `04_Repository_Wallet.gs`

| Symbol | Responsibility |
|---|---|
| `WalletRepository.create` | Creates wallet. |
| `WalletRepository.getAll` | Reads wallets. |
| `WalletRepository.findByName` | Case-insensitive wallet lookup. |
| `WalletRepository.findById` | Looks up wallet by ID. |
| `WalletRepository.exists` | Checks wallet existence. |

## `05_Service_Telegram.gs`

| Symbol | Responsibility |
|---|---|
| `TelegramService.pickPlaceholder` | Selects a random progress placeholder. |
| `TelegramService.sendMessage` | Sends Markdown message; retries as plain text on Telegram entity parse failure. |
| `TelegramService.editMessage` | Edits Telegram message; falls back to send when messageId missing and retries plain text on parse failure. |

## `06_Service_LLMProvider.gs`

| Symbol | Responsibility |
|---|---|
| `LLMProviderService.generate` | Runs configured provider fallback chain and returns first success. |
| `LLMProviderService.generateFromSinglePrompt` | Convenience wrapper around generate for one user prompt. |

## `06_Service_LLM_Gemini.gs`

| Symbol | Responsibility |
|---|---|
| `GeminiProvider.call` | Calls Gemini generateContent for selected model. |

## `06_Service_LLM_Groq.gs`

| Symbol | Responsibility |
|---|---|
| `GroqProvider.call` | Calls Groq OpenAI-compatible chat completions with fixed model. |

## `06_Service_LLM_OpenRouter.gs`

| Symbol | Responsibility |
|---|---|
| `OpenRouterProvider.call` | Calls OpenRouter OpenAI-compatible chat completions. |

## `07_Service_WebSearchProvider.gs`

| Symbol | Responsibility |
|---|---|
| `WebSearchProviderService.getProviders` | Returns Google then Tavily provider list lazily. |
| `WebSearchProviderService.search` | Fallback search across providers. |
| `WebSearchProviderService.formatResultsAsContext` | Converts result objects to LLM context text. |
| `WebSearchProviderService.isAnyConfigured` | Checks provider availability. |

## `07_Service_WebSearch_Google.gs`

| Symbol | Responsibility |
|---|---|
| `GoogleSearchProvider.isConfigured` | Checks API key and CX ID. |
| `GoogleSearchProvider.search` | Calls Google Custom Search API, max 5 results. |

## `07_Service_WebSearch_Tavily.gs`

| Symbol | Responsibility |
|---|---|
| `TavilySearchProvider.isConfigured` | Checks Tavily API key. |
| `TavilySearchProvider.search` | Calls Tavily search, max 5 results. |

## `08_Specialist_ChangeDetector.gs`

| Symbol | Responsibility |
|---|---|
| `ChangeDetector.runDetection` | Manual detection; optional full docs/roadmap sync. |
| `ChangeDetector.runScheduledDetection` | Weekly scheduled detection, roadmap sync and Telegram report. |
| `ChangeDetector._getCurrentFiles` | Reads src .gs files and hashes content. |
| `ChangeDetector._simpleHash` | Computes a simple signed 32-bit style hash string. |
| `ChangeDetector._getLatestSnapshot` | Reads active Code_Snapshots hashes. |
| `ChangeDetector._saveSnapshot` | Archives active snapshot and writes current hashes. |
| `ChangeDetector._compareWithSnapshot` | Classifies added/modified/deleted files. |
| `ChangeDetector._buildReport` | Builds Telegram change report. |
| `ChangeDetector._checkDocSync` | Flags specialists/triggers/repositories that may require docs updates. |

## `08_Specialist_Chat.gs`

| Symbol | Responsibility |
|---|---|
| `ChatSpecialist.buildSystemPersona` | Returns BOT_PERSONA. |
| `ChatSpecialist.needsWebSearch` | Checks intent real-time search flag and query. |
| `ChatSpecialist.respondWithSearchContext` | Generates final answer from search results + history. |
| `ChatSpecialist._formatRiwayat` | Formats conversation history. |

## `08_Specialist_CodeAuditor.gs`

| Symbol | Responsibility |
|---|---|
| `CodeAuditor.runAudit` | Runs light/full codebase audit. |
| `CodeAuditor.runScheduledAudit` | Chooses light vs full based on day of month and sends report. |
| `CodeAuditor.fixIssues` | Generates and applies fixes for pending findings by scope. |
| `CodeAuditor.shouldOfferAudit` | Checks whether 7+ days since last audit. |
| `CodeAuditor._collectData` | Collects source files, sheet names, property keys, architecture/progress docs. |
| `CodeAuditor._getSheetNames` | Reads spreadsheet sheet names. |
| `CodeAuditor._analyzeInBatches` | Audits source batches with advanced LLM. |
| `CodeAuditor._splitIntoBatches` | Partitions files by numeric filename prefix. |
| `CodeAuditor._buildAuditPrompt` | Builds audit prompt with project rules and source. |
| `CodeAuditor._parseFindings` | Parses JSON findings. |
| `CodeAuditor._deduplicateFindings` | Deduplicates by file + first 50 chars of description. |
| `CodeAuditor._formatReportForChat` | Formats report and emits detail messages when large. |
| `CodeAuditor._filterByScope` | Filters pending findings. |
| `CodeAuditor._generateFixes` | Loads affected source and asks LLM for full-file fixes. |
| `CodeAuditor._applyFixes` | Validates, branches, commits, opens PR. |
| `CodeAuditor._saveReport` | Stores audit report and findings. |
| `CodeAuditor._saveFindings` | Stores individual pending findings. |
| `CodeAuditor._getLatestPendingFindings` | Reads all pending findings, newest first. |
| `CodeAuditor._markFindingsFixed` | Marks selected findings fixed. |
| `CodeAuditor._getLastAuditDate` | Reads latest audit report timestamp. |

## `08_Specialist_FeatureArchitect.gs`

| Symbol | Responsibility |
|---|---|
| `FeatureArchitect.generateBlueprint` | Generates structured implementation blueprint from idea and saves it. |
| `FeatureArchitect.implementBlueprint` | Generates code per file, validates, commits to feature branch, opens PR, updates roadmap status. |
| `FeatureArchitect._generateAllCode` | Generates all new/modified files one LLM call per file. |
| `FeatureArchitect._generateSingleFile` | Builds code-generation prompt and cleans markdown wrappers. |
| `FeatureArchitect._gatherProjectContext` | Reads current src files, sheets, known intents and commands. |
| `FeatureArchitect._saveBlueprint` | Stores blueprint in overloaded SelfHeal_Patches sheet. |
| `FeatureArchitect._getLatestBlueprint` | Reads newest pending BLUEPRINT record. |
| `FeatureArchitect._formatBlueprintForChat` | Formats blueprint for Telegram. |

## `08_Specialist_Finance.gs`

| Symbol | Responsibility |
|---|---|
| `FinanceSpecialist.resolveWallet` | Resolves named wallet; auto-creates if missing. |
| `FinanceSpecialist.getSaldoWallet` | Calculates wallet balance from opening balance + income - expense. |
| `FinanceSpecialist.getAllSaldoAsText` | Formats all wallet balances. |
| `FinanceSpecialist.recordTransaction` | Records transaction and optional budget alert. |
| `FinanceSpecialist.editLastTransaction` | Edits last active transaction. |
| `FinanceSpecialist.getRingkasanPeriode` | Aggregates income, expense and expenses by category. |
| `FinanceSpecialist.formatRingkasanAsText` | Formats period summary. |
| `FinanceSpecialist.createOrUpdateBudget` | Upserts budget by category/period. |
| `FinanceSpecialist._checkBudgetAlert` | Warns at 80%, alerts at >=100%. |
| `FinanceSpecialist._buildTransactionConfirmation` | Builds transaction confirmation. |
| `FinanceSpecialist._formatRupiah` | Formats integer amount with id-ID locale. |

## `08_Specialist_Knowledge.gs`

| Symbol | Responsibility |
|---|---|
| `KnowledgeSpecialist.saveFact` | Validates and stores a fact. |
| `KnowledgeSpecialist.saveManualFact` | Stores manual fact category. |
| `KnowledgeSpecialist.saveAutoDetectedFacts` | Stores auto-detected facts. |
| `KnowledgeSpecialist.getActiveFactsForPrompt` | Returns active facts. |
| `KnowledgeSpecialist.findRelevantToKeyword` | Simple substring relevance filter. |

## `08_Specialist_Memory.gs`

| Symbol | Responsibility |
|---|---|
| `MemorySpecialist.getLongTermMemory` | Returns recent daily summaries. |
| `MemorySpecialist.summarizeToday` | Summarizes >=4 messages for the current day via fast LLM. |
| `MemorySpecialist._getTodayChats` | Loads current-day chat rows. |
| `MemorySpecialist._hasSummaryForToday` | Prevents duplicate daily summary. |
| `MemorySpecialist._saveSummary` | Stores daily summary. |

## `08_Specialist_ProjectBrain.gs`

| Symbol | Responsibility |
|---|---|
| `ProjectBrain.buildRoadmapFromDiscussion` | Generates/updates ROADMAP.md and syncs roadmap items. |
| `ProjectBrain.syncRoadmapWithCode` | Compares roadmap artifacts with current src file list and updates items/docs. |
| `ProjectBrain.adaptRoadmapForNewIdea` | Evaluates idea against roadmap and may add an idea item. |
| `ProjectBrain.answerQuestion` | Answers roadmap/project questions using ROADMAP, PROGRESS and items. |
| `ProjectBrain._readDoc` | Reads a GitHub markdown document. |
| `ProjectBrain._readItems` | Reads Roadmap_Items into compact text. |
| `ProjectBrain._addItem` | Adds roadmap item. |
| `ProjectBrain._updateItemStatus` | Updates first roadmap item whose feature contains the target text. |
| `ProjectBrain._syncItemsToSheet` | Upserts roadmap items by exact case-insensitive feature match. |
| `ProjectBrain._updateRoadmapContent` | Asks LLM to rewrite ROADMAP.md for sync changes. |

## `08_Specialist_Reminder.gs`

| Symbol | Responsibility |
|---|---|
| `ReminderSpecialist.getMenungguRespon` | Returns reminders notified within 30 minutes. |
| `ReminderSpecialist.listActiveAsText` | Formats active reminders. |
| `ReminderSpecialist.getAckPatternsForPrompt` | Returns recent acknowledgement patterns. |
| `ReminderSpecialist.create` | Validates time and stores reminder. |
| `ReminderSpecialist.acknowledge` | Resolves reminder by ID and delegates done/snooze. |
| `ReminderSpecialist.getRemindersDueNow` | Filters active reminders due by current time/cooldown. |
| `ReminderSpecialist.buildNotificationText` | Builds reminder notification with optional fact context. |
| `ReminderSpecialist.markAsNotified` | Updates last-notified timestamp/count. |
| `ReminderSpecialist._isDueNow` | Checks due time and 5-minute cooldown. |
| `ReminderSpecialist._buildRelevantFactContext` | Adds first fact containing first reminder word. |
| `ReminderSpecialist._buildConfirmationText` | Formats create confirmation. |
| `ReminderSpecialist._handleDone` | Completes one-time reminder or advances recurring reminder. |
| `ReminderSpecialist._handleSnooze` | Moves reminder forward by requested/default 30 minutes. |

## `08_Specialist_SelfAwareness.gs`

| Symbol | Responsibility |
|---|---|
| `SelfAwareness.review` | Full or focused self-review. |
| `SelfAwareness.deepDive` | Focused review wrapper. |
| `SelfAwareness._fullReview` | Uses advanced LLM to produce 5-dimension self-review and stores it. |
| `SelfAwareness._focusedReview` | Deep-dive one dimension. |
| `SelfAwareness._formatFullReview` | Formats review for Telegram. |
| `SelfAwareness._gatherSelfData` | Collects code, sheets, intents, commands, errors, stats, user knowledge, roadmap items, previous review. |
| `SelfAwareness._saveReview` | Stores self-review summary. |
| `test_OpenRouterIntegration` | Simple integration test for fast LLM chain. |

## `08_Specialist_SelfHealing.gs`

| Symbol | Responsibility |
|---|---|
| `SelfHealingSpecialist.getLevel` | Reads SELF_HEAL_LEVEL and constrains it to 1..3. |
| `SelfHealingSpecialist.diagnose` | Uses recent error logs + suspect source to diagnose and optionally propose/apply patch. |
| `SelfHealingSpecialist.updateDocumentation` | Uses LLM to update legacy ARCHITECTURE/PROGRESS docs. |
| `SelfHealingSpecialist.applyPendingPatch` | Applies a pending saved patch. |
| `SelfHealingSpecialist._getRecentLogs` | Reads last N log rows. |
| `SelfHealingSpecialist._filterErrorLogs` | Filters FAIL/ERROR/BAD/RETRY or ERROR-status logs. |
| `SelfHealingSpecialist._identifySuspectFiles` | Maps error keywords to likely source files, always includes Manager. |
| `SelfHealingSpecialist._askLLMForDiagnosis` | Requests diagnosis + full patched file JSON. |
| `SelfHealingSpecialist._applyToGitHub` | Validates patch, creates backup/fix branch, commits and opens PR. |
| `SelfHealingSpecialist._formatPatchForChat` | Formats diagnosis/patch for user. |
| `SelfHealingSpecialist._formatDiagnosisOnly` | Formats diagnosis without patch. |
| `SelfHealingSpecialist._savePatch` | Stores pending patch. |
| `SelfHealingSpecialist._getPatchById` | Reads patch row; null ID selects first matching row. |
| `SelfHealingSpecialist._updatePatchStatus` | Marks latest pending patch for file as committed. |

## `08_Specialist_UserProfile.gs`

| Symbol | Responsibility |
|---|---|
| `UserProfileSpecialist.saveUpdates` | Upserts LLM-extracted profile entries. |
| `UserProfileSpecialist.getProfileForPrompt` | Returns newest profile entries as prompt strings. |
| `UserProfileSpecialist.getByCategory` | Returns profile entries with confidence and lastUpdated. |
| `UserProfileSpecialist._upsertProfile` | Updates by exact key or inserts with confidence 0.8. |

## `08_Utils_PatchValidator.gs`

| Symbol | Responsibility |
|---|---|
| `PatchValidator.validate` | Composite validation for empty code, syntax, structure and suspicious patterns. |
| `PatchValidator._checkSyntax` | Parses code via new Function without execution. |
| `PatchValidator._checkStructuralSanity` | Compares length and rough function-count ratios. |
| `PatchValidator._checkSuspiciousPatterns` | Detects import/require, classes, TODO/FIXME, console logging and placeholders. |
| `PatchValidator.formatResult` | Formats validation result. |

## `09_CommandRouter.gs`

| Symbol | Responsibility |
|---|---|
| `CommandRouter.isKnownCommand` | Recognizes supported slash commands and /ingat. |
| `CommandRouter.handle` | Dispatches direct commands. |
| `CommandRouter._handleIngat` | Stores explicit user fact. |

## `09_Manager.gs`

| Symbol | Responsibility |
|---|---|
| `Manager.processConversationalMessage` | Gathers context, analyzes intent, persists inferred memory/profile, routes action. |
| `Manager._gatherContext` | Builds history/facts/profile/LTM/reminder/ack-pattern context. |
| `Manager._persistAutoFacts` | Persists facts and profile updates from intent. |
| `Manager._routeIntent` | Dispatches intent types to specialists. |
| `Manager._handleAckReminder` | Handles reminder acknowledgements or falls back to chat. |
| `Manager._handleBuatReminder` | Creates reminder. |
| `Manager._handleDiagnoseError` | Runs self-healing diagnosis. |
| `Manager._handleUpdateDocs` | Updates docs via self-healing component. |
| `Manager._handleAuditCode` | Runs code audit. |
| `Manager._handleFixAudit` | Applies audit fixes. |
| `Manager._handleCheckChanges` | Runs change detector. |
| `Manager._handleRoadmapQuery` | Routes ask/build/adapt/alignment actions. |
| `Manager._handleImplementFeature` | Runs feature implementation. |
| `Manager._handleSelfQuery` | Runs self-awareness review. |
| `Manager._handleChatBiasa` | Chooses web-search, heavy, or intent response path. |
| `Manager._handleHeavyChat` | Escalates ordinary chat to advanced chain. |
| `Manager._handleChatWithWebSearch` | Executes search + grounded chat response. |
| `Manager._handleIntentFailure` | Advanced LLM fallback when intent analysis fails. |

## `09_Manager_IntentAnalyzer.gs`

| Symbol | Responsibility |
|---|---|
| `IntentAnalyzer.analyze` | Builds context prompt, invokes fast chain, parses strict JSON. |
| `IntentAnalyzer._parseResponse` | Strips markdown fences and JSON-parses intent. |
| `IntentAnalyzer._buildPrompt` | Composes persona/time/history/facts/profile/LTM/reminders/patterns + schema/rules. |
| `IntentAnalyzer._personaSection` | Returns BOT_PERSONA. |
| `IntentAnalyzer._riwayatSection` | Formats recent history. |
| `IntentAnalyzer._factsSection` | Formats facts. |
| `IntentAnalyzer._profileSection` | Formats profile. |
| `IntentAnalyzer._ltmSection` | Formats LTM. |
| `IntentAnalyzer._reminderSection` | Formats reminders awaiting response. |
| `IntentAnalyzer._patternSection` | Formats acknowledgement patterns. |
| `IntentAnalyzer._outputSchemaSection` | Defines supported intent JSON schema. |
| `IntentAnalyzer._rulesSection` | Defines classification rules. |

## `10_Handler_Webhook.gs`

| Symbol | Responsibility |
|---|---|
| `WebhookHandler.handle` | Validates secret, deduplicates update, authorizes chat, delegates message. |
| `WebhookHandler._isAuthorized` | Compares query parameter secret with shared secret. |
| `WebhookHandler._isDuplicateUpdate` | Uses script cache with 6-hour update_id TTL. |
| `WebhookHandler._processMessage` | Direct command fast path or conversational Manager path. |
| `doPost` | Global GAS web app entry point. |

## `11_Trigger_AuditScheduler.gs`

| Symbol | Responsibility |
|---|---|
| `AuditScheduler.runScheduledAudit` | Delegates scheduled audit with error logging. |
| `AuditScheduler.setupWeeklyTrigger` | Creates Monday 07:00 trigger after removing old wrapper triggers. |
| `AuditScheduler._deleteExistingTriggers` | Deletes existing audit wrapper triggers. |
| `runScheduledAuditWrapper` | Global trigger wrapper. |
| `setupWeeklyTrigger` | Global setup wrapper. |

## `11_Trigger_MemorySummarizer.gs`

| Symbol | Responsibility |
|---|---|
| `MemorySummarizerTrigger.setupNightlyTrigger` | Creates daily 23:30 wrapper trigger. |
| `MemorySummarizerTrigger._deleteExistingTriggers` | Deletes prior summarizer wrapper triggers. |
| `runNightlySummarizerWrapper` | Global trigger wrapper. |
| `setupNightlySummarizer` | Global setup wrapper. |

## `11_Trigger_ReminderChecker.gs`

| Symbol | Responsibility |
|---|---|
| `cekDanKirimReminder` | Checks due reminders every minute, sends and marks notified. |
| `setupReminderTrigger` | Creates every-minute reminder trigger. |

## `11_Trigger_WeeklyChangeCheck.gs`

| Symbol | Responsibility |
|---|---|
| `WeeklyChangeCheckTrigger.setupWeeklyTrigger` | Creates Sunday 20:00 wrapper trigger. |
| `WeeklyChangeCheckTrigger._deleteExistingTriggers` | Deletes prior change-check wrappers. |
| `runWeeklyChangeCheckWrapper` | Global trigger wrapper. |
| `setupWeeklyChangeCheck` | Global setup wrapper. |

## `12_Service_GitHubBackup.gs`

| Symbol | Responsibility |
|---|---|
| `GitHubBackupService.backupAllFiles` | Reads own Apps Script source via Apps Script API and pushes files to GitHub. |
| `GitHubBackupService.backupDocs` | Pushes documentation sheet contents. |
| `GitHubBackupService._loadGitHubConfig` | Loads GitHub token/repo/branch. |
| `GitHubBackupService._fetchOwnSourceFiles` | Reads project content using Script OAuth token. |
| `GitHubBackupService._resolveFilePath` | Maps API file types to src paths. |
| `GitHubBackupService._pushFileToGitHub` | PUTs file content to GitHub branch. |
| `GitHubBackupService._getExistingFileSha` | Gets current SHA for update. |
| `runFullBackup` | Manual complete source+docs backup entry point. |
| `setupDailyBackupTrigger` | Creates daily 23:00 backup trigger. |

## `13_Service_GitHubOps.gs`

| Symbol | Responsibility |
|---|---|
| `GitHubOpsService._getHeaders` | Builds GitHub API headers. |
| `GitHubOpsService._getRepoUrl` | Builds repo API base URL. |
| `GitHubOpsService.readFile` | Reads a repository file and decodes Base64. |
| `GitHubOpsService.listDirectory` | Lists a repo directory. |
| `GitHubOpsService.readAllSourceFiles` | Reads all .gs files under src. |
| `GitHubOpsService.createBranch` | Creates a branch from configured base branch. |
| `GitHubOpsService.createBackupBranch` | Creates backup/pre-fix-* branch. |
| `GitHubOpsService.commitFile` | Creates/updates a file through contents API. |
| `GitHubOpsService.createPullRequest` | Creates GitHub PR. |
| `GitHubOpsService.readDocFile` | Alias for readFile. |
| `GitHubOpsService.updateDocFile` | Commits doc file and syncs its contents into Documentation sheet. |

## `99_Tests.gs`

| Symbol | Responsibility |
|---|---|
| `test_Batch7b_FinanceSpecialist` | Exercises income, expense, budget alert, edit and period summary. |
| `debug_CheckOAuthScopes` | Logs OAuth token scope response. |
| `debug_CheckGitHubConfig` | Checks GitHub properties and repo visibility; logs first 4 token chars. |
| `test_TelegramMarkdownFallback` | Exercises placeholder, malformed Markdown edit and fallback path. |

