/**
 * KeuanganKu - Aplikasi Catatan Pengeluaran & Pemasukan
 * Fitur: Harian, Mingguan, Bulanan, Lengkap Tanggal, Visualisasi Grafik, LocalStorage
 */

// =============================================================================
// 1. Master Data & Konfigurasi Kategori
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

const STORAGE_KEY = 'keuanganku_transactions_v1';
const THEME_KEY = 'keuanganku_theme_v1';

// =============================================================================
// 2. State Aplikasi
// =============================================================================
const state = {
  transactions: [],
  currentPeriod: 'monthly', // Default ke bulanan agar sesuai tampilan dashboard finansial modern
  anchorDate: new Date(), // Tanggal hari ini agar dashboard Beranda selalu menampilkan bulan berjalan
  activeTab: 'beranda', // 'beranda', 'transaksi', 'anggaran', 'laporan'
  filters: {
    search: '',
    type: 'all', // 'all', 'income', 'expense'
    category: 'all'
  },
  charts: {
    cashflow: null,
    category: null
  },
  editingId: null
};

// =============================================================================
// 3. Formatters & Helpers
// =============================================================================
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number);
}

function parseFormattedNumber(str) {
  if (!str) return 0;
  return parseInt(str.toString().replace(/[^0-9]/g, ''), 10) || 0;
}

function formatDateIndo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatMonthISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Validasi apakah string tanggal sesuai format YYYY-MM-DD dan merupakan tanggal kalender yang valid
 */
function isValidISODate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    (d.getMonth() + 1) === month &&
    d.getDate() === day
  );
}

function getCategoryInfo(type, catId) {
  const list = CATEGORIES[type] || [];
  const found = list.find(c => c.id === catId);
  if (found) return found;
  // Fallback search across both
  const fallback = [...CATEGORIES.expense, ...CATEGORIES.income].find(c => c.id === catId);
  return fallback || { id: catId, name: catId, icon: 'fa-tag', color: '#64748b' };
}

// Generate Realistic Seed / Demo Data (Mei 2024 & April 2024)
function generateSampleData() {
  return [
    // --- MEI 2024: Total Pemasukan = 10.850.000, Total Pengeluaran = 1.545.000, Saldo Bersih = 9.305.000 (Rasio Tabungan 86%) ---
    {
      id: 'tx-202405-01',
      type: 'income',
      title: 'Gaji Pokok Bulanan',
      amount: 8500000,
      category: 'salary',
      date: '2024-05-01',
      time: '09:00',
      notes: 'Transfer payroll rekening utama kantor'
    },
    {
      id: 'tx-202405-02',
      type: 'expense',
      title: 'Tagihan Listrik PLN & Internet Fiber',
      amount: 680000,
      category: 'bills',
      date: '2024-05-02',
      time: '08:30',
      notes: 'Pembayaran tagihan bulanan via m-banking'
    },
    {
      id: 'tx-202405-03',
      type: 'expense',
      title: 'Belanja Mingguan Supermarket',
      amount: 450000,
      category: 'shopping',
      date: '2024-05-05',
      time: '11:00',
      notes: 'Kebutuhan dapur, sayur, dan bahan pangan'
    },
    {
      id: 'tx-202405-04',
      type: 'expense',
      title: 'Isi Bensin Pertamax & BBM',
      amount: 150000,
      category: 'transport',
      date: '2024-05-10',
      time: '09:15',
      notes: 'SPBU Pertamina jalan protokol'
    },
    {
      id: 'tx-202405-05',
      type: 'expense',
      title: 'Nonton Bioskop & Popcorn',
      amount: 130000,
      category: 'entertainment',
      date: '2024-05-14',
      time: '19:30',
      notes: 'Hiburan santai akhir pekan'
    },
    {
      id: 'tx-202405-06',
      type: 'income',
      title: 'Project Freelance UI/UX Mobile',
      amount: 2200000,
      category: 'freelance',
      date: '2024-05-15',
      time: '16:30',
      notes: 'Pelunasan milestone desain aplikasi mobile'
    },
    {
      id: 'tx-202405-07',
      type: 'expense',
      title: 'Vitamin & Obat Apotek',
      amount: 85000,
      category: 'health',
      date: '2024-05-18',
      time: '14:00',
      notes: 'Suplemen vitamin daya tahan tubuh'
    },
    {
      id: 'tx-202405-08',
      type: 'income',
      title: 'Dividen Reksadana & Investasi',
      amount: 150000,
      category: 'investment',
      date: '2024-05-20',
      time: '10:15',
      notes: 'Bagi hasil instrumen pasar uang'
    },
    {
      id: 'tx-202405-09',
      type: 'expense',
      title: 'Sedekah Jumat Berkah',
      amount: 50000,
      category: 'gift',
      date: '2024-05-24',
      time: '12:15',
      notes: 'Infaq masjid lingkungan sekitar'
    },

    // --- APRIL 2024: Pemasukan 11.300.000, Pengeluaran 2.500.000, Saldo Bersih 8.800.000 ---
    // Pertumbuhan Mei vs April: (9.305.000 - 8.800.000) / 8.800.000 = +5.738% -> "Naik 5,7% dari bulan lalu"
    {
      id: 'tx-202404-01',
      type: 'income',
      title: 'Gaji Pokok Bulan April',
      amount: 8500000,
      category: 'salary',
      date: '2024-04-01',
      time: '09:00',
      notes: 'Gaji pokok April'
    },
    {
      id: 'tx-202404-02',
      type: 'expense',
      title: 'Sewa Tempat & Tagihan Utilitas',
      amount: 1500000,
      category: 'bills',
      date: '2024-04-05',
      time: '10:00',
      notes: 'Pembayaran rutin sewa & utilitas'
    },
    {
      id: 'tx-202404-03',
      type: 'expense',
      title: 'Belanja Kebutuhan Rumah Tangga',
      amount: 600000,
      category: 'shopping',
      date: '2024-04-12',
      time: '15:30',
      notes: 'Kebutuhan bulanan'
    },
    {
      id: 'tx-202404-04',
      type: 'income',
      title: 'Bonus Kinerja Q1',
      amount: 2800000,
      category: 'bonus',
      date: '2024-04-15',
      time: '14:00',
      notes: 'Reward performa kuartal 1'
    },
    {
      id: 'tx-202404-05',
      type: 'expense',
      title: 'Servis Rutin Kendaraan & Bensin',
      amount: 400000,
      category: 'transport',
      date: '2024-04-20',
      time: '08:45',
      notes: 'Ganti oli dan servis rem'
    },

    // --- JUNI 2024: Data proyeksi awal bulan untuk kelengkapan grafik cashflow 3 bulan ---
    {
      id: 'tx-202406-01',
      type: 'income',
      title: 'Pendapatan Pasif Awal Juni',
      amount: 800000,
      category: 'investment',
      date: '2024-06-01',
      time: '10:00',
      notes: 'Yield portofolio investasi'
    },
    {
      id: 'tx-202406-02',
      type: 'expense',
      title: 'Anggaran Alokasi Tabungan Berencana',
      amount: 5000000,
      category: 'bills',
      date: '2024-06-03',
      time: '14:00',
      notes: 'Setoran tabungan auto-debit'
    }
  ];
}

/**
 * Memuat data contoh transaksi hanya jika diminta oleh pengguna
 */
function loadSampleData() {
  const conf = confirm('Muat data contoh transaksi finansial untuk mencoba fitur aplikasi?');
  if (!conf) return;

  const sample = generateSampleData();
  if (state.transactions.length === 0) {
    saveTransactions(sample);
  } else {
    const merge = confirm(
      'Sudah ada catatan transaksi tersimpan.\n\n' +
      '• Klik "OK" untuk MENGGABUNGKAN data contoh dengan transaksi Anda saat ini.\n' +
      '• Klik "Batal" untuk MENIMPA SELURUH DATA dengan data contoh.'
    );
    if (merge) {
      const map = new Map();
      state.transactions.forEach(t => map.set(t.id, t));
      sample.forEach(t => map.set(t.id, t));
      saveTransactions(Array.from(map.values()));
    } else {
      saveTransactions(sample);
    }
  }
  showToast('Data contoh transaksi berhasil dimuat!', 'success');
  refreshUI();
}

// =============================================================================
// 4. Inisialisasi Data & LocalStorage
// =============================================================================
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Data asli pengguna mulai dari kosong, tidak otomatis memuat data contoh
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Gagal membaca data dari LocalStorage:', err);
    return [];
  }
}

function saveTransactions(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    state.transactions = data;
  } catch (err) {
    console.error('Gagal menyimpan ke LocalStorage:', err);
  }
}

// =============================================================================
// 5. Logika Filter Waktu (Harian, Mingguan, Bulanan)
// =============================================================================
function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = day === 0 ? -6 : 1 - day; // Senin sebagai awal minggu
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function updatePeriodDisplay() {
  const periodLabel = document.getElementById('periodLabel');
  const prevBtn = document.getElementById('prevPeriodBtn');
  const nextBtn = document.getElementById('nextPeriodBtn');
  const resetBtn = document.getElementById('resetPeriodBtn');
  const dailyPicker = document.getElementById('datePickerDaily');
  const monthlyPicker = document.getElementById('datePickerMonthly');

  const anchor = state.anchorDate;

  if (state.currentPeriod === 'all') {
    periodLabel.textContent = 'Semua Riwayat Transaksi';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    resetBtn.classList.add('hidden');
    dailyPicker.classList.add('hidden');
    monthlyPicker.classList.add('hidden');
  } else if (state.currentPeriod === 'daily') {
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    resetBtn.classList.remove('hidden');
    dailyPicker.classList.remove('hidden');
    monthlyPicker.classList.add('hidden');

    dailyPicker.value = formatDateISO(anchor);
    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(anchor);
    periodLabel.textContent = `Harian: ${dateFormatted}`;
  } else if (state.currentPeriod === 'weekly') {
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    resetBtn.classList.remove('hidden');
    dailyPicker.classList.add('hidden');
    monthlyPicker.classList.add('hidden');

    const { start, end } = getWeekRange(anchor);
    const startText = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(start);
    const endText = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(end);
    periodLabel.textContent = `Mingguan: ${startText} - ${endText}`;
  } else if (state.currentPeriod === 'monthly') {
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    resetBtn.classList.remove('hidden');
    dailyPicker.classList.add('hidden');
    monthlyPicker.classList.remove('hidden');

    monthlyPicker.value = formatMonthISO(anchor);
    const monthText = new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric'
    }).format(anchor);
    periodLabel.textContent = `Bulanan: ${monthText}`;
  }
}

