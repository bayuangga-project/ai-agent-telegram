# 01 — Konteks Sistem, Tujuan, Kebutuhan & Serah-Terima AI

> source of truth: `src/` in the uploaded repository snapshot. legacy `README.md`, `ARCHITECTURE.md`, and `PROGRESS.md` are sengaja tidak digunakan sebagai dasar fakta dalam kumpulan dokumentasi ini.

## 1. Identitas sistem

AI Agent Telegram is a aplikasi Google Apps Script (V8) yang diekspos sebagai webhook Telegram. Sistem menggabungkan orkestrasi LLM percakapan dengan data persisten di Google Sheets serta kemampuan operasional/self-management, termasuk pengingat, memori personal, keuangan, pencarian web, audit kode, pengelolaan roadmap, backup source ke GitHub, self-awareness, dan alur self-healing.

Sistem dirancang dengan model **Manager + Intent Analyzer + Specialist**: Manager mengumpulkan konteks dan merutekan intent terstruktur ke modul specialist; modul specialist menjalankan aksi domain atau membangun jawaban akhir.

## 2. Tujuan perilaku sistem vs kondisi implementasi nyata

Perilaku yang dituju adalah AI agent personal yang mandiri, berinisiatif, berguna, berorientasi ahli, jujur, dan dapat diandalkan. Implementasi mendukung tujuan tersebut melalui konteks persisten, routing intent terstruktur, aksi specialist, otomasi terjadwal, rantai fallback LLM, logging, audit/change detection, and tooling perbaikan. Namun, tingkat otonominya tidak tanpa batas: several repair, verification, deployment, and documentation synchronization loops remain partially automated or depend on human-triggered setup/actions.

### Label kebenaran yang digunakan dalam dokumentasi ini

- **Terimplementasi** — dibuktikan langsung oleh source code yang dapat dieksekusi dan jalur pemanggilan yang dapat dijangkau.
- **Terimplementasi sebagian** — kapabilitas tersedia tetapi satu atau lebih tahap masih hilang, lemah, atau bergantung kondisi.
- **Tersedia/terkonfigurasi** — code tersedia dan dapat beroperasi ketika kredensial/trigger/konfigurasi tersedia.
- **Terisolasi** — code tersedia tetapi routing saat ini tidak secara jelas membuatnya dapat dijangkau dari percakapan biasa.
- **Belum terverifikasi** — inspeksi source saja tidak dapat membuktikan perilaku production berhasil.
- **Risiko/Celah** — kelemahan, inkonsistensi, atau masalah maintainability yang terlihat.

## 3. Pengguna utama dan aktor

| Actor | Peran |
| --- | --- |
| Actor | Peran |
| Pengguna Telegram | Mengirim permintaan bahasa alami, command, acknowledgement, serta instruksi proyek/sistem. |
| Telegram Bot API | Menerima update masuk dan menerima/mengirim pesan keluar. |
| Runtime Google Apps Script | Menjalankan aplikasi, trigger, HTTP call, dan adapter persistence. |
| Google Sheets | Datastore utama aplikasi untuk chat, memory, reminders, finance, logs, audits, roadmap and patches. |
| Provider LLM | Melakukan parsing intent, pembuatan percakapan, audit, pembuatan blueprint, dan diagnosis. |
| Provider pencarian | Menyediakan konteks web eksternal untuk jawaban yang ter-grounding. |
| GitHub | Menyimpan dan memversi source, dokumentasi, serta perubahan perbaikan/backup; mendukung workflow branch/commit/PR. |


## 4. Sistem use-case map

| Use-case | Kapabilitas |
| --- | --- |
| Conversation | Normal chat, complex chat, web-grounded chat, self query. |
| Memori personal | Menyimpan fakta/pembaruan profil; mengambil konteks LTM; merangkum chat harian. |
| Pengingat | Membuat, menampilkan, mengakui, snooze, menyelesaikan, dan mengirim notifikasi sesuai jadwal. |
| Finance | Resolve wallets, record/edit transactions, summarize periods, manage budgets. |
| Manajemen proyek | Membuat/menyesuaikan/mensinkronkan/menanyakan roadmap; memperbarui dokumentasi proyek. |
| Inteligensi kode | Mengaudit kode, memeriksa perubahan, mendiagnosis kegagalan, menghasilkan perbaikan, dan memeriksa repository sendiri. |
| Self-management | Self-awareness reviews, self-healing diagnosis, patch validation/application, scheduled audits/change checks. |
| DevOps | Melakukan backup source/dokumentasi ke GitHub, membuat branch, commit file, dan membuka pull request. |


## 5. Kebutuhan fungsional yang direkonstruksi dari source

