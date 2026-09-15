# ARCHITECTURE.md — ai-agent-telegram

> Ditulis ulang dari nol dengan membaca **langsung setiap baris** dari 33
> file source (`src/*.gs` + `appsscript.json`) per commit `99d37a1`.
> Versi ARCHITECTURE.md/PROGRESS.md sebelumnya di repo ini **tidak dipakai
> sebagai referensi** karena terbukti berisi klaim yang tidak cocok dengan
> kode (nama file yang tidak ada, fitur yang dideskripsikan lebih canggih
> dari implementasi aslinya). Dokumen ini sengaja detail sampai level
> method supaya AI/developer lain bisa lanjut kerja tanpa re-membaca
> semua source dari nol, TAPI tetap disarankan cross-check ke source asli
> untuk perubahan apa pun yang terjadi setelah commit di atas.

## 1. Ringkasan & Filosofi

`ai-agent-telegram` adalah asisten pribadi berbasis Telegram, single-user,
berjalan 100% di **Google Apps Script (GAS)** dengan **Google Sheets**
sebagai database. Fitur utama saat ini:

- Percakapan natural language dengan intent detection berbasis LLM
- Reminder dengan pola recurring & acknowledge natural ("udah selesai", "nanti aja")
- Pencatatan keuangan (wallet/transaksi/budget) — **backend lengkap, TIDAK
  bisa diakses lewat chat**, lihat PROGRESS.md
- Memori fakta sederhana tentang user
- Web search sebagai konteks tambahan
- **Code Auditor**: audit kode sendiri pakai LLM, simpan temuan, dan bisa
  auto-fix lewat branch+PR GitHub
- **Self-Healing**: diagnosis error dari log, generate patch, commit ke
  branch+PR GitHub; juga bisa update `ARCHITECTURE.md`/`PROGRESS.md` di
  GitHub berdasarkan instruksi natural language
- Backup source code GAS ke GitHub (mekanisme lama, `12_Service_GitHubBackup.gs`)
- Operasi GitHub generik (baca/tulis/branch/PR) untuk kebutuhan Auditor &
  Self-Healing (mekanisme baru, `13_Service_GitHubOps.gs`)

**Filosofi desain yang konsisten di seluruh kode:**
- Modul = object literal (`const`/`var X = {...}`), bukan `class`.
- Tidak ada dependency injection — modul memanggil modul lain lewat nama
  global langsung.
- Repository (`04_*`) murni CRUD ke Sheet, tidak tahu Telegram/LLM/GitHub.
- Semua insert ke Sheet **wajib** lewat `SpreadsheetGateway.appendRowSafe()`.
- Soft delete selalu (ubah kolom status), tidak pernah hapus baris.
- Waktu selalu dikonversi ke WIB via `DateTimeUtils` sebelum dipakai untuk
  logika apa pun (jangan pernah format tanggal manual di tempat lain).
- Fallback chain: LLM (Gemini x3 tier → Groq) dan Web Search (Google CSE →
  Tavily) sama-sama pakai pola try/catch berurutan + logging.

## 2. Tech Stack

| Lapisan | Teknologi |
|---|---|
| Runtime | Google Apps Script, V8 runtime |
| Database | Google Sheets (1 spreadsheet, banyak tab) |
| Channel | Telegram Bot API, webhook (bukan polling) |
| LLM | Gemini (Pro Preview/Flash/Flash-Lite) → fallback Groq (`openai/gpt-oss-20b`) |
| Web search | Google Custom Search API → fallback Tavily |
| GitHub (backup lama) | Apps Script API (baca source sendiri) + GitHub Contents API (`12_`) |
| GitHub (ops baru) | GitHub REST API langsung: contents, git refs, pulls (`13_`) |
| Trigger terjadwal | `ScriptApp.newTrigger` (time-based) |
| Timezone | Asia/Jakarta (WIB, UTC+7) |

Tidak ada framework eksternal, tidak ada build step/npm.

## 3. Model Deployment

- Web App (`doPost`), `executeAs: USER_DEPLOYING`, `access: ANYONE_ANONYMOUS`.
- Keamanan diserahkan ke aplikasi: shared secret di query param + allowlist
  1 chat ID (lihat §9).
- OAuth scopes di `appsscript.json`: `spreadsheets`, `script.external_request`,
  `script.scriptapp` (untuk kelola trigger), `script.projects.readonly`
  (untuk `12_Service_GitHubBackup.gs` baca source project sendiri via
  Apps Script API — **`13_Service_GitHubOps.gs` TIDAK butuh scope ini**
  karena dia baca dari GitHub, bukan dari project GAS).

## 4. Peta Modul (nama file AKTUAL, sudah diverifikasi satu per satu)

| File | Tanggung Jawab |
|---|---|
| `00_Config.gs` | Baca Script Properties, cache di memori |
| `01_SpreadsheetGateway.gs` | Akses low-level ke Sheet + retry logic |
| `02_Utils.gs` | `IdGenerator`, `DateTimeUtils` (WIB) |
| `03_AppLogger.gs` | Log ke sheet `Log_System`, fail-silent |
| `04_Repository_Budget.gs` | CRUD `Finance_Budgets` |
| `04_Repository_ChatHistory.gs` | CRUD `Chat_History` |
| `04_Repository_Documentation.gs` | Baca sheet `Documentation` (untuk backup lama) |
| `04_Repository_Facts.gs` | CRUD `Memory_Facts` |
| `04_Repository_Reminder.gs` | CRUD `Reminder_RawData` **+** `AckPatternsRepository` untuk `Reminder_AckPatterns` (dua object dalam satu file) |
| `04_Repository_Transaction.gs` | CRUD `Finance_Transactions` |
| `04_Repository_Wallet.gs` | CRUD `Finance_Wallets` |
| `05_Service_Telegram.gs` | Kirim/edit pesan Telegram + retry otomatis ke plain text kalau Markdown ditolak |
| `06_Service_LLMProvider.gs` | Orchestrator fallback chain LLM (`advanced`/`fast`) |
| `06_Service_LLM_Gemini.gs` | Provider Gemini (generik untuk semua tier model) |
| `06_Service_LLM_Groq.gs` | Provider Groq (fallback terakhir) |
| `07_Service_WebSearchProvider.gs` | Orchestrator fallback search |
| `07_Service_WebSearch_Google.gs` | Provider Google Custom Search |
| `07_Service_WebSearch_Tavily.gs` | Provider Tavily |
| `08_Specialist_Chat.gs` | Persona + jawab dengan konteks search |
| `08_Specialist_CodeAuditor.gs` | Audit kode via LLM, simpan temuan, auto-fix via GitHub PR |
| `08_Specialist_Finance.gs` | Wallet/transaksi/budget — **backend lengkap, belum ada pintu masuk** |
| `08_Specialist_Knowledge.gs` | Simpan/ambil fakta user |
| `08_Specialist_Reminder.gs` | Siklus reminder: buat, notifikasi, ack, recurring |
| `08_Specialist_SelfHealing.gs` | Diagnosis error dari log + generate & commit patch; update dokumentasi via GitHub |
| `09_CommandRouter.gs` | Fast-path command eksplisit (tanpa LLM) |
| `09_Manager.gs` | Orchestrator percakapan, routing intent |
| `09_Manager_IntentAnalyzer.gs` | Bangun prompt intent, panggil LLM, parse JSON |
| `10_Handler_Webhook.gs` | Entry point `doPost(e)` |
| `11_Trigger_AuditScheduler.gs` | Trigger mingguan untuk `CodeAuditor` |
| `11_Trigger_ReminderChecker.gs` | Trigger tiap 1 menit untuk reminder due |
| `12_Service_GitHubBackup.gs` | **[Mekanisme lama]** Backup source GAS + docs sheet → GitHub, satu arah |
| `13_Service_GitHubOps.gs` | **[Mekanisme baru]** Baca/tulis file, branch, PR di GitHub — dipakai oleh `CodeAuditor` & `SelfHealingSpecialist` |
| `99_Tests.gs` | Fungsi manual test/debug, dijalankan dari editor GAS |
| `appsscript.json` | Manifest GAS (timezone, OAuth scopes, webapp config) |