function getTransactionsInCurrentPeriod() {
  const anchor = state.anchorDate;

  return state.transactions.filter(item => {
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

function getFilteredTransactions() {
  const periodItems = getTransactionsInCurrentPeriod();

  return periodItems.filter(item => {
    // Type filter
    if (state.filters.type !== 'all' && item.type !== state.filters.type) {
      return false;
    }

    // Category filter
    if (state.filters.category !== 'all' && item.category !== state.filters.category) {
      return false;
    }

    // Search query
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
    // Urutkan dari tanggal terbaru ke terlama
    const dateComp = new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'));
    return dateComp;
  });
}

// =============================================================================
// 6. Perhitungan KPI & Render Ringkasan
// =============================================================================
function renderKPIs() {
  // Hitung metrik berdasarkan transaksi dalam periode aktif
  const currentItems = getTransactionsInCurrentPeriod();

  let incomeTotal = 0;
  let incomeCount = 0;
  let expenseTotal = 0;
  let expenseCount = 0;

  currentItems.forEach(item => {
    const amt = Number(item.amount) || 0;
    if (item.type === 'income') {
      incomeTotal += amt;
      incomeCount++;
    } else if (item.type === 'expense') {
      expenseTotal += amt;
      expenseCount++;
    }
  });

  const netBalance = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? Math.round(((incomeTotal - expenseTotal) / incomeTotal) * 100) : 0;

  // Hitung pertumbuhan Saldo Bersih dibanding bulan sebelumnya
  const prevMonthDate = new Date(state.anchorDate.getFullYear(), state.anchorDate.getMonth() - 1, 1);
  let prevIncome = 0;
  let prevExpense = 0;

  state.transactions.forEach(item => {
    if (!item.date) return;
    const itemDate = new Date(item.date + 'T00:00:00');
    if (
      itemDate.getFullYear() === prevMonthDate.getFullYear() &&
      itemDate.getMonth() === prevMonthDate.getMonth()
    ) {
      const amt = Number(item.amount) || 0;
      if (item.type === 'income') prevIncome += amt;
      else if (item.type === 'expense') prevExpense += amt;
    }
  });

  const prevNet = prevIncome - prevExpense;

  // Format teks bulan aktif (contoh: "Mei 2024")
  const activeMonthStr = new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: 'numeric'
  }).format(state.anchorDate);

  // Update DOM Elements Sesuai Mockup
  const netBalanceEl = document.getElementById('netBalanceValue');
  const totalIncomeEl = document.getElementById('totalIncomeValue');
  const totalExpenseEl = document.getElementById('totalExpenseValue');
  const savingsRateEl = document.getElementById('savingsRateValue');
  const savingsDonutPercent = document.getElementById('savingsDonutPercent');
  const savingsDonutCircle = document.getElementById('savingsDonutCircle');
  const savingsStatusBadge = document.getElementById('savingsStatusBadge');
  const balanceTrendPill = document.getElementById('balanceTrendPill');
  const incomePeriodMonth = document.getElementById('incomePeriodMonth');
  const expensePeriodMonth = document.getElementById('expensePeriodMonth');

  // Legacy elements
  const balanceBadge = document.getElementById('balanceStatusBadge');
  const incomeCountEl = document.getElementById('incomeCountText');
  const expenseCountEl = document.getElementById('expenseCountText');

  if (netBalanceEl) netBalanceEl.textContent = formatRupiah(netBalance);
  if (totalIncomeEl) totalIncomeEl.textContent = formatRupiah(incomeTotal);
  if (totalExpenseEl) totalExpenseEl.textContent = formatRupiah(expenseTotal);
  if (savingsRateEl) savingsRateEl.textContent = `${savingsRate}%`;
  if (savingsDonutPercent) savingsDonutPercent.textContent = `${savingsRate}%`;

  if (incomePeriodMonth) incomePeriodMonth.textContent = activeMonthStr;
  if (expensePeriodMonth) expensePeriodMonth.textContent = activeMonthStr;

  // Update Donut Chart SVG stroke-dashoffset (r = 42, keliling = 263.89)
  if (savingsDonutCircle) {
    const circumference = 263.89;
    const clamped = Math.min(Math.max(savingsRate, 0), 100);
    const offset = circumference - (circumference * clamped / 100);
    savingsDonutCircle.style.strokeDashoffset = offset;
  }

  // Update Status Rasio Tabungan
  if (savingsStatusBadge) {
    if (savingsRate >= 70) {
      savingsStatusBadge.className = 'pill-clean status-pill-success';
      savingsStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Sangat baik!';
    } else if (savingsRate >= 40) {
      savingsStatusBadge.className = 'pill-clean status-pill-success';
      savingsStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Baik';
    } else if (savingsRate >= 20) {
      savingsStatusBadge.className = 'pill-clean status-pill-neutral';
      savingsStatusBadge.innerHTML = '<i class="fa-solid fa-circle-info"></i> Cukup';
    } else {
      savingsStatusBadge.className = 'pill-clean status-pill-warning';
      savingsStatusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Perlu ditingkatkan';
    }
  }

  // Update Trend Saldo (MoM)
  if (balanceTrendPill) {
    if (prevNet > 0) {
      const growth = ((netBalance - prevNet) / prevNet) * 100;
      const formattedGrowth = Math.abs(growth).toFixed(1).replace('.', ',');
      if (growth >= 0) {
        balanceTrendPill.className = 'pill-clean trend-pill-up';
        balanceTrendPill.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> <span id="balanceTrendText">Naik ${formattedGrowth}% dari bulan lalu</span>`;
      } else {
        balanceTrendPill.className = 'pill-clean trend-pill-down';
        balanceTrendPill.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> <span id="balanceTrendText">Turun ${formattedGrowth}% dari bulan lalu</span>`;
      }
    } else {
      balanceTrendPill.className = 'pill-clean trend-pill-neutral';
      balanceTrendPill.innerHTML = `<i class="fa-solid fa-chart-line"></i> <span id="balanceTrendText">Data bulan lalu belum tersedia</span>`;
    }
  }

  // Legacy fallback
  if (balanceBadge) {
    if (netBalance >= 0) {
      balanceBadge.textContent = 'Cashflow Positif';
      balanceBadge.className = 'card-badge';
    } else {
      balanceBadge.textContent = 'Defisit Pengeluaran';
      balanceBadge.className = 'card-badge negative';
    }
  }
  if (incomeCountEl) incomeCountEl.textContent = `${incomeCount} transaksi masuk`;
  if (expenseCountEl) expenseCountEl.textContent = `${expenseCount} transaksi keluar`;

  // Render Transaksi Terbaru di Tab Beranda & Ringkasan Anggaran
  renderRecentTransactions();
  renderCategoryProgress();
}

/**
 * Render 5 transaksi terbaru pada card di Tab Beranda
 */
function renderRecentTransactions() {
  const container = document.getElementById('recentTxList');
  if (!container) return;

  const currentItems = getFilteredTransactions().slice(0, 5);
  if (currentItems.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px 12px; color: var(--text-tertiary); font-size: 0.85rem;">
        Belum ada catatan transaksi di periode ini
      </div>
    `;
    return;
  }

  container.innerHTML = currentItems.map(item => {
    const cat = getCategoryInfo(item.type, item.category);
    const isIncome = item.type === 'income';
    const amountClass = isIncome ? 'text-income' : 'text-expense';
    const amountPrefix = isIncome ? '+ ' : '- ';

    return `
      <div class="recent-tx-item" onclick="openEditModal('${item.id}')" style="cursor: pointer;" title="Klik untuk edit transaksi">
        <div class="recent-tx-icon-wrap" style="background: ${cat.color}14; color: ${cat.color};">
          <i class="fa-solid ${cat.icon}"></i>
        </div>
        <div class="recent-tx-details">
          <div class="recent-tx-title">${escapeHtml(item.title)}</div>
          <div class="recent-tx-subtitle">${cat.name} • ${formatDateIndo(item.date)}</div>
        </div>
        <div class="recent-tx-amount ${amountClass}">
          ${amountPrefix}${formatRupiah(item.amount)}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render progress bar kategori pengeluaran pada Tab Anggaran
 */
function renderCategoryProgress() {
  const container = document.getElementById('categoryProgressList');
  if (!container) return;

  const currentItems = getTransactionsInCurrentPeriod();
  const expenseMap = {};
  let totalExp = 0;

  currentItems.forEach(i => {
    if (i.type === 'expense') {
      const amt = Number(i.amount) || 0;
      expenseMap[i.category] = (expenseMap[i.category] || 0) + amt;
      totalExp += amt;
    }
  });

  const catKeys = Object.keys(expenseMap);
  if (catKeys.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-tertiary); font-size: 0.85rem;">
        Belum ada pengeluaran yang tercatat pada periode ini.
      </div>
    `;
    return;
  }

  catKeys.sort((a, b) => expenseMap[b] - expenseMap[a]);

  container.innerHTML = catKeys.map(catId => {
    const info = getCategoryInfo('expense', catId);
    const amt = expenseMap[catId];
    const pct = totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0;

    return `
      <div class="cat-progress-item">
        <div class="cat-progress-header">
          <span class="cat-progress-label">
            <i class="fa-solid ${info.icon}" style="color: ${info.color};"></i>
            ${info.name}
          </span>
          <span class="cat-progress-val">${formatRupiah(amt)} (${pct}%)</span>
        </div>
        <div class="cat-progress-bar">
          <div class="cat-progress-fill" style="width: ${pct}%; background: ${info.color};"></div>
        </div>
      </div>
    `;
  }).join('');
}

// =============================================================================
// 7. Render Tabel Transaksi
// =============================================================================
function renderTransactionsTable() {
  const items = getFilteredTransactions();
  const tbody = document.getElementById('transactionsTableBody');
  const emptyState = document.getElementById('emptyState');
  const countPill = document.getElementById('filteredCountPill');
  const mobileList = document.getElementById('mobileTransactionsList');

  countPill.textContent = items.length;

  if (items.length === 0) {
    tbody.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  // 1. Render Desktop / Tablet Table
  tbody.innerHTML = items.map(item => {
    const cat = getCategoryInfo(item.type, item.category);
    const isIncome = item.type === 'income';
    const amountClass = isIncome ? 'text-income' : 'text-expense';
    const amountPrefix = isIncome ? '+ ' : '- ';
    const typeLabel = isIncome ? 'Pemasukan' : 'Pengeluaran';
    const typeClass = isIncome ? 'type-income' : 'type-expense';

    return `
      <tr data-id="${item.id}">
        <td>
          <div class="transaction-datetime">
            <span class="transaction-date">${formatDateIndo(item.date)}</span>
            <span class="transaction-time"><i class="fa-regular fa-clock"></i> ${item.time || '00:00'}</span>
          </div>
        </td>
        <td>
          <span class="cat-badge" style="border-color: ${cat.color}33;">
            <i class="fa-solid ${cat.icon}" style="color: ${cat.color};"></i>
            ${cat.name}
          </span>
        </td>
        <td>
          <div class="transaction-desc">${escapeHtml(item.title)}</div>
          ${item.notes ? `<div class="transaction-notes">${escapeHtml(item.notes)}</div>` : ''}
        </td>
        <td>
          <span class="type-pill ${typeClass}">${typeLabel}</span>
        </td>
        <td class="text-right">
          <span class="transaction-amount ${amountClass}">
            ${amountPrefix}${formatRupiah(item.amount)}
          </span>
        </td>
        <td class="text-center">
          <div class="action-buttons-group">
            <button class="action-btn edit-btn" onclick="openEditModal('${item.id}')" title="Edit Transaksi" aria-label="Edit Transaksi">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button class="action-btn delete-btn" onclick="confirmDelete('${item.id}')" title="Hapus Transaksi" aria-label="Hapus Transaksi">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // 2. Render Mobile Card List (< 640px)
  if (mobileList) {
    mobileList.innerHTML = items.map(item => {
      const cat = getCategoryInfo(item.type, item.category);
      const isIncome = item.type === 'income';
      const amountClass = isIncome ? 'amount-income' : 'amount-expense';
      const amountPrefix = isIncome ? '+ ' : '- ';

      return `
        <div class="mobile-tx-card" data-id="${item.id}">
          <div class="mobile-tx-left">
            <div class="mobile-tx-icon-wrap" style="background: ${cat.color}1f; color: ${cat.color};">
              <i class="fa-solid ${cat.icon}"></i>
            </div>
            <div class="mobile-tx-details">
              <div class="mobile-tx-title">${escapeHtml(item.title)}</div>
              ${item.notes ? `<div class="mobile-tx-notes">${escapeHtml(item.notes)}</div>` : ''}
              <div class="mobile-tx-meta">
                <span class="mobile-tx-cat-badge">${cat.name}</span>
                <span>•</span>
                <span>${formatDateIndo(item.date)}</span>
                ${item.time ? `<span>• ${item.time}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="mobile-tx-right">
            <div class="mobile-tx-amount ${amountClass}">
              ${amountPrefix}${formatRupiah(item.amount)}
            </div>
            <div class="mobile-tx-actions">
              <button class="action-btn edit-btn" onclick="openEditModal('${item.id}')" title="Edit Transaksi" aria-label="Edit Transaksi">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button class="action-btn delete-btn" onclick="confirmDelete('${item.id}')" title="Hapus Transaksi" aria-label="Hapus Transaksi">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

// =============================================================================
// 8. Visualisasi Grafik (Chart.js)
// =============================================================================
function getChartThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor: isDark ? '#94a3b8' : '#475569',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    tooltipBg: isDark ? '#1e293b' : '#ffffff',
    tooltipText: isDark ? '#f8fafc' : '#0f172a'
  };
}

function renderCharts() {
  renderCashflowChart();
  renderCategoryChart();
}

function renderCashflowChart() {
  const canvas = document.getElementById('cashflowChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const theme = getChartThemeColors();

  // Siapkan data sumbu X & breakdown pemasukan vs pengeluaran
  let labels = [];
  let incomeData = [];
  let expenseData = [];

  const anchor = state.anchorDate;
  const period = state.currentPeriod;

  if (period === 'daily') {
    // Breakdown dalam 1 hari (pemasukan vs pengeluaran langsung)
    labels = ['Pemasukan Hari Ini', 'Pengeluaran Hari Ini'];
    const currentItems = getTransactionsInCurrentPeriod();
    let inc = 0, exp = 0;
    currentItems.forEach(i => {
      if (i.type === 'income') inc += Number(i.amount) || 0;
      if (i.type === 'expense') exp += Number(i.amount) || 0;
    });
    incomeData = [inc, 0];
    expenseData = [0, exp];
  } else if (period === 'weekly') {
    // 7 Hari dalam minggu (Senin - Minggu)
    const { start } = getWeekRange(anchor);
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const daysMap = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = formatDateISO(d);
      labels.push(`${dayNames[i]} (${d.getDate()})`);
      daysMap[iso] = { income: 0, expense: 0 };
    }

    const currentItems = getTransactionsInCurrentPeriod();
    currentItems.forEach(i => {
      if (daysMap[i.date]) {
        if (i.type === 'income') daysMap[i.date].income += Number(i.amount) || 0;
        if (i.type === 'expense') daysMap[i.date].expense += Number(i.amount) || 0;
      }
    });

    Object.keys(daysMap).forEach(key => {
      incomeData.push(daysMap[key].income);
      expenseData.push(daysMap[key].expense);
    });
  } else if (period === 'monthly') {
    // 3 Bulan berurutan (Bulan Lalu, Bulan Berjalan, Bulan Berikutnya) persis seperti di mockup
    const prevMonth = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
    const currMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const nextMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    
    const threeMonths = [prevMonth, currMonth, nextMonth];
    
    threeMonths.forEach(m => {
      const label = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(m);
      labels.push(label);
      
      let mInc = 0;
      let mExp = 0;
      state.transactions.forEach(i => {
        if (!i.date) return;
        const idate = new Date(i.date + 'T00:00:00');
        if (idate.getFullYear() === m.getFullYear() && idate.getMonth() === m.getMonth()) {
          const amt = Number(i.amount) || 0;
          if (i.type === 'income') mInc += amt;
          else if (i.type === 'expense') mExp += amt;
        }
      });
      incomeData.push(mInc);
      expenseData.push(mExp);
    });
  } else {
    // Semua periode: Tampilkan 6 bulan terakhir
    const monthBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
      const mLabel = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(d);
      monthBuckets.push({
        label: mLabel,
        year: d.getFullYear(),
        month: d.getMonth(),
        inc: 0,
        exp: 0
      });
    }

    state.transactions.forEach(i => {
      const idate = new Date(i.date + 'T00:00:00');
      const b = monthBuckets.find(m => m.year === idate.getFullYear() && m.month === idate.getMonth());
      if (b) {
        if (i.type === 'income') b.inc += Number(i.amount) || 0;
        if (i.type === 'expense') b.exp += Number(i.amount) || 0;
      }
    });

    monthBuckets.forEach(b => {
      labels.push(b.label);
      incomeData.push(b.inc);
      expenseData.push(b.exp);
    });
  }

  if (state.charts.cashflow) {
    state.charts.cashflow.destroy();
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const barIncomeColor = '#2563eb'; // Royal Blue sesuai mockup
  const barExpenseColor = isDark ? '#64748b' : '#cbd5e1'; // Soft Slate Grey sesuai mockup

  state.charts.cashflow = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: incomeData,
          backgroundColor: barIncomeColor,
          borderRadius: 4,
          maxBarThickness: 20,
          categoryPercentage: 0.65,
          barPercentage: 0.85
        },
        {
          label: 'Pengeluaran',
          data: expenseData,
          backgroundColor: barExpenseColor,
          borderRadius: 4,
          maxBarThickness: 20,
          categoryPercentage: 0.65,
          barPercentage: 0.85
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false // Sembunyikan legend bawaan karena sudah ada custom HTML legend di card header
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipText,
          bodyColor: theme.tooltipText,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${formatRupiah(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: theme.textColor,
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' }
          }
        },
        y: {
          border: { display: false },
          grid: {
            color: theme.gridColor,
            drawTicks: false
          },
          ticks: {
            color: theme.textColor,
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
            stepSize: 4000000,
            callback: value => {
              if (value === 0) return '0';
              if (value >= 1000000) return (value / 1000000).toFixed(0) + ' jt';
              if (value >= 1000) return (value / 1000).toFixed(0) + ' rb';
              return value;
            }
          }
        }
      }
    }
  });
}

function renderCategoryChart() {
  const canvas = document.getElementById('categoryChart');
  const emptyNotice = document.getElementById('noExpenseNotice');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const theme = getChartThemeColors();

  const currentItems = getTransactionsInCurrentPeriod();
  const expenseMap = {};

  currentItems.forEach(i => {
    if (i.type === 'expense') {
      const amt = Number(i.amount) || 0;
      expenseMap[i.category] = (expenseMap[i.category] || 0) + amt;
    }
  });

  const catKeys = Object.keys(expenseMap);

  if (catKeys.length === 0) {
    canvas.style.display = 'none';
    emptyNotice.classList.remove('hidden');
    if (state.charts.category) {
      state.charts.category.destroy();
      state.charts.category = null;
    }
    return;
  }

  canvas.style.display = 'block';
  emptyNotice.classList.add('hidden');

  const labels = [];
  const data = [];
  const colors = [];

  catKeys.forEach(catId => {
    const info = getCategoryInfo('expense', catId);
    labels.push(info.name);
    data.push(expenseMap[catId]);
    colors.push(info.color);
  });

  if (state.charts.category) {
    state.charts.category.destroy();
  }

  state.charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: theme.tooltipBg,
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: theme.textColor,
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
            usePointStyle: true,
            boxWidth: 8,
            padding: 12
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipText,
          bodyColor: theme.tooltipText,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((context.raw / total) * 100) : 0;
              return ` ${context.label}: ${formatRupiah(context.raw)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// =============================================================================
// 9. Modal Tambah / Edit Transaksi
// =============================================================================
function populateCategoryDropdown(type, selectedCategory = '') {
  const select = document.getElementById('formCategory');
  const categories = CATEGORIES[type] || [];

  select.innerHTML = categories.map(cat => {
    const isSelected = cat.id === selectedCategory ? 'selected' : '';
    return `<option value="${cat.id}" ${isSelected}>${cat.name}</option>`;
  }).join('');
}

function populateFilterCategoryDropdown() {
  const select = document.getElementById('categoryFilter');
  const allCategories = [
    ...CATEGORIES.expense,
    ...CATEGORIES.income
  ];

  // Hapus duplikasi berdasarkan ID
  const uniqueCats = [];
  const seen = new Set();
  allCategories.forEach(c => {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      uniqueCats.push(c);
    }
  });

  select.innerHTML = '<option value="all">Semua Kategori</option>' +
    uniqueCats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function openAddModal() {
  state.editingId = null;
  const modal = document.getElementById('transactionModal');
  const form = document.getElementById('transactionForm');
  const title = document.getElementById('modalTitle');
  const idInput = document.getElementById('transactionId');

  title.textContent = 'Tambah Transaksi Baru';
  idInput.value = '';
  form.reset();

  // Default type: expense
  const expenseRadio = document.querySelector('input[name="transactionType"][value="expense"]');
  if (expenseRadio) expenseRadio.checked = true;

  populateCategoryDropdown('expense');

  // Default Date & Time: saat ini
  const now = new Date();
  document.getElementById('formDate').value = formatDateISO(now);
  document.getElementById('formTime').value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  document.getElementById('formAmount').value = '';
  document.getElementById('amountSpelledOut').textContent = '';

  modal.showModal();
}

function openEditModal(id) {
  const item = state.transactions.find(t => t.id === id);
  if (!item) return;

  state.editingId = id;
  const modal = document.getElementById('transactionModal');
  const title = document.getElementById('modalTitle');
  const idInput = document.getElementById('transactionId');

  title.textContent = 'Edit Transaksi';
  idInput.value = item.id;

  // Set Type
  const radio = document.querySelector(`input[name="transactionType"][value="${item.type}"]`);
  if (radio) radio.checked = true;

  populateCategoryDropdown(item.type, item.category);

  // Set values
  document.getElementById('formDate').value = item.date;
  document.getElementById('formTime').value = item.time || '12:00';
  document.getElementById('formAmount').value = new Intl.NumberFormat('id-ID').format(item.amount);
  document.getElementById('amountSpelledOut').textContent = formatRupiah(item.amount);
  document.getElementById('formTitle').value = item.title;
  document.getElementById('formNotes').value = item.notes || '';

  modal.showModal();
}

function closeModal() {
  const modal = document.getElementById('transactionModal');
  if (modal.open) modal.close();
  state.editingId = null;
}

function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('transactionId').value;
  const type = document.querySelector('input[name="transactionType"]:checked').value;
  const date = document.getElementById('formDate').value;
  const time = document.getElementById('formTime').value || '00:00';
  const rawAmount = document.getElementById('formAmount').value;
  const amount = parseFormattedNumber(rawAmount);
  const category = document.getElementById('formCategory').value;
  const title = document.getElementById('formTitle').value.trim();
  const notes = document.getElementById('formNotes').value.trim();

  if (!amount || amount <= 0) {
    showToast('Nominal transaksi harus lebih dari 0', 'danger');
    return;
  }

  if (!title) {
    showToast('Keterangan transaksi wajib diisi', 'danger');
    return;
  }

  if (state.editingId) {
    // Edit existing
    const idx = state.transactions.findIndex(t => t.id === state.editingId);
    if (idx !== -1) {
      state.transactions[idx] = {
        ...state.transactions[idx],
        type,
        date,
        time,
        amount,
        category,
        title,
        notes
      };
      saveTransactions(state.transactions);
      showToast('Transaksi berhasil diperbarui', 'success');
    }
  } else {
    // Add new
    const newTx = {
      id: 'tx-' + Date.now(),
      type,
      date,
      time,
      amount,
      category,
      title,
      notes
    };
    state.transactions.unshift(newTx);
    saveTransactions(state.transactions);
    showToast('Transaksi baru berhasil dicatat', 'success');
  }

  closeModal();
  refreshUI();
}

function confirmDelete(id) {
  const item = state.transactions.find(t => t.id === id);
  if (!item) return;

  const conf = confirm(`Apakah Anda yakin ingin menghapus catatan "${item.title}" (${formatRupiah(item.amount)})?`);
  if (conf) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveTransactions(state.transactions);
    showToast('Catatan transaksi telah dihapus', 'info');
    refreshUI();
  }
}

// =============================================================================
// 10. Toast Notification
// =============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'danger') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// =============================================================================
// 11. Ekspor, Berbagi & Cadangan Data (PDF, WhatsApp, Share API, CSV, JSON)
// =============================================================================
function openExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal) modal.showModal();
}

function closeExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal && modal.open) modal.close();
}

/**
 * Membuat dokumen PDF profesional dengan ringkasan metrik & tabel transaksi
 */
function generatePDFDocument() {
  const items = getFilteredTransactions();
  if (items.length === 0) {
    showToast('Tidak ada transaksi untuk dicetak ke PDF', 'danger');
    return null;
  }

  // Pastikan pustaka jsPDF tersedia
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast('Pustaka pembuat PDF belum termuat di peramban', 'danger');
    return null;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Hitung metrik keuangan dari data yang sedang difilter
  let incomeTotal = 0;
  let incomeCount = 0;
  let expenseTotal = 0;
  let expenseCount = 0;

  items.forEach(item => {
    const amt = Number(item.amount) || 0;
    if (item.type === 'income') {
      incomeTotal += amt;
      incomeCount++;
    } else {
      expenseTotal += amt;
      expenseCount++;
    }
  });

  const netBalance = incomeTotal - expenseTotal;
  const periodText = document.getElementById('periodLabel')?.textContent || 'Semua Riwayat Transaksi';
  const exportDate = new Date();
  const exportDateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(exportDate);

  // --- 1. HEADER BANNER ---
  // Background Header: #1e1b4b (Deep Indigo)
  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, 210, 38, 'F');

  // Vibrant accent line: #6366f1 (Indigo)
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 38, 210, 2, 'F');

  // Title: KeuanganKu
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('KeuanganKu', 14, 16);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254);
  doc.text('Laporan Catatan Arus Kas, Pemasukan & Pengeluaran', 14, 23);
  doc.text(`Periode: ${periodText}`, 14, 29);

  // Right-aligned header metadata
  doc.setFontSize(8);
  doc.setTextColor(224, 231, 255);
  doc.text(`Tanggal Cetak: ${exportDateStr}`, 196, 16, { align: 'right' });
  doc.text(`Total Catatan: ${items.length} Transaksi`, 196, 22, { align: 'right' });
  doc.text(`Status: ${netBalance >= 0 ? 'Surplus / Cashflow Positif' : 'Defisit Pengeluaran'}`, 196, 28, { align: 'right' });

  // --- 2. KPI SUMMARY BOXES ---
  const boxY = 46;
  const boxH = 22;
  const boxW = 57;

  // Box 1: Saldo Bersih
  if (netBalance >= 0) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
  }
  doc.roundedRect(14, boxY, boxW, boxH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL SALDO BERSIH', 18, boxY + 7);
  doc.setFontSize(11.5);
  if (netBalance >= 0) {
    doc.setTextColor(5, 150, 105);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(formatRupiah(netBalance), 18, boxY + 16);

  // Box 2: Total Pemasukan
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(76, boxY, boxW, boxH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PEMASUKAN', 80, boxY + 7);
  doc.setFontSize(11.5);
  doc.setTextColor(5, 150, 105);
  doc.text(formatRupiah(incomeTotal), 80, boxY + 15);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${incomeCount} transaksi masuk`, 80, boxY + 19.5);

  // Box 3: Total Pengeluaran
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(138, boxY, boxW, boxH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PENGELUARAN', 142, boxY + 7);
  doc.setFontSize(11.5);
  doc.setTextColor(220, 38, 38);
  doc.text(formatRupiah(expenseTotal), 142, boxY + 15);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${expenseCount} transaksi keluar`, 142, boxY + 19.5);

  // --- 3. TRANSACTIONS AUTOTABLE ---
  const tableData = items.map((item, idx) => {
    const cat = getCategoryInfo(item.type, item.category);
    const dateFormatted = formatDateIndo(item.date);
    const timeFormatted = item.time || '-';
    const isIncome = item.type === 'income';
    const prefix = isIncome ? '+ ' : '- ';
    const descWithNotes = item.notes ? `${item.title}\nCatatan: ${item.notes}` : item.title;

    return [
      idx + 1,
      `${dateFormatted}\n${timeFormatted}`,
      cat.name,
      descWithNotes,
      isIncome ? 'Pemasukan' : 'Pengeluaran',
      `${prefix}${formatRupiah(item.amount)}`
    ];
  });

  const autoTableConfig = {
    startY: 74,
    head: [['No', 'Tanggal & Waktu', 'Kategori', 'Keterangan', 'Tipe', 'Nominal (Rp)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // #4f46e5 Indigo
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3
    },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 32 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 34, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: function(data) {
      if (data.section === 'head' && (data.column.index === 0 || data.column.index === 4)) {
        data.cell.styles.halign = 'center';
      }
      if (data.section === 'head' && data.column.index === 5) {
        data.cell.styles.halign = 'right';
      }
      if (data.section === 'body' && data.column.index === 5) {
        const typeCell = data.row.raw[4];
        if (typeCell === 'Pemasukan') {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
      if (data.section === 'body' && data.column.index === 4) {
        const typeCell = data.row.raw[4];
        if (typeCell === 'Pemasukan') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: function(data) {
      const totalPages = doc.internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);

      const footerY = doc.internal.pageSize.height - 8;
      doc.text(
        `KeuanganKu • Halaman ${data.pageNumber} dari ${totalPages}`,
        14,
        footerY
      );
      doc.text(
        `Laporan Resmi KeuanganKu • Arsip Mandiri`,
        doc.internal.pageSize.width - 14,
        footerY,
        { align: 'right' }
      );
    },
    margin: { top: 16, left: 14, right: 14, bottom: 14 }
  };

  if (typeof doc.autoTable === 'function') {
    doc.autoTable(autoTableConfig);
  } else if (window.jspdfAutoTable && typeof window.jspdfAutoTable.default === 'function') {
    window.jspdfAutoTable.default(doc, autoTableConfig);
  } else if (window.jspdfAutoTable && typeof window.jspdfAutoTable.applyPlugin === 'function') {
    window.jspdfAutoTable.applyPlugin(jsPDF);
    doc.autoTable(autoTableConfig);
  } else {
    console.error('Plugin autoTable tidak ditemukan.');
    showToast('Gagal memuat plugin tabel PDF', 'danger');
    return null;
  }

  return doc;
}

// =============================================================================
// 11. Centralized File Helpers, Export, Sharing & Print (Capacitor & Web)
// =============================================================================

/**
 * Deteksi apakah aplikasi berjalan di platform native Capacitor (Android/iOS)
 */
function isNativePlatform() {
  return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
}

function getFilesystemPlugin() {
  return window.Capacitor?.Plugins?.Filesystem || null;
}

function getSharePlugin() {
  return window.Capacitor?.Plugins?.Share || null;
}

function getPdfPrintPlugin() {
  return window.Capacitor?.Plugins?.PdfPrint || null;
}

function getAppPlugin() {
  return window.Capacitor?.Plugins?.App || null;
}

/**
 * Konversi string base64 menjadi Blob biner
 */
function base64ToBlob(base64, mimeType = 'application/octet-stream') {
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const byteCharacters = atob(cleanBase64);
  const byteArrays = [];
  const sliceSize = 512;

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: mimeType });
}

/**
 * Unduh berkas di browser biasa melalui tautan anchor virtual
 */
function downloadBlobInBrowser(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Memeriksa dan meminta izin penyimpanan (khususnya untuk Android <= 9)
 */
async function ensureStoragePermissions(Filesystem) {
  try {
    if (typeof Filesystem.checkPermissions === 'function') {
      const status = await Filesystem.checkPermissions();
      if (status.publicStorage !== 'granted') {
        if (typeof Filesystem.requestPermissions === 'function') {
          await Filesystem.requestPermissions();
        }
      }
    }
  } catch (err) {
    console.warn('Pemeriksaan izin penyimpanan dilewati:', err);
  }
}

/**
 * Helper terpusat untuk menyimpan berkas
 * - Di Android native: Simpan ke Documents/KeuanganKu/ (Directory.Documents, recursive: true)
 *   Jika berhasil: tampilkan toast "Tersimpan di Dokumen/KeuanganKu/namafile"
 *   Jika gagal (izin/scoped storage): fallback tulis ke Directory.Cache lalu buka share sheet via Share.share({ files: [uri] })
 * - Di browser: fallback unduh standar
 */
async function saveFile(filename, data, mime, options = {}) {
  const isBase64 = !!options.base64;

  // 1. Fallback browser biasa
  if (!isNativePlatform()) {
    try {
      const blob = isBase64 ? base64ToBlob(data, mime) : new Blob([data], { type: mime });
      downloadBlobInBrowser(blob, filename);
      showToast(`Berkas ${filename} berhasil diunduh!`, 'success');
      return { success: true, method: 'browser-download' };
    } catch (err) {
      console.error('Gagal mengunduh berkas di browser:', err);
      showToast('Gagal mengunduh berkas: ' + err.message, 'danger');
      return { success: false, error: err };
    }
  }

  // 2. Native Capacitor
  const Filesystem = getFilesystemPlugin();
  const Share = getSharePlugin();

  if (!Filesystem) {
    console.warn('Plugin Filesystem tidak tersedia, fallback ke peramban');
    const blob = isBase64 ? base64ToBlob(data, mime) : new Blob([data], { type: mime });
    downloadBlobInBrowser(blob, filename);
    showToast(`Berkas ${filename} berhasil diunduh!`, 'success');
    return { success: true, method: 'browser-fallback' };
  }

  let fileData = data;
  if (isBase64 && typeof data === 'string' && data.includes(',')) {
    fileData = data.split(',')[1];
  }

  // Minta izin jika diperlukan pada Android lawas
  await ensureStoragePermissions(Filesystem);

  const relativeDocPath = `KeuanganKu/${filename}`;

  try {
    const writeOptions = {
      path: relativeDocPath,
      data: fileData,
      directory: 'DOCUMENTS',
      recursive: true
    };
    if (!isBase64) {
      writeOptions.encoding = 'utf8';
    }

    await Filesystem.writeFile(writeOptions);

    showToast(`Tersimpan di Dokumen/KeuanganKu/${filename}`, 'success');
    return { success: true, method: 'documents', path: relativeDocPath };
  } catch (err) {
    console.warn(`Gagal menyimpan ke Documents/KeuanganKu/${filename} (${err.message}). Menjalankan fallback ke Cache & Share Sheet.`);

    // Fallback: tulis ke Directory.Cache lalu buka share sheet
    try {
      const cacheWriteOptions = {
        path: filename,
        data: fileData,
        directory: 'CACHE',
        recursive: true
      };
      if (!isBase64) {
        cacheWriteOptions.encoding = 'utf8';
      }

      await Filesystem.writeFile(cacheWriteOptions);

      const cacheResult = await Filesystem.getUri({
        path: filename,
        directory: 'CACHE'
      });

      if (Share && typeof Share.share === 'function') {
        showToast('Penyimpanan publik dibatasi sistem. Membuka lembar berbagi berkas...', 'info');
        await Share.share({
          title: options.title || filename,
          text: options.text || '',
          dialogTitle: options.dialogTitle || 'Simpan / Bagikan Berkas',
          files: [cacheResult.uri]
        });
        return { success: true, method: 'cache-share', uri: cacheResult.uri };
      } else {
        showToast(`Tersimpan di cache perangkat: ${filename}`, 'info');
        return { success: true, method: 'cache-only', uri: cacheResult.uri };
      }
    } catch (fallbackErr) {
      console.error('Fallback penyimpanan gagal:', fallbackErr);
      showToast('Gagal menyimpan berkas: ' + fallbackErr.message, 'danger');
      return { success: false, error: fallbackErr };
    }
  }
}

/**
 * Helper terpusat untuk membagikan berkas via Share Sheet
 * - Di Android: tulis berkas ke Directory.Cache lalu panggil Share.share({ files: [uri], dialogTitle: '...' })
 * - Di browser: panggil Web Share API (navigator.share) atau fallback unduh
 */
async function shareFile(filename, data, mime, options = {}) {
  const isBase64 = !!options.base64;
  let fileData = data;
  if (isBase64 && typeof data === 'string' && data.includes(',')) {
    fileData = data.split(',')[1];
  }

  // 1. Browser biasa
  if (!isNativePlatform()) {
    try {
      const blob = isBase64 ? base64ToBlob(data, mime) : new Blob([data], { type: mime });
      const file = new File([blob], filename, { type: mime });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: options.title || 'KeuanganKu',
          text: options.text || ''
        });
        showToast('Berkas berhasil dibagikan!', 'success');
        return { success: true, method: 'web-share' };
      } else if (navigator.share && options.text) {
        await navigator.share({
          title: options.title || 'KeuanganKu',
          text: options.text
        });
        showToast('Ringkasan teks berhasil dibagikan!', 'success');
        return { success: true, method: 'web-share-text' };
      } else {
        downloadBlobInBrowser(blob, filename);
        showToast(`Fitur berbagi tidak didukung browser ini. Berkas diunduh sebagai ${filename}`, 'info');
        return { success: true, method: 'browser-download' };
      }
    } catch (err) {
      if (err.name === 'AbortError') return { cancelled: true };
      console.error('Gagal membagikan di browser:', err);
      showToast('Gagal membagikan berkas: ' + err.message, 'danger');
      return { success: false, error: err };
    }
  }

  // 2. Native Capacitor
  const Filesystem = getFilesystemPlugin();
  const Share = getSharePlugin();

  if (!Filesystem || !Share) {
    showToast('Plugin penyimpanan / berbagi tidak tersedia', 'danger');
    return { success: false, error: 'Plugins unavailable' };
  }

  try {
    const writeOptions = {
      path: filename,
      data: fileData,
      directory: 'CACHE',
      recursive: true
    };
    if (!isBase64) {
      writeOptions.encoding = 'utf8';
    }

    await Filesystem.writeFile(writeOptions);

    const uriResult = await Filesystem.getUri({
      path: filename,
      directory: 'CACHE'
    });

    await Share.share({
      title: options.title || 'KeuanganKu',
      text: options.text || '',
      dialogTitle: options.dialogTitle || 'Bagikan',
      files: [uriResult.uri]
    });

    return { success: true, method: 'native-share', uri: uriResult.uri };
  } catch (err) {
    if (err && (err.message?.includes('canceled') || err.message?.includes('cancelled') || err.name === 'AbortError')) {
      return { cancelled: true };
    }
    console.error('Gagal membagikan berkas di platform native:', err);
    showToast('Gagal membagikan: ' + err.message, 'danger');
    return { success: false, error: err };
  }
}

/**
 * Unduh Laporan PDF ke Dokumen/KeuanganKu/ (atau browser)
 * Nama file: KeuanganKu_Laporan_YYYY-MM-DD.pdf
 */
async function exportToPDF() {
  try {
    const doc = generatePDFDocument();
    if (!doc) return;

    showToast('Menyiapkan dokumen PDF...', 'info');
    const filename = `KeuanganKu_Laporan_${formatDateISO(new Date())}.pdf`;

    // Ambil datauri dan ekstrak base64
    const dataUri = doc.output('datauristring');
    const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

    await saveFile(filename, base64Data, 'application/pdf', {
      base64: true,
      title: 'Laporan Keuangan KeuanganKu',
      dialogTitle: 'Simpan / Bagikan Laporan PDF'
    });

    closeExportModal();
  } catch (err) {
    console.error('Gagal membuat PDF:', err);
    showToast('Gagal membuat PDF: ' + err.message, 'danger');
  }
}

/**
 * Bagikan Laporan PDF ke aplikasi lain (WhatsApp, Drive, dll)
 */
async function sharePDFReport() {
  const items = getFilteredTransactions();
  if (items.length === 0) {
    showToast('Tidak ada data transaksi untuk dibagikan', 'danger');
    return;
  }

  try {
    showToast('Menyiapkan berkas PDF...', 'info');
    const doc = generatePDFDocument();
    if (!doc) return;

    const filename = `KeuanganKu_Laporan_${formatDateISO(new Date())}.pdf`;
    const dataUri = doc.output('datauristring');
    const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

    await shareFile(filename, base64Data, 'application/pdf', {
      base64: true,
      title: 'Laporan Keuangan KeuanganKu',
      text: `Berikut adalah laporan keuangan KeuanganKu (${items.length} transaksi).`,
      dialogTitle: 'Bagikan'
    });

    closeExportModal();
  } catch (err) {
    console.error('Gagal membagikan PDF:', err);
    showToast('Gagal membagikan PDF: ' + err.message, 'danger');
  }
}

/**
 * Buat string ringkasan teks untuk dibagikan
 */
function generateTextSummary() {
  const items = getFilteredTransactions();
  let incomeTotal = 0;
  let expenseTotal = 0;
  items.forEach(i => {
    if (i.type === 'income') incomeTotal += (Number(i.amount) || 0);
    if (i.type === 'expense') expenseTotal += (Number(i.amount) || 0);
  });
  const net = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? Math.round((net / incomeTotal) * 100) : 0;
  const periodLabel = document.getElementById('periodLabel')?.textContent || `Bulanan: ${new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(state.anchorDate)}`;

  let text = `📊 *RINGKASAN LAPORAN KEUANGANKU*\n`;
  text += `📅 *Periode:* ${periodLabel}\n`;
  text += `🕒 *Dibuat:* ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())}\n\n`;
  text += `💰 *Total Saldo Bersih:* ${formatRupiah(net)} (${net >= 0 ? 'Surplus / Positif' : 'Defisit / Negatif'})\n`;
  text += `🟢 *Total Pemasukan:* ${formatRupiah(incomeTotal)}\n`;
  text += `🔴 *Total Pengeluaran:* ${formatRupiah(expenseTotal)}\n`;
  text += `📈 *Rasio Tabungan:* ${savingsRate}%\n\n`;
  text += `📝 *Catatan Transaksi Terakhir (${Math.min(10, items.length)} dari ${items.length}):*\n`;

  items.slice(0, 10).forEach((item, idx) => {
    const sign = item.type === 'income' ? '🟢 +' : '🔴 -';
    text += `${idx + 1}. ${formatDateIndo(item.date)} | ${item.title} (${sign}${formatRupiah(item.amount)})\n`;
  });

  if (items.length > 10) {
    text += `... dan ${items.length - 10} transaksi lainnya.\n`;
  }
  text += `\n_Dicatat & dikelola mandiri via Aplikasi KeuanganKu_\n`;
  return text;
}

/**
 * Bagikan Ringkasan Teks (.txt) ke WhatsApp atau aplikasi chat lainnya
 */
async function shareTextSummary() {
  const items = getFilteredTransactions();
  if (items.length === 0) {
    showToast('Tidak ada data transaksi untuk dibagikan', 'danger');
    return;
  }

  try {
    const summaryText = generateTextSummary();
    const filename = `KeuanganKu_Ringkasan_${formatDateISO(new Date())}.txt`;

    await shareFile(filename, summaryText, 'text/plain;charset=utf-8', {
      base64: false,
      title: 'Ringkasan KeuanganKu',
      text: summaryText,
      dialogTitle: 'Bagikan'
    });

    closeExportModal();
  } catch (err) {
    console.error('Gagal membagikan ringkasan teks:', err);
    showToast('Gagal membagikan ringkasan: ' + err.message, 'danger');
  }
}

/**
 * Format CSV: simpan lewat helper (utf8, tambahkan BOM \uFEFF agar terbuka benar di Excel).
 * Nama: KeuanganKu_YYYY-MM-DD.csv
 */
async function exportToCSV() {
  if (state.transactions.length === 0) {
    showToast('Tidak ada data untuk diekspor', 'danger');
    return;
  }

  try {
    const headers = ['ID', 'Tanggal', 'Waktu', 'Tipe', 'Kategori', 'Keterangan', 'Nominal (Rp)', 'Catatan'];
    const rows = state.transactions.map(item => {
      const cat = getCategoryInfo(item.type, item.category);
      return [
        `"${item.id}"`,
        `"${item.date}"`,
        `"${item.time || ''}"`,
        `"${item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
        `"${cat.name}"`,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        item.amount,
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ];
    });

    // Tambahkan BOM \uFEFF di awal berkas CSV agar terbaca benar di Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const filename = `KeuanganKu_${formatDateISO(new Date())}.csv`;

    await saveFile(filename, csvContent, 'text/csv;charset=utf-8;', {
      base64: false,
      title: 'Data Transaksi KeuanganKu',
      dialogTitle: 'Simpan / Bagikan Berkas CSV'
    });

    closeExportModal();
  } catch (err) {
    console.error('Gagal mengekspor CSV:', err);
    showToast('Gagal mengekspor CSV: ' + err.message, 'danger');
  }
}

