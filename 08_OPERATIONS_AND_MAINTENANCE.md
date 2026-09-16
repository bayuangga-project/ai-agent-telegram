# 08 — Operations & Maintenance

## 1. Required Script Properties

| Property | Purpose |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token |
| `MY_TELEGRAM_CHAT_ID` | Authorized user chat |
| `SHARED_SECRET` | Webhook query secret |
| `SPREADSHEET_ID` | Operational spreadsheet |
| `GEMINI_API_KEY` | Gemini credential |
| `GEMINI_MODEL_PRO_PREVIEW` | Advanced chain model |
| `GEMINI_MODEL_FLASH` | Fast/advanced fallback model |
| `GEMINI_MODEL_FLASH_LITE` | Additional Gemini fallback |
| `GROQ_API_KEY` | Groq credential |
| `OPENROUTER_API_KEY` | OpenRouter credential |
| `OPENROUTER_MODEL_ADVANCED` | Advanced OpenRouter model; default in code if absent |
| `OPENROUTER_MODEL_FAST` | Fast OpenRouter model; default in code if absent |
| `GOOGLE_SEARCH_API_KEY` | Google Custom Search credential |
| `GOOGLE_SEARCH_ENGINE_ID` | Google Custom Search engine ID |
| `TAVILY_API_KEY` | Tavily credential |
| `GITHUB_TOKEN` | GitHub API credential |
| `GITHUB_REPO_OWNER` | GitHub owner |
| `GITHUB_REPO_NAME` | GitHub repository |
| `GITHUB_BRANCH` | Base branch |
| `SELF_HEAL_LEVEL` | Self-healing execution level, valid 1–3 |

## 2. Apps Script manifest

Current manifest facts:

- timezone: `Asia/Jakarta`;
- runtime: V8;
- exception logging: Stackdriver;
- web app executes as deploying user;
- web app access: anonymous;
- declared scopes include spreadsheets, external requests, ScriptApp and read-only Apps Script project access.

## 3. Deployment setup

The source exposes the following setup functions that must be run deliberately:

- `setupReminderTrigger()`
- `setupNightlySummarizer()`
- `setupWeeklyTrigger()` (audit scheduler)
- `setupWeeklyChangeCheck()`
- `setupDailyBackupTrigger()`

The source does not contain proof that these setup functions have already been executed in the deployed project.

## 4. Webhook setup requirements

The web app deployment must be reachable by Telegram and the webhook URL must supply:

`?secret=<SHARED_SECRET>`

The bot also rejects any message whose chat ID differs from `MY_TELEGRAM_CHAT_ID`.

## 5. GitHub operations

`GitHubOpsService` expects a repository that can be accessed with the configured token. It supports:

- read file;
- list directory;
- read all source;
- create branch;
- create backup branch;
- commit file;
- create pull request;
- update documentation.

## 6. Backup architecture

The self-backup service is notable because it is **entirely inside GAS**:

```text
Apps Script API (/projects/{scriptId}/content)
                |
                v
     GitHubBackupService
                |
                v
GitHub Contents API (PUT)
```

No local checkout is required by this design.

## 7. Monitoring

Primary monitoring store: `Log_System`.

Important event families include:

- `TELEGRAM_*`
- `LLM_*`
- `WEBSEARCH_*`
- `AUDIT_*`
- `SELF_HEAL_*`
- `PROJECT_BRAIN_*`
- `FEATURE_ARCHITECT_*`
- `CHANGE_DETECT_*`
- `REMINDER_*`
- `USER_PROFILE_*`
- `LTM_*`
- `GITHUB_*`

## 8. Maintenance routines

Recommended operational sequence when changing the system:

1. Backup source.
2. Review logs.
3. Run audit or targeted tests.
4. Make changes in a branch/PR.
5. Deploy to GAS.
6. Verify webhook and trigger behavior.
7. Observe `Log_System` for failures.
8. Run change detection/snapshot if appropriate.

## 9. Recovery

The code-generation pipelines create backup branches before fixes/features. However, “rollback” is operationally described in PR text; there is no dedicated automated rollback executor in the source.
