# ROADMAP — Rekonsiliasi dan Pengembangan Lanjutan

> Roadmap ini menggabungkan roadmap historis dengan hasil audit source aktual. Item di bawah adalah urutan pengerjaan teknis berdasarkan dependensi, bukan penilaian produk secara keseluruhan.

## 1. Tahap 0 — Stabilkan kontrak runtime

1. Perbaiki referensi `DateTimeUtils.formatTanggal` di `MemorySpecialist`.
2. Perbaiki `test_Batch7b_FinanceSpecialist` agar sesuai API actual.
3. Perbaiki `SyncOrchestrator._assessDocumentation()` agar menghitung `Object.keys(files).length`.
4. Perbaiki provisioning sheet agar header/schema dibuat eksplisit saat sheet baru dibuat.

## 2. Tahap 1 — Migrasi canonical documentation

1. Update `KnowledgeRepository` key `docsync:canonical_files` ke lima dokumen baru.
2. Update `docsync:analysis_prompt` agar menunjuk lima dokumen baru dan pembagian tanggung jawabnya.
3. Update `SelfHealingSpecialist.updateDocumentation()` agar menggunakan canonical list dari Knowledge, bukan hardcode legacy.
4. Audit semua source string yang masih menyebut lima dokumen legacy.
5. Jalankan DocSync dan pastikan hanya lima file target yang dapat di-commit oleh pipeline dokumentasi.

## 3. Tahap 2 — Sinkronkan LLM task matrix

Tambahkan ranking bucket terpisah bila memang ingin task specialization nyata:

- `finance_response`
- `docsync_analysis`
- `benchmark_probe`
- `fast`

Atau dokumentasikan secara eksplisit bahwa semuanya sengaja memakai fallback `chat_light`. Jangan menyebut “specialized ranking” bila implementasi masih fallback.

## 4. Tahap 3 — Jadwal dan observability

- Tambahkan trigger tanggal 1 terpisah bila full monthly audit memang requirement.
- Panggil `adaptiveReRank()` pada scheduler bila memang merupakan bagian lifecycle harian.
- Tambahkan manifest hash/version ke ChangeDetector.
- Catat status setiap scheduled task secara konsisten ke `Log_System`.

## 5. Tahap 4 — Contract tests

Tambahkan test untuk:

- setiap intent enum -> handler Manager;
- setiap `taskType` -> LLM matrix/fallback yang eksplisit;
- setiap repository -> schema sheet/header;
- setiap trigger -> global handler function;
- setiap GitHub file path -> branch + SHA conflict behavior;
- setiap documentation target -> canonical allowlist;
- no undefined function references lint sederhana untuk globals/method calls utama.

## 6. Tahap 5 — Hardening engineering agent

- Tambahkan validation terhadap `appsscript.json` sebagai artefak first-class.
- Batasi self-healing agar tidak bisa menulis ke main tanpa branch/PR policy yang eksplisit.
- Tambahkan idempotency untuk sync/backup dan conflict-aware commit.
- Pisahkan clearly diagnosis, patch generation, patch application, dan deployment.
- Tambahkan rollback verification test setelah patch.

## 7. Tahap 6 — Knowledge lifecycle

- Jaga `ai_knowledge.md` sebagai runtime knowledge; gunakan source code sebagai ultimate implementation truth.
- Tandai knowledge snapshot yang bersifat historical/runtime snapshot dengan tanggal.
- Hindari knowledge key yang berisi kontrak method yang sudah tidak ada.
- Buat migration check saat startup/scheduled sync untuk schema intent dan canonical docs.

## 8. Tahap 7 — Future feature development

Flow yang dipertahankan:

`idea -> roadmap/build -> blueprint -> implementation -> static validation -> feature branch -> commit -> PR -> review -> merge/deploy -> documentation sync -> change detection -> roadmap alignment`

FeatureArchitect dapat membantu menghasilkan blueprint dan commit/PR, tetapi repository snapshot ini tidak membuktikan deployment otomatis ke GAS dari GitHub.

## 9. Historical roadmap principle

Roadmap lama mengandung rencana audit, self-healing, LLM intelligence, documentation sync, memory, soul, finance, dan feature architect. Semua capability tersebut tetap direpresentasikan oleh source inventory baru; statusnya sekarang harus dibaca dari `PROGRESS.md` dan source actual, bukan dari label status lama.
