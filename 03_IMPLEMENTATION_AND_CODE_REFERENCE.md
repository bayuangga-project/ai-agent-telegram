# 03 — Implementasi, Referensi Modul / Function, Prompt & Skema

## 1. Inventaris source code

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
| Config | 00_Config.gs | Memuat Script Properties sekali, mengekspos konfigurasi runtime, dan mendukung invalidasi/reload cache. |
| SpreadsheetGateway | 01_SpreadsheetGateway.gs | Layer akses Google Sheets terpusat dengan cache spreadsheet/sheet dan safe row append yang dilindungi lock. |
| IdGenerator | 02_Utils.gs | Menghasilkan ID berbasis timestamp dengan prefix dari pemanggil. |
| DateTimeUtils | 02_Utils.gs | Helper konversi WIB serta format tanggal untuk manusia/prompt/periode. |
| AppLogger | 03_AppLogger.gs | Logging event best-effort ke Log_Sistem; kegagalan logging ditelan agar tidak mematikan alur utama. |
| BudgetRepository | 04_Repository_Budget.gs | Persistence dan query untuk anggaran kategori/periode. |
| ChatHistoryRepository | 04_Repository_ChatHistory.gs | Menyimpan pesan chat dan mengembalikan pesan terbaru. |
| DocumentationRepository | 04_Repository_Documentation.gs | Reads documentation records stored in the Documentation sheet. |
| FactsRepository | 04_Repository_Facts.gs | Stores active long-term facts and returns a bounded active set. |
| ReminderRepository | 04_Repository_Reminder.gs | Persistence, status changes, recurrence timing, acknowledgement patterns, and reminder history. |
| AckPatternsRepository | 04_Repository_Reminder.gs | Stores/retrieves reminder acknowledgement behavior patterns. |
| TransactionRepository | 04_Repository_Transaction.gs | Persistence and queries for active/deleted finance transactions. |
| WalletRepository | 04_Repository_Wallet.gs | CRUD/read helpers for finance wallets. |
| TelegramService | 05_Service_Telegram.gs | Telegram Bot API adapter with Markdown send/edit behavior and Markdown fallback. |
| LLMProviderService | 06_Service_LLMProvider.gs | Task-oriented LLM fallback orchestrator over OpenRouter, Gemini and Groq. |
| GeminiProvider | 06_Service_LLM_Gemini.gs | Direct Google Gemini generateContent HTTP adapter. |
| GroqProvider | 06_Service_LLM_Groq.gs | Direct Groq OpenAI-compatible chat completion adapter. |
| OpenRouterProvider | 06_Service_LLM_OpenRouter.gs | Direct OpenRouter OpenAI-compatible chat completion adapter. |
| WebSearchProviderService | 07_Service_WebSearchProvider.gs | Search orchestrator; tries configured providers sequentially and formats results as LLM context. |
| GoogleSearchProvider | 07_Service_WebSearch_Google.gs | Google Custom Search JSON API adapter. |
| TavilySearchProvider | 07_Service_WebSearch_Tavily.gs | Tavily search API adapter. |
| ChangeDetector | 08_Specialist_ChangeDetector.gs | Compares current Apps Script source against persisted snapshots and checks documentation synchronization. |
| ChatSpecialist | 08_Specialist_Chat.gs | General conversational response layer; decides whether web search is needed and builds search-grounded responses. |
| CodeAuditor | 08_Specialist_CodeAuditor.gs | LLM-assisted code/system audit, finding persistence, scope filtering and fix generation. |
| FeatureArchitect | 08_Specialist_FeatureArchitect.gs | Turns feature ideas into a blueprint and optionally generates implementation code. |
| FinanceSpecialist | 08_Specialist_Finance.gs | Wallet resolution, transaction recording/editing, period summaries and budget operations. |
| KnowledgeSpecialist | 08_Specialist_Knowledge.gs | Fact/memory interface used by agent context gathering and keyword retrieval. |
| MemorySpecialist | 08_Specialist_Memory.gs | Builds long-term memory context and nightly daily summaries from chat history. |
| ProjectBrain | 08_Specialist_ProjectBrain.gs | Roadmap generation, synchronization/adaptation to code, roadmap question answering and documentation maintenance. |
| ReminderSpecialist | 08_Specialist_Reminder.gs | Reminder lifecycle, acknowledgement, due-now detection, notifications and recurring handling. |
| SelfAwareness | 08_Specialist_SelfAwareness.gs | Reviews system state/capabilities and persists self-review reports. |
| SelfHealingSpecialist | 08_Specialist_SelfHealing.gs | Diagnoses reported errors, generates documentation or patches, validates patches and manages patch state. |
| UserProfileSpecialist | 08_Specialist_UserProfile.gs | Stores/upserts user profile attributes and formats bounded prompt context. |
| PatchValidator | 08_Utils_PatchValidator.gs | Static syntax/structural/suspicious-pattern checks for generated patches; not runtime/behavioral validation. |
| CommandRouter | 09_CommandRouter.gs | Handles explicit slash commands separately from conversational intent routing. |
| Manager | 09_Manager.gs | Primary conversational orchestration layer from context gathering through intent dispatch and specialist execution. |
| IntentAnalyzer | 09_Manager_IntentAnalyzer.gs | LLM-based intent classifier/parser with structured JSON schema and rich context sections. |
| WebhookHandler | 10_Handler_Webhook.gs | Validates inbound Telegram webhook requests, suppresses duplicates, and forwards messages to Manager. |
| AuditScheduler | 11_Trigger_AuditScheduler.gs | Time-based audit trigger setup and scheduled execution wrapper. |
| MemorySummarizerTrigger | 11_Trigger_MemorySummarizer.gs | Nightly memory summary trigger setup. |
| WeeklyChangeCheckTrigger | 11_Trigger_WeeklyChangeCheck.gs | Weekly source change detection trigger setup. |
| GitHubBackupService | 12_Service_GitHubBackup.gs | Backs up Apps Script source/docs to GitHub using content-addressed SHA updates. |
| GitHubOpsService | 13_Service_GitHubOps.gs | Reads repository files/directories, reads all source files, creates branches, commits files, opens PRs and updates docs. |


