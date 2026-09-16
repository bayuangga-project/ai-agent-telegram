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