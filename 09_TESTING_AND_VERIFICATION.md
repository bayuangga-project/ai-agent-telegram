# 09 — Testing & Verification

## 1. Existing tests

### `test_Batch7b_FinanceSpecialist`
Exercises:

1. income creation;
2. expense creation;
3. wallet balance formatting;
4. budget creation;
5. budget exceeded alert;
6. editing last transaction;
7. period summary.

This is an integration-style manual test against real Sheets state, not an isolated unit test.

### `test_OpenRouterIntegration`
Runs a simple fast-chain prompt and logs provider/result.

### `test_TelegramMarkdownFallback`
Creates a placeholder, edits it using deliberately malformed Markdown, and relies on TelegramService fallback behavior.

### Debug utilities
- `debug_CheckOAuthScopes`
- `debug_CheckGitHubConfig`

These are operational diagnostics, not automated regression tests.

## 2. Current verification strengths

- There is at least one end-to-end style finance test.
- Telegram Markdown fallback has an explicit regression scenario.
- OpenRouter chain availability can be probed.
- Patch validation provides deterministic pre-commit checks.

## 3. Current verification gaps

There is no dedicated test suite visible for:

- Webhook authentication/deduplication.
- Manager intent routing.
- Intent JSON schema validation beyond JSON parsing.
- Reminder recurrence edge cases.
- LTM date/time boundaries.
- Web search fallback behavior.
- GitHub branch/commit/PR lifecycle.
- Feature Architect generation + multi-file implementation.
- Self-healing level behavior.
- Change snapshot lifecycle.
- Roadmap synchronization.
- Finance reachability through Manager.
- Permission failures for missing spreadsheet/GitHub access.
- Timezone behavior around midnight/month boundaries.

## 4. Recommended test pyramid

```text
Unit tests
  - DateTimeUtils
  - PatchValidator
  - hashing/change comparison
  - intent parsing
  - formatting helpers

Component tests
  - repositories against a test sheet
  - LLM adapters with mocks
  - search adapters with mocks
  - GitHubOps with mocked HTTP responses

Integration tests
  - webhook -> manager -> Telegram
  - reminder trigger -> Telegram
  - LTM trigger -> memory sheet
  - audit -> findings -> fix PR
  - feature blueprint -> code -> validation -> PR

Operational tests
  - trigger installation
  - OAuth scopes
  - webhook reachability
  - credential validity
  - GitHub permissions
```

## 5. Pass/fail principle

A documentation reader should not equate “function exists” with “feature verified”. Verification requires either a source-level deterministic guarantee or an explicit test/execution result.
