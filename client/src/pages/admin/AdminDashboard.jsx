import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ pendingCount: 0, totalUsers: 0, totalRooms: 0 });
  const [recentPending, setRecentPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [pendingRes, usersRes, roomsRes] = await Promise.all([
          api.get('/admin/bookings/pending'),
          api.get('/admin/users'),
          api.get('/admin/rooms')
        ]);
        setStats({
          pendingCount: pendingRes.data.length,
          totalUsers: usersRes.data.length,
          totalRooms: roomsRes.data.length
        });
        setRecentPending(pendingRes.data.slice(0, 5));
      } catch (err) { 
        console.error(err); 
      } finally {
        setTimeout(() => setLoading(false), 300); 
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      {/* TITLE HEAD */}
      <div style={{ marginBottom: '2rem' }} className="animate-fade-in-up stagger-1">
        <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', margin: 0 }}>Administrator Hub</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Ringkasan operasional dan kendali sistem reservasi ruang rapat Semen Padang.</p>
      </div>

      {/* 3 STAT CARDS (Bento Grid) */}
      <div className="bento-grid animate-fade-in-up stagger-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Antrean Pending */}
        <div className="brutal-card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.03)', boxShadow: 'none' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Antrean Pending</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--text-main)', lineHeight: 1 }}>
                 {loading ? <div className="skeleton" style={{width:'50px', height:'40px'}}></div> : stats.pendingCount}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: 'rgba(245,158,11,0.12)', color: '#D97706', borderRadius: '10px', display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
          </div>
          <Link to="/admin/approval" style={{ fontSize: '0.85rem', color: '#D97706', textDecoration: 'none', fontWeight: '700', marginTop: '1rem', display: 'inline-block' }}>Lihat Antrean / Reservasi →</Link>
        </div>

        {/* Total Karyawan */}
        <div className="brutal-card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-surface)', boxShadow: 'none' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Karyawan</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--text-main)', lineHeight: 1 }}>
                 {loading ? <div className="skeleton" style={{width:'50px', height:'40px'}}></div> : stats.totalUsers}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: '#EEF2FF', color: '#4F46E5', borderRadius: '10px', display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          <Link to="/admin/users" style={{ fontSize: '0.85rem', color: '#4F46E5', textDecoration: 'none', fontWeight: '700', marginTop: '1rem', display: 'inline-block' }}>Kelola Karyawan →</Link>
        </div>

        {/* Total Ruangan */}
        <div className="brutal-card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #10B981', background: 'rgba(16,185,129,0.02)', boxShadow: 'none' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ruang Rapat</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--text-main)', lineHeight: 1 }}>
                 {loading ? <div className="skeleton" style={{width:'50px', height:'40px'}}></div> : stats.totalRooms}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: '#E8F5E9', color: '#2E7D32', borderRadius: '10px', display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </div>
          </div>
          <Link to="/admin/rooms" style={{ fontSize: '0.85rem', color: '#2E7D32', textDecoration: 'none', fontWeight: '700', marginTop: '1rem', display: 'inline-block' }}>Cek Status Ruang →</Link>
        </div>

      </div>

      {/* LOWER SECTION */}
      <div className="bento-grid animate-fade-in-up stagger-3" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* ANTREAN TERBARU LIST */}
        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Antrean Terbaru</h3>
            <Link to="/admin/approval" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Lihat Semua</Link>
          </div>
          
          {loading ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="skeleton" style={{height: '60px', borderRadius: '8px'}}></div>
                <div className="skeleton" style={{height: '60px', borderRadius: '8px'}}></div>
                <div className="skeleton" style={{height: '60px', borderRadius: '8px'}}></div>
             </div>
          ) : recentPending.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border)', fontSize: '0.9rem', fontWeight: 500 }}>
              Tidak ada antrean approval saat ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentPending.map(p => (
                <div key={p.id} className="flex-between" style={{ padding: '0.85rem 1rem', background: 'var(--bg-body)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '0.15rem' }}>{p.nama_lengkap}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{p.nama_ruangan} — {p.tanggal?.substring(0,10)} ({p.jam_mulai})</div>
                  </div>
                  <span className="brutal-badge" style={{ background: '#FFF9DB', color: '#B45309', borderColor: '#FFE066', boxShadow: 'none', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>PENDING</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QUICK ACTIONS & STATUS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* AKSI CEPAT CARD */}
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-main)', margin: 0 }}>Aksi Cepat</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <Link to="/admin/users" className="brutal-card" style={{ display: 'flex', alignItems: 'center', padding: '0.85rem 1rem', color: 'var(--text-main)', textDecoration: 'none', background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none', transition: 'all 0.2s' }}>
                <span style={{ marginRight: '0.75rem', display: 'flex', color: 'var(--primary)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                </span> 
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tambah Karyawan</span>
              </Link>
              <Link to="/admin/rooms" className="brutal-card" style={{ display: 'flex', alignItems: 'center', padding: '0.85rem 1rem', color: 'var(--text-main)', textDecoration: 'none', background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none', transition: 'all 0.2s' }}>
                <span style={{ marginRight: '0.75rem', display: 'flex', color: 'var(--primary)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </span> 
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Kelola Ruangan</span>
              </Link>
            </div>
          </div>
          
          {/* STATUS SISTEM CARD */}
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Status Sistem</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4CAF50', display: 'inline-block', boxShadow: '0 0 10px #4CAF50' }}></span>
              Semua layanan berjalan normal
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}