## 3. Function/method reference

The following inventory is generated from the executable source by scanning the object literal method declarations. Line numbers are source anchors, not a guarantee of semantic stability after edits.

### `00_Config.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| load | — | 10 | Load and cache script properties. |
| clearCache | — | 40 | Clear the in-memory configuration cache. |
| reload | — | 44 | Clear cache and immediately reload configuration. |


### `01_SpreadsheetGateway.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| getSpreadsheet | — | 10 | Open configured Google Spreadsheet once and cache the object. |
| getSheet | sheetName | 17 | Return a named sheet and cache it; throws if missing. |
| appendRowSafe | sheetName, rowData | 31 | Acquire script lock and append one row safely. |


### `02_Utils.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| generate | prefix | 16 | Select a chain and run provider fallbacks. |
| toWIB | date | 24 | Convert a Date by applying a +7 hour offset. |
| nowWIB | — | 28 | Return current time converted through toWIB. |
| formatWaktu | date | 32 | Format a date for human-readable reminder output. |
| formatUntukPrompt | date | 37 | Format date/time for prompt context. |
| formatPeriode | date | 48 | Format date as period key (year-month). |


### `03_AppLogger.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| write | jenisEvent, detail, status | 9 | Write structured system event to Log_Sistem, swallowing logger failures. |
| info | jenisEvent, detail | 20 | Write INFO log. |
| warning | jenisEvent, detail | 21 | Write WARNING log. |
| error | jenisEvent, detail | 22 | Write ERROR log. |


### `04_Repository_Budget.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| create | kategori, batasJumlah, periode | 9 | Persist a new entity. |
| getAll | — | 17 | Read all rows into normalized objects. |
| _normalizePeriode | value | 39 | Normalize a period value into the expected period representation. |
| findByKategoriAndPeriode | kategori, periode | 46 | Find budget/transaction records by category and period. |
| getByPeriode | periode | 50 | Return budgets for a period. |
| updateBatasJumlah | rowIndex, batasJumlahBaru | 54 | Update a budget limit in-place. |


### `04_Repository_ChatHistory.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| getRecent | limit | 9 | Return the latest N chat records. |
| save | chatId, role, text | 21 | Persist a fact/message/history/ack pattern as appropriate. |


### `04_Repository_Documentation.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| getAll | — | 13 | Read all rows into normalized objects. |