### FR-01 Conversational ingress
Menerima request webhook Telegram, memvalidasi otorisasi, mencegah update duplikat, mengekstrak teks pengguna, lalu meneruskannya ke pemrosesan percakapan.
### FR-02 Structured intent understanding
Mengubah pesan bahasa alami menjadi object intent terstruktur bergaya JSON yang memuat field routing serta informasi memory/profile/search/roadmap/reminder/action.
### FR-03 Contextual responses
Membangun respons dari persona, chat terbaru, fakta, profil, memori jangka panjang, pola pengingat, dan konteks web-search opsional.
### FR-04 Persistent state
Menyimpan chat history, fakta, ringkasan, pengingat, pola acknowledgement, catatan keuangan, anggaran, item roadmap, temuan/laporan audit, self-review, dan patch tertunda di Google Sheets.
### FR-05 External intelligence
Menggunakan provider LLM dan provider pencarian yang dapat dikonfigurasi dengan perilaku fallback.
### FR-06 Operational automation
Mendukung pemeriksaan pengingat terjadwal, peringkasan memori malam hari, deteksi perubahan kode mingguan, dan audit terjadwal.
### FR-07 Codebase intelligence
Membaca file source, mengauditnya menggunakan LLM, mendeteksi perubahan, membuat blueprint, mengusulkan patch, dan berinteraksi dengan GitHub.
### FR-08 Versioned backup
Melakukan backup source dan dokumentasi proyek ke GitHub serta mendukung alur branch/commit/PR.

## 6. Kebutuhan nonfungsional yang direkonstruksi dari implementasi

| Quality attribute | Observed implementation |
| --- | --- |
| Reliabilitas | fallback provider LLM/search, pencegahan webhook duplikat, logging best-effort, dan lock untuk safe append. |
| Maintainability | Layered naming convention, repositories/services/specialists/triggers, configuration centralization. |
| Ketertelusuran | log sistem, laporan/temuan audit, catatan patch, snapshot perubahan, dan histori GitHub. |
| Kemampuan pemulihan | tersedia backup GitHub dan kemampuan membuat backup branch. |
| Keamanan | Secret dibaca dari Script Properties; otorisasi webhook berbasis shared secret telah diimplementasikan. |
| Resilience | Beberapa provider LLM dan provider pencarian dapat dirangkai sebagai fallback. |
| Determinisme saat diperlukan | output intent memakai skema terstruktur; aksi keuangan/pengingat menggunakan method specialist, bukan mutasi teks bebas. |


## 7. Core invariants for future AI/developers

1. **Manager adalah orchestrator percakapan.** Kapabilitas percakapan baru pada umumnya harus dapat dijangkau melalui `Manager._routeIntent()` and the intent contract, rather than directly from the webhook.
2. **Repository bertanggung jawab atas konvensi persistence di sheet.** Business logic tidak seharusnya melewati method repository untuk perubahan data tanpa alasan eksplisit.
3. **Konfigurasi berada di Script Properties.** Secret/API key tidak boleh di-hardcode ke source.
4. **Kode hasil generate tidak otomatis dapat dipercaya.** `PatchValidator` is validasi statis, bukan verifikasi perilaku.
5. **Kebenaran dokumentasi berasal dari bukti code/runtime.** Jangan mengubah roadmap/rencana menjadi klaim bahwa fitur telah terimplementasi.
6. **Semantik zona waktu dipusatkan di `DateTimeUtils`, namun konversi WIB saat ini menggunakan transformasi manual +7 jam yang harus diperlakukan dengan hati-hati.**
7. **Fallback LLM merupakan bagian dari desain reliabilitas.** Urutan provider dan pemilihan model merupakan konfigurasi perilaku, bukan detail kosmetik.

## 8. AI handoff instructions

Ketika AI lain mulai mengerjakan repository ini, AI tersebut harus membaca dokumen ini terlebih dahulu, lalu `02_ARCHITECTURE_AND_FLOWS.md`, then `03_IMPLEMENTATION_REFERENCE.md`, sebelum mengubah code. AI harus mengidentifikasi layer yang terdampak, memeriksa rantai caller/callee, menjaga kontrak data-sheet, menjaga bentuk intent terstruktur, dan memperbarui dokumentasi/catatan progress terkait setiap kali perilaku berubah.

## 9. Cakupan dari 16 dokumen sebelumnya

| Original topic | Consolidated location |
| --- | --- |
| Sistem purpose / requirements | This document |
| Sistem analysis | 02 + 03 |
| Arsitektur | 02 |
| Agent behavior / prompts | 01 + 03 |
| Data / memory | 02 + 03 |
| Codebase reference | 03 |
| Function / method reference | 03 |
| Operasional / maintenance | 04 |
| Pengujian / verification | 04 |
| Keamanan / reliability | 04 |
| Celahs / technical debt | 05 |
| Pengembangan guide | 04 |
| Documentation truth | 01 + 05 |
| AI handoff context | 01 |
| Prompt/schema catalog | 03 |
| Module dependency matrix | 02 |


## 10. Snapshot metadata
- Source files: **43 `.gs` files + `appsscript.json`**
- Total baris source `.gs`: **5,963**
- Runtime: Apps Script V8
- Manifest timezone: `Asia/Jakarta`
- Kumpulan dokumentasi sengaja dibatasi menjadi lima file Markdown.