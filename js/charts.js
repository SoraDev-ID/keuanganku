/**
 * KeuanganKu - Chart Visualizations
 * Modul grafik arus kas (bar chart) dan komposisi pengeluaran (doughnut chart) menggunakan Chart.js
 */

/**
 * Mendapatkan konfigurasi warna tema grafik yang adaptif terhadap dark/light mode
 * @returns {{ textColor: string, gridColor: string, tooltipBg: string, tooltipText: string }}
 */
function getChartThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor: isDark ? '#94a3b8' : '#475569',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    tooltipBg: isDark ? '#1e293b' : '#ffffff',
    tooltipText: isDark ? '#f8fafc' : '#0f172a'
  };
}

/**
 * Render ulang seluruh grafik aktif
 */
function renderCharts() {
  if (typeof Chart === 'undefined') return;
  renderCashflowChart();
  renderCategoryChart();
}

/**
 * Render grafik batang arus kas (Cashflow Bar Chart)
 */
function renderCashflowChart() {
  const canvas = document.getElementById('cashflowChart');
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');
  const theme = getChartThemeColors();

  let labels = [];
  let incomeData = [];
  let expenseData = [];

  const anchor = (typeof state !== 'undefined' && state.anchorDate) ? state.anchorDate : new Date();
  const period = (typeof state !== 'undefined' && state.currentPeriod) ? state.currentPeriod : 'monthly';

  if (period === 'daily') {
    labels = ['Pemasukan Hari Ini', 'Pengeluaran Hari Ini'];
    const currentItems = typeof getTransactionsInCurrentPeriod === 'function' ? getTransactionsInCurrentPeriod() : [];
    let inc = 0, exp = 0;
    currentItems.forEach(i => {
      if (i.type === 'income') inc += Number(i.amount) || 0;
      if (i.type === 'expense') exp += Number(i.amount) || 0;
    });
    incomeData = [inc, 0];
    expenseData = [0, exp];
  } else if (period === 'weekly') {
    const { start } = typeof getWeekRange === 'function' ? getWeekRange(anchor) : { start: anchor };
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const daysMap = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = formatDateISO(d);
      labels.push(`${dayNames[i]} (${d.getDate()})`);
      daysMap[iso] = { income: 0, expense: 0 };
    }

    const currentItems = typeof getTransactionsInCurrentPeriod === 'function' ? getTransactionsInCurrentPeriod() : [];
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
    const prevMonth = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
    const currMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const nextMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    
    const threeMonths = [prevMonth, currMonth, nextMonth];
    const txs = (typeof state !== 'undefined' && Array.isArray(state.transactions)) ? state.transactions : [];

    threeMonths.forEach(m => {
      const label = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(m);
      labels.push(label);
      
      let mInc = 0;
      let mExp = 0;
      txs.forEach(i => {
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

    const txs = (typeof state !== 'undefined' && Array.isArray(state.transactions)) ? state.transactions : [];
    txs.forEach(i => {
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

  if (typeof state !== 'undefined' && state.charts && state.charts.cashflow) {
    state.charts.cashflow.destroy();
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const barIncomeColor = '#2563eb';
  const barExpenseColor = isDark ? '#64748b' : '#cbd5e1';

  const chartInstance = new Chart(ctx, {
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
          display: false
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

  if (typeof state !== 'undefined' && state.charts) {
    state.charts.cashflow = chartInstance;
  }
}

/**
 * Render grafik donat distribusi pengeluaran per kategori (Category Doughnut Chart)
 */
function renderCategoryChart() {
  const canvas = document.getElementById('categoryChart');
  const emptyNotice = document.getElementById('noExpenseNotice');
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');
  const theme = getChartThemeColors();

  const currentItems = typeof getTransactionsInCurrentPeriod === 'function' ? getTransactionsInCurrentPeriod() : [];
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
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    if (typeof state !== 'undefined' && state.charts && state.charts.category) {
      state.charts.category.destroy();
      state.charts.category = null;
    }
    return;
  }

  canvas.style.display = 'block';
  if (emptyNotice) emptyNotice.classList.add('hidden');

  const labels = [];
  const data = [];
  const colors = [];

  catKeys.forEach(catId => {
    const info = getCategoryInfo('expense', catId);
    labels.push(info.name);
    data.push(expenseMap[catId]);
    colors.push(info.color);
  });

  if (typeof state !== 'undefined' && state.charts && state.charts.category) {
    state.charts.category.destroy();
  }

  const chartInstance = new Chart(ctx, {
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

  if (typeof state !== 'undefined' && state.charts) {
    state.charts.category = chartInstance;
  }
}
