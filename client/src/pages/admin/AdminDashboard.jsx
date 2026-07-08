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
        setTimeout(() => setLoading(false), 300); // Purposeful delay
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }} className="animate-fade-in-up stagger-1">
        <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Administrator Hub</h2>
        <p style={{ color: 'var(--text-muted)' }}>Ringkasan operasional dan kendali sistem reservasi ruang rapat Semen Padang.</p>
      </div>

      {/* 4 STAT CARDS (Bento Grid) */}
      <div className="bento-grid animate-fade-in-up stagger-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        <div className="brutal-card" style={{ padding: '1.5rem', borderColor: 'var(--warning)', boxShadow: '4px 4px 0px rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.05)' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Antrean Pending</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0', color: 'var(--text-main)', lineHeight: 1 }}>
                 {loading ? <div className="skeleton" style={{width:'50px', height:'40px'}}></div> : stats.pendingCount}
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.15)', color: '#fcd34d', borderRadius: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
          </div>
          <Link to="/admin/approval" style={{ fontSize: '0.85rem', color: '#fcd34d', textDecoration: 'none', fontWeight: '600', marginTop: '1rem', display: 'inline-block' }}>Lihat Antrean / Reservasi →</Link>
        </div>

        <div className="brutal-card" style={{ padding: '1.5rem', borderColor: 'var(--primary)', background: 'rgba(220,38,38,0.05)' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Karyawan</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0', color: 'var(--text-main)', lineHeight: 1 }}>
                 {loading ? <div className="skeleton" style={{width:'50px', height:'40px'}}></div> : stats.totalUsers}
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--primary-light)', color: '#fca5a5', borderRadius: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          <Link to="/admin/users" style={{ fontSize: '0.85rem', color: '#fca5a5', textDecoration: 'none', fontWeight: '600', marginTop: '1rem', display: 'inline-block' }}>Kelola Karyawan →</Link>
        </div>

        <div className="brutal-card" style={{ padding: '1.5rem', borderColor: 'var(--success)', boxShadow: '4px 4px 0px rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.05)' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ruang Rapat</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0', color: 'var(--text-main)', lineHeight: 1 }}>
                 {loading ? <div className="skeleton" style={{width:'50px', height:'40px'}}></div> : stats.totalRooms}
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', borderRadius: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </div>
          </div>
          <Link to="/admin/rooms" style={{ fontSize: '0.85rem', color: '#6ee7b7', textDecoration: 'none', fontWeight: '600', marginTop: '1rem', display: 'inline-block' }}>Cek Status Ruang →</Link>
        </div>

      </div>

      <div className="bento-grid animate-fade-in-up stagger-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
        
        {/* RECENT ACTIVITY (Liquid Glass Card) */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Antrean Terbaru</h3>
            <Link to="/admin/approval" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Lihat Semua</Link>
          </div>
          
          {loading ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="skeleton" style={{height: '60px'}}></div>
                <div className="skeleton" style={{height: '60px'}}></div>
                <div className="skeleton" style={{height: '60px'}}></div>
             </div>
          ) : recentPending.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              Tidak ada antrean approval saat ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentPending.map(p => (
                <div key={p.id} className="flex-between" style={{ padding: '1rem', background: 'var(--badge-bg)', borderRadius: '12px', border: '1px solid var(--badge-border)' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '1.05rem' }}>{p.nama_lengkap}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.nama_ruangan} — {p.tanggal?.substring(0,10)} ({p.jam_mulai})</div>
                  </div>
                  <span className="brutal-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', borderColor: 'var(--warning)', boxShadow: 'none' }}>PENDING</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QUICK ACTIONS & STATUS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>Aksi Cepat</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link to="/admin/users" className="brutal-card" style={{ display: 'flex', alignItems: 'center', padding: '1rem', color: 'var(--text-main)', textDecoration: 'none', background: 'var(--badge-bg)' }}>
                <span style={{ marginRight: '1rem', fontSize: '1.2rem' }}>➕</span> 
                <span style={{ fontWeight: 500 }}>Tambah Karyawan</span>
              </Link>
              <Link to="/admin/rooms" className="brutal-card" style={{ display: 'flex', alignItems: 'center', padding: '1rem', color: 'var(--text-main)', textDecoration: 'none', background: 'var(--badge-bg)' }}>
                <span style={{ marginRight: '1rem', fontSize: '1.2rem' }}>⚙️</span> 
                <span style={{ fontWeight: 500 }}>Kelola Ruangan</span>
              </Link>
            </div>
          </div>
          
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, var(--bg-surface) 100%)', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Status Sistem</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block', boxShadow: '0 0 12px var(--success)' }}></span>
              Semua layanan berjalan normal
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}