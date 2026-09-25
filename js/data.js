/**
 * KeuanganKu - Data & Storage Management
 * Modul master kategori, penyimpanan localStorage, sample data relatif, dan validasi schema data
 */

// =============================================================================
// Master Data Kategori
// =============================================================================
const CATEGORIES = {
  expense: [
    { id: 'food', name: 'Makanan & Minuman', icon: 'fa-utensils', color: '#f43f5e' },
    { id: 'transport', name: 'Transportasi', icon: 'fa-car-side', color: '#f97316' },
    { id: 'shopping', name: 'Belanja & Kebutuhan', icon: 'fa-bag-shopping', color: '#ec4899' },
    { id: 'bills', name: 'Tagihan & Utilitas', icon: 'fa-receipt', color: '#eab308' },
    { id: 'entertainment', name: 'Hiburan & Liburan', icon: 'fa-film', color: '#a855f7' },
    { id: 'health', name: 'Kesehatan & Medis', icon: 'fa-heart-pulse', color: '#06b6d4' },
    { id: 'education', name: 'Pendidikan & Kursus', icon: 'fa-graduation-cap', color: '#3b82f6' },
    { id: 'gift', name: 'Donasi & Sedekah', icon: 'fa-hand-holding-heart', color: '#14b8a6' },
    { id: 'other_expense', name: 'Lain-lain', icon: 'fa-ellipsis', color: '#64748b' }
  ],
  income: [
    { id: 'salary', name: 'Gaji Bulanan', icon: 'fa-money-bill-wave', color: '#10b981' },
    { id: 'freelance', name: 'Freelance & Side Job', icon: 'fa-laptop-code', color: '#059669' },
    { id: 'business', name: 'Usaha & Dagang', icon: 'fa-store', color: '#14b8a6' },
    { id: 'investment', name: 'Investasi & Dividen', icon: 'fa-chart-line', color: '#3b82f6' },
    { id: 'bonus', name: 'Bonus & THR', icon: 'fa-trophy', color: '#eab308' },
    { id: 'gift_income', name: 'Hadiah & Bantuan', icon: 'fa-gift', color: '#8b5cf6' },
    { id: 'other_income', name: 'Lain-lain', icon: 'fa-circle-dollar-to-slot', color: '#64748b' }
  ]
};

// =============================================================================
// Kunci LocalStorage
// =============================================================================
const STORAGE_KEY = 'keuanganku_transactions_v1';
const THEME_KEY = 'keuanganku_theme_v1';
const BUDGET_KEY = 'keuanganku_budgets_v1';
const BACKUP_KEY = 'keuanganku_last_backup_v1';
const BACKUP_DISMISS_KEY = 'keuanganku_backup_dismissed_until';

/**
 * Mencari metadata informasi kategori berdasarkan jenis transaksi dan ID kategori
 * @param {'expense'|'income'} type
 * @param {string} catId
 * @returns {{ id: string, name: string, icon: string, color: string }}
 */
function getCategoryInfo(type, catId) {
  const list = CATEGORIES[type] || [];
  const found = list.find(c => c.id === catId);
  if (found) return found;
  const fallback = [...CATEGORIES.expense, ...CATEGORIES.income].find(c => c.id === catId);
  return fallback || { id: catId, name: catId || 'Lain-lain', icon: 'fa-tag', color: '#64748b' };
}

/**
 * Membaca daftar transaksi dari localStorage
 * @returns {Array<Object>}
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Gagal membaca transaksi dari localStorage:', e);
    return [];
  }
}

/**
 * Menyimpan daftar transaksi ke localStorage
 * @param {Array<Object>} txs
 */
function saveTransactions(txs) {
  try {
    const data = Array.isArray(txs) ? txs : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof state !== 'undefined') {
      state.transactions = data;
    }
  } catch (e) {
    console.error('Gagal menyimpan transaksi ke localStorage:', e);
  }
}

/**
 * Membaca data batas anggaran bulanan dari localStorage
 * @returns {Record<string, number>}
 */
function loadBudgets() {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    console.error('Gagal membaca anggaran:', e);
    return {};
  }
}