**Catatan penting**: ada **dua mekanisme GitHub yang terpisah dan tidak
saling tahu** — `12_Service_GitHubBackup.gs` (lama) dan
`13_Service_GitHubOps.gs` (baru). Lihat §8.6 untuk implikasinya.

## 5. Referensi Detail per File (level fungsi/method)

### 5.1 `00_Config.gs` — `Config`
| Method | Perilaku |
|---|---|
| `load()` | Baca semua Script Properties sekali, simpan di `_cache`. Panggilan berikutnya langsung return cache. Mengembalikan object dengan 16 key: `telegramBotToken, myChatId, geminiApiKey, geminiModelProPreview, geminiModelFlash, geminiModelFlashLite, groqApiKey, spreadsheetId, sharedSecret, googleSearchApiKey, googleSearchEngineId, tavilyApiKey, githubToken, githubRepoOwner, githubRepoName, githubBranch`. |
| `clearCache()` | Set `_cache = null`. |
| `reload()` | `clearCache()` lalu `load()` ulang — dipakai kalau Script Properties berubah di tengah eksekusi (jarang dipakai, tidak ada pemanggilnya di kode saat ini). |

### 5.2 `01_SpreadsheetGateway.gs` — `SpreadsheetGateway`
| Method | Perilaku |
|---|---|
| `getSpreadsheet()` | `SpreadsheetApp.openById(Config.load().spreadsheetId)`, di-cache di `_spreadsheet`. |
| `getSheet(sheetName)` | Ambil sheet by nama, cache per-nama di `_sheets{}`. **Throw** `Error('Sheet tidak ditemukan: ' + sheetName)` kalau sheet tidak ada. |
| `appendRowSafe(sheetName, rowData)` | Insert baris dengan retry **3x**, `Utilities.sleep(1500)` antar percobaan. Dipakai untuk menghindari error kuota "Service invoked too many times for one second". Ini satu-satunya cara insert yang "disetujui" desain proyek. |

### 5.3 `02_Utils.gs`
| Object.Method | Perilaku |
|---|---|
| `IdGenerator.generate(prefix)` | Return `prefix + '-' + Date.now()`. Bukan UUID — dua ID dengan prefix sama bisa collision kalau dipanggil dalam milidetik yang sama (risiko sangat kecil, GAS single-threaded per eksekusi). |
| `DateTimeUtils.WIB_OFFSET_MS` | Konstanta `7 * 60 * 60 * 1000`. |
| `DateTimeUtils.toWIB(date)` | `new Date(date.getTime() + WIB_OFFSET_MS)` — geser manual, bukan pakai timezone API. |
| `DateTimeUtils.nowWIB()` | `toWIB(new Date())`. |
| `DateTimeUtils.formatWaktu(date)` | Format `dd/MM/yyyy HH:mm` + `' WIB'`, untuk ditampilkan ke user. |
| `DateTimeUtils.formatUntukPrompt(date)` | Format `dd/MM/yyyy HH:mm`, dipakai untuk konteks ke LLM (tanpa geser WIB lagi karena input sudah WIB). |
| `DateTimeUtils.formatPeriode(date)` | Konversi ke WIB dulu, lalu format `yyyy-MM`. **Wajib** dipakai untuk identifikasi "bulan berapa" — jangan format manual. |

### 5.4 `03_AppLogger.gs` — `AppLogger`
| Method | Perilaku |
|---|---|
| `write(jenisEvent, detail, status)` | Insert ke `Log_System` via `appendRowSafe`. **Fail-silent**: kalau gagal, error ditelan (`catch(e) {}`) supaya logger tidak pernah mematikan app utama. |
| `info/warning/error(jenisEvent, detail)` | Wrapper `write()` dengan status masing-masing. |

### 5.5 `04_Repository_*.gs`

**`BudgetRepository`** (`Finance_Budgets`): `create(kategori, batasJumlah, periode)`, `getAll()` (map row→object, panggil `_normalizePeriode`), `_normalizePeriode(value)` (kalau Sheets auto-convert string periode jadi `Date`, format ulang jadi string `yyyy-MM`), `findByKategoriAndPeriode`, `getByPeriode`, `updateBatasJumlah(rowIndex, baru)`.

**`ChatHistoryRepository`** (`Chat_History`): `getRecent(limit)` (ambil `limit` baris terakhir, return `{role, text}`), `save(chatId, role, text)`.

**`DocumentationRepository`** (`Documentation`): `getAll()` — baca semua baris yang punya `fileName` DAN `content` terisi, return `[{fileName, content}]`. Hanya dipakai oleh `12_Service_GitHubBackup.gs`.

**`FactsRepository`** (`Memory_Facts`): `save(chatId, factText, category)`, `getActive(maxFacts)` (filter status `Active`, ambil `maxFacts` TERAKHIR kalau melebihi).