### `04_Repository_Facts.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| save | chatId, factText, category | 10 | Persist a fact/message/history/ack pattern as appropriate. |
| getActive | maxFacts | 17 | Return only active records. |


### `04_Repository_Reminder.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| create | data | 17 | Persist a new entity. |
| _mapRow | row, rowIndex | 27 | Map raw sheet row into domain object. |
| getAll | — | 43 | Read all rows into normalized objects. |
| getActive | — | 52 | Return only active records. |
| getMenungguRespon | batasMenit | 56 | Find reminders awaiting acknowledgement within a time window. |
| updateStatus | rowIndex, status | 67 | Update reminder/record status by row. |
| updateTerakhirDiingatkan | rowIndex, jumlahBaru | 72 | Update reminder notification count/time metadata. |
| updateWaktu | rowIndex, waktuBaru | 78 | Change reminder time. |
| hitungWaktuBerikutnya | reminder | 83 | Calculate next occurrence for recurring reminder. |
| formatDaftarAktifSebagaiTeks | — | 91 | Render active reminders as text. |
| save | pesanUser, interpretasi, aksi | 108 | Persist a fact/message/history/ack pattern as appropriate. |
| getRecent | limit | 114 | Return the latest N chat records. |


### `04_Repository_Transaction.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| create | data | 18 | Persist a new entity. |
| _mapRow | row, rowIndex | 28 | Map raw sheet row into domain object. |
| getAll | — | 43 | Read all rows into normalized objects. |
| getActive | — | 52 | Return only active records. |
| getLastActive | — | 56 | Get latest active transaction. |
| findById | id | 61 | Find wallet by ID. |
| getByWallet | walletId | 65 | Query transactions for a wallet. |
| getByKategoriAndPeriode | kategori, tahunBulan | 69 | Query transactions by category and YYYY-MM period. |
| softDelete | rowIndex | 76 | Mark transaction as deleted instead of removing row. |
| update | rowIndex, updatedFields | 81 | Update selected transaction fields. |


### `04_Repository_Wallet.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| create | nama, saldoAwal | 9 | Persist a new entity. |
| getAll | — | 17 | Read all rows into normalized objects. |
| findByName | nama | 32 | Find wallet by exact/name matching logic. |
| findById | id | 37 | Find wallet by ID. |
| exists | nama | 41 | Check wallet existence. |


### `05_Service_Telegram.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| pickPlaceholder | — | 14 | Choose a random processing placeholder. |
| sendMessage | chatId, text | 19 | Send Telegram message using Markdown with fallback behavior. |
| editMessage | chatId, messageId, text | 67 | Edit Telegram message with Markdown/fallback behavior. |


### `06_Service_LLMProvider.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| generate | params | 69 | Select a chain and run provider fallbacks. |
| generateFromSinglePrompt | promptText, temperature, chain | 92 | Convenience wrapper for a single prompt call. |


### `06_Service_LLM_Gemini.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| call | systemInstruction, messages, temperature, modelName | 12 | Execute direct HTTP request to a specific LLM provider. |


### `06_Service_LLM_Groq.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| call | systemInstruction, messages, temperature | 11 | Execute direct HTTP request to a specific LLM provider. |


### `06_Service_LLM_OpenRouter.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| call | systemInstruction, messages, temperature, modelName | 19 | Execute direct HTTP request to a specific LLM provider. |


### `07_Service_WebSearchProvider.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| getProviders | — | 15 | Lazily return configured search provider objects. |
| search | query | 19 | Execute search with provider fallback. |
| formatResultsAsContext | results | 36 | Convert search results into LLM-ready context text. |
| isAnyConfigured | — | 44 | Check whether at least one search provider is configured. |


### `07_Service_WebSearch_Google.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| isConfigured | — | 11 | Return whether the provider has required credentials. |
| search | query | 16 | Execute search with provider fallback. |


### `07_Service_WebSearch_Tavily.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| isConfigured | — | 12 | Return whether the provider has required credentials. |
| search | query | 16 | Execute search with provider fallback. |


