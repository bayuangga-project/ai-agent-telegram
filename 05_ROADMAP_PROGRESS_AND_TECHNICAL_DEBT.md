# 05 — Roadmap, Progress, Celah & Technical Debt

## 1. Status implementasi saat ini

This progress view is reconstructed from the current snapshot source, not from the legacy `PROGRESS.md`.

| Kapabilitas | Status | Bukti/interpretasi |
| --- | --- | --- |
| Telegram ingress | Terimplementasi | Webhook handler, authorization, duplicate detection and Telegram service exist. |
| Structured intent routing | Terimplementasi | IntentAnalyzer + Manager route paths exist. |
| Contextual memory | Terimplementasi / partial | Facts, profile, chat history, LTM summary and reminder context exist; quality depends on persistence/query behavior. |
| Reminders | Terimplementasi | CRUD/state, due checker and trigger exist. |
| Finance | Terimplementasi in specialist/repositories; routing reachability needs verification | Wallet, transaction and budget code exists. |
| Web search | Terimplementasi/optional | Google/Tavily provider fallback exists. |
| Multi-LLM fallback | Terimplementasi/optional | Advanced/fast chains exist. |
| Project roadmap | Terimplementasi/partial | Build/sync/adapt/query mechanisms exist; one referenced method mismatch needs repair. |
| Code auditing | Terimplementasi/partial | Audit, findings persistence and fix generation exist. |
| Change detection | Terimplementasi/partial | Snapshot/diff/doc-sync checks exist. |
| Self-awareness | Terimplementasi | Review/deep-dive and persistence exist. |
| Self-healing | Terimplementasi/partial | Diagnosis/patch storage/validation/application path exists; closed-loop verification is incomplete. |
| GitHub backup | Terimplementasi/optional | Source/docs backup service exists. |
| GitHub development ops | Terimplementasi/optional | Read source, branch, commit, PR, doc update operations exist. |
| Automated documentation synchronization | Sebagian | Mechanisms exist, but current documentation strategy is changing and some legacy coupling remains. |
| Comprehensive automated tests | Celah | Hanya terdapat sejumlah kecil function pengujian manual/debug yang terlihat. |
| Production behavioral verification | Celah | Source saja tidak dapat memastikan deployment/integrasi API berhasil. |


## 2. Defect/celah konkret yang perlu ditangani terlebih dahulu

### G-01 — ProjectBrain API mismatch
**Status: Inkonsistensi source yang terkonfirmasi.** Jalur implementasi berorientasi fitur merujuk ke `ProjectBrain.updateRoadmapStatus()`, sementara object ProjectBrain saat ini tidak mengekspos method tersebut. Rekonsiliasi dapat dilakukan dengan menambahkan method, mengubah caller agar menggunakan method yang sudah ada (`_updateItemStatus` or equivalent public wrapper), atau menghapus pemanggilan lama setelah intent diverifikasi.

### G-02 — Finance intent reachability
**Status: Memerlukan verifikasi eksplisit.** Finance code is substantial, but the Manager route table teramati in source does not show a dedicated finance branch. Confirm whether finance actions are encoded under a generic intent path, a command path, or are currently unreachable from natural language.

### G-03 — Self-healing is not closed-loop
**Status: Sebagian.**** Diagnosis and patch lifecycle are present. What is missing for stronger autonomy is post-apply deployment verification, runtime test execution, health confirmation, automatic rollback criteria and a clearly enforced human approval boundary for high-risk changes.

### G-04 — Trigger/documentation semantics mismatch
**Status: Needs reconciliation.**** Comments and runtime setup logic should be made consistent, especially around scheduled audit frequency/scope and the new five-document documentation set.

### G-05 — Static patch validation only
**Status: Confirmed limitation.**** Syntax/structural checks cannot establish semantics, side-effect safety, API compatibility or runtime correctness.