**`ReminderRepository`** (`Reminder_RawData`): kolom di-map lewat konstanta `COL` (index 1-based: ID, TIMESTAMP, DESKRIPSI, WAKTU, STATUS, PRIORITAS, TERAKHIR_DIINGATKAN, CATATAN, JENIS_RECURRING, RECURRING_CONFIG, JUMLAH_DIINGATKAN). Method: `create(data)`, `_mapRow`, `getAll()`, `getActive()` (status `'Aktif'`), `getMenungguRespon(batasMenit)` (reminder yang sudah diingatkan dan masih dalam window `batasMenit`), `updateStatus`, `updateTerakhirDiingatkan(rowIndex, jumlahBaru)`, `updateWaktu`, `hitungWaktuBerikutnya(reminder)` (tambah 1 hari/7 hari/1 bulan sesuai `jenisRecurring`), `formatDaftarAktifSebagaiTeks()`.

**`AckPatternsRepository`** (`Reminder_AckPatterns`, di file yang sama dengan `ReminderRepository`): `save(pesanUser, interpretasi, aksi)`, `getRecent(limit)`.

**`TransactionRepository`** (`Finance_Transactions`): konstanta `TIPE_INCOME`/`TIPE_EXPENSE`, `STATUS_ACTIVE`/`STATUS_DELETED`, `COL` map. Method: `create(data)`, `_mapRow`, `getAll()`, `getActive()`, `getLastActive()` (transaksi aktif terakhir, untuk fitur edit), `findById`, `getByWallet(walletId)`, `getByKategoriAndPeriode(kategori, tahunBulan)` (dipakai untuk cek budget), `softDelete(rowIndex)`, `update(rowIndex, updatedFields)` (partial update: kategori/jumlah/deskripsi/walletId, hanya field yang `!== undefined` yang ditulis).

**`WalletRepository`** (`Finance_Wallets`): `create(nama, saldoAwal)`, `getAll()`, `findByName(nama)` (case-insensitive, trim), `findById`, `exists(nama)`.

### 5.6 `05_Service_Telegram.gs` — `TelegramService`
| Method | Perilaku |
|---|---|
| `PLACEHOLDER_OPTIONS` / `pickPlaceholder()` | Array 4 teks placeholder acak ("🤔 Bentar, lagi mikir...", dst), dipilih random. |
| `sendMessage(chatId, text)` | POST ke `/sendMessage` dengan `parse_mode: Markdown`. **Kalau Telegram balas error `"can't parse entities"`** (Markdown user/LLM rusak — mis. bintang tanpa penutup), otomatis kirim ULANG payload yang sama TANPA `parse_mode` (plain text). Return `message_id` atau `null` kalau gagal parse response / semua percobaan gagal. |
| `editMessage(chatId, messageId, text)` | Sama seperti `sendMessage` tapi via `/editMessageText`. Kalau `messageId` falsy, fallback ke `sendMessage()` (pesan baru, bukan edit). Retry plain-text yang sama berlaku di sini. |

> Catatan: ini BUKAN "Telegram Payload Fallback Parser" untuk berbagai
> jenis update Telegram (`edited_message`, `callback_query`, dll) seperti
> yang diklaim di dokumentasi lama — fallback di sini murni soal
> Markdown-parse-failure, bukan soal jenis payload webhook. `10_Handler_Webhook.gs`
> hanya menangani `contents.message` — `edited_message`/`callback_query`
> akan diabaikan (return `'OK'` tanpa proses apa pun).

### 5.7 `06_Service_LLM*.gs`

**`LLMProviderService`**: `CHAINS.advanced` = [gemini-pro-preview, gemini-flash, gemini-flash-lite, groq]; `CHAINS.fast` = [gemini-flash, gemini-flash-lite, groq]. `generate({chain, systemInstruction, messages, temperature})` — iterasi step chain, `try` tiap `step.execute()`, return `{provider, text}` di percobaan pertama yang sukses, `null` kalau semua gagal (log error). `generateFromSinglePrompt(promptText, temperature, chain)` — shortcut untuk 1 pesan user tunggal, default chain `'fast'` kalau tidak diisi.

**`GeminiProvider.call(systemInstruction, messages, temperature, modelName)`**: generik untuk tier model manapun (nama model jadi parameter, bukan hardcode). Konversi role `ai→model`. Throw kalau HTTP 429/503 (overload) atau HTTP lain ≠200, atau kalau `candidates[0].content` kosong.

**`GroqProvider.call(...)`**: model hardcode `openai/gpt-oss-20b`, endpoint `api.groq.com/openai/v1/chat/completions`, `max_tokens: 1536`. Throw kalau API key kosong atau HTTP gagal.

### 5.8 `07_Service_WebSearch*.gs`

**`WebSearchProviderService`**: `getProviders()` — **wajib dibungkus method** (bukan array literal top-level) supaya tidak kena masalah lazy-evaluation (lihat §8.1). `search(query)` — coba tiap provider berurutan, return hasil provider pertama yang sukses, `[]` kalau semua gagal. `formatResultsAsContext(results)` — format numbered list untuk disisipkan ke prompt LLM. `isAnyConfigured()`.

**`GoogleSearchProvider`**: `isConfigured()` cek API key + engine ID ada. `search(query)` — GET ke Custom Search API, `MAX_RESULTS = 5`, throw kalau 429 (kuota habis) atau HTTP lain.

**`TavilySearchProvider`**: `isConfigured()` cek API key. `search(query)` — POST ke Tavily, `include_answer: false`, `MAX_RESULTS = 5`.

### 5.9 `08_Specialist_Chat.gs` — `ChatSpecialist`
| Method | Perilaku |
|---|---|
| `buildSystemPersona()` | Teks persona asisten (informal, jujur, tidak boleh mengarang). **Duplikat identik** dengan `IntentAnalyzer._personaSection()` — lihat §8.8 tech debt. |
| `needsWebSearch(intent)` | `true` kalau `intent.butuhInfoTerkini && intent.searchQuery`. |
| `respondWithSearchContext(userMessage, searchResults, riwayat)` | Bangun 1 prompt (persona + hasil search + riwayat + pesan user), panggil chain `'fast'`. |
| `_formatRiwayat(riwayat)` | Format riwayat jadi teks `User: .../AI: ...`. |

### 5.10 `08_Specialist_CodeAuditor.gs` — `CodeAuditor`

