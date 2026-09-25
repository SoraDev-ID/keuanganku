/**
 * KeuanganKu - Unit Tests (Node.js Built-in assert)
 * Menguji formatter, validasi kalender, proteksi XSS, dan validasi schema import JSON
 */

const assert = require('node:assert');
const {
  formatRupiah,
  parseFormattedNumber,
  formatDateIndo,
  formatDateISO,
  formatMonthISO,
  isValidISODate,
  escapeHtml
} = require('../js/format.js');

const {
  CATEGORIES,
  validateTransactionsImport,
  mergeTransactionsSafely,
  generateSampleData
} = require('../js/data.js');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('\n--- Menjalankan Pengujian Unit KeuanganKu ---\n');

// =============================================================================
// 1. Pengujian Formatter & Parsers
// =============================================================================
console.log('1. Pengujian Formatter (format.js):');

test('formatRupiah memformat nominal angka bulat ke mata uang IDR', () => {
  const result = formatRupiah(1500000);
  assert.ok(result.includes('1.500.000'), `Expected formatted Rupiah containing 1.500.000, got ${result}`);
});

test('formatRupiah menangani 0, negatif, dan fallback nilai non-angka', () => {
  assert.ok(formatRupiah(0).includes('0'));
  assert.ok(formatRupiah(-50000).includes('50.000'));
  assert.ok(formatRupiah(NaN).includes('0'));
  assert.ok(formatRupiah(null).includes('0'));
});

test('parseFormattedNumber mengekstrak angka murni dari string berformat', () => {
  assert.strictEqual(parseFormattedNumber('Rp 2.500.000'), 2500000);
  assert.strictEqual(parseFormattedNumber('100.000'), 100000);
  assert.strictEqual(parseFormattedNumber(''), 0);
  assert.strictEqual(parseFormattedNumber(null), 0);
  assert.strictEqual(parseFormattedNumber(50000), 50000);
});

test('formatDateISO menghasilkan format YYYY-MM-DD dari objek Date', () => {
  const d = new Date(2026, 8, 25); // Bulan ke-9 (September)
  assert.strictEqual(formatDateISO(d), '2026-09-25');
});

test('formatMonthISO menghasilkan format YYYY-MM dari objek Date', () => {
  const d = new Date(2026, 8, 25);
  assert.strictEqual(formatMonthISO(d), '2026-09');
});

// =============================================================================
// 2. Pengujian Validasi Kalender Riil (isValidISODate)
// =============================================================================
console.log('\n2. Pengujian Validasi Kalender (isValidISODate):');

test('isValidISODate menerima tanggal ISO yang sah', () => {
  assert.strictEqual(isValidISODate('2026-09-25'), true);
  assert.strictEqual(isValidISODate('2024-02-29'), true); // Tahun kabisat 2024
  assert.strictEqual(isValidISODate('2025-12-31'), true);
});

test('isValidISODate menolak tanggal tidak valid riil pada kalender', () => {
  assert.strictEqual(isValidISODate('2025-02-29'), false); // 2025 bukan tahun kabisat
  assert.strictEqual(isValidISODate('2026-04-31'), false); // April hanya 30 hari
  assert.strictEqual(isValidISODate('2026-02-30'), false);
  assert.strictEqual(isValidISODate('2026-13-01'), false); // Bulan 13 tidak ada
  assert.strictEqual(isValidISODate('2026-00-10'), false);
  assert.strictEqual(isValidISODate('2026-05-00'), false);
  assert.strictEqual(isValidISODate('2026-05-32'), false);
});

test('isValidISODate menolak format teks bukan YYYY-MM-DD', () => {
  assert.strictEqual(isValidISODate('25-09-2026'), false);
  assert.strictEqual(isValidISODate('2026/09/25'), false);
  assert.strictEqual(isValidISODate('2026-9-25'), false);
  assert.strictEqual(isValidISODate(''), false);
  assert.strictEqual(isValidISODate(null), false);
  assert.strictEqual(isValidISODate(undefined), false);
  assert.strictEqual(isValidISODate(12345), false);
});

// =============================================================================
// 3. Pengujian Sanitasi XSS (escapeHtml)
// =============================================================================
console.log('\n3. Pengujian Sanitasi XSS (escapeHtml):');

test('escapeHtml mengamankan karakter berbahaya XSS', () => {
  const malicious = '<script>alert("XSS")</script>';
  const clean = escapeHtml(malicious);
  assert.strictEqual(clean, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
});

test('escapeHtml mengonversi tanda kutip satu, ampersand, dan simbol tag', () => {
  const str = `Beli kopi 'Starbucks' & teh > air < es`;
  const clean = escapeHtml(str);
  assert.strictEqual(clean, 'Beli kopi &#039;Starbucks&#039; &amp; teh &gt; air &lt; es');
});

test('escapeHtml aman saat menerima null, undefined, atau angka', () => {
  assert.strictEqual(escapeHtml(null), '');
  assert.strictEqual(escapeHtml(undefined), '');
  assert.strictEqual(escapeHtml(12345), '12345');
});

// =============================================================================
// 4. Pengujian Validasi Schema Impor JSON (validateTransactionsImport)
// =============================================================================
console.log('\n4. Pengujian Validasi Impor JSON (validateTransactionsImport):');

test('validateTransactionsImport menerima dataset valid dan mengembalikan items bersih', () => {
  const validData = [
    {
      id: 'tx-101',
      type: 'expense',
      title: 'Makan Siang',
      amount: 45000,
      category: 'food',
      date: '2026-09-25',
      time: '12:30',
      notes: 'Nasi padang'
    },
    {
      id: 'tx-102',
      type: 'income',
      title: 'Gaji Pokok',
      amount: 10000000,
      category: 'salary',
      date: '2026-09-01'
    }
  ];

  const res = validateTransactionsImport(validData);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.items.length, 2);
  assert.strictEqual(res.skipped, 0);
  assert.strictEqual(res.items[0].title, 'Makan Siang');
  assert.strictEqual(res.items[1].time, '12:00'); // Default time jika tidak ada
});