/**
 * Payload JSON data transaksi aplikasi
 */
function getBackupJSONPayload() {
  return JSON.stringify({
    app: 'KeuanganKu',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    totalTransactions: state.transactions.length,
    transactions: state.transactions
  }, null, 2);
}

/**
 * Cadangkan Data (.json): simpan lewat helper
 */
async function exportToJSON() {
  if (state.transactions.length === 0) {
    showToast('Tidak ada data transaksi untuk diekspor', 'danger');
    return;
  }

  try {
    const jsonStr = getBackupJSONPayload();
    const filename = `KeuanganKu_Backup_${formatDateISO(new Date())}.json`;

    await saveFile(filename, jsonStr, 'application/json;charset=utf-8', {
      base64: false,
      title: 'Cadangan Data KeuanganKu',
      dialogTitle: 'Simpan Cadangan JSON'
    });

    closeExportModal();
  } catch (err) {
    console.error('Gagal mencadangkan data JSON:', err);
    showToast('Gagal mencadangkan data: ' + err.message, 'danger');
  }
}

/**
 * Simpan ke Google Drive / bagikan cadangan data (.json)
 */
async function shareJSONBackup() {
  if (state.transactions.length === 0) {
    showToast('Tidak ada data transaksi untuk dicadangkan', 'danger');
    return;
  }

  try {
    const jsonStr = getBackupJSONPayload();
    const filename = `KeuanganKu_Backup_${formatDateISO(new Date())}.json`;

    await shareFile(filename, jsonStr, 'application/json;charset=utf-8', {
      base64: false,
      title: 'Cadangan Data KeuanganKu',
      text: `Berkas cadangan data transaksi KeuanganKu (${state.transactions.length} transaksi).`,
      dialogTitle: 'Simpan ke Google Drive / Bagikan'
    });

    closeExportModal();
  } catch (err) {
    console.error('Gagal membagikan cadangan JSON:', err);
    showToast('Gagal membagikan cadangan: ' + err.message, 'danger');
  }
}

