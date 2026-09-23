# AI_DEVELOPMENT_HANDOFF.md {#ai_development_handoffmd}

# MASTER CONTEXT & DEVELOPMENT CONTRACT --- AI AGENT TELEGRAM {#master-context--development-contract--ai-agent-telegram}

## 0. Cara menggunakan dokumen ini {#0-cara-menggunakan-dokumen-ini}

Dokumen ini adalah **handoff utama untuk AI lain yang akan melanjutkan
development repository**.

Instruksi keras:

1.  Jangan mengarang API/method/file.
2.  Source code di `src/` adalah sumber kebenaran utama.
3.  Jika dokumen ini bertentangan dengan source, source menang dan
    dokumen harus diperbarui.
4.  Sebelum mengubah kode, telusuri caller → callee → side effect.
5.  Jangan membuat method baru yang namanya bentrok dengan global
    function.
6.  Jangan mengubah kontrak Sheet tanpa memeriksa seluruh consumer.
7.  Jangan menganggap `PatchValidator` sebagai runtime sandbox.
8.  Jangan menganggap commit/PR berarti deployment berhasil.
9.  Setelah perubahan perilaku, perbarui dokumentasi.
10. Jika diminta membuat kode, hasilkan file lengkap, bukan potongan
    kode, kecuali pengguna secara eksplisit meminta patch parsial.

------------------------------------------------------------------------

# 1. IDENTITAS PROYEK {#1-identitas-proyek}

Nama: `ai-agent-telegram`

Runtime:

``` text
Google Apps Script V8
```

Entry point:

``` text
doPost(e)
```

Channel:

``` text
Telegram Bot API
```

Database:

``` text
Google Sheets
```

Timezone manifest:

``` text
Asia/Jakarta
```

Source:

``` text
54 file .gs
+ src/appsscript.json
```

Perkiraan source:

``` text
7.276 baris .gs
```

------------------------------------------------------------------------

# 2. ARSITEKTUR BESAR {#2-arsitektur-besar}

``` text
Telegram
  ↓
WebhookHandler
  ↓
CommandRouter ──────────────┐
  ↓                         │
Manager <───────────────────┘
  ↓
IntentAnalyzer
  ↓
Manager._routeIntent()
  ↓
┌─────────────────────────────────────────────────────────────┐
│ Specialist                                                  │
│  Finance / Reminder / Chat / Memory / Knowledge / Soul     │
│  Audit / SelfHealing / ProjectBrain / FeatureArchitect     │
│  DocSync / ChangeDetector / LLMIntelligence / Sync         │
└─────────────────────────────────────────────────────────────┘
  ↓
Repository / Service
  ↓
Google Sheets / Telegram / LLM / Search / GitHub
```

------------------------------------------------------------------------

# 3. ATURAN LAYER {#3-aturan-layer}

## Config

File:

``` text
00_Config.gs
```

Tugas:

-   membaca Script Properties;
-   cache configuration;
-   expose config object.

Jangan membaca token langsung di modul lain jika dapat menggunakan
`Config.load()`.

## Gateway

File:

``` text
01_SpreadsheetGateway.gs
```

Tugas:

-   open spreadsheet;
-   get sheet;
-   append row dengan script lock;
-   ensure sheet.

## Utility

``` text
02_Utils.gs
08_Utils_PatchValidator.gs
08_Utils_TemplateEngine.gs
```

## Repository

Semua:

``` text
04_Repository_*.gs
```

Repository fokus pada persistence/query Sheet.

## Service

``` text
05_Service_Telegram.gs
06_Service_LLM*.gs
07_Service_WebSearch*.gs
12_Service_GitHubBackup.gs
13_Service_GitHubOps.gs
```

Service fokus pada external API.

## Specialist

``` text
08_Specialist_*.gs
```

Specialist mengandung business logic.

## Manager

``` text
09_Manager.gs
09_Manager_IntentAnalyzer.gs
```

Manager adalah conversation orchestrator.

