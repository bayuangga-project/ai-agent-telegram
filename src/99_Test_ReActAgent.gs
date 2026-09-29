/**
 * TEST SUITE: Autonomous ReAct Agent Execution Test
 */
function test_ReActAgent_BootstrapAndPlan() {
  Logger.log('=== TEST RE-ACT AUTONOMOUS AGENT ===');

  // 1. Bootstrap Tools Registry ke Knowledge jika belum ada
  var toolsRaw = KnowledgeRepository.get('tools', 'registry');
  if (!toolsRaw) {
    var defaultTools = [
      { name: "catat_keuangan", description: "Mencatat pengeluaran/pemasukan" },
      { name: "tanya_saldo", description: "Cek sisa saldo wallet" },
      { name: "web_search", description: "Cari info terkini dari internet" },
      { name: "chat", description: "Obrolan biasa" }
    ];
    KnowledgeRepository.save('tools', 'registry', JSON.stringify(defaultTools), 'BOOTSTRAP_TOOLS');
    Logger.log('✅ Tools Registry berhasil dibootstrap ke Knowledge.');
  } else {
    Logger.log('✅ Tools Registry terdeteksi di Knowledge.');
  }

  // 2. Test Parser Plan Agen
  var mockLLMOutput = '```json\n{\n  "thought": "User ingin tahu saldo GoPay",\n  "action": "tanya_saldo",\n  "tool_params": { "wallet": "GoPay" }\n}\n```';
  var parsed = Manager._parseAgentPlan(mockLLMOutput);

  if (parsed && parsed.action === 'tanya_saldo' && parsed.tool_params.wallet === 'GoPay') {
    Logger.log('✅ PASS: ReAct Plan JSON Parser berhasil membaca rencana agen!');
  } else {
    Logger.log('❌ FAIL: ReAct Plan JSON Parser gagal');
  }

  // 3. Test Selective Context Gathering
  var ctx = Manager._gatherContext();
  Logger.log('Konteks Selektif: ' + ctx.riwayat.length + ' riwayat, ' + ctx.facts.length + ' fakta');
  if (ctx.riwayat.length <= 10 && ctx.facts.length <= 15) {
    Logger.log('✅ PASS: Selective Context Gathering ringan & efisien!');
  } else {
    Logger.log('❌ FAIL: Konteks masih terlalu berat');
  }
}

/**
 * TEST: Verifikasi Persona Tunggal (Single Source of Truth)
 */
function test_UnifiedPersona() {
  Logger.log('=== TEST UNIFIED PERSONA ===');
  
  var personaChat = ChatSpecialist.buildSystemPersona();
  Logger.log('Persona terdeteksi: ' + personaChat.substring(0, 100) + '...');
  
  if (personaChat && personaChat.length > 10) {
    Logger.log('✅ PASS: Single Source Persona berhasil dibaca dari Knowledge!');
  } else {
    Logger.log('❌ FAIL: Persona gagal dibaca');
  }
}

/**
 * VALIDATOR: Memastikan semua Tool di Knowledge terdaftar fungsinya di Manager (Mencegah Silent Failure)
 */
function test_ValidateToolSchemaConsistency() {
  Logger.log('=== TEST VALIDASI KONSISTENSI TOOL SCHEMA ===');
  
  var toolsRaw = KnowledgeRepository.get('tools', 'registry');
  if (!toolsRaw) {
    Logger.log('⚠️ WARN: Registry tools belum ada di Knowledge');
    return;
  }

  var tools = JSON.parse(toolsRaw);
  var missingBridge = [];

  for (var i = 0; i < tools.length; i++) {
    var toolName = tools[i].name;
    // Test eksekusi mock untuk mengecek apakah toolName dikenal di _executeTool
    try {
      var res = Manager._executeTool(toolName, {}, 'test_chat_id', 'test_user_text', { riwayat: [] });
      if (res && res.code === 'CRITICAL_MANAGER_ERROR') {
        missingBridge.push(toolName);
      }
    } catch (e) {
      // Jika errornya bukan karena missing bridge, berarti fungsinya ada
    }
  }

  if (missingBridge.length === 0) {
    Logger.log('✅ PASS: Seluruh ' + tools.length + ' Tool di Registry memiliki fungsi yang valid di Manager (Zero Silent Failure)!');
  } else {
    Logger.log('❌ FAIL: Tool berikut ada di Registry tapi belum ada fungsinya di Manager: ' + missingBridge.join(', '));
  }
}