Alur `runAudit(type)` (`type`: `'light'`|`'full'`, default `'full'`):
1. `_collectData()` — baca semua source dari **GitHub** (bukan GAS live!) via `GitHubOpsService.readAllSourceFiles()`, baca nama-nama sheet di spreadsheet, baca daftar key Script Properties (bukan value-nya), baca isi `ARCHITECTURE.md`/`PROGRESS.md` dari GitHub via `GitHubOpsService.readDocFile()`.
2. Tentukan kategori audit: `light` = `[INTEGRITY, CONSISTENCY, ROBUSTNESS]`; `full` = ketujuhnya (+ `SECURITY, PERFORMANCE, DEAD_CODE, DOC_SYNC`).
3. `_analyzeInBatches(data, categories)` — file dibagi 4 batch tetap berdasarkan prefix nomor (`_splitIntoBatches`: batch0=00-03, batch1=04-05, batch2=06-08, batch3=sisanya/09+), tiap batch dikirim sebagai 1 prompt terpisah ke LLM chain `advanced` (temperature 0.2), hasil di-parse jadi array finding JSON, digabung + `_deduplicateFindings` (key: `fileName + 50 char pertama description`).
4. `_saveReport(findings, type)` — insert 1 baris ke sheet `Audit_Reports` (kolom: id, timestamp, type, **`0` hardcoded — lihat catatan**, totalFindings, jumlahCritical, jumlahWarning, `'completed'`), lalu `_saveFindings` — insert 1 baris per finding ke `Audit_Findings` (id, reportId, severity, category, fileName, description, `'pending'`).
5. `_formatReportForChat(findings, type)` — bangun teks ringkas untuk Telegram (dipecah per severity, dipotong ke ≤3800 char karena limit pesan Telegram, kirim detail lengkap sebagai pesan Telegram terpisah kalau finding >5).

`runScheduledAudit()` — `type = (dayOfMonth === 1) ? 'full' : 'light'`, lalu kirim hasil `runAudit()` langsung ke `config.myChatId` via `TelegramService.sendMessage`. **Catatan**: variabel `dayOfWeek` dihitung tapi tidak pernah dipakai (dead code).

`fixIssues(scope)` (`scope`: `'all'`|`'critical'`|`'critical+warning'`): ambil finding `pending` terbaru dari `Audit_Findings` (`_getLatestPendingFindings`), filter sesuai scope (`_filterByScope`), `_generateFixes(filtered)` — baca ulang source file yang relevan dari GitHub, minta LLM (chain `advanced`, temp 0.1) generate kode LENGKAP hasil perbaikan per file dalam format JSON `{fixes:[{fileName, patchedCode, changes}], summary}`, lalu `_applyFixes(fixes, scope)` — bikin branch baru `audit/fix-<scope>-<timestamp>` via `GitHubOpsService.createBranch`, commit tiap file yang diperbaiki (`commitFile`), buat 1 Pull Request (`createPullRequest`) berisi ringkasan semua perubahan, lalu `_markFindingsFixed(filtered)` update status jadi `'fixed'` di sheet.

`shouldOfferAudit()` — cek apakah audit terakhir (`_getLastAuditDate`, dari sheet `Audit_Reports`) sudah ≥7 hari lalu. **Tidak dipanggil dari mana pun di kode saat ini** — dead code / fitur belum tersambung.

### 5.11 `08_Specialist_Finance.gs` — `FinanceSpecialist`
(Tidak berubah sejak analisis sebelumnya — tetap lengkap secara fungsional, tetap tidak ada pintu masuk dari intent/command.)

| Method | Perilaku |
|---|---|
| `resolveWallet(namaWallet)` | Default nama `'Cash'` kalau kosong; auto-create wallet baru (saldo 0) kalau belum ada. |
| `getSaldoWallet(walletId)` | `saldoAwal + totalIncome - totalExpense` dari semua transaksi aktif wallet itu. |
| `getAllSaldoAsText()` | Ringkasan semua wallet + total gabungan, format Rupiah. |
| `recordTransaction(data)` | Resolve wallet → insert transaksi → hitung saldo terbaru → cek alert budget (`_checkBudgetAlert`) kalau tipe expense → return `{success, text, transactionId}`. |
| `editLastTransaction(updatedFields)` | Ambil transaksi aktif TERAKHIR (bukan by ID spesifik), update field yang dikirim. |
| `getRingkasanPeriode(periode)` | Total masuk/keluar/saldo bersih + breakdown per kategori untuk 1 periode `yyyy-MM`. |
| `createOrUpdateBudget(kategori, batasJumlah, periode)` | Upsert budget. |
| `_checkBudgetAlert(kategori, tanggalTransaksi)` | Threshold warning 80% (`BUDGET_WARNING_THRESHOLD`), exceeded 100% (`BUDGET_EXCEEDED_THRESHOLD`). |
| `_formatRupiah(angka)` | `Math.round(angka).toLocaleString('id-ID')`. |

### 5.12 `08_Specialist_Knowledge.gs` — `KnowledgeSpecialist`
`saveFact/saveManualFact/saveAutoDetectedFacts`, `getActiveFactsForPrompt(limit)`, `findRelevantToKeyword(keyword, limit)` (substring match, case-insensitive) — dipakai `ReminderSpecialist._buildRelevantFactContext` untuk menyisipkan 1 fakta relevan di notifikasi reminder.

### 5.13 `08_Specialist_Reminder.gs` — `ReminderSpecialist`
(Tidak berubah.) `getMenungguRespon()`, `listActiveAsText()`, `getAckPatternsForPrompt(limit)`, `create(reminderData)` (return error text kalau `waktuPertama` kosong), `acknowledge(pesanUserAsli, ackIntent, remindersMenunggu)` → `_handleDone`/`_handleSnooze`, `getRemindersDueNow()` (filter `_isDueNow`: waktu sudah lewat DAN (belum pernah diingatkan ATAU sudah lewat cooldown 5 menit)), `buildNotificationText`, `markAsNotified`, `hitungWaktuBerikutnya` untuk recurring saat "done".

### 5.14 `08_Specialist_SelfHealing.gs` — `SelfHealingSpecialist`

`getLevel()` — baca `SELF_HEAL_LEVEL` dari Script Properties (bukan dari `Config.load()`, langsung `PropertiesService`), default `2`, clamp ke 1-3. **Catatan**: level 1 dan level ≥2 punya perilaku berbeda (lihat `diagnose()`), tapi level 2 dan level 3 memicu kode yang PERSIS SAMA — tidak ada logika yang membedakan keduanya di `diagnose()` atau di manapun.

