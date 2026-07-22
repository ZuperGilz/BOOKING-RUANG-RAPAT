# 📦 Running Documentation for Booking Ruang Rapat

## 📋 Overview
This document provides step‑by‑step instructions to get the **Booking Ruang Rapat** project up and running locally. It covers prerequisites, environment configuration, database setup, and how to start both the **backend (Node.js/Express)** and **frontend (React + Vite)**.

---

## 1️⃣ Prerequisites
| Tool | Minimum Version |
|------|-----------------|
| **Node.js** | 18.x or newer |
| **npm** | 8.x or newer |
| **MySQL / MariaDB** | 5.7+ |
| **Git** (optional) | any |

Make sure `node` and `npm` are available in your `PATH`:
```bash
node -v   # e.g., v18.20.0
npm -v    # e.g., 9.8.1
```

---

## 2️⃣ Clone the Repository
```bash
# From your workspace root (replace with your actual path)
cd "d:/semester 6/semen_padang/booking-ruang-rapat"
# If you haven't cloned yet, use:
# git clone <repo-url> .
```

---

## 3️⃣ Backend (Server) Setup
1. **Navigate to the server folder**
   ```bash
   cd server
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create `.env` file**
   - Copy the example file:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and fill in the MySQL credentials and JWT secret:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=YOUR_DB_PASSWORD
     DB_NAME=booking_rapat
     DB_PORT=3306

     JWT_SECRET=your-strong-random-secret

     DATABASE_URL=mysql://root:YOUR_DB_PASSWORD@localhost:3306/booking_rapat
     ```
4. **Run database migrations / seed** (uses Prisma)
   ```bash
   npx prisma migrate deploy   # applies schema migrations
   node prisma/seed.js          # optional seed data
   ```
5. **Start the backend server**
   ```bash
   npm run dev   # server runs at http://localhost:5000
   ```
   You should see a console message like `Server listening on port 5000`.

---

## 4️⃣ Frontend (Client) Setup
1. **Open a new terminal window** and navigate to the client folder:
   ```bash
   cd client
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start the development server**
   ```bash
   npm run dev   # Vite dev server at http://localhost:5173
   ```
   The browser should automatically open; if not, visit the URL manually.

---

## 5️⃣ Verify the Application
- **Public view**: Open <http://localhost:5173> – you should see the landing page showing the real‑time schedule.
- **Login**: Navigate to <http://localhost:5173/login> and use a user account (create one via the admin panel if none exist).
- **Kiosk view**: After configuring a kiosk token (admin → kiosk), open <http://localhost:5173/kiosk> on a tablet or browser.

---

## 6️⃣ Common Gotchas
- **CORS errors** – Ensure the backend URL (`http://localhost:5000`) is whitelisted in `client/src/services/api.js` if you modify ports.
- **Database connection** – Double‑check `DB_HOST`, `DB_PORT`, and credentials in `.env`.
- **Missing tables** – Run the Prisma migration step before starting the server.
- **Token expiration** – JWT tokens are stored in `localStorage` and expire after the time set in the backend (`auth.js`). Re‑login if you see “unauthorized”.

---

## 7️⃣ Production Build (Optional)
If you need a production bundle to deploy:
```bash
# Backend
npm run build   # if a build script exists (otherwise just use `node index.js`)
# Frontend
npm run build   # creates `dist/` for static hosting
```
Serve the `dist/` folder with any static file server (e.g., Nginx) and proxy API requests to the backend.

---

## 📚 Further Reading
- Detailed API reference: see the Swagger UI at <http://localhost:5000/api-docs>
- Architecture diagram (in `docs/architecture.png` if present).
- Contribution guidelines are in `CONTRIBUTING.md`.

---

*Generated automatically on 2026‑07‑21.*
