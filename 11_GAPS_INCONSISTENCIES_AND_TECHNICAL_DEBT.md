# 11 — Gaps, Inconsistencies & Technical Debt

This file is intentionally frank. These items are based on direct static inspection of the supplied source snapshot.

## G1 — Feature Architect calls a missing ProjectBrain method

`FeatureArchitect.implementBlueprint()` calls:

`ProjectBrain.updateRoadmapStatus(blueprint.featureName, 'in-progress')`

No `updateRoadmapStatus` method exists in `ProjectBrain` in the supplied source. This is a concrete runtime integration defect on the successful implementation path, after the PR workflow.

## G2 — Self-healing suspect-file mapping names files that do not exist

`SelfHealingSpecialist._identifySuspectFiles()` maps:

- `LLM` → `06_Service_LLM.gs`
- `SEARCH` → `07_Service_WebSearch.gs`

The repository actually contains split provider files (`06_Service_LLMProvider.gs`, `06_Service_LLM_Gemini.gs`, etc.; similarly for search). This can cause source lookup to fail for those categories.

## G3 — Finance capability is not wired into main conversational routing

`FinanceSpecialist` and finance repositories are implemented, but `IntentAnalyzer` has no finance intent and `Manager._routeIntent()` has no finance branch. The included finance test proves direct component calls, not conversational reachability.

## G4 — Safe append rule is not universally followed

Prompts say all inserts should use `SpreadsheetGateway.appendRowSafe()`, but current repositories still use direct `appendRow()` in at least:

- BudgetRepository.create
- ChatHistoryRepository.save
- FactsRepository.save
- ReminderRepository.create
- AckPatternsRepository.save
- TransactionRepository.create
- WalletRepository.create

This weakens the intended resilience guarantee.

## G5 — Self-heal levels 2 and 3 currently behave the same

`getLevel()` allows 1–3, but `diagnose()` only checks `if (level >= 2)`. There is no distinct behavior for level 3.

## G6 — `/patch apply` with null ID can select the wrong patch

`applyPendingPatch(null)` calls `_getPatchById(null)`. That helper loops forward from the first data row and returns the first row when no ID is supplied, rather than the latest pending patch. Therefore the direct command may apply an older record.

## G7 — `SelfHeal_Patches` is used as two different schemas

Blueprints and patches share one six-column sheet and overload columns C–F differently. There is no explicit record-type column.

## G8 — Time conversion is manually offset by +7 hours

`DateTimeUtils.toWIB()` adds a fixed 7-hour offset. `nowWIB()` returns an already-shifted Date, while methods such as `formatWaktu()` call `toWIB()` again. This creates a real risk of double-shifting when a value returned by `nowWIB()` is later sent through formatting logic. The same design also makes daylight-saving/other timezone changes impossible, although WIB itself does not use DST.

This area should be tested aggressively around midnight and month boundaries.

## G9 — Intent result is parsed as JSON but not schema-validated

The system assumes fields exist and values are valid after `JSON.parse`. There is no deterministic schema validator for intent payloads.

## G10 — Source/filename assumptions are duplicated

Some prompts and mappings use conceptual filenames such as `06_Service_LLM.gs` although implementation is split into multiple files. This makes self-diagnosis and code-generation context more brittle.

## G11 — Documentation subsystem still targets legacy files

`ProjectBrain` and `SelfHealingSpecialist.updateDocumentation()` operate on `ROADMAP.md`, `ARCHITECTURE.md`, and `PROGRESS.md`. The new documentation suite supplied with this audit is not yet the runtime-consumed documentation source.

## G12 — Roadmap update is LLM rewrite, not structured patching

`_updateRoadmapContent()` asks an LLM to rewrite the full `ROADMAP.md`. This is simple, but increases the risk of accidental unrelated edits.

## G13 — User Profile update semantics are simplistic

Profile upsert uses exact key equality and overwrites with a hard-coded confidence of `0.8`; there is no evidence-based conflict resolution or confidence decay.

## G14 — Change Detector uses a simple custom hash

`_simpleHash()` is appropriate for lightweight change detection but is not collision-resistant enough to be treated as a cryptographic content identity.

## G15 — Audit finding status can be marked fixed independently of actual PR success

`CodeAuditor.fixIssues()` calls `_markFindingsFixed(filtered)` after `_applyFixes()` returns. `_applyFixes()` can produce partial failures or rejected fixes, so “fixed” state may not precisely equal “merged/verified”.

## G16 — No post-merge verification loop

Feature/Audit/Self-Heal pipelines stop at PR creation. There is no built-in check that the PR was merged, deployed to GAS, started successfully, and passed regression tests.

## G17 — Scheduled audit date logic is somewhat implicit

`CodeAuditor.runScheduledAudit()` decides full audit based on day-of-month `1`; the actual weekly trigger is Monday. If the first of the month is not Monday, the full audit still happens on that trigger day. This may be intentional, but it should be stated as policy.

## G18 — Some user-facing formatting lives in repositories

`ReminderRepository.formatDaftarAktifSebagaiTeks()` directly produces Telegram-flavored Markdown. This conflicts somewhat with the stated separation rule that repositories should remain data-centric.

## G19 — Lack of explicit concurrency controls

Google Sheets writes and GitHub branch creation are multi-step operations without locking. Concurrent trigger/manual execution could race.

## G20 — Snapshot only includes `.gs` source files

`GitHubOpsService.readAllSourceFiles()` reads `.gs` files under `src`; `appsscript.json` is excluded from change detection/auditing snapshot logic. Therefore manifest changes are not included in the same source-change detection path.

## Priority interpretation

The document does not assign a score. A practical interpretation is:

- **Immediate correctness risks:** G1, G2, G6, G8, G15.
- **Feature integration gaps:** G3, G5, G11, G16.
- **Hardening/maintainability:** G4, G7, G9, G10, G12, G13, G14, G18, G19, G20.
