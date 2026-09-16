# 05 — Data Model & Google Sheets

The system uses Google Sheets as its primary operational database. The following schemas are derived from the row indexes/constants in source code.

## 1. `Log_System`

| Column | Meaning |
|---|---|
| A | timestamp |
| B | event type |
| C | detail |
| D | status (`INFO`, `WARNING`, `ERROR`) |

Used by `AppLogger`, self-healing and self-awareness.

## 2. `Chat_History`

| Column | Meaning |
|---|---|
| A | message ID |
| B | timestamp |
| C | chat ID |
| D | role (`user` / `ai`) |
| E | text |

## 3. `Memory_Facts`

| Column | Meaning |
|---|---|
| A | ID |
| B | timestamp |
| C | chat ID |
| D | category |
| E | fact text |
| F | status (`Active`) |

## 4. `Memory_Summaries`

| Column | Meaning |
|---|---|
| A | generated ID |
| B | date |
| C | summary |
| D | topics |
| E | message count |

## 5. `User_Profile`

| Column | Meaning |
|---|---|
| A | key |
| B | value |
| C | category |
| D | confidence |
| E | last updated |

Current insert/update logic uses confidence `0.8`.

## 6. `Reminder_RawData`

| Column | Meaning |
|---|---|
| A | ID |
| B | timestamp |
| C | description |
| D | reminder time |
| E | status (`Aktif`, `Done`) |
| F | priority |
| G | last notified |
| H | notes |
| I | recurring type (`none`, `daily`, `weekly`, `monthly`) |
| J | recurring config |
| K | notification count |

## 7. `Reminder_AckPatterns`

| Column | Meaning |
|---|---|
| A | ID |
| B | timestamp |
| C | raw user phrase |
| D | intent interpretation |
| E | action (`done` / `snooze`) |

## 8. `Finance_Wallets`

| Column | Meaning |
|---|---|
| A | ID |
| B | wallet name |
| C | opening balance |
| D | created timestamp |

## 9. `Finance_Transactions`

| Column | Meaning |
|---|---|
| A | ID |
| B | record timestamp |
| C | wallet ID |
| D | transaction date |
| E | type (`income` / `expense`) |
| F | category |
| G | amount |
| H | description |
| I | status (`active` / `deleted`) |

## 10. `Finance_Budgets`

| Column | Meaning |
|---|---|
| A | ID |
| B | category |
| C | budget amount |
| D | period (`yyyy-MM`) |
| E | created timestamp |

## 11. `Roadmap_Items`

| Column | Meaning |
|---|---|
| A | ID |
| B | feature |
| C | category |
| D | priority |
| E | status |
| F | unused/blank field in current writer |
| G | notes |

## 12. `Code_Snapshots`

| Column | Meaning |
|---|---|
| A | snapshot ID |
| B | timestamp |
| C | file name |
| D | file content hash |
| E | state (`active` / `archived`) |

## 13. `Audit_Reports`

| Column | Meaning |
|---|---|
| A | audit ID |
| B | timestamp |
| C | type (`light` / `full`) |
| D | currently written as `0` |
| E | total findings |
| F | critical count |
| G | warning count |
| H | status (`completed`) |

## 14. `Audit_Findings`

| Column | Meaning |
|---|---|
| A | finding ID |
| B | report ID |
| C | severity |
| D | category |
| E | file name |
| F | description |
| G | state (`pending` / `fixed`) |

## 15. `SelfHeal_Patches`

This sheet is currently **overloaded for two record types**.

### Patch record
| Column | Meaning |
|---|---|
| A | patch ID |
| B | timestamp |
| C | file name |
| D | diagnosis |
| E | patched code |
| F | status |

### Blueprint record
| Column | Meaning |
|---|---|
| A | blueprint ID |
| B | timestamp |
| C | `BLUEPRINT: <feature>` marker |
| D | original idea |
| E | serialized blueprint JSON |
| F | status (`pending`) |

This overload makes the sheet a polymorphic storage table without an explicit type column.

## 16. `Self_Reviews`

| Column | Meaning |
|---|---|
| A | review ID |
| B | timestamp |
| C | score |
| D | can-do list |
| E | cannot-do + half-done list |
| F | improvements |

## 17. `Documentation`

| Column | Meaning |
|---|---|
| A | file name |
| B | document content |

Used as a writable content cache for GitHub documentation backup/update.

## 18. Persistence conventions

The source intends to use `SpreadsheetGateway.appendRowSafe()` to reduce transient Sheets API failures. However, several repository writers still use direct `appendRow()`. See the gap document.

## 19. Soft-delete conventions

Transactions explicitly implement soft delete with `deleted` status. Reminder uses status transitions rather than row deletion. There is no general deletion API across all repositories.
