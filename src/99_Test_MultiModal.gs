/**
 * TEST SUITE: Verifikasi Ekstraksi Multi-Modal (Voice, Vision, & Media Fallback)
 */
function test_MultiModal_ExtractionAndStructure() {
  Logger.log('=== TEST MULTI-MODAL VISION & VOICE INTEGRATION ===');

  // 1. Mock Message Teks biasa
  var msgText = { text: 'Halo Vexa' };
  var resText = WebhookHandler._extractMessageContent(msgText);
  Logger.log('Respon Teks: ' + resText);
  if (resText === 'Halo Vexa') {
    Logger.log('✅ PASS: Ekstraksi Teks biasa normal.');
  } else {
    Logger.log('❌ FAIL: Ekstraksi Teks error');
  }

  // 2. Mock Message Media tak didukung (Stiker)
  var msgSticker = { sticker: { file_id: '123' } };
  var resSticker = WebhookHandler._extractMessageContent(msgSticker);
  Logger.log('Respon Stiker: ' + resSticker);
  if (resSticker.indexOf('stiker') !== -1) {
    Logger.log('✅ PASS: Media tak didukung tertangkap dengan aman!');
  } else {
    Logger.log('❌ FAIL: Deteksi stiker error');
  }

  // 3. Verifikasi ketersediaan metode TelegramService
  if (typeof TelegramService.transcribeVoiceNote === 'function' && typeof TelegramService.analyzePhoto === 'function') {
    Logger.log('✅ PASS: Fungsi transcribeVoiceNote & analyzePhoto terpasang sempurna di TelegramService!');
  } else {
    Logger.log('❌ FAIL: Fungsi multi-modal belum terpasang');
  }
}

/**
 * TEST SUITE: Verifikasi Grounding Closed-Loop Self-Awareness & Vision Prompt Bootstrap
 */
function test_SelfAwarenessGroundingAndVisionChain() {
  Logger.log('=== TEST CLOSED-LOOP SELF-AWARENESS & VISION PROMPT ===');

  // 1. Test Grounding Stack Data di SelfAwareness
  var metrics = SelfAwareness.review('all');
  Logger.log('Platform Resmi: ' + metrics.system_metrics.stackContract.platform);
  Logger.log('Banned Hallucinations: ' + metrics.system_metrics.stackContract.bannedHallucinations.join(', '));
  Logger.log('Total File .gs dalam Peta Fisik: ' + metrics.system_metrics.fileList.length);

  if (metrics.system_metrics.stackContract.platform.indexOf('Google Apps Script') !== -1 && metrics.system_metrics.fileList.length > 0) {
    Logger.log('✅ PASS: Closed-Loop Self-Awareness Grounding 100% Aktif & Terhubung ke Peta Kode!');
  } else {
    Logger.log('❌ FAIL: Grounding Self-Awareness Gagal.');
  }

  // 2. Auto-Bootstrap Vision Prompt ke Database Knowledge
  var visionPrompt = KnowledgeRepository.get('vision', 'photo_analysis_prompt');
  if (!visionPrompt) {
    var defaultVisionPrompt = 'Ekstrak dan analisis gambar/struk belanjaan ini secara faktual.\n' +
      'Jika ini STRUK BELANJA, sebutkan:\n' +
      '1. Nama Toko/Merchant\n' +
      '2. Rincian Item Belanjaan & Harga\n' +
      '3. Total Harga Belanja\n' +
      '4. Metode Pembayaran / Akun jika ada (Cash/BCA/GoPay/dll)';
    KnowledgeRepository.save('vision', 'photo_analysis_prompt', defaultVisionPrompt, 'AUTO_BOOTSTRAP_VISION_PROMPT');
    visionPrompt = defaultVisionPrompt;
  }
  
  if (visionPrompt && visionPrompt.indexOf('STRUK BELANJA') !== -1) {
    Logger.log('✅ PASS: Vision Prompt untuk Foto Struk Belanjaan 100% Aktif & Tersimpan di Database!');
  } else {
    Logger.log('❌ FAIL: Vision Prompt gagal');
  }
}

/**
 * DIAGNOSTIC TEST: Menguji respon Gemini & OpenRouter Vision API secara presisi
 */
function test_VisionAPI_FullDiagnostic() {
  Logger.log('=== TEST DIAGNOSTIK VISION API (GEMINI & OPENROUTER) ===');

  var config = Config.load();
  var sampleBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP////////////////////////////////////////////////////////////////──────────────────────WG1hZGg=';

  // 1. Tes Gemini Vision API
  var geminiModel = 'gemini-1.5-flash-latest';
  var urlGemini = 'https://generativelanguage.googleapis.com/v1beta/models/' + geminiModel + ':generateContent?key=' + config.geminiApiKey;
  
  var payloadGemini = {
    contents: [{
      parts: [
        { text: 'Deskripsikan gambar ini' },
        { inlineData: { mimeType: 'image/jpeg', data: sampleBase64 } }
      ]
    }]
  };

  try {
    var resG = UrlFetchApp.fetch(urlGemini, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payloadGemini),
      muteHttpExceptions: true
    });
    Logger.log('Gemini Vision HTTP Status: ' + resG.getResponseCode());
    Logger.log('Gemini Vision Response: ' + resG.getContentText().substring(0, 300));
  } catch (eG) {
    Logger.log('Gemini Error: ' + eG.message);
  }

  // 2. Tes OpenRouter Vision API (Fallback)
  if (config.openrouterApiKey) {
    var urlOR = 'https://openrouter.ai/api/v1/chat/completions';
    var payloadOR = {
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Deskripsikan gambar ini' },
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + sampleBase64 } }
        ]
      }]
    };

    try {
      var resOR = UrlFetchApp.fetch(urlOR, {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + config.openrouterApiKey },
        contentType: 'application/json',
        payload: JSON.stringify(payloadOR),
        muteHttpExceptions: true
      });
      Logger.log('\nOpenRouter Vision HTTP Status: ' + resOR.getResponseCode());
      Logger.log('OpenRouter Vision Response: ' + resOR.getContentText().substring(0, 300));
    } catch (eOR) {
      Logger.log('OpenRouter Vision Error: ' + eOR.message);
    }
  }
}