## Webhook

``` text
10_Handler_Webhook.gs
```

Tidak boleh menjadi tempat business logic domain.

## Trigger

``` text
11_Trigger_*.gs
```

Scheduled execution.

------------------------------------------------------------------------

# 4. ENTRY POINT WEBHOOK {#4-entry-point-webhook}

`doPost(e)`:

``` text
WebhookHandler.handle(e)
```

Urutan aktual:

``` text
Config.load()
→ _isAuthorized()
→ JSON.parse(e.postData.contents)
→ _isDuplicateUpdate()
→ contents.message
→ message.text
→ chatId allowlist
→ _processMessage()
```

Security:

``` text
e.parameter.secret === Config.sharedSecret
```

dan:

``` text
chatId === Config.myChatId
```

Dedup:

``` text
CacheService
key = update_<update_id>
TTL = 21600 seconds
```

## Batas penting

Source **tidak** memiliki parser payload bertingkat untuk:

``` text
edited_message
callback_query
channel_post
```

Jangan menulis dokumentasi yang menyatakan kemampuan tersebut sudah ada.

------------------------------------------------------------------------

# 5. TELEGRAM SERVICE {#5-telegram-service}

File:

``` text
05_Service_Telegram.gs
```

API:

``` text
pickPlaceholder()
sendMessage(chatId, text)
editMessage(chatId, messageId, text)
```

`sendMessage()` dan `editMessage()`:

1.  mengirim dengan Markdown;
2.  mendeteksi `"can't parse entities"`;
3.  retry tanpa `parse_mode`.

Ini adalah **Markdown fallback**, bukan payload parser fallback.

------------------------------------------------------------------------

# 6. COMMAND ROUTER {#6-command-router}

File:

``` text
09_CommandRouter.gs
```

Command:

``` text
/diagnose
/heal
/logs
/patch
/build
/ingat
/soul
/init-soul
/backup
/restore
/memory
```

### Catatan kritis

`/ingat` saat ini menjalankan:

``` text
Manager._handleBuatReminder()
```

Jadi jangan mendokumentasikan `/ingat` sebagai command penyimpan fact
memory kecuali source diubah.

------------------------------------------------------------------------

# 7. MANAGER {#7-manager}

File:

``` text
09_Manager.gs
```

Entry:

``` text
processConversationalMessage(chatId, text)
```

Flow:

``` text
_gatherContext()
→ IntentAnalyzer.analyze()
→ _persistAutoFacts()
→ _routeIntent()
```

Context:

``` text
15 chat history
50 active facts
30 profile items
7 days LTM
pending reminders
10 ack patterns
```

------------------------------------------------------------------------

# 8. INTENT ROUTING {#8-intent-routing}

`Manager._routeIntent()` mendukung:

``` text
catat_keuangan
tanya_saldo
ringkasan_keuangan
atur_budget
edit_transaksi
sync_documentation
ack_reminder
buat_reminder
diagnose_error
update_docs
audit_code
fix_audit
check_changes
roadmap_query
implement_feature
self_query
soul_query
soul_init
backup_knowledge
restore_knowledge
soul_memory_query
```

Default:

``` text
_handleChatBiasa()
```

------------------------------------------------------------------------

# 9. INTENT ANALYZER {#9-intent-analyzer}

File:

``` text
09_Manager_IntentAnalyzer.gs
```

API:

``` text
analyze(userMessage, context)
_parseResponse(rawText, providerName)
_buildPrompt(userMessage, context)
_formatRiwayat(r)
_formatList(arr)
_formatReminder(r)
_formatPola(p)
```

Knowledge namespace:

``` text
intent
```

Template:

``` text
intent:master_prompt
intent:persona
intent:output_schema
intent:rules
```

## Known defect

Saat ini source:

``` text
LLMProviderService.generateFromSinglePrompt(prompt, 0.7, null, 'intent_analysis')
```

Signature:

``` text
generateFromSinglePrompt(promptText, temperature, taskType)
```

