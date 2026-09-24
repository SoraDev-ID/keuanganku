# KeuanganKu

Aplikasi pencatat pemasukan dan pengeluaran harian untuk Android. Dibuat dengan HTML, CSS, dan JavaScript murni, lalu dibungkus dengan [Capacitor](https://capacitorjs.com/) menjadi aplikasi native. Semua data tersimpan di perangkat dan aplikasi bisa dipakai tanpa internet.

## Fitur

- Catat pemasukan dan pengeluaran dengan kategori dan tanggal
- Ringkasan saldo, pemasukan, dan pengeluaran per periode: harian, mingguan, bulanan, atau semua
- Grafik visual pemasukan vs pengeluaran (Chart.js)
- Pencarian dan filter berdasarkan tipe dan kategori
- Tema gelap dan terang, tampilan responsif (tabel di layar besar, kartu di ponsel)
- Ekspor laporan **PDF** dan **CSV** ke folder `Dokumen/KeuanganKu`
- Bagikan laporan sebagai PDF atau teks (.txt) ke WhatsApp dan aplikasi lain lewat menu bagikan Android
- Cadangkan dan pulihkan data dalam format **JSON** (bisa disimpan ke Google Drive lewat menu bagikan)
- Cetak laporan lewat dialog cetak Android
- Berfungsi penuh offline: Chart.js, Font Awesome, dan font dibundel lokal di folder `vendor/`
- Data contoh bersifat opsional dan tidak dimuat otomatis

## Teknologi

| Bagian | Yang dipakai |
| --- | --- |
| Antarmuka | HTML, CSS, JavaScript (tanpa framework) |
| Aplikasi native | Capacitor 6 (Android) |
| Grafik | Chart.js 4.4.1 |
| PDF | jsPDF dan jspdf-autotable |
| Ikon dan font | Font Awesome 6.5.1, Plus Jakarta Sans |
| Penyimpanan data | `localStorage` |
| File dan bagikan | `@capacitor/filesystem`, `@capacitor/share` |
| Cetak | Plugin Java kecil (`PdfPrintPlugin`) memakai `PrintManager` Android |

## Struktur proyek

```
.
├── index.html            Halaman utama
├── app.js                Logika aplikasi
├── style.css             Gaya tampilan
├── manifest.webmanifest  Manifest web app
├── vendor/               Library yang dibundel lokal
├── icons/                Ikon aplikasi
├── prepare-www.js        Menyalin aset web ke folder www/
├── capacitor.config.json Konfigurasi Capacitor
├── android/              Proyek Android (Gradle)
└── .github/workflows/    CI: build APK debug otomatis
```

## Menjalankan untuk pengembangan

Prasyarat: Node.js 20+, JDK 17, dan Android SDK (platform 34, build-tools 34.0.0). Arahkan Gradle ke SDK lewat `android/local.properties`:

```
sdk.dir=C:/Users/NAMA/AppData/Local/Android/Sdk
```

Pasang dependensi, salin aset web, dan sinkronkan ke proyek Android:

```bash
npm install
npm run build
npx cap sync android
```

Build APK debug:

```bash
cd android
./gradlew assembleDebug        # Windows: gradlew.bat assembleDebug
```

Hasilnya ada di `android/app/build/outputs/apk/debug/app-debug.apk`.

## Build APK release

Build release memakai keystore yang dibaca dari environment variable. Jangan menyimpan keystore atau password di repo.

```bash
keytool -genkey -v -keystore keuanganku-release-key.jks -alias keuanganku-key -keyalg RSA -keysize 2048 -validity 10000
```

Windows (cmd):

```bat
set "KEYSTORE_FILE=%CD%\keuanganku-release-key.jks"
set "KEYSTORE_PASSWORD=password_anda"
set "KEY_ALIAS=keuanganku-key"
set "KEY_PASSWORD=password_anda"
```

Linux/macOS:

```bash
export KEYSTORE_FILE="$PWD/keuanganku-release-key.jks"
export KEYSTORE_PASSWORD="password_anda"
export KEY_ALIAS="keuanganku-key"
export KEY_PASSWORD="password_anda"
```

Lalu:

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

Hasilnya ada di `android/app/build/outputs/apk/release/app-release.apk`. Simpan file keystore dan passwordnya di tempat aman di luar repo. Jika hilang, aplikasi tidak bisa diperbarui dengan tanda tangan yang sama.

## Instal di HP

1. Unduh `app-release.apk` dari halaman [Releases](../../releases).
2. Buka file APK di HP dan izinkan instal dari sumber tidak dikenal jika diminta.
3. Untuk memperbarui, instal APK versi baru. Data tetap ada selama tanda tangannya sama.

Ekspor PDF, CSV, dan cadangan JSON tersimpan di `Dokumen/KeuanganKu`.

## Cadangan data

Data disimpan di penyimpanan lokal aplikasi, jadi akan hilang jika data aplikasi dihapus atau aplikasi di-uninstall. Buat cadangan berkala lewat menu **Laporan, Berbagi & Cadangan → Cadangkan Data (.json)**, lalu pulihkan lewat **Pulihkan / Impor Data (.json)**.

## Build otomatis (CI)

Workflow `.github/workflows/build-mobile.yml` membangun APK debug setiap push ke `main`. Hasilnya tersedia di tab **Actions** pada bagian **Artifacts**. APK debug memakai tanda tangan berbeda dari APK release, jadi tidak bisa saling menimpa di perangkat yang sama.

## Lisensi

Belum ditentukan.