/**
 * Menyimpan data batas anggaran bulanan ke localStorage
 * @param {Record<string, number>} budgets
 */
function saveBudgets(budgets) {
  try {
    const data = budgets && typeof budgets === 'object' && !Array.isArray(budgets) ? budgets : {};
    localStorage.setItem(BUDGET_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Gagal menyimpan anggaran:', e);
  }
}

/**
 * Mendapatkan timestamp cadangan terakhir
 * @returns {number|null}
 */
function getLastBackupTimestamp() {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    const ts = parseInt(raw, 10);
    return Number.isFinite(ts) && ts > 0 ? ts : null;
  } catch (e) {
    return null;
  }
}

/**
 * Menyimpan timestamp keberhasilan backup
 * @param {number} [timestamp]
 */
function setLastBackupTimestamp(timestamp = Date.now()) {
  try {
    localStorage.setItem(BACKUP_KEY, String(timestamp));
  } catch (e) {
    console.error('Gagal menyimpan timestamp backup:', e);
  }
}

/**
 * Cek apakah reminder backup sedang dalam masa dismiss
 * @returns {boolean}
 */
function isBackupDismissed() {
  try {
    const raw = localStorage.getItem(BACKUP_DISMISS_KEY);
    const until = parseInt(raw, 10);
    return Number.isFinite(until) && until > Date.now();
  } catch (e) {
    return false;
  }
}

/**
 * Dismiss pengingat backup selama rentang hari tertentu (default 7 hari)
 * @param {number} [days=7]
 */
function dismissBackupReminder(days = 7) {
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(BACKUP_DISMISS_KEY, String(until));
  } catch (e) {
    console.error('Gagal menyimpan dismiss backup:', e);
  }
}

/**
 * Generate seed / sample demo data relatif ke bulan berjalan saat ini
 * Dashboard Beranda akan langsung terisi data realistis di bulan aktif
 * @param {Date} [baseDate]
 * @returns {Array<Object>}
 */
