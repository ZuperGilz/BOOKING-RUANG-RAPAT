import React, { useState, useContext, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import logo from "../../img/LOGO-PT-SEMEN-PADANG-HITAM.png"; // Fixed path based on standard CRA/Vite if placed correctly or handle based on src

export default function MainLayout() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    // Purposeful delay micro-interaction
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 400);
  };

  const closeSidebarOnMobile = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 900) setIsSidebarOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout-container">
      
      {/* HEADER MOBILE & TABLET */}
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isSidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--text-main)' }}>Semen Padang</div>
        <div style={{ width: '24px' }}></div>
      </header>

      {/* OVERLAY */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* SIDEBAR (Liquid Glass) */}
      <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {/* <img src={logo} alt="Logo" style={{ width: '30px', height: '30px', background: 'white', borderRadius: '6px', padding: '2px' }} /> */}
          <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(220,38,38,0.4)' }}>
            <span style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>SP</span>
          </div>
          <span style={{ color: 'var(--text-main)' }}>Portal <span style={{ color: 'var(--primary)' }}>Rapat</span></span>
        </div>
        
        <nav className="sidebar-nav">
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '0 1.25rem', marginTop: '1rem', marginBottom: '0.25rem' }}>Menu Utama</span>
          <NavLink to="/dashboard" onClick={closeSidebarOnMobile} className={({isActive}) => isActive ? 'sidebar-link active' : 'sidebar-link'} end>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> 
            Jadwal Ruangan
          </NavLink>
          <NavLink to="/dashboard/booking" onClick={closeSidebarOnMobile} className={({isActive}) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Buat Reservasi
          </NavLink>
          {user?.role !== 'ADMIN' && (
            <NavLink to="/dashboard/riwayat" onClick={closeSidebarOnMobile} className={({isActive}) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Riwayat Saya
            </NavLink>
          )}
          
          {user?.role === 'ADMIN' && (
            <>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '0 1.25rem', marginTop: '1.5rem', marginBottom: '0.25rem' }}>Administrator</span>
              <NavLink to="/admin" onClick={closeSidebarOnMobile} className={({isActive}) => isActive ? 'sidebar-link active' : 'sidebar-link'} end>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                Statistik Panel
              </NavLink>
              <NavLink to="/admin/approval" onClick={closeSidebarOnMobile} className={({isActive}) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Approval Reservasi
              </NavLink>
              <NavLink to="/admin/users" onClick={closeSidebarOnMobile} className={({isActive}) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Data Karyawan
              </NavLink>
              <NavLink to="/admin/rooms" onClick={closeSidebarOnMobile} className={({isActive}) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                Kelola Ruangan
              </NavLink>
              <NavLink to="/admin/kiosks" onClick={closeSidebarOnMobile} className={({isActive}) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                Manajemen Kiosk
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem', display: 'block' }}>{user?.namaLengkap}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.email}</span>
               </div>
               <span className="brutal-badge" style={{ background: user?.role === 'ADMIN' ? 'var(--primary)' : 'var(--badge-bg)', color: user?.role === 'ADMIN' ? '#fff' : 'var(--text-main)', fontSize: '0.6rem', boxShadow: 'none', border: '1px solid var(--border)' }}>
                  {user?.role}
               </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={toggleTheme} className="btn" style={{ background: 'var(--badge-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button onClick={handleLogout} className="btn" style={{ flex: 1, background: 'var(--badge-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem', gap: '0.5rem' }}>
              {isLoggingOut ? (
                 <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid var(--border)', borderTopColor: 'var(--text-main)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
              ) : (
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              )}
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <div className="content-wrapper">
        <main className="main-content animate-fade-in-up">
          <Outlet />
        </main>
      </div>
      
    </div>
  );
}