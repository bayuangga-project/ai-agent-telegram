# 10 — Security & Reliability

## 1. Existing security controls

### Webhook secret
`WebhookHandler._isAuthorized()` compares `e.parameter.secret` with the configured `SHARED_SECRET`.

### Chat allow-list
Only the configured Telegram chat ID is accepted for processing.

### Script Properties for secrets
API credentials are retrieved from Script Properties rather than hardcoded source constants.

### Patch validation
Automated code changes are validated before commit.

### Backup before automated code changes
Self-healing and audit-fix flows create backup branches before fix branches.

## 2. Reliability controls

- LLM fallback chains.
- Search provider fallback.
- Telegram Markdown fallback.
- Sheets append retry helper.
- Webhook update deduplication.
- Error logging at major boundaries.
- Soft-delete for transactions.

## 3. Security-sensitive behaviors to monitor

### Self-modifying system
The agent can generate source code and use a GitHub token to create branches, commit files and open PRs. This is a high-impact capability and should be treated as privileged automation.

### Generated code execution risk
`PatchValidator._checkSyntax()` uses `new Function(code)` to parse the generated code, but it is still only a syntax parser; it does not execute business logic or prove behavioral safety.

### Prompt-injected source context
Code auditing and self-healing send source code and logs to LLMs. Any future external/untrusted data in source or logs could influence model output unless prompts and data boundaries remain controlled.

### Logging sensitive data
Some debug/event logs include user text, diagnoses, file paths and provider responses. `debug_CheckGitHubConfig()` intentionally logs the first four token characters; that still creates an unnecessary credential-derived log artifact and should be removed in hardened deployments.

## 4. Important residual reliability risks

- No transaction/locking layer around multi-step GitHub writes.
- No automated rollback operation.
- LLM-generated JSON is parsed but not strongly schema-validated.
- A patch can be syntactically valid but semantically wrong.
- Search grounding depends on upstream result quality.
- Trigger execution is not idempotent in every subsystem.
- Time handling uses a manual +7h offset rather than the Apps Script timezone directly.

## 5. Security posture recommendation

Treat `SELF_HEAL_LEVEL >= 2`, GitHub write capability and documentation write capability as privileged operations requiring code review, observability and least-privilege credentials.