### `08_Specialist_ChangeDetector.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| runDetection | mode | 9 | Compare current source with last snapshot and report changes/doc sync. |
| runScheduledDetection | — | 53 | Scheduled change detection entry point. |
| _getCurrentFiles | — | 96 | Fetch current source files from the configured environment/repository. |
| _simpleHash | str | 111 | Create a simple string hash for change detection. |
| _getLatestSnapshot | — | 121 | Load most recent persisted snapshot. |
| _saveSnapshot | currentFiles | 138 | Persist current snapshot source. |
| _compareWithSnapshot | currentFiles, snapshot | 159 | Calculate added/changed/deleted files. |
| _buildReport | changes | 172 | Render human-readable change report. |
| _checkDocSync | changes | 193 | Detect documentation synchronization gaps. |


### `08_Specialist_Chat.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| buildSistemPersona | — | 9 | Build conversational persona/system instruction. |
| needsWebSearch | intent | 13 | Determine whether intent requires web search. |
| respondWithSearchContext | userMessage, searchResults, riwayat | 17 | Answer using search results plus conversation history. |
| _formatRiwayat | riwayat | 40 | Format recent conversation for prompt context. |


### `08_Specialist_CodeAuditor.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| runAudit | type | 12 | Run requested code/system audit. |
| runScheduledAudit | — | 41 | Run scheduled audit wrapper. |
| fixIssues | scope | 56 | Generate/apply candidate fixes for audit findings. |
| shouldOfferAudit | — | 85 | Determine whether an audit should be offered. |
| _collectData | — | 99 | Collect source/system data for audit. |
| _getSheetNames | — | 137 | Enumerate available Sheets. |
| _analyzeInBatches | data, categories | 151 | Analyze source in batches to control prompt size. |
| _splitIntoBatches | files | 177 | Split files into audit batches. |
| _buildAuditPrompt | batch, data, categories | 198 | Build audit prompt for a batch. |
| _parseFindings | rawText | 245 | Parse structured LLM findings. |
| _deduplicateFindings | findings | 262 | Remove duplicate findings. |
| _filterByScope | findings, scope | 372 | Filter findings by requested scope. |
| _generateFixes | findings | 385 | Generate proposed fixes from findings. |
| _saveReport | findings, type | 591 | Persist audit report. |
| _saveFindings | reportId, findings | 611 | Persist individual findings. |
| _getLatestPendingFindings | — | 626 | Load newest pending findings. |
| _markFindingsFixed | findings | 649 | Mark findings as fixed. |
| _getLastAuditDate | — | 667 | Read the last audit timestamp. |


### `08_Specialist_FeatureArchitect.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| generateBlueprint | idea | 21 | Generate structured feature/implementation blueprint. |
| implementBlueprint | idea | 104 | Implement a blueprint by generating code files. |
| _generateAllCode | blueprint, context, idea | 255 | Generate all files described by blueprint. |
| _generateSingleFile | fileSpec, blueprint, context, idea | 305 | Generate one file implementation. |
| _gatherProjectContext | — | 352 | Gather architecture/source/docs context for feature generation. |
| _saveBlueprint | blueprint, idea | 375 | Persist blueprint. |
| _getLatestBlueprint | — | 393 | Load latest blueprint. |
| _formatBlueprintForChat | bp | 409 | Render blueprint for user-facing response. |


### `08_Specialist_Finance.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| resolveWallet | namaWallet | 22 | Resolve wallet reference to a wallet ID/object. |
| getSaldoWallet | walletId | 35 | Calculate wallet balance. |
| getAllSaldoAsText | — | 50 | Render all wallet balances. |
| recordTransaction | data | 68 | Persist a finance transaction and run budget alert checks. |
| editLastTransaction | updatedFields | 95 | Modify the most recent active transaction. |
| getRingkasanPeriode | periode | 114 | Aggregate finance state for a period. |
| formatRingkasanAsText | ringkasan | 140 | Render finance summary. |
| createOrUpdateBudget | kategori, batasJumlah, periode | 161 | Create or update category budget. |
| _checkBudgetAlert | kategori, tanggalTransaksi | 174 | Check whether transaction crosses budget condition. |
| _buildTransactionConfirmation | data, wallet, saldoTerbaru | 202 | Build transaction confirmation text. |
| _formatRupiah | angka | 214 | Format number as Indonesian Rupiah. |


