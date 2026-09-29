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