`diagnose(keluhanUser)`:
1. `_getRecentLogs(30)` dari sheet `Log_System` → `_filterErrorLogs` (event mengandung `FAIL`/`ERROR`/`BAD`/`RETRY` atau `status==='ERROR'`).
2. `_identifySuspectFiles(errorLogs, keluhan)` — mapping keyword event → nama file (lihat tabel di bawah), **plus selalu tambahkan** `09_Manager.gs` ke daftar suspect.
3. Baca source file suspect dari **GitHub** (`GitHubOpsService.readFile`), bukan dari GAS live.
4. `_askLLMForDiagnosis` — kirim keluhan + error log + source code suspect ke LLM chain `advanced` (temp 0.1), minta JSON `{diagnosis, technicalDetail, fileName, patchedCode, changes}`.
5. Kalau `patchedCode` kosong → `_formatDiagnosisOnly` (hanya kasih penjelasan, tanpa patch).
6. Kalau ada patch → `_savePatch()` ke sheet `SelfHeal_Patches` (status `'pending'`), lalu kalau `getLevel() >= 2` langsung `_applyToGitHub()` (bikin branch `fix/<filename>-<timestamp>`, commit, buat PR). Kalau level `1`, hanya `_formatPatchForChat()` (kasih tahu ada patch tersimpan, TIDAK di-commit).

**Mapping `_identifySuspectFiles` (⚠️ tidak akurat, lihat §8.5):**
```
TELEGRAM  → 05_Service_Telegram.gs        (BENAR)
LLM       → 06_Service_LLM.gs             (file ini TIDAK ADA, seharusnya 06_Service_LLMProvider.gs)
INTENT    → 09_Manager_IntentAnalyzer.gs  (BENAR)
WEBHOOK   → 10_Handler_Webhook.gs         (BENAR)
REMINDER  → 11_Trigger_ReminderChecker.gs (BENAR)
FINANCE   → 08_Specialist_Finance.gs      (BENAR)
REPO      → 01_SpreadsheetGateway.gs      (BENAR)
SEARCH    → 07_Service_WebSearch.gs       (file ini TIDAK ADA, seharusnya 07_Service_WebSearchProvider.gs)
GITHUB    → 13_Service_GitHubOps.gs       (BENAR)
SELF_HEAL → 08_Specialist_SelfHealing.gs  (BENAR)
```

`updateDocumentation(instruction)`: baca `ARCHITECTURE.md` & `PROGRESS.md` dari GitHub, kirim ke LLM (chain `advanced`, temp 0.2) dengan instruksi user, minta JSON `{files:[{fileName, content}], summary}`, lalu `GitHubOpsService.updateDocFile()` untuk tiap file — commit ke GitHub **dan** sinkron balik ke sheet `Documentation` kalau berhasil.

`applyPendingPatch(patchId)` — cari patch (by ID, atau kalau `null` → **patch pertama yang ditemukan tanpa filter**, lihat implementasi `_getPatchById`), cek statusnya `'pending'`, lalu jalankan `_applyToGitHub`. Dipanggil dari command `/patch apply`.

`_getRecentLogs`, `_savePatch`, `_getPatchById`, `_updatePatchStatus` — semua akses langsung ke sheet `Log_System`/`SelfHeal_Patches` (bukan lewat Repository `04_*` — modul ini "melewati" pola repository yang dipakai modul lain, lihat §8.2).

### 5.15 `09_CommandRouter.gs` — `CommandRouter`
Command yang dikenali (`isKnownCommand`): `/ingat <teks>` (prefix match), `/reminder`/`/reminders` (exact match), dan (case-insensitive first word) `/diagnose`, `/heal`, `/logs`, `/patch`, `/audit`, `/fix`.

| Command | Handler |
|---|---|
| `/ingat <teks>` | `KnowledgeSpecialist.saveManualFact` |
| `/reminder`, `/reminders` | `ReminderSpecialist.listActiveAsText()` |
| `/diagnose <keluhan>`, `/heal <keluhan>` | `SelfHealingSpecialist.diagnose(keluhan atau default text)` |
| `/logs [jumlah]` | Panggil `SelfHealingSpecialist._getRecentLogs(count)` **langsung memanggil method privat** (prefix `_`) dari luar modulnya — pelanggaran konvensi privat/publik (lihat §8.2) |
| `/patch apply` | `SelfHealingSpecialist.applyPendingPatch(null)` |
| `/patch` (tanpa argumen) | Tampilkan bantuan command patch |
| `/audit [light]` | `CodeAuditor.runAudit(scope)`, default `'full'` |
| `/fix [scope]` | `CodeAuditor.fixIssues(scope)`, default `'all'` |

Tidak ada command untuk Finance maupun untuk `updateDocumentation` (hanya via intent percakapan, lihat §5.17).

### 5.16 `09_Manager.gs` — `Manager`
`processConversationalMessage(chatId, text)` → `_gatherContext()` (riwayat 15, fakta 50, reminder menunggu, ack pattern 10) → `IntentAnalyzer.analyze()` → kalau gagal → `_handleIntentFailure` (fallback LLM chain `advanced` langsung dengan riwayat mentah, tanpa struktur intent) → kalau berhasil → `_persistAutoFacts` → `_routeIntent`.

`_routeIntent` cabang berdasarkan `intent.tipe`:
- `'ack_reminder'` (+ ada reminder menunggu) → `_handleAckReminder` → `ReminderSpecialist.acknowledge`, fallback ke `_handleChatBiasa` kalau gagal
- `'buat_reminder'` → `_handleBuatReminder` → `ReminderSpecialist.create`
- `'diagnose_error'` → `_handleDiagnoseError` → `SelfHealingSpecialist.diagnose`
- `'update_docs'` → `_handleUpdateDocs` → `SelfHealingSpecialist.updateDocumentation`
- lainnya (termasuk `'chat_biasa'`) → `_handleChatBiasa` → web search kalau `butuhInfoTerkini`, kalau tidak pakai `intent.jawabanChat` langsung (hemat 1 API call karena intent analysis sudah sekaligus menjawab)

**Tidak ada cabang untuk Finance atau untuk memicu `CodeAuditor` dari percakapan natural** — audit hanya bisa dipicu via command `/audit` atau trigger terjadwal.

### 5.17 `09_Manager_IntentAnalyzer.gs` — `IntentAnalyzer`
`analyze(userMessage, context)` — bangun 1 prompt raksasa via `_buildPrompt` (persona + waktu sekarang WIB + riwayat + fakta + reminder menunggu + ack pattern + pesan user + skema output + aturan), panggil chain `'advanced'`, parse hasil (`_parseResponse`, strip markdown fence, `JSON.parse`, return `null` kalau gagal parse — di-log sebagai warning, bukan error).