### `08_Specialist_Knowledge.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| saveFact | chatId, factText, category | 11 | Save a fact into long-term memory. |
| saveManualFact | chatId, factText | 17 | Save an explicitly supplied fact. |
| saveAutoDetectedFacts | chatId, facts | 21 | Persist automatically detected facts. |
| getActiveFactsForPrompt | limit | 30 | Return bounded active facts for context. |
| findRelevantToKeyword | keyword, limit | 34 | Find facts relevant to a keyword. |


### `08_Specialist_Memory.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| getLongTermMemory | maxDays | 14 | Build long-term memory context from summaries. |
| summarizeToday | — | 49 | Summarize today's chat history and persist the result. |
| _getTodayChats | — | 108 | Load today's messages. |
| _hasSummaryForToday | — | 145 | Detect whether today already has a summary. |
| _saveSummary | summary, topics, messageCount | 167 | Persist summary metadata and content. |


### `08_Specialist_ProjectBrain.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| buildRoadmapFromDiscussion | userInput | 23 | Create roadmap items from a discussion. |
| syncRoadmapWithCode | — | 107 | Align roadmap state with current code. |
| adaptRoadmapForNewIdea | idea | 201 | Adapt roadmap to a newly proposed idea. |
| answerQuestion | question | 296 | Answer roadmap/project status questions. |
| _readDoc | fileName | 325 | Read a documentation document from repository/storage. |
| _readItems | — | 330 | Read roadmap items. |
| _addItem | feature, category, priority, status, notes | 350 | Add roadmap item. |
| _updateItemStatus | feature, newStatus | 364 | Change roadmap item status. |
| _syncItemsToSheet | items | 382 | Persist roadmap items to the backing sheet. |
| _updateRoadmapContent | changesDescription | 408 | Write roadmap/documentation changes. |


### `08_Specialist_Reminder.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| getMenungguRespon | — | 12 | Find reminders awaiting acknowledgement within a time window. |
| listActiveAsText | — | 16 | See source implementation. |
| getAckPatternsForPrompt | limit | 20 | See source implementation. |
| create | reminderData | 24 | Persist a new entity. |
| acknowledge | pesanUserAsli, ackIntent, remindersMenunggu | 44 | Process a user acknowledgement against pending reminders. |
| getRemindersDueNow | — | 57 | See source implementation. |
| buildNotificationText | reminder | 62 | Build reminder notification text. |
| markAsNotified | reminder | 72 | Record reminder notification. |
| _isDueNow | reminder, now | 79 | Check due-window eligibility. |
| _buildRelevantFactContext | reminder | 90 | Attach relevant facts to reminder context. |
| _buildConfirmationText | data | 96 | Build reminder confirmation. |
| _handleDone | pesanUserAsli, intent, target | 105 | Handle completed reminder acknowledgement. |
| _handleSnooze | pesanUserAsli, intent, target | 122 | Handle snooze acknowledgement. |


### `08_Specialist_SelfAwareness.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| review | focus | 22 | Run a self-awareness review. |
| deepDive | dimension | 37 | Run a focused review for one dimension. |
| _fullReview | data | 48 | Perform full self-review analysis. |
| _focusedReview | data, dimension | 125 | Perform dimension-specific self-review. |
| _formatFullReview | r | 204 | Format review result. |
| _gatherSelfData | — | 260 | Collect system state/capability data. |
| _saveReview | result | 359 | Persist review. |


### `08_Specialist_SelfHealing.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| getLevel | — | 8 | Read configured self-healing level. |
| diagnose | keluhanUser | 18 | Diagnose a reported issue and propose repair path. |
| updateDocumentation | instruction | 56 | Generate/update documentation from an instruction. |
| applyPendingPatch | patchId | 131 | Validate/apply a pending patch through GitHub flow. |
| _getRecentLogs | count | 148 | Read recent system logs. |
| _filterErrorLogs | logs | 169 | Select relevant error logs. |
| _identifySuspectFiles | errorLogs, keluhan | 180 | Identify likely affected files. |
| _askLLMForDiagnosis | keluhan, errorLogs, sourceMap | 208 | Ask the LLM for diagnosis/patch information. |
| _formatPatchForChat | diagnosis | 374 | Render patch proposal for chat. |
| _formatDiagnosisOnly | diagnosis, errorLogs | 390 | Render diagnosis only. |
| _savePatch | diagnosis | 409 | Persist a generated patch. |
| _getPatchById | patchId | 428 | Load patch by ID. |
| _updatePatchStatus | fileName, newStatus | 450 | Update patch lifecycle status. |