function generateSampleData(baseDate = new Date()) {
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth(); // 0-indexed

  // Helper untuk membuat tanggal berformat YYYY-MM-DD
  const makeDate = (year, monthIdx, day) => {
    const y = year;
    const m = String(monthIdx + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const curPrefix = `tx-${currentYear}${String(currentMonth + 1).padStart(2, '0')}`;

  // Bulan lalu
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();
  const prevPrefix = `tx-${prevYear}${String(prevMonth + 1).padStart(2, '0')}`;

  return [
    // --- BULAN BERJALAN: Total Pemasukan = Rp 10.850.000, Total Pengeluaran = Rp 1.545.000, Saldo = Rp 9.305.000 ---
    {
      id: `${curPrefix}-01`,
      type: 'income',
      title: 'Gaji Pokok Bulanan',
      amount: 8500000,
      category: 'salary',
      date: makeDate(currentYear, currentMonth, 1),
      time: '09:00',
      notes: 'Transfer payroll rekening utama kantor'
    },
    {
      id: `${curPrefix}-02`,
      type: 'expense',
      title: 'Tagihan Listrik PLN & Internet Fiber',
      amount: 680000,
      category: 'bills',
      date: makeDate(currentYear, currentMonth, 2),
      time: '08:30',
      notes: 'Pembayaran tagihan bulanan via m-banking'
    },
    {
      id: `${curPrefix}-03`,
      type: 'expense',
      title: 'Belanja Mingguan Supermarket',
      amount: 450000,
      category: 'shopping',
      date: makeDate(currentYear, currentMonth, 5),
      time: '11:00',
      notes: 'Kebutuhan dapur, sayur, dan bahan pangan'
    },
    {
      id: `${curPrefix}-04`,
      type: 'income',
      title: 'Proyek Desain Web Freelance',
      amount: 2000000,
      category: 'freelance',
      date: makeDate(currentYear, currentMonth, 10),
      time: '14:15',
      notes: 'Pelunasan invoice termin 2 klien Jakarta'
    },
    {
      id: `${curPrefix}-05`,
      type: 'expense',
      title: 'Makan Siang & Kopi Mingguan',
      amount: 175000,
      category: 'food',
      date: makeDate(currentYear, currentMonth, 12),
      time: '13:00',
      notes: 'Makan siang bareng tim kantor'
    },
    {
      id: `${curPrefix}-06`,
      type: 'expense',
      title: 'Bensin & Saldo E-Toll',
      amount: 140000,
      category: 'transport',
      date: makeDate(currentYear, currentMonth, 15),
      time: '07:45',
      notes: 'Isi Pertamax dan top-up Flazz e-toll'
    },
    {
      id: `${curPrefix}-07`,
      type: 'income',
      title: 'Dividen Reksadana Pasar Uang',
      amount: 350000,
      category: 'investment',
      date: makeDate(currentYear, currentMonth, 18),
      time: '10:00',
      notes: 'Bagi hasil kupon bulanan platform investasi'
    },
    {
      id: `${curPrefix}-08`,
      type: 'expense',
      title: 'Obat & Vitamin Daya Tahan',
      amount: 100000,
      category: 'health',
      date: makeDate(currentYear, currentMonth, 20),
      time: '19:20',
      notes: 'Beli suplemen vitamin C di apotek'
    },

    // --- BULAN SEBELUMNYA: Untuk perbandingan pertumbuhan tren ---
    {
      id: `${prevPrefix}-01`,
      type: 'income',
      title: 'Gaji Pokok Bulanan',
      amount: 8500000,
      category: 'salary',
      date: makeDate(prevYear, prevMonth, 1),
      time: '09:00',
      notes: 'Transfer payroll rekening utama kantor'
    },
    {
      id: `${prevPrefix}-02`,
      type: 'expense',
      title: 'Sewa Tempat Tinggal / Kos',
      amount: 1200000,
      category: 'bills',
      date: makeDate(prevYear, prevMonth, 3),
      time: '10:00',
      notes: 'Pembayaran sewa bulanan'
    },
    {
      id: `${prevPrefix}-03`,
      type: 'expense',
      title: 'Belanja Bulanan & Kebutuhan Rumah',
      amount: 750000,
      category: 'shopping',
      date: makeDate(prevYear, prevMonth, 8),
      time: '16:00',
      notes: 'Perlengkapan mandi, deterjen, sembako'
    },
    {
      id: `${prevPrefix}-04`,
      type: 'income',
      title: 'Bonus Kinerja Triwulan',
      amount: 3000000,
      category: 'bonus',
      date: makeDate(prevYear, prevMonth, 15),
      time: '11:30',
      notes: 'Apresiasi pencapaian target'
    },
    {
      id: `${prevPrefix}-05`,
      type: 'expense',
      title: 'Servis Berkala Kendaraan',
      amount: 480000,
      category: 'transport',
      date: makeDate(prevYear, prevMonth, 22),
      time: '13:45',
      notes: 'Ganti oli dan filter di bengkel resmi'
    }
  ];
}

/**
 * Validasi ketat schema data transaksi untuk import JSON
 * Wajib:
 * - array of object
 * - id: string non-kosong (karakter aman)
 * - type: 'income' | 'expense'
 * - title: string non-kosong
 * - amount: number finite >= 0
 * - category: string (whitelist atau fallback other_expense/other_income)
 * - date: string YYYY-MM-DD valid kalender
 * Opsional:
 * - time: string
 * - notes: string
 * @param {*} data
 * @returns {{ valid: boolean, items: Array<Object>, skipped: number, error?: string }}
 */
function validateTransactionsImport(data) {
  if (!data) {
    return { valid: false, items: [], skipped: 0, error: 'Berkas cadangan kosong atau tidak terbaca.' };
  }

  let itemsArray = null;
  if (Array.isArray(data)) {
    itemsArray = data;
  } else if (typeof data === 'object' && Array.isArray(data.transactions)) {
    itemsArray = data.transactions;
  } else {
    return { valid: false, items: [], skipped: 0, error: 'Format berkas harus berupa array transaksi JSON.' };
  }

  const validExpenseCategories = (CATEGORIES.expense || []).map(c => c.id);
  const validIncomeCategories = (CATEGORIES.income || []).map(c => c.id);
  const validItems = [];
  let skipped = 0;

  for (const item of itemsArray) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      skipped++;
      continue;
    }

    // 1. Wajib id (string tidak kosong)
    if (typeof item.id !== 'string' || item.id.trim() === '') {
      skipped++;
      continue;
    }

    // 2. Wajib type ('income' atau 'expense')
    if (item.type !== 'income' && item.type !== 'expense') {
      skipped++;
      continue;
    }

    // 3. Wajib title (string tidak kosong)
    if (typeof item.title !== 'string' || item.title.trim() === '') {
      skipped++;
      continue;
    }

    // 4. Wajib amount (angka terbatas >= 0)
    const amt = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount);
    if (!Number.isFinite(amt) || amt < 0) {
      skipped++;
      continue;
    }

    // 5. Wajib date (format YYYY-MM-DD valid kalender)
    const isValidDate = (function(dateStr) {
      if (typeof isValidISODate === 'function') return isValidISODate(dateStr);
      if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
      const parts = dateStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (month < 1 || month > 12 || day < 1 || day > 31) return false;
      const d = new Date(year, month - 1, day);
      return d.getFullYear() === year && (d.getMonth() + 1) === month && d.getDate() === day;
    })(item.date);

    if (!isValidDate) {
      skipped++;
      continue;
    }

    // 6. Category (harus string, jika tidak cocok arahkan ke fallback)
    let category = typeof item.category === 'string' ? item.category.trim() : '';
    if (item.type === 'expense') {
      if (!validExpenseCategories.includes(category)) {
        category = 'other_expense';
      }
    } else {
      if (!validIncomeCategories.includes(category)) {
        category = 'other_income';
      }
    }

    // Opsional: time dan notes
    const time = typeof item.time === 'string' && item.time.trim() ? item.time.trim().slice(0, 10) : '12:00';
    const notes = typeof item.notes === 'string' ? item.notes.trim().slice(0, 500) : '';
    const title = item.title.trim().slice(0, 100);
    const id = item.id.trim().slice(0, 100);

    validItems.push({
      id,
      type: item.type,
      amount: amt,
      date: item.date,
      category,
      title,
      notes,
      time
    });
  }

  if (validItems.length === 0) {
    const extra = skipped > 0 ? ` (${skipped} data tidak valid dilewati)` : '';
    return {
      valid: false,
      items: [],
      skipped,
      error: `Tidak ada transaksi yang memenuhi kriteria validasi schema.${extra}`
    };
  }

  return {
    valid: true,
    items: validItems,
    skipped
  };
}