Skema output JSON (`_outputSchemaSection`) — field `tipe` sekarang punya 5 nilai: `"ack_reminder" | "buat_reminder" | "chat_biasa" | "diagnose_error" | "update_docs"`. Field lain: `aksiReminder, reminderId, snoozeMinit, alasan, deskripsi, waktuPertama, jenisRecurring, recurringConfig, prioritas, catatan, jawabanChat, butuhInfoTerkini, searchQuery, factsBaru`, plus 2 object baru: `diagnose_error: {keluhanUser}` dan `update_docs: {instruksi}`.

`_rulesSection` — aturan tambahan termasuk kapan `diagnose_error` dipicu ("user mengeluhkan tentang dirimu yang error, tidak merespons, macet...") dan kapan `update_docs` dipicu ("user secara eksplisit meminta update dokumen proyek").

**Tidak ada tipe intent untuk Finance** — ini konfirmasi ulang gap yang sudah teridentifikasi sebelumnya, masih ada di versi kode terbaru.

### 5.18 `10_Handler_Webhook.gs` — `WebhookHandler` + `doPost(e)`
(Tidak berubah dari analisis sebelumnya.) Urutan: `_isAuthorized` (cek `?secret=`) → parse JSON body → `_isDuplicateUpdate` (dedup via `CacheService`, TTL 6 jam) → cek `contents.message` ada & punya `text` (selain itu diabaikan, termasuk `edited_message`/`callback_query`) → cek `chatId === config.myChatId` → `_processMessage`: kalau command dikenal, proses langsung tanpa placeholder; kalau tidak, kirim placeholder dulu lalu `Manager.processConversationalMessage` lalu `editMessage`.

### 5.19 `11_Trigger_AuditScheduler.gs` — `AuditScheduler`
`runScheduledAudit()` → panggil `CodeAuditor.runScheduledAudit()` dibungkus try/catch. `setupWeeklyTrigger()` → hapus trigger lama dengan handler `runScheduledAuditWrapper`, buat trigger baru **setiap hari Senin jam 07:00 WIB**. Fungsi global `runScheduledAuditWrapper()` dan `setupWeeklyTrigger()` sebagai wrapper (GAS trigger cuma bisa panggil fungsi global, bukan method object).

⚠️ **Lihat §8.4** — logika "audit penuh di tanggal 1" di `CodeAuditor.runScheduledAudit()` hanya akan pernah tereksekusi kalau tanggal 1 KEBETULAN jatuh di hari Senin, karena satu-satunya trigger yang dibuat adalah mingguan (Senin).

### 5.20 `11_Trigger_ReminderChecker.gs`
(Tidak berubah.) `cekDanKirimReminder()` — dipanggil trigger 1 menit, kirim notifikasi untuk semua reminder due. `setupReminderTrigger()` — setup trigger, hapus duplikat dulu.

### 5.21 `12_Service_GitHubBackup.gs` — `GitHubBackupService` **[mekanisme LAMA]**
`backupAllFiles()` — baca source project GAS **sendiri** via Apps Script API (`ScriptApp.getScriptId()` + `ScriptApp.getOAuthToken()`, endpoint `script.googleapis.com`), push tiap file ke `src/` di GitHub. `backupDocs()` — baca sheet `Documentation` (`DocumentationRepository.getAll()`), push ke ROOT repo GitHub. `_pushFileToGitHub` — PUT ke GitHub Contents API, ambil SHA existing dulu (`_getExistingFileSha`) untuk update (bukan create). Fungsi global `runFullBackup()` (jalankan keduanya berurutan) dan `setupDailyBackupTrigger()` (trigger harian jam 23:00).

Konfigurasi GitHub untuk modul ini dibaca **langsung dari `PropertiesService`** di `_loadGitHubConfig()`, BUKAN dari `Config.load()` — meskipun key Script Property-nya sama (`GITHUB_TOKEN`, dst) dan sekarang `Config.load()` juga sudah menyediakan field yang sama. Jadi ada 2 jalur baca config GitHub yang independen di kode ini.

### 5.22 `13_Service_GitHubOps.gs` — `GitHubOpsService` **[mekanisme BARU]**
Operasi generik ke GitHub REST API, dipakai oleh `CodeAuditor` dan `SelfHealingSpecialist`:
- `readFile(path, ref)` — GET Contents API, decode base64, return `{content, sha, path}`.
- `listDirectory(path)` — GET Contents API untuk direktori, return array `{name, path, type, sha}`.
- `readAllSourceFiles()` — `listDirectory('src')` lalu `readFile` tiap file `.gs`, return map `{fileName: {content, sha}}`.
- `createBranch(branchName)` — ambil SHA base branch dari `config.githubBranch`, buat ref baru. Kalau branch sudah ada (`"already exists"` di message), dianggap sukses.
- `commitFile(path, content, message, branch, sha)` — PUT Contents API, sertakan `sha` kalau update file existing.
- `createPullRequest(title, body, head, base)` — POST ke `/pulls`, return `html_url` PR atau `null`.
- `readDocFile(fileName)` — alias `readFile(fileName)` (baca dari root repo, bukan `src/`).
- `updateDocFile(fileName, newContent, commitMessage)` — commit ke GitHub root, DAN kalau sukses, sinkron balik isinya ke sheet `Documentation` (update baris existing atau `appendRowSafe` kalau belum ada).

Konfigurasi GitHub modul ini dibaca dari `Config.load()` (field `githubToken`, dst) — beda sumber dengan `12_Service_GitHubBackup.gs` (lihat di atas).

### 5.23 `99_Tests.gs`
Fungsi manual (dijalankan dari dropdown editor GAS, bukan automated test framework): `test_Batch7b_FinanceSpecialist()` (skenario penuh: income, expense, cek saldo, budget, alert, edit, ringkasan), `debug_CheckOAuthScopes()`, `debug_CheckGitHubConfig()` (verifikasi token/owner/repo GitHub — pakai gaya baca manual sendiri, bukan lewat service manapun), `test_TelegramMarkdownFallback()` (simulasi kirim Markdown rusak untuk verifikasi retry plain-text di `TelegramService`).

## 6. Alur Data Utama

### 6.1 Pesan masuk (jalur percakapan)
```
Telegram → doPost(e)
  1. Validasi secret
  2. Dedup update_id
  3. Ambil contents.message (abaikan jenis update lain)
  4. Validasi chatId (allowlist 1 user)
  5. isKnownCommand?
       YA  → CommandRouter.handle() → sendMessage() [fast path, no LLM]
       TIDAK → sendMessage(placeholder) → Manager.processConversationalMessage()
               → IntentAnalyzer.analyze() [1 LLM call, chain advanced]
               → routeIntent berdasar tipe (ack_reminder / buat_reminder /
                 diagnose_error / update_docs / chat_biasa)
               → editMessage(placeholder → jawaban final)
```