### `08_Specialist_UserProfile.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| saveUpdates | updates | 12 | Persist profile updates. |
| getProfileForPrompt | maxItems | 31 | Format bounded user profile context. |
| getByCategory | category | 64 | Return profile values by category. |
| _upsertProfile | key, value, category | 91 | Insert or update one profile key. |


### `08_Utils_PatchValidator.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| validate | patchedCode, originalCode, fileName | 15 | Run syntax, structural and suspicious-pattern validation over generated code. |
| _checkSyntax | code | 77 | Perform lightweight syntax validation. |
| _checkStructuralSanity | patched, original | 95 | Check patch structure against original. |
| _checkSuspiciousPatterns | code | 138 | Detect risky/suspicious code patterns. |
| formatResult | result | 190 | Format validator result. |


### `09_CommandRouter.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| isKnownCommand | text | 10 | Recognize supported slash commands. |
| handle | chatId, text | 20 | Handle webhook payload. |
| _handleIngat | chatId, text | 56 | Handle reminder creation command. |


### `09_Manager.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| processConversationalMessage | chatId, text | 7 | End-to-end conversational orchestration. |
| _gatherContext | — | 15 | Collect history, facts, profile, LTM and reminders for intent analysis. |
| _persistAutoFacts | chatId, intent | 26 | Persist facts/profile updates returned by intent analysis. |
| _routeIntent | chatId, text, intent, context | 33 | Dispatch parsed intent to specialist handlers. |
| _handleAckReminder | chatId, text, intent, context | 57 | Handle reminder acknowledgement. |
| _handleBuatReminder | intent | 63 | Create a reminder. |
| _handleDiagnoseError | chatId, text, intent | 67 | Run self-healing diagnosis. |
| _handleUpdateDocs | chatId, text, intent | 75 | Update documentation. |
| _handleAuditCode | chatId, text, intent | 83 | Run code audit. |
| _handleFixAudit | chatId, text, intent | 91 | Fix audit findings. |
| _handleCheckChanges | chatId, text, intent | 99 | Check code changes. |
| _handleRoadmapQuery | chatId, text, intent | 107 | Query/build/adapt/sync roadmap. |
| _handleImplementFeature | chatId, text, intent | 121 | Generate/implement feature blueprint. |
| _handleSelfQuery | chatId, text, intent | 129 | Answer self-awareness query. |
| _handleChatBiasa | chatId, text, intent, riwayat | 137 | Handle normal chat. |
| _handleHeavyChat | text, intent, riwayat | 150 | Handle heavy-complexity chat through advanced LLM chain. |
| _handleChatWithWebSearch | text, intent, riwayat | 162 | Handle web-grounded chat. |
| _handleIntentFailure | chatId, text, riwayat | 167 | Fallback response when intent parsing fails. |


### `09_Manager_IntentAnalyzer.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| analyze | userMessage, context | 7 | Analyze a user message into a structured intent. |
| _parseResponse | rawText, providerName | 17 | Parse/validate raw LLM intent JSON. |
| _buildPrompt | userMessage, context | 31 | Build the intent-analysis prompt. |
| _personaSection | — | 49 | Inject persona rules. |
| _riwayatSection | r | 51 | Inject recent conversation. |
| _factsSection | f | 58 | Inject facts. |
| _profileSection | p | 63 | Inject profile. |
| _ltmSection | l | 68 | Inject long-term memory. |
| _reminderSection | r | 73 | Inject reminders. |
| _patternSection | p | 79 | Inject learned patterns. |
| _outputSchemaSection | — | 85 | Define output JSON schema. |
| _rulesSection | — | 118 | Define classification rules. |


### `10_Handler_Webhook.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| handle | e | 11 | Handle webhook payload. |
| _isAuthorized | e, config | 48 | Validate webhook shared-secret authorization. |
| _isDuplicateUpdate | contents | 52 | Prevent processing duplicate Telegram update IDs. |
| _processMessage | chatId, text | 64 | Extract and process message text. |


### `11_Trigger_AuditScheduler.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| runScheduledAudit | — | 13 | Run scheduled audit wrapper. |
| setupWeeklyTrigger | — | 28 | Create the corresponding time-based trigger. |
| _deleteExistingTriggers | — | 44 | Remove duplicate existing triggers. |