/**
 * Menggabungkan transaksi impor dengan data yang sudah ada.
 * Mencegah konflik ID: jika ID sudah ada di data user, buat ID baru untuk data impor.
 * @param {Array<Object>} currentTxs
 * @param {Array<Object>} importedTxs
 * @returns {Array<Object>}
 */
function mergeTransactionsSafely(currentTxs, importedTxs) {
  const existingList = Array.isArray(currentTxs) ? [...currentTxs] : [];
  const existingIds = new Set(existingList.map(t => t.id));
  let counter = 1;

  for (const item of importedTxs) {
    let itemToMerge = { ...item };
    if (existingIds.has(itemToMerge.id)) {
      // Regenerate ID agar tidak menimpa data transaksi user
      const suffix = Math.random().toString(36).substring(2, 7);
      itemToMerge.id = `tx_imp_${Date.now()}_${counter++}_${suffix}`;
    }
    existingIds.add(itemToMerge.id);
    existingList.push(itemToMerge);
  }

  return existingList;
}

/**
 * Memuat sample data dengan dialog konfirmasi 2 langkah (muat / merge vs replace)
 */
function loadSampleData() {
  const sample = generateSampleData();
  const currentCount = state && Array.isArray(state.transactions) ? state.transactions.length : 0;

  if (currentCount > 0) {
    const confirmStep1 = confirm(
      `Saat ini sudah ada ${currentCount} transaksi tersimpan.\n\n` +
      `Apakah Anda ingin memuat data percontohan?`
    );
    if (!confirmStep1) return;

    const confirmMerge = confirm(
      `Pilih cara memuat data percontohan:\n\n` +
      `• Klik "OK" untuk MENGGABUNGKAN (Merge) contoh dengan data Anda saat ini.\n` +
      `• Klik "Batal" untuk MENIMPA (Replace) seluruh transaksi dengan data contoh.`
    );

    if (confirmMerge) {
      const merged = mergeTransactionsSafely(state.transactions, sample);
      saveTransactions(merged);
      if (typeof refreshUI === 'function') refreshUI();
      if (typeof showToast === 'function') showToast(`Berhasil menambahkan ${sample.length} transaksi contoh!`, 'success');
    } else {
      saveTransactions(sample);
      if (typeof refreshUI === 'function') refreshUI();
      if (typeof showToast === 'function') showToast('Seluruh data diganti dengan data contoh.', 'info');
    }
  } else {
    const confirmLoad = confirm(`Muat ${sample.length} data transaksi contoh untuk melihat simulasi dashboard dan laporan?`);
    if (!confirmLoad) return;
    saveTransactions(sample);
    if (typeof refreshUI === 'function') refreshUI();
    if (typeof showToast === 'function') showToast('Berhasil memuat data percontohan!', 'success');
  }
}