### 6.2 Reminder checker (tiap 1 menit)
```
cekDanKirimReminder() → ReminderSpecialist.getRemindersDueNow()
  → untuk tiap reminder due: buildNotificationText → sendMessage → markAsNotified
```

### 6.3 Audit terjadwal (Senin 07:00 WIB)
```
runScheduledAuditWrapper() → AuditScheduler.runScheduledAudit()
  → CodeAuditor.runScheduledAudit()
     → type = full jika tanggal 1, else light [tapi trigger cuma jalan hari Senin, lihat §8.4]
     → runAudit(type) → _collectData (baca GitHub) → _analyzeInBatches (LLM per batch)
       → _saveReport (sheet Audit_Reports + Audit_Findings)
     → TelegramService.sendMessage(hasil laporan)
```

### 6.4 Audit manual + auto-fix (via chat)
```
User: "/audit" atau "/audit light" → CodeAuditor.runAudit()  [balikan: ringkasan + tawaran fix]
User: "/fix critical" → CodeAuditor.fixIssues(scope) → ambil pending findings
  → LLM generate patch → GitHubOpsService: createBranch → commitFile (tiap file)
  → createPullRequest → markFindingsFixed
```
⚠️ Perhatikan: `_formatReportForChat` menyarankan user membalas dengan
kalimat natural ("ya semua", "yang kritis aja", "nanti dulu"), tapi
`IntentAnalyzer` **tidak** punya intent type untuk menangkap balasan itu
dan meneruskannya ke `CodeAuditor.fixIssues()` — satu-satunya jalan yang
benar-benar berfungsi adalah user mengetik command eksplisit `/fix
<scope>`. Ini kemungkinan besar **gap UX**, lihat PROGRESS.md.

### 6.5 Self-healing diagnose (via command atau chat natural)
```
User: "/diagnose kok lambat banget" ATAU chat natural yang terdeteksi
      intent 'diagnose_error'
  → SelfHealingSpecialist.diagnose(keluhan)
     → baca 30 log terakhir → filter error → tebak file suspect (mapping keyword)
     → baca source suspect dari GitHub (BUKAN dari GAS live)
     → LLM diagnosis + generate patch
     → simpan ke SelfHeal_Patches
     → level>=2: langsung commit ke branch baru + buat PR
     → level==1: hanya laporkan, tidak commit
```
⚠️ **Loop tidak tertutup**: PR yang dibuat harus di-merge manual di
GitHub oleh user, TAPI bahkan setelah merge, kode di **GAS project yang
sedang live tidak otomatis ikut berubah** — tidak ada mekanisme
GitHub→GAS. User harus salin manual kode hasil fix dari GitHub kembali
ke editor GAS. Detail dampak di PROGRESS.md.

### 6.6 Backup manual/terjadwal (GAS → GitHub, mekanisme lama)
```
runFullBackup() [harian jam 23:00 kalau trigger sudah di-setup]
  1. backupAllFiles(): baca source GAS sendiri via Apps Script API → push src/
  2. backupDocs(): baca sheet Documentation → push ke root repo
```

## 7. Data Model (Google Sheets)

| Sheet | Dipakai oleh | Kolom (urutan) |
|---|---|---|
| `Log_System` | `AppLogger`, dibaca `SelfHealingSpecialist` | timestamp, jenisEvent, detail, status |
| `Finance_Budgets` | `BudgetRepository` | id, kategori, batasJumlah, periode (`yyyy-MM`), createdAt |
| `Chat_History` | `ChatHistoryRepository` | id, timestamp, chatId, role, text |
| `Documentation` | `DocumentationRepository`, ditulis `GitHubOpsService.updateDocFile` | fileName, content |
| `Memory_Facts` | `FactsRepository` | id, timestamp, chatId, category, factText, status |
| `Reminder_RawData` | `ReminderRepository` | id, timestamp, deskripsi, waktu, status, prioritas, terakhirDiingatkan, catatan, jenisRecurring, recurringConfig, jumlahDiingatkan |
| `Reminder_AckPatterns` | `AckPatternsRepository` | id, timestamp, pesanUser, interpretasi, aksi |
| `Finance_Transactions` | `TransactionRepository` | id, timestamp, walletId, tanggalTransaksi, tipe, kategori, jumlah, deskripsi, status |
| `Finance_Wallets` | `WalletRepository` | id, nama, saldoAwal, createdAt |
| `Audit_Reports` | `CodeAuditor._saveReport`/`_getLastAuditDate` | id, timestamp, type, **kolom ke-4 selalu `0` hardcoded (lihat §8.3)**, totalFindings, jumlahCritical, jumlahWarning, status |
| `Audit_Findings` | `CodeAuditor` (`_saveFindings`, `_getLatestPendingFindings`, `_markFindingsFixed`) | id, reportId, severity, category, fileName, description, status (`pending`/`fixed`) |
| `SelfHeal_Patches` | `SelfHealingSpecialist` (`_savePatch`, `_getPatchById`, `_updatePatchStatus`) | id, timestamp, fileName, diagnosis, patchedCode, status (`pending`/`committed`) |

**Sheet baru (`Audit_Reports`, `Audit_Findings`, `SelfHeal_Patches`) harus
sudah dibuat manual di spreadsheet** — tidak ada kode yang membuat sheet
otomatis kalau belum ada (`SpreadsheetGateway.getSheet` akan throw error
kalau sheet belum dibuat).

## 8. Pola Desain & Catatan Arsitektural Penting

### 8.1 Lazy Evaluation Rule (masih berlaku, masih dipatuhi)
Referensi antar modul tidak boleh jadi property array literal top-level,
harus dibungkus method (contoh: `WebSearchProviderService.getProviders()`,
`LLMProviderService.CHAINS` yang isinya fungsi `execute`, bukan hasil
panggilan langsung).

### 8.2 Repository Bypass di Modul Baru
Modul lama (`04_Repository_*.gs`) semua diakses lewat Repository yang
membungkus `SpreadsheetGateway`. **Modul baru (`CodeAuditor`,
`SelfHealingSpecialist`) TIDAK mengikuti pola ini** — mereka memanggil
`SpreadsheetGateway.getSheet('Audit_Reports')`,
`.getSheet('Audit_Findings')`, `.getSheet('SelfHeal_Patches')`,
`.getSheet('Log_System')` secara **langsung**, tanpa lapisan Repository.
Bukan bug fungsional, tapi inkonsisten dengan pola akses-Sheet-lewat-Repository
yang konsisten dipakai semua modul lama.