### `11_Trigger_MemorySummarizer.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| setupNightlyTrigger | — | 8 | Create nightly memory summarizer trigger. |
| _deleteExistingTriggers | — | 22 | Remove duplicate existing triggers. |


### `11_Trigger_ReminderChecker.gs`
| Function | Arguments | Tujuan |
| --- | --- | --- |
| cekDanKirimReminder |  | Find due reminders and send notifications. |
| setupReminderTrigger |  | Create a one-minute reminder checker trigger. |


### `11_Trigger_WeeklyChangeCheck.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| setupWeeklyTrigger | — | 8 | Create the corresponding time-based trigger. |
| _deleteExistingTriggers | — | 21 | Remove duplicate existing triggers. |


### `12_Service_GitHubBackup.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| backupAllFiles | — | 15 | Backup all project source files to GitHub. |
| backupDocs | — | 40 | Backup documentation records to GitHub. |
| _loadGitHubConfig | — | 65 | Load GitHub repository/token configuration. |
| _fetchOwnSourceFiles | — | 79 | Fetch Apps Script project source files. |
| _resolveFilePath | file | 100 | Map Apps Script file metadata to GitHub path. |
| _pushFileToGitHub | config, path, content | 106 | Create/update one GitHub file. |
| _getExistingFileSha | config, url | 135 | Read GitHub blob SHA for update operations. |


### `13_Service_GitHubOps.gs`
| Method | Arguments | Source line | Tujuan |
| --- | --- | --- | --- |
| _getHeaders | — | 9 | Build authenticated GitHub HTTP headers. |
| _getRepoUrl | — | 18 | Build configured GitHub API repository URL. |
| readFile | path, ref | 25 | Read one repository file. |
| listDirectory | path | 61 | List a repository directory. |
| readAllSourceFiles | — | 93 | Recursively read codebase files for agent operations. |
| createBranch | branchName | 113 | Create Git branch. |
| createBackupBranch | suffix | 171 | Create timestamped backup branch. |
| commitFile | path, content, message, branch, sha | 181 | Create/update a file commit. |
| createPullRequest | title, body, head, base | 224 | Open GitHub pull request. |
| readDocFile | fileName | 258 | Read one documentation file. |
| updateDocFile | fileName, newContent, commitMessage | 262 | Update and commit one documentation file. |


### `99_Tests.gs`
| Function | Arguments | Tujuan |
| --- | --- | --- |
| test_Batch7b_FinanceSpecialist |  | Global entry/test/debug function. |
| debug_CheckOAuthScopes |  | Global entry/test/debug function. |
| debug_CheckGitHubConfig |  | Global entry/test/debug function. |
| test_TelegramMarkdownFallback |  | Global entry/test/debug function. |


## 4. Global entry points

| Global function | Peran |
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
| `runFullBackup()` | Global GitHub backup entry point. |
| `setupDailyBackupTrigger()` | Creates daily backup trigger. |
| `test_Batch7b_FinanceSpecialist()` | Manual finance test helper. |
| `debug_CheckOAuthScopes()` | Debug helper. |
| `debug_CheckGitHubConfig()` | Debug helper. |
| `test_TelegramMarkdownFallback()` | Manual Telegram formatting/fallback test. |


## 5. Prompt / schema catalog

### Intent analysis contract
`IntentAnalyzer._buildPrompt()` assembles persona, history, facts, profile, LTM, reminders, learned acknowledgement patterns, output schema and classification rules. `_parseResponse()` then parses the LLM output. The important architectural property is that **intent is structured before domain action**.

### Prompt-producing subsystems
| Subsystem | Output type | Primary use |
| --- | --- | --- |
| IntentAnalyzer | Intent JSON | Routing and context mutation. |
| ChatSpecialist | Conversational response | General answers and web-grounded answers. |
| CodeAuditor | Audit findings | Code/system audit. |
| FeatureArchitect | Blueprint + file generation | Feature planning/implementation. |
| ProjectBrain | Roadmap/project analysis | Project state and documentation. |
| SelfAwareness | Self-review output | Kapabilitas/state review. |
| SelfHealingSpecialist | Diagnosis / patch | Repair proposal. |
| MemorySpecialist | Daily summary | Long-term memory compression. |


