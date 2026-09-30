# AI_DEVELOPMENT_HANDOVER — Instruksi untuk AI Pengembang Berikutnya

> **Gunakan dokumen ini sebagai briefing engineering.** Verifikasi selalu simbol pada source code sebelum melakukan modifikasi.

## 0. Source-of-truth

Repository yang dikembangkan adalah AI Agent Telegram berbasis Google Apps Script V8 dengan struktur modular lengkap.

**Otoritas:** source code aktual > manifest > runtime knowledge `ai_knowledge.md` > dokumentasi konsolidasi.

## 1. Tujuan sistem

AI Agent menerima pesan Telegram, memproses context (history/facts/profile/reminder/finance), menggunakan LLM untuk intent routing atau chat, lalu menjalankan specialist deterministic untuk finance, reminder, memory, soul, audit, self-healing, docs, web search, dan GitHub operations.

## 2. Contract utama

### Entry points
- `doPost(e)` -> webhook.
- `runDailyAutoSync()` -> sync harian.
- `cekDanKirimReminder()` -> reminder checker.
- `runFullBackup()` -> backup source/docs.

## 3. Catatan Pengembangan
- Pastikan setiap penambahan fitur baru mematuhi pola object literal (`const X = {...}`).
- Jaga agar repositori data tetap terisolasi di folder `04_Repository_*.gs` dan business logic di folder `08_Specialist_*.gs`.