### 8.3 Kolom Misterius di `Audit_Reports`
`_saveReport` menulis kolom ke-4 selalu literal `0`:
```js
SpreadsheetGateway.appendRowSafe('Audit_Reports', [
  id, timestamp, type,
  0, findings.length, critical, warning, 'completed'
]);
```
Tidak ada dokumentasi/komentar soal kolom ini dan tidak ada tempat lain
di kode yang membacanya kembali sebagai sesuatu yang bermakna. Kemungkinan
sisa dari desain awal (misal "jumlah file yang dianalisis") yang belum
sempat diisi datanya sebenarnya.

### 8.4 Trigger Audit Bulanan Tidak Akan Jalan (kecuali kebetulan)
`CodeAuditor.runScheduledAudit()` menentukan `type = 'full'` HANYA kalau
`new Date().getDate() === 1`. Tapi satu-satunya trigger terjadwal yang
dibuat kode (`AuditScheduler.setupWeeklyTrigger()`) adalah **setiap hari
Senin jam 07:00**. Karena trigger ini yang memanggil
`runScheduledAudit()`, audit `'full'` hanya akan pernah terjadi kalau
tanggal 1 bulan itu **kebetulan** jatuh di hari Senin (~1 dari 7 bulan).
Di bulan lainnya, audit terjadwal SELALU `'light'`, tidak peduli tanggal.

### 8.5 Bug Konkret: Suspect-File Mapping Salah Nama
Lihat tabel di §5.14. Dua entri (`LLM`, `SEARCH`) di
`_identifySuspectFiles` menunjuk ke nama file yang tidak pernah ada di
repo (`06_Service_LLM.gs`, `07_Service_WebSearch.gs`). Dampak nyata:
kalau error sebenarnya ada di `06_Service_LLMProvider.gs` atau
`07_Service_WebSearchProvider.gs`, `GitHubOpsService.readFile()` akan
gagal (404) untuk nama file yang salah itu, file tersebut TIDAK masuk
`sourceMap`, dan LLM diagnosis tidak akan pernah melihat source code file
yang sebenarnya bermasalah — walau `09_Manager.gs` tetap selalu disertakan
sebagai fallback.

### 8.6 Dua Mekanisme GitHub yang Tidak Disatukan
`12_Service_GitHubBackup.gs` (lama) dan `13_Service_GitHubOps.gs` (baru)
sama-sama bicara ke GitHub Contents API, TAPI:
- Sumber config berbeda (`PropertiesService` langsung vs `Config.load()`).
- Arah data berbeda: `12_` = GAS→GitHub (one-way, isi "kebenaran" ada di
  GAS project), `13_` = baca DARI GitHub lalu commit KE GitHub — dan
  konsumennya (`CodeAuditor`, `SelfHealingSpecialist`) **menganggap isi
  GitHub sebagai representasi kode yang berjalan**, padahal itu cuma
  representasi kode **hasil backup terakhir**.

**Implikasi operasional yang penting**: kalau kamu mengedit kode langsung
di editor GAS tapi belum menjalankan `runFullBackup()` (mekanisme lama),
maka `/audit` dan `/diagnose` akan menganalisis **versi source yang
lama/stale** dari GitHub, bukan kode yang sebenarnya sedang berjalan di
GAS. Urutan operasi yang aman: **edit di GAS → `runFullBackup()` →
baru jalankan `/audit` atau `/diagnose`**.

### 8.7 Loop Self-Healing Belum Tertutup
Lihat §6.5. `SelfHealingSpecialist` bisa mendiagnosis dan membuat PR di
GitHub, tapi tidak ada jalur otomatis untuk menerapkan hasil fix itu
balik ke project GAS yang live. Fitur ini efektifnya adalah "asisten
diagnosis dan pembuat draft PR", bukan "self-healing" dalam arti sistem
benar-benar memperbaiki dirinya sendiri secara end-to-end.

### 8.8 Duplikasi Persona (carry-over)
`ChatSpecialist.buildSystemPersona()` dan
`IntentAnalyzer._personaSection()` masih identik dan terpisah — belum
disatukan sejak temuan sebelumnya.

### 8.9 Hal yang Perlu Diverifikasi (bukan bug pasti)
`GitHubOpsService.readFile`/`commitFile` memakai
`encodeURIComponent(path)` pada path yang mengandung `/` (contoh:
`'src/09_Manager.gs'`). `encodeURIComponent` akan meng-encode `/`
menjadi `%2F`. Selama ini sepertinya berfungsi (tidak ada laporan error
di kode/log yang terbaca), kemungkinan karena GitHub API men-decode
`%2F` di path sebelum routing — tapi ini **asumsi, bukan sesuatu yang
diverifikasi dari dokumentasi resmi GitHub di sesi analisis ini**. Kalau
suatu saat `readFile`/`commitFile` mulai gagal 404 untuk path
bersegmen banyak, ini titik pertama yang layak dicek.

## 9. Security Model
(Tidak berubah.) Shared secret di query param, allowlist 1 chat ID,
dedup `update_id` via `CacheService` TTL 6 jam, semua API key/token di
Script Properties.

## 10. Referensi Script Properties

| Key | Dipakai untuk |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Kirim/edit pesan Telegram |
| `MY_TELEGRAM_CHAT_ID` | Allowlist satu-satunya user |
| `GEMINI_API_KEY`, `GEMINI_MODEL_PRO_PREVIEW`, `GEMINI_MODEL_FLASH`, `GEMINI_MODEL_FLASH_LITE` | Chain LLM Gemini |
| `GROQ_API_KEY` | Fallback LLM terakhir |
| `SPREADSHEET_ID` | Database Sheets |
| `SHARED_SECRET` | Validasi webhook |
| `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID` | Web search primer |
| `TAVILY_API_KEY` | Web search fallback |
| `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BRANCH` | Dipakai OLEH KEDUANYA — `12_Service_GitHubBackup.gs` (baca langsung dari `PropertiesService`) DAN `13_Service_GitHubOps.gs` (baca dari `Config.load()`) |
| `SELF_HEAL_LEVEL` | Level 1-3 (default 2) di `SelfHealingSpecialist.getLevel()` — level 2 dan 3 berperilaku identik saat ini |

Tidak ada satupun value dari key di atas yang ditulis di kode/dokumen ini.
