# 📘 Panduan Penggunaan Sistem Booking Ruang Rapat
### Dokumentasi Lengkap

---

## Daftar Isi
1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Cara Menjalankan Aplikasi](#2-cara-menjalankan-aplikasi)
3. [Halaman Publik (Tanpa Login)](#3-halaman-publik-tanpa-login)
4. [Login Sistem](#4-login-sistem)
5. [Fitur Pengguna (USER)](#5-fitur-pengguna-user)
6. [Fitur Admin](#6-fitur-admin)
7. [Fitur Tablet Kiosk](#7-fitur-tablet-kiosk)
8. [Alur Lengkap Pemesanan](#8-alur-lengkap-pemesanan)

---

## 1. Gambaran Umum Sistem

Sistem ini merupakan aplikasi **reservasi ruang rapat berbasis web** yang dirancang untuk PT Semen Padang. Sistem ini terdiri dari tiga aktor utama:

| Aktor | Akses | Keterangan |
|---|---|---|
| **Publik** | Halaman Landing | Siapa saja bisa melihat jadwal rapat real-time tanpa login |
| **USER** | Dashboard, Booking, Riwayat | Karyawan yang bisa membuat dan mengelola pesanan sendiri |
| **ADMIN** | Semua fitur + panel admin | Bertanggung jawab atas persetujuan, pengelolaan data, dan kiosk |
| **Tablet Kiosk** | Halaman `/kiosk` | Layar tablet yang dipasang di depan tiap ruang rapat |

---

## 2. Cara Menjalankan Aplikasi

### Prasyarat
- **Node.js** versi 18 ke atas
- **MySQL** sudah berjalan
- Database sudah di-migrate (tabel `users`, `rooms`, `bookings`, `devices` tersedia)

### Menjalankan Server (Backend)
```bash
cd server
npm install
npm run dev
# Server berjalan di http://localhost:5000
```

### Menjalankan Client (Frontend)
```bash
cd client
npm install
npm run dev
# Aplikasi berjalan di http://localhost:5173
```

### Konfigurasi Environment (.env)
Sistem ini menggunakan file `.env` untuk menyimpan konfigurasi sensitif (password database, dll).
1. Salin file template `.env.example` menjadi `.env` di dalam folder `server/`:
   ```bash
   cp server/.env.example server/.env
   ```
2. Buka file `.env` yang baru dibuat dan isi dengan kredensial database MariaDB/MySQL kamu:
   ```env
   # ==========================================
   # KONFIGURASI MYSQL
   # ==========================================
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=ISI_PASSWORD_DB_KAMU_DI_SINI
   DB_NAME=booking_rapat
   DB_PORT=3306
   
   # JWT Secret Key
   JWT_SECRET=ganti-dengan-string-random-yang-panjang-dan-aman
   
   # Untuk Prisma
   DATABASE_URL=mysql://root:ISI_PASSWORD_DB_KAMU_DI_SINI@localhost:3306/booking_rapat
   ```

---

## 3. Halaman Publik (Tanpa Login)

**URL:** `http://localhost:5173`

Halaman ini dapat diakses oleh siapa saja **tanpa perlu login**. Fitur yang tersedia:

- ✅ **Jadwal Eksekutif Real-time** — Menampilkan rapat yang sedang berlangsung atau akan segera mulai dari semua ruangan, dalam format kartu yang bisa di-flip antar ruangan
- ✅ **Status Badge Langsung** — Kartu rapat menampilkan badge "SEDANG BERLANGSUNG" (berkedip) atau "SEGERA DATANG"
- ✅ **Rapat Mendatang** — Daftar horizontal yang bisa di-scroll, menampilkan jadwal-jadwal selanjutnya
- ✅ **Toggle Tema** — Tombol 🌙/☀️ di pojok kanan atas untuk beralih antara mode gelap dan terang
- ✅ **Tombol Login** — Mengarahkan pengguna ke halaman login sistem

> **Catatan:** Data diperbarui otomatis setiap **5 menit**.

---

## 4. Login Sistem

**URL:** `http://localhost:5173/login`

Pengguna memasukkan **Email** dan **Password** yang telah terdaftar di sistem. Setelah berhasil login, pengguna akan diarahkan ke Dashboard sesuai rolnya:
- `USER` → `/dashboard`
- `ADMIN` → `/dashboard` (dengan menu admin aktif)

> ⚠️ **Catatan Keamanan:** Akun yang berstatus **INACTIVE** tidak dapat login. Token sesi tersimpan di `localStorage` dan otomatis kedaluwarsa.

### Ganti Password
Pengguna dapat mengganti password-nya sendiri melalui menu **Ganti Password** di sidebar (tersedia setelah login).

---

## 5. Fitur Pengguna (USER)

### 5.1. Dashboard — Kalender Jadwal

**URL:** `http://localhost:5173/dashboard`

Setelah login sebagai USER, pengguna akan melihat:

- **Banner Selamat Datang** — Menampilkan nama dan tanggal hari ini
- **Rapat Akan Datang** — Kartu hero yang menampilkan jadwal terdekat (milik semua pengguna), disertai status "Sedang Berlangsung" atau "Segera Datang"
- **Mini Upcoming Scroll** — Daftar horisontal jadwal berikutnya hingga 10 item
- **Kalender Bulanan** — Grid kalender yang memperlihatkan acara-acara di setiap tanggal, dengan warna berbeda per ruangan (merah = Ruang A, hijau = Ruang B, dst.)

**Interaksi Kalender:**
- Klik tanggal mana pun → Muncul **modal Detail Rapat** yang menampilkan semua rapat di tanggal tersebut, dikelompokkan per ruangan
- Di dalam modal tersebut, ada tombol **"📋 Booking Tanggal Ini"** untuk langsung membuat pemesanan di tanggal itu

### 5.2. Buat Reservasi Baru

**URL:** `http://localhost:5173/dashboard/booking`

Formulir pemesanan ruang rapat. Field yang wajib diisi:

| Field | Keterangan |
|---|---|
| Ruangan | Pilih dari daftar ruangan yang tersedia dan aktif |
| Tanggal | Hanya hari kerja (Senin – Jumat), tidak boleh tanggal lampau |
| Jam Mulai – Jam Selesai | Dalam rentang jam operasional 08:00 – 17:00 |
| Agenda Utama | Topik/judul rapat |
| Jumlah Peserta | Tidak boleh melebihi kapasitas ruangan |
| Pemateri | (Opsional) |
| Catatan Tambahan | (Opsional) keperluan khusus seperti proyektor, dll. |

**Aturan Sistem:**
- Tersedia **buffer waktu 30 menit** antar booking. Jika ada rapat jam 10:00–11:00, pemesanan baru di rentang 09:30–11:30 akan ditolak.
- Status booking baru selalu `PENDING` dan harus disetujui Admin.

### 5.3. Riwayat Booking

**URL:** `http://localhost:5173/dashboard/riwayat`

Menampilkan seluruh riwayat pemesanan milik pengguna yang sedang login:

| Status | Arti |
|---|---|
| 🟡 `PENDING` | Menunggu persetujuan Admin |
| ✅ `APPROVED` | Disetujui, booking aktif |
| ❌ `REJECTED` | Ditolak Admin |
| 🚫 `CANCELLED` | Dibatalkan oleh pengguna sendiri |

**Aksi yang tersedia:**
- **Edit** — Pengguna dapat mengedit booking yang masih berstatus `PENDING`
- **Batalkan** — Pengguna dapat membatalkan booking `PENDING` atau `APPROVED`

---

## 6. Fitur Admin

Admin memiliki semua akses USER ditambah menu tambahan di sidebar: **Approval**, **Manajemen User**, **Manajemen Ruangan**, dan **Manajemen Kiosk**.

### 6.1. Dashboard Admin

Dashboard Admin menampilkan dua stat card:
- **Rapat Hari Ini** — Jumlah rapat yang sudah APPROVED pada tanggal sekarang
- **Total Rapat Bulan Ini** — Jumlah seluruh rapat bulan ini, disertai link ke riwayat

### 6.2. Halaman Approval Booking

**URL:** `http://localhost:5173/dashboard/approval`

Ini adalah **pusat kendali** Admin untuk memproses semua permintaan booking yang masuk.

**Tab yang tersedia:**
- **Perlu Tindakan** — Semua booking berstatus `PENDING` yang belum diproses
- **Semua Booking** — Riwayat lengkap seluruh booking (semua status, semua pengguna)

**Aksi Admin:**
- **✅ Setujui** — Mengubah status menjadi `APPROVED`. Booking ini akan muncul di kalender dan layar Kiosk.
- **❌ Tolak** — Mengubah status menjadi `REJECTED`. Admin diminta mengisi alasan penolakan.
- **📋 Detail** — Melihat detail lengkap booking (termasuk catatan pengguna)

> [!IMPORTANT]
> Admin wajib memproses booking sesegera mungkin. Booking yang masih `PENDING` tidak akan tampil di layar Kiosk.

### 6.3. Manajemen Pengguna

**URL:** `http://localhost:5173/dashboard/users`

Admin dapat mengelola seluruh akun karyawan:

| Aksi | Keterangan |
|---|---|
| **Tambah Pengguna** | Membuat akun baru dengan Email, Nama, Role (USER/ADMIN), dan Password |
| **Edit Data** | Mengubah nama, email, atau role pengguna |
| **Aktifkan / Nonaktifkan** | Toggle status `ACTIVE`/`INACTIVE`. Akun yang inactive tidak bisa login |
| **Reset Password** | Admin bisa me-reset password pengguna mana pun |

### 6.4. Manajemen Ruangan

**URL:** `http://localhost:5173/dashboard/ruangan`

Admin dapat melihat daftar ruangan beserta kapasitasnya dan melakukan toggle status **Aktif / Nonaktif**. Ruangan yang dinonaktifkan tidak akan muncul di form booking pengguna.

### 6.5. Manajemen Kiosk (Tablet)

**URL:** `http://localhost:5173/dashboard/kiosk`

Halaman ini digunakan untuk mengelola tablet-tablet yang terpasang di setiap ruang rapat.

#### Cara Menambahkan Tablet Baru:
1. Klik **"+ Tambah Kiosk Baru"**
2. Pilih **ruangan** yang akan dipasangi tablet
3. Sistem akan membuat **Token Aktivasi** unik beserta **QR Code** dan **Magic Link**
4. Buka tablet fisik, lalu:
   - Scan QR Code menggunakan kamera tablet, ATAU
   - Buka **Magic Link** yang ditampilkan di browser tablet
5. Tablet otomatis teraktivasi dan terhubung ke ruangan yang dipilih

#### Status Tablet:
| Status | Arti |
|---|---|
| `PENDING` | Token dibuat, tablet belum diaktifkan |
| `ACTIVE` | Tablet sudah aktif dan terhubung |
| `REVOKED` | Akses tablet dicabut |

#### Aksi Admin pada Tablet:
- **Cabut Akses (Revoke)** — Tablet langsung diblokir dan tidak bisa mengakses data lagi
- **Aktifkan Kembali** — Re-aktifkan tablet yang sebelumnya di-revoke
- **Hapus** — Menghapus record tablet secara permanen

---

## 7. Fitur Tablet Kiosk

**URL:** `http://localhost:5173/kiosk`

Halaman ini dirancang untuk ditampilkan di **tablet layar sentuh** yang dipasang di depan setiap ruang rapat. Halaman ini berjalan **penuh layar tanpa login pengguna**.

### 7.1. Tampilan Utama Kiosk

Setelah diaktivasi, layar tablet menampilkan:

**Header:**
- Nama ruangan + indicator berdenyut (live)
- Kapasitas maksimal ruangan
- Jam digital real-time + tanggal hari ini

**Panel Kiri — Jadwal Hari Ini:**
- Daftar rapat yang sudah APPROVED untuk hari ini di ruangan tersebut
- Badge status real-time: "Sedang Berlangsung" (merah berkedip), "Akan Datang" (hijau), "Selesai" (abu-abu)
- Auto-refresh setiap **30 detik**

**Panel Kanan — Tombol Pesan:**
- Tombol besar **"📝 Pesan Ruangan Ini"** untuk melakukan booking on-the-spot
- Jika ada jadwal mendatang: panel kecil menampilkan daftar acara beberapa hari ke depan

### 7.2. Kalender Bulanan di Kiosk

Scroll ke bawah pada layar Kiosk untuk melihat **Kalender Ruangan**:
- Menampilkan jadwal seluruh bulan untuk ruangan Kiosk tersebut
- Klik tanggal mana pun → Muncul **modal Detail Rapat** yang menunjukkan daftar acara di tanggal itu, dikelompokkan per ruangan
- Tersedia tombol **"📋 Booking Tanggal Ini"** langsung di dalam modal tersebut

**Fitur "Cek Ruang Lain":**
Di atas kalender tersedia dropdown **"Cek Ruang Lain"**. Pengguna dapat memilih ruangan lain (misal: Ruang B) untuk melihat jadwalnya tanpa meninggalkan layar Kiosk Ruang A.

### 7.3. Booking via Kiosk (2 Langkah)

Ketika pengunjung ingin memesan ruangan langsung dari tablet:

**Langkah 1 — Login:**
- Masukkan **Email** dan **Password** akun yang terdaftar di sistem
- Klik **"Lanjut →"**

**Langkah 2 — Isi Detail Rapat:**
- Tanggal, Jam Mulai, Jam Selesai
- Agenda Utama (wajib)
- Pemateri (opsional)
- Jumlah Peserta
- Catatan Tambahan (opsional)
- Klik **"Kirim Booking"**

> [!IMPORTANT]
> Booking via Kiosk **tidak langsung disetujui**. Status awal tetap `PENDING` dan harus disetujui oleh Admin melalui halaman Approval.

**Keamanan Kiosk:**
- Jika form tidak ada aktivitas selama **5 menit**, modal akan otomatis tertutup
- Token perangkat di-validasi setiap request. Jika Admin me-revoke tablet, layar langsung menampilkan "Perangkat Belum Dikonfigurasi"

---

## 8. Alur Lengkap Pemesanan

```
[Pengguna / Kiosk]
      │
      ▼
  Buat Booking
  (Status: PENDING)
      │
      ▼
[Admin]
  Terima Notifikasi di halaman Approval
      │
      ├─── Setujui ──► Status: APPROVED
      │                 ↓
      │          Muncul di Kalender &
      │          Layar Kiosk Ruangan
      │
      └─── Tolak  ──► Status: REJECTED
                       ↓
                 Pengguna bisa lihat
                 alasan di Riwayat
```

---


### 💻 Cara Kembali ke Mode Lokal (MySQL)
Jika sewaktu-waktu ingin kembali hosting di server fisik/lokal, **JANGAN HAPUS KODE CLOUD**. Cukup matikan (comment) kode cloud dan hidupkan kode lokal:

1. **Ubah Koneksi Database**
   - Buka `server/src/config/db.js`.
   - *Comment* blok `[ACTIVE] PRISMA CLIENT INSTANCE`.
   - *Uncomment* blok `[INACTIVE] KONFIGURASI MYSQL LOKAL`.
2. **Ubah Controller & Middleware**
   - Buka semua file di `server/src/controllers/` dan `server/src/middleware/`.
   - *Comment* blok kode yang ditandai `VERSI CLOUD`.
   - *Uncomment* blok kode yang ditandai `VERSI LOKAL (MySQL)`.
3. **Ubah URL Frontend**
   - Pastikan variabel lingkungan `.env` lokal tidak memiliki `VITE_API_URL`, sehingga sistem otomatis jatuh kembali (fallback) memanggil `http://localhost:5000/api` lewat proxy lokal.

---

## Catatan Teknis

| Komponen | Teknologi |
|---|---|
| Frontend | React + Vite, Vanilla CSS |
| Backend | Node.js + Express.js |
| Database | MySQL (via `mysql2`) |
| Auth | JWT (JSON Web Token) |
| Password Hashing | bcryptjs |
| Kiosk Token | Custom `X-Device-Token` header |
| Port Frontend | 5173 (Development) |
| Port Backend | 5000 |

---

*Dokumen ini dibuat secara otomatis berdasarkan implementasi sistem per Juli 2026.*