### Generated code contract
`FeatureArchitect` generates file-level implementations from a blueprint; `PatchValidator` validates generated patches syntactically/structurally and for suspicious patterns. The code-generation chain should therefore be understood as **LLM proposal → static validation → explicit application path**, not “LLM writes trusted production code”.

## 6. Konfigurasi contract

All secrets and deployment-specific values are read via `Config.load()` from Script Properties. Known keys from source:

| Property | Meaning |
| --- | --- |
| TELEGRAM_BOT_TOKEN | Telegram API token. |
| MY_TELEGRAM_CHAT_ID | Target chat for automated notifications. |
| GEMINI_API_KEY | Gemini credentials. |
| GEMINI_MODEL_PRO_PREVIEW | Gemini advanced model. |
| GEMINI_MODEL_FLASH | Gemini fast model. |
| GEMINI_MODEL_FLASH_LITE | Configured but only useful where referenced. |
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
| OPENROUTER_MODEL_ADVANCED | Advanced OpenRouter model; source default exists. |
| OPENROUTER_MODEL_FAST | Fast OpenRouter model; source default exists. |


## 7. Implementation patterns to preserve

- Singleton-like object literals provide module namespaces.
- `Config` and `SpreadsheetGateway` cache remote objects/config for runtime efficiency.
- Locking is implemented in `SpreadsheetGateway.appendRowSafe()` to protect appends.
- `TelegramService` centralizes Markdown and fallback handling.
- Web search provider references are lazy to reduce Apps Script load-order issues.
- Soft deletion is used for transactions instead of row deletion.
- Trigger-specific logic is wrapped by global functions.
- Audit and change-detection state is persisted in Sheets.
- GitHub operations use API-based file access rather than local Git.

## 8. Important source-level inconsistencies / contracts

| Observed item | Severity | Implication |
| --- | --- | --- |
| `ProjectBrain.updateRoadmapStatus()` referenced but absent | High | Feature/project implementation path can break at runtime when that call is exercised. |
| `FinanceSpecialist` routing reachability is unclear | Medium | Code exists, but dedicated intent route is not obvious in current Manager dispatch. |
| `PatchValidator` is static only | High | Passing validation does not prove runtime behavior. |
| `DocumentationRepository` is legacy-coupled | Medium | Comment says ARCHITECTURE/PROGRESS are stored for backup; new documentation strategy should replace this dependency explicitly. |
| Manual WIB offset | Medium | `toWIB()` applies +7h to Date; in an Asia/Jakarta Apps Script project this can create double-shift semantics depending on source Date representation. |
| ChangeDetector scope | Medium | The detector logic focuses on source files; manifest/config changes need explicit treatment to avoid incomplete change reporting. |
| Self-healing level behavior | Medium | Configured levels do not yet constitute a fully differentiated safety/autonomy model throughout the entire repair loop. |


## 9. Change impact guide

| Area | Likely files | Impact note |
| --- | --- | --- |
| Change intent taxonomy | IntentAnalyzer + Manager + tests + docs | Routing contract changes propagate widely. |
| Add a new specialist | Specialist file + Manager route + intent schema/prompt + persistence if needed + tests + docs | Must become reachable, not merely defined. |
| Change sheet schema | Repository + all callers + setup/migration + docs | Data compatibility risk. |
| Change provider order/model | LLMProviderService + Config + tests/observability | Reliability/cost/latency behavior changes. |
| Change patch application | SelfHealingSpecialist + PatchValidator + GitHubOps + audit | High safety/rollback impact. |
| Change reminder scheduling | ReminderSpecialist + trigger + time utilities | Potential user-facing missed/duplicate notifications. |
| Change documentation mechanism | ProjectBrain + DocumentationRepository + GitHub backup/update flows | Can affect self-management capabilities. |
| Change webhook security | WebhookHandler + deployment + secret config | Critical access boundary. |


## 10. AI coding contract

For any AI-generated patch: identify caller chain; preserve public object/method names unless intentionally migrating; add or update routing/schema when adding capabilities; run available tests; inspect related sheet columns; update the consolidated docs; and explicitly record any unresolved uncertainty in `05_ROADMAP_PROGRESS_AND_TECHNICAL_DEBT.md`.