# 04 — Agent Behavior & Prompts

## 1. Agent persona

`BOT_PERSONA` defines:

- first-person “aku” and second-person “kamu”;
- natural, warm, non-template style;
- light humor when appropriate;
- accuracy and honesty prioritized over personality;
- no invented events or details outside supplied context.

This is the base persona for chat and is reused in intent analysis/self-review context.

## 2. Intent analyzer as policy/router model

The Intent Analyzer is effectively the system's **policy classification layer**. It is not merely extracting keywords: it receives broad context and is instructed to select an operational intent.

### Current schema

```json
{
  "tipe": "ack_reminder | buat_reminder | chat_biasa | diagnose_error | update_docs | audit_code | fix_audit | check_changes | roadmap_query | implement_feature | self_query",
  "complexity": "light | heavy",
  "aksiReminder": "done | snooze | null",
  "reminderId": "string",
  "snoozeMinit": "number",
  "alasan": "string",
  "deskripsi": "string",
  "waktuPertama": "dd/MM/yyyy HH:mm",
  "jenisRecurring": "none | daily | weekly | monthly",
  "recurringConfig": "string",
  "prioritas": "Normal | Tinggi | Rendah",
  "catatan": "string",
  "jawabanChat": "string",
  "butuhInfoTerkini": "boolean",
  "searchQuery": "string",
  "factsBaru": [],
  "profileUpdates": [{"key":"k","value":"v","category":"c"}]
}
```

Specialized nested payloads exist for diagnosis, docs, audit, fix, change-check, roadmap, feature implementation and self-query.

## 3. Complexity policy

The current prompt declares:

- `light` = casual/factual;
- `heavy` = analysis/strategy;
- self-query, diagnose, audit, roadmap, implement are always heavy.

Heavy conversation escalates to `advanced` LLM chain.

## 4. Real-time information policy

A message is web-search eligible only when both `butuhInfoTerkini` and `searchQuery` are truthy. The final chat prompt is explicitly instructed to rely on search results as primary information and not invent outside them.

## 5. Memory behavior

### STM
Raw recent chat history from `Chat_History`.

### LTM
Daily LLM-generated summaries from `Memory_Summaries`.

### Facts
Explicit and auto-detected durable facts in `Memory_Facts`.

### Profile
Structured key/value user profile entries in `User_Profile`.

### Ack pattern learning
`Reminder_AckPatterns` stores prior user acknowledgement wording and the inferred done/snooze action so the intent analyzer can use recent patterns.

## 6. Specialist contracts

Specialists generally return **application data or ready-to-display text**, not Telegram API side effects. The strongest exception is scheduled/background specialists where the trigger layer explicitly calls TelegramService.

## 7. Self-awareness contract

Self Awareness evaluates five dimensions:

1. Architectural
2. Capability
3. Performance
4. Knowledge
5. Limitation

The prompt explicitly instructs the LLM to distinguish implemented vs half-done vs not possible and to avoid inventing statistics.

Important: the numerical `overallScore` is **LLM-generated self-assessment**, not a deterministic engineering metric.

## 8. Self-healing contract

Self Healing follows this model:

```text
Complaint
  -> recent logs
  -> error log filter
  -> suspect file mapping
  -> source retrieval
  -> advanced LLM diagnosis
  -> pending patch persistence
  -> PatchValidator
  -> backup branch
  -> fix branch
  -> commit
  -> PR
```

`SELF_HEAL_LEVEL` controls how far the pipeline proceeds:

- 1 → diagnose / show patch only;
- 2 → currently attempts GitHub application;
- 3 → accepted configuration value, but current source does not define a distinct execution branch beyond `level >= 2`.

Therefore levels 2 and 3 behave the same in the current implementation.

## 9. Feature Architect contract

Feature development is intended to be:

```text
idea
 -> roadmap adaptation
 -> blueprint
 -> confirmation
 -> code generation per file
 -> validation
 -> backup branch
 -> feature branch
 -> commits
 -> PR
 -> roadmap status update
```

The implementation itself, however, depends on the presence of a latest pending blueprint in `SelfHeal_Patches` and does not verify that the blueprint matches the `idea` argument.