/**
 * Pemicu dialog pemilihan berkas JSON untuk pemulihan data
 */
function importFromJSON() {
  const input = document.getElementById('importJsonInput');
  if (input) {
    input.value = '';
    input.click();
  }
}

/**
 * Membaca dan memulihkan transaksi dari berkas cadangan JSON
 */
function handleImportJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      let itemsArray = null;

      if (Array.isArray(parsed)) {
        itemsArray = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.transactions)) {
          itemsArray = parsed.transactions;
        } else if (Array.isArray(parsed.data)) {
          itemsArray = parsed.data;
        }
      }

      if (!itemsArray || !Array.isArray(itemsArray)) {
        throw new Error('Format berkas tidak valid. Berkas JSON harus berupa daftar transaksi.');
      }

      // Validasi ketat struktur setiap catatan transaksi
      const validExpenseCategories = (CATEGORIES.expense || []).map(c => c.id);
      const validIncomeCategories = (CATEGORIES.income || []).map(c => c.id);
      const validItems = [];
      let skippedCount = 0;

      for (const item of itemsArray) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          skippedCount++;
          continue;
        }

        // 1. Wajib id (string tidak kosong)
        if (typeof item.id !== 'string' || item.id.trim() === '') {
          skippedCount++;
          continue;
        }

        // 2. Wajib type ('income' atau 'expense')
        if (item.type !== 'income' && item.type !== 'expense') {
          skippedCount++;
          continue;
        }

        // 3. Wajib amount (angka terbatas > 0)
        if (typeof item.amount !== 'number' || !Number.isFinite(item.amount) || item.amount <= 0) {
          skippedCount++;
          continue;
        }

        // 4. Wajib date (format YYYY-MM-DD valid)
        if (!isValidISODate(item.date)) {
          skippedCount++;
          continue;
        }

        // 5. Wajib category (harus ada di daftar kategori sesuai type; jika tidak, ganti ke 'other_expense'/'other_income')
        let category = item.category;
        if (item.type === 'expense') {
          if (typeof category !== 'string' || !validExpenseCategories.includes(category)) {
            category = 'other_expense';
          }
        } else {
          if (typeof category !== 'string' || !validIncomeCategories.includes(category)) {
            category = 'other_income';
          }
        }

        // 6. Wajib title dan notes berupa string (dipotong panjang wajar)
        if (typeof item.title !== 'string') {
          skippedCount++;
          continue;
        }

        if (typeof item.notes !== 'string') {
          skippedCount++;
          continue;
        }

        const title = item.title.trim().slice(0, 100);
        const notes = item.notes.trim().slice(0, 500);
        const time = typeof item.time === 'string' && item.time.trim() ? item.time.trim().slice(0, 10) : '12:00';

        validItems.push({
          id: item.id.trim(),
          type: item.type,
          amount: item.amount,
          date: item.date,
          category,
          title,
          notes,
          time
        });
      }

      if (validItems.length === 0) {
        const skippedInfo = skippedCount > 0 ? ` (${skippedCount} data tidak valid dilewati)` : '';
        throw new Error(`Tidak ditemukan catatan transaksi yang valid dalam berkas cadangan ini.${skippedInfo}`);
      }

      const skippedNote = skippedCount > 0 ? `\n(${skippedCount} transaksi tidak valid dilewati)` : '';

      const mergeChoice = confirm(
        `Ditemukan ${validItems.length} transaksi valid di berkas cadangan.${skippedNote}\n\n` +
        `• Klik "OK" untuk MENGGABUNGKAN (Merge) dengan data yang ada saat ini.\n` +
        `• Klik "Batal" untuk memilih opsi Menimpa Seluruh Data atau Batal.`
      );

      let resultData = [];
      if (mergeChoice) {
        const map = new Map();
        // Pertahankan transaksi lama
        state.transactions.forEach(t => map.set(t.id, t));
        // Gabungkan transaksi cadangan
        validItems.forEach(t => map.set(t.id, t));
        resultData = Array.from(map.values());
      } else {
        const overwriteChoice = confirm(
          `Apakah Anda ingin MENIMPA SELURUH DATA yang ada saat ini dengan data dari berkas cadangan (${validItems.length} transaksi valid)?${skippedNote}\n\n` +
          `PERINGATAN: Semua catatan transaksi yang ada saat ini akan digantikan!`
        );
        if (overwriteChoice) {
          resultData = validItems;
        } else {
          showToast('Impor berkas cadangan dibatalkan', 'info');
          event.target.value = '';
          return;
        }
      }

      saveTransactions(resultData);
      refreshUI();
      closeExportModal();
      const skippedToast = skippedCount > 0 ? ` (${skippedCount} data tidak valid dilewati)` : '';
      showToast(`Berhasil memulihkan ${validItems.length} transaksi cadangan!${skippedToast}`, 'success');
    } catch (err) {
      console.error('Gagal mengimpor JSON:', err);
      showToast('Gagal memulihkan data: ' + err.message, 'danger');
    } finally {
      event.target.value = '';
    }
  };
  reader.onerror = function() {
    showToast('Gagal membaca berkas cadangan', 'danger');
    event.target.value = '';
  };
  reader.readAsText(file);
}