Argumen keempat diabaikan.

Jika memperbaiki:

``` text
generateFromSinglePrompt(prompt, 0.7, 'intent_analysis')
```

Setelah perubahan, pastikan ranking model untuk task `intent_analysis`
tersedia/ditangani.

------------------------------------------------------------------------

# 10. FINANCE {#10-finance}

Files:

``` text
08_Specialist_Finance.gs
04_Repository_Budget.gs
04_Repository_Transaction.gs
04_Repository_Wallet.gs
```

Finance **sudah terintegrasi ke Manager**.

Intent:

``` text
catat_keuangan
tanya_saldo
ringkasan_keuangan
atur_budget
edit_transaksi
```

## Wallet

``` text
resolveWallet(namaWallet)
getSaldoWallet(walletId)
getAllSaldo()
```

Default wallet:

``` text
Cash
```

Saldo:

``` text
saldoAwal + income - expense
```

## Transaction

``` text
recordTransaction(data)
editLastTransaction(updatedFields)
```

## Budget

``` text
createOrUpdateBudget(kategori, batasJumlah, periode)
```

Alert:

``` text
>= 80% → WARNING
>= 100% → EXCEEDED
```

------------------------------------------------------------------------

# 11. REMINDER {#11-reminder}

Files:

``` text
08_Specialist_Reminder.gs
04_Repository_Reminder.gs
11_Trigger_ReminderChecker.gs
```

Core:

``` text
create()
acknowledge()
getRemindersDueNow()
buildNotificationText()
markAsNotified()
```

Cooldown:

``` text
5 menit
```

Default snooze:

``` text
30 menit
```

Recurring:

``` text
daily
weekly
monthly
```

Trigger:

``` text
cekDanKirimReminder()
```

------------------------------------------------------------------------

# 12. MEMORY {#12-memory}

Files:

``` text
08_Specialist_Knowledge.gs
08_Specialist_Memory.gs
08_Specialist_UserProfile.gs
08_Specialist_Soul.gs
08_Specialist_SoulMemory.gs
```

Jenis memory:

``` text
Facts
User Profile
Long-term summaries
Soul context
Episodic memory
Meta insights
```

Jangan mencampur:

``` text
AI_Knowledge
Memory_Facts
User_Profile
Soul memory
```

Masing-masing memiliki fungsi berbeda.

------------------------------------------------------------------------

# 13. AI KNOWLEDGE {#13-ai-knowledge}

File:

``` text
ai_knowledge.md
```

**File ini relevan dan tidak boleh dianggap dead documentation.**

Runtime flow:

``` text
AI_Knowledge Sheet
↕
KnowledgeSyncSpecialist
↕
ai_knowledge.md
↕
GitHub
```

File source:

``` text
08_Specialist_KnowledgeSync.gs
```

Constant:

``` text
SYNC_FILE = 'ai_knowledge.md'
```

------------------------------------------------------------------------

# 14. KNOWLEDGE REPOSITORY {#14-knowledge-repository}

File:

``` text
04_Repository_Knowledge.gs
```

Key:

``` text
namespace
key
content
version
active
updated_at
notes
```

Method:

``` text
get(namespace, key)
getByNamespace(namespace)
getAll()
save(namespace, key, content, notes)
deactivate(namespace, key)
```

Saat save:

-   versi bertambah;
-   active version lama dinonaktifkan;
-   entry baru menjadi active.

------------------------------------------------------------------------

# 15. LLM PROVIDER {#15-llm-provider}

File:

``` text
06_Service_LLMProvider.gs
```

Provider:

``` text
OpenRouter
Gemini
Groq
```

`generate(params)`:

``` text
ranked models
→ OpenRouter :free
→ Gemini
→ Groq
→ null
```

Circuit breaker:

``` text
OpenRouter HTTP 429
```

dapat menghentikan loop OpenRouter dan lanjut fallback.

