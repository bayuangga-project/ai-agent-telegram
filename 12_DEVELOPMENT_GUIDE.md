# 12 — Development Guide

## 1. First principle

Before changing a module, identify which layer owns the responsibility:

| Concern | Preferred layer |
|---|---|
| Secrets / configuration | `Config` |
| Time / IDs / shared formatting | `DateTimeUtils`, `IdGenerator` |
| Google Sheets persistence | Repository / `SpreadsheetGateway` |
| Telegram HTTP | `TelegramService` |
| External model HTTP | Provider + `LLMProviderService` |
| Web search HTTP | Search provider + service |
| GitHub HTTP | `GitHubOpsService` / backup service |
| Domain behavior | Specialist |
| Natural-language routing | `IntentAnalyzer` + `Manager` |
| Direct commands | `CommandRouter` |
| Entry point | `WebhookHandler` |
| Scheduled execution | `11_Trigger_*` |

## 2. Adding a new capability

Recommended development sequence:

```text
1. Define capability contract
2. Decide persistence needs
3. Add repository if stateful
4. Add specialist business logic
5. Add service adapter if external API is required
6. Add intent schema + Manager route
7. Add direct command only if deterministic command is useful
8. Add tests
9. Add scheduled trigger only if required
10. Update documentation
11. Backup source
12. Deploy and verify
```

## 3. New repository checklist

- Define `SHEET_NAME`.
- Map columns explicitly.
- Return plain objects from reads.
- Keep CRUD/data concerns isolated.
- Prefer `appendRowSafe()` for inserts.
- Avoid Telegram/LLM calls.
- Decide lifecycle/status semantics.
- Add tests for empty sheet and malformed rows.

## 4. New specialist checklist

- Use object literal style.
- Keep external HTTP behind service modules.
- Keep data access behind repositories/gateway where practical.
- Return deterministic objects for core operations where possible.
- Log important state transitions.
- Add explicit success/failure outputs.
- Avoid hidden side effects.

## 5. Adding a new intent

Update all of these together:

1. `IntentAnalyzer._outputSchemaSection()`
2. `IntentAnalyzer._rulesSection()`
3. `Manager._routeIntent()`
4. specialized Manager handler if needed
5. specialist implementation
6. project-context intent list used by FeatureArchitect/SelfAwareness
7. tests
8. documentation

A common failure mode is adding a specialist without adding an intent route; this is precisely the current Finance integration gap.

## 6. Adding a new external provider

Follow the provider pattern:

```text
Provider object
  -> isConfigured() if optional
  -> call/search()
  -> explicit HTTP status handling
  -> normalized return shape
  -> throw on provider failure
```

Then add it to the orchestrator lazily.

## 7. Changing self-modification logic

Treat `CodeAuditor`, `FeatureArchitect`, `SelfHealingSpecialist`, `GitHubOpsService`, and `PatchValidator` as a security boundary.

Recommended minimum sequence:

```text
read original
 -> retain original SHA
 -> generate full file
 -> validate syntax
 -> validate structure
 -> validate suspicious patterns
 -> create backup branch
 -> create dedicated branch
 -> commit with SHA
 -> open PR
 -> human review
 -> merge
 -> deploy
 -> run regression verification
```

## 8. Documentation update policy

The documentation generated for this audit is intentionally more detailed than the runtime legacy doc subsystem. When updating the canonical docs, prefer documenting from source code and tests first, then describe intended behavior separately.

Every new capability should add:

- requirement statement;
- architecture/dependency impact;
- data contract;
- function/method reference;
- execution flow;
- tests;
- failure modes;
- operational setup;
- known limitations.

## 9. AI-to-AI handoff protocol

For another AI to safely modify this project, provide it with:

1. `docs/INDEX.md`;
2. `docs/03_ARCHITECTURE.md`;
3. `docs/05_DATA_MODEL_AND_SHEETS.md`;
4. `docs/07_FUNCTION_METHOD_REFERENCE.md`;
5. `docs/11_GAPS_INCONSISTENCIES_AND_TECHNICAL_DEBT.md`;
6. current source tree;
7. explicit task and acceptance criteria.

The second AI should be instructed to treat **source code + current tests as higher authority than old prose**.