test('validateTransactionsImport menolak berkas jika bukan format array', () => {
  const res1 = validateTransactionsImport('bukan json array');
  assert.strictEqual(res1.valid, false);

  const res2 = validateTransactionsImport({ foo: 'bar' });
  assert.strictEqual(res2.valid, false);

  const res3 = validateTransactionsImport(null);
  assert.strictEqual(res3.valid, false);
});

test('validateTransactionsImport menolak/melewati item dengan tanggal kalender invalid', () => {
  const invalidDateData = [
    {
      id: 'tx-201',
      type: 'expense',
      title: 'Bensin',
      amount: 50000,
      category: 'transport',
      date: '2025-02-29' // 2025 bukan tahun kabisat
    }
  ];

  const res = validateTransactionsImport(invalidDateData);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.skipped, 1);
});

test('validateTransactionsImport menolak/melewati item dengan nominal negatif atau bukan angka', () => {
  const invalidAmountData = [
    {
      id: 'tx-301',
      type: 'expense',
      title: 'Belanja',
      amount: -10000,
      category: 'shopping',
      date: '2026-09-25'
    },
    {
      id: 'tx-302',
      type: 'expense',
      title: 'Belanja 2',
      amount: 'bukan_angka',
      category: 'shopping',
      date: '2026-09-25'
    }
  ];

  const res = validateTransactionsImport(invalidAmountData);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.skipped, 2);
});

test('validateTransactionsImport menolak item dengan tipe transaksi salah', () => {
  const invalidTypeData = [
    {
      id: 'tx-401',
      type: 'transfer', // Hanya 'income' atau 'expense' yang sah
      title: 'Transfer Saldo',
      amount: 50000,
      category: 'food',
      date: '2026-09-25'
    }
  ];

  const res = validateTransactionsImport(invalidTypeData);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.skipped, 1);
});

test('validateTransactionsImport menolak item dengan title kosong', () => {
  const emptyTitleData = [
    {
      id: 'tx-501',
      type: 'income',
      title: '   ',
      amount: 50000,
      category: 'salary',
      date: '2026-09-25'
    }
  ];

  const res = validateTransactionsImport(emptyTitleData);
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.skipped, 1);
});

test('validateTransactionsImport mengarahkan kategori tidak dikenal ke fallback kategori', () => {
  const foreignCatData = [
    {
      id: 'tx-601',
      type: 'expense',
      title: 'Pengeluaran Acak',
      amount: 75000,
      category: 'kategori_asing_yang_tidak_ada',
      date: '2026-09-25'
    },
    {
      id: 'tx-602',
      type: 'income',
      title: 'Pemasukan Acak',
      amount: 150000,
      category: 'kategori_income_asing',
      date: '2026-09-25'
    }
  ];

  const res = validateTransactionsImport(foreignCatData);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.items[0].category, 'other_expense');
  assert.strictEqual(res.items[1].category, 'other_income');
});

// =============================================================================
// 5. Pengujian Keamanan Penggabungan Data (mergeTransactionsSafely)
// =============================================================================
console.log('\n5. Pengujian Penggabungan Data Aman (mergeTransactionsSafely):');

test('mergeTransactionsSafely tidak menimpa data user saat ada konflik ID', () => {
  const userExisting = [
    { id: 'tx-sample-01', title: 'Data Pribadi User', amount: 500000, type: 'expense', date: '2026-09-20' }
  ];

  const importedWithSameId = [
    { id: 'tx-sample-01', title: 'Data Impor Bentrok', amount: 10000, type: 'expense', date: '2026-09-25' },
    { id: 'tx-new-02', title: 'Data Impor Baru', amount: 20000, type: 'income', date: '2026-09-25' }
  ];

  const merged = mergeTransactionsSafely(userExisting, importedWithSameId);
  assert.strictEqual(merged.length, 3);

  // Transaksi asli user tetap utuh
  const originalUserItem = merged.find(t => t.id === 'tx-sample-01');
  assert.ok(originalUserItem);
  assert.strictEqual(originalUserItem.title, 'Data Pribadi User');

  // Item impor dengan ID bentrok mendapatkan ID baru
  const collidedItem = merged.find(t => t.title === 'Data Impor Bentrok');
  assert.ok(collidedItem);
  assert.notStrictEqual(collidedItem.id, 'tx-sample-01');
  assert.ok(collidedItem.id.startsWith('tx_imp_'));
});

// =============================================================================
// 6. Pengujian Sample Data Relatif
// =============================================================================
console.log('\n6. Pengujian Sample Data Dinamis:');

test('generateSampleData membuat transaksi dengan tahun dan bulan aktif', () => {
  const testDate = new Date(2026, 8, 25); // September 2026
  const sample = generateSampleData(testDate);
  assert.ok(sample.length > 5);

  const curMonthItems = sample.filter(s => s.date.startsWith('2026-09'));
  assert.ok(curMonthItems.length > 0, 'Harus ada data sample di bulan berjalan September 2026');

  // Pastikan semua tanggal valid kalender
  sample.forEach(item => {
    assert.strictEqual(isValidISODate(item.date), true, `Tanggal sample ${item.date} harus valid`);
  });
});

console.log(`\n========================================`);
console.log(`Pengujian Selesai: ${passedTests}/${totalTests} pengujian BERHASIL.`);
console.log(`========================================\n`);
