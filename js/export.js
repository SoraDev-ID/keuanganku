/**
 * KeuanganKu - Export, Sharing & Backup Operations
 * Modul pembuatan PDF, CSV, backup/restore JSON, integrasi Web Share API,
 * Capacitor Filesystem, Share Plugin, dan Plugin Cetak PdfPrint Android
 */

/**
 * Deteksi apakah aplikasi berjalan di platform native Capacitor (Android)
 * @returns {boolean}
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

/**
 * Konversi string base64 menjadi Blob biner
 * @param {string} base64
 * @param {string} [mimeType]
 * @returns {Blob}
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
 * @param {Blob} blob
 * @param {string} filename
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
 * Memeriksa dan meminta izin penyimpanan (khususnya untuk Android lawas <= 9)
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
      if (typeof showToast === 'function') showToast(`Berkas ${filename} berhasil diunduh!`, 'success');
      return { success: true, method: 'browser-download' };
    } catch (err) {
      console.error('Gagal mengunduh berkas di browser:', err);
      if (typeof showToast === 'function') showToast('Gagal mengunduh berkas: ' + err.message, 'danger');
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
    if (typeof showToast === 'function') showToast(`Berkas ${filename} berhasil diunduh!`, 'success');
    return { success: true, method: 'browser-fallback' };
  }

  let fileData = data;
  if (isBase64 && typeof data === 'string' && data.includes(',')) {
    fileData = data.split(',')[1];
  }

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

    if (typeof showToast === 'function') showToast(`Tersimpan di Dokumen/KeuanganKu/${filename}`, 'success');
    return { success: true, method: 'documents', path: relativeDocPath };
  } catch (err) {
    console.warn(`Gagal menyimpan ke Documents/KeuanganKu/${filename} (${err.message}). Menjalankan fallback ke Cache & Share Sheet.`);

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
        if (typeof showToast === 'function') showToast('Penyimpanan publik dibatasi sistem. Membuka lembar berbagi berkas...', 'info');
        await Share.share({
          title: options.title || filename,
          text: options.text || '',
          dialogTitle: options.dialogTitle || 'Simpan / Bagikan Berkas',
          files: [cacheResult.uri]
        });
        return { success: true, method: 'cache-share', uri: cacheResult.uri };
      } else {
        if (typeof showToast === 'function') showToast(`Tersimpan di cache perangkat: ${filename}`, 'info');
        return { success: true, method: 'cache-only', uri: cacheResult.uri };
      }
    } catch (fallbackErr) {
      console.error('Fallback penyimpanan gagal:', fallbackErr);
      if (typeof showToast === 'function') showToast('Gagal menyimpan berkas: ' + fallbackErr.message, 'danger');
      return { success: false, error: fallbackErr };
    }
  }
}

/**
 * Helper terpusat untuk membagikan berkas via Share Sheet
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
        if (typeof showToast === 'function') showToast('Berkas berhasil dibagikan!', 'success');
        return { success: true, method: 'web-share' };
      } else if (navigator.share && options.text) {
        await navigator.share({
          title: options.title || 'KeuanganKu',
          text: options.text
        });
        if (typeof showToast === 'function') showToast('Ringkasan teks berhasil dibagikan!', 'success');
        return { success: true, method: 'web-share-text' };
      } else {
        downloadBlobInBrowser(blob, filename);
        if (typeof showToast === 'function') showToast(`Fitur berbagi tidak didukung peramban. Berkas diunduh sebagai ${filename}`, 'info');
        return { success: true, method: 'browser-download' };
      }
    } catch (err) {
      if (err.name === 'AbortError') return { cancelled: true };
      console.error('Gagal membagikan di browser:', err);
      if (typeof showToast === 'function') showToast('Gagal membagikan berkas: ' + err.message, 'danger');
      return { success: false, error: err };
    }
  }

  // 2. Native Capacitor
  const Filesystem = getFilesystemPlugin();
  const Share = getSharePlugin();

  if (!Filesystem || !Share) {
    if (typeof showToast === 'function') showToast('Plugin penyimpanan / berbagi tidak tersedia', 'danger');
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
    if (typeof showToast === 'function') showToast('Gagal membagikan: ' + err.message, 'danger');
    return { success: false, error: err };
  }
}

/**
 * Membuat dokumen PDF profesional dengan ringkasan metrik & tabel transaksi
 */
