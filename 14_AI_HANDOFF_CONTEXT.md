# AI HANDOFF CONTEXT

## Purpose
This document is the compact operational context an AI or developer should read before changing this repository. It supplements, but does not replace, the detailed documentation in this `docs/` directory.

## Source of Truth
1. Current source under `src/` is authoritative for implemented behavior.
2. Existing root `README.md`, `ARCHITECTURE.md`, and `PROGRESS.md` are legacy and intentionally excluded from this documentation baseline.
3. A capability must not be described as implemented merely because a module, prompt, command, test, or roadmap item exists. Verify reachability from the runtime path.

## Runtime Mental Model
`Telegram Webhook -> WebhookHandler -> CommandRouter OR Manager -> IntentAnalyzer -> Specialist -> Repository/External Service -> Telegram response`

The agent combines:
- short-term memory from `Chat_History`;
- long-term daily summaries;
- explicit/derived knowledge facts;
- a user profile;
- reminders;
- optional live web search;
- multiple LLM providers with fallback;
- GitHub-backed code/document operations;
- code audit, change detection, self-awareness, and self-healing subsystems.

## Critical Routing Map
| Intent | Main handler | Current reachability |
|---|---|---|
| `ack_reminder` | `ReminderSpecialist.acknowledge` | Manager route |
| `buat_reminder` | `ReminderSpecialist.create` | Manager route |
| `diagnose_error` | `SelfHealingSpecialist.diagnose` | Manager route |
| `update_docs` | `SelfHealingSpecialist.updateDocumentation` | Manager route, legacy-doc oriented |
| `audit_code` | `CodeAuditor.runAudit` | Manager route |
| `fix_audit` | `CodeAuditor.fixIssues` | Manager route |
| `check_changes` | `ChangeDetector.runDetection` | Manager route |
| `roadmap_query` | `ProjectBrain` | Manager route, legacy-doc oriented |
| `implement_feature` | `FeatureArchitect.implementBlueprint` | Manager route |
| `self_query` | `SelfAwareness.review` | Manager route |
| finance operations | `FinanceSpecialist` | **No current IntentAnalyzer/Manager finance route found** |

## LLM Strategy
Advanced chain: OpenRouter advanced -> Gemini Pro Preview -> Gemini Flash -> Gemini Flash Lite -> Groq.
Fast chain: OpenRouter fast -> Gemini Flash -> Gemini Flash Lite -> Groq.
Provider failures are logged and the chain continues until a provider succeeds.

## Important Invariants / Traps
- GAS global file load order is treated as unsafe; many provider references are intentionally lazy-evaluated. Preserve this pattern unless verified otherwise.
- Telegram Markdown failures are retried as plain text.
- Webhook updates are deduplicated by `update_id` in CacheService for 6 hours.
- Only text messages and the configured Telegram chat ID are processed.
- `SELF_HEAL_LEVEL` values 2 and 3 currently both permit automatic GitHub patch application.
- `FeatureArchitect.implementBlueprint()` invokes `ProjectBrain.updateRoadmapStatus()`, but no such method is present in the audited source. Treat as a runtime defect until reconciled.
- `SelfHealingSpecialist._getPatchById(null)` returns the first row, so `/patch apply` can select an unintended older record.
- Several repository writes still use direct `appendRow()` despite the safer append helper existing.
- Time handling manually adds WIB offsets; avoid introducing additional offsets without tracing the full conversion path.
- ChangeDetector snapshots `.gs` source files only; `appsscript.json` is not included in its source-change hash set.
- Generated patches are validated syntactically/structurally, not behaviorally.
- Backup branches and PR creation do not constitute automatic rollback or post-merge verification.
- `Documentation` sheet and legacy root docs are consumed by some runtime self-management components; the new docs are not yet wired into those consumers.

## Safe Change Procedure
1. Read the relevant architecture, function reference, and gap docs.
2. Trace caller -> callee -> repository/service -> external side effect.
3. Check whether the new capability is reachable from `Manager`/`IntentAnalyzer` or only exists as an isolated module.
4. Preserve lazy references and established repository abstractions.
5. Validate generated/modified source before committing.
6. Run the smallest relevant tests plus integration tests.
7. Re-check Script Properties, Sheets, scopes, and trigger assumptions.
8. Update this documentation when behavior changes.

## Truth Labels
Use these labels in future AI conversations: `IMPLEMENTED`, `PARTIAL`, `INTEGRATED`, `ISOLATED`, `LEGACY-DEPENDENT`, `UNVERIFIED`, `KNOWN-DEFECT`, `RISK`.

## Do Not Infer
Do not infer production availability from source existence; do not infer trigger installation from setup functions; do not infer PR merge/deployment from PR creation; do not infer behavioral correctness from syntax validation; do not infer current roadmap state from legacy docs.
