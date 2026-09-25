/**
 * KeuanganKu - UI Component Renderers & Modal Handlers
 * Modul render antarmuka pengguna: KPI ringkasan, daftar transaksi (desktop & mobile),
 * progress anggaran per kategori, notifikasi toast, dialog modal, dan pengingat cadangan
 */

/**
 * Menampilkan pesan toast melayang di pojok layar
 * @param {string} message
 * @param {'info'|'success'|'danger'|'warning'} [type='info']
 * @param {number} [duration=3500]
 */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-card toast-${type}`;

  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'danger') icon = 'fa-circle-exclamation';
  if (type === 'warning') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Berpindah tab utama aplikasi ('beranda', 'transaksi', 'anggaran', 'laporan')
 * @param {string} tabName
 */
function switchTab(tabName) {
  if (typeof state !== 'undefined') {
    state.activeTab = tabName;
  }

  // Update styling tombol navigasi bawah
  document.querySelectorAll('.nav-tab-btn').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

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

  if (tabName === 'beranda') {
    renderKPIs();
    if (typeof renderCashflowChart === 'function') renderCashflowChart();
  } else if (tabName === 'transaksi') {
    renderTransactionsTable();
  } else if (tabName === 'anggaran') {
    renderCategoryProgress();
    if (typeof renderCategoryChart === 'function') renderCategoryChart();
  } else if (tabName === 'laporan') {
    if (typeof renderCharts === 'function') renderCharts();
  }
}

/**
 * Memperbarui tampilan label periode dan kontrol tanggal
 */
function updatePeriodDisplay() {
  const periodLabel = document.getElementById('periodLabel');
  const prevBtn = document.getElementById('prevPeriodBtn');
  const nextBtn = document.getElementById('nextPeriodBtn');
  const resetBtn = document.getElementById('resetPeriodBtn');
  const dailyPicker = document.getElementById('datePickerDaily');
  const monthlyPicker = document.getElementById('datePickerMonthly');

  if (!periodLabel || typeof state === 'undefined') return;
  const anchor = state.anchorDate || new Date();

  if (state.currentPeriod === 'all') {
    periodLabel.textContent = 'Semua Riwayat Transaksi';
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (resetBtn) resetBtn.classList.add('hidden');
    if (dailyPicker) dailyPicker.classList.add('hidden');
    if (monthlyPicker) monthlyPicker.classList.add('hidden');
  } else if (state.currentPeriod === 'daily') {
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
    if (resetBtn) resetBtn.classList.remove('hidden');
    if (dailyPicker) {
      dailyPicker.classList.remove('hidden');
      dailyPicker.value = formatDateISO(anchor);
    }
    if (monthlyPicker) monthlyPicker.classList.add('hidden');

    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(anchor);
    periodLabel.textContent = `Harian: ${dateFormatted}`;
  } else if (state.currentPeriod === 'weekly') {
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
    if (resetBtn) resetBtn.classList.remove('hidden');
    if (dailyPicker) dailyPicker.classList.add('hidden');
    if (monthlyPicker) monthlyPicker.classList.add('hidden');

    const { start, end } = typeof getWeekRange === 'function' ? getWeekRange(anchor) : { start: anchor, end: anchor };
    const startText = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(start);
    const endText = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(end);
    periodLabel.textContent = `Mingguan: ${startText} - ${endText}`;
  } else if (state.currentPeriod === 'monthly') {
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
    if (resetBtn) resetBtn.classList.remove('hidden');
    if (dailyPicker) dailyPicker.classList.add('hidden');
    if (monthlyPicker) {
      monthlyPicker.classList.remove('hidden');
      monthlyPicker.value = formatMonthISO(anchor);
    }

    const monthText = new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric'
    }).format(anchor);
    periodLabel.textContent = `Bulanan: ${monthText}`;
  }
}

/**
 * Menghitung dan merender seluruh metrik keuangan KPI di halaman Beranda
 */
function renderKPIs() {
  const currentItems = typeof getTransactionsInCurrentPeriod === 'function' ? getTransactionsInCurrentPeriod() : [];

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

  const anchor = (typeof state !== 'undefined' && state.anchorDate) ? state.anchorDate : new Date();
  const txs = (typeof state !== 'undefined' && Array.isArray(state.transactions)) ? state.transactions : [];

  // Hitung pertumbuhan Saldo Bersih dibanding bulan sebelumnya
  const prevMonthDate = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
  let prevIncome = 0;
  let prevExpense = 0;

  txs.forEach(item => {
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
  const activeMonthStr = new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: 'numeric'
  }).format(anchor);

  // Update DOM Elements
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

  // Donut SVG circumference (r = 38 => 2 * PI * 38 = 238.76)
  if (savingsDonutCircle) {
    const circumference = 238.76;
    const clamped = Math.min(Math.max(savingsRate, 0), 100);
    const offset = circumference - (circumference * clamped / 100);
    savingsDonutCircle.style.strokeDashoffset = offset;
  }

  // Update Status Rasio Tabungan
  if (savingsStatusBadge) {
    if (incomeTotal === 0 && expenseTotal === 0) {
      savingsStatusBadge.className = 'savings-status-badge';
      savingsStatusBadge.innerHTML = '<i class="fa-solid fa-chart-line"></i> <span id="savingsStatusText">Belum ada data</span>';
    } else if (savingsRate >= 70) {
      savingsStatusBadge.className = 'savings-status-badge status-excellent';
      savingsStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span id="savingsStatusText">Sangat baik!</span>';
    } else if (savingsRate >= 40) {
      savingsStatusBadge.className = 'savings-status-badge status-good';
      savingsStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span id="savingsStatusText">Baik</span>';
    } else if (savingsRate >= 20) {
      savingsStatusBadge.className = 'savings-status-badge status-fair';
      savingsStatusBadge.innerHTML = '<i class="fa-solid fa-circle-info"></i> <span id="savingsStatusText">Cukup</span>';
    } else {
      savingsStatusBadge.className = 'savings-status-badge status-warning';
      savingsStatusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span id="savingsStatusText">Perlu ditingkatkan</span>';
    }
  }

  // Update Trend Saldo (MoM)
  if (balanceTrendPill) {
    if (prevNet > 0) {
      const growth = ((netBalance - prevNet) / prevNet) * 100;
      const formattedGrowth = Math.abs(growth).toFixed(1).replace('.', ',');
      if (growth >= 0) {
        balanceTrendPill.className = 'trend-pill trend-up';
        balanceTrendPill.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> <span id="balanceTrendText">Naik ${formattedGrowth}% dari bulan lalu</span>`;
      } else {
        balanceTrendPill.className = 'trend-pill trend-down';
        balanceTrendPill.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> <span id="balanceTrendText">Turun ${formattedGrowth}% dari bulan lalu</span>`;
      }
    } else {
      balanceTrendPill.className = 'trend-pill';
      balanceTrendPill.innerHTML = `<i class="fa-solid fa-chart-line"></i> <span id="balanceTrendText">Data bulan lalu belum tersedia</span>`;
    }
  }

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

  renderRecentTransactions();
  renderCategoryProgress();
  checkBackupReminder();
}

/**
 * Render 5 transaksi terbaru pada card di Tab Beranda
 */
function renderRecentTransactions() {
  const container = document.getElementById('recentTxList');
  if (!container) return;

  const currentItems = (typeof getFilteredTransactions === 'function' ? getFilteredTransactions() : []).slice(0, 5);
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
      <div class="recent-tx-item" data-id="${escapeHtml(item.id)}" onclick="openEditModal('${escapeHtml(item.id)}')" style="cursor: pointer;" title="Klik untuk edit transaksi">
        <div class="recent-tx-icon-wrap" style="background: ${cat.color}14; color: ${cat.color};">
          <i class="fa-solid ${cat.icon}"></i>
        </div>
        <div class="recent-tx-details">
          <div class="recent-tx-title">${escapeHtml(item.title)}</div>
          <div class="recent-tx-subtitle">${escapeHtml(cat.name)} • ${formatDateIndo(item.date)}</div>
        </div>
        <div class="recent-tx-amount ${amountClass}">
          ${amountPrefix}${formatRupiah(item.amount)}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render tabel transaksi desktop & mobile card list lengkap dengan proteksi XSS
 */
function renderTransactionsTable() {
  const items = typeof getFilteredTransactions === 'function' ? getFilteredTransactions() : [];
  const tbody = document.getElementById('transactionsTableBody');
  const mobileList = document.getElementById('mobileTransactionsList');
  const emptyState = document.getElementById('emptyState');
  const countPill = document.getElementById('filteredCountPill');

  if (countPill) countPill.textContent = items.length;

  if (items.length === 0) {
    if (tbody) tbody.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // 1. Render Desktop / Tablet Table
  if (tbody) {
    tbody.innerHTML = items.map(item => {
      const cat = getCategoryInfo(item.type, item.category);
      const isIncome = item.type === 'income';
      const amountClass = isIncome ? 'text-income' : 'text-expense';
      const amountPrefix = isIncome ? '+ ' : '- ';
      const typeLabel = isIncome ? 'Pemasukan' : 'Pengeluaran';
      const typeClass = isIncome ? 'type-income' : 'type-expense';

      return `
        <tr data-id="${escapeHtml(item.id)}">
          <td>
            <div class="transaction-datetime">
              <span class="transaction-date">${formatDateIndo(item.date)}</span>
              <span class="transaction-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(item.time || '00:00')}</span>
            </div>
          </td>
          <td>
            <span class="cat-badge" style="border-color: ${cat.color}33;">
              <i class="fa-solid ${cat.icon}" style="color: ${cat.color};"></i>
              ${escapeHtml(cat.name)}
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
              <button class="action-btn edit-btn" onclick="openEditModal('${escapeHtml(item.id)}')" title="Edit Transaksi" aria-label="Edit Transaksi">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button class="action-btn delete-btn" onclick="confirmDelete('${escapeHtml(item.id)}')" title="Hapus Transaksi" aria-label="Hapus Transaksi">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Render Mobile Card List (< 640px)
  if (mobileList) {
    mobileList.innerHTML = items.map(item => {
      const cat = getCategoryInfo(item.type, item.category);
      const isIncome = item.type === 'income';
      const amountClass = isIncome ? 'amount-income' : 'amount-expense';
      const amountPrefix = isIncome ? '+ ' : '- ';

      return `
        <div class="mobile-tx-card" data-id="${escapeHtml(item.id)}">
          <div class="mobile-tx-left">
            <div class="mobile-tx-icon-wrap" style="background: ${cat.color}1f; color: ${cat.color};">
              <i class="fa-solid ${cat.icon}"></i>
            </div>
            <div class="mobile-tx-details">
              <div class="mobile-tx-title">${escapeHtml(item.title)}</div>
              ${item.notes ? `<div class="mobile-tx-notes">${escapeHtml(item.notes)}</div>` : ''}
              <div class="mobile-tx-meta">
                <span class="mobile-tx-cat-badge">${escapeHtml(cat.name)}</span>
                <span>•</span>
                <span>${formatDateIndo(item.date)}</span>
                ${item.time ? `<span>• ${escapeHtml(item.time)}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="mobile-tx-right">
            <div class="mobile-tx-amount ${amountClass}">
              ${amountPrefix}${formatRupiah(item.amount)}
            </div>
            <div class="mobile-tx-actions">
              <button class="action-btn edit-btn" onclick="openEditModal('${escapeHtml(item.id)}')" title="Edit Transaksi" aria-label="Edit Transaksi">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button class="action-btn delete-btn" onclick="confirmDelete('${escapeHtml(item.id)}')" title="Hapus Transaksi" aria-label="Hapus Transaksi">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

/**
 * Render progress bar kategori pengeluaran pada Tab Anggaran
 * Dilengkapi fitur perbandingan batas anggaran bulanan (Budget MVP)
 */
function renderCategoryProgress() {
  const container = document.getElementById('categoryProgressList');
  if (!container) return;

  const currentItems = typeof getTransactionsInCurrentPeriod === 'function' ? getTransactionsInCurrentPeriod() : [];
  const budgets = typeof loadBudgets === 'function' ? loadBudgets() : {};
  const expenseMap = {};
  let totalExp = 0;

  currentItems.forEach(i => {
    if (i.type === 'expense') {
      const amt = Number(i.amount) || 0;
      expenseMap[i.category] = (expenseMap[i.category] || 0) + amt;
      totalExp += amt;
    }
  });

  // Gabungkan kategori yang punya transaksi atau yang telah diatur anggarannya
  const categoryKeys = new Set([...Object.keys(expenseMap), ...Object.keys(budgets)]);
  const catList = Array.from(categoryKeys).filter(catId => {
    const amt = expenseMap[catId] || 0;
    const bgt = budgets[catId] || 0;
    return amt > 0 || bgt > 0;
  });

  if (catList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 28px 12px; color: var(--text-tertiary); font-size: 0.88rem;">
        <i class="fa-solid fa-wallet" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.4;"></i>
        <p>Belum ada pengeluaran atau anggaran yang diatur pada periode ini.</p>
        <button class="btn btn-sm btn-outline" onclick="openBudgetModal()" style="margin-top: 10px;">
          <i class="fa-solid fa-sliders"></i> Atur Anggaran Bulanan
        </button>
      </div>
    `;
    return;
  }

  // Urutkan berdasarkan nominal pengeluaran terbesar
  catList.sort((a, b) => (expenseMap[b] || 0) - (expenseMap[a] || 0));

  container.innerHTML = catList.map(catId => {
    const info = getCategoryInfo('expense', catId);
    const amt = expenseMap[catId] || 0;
    const budget = budgets[catId] || 0;

    let progressHtml = '';
    let statusText = '';
    let barColor = info.color;
    let barWidth = 0;

    if (budget > 0) {
      const pct = Math.round((amt / budget) * 100);
      barWidth = Math.min(pct, 100);

      if (pct > 100) {
        barColor = '#ef4444';
        statusText = `<span style="color: #ef4444; font-weight: 600;">Melebihi Anggaran (${pct}%)</span>`;
      } else if (pct >= 80) {
        barColor = '#f59e0b';
        statusText = `<span style="color: #f59e0b; font-weight: 600;">Mendekati Batas (${pct}%)</span>`;
      } else {
        statusText = `<span>${pct}% terpakai</span>`;
      }

      progressHtml = `
        <div class="cat-progress-item">
          <div class="cat-progress-header">
            <span class="cat-progress-label">
              <i class="fa-solid ${info.icon}" style="color: ${info.color};"></i>
              ${escapeHtml(info.name)}
            </span>
            <span class="cat-progress-val">
              <strong>${formatRupiah(amt)}</strong> <small style="color: var(--text-tertiary);">/ ${formatRupiah(budget)}</small>
            </span>
          </div>
          <div class="cat-progress-bar">
            <div class="cat-progress-fill" style="width: ${barWidth}%; background: ${barColor};"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-tertiary); margin-top: 4px;">
            <span>${statusText}</span>
            <span>Sisa: ${formatRupiah(Math.max(budget - amt, 0))}</span>
          </div>
        </div>
      `;
    } else {
      const pct = totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0;
      barWidth = pct;

      progressHtml = `
        <div class="cat-progress-item">
          <div class="cat-progress-header">
            <span class="cat-progress-label">
              <i class="fa-solid ${info.icon}" style="color: ${info.color};"></i>
              ${escapeHtml(info.name)}
            </span>
            <span class="cat-progress-val">${formatRupiah(amt)} (${pct}%)</span>
          </div>
          <div class="cat-progress-bar">
            <div class="cat-progress-fill" style="width: ${barWidth}%; background: ${info.color};"></div>
          </div>
          <div style="font-size: 0.74rem; color: var(--text-tertiary); margin-top: 3px;">
            <a href="javascript:void(0)" onclick="openBudgetModal()" style="color: var(--color-primary); text-decoration: none;">+ Atur batas anggaran</a>
          </div>
        </div>
      `;
    }

    return progressHtml;
  }).join('');
}

/**
 * Pengecekan otomatis pengingat cadangan data (Backup Reminder)
 * Muncul jika sudah ada transaksi dan belum pernah backup atau > 30 hari
 */
function checkBackupReminder() {
  const banner = document.getElementById('backupReminderBanner');
  if (!banner) return;

  const txs = (typeof state !== 'undefined' && Array.isArray(state.transactions)) ? state.transactions : [];
  if (txs.length === 0) {
    banner.classList.add('hidden');
    return;
  }

  if (typeof isBackupDismissed === 'function' && isBackupDismissed()) {
    banner.classList.add('hidden');
    return;
  }

  const lastBackup = typeof getLastBackupTimestamp === 'function' ? getLastBackupTimestamp() : null;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  if (!lastBackup || (Date.now() - lastBackup) > thirtyDaysMs) {
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

/**
 * Menutup pengingat backup dan menyembunyikannya selama 7 hari
 */
function dismissBackupReminderBanner() {
  if (typeof dismissBackupReminder === 'function') {
    dismissBackupReminder(7);
  }
  const banner = document.getElementById('backupReminderBanner');
  if (banner) banner.classList.add('hidden');
  showToast('Pengingat cadangan disembunyikan selama 7 hari.', 'info');
}

/**
 * Mengisi dropdown pilihan kategori pada form transaksi
 */
function populateCategoryDropdown(type, selectedCategory = '') {
  const select = document.getElementById('formCategory');
  if (!select) return;
  const categories = CATEGORIES[type] || [];

  select.innerHTML = categories.map(cat => {
    const isSelected = cat.id === selectedCategory ? 'selected' : '';
    return `<option value="${escapeHtml(cat.id)}" ${isSelected}>${escapeHtml(cat.name)}</option>`;
  }).join('');
}

/**
 * Mengisi dropdown pilihan kategori pada bar filter transaksi
 */
function populateFilterCategoryDropdown() {
  const select = document.getElementById('categoryFilter');
  if (!select) return;

  const allCategories = [
    ...CATEGORIES.expense,
    ...CATEGORIES.income
  ];

  const uniqueCats = [];
  const seen = new Set();
  allCategories.forEach(c => {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      uniqueCats.push(c);
    }
  });

  select.innerHTML = '<option value="all">Semua Kategori</option>' +
    uniqueCats.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
}

/**
 * Membuka dialog modal tambah transaksi baru
 */
function openAddModal() {
  if (typeof state !== 'undefined') state.editingId = null;
  const modal = document.getElementById('transactionModal');
  const form = document.getElementById('transactionForm');
  const title = document.getElementById('modalTitle');
  const idInput = document.getElementById('transactionId');

  if (title) title.textContent = 'Tambah Transaksi Baru';
  if (idInput) idInput.value = '';
  if (form) form.reset();

  const expenseRadio = document.querySelector('input[name="transactionType"][value="expense"]');
  if (expenseRadio) expenseRadio.checked = true;

  populateCategoryDropdown('expense');

  const now = new Date();
  const dateInput = document.getElementById('formDate');
  const timeInput = document.getElementById('formTime');
  const amountInput = document.getElementById('formAmount');
  const spelledOut = document.getElementById('amountSpelledOut');

  if (dateInput) dateInput.value = formatDateISO(now);
  if (timeInput) timeInput.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  if (amountInput) amountInput.value = '';
  if (spelledOut) spelledOut.textContent = '';

  if (modal && typeof modal.showModal === 'function') modal.showModal();
}

/**
 * Membuka dialog modal edit transaksi yang sudah ada
 * @param {string} id
 */
function openEditModal(id) {
  if (typeof state === 'undefined') return;
  const item = state.transactions.find(t => t.id === id);
  if (!item) return;

  state.editingId = id;
  const modal = document.getElementById('transactionModal');
  const title = document.getElementById('modalTitle');
  const idInput = document.getElementById('transactionId');

  if (title) title.textContent = 'Edit Transaksi';
  if (idInput) idInput.value = item.id;

  const radio = document.querySelector(`input[name="transactionType"][value="${item.type}"]`);
  if (radio) radio.checked = true;

  populateCategoryDropdown(item.type, item.category);

  const dateInput = document.getElementById('formDate');
  const timeInput = document.getElementById('formTime');
  const amountInput = document.getElementById('formAmount');
  const spelledOut = document.getElementById('amountSpelledOut');
  const titleInput = document.getElementById('formTitle');
  const notesInput = document.getElementById('formNotes');

  if (dateInput) dateInput.value = item.date;
  if (timeInput) timeInput.value = item.time || '12:00';
  if (amountInput) amountInput.value = new Intl.NumberFormat('id-ID').format(item.amount);
  if (spelledOut) spelledOut.textContent = formatRupiah(item.amount);
  if (titleInput) titleInput.value = item.title;
  if (notesInput) notesInput.value = item.notes || '';

  if (modal && typeof modal.showModal === 'function') modal.showModal();
}

/**
 * Menutup dialog modal tambah/edit transaksi
 */
function closeModal() {
  const modal = document.getElementById('transactionModal');
  if (modal && modal.open) modal.close();
  if (typeof state !== 'undefined') state.editingId = null;
}

/**
 * Membuka modal opsi ekspor dan cadangan
 */
function openExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal && typeof modal.showModal === 'function') modal.showModal();
}

/**
 * Menutup modal opsi ekspor dan cadangan
 */
function closeExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal && modal.open) modal.close();
}

/**
 * Membuka modal informasi metrik keuangan
 * @param {'saldo'|'rasio'|'cashflow'} metric
 */
function openInfoModal(metric) {
  const modal = document.getElementById('infoMetricModal');
  const titleEl = document.getElementById('infoMetricTitle');
  const textEl = document.getElementById('infoMetricText');
  if (!modal || !titleEl || !textEl) return;

  if (metric === 'saldo') {
    titleEl.textContent = 'Total Saldo Bersih';
    textEl.innerHTML = `
      <p style="margin-bottom: 10px;"><strong>Total Saldo Bersih</strong> adalah selisih antara seluruh pemasukan dikurangi total pengeluaran Anda pada periode aktif.</p>
      <div style="background: var(--bg-surface-elevated, #f1f5f9); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.88rem;">
        <strong>Rumus:</strong><br>
        Saldo Bersih = Total Pemasukan - Total Pengeluaran
      </div>
    `;
  } else if (metric === 'rasio') {
    titleEl.textContent = 'Rasio Tabungan (Savings Ratio)';
    textEl.innerHTML = `
      <p style="margin-bottom: 10px;"><strong>Rasio Tabungan</strong> menunjukkan persentase uang yang berhasil Anda simpan dari total pemasukan bulan ini.</p>
      <div style="background: var(--bg-surface-elevated, #f1f5f9); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.88rem; margin-bottom: 10px;">
        <strong>Rumus:</strong><br>
        Rasio = (Saldo Bersih / Total Pemasukan) × 100%
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
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
      <p style="font-size: 0.88rem; color: var(--text-muted);">
        Batang biru menunjukkan total Pemasukan dan batang abu-abu menunjukkan total Pengeluaran.
      </p>
    `;
  }
  modal.showModal();
}

function openNotificationModal() {
  const modal = document.getElementById('notificationModal');
  if (modal && typeof modal.showModal === 'function') modal.showModal();
}

/**
 * Membuka dialog pengaturan batas anggaran bulanan (Budget MVP)
 */
function openBudgetModal() {
  const modal = document.getElementById('budgetModal');
  const container = document.getElementById('budgetInputsContainer');
  if (!modal || !container) return;

  const budgets = typeof loadBudgets === 'function' ? loadBudgets() : {};

  container.innerHTML = CATEGORIES.expense.map(cat => {
    const val = budgets[cat.id] || '';
    const formattedVal = val ? new Intl.NumberFormat('id-ID').format(val) : '';

    return `
      <div class="budget-input-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
        <label for="budget_${cat.id}" style="display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: 500;">
          <i class="fa-solid ${cat.icon}" style="color: ${cat.color}; width: 20px; text-align: center;"></i>
          ${escapeHtml(cat.name)}
        </label>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 0.85rem; color: var(--text-muted);">Rp</span>
          <input type="text" id="budget_${cat.id}" data-category="${cat.id}" class="form-input budget-num-input" placeholder="0" value="${formattedVal}" style="width: 140px; text-align: right; padding: 6px 10px;">
        </div>
      </div>
    `;
  }).join('');

  // Format ribuan otomatis saat mengetik nominal anggaran
  container.querySelectorAll('.budget-num-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const num = parseFormattedNumber(e.target.value);
      e.target.value = num > 0 ? new Intl.NumberFormat('id-ID').format(num) : '';
    });
  });

  modal.showModal();
}

/**
 * Menutup dialog pengaturan batas anggaran bulanan
 */
function closeBudgetModal() {
  const modal = document.getElementById('budgetModal');
  if (modal && modal.open) modal.close();
}

/**
 * Menyimpan data batas anggaran bulanan dari form modal
 * @param {Event} e
 */
function handleSaveBudgets(e) {
  if (e) e.preventDefault();
  const container = document.getElementById('budgetInputsContainer');
  if (!container) return;

  const newBudgets = {};
  container.querySelectorAll('.budget-num-input').forEach(input => {
    const catId = input.getAttribute('data-category');
    const val = parseFormattedNumber(input.value);
    if (catId && val > 0) {
      newBudgets[catId] = val;
    }
  });

  if (typeof saveBudgets === 'function') {
    saveBudgets(newBudgets);
  }

  closeBudgetModal();
  renderCategoryProgress();
  showToast('Batas anggaran bulanan berhasil disimpan!', 'success');
}

/**
 * Sinkronisasi penyegaran seluruh komponen tampilan aplikasi
 */
function refreshUI() {
  updatePeriodDisplay();
  renderKPIs();
  renderTransactionsTable();
  if (typeof renderCharts === 'function') renderCharts();
}
