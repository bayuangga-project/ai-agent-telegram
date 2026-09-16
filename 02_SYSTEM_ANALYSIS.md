# 02 — System Analysis

## 1. End-to-end request lifecycle

### Natural-language path

```text
Telegram
  -> doPost(e)
  -> WebhookHandler.handle(e)
  -> security checks
  -> duplicate check
  -> chat authorization
  -> Manager.processConversationalMessage(chatId, text)
  -> _gatherContext()
  -> IntentAnalyzer.analyze()
  -> _persistAutoFacts()
  -> _routeIntent()
  -> Specialist / Chat / Search / Project / Code subsystem
  -> TelegramService.editMessage(...)
```

The webhook initially sends a placeholder such as “lagi mikir” and then edits that Telegram message with the final answer. Direct commands skip the placeholder flow and send their response directly.

## 2. Context assembly

`Manager._gatherContext()` injects six context classes into intent analysis:

- last 15 chat messages;
- up to 50 active knowledge facts;
- up to 30 profile entries;
- up to 7 long-term memory summaries;
- reminders awaiting response within 30 minutes;
- up to 10 acknowledgement patterns.

This is the main **context window constructor** for the agent.

## 3. Intent analysis contract

The intent analyzer asks the fast LLM chain to output only JSON. The current intent taxonomy is:

`ack_reminder`, `buat_reminder`, `chat_biasa`, `diagnose_error`, `update_docs`, `audit_code`, `fix_audit`, `check_changes`, `roadmap_query`, `implement_feature`, `self_query`.

It also emits:

- `complexity`: `light` or `heavy`;
- reminder fields;
- answer/search fields;
- new facts and profile updates;
- specialized payloads for diagnose/audit/roadmap/feature/self-query.

## 4. Routing behavior

`Manager._routeIntent()` uses sequential `if` statements. Specialized routes take precedence; everything else becomes ordinary chat.

### Ordinary chat decision tree

```text
chat_biasa
  |
  +-- needsWebSearch? --> search -> grounded chat
  |
  +-- complexity == heavy? --> advanced LLM chain
  |
  `-- use intent.jawabanChat directly
```

## 5. Direct command path

Recognized commands bypass `IntentAnalyzer`.

| Command | Behavior |
|---|---|
| `/ingat <text>` | Store manual fact. |
| `/reminder` / `/reminders` | List active reminders. |
| `/diagnose <text>` | Self-healing diagnosis. |
| `/heal <text>` | Same diagnosis path. |
| `/logs [N]` | Show recent logs. |
| `/patch apply` | Apply a pending patch. |
| `/patch` | Show patch usage. |
| `/build <idea>` | Generate feature blueprint. |

## 6. Scheduled processing

| Schedule | Current handler | Effect |
|---|---|---|
| Every minute | `cekDanKirimReminder` | Sends due reminders and increments notification count. |
| Daily ~23:30 | `runNightlySummarizerWrapper` | LTM summary if at least 4 chats and no summary exists for today. |
| Monday 07:00 | `runScheduledAuditWrapper` | Light audit; full audit when day-of-month is 1. |
| Sunday 20:00 | `runWeeklyChangeCheckWrapper` | Detect changes, sync roadmap, report Telegram. |
| Daily 23:00 | `runFullBackup` | Backup Apps Script source and documentation to GitHub. |

Trigger installation requires explicit setup functions to have been executed at least once in the Apps Script project.

## 7. Failure paths

### LLM failure
Each LLM call walks its selected chain until a provider succeeds. If every provider fails, the service returns `null` and callers decide how to degrade.

### Search failure
Google Search is attempted first; Tavily is fallback. If both fail, search service returns `[]`, and grounded chat receives “no results” context.

### Telegram Markdown failure
`TelegramService` detects Telegram’s `can't parse entities` response and retries without `parse_mode`.

### Patch validation failure
Automated code changes are not committed when `PatchValidator.validate()` returns invalid.

### GitHub write failure
Branch/commit/PR helpers return false/null and log failures; callers generally return a user-visible warning or manual-application message.

## 8. Data flow

```text
User message
    |
    +--> Chat_History
    +--> IntentAnalyzer context
    +--> possible Memory_Facts
    +--> possible User_Profile
    +--> specialist state changes
    |
    +--> Logs / Audit / Snapshots / Patch history
    |
    `--> Telegram reply
```

## 9. Important reachability analysis

The repository contains a substantial `FinanceSpecialist` + finance repositories + tests, but the current `IntentAnalyzer` schema does **not define a finance intent**, and `Manager._routeIntent()` has no finance branch. Therefore finance capabilities are directly implemented and testable, but the source does not demonstrate that ordinary conversational finance requests can reach them through the main Manager route.

This should be treated as a **current integration gap**, not as an assumed capability.