### G-06 — Timezone conversion risk
**Status: Technical risk.**** `DateTimeUtils.toWIB()` manually adds seven hours. The manifest itself specifies `Asia/Jakarta`; date representations should be audited to ensure no double conversion.

### G-07 — Documentation source-of-truth migration
**Status: In progress by this documentation set.**** Existing code includes `DocumentationRepository` designed around a `Documentation` sheet containing older document names/content. The new canonical documentation should become explicit and versioned rather than silently depending on stale legacy artifacts.

## 3. Recommended roadmap

### Phase 1 — Stabilize contracts
| ID | Work | Outcome |
| --- | --- | --- |
| 1.1 | Fix ProjectBrain missing method contract | Remove concrete runtime mismatch. |
| 1.2 | Make finance intent path explicit | Ensure the capability is reachable and testable. |
| 1.3 | Align trigger comments and scheduling behavior | Eliminate operational ambiguity. |
| 1.4 | Audit timezone handling | Replace manual offset logic with a single consistent Date/WIB strategy. |


### Phase 2 — Strengthen verification
| ID | Work | Outcome |
| --- | --- | --- |
| 2.1 | Add intent-routing tests | Every supported intent has a reachable path. |
| 2.2 | Add repository tests | Sheet mapping/query/update contracts are exercised. |
| 2.3 | Add integration tests for LLM/search fallback | Provider failure behavior is verified. |
| 2.4 | Add GitHub mutation tests using safe test branch/repo | Read/branch/commit/PR semantics are verified. |
| 2.5 | Add self-healing dry-run tests | Diagnosis and patch generation can be evaluated without mutation. |


### Phase 3 — Make autonomous maintenance safer
| ID | Work | Outcome |
| --- | --- | --- |
| 3.1 | Introduce explicit patch risk levels | Low/medium/high impact classification. |
| 3.2 | Add behavioral verification after patch | Run targeted tests/health checks before declaring success. |
| 3.3 | Add rollback criteria | Automatic stop/restore on failed verification. |
| 3.4 | Add approval gate for high-risk mutations | Human control for production-sensitive changes. |
| 3.5 | Expand observability | Correlate intent → action → mutation → verification. |


### Phase 4 — Documentation as a living system
| ID | Work | Outcome |
| --- | --- | --- |
| 4.1 | Make five-doc set canonical | Stop relying on legacy doc names for agent context. |
| 4.2 | Update docs on behavior-changing merges | Arsitektur/reference/progress remain synchronized. |
| 4.3 | Generate machine-readable API inventory | Allow other AIs to reason over stable method contracts. |
| 4.4 | Record verification dates | Separate source facts from production-verified facts. |


## 4. Progress ledger format for future updates

Each future change should add/update one row here or in the PR/change note using:

`Date | Change | Files | Why | Verification | Risiko | Documentation updated | Rollback plan`

## 5. Definition of done for future capabilities

A new capability should not be considered complete merely because a specialist method exists. Mark it complete only when:
1. Intent/command reachability is wired.
2. Inputs are validated.
3. Side effects have a repository/service path.
4. Error/fallback behavior is defined.
5. Tests or reproducible verification scenarios exist.
6. Logs/observability exist where appropriate.
7. Keamanan/authorization implications are addressed.
8. Documentation and roadmap status are updated.
9. Deployment/runtime verification has been performed when external dependencies are involved.

## 6. Documentation truth policy

Never promote a roadmap item to “Terimplementasi” based on a plan, a prompt, a comment, a legacy document or an AI-generated assumption. Evidence must come from current code plus explicit runtime verification where relevant.

## 7. Future target architecture

The desired mature form of the agent is a controlled autonomous loop:

```text
Observe → Understand → Plan → Act → Verify → Learn → Update State/Docs → Repeat
```

The current system has most building blocks for this loop, but several transitions—especially **Act → Verify**, **Verify → Rollback**, and **Learn → canonical documentation sync**—are only partially implemented.