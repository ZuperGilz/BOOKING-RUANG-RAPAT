import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
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
    <div className="animate-fade-in-up stagger-1" style={{ maxWidth: '650px', margin: '0 auto', position: 'relative' }}>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} colors={['#dc2626', '#b91c1c', '#fca5a5', '#ffffff']} style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }} />}

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
         <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Formulir Reservasi</h2>
         <p style={{ color: 'var(--text-muted)' }}>Silakan isi detail rapat Anda di bawah ini.</p>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem', position: 'relative' }}>
        
        {/* Glow accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', borderRadius: '24px 24px 0 0' }}></div>

        {/* Info: tanggal diisi dari kalender */}
        {searchParams.get('tanggal') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '0.6rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#6ee7b7' }}>
            <span>📅</span>
            <span>Tanggal diisi otomatis dari kalender: <strong>{new Date(searchParams.get('tanggal')).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
          </div>
        )}

        {error && <div className="alert alert-error animate-fade-in">{error}</div>}
        {success && <div className="alert alert-success animate-fade-in">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          
          <div style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
             <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--primary)' }}>✦</span> Informasi Ruangan
             </h4>
             <div className="form-group" style={{ marginBottom: 0 }}>
               <label className="form-label">Pilih Ruangan</label>
               <select className="form-input" value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} required style={{ background: 'var(--badge-bg)' }}>
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
          
          {user?.role === 'ADMIN' && (
            <div style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
               <h4 style={{ color: '#fcd34d', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>👑</span> Khusus Admin
               </h4>
               <div className="form-group" style={{ marginBottom: 0 }}>
                 <label className="form-label">Pilih Pemesan (Karyawan)</label>
                 <select className="form-input" value={formData.targetUserId} onChange={e => setFormData({...formData, targetUserId: e.target.value})} style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
                   <option value="" style={{ color: 'var(--text-inverse)' }}>-- Dipesan oleh saya sendiri (Admin) --</option>
                   {usersList.map(u => (
                     <option key={u.id} value={u.id} style={{ color: 'var(--text-inverse)' }}>{u.nama_lengkap || u.namaLengkap} - {u.email}</option>
                   ))}
                 </select>
                 <small style={{ color: '#fcd34d', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block', opacity: 0.8 }}>
                   Sebagai admin, Anda dapat membuat pesanan atas nama karyawan lain.
                 </small>
               </div>
            </div>
          )}

          <div style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
             <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--primary)' }}>✦</span> Jadwal
             </h4>
             <div className="form-group">
               <label className="form-label">Tanggal</label>
               <input type="date" className="form-input" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} required style={{ background: 'var(--badge-bg)' }} />
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div className="form-group" style={{ marginBottom: 0 }}>
                 <label className="form-label">Jam Mulai</label>
                 <input type="time" className="form-input" value={formData.jamMulai} onChange={e => setFormData({...formData, jamMulai: e.target.value})} required style={{ background: 'var(--badge-bg)' }} />
               </div>
               <div className="form-group" style={{ marginBottom: 0 }}>
                 <label className="form-label">Jam Selesai</label>
                 <input type="time" className="form-input" value={formData.jamSelesai} onChange={e => setFormData({...formData, jamSelesai: e.target.value})} required style={{ background: 'var(--badge-bg)' }} />
               </div>
             </div>
          </div>

          <div>
             <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--primary)' }}>✦</span> Detail Acara
             </h4>
             <div className="form-group">
               <label className="form-label">Agenda</label>
               <input type="text" className="form-input" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} required placeholder="Contoh: Meeting Bulanan Divisi IT" style={{ background: 'var(--badge-bg)' }} />
             </div>
             <div className="form-group">
               <label className="form-label">Nama Pemateri / Narasumber (Opsional)</label>
               <input type="text" className="form-input" placeholder="Kosongkan jika tidak ada" value={formData.pemateri} onChange={e => setFormData({...formData, pemateri: e.target.value})} style={{ background: 'var(--badge-bg)' }} />
             </div>
             <div className="form-group">
               <label className="form-label">Jumlah Peserta</label>
               <input type="number" className="form-input" value={formData.jumlahPeserta} onChange={e => setFormData({...formData, jumlahPeserta: e.target.value})} required min="1" style={{ background: 'var(--badge-bg)' }} />
             </div>
             <div className="form-group">
               <label className="form-label">Catatan Tambahan (Opsional)</label>
               <textarea className="form-input" rows="3" value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} placeholder="Keperluan tambahan seperti snack, dll." style={{ background: 'var(--badge-bg)', resize: 'vertical' }} />
             </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', fontSize: '1.1rem' }} disabled={isLoading}>
            {isLoading ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  Memproses...
               </div>
            ) : 'Ajukan Reservasi'}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>
      </div>
    </div>
  );
}