/**
 * Cetak Dokumen Laporan:
 * - Pada native Android: hasilkan PDF ke Directory.Cache, ambil path filenya,
 *   lalu panggil Capacitor.Plugins.PdfPrint.print({ path }).
 * - Jika bukan native: fallback window.print().
 */
async function printReport() {
  closeExportModal();

  // 1. Fallback untuk browser biasa (non-native)
  if (!isNativePlatform()) {
    setTimeout(() => {
      window.print();
    }, 200);
    return;
  }

  // 2. Native Android via Plugin PdfPrint
  try {
    const PdfPrint = getPdfPrintPlugin();
    const Filesystem = getFilesystemPlugin();

    if (!PdfPrint || typeof PdfPrint.print !== 'function') {
      console.warn('Plugin PdfPrint tidak ditemukan pada window.Capacitor.Plugins. Menjalankan fallback window.print()');
      window.print();
      return;
    }

    if (!Filesystem) {
      console.warn('Plugin Filesystem tidak tersedia untuk menyiapkan PDF cetak');
      window.print();
      return;
    }

    showToast('Menyiapkan dokumen cetak...', 'info');
    const doc = generatePDFDocument();
    if (!doc) return;

    const filename = `KeuanganKu_Cetak_${Date.now()}.pdf`;
    const dataUri = doc.output('datauristring');
    const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

    // Tulis ke Directory.Cache
    await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: 'CACHE',
      recursive: true
    });

    const uriResult = await Filesystem.getUri({
      path: filename,
      directory: 'CACHE'
    });

    // Panggil Capacitor.Plugins.PdfPrint.print({ path })
    await PdfPrint.print({ path: uriResult.uri });
  } catch (err) {
    console.error('Gagal mencetak laporan via PdfPrint:', err);
    showToast('Gagal memproses cetak: ' + err.message, 'danger');
  }
}