function generatePDFDocument() {
  const items = typeof getFilteredTransactions === 'function' ? getFilteredTransactions() : [];
  if (items.length === 0) {
    if (typeof showToast === 'function') showToast('Tidak ada transaksi untuk dicetak ke PDF', 'danger');
    return null;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    if (typeof showToast === 'function') showToast('Pustaka pembuat PDF belum termuat di peramban', 'danger');
    return null;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

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
  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setFillColor(99, 102, 241);
  doc.rect(0, 38, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('KeuanganKu', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254);
  doc.text('Laporan Catatan Arus Kas, Pemasukan & Pengeluaran', 14, 23);
  doc.text(`Periode: ${periodText}`, 14, 29);

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
      fillColor: [79, 70, 229],
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
    if (typeof showToast === 'function') showToast('Gagal memuat plugin tabel PDF', 'danger');
    return null;
  }

  return doc;
}

/**
 * Unduh Laporan PDF ke Dokumen/KeuanganKu/ (atau peramban)
 */
async function exportToPDF() {
  try {
    const doc = generatePDFDocument();
    if (!doc) return;

    if (typeof showToast === 'function') showToast('Menyiapkan dokumen PDF...', 'info');
    const filename = `KeuanganKu_Laporan_${formatDateISO(new Date())}.pdf`;

    const dataUri = doc.output('datauristring');
    const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

    await saveFile(filename, base64Data, 'application/pdf', {
      base64: true,
      title: 'Laporan Keuangan KeuanganKu',
      dialogTitle: 'Simpan / Bagikan Laporan PDF'
    });

    if (typeof closeExportModal === 'function') closeExportModal();
  } catch (err) {
    console.error('Gagal membuat PDF:', err);
    if (typeof showToast === 'function') showToast('Gagal membuat PDF: ' + err.message, 'danger');
  }
}

/**
 * Bagikan Laporan PDF ke aplikasi lain (WhatsApp, Drive, dll)
 */
async function sharePDFReport() {
  const items = typeof getFilteredTransactions === 'function' ? getFilteredTransactions() : [];
  if (items.length === 0) {
    if (typeof showToast === 'function') showToast('Tidak ada data transaksi untuk dibagikan', 'danger');
    return;
  }

  try {
    if (typeof showToast === 'function') showToast('Menyiapkan berkas PDF...', 'info');
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

    if (typeof closeExportModal === 'function') closeExportModal();
  } catch (err) {
    console.error('Gagal membagikan PDF:', err);
    if (typeof showToast === 'function') showToast('Gagal membagikan PDF: ' + err.message, 'danger');
  }
}

/**
 * Buat string ringkasan teks untuk dibagikan
 * @returns {string}
 */
function generateTextSummary() {
  const items = typeof getFilteredTransactions === 'function' ? getFilteredTransactions() : [];
  let incomeTotal = 0;
  let expenseTotal = 0;
  items.forEach(i => {
    if (i.type === 'income') incomeTotal += (Number(i.amount) || 0);
    if (i.type === 'expense') expenseTotal += (Number(i.amount) || 0);
  });
  const net = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? Math.round((net / incomeTotal) * 100) : 0;
  const periodLabel = document.getElementById('periodLabel')?.textContent || 'Periode Berjalan';

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
 * Bagikan Ringkasan Teks ke WhatsApp atau aplikasi chat lainnya
 */
async function shareTextSummary() {
  const items = typeof getFilteredTransactions === 'function' ? getFilteredTransactions() : [];
  if (items.length === 0) {
    if (typeof showToast === 'function') showToast('Tidak ada data transaksi untuk dibagikan', 'danger');
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

    if (typeof closeExportModal === 'function') closeExportModal();
  } catch (err) {
    console.error('Gagal membagikan ringkasan teks:', err);
    if (typeof showToast === 'function') showToast('Gagal membagikan ringkasan: ' + err.message, 'danger');
  }
}

/**
 * Format CSV: simpan lewat helper (utf8, tambahkan BOM \uFEFF agar terbuka benar di Excel)
 */
async function exportToCSV() {
  const txs = (typeof state !== 'undefined' && Array.isArray(state.transactions)) ? state.transactions : [];
  if (txs.length === 0) {
    if (typeof showToast === 'function') showToast('Tidak ada data untuk diekspor', 'danger');
    return;
  }

  try {
    const headers = ['ID', 'Tanggal', 'Waktu', 'Tipe', 'Kategori', 'Keterangan', 'Nominal (Rp)', 'Catatan'];
    const rows = txs.map(item => {
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

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const filename = `KeuanganKu_${formatDateISO(new Date())}.csv`;

    await saveFile(filename, csvContent, 'text/csv;charset=utf-8;', {
      base64: false,
      title: 'Data Transaksi KeuanganKu',
      dialogTitle: 'Simpan / Bagikan Berkas CSV'
    });

    if (typeof closeExportModal === 'function') closeExportModal();
  } catch (err) {
    console.error('Gagal mengekspor CSV:', err);
    if (typeof showToast === 'function') showToast('Gagal mengekspor CSV: ' + err.message, 'danger');
  }
}

/**
 * Payload JSON data transaksi aplikasi
 * @returns {string}
 */
function getBackupJSONPayload() {
  const txs = (typeof state !== 'undefined' && Array.isArray(state.transactions)) ? state.transactions : [];
  return JSON.stringify({
    app: 'KeuanganKu',
    version: '1.0.3',
    exportDate: new Date().toISOString(),
    totalTransactions: txs.length,
    transactions: txs
  }, null, 2);
}

/**
 * Cadangkan Data (.json): simpan lewat helper dan catat timestamp backup
 */
async function exportToJSON() {
  const txs = (typeof state !== 'undefined' && Array.isArray(state.transactions)) ? state.transactions : [];
  if (txs.length === 0) {
    if (typeof showToast === 'function') showToast('Tidak ada data transaksi untuk diekspor', 'danger');
    return;
  }

  try {
    const jsonStr = getBackupJSONPayload();
    const filename = `KeuanganKu_Backup_${formatDateISO(new Date())}.json`;

    const res = await saveFile(filename, jsonStr, 'application/json;charset=utf-8', {
      base64: false,
      title: 'Cadangan Data KeuanganKu',
      dialogTitle: 'Simpan Cadangan JSON'
    });

    if (res && res.success) {
      setLastBackupTimestamp(Date.now());
      if (typeof checkBackupReminder === 'function') checkBackupReminder();
    }

    if (typeof closeExportModal === 'function') closeExportModal();
  } catch (err) {
    console.error('Gagal mencadangkan data JSON:', err);
    if (typeof showToast === 'function') showToast('Gagal mencadangkan data: ' + err.message, 'danger');
  }
}

/**
 * Simpan ke Google Drive / bagikan cadangan data (.json)
 */
async function shareJSONBackup() {
  const txs = (typeof state !== 'undefined' && Array.isArray(state.transactions)) ? state.transactions : [];
  if (txs.length === 0) {
    if (typeof showToast === 'function') showToast('Tidak ada data transaksi untuk dicadangkan', 'danger');
    return;
  }

  try {
    const jsonStr = getBackupJSONPayload();
    const filename = `KeuanganKu_Backup_${formatDateISO(new Date())}.json`;

    const res = await shareFile(filename, jsonStr, 'application/json;charset=utf-8', {
      base64: false,
      title: 'Cadangan Data KeuanganKu',
      text: `Berkas cadangan data transaksi KeuanganKu (${txs.length} transaksi).`,
      dialogTitle: 'Simpan ke Google Drive / Bagikan'
    });

    if (res && !res.cancelled && res.success !== false) {
      setLastBackupTimestamp(Date.now());
      if (typeof checkBackupReminder === 'function') checkBackupReminder();
    }

    if (typeof closeExportModal === 'function') closeExportModal();
  } catch (err) {
    console.error('Gagal membagikan cadangan JSON:', err);
    if (typeof showToast === 'function') showToast('Gagal membagikan cadangan: ' + err.message, 'danger');
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
 * Membaca dan memulihkan transaksi dari berkas cadangan JSON dengan validasi schema ketat
 * dan pencegahan tabrakan ID secara aman
 */
function handleImportJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let parsed;
      try {
        parsed = JSON.parse(e.target.result);
      } catch (parseErr) {
        throw new Error('Berkas bukan format JSON yang valid.');
      }

      // Validasi ketat menggunakan validateTransactionsImport
      const validation = validateTransactionsImport(parsed);
      if (!validation.valid || validation.items.length === 0) {
        throw new Error(validation.error || 'Validasi schema gagal.');
      }

      const validItems = validation.items;
      const skippedCount = validation.skipped;
      const skippedNote = skippedCount > 0 ? `\n(${skippedCount} data tidak valid dilewati)` : '';

      const currentTxs = (typeof state !== 'undefined' && Array.isArray(state.transactions)) ? state.transactions : [];

      if (currentTxs.length > 0) {
        const mergeChoice = confirm(
          `Ditemukan ${validItems.length} transaksi valid di berkas cadangan.${skippedNote}\n\n` +
          `• Klik "OK" untuk MENGGABUNGKAN (Merge) dengan data yang ada saat ini (aman, ID duplikat akan disesuaikan).\n` +
          `• Klik "Batal" untuk memilih opsi Menimpa Seluruh Data atau Batal.`
        );

        let resultData = [];
        if (mergeChoice) {
          resultData = mergeTransactionsSafely(currentTxs, validItems);
        } else {
          const overwriteChoice = confirm(
            `Apakah Anda ingin MENIMPA SELURUH DATA yang ada saat ini dengan data dari berkas cadangan (${validItems.length} transaksi valid)?${skippedNote}\n\n` +
            `PERINGATAN: Semua catatan transaksi yang ada saat ini (${currentTxs.length} transaksi) akan digantikan!`
          );
          if (overwriteChoice) {
            resultData = validItems;
          } else {
            if (typeof showToast === 'function') showToast('Impor berkas cadangan dibatalkan', 'info');
            event.target.value = '';
            return;
          }
        }

        saveTransactions(resultData);
      } else {
        saveTransactions(validItems);
      }

      setLastBackupTimestamp(Date.now());
      if (typeof refreshUI === 'function') refreshUI();
      if (typeof closeExportModal === 'function') closeExportModal();

      const skippedToast = skippedCount > 0 ? ` (${skippedCount} data tidak valid dilewati)` : '';
      if (typeof showToast === 'function') {
        showToast(`Berhasil memulihkan ${validItems.length} transaksi cadangan!${skippedToast}`, 'success');
      }
    } catch (err) {
      console.error('Gagal mengimpor JSON:', err);
      if (typeof showToast === 'function') showToast('Gagal memulihkan data: ' + err.message, 'danger');
    } finally {
      event.target.value = '';
    }
  };
  reader.onerror = function() {
    if (typeof showToast === 'function') showToast('Gagal membaca berkas cadangan', 'danger');
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
  if (typeof closeExportModal === 'function') closeExportModal();

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

    if (typeof showToast === 'function') showToast('Menyiapkan dokumen cetak...', 'info');
    const doc = generatePDFDocument();
    if (!doc) return;

    const filename = `KeuanganKu_Cetak_${Date.now()}.pdf`;
    const dataUri = doc.output('datauristring');
    const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

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

    await PdfPrint.print({ path: uriResult.uri });
  } catch (err) {
    console.error('Gagal mencetak laporan via PdfPrint:', err);
    if (typeof showToast === 'function') showToast('Gagal memproses cetak: ' + err.message, 'danger');
  }
}