Jangan mendokumentasikan `advanced`/`fast` sebagai parameter
`generate()` karena source saat ini tidak memilikinya.

------------------------------------------------------------------------

# 16. LLM INTELLIGENCE {#16-llm-intelligence}

File:

``` text
08_Specialist_LLMIntelligence.gs
```

Method:

``` text
discoverAndBenchmark()
runFullPipeline()
discoverModels()
benchmarkBatch()
rankModels()
getRankedModelsForTask(taskType)
recordStat(taskType, modelId, success, latencyMs)
adaptiveReRank()
```

Tujuan:

-   discover model;
-   benchmark;
-   rank;
-   adaptive statistics.

Knowledge namespace terkait:

``` text
llm
llm_routing
llm_stats
benchmark
```

------------------------------------------------------------------------

# 17. WEB SEARCH {#17-web-search}

Files:

``` text
07_Service_WebSearchProvider.gs
07_Service_WebSearch_Google.gs
07_Service_WebSearch_Tavily.gs
```

Provider:

``` text
Google CSE
Tavily
```

API:

``` text
WebSearchProviderService.search(query)
```

`ChatSpecialist` memutuskan apakah search dibutuhkan.

------------------------------------------------------------------------

# 18. CHAT SPECIALIST {#18-chat-specialist}

File:

``` text
08_Specialist_Chat.gs
```

Method:

``` text
buildSystemPersona()
needsWebSearch(intent)
respondWithSearchContext(userMessage, searchResults, riwayat)
_formatRiwayat(riwayat)
```

Jangan menggandakan persona tanpa alasan; jika persona dipusatkan nanti,
update semua consumer.

------------------------------------------------------------------------

# 19. CODE AUDITOR {#19-code-auditor}

File:

``` text
08_Specialist_CodeAuditor.gs
```

Flow:

``` text
runAudit()
→ collect source/sheet/config metadata
→ batch source
→ LLM analysis
→ parse findings
→ save report/findings
```

Fix:

``` text
fixIssues()
→ generate fixes
→ PatchValidator
→ backup branch
→ working branch
→ commit
→ PR
```

Ini belum melakukan deployment.

------------------------------------------------------------------------

# 20. PATCH VALIDATOR {#20-patch-validator}

File:

``` text
08_Utils_PatchValidator.gs
```

Method:

``` text
validate()
_checkSyntax()
_checkStructuralSanity()
_checkSuspiciousPatterns()
formatResult()
```

Validator hanya static.

Jangan menyebutnya:

``` text
sandbox
runtime test
security proof
semantic proof
```

------------------------------------------------------------------------

# 21. SELF HEALING {#21-self-healing}

File:

``` text
08_Specialist_SelfHealing.gs
```

API:

``` text
getLevel()
diagnose(keluhanUser)
updateDocumentation(instruction)
applyPendingPatch(patchId)
```

Flow aktual:

``` text
logs
→ identify suspect files
→ LLM diagnosis
→ patchedCode
→ PatchValidator
→ backup branch
→ fix branch
→ commit
→ PR
```

Belum ada closed-loop:

``` text
deploy
→ runtime test
→ health verification
→ automatic rollback
```

------------------------------------------------------------------------

# 22. PROJECT BRAIN {#22-project-brain}

File:

``` text
08_Specialist_ProjectBrain.gs
```

API:

``` text
buildRoadmapFromDiscussion(userInput)
syncRoadmapWithCode()
adaptRoadmapForNewIdea(idea)
answerQuestion(question)
updateRoadmapStatus(feature, status)
```

Roadmap source:

``` text
ROADMAP.md
Roadmap_Items
```

**`updateRoadmapStatus()` memang ada.**

Dokumentasi lama yang mengatakan method ini hilang sudah obsolete.

------------------------------------------------------------------------

# 23. FEATURE ARCHITECT {#23-feature-architect}

File:

``` text
08_Specialist_FeatureArchitect.gs
```

Flow:

