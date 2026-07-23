# 📘 Panduan Singkat — Sistem Booking Ruang Rapat

## Tentang Sistem
Aplikasi web reservasi ruang rapat untuk PT Semen Padang, dengan 4 jenis akses:

| Aktor | Akses |
|---|---|
| **Publik** | Lihat jadwal rapat real-time, tanpa login |
| **USER** | Buat & kelola booking sendiri |
| **ADMIN** | Approve booking, kelola user/ruangan/kiosk |
| **Tablet Kiosk** | Layar di depan tiap ruangan (`/kiosk`) |

---

## 🚀 Cara Menjalankan Aplikasi

**Prasyarat:** Node.js 18+, MySQL sudah jalan & ter-migrate.

### 1. Setup Konfigurasi (.env)
```bash
cp server/.env.example server/.env
```
Isi `server/.env` dengan kredensial database:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=isi_password_kamu
DB_NAME=booking_rapat
DB_PORT=3306
JWT_SECRET=string-random-yang-aman
DATABASE_URL=mysql://root:isi_password_kamu@localhost:3306/booking_rapat
```

### 2. Jalankan Backend
```bash
cd server
npm install
npm run dev
# → http://localhost:5000
```

### 3. Jalankan Frontend
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

### 🔄 Kembali ke Mode Lokal (dari Cloud)
Jangan hapus kode cloud — cukup comment/uncomment:
1. `server/src/config/db.js` → comment blok Prisma (cloud), uncomment blok MySQL lokal
2. `server/src/controllers/` & `middleware/` → comment `VERSI CLOUD`, uncomment `VERSI LOKAL`
3. Hapus `VITE_API_URL` di `.env` frontend agar otomatis fallback ke `http://localhost:5000/api`

---

## 🔑 Login
`http://localhost:5173/login` — pakai Email & Password terdaftar.
- USER & ADMIN sama-sama masuk ke `/dashboard` (menu admin muncul otomatis kalau role ADMIN)
- Akun `INACTIVE` tidak bisa login

---

## 👤 Fitur USER
- **Dashboard** — kalender bulanan jadwal semua ruangan, klik tanggal untuk detail rapat & booking cepat
- **Buat Booking** — pilih ruangan, tanggal (hari kerja), jam (08:00–17:00), agenda, jumlah peserta. Status awal selalu `PENDING`, ada buffer 30 menit antar rapat
- **Riwayat** — lihat status booking (`PENDING`/`APPROVED`/`REJECTED`/`CANCELLED`), bisa edit/batalkan booking yang masih `PENDING`

## 🛠️ Fitur ADMIN
Semua fitur USER + :
- **Approval** — setujui/tolak booking `PENDING`; booking yang belum diproses tidak tampil di Kiosk
- **Manajemen User** — tambah/edit/aktifkan-nonaktifkan akun, reset password
- **Manajemen Ruangan** — atur kapasitas & status aktif/nonaktif ruangan
- **Manajemen Kiosk** — tambah tablet baru (via QR/Magic Link), revoke/aktifkan/hapus tablet

## 📺 Fitur Kiosk (`/kiosk`)
- Tampilkan jadwal hari ini per ruangan (auto-refresh 30 detik) + status live
- Bisa cek jadwal ruangan lain via dropdown
- Booking on-the-spot (login → isi detail rapat), status tetap `PENDING`
- Modal otomatis tertutup jika idle 5 menit

---

## 🔁 Alur Booking
```
User/Kiosk buat booking (PENDING)
        ↓
Admin review di halaman Approval
        ↓
   Setujui → APPROVED → muncul di Kalender & Kiosk
   Tolak   → REJECTED → alasan terlihat di Riwayat user
```

---

## ⚙️ Teknologi
React + Vite (frontend) · Node.js + Express (backend) · MySQL · JWT Auth · bcryptjs

*Ringkasan dari dokumentasi lengkap, per Juli 2026.*
