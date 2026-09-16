# AI Agent Telegram — Engineering Documentation

> **Documentation source of truth:** `src/` in the repository snapshot supplied for this audit. The legacy `README.md`, `ARCHITECTURE.md`, and `PROGRESS.md` are intentionally excluded from the analysis.

## Purpose

This documentation is written to let a developer or another AI agent reconstruct the system without relying on undocumented assumptions. It covers system purpose, analysis, architecture, agent behavior, storage, code/module/function reference, operations, testing, security, maintenance, development workflow, and known gaps.

## Evidence rule

- **Implemented** = directly evidenced by the current source code.
- **Observed behavior** = derived from execution flow in source.
- **Dependency/assumption** = required by the code but not guaranteed by the snapshot.
- **Gap / risk** = an inconsistency, missing integration, or likely defect visible from static inspection.
- **Not verified** = cannot be proven from source alone, such as deployed trigger state or real API availability.

## Documents

| Document | Purpose |
|---|---|
| [01 — System Purpose & Requirements](01_SYSTEM_PURPOSE_AND_REQUIREMENTS.md) | Mission, actors, goals, requirements and scope. |
| [02 — System Analysis](02_SYSTEM_ANALYSIS.md) | Actual end-to-end behavior, use cases, flows and failure paths. |
| [03 — Architecture](03_ARCHITECTURE.md) | Layers, components, dependencies, runtime architecture and Mermaid diagrams. |
| [04 — Agent Behavior & Prompts](04_AGENT_BEHAVIOR_AND_PROMPTS.md) | Intent taxonomy, persona, context construction, LLM chains and specialist behavior. |
| [05 — Data Model & Sheets](05_DATA_MODEL_AND_SHEETS.md) | Google Sheets persistence model and record contracts. |
| [06 — Codebase Reference](06_CODEBASE_REFERENCE.md) | File-by-file implementation map. |
| [07 — Function & Method Reference](07_FUNCTION_METHOD_REFERENCE.md) | Function/method inventory with responsibilities. |
| [08 — Operations & Maintenance](08_OPERATIONS_AND_MAINTENANCE.md) | Configuration, deployment, triggers, backup, monitoring and maintenance. |
| [09 — Testing & Verification](09_TESTING_AND_VERIFICATION.md) | Existing tests, manual verification and test gaps. |
| [10 — Security & Reliability](10_SECURITY_AND_RELIABILITY.md) | Security controls, reliability mechanisms and residual risks. |
| [11 — Gaps, Inconsistencies & Technical Debt](11_GAPS_INCONSISTENCIES_AND_TECHNICAL_DEBT.md) | Static findings that the next engineering cycle should know. |
| [12 — Development Guide](12_DEVELOPMENT_GUIDE.md) | How to safely extend the system from A–Z. |
| [13 — Documentation Truth](13_DOCUMENTATION_TRUTH.md) | Snapshot identity, evidence boundaries and current truth table. |

## Quick system map

```text
Telegram Webhook
      |
      v
WebhookHandler
      |
      +--> CommandRouter ----> direct commands
      |
      v
   Manager
      |
      +--> IntentAnalyzer ----> fast LLM chain
      |
      +--> Specialists
      |      |- Reminder
      |      |- Knowledge / Memory / UserProfile
      |      |- Chat + WebSearch
      |      |- Finance
      |      |- ProjectBrain
      |      |- FeatureArchitect
      |      |- CodeAuditor
      |      |- SelfHealing
      |      \- SelfAwareness
      |
      +--> Repositories ----> Google Sheets
      |
      +--> Services --------> Telegram / LLM / Search / GitHub
      |
      +--> Time triggers ----> reminder / memory / audit / change / backup
```

## Source snapshot

- Runtime: Google Apps Script V8.
- Script timezone: `Asia/Jakarta`.
- Web app: anonymous access, executes as deploying user.
- Source files under `src/`: 43 files including manifest.
- Source size: approximately 5,936 lines from the supplied snapshot.

## Important architectural fact

The codebase uses **object-literal modules instead of ES6 classes**, and intentionally delays cross-module references behind methods in several places to avoid Google Apps Script load-order/reference issues.
