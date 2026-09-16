# 06 — Codebase Reference

The numeric prefix suggests an intended load/order grouping, not a formal build system. Google Apps Script loads project files into one global runtime.

| File | Lines | Role | Key public module(s) |
|---|---:|---|---|
| `00_Config.gs` | 48 | Configuration | Config |
| `01_SpreadsheetGateway.gs` | 45 | Sheet access gateway | SpreadsheetGateway |
| `02_Utils.gs` | 51 | Shared utilities | IdGenerator, DateTimeUtils |
| `03_AppLogger.gs` | 23 | Logging | AppLogger |
| `04_Repository_Budget.gs` | 57 | Budget repository | BudgetRepository |
| `04_Repository_ChatHistory.gs` | 26 | Chat history repository | ChatHistoryRepository |
| `04_Repository_Documentation.gs` | 23 | Documentation repository | DocumentationRepository |
| `04_Repository_Facts.gs` | 31 | Facts repository | FactsRepository |
| `04_Repository_Reminder.gs` | 125 | Reminder + acknowledgement repositories | ReminderRepository, AckPatternsRepository |
| `04_Repository_Transaction.gs` | 96 | Transaction repository | TransactionRepository |
| `04_Repository_Wallet.gs` | 44 | Wallet repository | WalletRepository |
| `05_Service_Telegram.gs` | 115 | Telegram API boundary | TelegramService |
| `06_Service_LLMProvider.gs` | 99 | LLM fallback orchestrator | LLMProviderService |
| `06_Service_LLM_Gemini.gs` | 56 | Gemini provider | GeminiProvider |
| `06_Service_LLM_Groq.gs` | 61 | Groq provider | GroqProvider |
| `06_Service_LLM_OpenRouter.gs` | 82 | OpenRouter provider | OpenRouterProvider |
| `07_Service_WebSearchProvider.gs` | 47 | Search fallback orchestrator | WebSearchProviderService |
| `07_Service_WebSearch_Google.gs` | 48 | Google provider | GoogleSearchProvider |
| `07_Service_WebSearch_Tavily.gs` | 55 | Tavily provider | TavilySearchProvider |
| `08_Specialist_ChangeDetector.gs` | 206 | Code change detection | ChangeDetector |
| `08_Specialist_Chat.gs` | 46 | Ordinary chat / web-grounding | ChatSpecialist |
| `08_Specialist_CodeAuditor.gs` | 680 | Code audit + auto-fix | CodeAuditor |
| `08_Specialist_FeatureArchitect.gs` | 458 | Feature blueprint + code generation | FeatureArchitect |
| `08_Specialist_Finance.gs` | 217 | Finance business logic | FinanceSpecialist |
| `08_Specialist_Knowledge.gs` | 39 | User facts | KnowledgeSpecialist |
| `08_Specialist_Memory.gs` | 178 | STM/LTM summary | MemorySpecialist |
| `08_Specialist_ProjectBrain.gs` | 430 | Roadmap/project strategy | ProjectBrain |
| `08_Specialist_Reminder.gs` | 133 | Reminder business logic | ReminderSpecialist |
| `08_Specialist_SelfAwareness.gs` | 393 | Self review | SelfAwareness, test_OpenRouterIntegration |
| `08_Specialist_SelfHealing.gs` | 464 | Diagnosis/patch/PR automation | SelfHealingSpecialist |
| `08_Specialist_UserProfile.gs` | 120 | Structured profile | UserProfileSpecialist |
| `08_Utils_PatchValidator.gs` | 208 | Patch safety checks | PatchValidator |
| `09_CommandRouter.gs` | 63 | Direct command routing | CommandRouter |
| `09_Manager.gs` | 181 | Conversational orchestration | Manager |
| `09_Manager_IntentAnalyzer.gs` | 145 | Intent classifier | IntentAnalyzer |
| `10_Handler_Webhook.gs` | 79 | Telegram webhook entry | WebhookHandler, doPost |
| `11_Trigger_AuditScheduler.gs` | 64 | Scheduled audits | AuditScheduler, runScheduledAuditWrapper, setupWeeklyTrigger |
| `11_Trigger_MemorySummarizer.gs` | 38 | Nightly LTM summary | MemorySummarizerTrigger, runNightlySummarizerWrapper, setupNightlySummarizer |
| `11_Trigger_ReminderChecker.gs` | 31 | Minute reminder checker | cekDanKirimReminder, setupReminderTrigger |
| `11_Trigger_WeeklyChangeCheck.gs` | 37 | Weekly change detector | WeeklyChangeCheckTrigger, runWeeklyChangeCheckWrapper, setupWeeklyChangeCheck |
| `12_Service_GitHubBackup.gs` | 186 | Self backup to GitHub | GitHubBackupService, runFullBackup, setupDailyBackupTrigger |
| `13_Service_GitHubOps.gs` | 297 | GitHub read/write/branch/PR | GitHubOpsService |
| `99_Tests.gs` | 138 | Manual/debug tests | test_Batch7b_FinanceSpecialist, debug_CheckOAuthScopes, debug_CheckGitHubConfig, test_TelegramMarkdownFallback |
| `appsscript.json` | 16 | Apps Script manifest | — |
