# Panduan Lengkap Instalasi Aplikasi KeuanganKu (Android & iOS)

Aplikasi **KeuanganKu** telah dirancang secara modern agar dapat di-install dan digunakan pada **semua versi Android** dan **semua perangkat iOS (iPhone & iPad)**, lengkap dengan dukungan **100% Offline (tanpa internet)**.

Tersedia **2 metode utama** untuk meng-install aplikasi ini:
1. **Metode 1 (Rekomendasi Utama & Instan):** Install Langsung Lewat Browser HP (Teknologi PWA).
2. **Metode 2 (Native APK):** Install Menggunakan File `.apk` Android (via GitHub Actions Cloud Builder atau Android Studio).

---

## METODE 1: Install Langsung dari HP (PWA - Bekerja di Semua Android & iOS)

Metode ini adalah cara paling praktis, cepat, dan **didukung oleh semua versi Android maupun iOS**. Aplikasi akan berjalan secara mandiri (*standalone*), memiliki ikon sendiri di layar utama, dan tidak memerlukan instalasi file besar.

> [!NOTE]
> **Penting Mengenai Protokol Keamanan PWA:**
> Agar fitur instalasi dan Service Worker (offline) aktif di HP pengguna lain, aplikasi harus diakses melalui alamat berawalan `https://` (misal: di-hosting gratis di Vercel, Netlify, atau GitHub Pages) atau melalui `http://localhost` saat pengujian.

### A. Cara Install di HP Android (Semua Versi)
1. Buka link website aplikasi Anda di browser HP Android (disarankan menggunakan **Google Chrome**, **Samsung Internet**, **Microsoft Edge**, atau **Opera**).
2. Di layar aplikasi, Anda akan melihat tombol **"Install App"** di bagian atas atau banner mengambang bertuliskan **"Pasang Aplikasi KeuanganKu"** di bagian bawah.
3. Ketuk tombol **"Pasang" / "Install"**.
4. Akan muncul dialog konfirmasi bawaan Android: ketuk **"Install"** atau **"Tambahkan"**.
   > *Alternatif manual:* Jika tombol tidak muncul, ketuk menu titik tiga (**⋮**) di pojok kanan atas browser Chrome, lalu pilih **"Install aplikasi"** atau **"Tambahkan ke Layar Utama" (Add to Home screen)**.
5. Selesai! Ikon **KeuanganKu** sekarang sudah terpasang di Homescreen dan App Drawer HP Anda. Buka aplikasinya, dan ia akan berjalan fullscreen tanpa bilah browser.

### B. Cara Install di iPhone & iPad (iOS Semua Versi)
1. Buka link website aplikasi menggunakan browser **Safari** bawaan iPhone/iPad.
2. Di dalam aplikasi, jika Anda mengetuk tombol **"Install App"**, panduan visual langkah-demi-langkah akan otomatis muncul di layar.
3. Ikuti langkah sederhana ini:
   - Ketuk ikon **Bagikan (Share)** berupa kotak dengan panah ke atas (⎋ / ⬆) pada bilah navigasi bawah Safari.
   - Gulir menu ke bawah dan pilih opsi **"Tambah ke Layar Utama" (Add to Home Screen)** ➕.
   - Ketuk tombol **"Tambah" (Add)** di pojok kanan atas.
4. Selesai! Ikon aplikasi **KeuanganKu** akan langsung tampil di layar depan iPhone Anda layaknya aplikasi dari App Store.

---

## CARA MENG-ONLINERKAN APLIKASI (Gratis 100% dengan HTTPS)

Agar aplikasi bisa dibuka dan di-install oleh Anda dan teman-teman dari HP mana saja secara gratis, gunakan salah satu layanan hosting instan berikut:

### Pilihan 1: Netlify Drop (Paling Mudah, Tanpa Coding)
1. Buka [app.netlify.com/drop](https://app.netlify.com/drop).
2. Seret (drag & drop) seluruh folder `catatan-keuangan` ke area unggah di halaman web Netlify.
3. Dalam hitungan detik, Netlify akan memberikan alamat website `https://nama-unik.netlify.app`.
4. Buka link tersebut dari HP Android atau iPhone Anda, dan langsung install!

### Pilihan 2: Vercel
1. Buka [vercel.com](https://vercel.com) dan masuk dengan akun GitHub Anda.
2. Buat proyek baru (*New Project*) dan arahkan ke repository GitHub proyek ini.
3. Klik **Deploy**. Selesai! Anda langsung mendapatkan domain HTTPS gratis.

### Pilihan 3: GitHub Pages
1. Unggah kode ke repository GitHub Anda.
2. Buka tab **Settings** di repository GitHub Anda -> pilih menu **Pages**.
3. Pada bagian *Build and deployment*, pilih Branch: `main` (atau `master`) dan folder: `/(root)`.
4. Klik **Save**. Link aplikasi Anda akan aktif di `https://username.github.io/nama-repo/`.

---

## METODE 2: Build File .APK Android Asli (Native Package)

Jika Anda ingin membagikan file instalasi mentah berformat `.apk` (misalnya dikirim via WhatsApp, Telegram, atau Google Drive):

### Cara Praktis: Build Otomatis di Cloud (GitHub Actions - Tanpa Install Android Studio)
Kami telah menyertakan script workflow otomatis pada berkas:
`.github/workflows/build-mobile.yml`

**Langkah-langkahnya:**
1. Unggah (push) seluruh isi folder proyek ini ke akun GitHub Anda.
2. Buka repository Anda di GitHub, lalu klik tab **Actions**.
3. Anda akan melihat alur kerja bernama **"Build Android APK (KeuanganKu)"** berjalan secara otomatis.
4. Tunggu sekitar 2–3 menit hingga proses selesai (bertanda centang hijau).
5. Klik alur kerja yang baru saja selesai tersebut, lalu gulir ke bawah ke bagian **Artifacts**.
6. Klik dan unduh file **`KeuanganKu-Android-APK.zip`**.
7. Ekstrak zip tersebut, dan Anda akan mendapatkan file **`app-debug.apk`**.
8. Kirim file `.apk` tersebut ke HP Android mana saja dan buka untuk meng-install!

---

### Cara Lokal: Build Sendiri di Komputer Anda (Memerlukan Android Studio)

Jika Anda ingin meng-compile file APK langsung dari laptop/PC Windows Anda:

1. **Pastikan Android Studio terpasang:**
   - Unduh dan pasang [Android Studio](https://developer.android.com/studio) beserta Android SDK.
2. **Buka Terminal di folder `catatan-keuangan`:**
   ```bash
   # 1. Install dependensi Capacitor
   npm install

   # 2. Tambahkan platform Android
   npx cap add android

   # 3. Sinkronisasikan kode web ke proyek native
   npx cap sync android

   # 4. Buka proyek di Android Studio
   npx cap open android
   ```
3. **Buat File APK di Android Studio:**
   - Setelah Android Studio terbuka dan sinkronisasi Gradle selesai, klik menu:
     `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
   - File APK Anda akan siap di folder `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## METODE 3: Build untuk iOS Native (Memerlukan Komputer Mac & Xcode)

Karena aturan resmi Apple, kompilasi aplikasi iOS native (`.ipa`) memerlukan sistem operasi macOS:

1. Buka folder proyek di komputer Mac:
   ```bash
   npm install
   npx cap add ios
   npx cap sync ios
   npx cap open ios
   ```
2. Xcode akan otomatis terbuka.
3. Hubungkan iPhone Anda dengan kabel ke Mac, atau pilih iPhone Simulator.
4. Klik tombol **Run / Play** di Xcode untuk memasang aplikasi ke iPhone.

---

## Rangkuman Fitur Khusus Mobile yang Sudah Ditanamkan:
- **Offline Caching Penuh (`sw.js`):** Aplikasi tetap dapat dibuka dan mencatat keuangan meski Anda sedang berada di daerah tanpa sinyal atau kuota internet habis.
- **Dukungan Notch / Dynamic Island iPhone & Navigasi Android:** Desain antarmuka otomatis menyesuaikan area batas aman layar (*Safe Area Insets*).
- **Deteksi Status Jaringan:** Menampilkan notifikasi halus saat koneksi terputus dan otomatis tersinkronisasi saat kembali online.
- **Ikon Resolusi Tinggi & Maskable:** Dilengkapi set ikon 72px hingga 512px yang tajam pada semua tipe layar (AMOLED, Retina Display, dll.).
