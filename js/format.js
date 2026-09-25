/**
 * KeuanganKu - Helpers & Formatters
 * Modul pemformatan mata uang, tanggal, angka, dan sanitasi HTML (XSS prevention)
 */

/**
 * Format angka ke format mata uang Rupiah (IDR)
 * @param {number} number
 * @returns {string} Contoh: "Rp 1.500.000"
 */
function formatRupiah(number) {
  const num = typeof number === 'number' && Number.isFinite(number) ? number : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Parsing teks string berformat menjadi angka bulat (integer)
 * @param {string|number} str
 * @returns {number}
 */
function parseFormattedNumber(str) {
  if (typeof str === 'number') return Number.isFinite(str) ? Math.round(str) : 0;
  if (!str) return 0;
  return parseInt(str.toString().replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * Format string tanggal ISO (YYYY-MM-DD) ke bahasa Indonesia ramah pengguna
 * @param {string} dateStr
 * @returns {string} Contoh: "Kam, 25 Sep 2026"
 */
function formatDateIndo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

/**
 * Format objek Date menjadi string format YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function formatDateISO(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format objek Date menjadi string format YYYY-MM (untuk input bulan)
 * @param {Date} date
 * @returns {string}
 */
function formatMonthISO(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Validasi ketat format YYYY-MM-DD dan memastikan tanggal kalender valid riil
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidISODate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

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

/**
 * Sanitasi string masukan pengguna untuk mencegah XSS saat disisipkan ke DOM
 * @param {*} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Ekspor untuk pengujian Node.js (npm test) jika dijalankan di environment CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatRupiah,
    parseFormattedNumber,
    formatDateIndo,
    formatDateISO,
    formatMonthISO,
    isValidISODate,
    escapeHtml
  };
}