// =============================================================================
// 12. Theme Management (Dark / Light Mode)
// =============================================================================
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  setTheme(saved);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  const metaThemeColor = document.getElementById('metaThemeColor');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0b0f17' : '#f4f6fa');
  }

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      if (theme === 'dark') {
        icon.className = 'fa-solid fa-moon';
        toggleBtn.title = 'Ubah ke Mode Terang';
      } else {
        icon.className = 'fa-solid fa-sun';
        toggleBtn.title = 'Ubah ke Mode Gelap';
      }
    }
  }

  // Re-render chart styling
  renderCharts();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

// =============================================================================
// 13. Navigasi Tab & Dialog Info
// =============================================================================
function switchTab(tabName) {
  state.activeTab = tabName;

  // Update styling tombol navigasi bawah
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Tampilkan tab yang dipilih dan sembunyikan yang lain
  const tabs = {
    beranda: document.getElementById('tabContentBeranda'),
    transaksi: document.getElementById('tabContentTransaksi'),
    anggaran: document.getElementById('tabContentAnggaran'),
    laporan: document.getElementById('tabContentLaporan')
  };

  Object.keys(tabs).forEach(key => {
    if (tabs[key]) {
      if (key === tabName) {
        tabs[key].classList.remove('hidden');
      } else {
        tabs[key].classList.add('hidden');
      }
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Refresh data khusus tab
  if (tabName === 'beranda') {
    renderKPIs();
    renderCashflowChart();
  } else if (tabName === 'transaksi') {
    renderTransactionsTable();
  } else if (tabName === 'anggaran') {
    renderCategoryProgress();
    renderCategoryChart();
  } else if (tabName === 'laporan') {
    renderCharts();
  }
}

function openInfoModal(metric) {
  const modal = document.getElementById('infoMetricModal');
  const titleEl = document.getElementById('infoMetricTitle');
  const textEl = document.getElementById('infoMetricText');
  if (!modal || !titleEl || !textEl) return;

  if (metric === 'saldo') {
    titleEl.textContent = 'Total Saldo Bersih';
    textEl.innerHTML = `
      <p style="margin-bottom: 10px;"><strong>Total Saldo Bersih</strong> adalah selisih antara seluruh pemasukan dikurangi total pengeluaran Anda pada periode aktif.</p>
      <div style="background: var(--bg-primary); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.88rem;">
        <strong>Rumus:</strong><br>
        Saldo Bersih = Total Pemasukan - Total Pengeluaran
      </div>
    `;
  } else if (metric === 'rasio') {
    titleEl.textContent = 'Rasio Tabungan (Savings Ratio)';
    textEl.innerHTML = `
      <p style="margin-bottom: 10px;"><strong>Rasio Tabungan</strong> menunjukkan persentase uang yang berhasil Anda simpan dari total pemasukan bulan ini.</p>
      <div style="background: var(--bg-primary); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.88rem; margin-bottom: 10px;">
        <strong>Rumus:</strong><br>
        Rasio = (Saldo Bersih / Total Pemasukan) × 100%
      </div>
      <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
        <strong>Panduan Finansial:</strong><br>
        • &gt; 50%: <em>Sangat baik (Target tercapai)</em><br>
        • 20% - 50%: <em>Kondisi keuangan sehat</em><br>
        • &lt; 20%: <em>Tingkatkan porsi tabungan</em>
      </p>
    `;
  } else if (metric === 'cashflow') {
    titleEl.textContent = 'Arus Kas (Cashflow)';
    textEl.innerHTML = `
      <p style="margin-bottom: 10px;"><strong>Arus Kas</strong> memvisualisasikan dinamika perbandingan uang masuk vs uang keluar selama 3 bulan berurutan.</p>
      <p style="font-size: 0.88rem; color: var(--text-secondary);">
        Batang biru menunjukkan total Pemasukan dan batang abu-abu menunjukkan total Pengeluaran.
      </p>
    `;
  }
  modal.showModal();
}

function openNotificationModal() {
  const modal = document.getElementById('notificationModal');
  if (modal) modal.showModal();
}

// =============================================================================
// 14. Sinkronisasi Seluruh Tampilan UI
// =============================================================================
function refreshUI() {
  updatePeriodDisplay();
  renderKPIs();
  renderTransactionsTable();
  renderCharts();
}

// =============================================================================
// 15. Event Listeners & Binding
// =============================================================================
function setupEventListeners() {
  // Bottom Navigation Dock
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // FAB Tambah Transaksi di Navigasi Bawah
  document.getElementById('bottomFabAddBtn')?.addEventListener('click', openAddModal);

  // Pintasan aksi dari card Beranda & Anggaran
  document.getElementById('viewDetailCashflowBtn')?.addEventListener('click', () => switchTab('transaksi'));
  document.getElementById('viewAllTxBtn')?.addEventListener('click', () => switchTab('transaksi'));
  document.getElementById('newBudgetBtn')?.addEventListener('click', () => {
    openAddModal();
    const expRadio = document.querySelector('input[name="transactionType"][value="expense"]');
    if (expRadio) {
      expRadio.checked = true;
      populateCategoryDropdown('expense');
    }
  });

  // Info Bubble Modals
  document.querySelectorAll('.info-bubble-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const metric = btn.getAttribute('data-metric');
      openInfoModal(metric);
    });
  });

  document.getElementById('closeInfoModalBtn')?.addEventListener('click', () => {
    document.getElementById('infoMetricModal')?.close();
  });

  // Notifikasi
  document.getElementById('notificationBtn')?.addEventListener('click', openNotificationModal);
  document.getElementById('closeNotificationModalBtn')?.addEventListener('click', () => {
    document.getElementById('notificationModal')?.close();
  });

  // Tombol Bagikan Ringkasan di Header
  document.getElementById('headerShareBtn')?.addEventListener('click', shareTextSummary);

  // Period Tabs
  document.querySelectorAll('.period-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-tabs .tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      state.currentPeriod = btn.getAttribute('data-period');
      refreshUI();
    });
  });

  // Date Navigations
  document.getElementById('prevPeriodBtn')?.addEventListener('click', () => {
    const anchor = state.anchorDate;
    if (state.currentPeriod === 'daily') {
      anchor.setDate(anchor.getDate() - 1);
    } else if (state.currentPeriod === 'weekly') {
      anchor.setDate(anchor.getDate() - 7);
    } else if (state.currentPeriod === 'monthly') {
      anchor.setDate(1);
      anchor.setMonth(anchor.getMonth() - 1);
    }
    refreshUI();
  });

  document.getElementById('nextPeriodBtn')?.addEventListener('click', () => {
    const anchor = state.anchorDate;
    if (state.currentPeriod === 'daily') {
      anchor.setDate(anchor.getDate() + 1);
    } else if (state.currentPeriod === 'weekly') {
      anchor.setDate(anchor.getDate() + 7);
    } else if (state.currentPeriod === 'monthly') {
      anchor.setDate(1);
      anchor.setMonth(anchor.getMonth() + 1);
    }
    refreshUI();
  });

  document.getElementById('resetPeriodBtn')?.addEventListener('click', () => {
    state.anchorDate = new Date();
    refreshUI();
  });

  // Date Pickers Change
  const dailyPicker = document.getElementById('datePickerDaily');
  dailyPicker?.addEventListener('change', e => {
    if (e.target.value) {
      state.anchorDate = new Date(e.target.value + 'T00:00:00');
      refreshUI();
    }
  });

  const monthlyPicker = document.getElementById('datePickerMonthly');
  monthlyPicker?.addEventListener('change', e => {
    if (e.target.value) {
      const [year, month] = e.target.value.split('-');
      state.anchorDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      refreshUI();
    }
  });

  // Search & Filters
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  searchInput?.addEventListener('input', e => {
    state.filters.search = e.target.value;
    if (e.target.value) {
      clearSearchBtn?.classList.remove('hidden');
    } else {
      clearSearchBtn?.classList.add('hidden');
    }
    renderTransactionsTable();
  });

  clearSearchBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    state.filters.search = '';
    clearSearchBtn?.classList.add('hidden');
    renderTransactionsTable();
  });

  document.getElementById('typeFilter')?.addEventListener('change', e => {
    state.filters.type = e.target.value;
    renderTransactionsTable();
  });

  document.getElementById('categoryFilter')?.addEventListener('change', e => {
    state.filters.category = e.target.value;
    renderTransactionsTable();
  });

  // Modals & Forms
  document.getElementById('openAddModalBtn')?.addEventListener('click', openAddModal);
  document.getElementById('fabAddBtn')?.addEventListener('click', openAddModal);
  document.getElementById('emptyAddBtn')?.addEventListener('click', openAddModal);
  document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('cancelModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('transactionForm')?.addEventListener('submit', handleFormSubmit);

  // Type Radio in Modal
  document.querySelectorAll('input[name="transactionType"]').forEach(radio => {
    radio.addEventListener('change', e => {
      populateCategoryDropdown(e.target.value);
    });
  });

  // Amount Number Formatter in Modal
  const amountInput = document.getElementById('formAmount');
  const spelledOut = document.getElementById('amountSpelledOut');
  amountInput?.addEventListener('input', e => {
    const num = parseFormattedNumber(e.target.value);
    if (num > 0) {
      e.target.value = new Intl.NumberFormat('id-ID').format(num);
      if (spelledOut) spelledOut.textContent = formatRupiah(num);
    } else {
      e.target.value = '';
      if (spelledOut) spelledOut.textContent = '';
    }
  });

  // Export & Sharing Modal Listeners
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', openExportModal);

  const quickShareBtn = document.getElementById('quickShareBtn');
  if (quickShareBtn) quickShareBtn.addEventListener('click', openExportModal);

  const closeExportModalBtn = document.getElementById('closeExportModalBtn');
  if (closeExportModalBtn) closeExportModalBtn.addEventListener('click', closeExportModal);

  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);

  const sharePdfBtn = document.getElementById('sharePdfBtn');
  if (sharePdfBtn) sharePdfBtn.addEventListener('click', sharePDFReport);

  const shareTextBtn = document.getElementById('shareTextBtn');
  if (shareTextBtn) shareTextBtn.addEventListener('click', shareTextSummary);

  const shareWhatsappBtn = document.getElementById('shareWhatsappBtn');
  if (shareWhatsappBtn) shareWhatsappBtn.addEventListener('click', shareTextSummary);

  const exportJsonBtn = document.getElementById('exportJsonBtn');
  if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportToJSON);

  const shareJsonBtn = document.getElementById('shareJsonBtn');
  if (shareJsonBtn) shareJsonBtn.addEventListener('click', shareJSONBackup);

  const importJsonBtn = document.getElementById('importJsonBtn');
  const importJsonInput = document.getElementById('importJsonInput');
  if (importJsonBtn && importJsonInput) {
    importJsonBtn.addEventListener('click', () => importJsonInput.click());
    importJsonInput.addEventListener('change', handleImportJsonFile);
  }

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCSV);

  const printReportBtn = document.getElementById('printReportBtn');
  if (printReportBtn) printReportBtn.addEventListener('click', printReport);

  // Tab Laporan Action Hub Buttons
  document.getElementById('hubExportPdfBtn')?.addEventListener('click', exportToPDF);
  document.getElementById('hubSharePdfBtn')?.addEventListener('click', sharePDFReport);
  document.getElementById('hubShareWaBtn')?.addEventListener('click', shareTextSummary);
  document.getElementById('hubExportCsvBtn')?.addEventListener('click', exportToCSV);
  document.getElementById('hubExportJsonBtn')?.addEventListener('click', exportToJSON);
  document.getElementById('hubImportJsonBtn')?.addEventListener('click', () => importJsonInput?.click());
  document.getElementById('hubPrintBtn')?.addEventListener('click', printReport);

  // Theme Toggle
  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

  // Data Demo & Clear
  const resetDemoDataBtn = document.getElementById('resetDemoDataBtn');
  if (resetDemoDataBtn) {
    resetDemoDataBtn.addEventListener('click', loadSampleData);
  }

  const emptySampleDataBtn = document.getElementById('emptySampleDataBtn');
  if (emptySampleDataBtn) {
    emptySampleDataBtn.addEventListener('click', loadSampleData);
  }

  document.getElementById('clearAllDataBtn')?.addEventListener('click', () => {
    const conf = confirm('Peringatan: Hapus semua catatan transaksi secara permanen?');
    if (conf) {
      saveTransactions([]);
      showToast('Semua data transaksi telah dihapus', 'info');
      refreshUI();
    }
  });

  // Close modals on clicking outside modal-content
  document.querySelectorAll('.app-modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.close();
      }
    });
  });

  // Tombol Kembali Android Capacitor
  setupAndroidBackButton();
}

