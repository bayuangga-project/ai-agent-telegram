/**
 * TEST SUITE: Verifikasi Performa & Akurasi TextFinder Fast Search
 */
function test_TextFinder_FastSearchPerformance() {
  Logger.log('=== TEST PERFORMA TEXTFINDER FAST SEARCH ===');

  // 1. Test Wallet Fast Search by Name
  var startWallet = new Date().getTime();
  var cashWallet = WalletRepository.findByName('Cash');
  var walletLatency = new Date().getTime() - startWallet;

  Logger.log('Wallet Search Latency: ' + walletLatency + ' ms');
  if (cashWallet) {
    Logger.log('✅ PASS: Wallet "Cash" ditemukan (ID: ' + cashWallet.id + ')');
  } else {
    Logger.log('⚠️ INFO: Wallet "Cash" belum ada di sheet.');
  }

  // 2. Test UserProfile Fast Upsert
  var startProfile = new Date().getTime();
  UserProfileSpecialist._upsertProfile('test_perf_key', 'test_value_123', 'test_category');
  var profileLatency = new Date().getTime() - startProfile;

  Logger.log('Profile Upsert Latency: ' + profileLatency + ' ms');
  if (profileLatency < 2000) {
    Logger.log('✅ PASS: UserProfile TextFinder Upsert sangat cepat!');
  } else {
    Logger.log('❌ FAIL: UserProfile Upsert lambat');
  }

  // 3. Test Non-Existent ID Search (Handling Null)
  var nullRes = TransactionRepository.findById('TRX-NON-EXISTENT-99999');
  if (nullRes === null) {
    Logger.log('✅ PASS: Pencarian ID tidak ada mengembalikan null dengan aman!');
  } else {
    Logger.log('❌ FAIL: Handling null error');
  }
}