``` text
generateBlueprint(idea)
→ save blueprint
→ implementBlueprint()
→ generate files
→ PatchValidator
→ backup branch
→ feature branch
→ commit
→ PR
→ ProjectBrain.updateRoadmapStatus()
```

Blueprint disimpan di:

``` text
SelfHeal_Patches
```

dengan marker:

``` text
BLUEPRINT:
```

------------------------------------------------------------------------

# 24. DOCUMENTATION SYNC {#24-documentation-sync}

File:

``` text
08_Specialist_DocSync.gs
```

Canonical docs:

``` text
01_SYSTEM_CONTEXT_AND_AI_HANDOFF.md
02_ARCHITECTURE_AND_FLOWS.md
03_IMPLEMENTATION_AND_CODE_REFERENCE.md
04_OPERATIONS_TESTING_SECURITY_DEVELOPMENT.md
05_ROADMAP_PROGRESS_AND_TECHNICAL_DEBT.md
```

## Known defect

`GitHubOpsService.readAllSourceFiles()` return:

``` js
{
  filename: {
    content,
    sha
  }
}
```

tetapi `_collectSourceMetadata()` memperlakukan hasil sebagai array.

Perbaikan konseptual:

``` text
Object.keys(files)
```

lalu baca:

``` text
files[fileName]
```

------------------------------------------------------------------------

# 25. CHANGE DETECTOR {#25-change-detector}

File:

``` text
08_Specialist_ChangeDetector.gs
```

Method:

``` text
runDetection(mode)
runScheduledDetection()
```

Snapshot:

``` text
Code_Snapshots
```

Perubahan:

``` text
added
modified
deleted
```

`_checkDocSync()` saat ini hanya memberikan advisory berbasis prefix
file dan referensi `ARCHITECTURE.md`.

------------------------------------------------------------------------

# 26. SYNC ORCHESTRATOR {#26-sync-orchestrator}

File:

``` text
08_Specialist_SyncOrchestrator.gs
```

API:

``` text
assessState()
executeSync(scope)
autoDocument(changeDescription)
```

Scope:

``` text
pull
backup
docs
sheets
full
auto
```

Menangani:

-   knowledge pull;
-   knowledge backup;
-   documentation sync;
-   sheet ensure.

------------------------------------------------------------------------

# 27. GITHUB BACKUP {#27-github-backup}

File:

``` text
12_Service_GitHubBackup.gs
```

API:

``` text
backupAllFiles()
backupDocs()
runFullBackup()
setupDailyBackupTrigger()
```

Source sendiri dibaca via:

``` text
Apps Script API
```

kemudian push ke:

``` text
src/
```

Dokumentasi diambil dari:

``` text
Documentation Sheet
```

Tidak ada:

``` text
runFullGitHubOps()
```

------------------------------------------------------------------------

# 28. GITHUB OPS {#28-github-ops}

File:

``` text
13_Service_GitHubOps.gs
```

API:

``` text
readFile(path, ref)
listDirectory(path)
readAllSourceFiles()
createBranch(branchName)
createBackupBranch(suffix)
commitFile(path, content, message, branch, sha)
createPullRequest(title, body, head, base)
readDocFile(fileName)
updateDocFile(fileName, newContent, commitMessage)
```

------------------------------------------------------------------------

# 29. ROLLBACK {#29-rollback}

File:

``` text
Rollback.gs
```

API:

``` text
rollbackFromGitHub()
_getRollbackFilesFromGitHub(config)
```

Rollback adalah source recovery melalui GitHub.

Bukan automatic Apps Script deployment rollback.

------------------------------------------------------------------------

# 30. TRIGGER INVENTORY {#30-trigger-inventory}

## Audit

``` text
runScheduledAuditWrapper()
setupWeeklyTrigger()
```

## LLM intelligence {#llm-intelligence}

``` text
runDailyLLMDiscovery()
setupDailyLLMDiscovery()
```

## Memory {#memory}

``` text
runNightlySummarizerWrapper()
setupNightlySummarizer()
```