let isBackButtonInitialized = false;

/**
 * 1. Tombol Kembali Android Capacitor
 * Hanya aktif saat isNativePlatform() true. Menutup modal yang terbuka atau keluar dari aplikasi.
 */
function setupAndroidBackButton() {
  if (!isNativePlatform() || isBackButtonInitialized) return;

  const App = window.Capacitor?.Plugins?.App;
  if (!App || typeof App.addListener !== 'function') return;

  isBackButtonInitialized = true;
  window.Capacitor.Plugins.App.addListener('backButton', () => {
    const transactionModal = document.getElementById('transactionModal');
    const exportModal = document.getElementById('exportModal');
    const iosInstallModal = document.getElementById('iosInstallModal');

    if (transactionModal && transactionModal.open) {
      closeModal();
      return;
    }
    if (exportModal && exportModal.open) {
      closeExportModal();
      return;
    }
    if (iosInstallModal && iosInstallModal.open) {
      iosInstallModal.close();
      return;
    }

    App.exitApp();
  });
}

/**
 * Sembunyikan elemen instalasi PWA saat berjalan di platform native
 */
function hidePwaInstallElements() {
  const installAppBtn = document.getElementById('installAppBtn');
  const pwaInstallBanner = document.getElementById('pwaInstallBanner');
  const iosInstallModal = document.getElementById('iosInstallModal');

  if (installAppBtn) installAppBtn.classList.add('hidden');
  if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
  if (iosInstallModal) {
    if (iosInstallModal.open) iosInstallModal.close();
    iosInstallModal.classList.add('hidden');
  }
}

