# 13 — Documentation Truth

## Snapshot identity

- Source root: `src/`
- Supplied archive SHA-256: `bf801153b47289b731f1f638ebde81f2d337ee7573b16a6dfb95e3083d418f23`
- Source files analyzed: 44 files including manifest
- Total source lines: 5979
- Git metadata: **not included in supplied ZIP**, therefore no commit SHA is asserted here.

## Intentionally excluded legacy documents

The following repository files were deliberately **not** used as the source of truth:

- `README.md`
- `ARCHITECTURE.md`
- `PROGRESS.md`

They may still be read/used by runtime code, but they were excluded from this engineering reconstruction because the user explicitly stated that they are outdated.

## What this documentation proves

It can prove:

- what functions exist;
- what APIs are referenced;
- what sheets/Script Properties are referenced;
- what routing branches exist;
- what data fields are read/written;
- what error/fallback logic is coded;
- which triggers/setup functions exist;
- which self-modification operations are attempted;
- which tests are present in the repository.

It cannot by itself prove:

- current deployed GAS code differs/equals the ZIP;
- triggers are installed;
- credentials are valid;
- GitHub permissions are sufficient;
- spreadsheet headers are correct in the live spreadsheet;
- generated LLM output quality;
- production latency or quota consumption.

## Current truth table

| Area | Status from source |
|---|---|
| Telegram webhook | Implemented |
| Chat authorization | Implemented |
| Command routing | Implemented |
| Intent analyzer | Implemented |
| LLM multi-provider fallback | Implemented |
| Search fallback | Implemented |
| Chat history | Implemented |
| Facts | Implemented |
| LTM summarization | Implemented |
| User profile | Implemented |
| Reminders | Implemented |
| Finance components | Implemented as direct specialist/repository code; main conversational integration not proven |
| Roadmap subsystem | Implemented, but consumes legacy `ROADMAP.md`/`PROGRESS.md`/`ARCHITECTURE.md` |
| Code audit | Implemented |
| Audit auto-fix | Implemented with PR workflow; post-merge verification absent |
| Change detection | Implemented |
| Self-awareness | Implemented |
| Self-healing | Implemented with identifiable mapping/patch-selection risks |
| Feature Architect | Implemented with a missing method call in post-PR roadmap update path |
| Self-backup to GitHub | Implemented |
| Automated rollback | Not implemented |
| Full automated regression suite | Not implemented |

## Documentation maintenance rule

Whenever source behavior changes, update the relevant documentation in the same change. The minimum synchronization set is:

```text
source change
 -> architecture (if dependency changes)
 -> data model (if schema changes)
 -> function reference (if API changes)
 -> testing document (if behavior/test changes)
 -> gaps document (if a known limitation is fixed or introduced)
```
