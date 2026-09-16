# 01 — System Purpose & Requirements

## 1. System purpose

The system is a **personal AI Agent exposed through Telegram**, implemented in Google Apps Script. It is designed to do more than answer chat: it can maintain user memory, manage reminders, perform web-backed answers, introspect itself, inspect and modify its own codebase through GitHub, maintain roadmap artifacts, and execute scheduled maintenance activities.

The intended product philosophy is reflected directly in `BOT_PERSONA` and specialist prompts: be natural and warm, but prioritize honesty and accuracy over sounding personal; do not invent events or details not present in supplied context.

## 2. Primary actors

| Actor | Role |
|---|---|
| User | Sends Telegram commands and natural-language requests; approves/initiates repair and feature actions. |
| Telegram | User-facing transport. |
| Google Apps Script runtime | Execution environment and trigger scheduler. |
| Google Sheets | Operational persistence store. |
| LLM providers | Intent analysis, chat, summarization, architecture, auditing, diagnosis and self-review. |
| Web search providers | Current-information retrieval. |
| GitHub | External source-control and change-delivery system. |

## 3. Product goals evidenced in code

### G1 — Conversational assistance
Implemented through `Manager` + `IntentAnalyzer` + `ChatSpecialist`.

### G2 — Persistent short/long-term memory
Implemented through `Chat_History`, `Memory_Summaries`, `Memory_Facts`, and `User_Profile`.

### G3 — Reminder automation
Implemented through natural-language intent, persistent reminders, recurring reminders, acknowledgement/snooze, and minute-based trigger checking.

### G4 — Current information retrieval
Implemented through `butuhInfoTerkini`, `searchQuery`, `WebSearchProviderService`, Google Search and Tavily fallback.

### G5 — Software self-observation
Implemented through `ChangeDetector`, `CodeAuditor`, `SelfAwareness`, and system logs/snapshots.

### G6 — Automated software evolution
Implemented partially through `FeatureArchitect` and `SelfHealingSpecialist`, which can generate code, validate it, create branches, commit, and open PRs.

### G7 — Strategy/roadmap management
Implemented through `ProjectBrain`, `Roadmap_Items`, and GitHub roadmap documents.

## 4. Functional requirements

The current implementation supports these functional requirements:

1. Receive Telegram webhook events.
2. Authenticate webhook using a shared secret query parameter.
3. Restrict messages to a configured Telegram chat ID.
4. Deduplicate Telegram updates using Script Cache.
5. Route direct slash commands without LLM intent analysis.
6. Analyze natural-language messages into strict JSON intent.
7. Preserve recent conversation context.
8. Persist explicit and LLM-detected user facts.
9. Persist profile attributes inferred from conversation.
10. Persist daily LTM summaries.
11. Create/list/acknowledge/snooze recurring or one-time reminders.
12. Perform real-time web search with provider fallback.
13. Perform multi-provider LLM fallback.
14. Audit source code in batches.
15. Persist audit reports and findings.
16. Generate source-code fixes and validate them before GitHub commit.
17. Generate feature blueprints and feature code.
18. Create GitHub branches and pull requests.
19. Detect source changes using stored snapshots.
20. Synchronize roadmap state against detected source files.
21. Run scheduled reminder, memory, audit, change-detection and backup jobs.
22. Perform self-review across architecture, capability, performance, knowledge and limitation dimensions.

## 5. Non-functional requirements visible in code

### Reliability
- LLM fallback chains.
- Search fallback providers.
- Telegram Markdown retry as plain text.
- Spreadsheet append retry helper.
- GitHub operation error handling.
- Patch validation before commit.
- Backup branch before automated code changes.
- Webhook deduplication.

### Maintainability
- Layered naming convention based on numbered files.
- Separation between repositories, services, specialists, manager, handler and triggers.
- Centralized configuration.
- Centralized logger.

### Auditability
- System log sheet.
- Audit report/finding sheets.
- Code snapshots.
- Self-heal patch sheet.
- GitHub PR workflow.

## 6. Explicit scope boundaries

The repository itself does not prove:

- that all declared triggers are currently installed in the deployed Apps Script project;
- that all Script Properties exist and contain valid credentials;
- that all referenced Google Sheets exist with matching headers;
- that GitHub permissions are sufficient for every write operation;
- that every generated patch will pass runtime tests merely because it passes `PatchValidator`;
- that finance functionality is reachable from ordinary natural-language routing.

Those items are operational/deployment facts and must be verified separately.

## 7. High-level use cases

| Use case | Primary path |
|---|---|
| Normal chat | Webhook → Manager → IntentAnalyzer → ChatSpecialist |
| Current-info question | Webhook → Manager → IntentAnalyzer → WebSearch → ChatSpecialist |
| Reminder creation | IntentAnalyzer → ReminderSpecialist → ReminderRepository |
| Reminder acknowledgement | IntentAnalyzer + pending reminders → ReminderSpecialist |
| Code audit | IntentAnalyzer/command → CodeAuditor |
| Auto-fix audit findings | Intent → CodeAuditor → PatchValidator → GitHubOps |
| Diagnose problem | Intent/command → SelfHealingSpecialist |
| Feature blueprint | `/build` → FeatureArchitect.generateBlueprint |
| Feature implementation | `implement_feature` → FeatureArchitect.implementBlueprint |
| Roadmap work | `roadmap_query` → ProjectBrain |
| Self review | `self_query` → SelfAwareness |
| Source backup | scheduled/manual → GitHubBackupService |