## Reminder {#reminder}

``` text
cekDanKirimReminder()
setupReminderTrigger()
```

## Sync

``` text
runDailyAutoSync()
setupDailyAutoSyncTrigger()
```

## Change check

``` text
runWeeklyChangeCheckWrapper()
setupWeeklyChangeCheck()
```

## GitHub backup {#github-backup}

``` text
runFullBackup()
setupDailyBackupTrigger()
```

### CRITICAL

Ada dua global:

``` text
setupWeeklyTrigger()
```

Salah satunya harus di-rename.

------------------------------------------------------------------------

# 31. TESTS {#31-tests}

File:

``` text
99_Tests.gs
```

Current functions:

``` text
test_Batch7b_FinanceSpecialist()
debug_CheckOAuthScopes()
debug_CheckGitHubConfig()
test_TelegramMarkdownFallback()
debug_TimezoneAudit()
triggerKnowledgeSync()
triggerManualDiscoveryAndBenchmark()
test_Stage1_Discover()
test_Stage2_BenchmarkBatch()
test_Stage3_Rank()
test_CheckGitHubRateLimitAndAuth()
fix_CleanBenchmarkData()
resetAndCleanSystemCounters()
forceSyncKnowledgeFromGitHub()
```

## Known stale tests

`test_Batch7b_FinanceSpecialist()` memanggil API yang tidak ada:

``` text
FinanceSpecialist.getAllSaldoAsText()
FinanceSpecialist.formatRingkasanAsText()
```

dan mengharapkan:

``` text
income.text
expense.text
```

Finance aktual mengembalikan object.

Test harus diperbarui sebelum dijadikan basis regression.

------------------------------------------------------------------------

# 32. SHEET CONTRACT {#32-sheet-contract}

Core sheets:

``` text
Chat_History
Memory_Facts
User_Profile
Memory_Summaries
Reminder_RawData
Reminder_AckPatterns
Finance_Wallets
Finance_Transactions
Finance_Budgets
Log_System
Audit_Reports
Audit_Findings
Code_Snapshots
Roadmap_Items
Documentation
Self_Reviews
SelfHeal_Patches
AI_Knowledge
Soul_Episodic_Memory
Soul_Meta_Memory
Soul_User_Patterns
```

Jangan mengubah nama sheet tanpa mencari semua:

``` text
getSheet()
SHEET_NAME
_ensureSheets()
```

------------------------------------------------------------------------

# 33. CONFIG CONTRACT {#33-config-contract}

Script Properties:

``` text
TELEGRAM_BOT_TOKEN
MY_TELEGRAM_CHAT_ID
GEMINI_API_KEY
GROQ_API_KEY
SPREADSHEET_ID
SHARED_SECRET
GOOGLE_SEARCH_API_KEY
GOOGLE_SEARCH_ENGINE_ID
TAVILY_API_KEY
GITHUB_TOKEN
GITHUB_REPO_OWNER
GITHUB_REPO_NAME
GITHUB_BRANCH
OPENROUTER_API_KEY
CF_ACCOUNT_ID
CF_API_TOKEN
TOGETHER_API_KEY
HF_API_TOKEN
SELF_HEAL_LEVEL
```

Jangan memasukkan nilai secret ke GitHub.

------------------------------------------------------------------------

# 34. DATABASE RULES {#34-database-rules}

Semua insert baru ke Sheet sebaiknya:

``` text
SpreadsheetGateway.appendRowSafe()
```

Tujuannya:

``` text
ScriptLock
→ appendRow
→ flush
→ release lock
```

------------------------------------------------------------------------

# 35. DATE/TIME RULE {#35-datetime-rule}

Manifest:

``` text
Asia/Jakarta
```

Utility:

``` text
DateTimeUtils
```

Jangan menambahkan manual `+7 jam` ke Date object.

`DateTimeUtils.toWIB()` saat ini tidak menambahkan tujuh jam secara
manual; ia menormalkan input menjadi Date.

