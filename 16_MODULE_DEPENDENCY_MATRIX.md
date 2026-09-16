# MODULE DEPENDENCY MATRIX

## Layers
| Layer | Responsibilities | Representative modules |
|---|---|---|
| Entry/trigger | Runtime entry points and schedules | `01_WebhookHandler`, `11_Trigger_*` |
| Orchestration | Intent classification, routing, context | `03_Manager`, `02_IntentAnalyzer`, `10_CommandRouter` |
| Specialist | Domain-specific behavior | `08_Specialist_*` |
| Services | LLM, search, Telegram, GitHub, self-management | `05_Service_*`, `07_Service_*`, `09_*` |
| Persistence | Sheets-backed repositories | `04_Repository_*` |
| Utilities/config | Configuration, logging, date handling, helpers | `00_Config`, `02_Utils_*` |

## Primary Call Chains
### Incoming Telegram message
`doPost -> WebhookHandler.handle -> _processMessage -> CommandRouter OR Manager.processConversationalMessage -> IntentAnalyzer.analyze -> Manager._routeIntent -> Specialist -> TelegramService`

### Ordinary LLM chat
`Manager -> IntentAnalyzer -> ChatSpecialist -> LLMProviderService -> provider adapter`

### Current-information chat
`Manager -> IntentAnalyzer(butuhInfoTerkini) -> WebSearchProviderService -> ChatSpecialist.respondWithSearchContext -> LLMProviderService`

### Reminder creation
`Manager -> ReminderSpecialist.create -> ReminderRepository.create -> SpreadsheetGateway -> TelegramService`

### Self-healing
`Manager/CommandRouter -> SelfHealingSpecialist -> GitHubOpsService -> GitHub Contents API -> Pull Request`

### Code audit
`Manager -> CodeAuditor.runAudit -> GitHubOpsService + Sheets context -> LLMProviderService -> Audit repositories`

### Feature implementation
`Manager -> FeatureArchitect -> GitHubOpsService -> generated per-file patches -> PR -> ProjectBrain status update call (currently unresolved)`

### Backup
`daily trigger -> GitHubBackupService -> Apps Script API content -> GitHub Contents API`

## High-Impact Coupling
- `Manager` is the central orchestration coupling point.
- `IntentAnalyzer` output schema is coupled to every routed specialist.
- `LLMProviderService` is infrastructure for almost all intelligent behavior.
- `GitHubOpsService` is shared by backup, self-healing, change detection, feature work, roadmap/doc updates.
- Google Sheets is both persistence and operational state across memory, finance, roadmap, audits, patches, reviews, documentation.
- Legacy documentation files remain a runtime dependency for self-management components.
