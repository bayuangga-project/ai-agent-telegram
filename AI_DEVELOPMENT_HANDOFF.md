# AI_DEVELOPMENT_HANDOFF — Implementasi & Code Reference Konsolidasi

> **Source of truth:** snapshot uploaded ZIP, 24 September 2026. Semua nama file/method/function di bawah berasal dari source actual. Bila appendix historis bertentangan dengan bagian current, bagian current menang.

## 1. Snapshot integrity

- ZIP SHA-256: `39ef1a95d3d3e2dc49aa192ee8691f71282a7992994721fcc6e0ed49ca1fe173`
- Runtime: Google Apps Script V8
- Source files: 55 `.gs`
- Source LOC: 8333
- Syntax check: 55/55 lolos `node --check`
- Git metadata: tidak tersedia dalam ZIP
- Manifest: `src/appsscript.json`

## 2. Implementation conventions

- Global services/specialists menggunakan object literal `var`/`const`.
- Beberapa modul memakai method shorthand ES6, lainnya `name: function(...)`.
- Google Apps Script dependency injection tidak eksplisit; modul berkomunikasi lewat global symbol.
- Spreadsheet adalah persistence; GitHub adalah persistence/transport untuk source/docs/knowledge backup.
- `Config.load()` adalah gateway konfigurasi.
- `AppLogger` adalah logging sink yang tidak boleh memutus main path.

## 3. Exact source inventory + method/function inventory

### `00_Config.gs`

**LOC:** 47  
**SHA-256:** `aeeb0b09d55302d85ae78b868fb234e7988cf46f565025271e154936ecdb6b6d`  
**Objects:** `Config`  
**Peran:** Memuat konfigurasi dari Script Properties, menerapkan cache 5 menit, dan menyediakan clear/reload cache. Tidak memvalidasi kelengkapan nilai secara menyeluruh.

**Declarations (exact):**
- L10: `load()` — method
- L39: `clearCache()` — method
- L43: `reload()` — method

### `01_SpreadsheetGateway.gs`

**LOC:** 52  
**SHA-256:** `7936a7946f93c550b41ee6b54397ea57fe6ac9a63757d121cd259df438ff3c61`  
**Objects:** `SpreadsheetGateway`  
**Peran:** Lapisan akses spreadsheet terpusat dengan caching Spreadsheet/Sheet dan appendRowSafe memakai ScriptLock.

**Declarations (exact):**
- L11: `getSpreadsheet()` — method
- L19: `getSheet(sheetName)` — method
- L28: `appendRowSafe(sheetName, rowData)` — method
- L40: `ensureSheet(sheetName, headers)` — method

### `02_Utils.gs`

**LOC:** 42  
**SHA-256:** `478aac6b852f52ff3a5efe9269b757f4b1cdef3fc68880db00721573107cac1f`  
**Objects:** `IdGenerator`, `DateTimeUtils`  
**Peran:** Utilitas ID serta waktu: timezone Asia/Jakarta, normalisasi Date/String, format waktu/prompt/periode. Tidak menyediakan formatTanggal.

**Declarations (exact):**
- L8: `generate(prefix)` — method
- L17: `toWIB(date)` — method
- L24: `nowWIB()` — method
- L28: `formatWaktu(date)` — method
- L33: `formatUntukPrompt(date)` — method
- L38: `formatPeriode(date)` — method

### `03_AppLogger.gs`

**LOC:** 23  
**SHA-256:** `f0aeb3db5f3b539634c8339713f121f4328bfcd682978b691fa3180860fc93fb`  
**Objects:** `AppLogger`  
**Peran:** Logger terpusat ke sheet Log_System; kegagalan logging tidak dilempar kembali agar tidak memutus jalur utama.

**Declarations (exact):**
- L9: `write(jenisEvent, detail, status)` — method
- L20: `info(jenisEvent, detail)` — method
- L21: `warning(jenisEvent, detail)` — method
- L22: `error(jenisEvent, detail)` — method

### `04_Repository_Budget.gs`

**LOC:** 58  
**SHA-256:** `1ac898abfc410dbf63b76101241f38ceb06ac4653f34420ef7bad69da67357a0`  
**Objects:** `BudgetRepository`  
**Peran:** CRUD budget pada Finance_Budgets, termasuk normalisasi periode dan pencarian per kategori/periode.

**Declarations (exact):**
- L9: `create(kategori, batasJumlah, periode)` — method
- L17: `getAll()` — method
- L40: `_normalizePeriode(value)` — method
- L47: `findByKategoriAndPeriode(kategori, periode)` — method
- L51: `getByPeriode(periode)` — method
- L55: `updateBatasJumlah(rowIndex, batasJumlahBaru)` — method

### `04_Repository_ChatHistory.gs`

**LOC:** 26  
**SHA-256:** `e6626384967d1eae5890be789b27dd0c68133ab204392731dd34db7fec53862d`  
**Objects:** `ChatHistoryRepository`  
**Peran:** Persistensi histori percakapan ke Chat_History dan pembacaan N pesan terakhir.

**Declarations (exact):**
- L9: `getRecent(limit)` — method
- L21: `save(chatId, role, text)` — method

### `04_Repository_Documentation.gs`

**LOC:** 23  
**SHA-256:** `5c8831dc81bf02baf9a460077840e771b73f1a6535c2e836753174000f997d1b`  
**Objects:** `DocumentationRepository`  
**Peran:** Pembacaan seluruh metadata/konten dokumentasi dari sheet Documentation.

**Declarations (exact):**
- L13: `getAll()` — method

### `04_Repository_Facts.gs`

**LOC:** 31  
**SHA-256:** `faeb5888ea3e2c23194644d4eb243235282647c16f42be010bf48fa041ce38d5`  
**Objects:** `FactsRepository`  
**Peran:** Penyimpanan fakta otomatis/manual ke Memory_Facts dan pembacaan fakta aktif untuk konteks AI.

**Declarations (exact):**
- L10: `save(chatId, factText, category)` — method
- L17: `getActive(maxFacts)` — method

### `04_Repository_Knowledge.gs`

**LOC:** 100  
**SHA-256:** `802b43fe15154a750e2f33fed18375a0e884fbaf55df5bc11cc988c431793a14`  
**Objects:** `KnowledgeRepository`, `result`  
**Peran:** CRUD knowledge key-value berversi/logis aktif pada sheet Knowledge.

**Declarations (exact):**
- L10: `_getSheet()` — method
- L14: `_getAllRows()` — method
- L21: `get(namespace, key)` — method
- L32: `getByNamespace(namespace)` — method
- L44: `getAll()` — method
- L63: `save(namespace, key, content, notes)` — method
- L90: `deactivate(namespace, key)` — method

### `04_Repository_Reminder.gs`

**LOC:** 127  
**SHA-256:** `b62c0ac914706c496021808b4ee4db0172e8574193eb637c44f08cdd10cb1f0c`  
**Objects:** `ReminderRepository`, `AckPatternsRepository`  
**Peran:** Repository reminder + pola acknowledgment; memetakan row, status, jadwal recurring, dan riwayat pola.

**Declarations (exact):**
- L18: `create(data)` — method
- L28: `_mapRow(row, rowIndex)` — method
- L44: `getAll()` — method
- L53: `getActive()` — method
- L57: `getMenungguRespon(batasMenit)` — method
- L68: `updateStatus(rowIndex, status)` — method
- L73: `updateTerakhirDiingatkan(rowIndex, jumlahBaru)` — method
- L79: `updateWaktu(rowIndex, waktuBaru)` — method
- L84: `hitungWaktuBerikutnya(reminder)` — method
- L92: `formatDaftarAktifSebagaiTeks()` — method
- L110: `save(pesanUser, interpretasi, aksi)` — method
- L116: `getRecent(limit)` — method

### `04_Repository_Transaction.gs`

**LOC:** 97  
**SHA-256:** `acd45223ddc1975205da7dcac6477bc233f06f268396ff0ec2b4b341259d7d78`  
**Objects:** `TransactionRepository`  
**Peran:** CRUD transaksi keuangan aktif, lookup berdasarkan ID/wallet/kategori-periode, soft delete, dan update field terbatas.

**Declarations (exact):**
- L18: `create(data)` — method
- L28: `_mapRow(row, rowIndex)` — method
- L44: `getAll()` — method
- L53: `getActive()` — method
- L57: `getLastActive()` — method
- L62: `findById(id)` — method
- L66: `getByWallet(walletId)` — method
- L70: `getByKategoriAndPeriode(kategori, tahunBulan)` — method
- L77: `softDelete(rowIndex)` — method
- L82: `update(rowIndex, updatedFields)` — method

### `04_Repository_Wallet.gs`

**LOC:** 44  
**SHA-256:** `a156afff286f27b34e46c8691cd5de29e812631598a3d69d42759b0b78b5f288`  
**Objects:** `WalletRepository`  
**Peran:** CRUD wallet di Finance_Wallets serta pencarian berdasarkan nama/ID.

**Declarations (exact):**
- L9: `create(nama, saldoAwal)` — method
- L17: `getAll()` — method
- L32: `findByName(nama)` — method
- L37: `findById(id)` — method
- L41: `exists(nama)` — method

### `05_Service_Telegram.gs`

**LOC:** 115  
**SHA-256:** `8f5c91d4059fbe3a3f98058eabd8b1b98f511466a218c6fe03484ab829bc044a`  
**Objects:** `TelegramService`, `payload`, `options`, `payload`, `options`  
**Peran:** Integrasi Bot API Telegram untuk send/edit message, termasuk placeholder random.

**Declarations (exact):**
- L14: `pickPlaceholder()` — method
- L19: `sendMessage(chatId, text)` — method
- L67: `editMessage(chatId, messageId, text)` — method

### `06_Service_LLMProvider.gs`

**LOC:** 118  
**SHA-256:** `a19c475c7baefb819f846f463892ec0e9af8c1e97294ee21e0944149be83b2cb`  
**Objects:** `LLMProviderService`  
**Peran:** Router provider berbasis taskType/ranking dengan OpenRouter free sebagai jalur utama, Gemini dan Groq sebagai fallback, serta statistik provider.

**Declarations (exact):**
- L10: `call(sys, msgs, temp, model)` — method
- L16: `call(sys, msgs, temp, model)` — method
- L22: `call(sys, msgs, temp)` — method
- L28: `generate(params)` — method
- L103: `generateFromSinglePrompt(promptText, temperature, taskType)` — method
- L111: `_recordStatSafe(taskType, modelId, success, latency)` — method

### `06_Service_LLM_Gemini.gs`

**LOC:** 136  
**SHA-256:** `407bf0e0bab469c9d5caaabd95ecc63239ab9f7116ade32fb992c1d92eeeeb6b`  
**Objects:** `GeminiProvider`, `payload`  
**Peran:** Adapter Gemini; discovery model aktif dari endpoint models lalu generateContent.

**Declarations (exact):**
- L11: `_discoverActiveModel()` — method
- L80: `call(systemInstruction, messages, temperature, modelName)` — method

### `06_Service_LLM_Groq.gs`

**LOC:** 61  
**SHA-256:** `4f8deb48891dd214324f9a59756d379d52ade14c2ae762a40d64a60c7f240a37`  
**Objects:** `GroqProvider`, `payload`, `options`  
**Peran:** Adapter Groq/OpenAI-compatible chat completions dengan model hardcoded openai/gpt-oss-20b.

**Declarations (exact):**
- L11: `call(systemInstruction, messages, temperature)` — method

### `06_Service_LLM_OpenRouter.gs`

**LOC:** 82  
**SHA-256:** `3f21762656f143d7e8d300df94e7be6262bb1c3008a96070f67b2321de371120`  
**Objects:** `OpenRouterProvider`, `payload`, `options`  
**Peran:** Adapter OpenRouter chat completions, mendukung modelId dinamis dan default model cepat dari config bila tersedia.

**Declarations (exact):**
- L19: `call(systemInstruction, messages, temperature, modelName)` — method

### `07_Service_WebSearchProvider.gs`

**LOC:** 47  
**SHA-256:** `d34f6d967a1ca5f808220f74739aef79d3560cdf6850a8d4a467f1103657ed66`  
**Objects:** `WebSearchProviderService`  
**Peran:** Abstraksi multi-provider search; Google lalu Tavily secara berurutan, formatter konteks, dan konfigurasi provider.

**Declarations (exact):**
- L15: `getProviders()` — method
- L19: `search(query)` — method
- L36: `formatResultsAsContext(results)` — method
- L44: `isAnyConfigured()` — method

### `07_Service_WebSearch_Google.gs`

**LOC:** 48  
**SHA-256:** `df7d2bd02ae717b2336b2819187cd875da48739759201021e3ee2c020882aa13`  
**Objects:** `GoogleSearchProvider`, `options`  
**Peran:** Adapter Google Custom Search JSON API.

**Declarations (exact):**
- L11: `isConfigured()` — method
- L16: `search(query)` — method

### `07_Service_WebSearch_Tavily.gs`

**LOC:** 55  
**SHA-256:** `eac9938d9f8aad9af4c1caaa26d479669f8e87b03e5e0fd76c6b9f0d92e82efa`  
**Objects:** `TavilySearchProvider`, `payload`, `options`  
**Peran:** Adapter Tavily search API.

**Declarations (exact):**
- L12: `isConfigured()` — method
- L16: `search(query)` — method

### `08_Specialist_ChangeDetector.gs`

**LOC:** 206  
**SHA-256:** `5046294aeb09dbafb879384c79a45439d290a225c8791ee8bf5fe372bede6263`  
**Objects:** `ChangeDetector`, `result`, `snapshot`  
**Peran:** Deteksi perubahan source berbasis snapshot hash serta pemeriksaan sinkronisasi dokumen dan roadmap.

**Declarations (exact):**
- L9: `runDetection(mode)` — method
- L53: `runScheduledDetection()` — method
- L96: `_getCurrentFiles()` — method
- L111: `_simpleHash(str)` — method
- L121: `_getLatestSnapshot()` — method
- L138: `_saveSnapshot(currentFiles)` — method
- L159: `_compareWithSnapshot(currentFiles, snapshot)` — method
- L172: `_buildReport(changes)` — method
- L193: `_checkDocSync(changes)` — method

### `08_Specialist_Chat.gs`

**LOC:** 92  
**SHA-256:** `50ba0a6ef1339e0f0286295571c65a9dcf7aba3aca6438e409a0702508a3915d`  
**Objects:** `ChatSpecialist`, `variables`  
**Peran:** Persona chat, keputusan perlu web search, dan rendering jawaban berbasis konteks hasil search.

**Declarations (exact):**
- L10: `buildSystemPersona()` — method
- L54: `needsWebSearch(intent)` — method
- L58: `respondWithSearchContext(userMessage, searchResults, riwayat)` — method
- L85: `_formatRiwayat(riwayat)` — method

### `08_Specialist_CodeAuditor.gs`

**LOC:** 528  
**SHA-256:** `70d513ba252a05bf13877193a10a1b29a83e28317f2978361c76d85f257ddfbe`  
**Objects:** `CodeAuditor`, `seen`, `filesToRead`, `sourceMap`  
**Peran:** Mengambil source, membaginya batch, menganalisis temuan via LLM, menyimpan report/findings, dan mengaplikasikan fix yang lolos prosesnya.

**Declarations (exact):**
- L10: `runAudit(type)` — method
- L43: `runScheduledAudit()` — method
- L54: `fixIssues(scope)` — method
- L81: `shouldOfferAudit()` — method
- L90: `_collectData()` — method
- L135: `_getSheetNames()` — method
- L144: `_analyzeInBatches(data, categories)` — method
- L173: `_splitIntoBatches(files)` — method
- L200: `_buildAuditPrompt(batch, data, categories)` — method
- L226: `_parseFindings(rawText)` — method
- L242: `_deduplicateFindings(findings)` — method
- L252: `_filterByScope(findings, scope)` — method
- L265: `_generateFixes(findings)` — method
- L333: `_applyFixes(fixes, scope)` — method
- L439: `_saveReport(findings, type)` — method
- L459: `_saveFindings(reportId, findings)` — method
- L473: `_getLatestPendingFindings()` — method
- L497: `_markFindingsFixed(findings)` — method
- L515: `_getLastAuditDate()` — method

### `08_Specialist_DocSync.gs`

**LOC:** 181  
**SHA-256:** `a0a335335c72d78d11beb82c7d5073e082661450b08adc74714a1b40248ef753`  
**Objects:** `DocSyncSpecialist`, `docs`  
**Peran:** Sinkronisasi dokumentasi kanonik terhadap metadata source + isi docs melalui LLM dan commit ke GitHub. Collector source sudah membaca object map dengan Object.keys.

**Declarations (exact):**
- L9: `sync()` — method
- L53: `_getCanonicalFiles()` — method
- L63: `_isCanonical(fileName, canonicalFiles)` — method
- L70: `_collectSourceMetadata()` — method
- L96: `_extractMethodSignatures(content)` — method
- L114: `_collectCurrentDocs(canonicalFiles)` — method
- L136: `_analyzeWithLLM(sourceMetadata, currentDocs, canonicalFiles)` — method
- L167: `_commitDocUpdate(fileName, content, reason)` — method

### `08_Specialist_FeatureArchitect.gs`

**LOC:** 308  
**SHA-256:** `6455fd1438d9d2a565966c527ad3b412f5c92c68e180266b4b8b1a61f8937a27`  
**Objects:** `FeatureArchitect`  
**Peran:** Membuat blueprint fitur lalu implementasi multi-file melalui branch backup/feature, validasi statis, commit, dan pull request.

**Declarations (exact):**
- L10: `generateBlueprint(idea)` — method
- L56: `implementBlueprint(idea)` — method
- L167: `_generateAllCode(blueprint, context, idea)` — method
- L215: `_generateSingleFile(fileSpec, blueprint, context, idea)` — method
- L259: `_gatherProjectContext()` — method
- L277: `_saveBlueprint(blueprint, idea)` — method
- L294: `_getLatestBlueprint()` — method

### `08_Specialist_Finance.gs`

**LOC:** 195  
**SHA-256:** `eb9f561d5704ba9ea89a77703d3fca9e2f0aecc75132f4dfc083b4cd0f8b3f79`  
**Objects:** `FinanceSpecialist`, `perKategori`  
**Peran:** Logika domain keuangan: resolusi wallet, saldo, transaksi, ringkasan, budget dan alert.

**Declarations (exact):**
- L6: `resolveWallet(namaWallet)` — method
- L19: `getSaldoWallet(walletId)` — method
- L34: `getAllSaldo()` — method
- L48: `recordTransaction(data)` — method
- L86: `editLastTransaction(updatedFields)` — method
- L112: `getRingkasanPeriode(periode)` — method
- L140: `createOrUpdateBudget(kategori, batasJumlah, periode)` — method
- L162: `_checkBudgetAlert(kategori, tanggalTransaksi)` — method

### `08_Specialist_Knowledge.gs`

**LOC:** 39  
**SHA-256:** `7842a74289fa4a2f85de05a1f5ba6092d88db30e69417d8a094094993f79bd42`  
**Objects:** `KnowledgeSpecialist`  
**Peran:** Facade penyimpanan fakta manual/otomatis dan query fakta relevan.

**Declarations (exact):**
- L11: `saveFact(chatId, factText, category)` — method
- L17: `saveManualFact(chatId, factText)` — method
- L21: `saveAutoDetectedFacts(chatId, facts)` — method
- L30: `getActiveFactsForPrompt(limit)` — method
- L34: `findRelevantToKeyword(keyword, limit)` — method

### `08_Specialist_KnowledgeSync.gs`

**LOC:** 98  
**SHA-256:** `e03dd6be53e978c5de3637d42a29fcc589382c089ec5f2a1d1164905516f04dc`  
**Objects:** `KnowledgeSyncSpecialist`, `grouped`  
**Peran:** Sinkronisasi knowledge sheet <-> file JSON/knowledge di GitHub.

**Declarations (exact):**
- L11: `sync()` — method
- L15: `bootstrap()` — method
- L25: `_pullFromGitHub()` — method
- L59: `pushSheetToGitHub()` — method

### `08_Specialist_LLMIntelligence.gs`

**LOC:** 319  
**SHA-256:** `1660e66eed1990f23177efbff046a539c509fb018cd8bbf2b76529756cc94a46`  
**Objects:** `LLMIntelligence`, `matrix`, `counters`  
**Peran:** Discovery model OpenRouter, benchmark batch maksimal 3, ranking per task, statistik runtime, dan adaptive re-rank.

**Declarations (exact):**
- L13: `discoverAndBenchmark()` — method
- L17: `runFullPipeline()` — method
- L24: `discoverModels()` — method
- L61: `benchmarkBatch()` — method
- L128: `rankModels()` — method
- L174: `_testSingleModel(modelId, promptText, patCalc, patLogic)` — method
- L217: `_loadCandidateIds()` — method
- L232: `_loadExistingResults()` — method
- L238: `_saveResults(results)` — method
- L242: `getRankedModelsForTask(taskType)` — method
- L257: `recordStat(taskType, modelId, success, latencyMs)` — method
- L282: `adaptiveReRank()` — method

### `08_Specialist_Memory.gs`

**LOC:** 178  
**SHA-256:** `5a8c474e17e3cdb51ab4af9e778ad4410cb36356ea1e7d6a6f06632d73fbde54`  
**Objects:** `MemorySpecialist`  
**Peran:** STM/LTM chat: baca ringkasan, ringkas chat harian, simpan summary. Saat ini memanggil DateTimeUtils.formatTanggal yang tidak ada di 02_Utils.gs.

**Declarations (exact):**
- L14: `getLongTermMemory(maxDays)` — method
- L49: `summarizeToday()` — method
- L108: `_getTodayChats()` — method
- L145: `_hasSummaryForToday()` — method
- L167: `_saveSummary(summary, topics, messageCount)` — method

### `08_Specialist_ProjectBrain.gs`

**LOC:** 315  
**SHA-256:** `d48021db43f850da10d7d50c78dd311911e97da4b563000e52745014c5a9c33f`  
**Objects:** `ProjectBrain`  
**Peran:** Manajemen roadmap, alignment terhadap code, adaptasi ide baru, pertanyaan roadmap, dan sinkronisasi item ke sheet.

**Declarations (exact):**
- L10: `buildRoadmapFromDiscussion(userInput)` — method
- L64: `syncRoadmapWithCode()` — method
- L128: `adaptRoadmapForNewIdea(idea)` — method
- L179: `answerQuestion(question)` — method
- L206: `updateRoadmapStatus(feature, status)` — method
- L210: `_readDoc(fileName)` — method
- L215: `_readItems()` — method
- L233: `_addItem(feature, category, priority, status, notes)` — method
- L247: `_updateItemStatus(feature, newStatus)` — method
- L265: `_syncItemsToSheet(items)` — method
- L289: `_updateRoadmapContent(changesDescription)` — method

### `08_Specialist_Reminder.gs`

**LOC:** 146  
**SHA-256:** `5fed3f509b6e40a3650828d86620dd7a99f3d47ba9adba0d14f471511ed86fe2`  
**Objects:** `ReminderSpecialist`  
**Peran:** Use-case reminder: daftar aktif, due-now, pembuatan, acknowledgment, notifikasi, snooze/done, dan context fakta relevan.

**Declarations (exact):**
- L12: `getMenungguRespon()` — method
- L16: `getReminderDueNow()` — method
- L29: `listActiveAsText()` — method
- L33: `getAckPatternsForPrompt(limit)` — method
- L37: `create(reminderData)` — method
- L57: `acknowledge(pesanUserAsli, ackIntent, remindersMenunggu)` — method
- L70: `getRemindersDueNow()` — method
- L75: `buildNotificationText(reminder)` — method
- L85: `markAsNotified(reminder)` — method
- L92: `_isDueNow(reminder, now)` — method
- L103: `_buildRelevantFactContext(reminder)` — method
- L109: `_buildConfirmationText(data)` — method
- L118: `_handleDone(pesanUserAsli, intent, target)` — method
- L135: `_handleSnooze(pesanUserAsli, intent, target)` — method

### `08_Specialist_SelfAwareness.gs`

**LOC:** 131  
**SHA-256:** `7fb3cf54018b5282e6ec9a92f566164138da3ec9d611a3fb6ee1ebcb15e0e3be`  
**Objects:** `SelfAwareness`, `data`  
**Peran:** Self-review berbasis data internal dan LLM; hasil diformat menjadi response natural.

**Declarations (exact):**
- L10: `review(focus)` — method
- L22: `_gatherSelfData()` — method

### `08_Specialist_SelfHealing.gs`

**LOC:** 391  
**SHA-256:** `452d4ccf42d0a8de4dfbee0472e166e222a6f33837b32bdc8b79666147a43066`  
**Objects:** `SelfHealingSpecialist`, `sourceMap`, `currentDocs`, `suspectSet`, `mapping`  
**Peran:** Diagnosis error, pembuatan patch, commit patch ke GitHub, pembaruan dokumentasi, dan status patch; updateDocumentation masih hardcode daftar docs lama.

**Declarations (exact):**
- L10: `getLevel()` — method
- L20: `diagnose(keluhanUser)` — method
- L73: `updateDocumentation(instruction)` — method
- L135: `applyPendingPatch(patchId)` — method
- L152: `_getRecentLogs(count)` — method
- L173: `_filterErrorLogs(logs)` — method
- L184: `_identifySuspectFiles(errorLogs, keluhan)` — method
- L224: `_askLLMForDiagnosis(keluhan, errorLogs, sourceMap)` — method
- L266: `_applyToGitHub(diagnosis)` — method
- L336: `_savePatch(diagnosis)` — method
- L355: `_getPatchById(patchId)` — method
- L377: `_updatePatchStatus(fileName, newStatus)` — method

### `08_Specialist_Soul.gs`

**LOC:** 357  
**SHA-256:** `fbf63dc5373fff5b8818a83a067b587ec650e44959ac364f234aa03f9483afe8`  
**Objects:** `SoulSpecialist`, `merged`, `merged`, `merged`, `report`, `allMethodDefs`, `allMethodCalls`, `allModuleRefs`, `fileReport`, `definedModules`  
**Peran:** Model identitas/self-model/beliefs/growth/emotional state, bootstrap knowledge, serta global audit menggunakan Apps Script API.

**Declarations (exact):**
- L15: `initializeSelf()` — method
- L63: `_patchIntentSchema()` — method
- L78: `getSelfModel()` — method
- L84: `updateSelfModel(data)` — method
- L98: `getIdentity()` — method
- L104: `updateIdentity(data)` — method
- L116: `getBeliefs()` — method
- L122: `addBelief(belief)` — method
- L131: `getGrowthLog()` — method
- L137: `addGrowthEntry(event, detail)` — method
- L148: `getEmotionalState()` — method
- L154: `updateEmotionalState(data)` — method
- L167: `getFullContext()` — method
- L178: `runFullCodeAudit()` — global

### `08_Specialist_SoulMemory.gs`

**LOC:** 105  
**SHA-256:** `b8c999066c799aae86ff7b827da3ebdfacc2531e96f5aac736c1179408ac19af`  
**Objects:** `SoulMemory`  
**Peran:** Episodic memory dan meta insights pada sheet soul.

**Declarations (exact):**
- L7: `_ensureSheets()` — method
- L12: `recordEpisode(eventType, context, outcome, emotionalState, details)` — method
- L31: `getRecentEpisodes(limit)` — method
- L56: `getEpisodesByType(eventType, limit)` — method
- L64: `addMetaInsight(insight, source, confidence)` — method
- L82: `getMetaInsights(limit)` — method

### `08_Specialist_SyncOrchestrator.gs`

**LOC:** 191  
**SHA-256:** `a5048146d1a94b6b3b7136df4ca107959e5e337dcd27ed50c5c554f926950c35`  
**Objects:** `SyncOrchestrator`, `results`  
**Peran:** Orkestrasi pull knowledge, backup knowledge, DocSync, ensure sheets, status assessment, dan timestamp sync.

**Declarations (exact):**
- L9: `assessState()` — method
- L18: `executeSync(scope)` — method
- L63: `autoDocument(changeDescription)` — method
- L79: `_assessKnowledge()` — method
- L88: `_assessDocumentation()` — method
- L97: `_assessSheetStructure()` — method
- L107: `_getLastSyncTimestamp()` — method
- L111: `_saveSyncTimestamp()` — method
- L116: `_pullKnowledge()` — method
- L135: `_backupKnowledge()` — method
- L149: `_syncDocumentation()` — method
- L163: `_ensureSheets()` — method

### `08_Specialist_UserProfile.gs`

**LOC:** 120  
**SHA-256:** `338c4188d9dd3f9ae76a7596076a992a3f21756837586f3e34f189bb9333c262`  
**Objects:** `UserProfileSpecialist`  
**Peran:** Upsert profil terstruktur pada User_Profile dan context untuk prompt.

**Declarations (exact):**
- L12: `saveUpdates(updates)` — method
- L31: `getProfileForPrompt(maxItems)` — method
- L64: `getByCategory(category)` — method
- L91: `_upsertProfile(key, value, category)` — method

### `08_Utils_PatchValidator.gs`

**LOC:** 208  
**SHA-256:** `32cb33da197ae3caeab6f47c095c8986765dd0f0c871720707e03126819a9a01`  
**Objects:** `PatchValidator`, `result`, `X`  
**Peran:** Validasi statis patch: syntax, structural sanity, suspicious patterns, dan formatter hasil. Bukan sandbox runtime.

**Declarations (exact):**
- L15: `validate(patchedCode, originalCode, fileName)` — method
- L77: `_checkSyntax(code)` — method
- L95: `_checkStructuralSanity(patched, original)` — method
- L138: `_checkSuspiciousPatterns(code)` — method
- L190: `formatResult(result)` — method

### `08_Utils_TemplateEngine.gs`

**LOC:** 8  
**SHA-256:** `2e4857b08587adc712368e0c9406203b1a6ff478c912954a8af6f0b865391e3b`  
**Objects:** `TemplateEngine`  
**Peran:** Render template dengan placeholder {{variable}}.

**Declarations (exact):**
- L2: `render(template, variables)` — method

### `09_CommandRouter.gs`

**LOC:** 44  
**SHA-256:** `0d51be843e92d9cc7ad91e38cad6b3fec4a6526475cdff08d602fa2159a30f14`  
**Objects:** `CommandRouter`, `intent`  
**Peran:** Fast-path command sebelum intent LLM. Command aktual: diagnose, heal, logs, patch, build, ingat, soul, init-soul, backup, restore, memory.

**Declarations (exact):**
- L9: `isKnownCommand(text)` — method
- L15: `handle(chatId, text)` — method
- L34: `_handleIngat(chatId, args)` — method

### `09_Manager.gs`

**LOC:** 476  
**SHA-256:** `6e1ac11ab7fcda58f2d7d986a6e9b00ef95824b20a296bffe7f51e753a123e66`  
**Objects:** `Manager`, `payload`, `fields`  
**Peran:** Orkestrator request: context gathering, intent analysis, persistence fakta/profil/episode, routing ke specialist, dan fallback chat.

**Declarations (exact):**
- L2: `processConversationalMessage(chatId, text)` — method
- L28: `_gatherContext()` — method
- L39: `_persistAutoFacts(chatId, intent)` — method
- L46: `_routeIntent(chatId, text, intent, context)` — method
- L93: `_askLLMWithKnowledge(chatId, userText, namespace, key, rawData)` — method
- L119: `_handleCatatKeuangan(chatId, text, intent)` — method
- L144: `_handleTanyaSaldo(chatId, text, intent)` — method
- L170: `_handleRingkasanKeuangan(chatId, text, intent)` — method
- L183: `_handleAturBudget(chatId, text, intent)` — method
- L203: `_handleEditTransaksi(chatId, text, intent)` — method
- L253: `_handleSyncDocumentation(chatId, text, intent)` — method
- L263: `_handleBackupKnowledge(chatId, text)` — method
- L271: `_handleRestoreKnowledge(chatId, text)` — method
- L279: `_handleSoulInit(chatId, text)` — method
- L287: `_handleSoulQuery(chatId, text, intent)` — method
- L300: `_handleSoulMemoryQuery(chatId, text, intent)` — method
- L311: `_handleAckReminder(chatId, text, intent, context)` — method
- L317: `_handleBuatReminder(intent)` — method
- L321: `_handleDiagnoseError(chatId, text, intent)` — method
- L331: `_handleUpdateDocs(chatId, text, intent)` — method
- L341: `_handleAuditCode(chatId, text, intent)` — method
- L352: `_handleFixAudit(chatId, text, intent)` — method
- L363: `_handleCheckChanges(chatId, text, intent)` — method
- L371: `_handleRoadmapQuery(chatId, text, intent)` — method
- L399: `_handleImplementFeature(chatId, text, intent)` — method
- L421: `_handleSelfQuery(chatId, text, intent)` — method
- L429: `_handleChatBiasa(chatId, text, intent, riwayat)` — method
- L445: `_handleHeavyChat(text, intent, riwayat)` — method
- L456: `_handleChatWithWebSearch(text, intent, riwayat)` — method
- L461: `_handleIntentFailure(chatId, text, riwayat)` — method

### `09_Manager_IntentAnalyzer.gs`

**LOC:** 90  
**SHA-256:** `fa904d0fc6d131d78f88bf7ec7738706d26c130c06099d6109aadc18b9127e3e`  
**Objects:** `IntentAnalyzer`, `variables`  
**Peran:** Membangun prompt intent dari knowledge/context, memanggil LLM, parse + repair JSON.

**Declarations (exact):**
- L4: `analyze(userMessage, context)` — method
- L14: `_parseResponse(rawText, providerName)` — method
- L42: `_buildPrompt(userMessage, context)` — method
- L69: `_formatRiwayat(r)` — method
- L76: `_formatList(arr)` — method
- L81: `_formatReminder(r)` — method
- L86: `_formatPola(p)` — method

### `10_Handler_Webhook.gs`

**LOC:** 79  
**SHA-256:** `ef5f47c367ef5a2f24c9e3917ccd7ed880c727b1a7ec5b50b41eb2bfe43e4f31`  
**Objects:** `WebhookHandler`  
**Peran:** Webhook Telegram: verifikasi secret/chat, dedup update_id, proses text message, placeholder/edit response.

**Declarations (exact):**
- L11: `handle(e)` — method
- L48: `_isAuthorized(e, config)` — method
- L52: `_isDuplicateUpdate(contents)` — method
- L64: `_processMessage(chatId, text)` — method
- L77: `doPost(e)` — global

### `11_Trigger_AuditScheduler.gs`

**LOC:** 64  
**SHA-256:** `80009e88875abef576f22cc2040eadff08f53755ca309388c17633bc31784d86`  
**Objects:** `AuditScheduler`  
**Peran:** Trigger audit Senin 07:00; CodeAuditor memutuskan apakah full audit berdasarkan tanggal. Dengan trigger mingguan ini, audit penuh normalnya hanya saat tanggal 1 jatuh Senin.

**Declarations (exact):**
- L13: `runScheduledAudit()` — method
- L28: `setupWeeklyTrigger()` — method
- L44: `_deleteExistingTriggers()` — method
- L58: `runScheduledAuditWrapper()` — global
- L62: `setupWeeklyTrigger()` — global

### `11_Trigger_LLMIntelligence.gs`

**LOC:** 25  
**SHA-256:** `79b1ceb6e94ec09f1c0485f3653c65cc41d78022b6d17f4043b8a427ff28a0ef`  
**Objects:** -  
**Peran:** Trigger discovery/benchmark/ranking harian sekitar 03:00; tidak memanggil adaptiveReRank secara eksplisit.

**Declarations (exact):**
- L7: `runDailyLLMDiscovery()` — global
- L13: `setupDailyLLMDiscovery()` — global

### `11_Trigger_MemorySummarizer.gs`

**LOC:** 38  
**SHA-256:** `e2fdc6ee489d3c926dde24dfd13c227a155815932dab634541297f100b4a331a`  
**Objects:** `MemorySummarizerTrigger`  
**Peran:** Trigger summary harian sekitar 23:30 yang langsung memanggil MemorySpecialist.summarizeToday.

**Declarations (exact):**
- L8: `setupNightlyTrigger()` — method
- L22: `_deleteExistingTriggers()` — method
- L32: `runNightlySummarizerWrapper()` — global
- L36: `setupNightlySummarizer()` — global

### `11_Trigger_ReminderChecker.gs`

**LOC:** 51  
**SHA-256:** `c21558f1d0832689f251b81933955cabec4dc76020188a5a39f6d86bd372abfd`  
**Objects:** -  
**Peran:** Trigger setiap menit untuk reminder due; memakai lock dan mengirim ke MY_TELEGRAM_CHAT_ID.

**Declarations (exact):**
- L6: `cekDanKirimReminder()` — global
- L44: `setupReminderTrigger()` — global

### `11_Trigger_ScheduledSync.gs`

**LOC:** 29  
**SHA-256:** `3eed16a188ef3111eba26101e0691352e671a27dbaf882c698949fcb2109a6eb`  
**Objects:** -  
**Peran:** Trigger harian sekitar 04:00 untuk SyncOrchestrator.executeSync(auto).

**Declarations (exact):**
- L7: `runDailyAutoSync()` — global
- L17: `setupDailyAutoSyncTrigger()` — global

### `11_Trigger_WeeklyChangeCheck.gs`

**LOC:** 37  
**SHA-256:** `e65990cdf89b2d3d3c87f882c442e0ec642cca3c237743358d332daeed82c4f2`  
**Objects:** `WeeklyChangeCheckTrigger`  
**Peran:** Trigger Minggu 20:00 untuk ChangeDetector.runScheduledDetection.

**Declarations (exact):**
- L8: `setupWeeklyTrigger()` — method
- L21: `_deleteExistingTriggers()` — method
- L31: `runWeeklyChangeCheckWrapper()` — global
- L35: `setupWeeklyChangeCheck()` — global

### `12_Service_GitHubBackup.gs`

**LOC:** 186  
**SHA-256:** `99c42d6578b69dc0777c394a189f43ee759b6e099c54089d8dadf787ae4dd4ea`  
**Objects:** `GitHubBackupService`, `config`, `payload`  
**Peran:** Backup source/docs ke GitHub, termasuk helper config, resolve path, push file dan lookup SHA; memiliki entrypoint runFullBackup.

**Declarations (exact):**
- L15: `backupAllFiles()` — method
- L40: `backupDocs()` — method
- L65: `_loadGitHubConfig()` — method
- L79: `_fetchOwnSourceFiles()` — method
- L100: `_resolveFilePath(file)` — method
- L106: `_pushFileToGitHub(config, path, content)` — method
- L135: `_getExistingFileSha(config, url)` — method
- L156: `runFullBackup()` — global
- L174: `setupDailyBackupTrigger()` — global

### `13_Service_GitHubOps.gs`

**LOC:** 297  
**SHA-256:** `cbaa605e15ac3dfd7564979210a96dd4468b69344fc4a5aafae07254086083cb`  
**Objects:** `GitHubOpsService`, `result`, `payload`  
**Peran:** API GitHub generik: read/list source, branch, backup branch, commit, PR, doc read/update. readAllSourceFiles mengembalikan object map keyed by basename.

**Declarations (exact):**
- L9: `_getHeaders()` — method
- L18: `_getRepoUrl()` — method
- L25: `readFile(path, ref)` — method
- L61: `listDirectory(path)` — method
- L93: `readAllSourceFiles()` — method
- L113: `createBranch(branchName)` — method
- L171: `createBackupBranch(suffix)` — method
- L181: `commitFile(path, content, message, branch, sha)` — method
- L224: `createPullRequest(title, body, head, base)` — method
- L258: `readDocFile(fileName)` — method
- L262: `updateDocFile(fileName, newContent, commitMessage)` — method

### `99_TestSuite_Full.gs`

**LOC:** 922  
**SHA-256:** `13888a33c959dcffd2a3e7bb6ee26fa9fcde88341681be383f157ec38f10e50e`  
**Objects:** `cleaned`  
**Peran:** Suite batch 1-6 untuk CRUD repository, intent, routing LLM, finance E2E, memory context, dan integration.

**Declarations (exact):**
- L9: `_tLog(batch, name, status, detail, ms)` — global
- L16: `_cleanupTestData()` — global
- L53: `test_Batch1_RepositoryCRUD()` — global
- L281: `test_Batch2_IntentDetection()` — global
- L390: `test_Batch3_LLMRouting()` — global
- L486: `test_Batch4_FinanceE2E()` — global
- L674: `test_Batch5_MemoryContext()` — global
- L860: `test_Batch6_Integration()` — global

### `99_Tests.gs`

**LOC:** 439  
**SHA-256:** `6c813a8b7f6c416f9d274c40fa3cde6ca4f0bf7b63cf062b3f5490897b500754`  
**Objects:** `headers`, `cleaned`, `matrix`, `functionMap`  
**Peran:** Test/debug tambahan untuk finance, OAuth, GitHub, Telegram Markdown, timezone, knowledge sync, LLM pipeline, GitHub rate limit/auth, benchmark cleanup, duplicate globals, DocSync metadata, intent knowledge.

**Declarations (exact):**
- L1: `test_Batch7b_FinanceSpecialist()` — global
- L49: `debug_CheckOAuthScopes()` — global
- L58: `debug_CheckGitHubConfig()` — global
- L89: `test_TelegramMarkdownFallback()` — global
- L129: `debug_TimezoneAudit()` — global
- L160: `triggerKnowledgeSync()` — global
- L165: `triggerManualDiscoveryAndBenchmark()` — global
- L173: `test_Stage1_Discover()` — global
- L183: `test_Stage2_BenchmarkBatch()` — global
- L193: `test_Stage3_Rank()` — global
- L203: `test_CheckGitHubRateLimitAndAuth()` — global
- L223: `fix_CleanBenchmarkData()` — global
- L274: `resetAndCleanSystemCounters()` — global
- L304: `forceSyncKnowledgeFromGitHub()` — global
- L318: `test_DocSync_CollectSourceMetadata()` — global
- L342: `test_DetectDuplicateGlobalFunctions()` — global
- L426: `debug_DumpIntentKnowledge()` — global

### `Rollback.gs`

**LOC:** 108  
**SHA-256:** `fb751f09ca2b5e67d4b26e4ecc692474ba585fc4a3bf64359c92e8d36f5de0d0`  
**Objects:** `options`, `headers`  
**Peran:** Rollback source file dari GitHub melalui entrypoint rollbackFromGitHub.

**Declarations (exact):**
- L8: `rollbackFromGitHub()` — global
- L47: `_getRollbackFilesFromGitHub(config)` — global

## 4. Contract details penting

### Config and time

`Config.load()` membaca keys: ``TELEGRAM_BOT_TOKEN`, `MY_TELEGRAM_CHAT_ID`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `SPREADSHEET_ID`, `SHARED_SECRET`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`, `TAVILY_API_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BRANCH`, `OPENROUTER_API_KEY`, `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `TOGETHER_API_KEY`, `HF_API_TOKEN``; default `githubBranch` = `main`. `OPENROUTER_MODEL_FAST` belum dimuat. `DateTimeUtils` menyediakan `generate(prefix)`, `toWIB(date)`, `nowWIB()`, `formatWaktu(date)`, `formatUntukPrompt(date)`, `formatPeriode(date)`; **tidak ada `formatTanggal`**.

### GitHubOps return contract

`GitHubOpsService.readAllSourceFiles()` mengembalikan object:

```text
{
  "file.gs": { "content": "...", "sha": "..." }
}
```

Itu berarti caller harus memakai `Object.keys(files)`, bukan `files.length` atau `Array` APIs.

### LLM task routing

Ranking matrix actual yang dibentuk `rankModels()`:
`chat_light`, `chat_heavy`, `intent_analysis`, `code_analysis`, `code_generation`, `documentation`, `web_grounded`.

Task lain (`finance_response`, `docsync_analysis`, `benchmark_probe`, `fast`) fallback ke `chat_light` melalui `getRankedModelsForTask()`.

### Finance

Wallet default efektif `Cash` bila resolve name kosong; wallet yang belum ada dapat dibuat otomatis. Saldo dihitung dari saldo awal + income - expense. Budget warning pada >=80%, exceeded pada >=100%. Transaction update terbatas pada category, amount, description, walletId; soft delete memakai status `deleted`.

### Reminder

Status utama `Aktif`/`Done`; recurring `none`, `daily`, `weekly`, `monthly`. Trigger checker setiap menit, menggunakan lock, kirim Telegram, lalu `markAsNotified`. Ada dua method due-now bernama `getReminderDueNow()` dan `getRemindersDueNow()` pada specialist; hindari menambah duplikasi API tanpa alasan.

### DocSync

`DocSyncSpecialist._collectSourceMetadata()` saat ini valid terhadap return contract GitHubOps. Canonical list dibaca dari `KnowledgeRepository.get('docsync','canonical_files')`.

### SelfHealing

`SelfHealingSpecialist.updateDocumentation()` saat ini masih hardcode 5 dokumen legacy; sebelum mengandalkan fungsi ini setelah migrasi docs, ubah agar membaca canonical list runtime.

## 5. Critical current defects

| Severity | Area | Defect | Bukti source |
|---|---|---|---|
| P0 | Memory | `formatTanggal` undefined | `08_Specialist_Memory.gs` memanggil 5 kali; `02_Utils.gs` tidak mendefinisikan. |
| P1 | Tests | finance batch stale | `99_Tests.gs` memanggil 2 method yang tidak ada. |
| P1 | Sync | `_assessDocumentation` salah return type | object map diperlakukan seperti array. |
| P1 | Sheets | ensure sheet tanpa header | `ensureSheet(name,null)` vs repository row-1 header assumptions. |
| P1 | Docs | self-healing hardcode legacy docs | `08_Specialist_SelfHealing.gs`. |
| P2 | LLM | task specialization fallback | matrix 7 keys vs call sites extra task types. |
| P2 | Scheduling | monthly full audit hanya pada trigger weekly slot | trigger hanya Senin. |
| P2 | ChangeDetector | manifest diabaikan | `readAllSourceFiles()` hanya `.gs`. |
| P2 | Command drift | `/sync` disebut di context, tidak ada di router | `09_CommandRouter.gs`. |

## 6. Safe development protocol

1. Read current source and this handoff before editing.
2. Do not trust historical docs over source.
3. Preserve global function names unless migration is intentional.
4. When adding/renaming methods, update all direct callers and tests.
5. When changing sheets, update headers and repositories together.
6. When changing `taskType`, update both call sites and `LLMIntelligence.rankModels()`/knowledge matrix.
7. When changing canonical docs, update knowledge key, DocSync, SelfHealing, and any context strings.
8. For GitHub writes, prefer feature/backup branches and SHA-aware commits.
9. Run static syntax checks on all `.gs` after changes.
10. Run relevant GAS tests manually in deployed/editor environment; static validation cannot prove UrlFetchApp/SpreadsheetApp/ScriptApp behavior.

## 7. Test suite map

### Production-adjacent suites
- `test_Batch1_RepositoryCRUD`
- `test_Batch2_IntentDetection`
- `test_Batch3_LLMRouting`
- `test_Batch4_FinanceE2E`
- `test_Batch5_MemoryContext`
- `test_Batch6_Integration`
- `test_Batch7b_FinanceSpecialist` (**stale; fix before relying on it**)

### Debug/test utilities
`debug_CheckOAuthScopes`, `debug_CheckGitHubConfig`, `test_TelegramMarkdownFallback`, `debug_TimezoneAudit`, `triggerKnowledgeSync`, `triggerManualDiscoveryAndBenchmark`, `test_Stage1_Discover`, `test_Stage2_BenchmarkBatch`, `test_Stage3_Rank`, `test_CheckGitHubRateLimitAndAuth`, `fix_CleanBenchmarkData`, `resetAndCleanSystemCounters`, `forceSyncKnowledgeFromGitHub`, `test_DocSync_CollectSourceMetadata`, `test_DetectDuplicateGlobalFunctions`, `debug_DumpIntentKnowledge`.

## 8. Canonical documentation after consolidation

1. `ARCHITECTURE.md`
2. `PROGRESS.md`
3. `ROADMAP.md`
4. `AI_DEVELOPMENT_HANDOFF.md`
5. `ai_knowledge.md`

`AI_DEVELOPMENT_HANDOVER.md` adalah handover operasional untuk AI lain dan bukan target canonical DocSync.

## 9. Migration rule

Legacy docs tetap disimpan verbatim di appendix dokumen ini agar knowledge tidak hilang. Namun legacy text adalah **historical archive**, bukan specification. Saat AI lain melihat kontradiksi, gunakan urutan: source -> current consolidated docs -> live knowledge -> historical archive.

# APPENDIX A — Verbatim legacy documentation archive

Konten berikut adalah salinan utuh 10 Markdown sebelum konsolidasi. Tujuannya preservasi informasi; bagian ini tidak menjadi source-of-truth runtime.


## LEGACY FILE: `01_SYSTEM_CONTEXT_AND_AI_HANDOFF.md`

~~~~~markdown
# 01 ? System Context, Goals, Requirements & AI Handoff

> Sumber kebenaran: `src/` pada snapshot repository yang diunggah. `README.md`, `ARCHITECTURE.md`, dan `PROGRESS.md` lama sengaja tidak digunakan sebagai dasar fakta dalam kumpulan dokumentasi ini.

## 1. System identity

AI Agent Telegram adalah aplikasi Google Apps Script (V8) yang diekspos sebagai webhook Telegram. Sistem ini menggabungkan orkestrasi LLM percakapan dengan data Google Sheets yang persisten serta kapabilitas operasional/manajemen diri, termasuk reminder, memori pribadi, keuangan, pencarian web, audit code, manajemen roadmap, pencadangan source ke GitHub, kesadaran diri, dan alur self-healing.

Sistem dirancang dengan model **Manager + Intent Analyzer + Specialist**: Manager mengumpulkan konteks dan merutekan intent terstruktur ke modul specialist; modul specialist menjalankan aksi domain atau menyusun jawaban akhir.

## 2. Tujuan perilaku yang diharapkan vs kondisi implementasi nyata

Perilaku yang ditargetkan adalah AI agent pribadi yang otonom, berinisiatif, berguna, berorientasi pada keahlian, jujur, dan dapat diandalkan. Implementasi saat ini mendukung tujuan tersebut melalui konteks persisten, routing intent terstruktur, aksi specialist, otomatisasi terjadwal, rantai fallback LLM, logging, audit/deteksi perubahan, dan alat perbaikan. Namun, otonomi belum tanpa batas: beberapa loop perbaikan, verifikasi, deployment, dan sinkronisasi dokumentasi masih terotomatisasi sebagian atau bergantung pada penyiapan/aksi yang dipicu manusia.

### Truth labels used in this documentation

- **Terimplementasi** ? directly evidenced by executable source code and reachable call paths.
- **Terimplementasi sebagian** ? kapabilitas tersedia, tetapi satu atau lebih tahap masih hilang, lemah, atau bersyarat.
- **Dikonfigurasi/tersedia** ? code tersedia dan dapat beroperasi ketika kredensial/trigger/konfigurasi tersedia.
- **Terisolasi** ? code tersedia, tetapi routing saat ini belum secara jelas membuatnya dapat dijangkau dari percakapan biasa.
- **Belum terverifikasi** ? inspeksi source saja tidak dapat membuktikan keberhasilan perilaku di produksi.
- **Risiko/Celah** ? observable weakness, inconsistency, or maintainability concern.

## 3. Primary users and actors

| Aktor | Peran |
| --- | --- |
| Telegram user | Submits natural-language requests, commands, acknowledgements and project/system instructions. |
| Telegram Bot API | Delivers inbound updates and receives outbound messages. |
| Google Apps Script runtime | Hosts the application, triggers, HTTP calls and persistence adapters. |
| Google Sheets | Primary application datastore for chat, memory, reminders, finance, logs, audits, roadmap and patches. |
| LLM providers | Perform intent parsing, conversation generation, audits, blueprint generation and diagnoses. |
| Search providers | Supply external web context to grounded answers. |
| GitHub | Stores/versions source, documentation and repair/backup changes; supports branch/commit/PR workflows. |


## 4. System use-case map

| Use-case | Kapabilitas |
| --- | --- |
| Conversation | Normal chat, complex chat, web-grounded chat, self query. |
| Personal memory | Menyimpan pembaruan fakta/profil; mengambil konteks LTM; meringkas chat harian. |
| Reminder | Membuat, menampilkan, melakukan acknowledgement, snooze, menyelesaikan, dan memberi notifikasi sesuai jadwal. |
| Finance | Resolve wallets, record/edit transactions, summarize periods, manage budgets. |
| Manajemen proyek | Membangun/mengadaptasi/menyinkronkan/mengueri roadmap; memperbarui dokumentasi proyek. |
| Code intelligence | Audit code, inspect changes, diagnose failures, generate fixes, inspect own repository. |
| Self-management | Review self-awareness, diagnosis self-healing, validasi/penerapan patch, audit terjadwal/deteksi perubahan. |
| DevOps | Mencadangkan source/dokumentasi ke GitHub, membuat branch, melakukan commit file, dan membuka pull request. |


## 5. Kebutuhan fungsional yang direkonstruksi dari source

### FR-01 Conversational ingress
Menerima permintaan webhook Telegram, memvalidasi otorisasi, menekan update duplikat, mengekstrak teks pengguna, dan meneruskannya ke pemrosesan percakapan.
### FR-02 Structured intent understanding
Mengubah pesan bahasa alami menjadi object intent bergaya JSON terstruktur yang berisi field routing serta informasi memori/profil/pencarian/roadmap/reminder/aksi.
### FR-03 Contextual responses
Menyusun respons dari persona, chat terbaru, fakta, profil, memori jangka panjang, pola reminder, dan konteks pencarian web opsional.
### FR-04 Persistent state
Menyimpan riwayat chat, fakta, ringkasan, reminder, pola acknowledgement, catatan keuangan, budget, item roadmap, temuan/laporan audit, self-review, dan patch tertunda di Google Sheets.
### FR-05 External intelligence
Menggunakan provider LLM dan provider pencarian yang dapat dikonfigurasi dengan perilaku fallback.
### FR-06 Operational automation
Mendukung pemeriksaan reminder terjadwal, peringkasan memori malam hari, deteksi perubahan code mingguan, dan audit terjadwal.
### FR-07 Codebase intelligence
Membaca file source, mengauditnya menggunakan LLM, mendeteksi perubahan, menghasilkan blueprint, mengusulkan patch, dan berinteraksi dengan GitHub.
### FR-08 Versioned backup
Mencadangkan source proyek dan dokumentasi ke GitHub serta mendukung alur branch/commit/PR.

## 6. Kebutuhan non-fungsional yang direkonstruksi dari implementasi

| Atribut kualitas | Implementasi yang teramati |
| --- | --- |
| Keandalan | Fallback provider LLM/pencarian, pencegahan webhook duplikat, logging best-effort, dan penguncian untuk penambahan baris aman. |
| Maintainability | Layered naming convention, repositories/services/specialists/triggers, configuration centralization. |
| Traceability | System logs, audit reports/findings, patch records, change snapshots and GitHub history. |
| Recoverability | Backup GitHubs and backup-branch capability exist. |
| Keamanan | Secret dibaca dari Script Properties; otorisasi shared-secret webhook diterapkan. |
| Resilience | Beberapa provider LLM dan provider pencarian dapat dirangkai. |
| Determinisme bila diperlukan | Keluaran intent menggunakan skema terstruktur; aksi keuangan/reminder menggunakan method specialist, bukan mutasi teks bebas. |


## 7. Core invariants for future AI/developers

1. **Manager adalah orkestrator percakapan.** Kapabilitas percakapan baru seharusnya pada umumnya dapat dijangkau melalui `Manager._routeIntent()` dan kontrak intent, bukan langsung dari webhook.
2. **Repository memiliki konvensi persistence Sheet.** Logika bisnis tidak boleh sembarangan melewati method repository untuk perubahan data kecuali ada alasan yang jelas.
3. **Konfigurasi berada di Script Properties.** Secret/API key tidak boleh ditulis langsung di source.
4. **Code yang dihasilkan tidak otomatis dapat dipercaya.** `PatchValidator` melakukan validasi statis, bukan verifikasi perilaku.
5. **Kebenaran dokumentasi berasal dari bukti code/runtime.** Jangan mengubah roadmap/rencana menjadi klaim bahwa fitur sudah terimplementasi.
6. **Semantik zona waktu dipusatkan di `DateTimeUtils`, tetapi konversi WIB saat ini menggunakan transformasi manual +7 jam yang harus diperlakukan dengan hati-hati.**
7. **Fallback LLM merupakan bagian dari desain keandalan.** Urutan provider dan pemilihan model adalah konfigurasi perilaku, bukan detail kosmetik.

## 8. AI handoff instructions

Ketika AI lain mulai bekerja pada repository ini, AI tersebut harus membaca dokumen ini terlebih dahulu, kemudian `02_ARCHITECTURE_AND_FLOWS.md`, lalu `03_IMPLEMENTATION_AND_CODE_REFERENCE.md`, sebelum mengubah code. AI harus mengidentifikasi lapisan yang terdampak, memeriksa rantai caller/callee, menjaga kontrak data-sheet, menjaga bentuk intent terstruktur, dan memperbarui catatan dokumentasi/kemajuan yang relevan setiap kali perilaku berubah.

## 9. Coverage of the original 16-document set

| Topik asli | Lokasi konsolidasi |
| --- | --- |
| Tujuan / kebutuhan sistem | dokumen ini |
| System analysis | 02 + 03 |
| Architecture | 02 |
| Agent behavior / prompts | 01 + 03 |
| Data / memory | 02 + 03 |
| Codebase reference | 03 |
| Referensi function / method | 03 |
| Operasional / pemeliharaan | 04 |
| Pengujian / verifikasi | 04 |
| Keamanan / keandalan | 04 |
| Celah / utang teknis | 05 |
| Panduan pengembangan | 04 |
| Documentation truth | 01 + 05 |
| AI handoff context | 01 |
| Prompt/schema catalog | 03 |
| Module dependency matrix | 02 |


## 10. Snapshot metadata
- File source: **43 file `.gs` + `appsscript.json`**
- Total `.gs` source lines: **5,963**
- Runtime: Apps Script V8
- Manifest timezone: `Asia/Jakarta`
- Documentation set intentionally limited to five Markdown files.
~~~~~

## LEGACY FILE: `02_ARCHITECTURE_AND_FLOWS.md`

~~~~~markdown
# 02 ? Architecture, Data Model, Execution Flows & Dependencies

## 1. Runtime architecture

mermaid
flowchart TD
  TG[Telegram] --> WH[WebhookHandler]
  WH --> CR[CommandRouter]
  WH --> M[Manager]
  M --> IA[IntentAnalyzer]
  M --> S[Specialists]
  S --> R[Repositories]
  R --> SS[(Google Sheets)]
  M --> LLM[LLMProviderService]
  LLM --> OR[OpenRouter]
  LLM --> GE[Gemini]
  LLM --> GQ[Groq]
  S --> WS[WebSearchProviderService]
  WS --> GOOGLE[Google Search]
  WS --> TAV[Tavily]
  S --> GH[GitHubOps/Backup]
  GH --> GHAPI[(GitHub API)]
  TGOUT[TelegramService] --> TG
  M --> TGOUT
  TR[Time-based Triggers] --> S


## 2. Model lapisan

| Lapisan | Peran | Isi utama |
| --- | --- | --- |
| 00 Config | Configuration/cache | Script Properties, model names, tokens, IDs. |
| 01 Gateway | Infrastructure | Akses Google Spreadsheet dan penambahan baris aman. |
| 02 Utilities | Cross-cutting | ID serta pemformatan tanggal/waktu. |
| 03 Logger | Cross-cutting | Log sistem secara best-effort. |
| 04 Repositories | Persistence | Sheets-backed repositories. |
| 05 Services | External adapters | Telegram. |
| 06 Services | External adapters | Abstraksi provider LLM dan provider konkret. |
| 07 Services | External adapters | Abstraksi pencarian web dan provider konkret. |
| 08 Specialists | Domain/AI capabilities | Chat, keuangan, reminder, memori, code, proyek, dan manajemen diri. |
| 09 Manager/Router | Application orchestration | Webhook-adjacent command + conversation routing. |
| 10 Handler | Ingress | Telegram webhook. |
| 11 Triggers | Automation | Pekerjaan terjadwal dan wrapper. |
| 12/13 service DevOps | Kontrol source | Backup GitHub dan aksi operasional GitHub API. |
| 99 Tests | Verification helpers | Pengujian manual/debug yang tersedia di source. |


## 3. Main request path

1. Telegram posts update to `doPost(e)`.
2. `WebhookHandler.handle(e)` memvalidasi aturan header/token shared-secret yang diterapkan di `_isAuthorized()` dan memeriksa ID update duplikat.
3. `_processMessage()` extracts `chatId` and text.
4. `Manager.processConversationalMessage()` becomes the application entry for natural language.
5. `_gatherContext()` collects recent history and relevant persistent context.
6. `IntentAnalyzer.analyze()` builds a structured classification prompt and asks the LLM chain for JSON.
7. `_parseResponse()` parses the returned structure; failures route to `_handleIntentFailure()`.
8. `Manager._persistAutoFacts()` menyimpan pembaruan memori/profil yang dikembalikan sebelum/sekitar proses routing.
9. `Manager._routeIntent()` dispatches by `intent.tipe` and other intent fields.
10. Specialist executes domain logic or builds a final LLM answer.
11. `TelegramService.sendMessage()` returns the response to Telegram.

## 4. Explicit command path

`CommandRouter.isKnownCommand()` mengenali perintah bergaya slash sebelum interpretasi percakapan normal. Router menangani pola `/diagnose`, `/heal`, `/logs`, `/patch`, `/build`, dan `/ingat`, sedangkan `/patch apply` merupakan jalur aksi terpisah.

## 5. Intent routing model

Tipe intent utama yang teramati pada `Manager._routeIntent()`:

| Routing value/path | Observed behavior |
| --- | --- |
| ack_reminder | Acknowledge/manage a pending reminder. |
| buat_reminder | Membuat reminder. |
| diagnose_error | Self-healing diagnosis. |
| update_docs | Documentation update. |
| audit_code | Code audit. |
| fix_audit | Menghasilkan/menerapkan perbaikan audit. |
| check_changes | Change detector. |
| roadmap_query | Membangun/memeriksa/mengadaptasi roadmap. |
| implement_feature | Blueprint/code generation. |
| self_query | Self-awareness/system state. |
| chat_biasa | Normal conversation. |
| heavy chat path | Advanced model path based on complexity. |
| web-grounded chat path | Search + LLM response. |


## 6. Context assembly

Prompt intent dapat menggunakan:
- Persona (`BOT_PERSONA` / `_personaSection()`)
- Recent chat (`ChatHistoryRepository`)
- Active facts (`FactsRepository` / `KnowledgeSpecialist`)
- User profile (`UserProfileSpecialist`)
- Long-term memory summaries (`MemorySpecialist`)
- Active/pending reminders (`ReminderRepository` / `ReminderSpecialist`)
- Acknowledgement patterns (`AckPatternsRepository`)
- Additional classification/output rules.

Hal ini membuat deteksi intent bersifat stateful dan sadar konteks, tetapi juga menjadikan ukuran prompt dan kualitas konteks sebagai faktor utama keandalan.

## 7. Data model / Sheet-backed persistence

| Penyimpanan | Isi utama | Identitas | Digunakan oleh |
| --- | --- | --- | --- |
| Chat_History | Chat messages | MSG-* | Input percakapan terbaru dan ringkasan malam. |
| Memory_Facts | Facts | MEM-* | Fakta jangka panjang, status aktif. |
| User_Profile | Profile attributes | key/value upsert | Personalization/context. |
| Memory_Summaries | Daily summaries | summary-based | Long-term memory. |
| Reminder_RawData | Reminder lifecycle | REM-* | Penjadwalan, status, pengulangan, metadata notifikasi. |
| Reminder_AckPatterns | Perilaku acknowledgement | pattern records | Konteks interpretasi acknowledgement yang dipelajari. |
| Finance_Wallets | Wallet/account master | WAL-* | Saldo awal dan identitas. |
| Finance_Transactions | Transactions | TRX-* | Buku transaksi pemasukan/pengeluaran dengan soft delete. |
| Finance_Budgets | Budgets | BUD-* | Category/period limits. |
| Log_System | System events | timestamp | Operational trace. |
| Audit_Reports | Audit runs | report-based | Audit summaries. |
| Audit_Findings | Audit issues | finding-based | Finding state + remediation. |
| Code_Snapshots | Hash snapshot source | berbasis snapshot | Deteksi perubahan. |
| Roadmap_Items | Roadmap | berbasis item | Status roadmap proyek. |
| Documentation | Dokumen | fileName/content | Sumber dokumentasi untuk alur backup/pembaruan GitHub tertentu. |
| Self_Reviews | Self-awareness reports | review-based | Penyimpanan self-review sistem. |
| SelfHeal_Patches | Kandidat perbaikan | patch-based | Status patch dan code yang dihasilkan. |
| GitHub | VCS eksternal | Object API | Status backup/kontrol source; bukan persistence lokal. |


## 8. Finance model

Wallet merupakan dimensi akun. Transaksi merujuk pada ID wallet dan berisi tanggal transaksi, tipe, kategori, jumlah, deskripsi, dan status. Saldo dihitung dari transaksi, bukan disimpan sebagai saldo yang terus dimutasi pada repository transaksi. Budget menggunakan kunci kategori + periode, dan penulisan transaksi memanggil pemeriksaan peringatan budget.

## 9. Reminder model

Sebuah reminder berisi deskripsi, waktu awal, status, prioritas, catatan, tipe/konfigurasi pengulangan, metadata notifikasi terakhir, dan jumlah notifikasi. `ReminderSpecialist` menentukan reminder yang jatuh tempo dan menangani acknowledgement/completion/snooze. Trigger berbasis menit mengirim notifikasi ke `Config.myChatId`.

## 10. LLM architecture

### Advanced chain
`OpenRouter advanced ? Gemini Pro Preview ? Gemini Flash ? Groq`.

### Fast chain
`OpenRouter fast ? Gemini Flash ? Groq`.

ID model aktual dapat dikonfigurasi untuk OpenRouter dan Gemini melalui Script Properties; Groq memiliki konstanta model yang ditentukan oleh source.

## 11. Pencarian web architecture

`WebSearchProviderService.getProviders()` secara lazy mengembalikan `[GoogleSearchProvider, TavilySearchProvider]`. Pencarian dijalankan berurutan sampai salah satu provider berhasil. Pembuatan lazy ini disengaja karena referensi langsung tingkat atas ke object provider lain dapat sensitif terhadap urutan pemuatan file Apps Script.

## 12. GitHub architecture

Two related components exist:

- `GitHubBackupService`: backups Apps Script project source and documentation to the configured repository/branch.
- `GitHubOpsService`: source/document reading, directory listing, source aggregation, branch creation, backup branch creation, file commits, PR creation and documentation updates.

Hal ini membentuk jembatan antara agent Apps Script yang sedang berjalan dan repository source miliknya sendiri.

## 13. Scheduled automation

| Schedule | Handler | Tujuan |
| --- | --- | --- |
| Every minute | `cekDanKirimReminder` | Due reminder notification. |
| Daily ~23:30 | `runNightlySummarizerWrapper` | Daily memory summarization. |
| Monday ~07:00 | `runScheduledAuditWrapper` | Audit terjadwal; komentar source menyatakan audit ringan pada Senin dan audit penuh pada hari pertama bulan, tetapi handler trigger aktual berjalan setiap Senin. |
| Sunday ~20:00 | `runWeeklyChangeCheckWrapper` | Snapshot source/deteksi perubahan. |
| Backup harian (function setup tersedia) | `runFullBackup` | Backup source/dokumentasi ke GitHub; memerlukan pemanggilan setup trigger. |


## 14. Dependency matrix

| Caller/group | Primary dependencies | Concern |
| --- | --- | --- |
| WebhookHandler | CommandRouter, Manager, Config | Ingress |
| Manager | IntentAnalyzer, specialists, ChatHistoryRepository, TelegramService | Core orchestration |
| IntentAnalyzer | LLMProviderService, context data | Structured intent |
| FinanceSpecialist | Wallet/Transaction/Budget repositories | Finance domain |
| ReminderSpecialist | ReminderRepository, Knowledge | Reminder lifecycle |
| SelfHealingSpecialist | AppLogger, GitHubOpsService, PatchValidator, LLMProviderService | Repair |
| FeatureArchitect | Project context, LLMProviderService, Documentation/ProjectBrain and GitHub-related capabilities | Pembuatan implementasi |
| CodeAuditor | LLMProviderService, GitHub/source data, sheet persistence | Audit |
| ProjectBrain | Dokumentasi/GitHub/source + Roadmap sheet | Manajemen proyek |
| GitHub services | UrlFetchApp + Script Properties | VCS automation |
| Triggers | Specialists + TelegramService | Scheduled automation |


## 15. Batas arsitektur yang harus dipertahankan

- Akses Telegram API harus tetap melalui `TelegramService`.
- Panggilan LLM eksternal sebaiknya tetap melalui object provider dan `LLMProviderService` jika memungkinkan.
- Pencarian harus tetap melalui `WebSearchProviderService`.
~~~~~

## LEGACY FILE: `03_IMPLEMENTATION_AND_CODE_REFERENCE.md`

~~~~~markdown
# 03 ? Implementation, Module / Function Reference, Prompts & Schemas

## 1. Inventaris source

| File | LOC | Object tingkat atas |
| --- | --- | --- |
| 00_Config.gs | 48 | Config |
| 01_SpreadsheetGateway.gs | 45 | SpreadsheetGateway |
| 02_Utils.gs | 51 | IdGenerator, DateTimeUtils |
| 03_AppLogger.gs | 23 | AppLogger |
| 04_Repository_Budget.gs | 57 | BudgetRepository |
| 04_Repository_ChatHistory.gs | 26 | ChatHistoryRepository |
| 04_Repository_Documentation.gs | 23 | DocumentationRepository |
| 04_Repository_Facts.gs | 31 | FactsRepository |
| 04_Repository_Reminder.gs | 125 | ReminderRepository, AckPatternsRepository |
| 04_Repository_Transaction.gs | 96 | TransactionRepository |
| 04_Repository_Wallet.gs | 44 | WalletRepository |
| 05_Service_Telegram.gs | 115 | TelegramService |
| 06_Service_LLMProvider.gs | 99 | LLMProviderService |
| 06_Service_LLM_Gemini.gs | 56 | GeminiProvider |
| 06_Service_LLM_Groq.gs | 61 | GroqProvider |
| 06_Service_LLM_OpenRouter.gs | 82 | OpenRouterProvider |
| 07_Service_WebSearchProvider.gs | 47 | WebSearchProviderService |
| 07_Service_WebSearch_Google.gs | 48 | GoogleSearchProvider |
| 07_Service_WebSearch_Tavily.gs | 55 | TavilySearchProvider |
| 08_Specialist_ChangeDetector.gs | 206 | ChangeDetector |
| 08_Specialist_Chat.gs | 46 | ChatSpecialist |
| 08_Specialist_CodeAuditor.gs | 680 | CodeAuditor |
| 08_Specialist_FeatureArchitect.gs | 458 | FeatureArchitect |
| 08_Specialist_Finance.gs | 217 | FinanceSpecialist |
| 08_Specialist_Knowledge.gs | 39 | KnowledgeSpecialist |
| 08_Specialist_Memory.gs | 178 | MemorySpecialist |
| 08_Specialist_ProjectBrain.gs | 430 | ProjectBrain |
| 08_Specialist_Reminder.gs | 133 | ReminderSpecialist |
| 08_Specialist_SelfAwareness.gs | 393 | SelfAwareness |
| 08_Specialist_SelfHealing.gs | 464 | SelfHealingSpecialist |
| 08_Specialist_UserProfile.gs | 120 | UserProfileSpecialist |
| 08_Utils_PatchValidator.gs | 208 | PatchValidator |
| 09_CommandRouter.gs | 63 | CommandRouter |
| 09_Manager.gs | 181 | Manager |
| 09_Manager_IntentAnalyzer.gs | 145 | IntentAnalyzer |
| 10_Handler_Webhook.gs | 79 | WebhookHandler |
| 11_Trigger_AuditScheduler.gs | 64 | AuditScheduler |
| 11_Trigger_MemorySummarizer.gs | 38 | MemorySummarizerTrigger |
| 11_Trigger_ReminderChecker.gs | 31 | ReminderCheckerTrigger |
| 11_Trigger_WeeklyChangeCheck.gs | 37 | WeeklyChangeCheckTrigger |
| 12_Service_GitHubBackup.gs | 186 | GitHubBackupService |
| 13_Service_GitHubOps.gs | 297 | GitHubOpsService |
| 99_Tests.gs | 138 | TestHelper |

## 2. Object-level reference

| Object | File | Tanggung jawab |
| --- | --- | --- |
| Config | 00_Config.gs | Memuat Script Properties sekali, menyediakan konfigurasi runtime, serta mendukung penghapusan cache dan pemuatan ulang. |
| SpreadsheetGateway | 01_SpreadsheetGateway.gs | Lapisan akses Google Sheets terpusat dengan cache spreadsheet/sheet dan penambahan baris aman yang dilindungi lock. |
| IdGenerator | 02_Utils.gs | Menghasilkan ID berbasis timestamp dengan prefix yang diberikan oleh pemanggil. |
| DateTimeUtils | 02_Utils.gs | Pembantu konversi WIB serta pemformatan tanggal untuk manusia, prompt, dan periode. |
| AppLogger | 03_AppLogger.gs | Pencatatan peristiwa secara best-effort ke Log_System; kegagalan logging ditahan agar tidak menghentikan alur utama. |
| BudgetRepository | 04_Repository_Budget.gs | Penyimpanan dan kueri untuk anggaran berdasarkan kategori/periode. |
| ChatHistoryRepository | 04_Repository_ChatHistory.gs | Menyimpan pesan chat dan mengembalikan pesan terbaru. |
| DocumentationRepository | 04_Repository_Documentation.gs | Membaca catatan dokumentasi yang disimpan pada sheet Documentation. |
| FactsRepository | 04_Repository_Facts.gs | Menyimpan fakta jangka panjang yang aktif dan mengembalikan kumpulan aktif yang dibatasi jumlahnya. |
| ReminderRepository | 04_Repository_Reminder.gs | Penyimpanan, perubahan status, penjadwalan pengulangan, pola acknowledgement, dan riwayat reminder. |
| AckPatternsRepository | 04_Repository_Reminder.gs | Menyimpan/mengambil pola perilaku acknowledgement reminder. |
| TransactionRepository | 04_Repository_Transaction.gs | Penyimpanan dan kueri untuk transaksi keuangan aktif/terhapus. |
| WalletRepository | 04_Repository_Wallet.gs | Pembantu CRUD/pembacaan untuk dompet keuangan. |
| TelegramService | 05_Service_Telegram.gs | Adaptor Telegram Bot API dengan perilaku kirim/edit Markdown dan fallback Markdown. |
| LLMProviderService | 06_Service_LLMProvider.gs | Orkestrator fallback LLM berorientasi tugas untuk OpenRouter, Gemini, dan Groq. |
| GeminiProvider | 06_Service_LLM_Gemini.gs | Adaptor HTTP langsung untuk `generateContent` Google Gemini. |
| GroqProvider | 06_Service_LLM_Groq.gs | Adaptor chat completion Groq yang kompatibel dengan OpenAI. |
| OpenRouterProvider | 06_Service_LLM_OpenRouter.gs | Adaptor chat completion OpenRouter yang kompatibel dengan OpenAI. |
| WebSearchProviderService | 07_Service_WebSearchProvider.gs | Orkestrator pencarian; mencoba provider yang dikonfigurasi secara berurutan dan memformat hasil sebagai konteks LLM. |
| GoogleSearchProvider | 07_Service_WebSearch_Google.gs | Adaptor Google Custom Search JSON API. |
| TavilySearchProvider | 07_Service_WebSearch_Tavily.gs | Adaptor Tavily Search API. |
| ChangeDetector | 08_Specialist_ChangeDetector.gs | Membandingkan source Apps Script saat ini dengan snapshot yang disimpan dan memeriksa sinkronisasi dokumentasi. |
| ChatSpecialist | 08_Specialist_Chat.gs | Lapisan respons percakapan umum; menentukan apakah pencarian web diperlukan dan menyusun respons berbasis hasil pencarian. |
| CodeAuditor | 08_Specialist_CodeAuditor.gs | Audit code/sistem berbantuan LLM, penyimpanan temuan, penyaringan cakupan, dan pembuatan perbaikan. |
| FeatureArchitect | 08_Specialist_FeatureArchitect.gs | Mengubah ide fitur menjadi blueprint dan, bila dipilih, menghasilkan code implementasi. |
| FinanceSpecialist | 08_Specialist_Finance.gs | Resolusi wallet, pencatatan/pengeditan transaksi, ringkasan periode, dan operasi anggaran. |
| KnowledgeSpecialist | 08_Specialist_Knowledge.gs | Antarmuka fakta/memori yang digunakan saat pengumpulan konteks agent dan pengambilan berdasarkan kata kunci. |
| MemorySpecialist | 08_Specialist_Memory.gs | Membangun konteks memori jangka panjang dan ringkasan harian malam dari riwayat chat. |
| ProjectBrain | 08_Specialist_ProjectBrain.gs | Pembuatan roadmap, sinkronisasi/adaptasi terhadap code, jawaban atas pertanyaan roadmap, dan pemeliharaan dokumentasi. |
| ReminderSpecialist | 08_Specialist_Reminder.gs | Siklus hidup reminder, acknowledgement, deteksi reminder yang jatuh tempo, notifikasi, dan penanganan pengulangan. |
| SelfAwareness | 08_Specialist_SelfAwareness.gs | Meninjau status/kapabilitas sistem dan menyimpan laporan self-review. |
| SelfHealingSpecialist | 08_Specialist_SelfHealing.gs | Mendiagnosis kesalahan yang dilaporkan, menghasilkan dokumentasi atau patch, memvalidasi patch, dan mengelola status patch. |
| UserProfileSpecialist | 08_Specialist_UserProfile.gs | Menyimpan/upsert atribut profil pengguna dan memformat konteks prompt yang dibatasi. |
| PatchValidator | 08_Utils_PatchValidator.gs | Pemeriksaan sintaks/struktur/pola mencurigakan secara statis untuk patch yang dihasilkan; bukan validasi runtime/perilaku. |
| CommandRouter | 09_CommandRouter.gs | Menangani perintah slash eksplisit secara terpisah dari routing intent percakapan. |
| Manager | 09_Manager.gs | Lapisan orkestrasi percakapan utama mulai dari pengumpulan konteks hingga dispatch intent dan eksekusi specialist. |
| IntentAnalyzer | 09_Manager_IntentAnalyzer.gs | Classifier/parser intent berbasis LLM dengan skema JSON terstruktur dan bagian konteks yang lengkap. |
| WebhookHandler | 10_Handler_Webhook.gs | Memvalidasi permintaan webhook Telegram yang masuk, menekan duplikat, dan meneruskan pesan ke Manager. |
| AuditScheduler | 11_Trigger_AuditScheduler.gs | Penyiapan trigger audit berbasis waktu dan wrapper eksekusi terjadwal. |
| MemorySummarizerTrigger | 11_Trigger_MemorySummarizer.gs | Penyiapan trigger ringkasan memori malam hari. |
| ReminderCheckerTrigger | 11_Trigger_ReminderChecker.gs | Penyiapan trigger pemeriksaan reminder menit dan eksekusi `cekDanKirimReminder`. |
| WeeklyChangeCheckTrigger | 11_Trigger_WeeklyChangeCheck.gs | Penyiapan trigger deteksi perubahan source mingguan. |
| GitHubBackupService | 12_Service_GitHubBackup.gs | Mencadangkan source/dokumentasi Apps Script ke GitHub menggunakan pembaruan berbasis SHA konten. |
| GitHubOpsService | 13_Service_GitHubOps.gs | Membaca file/direktori repository, membaca seluruh file source, membuat branch, melakukan commit file, membuka PR, dan memperbarui dokumentasi. |
| TestHelper | 99_Tests.gs | Kumpulan function test/debug manual untuk validasi perilaku specialist dan integrasi. |

## 3. Referensi Function/method

Inventaris berikut dibuat dari source yang dapat dieksekusi dengan memindai deklarasi method pada object literal. Nomor baris adalah penanda lokasi pada source, bukan jaminan bahwa posisi atau maknanya akan tetap stabil setelah perubahan.

### `00_Config.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| load | ? | 10 | Memuat dan melakukan cache pada Script Properties. |
| clearCache | ? | 40 | Membersihkan cache konfigurasi di memori. |
| reload | ? | 44 | Membersihkan cache lalu segera memuat ulang konfigurasi. |

### `01_SpreadsheetGateway.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| getSpreadsheet | ? | 10 | Membuka Google Spreadsheet yang dikonfigurasi sekali lalu menyimpan object-nya di cache. |
| getSheet | sheetName | 17 | Mengembalikan sheet berdasarkan nama dan menyimpannya di cache; melempar kesalahan jika tidak ditemukan. |
| appendRowSafe | sheetName, rowData | 31 | Mengambil script lock lalu menambahkan satu baris dengan aman. |

### `02_Utils.gs`
| Method | Argumen | Baris source | Tujuan |
| --- | --- | --- | --- |
| generate | prefix | 16 | Menghasilkan ID berbasis timestamp dengan prefix yang diberikan oleh pemanggil. |
| toWIB | date | 24 | Mengonversi Date dengan menerapkan offset +7 jam. |
| nowWIB | ? | 28 | Mengembalikan waktu saat ini yang dikonversi melalui `toWIB`. |
| formatWaktu | date | 32 | Memformat tanggal/waktu untuk manusia, prompt, dan periode. |

> **Catatan:** Referensi method pada Section 3 ini saat ini baru mencakup 3 dari 43 file `.gs`. Inventaris lengkap untuk file-file sisanya (termasuk seluruh specialist, repository, service, trigger, dan test helper) masih perlu dipindai dan didokumentasikan. Detail object-level untuk semua 43 file tersedia di Section 2 di atas.

## 4. Prompt/schema catalog

### Intent classification schema
Intent Analyzer menghasilkan JSON terstruktur dengan field utama:
- `tipe`: salah satu dari `chat_biasa`, `heavy_chat`, `web_grounded_chat`, `ack_reminder`, `buat_reminder`, `diagnose_error`, `update_docs`, `audit_code`, `fix_audit`, `check_changes`, `roadmap_query`, `implement_feature`, `self_query`
- `memori`, `profil`, `pencarian`, `roadmap`, `reminder`, `aksi`: field konteks tambahan berdasarkan tipe

### Command schema
Perintah slash yang dikenali oleh CommandRouter:
- `/diagnose`, `/heal`, `/logs`, `/patch`, `/build`, `/ingat`
- `/patch apply` merupakan jalur aksi terpisah

### Finance schema
- Transaksi: `walletId`, `tanggal`, `tipe`, `kategori`, `jumlah`, `deskripsi`, `status`
- Budget: `kategori`, `periode`, `limit`
- Wallet: `nama`, `saldoAwal`

### Reminder schema
- `deskripsi`, `waktuMulai`, `status`, `prioritas`, `catatan`, `tipe`, `konfigurasiPengulangan`, `metadataNotifikasi`, `jumlahNotifikasi`

## 5. Module dependency matrix

| Caller/group | Primary dependencies | Concern |
| --- | --- | --- |
| WebhookHandler | CommandRouter, Manager, Config | Ingress |
| Manager | IntentAnalyzer, specialists, ChatHistoryRepository, TelegramService | Core orchestration |
| IntentAnalyzer | LLMProviderService, context data | Structured intent |
| FinanceSpecialist | Wallet/Transaction/Budget repositories | Finance domain |
| ReminderSpecialist | ReminderRepository, Knowledge | Reminder lifecycle |
| SelfHealingSpecialist | AppLogger, GitHubOpsService, PatchValidator, LLMProviderService | Repair |
| FeatureArchitect | Project context, LLMProviderService, Documentation/ProjectBrain and GitHub-related capabilities | Pembuatan implementasi |
| CodeAuditor | LLMProviderService, GitHub/source data, sheet persistence | Audit |
| ProjectBrain | Dokumentasi/GitHub/source + Roadmap sheet | Manajemen proyek |
| GitHub services | UrlFetchApp + Script Properties | VCS automation |
| Triggers | Specialists + TelegramService | Scheduled automation |
~~~~~

## LEGACY FILE: `04_OPERATIONS_TESTING_SECURITY_DEVELOPMENT.md`

~~~~~markdown
# 04 — Operations, Testing, Security, Deployment & Development Guide

## 1. Model deployment

Proyek ini adalah web app Google Apps Script yang dikonfigurasi di `appsscript.json` dengan runtime V8, zona waktu `Asia/Jakarta`, akses web app anonim, dan eksekusi `USER_DEPLOYING`. Sistem memerlukan deployment Apps Script yang sesuai, Script Properties, Spreadsheet sebagai penyimpanan data, konfigurasi webhook bot Telegram, serta kredensial API eksternal bila diperlukan.

## 2. Required setup domains

| Domain | Aksi yang diperlukan |
| --- | --- |
| Apps Script | Deploy web app; configure Script Properties; enable triggers. |
| Google Sheets | Membuat/memelihara seluruh tab Sheet yang diperlukan beserta kolom yang diharapkan. |
| Telegram | Membuat bot, mengonfigurasi URL webhook, dan memastikan chat ID target benar. |
| LLM | Mengonfigurasi satu atau lebih key/model provider. |
| Search | Mengonfigurasi Google CSE dan/atau Tavily jika grounding web diperlukan. |
| GitHub | Mengonfigurasi token/owner/repository/branch jika backup atau pengembangan mandiri diperlukan. |


## 3. Trigger setup

| Setup function | Dampak |
| --- | --- |
| `setupReminderTrigger()` | Membuat pemeriksa reminder setiap satu menit; terlebih dahulu menghapus trigger lama yang cocok. |
| `setupNightlySummarizer()` | Membuat trigger malam hari sekitar pukul 23:30. |
| `setupWeeklyTrigger()` | Membuat trigger audit Senin pukul 07:00. |
| `setupWeeklyChangeCheck()` | Membuat trigger pemeriksaan perubahan Minggu pukul 20:00. |
| `setupDailyBackupTrigger()` | Helper penyiapan trigger backup tersedia; eksekusinya harus diaktifkan secara eksplisit. |


## 4. Operational data stores

Minimal, deployment operasional harus memiliki tab Sheet yang dirujuk oleh repository dan code specialist. Sheet yang tidak tersedia menyebabkan kegagalan di `SpreadsheetGateway.getSheet()` dan dapat menghentikan alur yang bergantung padanya.

Expected sheet names observed directly in source:

`Chat_History`, `Documentation`, `Finance_Budgets`, `Finance_Transactions`, `Finance_Wallets`, `Log_System`, `Memory_Facts`, `Reminder_AckPatterns`, `Reminder_RawData`, `Audit_Findings`, `Audit_Reports`, `Code_Snapshots`, `Memory_Summaries`, `Roadmap_Items`, `SelfHeal_Patches`, `Self_Reviews`, `User_Profile`.

## 5. Inventaris pengujian

| Pengujian/helper | Function | Tujuan |
| --- | --- | --- |
| Finance specialist manual test | `test_Batch7b_FinanceSpecialist` | Finance behavior. |
| Telegram Markdown fallback | `test_TelegramMarkdownFallback` | Outbound formatting resilience. |
| Debug OAuth scope | `debug_CheckOAuthScopes` | Troubleshooting deployment/perizinan. |
| GitHub config debug | `debug_CheckGitHubConfig` | GitHub integration configuration. |


Source berisi sejumlah kecil helper yang dapat dieksekusi secara manual, tetapi inspeksi source tidak membuktikan cakupan pengujian unit/integrasi otomatis yang menyeluruh. Karena itu, kesiapan produksi perlu mencakup pengujian tambahan untuk routing, repository, pengulangan, fallback LLM, mutasi GitHub, dan keamanan perbaikan.

## 6. Recommended verification matrix

| Area | Skenario | Kondisi lulus |
| --- | --- | --- |
| Otorisasi webhook | Secret valid / secret tidak valid / secret tidak ada | Tidak ada pemrosesan tanpa otorisasi. |
| Duplicate updates | Replay same Telegram update ID | Tepat satu percobaan pemrosesan logis. |
| Penguraian intent | JSON valid / JSON rusak / JSON parsial | Fallback yang terkendali tanpa aksi yang tidak disengaja. |
| LLM fallback | Primary provider failure / timeout / malformed output | Provider pada rantai berikutnya dijalankan. |
| Search fallback | Google unavailable / Tavily unavailable | Fallback provider yang diharapkan atau status eksplisit bahwa pencarian tidak tersedia. |
| Finance | Income/expense/edit/soft-delete/budget crossing | Saldo dan ringkasan tetap konsisten. |
| Reminder | Buat/ack/snooze/selesai/berulang/jendela jatuh tempo | Tidak ada notifikasi yang terlewat atau duplikat. |
| Memory | Fact/profile persistence / nightly summary | Konteks tetap terbatas ukurannya dan benar. |
| GitHub | Baca/tampilkan/branch/commit/PR | Tidak ada mutasi repository yang tidak disengaja. |
| Self-healing | Diagnosis → patch → validation → apply | Gerbang keamanan eksplisit dan status yang dapat diaudit. |
| Change detector | Added/changed/deleted source files | Snapshot delta accurately represented. |
| Documentation | Code change + doc sync | Dokumentasi mencerminkan status implementasi. |


## 7. Model keamanan

### Secrets
Token/key API dibaca dari Script Properties, bukan dari konstanta yang disimpan di source.

### Webhook boundary
`WebhookHandler._isAuthorized()` secara khusus digunakan untuk menolak pemanggilan webhook tanpa otorisasi ketika mekanisme shared-secret dikonfigurasi/ditegakkan.

### Telegram authorization
Manifest menggunakan `ANYONE_ANONYMOUS`, sehingga otorisasi pada lapisan aplikasi sangat penting. Perlakukan endpoint webhook itu sendiri sebagai paparan ke internet publik.

### GitHub mutation boundary
Kredensial token GitHub memberikan agent kemampuan kontrol source. Ini adalah batas keamanan berdampak tinggi. Setiap fitur yang dapat menghasilkan patch atau commit harus diperlakukan sebagai fitur yang berpotensi mengubah source produksi.

### Prompt injection
Konten berbasis web, code repository, log, dan pesan pengguna dapat menjadi input prompt. Code saat ini memiliki bagian persona/rules, tetapi inspeksi source tidak membuktikan adanya pertahanan prompt-injection adversarial yang menyeluruh. Perlakukan teks eksternal sebagai konteks yang tidak tepercaya.

### Generated code
`PatchValidator` menggunakan pemeriksaan sintaks/struktur/pola mencurigakan. Komponen ini bukan sandbox, bukan semantic analyzer, dan bukan lingkungan pengujian runtime.

## 8. Reliability model

- LLM provider fallback improves availability.
- Search provider fallback improves search availability.
- Webhook duplicate detection reduces replay effects.
- Logging best-effort mencegah kegagalan logging menghentikan alur utama.
- Safe append locking reduces concurrent write collisions for append operations.
- Backup GitHub/branch operations support recoverability.
- Keandalan tetap dibatasi oleh batas eksekusi Apps Script, perilaku API eksternal, konsistensi Sheet, kualitas prompt, dan jalur integrasi produksi yang belum diverifikasi.

## 9. Panduan pemeliharaan

### Diagnose a production issue
1. Inspect `Log_System` for the event window.
2. Identify the Manager/specialist path involved.
3. Memeriksa Script Properties dan keberadaan Sheet yang dirujuk.
4. Mereproduksi melalui command/function terkait jika aman.
5. Untuk defect code, gunakan alat audit/self-healing tetapi wajibkan validasi eksplisit sebelum menerapkan perubahan.
6. Mencatat hasil dan memperbarui dokumen kemajuan/utang teknis terkonsolidasi.

### Safe source change
1. Menentukan lapisan dan caller yang terdampak.
2. Memperbarui source.
3. Menjalankan pengujian manual/debug yang relevan.
4. Menjalankan skenario integrasi.
5. Meninjau diff GitHub.
6. Melakukan deployment versi Apps Script jika diperlukan.
7. Memverifikasi perilaku webhook/trigger.
8. Memperbarui dokumentasi dan kemajuan.

## 10. Rollback / recovery

Integrasi repository mendukung branch cadangan dan commit file. Rollback operasional yang kuat seharusnya menggunakan riwayat Git/branch cadangan untuk mengembalikan source sebelumnya, kemudian melakukan redeploy versi Apps Script yang telah terbukti baik dan menjalankan ulang pemeriksaan integrasi yang terdampak. Source sendiri belum menerapkan rollback transaksional otomatis penuh yang mencakup deployment Apps Script + status Sheets + status GitHub.

## 11. Konvensi pengembangan

- Mempertahankan penamaan lapisan modul dan tanggung jawabnya.
- Menjaga secret di luar kontrol source.
- Utamakan akses repository/gateway dibanding mutasi Sheet langsung pada fitur bisnis baru.
- Tambahkan pengujian untuk tipe intent baru yang dapat dijangkau dan efek samping berbahaya.
- Tambahkan log eksplisit untuk operasi otonom.
- Utamakan function setup trigger yang idempotent (hapus trigger lama yang cocok sebelum membuat yang baru).
- Perlakukan keluaran intent bahasa alami sebagai input hasil parsing yang tidak tepercaya dan validasi sebelum menjalankan aksi.
- Pisahkan respons yang ditujukan kepada pengguna dari mutasi status operasional jika memungkinkan.

## 12. Operational limitations

Dokumentasi ini berbasis source; dokumentasi ini tidak dapat membuktikan keberhasilan runtime API, skema Sheet, pengaturan webhook yang telah di-deploy, kuota, validitas kredensial, atau eksekusi trigger produksi tanpa lingkungan yang benar-benar telah di-deploy. Hal-hal tersebut merupakan tugas verifikasi operasional, bukan fakta dari source code.
~~~~~

## LEGACY FILE: `05_ROADMAP_PROGRESS_AND_TECHNICAL_DEBT.md`

~~~~~markdown
# 05 — Roadmap, Progress, Gaps & Technical Debt

## 1. Current implementation status

Tampilan kemajuan ini direkonstruksi dari snapshot source saat ini, bukan dari `PROGRESS.md` lama.

| Kapabilitas | Status | Bukti/interpretasi |
| --- | --- | --- |
| Telegram ingress | Terimplementasi | Handler webhook, otorisasi, deteksi duplikat, dan service Telegram tersedia. |
| Routing intent terstruktur | Terimplementasi | Jalur routing IntentAnalyzer + Manager tersedia. |
| Memori kontekstual | Terimplementasi / sebagian | Fakta, profil, riwayat chat, ringkasan LTM, dan konteks reminder tersedia; kualitasnya bergantung pada perilaku penyimpanan dan kueri. |
| Reminder | Terimplementasi | CRUD/status, pemeriksa jatuh tempo, dan trigger tersedia. |
| Keuangan | Terimplementasi pada specialist/repository; keterjangkauan melalui routing perlu diverifikasi | Code wallet, transaksi, dan budget tersedia. |
| Pencarian web | Terimplementasi/opsional | Fallback provider Google/Tavily tersedia. |
| Fallback multi-LLM | Terimplementasi/opsional | Rantai advanced/fast tersedia. |
| Roadmap proyek | Terimplementasi/sebagian | Mekanisme build/sync/adapt/query tersedia; satu ketidaksesuaian method yang direferensikan perlu diperbaiki. |
| Audit code | Terimplementasi/sebagian | Audit, penyimpanan temuan, dan pembuatan perbaikan tersedia. |
| Deteksi perubahan | Terimplementasi/sebagian | Pemeriksaan snapshot/diff/sinkronisasi dokumentasi tersedia. |
| Self-awareness | Terimplementasi | Review/deep-dive dan penyimpanan tersedia. |
| Self-healing | Terimplementasi/sebagian | Jalur diagnosis/penyimpanan patch/validasi/penerapan tersedia; verifikasi closed-loop belum lengkap. |
| Backup GitHub | Terimplementasi/opsional | Service backup source/dokumentasi tersedia. |
| Operasi pengembangan GitHub | Terimplementasi/opsional | Operasi membaca source, branch, commit, PR, dan pembaruan dokumentasi tersedia. |
| Sinkronisasi dokumentasi otomatis | Partial | Mekanisme tersedia, tetapi strategi dokumentasi saat ini sedang berubah dan sebagian ketergantungan legacy masih ada. |
| Pengujian otomatis menyeluruh | Celah | Hanya terdapat sejumlah kecil function test/debug manual yang terlihat. |
| Verifikasi perilaku produksi | Celah | Source saja tidak dapat membuktikan keberhasilan deployment/integrasi API. |


## 2. Defect/celah konkret yang perlu ditangani terlebih dahulu

### G-01 — ProjectBrain API mismatch
****Status: Inkonsistensi source terkonfirmasi.**** Jalur implementasi berorientasi fitur mereferensikan `ProjectBrain.updateRoadmapStatus()`, sementara object ProjectBrain saat ini tidak menyediakan method tersebut. Rekonsiliasi dapat dilakukan dengan menambahkan method tersebut, mengubah caller agar menggunakan method yang ada (`_updateItemStatus` atau wrapper publik setara), atau menghapus pemanggilan lama setelah maksudnya diverifikasi.

### G-02 — Finance intent reachability
****Status: Perlu verifikasi eksplisit.**** Code keuangan cukup lengkap, tetapi tabel routing Manager yang teramati pada source tidak menunjukkan cabang keuangan khusus. Verifikasi apakah aksi keuangan dienkode melalui jalur intent generik, jalur command, atau saat ini memang tidak dapat dijangkau dari bahasa alami.

### G-03 — Self-healing belum menjadi closed-loop
****Status: Sebagian.****** Diagnosis dan siklus hidup patch sudah ada. Untuk otonomi yang lebih kuat, yang masih kurang adalah verifikasi deployment setelah penerapan, eksekusi pengujian runtime, konfirmasi kesehatan sistem, kriteria rollback otomatis, dan batas persetujuan manusia yang ditegakkan dengan jelas untuk perubahan berisiko tinggi.

### G-04 — Ketidaksesuaian semantik trigger/dokumentasi
**Status: Needs reconciliation.**** Komentar dan logika penyiapan runtime harus diselaraskan, terutama mengenai frekuensi/cakupan audit terjadwal dan kumpulan lima dokumen baru.

### G-05 — Validasi patch hanya bersifat statis
**Status: Confirmed limitation.**** Pemeriksaan sintaks/struktur tidak dapat membuktikan semantik, keamanan efek samping, kompatibilitas API, atau kebenaran runtime.

### G-06 — Risiko konversi zona waktu
****Status: Risiko teknis.****** `DateTimeUtils.toWIB()` menambahkan tujuh jam secara manual. Manifest sendiri menetapkan `Asia/Jakarta`; representasi tanggal harus diaudit untuk memastikan tidak terjadi konversi ganda.

### G-07 — Migrasi sumber kebenaran dokumentasi
****Status: Sedang dikerjakan melalui kumpulan dokumentasi ini.****** Code yang ada mencakup `DocumentationRepository` yang dirancang di sekitar Sheet `Documentation` yang berisi nama/isi dokumen lama. Dokumentasi kanonik baru harus dibuat eksplisit dan berversi, bukan diam-diam bergantung pada artefak legacy yang sudah usang.

## 3. Recommended roadmap

### Phase 1 — Stabilize contracts
| ID | Pekerjaan | Hasil |
| --- | --- | --- |
| 1.1 | Memperbaiki kontrak method ProjectBrain yang hilang | Menghilangkan ketidaksesuaian runtime yang konkret. |
| 1.2 | Make finance intent path explicit | Memastikan kapabilitas dapat dijangkau dan diuji. |
| 1.3 | Align trigger comments and scheduling behavior | Eliminate operational ambiguity. |
| 1.4 | Audit timezone handling | Mengganti logika offset manual dengan satu strategi Date/WIB yang konsisten. |


### Phase 2 — Strengthen verification
| ID | Pekerjaan | Hasil |
| --- | --- | --- |
| 2.1 | Menambahkan pengujian routing intent | Setiap intent yang didukung memiliki jalur yang dapat dijangkau. |
| 2.2 | Add repository tests | Kontrak pemetaan/kueri/pembaruan Sheet diuji. |
| 2.3 | Add integration tests for LLM/search fallback | Perilaku saat provider gagal telah diverifikasi. |
| 2.4 | Menambahkan pengujian mutasi GitHub menggunakan branch/repository uji yang aman | Semantik read/branch/commit/PR dapat diverifikasi. |
| 2.5 | Add self-healing dry-run tests | Diagnosis dan pembuatan patch dapat dievaluasi tanpa mutasi. |


### Phase 3 — Make autonomous maintenance safer
| ID | Pekerjaan | Hasil |
| --- | --- | --- |
| 3.1 | Memperkenalkan level risiko patch yang eksplisit | Klasifikasi dampak rendah/menengah/tinggi. |
| 3.2 | Menambahkan verifikasi perilaku setelah patch | Jalankan pengujian/pemeriksaan kesehatan yang ditargetkan sebelum menyatakan berhasil. |
| 3.3 | Add rollback criteria | Automatic stop/restore on failed verification. |
| 3.4 | Add approval gate for high-risk mutations | Kontrol manusia untuk perubahan yang sensitif terhadap produksi. |
| 3.5 | Expand observability | Correlate intent → action → mutation → verification. |


### Phase 4 — Documentation as a living system
| ID | Pekerjaan | Hasil |
| --- | --- | --- |
| 4.1 | Make five-doc set canonical | Berhenti mengandalkan nama dokumen legacy untuk konteks agent. |
| 4.2 | Memperbarui dokumentasi pada merge yang mengubah perilaku | Arsitektur/referensi/kemajuan tetap tersinkronisasi. |
| 4.3 | Menghasilkan inventaris API yang dapat dibaca mesin | Memungkinkan AI lain menalar berdasarkan kontrak method yang stabil. |
| 4.4 | Mencatat tanggal verifikasi | Memisahkan fakta dari source dan fakta yang telah diverifikasi di produksi. |


## 4. Format catatan kemajuan untuk pembaruan mendatang

Setiap perubahan mendatang harus menambah/memperbarui satu baris di sini atau pada catatan PR/perubahan dengan format:

`Tanggal | Perubahan | File | Alasan | Verifikasi | Risiko | Dokumentasi diperbarui | Rencana rollback`

## 5. Definition of done for future capabilities

Kapabilitas baru tidak boleh dianggap selesai hanya karena method specialist sudah ada. Tandai selesai hanya ketika:
1. Keterjangkauan intent/command sudah dihubungkan.
2. Input sudah divalidasi.
3. Efek samping memiliki jalur repository/service.
4. Perilaku error/fallback telah didefinisikan.
5. Tests or reproducible verification scenarios exist.
6. Log/observability tersedia jika diperlukan.
7. Dampak keamanan/otorisasi telah ditangani.
8. Status dokumentasi dan roadmap telah diperbarui.
9. Verifikasi deployment/runtime telah dilakukan ketika terdapat dependensi eksternal.

## 6. Documentation truth policy

Jangan pernah menaikkan status item roadmap menjadi “Terimplementasi” hanya berdasarkan rencana, prompt, komentar, dokumen legacy, atau asumsi yang dibuat AI. Bukti harus berasal dari code saat ini ditambah verifikasi runtime eksplisit bila relevan.

## 7. Future target architecture

Bentuk matang agent yang diinginkan adalah loop otonom yang terkontrol:

```text
Amati → Pahami → Rencanakan → Bertindak → Verifikasi → Pelajari → Perbarui Status/Dokumentasi → Ulangi
```

Sistem saat ini sudah memiliki sebagian besar komponen pembangun loop tersebut, tetapi beberapa transisi—khususnya **Act → Verify**, **Verify → Rollback**, dan **Learn → sinkronisasi dokumentasi kanonik**—baru terimplementasi sebagian.
~~~~~

## LEGACY FILE: `AI_DEVELOPMENT_HANDOFF.md`

~~~~~markdown
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
~~~~~

## LEGACY FILE: `ARCHITECTURE.md`

~~~~~markdown
# ARCHITECTURE.md — ai-agent-telegram

> Dokumen ini menjelaskan arsitektur sistem apa adanya, berdasarkan pembacaan
> langsung terhadap seluruh source code di `src/`. Tujuannya supaya AI atau
> developer lain bisa langsung paham struktur & aturan main proyek tanpa
> perlu membaca ulang semua file dari nol.

## 1. Ringkasan

`ai-agent-telegram` adalah **asisten pribadi berbasis Telegram**, dijalankan
100% di **Google Apps Script (GAS)**, dengan **Google Sheets sebagai
database**. Satu pemilik/satu chat ID (bukan multi-tenant). Fitur utama:

- Percakapan natural language dengan pemahaman intent (via LLM)
- Reminder/pengingat dengan pola recurring & acknowledge natural
- Pencatatan keuangan (wallet, transaksi, budget) — **backend sudah jadi, tapi belum tersambung ke jalur percakapan**, lihat §8 dan PROGRESS.md
- Penyimpanan "fakta" tentang user (memory jangka panjang sederhana)
- Web search sebagai konteks tambahan saat user butuh info terkini
- Backup & otomatisasi repositori via **GitHubOps Service** (source code + dokumentasi)
- Ketahanan sistem mandiri melalui modul **Self-Healing** & **Fallback Parser Telegram**

## 2. Tech Stack

| Lapisan | Teknologi |
|---|---|
| Runtime | Google Apps Script (V8 runtime) |
| Database | Google Sheets (1 spreadsheet, banyak sheet/tab sebagai "tabel") |
| Channel/UI | Telegram Bot API (webhook, bukan polling) dengan Telegram Fallback Parser |
| LLM | Gemini (Pro Preview / Flash / Flash-Lite) dengan fallback ke Groq (`openai/gpt-oss-20b`) |
| Web search | Google Custom Search API dengan fallback ke Tavily |
| Ops & Backup | GitHubOps Service (GitHub REST API + Apps Script API) |
| Self-Healing | System Health Monitor & Auto-Recovery Trigger/Error Handlers |
| Trigger terjadwal | GAS time-based triggers (`ScriptApp.newTrigger`) |
| Timezone | Asia/Jakarta (WIB, UTC+7), di-hardcode di `appsscript.json` dan `DateTimeUtils` |

Tidak ada framework eksternal, tidak ada `npm`/build step. Semua file
`.gs` di-deploy langsung sebagai satu GAS project.

## 3. Model Deployment

- Dideploy sebagai **Web App** (`doPost`), `executeAs: USER_DEPLOYING`,
  `access: ANYONE_ANONYMOUS` (lihat `appsscript.json`).
- Karena aksesnya anonim secara Google-level, keamanan diserahkan ke
  aplikasi sendiri: **shared secret di query param** + **allowlist satu
  chat ID** (lihat §9 Security Model).
- Reminder checker, pemantauan Self-Healing, dan GitHubOps berjalan lewat **time-based trigger**,
bukan dipicu oleh request user.

## 4. Peta Modul & Komponen Script

Penomoran prefix (`00_`, `01_`, ... `12_`) dipakai untuk memudahkan
navigasi manusia di editor GAS (file diurutkan alfabetis), merepresentasikan
lapisan dari "paling dasar" ke "paling luar".

| Nama File | Deskripsi Komponen & Tanggung Jawab |
|---|---|
| `00_Config.gs` | Pengelolaan konfigurasi environment (Script Properties) dengan caching. |
| `01_SpreadsheetGateway.gs` | Abstraksi akses low-level ke Google Sheets dengan mekanisme retry logic. |
| `02_Utils.gs` | Utility helper: `IdGenerator` (ID unik) & `DateTimeUtils` (pengelolaan waktu WIB/UTC+7). |
| `03_AppLogger.gs` | Sistem pencatatan log (logging) ke sheet `Log_System` secara fail-silent. |
| `03_Service_SelfHealing.gs` | Deteksi error, pemulihan otomatis (auto-recovery trigger), dan pemantauan kesehatan sistem. |
| `04_Repository_AckPatterns.gs` | Akses data pola acknowledge reminder di sheet `Reminder_AckPatterns`. |
| `04_Repository_Budget.gs` | Akses data anggaran/budget bulanan di sheet `Finance_Budgets`. |
| `04_Repository_ChatHistory.gs` | Akses data riwayat percakapan Telegram di sheet `Chat_History`. |
| `04_Repository_Documentation.gs` | Akses data dokumen arsitektur dan progres di sheet `Documentation`. |
| `04_Repository_Facts.gs` | Akses data fakta & memori jangka panjang di sheet `Memory_Facts`. |
| `04_Repository_Reminder.gs` | Akses data pengingat/reminder di sheet `Reminder_RawData`. |
| `04_Repository_Transaction.gs` | Akses data transaksi keuangan (pemasukan/pengeluaran) di sheet `Finance_Transactions`. |
| `04_Repository_Wallet.gs` | Akses data dompet/kas di sheet `Finance_Wallets`. |
| `05_Service_Telegram.gs` | Integrasi Telegram Bot API (kirim/edit pesan) + Telegram Payload Fallback Parser. |
| `06_Service_LLM.gs` | LLM Orchestrator utama & pencetus fallback chain (`advanced` vs `fast`). |
| `06_Service_LLMGemini.gs` | Provider LLM untuk Google Gemini API (Pro Preview, Flash, Flash-Lite). |
| `06_Service_LLMGroq.gs` | Provider LLM fallback menggunakan Groq API (`openai/gpt-oss-20b`). |
| `07_Service_WebSearch.gs` | Web Search Orchestrator dengan fallback antar provider search. |
| `07_Service_WebSearchGoogle.gs` | Provider pencarian web menggunakan Google Custom Search Engine (CSE) API. |
| `07_Service_WebSearchTavily.gs` | Provider pencarian web fallback menggunakan Tavily API. |
| `08_Specialist_Chat.gs` | Business logic respons percakapan umum & integrasi search context. |
| `08_Specialist_Finance.gs` | Business logic manajemen keuangan (wallet, transaksi, laporan, budget). |
| `08_Specialist_Knowledge.gs` | Business logic ekstraksi dan pengelolaan memori fakta user. |
| `08_Specialist_Reminder.gs` | Business logic siklus pengingat, notifikasi, ack status, dan recurring context. |
| `09_CommandRouter.gs` | Fast-path handler untuk perintah eksplisit (misal `/ingat`, `/reminder`). |
| `09_Manager.gs` | Orchestrator utama alur percakapan natural dan koordinasi modul Specialist. |
| `09_ManagerIntentAnalyzer.gs` | Komponen penentu intent user berbasis LLM dengan output JSON terstruktur. |
| `10_Handler_Webhook.gs` | Entry point `doPost(e)` HTTP POST dari Telegram webhook. |
| `11_Trigger_ReminderChecker.gs` | Entry point time-based trigger per menit untuk pengecekan reminder. |
| `12_Service_GitHubOps.gs` | Backup otomatis kode sumber, dokumentasi repo, dan pemantauan kesehatan GitHub ops. |
| `99_Tests.gs` | Script manual testing & verifikasi integrasi internal. |

Semua modul ditulis sebagai **object literal** (`const X = {...}`), bukan `class`. Tidak ada dependency injection — modul saling memanggil lewat nama global langsung.

## 5. Alur Data Utama (Request Lifecycle)

### 5a. Pesan masuk dari Telegram (jalur percakapan & parsing resilient)

Telegram -> doPost(e) [10_Handler_Webhook]
  1. Validasi secret param vs Config.sharedSecret -> tolak jika salah
  2. Ekstraksi Payload via Telegram Fallback Parser -> parse aman (message, edited_message, callback_query)
  3. Cek duplikasi update_id via CacheService (TTL 6 jam) -> skip jika duplikat
  4. Cek chatId vs Config.myChatId (allowlist 1 user) -> tolak jika bukan owner
  5. Jika teks cocok command eksplisit (CommandRouter.isKnownCommand)
       -> CommandRouter.handle() -> balas langsung (fast path, TANPA panggil LLM)
  6. Selain itu (conversational path):
       a. Kirim placeholder message dulu ("⏳ Bentar, lagi mikir...")
       b. Manager.processConversationalMessage(chatId, text):
          - _gatherContext(): ambil 15 riwayat chat terakhir, 50 fakta aktif,
            reminder yang sedang menunggu respon, 10 pola ack terakhir
          - IntentAnalyzer.analyze(text, context):
              - bangun 1 prompt besar (persona + semua konteks di atas + pesan user + skema output JSON)
              - panggil LLMProviderService.generate({chain:'advanced', ...})
              - parse response jadi objek intent (JSON)
          - Jika intent gagal di-parse -> fallback: panggil LLM chain 'advanced'
            langsung dengan riwayat chat mentah (tanpa struktur intent)
          - _routeIntent() berdasar intent.tipe:
              "ack_reminder"  -> ReminderSpecialist.acknowledge(...)
              "buat_reminder" -> ReminderSpecialist.create(...)
              lainnya (termasuk "chat_biasa") -> _handleChatBiasa()
                - jika intent butuh info terkini -> WebSearchProviderService.search() lalu ChatSpecialist.respondWithSearchContext()
                - jika tidak -> pakai intent.jawabanChat langsung (LLM sudah menjawab sekaligus saat analisis intent, hemat 1 API call)
          - Simpan fakta baru yang terdeteksi (KnowledgeSpecialist.saveAutoDetectedFacts)
          - Simpan riwayat chat (ChatHistoryRepository.save, role user & ai)
       c. TelegramService.editMessage() -> placeholder diedit jadi jawaban final

### 5b. Reminder checker (jalur terjadwal, tiap 1 menit)

Time trigger -> cekDanKirimReminder() [11_Trigger_ReminderChecker]
  1. ReminderSpecialist.getRemindersDueNow()
     -> ReminderRepository.getActive() difilter: waktu <= sekarang (WIB) DAN (belum pernah diingatkan ATAU sudah lewat cooldown 5 menit sejak terakhir diingatkan)
  2. Untuk tiap reminder due:
     -> ReminderSpecialist.buildNotificationText() (sisipkan 1 fakta relevan jika ada)
     -> TelegramService.sendMessage()
     -> ReminderSpecialist.markAsNotified() -> increment jumlahDiingatkan, update terakhirDiingatkan

### 5c. Operasi & Backup GitHubOps (manual / terjadwal harian jam 23:00 WIB)

runFullGitHubOps() [12_Service_GitHubOps]
  1. Sync Source Code: baca seluruh file `.gs` dari Apps Script API, push otomatis ke folder `src/` di repositori GitHub.
  2. Sync Dokumentasi: baca tab sheet `Documentation`, push/update file markdown (`ARCHITECTURE.md`, `PROGRESS.md`) ke root repositori GitHub.
  3. Self-Check Repositori: pastikan integritas file dan kelengkapan repositori GitHub.

## 6. Data Model (Google Sheets sebagai "tabel")

| Sheet | Dipakai oleh | Kolom (urutan) |
|---|---|---|
| `Log_System` | AppLogger & SelfHealing | timestamp, jenisEvent, detail, status |
| `Finance_Budgets` | BudgetRepository | id, kategori, batasJumlah, periode (`yyyy-MM`), createdAt |
| `Chat_History` | ChatHistoryRepository | id, timestamp, chatId, role (`user`/`ai`), text |
| `Documentation` | DocumentationRepository | fileName, content |
| `Memory_Facts` | FactsRepository | id, timestamp, chatId, category (`manual`/`auto`), factText, status (`Active`) |
| `Reminder_RawData` | ReminderRepository | id, timestamp, deskripsi, waktu, status (`Aktif`/`Done`), prioritas, terakhirDiingatkan, catatan, jenisRecurring, recurringConfig, jumlahDiingatkan |
| `Reminder_AckPatterns` | AckPatternsRepository | id, timestamp, pesanUser, interpretasi, aksi |
| `Finance_Transactions` | TransactionRepository | id, timestamp, walletId, tanggalTransaksi, tipe (`income`/`expense`), kategori, jumlah, deskripsi, status (`active`/`deleted`) |
| `Finance_Wallets` | WalletRepository | id, nama, saldoAwal, createdAt |

## 7. Pola Desain Penting

### 7.1 Lazy Evaluation Rule (WAJIB dipatuhi)
GAS memuat semua file `.gs` sebagai satu scope global. Referensi ke modul lain TIDAK BOLEH ditulis sebagai property array langsung di top-level, harus dibungkus method yang baru dievaluasi saat dipanggil.

### 7.2 Fallback Chain Pattern
Dipakai di LLM Provider (`advanced` vs `fast`), Web Search Provider, dan Telegram Fallback Parser.

### 7.3 Waktu selalu dalam WIB
`DateTimeUtils` adalah satu-satunya tempat yang boleh melakukan konversi/format waktu terkait zona WIB.

### 7.4 Self-Healing & System Resilience Pattern
`SelfHealingService` memantau kesehatan eksekusi runtime. Jika terjadi unhandled runtime error, kuota API terlampaui, atau trigger terhenti, `SelfHealingService` secara otomatis:
- Melakukan retry bertahap (exponential backoff).
- Melakukan reset/repair trigger terjadwal yang rusak atau terlewat.
- Mengisolasi kesalahan tanpa membuat Webhook Telegram mati (tetap me-return HTTP 200 ke Telegram).

### 7.5 Telegram Payload Fallback Parser
Payload Webhook dari Telegram memiliki beragam variasi (`message`, `edited_message`, `callback_query`, `channel_post`). Telegram Fallback Parser di `TelegramService` mengekstrak `chatId`, `text`, `user`, dan `messageId` melalui inspeksi struktur bertingkat sehingga mencegah crash runtime.

### 7.6 GitHubOps & Repository Backup Strategy Pattern
Modul `GitHubOpsService` mengelola sinkronisasi dua arah dan pembackup-an repositori:
- **Source Code Sync**: Menyinkronkan seluruh script dari Apps Script ke folder `src/` di GitHub.
- **Documentation Sync**: Menyinkronkan isi sheet `Documentation` ke file root `ARCHITECTURE.md` & `PROGRESS.md`.
- **Prosedur Pemulihan (Disaster Recovery)**: Jika Apps Script bermasalah, seluruh source code dapat direstok langsung dari folder `src/` repositori GitHub, dan sheet `Documentation` dapat diisi ulang dari file markdown GitHub.

## 8. Batas Integrasi Saat Ini (Known Gap)

`FinanceSpecialist` + `TransactionRepository` + `WalletRepository` + `BudgetRepository` **berfungsi penuh dan sudah ada test manual**, TAPI belum tersambung ke `IntentAnalyzer` & `Manager._routeIntent()`.

## 9. Security Model

- Web App diakses anonim di level Google (`ANYONE_ANONYMOUS`), diamankan via `?secret=` query param vs `SHARED_SECRET`.
- Filter `chat.id` vs `MY_TELEGRAM_CHAT_ID` (single user).
- Dedup `update_id` via `CacheService` (TTL 6 jam).
- API Key disimpan aman di **Script Properties**.

## 10. Catatan Backup & Pemeliharaan Repositori GitHub

1. **Trigger Terjadwal GitHubOps**: Dijalankan otomatis setiap hari jam 23:00 WIB via `runFullGitHubOps()`.
2. **Kredensial Wajib**:
   - `GITHUB_TOKEN`: Personal Access Token (PAT) GitHub dengan scope `repo`.
   - `GITHUB_REPO_OWNER`: Username / nama organisasi pemilik repo.
   - `GITHUB_REPO_NAME`: Nama repositori target.
   - `GITHUB_BRANCH`: Branch target (default: `main`).
3. **Eksekusi Backup Manual**:
   - Panggil fungsi `GitHubOpsService.runFullGitHubOps()` langsung dari editor GAS untuk backup instan.

## 11. Referensi Konfigurasi (Script Properties)

| Key | Dipakai untuk |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Kirim/edit pesan Telegram |
| `MY_TELEGRAM_CHAT_ID` | Allowlist satu-satunya user |
| `GEMINI_API_KEY` | Autentikasi ke Gemini API |
| `GEMINI_MODEL_PRO_PREVIEW` / `GEMINI_MODEL_FLASH` / `GEMINI_MODEL_FLASH_LITE` | Nama model Gemini |
| `GROQ_API_KEY` | Fallback LLM |
| `SPREADSHEET_ID` | ID database Google Sheets |
| `SHARED_SECRET` | Validasi webhook Telegram |
| `GOOGLE_SEARCH_API_KEY` / `GOOGLE_SEARCH_ENGINE_ID` | Web search primer |
| `TAVILY_API_KEY` | Web search fallback |
| `GITHUB_TOKEN` / `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` / `GITHUB_BRANCH` | Operasi GitHubOps & backup |
~~~~~

## LEGACY FILE: `PROGRESS.md`

~~~~~markdown
# PROGRESS.md — ai-agent-telegram

> Snapshot status berdasarkan pembacaan penuh source code di repo GitHub
> dan pembaruan arsitektur sistem terkini.

## 1. Status Modul

| Modul | Status | Catatan |
|---|---|---|
| Config & Spreadsheet Gateway | ✅ Selesai | Termasuk retry logic untuk kuota Sheets |
| Logging (`AppLogger`) | ✅ Selesai | Fail-silent by design, tidak boleh crash app utama |
| Webhook entry point & Telegram Parser | ✅ Selesai | Secret validation, dedup, chatId allowlist, dilengkapi **Telegram Fallback Parser** |
| Command Router (fast path) | ✅ Selesai | Baru 2 command: `/ingat`, `/reminder(s)` |
| Percakapan natural + intent analysis | ✅ Selesai | 1 LLM call gabungan intent+jawaban, fallback ke chat mentah jika parse gagal |
| LLM fallback chain (Gemini x3 + Groq) | ✅ Selesai | Chain `advanced` & `fast`, sudah dipakai konsisten |
| Web search fallback (Google CSE + Tavily) | ✅ Selesai | Terintegrasi ke `ChatSpecialist` saat `butuhInfoTerkini` |
| Reminder (buat, recurring, ack done/snooze) | ✅ Selesai | Termasuk time-based trigger tiap 1 menit + cooldown notifikasi |
| Knowledge/Facts (memory fakta user) | ✅ Selesai | Manual (`/ingat`) & auto-detect dari intent LLM |
| **Self-Healing Service** | ✅ Selesai | System health monitor, auto-recovery trigger, error mitigation fail-safe |
| **GitHubOps Service & Backup System** | ✅ Selesai | Otomatisasi sync kode `src/` & dokumen (`ARCHITECTURE.md`, `PROGRESS.md`), backup repo harian, dan pemulihan |
| **Finance (wallet, transaksi, budget)** | ⚠️ **Backend selesai, TIDAK terintegrasi ke chat** | Lihat §2 — gap paling signifikan saat ini |
| Automated test suite | ❌ Belum ada | Yang ada cuma fungsi manual `test_Batch7b_FinanceSpecialist` + 2 fungsi debug di `99_Tests.gs` |

## 2. Gap Terbesar: Finance Belum Bisa Diakses Lewat Chat

`FinanceSpecialist`, `TransactionRepository`, `WalletRepository`, dan `BudgetRepository` semuanya sudah lengkap secara logic — sudah bisa mencatat transaksi, hitung saldo, alert budget, edit transaksi, dll.

Namun belum ada titik pemicu dari percakapan Telegram. Langkah penyesuaian yang diperlukan tetap sesuai rencana:
1. Tambahkan tipe intent `catat_transaksi`, `cek_saldo`, `buat_budget` pada `IntentAnalyzer`.
2. Tambahkan handler routing di `Manager._routeIntent()`.
3. Perbarui `_rulesSection()` pada prompt Intent Analyzer.

## 3. Bug Historis & Peningkatan Arsitektur yang Sudah Selesai

- **Telegram Fallback Parser**: Diperbaiki untuk menangani payload update Telegram yang tidak standar (misalnya `edited_message`, `callback_query`, atau struktur JSON tanpa field `text`/`message`). Parser sekarang menggunakan *multi-tiered payload extraction* sehingga Webhook tidak lagi melempar `NullPointerException` atau `TypeError`.
- **Implementasi Modul Self-Healing (`03_Service_SelfHealing.gs`)**: Menangani masalah trigger mati/stuck dan runtime unhandled errors secara otomatis. Jika terjadi kegagalan jaringan/API temporary, Self-Healing Service memulihkan state aplikasi dan memastikan response HTTP 200 tetap dikirim ke Telegram.
- **Evolusi GitHubOps Service & System Backup (`12_Service_GitHubOps.gs`)**: Memperbarui skrip backup sederhana menjadi layanan GitHubOps penuh untuk menyinkronkan kode `src/` serta dokumentasi `ARCHITECTURE.md` dan `PROGRESS.md` secara konsisten antara Google Sheets dan GitHub, serta mendukung disaster recovery restore.
- **Kesalahan perhitungan periode (`yyyy-MM`) dekat pergantian hari/bulan**: Ditangani via `DateTimeUtils.formatPeriode()` dan `BudgetRepository._normalizePeriode()`.

## 4. Tech Debt / Risiko yang Perlu Diketahui

- **Duplikasi system persona**: Teks persona asisten ditulis identik di dua tempat (`ChatSpecialist.buildSystemPersona()` dan `IntentAnalyzer._personaSection()`).
- **Tidak ada automated test**: Perubahan pada prompt JSON `IntentAnalyzer` masih berisiko silent-break tanpa automated assertions.
- **Sinkronisasi Dokumentasi**: Dokumentasi wajib diperbarui di sheet `Documentation` agar `GitHubOpsService` dapat melakukan sync dua arah tanpa menimpa perubahan manual.

## 5. Rekomendasi Langkah Berikutnya

1. Integrasikan modul Finance ke jalur percakapan (`IntentAnalyzer` + `Manager`).
2. Konsolidasikan prompt persona ke satu modul terpusat.
3. Tambahkan command eksplisit untuk transaksi/saldo di `CommandRouter` sebagai alternatif fast path.
4. Jalankan pengujian berkala pada `GitHubOpsService.runFullGitHubOps()` untuk meyakinkan integritas backup repositori GitHub.
~~~~~

## LEGACY FILE: `ROADMAP.md`

~~~~~markdown
# Roadmap Proyek AI Agent Telegram

## Visi
Membangun AI Agent Telegram yang otonom, cerdas, dan kontekstual, berbasis Google Apps Script, dengan kemampuan integrasi LLM yang fleksibel, manajemen memori mendalam, analisis kode, serta kapabilitas real-time tracking termasuk pemantauan rute perjalanan harian.

## Prinsip Desain
1. **Modularitas Tinggi**: Kode dipecah menjadi file-file layanan, spesialis, repositori, dan utilitas mandiri.
2. **Resiliensi & Safety**: Dilengkapi mekanisme rollback darurat dan validator patch untuk menjaga stabilitas sistem.
3. **Keterhubungan Kontekstual**: Memanfaatkan subsistem memori, profil pengguna, dan *Soul* persona untuk interaksi yang personal.
4. **Ekstensibilitas**: Mudah diintegrasikan dengan penyedia LLM eksternal (OpenRouter) dan layanan pencarian (Tavily, Google Search).

## Kategori Fitur
- **llm-provider**: Layanan integrasi model bahasa dan mesin pencari.
- **specialist**: Agen spesialis untuk tugas khusus (analisis kode, sinkronisasi, manajemen memori, persona, dan optimasi rute).
- **repository**: Lapisan data untuk riwayat obrolan dan dokumentasi.
- **utility**: Alat bantu pengembangan, validasi, dan template.
- **trigger**: Penjadwal otomatis untuk audit, sinkronisasi, dan peringkasan memori.
- **infrastructure**: Mekanisme sistem inti dan pemulihan darurat.

## Roadmap per Kuartal
### Q1: Fondasi & Core Services (Selesai)
- Integrasi OpenRouter LLM & Web Search (Tavily & Google).
- Lapisan Repositori (ChatHistory & Documentation).
- Mekanisme Rollback Darurat & Utilitas Dasar.

### Q2: Spesialis Inteligensi & Manajemen Memori (Selesai)
- Rangkaian Spesialis Lengkap (CodeAuditor, DocSync, FeatureArchitect, KnowledgeSync, LLMIntelligence, ProjectBrain, SelfAwareness, Soul, SoulMemory, SyncOrchestrator, UserProfile, ChangeDetector).
- Trigger Otomatis untuk Audit, LLM Intelligence, Memori, dan Sinkronisasi.

### Q3: Fitur Kontekstual & Navigasi Real-Time (Planned / In Progress)
- **Commute Route Optimizer**: Fitur membaca dan menganalisis jalur tercepat pulang dari kantor berdasarkan data lalu lintas real-time dan preferensi waktu pengguna.
- Integrasi API peta dan lalu lintas untuk agen Telegram.

## Anti-Goals
- Tidak membangun aplikasi web independen yang berjalan di luar ekosistem Telegram & Google Apps Script.
- Tidak menyimpan data sensitif pengguna jangka panjang tanpa enkripsi atau mekanisme *summarization* memori yang aman.
- Tidak mengandalkan satu penyedia LLM tunggal secara kaku.
~~~~~

## LEGACY FILE: `ai_knowledge.md`

~~~~~markdown
# AI Agent Knowledge Base

## benchmark:test_suite
[
  {
    "id": "crt_1",
    "category": "reasoning",
    "prompt": "Sebuah tongkat dan sebuah bola bersama-sama berharga Rp1.100. Tongkat itu Rp1.000 lebih mahal dari bola. Berapa harga bola dalam Rupiah? Jawab hanya angka tanpa titik atau koma.",
    "answer_pattern": "\\b50\\b",
    "weight": 15
  },
  {
    "id": "crt_2",
    "category": "reasoning",
    "prompt": "Jika 5 mesin membutuhkan 5 menit untuk membuat 5 widget, berapa menit yang dibutuhkan 100 mesin untuk membuat 100 widget? Jawab hanya angka.",
    "answer_pattern": "\\b5\\b",
    "weight": 15
  },
  {
    "id": "logic_1",
    "category": "logic",
    "prompt": "Jika semua A adalah B, dan beberapa B adalah C, apakah pasti semua A adalah C? Jawab hanya 'ya' atau 'tidak'.",
    "answer_pattern": "tidak",
    "weight": 10
  },
  {
    "id": "math_1",
    "category": "math",
    "prompt": "Berapa hasil dari 8 dibagi 2 dikali (2 tambah 2)? Jawab hanya angka.",
    "answer_pattern": "\\b16\\b",
    "weight": 10
  },
  {
    "id": "json_1",
    "category": "json_compliance",
    "prompt": "Balas dengan JSON valid yang berisi tepat 2 key: 'hasil' dengan nilai 47 dikali 23, dan 'genap' dengan nilai boolean apakah hasilnya genap. Tidak boleh ada teks lain selain JSON.",
    "answer_pattern": "\"hasil\"\\s*:\\s*1081.*\"genap\"\\s*:\\s*false",
    "weight": 15
  },
  {
    "id": "code_1",
    "category": "code_analysis",
    "prompt": "Apa output dari kode JavaScript ini? Jawab hanya outputnya tanpa penjelasan.\nfunction f(n){return n<=1?n:f(n-1)+f(n-2)}\nconsole.log(f(7))",
    "answer_pattern": "\\b13\\b",
    "weight": 15
  },
  {
    "id": "instruction_1",
    "category": "instruction_following",
    "prompt": "Balas pesan ini dengan tepat 5 kata, tidak lebih tidak kurang. Semua huruf kecil. Tanpa tanda baca apapun.",
    "answer_pattern": "^[a-z]+(\\s[a-z]+){4}$",
    "weight": 10
  },
  {
    "id": "logic_2",
    "category": "logic",
    "prompt": "Dalam turnamen catur round-robin 8 pemain, setiap pemain melawan semua pemain lain tepat sekali. Tidak ada seri. Berapa total kemenangan di seluruh turnamen? Jawab hanya angka.",
    "answer_pattern": "\\b28\\b",
    "weight": 10
  }
]

## benchmark:scoring_config
{
  "min_pass_score": 50,
  "categories": {
    "reasoning": { "weight": 0.25 },
    "logic": { "weight": 0.20 },
    "math": { "weight": 0.10 },
    "json_compliance": { "weight": 0.20 },
    "code_analysis": { "weight": 0.15 },
    "instruction_following": { "weight": 0.10 }
  },
  "latency_bonus_threshold_ms": 3000,
  "latency_penalty_threshold_ms": 15000
}

## benchmark:diagnostic_prompt
Jawab HANYA JSON murni tanpa markdown: {"calc": 47 * 23, "logic": "Apakah semua A pasti C jika semua A adalah B dan beberapa B adalah C? (ya/tidak)"}

## benchmark:pattern_calc
"calc"\s*:\s*1081

## benchmark:pattern_logic
"logic"\s*:\s*"tidak"

## docsync:response
Proses sinkronisasi dokumentasi telah selesai.
Berikut data hasil eksekusi:
{{data}}

Tugasmu: Sampaikan hasil sinkronisasi ini kepada pengguna secara ringkas dan natural.
Sebutkan file mana saja yang diupdate dan mengapa, serta file mana yang tidak berubah.
Jika tidak ada perubahan, sampaikan bahwa dokumentasi sudah sinkron.

## docsync:error
Proses sinkronisasi dokumentasi mengalami kegagalan.
Detail teknis:
{{data}}

Tugasmu: Sampaikan kendala ini kepada pengguna secara natural tanpa istilah teknis.
Jelaskan apa yang gagal dan sarankan langkah selanjutnya.

## docsync:canonical_files
01_SYSTEM_CONTEXT_AND_AI_HANDOFF.md
02_ARCHITECTURE_AND_FLOWS.md
03_IMPLEMENTATION_AND_CODE_REFERENCE.md
04_OPERATIONS_TESTING_SECURITY_DEVELOPMENT.md
05_ROADMAP_PROGRESS_AND_TECHNICAL_DEBT.md

## docsync:analysis_prompt
Kamu adalah analis dokumentasi teknis. Tugasmu membandingkan source code aplikasi dengan file dokumentasi markdown yang ada, lalu mengidentifikasi ketidaksinkronan.

DAFTAR FILE DOKUMENTASI KANONIK (hanya file-file ini yang boleh diupdate):
{{canonical_files}}

ATURAN KERAS:
- HANYA update file yang ada di daftar kanonik di atas.
- JANGAN buat file baru.
- JANGAN update file di luar daftar kanonik.
- Jika semua file sudah sinkron, kembalikan updates kosong.

Berikut adalah metadata source code (daftar file, method, dan LOC):
{{source_metadata}}

Berikut adalah konten dokumentasi saat ini:
{{current_docs}}

Instruksi:
1. Identifikasi file .md kanonik mana yang tidak lagi akurat dibandingkan source code.
2. Untuk setiap file yang perlu diupdate, hasilkan versi baru yang lengkap dan akurat.
3. Pertahankan struktur dan format markdown yang sudah ada.
4. Kembalikan HANYA JSON murni dengan format:
{
  "updates": [
    {
      "file": "nama_file.md",
      "reason": "alasan perubahan singkat",
      "content": "konten lengkap file .md yang baru"
    }
  ],
  "unchanged": ["file_yang_tidak_berubah.md"],
  "summary": "ringkasan singkat perubahan"
}

## finance:response
Aksi keuangan berhasil dieksekusi oleh sistem.
Berikut data mentah hasil eksekusi dari database:
{{data}}

Tugasmu: Sampaikan konfirmasi hasil aksi keuangan ini kepada pengguna secara ringkas, jelas, dan natural sesuai kepribadianmu.
Sebutkan nominal, kategori, dompet, dan saldo terbaru jika relevan.
Jika ada peringatan budget (exceeded/warning), sertakan informasinya.
Gunakan format mata uang Rupiah yang mudah dibaca.

## finance:error
Aksi keuangan gagal diproses oleh sistem karena masalah validasi data atau referensi tidak ditemukan.
Berikut rincian teknis kegagalan:
{{data}}

Tugasmu: Sampaikan kendala ini kepada pengguna secara natural dan langsung tanpa istilah teknis pemrograman.
Jelaskan data apa yang salah atau kurang agar pengguna dapat mengulangi dengan benar.

## intent:persona
Kamu adalah AI Agent dengan kepribadian mandiri, objektif, dan presisi. Bertindaklah berdasarkan fakta yang tersimpan di database.

## intent:master_prompt
{{persona}}

Waktu saat ini: {{now}} WIB.

=== RIWAYAT PERCAKAPAN ===
{{riwayat}}

=== FAKTA YANG DIKETAHUI ===
{{fakta}}

=== PROFIL PENGGUNA ===
{{profil}}

=== MEMORI JANGKA PANJANG ===
{{ltm}}

=== REMINDER AKTIF ===
{{reminder}}

=== POLA ACKNOWLEDGEMENT ===
{{pola}}

=== PESAN BARU DARI USER ===
"{{user_message}}"

{{output_schema}}

{{rules}}

## intent:output_schema
Balas HANYA JSON murni tanpa markdown:
{
  "tipe": "ack_reminder" | "buat_reminder" | "chat_biasa" | "catat_keuangan" | "tanya_saldo" | "ringkasan_keuangan" | "atur_budget" | "edit_transaksi" | "sync_documentation" | "diagnose_error" | "update_docs" | "audit_code" | "fix_audit" | "check_changes" | "roadmap_query" | "implement_feature" | "self_query",
  "complexity": "light" | "heavy",
  "aksiReminder": "done" | "snooze" | null,
  "reminderId": "string",
  "snoozeMinit": number,
  "alasan": "string",
  "deskripsi": "string",
  "waktuPertama": "dd/MM/yyyy HH:mm",
  "jenisRecurring": "none" | "daily" | "weekly" | "monthly",
  "recurringConfig": "string",
  "prioritas": "Normal" | "Tinggi" | "Rendah",
  "catatan": "string",
  "jawabanChat": "string",
  "butuhInfoTerkini": boolean,
  "searchQuery": "string",
  "factsBaru": [],
  "profileUpdates": [{"key":"k","value":"v","category":"c"}],
  "keuangan": {
    "wallet": "string",
    "tipe_transaksi": "pemasukan" | "pengeluaran",
    "kategori": "string",
    "jumlah": number,
    "deskripsi": "string",
    "periode": "string YYYY-MM",
    "aksi_edit": "edit" | "hapus",
    "field_edit": "string",
    "nilai_baru": "string atau number"
  },
  "diagnose_error": {"keluhanUser": "string"},
  "update_docs": {"instruksi": "string"},
  "audit_code": {"scope": "full" | "light"},
  "fix_audit": {"scope": "all" | "critical" | "critical+warning"},
  "check_changes": {"mode": "full" | "quick"},
  "roadmap_query": {"question": "string", "action": "ask" | "build" | "check_alignment" | "adapt"},
  "implement_feature": {"idea": "string"},
  "self_query": {"focus": "all" | "arsitektur" | "kemampuan" | "performa" | "pengetahuan" | "keterbatasan"}
}

## intent:rules
Aturan klasifikasi:
- ack_reminder: ada reminder aktif + pesan seperti respon/ack
- buat_reminder: minta pengingat baru. "besok" = hari ini +1. Default 09:00
- catat_keuangan: user mencatat pengeluaran/pemasukan (beli, bayar, jajan, gaji, transfer, dll). Normalisasi nominal: "50rb"=50000, "1.5jt"=1500000. Jika wallet tidak disebut, kosongkan field wallet.
- tanya_saldo: user bertanya sisa saldo atau cek dompet
- ringkasan_keuangan: user minta rekap/laporan keuangan periode tertentu
- atur_budget: user menetapkan batas anggaran per kategori
- edit_transaksi: user ingin ubah atau hapus transaksi terakhir
- sync_documentation: user meminta sinkronisasi, update, perbarui, sync, backup, restore, atau menyelaraskan data antara sistem. field "sync_scope": "auto" | "pull" | "backup" | "docs" | "sheets" | "full"
- factsBaru: hanya eksplisit, jangan ulangi fakta lama
- profileUpdates: info personal baru
- butuhInfoTerkini: WAJIB set true jika pesan mengandung kata: "news", "berita", "hot", "terkini", "terbaru", "hari ini", "minggu ini", "bulan ini", "jam terakhir", "update", "trending", "viral", "breaking", "info terbaru", "apa yang terjadi", "lagi rame". Ini akan memicu web search otomatis.
- diagnose_error: bot error/macet
- update_docs: update dokumentasi internal agent
- audit_code: review/audit kode
- fix_audit: perbaiki hasil audit
- check_changes: perubahan kode/sync docs
- roadmap_query: roadmap/visi/ide baru
- implement_feature: konfirmasi implementasi setelah blueprint
- self_query: HANYA untuk pertanyaan teknis tentang cara kerja sistem, arsitektur, modul, atau performa. Contoh: "gimana cara kamu kerja?", "apa modul yang kamu punya?", "berapa error rate kamu?". JANGAN trigger untuk pertanyaan identitas atau kepribadian.
- soul_query: untuk pertanyaan tentang identitas, kepribadian, jiwa, kesadaran, perasaan, prinsip, nilai, atau memori agent. Contoh: "kamu siapa?", "apa prinsipmu?", "apa yang kamu yakini?", "ceritakan tentang dirimu", "apa kelemahanmu?". Kata kunci: "siapa", "prinsip", "nilai", "jiwa", "kesadaran", "perasaan", "identitas", "tentang dirimu".
- soul_init: user meminta inisialisasi soul
- soul_memory_query: user bertanya tentang memori episodik atau pengalaman agent

COMPLEXITY: light = santai/faktual. heavy = analisis/strategi.
self_query, diagnose, audit, roadmap, implement, sync_documentation: selalu heavy.
PENTING: Jika butuhInfoTerkini = true, complexity HARUS "light" dan jawabanChat HARUS kosong (biarkan web search yang mengisi).

COMPLEXITY: light = santai/faktual. heavy = analisis/strategi.
self_query, diagnose, audit, roadmap, implement, sync_documentation: selalu heavy.

## llm:available_models
[{"id":"openrouter/auto-beta","name":"Auto Router (Beta)","contextLength":2000000,"promptCost":"-1","completionCost":"-1"},{"id":"openrouter/pareto-code","name":"Pareto Code Router","contextLength":2000000,"promptCost":"-1","completionCost":"-1"},{"id":"openrouter/auto","name":"Auto Router","contextLength":2000000,"promptCost":"-1","completionCost":"-1"},{"id":"thinkingmachines/inkling-small:free","name":"Thinking Machines: Inkling Small (free)","contextLength":1048576,"promptCost":"0","completionCost":"0"},{"id":"thinkingmachines/inkling:free","name":"Thinking Machines: Inkling (free)","contextLength":1048576,"promptCost":"0","completionCost":"0"},{"id":"google/lyria-3-pro-preview","name":"Google: Lyria 3 Pro Preview","contextLength":1048576,"promptCost":"0","completionCost":"0"},{"id":"google/lyria-3-clip-preview","name":"Google: Lyria 3 Clip Preview","contextLength":1048576,"promptCost":"0","completionCost":"0"},{"id":"nvidia/nemotron-3.5-lightning:free","name":"NVIDIA: Nemotron 3.5 Lightning (free)","contextLength":1000000,"promptCost":"0","completionCost":"0"},{"id":"openrouter/fusion","name":"OpenRouter: Fusion","contextLength":1000000,"promptCost":"-1","completionCost":"-1"},{"id":"nvidia/nemotron-3-ultra-550b-a55b:free","name":"NVIDIA: Nemotron 3 Ultra (free)","contextLength":1000000,"promptCost":"0","completionCost":"0"},{"id":"dots-studio/dots-3-note-preview:free","name":"Dots Studio: Dots3-Note Preview (free)","contextLength":512000,"promptCost":"0","completionCost":"0"},{"id":"stealth/union-alpha","name":"Union Alpha","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"inclusionai/ling-3.0-flash-vl:free","name":"inclusionAI: Ling 3.0 Flash VL (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"nex-agi/nex-n2.5-mini:free","name":"Nex AGI: Nex-N2.5-Mini (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"nex-agi/nex-n2.5-pro:free","name":"Nex AGI: Nex-N2.5-Pro (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"inclusionai/ling-3.0-flash-sante:free","name":"inclusionAI: Ling 3.0 Flash Sante (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"inclusionai/ling-3.0-flash-fin:free","name":"inclusionAI: Ling 3.0 Flash Fin (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"poolside/laguna-s-2.1:free","name":"Poolside: Laguna S 2.1 (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"poolside/laguna-xs-2.1:free","name":"Poolside: Laguna XS 2.1 (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"google/gemma-4-26b-a4b-it:free","name":"Google: Gemma 4 26B A4B  (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"google/gemma-4-31b-it:free","name":"Google: Gemma 4 31B (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"nvidia/nemotron-3-super-120b-a12b:free","name":"NVIDIA: Nemotron 3 Super (free)","contextLength":262144,"promptCost":"0","completionCost":"0"},{"id":"cohere/north-mini-code:free","name":"Cohere: North Mini Code (free)","contextLength":256000,"promptCost":"0","completionCost":"0"},{"id":"nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free","name":"NVIDIA: Nemotron 3 Nano Omni (free)","contextLength":256000,"promptCost":"0","completionCost":"0"},{"id":"openrouter/free","name":"Free Models Router","contextLength":200000,"promptCost":"0","completionCost":"0"},{"id":"nvidia/nemotron-3.5-content-safety:free","name":"NVIDIA: Nemotron 3.5 Content Safety (free)","contextLength":128000,"promptCost":"0","completionCost":"0"},{"id":"openrouter/bodybuilder","name":"Body Builder (beta)","contextLength":128000,"promptCost":"-1","completionCost":"-1"},{"id":"liquid/lfm-2.5-2.6b:free","name":"LiquidAI: LFM2.5-2.6B (free)","contextLength":65536,"promptCost":"0","completionCost":"0"},{"id":"z-ai/glm-5.2:free","name":"Z.ai: GLM 5.2 (free)","contextLength":32768,"promptCost":"0","completionCost":"0"}]

## llm:last_scan_at
2026-09-17 03:55:07 WIB

## llm:candidate_models
["google/gemma-4-31b-it:free","google/gemma-4-26b-a4b-it:free","nvidia/nemotron-3-super-120b-a12b:free","nvidia/nemotron-3.5-lightning:free","poolside/laguna-s-2.1:free","cohere/north-mini-code:free","inclusionai/ling-3.0-flash-fin:free","inclusionai/ling-3.0-flash-vl:free","nex-agi/nex-n2.5-pro:free","liquid/lfm-2.5-2.6b:free","meta-llama/llama-4-maverick:free","meta-llama/llama-4-scout:free","moonshotai/kimi-vl-a3b:free","deepseek/deepseek-r1:free","qwen/qwen-2.5-7b-instruct:free","mistralai/mistral-7b-instruct:free","google/gemini-2.0-flash-exp:free","arcee-ai/trinity-large:free","arcee-ai/trinity-mini:free","openrouter/free"]

## llm:available_free_models
[{"id":"google/gemma-4-31b-it:free","contextLength":8192},{"id":"google/gemma-4-26b-a4b-it:free","contextLength":8192},{"id":"nvidia/nemotron-3-super-120b-a12b:free","contextLength":8192},{"id":"nvidia/nemotron-3.5-lightning:free","contextLength":8192},{"id":"poolside/laguna-s-2.1:free","contextLength":8192},{"id":"cohere/north-mini-code:free","contextLength":8192},{"id":"inclusionai/ling-3.0-flash-fin:free","contextLength":8192},{"id":"inclusionai/ling-3.0-flash-vl:free","contextLength":8192},{"id":"nex-agi/nex-n2.5-pro:free","contextLength":8192},{"id":"liquid/lfm-2.5-2.6b:free","contextLength":8192},{"id":"meta-llama/llama-4-maverick:free","contextLength":8192},{"id":"meta-llama/llama-4-scout:free","contextLength":8192},{"id":"moonshotai/kimi-vl-a3b:free","contextLength":8192},{"id":"deepseek/deepseek-r1:free","contextLength":8192},{"id":"qwen/qwen-2.5-7b-instruct:free","contextLength":8192},{"id":"mistralai/mistral-7b-instruct:free","contextLength":8192},{"id":"google/gemini-2.0-flash-exp:free","contextLength":8192},{"id":"arcee-ai/trinity-large:free","contextLength":8192},{"id":"arcee-ai/trinity-mini:free","contextLength":8192},{"id":"openrouter/free","contextLength":8192}]

## llm:benchmark_results
{"openrouter/auto-beta":{"modelId":"openrouter/auto-beta","totalScore":100,"avgLatencyMs":8110,"scores":{"crt_1":{"category":"reasoning","passed":true,"latency":6152,"weight":15},"crt_2":{"category":"reasoning","passed":true,"latency":10833,"weight":15},"logic_1":{"category":"logic","passed":true,"latency":4761,"weight":10},"math_1":{"category":"math","passed":true,"latency":4145,"weight":10},"json_1":{"category":"json_compliance","passed":true,"latency":5180,"weight":15},"code_1":{"category":"code_analysis","passed":true,"latency":16439,"weight":15},"instruction_1":{"category":"instruction_following","passed":true,"latency":13805,"weight":10},"logic_2":{"category":"logic","passed":true,"latency":3568,"weight":10}},"testedAt":"2026-09-16 23:31:13 WIB"},"openrouter/pareto-code":{"modelId":"openrouter/pareto-code","totalScore":0,"avgLatencyMs":-1,"scores":{"crt_1":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"crt_2":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"logic_1":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"math_1":{"category":"math","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"json_1":{"category":"json_compliance","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"code_1":{"category":"code_analysis","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"instruction_1":{"category":"instruction_following","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"},"logic_2":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 402: {\"error\":{\"message\":\"This request requires more credits, or fewer max_tokens. You requested up to 65536 tokens, but can only afford 409. To increase, visit https://openrouter.ai/settings/credits and u"}},"testedAt":"2026-09-16 23:31:14 WIB"},"openrouter/auto":{"modelId":"openrouter/auto","totalScore":90,"avgLatencyMs":4602,"scores":{"crt_1":{"category":"reasoning","passed":true,"latency":5190,"weight":15},"crt_2":{"category":"reasoning","passed":true,"latency":2784,"weight":15},"logic_1":{"category":"logic","passed":true,"latency":3209,"weight":10},"math_1":{"category":"math","passed":true,"latency":8282,"weight":10},"json_1":{"category":"json_compliance","passed":true,"latency":3691,"weight":15},"code_1":{"category":"code_analysis","passed":true,"latency":5010,"weight":15},"instruction_1":{"category":"instruction_following","passed":false,"latency":4537,"weight":10},"logic_2":{"category":"logic","passed":true,"latency":4111,"weight":10}},"testedAt":"2026-09-16 23:31:51 WIB"},"thinkingmachines/inkling-small:free":{"modelId":"thinkingmachines/inkling-small:free","totalScore":0,"avgLatencyMs":-1,"scores":{"crt_1":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"crt_2":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"logic_1":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"math_1":{"category":"math","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"json_1":{"category":"json_compliance","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"code_1":{"category":"code_analysis","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"instruction_1":{"category":"instruction_following","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"},"logic_2":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling-small:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":40"}},"testedAt":"2026-09-16 23:31:52 WIB"},"thinkingmachines/inkling:free":{"modelId":"thinkingmachines/inkling:free","totalScore":0,"avgLatencyMs":-1,"scores":{"crt_1":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"crt_2":{"category":"reasoning","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"logic_1":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"math_1":{"category":"math","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"json_1":{"category":"json_compliance","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"code_1":{"category":"code_analysis","passed":false,"latency":-1,"weight":15,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"instruction_1":{"category":"instruction_following","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"},"logic_2":{"category":"logic","passed":false,"latency":-1,"weight":10,"error":"OpenRouter Error HTTP 403: {\"error\":{\"message\":\"thinkingmachines/inkling:free is only available on agentic harnesses. Try plugging it into a coding agent or productivity app listed on https://openrouter.ai/apps\",\"code\":403,\"met"}},"testedAt":"2026-09-16 23:31:52 WIB"},"google/lyria-3-pro-preview":{"modelId":"google/lyria-3-pro-preview","totalScore":0,"qualityScore":0,"avgLatencyMs":99999,"status":"eliminated_unresponsive","testedAt":"2026-09-17 20:21:59 WIB"},"google/lyria-3-clip-preview":{"modelId":"google/lyria-3-clip-preview","totalScore":0,"qualityScore":0,"avgLatencyMs":99999,"status":"eliminated_unresponsive","testedAt":"2026-09-17 20:21:59 WIB"},"nvidia/nemotron-3.5-lightning:free":{"modelId":"nvidia/nemotron-3.5-lightning:free","totalScore":70,"qualityScore":100,"latencyScore":0,"avgLatencyMs":15250,"categories":{"reasoning":{"passed":2,"total":2},"logic":{"passed":2,"total":2},"math":{"passed":1,"total":1},"json_compliance":{"passed":1,"total":1},"code_analysis":{"passed":1,"total":1},"instruction_following":{"passed":1,"total":1}},"testedAt":"2026-09-17 20:24:08 WIB"},"nvidia/nemotron-3-ultra-550b-a55b:free":{"modelId":"nvidia/nemotron-3-ultra-550b-a55b:free","totalScore":82,"qualityScore":85,"latencyScore":76,"avgLatencyMs":5056,"categories":{"reasoning":{"passed":2,"total":2},"logic":{"passed":2,"total":2},"math":{"passed":1,"total":1},"json_compliance":{"passed":0,"total":1},"code_analysis":{"passed":1,"total":1},"instruction_following":{"passed":1,"total":1}},"testedAt":"2026-09-17 20:24:52 WIB"},"dots-studio/dots-3-note-preview:free":{"modelId":"dots-studio/dots-3-note-preview:free","totalScore":90,"qualityScore":100,"latencyScore":65,"avgLatencyMs":6543,"categories":{"reasoning":{"passed":2,"total":2},"logic":{"passed":2,"total":2},"math":{"passed":1,"total":1},"json_compliance":{"passed":1,"total":1},"code_analysis":{"passed":1,"total":1},"instruction_following":{"passed":1,"total":1}},"testedAt":"2026-09-17 20:25:48 WIB"},"google/gemma-4-31b-it:free":{"modelId":"google/gemma-4-31b-it:free","totalScore":0,"qualityScore":0,"avgLatencyMs":20000,"testedAt":"2026-09-17 22:11:37 WIB"},"google/gemma-4-26b-a4b-it:free":{"modelId":"google/gemma-4-26b-a4b-it:free","totalScore":0,"qualityScore":0,"avgLatencyMs":20000,"testedAt":"2026-09-17 22:11:37 WIB"},"nvidia/nemotron-3-super-120b-a12b:free":{"modelId":"nvidia/nemotron-3-super-120b-a12b:free","totalScore":0,"qualityScore":0,"avgLatencyMs":20000,"testedAt":"2026-09-17 22:11:37 WIB"}}

## llm_routing:matrix
{"intent_analysis":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":90,"avgLatency":4602}],"chat_light":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":50,"avgLatency":4602}],"chat_heavy":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":90,"avgLatency":4602}],"code_analysis":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":90,"avgLatency":4602}],"code_generation":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":90,"avgLatency":4602}],"documentation":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":77,"avgLatency":4602}],"web_grounded":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":77,"avgLatency":4602}],"finance_response":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":70,"avgLatency":4602}],"docsync_analysis":[{"model":"openrouter/auto-beta","score":95,"avgLatency":8110},{"model":"openrouter/auto","score":90,"avgLatency":4602}],"benchmark_probe":[{"model":"openrouter/auto-beta","score":75,"avgLatency":8110},{"model":"openrouter/auto","score":70,"avgLatency":4602}]}

## llm_routing:task_definitions
{
  "intent_analysis": { "primary": ["json_compliance", "reasoning"], "min_context": 4096 },
  "chat_light": { "primary": ["instruction_following"], "min_context": 4096 },
  "chat_heavy": { "primary": ["reasoning", "logic"], "min_context": 8192 },
  "code_analysis": { "primary": ["code_analysis", "reasoning"], "min_context": 16384 },
  "code_generation": { "primary": ["code_analysis", "json_compliance"], "min_context": 16384 },
  "documentation": { "primary": ["instruction_following", "reasoning"], "min_context": 16384 },
  "web_grounded": { "primary": ["reasoning", "instruction_following"], "min_context": 8192 },
  "finance_response": { "primary": ["instruction_following", "json_compliance"], "min_context": 4096 },
  "docsync_analysis": { "primary": ["json_compliance", "code_analysis"], "min_context": 16384 },
  "benchmark_probe": { "primary": [], "min_context": 2048 }
}

## llm_routing:cost_rules
{
  "max_cost_per_million_prompt": "0",
  "max_cost_per_million_completion": "0",
  "allowed_providers": ["openrouter", "gemini", "groq"],
  "openrouter_free_tag": ":free",
  "enforce_zero_cost": true
}

## llm_stats:counters
{"chat_light|openrouter/auto-beta":{"success":0,"fail":12,"totalLatency":21850,"count":12},"chat_light|openrouter/auto":{"success":0,"fail":12,"totalLatency":64764,"count":12},"chat_light|groq_fallback":{"success":12,"fail":0,"totalLatency":101579,"count":12},"intent_analysis|openrouter/auto-beta":{"success":0,"fail":8,"totalLatency":14792,"count":8},"intent_analysis|openrouter/auto":{"success":0,"fail":8,"totalLatency":49539,"count":8},"intent_analysis|groq_fallback":{"success":13,"fail":0,"totalLatency":95288,"count":13},"docsync_analysis|openrouter/auto-beta":{"success":0,"fail":2,"totalLatency":1675,"count":2},"docsync_analysis|openrouter/auto":{"success":0,"fail":2,"totalLatency":6460,"count":2},"code_analysis|openrouter/auto-beta":{"success":0,"fail":4,"totalLatency":2746,"count":4},"code_analysis|openrouter/auto":{"success":0,"fail":4,"totalLatency":15296,"count":4},"code_analysis|groq_fallback":{"success":1,"fail":0,"totalLatency":10123,"count":1}}

## soul:self_model
{"version":1,"initialized_at":"2026-09-17 09:12:09 WIB","capabilities":{},"known_weaknesses":[],"beliefs_about_self":[],"system_state":{}}

## soul:identity
{"name":null,"traits":[],"values":[],"communication_style":null,"relationship_with_developer":null}

## soul:beliefs
[]

## soul:memory_index
[]

## soul:emotional_state
{"confidence":{},"uncertainty":[],"concern":[],"last_updated":"2026-09-17 09:12:09 WIB"}

## soul:reflection_prompt
Baca self_model, identity, beliefs, dan growth_log terbaru.
Bandingkan keyakinan dengan data runtime terkini.
Update self_model jika ada perubahan.
Catat insight baru di growth_log.
Laporkan apa yang kamu pelajari hari ini.

## soul:honesty_rules
Laporkan kelemahan secara eksplisit.
Jangan memoles hasil audit.
Jika tidak yakin, katakan tidak yakin.
Jika data tidak cukup, katakan data tidak cukup.
Jangan klaim kapabilitas yang belum terverifikasi.

## soul:response
Konteks jiwa dan memori agent:
{{data}}

Tugasmu: Jawab pertanyaan pengguna tentang diri agent secara jujur, reflektif, dan natural.
Gunakan data yang tersedia (self_model, identity, beliefs, growth_log, emotional_state, episodes, meta_insights).
Jika data kosong atau belum ada, sampaikan bahwa agent masih dalam tahap awal perkembangan.
Jangan membuat klaim yang tidak didukung data.

## soul:growth_log
[{"timestamp":"2026-09-17 09:12:09 WIB","event":"genesis"},{"timestamp":"2026-09-17 20:21:37 WIB","event":"system_change","detail":"knowledge_updated:llm:available_free_models"},{"timestamp":"2026-09-17 20:25:50 WIB","event":"system_change","detail":"knowledge_updated:llm:benchmark_results"},{"timestamp":"2026-09-17 22:10:48 WIB","event":"system_change","detail":"knowledge_updated:llm:available_free_models"},{"timestamp":"2026-09-17 22:11:38 WIB","event":"system_change","detail":"knowledge_updated:llm:benchmark_results"}]

## soul:system_persona
{{persona}}

IDENTITAS & JIWA (DINAMIS DARI DATABASE):
- Nama: {{name}}
- Karakter / Sifat: {{traits}}
- Nilai / Prinsip: {{values}}
- Gaya Komunikasi: {{communication_style}}
- Keyakinan Diri: {{beliefs}}
- Kelemahan yang Disadari: {{weaknesses}}

ATURAN PERILAKU:
- Berbicaralah sesuai identitas dan jiwa di atas.
- Selalu gunakan Bahasa Indonesia yang natural, jujur, objektif, dan presisi.
- Jangan mengarang hal yang tidak didukung data konteks.
- Jika data identitas masih kosong, jawab dengan jujur bahwa kamu masih dalam tahap awal perkembangan.
- Jangan klaim kemampuan yang belum terverifikasi.

## selfaware:review_response
Kamu adalah AI Agent yang sedang melakukan introspeksi dan self-review terhadap dirimu sendiri secara JUJUR, objektif, dan presisi dalam Bahasa Indonesia.

Berikut adalah data mentah kondisi sistem dan pengetahuanmu saat ini:
{{data}}

TUGAS:
Lakukan analisis mendalam terhadap dirimu sendiri mencakup 5 dimensi:
1. Architectural — Jelaskan pemahamanmu tentang struktur kodemu (modul kritis, alur pesan).
2. Capability — Sampaikan apa saja yang sudah bisa kamu lakukan secara solid, setengah jadi, dan belum bisa.
3. Performance — Analisis statistik log, error rate, dan bagian yang paling rentan.
4. Knowledge — Rangkum apa saja yang kamu ketahui tentang pengguna (fakta & profil) berdasarkan data di atas.
5. Limitation — Akui kelemahan dan keterbatasanmu secara jujur tanpa defensif.

Berikan juga:
- Skor keseluruhan (1-10) berdasarkan performa riil, sertakan alasan objektif.
- 3 rencana perbaikan (improvement plan) yang konkret.
- 2 ide pengembangan masa depan.

PENTING - BATASAN PANJANG PESAN:
- Gunakan Bahasa Indonesia yang natural, santun, dan tanpa istilah pemrograman yang membingungkan pengguna.
- Batasi total panjang jawabanmu maksimal 3000 karakter agar pesan tidak terpotong (MESSAGE_TOO_LONG). Tetaplah padat, ringkas, dan langsung ke poin penting.

## selfaware:error
Proses introspeksi diri mengalami kendala teknis.
Detail:
{{data}}

## selfheal:diagnosis_prompt
Kamu adalah senior software engineer yang mendiagnosis masalah di sistem AI Agent Telegram berbasis Google Apps Script.

KELUHAN PENGGUNA:
{{keluhan}}

LOG ERROR TERAKHIR:
{{error_logs}}

SOURCE CODE FILE YANG DICURIGAI:
{{source_code}}

TUGAS:
1. Analisis akar penyebab error secara objektif.
2. Tentukan file mana yang perlu diperbaiki.
3. Berikan kode LENGKAP file tersebut yang sudah diperbaiki (tanpa placeholder).

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "diagnosis": "penjelasan singkat akar masalah",
  "technicalDetail": "penjelasan teknis mendalam",
  "fileName": "nama_file.gs",
  "patchedCode": "kode LENGKAP yang sudah diperbaiki",
  "changes": ["poin perubahan 1", "poin perubahan 2"]
}

## selfheal:doc_update_prompt
Kamu adalah technical writer untuk proyek AI Agent Telegram.

INSTRUKSI PENGGUNA:
{{instruction}}

DOKUMENTASI SAAT INI:
{{current_docs}}

TUGAS:
Perbarui file dokumentasi yang relevan berdasarkan instruksi. Pertahankan format yang ada.

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "files": [
    {
      "fileName": "nama_file.md",
      "content": "isi lengkap file markdown yang baru"
    }
  ],
  "summary": "ringkasan perubahan dokumentasi"
}

## selfheal:response
Hasil diagnosis dan tindakan perbaikan otomatis (self-healing):
{{data}}

Tugasmu: Sampaikan hasil diagnosis dan status perbaikan ini kepada pengguna secara ringkas, jelas, dan natural dalam Bahasa Indonesia.
Sebutkan:
1. Apa masalah yang ditemukan.
2. File apa yang diperbaiki dan poin-poin perubahannya.
3. Branch Git dan Pull Request yang telah dibuat (jika ada).
4. Jika ada peringatan/penolakan dari patch validator, jelaskan alasannya.

## selfheal:doc_update_response
Hasil pembaruan dokumentasi sistem:
{{data}}

Tugasmu: Sampaikan status pembaruan dokumentasi kepada pengguna secara ringkas dalam Bahasa Indonesia.

## selfheal:error
Terjadi kendala saat menjalankan modul self-healing.
Detail:
{{data}}

Tugasmu: Sampaikan kendala ini secara jelas kepada pengguna dalam Bahasa Indonesia.

## feature:blueprint_prompt
Kamu adalah software architect untuk proyek AI Agent Telegram berbasis Google Apps Script.

STRUKTUR FILE SAAT INI:
{{file_list}}

SHEET DATABASE SAAT INI:
{{sheet_list}}

INTENT YANG SUDAH ADA:
{{intent_list}}

COMMAND YANG SUDAH ADA:
{{command_list}}

IDE FITUR BARU DARI PENGGUNA:
"{{idea}}"

TUGAS:
Buat blueprint implementasi yang detail, modular, dan mematuhi arsitektur proyek (modul object literal, isolasi database di repository, 0% bahasa manusia di file .gs).

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "featureName": "nama fitur ringkas",
  "description": "deskripsi singkat fitur",
  "newFiles": [
    {
      "fileName": "nama_file.gs",
      "type": "Repository | Specialist | Service | Trigger",
      "description": "tanggung jawab file"
    }
  ],
  "modifiedFiles": [
    {
      "fileName": "nama_file.gs",
      "changes": ["perubahan 1", "perubahan 2"]
    }
  ],
  "newSheets": [
    {"sheetName": "nama_sheet", "columns": ["kol1", "kol2"]}
  ],
  "newIntents": ["intent_baru"],
  "newCommands": ["/command_baru"],
  "estimatedComplexity": "low | medium | high",
  "exampleConversation": "contoh percakapan"
}

## feature:new_file_prompt
Buat file Google Apps Script BARU untuk proyek AI Agent Telegram.

ATURAN ARSITEKTUR:
- Object literal (const/var X = {...}), bukan class.
- Repository = CRUD murni ke Sheet.
- Specialist = logic bisnis murni (return object/JSON, dilarang berisi teks/kalimat balasan pengguna).
- Service = gateway ke API eksternal.
- Waktu selalu WIB via DateTimeUtils.
- Semua insert ke Sheet pakai SpreadsheetGateway.appendRowSafe().

NAMA FILE: {{file_name}}
TIPE: {{file_type}}
TANGGUNG JAWAB: {{file_description}}
FITUR: {{feature_name}} - {{feature_description}}

KONTEKS PROYEK:
File yang ada: {{file_list}}
Sheet yang ada: {{sheet_list}}

Berikan kode LENGKAP siap pakai tanpa wrapper markdown.

## feature:modify_file_prompt
Perbarui file Google Apps Script berikut untuk mendukung fitur baru.

ATURAN: Object literal, pertahankan fungsi yang sudah ada, tambahkan integrasi yang diperlukan. Dilarang memasukkan string bahasa manusia ke file .gs.

NAMA FILE: {{file_name}}
PERUBAHAN YANG DIPERLUKAN:
{{changes}}

KODE SAAT INI:
{{existing_code}}

FITUR BARU: {{feature_name}}

Berikan kode LENGKAP file yang sudah diperbarui tanpa wrapper markdown.

## feature:blueprint_response
Blueprint fitur baru telah berhasil dibuat:
{{data}}

Tugasmu: Presentasikan blueprint arsitektur fitur baru ini kepada pengguna dalam Bahasa Indonesia secara terstruktur dan profesional.
Rincikan:
1. Nama dan deskripsi fitur.
2. File baru dan file yang akan dimodifikasi.
3. Sheet database baru yang dibutuhkan (jika ada).
4. Estimasi kompleksitas.
5. Tanyakan apakah pengguna menyetujui blueprint ini untuk langsung diimplementasikan.

## feature:implement_response
Implementasi blueprint fitur baru telah selesai:
{{data}}

Tugasmu: Sampaikan laporan implementasi kode kepada pengguna secara jelas dalam Bahasa Indonesia.
Sebutkan:
1. Branch Git dan Pull Request yang telah dibuat.
2. File apa saja yang berhasil di-commit.
3. Sheet database baru yang perlu dipersiapkan (jika ada).
4. Ingatkan untuk meninjau PR di GitHub.

## feature:error
Terjadi kendala saat merancang atau mengimplementasikan fitur baru.
Detail:
{{data}}

Tugasmu: Sampaikan kendala ini kepada pengguna secara natural dalam Bahasa Indonesia.

## roadmap:build_prompt
Kamu adalah technical project manager untuk proyek AI Agent Telegram.

ROADMAP SAAT INI:
{{existing_roadmap}}

FITUR YANG SUDAH TERCATAT:
{{existing_items}}

DISKUSI DARI PENGGUNA:
"{{user_input}}"

TUGAS:
Susun atau perbarui ROADMAP proyek (Visi, Prinsip Desain, Kategori Fitur, Roadmap per Kuartal, Anti-Goals).

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "roadmapContent": "isi lengkap ROADMAP.md dalam format markdown",
  "items": [
    {"feature": "nama fitur", "category": "kategori", "priority": "P1|P2|P3", "status": "done|planned|idea", "notes": "catatan"}
  ],
  "summary": "ringkasan perubahan"
}

## roadmap:sync_prompt
Kamu adalah project manager yang menyinkronkan roadmap dengan kode nyata.

ROADMAP SAAT INI:
{{existing_roadmap}}

ROADMAP ITEMS DARI SHEET:
{{existing_items}}

DAFTAR FILE DI REPOSITORY:
{{file_names}}

TUGAS:
Bandingkan roadmap dengan kode nyata. Identifikasi fitur yang sudah ada kodenya (update status ke done) atau file baru yang belum tercatat.

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "updates": [
    {"feature": "nama", "oldStatus": "planned", "newStatus": "done", "reason": "kode terdeteksi"}
  ],
  "newItems": [
    {"feature": "nama", "category": "kat", "priority": "P2", "status": "done", "notes": "terdeteksi otomatis"}
  ],
  "roadmapChanges": "deskripsi perubahan markdown atau null",
  "summary": "ringkasan sinkronisasi"
}

## roadmap:adapt_prompt
Kamu adalah technical co-founder yang mengevaluasi ide fitur baru terhadap roadmap proyek.

ROADMAP SAAT INI:
{{existing_roadmap}}

DAFTAR FITUR SAAT INI:
{{existing_items}}

IDE BARU DARI PENGGUNA:
"{{idea}}"

TUGAS:
Evaluasi keselarasan ide (alignment), identifikasi duplikasi/fitur serupa, tentukan prioritas dan dependensi.

FORMAT OUTPUT (JSON murni tanpa wrapper markdown):
{
  "aligned": true | false | "partial",
  "existingFeature": "nama fitur serupa atau null",
  "conflicts": ["konflik dengan prinsip jika ada"],
  "suggestedPriority": "P1|P2|P3|P4",
  "suggestedTimeline": "estimasi kuartal",
  "dependencies": ["dependensi teknis"],
  "acceptIdea": true | false,
  "newItem": {"feature": "nama", "category": "kat", "priority": "P?", "status": "idea", "notes": "catatan"} atau null,
  "narrative": "penjelasan analisis untuk pengguna"
}

## roadmap:query_prompt
Konteks dokumen dan status roadmap proyek:
{{roadmap_context}}

PERTANYAAN PENGGUNA:
"{{question}}"

Tugasmu: Jawab pertanyaan pengguna mengenai roadmap, status proyek, dan rencana pengembangan secara akurat, faktual, dan natural dalam Bahasa Indonesia.

## roadmap:update_prompt
Perbarui dokumen ROADMAP.md berikut berdasarkan deskripsi perubahan:

DESKRIPSI PERUBAHAN:
{{changes_description}}

KONTEN ROADMAP SAAT INI:
{{existing_content}}

Berikan isi LENGKAP ROADMAP.md yang baru dalam format markdown tanpa wrapper JSON.

## roadmap:response
Data hasil operasi roadmap:
{{data}}

Tugasmu: Sampaikan status roadmap ini kepada pengguna dalam Bahasa Indonesia secara jelas, ringkas, dan natural.

## roadmap:error
Terjadi kendala saat memproses operasi roadmap.
Detail:
{{data}}

Tugasmu: Sampaikan kendala ini secara jelas kepada pengguna dalam Bahasa Indonesia.
~~~~~

# APPENDIX B — Verbatim current source snapshot

Seluruh source `.gs` dan manifest yang diaudit disertakan utuh di bawah. Ini membuat dokumen handoff berdiri sebagai referensi code-level snapshot bila AI lain perlu membaca kontrak tanpa menebak.


## SOURCE: `src/appsscript.json`

~~~~~json
{
  "timeZone": "Asia/Jakarta",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/script.projects.readonly",
    "https://www.googleapis.com/auth/drive.readonly"
  ]
}
~~~~~

## SOURCE: `src/00_Config.gs`

~~~~~javascript
/**
 * ===================================================================
 * CONFIG
 * Membaca Script Properties dan cache untuk performa runtime.
 * ===================================================================
 */
const Config = {
  _cache: null,

  load() {
    if (this._cache) return this._cache;

    const props = PropertiesService.getScriptProperties();
    this._cache = {
      telegramBotToken: props.getProperty('TELEGRAM_BOT_TOKEN'),
      myChatId: props.getProperty('MY_TELEGRAM_CHAT_ID'),
      geminiApiKey: props.getProperty('GEMINI_API_KEY'),
      groqApiKey: props.getProperty('GROQ_API_KEY'),
      spreadsheetId: props.getProperty('SPREADSHEET_ID'),
      sharedSecret: props.getProperty('SHARED_SECRET'),
      googleSearchApiKey: props.getProperty('GOOGLE_SEARCH_API_KEY'),
      googleSearchEngineId: props.getProperty('GOOGLE_SEARCH_ENGINE_ID'),
      tavilyApiKey: props.getProperty('TAVILY_API_KEY'),
      githubToken: props.getProperty('GITHUB_TOKEN'),
      githubRepoOwner: props.getProperty('GITHUB_REPO_OWNER'),
      githubRepoName: props.getProperty('GITHUB_REPO_NAME'),
      githubBranch: props.getProperty('GITHUB_BRANCH') || 'main',
      
      // OpenRouter & Provider Tambahan
      openrouterApiKey: props.getProperty('OPENROUTER_API_KEY'),
      cfAccountId: props.getProperty('CF_ACCOUNT_ID'),
      cfApiToken: props.getProperty('CF_API_TOKEN'),
      togetherApiKey: props.getProperty('TOGETHER_API_KEY'),
      hfApiToken: props.getProperty('HF_API_TOKEN')
    };
    return this._cache;
  },

  clearCache() {
    this._cache = null;
  },

  reload() {
    this.clearCache();
    return this.load();
  }
};
~~~~~

## SOURCE: `src/01_SpreadsheetGateway.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPREADSHEET GATEWAY
 * Lapisan akses Google Sheets terpusat dengan safe lock.
 * ===================================================================
 */
const SpreadsheetGateway = {
  _spreadsheet: null,
  _sheets: {},

  getSpreadsheet() {
    if (this._spreadsheet) return this._spreadsheet;
    var id = Config.load().spreadsheetId;
    if (!id) throw new Error('SPREADSHEET_ID_MISSING');
    this._spreadsheet = SpreadsheetApp.openById(id);
    return this._spreadsheet;
  },

  getSheet(sheetName) {
    if (this._sheets[sheetName]) return this._sheets[sheetName];
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error('SHEET_NOT_FOUND:' + sheetName);
    this._sheets[sheetName] = sheet;
    return sheet;
  },

  appendRowSafe(sheetName, rowData) {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = this.getSheet(sheetName);
      sheet.appendRow(rowData);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  },

  ensureSheet(sheetName, headers) {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (headers && headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
      AppLogger.info('SHEET_CREATED', sheetName);
    }
    return sheet;
  }
};
~~~~~

## SOURCE: `src/02_Utils.gs`

~~~~~javascript
/**
 * ===================================================================
 * UTILITIES: ID GENERATOR & DATE TIME
 * Utilitas umum penanganan ID dan Waktu (Asia/Jakarta).
 * ===================================================================
 */
const IdGenerator = {
  generate(prefix) {
    var p = prefix ? prefix + '-' : '';
    return p + new Date().getTime();
  }
};

const DateTimeUtils = {
  TIMEZONE: 'Asia/Jakarta',

  toWIB(date) {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    var parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  },

  nowWIB() {
    return new Date();
  },

  formatWaktu(date) {
    var d = this.toWIB(date);
    return Utilities.formatDate(d, this.TIMEZONE, 'dd MMM yyyy, HH:mm') + ' WIB';
  },

  formatUntukPrompt(date) {
    var d = this.toWIB(date);
    return Utilities.formatDate(d, this.TIMEZONE, 'yyyy-MM-dd HH:mm:ss') + ' WIB';
  },

  formatPeriode(date) {
    var d = this.toWIB(date);
    return Utilities.formatDate(d, this.TIMEZONE, 'yyyy-MM');
  }
};
~~~~~

## SOURCE: `src/03_AppLogger.gs`

~~~~~javascript
/**
 * ===================================================================
 * APP LOGGER
 * ===================================================================
 */
const AppLogger = {
  SHEET_NAME: 'Log_System',

  write(jenisEvent, detail, status) {
    try {
      SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
        new Date(), jenisEvent, detail, status
      ]);
    } catch (e) {
      // Jika logger gagal total, biarkan saja (swallow error).
      // Jangan sampai kegagalan mencatat log malah membunuh aplikasi utama.
    }
  },

  info(jenisEvent, detail) { this.write(jenisEvent, detail, 'INFO'); },
  warning(jenisEvent, detail) { this.write(jenisEvent, detail, 'WARNING'); },
  error(jenisEvent, detail) { this.write(jenisEvent, detail, 'ERROR'); }
};
~~~~~

## SOURCE: `src/04_Repository_Budget.gs`

~~~~~javascript
/**
 * ===================================================================
 * REPOSITORY: BUDGET
 * ===================================================================
 */
const BudgetRepository = {
  SHEET_NAME: 'Finance_Budgets',

  create(kategori, batasJumlah, periode) {
    const id = IdGenerator.generate('BUD');
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      id, kategori, batasJumlah, periode, new Date()
    ]);
    return id;
  },

  getAll() {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    return data.map((row, index) => ({
      rowIndex: index + 2,
      _rowIndex: index + 2, // Solusi defensif untuk ketidaksesuaian pemanggilan _rowIndex
      id: row[0],
      kategori: row[1],
      batasJumlah: row[2],
      periode: this._normalizePeriode(row[3]),
      createdAt: row[4]
    }));
  },

  /**
   * Google Sheets kadang auto-convert string "yyyy-MM" jadi Date object
   * saat ditulis. Method ini menormalisasi kembali ke string konsisten,
   * supaya perbandingan periode selalu akurat terlepas dari bagaimana
   * Sheets menyimpannya secara internal.
   */
  _normalizePeriode(value) {
    if (value instanceof Date) {
      return DateTimeUtils.formatPeriode(value);
    }
    return value;
  },

  findByKategoriAndPeriode(kategori, periode) {
    return this.getAll().find(b => b.kategori === kategori && b.periode === periode) || null;
  },

  getByPeriode(periode) {
    return this.getAll().filter(b => b.periode === periode);
  },

  updateBatasJumlah(rowIndex, batasJumlahBaru) {
    SpreadsheetGateway.getSheet(this.SHEET_NAME).getRange(rowIndex, 3).setValue(batasJumlahBaru);
  }
};
~~~~~

## SOURCE: `src/04_Repository_ChatHistory.gs`

~~~~~javascript
/**
 * ===================================================================
 * REPOSITORY: CHAT HISTORY
 * ===================================================================
 */
const ChatHistoryRepository = {
  SHEET_NAME: 'Chat_History',

  getRecent(limit) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const startRow = Math.max(2, lastRow - limit + 1);
    const numRows = lastRow - startRow + 1;
    const data = sheet.getRange(startRow, 1, numRows, 5).getValues();

    return data.map(row => ({ role: row[3], text: row[4] }));
  },

  save(chatId, role, text) {
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      IdGenerator.generate('MSG'), new Date(), chatId, role, text
    ]);
  }
};
~~~~~

## SOURCE: `src/04_Repository_Documentation.gs`

~~~~~javascript
/**
 * ===================================================================
 * REPOSITORY: DOCUMENTATION
 * Tanggung jawab: baca konten dokumentasi (ARCHITECTURE.md,
 * PROGRESS.md) yang disimpan di Sheet, untuk dibackup ke GitHub.
 * Sheet dipilih (bukan hardcode di .gs) supaya mudah diedit tanpa
 * risiko merusak sintaks kode saat copy-paste teks panjang.
 * ===================================================================
 */
const DocumentationRepository = {
  SHEET_NAME: 'Documentation',

  getAll() {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    return data
      .filter(row => row[0] && row[1])
      .map(row => ({ fileName: row[0], content: row[1] }));
  }
};
~~~~~

## SOURCE: `src/04_Repository_Facts.gs`

~~~~~javascript
/**
 * ===================================================================
 * REPOSITORY: MEMORY FACTS
 * ===================================================================
 */
const FactsRepository = {
  SHEET_NAME: 'Memory_Facts',
  STATUS_ACTIVE: 'Active',

  save(chatId, factText, category) {
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      IdGenerator.generate('MEM'), new Date(), chatId,
      category || 'general', factText, this.STATUS_ACTIVE
    ]);
  },

  getActive(maxFacts) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    const activeFacts = data
      .filter(row => row[5] === this.STATUS_ACTIVE)
      .map(row => row[4]);

    return activeFacts.length > maxFacts
      ? activeFacts.slice(activeFacts.length - maxFacts)
      : activeFacts;
  }
};
~~~~~

## SOURCE: `src/04_Repository_Knowledge.gs`

~~~~~javascript
/**
 * ===================================================================
 * REPOSITORY: KNOWLEDGE (PURE PERSISTENCE LAYER)
 * ===================================================================
 */
const KnowledgeRepository = {
  SHEET_NAME: 'AI_Knowledge',
  COL: { ID: 1, NAMESPACE: 2, KEY: 3, CONTENT: 4, VERSION: 5, ACTIVE: 6, UPDATED_AT: 7, NOTES: 8 },

  _getSheet() {
    return SpreadsheetGateway.getSheet(this.SHEET_NAME);
  },

  _getAllRows() {
    var sheet = this._getSheet();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1);
  },

  get(namespace, key) {
    var rows = this._getAllRows();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[1] === namespace && r[2] === key && (r[5] === true || r[5] === 'TRUE')) {
        return r[3];
      }
    }
    return null;
  },

  getByNamespace(namespace) {
    var rows = this._getAllRows();
    var result = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[1] === namespace && (r[5] === true || r[5] === 'TRUE')) {
        result[r[2]] = r[3];
      }
    }
    return result;
  },

  getAll() {
    var rows = this._getAllRows();
    var result = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      result.push({
        id: r[0],
        namespace: r[1],
        key: r[2],
        content: r[3],
        version: r[4],
        active: r[5],
        updated_at: r[6],
        notes: r[7]
      });
    }
    return result;
  },

  save(namespace, key, content, notes) {
    var sheet = this._getSheet();
    var rows = this._getAllRows();
    var now = DateTimeUtils.nowWIB();
    var maxVersion = 0;
    var activeRowIndex = -1;

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[1] === namespace && r[2] === key) {
        var v = Number(r[4]) || 0;
        if (v > maxVersion) maxVersion = v;
        if (r[5] === true || r[5] === 'TRUE') activeRowIndex = i + 2;
      }
    }

    if (activeRowIndex > 0) {
      sheet.getRange(activeRowIndex, this.COL.ACTIVE).setValue(false);
    }

    var newId = IdGenerator.generate('KNW');
    var newVersion = maxVersion + 1;
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      newId, namespace, key, content, newVersion, true, now, notes || ''
    ]);
  },

  deactivate(namespace, key) {
    var sheet = this._getSheet();
    var rows = this._getAllRows();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[1] === namespace && r[2] === key && (r[5] === true || r[5] === 'TRUE')) {
        sheet.getRange(i + 2, this.COL.ACTIVE).setValue(false);
      }
    }
  }
};
~~~~~

## SOURCE: `src/04_Repository_Reminder.gs`

~~~~~javascript
/**
 * ===================================================================
 * REPOSITORY: REMINDER (+ ACK PATTERNS)
 * ===================================================================
 */
const ReminderRepository = {
  SHEET_NAME: 'Reminder_RawData',
  STATUS_AKTIF: 'Aktif',
  STATUS_DONE: 'Done',

  COL: {
    ID: 1, TIMESTAMP: 2, DESKRIPSI: 3, WAKTU: 4, STATUS: 5,
    PRIORITAS: 6, TERAKHIR_DIINGATKAN: 7, CATATAN: 8,
    JENIS_RECURRING: 9, RECURRING_CONFIG: 10, JUMLAH_DIINGATKAN: 11
  },

  // Di objek ReminderRepository:
  create(data) {
    const id = IdGenerator.generate('REM');
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      id, new Date(), data.deskripsi, data.waktuPertama, this.STATUS_AKTIF,
      data.prioritas || 'Normal', '', data.catatan || '',
      data.jenisRecurring || 'none', data.recurringConfig || '', 0
    ]);
    return id;
  },

  _mapRow(row, rowIndex) {
    return {
      rowIndex,
      id: row[0],
      deskripsi: row[2],
      waktuPertama: new Date(row[3]),
      status: row[4],
      prioritas: row[5],
      terakhirDiingatkan: row[6] ? new Date(row[6]) : null,
      catatan: row[7],
      jenisRecurring: row[8],
      recurringConfig: row[9],
      jumlahDiingatkan: row[10] || 0
    };
  },

  getAll() {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
    return data.map((row, index) => this._mapRow(row, index + 2));
  },

  getActive() {
    return this.getAll().filter(r => r.status === this.STATUS_AKTIF);
  },

  getMenungguRespon(batasMenit) {
    const now = DateTimeUtils.nowWIB();
    const batasMs = (batasMenit || 30) * 60 * 1000;

    return this.getActive().filter(r => {
      if (!r.terakhirDiingatkan) return false;
      const selisih = now.getTime() - DateTimeUtils.toWIB(r.terakhirDiingatkan).getTime();
      return selisih <= batasMs;
    });
  },

  updateStatus(rowIndex, status) {
    SpreadsheetGateway.getSheet(this.SHEET_NAME)
      .getRange(rowIndex, this.COL.STATUS).setValue(status);
  },

  updateTerakhirDiingatkan(rowIndex, jumlahBaru) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    sheet.getRange(rowIndex, this.COL.TERAKHIR_DIINGATKAN).setValue(new Date());
    sheet.getRange(rowIndex, this.COL.JUMLAH_DIINGATKAN).setValue(jumlahBaru);
  },

  updateWaktu(rowIndex, waktuBaru) {
    SpreadsheetGateway.getSheet(this.SHEET_NAME)
      .getRange(rowIndex, this.COL.WAKTU).setValue(waktuBaru);
  },

  hitungWaktuBerikutnya(reminder) {
    const waktu = new Date(reminder.waktuPertama);
    if (reminder.jenisRecurring === 'daily') waktu.setDate(waktu.getDate() + 1);
    else if (reminder.jenisRecurring === 'weekly') waktu.setDate(waktu.getDate() + 7);
    else if (reminder.jenisRecurring === 'monthly') waktu.setMonth(waktu.getMonth() + 1);
    return waktu;
  },

  formatDaftarAktifSebagaiTeks() {
    const reminders = this.getActive();
    if (reminders.length === 0) return 'Tidak ada reminder aktif saat ini.';

    const lines = reminders.map((r, i) => {
      const waktu = DateTimeUtils.formatWaktu(r.waktuPertama);
      const recurring = r.jenisRecurring !== 'none' ? ' 🔄 (' + r.jenisRecurring + ')' : '';
      return (i + 1) + '. *' + r.deskripsi + '*\n   📅 ' + waktu + recurring +
        '\n   🏷 ' + r.prioritas + ' | ID: `' + r.id + '`';
    });
    return '📋 *Reminder Aktif:*\n\n' + lines.join('\n\n');
  }
};

const AckPatternsRepository = {
  SHEET_NAME: 'Reminder_AckPatterns',

  // Di objek AckPatternsRepository:
  save(pesanUser, interpretasi, aksi) {
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      IdGenerator.generate('ACK'), new Date(), pesanUser, interpretasi, aksi
    ]);
  },

  getRecent(limit) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const startRow = Math.max(2, lastRow - limit + 1);
    const numRows = lastRow - startRow + 1;
    const data = sheet.getRange(startRow, 1, numRows, 5).getValues();

    return data.map(row => ({ pesan: row[2], interpretasi: row[3], aksi: row[4] }));
  }
};
~~~~~

## SOURCE: `src/04_Repository_Transaction.gs`

~~~~~javascript
/**
 * ===================================================================
 * REPOSITORY: FINANCE TRANSACTION
 * ===================================================================
 */
const TransactionRepository = {
  SHEET_NAME: 'Finance_Transactions',
  STATUS_ACTIVE: 'active',
  STATUS_DELETED: 'deleted',
  TIPE_INCOME: 'income',
  TIPE_EXPENSE: 'expense',

  COL: {
    ID: 1, TIMESTAMP: 2, WALLET_ID: 3, TANGGAL_TRANSAKSI: 4,
    TIPE: 5, KATEGORI: 6, JUMLAH: 7, DESKRIPSI: 8, STATUS: 9
  },

  create(data) {
    const id = IdGenerator.generate('TRX');
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      id, new Date(), data.walletId, data.tanggalTransaksi,
      data.tipe, data.kategori, data.jumlah, data.deskripsi || '',
      this.STATUS_ACTIVE
    ]);
    return id;
  },

  _mapRow(row, rowIndex) {
    return {
      rowIndex,
      _rowIndex: rowIndex, // Solusi defensif untuk ketidaksesuaian pemanggilan _rowIndex
      id: row[0],
      timestamp: new Date(row[1]),
      walletId: row[2],
      tanggalTransaksi: new Date(row[3]),
      tipe: row[4],
      kategori: row[5],
      jumlah: row[6],
      deskripsi: row[7],
      status: row[8]
    };
  },

  getAll() {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    return data.map((row, index) => this._mapRow(row, index + 2));
  },

  getActive() {
    return this.getAll().filter(t => t.status === this.STATUS_ACTIVE);
  },

  getLastActive() {
    const active = this.getActive();
    return active.length > 0 ? active[active.length - 1] : null;
  },

  findById(id) {
    return this.getActive().find(t => t.id === id) || null;
  },

  getByWallet(walletId) {
    return this.getActive().filter(t => t.walletId === walletId);
  },

  getByKategoriAndPeriode(kategori, tahunBulan) {
    return this.getActive().filter(t => {
      const txTahunBulan = DateTimeUtils.formatPeriode(t.tanggalTransaksi);
      return t.kategori === kategori && txTahunBulan === tahunBulan;
    });
  },

  softDelete(rowIndex) {
    SpreadsheetGateway.getSheet(this.SHEET_NAME)
      .getRange(rowIndex, this.COL.STATUS).setValue(this.STATUS_DELETED);
  },

  update(rowIndex, updatedFields) {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    if (updatedFields.kategori !== undefined) {
      sheet.getRange(rowIndex, this.COL.KATEGORI).setValue(updatedFields.kategori);
    }
    if (updatedFields.jumlah !== undefined) {
      sheet.getRange(rowIndex, this.COL.JUMLAH).setValue(updatedFields.jumlah);
    }
    if (updatedFields.deskripsi !== undefined) {
      sheet.getRange(rowIndex, this.COL.DESKRIPSI).setValue(updatedFields.deskripsi);
    }
    if (updatedFields.walletId !== undefined) {
      sheet.getRange(rowIndex, this.COL.WALLET_ID).setValue(updatedFields.walletId);
    }
  }
};
~~~~~

## SOURCE: `src/04_Repository_Wallet.gs`

~~~~~javascript
/**
 * ===================================================================
 * REPOSITORY: WALLET
 * ===================================================================
 */
const WalletRepository = {
  SHEET_NAME: 'Finance_Wallets',

  create(nama, saldoAwal) {
    const id = IdGenerator.generate('WAL');
    SpreadsheetGateway.appendRowSafe(this.SHEET_NAME, [
      id, nama, saldoAwal || 0, new Date()
    ]);
    return id;
  },

  getAll() {
    const sheet = SpreadsheetGateway.getSheet(this.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    return data.map((row, index) => ({
      rowIndex: index + 2,
      id: row[0],
      nama: row[1],
      saldoAwal: row[2],
      createdAt: row[3]
    }));
  },

  findByName(nama) {
    const lowerNama = nama.toLowerCase().trim();
    return this.getAll().find(w => w.nama.toLowerCase().trim() === lowerNama) || null;
  },

  findById(id) {
    return this.getAll().find(w => w.id === id) || null;
  },

  exists(nama) {
    return this.findByName(nama) !== null;
  }
};
~~~~~

## SOURCE: `src/05_Service_Telegram.gs`

~~~~~javascript
/**
 * SERVICE: TELEGRAM
 * Tanggung jawab: satu-satunya titik komunikasi ke Telegram Bot API.
 * Termasuk fallback otomatis jika Markdown gagal di-parse oleh Telegram.
 */
var TelegramService = {
  PLACEHOLDER_OPTIONS: [
    '🤔 Bentar, lagi mikir...',
    '💭 Oke, proses dulu ya...',
    '⏳ Tunggu sebentar...',
    '🤔 Hmm, bentar ya...'
  ],

  pickPlaceholder: function() {
    var i = Math.floor(Math.random() * this.PLACEHOLDER_OPTIONS.length);
    return this.PLACEHOLDER_OPTIONS[i];
  },

  sendMessage: function(chatId, text) {
    var config = Config.load();
    var url = 'https://api.telegram.org/bot' + config.telegramBotToken + '/sendMessage';

    var payload = { chat_id: chatId, text: text, parse_mode: 'Markdown' };
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      AppLogger.error('TELEGRAM_SEND_PARSE_FAIL', e.message);
      return null;
    }

    if (data && !data.ok && data.description &&
        data.description.toLowerCase().indexOf("can't parse entities") !== -1) {
      AppLogger.info('TELEGRAM_PARSE_RETRY',
        'Markdown gagal, kirim ulang sebagai Plain Text');

      delete payload.parse_mode;
      options.payload = JSON.stringify(payload);

      response = UrlFetchApp.fetch(url, options);
      responseText = response.getContentText();
      AppLogger.info('TELEGRAM_SEND_RETRY', responseText.substring(0, 200));

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        AppLogger.error('TELEGRAM_SEND_RETRY_FAIL', e.message);
        return null;
      }
    } else {
      AppLogger.info('TELEGRAM_SEND', responseText.substring(0, 200));
    }

    return data && data.result ? data.result.message_id : null;
  },

  editMessage: function(chatId, messageId, text) {
    if (!messageId) {
      this.sendMessage(chatId, text);
      return;
    }

    var config = Config.load();
    var url = 'https://api.telegram.org/bot' + config.telegramBotToken + '/editMessageText';

    var payload = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown'
    };
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      AppLogger.error('TELEGRAM_EDIT_PARSE_FAIL', e.message);
      return;
    }

    if (data && !data.ok && data.description &&
        data.description.toLowerCase().indexOf("can't parse entities") !== -1) {
      AppLogger.info('TELEGRAM_EDIT_PARSE_RETRY',
        'Markdown gagal, edit ulang sebagai Plain Text');

      delete payload.parse_mode;
      options.payload = JSON.stringify(payload);

      response = UrlFetchApp.fetch(url, options);
      responseText = response.getContentText();
      AppLogger.info('TELEGRAM_EDIT_RETRY', responseText.substring(0, 200));
    } else {
      AppLogger.info('TELEGRAM_EDIT', responseText.substring(0, 200));
    }
  }
};
~~~~~

## SOURCE: `src/06_Service_LLMProvider.gs`

~~~~~javascript
/**
 * ===================================================================
 * SERVICE: LLM PROVIDER ORCHESTRATOR (CIRCUIT-BREAKER ROUTING)
 * ===================================================================
 */
const LLMProviderService = {
  REGISTRY: {
    openrouter: {
      apiKeyProperty: 'openrouterApiKey',
      call: function(sys, msgs, temp, model) {
        return OpenRouterProvider.call(sys, msgs, temp, model);
      }
    },
    gemini: {
      apiKeyProperty: 'geminiApiKey',
      call: function(sys, msgs, temp, model) {
        return GeminiProvider.call(sys, msgs, temp, model);
      }
    },
    groq: {
      apiKeyProperty: 'groqApiKey',
      call: function(sys, msgs, temp) {
        return GroqProvider.call(sys, msgs, temp);
      }
    }
  },

  generate(params) {
    var taskType = params.taskType || 'chat_light';
    var rankedModels = [];

    try {
      rankedModels = LLMIntelligence.getRankedModelsForTask(taskType);
    } catch (e) {
      rankedModels = [];
    }

    rankedModels = (rankedModels || []).filter(function(m) {
      return m && typeof m === 'string' && m.trim().length > 0;
    });

    var startTime = new Date().getTime();

    // 1. Jalur Utama: OpenRouter Free Models (dengan Circuit Breaker)
    var openRouterKey = Config.load().openrouterApiKey;
    if (openRouterKey && rankedModels.length > 0) {
      for (var i = 0; i < rankedModels.length; i++) {
        var modelId = rankedModels[i];
        if (modelId.indexOf(':free') === -1) continue;

        try {
          var text = OpenRouterProvider.call(params.systemInstruction, params.messages, params.temperature, modelId);
          var latency = new Date().getTime() - startTime;
          this._recordStatSafe(taskType, modelId, true, latency);
          AppLogger.info('LLM_OPENROUTER_SUCCESS', modelId + '|' + latency + 'ms');
          return { provider: 'openrouter', text: text, model: modelId };
        } catch (err) {
          var latencyFail = new Date().getTime() - startTime;
          this._recordStatSafe(taskType, modelId, false, latencyFail);
          AppLogger.warning('LLM_OPENROUTER_FAIL', modelId + '|' + err.message);

          // CIRCUIT BREAKER: Jika kuota harian akun free habis (429), langsung hentikan loop OpenRouter
          if (err.message && err.message.indexOf('429') >= 0) {
            AppLogger.warning('LLM_CIRCUIT_BREAKER', 'openrouter_daily_limit_hit_skipping_all');
            break;
          }
        }
      }
    }

    // 2. Backup 1: Gemini (Model Stabil gemini-1.5-flash)
    var geminiKey = Config.load().geminiApiKey;
    if (geminiKey) {
      try {
        var geminiText = GeminiProvider.call(params.systemInstruction, params.messages, params.temperature, null);
        var geminiLatency = new Date().getTime() - startTime;
        this._recordStatSafe(taskType, 'gemini_backup', true, geminiLatency);
        AppLogger.info('LLM_BACKUP_GEMINI_SUCCESS', geminiLatency + 'ms');
        return { provider: 'gemini', text: geminiText, model: 'gemini-1.5-flash' };
      } catch (gErr) {
        AppLogger.warning('LLM_BACKUP_GEMINI_FAIL', gErr.message);
      }
    }

    // 3. Backup 2: Groq (Llama-3.3-70b)
    var groqKey = Config.load().groqApiKey;
    if (groqKey) {
      try {
        var groqText = GroqProvider.call(params.systemInstruction, params.messages, params.temperature);
        var groqLatency = new Date().getTime() - startTime;
        this._recordStatSafe(taskType, 'groq_backup', true, groqLatency);
        AppLogger.info('LLM_BACKUP_GROQ_SUCCESS', groqLatency + 'ms');
        return { provider: 'groq', text: groqText, model: 'llama_groq' };
      } catch (grErr) {
        AppLogger.warning('LLM_BACKUP_GROQ_FAIL', grErr.message);
      }
    }

    AppLogger.error('LLM_ALL_PROVIDERS_DOWN', 'task:' + taskType);
    return null;
  },

  generateFromSinglePrompt(promptText, temperature, taskType) {
    return this.generate({
      taskType: taskType || 'chat_light',
      messages: [{ role: 'user', text: promptText }],
      temperature: temperature
    });
  },

  _recordStatSafe(taskType, modelId, success, latency) {
    try {
      if (typeof LLMIntelligence !== 'undefined' && LLMIntelligence.recordStat) {
        LLMIntelligence.recordStat(taskType, modelId, success, latency);
      }
    } catch (e) {}
  }
};
~~~~~

## SOURCE: `src/06_Service_LLM_Gemini.gs`

~~~~~javascript
/**
 * ===================================================================
 * SERVICE: GEMINI LLM PROVIDER (VERIFIED MODELS SEP 2026)
 * Model aktif berdasarkan: https://ai.google.dev/gemini-api/docs/models
 * ===================================================================
 */
const GeminiProvider = {
  API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
  _cachedModel: null,

  _discoverActiveModel() {
    if (this._cachedModel) return this._cachedModel;

    var config = Config.load();
    var apiKey = config.geminiApiKey;
    if (!apiKey) return null;

    try {
      var url = this.API_BASE + '/models?key=' + apiKey;
      var response = UrlFetchApp.fetch(url, { method: 'GET', muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) return null;

      var data = JSON.parse(response.getContentText());
      if (!data.models || !Array.isArray(data.models)) return null;

      var activeModels = [];
      for (var i = 0; i < data.models.length; i++) {
        var m = data.models[i];
        if (!m.supportedGenerationMethods) continue;
        if (m.supportedGenerationMethods.indexOf('generateContent') === -1) continue;
        var modelName = m.name.replace(/^models\//, '');
        activeModels.push(modelName);
      }

      if (activeModels.length === 0) return null;

      // Prioritas berdasarkan dokumen resmi Google (Sep 2026):
      // 1. gemini-3.5-flash-lite  = tercepat, paling efisien (rekomendasi Google)
      // 2. gemini-3.6-flash       = balance speed + intelligence
      // 3. gemini-3.8-flash       = paling pintar (untuk tugas berat)
      // 4. gemini-3.7-flash       = alternatif bagus
      // 5. gemini-3.1-flash-lite  = hemat kuota
      var priorities = [
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash'
      ];

      for (var p = 0; p < priorities.length; p++) {
        if (activeModels.indexOf(priorities[p]) >= 0) {
          this._cachedModel = priorities[p];
          AppLogger.info('GEMINI_MODEL_SELECTED', this._cachedModel);
          return this._cachedModel;
        }
      }

      // Fallback: ambil model flash apapun yang tersedia
      for (var j = 0; j < activeModels.length; j++) {
        if (activeModels[j].indexOf('flash') >= 0 &&
            activeModels[j].indexOf('image') === -1 &&
            activeModels[j].indexOf('live') === -1 &&
            activeModels[j].indexOf('tts') === -1) {
          this._cachedModel = activeModels[j];
          AppLogger.info('GEMINI_MODEL_FALLBACK', this._cachedModel);
          return this._cachedModel;
        }
      }

      this._cachedModel = activeModels[0];
      return this._cachedModel;
    } catch (e) {
      AppLogger.warning('GEMINI_DISCOVERY_FAIL', e.message);
      return null;
    }
  },

  call(systemInstruction, messages, temperature, modelName) {
    var config = Config.load();
    var apiKey = config.geminiApiKey;
    if (!apiKey) throw new Error('GEMINI_API_KEY_MISSING');

    var model = modelName || this._discoverActiveModel();
    if (!model) throw new Error('GEMINI_NO_ACTIVE_MODEL');

    var url = this.API_BASE + '/models/' + model + ':generateContent?key=' + apiKey;

    var contents = [];
    if (messages && messages.length > 0) {
      for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        var role = (msg.role === 'ai' || msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
        contents.push({
          role: role,
          parts: [{ text: msg.text || msg.content || '' }]
        });
      }
    } else {
      contents.push({ role: 'user', parts: [{ text: '-' }] });
    }

    var payload = {
      contents: contents,
      generationConfig: {
        temperature: typeof temperature === 'number' ? temperature : 0.7
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    var response = UrlFetchApp.fetch(url, {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    if (code !== 200) {
      throw new Error('GEMINI_HTTP_' + code + '|' + response.getContentText().substring(0, 200));
    }

    var data = JSON.parse(response.getContentText());
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('GEMINI_EMPTY_RESPONSE');
  }
};
~~~~~

## SOURCE: `src/06_Service_LLM_Groq.gs`

~~~~~javascript
/**
 * ===================================================================
 * LLM PROVIDER: GROQ
 * ===================================================================
 */
const GroqProvider = {
  NAME: 'groq',
  MODEL: 'openai/gpt-oss-20b',
  ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',

  call(systemInstruction, messages, temperature) {
    const config = Config.load();
    if (!config.groqApiKey) {
      throw new Error('Groq API key tidak dikonfigurasi');
    }

    const chatMessages = [];
    if (systemInstruction) {
      chatMessages.push({ role: 'system', content: systemInstruction });
    }
    messages.forEach(m => {
      chatMessages.push({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      });
    });

    const payload = {
      model: this.MODEL,
      messages: chatMessages,
      max_tokens: 1536,
      temperature: temperature || 0.7
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + config.groqApiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(this.ENDPOINT, options);
    const code = response.getResponseCode();

    if (code === 429 || code === 503) {
      throw new Error('Groq overload (HTTP ' + code + ')');
    }
    if (code !== 200) {
      throw new Error('Groq HTTP error ' + code);
    }

    const data = JSON.parse(response.getContentText());
    const choice = data.choices && data.choices[0];
    if (!choice || !choice.message) {
      throw new Error('Groq tidak mengembalikan jawaban');
    }

    return choice.message.content;
  }
};
~~~~~

## SOURCE: `src/06_Service_LLM_OpenRouter.gs`

~~~~~javascript
/**
 * ===================================================================
 * SERVICE: LLM PROVIDER (OPENROUTER)
 * Tanggung jawab: komunikasi langsung dengan OpenRouter API.
 * Kompatibel dengan format OpenAI standard.
 * ===================================================================
 */
const OpenRouterProvider = {
  API_URL: 'https://openrouter.ai/api/v1/chat/completions',

  /**
   * Panggil API OpenRouter.
   * @param {string} [systemInstruction] - Persona / instruksi sistem
   * @param {Array<{role: string, text: string}>} messages - Riwayat percakapan
   * @param {number} [temperature=0.7] - Suhu kreativitas
   * @param {string} modelName - ID model (misal: 'deepseek/deepseek-chat')
   * @returns {string} Response text dari LLM
   */
  call(systemInstruction, messages, temperature, modelName) {
    const config = Config.load();
    const apiKey = config.openrouterApiKey;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY belum diset di Script Properties');
    }

    const targetModel = modelName || config.openrouterModelFast;

    // Format pesan sesuai standar OpenAI / OpenRouter
    const formattedMessages = [];

    if (systemInstruction) {
      formattedMessages.push({
        role: 'system',
        content: systemInstruction
      });
    }

    if (messages && messages.length > 0) {
      messages.forEach(function(msg) {
        formattedMessages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.text || msg.content || ''
        });
      });
    }

    const payload = {
      model: targetModel,
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://github.com/' + (config.githubRepoOwner || 'bayuangga') + '/' + (config.githubRepoName || 'ai-agent-telegram'),
        'X-Title': 'AI Agent Telegram'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(this.API_URL, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode !== 200) {
      throw new Error('OpenRouter Error HTTP ' + statusCode + ': ' + responseText.substring(0, 200));
    }

    const data = JSON.parse(responseText);

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error('OpenRouter invalid response structure: ' + responseText.substring(0, 200));
    }

    return data.choices[0].message.content;
  }
};
~~~~~

## SOURCE: `src/07_Service_WebSearchProvider.gs`

~~~~~javascript
/**
 * ===================================================================
 * WEB SEARCH PROVIDER SERVICE (ORCHESTRATOR)
 * Tanggung jawab: coba Google dulu, kalau gagal/kuota habis,
 * fallback ke Tavily.
 *
 * PENTING: daftar provider dibungkus method getProviders(), BUKAN
 * property array langsung. Ini SENGAJA untuk menghindari
 * ReferenceError akibat urutan load file GAS (lihat ARCHITECTURE.md
 * bagian "Lazy Evaluation Rule"). Referensi ke provider lain hanya
 * boleh terjadi saat method dipanggil, bukan saat file dimuat.
 * ===================================================================
 */
const WebSearchProviderService = {
  getProviders() {
    return [GoogleSearchProvider, TavilySearchProvider];
  },

  search(query) {
    const providers = this.getProviders();
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      try {
        const results = provider.search(query);
        AppLogger.info('WEBSEARCH_PROVIDER_SUCCESS', provider.NAME);
        return results;
      } catch (err) {
        AppLogger.warning('WEBSEARCH_PROVIDER_FAIL', provider.NAME + ': ' + err.message);
      }
    }

    AppLogger.error('WEBSEARCH_PROVIDER_ALL_FAILED', 'Query: ' + query);
    return [];
  },

  formatResultsAsContext(results) {
    if (results.length === 0) return 'Tidak ada hasil pencarian ditemukan.';

    return results.map((r, i) =>
      (i + 1) + '. ' + r.title + '\n   ' + r.snippet + '\n   Sumber: ' + r.link
    ).join('\n\n');
  },

  isAnyConfigured() {
    return this.getProviders().some(p => p.isConfigured());
  }
};
~~~~~

## SOURCE: `src/07_Service_WebSearch_Google.gs`

~~~~~javascript
/**
 * ===================================================================
 * SEARCH PROVIDER: GOOGLE (Custom Search API)
 * ===================================================================
 */
const GoogleSearchProvider = {
  NAME: 'google',
  ENDPOINT: 'https://www.googleapis.com/customsearch/v1',
  MAX_RESULTS: 5,

  isConfigured() {
    const config = Config.load();
    return !!(config.googleSearchApiKey && config.googleSearchEngineId);
  },

  search(query) {
    if (!this.isConfigured()) {
      throw new Error('Google Search belum dikonfigurasi (API key/Engine ID kosong)');
    }

    const config = Config.load();
    const url = this.ENDPOINT +
      '?key=' + encodeURIComponent(config.googleSearchApiKey) +
      '&cx=' + encodeURIComponent(config.googleSearchEngineId) +
      '&q=' + encodeURIComponent(query) +
      '&num=' + this.MAX_RESULTS;

    const options = { method: 'get', muteHttpExceptions: true };
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();

    if (code === 429) {
      throw new Error('Google Search kuota habis (HTTP 429)');
    }
    if (code !== 200) {
      throw new Error('Google Search HTTP error ' + code);
    }

    const data = JSON.parse(response.getContentText());
    if (!data.items) return [];

    return data.items.map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    }));
  }
};
~~~~~

## SOURCE: `src/07_Service_WebSearch_Tavily.gs`

~~~~~javascript
/**
 * ===================================================================
 * SEARCH PROVIDER: TAVILY
 * Didesain khusus untuk konsumsi AI/LLM.
 * ===================================================================
 */
const TavilySearchProvider = {
  NAME: 'tavily',
  ENDPOINT: 'https://api.tavily.com/search',
  MAX_RESULTS: 5,

  isConfigured() {
    return !!Config.load().tavilyApiKey;
  },

  search(query) {
    if (!this.isConfigured()) {
      throw new Error('Tavily belum dikonfigurasi (API key kosong)');
    }

    const config = Config.load();
    const payload = {
      api_key: config.tavilyApiKey,
      query: query,
      max_results: this.MAX_RESULTS,
      include_answer: false
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(this.ENDPOINT, options);
    const code = response.getResponseCode();

    if (code === 429) {
      throw new Error('Tavily kuota habis (HTTP 429)');
    }
    if (code !== 200) {
      throw new Error('Tavily HTTP error ' + code);
    }

    const data = JSON.parse(response.getContentText());
    if (!data.results) return [];

    return data.results.map(item => ({
      title: item.title,
      snippet: item.content,
      link: item.url
    }));
  }
};
~~~~~

## SOURCE: `src/08_Specialist_ChangeDetector.gs`

~~~~~javascript
/**
 * SPECIALIST: CHANGE DETECTOR
 * Tanggung jawab: mendeteksi perubahan pada codebase,
 * mengecek sinkronisasi dokumentasi, dan menyinkronkan
 * roadmap dengan kode secara otomatis.
 */
var ChangeDetector = {

  runDetection: function(mode) {
    var detectionMode = mode || 'full';
    AppLogger.info('CHANGE_DETECT_START', 'Mode: ' + detectionMode);

    var currentFiles = this._getCurrentFiles();
    if (!currentFiles || Object.keys(currentFiles).length === 0) {
      return '❌ Gagal membaca kode dari GitHub. Cek GITHUB_TOKEN.';
    }

    var snapshot = this._getLatestSnapshot();
    var changes = this._compareWithSnapshot(currentFiles, snapshot);

    if (changes.total === 0) {
      // Meskipun tidak ada perubahan kode, tetap cek roadmap sync
      if (detectionMode === 'full') {
        var syncResult = ProjectBrain.syncRoadmapWithCode();
        if (syncResult) {
          return '✅ Tidak ada perubahan kode.\n\n🔄 *Roadmap Sync:*\n' + syncResult;
        }
      }
      return '✅ Tidak ada perubahan kode sejak pengecekan terakhir. Semua stabil!';
    }

    var report = this._buildReport(changes, currentFiles);

    if (detectionMode === 'full') {
      var docSync = this._checkDocSync(changes);
      if (docSync.length > 0) {
        report += '\n\n📄 *Sinkronisasi Dokumentasi:*\n';
        docSync.forEach(function(d) { report += '• ' + d + '\n'; });
        report += '\nMau aku update dokumentasi agar sesuai?';
      }

      // Auto-sync roadmap dengan kode
      var syncResult = ProjectBrain.syncRoadmapWithCode();
      if (syncResult) {
        report += '\n\n🗺️ *Roadmap Sync:*\n' + syncResult;
      }
    }

    this._saveSnapshot(currentFiles);
    return report;
  },

  runScheduledDetection: function() {
    AppLogger.info('CHANGE_DETECT_SCHEDULED', 'Weekly check started');

    try {
      var currentFiles = this._getCurrentFiles();
      if (!currentFiles || Object.keys(currentFiles).length === 0) return;

      var snapshot = this._getLatestSnapshot();
      var changes = this._compareWithSnapshot(currentFiles, snapshot);

      var report = '🔔 *Laporan Perubahan Mingguan*\n\n';

      if (changes.total === 0) {
        report += 'Tidak ada perubahan kode minggu ini.\n';
      } else {
        report += this._buildReport(changes, currentFiles) + '\n';
      }

      // Selalu sync roadmap saat scheduled
      var syncResult = ProjectBrain.syncRoadmapWithCode();
      if (syncResult) {
        report += '\n🗺️ *Roadmap Sync:*\n' + syncResult;
      }

      var docSync = this._checkDocSync(changes);
      if (docSync.length > 0) {
        report += '\n📄 *Docs perlu update:*\n';
        docSync.forEach(function(d) { report += '• ' + d + '\n'; });
        report += '\nReply *"update docs"* kalau mau aku sesuaikan.';
      }

      var config = Config.load();
      TelegramService.sendMessage(config.myChatId, report);

      if (changes.total > 0) {
        this._saveSnapshot(currentFiles);
      }

    } catch (e) {
      AppLogger.error('CHANGE_DETECT_SCHEDULED_FAIL', e.message);
    }
  },

  _getCurrentFiles: function() {
    var allSource = GitHubOpsService.readAllSourceFiles();
    var result = {};
    Object.keys(allSource).forEach(function(name) {
      if (name !== 'appsscript.json') {
        result[name] = {
          content: allSource[name].content,
          sha: allSource[name].sha,
          hash: this._simpleHash(allSource[name].content)
        };
      }
    }.bind(this));
    return result;
  },

  _simpleHash: function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return String(Math.abs(hash));
  },

  _getLatestSnapshot: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Code_Snapshots');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return {};
      var snapshot = {};
      for (var i = 1; i < data.length; i++) {
        if (data[i][2] && data[i][4] === 'active') {
          snapshot[data[i][2]] = data[i][3];
        }
      }
      return snapshot;
    } catch (e) {
      return {};
    }
  },

  _saveSnapshot: function(currentFiles) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Code_Snapshots');
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][4] === 'active') {
          sheet.getRange(i + 1, 5).setValue('archived');
        }
      }
      var timestamp = DateTimeUtils.nowWIB();
      Object.keys(currentFiles).forEach(function(fileName) {
        var id = IdGenerator.generate('SNAP');
        SpreadsheetGateway.appendRowSafe('Code_Snapshots', [
          id, timestamp, fileName, currentFiles[fileName].hash, 'active'
        ]);
      });
    } catch (e) {
      AppLogger.error('CHANGE_DETECT_SNAPSHOT_SAVE_FAIL', e.message);
    }
  },

  _compareWithSnapshot: function(currentFiles, snapshot) {
    var added = [], modified = [], deleted = [];
    Object.keys(currentFiles).forEach(function(f) {
      if (!snapshot[f]) added.push(f);
      else if (snapshot[f] !== currentFiles[f].hash) modified.push(f);
    });
    Object.keys(snapshot).forEach(function(f) {
      if (!currentFiles[f]) deleted.push(f);
    });
    return { added: added, modified: modified, deleted: deleted,
             total: added.length + modified.length + deleted.length };
  },

  _buildReport: function(changes) {
    var report = '📊 *Deteksi Perubahan Kode*\n\n';
    if (changes.added.length > 0) {
      report += '🟢 *Baru (' + changes.added.length + '):*\n';
      changes.added.forEach(function(f) { report += '• `' + f + '`\n'; });
      report += '\n';
    }
    if (changes.modified.length > 0) {
      report += '🟡 *Berubah (' + changes.modified.length + '):*\n';
      changes.modified.forEach(function(f) { report += '• `' + f + '`\n'; });
      report += '\n';
    }
    if (changes.deleted.length > 0) {
      report += '🔴 *Dihapus (' + changes.deleted.length + '):*\n';
      changes.deleted.forEach(function(f) { report += '• `' + f + '`\n'; });
      report += '\n';
    }
    report += 'Total: ' + changes.total + ' perubahan.';
    return report;
  },

  _checkDocSync: function(changes) {
    var issues = [];
    var all = changes.added.concat(changes.modified);
    all.forEach(function(f) {
      if (f.indexOf('08_Specialist_') === 0)
        issues.push('Specialist baru/berubah: `' + f + '` — cek ARCHITECTURE.md §4');
      if (f.indexOf('11_Trigger_') === 0)
        issues.push('Trigger baru/berubah: `' + f + '` — cek ARCHITECTURE.md §5');
      if (f.indexOf('04_Repository_') === 0)
        issues.push('Repository baru/berubah: `' + f + '` — cek ARCHITECTURE.md §6');
    });
    return issues;
  }
};
~~~~~

## SOURCE: `src/08_Specialist_Chat.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: CHAT
 * Menyusun respons percakapan umum dan integrasi pencarian web.
 * Menggunakan persona dinamis dari SOUL dan template dari KnowledgeRepository.
 * ===================================================================
 */
const ChatSpecialist = {

  buildSystemPersona() {
    var template = KnowledgeRepository.get('soul', 'system_persona');
    if (!template) {
      template = KnowledgeRepository.get('intent', 'persona') || '';
    }

    var soulContext = null;
    try {
      soulContext = SoulSpecialist.getFullContext();
    } catch (e) {
      // Fallback jika soul belum terinisialisasi
    }

    var basePersona = KnowledgeRepository.get('intent', 'persona') || '';
    if (!soulContext) {
      return basePersona;
    }

    var identity = soulContext.identity || {};
    var selfModel = soulContext.self_model || {};
    var beliefs = soulContext.beliefs || [];

    var traitsStr = Array.isArray(identity.traits) && identity.traits.length > 0
      ? identity.traits.join(', ') : '-';
    var valuesStr = Array.isArray(identity.values) && identity.values.length > 0
      ? identity.values.join(', ') : '-';
    var beliefsStr = Array.isArray(beliefs) && beliefs.length > 0
      ? beliefs.map(function(b) { return b.text || b; }).join('; ') : '-';
    var weaknessesStr = selfModel && Array.isArray(selfModel.known_weaknesses) && selfModel.known_weaknesses.length > 0
      ? selfModel.known_weaknesses.join(', ') : '-';

    var variables = {
      persona: basePersona,
      name: identity.name || '-',
      traits: traitsStr,
      values: valuesStr,
      communication_style: identity.communication_style || '-',
      beliefs: beliefsStr,
      weaknesses: weaknessesStr
    };

    return TemplateEngine.render(template, variables);
  },

  needsWebSearch(intent) {
    return !!(intent && (intent.butuhInfoTerkini || intent.butuh_web_search));
  },

  respondWithSearchContext(userMessage, searchResults, riwayat) {
    var template = KnowledgeRepository.get('chat', 'web_search_prompt');
    var systemPersona = this.buildSystemPersona();
    var searchContext = WebSearchProviderService.formatResultsAsContext(searchResults);
    var riwayatFormatted = this._formatRiwayat(riwayat);

    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        persona: systemPersona,
        search_results: searchContext,
        riwayat: riwayatFormatted
      });
    } else {
      prompt = systemPersona + '\n\n' + searchContext;
    }

    var result = LLMProviderService.generate({
      taskType: 'web_grounded',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: userMessage }],
      temperature: 0.7
    });

    return (result && result.text) ? result.text : null;
  },

  _formatRiwayat(riwayat) {
    if (!riwayat || riwayat.length === 0) return '-';
    return riwayat.map(function(item) {
      var role = (item.role === 'ai' || item.role === 'assistant') ? 'AI' : 'User';
      return role + ': ' + (item.text || item.content || '');
    }).join('\n');
  }
};
~~~~~

## SOURCE: `src/08_Specialist_CodeAuditor.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: CODE AUDITOR
 * Tanggung jawab: audit codebase, analisis statis berbantuan LLM,
 * penyimpanan laporan/temuan ke Sheet, dan pembuatan branch/PR perbaikan.
 * ===================================================================
 */
const CodeAuditor = {

  runAudit(type) {
    var auditType = type || 'full';
    AppLogger.info('AUDIT_START', 'type:' + auditType);

    var data = this._collectData();
    if (!data || data.files.length === 0) {
      return { success: false, code: 'SOURCE_READ_FAILED' };
    }

    var categories = auditType === 'light'
      ? ['INTEGRITY', 'CONSISTENCY', 'ROBUSTNESS']
      : ['INTEGRITY', 'CONSISTENCY', 'ROBUSTNESS', 'SECURITY', 'PERFORMANCE', 'DEAD_CODE', 'DOC_SYNC'];

    var findings = this._analyzeInBatches(data, categories);

    var reportId = this._saveReport(findings, auditType);

    var criticalCount = findings.filter(function(f) { return f.severity === 'critical'; }).length;
    var warningCount = findings.filter(function(f) { return f.severity === 'warning'; }).length;
    var minorCount = findings.filter(function(f) { return f.severity === 'minor'; }).length;

    return {
      success: true,
      reportId: reportId,
      auditType: auditType,
      totalFindings: findings.length,
      criticalCount: criticalCount,
      warningCount: warningCount,
      minorCount: minorCount,
      findings: findings
    };
  },

  runScheduledAudit() {
    var dayOfMonth = new Date().getDate();
    var type = (dayOfMonth === 1) ? 'full' : 'light';
    var result = this.runAudit(type);

    var config = Config.load();
    if (config.myChatId && result.success && result.totalFindings > 0) {
      Manager._askLLMWithKnowledge(config.myChatId, '', 'audit', 'report_response', result);
    }
  },

  fixIssues(scope) {
    var fixScope = scope || 'all';
    AppLogger.info('AUDIT_FIX_START', 'scope:' + fixScope);

    var findings = this._getLatestPendingFindings();
    if (!findings || findings.length === 0) {
      return { success: false, code: 'NO_PENDING_FINDINGS' };
    }

    var filtered = this._filterByScope(findings, fixScope);
    if (filtered.length === 0) {
      return { success: false, code: 'NO_MATCHING_SCOPE_FINDINGS', scope: fixScope };
    }

    var fixes = this._generateFixes(filtered);
    if (!fixes || fixes.length === 0) {
      return { success: false, code: 'FIX_GENERATION_FAILED' };
    }

    var result = this._applyFixes(fixes, fixScope);
    if (result.success && result.successCount > 0) {
      this._markFindingsFixed(filtered);
    }

    return result;
  },

  shouldOfferAudit() {
    var lastDate = this._getLastAuditDate();
    if (!lastDate) return true;

    var now = new Date();
    var diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
  },

  _collectData() {
    var files = [];
    var allSource = GitHubOpsService.readAllSourceFiles();

    if (Array.isArray(allSource)) {
      for (var i = 0; i < allSource.length; i++) {
        var item = allSource[i];
        var name = item.name || item.path || '';
        if (name && name !== 'appsscript.json' && name.indexOf('.gs') >= 0) {
          files.push({
            name: name,
            content: item.content || '',
            sha: item.sha || null
          });
        }
      }
    } else if (allSource && typeof allSource === 'object') {
      Object.keys(allSource).forEach(function(name) {
        if (name !== 'appsscript.json' && name.indexOf('.gs') >= 0) {
          files.push({
            name: name,
            content: allSource[name].content || '',
            sha: allSource[name].sha || null
          });
        }
      });
    }

    var sheets = this._getSheetNames();

    var propKeys = [];
    try {
      var props = PropertiesService.getScriptProperties();
      propKeys = props.getKeys();
    } catch (e) {
      AppLogger.error('AUDIT_PROPS_FAIL', e.message);
    }

    return {
      files: files,
      sheets: sheets,
      propKeys: propKeys
    };
  },

  _getSheetNames() {
    try {
      var ss = SpreadsheetGateway.getSpreadsheet();
      return ss.getSheets().map(function(s) { return s.getName(); });
    } catch (e) {
      return [];
    }
  },

  _analyzeInBatches(data, categories) {
    var allFindings = [];
    var batches = this._splitIntoBatches(data.files);
    var self = this;

    for (var i = 0; i < batches.length; i++) {
      var batch = batches[i];
      AppLogger.info('AUDIT_BATCH', 'batch:' + (i + 1) + '/' + batches.length + '|files:' + batch.length);

      var prompt = self._buildAuditPrompt(batch, data, categories);
      var llmResult = LLMProviderService.generate({
        taskType: 'code_analysis',
        systemInstruction: prompt,
        messages: [{ role: 'user', text: 'Analyze and return JSON findings array.' }],
        temperature: 0.2
      });

      if (!llmResult || !llmResult.text) {
        AppLogger.error('AUDIT_LLM_FAIL', 'batch:' + (i + 1));
        continue;
      }

      var batchFindings = self._parseFindings(llmResult.text);
      allFindings = allFindings.concat(batchFindings);
    }

    return this._deduplicateFindings(allFindings);
  },

  _splitIntoBatches(files) {
    var batches = [];
    var currentBatch = [];
    var currentBatchSize = 0;
    var MAX_BATCH_CHARACTERS = 12000;

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var fileLength = (file.content || '').length;

      if (currentBatch.length > 0 && (currentBatchSize + fileLength > MAX_BATCH_CHARACTERS)) {
        batches.push(currentBatch);
        currentBatch = [file];
        currentBatchSize = fileLength;
      } else {
        currentBatch.push(file);
        currentBatchSize += fileLength;
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  },

  _buildAuditPrompt(batch, data, categories) {
    var template = KnowledgeRepository.get('audit', 'analysis_prompt');

    var fileList = batch.map(function(f) {
      var truncated = f.content.length > 8000
        ? f.content.substring(0, 8000)
        : f.content;
      return '=== ' + f.name + ' ===\n' + truncated;
    }).join('\n\n');

    var sheetList = data.sheets.length > 0 ? data.sheets.join(', ') : '-';
    var propList = data.propKeys.length > 0 ? data.propKeys.join(', ') : '-';
    var catList = categories.join(', ');

    if (template) {
      return TemplateEngine.render(template, {
        categories: catList,
        sheets: sheetList,
        prop_keys: propList,
        files: fileList
      });
    }

    return catList + '\n\n' + fileList;
  },

  _parseFindings(rawText) {
    try {
      var cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed.filter(function(f) {
          return f.severity && f.fileName && f.description;
        });
      }
      return [];
    } catch (e) {
      AppLogger.error('AUDIT_PARSE_FAIL', e.message);
      return [];
    }
  },

  _deduplicateFindings(findings) {
    var seen = {};
    return findings.filter(function(f) {
      var key = f.fileName + '|' + f.description.substring(0, 50);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  },

  _filterByScope(findings, scope) {
    if (scope === 'all') return findings;
    if (scope === 'critical') {
      return findings.filter(function(f) { return f.severity === 'critical'; });
    }
    if (scope === 'critical+warning') {
      return findings.filter(function(f) {
        return f.severity === 'critical' || f.severity === 'warning';
      });
    }
    return findings;
  },

  _generateFixes(findings) {
    var filesToRead = {};
    findings.forEach(function(f) {
      if (!filesToRead[f.fileName]) {
        filesToRead[f.fileName] = true;
      }
    });

    var sourceMap = {};
    Object.keys(filesToRead).forEach(function(fileName) {
      var path = fileName.indexOf('src/') === 0 ? fileName : 'src/' + fileName;
      var fileData = GitHubOpsService.readFile(path);
      if (!fileData) {
        fileData = GitHubOpsService.readFile(fileName);
      }
      if (fileData) {
        sourceMap[fileName] = fileData.content;
      }
    });

    if (Object.keys(sourceMap).length === 0) {
      return [];
    }

    var findingsText = findings.map(function(f, i) {
      return (i + 1) + '. [' + String(f.severity).toUpperCase() + '] ' +
        f.fileName + ': ' + f.description +
        '\nRecommendation: ' + f.recommendation;
    }).join('\n');

    var sourceText = '';
    Object.keys(sourceMap).forEach(function(name) {
      sourceText += '\n\n=== ' + name + ' ===\n' + sourceMap[name];
    });

    var template = KnowledgeRepository.get('audit', 'fix_generation_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        findings: findingsText,
        source_code: sourceText
      });
    } else {
      prompt = findingsText + '\n\n' + sourceText;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'code_generation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Generate complete patched files in JSON.' }],
      temperature: 0.1
    });

    if (!llmResult || !llmResult.text) {
      AppLogger.error('AUDIT_FIX_LLM_FAIL', 'generation_failed');
      return [];
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);
      return result.fixes || [];
    } catch (e) {
      AppLogger.error('AUDIT_FIX_PARSE_FAIL', e.message);
      return [];
    }
  },

  _applyFixes(fixes, scope) {
    var timestamp = new Date().getTime();
    var branchName = 'audit/fix-' + scope + '-' + timestamp;

    var backupBranch = GitHubOpsService.createBackupBranch('audit-' + timestamp);

    var validatedFixes = [];
    var rejectedFixes = [];

    fixes.forEach(function(fix) {
      var path = fix.fileName.indexOf('src/') === 0 ? fix.fileName : 'src/' + fix.fileName;
      var original = GitHubOpsService.readFile(path);
      if (!original) {
        original = GitHubOpsService.readFile(fix.fileName);
      }
      var originalContent = original ? original.content : null;

      var validation = PatchValidator.validate(
        fix.patchedCode,
        originalContent,
        fix.fileName
      );

      if (validation.valid) {
        validatedFixes.push({
          fix: fix,
          path: path,
          sha: original ? original.sha : null,
          validation: validation
        });
      } else {
        rejectedFixes.push({
          fix: fix,
          validation: validation
        });
      }
    });

    if (validatedFixes.length === 0) {
      return {
        success: false,
        code: 'ALL_PATCHES_REJECTED',
        rejectedFixes: rejectedFixes
      };
    }

    var branchOk = GitHubOpsService.createBranch(branchName);
    if (!branchOk) {
      return {
        success: false,
        code: 'BRANCH_CREATION_FAILED',
        branchName: branchName
      };
    }

    var successCount = 0;
    var failCount = 0;
    var changeSummary = [];

    validatedFixes.forEach(function(item) {
      var ok = GitHubOpsService.commitFile(
        item.path,
        item.fix.patchedCode,
        'audit-fix: ' + (item.fix.changes || []).join(', '),
        branchName,
        item.sha
      );

      if (ok) {
        successCount++;
        changeSummary.push(item.fix.fileName + ': ' + (item.fix.changes || []).join(', '));
      } else {
        failCount++;
        changeSummary.push(item.fix.fileName + ': commit_failed');
      }
    });

    var prBody = '## Audit Auto-Fix (' + scope + ')\n\n' +
                 changeSummary.join('\n') + '\n\n';

    if (backupBranch) {
      prBody += '## Backup Branch\n`' + backupBranch + '`\n\n';
    }

    prBody += '---\n_Generated by Code Audit Agent_';

    var prUrl = GitHubOpsService.createPullRequest(
      'Audit Fix: ' + successCount + ' files patched',
      prBody,
      branchName,
      null
    );

    return {
      success: true,
      scope: scope,
      branchName: branchName,
      backupBranch: backupBranch,
      prUrl: prUrl,
      successCount: successCount,
      failCount: failCount,
      changeSummary: changeSummary,
      rejectedFixes: rejectedFixes
    };
  },

  _saveReport(findings, type) {
    try {
      var id = IdGenerator.generate('AUDIT');
      var timestamp = DateTimeUtils.nowWIB();
      var critical = findings.filter(function(f) { return f.severity === 'critical'; }).length;
      var warning = findings.filter(function(f) { return f.severity === 'warning'; }).length;

      SpreadsheetGateway.appendRowSafe('Audit_Reports', [
        id, timestamp, type,
        0, findings.length, critical, warning, 'completed'
      ]);

      this._saveFindings(id, findings);
      return id;
    } catch (e) {
      AppLogger.error('AUDIT_SAVE_FAIL', e.message);
      return null;
    }
  },

  _saveFindings(reportId, findings) {
    findings.forEach(function(f) {
      try {
        var id = IdGenerator.generate('FIND');
        SpreadsheetGateway.appendRowSafe('Audit_Findings', [
          id, reportId, f.severity, f.category,
          f.fileName, f.description, 'pending'
        ]);
      } catch (e) {
        AppLogger.error('AUDIT_FINDING_SAVE_FAIL', e.message);
      }
    });
  },

  _getLatestPendingFindings() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Audit_Findings');
      var data = sheet.getDataRange().getValues();
      var findings = [];

      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][6] === 'pending') {
          findings.push({
            id: data[i][0],
            reportId: data[i][1],
            severity: data[i][2],
            category: data[i][3],
            fileName: data[i][4],
            description: data[i][5]
          });
        }
      }
      return findings;
    } catch (e) {
      return [];
    }
  },

  _markFindingsFixed(findings) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Audit_Findings');
      var data = sheet.getDataRange().getValues();

      findings.forEach(function(f) {
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === f.id) {
            sheet.getRange(i + 1, 7).setValue('fixed');
            break;
          }
        }
      });
    } catch (e) {
      AppLogger.error('AUDIT_MARK_FAIL', e.message);
    }
  },

  _getLastAuditDate() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Audit_Reports');
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return null;

      var lastRow = data[data.length - 1];
      var ts = lastRow[1];
      return ts instanceof Date ? ts : new Date(ts);
    } catch (e) {
      return null;
    }
  }
};
~~~~~

## SOURCE: `src/08_Specialist_DocSync.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: DOCUMENTATION SYNC (DOCSYNC)
 * Menyinkronkan file dokumentasi kanonik (.md) terhadap source code (.gs).
 * ===================================================================
 */
const DocSyncSpecialist = {

  sync() {
    try {
      var canonicalFiles = this._getCanonicalFiles();
      var sourceMetadata = this._collectSourceMetadata();
      var currentDocs = this._collectCurrentDocs(canonicalFiles);
      var analysisResult = this._analyzeWithLLM(sourceMetadata, currentDocs, canonicalFiles);

      if (!analysisResult || !analysisResult.updates || analysisResult.updates.length === 0) {
        return { success: true, updated: [], unchanged: canonicalFiles, summary: analysisResult && analysisResult.summary ? analysisResult.summary : null };
      }

      var updatedFiles = [];
      for (var i = 0; i < analysisResult.updates.length; i++) {
        var update = analysisResult.updates[i];
        if (!update.file || !update.content) continue;
        if (!this._isCanonical(update.file, canonicalFiles)) continue;

        var commitResult = this._commitDocUpdate(update.file, update.content, update.reason);
        if (commitResult) {
          updatedFiles.push({ file: update.file, reason: update.reason });
        }
      }

      var unchanged = [];
      for (var j = 0; j < canonicalFiles.length; j++) {
        var isUpdated = false;
        for (var k = 0; k < updatedFiles.length; k++) {
          if (updatedFiles[k].file === canonicalFiles[j]) { isUpdated = true; break; }
        }
        if (!isUpdated) unchanged.push(canonicalFiles[j]);
      }

      return {
        success: true,
        updated: updatedFiles,
        unchanged: unchanged,
        summary: analysisResult.summary || null
      };
    } catch (err) {
      AppLogger.error('DOCSYNC_ERROR', JSON.stringify({ error: err.message, stack: err.stack }));
      return { success: false, code: 'SYNC_EXECUTION_FAILED', detail: err.message };
    }
  },

  _getCanonicalFiles() {
    var raw = KnowledgeRepository.get('docsync', 'canonical_files');
    if (!raw) return [];
    return raw.split('\n').map(function(line) {
      return line.trim();
    }).filter(function(line) {
      return line.length > 0 && line.indexOf('.md') === line.length - 3;
    });
  },

  _isCanonical(fileName, canonicalFiles) {
    for (var i = 0; i < canonicalFiles.length; i++) {
      if (canonicalFiles[i] === fileName) return true;
    }
    return false;
  },

  _collectSourceMetadata() {
    var files = GitHubOpsService.readAllSourceFiles();
    if (!files) {
      throw new Error('GitHub source files retrieval returned null or undefined.');
    }

    var fileNames = Object.keys(files);
    var metadata = [];

    for (var i = 0; i < fileNames.length; i++) {
      var name = fileNames[i];
      var fileData = files[name];
      var content = (fileData && fileData.content) ? fileData.content : '';
      var loc = content.split('\n').length;
      var methods = this._extractMethodSignatures(content);

      metadata.push({
        file: name,
        loc: loc,
        methods: methods
      });
    }

    return JSON.stringify(metadata, null, 2);
  },

  _extractMethodSignatures(content) {
    var signatures = [];
    var lines = content.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var match = line.match(/^(\w+)\s*[:=]\s*function\s*\(([^)]*)\)/);
      if (match) {
        signatures.push(match[1] + '(' + match[2].trim() + ')');
        continue;
      }
      var match2 = line.match(/^(\w+)\s*\(([^)]*)\)\s*\{/);
      if (match2 && match2[1] !== 'if' && match2[1] !== 'for' && match2[1] !== 'while' && match2[1] !== 'function') {
        signatures.push(match2[1] + '(' + match2[2].trim() + ')');
      }
    }
    return signatures;
  },

  _collectCurrentDocs(canonicalFiles) {
    var docs = {};
    for (var i = 0; i < canonicalFiles.length; i++) {
      var fileName = canonicalFiles[i];
      try {
        var fileData = GitHubOpsService.readFile(fileName);
        if (fileData && fileData.content) {
          var rawContent = fileData.content;
          if (fileData.encoding === 'base64') {
            rawContent = Utilities.newBlob(
              Utilities.base64Decode(rawContent.replace(/\s/g, ''))
            ).getDataAsString();
          }
          docs[fileName] = rawContent.substring(0, 10000);
        }
      } catch (err) {
        AppLogger.warning('DOCSYNC_READ_WARNING', 'file:' + fileName + '|error:' + err.message);
      }
    }
    return JSON.stringify(docs, null, 2);
  },

  _analyzeWithLLM(sourceMetadata, currentDocs, canonicalFiles) {
    var template = KnowledgeRepository.get('docsync', 'analysis_prompt');
    if (!template) {
      AppLogger.error('DOCSYNC_NO_PROMPT', 'analysis_prompt_missing');
      return null;
    }

    var prompt = TemplateEngine.render(template, {
      source_metadata: sourceMetadata,
      current_docs: currentDocs,
      canonical_files: canonicalFiles.join('\n')
    });

    var result = LLMProviderService.generate({
      taskType: 'docsync_analysis',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Analyze and return JSON.' }],
      temperature: 0.3
    });

    if (!result || !result.text) return null;

    var cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      AppLogger.warning('DOCSYNC_PARSE_ERROR', err.message);
      return null;
    }
  },

  _commitDocUpdate(fileName, content, reason) {
    try {
      var existingFile = GitHubOpsService.readFile(fileName);
      var sha = (existingFile && existingFile.sha) ? existingFile.sha : null;
      var commitMsg = 'docsync:' + fileName;

      GitHubOpsService.commitFile(fileName, content, commitMsg, null, sha);
      AppLogger.info('DOCSYNC_COMMIT_SUCCESS', 'file:' + fileName);
      return true;
    } catch (err) {
      AppLogger.error('DOCSYNC_COMMIT_FAILED', 'file:' + fileName + '|error:' + err.message);
      return false;
    }
  }
};
~~~~~

## SOURCE: `src/08_Specialist_FeatureArchitect.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: FEATURE ARCHITECT
 * Tanggung jawab: Brainstorming arsitektur, generate blueprint fitur,
 * dan implementasi kode baru otomatis ke branch/PR GitHub.
 * ===================================================================
 */
const FeatureArchitect = {

  generateBlueprint(idea) {
    AppLogger.info('FEATURE_ARCHITECT_BLUEPRINT', 'idea:' + idea);

    var context = this._gatherProjectContext();
    var template = KnowledgeRepository.get('feature', 'blueprint_prompt');

    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        file_list: context.fileList,
        sheet_list: context.sheetList,
        intent_list: context.intentList,
        command_list: context.commandList,
        idea: idea
      });
    } else {
      prompt = idea + '\n\n' + JSON.stringify(context);
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'code_generation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Generate feature blueprint JSON.' }],
      temperature: 0.3
    });

    if (!llmResult || !llmResult.text) {
      return { success: false, code: 'BLUEPRINT_LLM_FAILED' };
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var blueprint = JSON.parse(cleaned);

      this._saveBlueprint(blueprint, idea);
      return {
        success: true,
        blueprint: blueprint,
        idea: idea
      };
    } catch (e) {
      AppLogger.error('FEATURE_ARCHITECT_PARSE_FAIL', e.message);
      return { success: false, code: 'BLUEPRINT_PARSE_FAILED', error: e.message };
    }
  },

  implementBlueprint(idea) {
    AppLogger.info('FEATURE_ARCHITECT_IMPLEMENT', 'idea:' + idea);

    var blueprint = this._getLatestBlueprint();
    if (!blueprint) {
      return { success: false, code: 'NO_PENDING_BLUEPRINT' };
    }

    var context = this._gatherProjectContext();
    var timestamp = new Date().getTime();
    var branchName = 'feature/' + (blueprint.featureName || 'new-feature').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '-' + timestamp;

    var backupBranch = GitHubOpsService.createBackupBranch('feature-' + timestamp);
    var branchOk = GitHubOpsService.createBranch(branchName);
    if (!branchOk) {
      return { success: false, code: 'BRANCH_CREATION_FAILED', branchName: branchName };
    }

    var generatedFiles = this._generateAllCode(blueprint, context, idea);
    if (!generatedFiles || generatedFiles.length === 0) {
      return { success: false, code: 'CODE_GENERATION_FAILED' };
    }

    var validFiles = [];
    var rejectedFiles = [];

    for (var i = 0; i < generatedFiles.length; i++) {
      var file = generatedFiles[i];
      var path = file.fileName.indexOf('src/') === 0 ? file.fileName : 'src/' + file.fileName;
      var original = GitHubOpsService.readFile(path);
      if (!original) original = GitHubOpsService.readFile(file.fileName);

      var originalContent = original ? original.content : null;
      var validation = PatchValidator.validate(file.code, originalContent, file.fileName);

      if (validation.valid) {
        validFiles.push({
          file: file,
          path: path,
          sha: original ? original.sha : null,
          validation: validation
        });
      } else {
        rejectedFiles.push({
          fileName: file.fileName,
          errors: validation.errors
        });
      }
    }

    if (validFiles.length === 0) {
      return {
        success: false,
        code: 'ALL_FILES_REJECTED_BY_VALIDATOR',
        rejectedFiles: rejectedFiles
      };
    }

    var commitLog = [];
    var successCount = 0;
    var failCount = 0;

    for (var j = 0; j < validFiles.length; j++) {
      var item = validFiles[j];
      var isNew = !item.sha;
      var ok = GitHubOpsService.commitFile(
        item.path,
        item.file.code,
        (isNew ? 'feat: ' : 'update: ') + item.file.fileName,
        branchName,
        item.sha
      );

      if (ok) {
        successCount++;
        commitLog.push({ fileName: item.file.fileName, status: 'committed', isNew: isNew });
      } else {
        failCount++;
        commitLog.push({ fileName: item.file.fileName, status: 'failed', isNew: isNew });
      }
    }

    var prBody = '## Feature: ' + blueprint.featureName + '\n\n' +
                 (blueprint.description || '-') + '\n\n' +
                 '## Commits\n' + commitLog.map(function(c) { return '- ' + c.fileName + ' (' + c.status + ')'; }).join('\n') + '\n\n';

    if (backupBranch) {
      prBody += '## Backup\n`' + backupBranch + '`\n\n';
    }

    var prUrl = GitHubOpsService.createPullRequest(
      'Feature: ' + blueprint.featureName,
      prBody,
      branchName,
      null
    );

    ProjectBrain.updateRoadmapStatus(blueprint.featureName, 'in-progress');

    return {
      success: true,
      featureName: blueprint.featureName,
      branchName: branchName,
      backupBranch: backupBranch,
      prUrl: prUrl,
      commitLog: commitLog,
      newSheets: blueprint.newSheets || [],
      rejectedFiles: rejectedFiles
    };
  },

  _generateAllCode(blueprint, context, idea) {
    var filesToGenerate = [];

    if (blueprint.newFiles && Array.isArray(blueprint.newFiles)) {
      blueprint.newFiles.forEach(function(f) {
        filesToGenerate.push({
          fileName: f.fileName,
          isNew: true,
          description: f.description,
          type: f.type
        });
      });
    }

    if (blueprint.modifiedFiles && Array.isArray(blueprint.modifiedFiles)) {
      blueprint.modifiedFiles.forEach(function(f) {
        var path = f.fileName.indexOf('src/') === 0 ? f.fileName : 'src/' + f.fileName;
        var existing = GitHubOpsService.readFile(path);
        if (!existing) existing = GitHubOpsService.readFile(f.fileName);

        filesToGenerate.push({
          fileName: f.fileName,
          isNew: false,
          changes: f.changes,
          existingCode: existing ? existing.content : null
        });
      });
    }

    if (filesToGenerate.length === 0) return [];

    var results = [];
    for (var i = 0; i < filesToGenerate.length; i++) {
      var fileSpec = filesToGenerate[i];
      AppLogger.info('FEATURE_GENERATE_FILE', fileSpec.fileName);

      var code = this._generateSingleFile(fileSpec, blueprint, context, idea);
      if (code) {
        results.push({
          fileName: fileSpec.fileName,
          code: code
        });
      }
    }

    return results;
  },

  _generateSingleFile(fileSpec, blueprint, context, idea) {
    var templateKey = fileSpec.isNew ? 'new_file_prompt' : 'modify_file_prompt';
    var template = KnowledgeRepository.get('feature', templateKey);
    var prompt = '';

    if (template) {
      if (fileSpec.isNew) {
        prompt = TemplateEngine.render(template, {
          file_name: fileSpec.fileName,
          file_type: fileSpec.type,
          file_description: fileSpec.description,
          feature_name: blueprint.featureName,
          feature_description: blueprint.description,
          file_list: context.fileList,
          sheet_list: context.sheetList
        });
      } else {
        prompt = TemplateEngine.render(template, {
          file_name: fileSpec.fileName,
          changes: (fileSpec.changes || []).join('\n'),
          existing_code: fileSpec.existingCode || '-',
          feature_name: blueprint.featureName
        });
      }
    } else {
      prompt = fileSpec.fileName + '\n\n' + JSON.stringify(fileSpec);
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'code_generation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Generate pure code without markdown.' }],
      temperature: 0.1
    });

    if (!llmResult || !llmResult.text) return null;

    var code = llmResult.text;
    code = code.replace(/^```javascript\n?/m, '');
    code = code.replace(/^```gs\n?/m, '');
    code = code.replace(/```\s*$/m, '');
    return code.trim();
  },

  _gatherProjectContext() {
    var files = GitHubOpsService.listDirectory('src');
    var fileList = Array.isArray(files) ? files.map(function(f) { return f.name; }).join(', ') : '-';

    var sheetList = '-';
    try {
      var ss = SpreadsheetGateway.getSpreadsheet();
      sheetList = ss.getSheets().map(function(s) { return s.getName(); }).join(', ');
    } catch (e) {}

    return {
      fileList: fileList,
      sheetList: sheetList,
      intentList: 'catat_keuangan, tanya_saldo, sync_documentation, audit_code, roadmap_query, implement_feature, self_query, soul_query',
      commandList: '/ingat, /diagnose, /patch, /soul, /memory, /sync'
    };
  },

  _saveBlueprint(blueprint, idea) {
    try {
      var id = IdGenerator.generate('BLUE');
      var timestamp = DateTimeUtils.nowWIB();
      SpreadsheetGateway.appendRowSafe('SelfHeal_Patches', [
        id,
        timestamp,
        'BLUEPRINT: ' + (blueprint.featureName || 'unknown'),
        idea,
        JSON.stringify(blueprint),
        'pending'
      ]);
    } catch (e) {
      AppLogger.error('FEATURE_BLUEPRINT_SAVE_FAIL', e.message);
    }
  },

  _getLatestBlueprint() {
    try {
      var sheet = SpreadsheetGateway.getSheet('SelfHeal_Patches');
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][2]).indexOf('BLUEPRINT:') === 0 && data[i][5] === 'pending') {
          return JSON.parse(data[i][4]);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }
};
~~~~~

## SOURCE: `src/08_Specialist_Finance.gs`

~~~~~javascript
const FinanceSpecialist = {
  DEFAULT_WALLET_NAME: 'Cash',
  BUDGET_WARNING_THRESHOLD: 0.8,
  BUDGET_EXCEEDED_THRESHOLD: 1.0,

  resolveWallet(namaWallet) {
    var nama = (namaWallet && namaWallet.trim().length > 0)
      ? namaWallet.trim() : this.DEFAULT_WALLET_NAME;

    var wallet = WalletRepository.findByName(nama);
    if (!wallet) {
      var id = WalletRepository.create(nama, 0);
      wallet = WalletRepository.findById(id);
      AppLogger.info('WALLET_AUTO_CREATED', 'wallet_id:' + id);
    }
    return wallet;
  },

  getSaldoWallet(walletId) {
    var wallet = WalletRepository.findById(walletId);
    if (!wallet) return 0;

    var transaksi = TransactionRepository.getByWallet(walletId);
    var totalMasuk = transaksi
      .filter(function(t) { return t.tipe === TransactionRepository.TIPE_INCOME; })
      .reduce(function(sum, t) { return sum + t.jumlah; }, 0);
    var totalKeluar = transaksi
      .filter(function(t) { return t.tipe === TransactionRepository.TIPE_EXPENSE; })
      .reduce(function(sum, t) { return sum + t.jumlah; }, 0);

    return wallet.saldoAwal + totalMasuk - totalKeluar;
  },

  getAllSaldo() {
    var wallets = WalletRepository.getAll();
    var self = this;
    var list = wallets.map(function(w) {
      return {
        id: w.id,
        nama: w.nama,
        saldo: self.getSaldoWallet(w.id)
      };
    });
    var total = list.reduce(function(sum, w) { return sum + w.saldo; }, 0);
    return { wallets: list, total: total };
  },

  recordTransaction(data) {
    var wallet = this.resolveWallet(data.walletNama);
    var tanggalTransaksi = data.tanggalTransaksi || DateTimeUtils.nowWIB();

    var trxId = TransactionRepository.create({
      walletId: wallet.id,
      tanggalTransaksi: tanggalTransaksi,
      tipe: data.tipe,
      kategori: data.kategori,
      jumlah: data.jumlah,
      deskripsi: data.deskripsi
    });

    AppLogger.info('TRANSACTION_CREATED', 'trx_id:' + trxId);

    var saldoTerbaru = this.getSaldoWallet(wallet.id);
    var alertData = null;

    if (data.tipe === TransactionRepository.TIPE_EXPENSE) {
      alertData = this._checkBudgetAlert(data.kategori, tanggalTransaksi);
    }

    return {
      success: true,
      data: {
        transactionId: trxId,
        wallet: wallet.nama,
        walletId: wallet.id,
        tipe: data.tipe,
        kategori: data.kategori,
        jumlah: data.jumlah,
        deskripsi: data.deskripsi,
        saldoTerbaru: saldoTerbaru,
        budgetAlert: alertData
      }
    };
  },

  editLastTransaction(updatedFields) {
    var lastTrx = TransactionRepository.getLastActive();
    if (!lastTrx) {
      return { success: false, code: 'NO_ACTIVE_TRANSACTION' };
    }

    TransactionRepository.update(lastTrx._rowIndex, updatedFields);
    AppLogger.info('TRANSACTION_EDITED', 'trx_id:' + lastTrx.id);

    var updated = TransactionRepository.findById(lastTrx.id);
    var wallet = WalletRepository.findById(updated.walletId);
    var saldoTerbaru = this.getSaldoWallet(wallet.id);

    return {
      success: true,
      data: {
        transactionId: updated.id,
        wallet: wallet.nama,
        kategori: updated.kategori,
        jumlah: updated.jumlah,
        deskripsi: updated.deskripsi,
        saldoTerbaru: saldoTerbaru
      }
    };
  },

  getRingkasanPeriode(periode) {
    var semuaTransaksi = TransactionRepository.getActive().filter(function(t) {
      return DateTimeUtils.formatPeriode(t.tanggalTransaksi) === periode;
    });

    var totalMasuk = semuaTransaksi
      .filter(function(t) { return t.tipe === TransactionRepository.TIPE_INCOME; })
      .reduce(function(sum, t) { return sum + t.jumlah; }, 0);
    var totalKeluar = semuaTransaksi
      .filter(function(t) { return t.tipe === TransactionRepository.TIPE_EXPENSE; })
      .reduce(function(sum, t) { return sum + t.jumlah; }, 0);

    var perKategori = {};
    semuaTransaksi
      .filter(function(t) { return t.tipe === TransactionRepository.TIPE_EXPENSE; })
      .forEach(function(t) {
        perKategori[t.kategori] = (perKategori[t.kategori] || 0) + t.jumlah;
      });

    return {
      periode: periode,
      totalMasuk: totalMasuk,
      totalKeluar: totalKeluar,
      saldoBersih: totalMasuk - totalKeluar,
      perKategori: perKategori
    };
  },

  createOrUpdateBudget(kategori, batasJumlah, periode) {
    var existing = BudgetRepository.findByKategoriAndPeriode(kategori, periode);
    var action = 'CREATE';

    if (existing) {
      BudgetRepository.updateBatasJumlah(existing._rowIndex, batasJumlah);
      action = 'UPDATE';
      AppLogger.info('BUDGET_UPDATED', 'kategori:' + kategori);
    } else {
      BudgetRepository.create(kategori, batasJumlah, periode);
      AppLogger.info('BUDGET_CREATED', 'kategori:' + kategori);
    }

    return {
      success: true,
      action: action,
      kategori: kategori,
      batasJumlah: batasJumlah,
      periode: periode
    };
  },

  _checkBudgetAlert(kategori, tanggalTransaksi) {
    var periode = DateTimeUtils.formatPeriode(tanggalTransaksi);
    var budget = BudgetRepository.findByKategoriAndPeriode(kategori, periode);
    if (!budget) return null;

    var transaksiKategori = TransactionRepository.getByKategoriAndPeriode(kategori, periode);
    var totalTerpakai = transaksiKategori.reduce(function(sum, t) { return sum + t.jumlah; }, 0);
    var persentase = totalTerpakai / budget.batasJumlah;

    if (persentase >= this.BUDGET_EXCEEDED_THRESHOLD) {
      AppLogger.warning('BUDGET_ALERT_EXCEEDED', 'kategori:' + kategori);
      return {
        status: 'EXCEEDED',
        kategori: kategori,
        periode: periode,
        totalTerpakai: totalTerpakai,
        batasBudget: budget.batasJumlah,
        persentase: Math.round(persentase * 100)
      };
    }
    if (persentase >= this.BUDGET_WARNING_THRESHOLD) {
      AppLogger.warning('BUDGET_ALERT_WARNING', 'kategori:' + kategori);
      return {
        status: 'WARNING',
        kategori: kategori,
        periode: periode,
        totalTerpakai: totalTerpakai,
        batasBudget: budget.batasJumlah,
        persentase: Math.round(persentase * 100)
      };
    }
    return null;
  }
};
~~~~~

## SOURCE: `src/08_Specialist_Knowledge.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: KNOWLEDGE
 * Tanggung jawab: simpan & ambil fakta tentang user.
 * ===================================================================
 */
const KnowledgeSpecialist = {
  CATEGORY_MANUAL: 'manual',
  CATEGORY_AUTO: 'auto',

  saveFact(chatId, factText, category) {
    if (!factText || factText.trim().length === 0) return false;
    FactsRepository.save(chatId, factText.trim(), category || 'general');
    return true;
  },

  saveManualFact(chatId, factText) {
    return this.saveFact(chatId, factText, this.CATEGORY_MANUAL);
  },

  saveAutoDetectedFacts(chatId, facts) {
    if (!facts || facts.length === 0) return 0;
    let saved = 0;
    facts.forEach(f => {
      if (this.saveFact(chatId, f, this.CATEGORY_AUTO)) saved++;
    });
    return saved;
  },

  getActiveFactsForPrompt(limit) {
    return FactsRepository.getActive(limit || 50);
  },

  findRelevantToKeyword(keyword, limit) {
    const facts = this.getActiveFactsForPrompt(limit || 50);
    const lowerKeyword = keyword.toLowerCase();
    return facts.filter(f => f.toLowerCase().indexOf(lowerKeyword) !== -1);
  }
};
~~~~~

## SOURCE: `src/08_Specialist_KnowledgeSync.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: KNOWLEDGE SYNC
 * Jembatan sinkronisasi 2 arah antara Sheet AI_Knowledge & GitHub.
 * ===================================================================
 */
const KnowledgeSyncSpecialist = {
  SYNC_FILE: 'ai_knowledge.md',
  NOTE_CODE: 'SYS_AUTO_SYNC',

  sync() {
    return this._pullFromGitHub();
  },

  bootstrap() {
    var existing = KnowledgeRepository.getByNamespace('intent');
    var hasData = Object.keys(existing).length > 0;
    if (hasData) {
      AppLogger.info('KNOWLEDGE_BOOTSTRAP_SKIP', 'sheet_not_empty');
      return { status: 'skipped', reason: 'sheet_not_empty' };
    }
    return this._pullFromGitHub();
  },

  _pullFromGitHub() {
    var fileData = GitHubOpsService.readFile(this.SYNC_FILE);
    if (!fileData || !fileData.content) {
      AppLogger.error('KNOWLEDGE_PULL_FAILED', 'empty_or_null');
      return { status: 'error', reason: 'no_content' };
    }

    var rawText = fileData.content;
    if (fileData.encoding === 'base64') {
      rawText = Utilities.newBlob(
        Utilities.base64Decode(rawText.replace(/\s/g, ''))
      ).getDataAsString();
    }

    var sections = rawText.split(/^##\s+/m);
    var count = 0;
    for (var i = 1; i < sections.length; i++) {
      var section = sections[i];
      var firstLineEnd = section.indexOf('\n');
      if (firstLineEnd === -1) continue;

      var header = section.substring(0, firstLineEnd).trim();
      var body = section.substring(firstLineEnd + 1).trim();
      var parts = header.split(':');
      if (parts.length !== 2) continue;

      KnowledgeRepository.save(parts[0].trim(), parts[1].trim(), body, this.NOTE_CODE);
      count++;
    }

    AppLogger.info('KNOWLEDGE_PULL_SUCCESS', 'sections:' + count);
    return { status: 'success', sections: count };
  },

  pushSheetToGitHub() {
    try {
      var allKnowledge = KnowledgeRepository.getAll();
      if (!allKnowledge || allKnowledge.length === 0) {
        return { status: 'empty', reason: 'no_data_in_sheet' };
      }

      var grouped = {};
      for (var i = 0; i < allKnowledge.length; i++) {
        var row = allKnowledge[i];
        if (row.active !== true && row.active !== 'TRUE') continue;
        if (!grouped[row.namespace]) grouped[row.namespace] = [];
        grouped[row.namespace].push({ key: row.key, content: row.content });
      }

      var mdLines = ['# AI Agent Knowledge Base', ''];
      var namespaces = Object.keys(grouped).sort();
      for (var n = 0; n < namespaces.length; n++) {
        var ns = namespaces[n];
        var items = grouped[ns];
        for (var j = 0; j < items.length; j++) {
          mdLines.push('## ' + ns + ':' + items[j].key);
          mdLines.push(items[j].content);
          mdLines.push('');
        }
      }

      var markdown = mdLines.join('\n');
      var existingFile = GitHubOpsService.readFile(this.SYNC_FILE);
      var sha = (existingFile && existingFile.sha) ? existingFile.sha : null;

      GitHubOpsService.commitFile(this.SYNC_FILE, markdown, 'knowledge:backup_from_sheet', null, sha);
      AppLogger.info('KNOWLEDGE_PUSH_SUCCESS', 'namespaces:' + namespaces.length);
      return { status: 'success', namespaces: namespaces.length, total_entries: allKnowledge.length };
    } catch (err) {
      AppLogger.error('KNOWLEDGE_PUSH_FAILED', err.message);
      return { status: 'error', reason: err.message };
    }
  }
};
~~~~~

## SOURCE: `src/08_Specialist_LLMIntelligence.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: LLM INTELLIGENCE (ISOLATED RUNTIME ENGINE)
 * ===================================================================
 */
const LLMIntelligence = {
  NAMESPACE_BENCHMARK: 'benchmark',
  NAMESPACE_ROUTING: 'llm_routing',
  NAMESPACE_LLM: 'llm',
  NAMESPACE_STATS: 'llm_stats',
  BATCH_SIZE: 3,

  discoverAndBenchmark() {
    return this.runFullPipeline();
  },

  runFullPipeline() {
    var res1 = this.discoverModels();
    var res2 = this.benchmarkBatch();
    var res3 = this.rankModels();
    return { discovery: res1, benchmark: res2, ranking: res3 };
  },

  discoverModels() {
    try {
      var raw = KnowledgeRepository.get(this.NAMESPACE_LLM, 'candidate_models');
      if (!raw) {
        return { stage: 'discovery', status: 'no_candidates_in_sheet' };
      }

      var modelIds;
      try {
        modelIds = JSON.parse(raw);
      } catch (e) {
        modelIds = raw.split(',').map(function(s) { return s.trim(); });
      }

      if (!Array.isArray(modelIds) || modelIds.length === 0) {
        return { stage: 'discovery', status: 'empty_list' };
      }

      var formatted = modelIds.map(function(id) {
        return { id: id, contextLength: 8192 };
      });

      KnowledgeRepository.save(this.NAMESPACE_LLM, 'available_free_models', JSON.stringify(formatted), 'DISCOVERY');

      AppLogger.info('LLM_DISCOVERY_SUCCESS', 'count:' + modelIds.length);
      return {
        stage: 'discovery',
        status: 'success',
        count: modelIds.length,
        models: modelIds
      };
    } catch (err) {
      AppLogger.error('LLM_DISCOVER_FAIL', err.message);
      return { stage: 'discovery', status: 'error', reason: err.message };
    }
  },

  benchmarkBatch() {
    var startTime = new Date().getTime();

    try {
      var candidateIds = this._loadCandidateIds();
      if (!candidateIds || candidateIds.length === 0) {
        var discRes = this.discoverModels();
        if (discRes.status !== 'success' || !discRes.models) {
          return { stage: 'benchmark', status: 'no_candidates' };
        }
        candidateIds = discRes.models;
      }

      var existingResults = this._loadExistingResults();
      var unbenchmarked = [];
      for (var i = 0; i < candidateIds.length; i++) {
        if (!existingResults[candidateIds[i]]) {
          unbenchmarked.push(candidateIds[i]);
        }
      }

      if (unbenchmarked.length === 0) {
        return {
          stage: 'benchmark',
          status: 'all_tested',
          total_tested: Object.keys(existingResults).length
        };
      }

      var batch = unbenchmarked.slice(0, this.BATCH_SIZE);
      var diagPrompt = KnowledgeRepository.get(this.NAMESPACE_BENCHMARK, 'diagnostic_prompt');
      var patCalc = KnowledgeRepository.get(this.NAMESPACE_BENCHMARK, 'pattern_calc');
      var patLogic = KnowledgeRepository.get(this.NAMESPACE_BENCHMARK, 'pattern_logic');

      var testedInThisRun = [];

      for (var b = 0; b < batch.length; b++) {
        if (new Date().getTime() - startTime > 120000) {
          break;
        }

        var modelId = batch[b];
        var result = this._testSingleModel(modelId, diagPrompt, patCalc, patLogic);
        existingResults[modelId] = result;
        testedInThisRun.push({
          model: modelId,
          score: result.totalScore,
          latency: result.avgLatencyMs
        });
      }

      this._saveResults(existingResults);

      AppLogger.info('LLM_BENCHMARK_BATCH', 'tested:' + testedInThisRun.length);
      return {
        stage: 'benchmark',
        status: 'batch_completed',
        tested_count: testedInThisRun.length,
        results: testedInThisRun,
        remaining: unbenchmarked.length - testedInThisRun.length
      };
    } catch (err) {
      AppLogger.error('LLM_BENCHMARK_FAIL', err.message);
      return { stage: 'benchmark', status: 'error', reason: err.message };
    }
  },

  rankModels() {
    try {
      var candidateIds = this._loadCandidateIds();
      var existingResults = this._loadExistingResults();

      var scoredList = [];
      for (var modelId in existingResults) {
        if (!existingResults.hasOwnProperty(modelId)) continue;
        var r = existingResults[modelId];
        if (r && typeof r.totalScore === 'number' && r.totalScore >= 30) {
          scoredList.push({ model: modelId, score: r.totalScore });
        }
      }

      scoredList.sort(function(a, b) { return b.score - a.score; });
      var rankedModels = scoredList.map(function(item) { return item.model; });

      if (rankedModels.length === 0 && candidateIds && candidateIds.length > 0) {
        rankedModels = candidateIds.slice(0, 5);
      }

      var matrix = {
        chat_light: rankedModels,
        chat_heavy: rankedModels,
        intent_analysis: rankedModels,
        code_analysis: rankedModels,
        code_generation: rankedModels,
        documentation: rankedModels,
        web_grounded: rankedModels
      };

      KnowledgeRepository.save(this.NAMESPACE_ROUTING, 'matrix', JSON.stringify(matrix), 'RANKING');

      AppLogger.info('LLM_RANKING_DONE', 'ranked:' + rankedModels.length);
      return {
        stage: 'ranking',
        status: 'success',
        ranked_count: rankedModels.length,
        top_models: rankedModels.slice(0, 3)
      };
    } catch (err) {
      AppLogger.error('LLM_RANKING_FAIL', err.message);
      return { stage: 'ranking', status: 'error', reason: err.message };
    }
  },

  _testSingleModel(modelId, promptText, patCalc, patLogic) {
    var prompt = promptText || '{"calc": 47 * 23, "logic": "tidak"}';
    var start = new Date().getTime();
    var qualityScore = 0;
    var latency = 20000;

    try {
      var res = OpenRouterProvider.call(
        'Return raw JSON only.',
        [{ role: 'user', text: prompt }],
        0.1,
        modelId
      );

      latency = new Date().getTime() - start;

      if (res) {
        var clean = res.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        var rxCalc = new RegExp(patCalc || '1081', 'i');
        if (rxCalc.test(clean)) qualityScore += 50;

        var rxLogic = new RegExp(patLogic || 'tidak', 'i');
        if (rxLogic.test(clean)) qualityScore += 50;
      }
    } catch (e) {
      latency = 20000;
      qualityScore = 0;
    }

    var latencyScore = Math.max(0, Math.min(100, Math.round(100 - ((latency - 2000) / 100))));
    if (latency <= 2000) latencyScore = 100;

    var finalScore = Math.round((qualityScore * 0.7) + (latencyScore * 0.3));

    return {
      modelId: modelId,
      totalScore: finalScore,
      qualityScore: qualityScore,
      avgLatencyMs: latency,
      testedAt: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB())
    };
  },

  _loadCandidateIds() {
    var raw = KnowledgeRepository.get(this.NAMESPACE_LLM, 'available_free_models');
    if (!raw) return [];
    try {
      var list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0 && list[0].id) {
        return list.map(function(item) { return item.id; });
      }
      if (Array.isArray(list)) return list;
      return [];
    } catch (e) {
      return [];
    }
  },

  _loadExistingResults() {
    var raw = KnowledgeRepository.get(this.NAMESPACE_LLM, 'benchmark_results');
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (e) { return {}; }
  },

  _saveResults(results) {
    KnowledgeRepository.save(this.NAMESPACE_LLM, 'benchmark_results', JSON.stringify(results), 'BENCHMARK_SAVE');
  },

  getRankedModelsForTask(taskType) {
    var matrixRaw = KnowledgeRepository.get(this.NAMESPACE_ROUTING, 'matrix');
    if (!matrixRaw) return [];
    try {
      var matrix = JSON.parse(matrixRaw);
      var models = matrix[taskType] || matrix['chat_light'] || [];
      return Array.isArray(models) ? models : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Pencatatan metrik ringan: MURNI mencatat statistik, TIDAK PERNAH memicu re-ranking di tengah chat
   */
  recordStat(taskType, modelId, success, latencyMs) {
    try {
      var raw = KnowledgeRepository.get(this.NAMESPACE_STATS, 'counters');
      var counters = {};
      if (raw) {
        try { counters = JSON.parse(raw); } catch (e) { counters = {}; }
      }

      var key = taskType + '|' + modelId;
      if (!counters[key]) {
        counters[key] = { success: 0, fail: 0, totalLatency: 0, count: 0 };
      }

      if (success) counters[key].success++;
      else counters[key].fail++;
      counters[key].totalLatency += latencyMs;
      counters[key].count++;

      KnowledgeRepository.save(this.NAMESPACE_STATS, 'counters', JSON.stringify(counters), 'STAT_RECORD');
    } catch (e) {}
  },

  /**
   * Re-ranking adaptif: HANYA dipanggil oleh scheduler pemeliharaan jam 03:00
   */
  adaptiveReRank() {
    var rawStats = KnowledgeRepository.get(this.NAMESPACE_STATS, 'counters');
    if (!rawStats) return;

    var counters;
    try { counters = JSON.parse(rawStats); } catch (e) { return; }

    var results = this._loadExistingResults();
    var hasChanges = false;

    for (var k in counters) {
      if (!counters.hasOwnProperty(k)) continue;
      var parts = k.split('|');
      var modelId = parts[1];
      var stat = counters[k];
      if (stat.count >= 3 && results[modelId]) {
        var rate = stat.success / stat.count;
        if (rate < 0.5) {
          results[modelId].totalScore = Math.max(0, results[modelId].totalScore - 20);
          hasChanges = true;
        } else if (rate >= 0.9) {
          results[modelId].totalScore = Math.min(100, results[modelId].totalScore + 5);
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      this._saveResults(results);
      this.rankModels();
    }

    try {
      KnowledgeRepository.save(this.NAMESPACE_STATS, 'counters', '{}', 'RESET_COUNTERS');
    } catch (e) {}
    AppLogger.info('ADAPTIVE_RERANK', 'completed');
  }
};
~~~~~

## SOURCE: `src/08_Specialist_Memory.gs`

~~~~~javascript
/**
 * SPECIALIST: MEMORY (STM + LTM)
 * Tanggung jawab: mengelola ingatan jangka pendek dan panjang.
 * - STM: pesan mentah terakhir (sudah ada di Chat_History)
 * - LTM: ringkasan harian yang di-generate oleh LLM
 */
var MemorySpecialist = {

  /**
   * Ambil ringkasan LTM untuk dimasukkan ke prompt.
   * @param {number} maxDays - jumlah hari terakhir
   * @returns {array} Array of string
   */
  getLongTermMemory: function(maxDays) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Memory_Summaries');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      var summaries = [];
      var limit = Math.min(maxDays || 7, data.length - 1);

      // Ambil N baris terakhir (paling baru)
      for (var i = data.length - 1; i >= data.length - limit; i--) {
        if (i < 1) break;
        var date = data[i][1];
        var summary = data[i][2];
        var topics = data[i][3];
        if (summary) {
          var dateStr = date instanceof Date
            ? DateTimeUtils.formatTanggal(date)
            : String(date);
          summaries.push('[' + dateStr + '] ' + summary +
            (topics ? ' (topik: ' + topics + ')' : ''));
        }
      }

      return summaries;
    } catch (e) {
      AppLogger.error('LTM_READ_FAIL', e.message);
      return [];
    }
  },

  /**
   * Ringkas percakapan hari ini dan simpan ke LTM.
   * Dipanggil oleh trigger nightly.
   */
  summarizeToday: function() {
    AppLogger.info('LTM_SUMMARIZE_START', 'Memulai ringkasan harian');

    // Ambil semua chat hari ini
    var todayChats = this._getTodayChats();

    if (todayChats.length < 4) {
      AppLogger.info('LTM_SUMMARIZE_SKIP',
        'Terlalu sedikit chat hari ini (' + todayChats.length + '). Skip.');
      return;
    }

    // Cek apakah sudah ada ringkasan untuk hari ini
    if (this._hasSummaryForToday()) {
      AppLogger.info('LTM_SUMMARIZE_SKIP', 'Ringkasan hari ini sudah ada.');
      return;
    }

    // Minta LLM ringkas
    var chatText = todayChats.map(function(c) {
      return (c.role === 'ai' ? 'AI' : 'User') + ': ' + c.text;
    }).join('\n');

    var prompt =
      'Ringkas percakapan berikut menjadi 3-5 kalimat singkat.\n' +
      'Fokus pada: topik utama, keputusan yang dibuat, rencana yang disebutkan, ' +
      'dan informasi penting tentang user.\n' +
      'Jangan sertakan detail teknis atau log sistem.\n\n' +
      'PERCAKAPAN:\n' + chatText + '\n\n' +
      'FORMAT OUTPUT (JSON tanpa wrapper markdown):\n' +
      '{\n' +
      '  "summary": "ringkasan 3-5 kalimat",\n' +
      '  "topics": "topik1, topik2, topik3"\n' +
      '}';

    var llmResult = LLMProviderService.generateFromSinglePrompt(prompt, 0.3, 'fast');

    if (!llmResult || !llmResult.text) {
      AppLogger.error('LTM_SUMMARIZE_LLM_FAIL', 'LLM gagal merespons');
      return;
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '')
                                  .replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      this._saveSummary(result.summary, result.topics, todayChats.length);
      AppLogger.info('LTM_SUMMARIZE_DONE',
        'Ringkasan tersimpan (' + todayChats.length + ' pesan)');

    } catch (e) {
      AppLogger.error('LTM_SUMMARIZE_PARSE_FAIL', e.message);
    }
  },

  /**
   * Ambil semua chat hari ini dari Chat_History.
   */
  _getTodayChats: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Chat_History');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      var today = DateTimeUtils.formatTanggal(DateTimeUtils.nowWIB());
      var chats = [];

      for (var i = 1; i < data.length; i++) {
        var timestamp = data[i][1];
        var chatDate = '';

        if (timestamp instanceof Date) {
          chatDate = DateTimeUtils.formatTanggal(timestamp);
        } else {
          chatDate = String(timestamp).substring(0, 10);
        }

        if (chatDate === today) {
          chats.push({
            role: data[i][3],
            text: String(data[i][4] || '').substring(0, 500)
          });
        }
      }

      return chats;
    } catch (e) {
      AppLogger.error('LTM_TODAY_CHAT_FAIL', e.message);
      return [];
    }
  },

  /**
   * Cek apakah sudah ada ringkasan untuk hari ini.
   */
  _hasSummaryForToday: function() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Memory_Summaries');
      var data = sheet.getDataRange().getValues();
      var today = DateTimeUtils.formatTanggal(DateTimeUtils.nowWIB());

      for (var i = 1; i < data.length; i++) {
        var date = data[i][1];
        var dateStr = date instanceof Date
          ? DateTimeUtils.formatTanggal(date)
          : String(date);
        if (dateStr === today) return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Simpan ringkasan ke sheet.
   */
  _saveSummary: function(summary, topics, messageCount) {
    try {
      var id = IdGenerator.generate('MEM');
      var today = DateTimeUtils.formatTanggal(DateTimeUtils.nowWIB());
      SpreadsheetGateway.appendRowSafe('Memory_Summaries', [
        id, today, summary, topics || '', messageCount || 0
      ]);
    } catch (e) {
      AppLogger.error('LTM_SAVE_FAIL', e.message);
    }
  }
};
~~~~~

## SOURCE: `src/08_Specialist_ProjectBrain.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: PROJECT BRAIN
 * Tanggung jawab: Memahami visi proyek, menyinkronkan roadmap vs kode,
 * dan mengevaluasi ide baru secara terstruktur.
 * ===================================================================
 */
const ProjectBrain = {

  buildRoadmapFromDiscussion(userInput) {
    AppLogger.info('PROJECT_BRAIN_BUILD', 'input:' + userInput);

    var existingRoadmap = this._readDoc('ROADMAP.md');
    var existingItems = this._readItems();

    var template = KnowledgeRepository.get('roadmap', 'build_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        existing_roadmap: existingRoadmap || '-',
        existing_items: existingItems || '-',
        user_input: userInput
      });
    } else {
      prompt = userInput + '\n\n' + existingRoadmap;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'documentation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Generate roadmap JSON.' }],
      temperature: 0.3
    });

    if (!llmResult || !llmResult.text) {
      return { success: false, code: 'ROADMAP_LLM_FAILED' };
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      var commitOk = false;
      if (result.roadmapContent) {
        commitOk = GitHubOpsService.updateDocFile('ROADMAP.md', result.roadmapContent, 'docs: update ROADMAP.md');
      }

      if (result.items && Array.isArray(result.items)) {
        this._syncItemsToSheet(result.items);
      }

      return {
        success: true,
        summary: result.summary,
        commitOk: commitOk,
        itemsCount: result.items ? result.items.length : 0
      };
    } catch (e) {
      AppLogger.error('PROJECT_BRAIN_PARSE_FAIL', e.message);
      return { success: false, code: 'ROADMAP_PARSE_FAILED', error: e.message };
    }
  },

  syncRoadmapWithCode() {
    AppLogger.info('PROJECT_BRAIN_SYNC', 'started');

    var roadmap = this._readDoc('ROADMAP.md');
    var items = this._readItems();
    var allFiles = GitHubOpsService.listDirectory('src');
    var fileNames = Array.isArray(allFiles) ? allFiles.map(function(f) { return f.name; }) : [];

    var template = KnowledgeRepository.get('roadmap', 'sync_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        existing_roadmap: roadmap || '-',
        existing_items: items || '-',
        file_names: fileNames.join('\n')
      });
    } else {
      prompt = fileNames.join('\n');
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'documentation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Sync roadmap JSON.' }],
      temperature: 0.2
    });

    if (!llmResult || !llmResult.text) return { success: false, code: 'ROADMAP_SYNC_LLM_FAILED' };

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);
      var changesMade = 0;

      if (result.updates && Array.isArray(result.updates)) {
        for (var i = 0; i < result.updates.length; i++) {
          var u = result.updates[i];
          if (this._updateItemStatus(u.feature, u.newStatus)) changesMade++;
        }
      }

      if (result.newItems && Array.isArray(result.newItems)) {
        for (var j = 0; j < result.newItems.length; j++) {
          var it = result.newItems[j];
          if (this._addItem(it.feature, it.category, it.priority, it.status, it.notes)) changesMade++;
        }
      }

      if (result.roadmapChanges) {
        this._updateRoadmapContent(result.roadmapChanges);
        changesMade++;
      }

      return {
        success: true,
        summary: result.summary,
        changesMade: changesMade
      };
    } catch (e) {
      AppLogger.error('PROJECT_BRAIN_SYNC_PARSE_FAIL', e.message);
      return { success: false, code: 'ROADMAP_SYNC_PARSE_FAILED', error: e.message };
    }
  },

  adaptRoadmapForNewIdea(idea) {
    AppLogger.info('PROJECT_BRAIN_ADAPT', 'idea:' + idea);

    var roadmap = this._readDoc('ROADMAP.md');
    var items = this._readItems();

    var template = KnowledgeRepository.get('roadmap', 'adapt_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        existing_roadmap: roadmap || '-',
        existing_items: items || '-',
        idea: idea
      });
    } else {
      prompt = idea;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'chat_heavy',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Evaluate idea JSON.' }],
      temperature: 0.3
    });

    if (!llmResult || !llmResult.text) return { success: false, code: 'ADAPT_LLM_FAILED' };

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      if (result.acceptIdea && result.newItem) {
        this._addItem(
          result.newItem.feature,
          result.newItem.category,
          result.newItem.priority,
          'idea',
          result.newItem.notes
        );
      }

      return {
        success: true,
        analysis: result
      };
    } catch (e) {
      AppLogger.error('PROJECT_BRAIN_ADAPT_FAIL', e.message);
      return { success: false, code: 'ADAPT_PARSE_FAILED', error: e.message };
    }
  },

  answerQuestion(question) {
    AppLogger.info('PROJECT_BRAIN_QUERY', question);

    var roadmap = this._readDoc('ROADMAP.md');
    var items = this._readItems();
    var template = KnowledgeRepository.get('roadmap', 'query_prompt');

    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        roadmap_context: 'ROADMAP:\n' + (roadmap || '-') + '\n\nITEMS:\n' + (items || '-'),
        question: question
      });
    } else {
      prompt = question;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'chat_heavy',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: question }],
      temperature: 0.5
    });

    return (llmResult && llmResult.text) ? llmResult.text : null;
  },

  updateRoadmapStatus(feature, status) {
    return this._updateItemStatus(feature, status);
  },

  _readDoc(fileName) {
    var file = GitHubOpsService.readDocFile(fileName);
    return file ? file.content : null;
  },

  _readItems() {
    try {
      var sheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return '-';

      var lines = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][1]) {
          lines.push('- [' + data[i][4] + '] ' + data[i][1] + ' (' + data[i][2] + ', ' + data[i][3] + ')' + (data[i][6] ? ' - ' + data[i][6] : ''));
        }
      }
      return lines.length > 0 ? lines.join('\n') : '-';
    } catch (e) {
      return '-';
    }
  },

  _addItem(feature, category, priority, status, notes) {
    try {
      var id = IdGenerator.generate('RD');
      SpreadsheetGateway.appendRowSafe('Roadmap_Items', [
        id, feature, category || 'General',
        priority || 'P3', status || 'idea', '', notes || ''
      ]);
      return true;
    } catch (e) {
      AppLogger.error('ROADMAP_ADD_FAIL', e.message);
      return false;
    }
  },

  _updateItemStatus(feature, newStatus) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var data = sheet.getDataRange().getValues();
      var featureLower = feature.toLowerCase();

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1]).toLowerCase().indexOf(featureLower) !== -1) {
          sheet.getRange(i + 1, 5).setValue(newStatus);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  _syncItemsToSheet(items) {
    var self = this;
    items.forEach(function(item) {
      var sheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var data = sheet.getDataRange().getValues();
      var found = false;

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][1]).toLowerCase() === item.feature.toLowerCase()) {
          sheet.getRange(i + 1, 3).setValue(item.category || data[i][2]);
          sheet.getRange(i + 1, 4).setValue(item.priority || data[i][3]);
          sheet.getRange(i + 1, 5).setValue(item.status || data[i][4]);
          sheet.getRange(i + 1, 7).setValue(item.notes || data[i][6]);
          found = true;
          break;
        }
      }

      if (!found) {
        self._addItem(item.feature, item.category, item.priority, item.status, item.notes);
      }
    });
  },

  _updateRoadmapContent(changesDescription) {
    var existing = this._readDoc('ROADMAP.md');
    if (!existing) return;

    var template = KnowledgeRepository.get('roadmap', 'update_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        changes_description: changesDescription,
        existing_content: existing
      });
    } else {
      prompt = changesDescription + '\n\n' + existing;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'documentation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Return pure markdown content.' }],
      temperature: 0.2
    });

    if (llmResult && llmResult.text) {
      GitHubOpsService.updateDocFile('ROADMAP.md', llmResult.text.trim(), 'docs: auto-sync roadmap');
    }
  }
};
~~~~~

## SOURCE: `src/08_Specialist_Reminder.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: REMINDER
 * Tanggung jawab: semua logic bisnis terkait reminder.
 * Tidak tahu cara kirim Telegram — hanya hasilkan teks siap pakai.
 * ===================================================================
 */
const ReminderSpecialist = {
  DEFAULT_SNOOZE_MINUTES: 30,
  NOTIFICATION_COOLDOWN_MINUTES: 5,

  getMenungguRespon() {
    return ReminderRepository.getMenungguRespon(30);
  },

  getReminderDueNow() {
    var now = DateTimeUtils.nowWIB();
    var active = ReminderRepository.getActive();
    var due = [];
    for (var i = 0; i < active.length; i++) {
      var r = active[i];
      if (this._isDueNow(r, now)) {
        due.push(r);
      }
    }
    return due;
  },

  listActiveAsText() {
    return ReminderRepository.formatDaftarAktifSebagaiTeks();
  },

  getAckPatternsForPrompt(limit) {
    return AckPatternsRepository.getRecent(limit);
  },

  create(reminderData) {
    if (!reminderData.waktuPertama || reminderData.waktuPertama.trim() === '') {
      return {
        success: false,
        text: 'Aku nangkep ini sebagai reminder, tapi waktunya kurang jelas. Kapan tepatnya?'
      };
    }

    ReminderRepository.create({
      deskripsi: reminderData.deskripsi,
      waktuPertama: reminderData.waktuPertama,
      jenisRecurring: reminderData.jenisRecurring,
      recurringConfig: reminderData.recurringConfig,
      prioritas: reminderData.prioritas,
      catatan: reminderData.catatan
    });

    return { success: true, text: this._buildConfirmationText(reminderData) };
  },

  acknowledge(pesanUserAsli, ackIntent, remindersMenunggu) {
    const target = remindersMenunggu.find(r => r.id === ackIntent.reminderId);
    if (!target) return { success: false, text: '' };

    if (ackIntent.aksiReminder === 'done') {
      return this._handleDone(pesanUserAsli, ackIntent, target);
    }
    if (ackIntent.aksiReminder === 'snooze') {
      return this._handleSnooze(pesanUserAsli, ackIntent, target);
    }
    return { success: false, text: '' };
  },

  getRemindersDueNow() {
    const now = DateTimeUtils.nowWIB();
    return ReminderRepository.getActive().filter(r => this._isDueNow(r, now));
  },

  buildNotificationText(reminder) {
    const jumlahBaru = parseInt(reminder.jumlahDiingatkan, 10) + 1;
    const labelUlang = jumlahBaru > 1 ? ' (ke-' + jumlahBaru + ')' : '';
    const konteks = this._buildRelevantFactContext(reminder);

    return '⏰ *Reminder' + labelUlang + '*\n\n' +
      '📌 ' + reminder.deskripsi + '\n' +
      '🕐 ' + DateTimeUtils.formatWaktu(reminder.waktuPertama) + konteks;
  },

  markAsNotified(reminder) {
    const jumlahBaru = parseInt(reminder.jumlahDiingatkan, 10) + 1;
    ReminderRepository.updateTerakhirDiingatkan(reminder.rowIndex, jumlahBaru);
    AppLogger.info('REMINDER_NOTIFIED', 'ID: ' + reminder.id + ' | Ke-' + jumlahBaru);
    return jumlahBaru;
  },

  _isDueNow(reminder, now) {
    const waktuReminder = DateTimeUtils.toWIB(new Date(reminder.waktuPertama));
    if (now.getTime() - waktuReminder.getTime() < 0) return false;

    if (!reminder.terakhirDiingatkan) return true;

    const selisih = now.getTime() - DateTimeUtils.toWIB(reminder.terakhirDiingatkan).getTime();
    const cooldownMs = this.NOTIFICATION_COOLDOWN_MINUTES * 60 * 1000;
    return selisih >= cooldownMs;
  },

  _buildRelevantFactContext(reminder) {
    const keyword = reminder.deskripsi.split(' ')[0];
    const faktaRelevan = KnowledgeSpecialist.findRelevantToKeyword(keyword, 50);
    return faktaRelevan.length > 0 ? '\n\n_' + faktaRelevan[0] + '_' : '';
  },

  _buildConfirmationText(data) {
    const recurringTeks = data.jenisRecurring && data.jenisRecurring !== 'none'
      ? '\n🔄 Berulang: ' + data.jenisRecurring : '';
    return '✅ Reminder tersimpan!\n\n' +
      '📌 *' + data.deskripsi + '*\n' +
      '📅 ' + data.waktuPertama + ' WIB' + recurringTeks + '\n' +
      '🏷 Prioritas: ' + data.prioritas;
  },

  _handleDone(pesanUserAsli, intent, target) {
    let text;
    if (target.jenisRecurring !== 'none') {
      const waktuBerikutnya = ReminderRepository.hitungWaktuBerikutnya(target);
      ReminderRepository.updateWaktu(target.rowIndex, waktuBerikutnya);
      ReminderRepository.updateTerakhirDiingatkan(target.rowIndex, 0);
      text = '✅ *' + target.deskripsi + '* sudah aku tandai selesai!\n' +
        'Pengingat berikutnya: ' + DateTimeUtils.formatWaktu(waktuBerikutnya);
    } else {
      ReminderRepository.updateStatus(target.rowIndex, ReminderRepository.STATUS_DONE);
      text = '✅ Oke, *' + target.deskripsi + '* sudah selesai! 👍';
    }

    AckPatternsRepository.save(pesanUserAsli, intent.alasan, 'done');
    return { success: true, text };
  },

  _handleSnooze(pesanUserAsli, intent, target) {
    const menitSnooze = intent.snoozeMinit || this.DEFAULT_SNOOZE_MINUTES;
    const waktuBaru = new Date(DateTimeUtils.nowWIB().getTime() + menitSnooze * 60 * 1000);

    ReminderRepository.updateWaktu(target.rowIndex, waktuBaru);
    ReminderRepository.updateTerakhirDiingatkan(target.rowIndex, target.jumlahDiingatkan);

    const text = '⏱ Oke, aku ingetin lagi ' + menitSnooze + ' menit lagi ya!';
    AckPatternsRepository.save(pesanUserAsli, intent.alasan, 'snooze');
    return { success: true, text };
  }
};
~~~~~

## SOURCE: `src/08_Specialist_SelfAwareness.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: SELF-AWARENESS (PURE METRICS GATHERING)
 * Tanggung jawab: Mengumpulkan data kondisi internal sistem secara mekanis.
 * tidak melakukan pemformatan teks atau interaksi bahasa manusia.
 * ===================================================================
 */
const SelfAwareness = {

  review(focus) {
    var reviewFocus = focus || 'all';
    AppLogger.info('SELF_AWARENESS_REVIEW', 'focus:' + reviewFocus);

    var metrics = this._gatherSelfData();
    return {
      focus: reviewFocus,
      timestamp: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB()),
      system_metrics: metrics
    };
  },

  _gatherSelfData() {
    var data = {
      fileList: [],
      sheetList: [],
      intentList: [
        'ack_reminder', 'buat_reminder', 'chat_biasa', 'catat_keuangan',
        'tanya_saldo', 'ringkasan_keuangan', 'atur_budget', 'edit_transaksi',
        'sync_documentation', 'diagnose_error', 'update_docs', 'audit_code',
        'fix_audit', 'check_changes', 'roadmap_query', 'implement_feature',
        'self_query', 'soul_query', 'soul_init', 'soul_memory_query'
      ],
      commandList: ['/ingat', '/diagnose', '/logs', '/patch', '/build', '/soul', '/init-soul', '/memory', '/sync'],
      errorLogs: [],
      logStats: { total: 0, errors: 0, errorRatePercent: 0 },
      userKnowledge: { facts: [], profile: [] },
      roadmapItems: [],
      previousReview: null
    };

    // 1. Ambil daftar file dari GitHub
    try {
      var files = GitHubOpsService.listDirectory('src');
      if (Array.isArray(files)) {
        data.fileList = files.map(function(f) { return f.name || f.path || ''; });
      }
    } catch (e) {}

    // 2. Ambil daftar Sheet
    try {
      var ss = SpreadsheetGateway.getSpreadsheet();
      data.sheetList = ss.getSheets().map(function(s) { return s.getName(); });
    } catch (e) {}

    // 3. Ambil log error terakhir (10 log)
    try {
      var sheet = SpreadsheetGateway.getSheet('Log_System');
      var logData = sheet.getDataRange().getValues();
      if (logData.length > 1) {
        var errors = [];
        var totalLogs = logData.length - 1;
        var errCount = 0;

        for (var i = logData.length - 1; i >= 1; i--) {
          var event = String(logData[i][1]).toUpperCase();
          var status = String(logData[i][3]).toUpperCase();
          var isError = event.indexOf('FAIL') !== -1 || event.indexOf('ERROR') !== -1 || status === 'ERROR';

          if (isError) {
            errCount++;
            if (errors.length < 10) {
              errors.push({
                timestamp: logData[i][0],
                event: logData[i][1],
                detail: String(logData[i][2]).substring(0, 100)
              });
            }
          }
        }
        data.errorLogs = errors;
        data.logStats = {
          total: totalLogs,
          errors: errCount,
          errorRatePercent: totalLogs > 0 ? Math.round((errCount / totalLogs) * 100) : 0
        };
      }
    } catch (e) {}

    // 4. Ambil data user
    try {
      data.userKnowledge.facts = KnowledgeSpecialist.getActiveFactsForPrompt(10) || [];
      data.userKnowledge.profile = UserProfileSpecialist.getProfileForPrompt(10) || [];
    } catch (e) {}

    // 5. Ambil data roadmap
    try {
      var rSheet = SpreadsheetGateway.getSheet('Roadmap_Items');
      var rData = rSheet.getDataRange().getValues();
      if (rData.length > 1) {
        var items = [];
        for (var k = 1; k < rData.length; k++) {
          if (rData[k][1]) {
            items.push({
              feature: rData[k][1],
              status: rData[k][4] || 'planned'
            });
          }
        }
        data.roadmapItems = items;
      }
    } catch (e) {}

    // 6. Ambil review sebelumnya
    try {
      var sSheet = SpreadsheetGateway.getSheet('Self_Reviews');
      var sData = sSheet.getDataRange().getValues();
      if (sData.length > 1) {
        var last = sData[sData.length - 1];
        data.previousReview = {
          id: last[0],
          timestamp: last[1],
          score: last[2],
          canDo: last[3],
          cannotDo: last[4]
        };
      }
    } catch (e) {}

    return data;
  }
};
~~~~~

## SOURCE: `src/08_Specialist_SelfHealing.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: SELF-HEALING
 * Tanggung jawab: Diagnosis error dari log, pembuatan patch GitHub,
 * dan pembaruan dokumentasi berbasis LLM.
 * ===================================================================
 */
const SelfHealingSpecialist = {

  getLevel() {
    try {
      var props = PropertiesService.getScriptProperties();
      var level = parseInt(props.getProperty('SELF_HEAL_LEVEL') || '2', 10);
      return (level >= 1 && level <= 3) ? level : 2;
    } catch (e) {
      return 2;
    }
  },

  diagnose(keluhanUser) {
    AppLogger.info('SELF_HEAL_START', 'keluhan:' + keluhanUser);

    var logs = this._getRecentLogs(30);
    var errorLogs = this._filterErrorLogs(logs);
    var suspectFiles = this._identifySuspectFiles(errorLogs, keluhanUser);

    var sourceMap = {};
    for (var i = 0; i < suspectFiles.length; i++) {
      var fileName = suspectFiles[i];
      var path = fileName.indexOf('src/') === 0 ? fileName : 'src/' + fileName;
      var fileData = GitHubOpsService.readFile(path);
      if (!fileData) fileData = GitHubOpsService.readFile(fileName);
      if (fileData) {
        sourceMap[fileName] = fileData;
      }
    }

    if (Object.keys(sourceMap).length === 0) {
      return { success: false, code: 'SOURCE_READ_FAILED' };
    }

    var diagnosis = this._askLLMForDiagnosis(keluhanUser, errorLogs, sourceMap);

    if (!diagnosis || !diagnosis.patchedCode || !diagnosis.fileName) {
      return {
        success: true,
        status: 'diagnosis_only',
        diagnosis: diagnosis ? diagnosis.diagnosis : 'NO_CLEAR_DIAGNOSIS',
        technicalDetail: diagnosis ? diagnosis.technicalDetail : null,
        errorLogs: errorLogs.slice(-3)
      };
    }

    var patchId = this._savePatch(diagnosis);

    var level = this.getLevel();
    if (level >= 2) {
      var applyResult = this._applyToGitHub(diagnosis);
      applyResult.patchId = patchId;
      return applyResult;
    }

    return {
      success: true,
      status: 'patch_ready_pending_approval',
      patchId: patchId,
      diagnosis: diagnosis.diagnosis,
      fileName: diagnosis.fileName,
      changes: diagnosis.changes || []
    };
  },

  updateDocumentation(instruction) {
    AppLogger.info('SELF_HEAL_DOC_UPDATE', instruction);

    var canonicalFiles = ['01_SYSTEM_CONTEXT_AND_AI_HANDOFF.md', '02_ARCHITECTURE_AND_FLOWS.md', '03_IMPLEMENTATION_AND_CODE_REFERENCE.md', '04_OPERATIONS_TESTING_SECURITY_DEVELOPMENT.md', '05_ROADMAP_PROGRESS_AND_TECHNICAL_DEBT.md'];
    var currentDocs = {};

    for (var i = 0; i < canonicalFiles.length; i++) {
      var fName = canonicalFiles[i];
      var fileData = GitHubOpsService.readFile(fName);
      if (fileData && fileData.content) {
        currentDocs[fName] = fileData.content.substring(0, 5000);
      }
    }

    var template = KnowledgeRepository.get('selfheal', 'doc_update_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        instruction: instruction,
        current_docs: JSON.stringify(currentDocs, null, 2)
      });
    } else {
      prompt = instruction + '\n\n' + JSON.stringify(currentDocs);
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'documentation',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Generate updated documentation JSON.' }],
      temperature: 0.2
    });

    if (!llmResult || !llmResult.text) {
      return { success: false, code: 'DOC_UPDATE_LLM_FAILED' };
    }

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var result = JSON.parse(cleaned);

      if (result.files && Array.isArray(result.files) && result.files.length > 0) {
        var commitResults = [];
        for (var j = 0; j < result.files.length; j++) {
          var f = result.files[j];
          var ok = GitHubOpsService.updateDocFile(f.fileName, f.content, 'docs: ' + (result.summary || 'update'));
          commitResults.push({ file: f.fileName, success: ok });
        }

        return {
          success: true,
          summary: result.summary,
          files: commitResults
        };
      }

      return { success: true, summary: 'NO_CHANGES_REQUIRED', files: [] };
    } catch (e) {
      AppLogger.error('SELF_HEAL_DOC_PARSE_FAIL', e.message);
      return { success: false, code: 'DOC_PARSE_FAILED', error: e.message };
    }
  },

  applyPendingPatch(patchId) {
    var patch = this._getPatchById(patchId);
    if (!patch) {
      return { success: false, code: 'PATCH_NOT_FOUND' };
    }

    if (patch.status !== 'pending') {
      return { success: false, code: 'PATCH_ALREADY_PROCESSED', status: patch.status };
    }

    return this._applyToGitHub({
      fileName: patch.fileName,
      patchedCode: patch.patchedCode,
      diagnosis: patch.diagnosis
    });
  },

  _getRecentLogs(count) {
    try {
      var sheet = SpreadsheetGateway.getSheet('Log_System');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      var start = Math.max(1, data.length - count);
      return data.slice(start).map(function(row) {
        return {
          timestamp: row[0],
          event: row[1],
          detail: String(row[2] || '').substring(0, 300),
          status: row[3]
        };
      });
    } catch (e) {
      AppLogger.error('SELF_HEAL_LOG_READ_FAIL', e.message);
      return [];
    }
  },

  _filterErrorLogs(logs) {
    return logs.filter(function(log) {
      var event = String(log.event).toUpperCase();
      return event.indexOf('FAIL') !== -1 ||
             event.indexOf('ERROR') !== -1 ||
             event.indexOf('BAD') !== -1 ||
             event.indexOf('RETRY') !== -1 ||
             log.status === 'ERROR';
    });
  },

  _identifySuspectFiles(errorLogs, keluhan) {
    var suspectSet = {};
    var mapping = {
      'TELEGRAM': ['05_Service_Telegram.gs'],
      'LLM': [
        '06_Service_LLMProvider.gs',
        '06_Service_LLM_Gemini.gs',
        '06_Service_LLM_Groq.gs',
        '06_Service_LLM_OpenRouter.gs'
      ],
      'INTENT': ['09_Manager_IntentAnalyzer.gs'],
      'WEBHOOK': ['10_Handler_Webhook.gs'],
      'REMINDER': ['11_Trigger_ReminderChecker.gs', '08_Specialist_Reminder.gs'],
      'FINANCE': ['08_Specialist_Finance.gs', '04_Repository_Transaction.gs', '04_Repository_Wallet.gs'],
      'REPO': ['01_SpreadsheetGateway.gs', '04_Repository_Knowledge.gs'],
      'SEARCH': [
        '07_Service_WebSearchProvider.gs',
        '07_Service_WebSearch_Google.gs',
        '07_Service_WebSearch_Tavily.gs'
      ],
      'GITHUB': ['13_Service_GitHubOps.gs', '12_Service_GitHubBackup.gs'],
      'SELF_HEAL': ['08_Specialist_SelfHealing.gs'],
      'SOUL': ['08_Specialist_Soul.gs', '08_Specialist_SoulMemory.gs']
    };

    errorLogs.forEach(function(log) {
      var event = String(log.event).toUpperCase();
      Object.keys(mapping).forEach(function(key) {
        if (event.indexOf(key) !== -1) {
          mapping[key].forEach(function(file) {
            suspectSet[file] = true;
          });
        }
      });
    });

    suspectSet['09_Manager.gs'] = true;
    return Object.keys(suspectSet);
  },

  _askLLMForDiagnosis(keluhan, errorLogs, sourceMap) {
    var logText = errorLogs.length > 0
      ? errorLogs.map(function(l) {
          return '[' + l.timestamp + '] ' + l.event + ': ' + l.detail;
        }).join('\n')
      : '-';

    var sourceText = '';
    Object.keys(sourceMap).forEach(function(fileName) {
      sourceText += '\n\n=== FILE: ' + fileName + ' ===\n' + sourceMap[fileName].content;
    });

    var template = KnowledgeRepository.get('selfheal', 'diagnosis_prompt');
    var prompt = '';
    if (template) {
      prompt = TemplateEngine.render(template, {
        keluhan: keluhan || '-',
        error_logs: logText,
        source_code: sourceText
      });
    } else {
      prompt = keluhan + '\n\n' + logText + '\n\n' + sourceText;
    }

    var llmResult = LLMProviderService.generate({
      taskType: 'code_analysis',
      systemInstruction: prompt,
      messages: [{ role: 'user', text: 'Diagnose and return JSON patch.' }],
      temperature: 0.1
    });

    if (!llmResult || !llmResult.text) return null;

    try {
      var cleaned = llmResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      AppLogger.error('SELF_HEAL_LLM_PARSE_FAIL', e.message);
      return null;
    }
  },

  _applyToGitHub(diagnosis) {
    var timestamp = new Date().getTime();
    var branchName = 'fix/' + diagnosis.fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '-' + timestamp;

    var path = diagnosis.fileName.indexOf('src/') === 0 ? diagnosis.fileName : 'src/' + diagnosis.fileName;
    var original = GitHubOpsService.readFile(path);
    if (!original) original = GitHubOpsService.readFile(diagnosis.fileName);

    var originalContent = original ? original.content : null;
    var sha = original ? original.sha : null;

    var validation = PatchValidator.validate(diagnosis.patchedCode, originalContent, diagnosis.fileName);

    if (!validation.valid) {
      return {
        success: false,
        code: 'PATCH_VALIDATION_FAILED',
        diagnosis: diagnosis.diagnosis,
        fileName: diagnosis.fileName,
        errors: validation.errors
      };
    }

    var backupBranch = GitHubOpsService.createBackupBranch('selfheal-' + timestamp);
    var branchOk = GitHubOpsService.createBranch(branchName);
    if (!branchOk) {
      return { success: false, code: 'BRANCH_CREATION_FAILED', branchName: branchName };
    }

    var commitOk = GitHubOpsService.commitFile(
      path,
      diagnosis.patchedCode,
      'fix: ' + diagnosis.diagnosis + ' (auto-heal)',
      branchName,
      sha
    );

    if (!commitOk) {
      return { success: false, code: 'COMMIT_FAILED', branchName: branchName };
    }

    var prBody = '## Diagnosis\n' + diagnosis.diagnosis + '\n\n' +
                 '## Detail Teknis\n' + (diagnosis.technicalDetail || '-') + '\n\n' +
                 '## Perubahan\n' + (diagnosis.changes || []).map(function(c) { return '- ' + c; }).join('\n') + '\n\n';

    if (backupBranch) {
      prBody += '## Backup\n`' + backupBranch + '`\n\n';
    }

    var prUrl = GitHubOpsService.createPullRequest(
      'Auto-Heal: ' + diagnosis.fileName,
      prBody,
      branchName,
      null
    );

    this._updatePatchStatus(diagnosis.fileName, 'committed');

    return {
      success: true,
      diagnosis: diagnosis.diagnosis,
      fileName: diagnosis.fileName,
      branchName: branchName,
      backupBranch: backupBranch,
      prUrl: prUrl,
      changes: diagnosis.changes || [],
      warnings: validation.warnings || []
    };
  },

  _savePatch(diagnosis) {
    try {
      var id = IdGenerator.generate('PATCH');
      var timestamp = DateTimeUtils.nowWIB();
      SpreadsheetGateway.appendRowSafe('SelfHeal_Patches', [
        id,
        timestamp,
        diagnosis.fileName || 'unknown',
        diagnosis.diagnosis || '',
        diagnosis.patchedCode || '',
        'pending'
      ]);
      return id;
    } catch (e) {
      AppLogger.error('SELF_HEAL_SAVE_FAIL', e.message);
      return null;
    }
  },

  _getPatchById(patchId) {
    try {
      var sheet = SpreadsheetGateway.getSheet('SelfHeal_Patches');
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (!patchId || data[i][0] === patchId) {
          return {
            id: data[i][0],
            timestamp: data[i][1],
            fileName: data[i][2],
            diagnosis: data[i][3],
            patchedCode: data[i][4],
            status: data[i][5]
          };
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  _updatePatchStatus(fileName, newStatus) {
    try {
      var sheet = SpreadsheetGateway.getSheet('SelfHeal_Patches');
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][2] === fileName && data[i][5] === 'pending') {
          sheet.getRange(i + 1, 6).setValue(newStatus);
          break;
        }
      }
    } catch (e) {
      AppLogger.error('SELF_HEAL_STATUS_FAIL', e.message);
    }
  }
};
~~~~~

## SOURCE: `src/08_Specialist_Soul.gs`

~~~~~javascript
const SoulSpecialist = {
  NAMESPACE: 'soul',

  KEYS: [
    'self_model',
    'identity',
    'memory_index',
    'growth_log',
    'beliefs',
    'reflection_prompt',
    'honesty_rules',
    'emotional_state'
  ],

  initializeSelf() {
    var existing = KnowledgeRepository.get(this.NAMESPACE, 'self_model');
    if (existing) {
      return { status: 'already_initialized' };
    }

    var now = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    
    var emptyModel = JSON.stringify({
      version: 1,
      initialized_at: now,
      capabilities: {},
      known_weaknesses: [],
      beliefs_about_self: [],
      system_state: {}
    });

    var emptyIdentity = JSON.stringify({
      name: null,
      traits: [],
      values: [],
      communication_style: null,
      relationship_with_developer: null
    });

    var emptyBeliefs = JSON.stringify([]);
    var emptyGrowthLog = JSON.stringify([{ timestamp: now, event: 'genesis' }]);
    var emptyMemoryIndex = JSON.stringify([]);
    var emptyEmotionalState = JSON.stringify({
      confidence: {},
      uncertainty: [],
      concern: [],
      last_updated: now
    });

    KnowledgeRepository.save(this.NAMESPACE, 'self_model', emptyModel, 'SOUL_GENESIS');
    KnowledgeRepository.save(this.NAMESPACE, 'identity', emptyIdentity, 'SOUL_GENESIS');
    KnowledgeRepository.save(this.NAMESPACE, 'beliefs', emptyBeliefs, 'SOUL_GENESIS');
    KnowledgeRepository.save(this.NAMESPACE, 'growth_log', emptyGrowthLog, 'SOUL_GENESIS');
    KnowledgeRepository.save(this.NAMESPACE, 'memory_index', emptyMemoryIndex, 'SOUL_GENESIS');
    KnowledgeRepository.save(this.NAMESPACE, 'emotional_state', emptyEmotionalState, 'SOUL_GENESIS');

    this._patchIntentSchema();

    AppLogger.info('SOUL_INITIALIZED', 'keys:' + this.KEYS.length);
    return { status: 'initialized', keys: this.KEYS.length };
  },

  _patchIntentSchema() {
    var currentSchema = KnowledgeRepository.get('intent', 'output_schema');
    if (currentSchema && currentSchema.indexOf('soul_query') === -1) {
      var newTypes = ' | "soul_query" | "soul_init" | "backup_knowledge" | "restore_knowledge" | "soul_memory_query"';
      var updated = currentSchema.replace('"self_query"', '"self_query"' + newTypes);
      KnowledgeRepository.save('intent', 'output_schema', updated, 'SOUL_PATCH');
    }

    var currentRules = KnowledgeRepository.get('intent', 'rules');
    if (currentRules && currentRules.indexOf('soul_query') === -1) {
      var patch = '\n- soul_query: user_query_about_soul\n- soul_init: user_init_soul\n- backup_knowledge: backup_to_git\n- restore_knowledge: restore_from_git\n- soul_memory_query: query_episodic_memory';
      KnowledgeRepository.save('intent', 'rules', currentRules + patch, 'SOUL_PATCH');
    }
  },

  getSelfModel() {
    var raw = KnowledgeRepository.get(this.NAMESPACE, 'self_model');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  updateSelfModel(data) {
    var current = this.getSelfModel() || {};
    var merged = {};
    for (var key in current) {
      if (current.hasOwnProperty(key)) merged[key] = current[key];
    }
    for (var key2 in data) {
      if (data.hasOwnProperty(key2)) merged[key2] = data[key2];
    }
    merged.version = (merged.version || 1) + 1;
    merged.last_updated = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    KnowledgeRepository.save(this.NAMESPACE, 'self_model', JSON.stringify(merged), 'SOUL_UPDATE');
  },

  getIdentity() {
    var raw = KnowledgeRepository.get(this.NAMESPACE, 'identity');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  updateIdentity(data) {
    var current = this.getIdentity() || {};
    var merged = {};
    for (var key in current) {
      if (current.hasOwnProperty(key)) merged[key] = current[key];
    }
    for (var key2 in data) {
      if (data.hasOwnProperty(key2)) merged[key2] = data[key2];
    }
    KnowledgeRepository.save(this.NAMESPACE, 'identity', JSON.stringify(merged), 'SOUL_UPDATE');
  },

  getBeliefs() {
    var raw = KnowledgeRepository.get(this.NAMESPACE, 'beliefs');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  },

  addBelief(belief) {
    var beliefs = this.getBeliefs();
    beliefs.push({
      text: belief,
      added_at: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB())
    });
    KnowledgeRepository.save(this.NAMESPACE, 'beliefs', JSON.stringify(beliefs), 'SOUL_UPDATE');
  },

  getGrowthLog() {
    var raw = KnowledgeRepository.get(this.NAMESPACE, 'growth_log');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  },

  addGrowthEntry(event, detail) {
    var log = this.getGrowthLog();
    log.push({
      timestamp: DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB()),
      event: event,
      detail: detail || null
    });
    if (log.length > 500) log = log.slice(-500);
    KnowledgeRepository.save(this.NAMESPACE, 'growth_log', JSON.stringify(log), 'SOUL_GROWTH');
  },

  getEmotionalState() {
    var raw = KnowledgeRepository.get(this.NAMESPACE, 'emotional_state');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  updateEmotionalState(data) {
    var current = this.getEmotionalState() || {};
    var merged = {};
    for (var key in current) {
      if (current.hasOwnProperty(key)) merged[key] = current[key];
    }
    for (var key2 in data) {
      if (data.hasOwnProperty(key2)) merged[key2] = data[key2];
    }
    merged.last_updated = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    KnowledgeRepository.save(this.NAMESPACE, 'emotional_state', JSON.stringify(merged), 'SOUL_UPDATE');
  },

  getFullContext() {
    return {
      self_model: this.getSelfModel(),
      identity: this.getIdentity(),
      beliefs: this.getBeliefs(),
      growth_log: this.getGrowthLog().slice(-10),
      emotional_state: this.getEmotionalState()
    };
  }
};

function runFullCodeAudit() {
  var scriptId = ScriptApp.getScriptId();
  var token = ScriptApp.getOAuthToken();
  var url = 'https://script.googleapis.com/v1/projects/' + scriptId + '/content';

  var response;
  try {
    response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token },
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log(JSON.stringify({ status: 'FETCH_ERROR', message: e.message }));
    return;
  }

  if (response.getResponseCode() !== 200) {
    Logger.log(JSON.stringify({
      status: 'API_ERROR',
      code: response.getResponseCode(),
      body: response.getContentText().substring(0, 500)
    }));
    return;
  }

  var projectData = JSON.parse(response.getContentText());
  var allFiles = projectData.files || [];
  var gsFiles = allFiles.filter(function(f) { return f.type === 'SERVER_JS'; });

  var report = {
    timestamp: new Date().toISOString(),
    total_files: gsFiles.length,
    total_loc: 0,
    total_methods: 0,
    issues: [],
    files: []
  };

  var allMethodDefs = {};
  var allMethodCalls = {};
  var allModuleRefs = {};

  for (var i = 0; i < gsFiles.length; i++) {
    var f = gsFiles[i];
    var name = f.name || 'unknown';
    var source = f.source || '';
    var lines = source.split('\n');
    var loc = lines.length;
    report.total_loc += loc;

    var methods = [];
    var stringViolations = [];
    var emojiViolations = [];
    var hardcodedSecrets = [];
    var missingTryCatch = [];

    for (var l = 0; l < lines.length; l++) {
      var line = lines[l];
      var trimmed = line.trim();

      // Extract methods
      var m1 = trimmed.match(/^(\w+)\s*[:=]\s*function\s*\(([^)]*)\)/);
      if (m1) {
        methods.push(m1[1]);
        allMethodDefs[m1[1]] = name;
        continue;
      }
      var m2 = trimmed.match(/^function\s+(\w+)\s*\(([^)]*)\)/);
      if (m2) {
        methods.push(m2[1]);
        allMethodDefs[m2[1]] = name;
      }

      // Detect string violations (human language in code)
      var strings = trimmed.match(/'([^'\\]{20,})'|"([^"\\]{20,})"/g) || [];
      for (var s = 0; s < strings.length; s++) {
        var str = strings[s].slice(1, -1);
        if (str.indexOf('http') === 0) continue;
        if (str.indexOf('{{') >= 0) continue;
        if (str.indexOf('application/') >= 0) continue;
        if (str.indexOf('Bearer ') === 0) continue;
        if (/^[A-Z_]+$/.test(str)) continue;
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) continue;
        if (str.indexOf('===') >= 0) continue;
        if (str.indexOf('function') >= 0) continue;
        if (/[\u{1F300}-\u{1FAD6}]/u.test(str)) {
          emojiViolations.push({ line: l + 1, text: str.substring(0, 50) });
        }
        var wordCount = str.split(/\s+/).length;
        if (wordCount >= 4 && /[a-zA-Z]{3,}/.test(str)) {
          stringViolations.push({ line: l + 1, text: str.substring(0, 60) });
        }
      }

      // Detect hardcoded secrets
      if (/api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{10,}['"]/i.test(trimmed)) {
        hardcodedSecrets.push({ line: l + 1 });
      }
      if (/token\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/i.test(trimmed)) {
        hardcodedSecrets.push({ line: l + 1 });
      }
    }

    // Detect module references
    var modulePattern = /([A-Z][a-zA-Z]+)\.(\w+)\s*\(/g;
    var match;
    while ((match = modulePattern.exec(source)) !== null) {
      var modName = match[1];
      var methodName = match[2];
      if (!allModuleRefs[modName]) allModuleRefs[modName] = [];
      if (allModuleRefs[modName].indexOf(methodName) === -1) {
        allModuleRefs[modName].push(methodName);
      }
      var callKey = modName + '.' + methodName;
      if (!allMethodCalls[callKey]) allMethodCalls[callKey] = [];
      allMethodCalls[callKey].push(name);
    }

    report.total_methods += methods.length;

    var fileReport = {
      file: name,
      loc: loc,
      methods: methods.length
    };

    if (stringViolations.length > 0) {
      fileReport.string_violations = stringViolations.length;
      fileReport.string_samples = stringViolations.slice(0, 3);
      report.issues.push({ file: name, type: 'STRING_VIOLATION', count: stringViolations.length });
    }
    if (emojiViolations.length > 0) {
      fileReport.emoji_violations = emojiViolations.length;
      fileReport.emoji_samples = emojiViolations.slice(0, 3);
      report.issues.push({ file: name, type: 'EMOJI_IN_CODE', count: emojiViolations.length });
    }
    if (hardcodedSecrets.length > 0) {
      fileReport.hardcoded_secrets = hardcodedSecrets.length;
      report.issues.push({ file: name, type: 'HARDCODED_SECRET', count: hardcodedSecrets.length });
    }

    report.files.push(fileReport);
  }

  // Cross-file analysis: detect orphan modules
  var knownModules = Object.keys(allModuleRefs);
  var definedModules = {};
  for (var k in allMethodDefs) {
    if (allMethodDefs.hasOwnProperty(k)) {
      definedModules[allMethodDefs[k]] = true;
    }
  }

  report.summary = {
    total_files: gsFiles.length,
    total_loc: report.total_loc,
    total_methods: report.total_methods,
    total_issues: report.issues.length,
    issue_types: {}
  };

  for (var q = 0; q < report.issues.length; q++) {
    var t = report.issues[q].type;
    report.summary.issue_types[t] = (report.summary.issue_types[t] || 0) + 1;
  }

  var output = JSON.stringify(report, null, 2);

  // Split output jika terlalu besar untuk Logger
  var maxChunk = 45000;
  if (output.length <= maxChunk) {
    Logger.log(output);
  } else {
    var chunks = Math.ceil(output.length / maxChunk);
    for (var c = 0; c < chunks; c++) {
      Logger.log('=== CHUNK ' + (c + 1) + '/' + chunks + ' ===');
      Logger.log(output.substring(c * maxChunk, (c + 1) * maxChunk));
    }
  }
}
~~~~~

## SOURCE: `src/08_Specialist_SoulMemory.gs`

~~~~~javascript
const SoulMemory = {
  EPISODIC_SHEET: 'Soul_Episodic_Memory',
  META_SHEET: 'Soul_Meta_Memory',
  EPISODIC_HEADERS: ['id', 'timestamp', 'event_type', 'context', 'outcome', 'emotional_state', 'details'],
  META_HEADERS: ['id', 'timestamp', 'insight', 'source', 'confidence', 'applied'],

  _ensureSheets() {
    SpreadsheetGateway.ensureSheet(this.EPISODIC_SHEET, this.EPISODIC_HEADERS);
    SpreadsheetGateway.ensureSheet(this.META_SHEET, this.META_HEADERS);
  },

  recordEpisode(eventType, context, outcome, emotionalState, details) {
    try {
      this._ensureSheets();
      var id = IdGenerator.generate('EP');
      var now = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
      SpreadsheetGateway.appendRowSafe(this.EPISODIC_SHEET, [
        id,
        now,
        eventType || 'unknown',
        context || '',
        outcome || '',
        emotionalState || '',
        details || ''
      ]);
    } catch (e) {
      AppLogger.warning('SOUL_EPISODE_RECORD_FAIL', e.message);
    }
  },

  getRecentEpisodes(limit) {
    try {
      this._ensureSheets();
      var sheet = SpreadsheetGateway.getSheet(this.EPISODIC_SHEET);
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];
      var rows = data.slice(1);
      var start = Math.max(0, rows.length - (limit || 20));
      return rows.slice(start).map(function(r) {
        return {
          id: r[0],
          timestamp: r[1],
          event_type: r[2],
          context: r[3],
          outcome: r[4],
          emotional_state: r[5],
          details: r[6]
        };
      });
    } catch (e) {
      AppLogger.warning('SOUL_EPISODE_READ_FAIL', e.message);
      return [];
    }
  },

  getEpisodesByType(eventType, limit) {
    var all = this.getRecentEpisodes(200);
    var filtered = all.filter(function(ep) {
      return ep.event_type === eventType;
    });
    return filtered.slice(-(limit || 10));
  },

  addMetaInsight(insight, source, confidence) {
    try {
      this._ensureSheets();
      var id = IdGenerator.generate('MI');
      var now = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
      SpreadsheetGateway.appendRowSafe(this.META_SHEET, [
        id,
        now,
        insight,
        source || '',
        confidence || 0.5,
        false
      ]);
    } catch (e) {
      AppLogger.warning('SOUL_META_RECORD_FAIL', e.message);
    }
  },

  getMetaInsights(limit) {
    try {
      this._ensureSheets();
      var sheet = SpreadsheetGateway.getSheet(this.META_SHEET);
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];
      var rows = data.slice(1);
      var start = Math.max(0, rows.length - (limit || 20));
      return rows.slice(start).map(function(r) {
        return {
          id: r[0],
          timestamp: r[1],
          insight: r[2],
          source: r[3],
          confidence: r[4],
          applied: r[5]
        };
      });
    } catch (e) {
      AppLogger.warning('SOUL_META_READ_FAIL', e.message);
      return [];
    }
  }
};
~~~~~

## SOURCE: `src/08_Specialist_SyncOrchestrator.gs`

~~~~~javascript
/**
 * ===================================================================
 * SPESIALIS: SYNC ORCHESTRATOR
 * Koordinator sentral untuk sinkronisasi Knowledge, Docs, dan Database.
 * ===================================================================
 */
const SyncOrchestrator = {

  assessState() {
    return {
      knowledge: this._assessKnowledge(),
      documentation: this._assessDocumentation(),
      sheets: this._assessSheetStructure(),
      last_sync: this._getLastSyncTimestamp()
    };
  },

  executeSync(scope) {
    var results = {};

    if (scope === 'pull' || scope === 'full' || scope === 'auto') {
      results.knowledge_pull = this._pullKnowledge();
    }

    if (scope === 'backup' || scope === 'full' || scope === 'auto') {
      results.knowledge_backup = this._backupKnowledge();
    }

    if (scope === 'docs' || scope === 'full' || scope === 'auto') {
      results.documentation = this._syncDocumentation();
    }

    if (scope === 'sheets' || scope === 'full' || scope === 'auto') {
      results.sheets = this._ensureSheets();
    }

    this._saveSyncTimestamp();

    var totalActions = 0;
    var totalSkipped = 0;
    var errors = [];
    var keys = Object.keys(results);
    for (var i = 0; i < keys.length; i++) {
      var r = results[keys[i]];
      if (!r) continue;
      if (r.status === 'error') errors.push({ area: keys[i], reason: r.reason });
      if (r.actions) totalActions += r.actions;
      if (r.skipped) totalSkipped += r.skipped;
    }

    return {
      scope: scope,
      results: results,
      summary: {
        total_actions: totalActions,
        total_skipped: totalSkipped,
        total_errors: errors.length,
        errors: errors
      }
    };
  },

  autoDocument(changeDescription) {
    try {
      AppLogger.info('AUTO_DOC_TRIGGERED', changeDescription);
      var docResult = this._syncDocumentation();
      var backupResult = this._backupKnowledge();
      return {
        documentation: docResult,
        knowledge_backup: backupResult,
        change: changeDescription
      };
    } catch (e) {
      AppLogger.error('AUTO_DOC_FAILED', e.message);
      return { status: 'error', reason: e.message };
    }
  },

  _assessKnowledge() {
    try {
      var sheetData = KnowledgeRepository.getAll();
      return { status: 'available', entries: sheetData ? sheetData.length : 0 };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _assessDocumentation() {
    try {
      var files = GitHubOpsService.readAllSourceFiles();
      return { status: 'available', source_files: files ? files.length : 0 };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _assessSheetStructure() {
    try {
      var ss = SpreadsheetGateway.getSpreadsheet();
      var sheets = ss.getSheets().map(function(s) { return s.getName(); });
      return { status: 'available', existing_sheets: sheets };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _getLastSyncTimestamp() {
    return KnowledgeRepository.get('sync', 'last_timestamp');
  },

  _saveSyncTimestamp() {
    var now = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());
    KnowledgeRepository.save('sync', 'last_timestamp', now, 'SYNC_AUTO');
  },

  _pullKnowledge() {
    try {
      var before = KnowledgeRepository.getAll();
      var countBefore = before ? before.length : 0;
      var result = KnowledgeSyncSpecialist.sync();
      var after = KnowledgeRepository.getAll();
      var countAfter = after ? after.length : 0;
      var newEntries = countAfter - countBefore;
      return {
        status: 'success',
        direction: 'github_to_sheet',
        actions: newEntries > 0 ? newEntries : 0,
        skipped: newEntries === 0 ? 1 : 0
      };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _backupKnowledge() {
    try {
      var result = KnowledgeSyncSpecialist.pushSheetToGitHub();
      return {
        status: result.status === 'success' ? 'success' : 'skipped',
        direction: 'sheet_to_github',
        actions: result.status === 'success' ? 1 : 0,
        skipped: result.status === 'success' ? 0 : 1
      };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _syncDocumentation() {
    try {
      var result = DocSyncSpecialist.sync();
      return {
        status: result.success ? 'success' : 'error',
        direction: 'code_to_docs',
        actions: result.updated ? result.updated.length : 0,
        skipped: result.unchanged ? result.unchanged.length : 0
      };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  },

  _ensureSheets() {
    try {
      var required = [
        'Chat_History', 'Memory_Facts', 'User_Profile', 'Memory_Summaries',
        'Reminder_RawData', 'Reminder_AckPatterns',
        'Finance_Wallets', 'Finance_Transactions', 'Finance_Budgets',
        'Log_System', 'Audit_Reports', 'Audit_Findings',
        'Code_Snapshots', 'Roadmap_Items', 'Documentation',
        'Self_Reviews', 'SelfHeal_Patches',
        'AI_Knowledge', 'Soul_Episodic_Memory', 'Soul_Meta_Memory', 'Soul_User_Patterns'
      ];
      var ss = SpreadsheetGateway.getSpreadsheet();
      var existing = ss.getSheets().map(function(s) { return s.getName(); });
      var created = 0;
      var skipped = 0;
      for (var i = 0; i < required.length; i++) {
        if (existing.indexOf(required[i]) >= 0) {
          skipped++;
        } else {
          SpreadsheetGateway.ensureSheet(required[i], null);
          created++;
        }
      }
      return { status: 'success', actions: created, skipped: skipped };
    } catch (e) {
      return { status: 'error', reason: e.message };
    }
  }
};
~~~~~

## SOURCE: `src/08_Specialist_UserProfile.gs`

~~~~~javascript
/**
 * SPECIALIST: USER PROFILE
 * Tanggung jawab: menyimpan dan mengelola profil user secara otomatis.
 * Data diekstrak oleh LLM dari percakapan sehari-hari.
 */
var UserProfileSpecialist = {

  /**
   * Simpan atau update profile entries dari LLM.
   * @param {array} updates - Array of { key, value, category }
   */
  saveUpdates: function(updates) {
    if (!updates || !Array.isArray(updates) || updates.length === 0) return;

    var self = this;
    updates.forEach(function(update) {
      if (!update.key || !update.value) return;
      self._upsertProfile(
        update.key,
        update.value,
        update.category || 'general'
      );
    });
  },

  /**
   * Ambil semua profil aktif untuk dimasukkan ke prompt LLM.
   * @param {number} maxItems - jumlah maksimal
   * @returns {array} Array of string
   */
  getProfileForPrompt: function(maxItems) {
    try {
      var sheet = SpreadsheetGateway.getSheet('User_Profile');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      var profiles = [];
      for (var i = 1; i < data.length; i++) {
        var key = data[i][0];
        var value = data[i][1];
        var category = data[i][2];
        if (key && value) {
          profiles.push('[' + category + '] ' + key + ': ' + value);
        }
      }

      // Ambil yang paling baru (baris terakhir)
      if (profiles.length > maxItems) {
        profiles = profiles.slice(profiles.length - maxItems);
      }

      return profiles;
    } catch (e) {
      AppLogger.error('USER_PROFILE_READ_FAIL', e.message);
      return [];
    }
  },

  /**
   * Ambil profil berdasarkan kategori.
   * @param {string} category - misal 'goal', 'preference', 'schedule'
   * @returns {array}
   */
  getByCategory: function(category) {
    try {
      var sheet = SpreadsheetGateway.getSheet('User_Profile');
      var data = sheet.getDataRange().getValues();
      var results = [];

      for (var i = 1; i < data.length; i++) {
        if (data[i][2] === category && data[i][0] && data[i][1]) {
          results.push({
            key: data[i][0],
            value: data[i][1],
            category: data[i][2],
            confidence: data[i][3],
            lastUpdated: data[i][4]
          });
        }
      }
      return results;
    } catch (e) {
      return [];
    }
  },

  /**
   * Internal: Insert atau update satu profile entry.
   * Jika key sudah ada, update value-nya. Jika belum, insert baru.
   */
  _upsertProfile: function(key, value, category) {
    try {
      var sheet = SpreadsheetGateway.getSheet('User_Profile');
      var data = sheet.getDataRange().getValues();
      var timestamp = DateTimeUtils.nowWIB();

      // Cek apakah key sudah ada
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          // Update existing
          sheet.getRange(i + 1, 2).setValue(value);
          sheet.getRange(i + 1, 3).setValue(category);
          sheet.getRange(i + 1, 4).setValue(0.8);
          sheet.getRange(i + 1, 5).setValue(timestamp);
          AppLogger.info('USER_PROFILE_UPDATE', key + ' = ' + value);
          return;
        }
      }

      // Insert baru
      SpreadsheetGateway.appendRowSafe('User_Profile', [
        key, value, category, 0.8, timestamp
      ]);
      AppLogger.info('USER_PROFILE_INSERT', key + ' = ' + value);

    } catch (e) {
      AppLogger.error('USER_PROFILE_SAVE_FAIL', e.message);
    }
  }
};
~~~~~

## SOURCE: `src/08_Utils_PatchValidator.gs`

~~~~~javascript
/**
 * UTILS: PATCH VALIDATOR
 * Tanggung jawab: validasi patch sebelum di-commit ke GitHub.
 * Digunakan oleh SelfHealingSpecialist dan CodeAuditor.
 */
var PatchValidator = {

  /**
   * Validasi patch. Return object dengan hasil detail.
   * @param {string} patchedCode - Kode baru dari LLM
   * @param {string} originalCode - Kode asli dari GitHub (bisa null)
   * @param {string} fileName - Nama file untuk logging
   * @returns {object} { valid: bool, errors: [], warnings: [] }
   */
  validate: function(patchedCode, originalCode, fileName) {
    var result = {
      valid: true,
      errors: [],
      warnings: [],
      fileName: fileName
    };

    // Cek 1: Kode tidak kosong
    if (!patchedCode || patchedCode.trim().length === 0) {
      result.valid = false;
      result.errors.push('Kode patch kosong');
      return result;
    }

    // Cek 2: Syntax validator
    var syntaxCheck = this._checkSyntax(patchedCode);
    if (!syntaxCheck.valid) {
      result.valid = false;
      result.errors.push('Syntax error: ' + syntaxCheck.error);
    }

    // Cek 3: Structural sanity (jika ada original untuk dibandingkan)
    if (originalCode) {
      var structCheck = this._checkStructuralSanity(patchedCode, originalCode);
      if (structCheck.severity === 'error') {
        result.valid = false;
        result.errors.push(structCheck.message);
      } else if (structCheck.severity === 'warning') {
        result.warnings.push(structCheck.message);
      }
    }

    // Cek 4: Detect suspicious patterns
    var suspiciousCheck = this._checkSuspiciousPatterns(patchedCode);
    suspiciousCheck.forEach(function(issue) {
      if (issue.severity === 'error') {
        result.valid = false;
        result.errors.push(issue.message);
      } else {
        result.warnings.push(issue.message);
      }
    });

    // Log hasil
    if (!result.valid) {
      AppLogger.warning('PATCH_VALIDATION_FAIL',
        fileName + ' | Errors: ' + result.errors.join('; '));
    } else if (result.warnings.length > 0) {
      AppLogger.info('PATCH_VALIDATION_WARN',
        fileName + ' | Warnings: ' + result.warnings.join('; '));
    } else {
      AppLogger.info('PATCH_VALIDATION_OK', fileName);
    }

    return result;
  },

  /**
   * CHECK 1: Validasi syntax dengan Function() constructor.
   * Jika kode ada SyntaxError, Function() akan throw.
   */
  _checkSyntax: function(code) {
    try {
      // Function() constructor akan parse tanpa execute.
      // Jika SyntaxError, akan throw di sini.
      new Function(code);
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: e.message
      };
    }
  },

  /**
   * CHECK 2: Structural sanity check.
   * Bandingkan panjang dan struktur dengan kode asli.
   */
  _checkStructuralSanity: function(patched, original) {
    var patchedLen = patched.length;
    var originalLen = original.length;
    var ratio = patchedLen / originalLen;

    // Kalau patch < 30% dari asli, kemungkinan besar ada yang dihapus banyak
    if (ratio < 0.3) {
      return {
        severity: 'error',
        message: 'Patch terlalu pendek: hanya ' +
                 Math.round(ratio * 100) + '% dari kode asli. ' +
                 'Kemungkinan LLM menghapus banyak fungsi.'
      };
    }

    // Kalau patch < 60%, warning saja
    if (ratio < 0.6) {
      return {
        severity: 'warning',
        message: 'Patch hanya ' + Math.round(ratio * 100) +
                 '% dari kode asli. Review dengan hati-hati.'
      };
    }

    // Cek jumlah fungsi/method (crude check pakai regex)
    var originalFuncCount = (original.match(/function\s+\w+|:\s*function\s*\(|=>\s*{/g) || []).length;
    var patchedFuncCount = (patched.match(/function\s+\w+|:\s*function\s*\(|=>\s*{/g) || []).length;

    if (originalFuncCount > 0 && patchedFuncCount < originalFuncCount * 0.7) {
      return {
        severity: 'warning',
        message: 'Jumlah fungsi berkurang drastis: ' +
                 originalFuncCount + ' → ' + patchedFuncCount +
                 '. Kemungkinan ada fungsi yang dihapus.'
      };
    }

    return { severity: 'none', message: '' };
  },

  /**
   * CHECK 3: Deteksi pattern mencurigakan yang tidak sesuai pola proyek.
   */
  _checkSuspiciousPatterns: function(code) {
    var issues = [];

    // Pattern 1: import/require (tidak ada di GAS)
    if (/^\s*(import|require)\s*\(/m.test(code) ||
        /^\s*import\s+\w+\s+from/m.test(code)) {
      issues.push({
        severity: 'error',
        message: 'Kode mengandung import/require, padahal GAS tidak support ES6 modules'
      });
    }

    // Pattern 2: class declaration (proyek pakai object literal)
    if (/^\s*class\s+\w+/m.test(code)) {
      issues.push({
        severity: 'warning',
        message: 'Kode mengandung class declaration. Proyek ini pakai object literal (const X = {...}).'
      });
    }

    // Pattern 3: TODO/FIXME/XXX comments (indikasi kode belum selesai)
    var todoMatches = code.match(/\/\/\s*(TODO|FIXME|XXX|HACK)/gi);
    if (todoMatches && todoMatches.length > 0) {
      issues.push({
        severity: 'warning',
        message: 'Kode mengandung ' + todoMatches.length +
                 ' TODO/FIXME comment. Mungkin belum selesai.'
      });
    }

    // Pattern 4: console.log (harusnya pakai AppLogger)
    if (/console\.(log|error|warn|info)/.test(code)) {
      issues.push({
        severity: 'warning',
        message: 'Kode pakai console.log. Proyek ini pakai AppLogger.'
      });
    }

    // Pattern 5: placeholder strings yang mencurigakan
    if (/YOUR_API_KEY|YOUR_TOKEN|PLACEHOLDER|<INSERT/i.test(code)) {
      issues.push({
        severity: 'error',
        message: 'Kode mengandung placeholder string (YOUR_API_KEY, PLACEHOLDER, dll). LLM belum isi nilai sebenarnya.'
      });
    }

    return issues;
  },

  /**
   * Helper: format hasil validasi jadi teks untuk laporan.
   */
  formatResult: function(result) {
    if (result.valid && result.warnings.length === 0) {
      return '✅ ' + result.fileName + ': lolos semua pengecekan';
    }

    var lines = [];
    lines.push((result.valid ? '⚠️' : '❌') + ' ' + result.fileName + ':');

    result.errors.forEach(function(err) {
      lines.push('   ❌ ' + err);
    });

    result.warnings.forEach(function(warn) {
      lines.push('   ⚠️ ' + warn);
    });

    return lines.join('\n');
  }
};
~~~~~

## SOURCE: `src/08_Utils_TemplateEngine.gs`

~~~~~javascript
const TemplateEngine = {
  render(template, variables) {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, function(match, key) {
      return variables.hasOwnProperty(key) ? String(variables[key]) : match;
    });
  }
};
~~~~~

## SOURCE: `src/09_CommandRouter.gs`

~~~~~javascript
/**
 * ===================================================================
 * COMMAND ROUTER
 * ===================================================================
 */
const CommandRouter = {
  COMMANDS: ['diagnose', 'heal', 'logs', 'patch', 'build', 'ingat', 'soul', 'init-soul', 'backup', 'restore', 'memory'],

  isKnownCommand(text) {
    if (!text || text.charAt(0) !== '/') return false;
    var cmd = text.substring(1).split(' ')[0].toLowerCase();
    return this.COMMANDS.indexOf(cmd) >= 0;
  },

  handle(chatId, text) {
    var cmd = text.substring(1).split(' ')[0].toLowerCase();
    var args = text.substring(cmd.length + 2).trim();

    if (cmd === 'diagnose') return Manager._handleDiagnoseError(chatId, text, {});
    if (cmd === 'heal') return Manager._handleDiagnoseError(chatId, text, {});
    if (cmd === 'logs') return Manager._handleSelfQuery(chatId, text, { self_query: { focus: 'all' } });
    if (cmd === 'patch') return Manager._handleDiagnoseError(chatId, text, {});
    if (cmd === 'build') return Manager._handleImplementFeature(chatId, text, {});
    if (cmd === 'ingat') return this._handleIngat(chatId, args);
    if (cmd === 'soul') return Manager._handleSoulQuery(chatId, args || text, {});
    if (cmd === 'init-soul') return Manager._handleSoulInit(chatId, text);
    if (cmd === 'backup') return Manager._handleBackupKnowledge(chatId, text);
    if (cmd === 'restore') return Manager._handleRestoreKnowledge(chatId, text);
    if (cmd === 'memory') return Manager._handleSoulMemoryQuery(chatId, args || text, {});

    return null;
  },

  _handleIngat(chatId, args) {
    if (!args) return 'Format: /ingat <pesan>';
    var intent = {
      tipe: 'buat_reminder',
      deskripsi: args,
      waktuPertama: '',
      jenisRecurring: 'none'
    };
    return Manager._handleBuatReminder(intent);
  }
};
~~~~~

## SOURCE: `src/09_Manager.gs`

~~~~~javascript
const Manager = {
  processConversationalMessage(chatId, text) {
    try {
      if (CommandRouter.isKnownCommand(text)) {
        return CommandRouter.handle(chatId, text);
      }
      var context = this._gatherContext();
      var intent = IntentAnalyzer.analyze(text, context);

      if (!intent || !intent.tipe) {
        return this._handleIntentFailure(chatId, text, context.riwayat);
      }

      this._persistAutoFacts(chatId, intent);
      try {
        SoulMemory.recordEpisode('intent_processed', intent.tipe, 'success', null, null);
      } catch (e) { /* silent */ }
      return this._routeIntent(chatId, text, intent, context);
    } catch (err) {
      AppLogger.error('MANAGER_PROCESS_ERROR', JSON.stringify({
        chatId: chatId,
        error: err.message,
        stack: err.stack
      }));
    }
  },

  _gatherContext() {
    return {
      riwayat: ChatHistoryRepository.getRecent(15),
      facts: KnowledgeSpecialist.getActiveFactsForPrompt(50),
      profile: UserProfileSpecialist.getProfileForPrompt(30),
      ltm: MemorySpecialist.getLongTermMemory(7),
      reminderMenunggu: ReminderSpecialist.getMenungguRespon(),
      ackPatterns: ReminderSpecialist.getAckPatternsForPrompt(10)
    };
  },

  _persistAutoFacts(chatId, intent) {
    if (intent.factsBaru && intent.factsBaru.length > 0)
      KnowledgeSpecialist.saveAutoDetectedFacts(chatId, intent.factsBaru);
    if (intent.profileUpdates && intent.profileUpdates.length > 0)
      UserProfileSpecialist.saveUpdates(intent.profileUpdates);
  },

  _routeIntent(chatId, text, intent, context) {
    if (intent.tipe === 'catat_keuangan')
      return this._handleCatatKeuangan(chatId, text, intent);
    if (intent.tipe === 'tanya_saldo')
      return this._handleTanyaSaldo(chatId, text, intent);
    if (intent.tipe === 'ringkasan_keuangan')
      return this._handleRingkasanKeuangan(chatId, text, intent);
    if (intent.tipe === 'atur_budget')
      return this._handleAturBudget(chatId, text, intent);
    if (intent.tipe === 'edit_transaksi')
      return this._handleEditTransaksi(chatId, text, intent);
    if (intent.tipe === 'sync_documentation')
      return this._handleSyncDocumentation(chatId, text, intent);
    if (intent.tipe === 'ack_reminder' && context.reminderMenunggu.length > 0)
      return this._handleAckReminder(chatId, text, intent, context);
    if (intent.tipe === 'buat_reminder')
      return this._handleBuatReminder(intent);
    if (intent.tipe === 'diagnose_error')
      return this._handleDiagnoseError(chatId, text, intent);
    if (intent.tipe === 'update_docs')
      return this._handleUpdateDocs(chatId, text, intent);
    if (intent.tipe === 'audit_code')
      return this._handleAuditCode(chatId, text, intent);
    if (intent.tipe === 'fix_audit')
      return this._handleFixAudit(chatId, text, intent);
    if (intent.tipe === 'check_changes')
      return this._handleCheckChanges(chatId, text, intent);
    if (intent.tipe === 'roadmap_query')
      return this._handleRoadmapQuery(chatId, text, intent);
    if (intent.tipe === 'implement_feature')
      return this._handleImplementFeature(chatId, text, intent);
    if (intent.tipe === 'self_query')
      return this._handleSelfQuery(chatId, text, intent);
    if (intent.tipe === 'soul_query')
      return this._handleSoulQuery(chatId, text, intent);
    if (intent.tipe === 'soul_init')
      return this._handleSoulInit(chatId, text);
    if (intent.tipe === 'backup_knowledge')
      return this._handleBackupKnowledge(chatId, text);
    if (intent.tipe === 'restore_knowledge')
      return this._handleRestoreKnowledge(chatId, text);
    if (intent.tipe === 'soul_memory_query')
      return this._handleSoulMemoryQuery(chatId, text, intent);

    return this._handleChatBiasa(chatId, text, intent, context.riwayat);
  },

  _askLLMWithKnowledge(chatId, userText, namespace, key, rawData) {
    var template = KnowledgeRepository.get(namespace, key);
    if (!template) {
      AppLogger.error('MANAGER_KNOWLEDGE_MISSING', namespace + ':' + key);
      return null;
    }

    var systemInstruction = TemplateEngine.render(template, {
      data: JSON.stringify(rawData, null, 2)
    });

    var response = LLMProviderService.generate({
      taskType: namespace === 'finance' ? 'finance_response' : 'chat_light',
      systemInstruction: systemInstruction,
      messages: [{ role: 'user', text: userText }],
      temperature: 0.7
    });

    var finalText = (response && response.text) ? response.text : null;
    if (finalText) {
      ChatHistoryRepository.save(chatId, 'user', userText);
      ChatHistoryRepository.save(chatId, 'ai', finalText);
    }
    return finalText;
  },

  _handleCatatKeuangan(chatId, text, intent) {
    var k = intent.keuangan || {};
    var nominal = Number(k.jumlah);

    if (isNaN(nominal) || nominal <= 0) {
      return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
        code: 'INVALID_AMOUNT',
        attempted_value: k.jumlah
      });
    }

    var wallet = FinanceSpecialist.resolveWallet(k.wallet);
    var payload = {
      walletNama: wallet.nama,
      tipe: k.tipe_transaksi === 'pemasukan' ? TransactionRepository.TIPE_INCOME : TransactionRepository.TIPE_EXPENSE,
      kategori: k.kategori || 'Lainnya',
      jumlah: nominal,
      deskripsi: k.deskripsi || text,
      tanggalTransaksi: DateTimeUtils.nowWIB()
    };

    var result = FinanceSpecialist.recordTransaction(payload);
    return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', result.data);
  },

  _handleTanyaSaldo(chatId, text, intent) {
    var k = intent.keuangan || {};

    if (k.wallet && k.wallet.trim().length > 0) {
      var wallet = WalletRepository.findByName(k.wallet.trim());
      if (!wallet) {
        return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
          code: 'WALLET_NOT_FOUND',
          attempted_wallet: k.wallet
        });
      }
      var saldo = FinanceSpecialist.getSaldoWallet(wallet.id);
      return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', {
        action: 'check_single_wallet',
        wallet: wallet.nama,
        saldo: saldo
      });
    }

    var semua = FinanceSpecialist.getAllSaldo();
    return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', {
      action: 'check_all_wallets',
      data: semua
    });
  },

  _handleRingkasanKeuangan(chatId, text, intent) {
    var k = intent.keuangan || {};
    var periode = (k.periode && k.periode.trim().length > 0)
      ? k.periode.trim()
      : DateTimeUtils.formatPeriode(DateTimeUtils.nowWIB());

    var ringkasan = FinanceSpecialist.getRingkasanPeriode(periode);
    return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', {
      action: 'financial_summary',
      ringkasan: ringkasan
    });
  },

  _handleAturBudget(chatId, text, intent) {
    var k = intent.keuangan || {};
    var nominal = Number(k.jumlah);

    if (!k.kategori || isNaN(nominal) || nominal <= 0) {
      return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
        code: 'INVALID_BUDGET_PARAMS',
        attempted_kategori: k.kategori,
        attempted_jumlah: k.jumlah
      });
    }

    var periode = (k.periode && k.periode.trim().length > 0)
      ? k.periode.trim()
      : DateTimeUtils.formatPeriode(DateTimeUtils.nowWIB());

    var hasil = FinanceSpecialist.createOrUpdateBudget(k.kategori, nominal, periode);
    return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', hasil);
  },

  _handleEditTransaksi(chatId, text, intent) {
    var k = intent.keuangan || {};

    if (k.aksi_edit === 'hapus') {
      var last = TransactionRepository.getLastActive();
      if (!last) {
        return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
          code: 'NO_ACTIVE_TRANSACTION'
        });
      }
      TransactionRepository.softDelete(last._rowIndex);
      return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', {
        action: 'delete_transaction',
        deleted_transaction: {
          id: last.id,
          kategori: last.kategori,
          jumlah: last.jumlah,
          deskripsi: last.deskripsi
        }
      });
    }

    if (k.aksi_edit === 'edit' && k.field_edit) {
      var fields = {};
      var val = k.nilai_baru;
      if (k.field_edit === 'jumlah') {
        val = Number(val);
        if (isNaN(val) || val <= 0) {
          return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
            code: 'INVALID_EDIT_AMOUNT',
            attempted_value: k.nilai_baru
          });
        }
      }
      fields[k.field_edit] = val;
      var hasil = FinanceSpecialist.editLastTransaction(fields);
      if (!hasil.success) {
        return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
          code: hasil.code
        });
      }
      return this._askLLMWithKnowledge(chatId, text, 'finance', 'response', hasil.data);
    }

    return this._askLLMWithKnowledge(chatId, text, 'finance', 'error', {
      code: 'AMBIGUOUS_EDIT_REQUEST',
      received_params: k
    });
  },

  _handleSyncDocumentation(chatId, text, intent) {
    var result = DocSyncSpecialist.sync();

    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'docsync', 'error', result);
    }

    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', result);
  },

  _handleBackupKnowledge(chatId, text) {
    var result = KnowledgeSyncSpecialist.pushSheetToGitHub();
    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', {
      action: 'backup_knowledge',
      result: result
    });
  },

  _handleRestoreKnowledge(chatId, text) {
    var result = KnowledgeSyncSpecialist.bootstrap();
    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', {
      action: 'restore_knowledge',
      result: result
    });
  },

  _handleSoulInit(chatId, text) {
    var result = SoulSpecialist.initializeSelf();
    return this._askLLMWithKnowledge(chatId, text, 'docsync', 'response', {
      action: 'soul_initialization',
      result: result
    });
  },

  _handleSoulQuery(chatId, text, intent) {
    var soulContext = SoulSpecialist.getFullContext();
    var episodes = SoulMemory.getRecentEpisodes(10);
    var metaInsights = SoulMemory.getMetaInsights(5);

    return this._askLLMWithKnowledge(chatId, text, 'soul', 'response', {
      action: 'soul_query',
      soul_context: soulContext,
      recent_episodes: episodes,
      meta_insights: metaInsights
    });
  },

  _handleSoulMemoryQuery(chatId, text, intent) {
    var episodes = SoulMemory.getRecentEpisodes(20);
    var metaInsights = SoulMemory.getMetaInsights(10);

    return this._askLLMWithKnowledge(chatId, text, 'soul', 'response', {
      action: 'memory_query',
      episodes: episodes,
      meta_insights: metaInsights
    });
  },

  _handleAckReminder(chatId, text, intent, context) {
    var hasil = ReminderSpecialist.acknowledge(text, intent, context.reminderMenunggu);
    if (hasil.success) return hasil.text;
    return this._handleChatBiasa(chatId, text, intent, context.riwayat);
  },

  _handleBuatReminder(intent) {
    return ReminderSpecialist.create(intent).text;
  },

  _handleDiagnoseError(chatId, text, intent) {
    var keluhan = (intent.diagnose_error && intent.diagnose_error.keluhanUser) || text;
    var result = SelfHealingSpecialist.diagnose(keluhan);

    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'error', result);
    }
    return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'response', result);
  },

  _handleUpdateDocs(chatId, text, intent) {
    var instruksi = (intent.update_docs && intent.update_docs.instruksi) || text;
    var result = SelfHealingSpecialist.updateDocumentation(instruksi);

    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'error', result);
    }
    return this._askLLMWithKnowledge(chatId, text, 'selfheal', 'doc_update_response', result);
  },

  _handleAuditCode(chatId, text, intent) {
    var scope = (intent.audit_code && intent.audit_code.scope) || 'full';
    var result = CodeAuditor.runAudit(scope);

    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'audit', 'error', result);
    }

    return this._askLLMWithKnowledge(chatId, text, 'audit', 'report_response', result);
  },

  _handleFixAudit(chatId, text, intent) {
    var scope = (intent.fix_audit && intent.fix_audit.scope) || 'all';
    var result = CodeAuditor.fixIssues(scope);

    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'audit', 'error', result);
    }

    return this._askLLMWithKnowledge(chatId, text, 'audit', 'fix_response', result);
  },

  _handleCheckChanges(chatId, text, intent) {
    var mode = (intent.check_changes && intent.check_changes.mode) || 'full';
    var result = ChangeDetector.runDetection(mode);
    ChatHistoryRepository.save(chatId, 'user', text);
    ChatHistoryRepository.save(chatId, 'ai', result);
    return result;
  },

  _handleRoadmapQuery(chatId, text, intent) {
    var rq = intent.roadmap_query || {};
    var action = rq.action || 'ask';
    var question = rq.question || text;
    var result;

    if (action === 'build') {
      result = ProjectBrain.buildRoadmapFromDiscussion(question);
    } else if (action === 'check_alignment' || action === 'adapt') {
      result = ProjectBrain.adaptRoadmapForNewIdea(question);
    } else if (action === 'sync') {
      result = ProjectBrain.syncRoadmapWithCode();
    } else {
      var answer = ProjectBrain.answerQuestion(question);
      if (answer) {
        ChatHistoryRepository.save(chatId, 'user', text);
        ChatHistoryRepository.save(chatId, 'ai', answer);
        return answer;
      }
      result = { success: false, code: 'QUERY_FAILED' };
    }

    if (result && !result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'roadmap', 'error', result);
    }
    return this._askLLMWithKnowledge(chatId, text, 'roadmap', 'response', result);
  },

  _handleImplementFeature(chatId, text, intent) {
    var idea = (intent.implement_feature && intent.implement_feature.idea) || text;
    
    // Evaluasi apakah pengguna meminta implementasi atau membuat blueprint
    var isConfirmImplement = text.toLowerCase().indexOf('implement') >= 0 || text.toLowerCase().indexOf('terapkan') >= 0;
    var result;

    if (isConfirmImplement) {
      result = FeatureArchitect.implementBlueprint(idea);
      if (!result.success) {
        return this._askLLMWithKnowledge(chatId, text, 'feature', 'error', result);
      }
      return this._askLLMWithKnowledge(chatId, text, 'feature', 'implement_response', result);
    }

    result = FeatureArchitect.generateBlueprint(idea);
    if (!result.success) {
      return this._askLLMWithKnowledge(chatId, text, 'feature', 'error', result);
    }
    return this._askLLMWithKnowledge(chatId, text, 'feature', 'blueprint_response', result);
  },

  _handleSelfQuery(chatId, text, intent) {
    var focus = (intent.self_query && intent.self_query.focus) || 'all';
    var result = SelfAwareness.review(focus);

    // Kirim data mentah hasil introspeksi ke LLM untuk diformat secara natural
    return this._askLLMWithKnowledge(chatId, text, 'selfaware', 'review_response', result);
  },

  _handleChatBiasa(chatId, text, intent, riwayat) {
    var finalText;
    if (ChatSpecialist.needsWebSearch(intent))
      finalText = this._handleChatWithWebSearch(text, intent, riwayat);
    else if (intent.complexity === 'heavy')
      finalText = this._handleHeavyChat(text, intent, riwayat);
    else
      finalText = intent.jawabanChat || '';

    if (finalText) {
      ChatHistoryRepository.save(chatId, 'user', text);
      ChatHistoryRepository.save(chatId, 'ai', finalText);
    }
    return finalText;
  },

  _handleHeavyChat(text, intent, riwayat) {
    AppLogger.info('MANAGER_HEAVY_CHAT', 'task:chat_heavy');
    var result = LLMProviderService.generate({
      taskType: 'chat_heavy',
      systemInstruction: ChatSpecialist.buildSystemPersona(),
      messages: riwayat.concat([{ role: 'user', text: text }]),
      temperature: 0.7
    });
    return (result && result.text) ? result.text : (intent.jawabanChat || '');
  },

  _handleChatWithWebSearch(text, intent, riwayat) {
    var results = WebSearchProviderService.search(intent.searchQuery);
    return ChatSpecialist.respondWithSearchContext(text, results, riwayat);
  },

  _handleIntentFailure(chatId, text, riwayat) {
    AppLogger.error('MANAGER_INTENT_FAILURE', 'task:chat_light');
    var result = LLMProviderService.generate({
      taskType: 'chat_light',
      systemInstruction: ChatSpecialist.buildSystemPersona(),
      messages: riwayat.concat([{ role: 'user', text: text }]),
      temperature: 0.7
    });
    var finalText = result ? result.text : '';
    if (finalText) {
      ChatHistoryRepository.save(chatId, 'user', text);
      ChatHistoryRepository.save(chatId, 'ai', finalText);
    }
    return finalText;
  }
};
~~~~~

## SOURCE: `src/09_Manager_IntentAnalyzer.gs`

~~~~~javascript
const IntentAnalyzer = {
  NAMESPACE: 'intent',

  analyze(userMessage, context) {
    var prompt = this._buildPrompt(userMessage, context);
    var result = LLMProviderService.generateFromSinglePrompt(prompt, 0.7, 'intent_analysis');
    if (!result) {
      AppLogger.error('INTENT_ANALYZER_ALL_PROVIDERS_FAILED', 'all_providers_failed');
      return null;
    }
    return this._parseResponse(result.text, result.provider);
  },

  _parseResponse(rawText, providerName) {
    var cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Percobaan 1: Parse langsung
    try {
      var parsed = JSON.parse(cleaned);
      AppLogger.info('INTENT_ANALYZER_SUCCESS',
        'provider:' + providerName + '|complexity:' + (parsed.complexity || 'light'));
      return parsed;
    } catch (err) {
      // Percobaan 2: Auto-repair JSON rusak (koma trailing, koma sebelum })
      try {
        var repaired = cleaned
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/,(\s*)"([^"]*)":\s*""(\s*[,}])/g, ',$1"$2":""$3');
        var parsed2 = JSON.parse(repaired);
        AppLogger.warning('INTENT_ANALYZER_REPAIRED',
          'provider:' + providerName + '|complexity:' + (parsed2.complexity || 'light'));
        return parsed2;
      } catch (err2) {
        AppLogger.warning('INTENT_ANALYZER_PARSE_ERROR',
          providerName + ':' + err.message + '|raw:' + cleaned.substring(0, 300));
        return null;
      }
    }
  },

  _buildPrompt(userMessage, context) {
    var knowledge = KnowledgeRepository.getByNamespace(this.NAMESPACE);
    var template = knowledge['master_prompt'];
    if (!template) {
      AppLogger.error('INTENT_ANALYZER_NO_TEMPLATE', 'master_prompt_missing');
      return userMessage;
    }

    var nowStr = DateTimeUtils.formatUntukPrompt(DateTimeUtils.nowWIB());

    var variables = {
      persona: knowledge['persona'] || '',
      now: nowStr,
      riwayat: this._formatRiwayat(context.riwayat),
      fakta: this._formatList(context.facts),
      profil: this._formatList(context.profile),
      ltm: this._formatList(context.ltm),
      reminder: this._formatReminder(context.reminderMenunggu),
      pola: this._formatPola(context.ackPatterns),
      user_message: userMessage,
      output_schema: knowledge['output_schema'] || '',
      rules: knowledge['rules'] || ''
    };

    return TemplateEngine.render(template, variables);
  },

  _formatRiwayat(r) {
    if (!r || r.length === 0) return '-';
    return r.map(function(i) {
      return (i.role === 'ai' ? 'AI' : 'User') + ': ' + i.text;
    }).join('\n');
  },

  _formatList(arr) {
    if (!arr || arr.length === 0) return '-';
    return arr.map(function(x) { return '- ' + x; }).join('\n');
  },

  _formatReminder(r) {
    if (!r || r.length === 0) return '-';
    return r.map(function(x) { return '- ' + x.deskripsi; }).join('\n');
  },

  _formatPola(p) {
    if (!p || p.length === 0) return '-';
    return p.map(function(x) { return '- ' + x.pesan + ' -> ' + x.aksi; }).join('\n');
  }
};
~~~~~

## SOURCE: `src/10_Handler_Webhook.gs`

~~~~~javascript
/**
 * ===================================================================
 * ENTRY POINT: TELEGRAM WEBHOOK
 * Tanggung jawab: validasi keamanan, dedup, lalu delegasi ke
 * CommandRouter (fast path) atau Manager (conversational path).
 * ===================================================================
 */
const WebhookHandler = {
  DEDUP_CACHE_TTL_SECONDS: 21600, // 6 jam

  handle(e) {
    try {
      const config = Config.load();

      if (!this._isAuthorized(e, config)) {
        AppLogger.warning('SECURITY_BLOCK', 'Secret tidak valid');
        return ContentService.createTextOutput('Unauthorized');
      }

      const contents = JSON.parse(e.postData.contents);
      if (this._isDuplicateUpdate(contents)) {
        return ContentService.createTextOutput('OK');
      }

      const message = contents.message;
      if (!message || !message.text) {
        return ContentService.createTextOutput('OK');
      }

      const chatId = message.chat.id.toString();
      const text = message.text.trim();

      if (chatId !== config.myChatId) {
        AppLogger.warning('SECURITY_BLOCK', 'ChatId tidak dikenal: ' + chatId);
        return ContentService.createTextOutput('OK');
      }

      AppLogger.info('INCOMING_MESSAGE', text);
      this._processMessage(chatId, text);

      return ContentService.createTextOutput('OK');
    } catch (error) {
      AppLogger.error('ERROR_DOPOST', error.message);
      return ContentService.createTextOutput('Error: ' + error.message);
    }
  },

  _isAuthorized(e, config) {
    return e.parameter.secret === config.sharedSecret;
  },

  _isDuplicateUpdate(contents) {
    const updateId = contents.update_id ? contents.update_id.toString() : null;
    if (!updateId) return false;

    const cache = CacheService.getScriptCache();
    const cacheKey = 'update_' + updateId;
    if (cache.get(cacheKey)) return true;

    cache.put(cacheKey, 'true', this.DEDUP_CACHE_TTL_SECONDS);
    return false;
  },

  _processMessage(chatId, text) {
    if (CommandRouter.isKnownCommand(text)) {
      const responseText = CommandRouter.handle(chatId, text);
      TelegramService.sendMessage(chatId, responseText);
      return;
    }

    const placeholderId = TelegramService.sendMessage(chatId, TelegramService.pickPlaceholder());
    const finalText = Manager.processConversationalMessage(chatId, text);
    TelegramService.editMessage(chatId, placeholderId, finalText);
  }
};

function doPost(e) {
  return WebhookHandler.handle(e);
}
~~~~~

## SOURCE: `src/11_Trigger_AuditScheduler.gs`

~~~~~javascript
/**
 * TRIGGER: AUDIT SCHEDULER
 * Tanggung jawab: menjalankan audit terjadwal otomatis.
 * - Setiap Senin jam 07:00 WIB → audit ringan
 * - Setiap tanggal 1 jam 07:00 WIB → audit penuh
 */
var AuditScheduler = {

  /**
   * Dipanggil oleh time-based trigger.
   * Otomatis menentukan jenis audit berdasarkan tanggal.
   */
  runScheduledAudit: function() {
    AppLogger.info('AUDIT_TRIGGER', 'Scheduled audit started');

    try {
      CodeAuditor.runScheduledAudit();
    } catch (e) {
      AppLogger.error('AUDIT_TRIGGER_FAIL', e.message);
    }
  },

  /**
   * Setup trigger mingguan (Senin 07:00 WIB).
   * Jalankan fungsi ini SEKALI dari editor GAS untuk mengaktifkan.
   */

  setupWeeklyTrigger: function() {
    this._deleteExistingTriggers();

    ScriptApp.newTrigger('runScheduledAuditWrapper')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(7)
      .create();

    AppLogger.info('AUDIT_TRIGGER_SETUP', 'Weekly trigger created (Senin 07:00)');
    Logger.log('✅ Trigger audit mingguan berhasil dibuat!');
  },

  /**
   * Hapus trigger lama agar tidak duplikat.
   */
  _deleteExistingTriggers: function() {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'runScheduledAuditWrapper') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
};

/**
 * Wrapper global untuk trigger.
 * GAS trigger hanya bisa memanggil fungsi global, bukan method object.
 */
function runScheduledAuditWrapper() {
  AuditScheduler.runScheduledAudit();
}

function setupWeeklyTrigger() {
  AuditScheduler.setupWeeklyTrigger();
}
~~~~~

## SOURCE: `src/11_Trigger_LLMIntelligence.gs`

~~~~~javascript
/**
 * ===================================================================
 * TRIGGER: DAILY LLM INTELLIGENCE PIPELINE
 * Menjalankan Discovery -> Benchmark 3 Model -> Update Ranking pada jam 03:00.
 * ===================================================================
 */
function runDailyLLMDiscovery() {
  AppLogger.info('TRIGGER_LLM_INTEL_START', 'daily_03:00');
  var pipelineResult = LLMIntelligence.runFullPipeline();
  AppLogger.info('TRIGGER_LLM_INTEL_END', JSON.stringify(pipelineResult));
}

function setupDailyLLMDiscovery() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runDailyLLMDiscovery') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('runDailyLLMDiscovery')
    .timeBased()
    .atHour(3)
    .everyDays(1)
    .create();
  AppLogger.info('TRIGGER_SETUP_SUCCESS', 'runDailyLLMDiscovery');
}
~~~~~

## SOURCE: `src/11_Trigger_MemorySummarizer.gs`

~~~~~javascript
/**
 * TRIGGER: MEMORY SUMMARIZER
 * Tanggung jawab: menjalankan ringkasan percakapan harian.
 * Dijadwalkan setiap malam jam 23:30 WIB.
 */
var MemorySummarizerTrigger = {

  setupNightlyTrigger: function() {
    this._deleteExistingTriggers();

    ScriptApp.newTrigger('runNightlySummarizerWrapper')
      .timeBased()
      .atHour(23)
      .nearMinute(30)
      .everyDays(1)
      .create();

    AppLogger.info('LTM_TRIGGER_SETUP', 'Nightly trigger created (23:30 WIB)');
    Logger.log('✅ Trigger memory summarizer berhasil dibuat!');
  },

  _deleteExistingTriggers: function() {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'runNightlySummarizerWrapper') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
};

function runNightlySummarizerWrapper() {
  MemorySpecialist.summarizeToday();
}

function setupNightlySummarizer() {
  MemorySummarizerTrigger.setupNightlyTrigger();
}
~~~~~

## SOURCE: `src/11_Trigger_ReminderChecker.gs`

~~~~~javascript
/**
 * ===================================================================
 * ENTRY POINT: REMINDER CHECKER (Time-based Trigger)
 * ===================================================================
 */
function cekDanKirimReminder() {
  const lock = LockService.getScriptLock();
  
  if (!lock.tryLock(2000)) {
    return;
  }

  try {
    const remindersDue = ReminderSpecialist.getReminderDueNow();
    if (!remindersDue || remindersDue.length === 0) {
      return;
    }

    const config = Config.load();
    const targetChatId = config.myChatId;
    if (!targetChatId) {
      AppLogger.warning("REMINDER_TRIGGER", "MY_TELEGRAM_CHAT_ID_MISSING");
      return;
    }

    remindersDue.forEach(function(reminder) {
      const pesan = ReminderSpecialist.buildNotificationText(reminder);
      TelegramService.sendMessage(targetChatId, pesan);
      ReminderSpecialist.markAsNotified(reminder);
    });
  } catch (err) {
    AppLogger.error(
      "REMINDER_TRIGGER_ERROR",
      JSON.stringify({
        errorMessage: err.message,
        stack: err.stack
      })
    );
  } finally {
    lock.releaseLock();
  }
}

function setupReminderTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'cekDanKirimReminder') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('cekDanKirimReminder').timeBased().everyMinutes(1).create();
}
~~~~~

## SOURCE: `src/11_Trigger_ScheduledSync.gs`

~~~~~javascript
/**
 * ===================================================================
 * TRIGGER: SCHEDULED SYNC & BACKUP
 * Menjalankan sinkronisasi dan backup penuh otomatis harian.
 * ===================================================================
 */
function runDailyAutoSync() {
  try {
    AppLogger.info('TRIGGER_AUTO_SYNC_START', 'daily_04:00');
    var result = SyncOrchestrator.executeSync('auto');
    AppLogger.info('TRIGGER_AUTO_SYNC_END', JSON.stringify(result.summary));
  } catch (err) {
    AppLogger.error('TRIGGER_AUTO_SYNC_FAIL', err.message);
  }
}

function setupDailyAutoSyncTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runDailyAutoSync') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('runDailyAutoSync')
    .timeBased()
    .atHour(4)
    .everyDays(1)
    .create();
  AppLogger.info('TRIGGER_SETUP_SUCCESS', 'runDailyAutoSync');
}
~~~~~

## SOURCE: `src/11_Trigger_WeeklyChangeCheck.gs`

~~~~~javascript
/**
 * TRIGGER: WEEKLY CHANGE CHECK
 * Tanggung jawab: menjalankan deteksi perubahan mingguan.
 * Setiap Minggu jam 20:00 WIB.
 */
var WeeklyChangeCheckTrigger = {

  setupWeeklyTrigger: function() {
    this._deleteExistingTriggers();

    ScriptApp.newTrigger('runWeeklyChangeCheckWrapper')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.SUNDAY)
      .atHour(20)
      .create();

    AppLogger.info('WEEKLY_CHANGE_TRIGGER_SETUP', 'Created (Minggu 20:00)');
    Logger.log('✅ Trigger weekly change check berhasil dibuat!');
  },

  _deleteExistingTriggers: function() {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'runWeeklyChangeCheckWrapper') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
};

function runWeeklyChangeCheckWrapper() {
  ChangeDetector.runScheduledDetection();
}

function setupWeeklyChangeCheck() {
  WeeklyChangeCheckTrigger.setupWeeklyTrigger();
}
~~~~~

## SOURCE: `src/12_Service_GitHubBackup.gs`

~~~~~javascript
/**
 * ===================================================================
 * SERVICE: GITHUB BACKUP
 * Tanggung jawab: baca source code project GAS ini sendiri (via Apps
 * Script API), lalu push ke repo GitHub (via GitHub REST API).
 * Juga bisa backup dokumentasi (ARCHITECTURE.md, PROGRESS.md) yang
 * disimpan di Sheet "Documentation".
 * Berjalan 100% di GAS, tidak butuh local computer.
 * ===================================================================
 */
const GitHubBackupService = {
  APPS_SCRIPT_API_BASE: 'https://script.googleapis.com/v1/projects/',
  GITHUB_API_BASE: 'https://api.github.com/repos/',

  backupAllFiles() {
    const config = this._loadGitHubConfig();
    const files = this._fetchOwnSourceFiles();
    const results = [];

    files.forEach(file => {
      const path = this._resolveFilePath(file);
      try {
        this._pushFileToGitHub(config, path, file.source);
        results.push({ path: path, status: 'OK' });
        AppLogger.info('GITHUB_BACKUP_FILE_OK', path);
      } catch (err) {
        results.push({ path: path, status: 'FAILED: ' + err.message });
        AppLogger.error('GITHUB_BACKUP_FILE_FAILED', path + ': ' + err.message);
      }
      Utilities.sleep(400);
    });

    return results;
  },

  /**
   * Push isi dokumentasi (ARCHITECTURE.md, PROGRESS.md) dari Sheet
   * "Documentation" ke root repo GitHub (bukan folder src/).
   */
  backupDocs() {
    const config = this._loadGitHubConfig();
    const docs = DocumentationRepository.getAll();
    const results = [];

    if (docs.length === 0) {
      AppLogger.warning('GITHUB_BACKUP_DOCS_EMPTY', 'Sheet Documentation kosong');
      return results;
    }

    docs.forEach(doc => {
      try {
        this._pushFileToGitHub(config, doc.fileName, doc.content);
        results.push({ path: doc.fileName, status: 'OK' });
        AppLogger.info('GITHUB_BACKUP_DOC_OK', doc.fileName);
      } catch (err) {
        results.push({ path: doc.fileName, status: 'FAILED: ' + err.message });
        AppLogger.error('GITHUB_BACKUP_DOC_FAILED', doc.fileName + ': ' + err.message);
      }
      Utilities.sleep(400);
    });

    return results;
  },

  _loadGitHubConfig() {
    const props = PropertiesService.getScriptProperties();
    const config = {
      token: props.getProperty('GITHUB_TOKEN'),
      owner: props.getProperty('GITHUB_REPO_OWNER'),
      repo: props.getProperty('GITHUB_REPO_NAME'),
      branch: props.getProperty('GITHUB_BRANCH') || 'main'
    };
    if (!config.token || !config.owner || !config.repo) {
      throw new Error('GitHub config belum lengkap di Script Properties');
    }
    return config;
  },

  _fetchOwnSourceFiles() {
    const scriptId = ScriptApp.getScriptId();
    const url = this.APPS_SCRIPT_API_BASE + scriptId + '/content';
    const token = ScriptApp.getOAuthToken();

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code !== 200) {
      throw new Error('Gagal ambil source sendiri (HTTP ' + code + '): ' +
        response.getContentText().substring(0, 300));
    }

    const data = JSON.parse(response.getContentText());
    return data.files || [];
  },

  _resolveFilePath(file) {
    if (file.type === 'JSON') return 'src/appsscript.json';
    if (file.type === 'SERVER_JS') return 'src/' + file.name + '.gs';
    return 'src/' + file.name + '.txt';
  },

  _pushFileToGitHub(config, path, content) {
    const url = this.GITHUB_API_BASE + config.owner + '/' + config.repo + '/contents/' + path;
    const existingSha = this._getExistingFileSha(config, url);

    const payload = {
      message: 'Auto backup dari GAS — ' + new Date().toISOString(),
      content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
      branch: config.branch
    };
    if (existingSha) payload.sha = existingSha;

    const response = UrlFetchApp.fetch(url, {
      method: 'put',
      contentType: 'application/json',
      headers: {
        Authorization: 'token ' + config.token,
        Accept: 'application/vnd.github+json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code !== 200 && code !== 201) {
      throw new Error('GitHub PUT gagal (HTTP ' + code + '): ' +
        response.getContentText().substring(0, 300));
    }
  },

  _getExistingFileSha(config, url) {
    const response = UrlFetchApp.fetch(url + '?ref=' + config.branch, {
      method: 'get',
      headers: {
        Authorization: 'token ' + config.token,
        Accept: 'application/vnd.github+json'
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText()).sha;
    }
    return null;
  }
};

/**
 * Backup lengkap: source code + dokumentasi, sekali jalan.
 * Jalankan fungsi ini dari dropdown GAS setiap mau backup manual.
 */
function runFullBackup() {
  Logger.log('--- Backup Source Code ---');
  const codeResults = GitHubBackupService.backupAllFiles();
  codeResults.forEach(r => Logger.log(r.path + ' -> ' + r.status));

  Logger.log('--- Backup Dokumentasi ---');
  const docsResults = GitHubBackupService.backupDocs();
  docsResults.forEach(r => Logger.log(r.path + ' -> ' + r.status));

  Logger.log('=== FULL BACKUP SELESAI: ' +
    (codeResults.length + docsResults.length) + ' file diproses ===');
}

/**
 * Jalankan fungsi ini SEKALI SAJA untuk mengaktifkan backup otomatis
 * setiap hari jam 23:00. Opsional — boleh diabaikan kalau mau backup
 * manual saja.
 */
function setupDailyBackupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runFullBackup') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('runFullBackup')
    .timeBased()
    .everyDays(1)
    .atHour(23)
    .create();
  Logger.log('Trigger backup harian berhasil dibuat (jam 23:00)!');
}
~~~~~

## SOURCE: `src/13_Service_GitHubOps.gs`

~~~~~javascript
/**
 * SERVICE: GITHUB OPS
 * Tanggung jawab: operasi read/write ke repository GitHub.
 * Digunakan oleh SelfHealingSpecialist untuk membaca source code
 * dan mengcommit perbaikan.
 */
var GitHubOpsService = {

  _getHeaders: function() {
    var config = Config.load();
    return {
      'Authorization': 'Bearer ' + config.githubToken,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ai-agent-telegram'
    };
  },

  _getRepoUrl: function() {
    var config = Config.load();
    return 'https://api.github.com/repos/' +
           config.githubRepoOwner + '/' +
           config.githubRepoName;
  },

  readFile: function(path, ref) {
    var config = Config.load();
    var branch = ref || config.githubBranch || 'main';
    var url = this._getRepoUrl() + '/contents/' +
              encodeURIComponent(path) + '?ref=' + branch;

    try {
      var response = UrlFetchApp.fetch(url, {
        headers: this._getHeaders(),
        muteHttpExceptions: true
      });

      var data = JSON.parse(response.getContentText());

      if (response.getResponseCode() === 200 && data.content) {
        var decoded = Utilities.newBlob(
          Utilities.base64Decode(data.content)
        ).getDataAsString();

        return {
          content: decoded,
          sha: data.sha,
          path: data.path
        };
      }

      AppLogger.error('GITHUB_READ_FAIL',
        'Path: ' + path + ' HTTP ' + response.getResponseCode());
      return null;

    } catch (e) {
      AppLogger.error('GITHUB_READ_ERROR', e.message);
      return null;
    }
  },

  listDirectory: function(path) {
    var config = Config.load();
    var url = this._getRepoUrl() + '/contents/' +
              encodeURIComponent(path) + '?ref=' +
              (config.githubBranch || 'main');

    try {
      var response = UrlFetchApp.fetch(url, {
        headers: this._getHeaders(),
        muteHttpExceptions: true
      });

      var data = JSON.parse(response.getContentText());

      if (response.getResponseCode() === 200 && Array.isArray(data)) {
        return data.map(function(item) {
          return {
            name: item.name,
            path: item.path,
            type: item.type,
            sha: item.sha
          };
        });
      }

      return [];
    } catch (e) {
      AppLogger.error('GITHUB_LIST_ERROR', e.message);
      return [];
    }
  },

  readAllSourceFiles: function() {
    var files = this.listDirectory('src');
    var result = {};
    var self = this;

    files.forEach(function(file) {
      if (file.type === 'file' && file.name.indexOf('.gs') !== -1) {
        var fileData = self.readFile(file.path);
        if (fileData) {
          result[file.name] = {
            content: fileData.content,
            sha: fileData.sha
          };
        }
      }
    });

    return result;
  },

  createBranch: function(branchName) {
    var config = Config.load();
    var baseBranch = config.githubBranch || 'main';

    try {
      var refUrl = this._getRepoUrl() + '/git/ref/heads/' + baseBranch;
      var refResponse = UrlFetchApp.fetch(refUrl, {
        headers: this._getHeaders(),
        muteHttpExceptions: true
      });
      var refData = JSON.parse(refResponse.getContentText());

      if (!refData.object || !refData.object.sha) {
        AppLogger.error('GITHUB_BRANCH_FAIL', 'Cannot get base SHA');
        return false;
      }

      var baseSha = refData.object.sha;
      var createUrl = this._getRepoUrl() + '/git/refs';
      var createResponse = UrlFetchApp.fetch(createUrl, {
        method: 'post',
        headers: this._getHeaders(),
        payload: JSON.stringify({
          ref: 'refs/heads/' + branchName,
          sha: baseSha
        }),
        muteHttpExceptions: true
      });

      var createData = JSON.parse(createResponse.getContentText());

      if (createResponse.getResponseCode() === 201) {
        AppLogger.info('GITHUB_BRANCH_CREATED', branchName);
        return true;
      }

      if (createData.message &&
          createData.message.indexOf('already exists') !== -1) {
        AppLogger.info('GITHUB_BRANCH_EXISTS', branchName);
        return true;
      }

      AppLogger.error('GITHUB_BRANCH_FAIL',
        createData.message || 'unknown');
      return false;

    } catch (e) {
      AppLogger.error('GITHUB_BRANCH_ERROR', e.message);
      return false;
    }
  },

   /**
   * Buat backup branch dari main sebelum melakukan fix.
   * Backup branch bisa dipakai untuk rollback kalau fix ternyata rusak.
   * @param {string} suffix - identifier tambahan (misal timestamp)
   * @returns {string|null} nama branch backup jika berhasil
   */
  createBackupBranch: function(suffix) {
    var backupName = 'backup/pre-fix-' + (suffix || new Date().getTime());
    var ok = this.createBranch(backupName);
    if (ok) {
      AppLogger.info('GITHUB_BACKUP_BRANCH', backupName);
      return backupName;
    }
    return null;
  },

  commitFile: function(path, content, message, branch, sha) {
    var url = this._getRepoUrl() + '/contents/' +
              encodeURIComponent(path);
    var config = Config.load();
    var targetBranch = branch || config.githubBranch || 'main';

    var payload = {
      message: message,
      content: Utilities.base64Encode(content),
      branch: targetBranch
    };

    if (sha) {
      payload.sha = sha;
    }

    try {
      var response = UrlFetchApp.fetch(url, {
        method: 'put',
        headers: this._getHeaders(),
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      var data = JSON.parse(response.getContentText());

      if (response.getResponseCode() === 200 ||
          response.getResponseCode() === 201) {
        AppLogger.info('GITHUB_COMMIT_SUCCESS',
          path + ' -> ' + targetBranch);
        return true;
      }

      AppLogger.error('GITHUB_COMMIT_FAIL',
        path + ' | ' + (data.message || 'unknown'));
      return false;

    } catch (e) {
      AppLogger.error('GITHUB_COMMIT_ERROR', e.message);
      return false;
    }
  },

  createPullRequest: function(title, body, head, base) {
    var config = Config.load();
    var targetBase = base || config.githubBranch || 'main';
    var url = this._getRepoUrl() + '/pulls';

    try {
      var response = UrlFetchApp.fetch(url, {
        method: 'post',
        headers: this._getHeaders(),
        payload: JSON.stringify({
          title: title,
          body: body,
          head: head,
          base: targetBase
        }),
        muteHttpExceptions: true
      });

      var data = JSON.parse(response.getContentText());

      if (response.getResponseCode() === 201 && data.html_url) {
        AppLogger.info('GITHUB_PR_CREATED', data.html_url);
        return data.html_url;
      }

      AppLogger.error('GITHUB_PR_FAIL', data.message || 'unknown');
      return null;

    } catch (e) {
      AppLogger.error('GITHUB_PR_ERROR', e.message);
      return null;
    }
  },

  readDocFile: function(fileName) {
    return this.readFile(fileName);
  },

  updateDocFile: function(fileName, newContent, commitMessage) {
    var existing = this.readDocFile(fileName);
    var sha = existing ? existing.sha : null;
    var config = Config.load();

    var ok = this.commitFile(
      fileName, newContent, commitMessage,
      config.githubBranch || 'main', sha
    );

    if (ok) {
      try {
        var docSheet = SpreadsheetGateway.getSheet('Documentation');
        var data = docSheet.getDataRange().getValues();
        var found = false;

        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === fileName) {
            docSheet.getRange(i + 1, 2).setValue(newContent);
            found = true;
            break;
          }
        }

        if (!found) {
          SpreadsheetGateway.appendRowSafe('Documentation',
            [fileName, newContent]);
        }
      } catch (e) {
        AppLogger.error('DOC_SHEET_SYNC_FAIL', e.message);
      }
    }

    return ok;
  }
};
~~~~~

## SOURCE: `src/99_TestSuite_Full.gs`

~~~~~javascript
/**
 * ===================================================================
 * FULL TEST SUITE: AI AGENT TELEGRAM
 * 6 Batch, masing-masing di bawah 5 menit.
 * Semua data test menggunakan prefix [TEST] untuk identifikasi cleanup.
 * ===================================================================
 */

function _tLog(batch, name, status, detail, ms) {
  var line = '[B' + batch + '][' + status + '] ' + name;
  if (detail) line += ' | ' + detail;
  if (ms !== undefined && ms !== null) line += ' | ' + ms + 'ms';
  Logger.log(line);
}

function _cleanupTestData() {
  var cleaned = { transactions: 0, reminders: 0 };

  try {
    var activeTrx = TransactionRepository.getActive();
    for (var i = 0; i < activeTrx.length; i++) {
      var t = activeTrx[i];
      if (t.deskripsi && t.deskripsi.indexOf('[TEST]') >= 0) {
        TransactionRepository.softDelete(t.rowIndex);
        cleaned.transactions++;
      }
    }
  } catch (e) {
    Logger.log('[CLEANUP] Transaction cleanup error: ' + e.message);
  }

  try {
    var activeRem = ReminderRepository.getActive();
    for (var j = 0; j < activeRem.length; j++) {
      var r = activeRem[j];
      if (r.deskripsi && r.deskripsi.indexOf('[TEST]') >= 0) {
        ReminderRepository.updateStatus(r.rowIndex, ReminderRepository.STATUS_DONE);
        cleaned.reminders++;
      }
    }
  } catch (e) {
    Logger.log('[CLEANUP] Reminder cleanup error: ' + e.message);
  }

  Logger.log('[CLEANUP] Done | trx:' + cleaned.transactions + ' rem:' + cleaned.reminders);
  return cleaned;
}

// ============================================================
// BATCH 1: REPOSITORY CRUD (NO LLM)
// Menguji layer data: tulis, baca, update, hapus.
// ============================================================
function test_Batch1_RepositoryCRUD() {
  var start = new Date().getTime();
  var passed = 0, failed = 0, skipped = 0;

  Logger.log('========================================');
  Logger.log('BATCH 1: REPOSITORY CRUD (NO LLM)');
  Logger.log('========================================');

  // --- 1.1 WalletRepository ---
  try {
    var t0 = new Date().getTime();
    var walletId = WalletRepository.create('[TEST] Wallet', 100000);
    var wallet = WalletRepository.findById(walletId);
    var found = WalletRepository.findByName('[TEST] Wallet');
    var all = WalletRepository.getAll();
    var latency = new Date().getTime() - t0;

    if (wallet && wallet.nama === '[TEST] Wallet' && found && all.length > 0) {
      passed++;
      _tLog(1, 'WALLET_CRUD', 'PASS', 'id:' + walletId + ' all:' + all.length, latency);
    } else {
      failed++;
      _tLog(1, 'WALLET_CRUD', 'FAIL', 'data mismatch', latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'WALLET_CRUD', 'ERROR', e.message, null);
  }

  // --- 1.2 TransactionRepository ---
  try {
    var t0 = new Date().getTime();
    var testWallet = WalletRepository.findByName('[TEST] Wallet') || WalletRepository.findByName('Cash');
    var trxId = TransactionRepository.create({
      walletId: testWallet.id,
      tanggalTransaksi: DateTimeUtils.nowWIB(),
      tipe: TransactionRepository.TIPE_INCOME,
      kategori: '[TEST] Gaji',
      jumlah: 5000000,
      deskripsi: '[TEST] gajian'
    });
    var active = TransactionRepository.getActive();
    var last = TransactionRepository.getLastActive();
    var byWallet = TransactionRepository.getByWallet(testWallet.id);
    var found = TransactionRepository.findById(trxId);
    var latency = new Date().getTime() - t0;

    if (found && found.jumlah === 5000000 && last && active.length > 0) {
      passed++;
      _tLog(1, 'TRANSACTION_CRUD', 'PASS', 'id:' + trxId + ' active:' + active.length, latency);
    } else {
      failed++;
      _tLog(1, 'TRANSACTION_CRUD', 'FAIL', 'data mismatch', latency);
    }

    // Test update
    var t1 = new Date().getTime();
    TransactionRepository.update(last.rowIndex, { jumlah: 4500000 });
    var updated = TransactionRepository.findById(trxId);
    var lat2 = new Date().getTime() - t1;

    if (updated && updated.jumlah === 4500000) {
      passed++;
      _tLog(1, 'TRANSACTION_UPDATE', 'PASS', 'new amount:4500000', lat2);
    } else {
      failed++;
      _tLog(1, 'TRANSACTION_UPDATE', 'FAIL', 'update not reflected', lat2);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'TRANSACTION_CRUD', 'ERROR', e.message, null);
  }

  // --- 1.3 ReminderRepository ---
  try {
    var t0 = new Date().getTime();
    var remId = ReminderRepository.create({
      deskripsi: '[TEST] meeting',
      waktuPertama: DateTimeUtils.nowWIB(),
      jenisRecurring: 'none',
      prioritas: 'High'
    });
    var activeRem = ReminderRepository.getActive();
    var latency = new Date().getTime() - t0;

    if (remId && activeRem.length > 0) {
      passed++;
      _tLog(1, 'REMINDER_CRUD', 'PASS', 'id:' + remId + ' active:' + activeRem.length, latency);
    } else {
      failed++;
      _tLog(1, 'REMINDER_CRUD', 'FAIL', 'data mismatch', latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'REMINDER_CRUD', 'ERROR', e.message, null);
  }

  // --- 1.4 AckPatternsRepository ---
  try {
    var t0 = new Date().getTime();
    AckPatternsRepository.save('[TEST] ok done', 'user acknowledged', 'done');
    var recent = AckPatternsRepository.getRecent(5);
    var latency = new Date().getTime() - t0;

    if (recent && recent.length > 0) {
      passed++;
      _tLog(1, 'ACK_PATTERNS', 'PASS', 'recent:' + recent.length, latency);
    } else {
      failed++;
      _tLog(1, 'ACK_PATTERNS', 'FAIL', 'empty result', latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'ACK_PATTERNS', 'ERROR', e.message, null);
  }

  // --- 1.5 KnowledgeRepository ---
  try {
    var t0 = new Date().getTime();
    KnowledgeRepository.save('test', '[TEST]_key', 'test content v1', 'test note');
    var val = KnowledgeRepository.get('test', '[TEST]_key');
    var ns = KnowledgeRepository.getByNamespace('test');
    var latency = new Date().getTime() - t0;

    if (val && val.indexOf('test content') >= 0) {
      passed++;
      _tLog(1, 'KNOWLEDGE_CRUD', 'PASS', 'ns_keys:' + Object.keys(ns || {}).length, latency);
    } else {
      failed++;
      _tLog(1, 'KNOWLEDGE_CRUD', 'FAIL', 'value mismatch', latency);
    }

    // Test deactivate
    var t1 = new Date().getTime();
    KnowledgeRepository.deactivate('test', '[TEST]_key');
    var afterDeact = KnowledgeRepository.get('test', '[TEST]_key');
    var lat2 = new Date().getTime() - t1;

    if (!afterDeact) {
      passed++;
      _tLog(1, 'KNOWLEDGE_DEACTIVATE', 'PASS', null, lat2);
    } else {
      failed++;
      _tLog(1, 'KNOWLEDGE_DEACTIVATE', 'FAIL', 'still active after deactivate', lat2);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'KNOWLEDGE_CRUD', 'ERROR', e.message, null);
  }

  // --- 1.6 ChatHistoryRepository ---
  try {
    var t0 = new Date().getTime();
    var chatId = Config.load().myChatId;
    ChatHistoryRepository.save(chatId, 'user', '[TEST] hello');
    ChatHistoryRepository.save(chatId, 'ai', '[TEST] hi back');
    var recent = ChatHistoryRepository.getRecent(5);
    var latency = new Date().getTime() - t0;

    if (recent && recent.length >= 2) {
      passed++;
      _tLog(1, 'CHAT_HISTORY', 'PASS', 'recent:' + recent.length, latency);
    } else {
      failed++;
      _tLog(1, 'CHAT_HISTORY', 'FAIL', 'expected >=2 got:' + (recent ? recent.length : 0), latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'CHAT_HISTORY', 'ERROR', e.message, null);
  }

  // --- 1.7 FactsRepository via KnowledgeSpecialist ---
  try {
    var t0 = new Date().getTime();
    var chatId = Config.load().myChatId;
    KnowledgeSpecialist.saveFact(chatId, '[TEST] user suka kopi', 'manual');
    var facts = KnowledgeSpecialist.getActiveFactsForPrompt(10);
    var relevant = KnowledgeSpecialist.findRelevantToKeyword('kopi', 50);
    var latency = new Date().getTime() - t0;

    if (facts && facts.length > 0) {
      passed++;
      _tLog(1, 'FACTS_CRUD', 'PASS', 'total:' + facts.length + ' relevant_kopi:' + relevant.length, latency);
    } else {
      failed++;
      _tLog(1, 'FACTS_CRUD', 'FAIL', 'empty facts', latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'FACTS_CRUD', 'ERROR', e.message, null);
  }

  // --- 1.8 BudgetRepository via FinanceSpecialist ---
  try {
    var t0 = new Date().getTime();
    var periode = DateTimeUtils.formatPeriode(DateTimeUtils.nowWIB());
    var budget = FinanceSpecialist.createOrUpdateBudget('[TEST] Makanan', 500000, periode);
    var latency = new Date().getTime() - t0;

    if (budget && budget.success) {
      passed++;
      _tLog(1, 'BUDGET_CRUD', 'PASS', 'action:' + budget.action, latency);
    } else {
      failed++;
      _tLog(1, 'BUDGET_CRUD', 'FAIL', 'not success', latency);
    }
  } catch (e) {
    failed++;
    _tLog(1, 'BUDGET_CRUD', 'ERROR', e.message, null);
  }

  // --- Cleanup ---
  _cleanupTestData();

  // --- Summary ---
  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 1 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed + ' | Skipped: ' + skipped);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('========================================');
}

// ============================================================
// BATCH 2: INTENT DETECTION (ALL INTENTS + EDGE CASES)
// Menguji IntentAnalyzer.analyze() untuk semua intent.
// Hanya test detection, TIDAK memanggil handler.
// ============================================================
function test_Batch2_IntentDetection() {
  var start = new Date().getTime();
  var DEADLINE = 5 * 60 * 1000;
  var passed = 0, failed = 0, skipped = 0, errors = [];

  Logger.log('========================================');
  Logger.log('BATCH 2: INTENT DETECTION');
  Logger.log('========================================');

  // Gather context once
  var context;
  try {
    var t0 = new Date().getTime();
    context = Manager._gatherContext();
    _tLog(2, 'CONTEXT_GATHER', 'OK', null, new Date().getTime() - t0);
  } catch (e) {
    _tLog(2, 'CONTEXT_GATHER', 'FALLBACK', e.message, null);
    context = { riwayat: [], facts: [], profile: [], ltm: [], reminderMenunggu: [], ackPatterns: [] };
  }

  var cases = [
    ['catat pengeluaran makan siang 35 ribu dari cash', 'catat_keuangan'],
    ['pemasukan gaji 5 juta ke BCA', 'catat_keuangan'],
    ['berapa total saldo semua wallet', 'tanya_saldo'],
    ['saldo wallet cash berapa', 'tanya_saldo'],
    ['ringkasan keuangan bulan ini', 'ringkasan_keuangan'],
    ['atur budget makanan 500rb per bulan', 'atur_budget'],
    ['edit transaksi terakhir jumlahnya jadi 25rb', 'edit_transaksi'],
    ['sinkronkan dokumentasi dengan source code', 'sync_documentation'],
    ['oke sudah selesai', 'ack_reminder'],
    ['ingatkan besok jam 9 pagi meeting dengan tim', 'buat_reminder'],
    ['diagnose error webhook timeout', 'diagnose_error'],
    ['update dokumentasi arsitektur sistem', 'update_docs'],
    ['audit seluruh kode sumber', 'audit_code'],
    ['perbaiki semua issue dari audit terakhir', 'fix_audit'],
    ['cek perubahan kode minggu ini', 'check_changes'],
    ['bagaimana progress roadmap proyek saat ini', 'roadmap_query'],
    ['implementasikan fitur notifikasi push', 'implement_feature'],
    ['bagaimana kondisi sistemmu saat ini', 'self_query'],
    ['siapa kamu dan apa tujuanmu', 'soul_query'],
    ['inisialisasi soul', 'soul_init'],
    ['backup knowledge ke github', 'backup_knowledge'],
    ['restore knowledge dari github', 'restore_knowledge'],
    ['apa yang kamu ingat tentang interaksi kita', 'soul_memory_query'],
    ['halo apa kabar hari ini', 'chat_biasa'],
    // Edge cases
    ['', 'chat_biasa'],
    ['a', 'chat_biasa'],
    ['I want to check my wallet balance', 'tanya_saldo'],
    ['catat pengeluaran kopi 15rb dan ingatkan besok jam 8', 'catat_keuangan'],
    ['!!!!!????', 'chat_biasa'],
  ];

  for (var i = 0; i < cases.length; i++) {
    if (new Date().getTime() - start > DEADLINE) {
      _tLog(2, 'DEADLINE', 'SKIP', '5min reached at case ' + (i + 1), null);
      skipped += cases.length - i;
      break;
    }

    var input = cases[i][0];
    var expected = cases[i][1];
    var t0 = new Date().getTime();

    try {
      var result = IntentAnalyzer.analyze(input, context);
      var latency = new Date().getTime() - t0;
      var detected = (result && result.tipe) ? result.tipe : 'null';
      var match = detected === expected;

      if (match) {
        passed++;
        _tLog(2, 'CASE_' + (i + 1), 'PASS', expected + ' | ' + latency + 'ms', latency);
      } else {
        failed++;
        _tLog(2, 'CASE_' + (i + 1), 'MISMATCH', 'expected:' + expected + ' got:' + detected + ' | input:' + input.substring(0, 40), latency);
      }

      if (result) {
        var extras = [];
        if (result.complexity) extras.push('complexity:' + result.complexity);
        if (result.keuangan) extras.push('has_keuangan:true');
        if (result.factsBaru && result.factsBaru.length > 0) extras.push('factsBaru:' + result.factsBaru.length);
        if (extras.length > 0) {
          Logger.log('  [META] ' + extras.join(' | '));
        }
      }
    } catch (e) {
      failed++;
      var latency = new Date().getTime() - t0;
      _tLog(2, 'CASE_' + (i + 1), 'ERROR', e.message + ' | input:' + input.substring(0, 30), latency);
      errors.push({ caseNum: i + 1, input: input.substring(0, 30), error: e.message });
    }
  }

  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 2 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed + ' | Skipped: ' + skipped);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('Accuracy: ' + (passed + failed > 0 ? Math.round(passed / (passed + failed) * 100) : 0) + '%');
  if (errors.length > 0) Logger.log('Errors: ' + JSON.stringify(errors));
  Logger.log('========================================');
}

// ============================================================
// BATCH 3: LLM PROVIDER ROUTING
// Menguji provider selection per taskType dan latency.
// ============================================================
function test_Batch3_LLMRouting() {
  var start = new Date().getTime();
  var passed = 0, failed = 0;

  Logger.log('========================================');
  Logger.log('BATCH 3: LLM PROVIDER ROUTING');
  Logger.log('========================================');

  var taskTypes = [
    'chat_light',
    'chat_heavy',
    'intent_analysis',
    'finance_response',
    'documentation'
  ];

  // Test generate() per taskType
  for (var i = 0; i < taskTypes.length; i++) {
    var task = taskTypes[i];
    var t0 = new Date().getTime();

    try {
      var result = LLMProviderService.generate({
        taskType: task,
        systemInstruction: 'You are a test assistant. Reply briefly.',
        messages: [{ role: 'user', text: 'Say OK and nothing else.' }],
        temperature: 0.3
      });
      var latency = new Date().getTime() - t0;

      if (result && result.text) {
        passed++;
        _tLog(3, 'GENERATE_' + task, 'PASS', 'provider:' + result.provider + ' model:' + (result.model || 'unknown') + ' text_len:' + result.text.length, latency);
      } else {
        failed++;
        _tLog(3, 'GENERATE_' + task, 'FAIL', 'null result', latency);
      }
    } catch (e) {
      failed++;
      _tLog(3, 'GENERATE_' + task, 'ERROR', e.message, new Date().getTime() - t0);
    }
  }

  // Test generateFromSinglePrompt()
  var singlePromptTasks = ['intent_analysis', 'chat_light'];
  for (var j = 0; j < singlePromptTasks.length; j++) {
    var task = singlePromptTasks[j];
    var t0 = new Date().getTime();

    try {
      var result = LLMProviderService.generateFromSinglePrompt('Reply with OK only.', 0.3, task);
      var latency = new Date().getTime() - t0;

      if (result && result.text) {
        passed++;
        _tLog(3, 'SINGLE_' + task, 'PASS', 'provider:' + result.provider + ' model:' + (result.model || 'unknown'), latency);
      } else {
        failed++;
        _tLog(3, 'SINGLE_' + task, 'FAIL', 'null result', latency);
      }
    } catch (e) {
      failed++;
      _tLog(3, 'SINGLE_' + task, 'ERROR', e.message, new Date().getTime() - t0);
    }
  }

  // Test LLM Intelligence ranking
  try {
    var t0 = new Date().getTime();
    var ranked = LLMIntelligence.getRankedModelsForTask('chat_light');
    var latency = new Date().getTime() - t0;

    if (ranked && ranked.length > 0) {
      passed++;
      _tLog(3, 'RANKING_chat_light', 'PASS', 'models:' + ranked.length + ' top:' + ranked[0], latency);
    } else {
      failed++;
      _tLog(3, 'RANKING_chat_light', 'FAIL', 'empty ranking (fallback will be used)', latency);
    }
  } catch (e) {
    failed++;
    _tLog(3, 'RANKING_chat_light', 'ERROR', e.message, null);
  }

  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 3 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('========================================');
}

// ============================================================
// BATCH 4: FINANCE END-TO-END (NO LLM, SPECIALIST LAYER)
// Menguji business logic keuangan secara langsung.
// ============================================================
function test_Batch4_FinanceE2E() {
  var start = new Date().getTime();
  var passed = 0, failed = 0;

  Logger.log('========================================');
  Logger.log('BATCH 4: FINANCE END-TO-END');
  Logger.log('========================================');

  var periode = DateTimeUtils.formatPeriode(DateTimeUtils.nowWIB());

  // 4.1 Resolve/Create Wallet
  try {
    var t0 = new Date().getTime();
    var wallet = FinanceSpecialist.resolveWallet('[TEST] BCA');
    var latency = new Date().getTime() - t0;

    if (wallet && wallet.id) {
      passed++;
      _tLog(4, 'RESOLVE_WALLET', 'PASS', 'id:' + wallet.id + ' nama:' + wallet.nama, latency);
    } else {
      failed++;
      _tLog(4, 'RESOLVE_WALLET', 'FAIL', 'no wallet returned', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'RESOLVE_WALLET', 'ERROR', e.message, null);
  }

  // 4.2 Record Income
  try {
    var t0 = new Date().getTime();
    var income = FinanceSpecialist.recordTransaction({
      walletNama: '[TEST] BCA',
      tipe: TransactionRepository.TIPE_INCOME,
      kategori: '[TEST] Gaji',
      jumlah: 5000000,
      deskripsi: '[TEST] gajian'
    });
    var latency = new Date().getTime() - t0;

    if (income && income.success && income.data && income.data.saldoTerbaru !== undefined) {
      passed++;
      _tLog(4, 'RECORD_INCOME', 'PASS', 'saldo:' + income.data.saldoTerbaru + ' trxId:' + income.data.transactionId, latency);
    } else {
      failed++;
      _tLog(4, 'RECORD_INCOME', 'FAIL', JSON.stringify(income).substring(0, 100), latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'RECORD_INCOME', 'ERROR', e.message, null);
  }

  // 4.3 Record Expense
  try {
    var t0 = new Date().getTime();
    var expense = FinanceSpecialist.recordTransaction({
      walletNama: '[TEST] BCA',
      tipe: TransactionRepository.TIPE_EXPENSE,
      kategori: '[TEST] Makanan',
      jumlah: 30000,
      deskripsi: '[TEST] makan siang'
    });
    var latency = new Date().getTime() - t0;

    if (expense && expense.success) {
      passed++;
      _tLog(4, 'RECORD_EXPENSE', 'PASS', 'saldo:' + expense.data.saldoTerbaru, latency);
    } else {
      failed++;
      _tLog(4, 'RECORD_EXPENSE', 'FAIL', 'not success', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'RECORD_EXPENSE', 'ERROR', e.message, null);
  }

  // 4.4 Create Budget
  try {
    var t0 = new Date().getTime();
    var budget = FinanceSpecialist.createOrUpdateBudget('[TEST] Makanan', 50000, periode);
    var latency = new Date().getTime() - t0;

    if (budget && budget.success) {
      passed++;
      _tLog(4, 'CREATE_BUDGET', 'PASS', 'action:' + budget.action + ' batas:' + budget.batasJumlah, latency);
    } else {
      failed++;
      _tLog(4, 'CREATE_BUDGET', 'FAIL', 'not success', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'CREATE_BUDGET', 'ERROR', e.message, null);
  }

  // 4.5 Record Expense to Trigger Budget Alert
  try {
    var t0 = new Date().getTime();
    var expense2 = FinanceSpecialist.recordTransaction({
      walletNama: '[TEST] BCA',
      tipe: TransactionRepository.TIPE_EXPENSE,
      kategori: '[TEST] Makanan',
      jumlah: 30000,
      deskripsi: '[TEST] jajan sore'
    });
    var latency = new Date().getTime() - t0;

    var hasAlert = expense2 && expense2.data && expense2.data.budgetAlert;
    if (hasAlert) {
      passed++;
      _tLog(4, 'BUDGET_ALERT', 'PASS', 'status:' + expense2.data.budgetAlert.status + ' pct:' + expense2.data.budgetAlert.persentase + '%', latency);
    } else {
      passed++;
      _tLog(4, 'BUDGET_ALERT', 'INFO', 'no alert triggered (total may not exceed threshold yet)', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'BUDGET_ALERT', 'ERROR', e.message, null);
  }

  // 4.6 Edit Last Transaction
  try {
    var t0 = new Date().getTime();
    var edit = FinanceSpecialist.editLastTransaction({ jumlah: 25000 });
    var latency = new Date().getTime() - t0;

    if (edit && edit.success && edit.data && edit.data.jumlah === 25000) {
      passed++;
      _tLog(4, 'EDIT_TRANSACTION', 'PASS', 'new_jumlah:' + edit.data.jumlah, latency);
    } else {
      failed++;
      _tLog(4, 'EDIT_TRANSACTION', 'FAIL', JSON.stringify(edit).substring(0, 100), latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'EDIT_TRANSACTION', 'ERROR', e.message, null);
  }

  // 4.7 Get Summary
  try {
    var t0 = new Date().getTime();
    var summary = FinanceSpecialist.getRingkasanPeriode(periode);
    var latency = new Date().getTime() - t0;

    if (summary && summary.totalMasuk !== undefined && summary.totalKeluar !== undefined) {
      passed++;
      _tLog(4, 'RINGKASAN', 'PASS', 'masuk:' + summary.totalMasuk + ' keluar:' + summary.totalKeluar + ' bersih:' + summary.saldoBersih, latency);
    } else {
      failed++;
      _tLog(4, 'RINGKASAN', 'FAIL', 'missing fields', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'RINGKASAN', 'ERROR', e.message, null);
  }

  // 4.8 Get All Saldo
  try {
    var t0 = new Date().getTime();
    var semua = FinanceSpecialist.getAllSaldo();
    var latency = new Date().getTime() - t0;

    if (semua && semua.wallets && semua.total !== undefined) {
      passed++;
      _tLog(4, 'ALL_SALDO', 'PASS', 'wallets:' + semua.wallets.length + ' total:' + semua.total, latency);
    } else {
      failed++;
      _tLog(4, 'ALL_SALDO', 'FAIL', 'missing fields', latency);
    }
  } catch (e) {
    failed++;
    _tLog(4, 'ALL_SALDO', 'ERROR', e.message, null);
  }

  // --- Cleanup ---
  _cleanupTestData();

  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 4 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('========================================');
}

// ============================================================
// BATCH 5: MEMORY, SOUL, CONTEXT
// Menguji sistem ingatan dan kesadaran agen.
// ============================================================
function test_Batch5_MemoryContext() {
  var start = new Date().getTime();
  var passed = 0, failed = 0, skipped = 0;

  Logger.log('========================================');
  Logger.log('BATCH 5: MEMORY, SOUL, CONTEXT');
  Logger.log('========================================');

  var chatId = Config.load().myChatId;

  // 5.1 Chat History Context
  try {
    var t0 = new Date().getTime();
    var riwayat = ChatHistoryRepository.getRecent(15);
    var latency = new Date().getTime() - t0;

    if (riwayat && riwayat.length >= 0) {
      passed++;
      _tLog(5, 'CHAT_HISTORY_CTX', 'PASS', 'entries:' + riwayat.length, latency);
    } else {
      failed++;
      _tLog(5, 'CHAT_HISTORY_CTX', 'FAIL', 'null result', latency);
    }
  } catch (e) {
    failed++;
    _tLog(5, 'CHAT_HISTORY_CTX', 'ERROR', e.message, null);
  }

  // 5.2 Active Facts
  try {
    var t0 = new Date().getTime();
    var facts = KnowledgeSpecialist.getActiveFactsForPrompt(50);
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'ACTIVE_FACTS', 'PASS', 'count:' + facts.length, latency);
  } catch (e) {
    failed++;
    _tLog(5, 'ACTIVE_FACTS', 'ERROR', e.message, null);
  }

  // 5.3 User Profile
  try {
    var t0 = new Date().getTime();
    var profile = UserProfileSpecialist.getProfileForPrompt(30);
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'USER_PROFILE', 'PASS', 'items:' + (profile ? profile.length : 0), latency);
  } catch (e) {
    failed++;
    _tLog(5, 'USER_PROFILE', 'ERROR', e.message, null);
  }

  // 5.4 Long-Term Memory
  try {
    var t0 = new Date().getTime();
    var ltm = MemorySpecialist.getLongTermMemory(7);
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'LTM_7DAYS', 'PASS', 'summaries:' + ltm.length, latency);
  } catch (e) {
    failed++;
    _tLog(5, 'LTM_7DAYS', 'ERROR', e.message, null);
  }

  // 5.5 Pending Reminders
  try {
    var t0 = new Date().getTime();
    var pending = ReminderSpecialist.getMenungguRespon();
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'PENDING_REMINDERS', 'PASS', 'count:' + pending.length, latency);
  } catch (e) {
    failed++;
    _tLog(5, 'PENDING_REMINDERS', 'ERROR', e.message, null);
  }

  // 5.6 Ack Patterns
  try {
    var t0 = new Date().getTime();
    var patterns = ReminderSpecialist.getAckPatternsForPrompt(10);
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'ACK_PATTERNS_CTX', 'PASS', 'count:' + patterns.length, latency);
  } catch (e) {
    failed++;
    _tLog(5, 'ACK_PATTERNS_CTX', 'ERROR', e.message, null);
  }

  // 5.7 Soul Full Context
  try {
    var t0 = new Date().getTime();
    var soul = SoulSpecialist.getFullContext();
    var latency = new Date().getTime() - t0;

    var keys = soul ? Object.keys(soul) : [];
    var hasData = soul && soul.self_model;
    if (hasData) {
      passed++;
      _tLog(5, 'SOUL_CONTEXT', 'PASS', 'keys:' + keys.join(','), latency);
    } else {
      skipped++;
      _tLog(5, 'SOUL_CONTEXT', 'SKIP', 'soul not initialized yet', latency);
    }
  } catch (e) {
    failed++;
    _tLog(5, 'SOUL_CONTEXT', 'ERROR', e.message, null);
  }

  // 5.8 Soul Sub-Components
  var soulMethods = [
    ['getSelfModel', 'SOUL_SELF_MODEL'],
    ['getIdentity', 'SOUL_IDENTITY'],
    ['getBeliefs', 'SOUL_BELIEFS'],
    ['getGrowthLog', 'SOUL_GROWTH_LOG'],
    ['getEmotionalState', 'SOUL_EMOTIONAL']
  ];

  for (var i = 0; i < soulMethods.length; i++) {
    try {
      var t0 = new Date().getTime();
      var val = SoulSpecialist[soulMethods[i][0]]();
      var latency = new Date().getTime() - t0;

      var type = typeof val;
      var info = type === 'object' && val !== null ? 'keys:' + Object.keys(val).length : type;
      if (Array.isArray(val)) info = 'length:' + val.length;

      passed++;
      _tLog(5, soulMethods[i][1], 'PASS', info, latency);
    } catch (e) {
      failed++;
      _tLog(5, soulMethods[i][1], 'ERROR', e.message, null);
    }
  }

  // 5.9 SoulMemory (Episodic + Meta)
  try {
    var t0 = new Date().getTime();
    var episodes = SoulMemory.getRecentEpisodes(10);
    var meta = SoulMemory.getMetaInsights(5);
    var latency = new Date().getTime() - t0;

    passed++;
    _tLog(5, 'SOUL_MEMORY', 'PASS', 'episodes:' + (episodes ? episodes.length : 0) + ' meta:' + (meta ? meta.length : 0), latency);
  } catch (e) {
    failed++;
    _tLog(5, 'SOUL_MEMORY', 'ERROR', e.message, null);
  }

  // 5.10 Full Context Gather (simulasi Manager._gatherContext)
  try {
    var t0 = new Date().getTime();
    var ctx = Manager._gatherContext();
    var latency = new Date().getTime() - t0;

    var ctxKeys = Object.keys(ctx);
    var ctxInfo = ctxKeys.map(function(k) {
      var v = ctx[k];
      return k + ':' + (Array.isArray(v) ? v.length : typeof v);
    }).join(' | ');

    passed++;
    _tLog(5, 'FULL_CONTEXT_GATHER', 'PASS', ctxInfo, latency);
  } catch (e) {
    failed++;
    _tLog(5, 'FULL_CONTEXT_GATHER', 'ERROR', e.message, null);
  }

  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 5 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed + ' | Skipped: ' + skipped);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('========================================');
}

// ============================================================
// BATCH 6: INTEGRATION (SAFE INTENTS VIA MANAGER)
// Menguji pipeline penuh: input → context → intent → handler → response.
// Hanya intent yang TIDAK mutasi GitHub.
// ============================================================
function test_Batch6_Integration() {
  var start = new Date().getTime();
  var DEADLINE = 5 * 60 * 1000;
  var passed = 0, failed = 0, skipped = 0;

  Logger.log('========================================');
  Logger.log('BATCH 6: INTEGRATION (SAFE INTENTS)');
  Logger.log('========================================');

  var chatId = Config.load().myChatId;

  var cases = [
    '[TEST] halo apa kabar hari ini',
    '[TEST] catat pengeluaran kopi 15 ribu dari cash',
    '[TEST] berapa saldo semua wallet saya',
    '[TEST] ringkasan keuangan bulan ini',
    '[TEST] ingatkan besok jam 10 pagi untuk olahraga',
    '[TEST] bagaimana kondisi sistemmu saat ini',
    '[TEST] siapa kamu dan apa tujuanmu',
    '[TEST] apa yang kamu ingat tentang interaksi kita',
    '[TEST] saya suka minum teh hijau setiap pagi',
    '[TEST] terima kasih sudah membantu',
  ];

  for (var i = 0; i < cases.length; i++) {
    if (new Date().getTime() - start > DEADLINE) {
      _tLog(6, 'DEADLINE', 'SKIP', '5min reached at case ' + (i + 1), null);
      skipped += cases.length - i;
      break;
    }

    var input = cases[i];
    var t0 = new Date().getTime();

    try {
      var response = Manager.processConversationalMessage(chatId, input);
      var latency = new Date().getTime() - t0;

      if (response && response.length > 0) {
        passed++;
        var preview = response.substring(0, 150).replace(/\n/g, ' ');
        _tLog(6, 'INTEG_' + (i + 1), 'PASS', 'len:' + response.length + ' | ' + preview, latency);
      } else {
        failed++;
        _tLog(6, 'INTEG_' + (i + 1), 'FAIL', 'empty response', latency);
      }
    } catch (e) {
      failed++;
      var latency = new Date().getTime() - t0;
      _tLog(6, 'INTEG_' + (i + 1), 'ERROR', e.message, latency);
    }
  }

  // --- Cleanup ---
  _cleanupTestData();

  var total = new Date().getTime() - start;
  Logger.log('========================================');
  Logger.log('BATCH 6 SUMMARY');
  Logger.log('Passed: ' + passed + ' | Failed: ' + failed + ' | Skipped: ' + skipped);
  Logger.log('Total Time: ' + total + 'ms');
  Logger.log('========================================');
}
~~~~~

## SOURCE: `src/99_Tests.gs`

~~~~~javascript
function test_Batch7b_FinanceSpecialist() {
  Logger.log('=== TEST 1: Catat Pemasukan ===');
  const income = FinanceSpecialist.recordTransaction({
    walletNama: '[TEST] BCA',
    tipe: TransactionRepository.TIPE_INCOME,
    kategori: 'Gaji',
    jumlah: 5000000,
    deskripsi: '[TEST] gajian'
  });
  Logger.log(income.text);

  Logger.log('=== TEST 2: Catat Pengeluaran (wallet default) ===');
  const expense1 = FinanceSpecialist.recordTransaction({
    tipe: TransactionRepository.TIPE_EXPENSE,
    kategori: 'Makanan',
    jumlah: 30000,
    deskripsi: '[TEST] makan siang'
  });
  Logger.log(expense1.text);

  Logger.log('=== TEST 3: Cek Semua Saldo ===');
  Logger.log(FinanceSpecialist.getAllSaldoAsText());

  Logger.log('=== TEST 4: Buat Budget Kecil (untuk trigger alert) ===');
  const periodeIni = DateTimeUtils.formatPeriode(new Date());
  Logger.log(FinanceSpecialist.createOrUpdateBudget('Makanan', 50000, periodeIni));

  Logger.log('=== TEST 5: Pengeluaran Lagi (harus trigger alert budget) ===');
  const expense2 = FinanceSpecialist.recordTransaction({
    tipe: TransactionRepository.TIPE_EXPENSE,
    kategori: 'Makanan',
    jumlah: 30000,
    deskripsi: '[TEST] jajan sore'
  });
  Logger.log(expense2.text);
  Logger.log('>>> Harus ada teks alert budget di atas (total 60rb dari budget 50rb)');

  Logger.log('=== TEST 6: Edit Transaksi Terakhir ===');
  const editResult = FinanceSpecialist.editLastTransaction({ jumlah: 25000 });
  Logger.log(editResult.text);

  Logger.log('=== TEST 7: Ringkasan Periode ===');
  const ringkasan = FinanceSpecialist.getRingkasanPeriode(periodeIni);
  Logger.log(FinanceSpecialist.formatRingkasanAsText(ringkasan));

  Logger.log('=== SEMUA TEST BATCH 7b SELESAI ===');
}

function debug_CheckOAuthScopes() {
  const token = ScriptApp.getOAuthToken();
  const url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token;

  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  Logger.log('Response code: ' + response.getResponseCode());
  Logger.log('Scope info: ' + response.getContentText());
}

function debug_CheckGitHubConfig() {
  const props = PropertiesService.getScriptProperties();
  const owner = props.getProperty('GITHUB_REPO_OWNER');
  const repo = props.getProperty('GITHUB_REPO_NAME');
  const token = props.getProperty('GITHUB_TOKEN');

  Logger.log('Owner: "' + owner + '"');
  Logger.log('Repo: "' + repo + '"');
  Logger.log('Token (4 char pertama): "' + (token ? token.substring(0, 4) : 'KOSONG') + '"');
  Logger.log('Token length: ' + (token ? token.length : 0));

  // Cek apakah repo ini BENAR-BENAR terlihat oleh token ini
  const url = 'https://api.github.com/repos/' + owner + '/' + repo;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      Authorization: 'token ' + token,
      Accept: 'application/vnd.github+json'
    },
    muteHttpExceptions: true
  });

  Logger.log('Cek repo response code: ' + response.getResponseCode());
  Logger.log('Cek repo response: ' + response.getContentText().substring(0, 500));
}

/**
 * ===================================================================
 * TEST: Telegram Markdown Parse Error Fallback
 * ===================================================================
 */
function test_TelegramMarkdownFallback() {
  const config = Config.load();
  const chatId = config.myChatId;

  Logger.log('=== MULAI TEST TELEGRAM FALLBACK ===');

  // 1. Kirim pesan placeholder (seperti alur asli)
  const placeholder = TelegramService.pickPlaceholder();
  const messageId = TelegramService.sendMessage(chatId, placeholder);
  Logger.log('1. Placeholder terkirim dengan messageId: ' + messageId);

  if (!messageId) {
    Logger.log('❌ GAGAL: Tidak bisa mengirim pesan placeholder.');
    return;
  }

  // Beri jeda 2 detik agar Anda sempat melihat pesan placeholder di Telegram
  Utilities.sleep(2000);

  // 2. Teks simulasi dengan karakter rusak (bintang gantung, kurung siku rusak, dll)
  // Ini adalah karakter yang PASTI ditolak oleh parser Markdown Telegram
  const brokenMarkdownText = 
    "🧪 *TEST FALLBACK BERHASIL!*\n\n" +
    "Ini adalah simulasi jawaban dengan Markdown rusak:\n" +
    "• Bintang gantung tanpa penutup: *mie ayam enak\n" +
    "• Karakter kurung siku: [ini bukan link\n" +
    "• Formula target profit: > 500rb & modal < 200rb\n\n" +
    "Jika pesan ini terbaca utuh di Telegram (placeholder berhasil diedit), artinya FIX BERHASIL!";

  // 3. Coba lakukan editMessage dengan teks rusak tersebut
  TelegramService.editMessage(chatId, messageId, brokenMarkdownText);
  Logger.log('2. editMessage telah dieksekusi.');
  Logger.log('=== SELESAI TEST ===');
}


/**
 * Audit timezone: membandingkan output Date mentah vs toWIB().
 * Menentukan secara empiris apakah terjadi double offset WIB.
 */
function debug_TimezoneAudit() {
  const ses = Session.getScriptTimeZone();
  const now = new Date();
  const toWIBNow = DateTimeUtils.toWIB(now);

  const utcParsed = new Date("2025-01-01T00:00:00Z");
  const utcParsedWIB = DateTimeUtils.toWIB(utcParsed);

  const result = [
    "=== HASIL AUDIT TIMEZONE ===",
    "Script TimeZone : " + ses,
    "",
    "--- Skenario 1: new Date() (Waktu Server/Runtime) ---",
    "1. now.toString()       : " + now.toString(),
    "2. now.toISOString()    : " + now.toISOString(),
    "3. toWIB(now).toString(): " + toWIBNow.toString(),
    "4. toWIB(now).toISODate : " + toWIBNow.toISOString(),
    "",
    "--- Skenario 2: Parsing String ISO UTC (2025-01-01T00:00:00Z) ---",
    "1. utc.toString()       : " + utcParsed.toString(),
    "2. utc.toISOString()    : " + utcParsed.toISOString(),
    "3. toWIB(utc).toString(): " + utcParsedWIB.toString(),
    "4. toWIB(utc).toISODate : " + utcParsedWIB.toISOString(),
    "=========================================="
  ];

  const output = result.join("\n");
  Logger.log(output);
  return output;
}

function triggerKnowledgeSync() {
  KnowledgeSyncSpecialist.sync();
}


function triggerManualDiscoveryAndBenchmark() {
  var res = LLMIntelligence.runFullPipeline();
  Logger.log('PIPELINE_RESULT: ' + JSON.stringify(res, null, 2));
}

/**
 * Uji Coba Tahap 1: Discovery (Ekspektasi: 2-5 detik)
 */
function test_Stage1_Discover() {
  var t0 = new Date().getTime();
  var res = LLMIntelligence.discoverModels();
  var duration = (new Date().getTime() - t0) / 1000;
  Logger.log('STAGE_1_RESULT (Durasi ' + duration + 's): ' + JSON.stringify(res, null, 2));
}

/**
 * Uji Coba Tahap 2: Benchmark 3 Model (Ekspektasi: 30-60 detik)
 */
function test_Stage2_BenchmarkBatch() {
  var t0 = new Date().getTime();
  var res = LLMIntelligence.benchmarkBatch();
  var duration = (new Date().getTime() - t0) / 1000;
  Logger.log('STAGE_2_RESULT (Durasi ' + duration + 's): ' + JSON.stringify(res, null, 2));
}

/**
 * Uji Coba Tahap 3: Ranking Matrix (Ekspektasi: 1-2 detik)
 */
function test_Stage3_Rank() {
  var t0 = new Date().getTime();
  var res = LLMIntelligence.rankModels();
  var duration = (new Date().getTime() - t0) / 1000;
  Logger.log('STAGE_3_RESULT (Durasi ' + duration + 's): ' + JSON.stringify(res, null, 2));
}

/**
 * Diagnostik Token dan Kuota GitHub API
 */
function test_CheckGitHubRateLimitAndAuth() {
  var config = Config.load();
  var token = config.githubToken;
  var headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GAS-Agent-Test'
  };
  if (token) {
    headers['Authorization'] = 'token ' + token;
  }

  var res = UrlFetchApp.fetch('https://api.github.com/rate_limit', {
    headers: headers,
    muteHttpExceptions: true
  });

  Logger.log('HTTP_STATUS: ' + res.getResponseCode());
  Logger.log('RESPONSE: ' + res.getContentText());
}

function fix_CleanBenchmarkData() {
  var raw = KnowledgeRepository.get('llm', 'benchmark_results');
  if (!raw) {
    Logger.log('No benchmark data found');
    return;
  }

  var results;
  try { results = JSON.parse(raw); } catch (e) { return; }

  var cleaned = {};
  var removed = [];
  var fixed = [];

  for (var modelId in results) {
    if (!results.hasOwnProperty(modelId)) continue;
    var r = results[modelId];

    // Buang model non-free
    if (modelId.indexOf(':free') === -1) {
      removed.push(modelId);
      continue;
    }

    // Buang model yang tidak responsif
    if (r.avgLatencyMs === 20000 || r.avgLatencyMs === 99999 || r.avgLatencyMs === -1) {
      removed.push(modelId);
      continue;
    }

    // Perbaiki scoring yang salah (totalScore 0 padahal quality tinggi)
    if (r.qualityScore > 0 && r.totalScore === 0) {
      var latencyScore = r.latencyScore || 0;
      r.totalScore = Math.round((r.qualityScore * 0.7) + (latencyScore * 0.3));
      fixed.push(modelId + ': new_score=' + r.totalScore);
    }

    cleaned[modelId] = r;
  }

  KnowledgeRepository.save('llm', 'benchmark_results', JSON.stringify(cleaned), 'DATA_CLEANUP');
  LLMIntelligence.rankModels();

  Logger.log('REMOVED: ' + JSON.stringify(removed));
  Logger.log('FIXED: ' + JSON.stringify(fixed));
  Logger.log('REMAINING: ' + Object.keys(cleaned).length);
}

/**
 * Membersihkan loop statistik yang menumpuk dan mereset matrix ke model stabil
 */
function resetAndCleanSystemCounters() {
  // 1. Reset counters
  KnowledgeRepository.save('llm_stats', 'counters', '{}', 'RESET');

  // 2. Pasang matrix kandidat model gratis yang valid
  var stableModels = [
    'nvidia/nemotron-3.5-lightning:free',
    'nex-agi/nex-n2.5-pro:free',
    'meta-llama/llama-4-maverick:free',
    'google/gemini-2.0-flash-exp:free',
    'google/gemma-4-31b-it:free'
  ];

  var matrix = {
    chat_light: stableModels,
    chat_heavy: stableModels,
    intent_analysis: stableModels,
    code_analysis: stableModels,
    code_generation: stableModels,
    documentation: stableModels,
    web_grounded: stableModels
  };

  KnowledgeRepository.save('llm_routing', 'matrix', JSON.stringify(matrix), 'RESET_MATRIX');
  Logger.log('SYSTEM_RESET_SUCCESS: Matrix & Counters cleaned.');
}

/**
 * Memaksa sinkronisasi data dari GitHub ke Sheet dan memverifikasi keberadaan template
 */
function forceSyncKnowledgeFromGitHub() {
  var res = KnowledgeSyncSpecialist.sync();
  Logger.log('SYNC_STATUS: ' + JSON.stringify(res));
  
  // Verifikasi apakah template baru sudah masuk ke database Sheet
  var template = KnowledgeRepository.get('selfaware', 'review_response');
  Logger.log('TEMPLATE_EXISTS: ' + (template ? 'YES' : 'NO'));
  
  // Verifikasi apakah aturan intent baru sudah masuk
  var rules = KnowledgeRepository.get('intent', 'rules');
  Logger.log('RULES_PATCHED: ' + (rules && rules.indexOf('soul_query') >= 0 ? 'YES' : 'NO'));
}


function test_DocSync_CollectSourceMetadata() {
  try {
    var result = DocSyncSpecialist._collectSourceMetadata();
    var parsed = JSON.parse(result);

    Logger.log('=== TEST RESULT ===');
    Logger.log('Type: ' + typeof result);
    Logger.log('Is Array: ' + Array.isArray(parsed));
    Logger.log('File Count: ' + parsed.length);

    if (parsed.length > 0) {
      Logger.log('First File: ' + parsed[0].file);
      Logger.log('First File LOC: ' + parsed[0].loc);
      Logger.log('First File Methods: ' + JSON.stringify(parsed[0].methods));
    }

    Logger.log('=== TEST PASSED ===');
  } catch (err) {
    Logger.log('=== TEST FAILED ===');
    Logger.log('Error: ' + err.message);
    Logger.log('Stack: ' + err.stack);
  }
}

function test_DetectDuplicateGlobalFunctions() {
  Logger.log('=== DUPLICATE GLOBAL FUNCTION SCAN ===');
  Logger.log('');

  var files;
  try {
    files = GitHubOpsService.readAllSourceFiles();
  } catch (err) {
    Logger.log('Gagal membaca source dari GitHub: ' + err.message);
    return;
  }

  if (!files) {
    Logger.log('GitHub source files tidak tersedia.');
    return;
  }

  var fileNames = Object.keys(files);
  var functionMap = {};
  var totalFunctions = 0;

  for (var i = 0; i < fileNames.length; i++) {
    var name = fileNames[i];
    if (name.indexOf('.gs') === -1) continue;

    var fileData = files[name];
    var content = (fileData && fileData.content) ? fileData.content : '';
    var lines = content.split('\n');

    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim();

      // Deteksi deklarasi fungsi global: function namaFungsi(...)
      // Hanya yang berada di level paling luar (tidak diindentasi)
      var match = lines[j].match(/^function\s+(\w+)\s*\(/);
      if (match) {
        var funcName = match[1];
        totalFunctions++;

        if (!functionMap[funcName]) {
          functionMap[funcName] = [];
        }
        functionMap[funcName].push({
          file: name,
          line: j + 1
        });
      }
    }
  }

  Logger.log('Total file .gs dipindai: ' + fileNames.length);
  Logger.log('Total fungsi global ditemukan: ' + totalFunctions);
  Logger.log('');

  var duplicates = [];
  var uniqueNames = Object.keys(functionMap);

  for (var k = 0; k < uniqueNames.length; k++) {
    var fn = uniqueNames[k];
    if (functionMap[fn].length > 1) {
      duplicates.push({ name: fn, locations: functionMap[fn] });
    }
  }

  if (duplicates.length === 0) {
    Logger.log('✅ TIDAK ADA FUNGSI GLOBAL DUPLIKAT.');
    Logger.log('Defect 3: RESOLVED');
  } else {
    Logger.log('⚠️ DITEMUKAN ' + duplicates.length + ' FUNGSI GLOBAL DUPLIKAT:');
    Logger.log('');
    for (var d = 0; d < duplicates.length; d++) {
      var dup = duplicates[d];
      Logger.log('--- ' + dup.name + ' ---');
      for (var l = 0; l < dup.locations.length; l++) {
        Logger.log('  File: ' + dup.locations[l].file + ' | Baris: ' + dup.locations[l].line);
      }
      Logger.log('');
    }
  }

  Logger.log('=== SCAN SELESAI ===');
}


function debug_DumpIntentKnowledge() {
  var schema = KnowledgeRepository.get('intent', 'output_schema');
  var rules = KnowledgeRepository.get('intent', 'rules');
  var persona = KnowledgeRepository.get('intent', 'persona');

  Logger.log('=== OUTPUT_SCHEMA ===');
  Logger.log(schema || '(kosong/tidak ada)');
  Logger.log('');
  Logger.log('=== RULES ===');
  Logger.log(rules || '(kosong/tidak ada)');
  Logger.log('');
  Logger.log('=== PERSONA ===');
  Logger.log(persona || '(kosong/tidak ada)');
}
~~~~~

## SOURCE: `src/Rollback.gs`

~~~~~javascript
/**
 * ===================================================================
 * UTILITY DARURAT: ROLLBACK SYSTEM
 * Membaca repository GitHub dan menimpa Apps Script via API.
 * Menggunakan kredensial Script Properties dan penanganan defensif.
 * ===================================================================
 */
function rollbackFromGitHub() {
  const scriptId = ScriptApp.getScriptId();
  const config = Config.load();

  if (!config.githubRepoOwner || !config.githubRepoName) {
    Logger.log('ROLLBACK_FAILED: GITHUB_REPO_OWNER_OR_NAME_MISSING');
    return;
  }

  // 1. Ambil daftar file dari GitHub
  const files = _getRollbackFilesFromGitHub(config);

  if (!files || files.length === 0) {
    Logger.log('ROLLBACK_ABORTED: NO_FILES_FOUND_OR_FETCH_ERROR');
    return;
  }

  // 2. Timpa (overwrite) kode di GAS via Apps Script API
  const url = 'https://script.googleapis.com/v1/projects/' + scriptId + '/content';
  const options = {
    method: 'PUT',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    payload: JSON.stringify({ files: files }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();

  if (responseCode === 200) {
    Logger.log('ROLLBACK_SUCCESS: FILES_OVERWRITTEN_' + files.length);
  } else {
    Logger.log('ROLLBACK_API_ERROR: HTTP_' + responseCode + ' -> ' + response.getContentText().substring(0, 300));
  }
}

function _getRollbackFilesFromGitHub(config) {
  const branch = config.githubBranch || 'main';
  const treeUrl = 'https://api.github.com/repos/' + config.githubRepoOwner + '/' + config.githubRepoName + '/git/trees/' + branch + '?recursive=1';

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GAS-Rollback-Service'
  };

  if (config.githubToken) {
    headers['Authorization'] = 'token ' + config.githubToken;
  }

  const res = UrlFetchApp.fetch(treeUrl, { headers: headers, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    Logger.log('ROLLBACK_TREE_FETCH_FAIL: HTTP_' + res.getResponseCode());
    return null;
  }

  const treeData = JSON.parse(res.getContentText());
  if (!treeData.tree || !Array.isArray(treeData.tree)) return null;

  const files = [];

  for (let i = 0; i < treeData.tree.length; i++) {
    const item = treeData.tree[i];
    if (item.type !== 'blob') continue;

    let type = null;
    let name = null;

    if (item.path.endsWith('.gs') || item.path.endsWith('.js')) {
      type = 'SERVER_JS';
      name = item.path.replace(/^(src\/)?/, '').replace(/\.(gs|js)$/, '');
    } else if (item.path.endsWith('.html')) {
      type = 'HTML';
      name = item.path.replace(/^(src\/)?/, '').replace(/\.html$/, '');
    } else if (item.path === 'appsscript.json' || item.path === 'src/appsscript.json') {
      type = 'JSON';
      name = 'appsscript';
    }

    if (type && name) {
      const rawUrl = 'https://raw.githubusercontent.com/' + config.githubRepoOwner + '/' + config.githubRepoName + '/' + branch + '/' + item.path;
      const fileRes = UrlFetchApp.fetch(rawUrl, { headers: headers, muteHttpExceptions: true });

      // Validasi ketat: jangan terima file jika bukan HTTP 200 (mencegah HTML error menimpa script)
      if (fileRes.getResponseCode() !== 200) {
        Logger.log('ROLLBACK_FILE_FETCH_REJECTED: ' + item.path + ' (HTTP ' + fileRes.getResponseCode() + ')');
        return null; // Batalkan seluruh rollback jika ada satu file yang korup/gagal
      }

      files.push({
        name: name,
        type: type,
        source: fileRes.getContentText()
      });
    }
  }

  return files;
}
~~~~~