Format:

``` text
formatWaktu()
formatUntukPrompt()
formatPeriode()
```

------------------------------------------------------------------------

# 36. DEVELOPMENT RULES UNTUK AI {#36-development-rules-untuk-ai}

Ketika user meminta fitur baru:

## Fase A --- Discovery {#fase-a--discovery}

Cari:

``` text
related intent
related command
related specialist
related repository
related sheet
related prompt
related trigger
related docs
```

## Fase B --- Contract {#fase-b--contract}

Tentukan:

``` text
input
output
errors
side effects
security
persistence
```

## Fase C --- Architecture {#fase-c--architecture}

Jika fitur data:

``` text
Repository
```

Jika external API:

``` text
Service
```

Jika business logic:

``` text
Specialist
```

Jika conversational:

``` text
Intent + Manager routing
```

Jika scheduled:

``` text
Trigger
```

## Fase D --- Implementation {#fase-d--implementation}

Ikuti pola existing.

## Fase E --- Validation {#fase-e--validation}

Minimal:

``` text
syntax
call graph
schema
test
diff
```

## Fase F --- Documentation {#fase-f--documentation}

Update:

``` text
01–05 canonical docs
```

dan jika runtime dependency berubah:

``` text
ROADMAP.md
ai_knowledge.md
```

------------------------------------------------------------------------

# 37. RULES UNTUK PATCH {#37-rules-untuk-patch}

Jangan langsung commit ke main untuk perubahan autonomous/high-risk.

Gunakan:

``` text
backup branch
→ working branch
→ validation
→ commit
→ PR
```

Untuk patch yang menyentuh:

-   authentication;
-   GitHub token handling;
-   webhook;
-   data deletion;
-   financial mutation;
-   self-healing;
-   generated code execution;

perlakukan sebagai high risk dan minta verification/approval sesuai
workflow proyek.

------------------------------------------------------------------------

# 38. RULES UNTUK DOCUMENTATION {#38-rules-untuk-documentation}

Canonical:

``` text
01_SYSTEM_CONTEXT_AND_AI_HANDOFF.md
02_ARCHITECTURE_AND_FLOWS.md
03_IMPLEMENTATION_AND_CODE_REFERENCE.md
04_OPERATIONS_TESTING_SECURITY_DEVELOPMENT.md
05_ROADMAP_PROGRESS_AND_TECHNICAL_DEBT.md
```

Legacy/compatibility:

``` text
ARCHITECTURE.md
PROGRESS.md
ROADMAP.md
```

Runtime knowledge artifact:

``` text
ai_knowledge.md
```

Jangan menghapus `ROADMAP.md` sebelum `ProjectBrain` diubah.

------------------------------------------------------------------------

# 39. PRIORITY BACKLOG {#39-priority-backlog}

## P0/P1 --- Fix concrete defects {#p0p1--fix-concrete-defects}

1.  Fix `IntentAnalyzer` task type.
2.  Fix `DocSyncSpecialist._collectSourceMetadata()`.
3.  Rename duplicate global `setupWeeklyTrigger()`.
4.  Rewrite stale Finance tests.

## P1 --- Testing {#p1--testing}

5.  Test every Manager intent.
6.  Test repositories.
7.  Test LLM fallback.
8.  Test search fallback.
9.  Test GitHub mutation on test repository.
10. Test PatchValidator.

## P2 --- Autonomous safety {#p2--autonomous-safety}

11. Risk classification.
12. Approval gate.
13. Runtime test runner.
14. Deployment verification.
15. Health check.
16. Rollback criteria.

## P2 --- Architecture cleanup {#p2--architecture-cleanup}

17. Consolidate persona.
18. Separate compatibility docs from canonical docs.
19. Improve documentation metadata collection.
20. Make source API inventory machine-readable.

------------------------------------------------------------------------

# 40. ACCEPTANCE CRITERIA FITUR BARU {#40-acceptance-criteria-fitur-baru}

