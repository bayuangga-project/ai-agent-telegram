# ARCHITECTURE.md ? ai-agent-telegram

> Dokumen ini menjelaskan arsitektur sistem berdasarkan lima dokumen utama (01-05) yang sudah direview terhadap source code aktual.

## 1. Ringkasan

`ai-agent-telegram` adalah asisten pribadi berbasis Telegram yang dijalankan di Google Apps Script (GAS) dengan Google Sheets sebagai database. Fitur utama sesuai dengan implementasi aktual:

- Percakapan natural language dengan pemahaman intent terstruktur
- Reminder dengan pola recurring & acknowledge natural
- Pencatatan keuangan (wallet, transaksi, budget)
- Penyimpanan fakta/memori jangka panjang
- Web search sebagai konteks tambahan
- Backup & GitHubOps
- Self-healing dan fallback multi-provider

## 2. Tech Stack Terkini

| Lapisan | Teknologi |
|---|---|
| Runtime | Google Apps Script (V8) |
| Database | Google Sheets (multiple sheets sebagai tabel) |
| Channel/UI | Telegram Bot API (webhook) |
| LLM | Multi-provider (Gemini, Groq, OpenRouter) dengan fallback chain |
| Web search | Google CSE + Tavily fallback |
| Ops & Backup | GitHub API |
| Self-Healing | System Health Monitor & Auto-Recovery |
| Timezone | Asia/Jakarta (UTC+7) |

## 3. Model Deployment

- Web App dengan `executeAs: USER_DEPLOYING`
- Otorisasi via shared secret + chatId allowlist
- Time-based triggers untuk reminder, memory summary, audit, dll

## 4. Peta Modul Terkini

Lihat dokumen 02_ARCHITECTURE_AND_FLOWS.md dan 03_IMPLEMENTATION_REFERENCE.md untuk detail lengkap komponen dan alur.

## 5. Alur Utama

Lihat bagian "Main request path" di 02_ARCHITECTURE_AND_FLOWS.md untuk penjelasan lengkap alur pemrosesan pesan.