// =============================================================================
// 15. Window Load Initialization
// =============================================================================
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  state.transactions = loadTransactions();
  populateCategoryDropdown('expense');
  populateFilterCategoryDropdown();
  setupEventListeners();
  refreshUI();

  // Unregister any obsolete service workers to prevent caching issues
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  }

  setupNetworkStatusListeners();

  // 3. Saat berjalan native (isNativePlatform() true), lewati setupPWAInstallation & sembunyikan elemen PWA
  if (isNativePlatform()) {
    hidePwaInstallElements();
  } else {
    setupPWAInstallation();
  }
});

// =============================================================================
// 16. PWA & Mobile Installation Engine (Android & iOS Support)
// =============================================================================
let deferredInstallPrompt = null;

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

function setupNetworkStatusListeners() {
  const offlineIndicator = document.getElementById('offlineIndicator');
  
  function updateNetworkStatus() {
    if (navigator.onLine) {
      if (offlineIndicator) offlineIndicator.classList.add('hidden');
    } else {
      if (offlineIndicator) offlineIndicator.classList.remove('hidden');
      showToast('Koneksi terputus. Mode offline aktif (data aman di perangkat).', 'info');
    }
  }

  window.addEventListener('online', () => {
    updateNetworkStatus();
    showToast('Koneksi internet terhubung kembali.', 'success');
  });
  
  window.addEventListener('offline', () => {
    updateNetworkStatus();
  });

  if (!navigator.onLine && offlineIndicator) {
    offlineIndicator.classList.remove('hidden');
  }
}

function setupPWAInstallation() {
  // Jika berjalan native, lewati seluruh setup dan pastikan elemen tersembunyi
  if (isNativePlatform()) {
    hidePwaInstallElements();
    return;
  }

  const installAppBtn = document.getElementById('installAppBtn');
  const pwaInstallBanner = document.getElementById('pwaInstallBanner');
  const bannerInstallBtn = document.getElementById('bannerInstallBtn');
  const bannerDismissBtn = document.getElementById('bannerDismissBtn');
  const iosInstallModal = document.getElementById('iosInstallModal');
  const closeIosInstallModalBtn = document.getElementById('closeIosInstallModalBtn');
  const dismissIosModalBtn = document.getElementById('dismissIosModalBtn');

  // Jangan tampilkan tombol install jika aplikasi sudah dibuka dalam mode standalone (sudah diinstall)
  if (isStandalone()) {
    console.log('[KeuanganKu PWA] Aplikasi berjalan dalam mode Standalone.');
    return;
  }

  const isBannerDismissed = sessionStorage.getItem('keuanganku_install_banner_dismissed') === 'true';

  // Android & Chromium Browser Install Trigger
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;

    if (installAppBtn) installAppBtn.classList.remove('hidden');

    if (pwaInstallBanner && !isBannerDismissed) {
      pwaInstallBanner.classList.remove('hidden');
    }
  });

  // Khusus iOS Safari (Safari tidak mendukung beforeinstallprompt)
  if (isIOS() && !isStandalone()) {
    if (installAppBtn) installAppBtn.classList.remove('hidden');
    if (pwaInstallBanner && !isBannerDismissed) {
      pwaInstallBanner.classList.remove('hidden');
    }
  }

  // Logika saat tombol install diklik (Android / iOS)
  async function handleInstallAction() {
    if (deferredInstallPrompt) {
      // Prompt bawaan Android Chrome
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('Memasang KeuanganKu ke layar utama...', 'success');
        if (installAppBtn) installAppBtn.classList.add('hidden');
        if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
      }
      deferredInstallPrompt = null;
    } else if (isIOS()) {
      // Tampilkan panduan langkah install Safari untuk iPhone / iPad
      if (iosInstallModal) {
        iosInstallModal.showModal();
      }
    } else {
      // Browser desktop fallback
      showToast('Untuk memasang di perangkat: buka menu browser lalu pilih "Install KeuanganKu".', 'info');
    }
  }

  if (installAppBtn) {
    installAppBtn.addEventListener('click', handleInstallAction);
  }

  if (bannerInstallBtn) {
    bannerInstallBtn.addEventListener('click', handleInstallAction);
  }

  if (bannerDismissBtn) {
    bannerDismissBtn.addEventListener('click', () => {
      if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
      sessionStorage.setItem('keuanganku_install_banner_dismissed', 'true');
    });
  }

  // Tutup Modal iOS
  if (closeIosInstallModalBtn) {
    closeIosInstallModalBtn.addEventListener('click', () => {
      if (iosInstallModal) iosInstallModal.close();
    });
  }

  if (dismissIosModalBtn) {
    dismissIosModalBtn.addEventListener('click', () => {
      if (iosInstallModal) iosInstallModal.close();
    });
  }

  // Event saat berhasil diinstall
  window.addEventListener('appinstalled', () => {
    showToast('Aplikasi KeuanganKu berhasil terpasang di perangkat Anda!', 'success');
    if (installAppBtn) installAppBtn.classList.add('hidden');
    if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
    deferredInstallPrompt = null;
  });
}

