# 04 — Operasional, Pengujian, Keamanan, Deployment & Panduan Pengembangan

## 1. Model deployment

This project is a Google Apps Script web app dikonfigurasi di `appsscript.json` dengan runtime V8, timezone `Asia/Jakarta`, akses web-app anonymous, dan eksekusi `USER_DEPLOYING`. Membutuhkan deployment Apps Script terkait, Script Properties, datastore Spreadsheet, konfigurasi webhook bot Telegram, serta kredensial API eksternal jika diperlukan.

## 2. Area setup yang diperlukan

| Area | Tindakan yang diperlukan |
| --- | --- |
| Apps Script | Deploy web app; konfigurasi Script Properties; aktifkan trigger. |
| Google Sheets | Buat/pelihara semua tab sheet dan kolom yang dibutuhkan. |
| Telegram | Buat bot, konfigurasi URL webhook, dan pastikan chat ID target benar. |
| LLM | Konfigurasi satu atau lebih key/model provider. |
| Search | Konfigurasi Google CSE dan/atau Tavily jika web grounding diperlukan. |
| GitHub | Konfigurasi token/owner/repository/branch jika backup atau self-development diinginkan. |


## 3. Setup trigger

| Setup function | Efek |
| --- | --- |
| `setupReminderTrigger()` | Membuat pemeriksa pengingat satu-menit; menghapus trigger yang sesuai yang sudah ada terlebih dahulu. |
| `setupNightlySummarizer()` | Membuat trigger malam sekitar pukul 23:30. |
| `setupWeeklyTrigger()` | Membuat trigger audit Senin pukul 07:00. |
| `setupWeeklyChangeCheck()` | Membuat trigger pemeriksaan perubahan Minggu pukul 20:00. |
| `setupDailyBackupTrigger()` | Helper setup trigger backup tersedia; eksekusinya harus diaktifkan secara eksplisit. |


## 4. Penyimpanan data operasional

At minimum, operational deployments should have the sheet tabs referenced by the repository and specialist code. Missing sheets fail at `SpreadsheetGateway.getSheet()` and can break the dependent flow.

Expected sheet names teramati directly in source:

`Chat_History`, `Documentation`, `Finance_Budgets`, `Finance_Transactions`, `Finance_Wallets`, `Log_Sistem`, `Memory_Facts`, `Reminder_AckPatterns`, `Reminder_RawData`, `Audit_Findings`, `Audit_Reports`, `Code_Snapshots`, `Memory_Summaries`, `Roadmap_Items`, `SelfHeal_Patches`, `Self_Reviews`, `User_Profile`.

## 5. Pengujian inventory

| Test/helper | Function | Tujuan |
| --- | --- | --- |
| Finance specialist manual test | `test_Batch7b_FinanceSpecialist` | Finance behavior. |
| Telegram Markdown fallback | `test_TelegramMarkdownFallback` | Outbound formatting resilience. |
| OAuth scope debug | `debug_CheckOAuthScopes` | Deployment/permission troubleshooting. |
| GitHub config debug | `debug_CheckGitHubConfig` | GitHub integration configuration. |


The source contains a small set of executable/manual helpers, but inspeksi source does not establish comprehensive automated unit/integration coverage. Therefore production readiness should include additional tests around routing, repositories, recurrence, LLM fallback, GitHub mutation and repair safety.

## 6. Recommended verification matrix

| Area | Scenarios | Pass condition |
| --- | --- | --- |
| Webhook auth | Valid secret / invalid secret / missing secret | No unauthorized processing. |
| Duplicate updates | Replay same Telegram update ID | Exactly one logical processing attempt. |
| Intent parse | Valid JSON / malformed JSON / partial JSON | Graceful fallback without accidental action. |
| LLM fallback | Primary provider failure / timeout / malformed output | Next chain provider executes. |
| Search fallback | Google unavailable / Tavily unavailable | Expected provider fallback or explicit no-search state. |
| Finance | Income/expense/edit/soft-delete/budget crossing | Balances and summaries remain consistent. |
| Reminder | Create/ack/snooze/done/recurring/due window | No missed or duplicate notification. |
| Memory | Fact/profile persistence / nightly summary | Context is bounded and correct. |
| GitHub | Read/list/branch/commit/PR | No unintended repository mutation. |
| Self-healing | Diagnosis → patch → validation → apply | Explicit safety gates and auditable state. |
| Change detector | Added/changed/deleted source files | Snapshot delta accurately represented. |
| Documentation | Code change + doc sync | Docs reflect implementation state. |


## 7. Keamanan model

### Secrets
API tokens/keys are read from Script Properties rather than committed constants.

### Webhook boundary
`WebhookHandler._isAuthorized()` exists specifically to reject unauthorized webhook calls when the shared-secret mechanism is configured/enforced.

### Telegram authorization
The manifest is `ANYONE_ANONYMOUS`, so application-layer authorization is essential. Treat the webhook endpoint itself as public internet exposure.

### GitHub mutation boundary
GitHub token credentials grant the agent source-control capabilities. This is a high-impact boundary. Any feature that can generate patches or commits must be regarded as potentially modifying production source.

### Prompt injection
Web-grounded content, repository code, logs and user messages can become prompt inputs. The current code has persona/rule sections but inspeksi source does not prove comprehensive adversarial prompt-injection defenses. Treat external text as untrusted context.

### Generated code
`PatchValidator` uses syntax/structural/suspicious-pattern checks. It is not a sandbox, semantic analyzer or runtime test environment.

## 8. Reliability model

- LLM provider fallback improves availability.
- Search provider fallback improves search availability.
- Webhook duplicate detection reduces replay effects.
- Best-effort logging prevents logging failure from killing the primary flow.
- Safe append locking reduces concurrent write collisions for append operations.
- GitHub backup/branch operations support recoverability.
- Reliability is still bounded by Apps Script execution limits, external API behavior, sheet consistency, prompt quality, and unverified production integration paths.

## 9. Pemeliharaan playbook

### Diagnose a production issue
1. Inspect `Log_Sistem` for the event window.
2. Identify the Manager/specialist path involved.
3. Check Script Properties and referenced sheet existence.
4. Reproduce through the corresponding command/function when safe.
5. For code defects, use audit/self-healing tooling but require explicit validation before applying changes.
6. Record outcome and update the consolidated progress/technical-debt document.

### Safe source change
1. Determine impacted layer and callers.
2. Update source.
3. Run relevant manual/debug tests.
4. Run integration scenarios.
5. Review GitHub diff.
6. Deploy Apps Script version if needed.
7. Verify webhook/trigger behavior.
8. Update documentation and progress.

## 10. Rollback / recovery

The repository integration supports backup branches and file commits. A robust operational rollback should use Git history/backup branch to restore the prior source, then redeploy the known-good Apps Script version and re-run the affected integration checks. The source does not itself implement a fully automated transactional rollback across Apps Script deployment + Sheets state + GitHub state.

## 11. Pengembangan conventions

- Preserve module layer naming and responsibilities.
- Keep secrets out of source control.
- Prefer repository/gateway access over direct sheet mutation in new business features.
- Add tests for newly reachable intent types and dangerous side effects.
- Add explicit logs for autonomous operations.
- Prefer idempotent trigger setup functions (delete existing matching trigger before creating one).
- Treat natural-language intent output as untrusted parsed input and validate before action.
- Keep user-facing responses separate from operational state mutations where practical.

## 12. Operational limitations

This documentation is source-grounded; it cannot prove runtime success of APIs, Sheet schemas, deployed webhook settings, quotas, credential validity, or production trigger execution without an actual deployed environment. Those are operational verification tasks, not source-code facts.