/**
 * Menghitung rentang tanggal satu minggu kalender (Senin sampai Minggu)
 * @param {Date} date
 * @returns {{ start: Date, end: Date }}
 */
function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

/**
 * Filter transaksi berdasarkan periode aktif saat ini
 * @returns {Array<Object>}
 */
function getTransactionsInCurrentPeriod() {
  if (typeof state === 'undefined') return [];
  const anchor = state.anchorDate || new Date();
  const txs = Array.isArray(state.transactions) ? state.transactions : [];

  return txs.filter(item => {
    if (!item.date) return false;
    const itemDate = new Date(item.date + 'T00:00:00');

    if (state.currentPeriod === 'all') {
      return true;
    } else if (state.currentPeriod === 'daily') {
      return formatDateISO(itemDate) === formatDateISO(anchor);
    } else if (state.currentPeriod === 'weekly') {
      const { start, end } = getWeekRange(anchor);
      return itemDate >= start && itemDate <= end;
    } else if (state.currentPeriod === 'monthly') {
      return (
        itemDate.getFullYear() === anchor.getFullYear() &&
        itemDate.getMonth() === anchor.getMonth()
      );
    }
    return true;
  });
}

/**
 * Filter transaksi berdasarkan periode aktif, jenis transaksi, kategori, dan kata kunci pencarian
 * @returns {Array<Object>}
 */
function getFilteredTransactions() {
  if (typeof state === 'undefined') return [];
  const periodItems = getTransactionsInCurrentPeriod();

  return periodItems.filter(item => {
    if (state.filters.type !== 'all' && item.type !== state.filters.type) {
      return false;
    }

    if (state.filters.category !== 'all' && item.category !== state.filters.category) {
      return false;
    }

    if (state.filters.search) {
      const q = state.filters.search.toLowerCase();
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const notesMatch = (item.notes || '').toLowerCase().includes(q);
      const catInfo = getCategoryInfo(item.type, item.category);
      const catMatch = (catInfo.name || '').toLowerCase().includes(q);
      if (!titleMatch && !notesMatch && !catMatch) return false;
    }

    return true;
  }).sort((a, b) => {
    const dateComp = new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'));
    return dateComp;
  });
}

// Ekspor untuk environment Node.js (pengujian unit test)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CATEGORIES,
    STORAGE_KEY,
    THEME_KEY,
    BUDGET_KEY,
    BACKUP_KEY,
    BACKUP_DISMISS_KEY,
    getCategoryInfo,
    loadTransactions,
    saveTransactions,
    loadBudgets,
    saveBudgets,
    getLastBackupTimestamp,
    setLastBackupTimestamp,
    isBackupDismissed,
    dismissBackupReminder,
    generateSampleData,
    validateTransactionsImport,
    mergeTransactionsSafely,
    loadSampleData,
    getWeekRange,
    getTransactionsInCurrentPeriod,
    getFilteredTransactions
  };
}
