import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { KioskProvider } from './context/KioskContext';

// Layout Component
import MainLayout from './components/Layout/MainLayout';

// Core & User Pages
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import BookingFormPage from './pages/BookingFormPage';
import RiwayatPage from './pages/RiwayatPage';
import LandingPage from './pages/LandingPage';

// Kiosk Pages
import KioskDashboardPage from './pages/KioskDashboardPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ApprovalPage from './pages/admin/ApprovalPage';
import ManajemenUserPage from './pages/admin/ManajemenUserPage';
import ManajemenRuanganPage from './pages/admin/ManajemenRuanganPage';
import ManajemenKioskPage from './pages/admin/ManajemenKioskPage';

/**
 * Guard Khusus untuk Halaman Utama Workspace
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: 'var(--text-muted)' }}>
        Memuat sistem operasional...
      </div>
    );
  }

  // 1. Jika belum login sama sekali, lempar ke login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Jika wajib ganti password, paksa ke halaman change-password
  if (user.mustChangePassword || user.must_change_password === 1) {
    return <Navigate to="/change-password" replace />;
  }

  // 3. Jika rute butuh admin tapi user biasa, lempar ke dashboard user
  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * Guard Khusus Halaman Ganti Password (Mencegah Blank Screen)
 */
const ChangePasswordRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <KioskProvider>
          <Router>
            <Routes>
              {/* Rute Publik Terbuka */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Rute Kiosk (Tablet) */}
              <Route path="/kiosk" element={<KioskDashboardPage />} />

              {/* Rute Ganti Password dengan Guard Longgar (Anti Blank) */}
            <Route path="/change-password" element={
              <ChangePasswordRoute>
                <ChangePasswordPage />
              </ChangePasswordRoute>
            } />

            {/* Kelompok Rute Workspace Utama (Menggunakan Sidebar Layout) */}
            <Route element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              {/* Rute Karyawan */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/booking" element={<BookingFormPage />} />
              <Route path="/dashboard/riwayat" element={<RiwayatPage />} />

              {/* Rute Administrator */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/approval" element={
                <ProtectedRoute requireAdmin={true}>
                  <ApprovalPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requireAdmin={true}>
                  <ManajemenUserPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/rooms" element={
                <ProtectedRoute requireAdmin={true}>
                  <ManajemenRuanganPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/kiosks" element={
                <ProtectedRoute requireAdmin={true}>
                  <ManajemenKioskPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Jalur Otomatis Jika Rute Tidak Dikenali */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        </KioskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}