Jangan menyatakan \"selesai\" jika hanya file `.gs` sudah dibuat.

Checklist:

``` text
[ ] API contract
[ ] Caller
[ ] Routing
[ ] Validation
[ ] Persistence
[ ] Error path
[ ] Fallback
[ ] Logging
[ ] Security
[ ] Test
[ ] Documentation
[ ] Runtime verification
[ ] Rollback plan jika mutation berisiko
```

------------------------------------------------------------------------

# 41. FORMAT KERJA YANG DIHARAPKAN DARI AI LAIN {#41-format-kerja-yang-diharapkan-dari-ai-lain}

Jika user meminta implementasi:

1.  Jelaskan file yang akan dibuat/diubah.
2.  Tunjukkan dependency/call graph.
3.  Berikan source file lengkap.
4.  Berikan perubahan prompt/knowledge jika diperlukan.
5.  Berikan perubahan Sheet schema jika diperlukan.
6.  Berikan test.
7.  Berikan langkah deployment.
8.  Berikan verification checklist.
9.  Berikan dokumentasi yang perlu diperbarui.

Jangan berhenti pada \"konsep\".

------------------------------------------------------------------------

# 42. ATURAN ANTI-HALLUCINATION {#42-aturan-anti-hallucination}

AI yang melanjutkan project ini wajib:

-   mencari method sebelum memanggilnya;
-   mencari file sebelum mereferensikannya;
-   mencari `SHEET_NAME` sebelum mengasumsikan sheet;
-   mencari `KnowledgeRepository.get(namespace,key)` sebelum membuat key
    baru;
-   mencari `Config.load()` sebelum menambah credential;
-   mencari caller sebelum mengubah signature;
-   mencari semua references sebelum rename;
-   membedakan source evidence dengan documentation claim;
-   tidak menganggap roadmap sebagai source implementation.

Jika tidak yakin:

``` text
search repository → trace → verify → baru ubah
```

------------------------------------------------------------------------

# 43. FINAL PROJECT MODEL {#43-final-project-model}

Agent yang ingin dibangun pada akhirnya mengikuti:

``` text
OBSERVE
  ↓
UNDERSTAND
  ↓
PLAN
  ↓
ACT
  ↓
VERIFY
  ↓
LEARN
  ↓
DOCUMENT
  ↓
REPEAT
```

Source saat ini sudah memiliki banyak komponen
Observe/Understand/Plan/Act/Document.

Gap terbesar untuk evolusi berikutnya adalah:

``` text
ACT → VERIFY
VERIFY → ROLLBACK
```

Jangan memperluas otonomi sebelum dua transisi tersebut cukup aman.

------------------------------------------------------------------------

# 44. SOURCE-OF-TRUTH ORDER {#44-source-of-truth-order}

Jika AI menemukan konflik:

``` text
1. src/*.gs
2. src/appsscript.json
3. actual Google Sheets schema/runtime
4. ai_knowledge.md / AI_Knowledge
5. canonical docs 01–05
6. compatibility docs
7. roadmap claims
```

Kecuali user secara eksplisit meminta perubahan terhadap source-of-truth
tersebut.

------------------------------------------------------------------------

# 45. PENUTUP UNTUK AI {#45-penutup-untuk-ai}

Kamu bukan sedang mengerjakan repository kosong.

Kamu sedang melanjutkan sistem yang sudah memiliki:

-   conversational orchestration;
-   persistent memory;
-   reminder;
-   finance;
-   search;
-   multi-LLM;
-   code audit;
-   documentation sync;
-   roadmap intelligence;
-   GitHub operations;
-   feature generation;
-   self-awareness;
-   self-healing.

Prioritasmu bukan menambah kompleksitas secara cepat.

Prioritasmu:

``` text
Pahami kontrak
→ Perbaiki defect konkret
→ Perkuat test
→ Perkuat verification
→ Baru tambah autonomy
```

Selalu perlakukan source code aktual sebagai kebenaran teknis.
