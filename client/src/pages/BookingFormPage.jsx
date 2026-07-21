import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Confetti from 'react-confetti';

export default function BookingFormPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Ambil tanggal dari query param (kalender dashboard) atau gunakan hari ini
  const prefilledDate = searchParams.get('tanggal') || new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    roomId: '', tanggal: prefilledDate,
    jamMulai: '08:00', jamSelesai: '09:00', agenda: '', pemateri: '', jumlahPeserta: '', catatan: '',
    targetUserId: ''
  });

  useEffect(() => {
    api.get('/bookings/rooms')
      .then(res => {
        setRoomsList(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, roomId: res.data[0].id.toString() }));
        }
      })
      .catch(err => console.error(err));

    if (user?.role === 'ADMIN') {
      api.get('/admin/users')
        .then(res => setUsersList(res.data.filter(u => u.status === 'ACTIVE')))
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);
    
    try {
      const payload = { 
        ...formData, 
        roomId: parseInt(formData.roomId), 
        jumlahPeserta: parseInt(formData.jumlahPeserta),
        targetUserId: user?.role === 'ADMIN' && formData.targetUserId ? parseInt(formData.targetUserId) : user?.id
      };
      const res = await api.post('/bookings', payload);
      
      setSuccess(res.data.message);
      setShowConfetti(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengajukan booking.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
      {showConfetti && (
        <Confetti 
          width={window.innerWidth} 
          height={window.innerHeight} 
          recycle={false} 
          numberOfPieces={200} 
          colors={['#dc2626', '#b91c1c', '#fca5a5', '#ffffff']} 
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }} 
        />
      )}

      {/* HEADER TITLE */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
         <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', margin: 0 }}>Formulir Reservasi</h2>
         <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Silakan isi detail rapat Anda di bawah ini dengan lengkap.</p>
      </div>

      {/* FORM CONTAINER CARD */}
      <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '16px', position: 'relative', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        
        {/* Glow Top Accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', borderRadius: '16px 16px 0 0' }}></div>

        {/* Info Prefilled Date */}
        {searchParams.get('tanggal') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: '10px', padding: '0.6rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#2E7D32', fontWeight: 500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>Tanggal otomatis dari kalender: <strong>{new Date(searchParams.get('tanggal')).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
        {success && (
          <div className="alert" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SEKSI RUANGAN */}
          <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
             <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--primary)' }}>✦</span> Informasi Ruangan
             </h4>
             <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pilih Ruangan</label>
                <select className="form-input" value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} required style={{ width: '100%', fontWeight: 600 }}>
                  {roomsList.length === 0 ? (
                    <option value="">-- Tidak ada ruangan aktif --</option>
                  ) : (
                    roomsList.map(r => (
                      <option key={r.id} value={r.id} style={{ color: 'var(--text-inverse)' }}>{r.nama} (Maks {r.kapasitas} Orang)</option>
                    ))
                  )}
                </select>
             </div>
          </div>
          
          {/* SEKSI KHUSUS ADMIN */}
          {user?.role === 'ADMIN' && (
            <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
               <h4 style={{ color: '#D97706', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                  Khusus Administrator
               </h4>
               <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pilih Pemesan (Karyawan)</label>
                  <select className="form-input" value={formData.targetUserId} onChange={e => setFormData({...formData, targetUserId: e.target.value})} style={{ width: '100%', background: 'rgba(245,158,11,0.02)', borderColor: 'rgba(245,158,11,0.2)', fontWeight: 600 }}>
                    <option value="" style={{ color: 'var(--text-inverse)' }}>-- Dipesan oleh saya sendiri (Admin) --</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id} style={{ color: 'var(--text-inverse)' }}>{u.nama_lengkap || u.namaLengkap} - {u.email}</option>
                    ))}
                  </select>
                  <small style={{ color: '#B45309', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block', fontWeight: 500 }}>
                    Sebagai administrator sistem, Anda diberikan hak khusus untuk mengajukan reservasi atas nama akun karyawan lain.
                  </small>
               </div>
            </div>
          )}

          {/* SEKSI JADWAL WAKTU */}
          <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
             <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--primary)' }}>✦</span> Pemilihan Jadwal
             </h4>
             <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tanggal Pelaksanaan</label>
                <input type="date" className="form-input" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} required style={{ width: '100%' }} />
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jam Mulai</label>
                  <input type="time" className="form-input" value={formData.jamMulai} onChange={e => setFormData({...formData, jamMulai: e.target.value})} required style={{ width: '100%' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jam Selesai</label>
                  <input type="time" className="form-input" value={formData.jamSelesai} onChange={e => setFormData({...formData, jamSelesai: e.target.value})} required style={{ width: '100%' }} />
                </div>
             </div>
          </div>

          {/* SEKSI DETAIL ACARA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--primary)' }}>✦</span> Detail & Deskripsi Acara
             </h4>
             <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Agenda Rapat</label>
                <input type="text" className="form-input" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} required placeholder="Contoh: Pembahasan RKAP Tahunan" style={{ width: '100%' }} />
             </div>
             <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Pemateri / Narasumber (Opsional)</label>
                <input type="text" className="form-input" placeholder="Kosongkan jika tidak diperlukan" value={formData.pemateri} onChange={e => setFormData({...formData, pemateri: e.target.value})} style={{ width: '100%' }} />
              </div>
             <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jumlah Estimasi Peserta</label>
                <input type="number" className="form-input" value={formData.jumlahPeserta} onChange={e => setFormData({...formData, jumlahPeserta: e.target.value})} required min="1" placeholder="Masukkan jumlah orang" style={{ width: '100%' }} />
             </div>
             <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catatan Tambahan (Opsional)</label>
                <textarea className="form-input" rows="3" value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} placeholder="Keperluan logistik tambahan seperti mic wireless, proyektor, layout meja, dll." style={{ width: '100%', resize: 'vertical' }} />
             </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 700, borderRadius: '8px' }} disabled={isLoading}>
            {isLoading ? (
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  Memproses Reservasi...
               </div>
            ) : 'Ajukan Reservasi Ruangan'}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>
      </div>
    </div>
  );
}