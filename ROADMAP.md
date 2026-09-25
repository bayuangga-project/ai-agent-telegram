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