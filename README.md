# KeuanganKu

Aplikasi pencatat pemasukan dan pengeluaran harian offline-first untuk **Android & PWA** (Progressive Web App). Dibangun menggunakan arsitektur Vanilla (HTML5, Vanilla CSS, dan JavaScript murni tanpa framework tambahan) serta dibungkus dengan [Capacitor 6](https://capacitorjs.com/) menjadi aplikasi Android native yang ringan, cepat, dan mandiri.

Semua data tersimpan secara lokal di perangkat Anda (`localStorage`), tanpa server backend, tanpa akun, tanpa pelacakan, dan 100% dapat digunakan tanpa koneksi internet.

---

## Fitur Utama

- **Pencatatan Lengkap**: Catat transaksi pemasukan dan pengeluaran dengan nominal, tanggal, waktu, kategori, dan catatan tambahan.
- **Filter Waktu Fleksibel**: Pantau keuangan harian, mingguan, bulanan berjalan, atau seluruh riwayat transaksi.
- **Visualisasi Grafik**:
  - Grafik batang dinamika arus kas masuk vs keluar (Chart.js 4.4).
  - Grafik donat komposisi pengeluaran per kategori.
- **Anggaran Bulanan (Budgeting)**: Atur batas anggaran pengeluaran per kategori per bulan dengan indikator progres visual (normal, mendekati batas, overbudget).
- **Rasio Tabungan Finansial**: Metrik otomatis menghitung persentase tabungan dari total pemasukan periode aktif.
- **Ekspor & Berbagi Dokumen**:
  - Unduh dokumen laporan **PDF** (format A4 resmi dengan tabel & ringkasan metrik).
  - Ekspor data spreadsheet **CSV** dengan UTF-8 BOM untuk Microsoft Excel & Google Sheets.
  - Bagikan berkas PDF atau ringkasan teks rapi langsung ke WhatsApp / aplikasi lain via Share API.
  - Cetak laporan fisik via plugin Android `PrintManager`.
- **Cadangan Data Mandiri (Backup & Restore)**:
  - Ekspor seluruh basis data transaksi ke berkas **JSON**.
  - Impor dan pulihkan data dengan validasi schema ketat serta penggabungan cerdas (mencegah tabrakan ID transaksi).
  - **Pengingat Cadangan**: Banner pengingat otomatis jika data belum dicadangkan lebih dari 30 hari (dapat disembunyikan 7 hari).
- **Mode Tampilan**: Mode Gelap (*Dark Mode*) dan Terang (*Light Mode*) yang bersih, nyaman di mata, dan responsif.
- **PWA & Offline Asset**: Seluruh font, ikon Font Awesome, dan library dibundel lokal di folder `vendor/` untuk performa instan tanpa bergantung CDN.
- **Data Contoh Opsional**: Tersedia data percontohan dinamis yang hanya dimuat jika dipilih secara eksplisit oleh pengguna (tidak dimuat otomatis).

---

## Cakupan Platform

- **Android**: Aplikasi native terpasang via Capacitor 6 (Target SDK 34 / Android 14).
- **PWA (Web Browser)**: Dapat dibuka langsung sebagai situs web statis atau dipasang (*Add to Home Screen*) di peramban seluler (Chrome, Firefox, Safari).

*Catatan: Repositori ini tidak menyertakan konfigurasi native iOS (`ios/`). Dukungan perangkat Apple berjalan melalui standar Web / PWA Safari.*

---

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Antarmuka Pengguna | HTML5 Semantik, Vanilla CSS (Design Tokens, Dark/Light Mode), Vanilla JavaScript |
| Runtime Native Android | Capacitor 6 (Bridge Android WebView) |
| Grafik Finansial | Chart.js 4.4.1 (Bundel lokal di `vendor/`) |
| Pembuat Dokumen PDF | jsPDF 2.5.1 + jspdf-autotable 3.8.2 |
| Ikonografi & Tipografi | Font Awesome 6.5.1 Free, Plus Jakarta Sans Font |
| Penyimpanan Offline | Browser `localStorage` (`keuanganku_transactions_v1`) |
| Plugin Android Native | `@capacitor/app`, `@capacitor/filesystem`, `@capacitor/share`, `@capacitor/status-bar`, `PdfPrintPlugin` |

---

## Struktur Folder

```
.
├── index.html              # Halaman utama aplikasi (dashboard, tabel, modal)
├── style.css               # Desain UI, token warna fintech, dark/light mode
├── app.js                  # State aplikasi, event listeners, dan orchestrator
├── js/
│   ├── format.js           # Formatter Rupiah, tanggal ISO/Indo, sanitasi escapeHtml
│   ├── data.js             # Master kategori, storage, sample data relatif, schema JSON
│   ├── charts.js           # Visualisasi grafik batang & donat Chart.js
│   ├── export.js           # Generator PDF, CSV, backup/restore JSON, share & print
│   └── ui.js               # Render tabel, kartu mobile, modul anggaran, banner cadangan
├── test/
│   └── test.js             # Pengujian unit otomatis (Node.js built-in assert)
├── vendor/                 # Pustaka offline (Chart.js, jsPDF, Font Awesome, Font)
├── icons/                  # Aset ikon launcher & favicon PWA
├── manifest.webmanifest    # Konfigurasi instalasi PWA
├── prepare-www.js          # Skrip penyalin aset web ke folder www/ untuk Capacitor
├── capacitor.config.json   # Konfigurasi appId dan webDir Capacitor
├── android/                # Proyek native Android (Gradle & Java)
├── LICENSE                 # Lisensi open source MIT
└── .github/workflows/      # Otomasi CI (Build debug APK & Release tag)
```

---

## Panduan Pengembangan & Pengujian

### Prasyarat

1. **Node.js**: Versi 20 atau lebih baru.
2. **JDK**: Java Development Kit 17 (untuk Android build).
3. **Android SDK**: Platform SDK 34 dan Build-tools 34.0.0.

Konfigurasikan direktori Android SDK Anda pada file `android/local.properties`:

```properties
sdk.dir=C:/Users/NAMA_USER/AppData/Local/Android/Sdk
```

### Langkah Instalasi & Uji Coba

1. **Pasang Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Pengujian Unit**:
   Pengujian otomatis menguji formatter mata uang, validitas tanggal kalender riil kabisat, proteksi XSS, validasi schema JSON, dan penggabungan ID:
   ```bash
   npm test
   ```

3. **Kompilasi Aset Web**:
   Menyalin `index.html`, `style.css`, `app.js`, `js/`, `vendor/`, dan `icons/` ke folder `www/`:
   ```bash
   npm run build
   ```

4. **Sinkronkan ke Native Android**:
   ```bash
   npx cap sync android
   ```

5. **Build APK Debug**:
   ```bash
   cd android
   ./gradlew assembleDebug      # Pada Windows Command Prompt/PowerShell: gradlew.bat assembleDebug
   ```
   Berkas APK hasil build berada di:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Peringatan Keamanan & Pencadangan Data

> [!IMPORTANT]
> **Data Disimpan 100% di Perangkat Anda (Offline-First)**
> KeuanganKu tidak menyimpan data di cloud server mana pun demi privasi penuh pengguna. Jika aplikasi dicopot (*uninstall*) atau data aplikasi dibersihkan lewat setelan Android, seluruh catatan keuangan akan **terhapus secara permanen**.

**Langkah Pencegahan:**
Lakukan pencadangan berkala melalui menu **Laporan & Cadangan → Cadangkan Data (.json)** atau klik tombol **Cadangkan** pada banner pengingat. Simpan berkas JSON tersebut ke Google Drive atau penyimpanan eksternal.

---

## Alur Rilis & Tagging Versi (CI/CD)

Proyek ini menggunakan GitHub Actions (`.github/workflows/release.yml`) untuk membangun APK rilis yang ditandatangani (*signed release APK*).

1. Pastikan nomor versi di `package.json` dan `android/app/build.gradle` (`versionName`) sudah cocok (misal `1.0.3`).
2. Masukkan rahasia (*repository secrets*) pada repositori GitHub Anda:
   - `KEYSTORE_BASE64`: File `.jks` rilis yang di-encode ke base64.
   - `KEYSTORE_PASSWORD`: Kata sandi keystore.
   - `KEY_ALIAS`: Alias kunci rilis.
   - `KEY_PASSWORD`: Kata sandi kunci.
3. Buat dan kirim tag rilis berawalan `v`:
   ```bash
   git tag v1.0.3
   git push origin v1.0.3
   ```
4. GitHub Actions akan memverifikasi kesesuaian tag dengan `versionName`, mengkompilasi APK release, dan menerbitkan rilis di halaman **Releases** repositori secara otomatis.

---

## Lisensi

Didistribusikan di bawah lisensi open source [MIT](LICENSE). Hak Cipta (c) 2026 SoraDev-ID / Kontributor KeuanganKu.
