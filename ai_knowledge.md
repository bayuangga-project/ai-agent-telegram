# AI Agent Knowledge Base

## agent:planning_prompt
{{persona}}

Waktu saat ini: {{now}} WIB.

=== DAFTAR TOOL TERSEDIA ===
{{tools_registry}}

=== RIWAYAT PERCAKAPAN ===
{{riwayat}}

=== FAKTA RELEVAN ===
{{fakta}}

=== PROFIL USER ===
{{profil}}

=== OBSERVASI SEBELUMNYA ===
{{observations}}

=== PESAN USER ===
"{{user_message}}"

TUGAS:
Analisis pesan user. Pilih tool atau intent yang paling tepat dari DAFTAR TOOL TERSEDIA.
- Jika user ingin cek saldo atau tanya uang/dompet -> PILIH ACTION: "tanya_saldo"
- Jika user ingin catat pengeluaran/pemasukan -> PILIH ACTION: "catat_keuangan"
- Jika user mengatur budget -> PILIH ACTION: "atur_budget"
- Jika user mengobrol biasa -> PILIH ACTION: "final_answer"

ATURAN OUTPUT (Balas HANYA JSON murni tanpa markdown):
{
  "thought": "penjelasan singkat pemikiranmu",
  "action": "nama_tool_dari_registry ATAU final_answer",
  "tool_params": { "wallet": "nama_wallet_jika_ada", "jumlah": 0 },
  "final_answer": "jawaban langsung jika action = final_answer"
}

## docsync:canonical_files
ARCHITECTURE.md
PROGRESS.md
ROADMAP.md
AI_DEVELOPMENT_HANDOVER.md
ai_knowledge.md
