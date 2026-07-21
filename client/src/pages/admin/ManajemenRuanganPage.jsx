import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ManajemenRuanganPage() {
  const [rooms, setRooms] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [roomFormData, setRoomFormData] = useState({ id: null, nama: '', kapasitas: '', deskripsi: '' });

  const fetchData = async () => {
    try {
      const resRooms = await api.get('/admin/rooms');
      setRooms(resRooms.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleToggleRoomStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    try {
      await api.put(`/admin/rooms/${id}/status`, { status: nextStatus });
      fetchData();
    } catch (err) { 
      alert('Gagal mengubah status ruangan.'); 
    }
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      if (isEditingRoom) {
        await api.put(`/admin/rooms/${roomFormData.id}`, roomFormData);
        alert('Ruangan berhasil diperbarui.');
      } else {
        await api.post('/admin/rooms', roomFormData);
        alert('Ruangan berhasil ditambahkan.');
      }
      setShowRoomModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data ruangan.');
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Yakin ingin menghapus ruangan ini? Aksi ini tidak dapat dibatalkan.')) return;
    try {
      await api.delete(`/admin/rooms/${id}`);
      alert('Ruangan berhasil dihapus.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus ruangan.');
    }
  };

  const handleEditRoomClick = (room) => {
    setRoomFormData({ id: room.id, nama: room.nama, kapasitas: room.kapasitas, deskripsi: room.deskripsi || '' });
    setIsEditingRoom(true);
    setShowRoomModal(true);
  };

  const handleAddRoomClick = () => {
    setRoomFormData({ id: null, nama: '', kapasitas: '', deskripsi: '' });
    setIsEditingRoom(false);
    setShowRoomModal(true);
  };

  return (
    <div>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--text-main)' }}>Manajemen Ruangan</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Kelola kapasitas, fasilitas, dan status operasional ruang rapat gedung.</p>
        </div>
        <button 
          onClick={handleAddRoomClick} 
          className="btn btn-primary" 
          style={{ fontWeight: '700', padding: '0.6rem 1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tambah Ruangan
        </button>
      </div>

      {/* OPERATIONAL INFORMATION CARD */}
      <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </div>
        <div>
          <h4 style={{ color: 'var(--text-main)', margin: '0 0 0.25rem 0', fontWeight: 700 }}>Informasi Manajemen Aset</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>Gedung ini secara permanen memiliki Ruang Rapat Utama. Anda berhak merubah status operasional menjadi masa perbaikan (Maintenance) jika ruangan sedang tidak dapat digunakan.</p>
        </div>
      </div>

      {/* TABLE DATA RUANGAN */}
      <div className="brutal-card" style={{ overflowX: 'auto', background: 'var(--bg-surface)', borderRadius: '12px' }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-card)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nama Ruangan</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Kapasitas</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Deskripsi & Fasilitas</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Kontrol Operasional</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem' }}><strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>{r.nama}</strong></td>
                <td style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{r.kapasitas} Orang</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.deskripsi || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  <span 
                    className="badge" 
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: r.status === 'ACTIVE' ? '#E8F5E9' : '#FFEBEE', 
                      color: r.status === 'ACTIVE' ? '#2E7D32' : '#C62828',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.03em'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.status === 'ACTIVE' ? '#4CAF50' : '#F44336' }}></span>
                    {r.status === 'ACTIVE' ? 'SIAP PAKAI' : 'MAINTENANCE'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleToggleRoomStatus(r.id, r.status)} 
                      className="btn" 
                      style={{ 
                        background: r.status === 'ACTIVE' ? '#FFF5F5' : '#E8F5E9', 
                        color: r.status === 'ACTIVE' ? '#E53935' : '#2E7D32', 
                        border: r.status === 'ACTIVE' ? '1px solid #FFCDD2' : '1px solid #C8E6C9',
                        padding: '0.45rem 0.85rem', 
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {r.status === 'ACTIVE' ? 'Set Perbaikan' : 'Aktifkan'}
                    </button>
                    <button 
                      onClick={() => handleEditRoomClick(r)}
                      className="btn"
                      style={{ 
                        background: '#EEF2FF', 
                        color: '#4F46E5', 
                        border: '1px solid #E0E7FF',
                        padding: '0.45rem 0.85rem', 
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteRoom(r.id)}
                      className="btn"
                      style={{ 
                        background: '#FFF5F5', 
                        color: '#E53935', 
                        border: '1px solid #FFCDD2',
                        padding: '0.45rem 0.85rem', 
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Belum ada data ruangan yang terdaftar di dalam sistem.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CRUD RUANGAN */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
                {isEditingRoom ? 'Ubah Informasi Ruangan' : 'Tambah Ruangan Baru'}
              </h3>
              <button className="modal-close" onClick={() => setShowRoomModal(false)} style={{ fontSize: '1.3rem', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <form onSubmit={handleSaveRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Nama Ruangan</label>
                  <input type="text" className="form-input" value={roomFormData.nama} onChange={e => setRoomFormData({...roomFormData, nama: e.target.value})} required placeholder="Contoh: Ruang Rapat Melati" style={{ width: '100%' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Kapasitas (Orang)</label>
                  <input type="number" className="form-input" value={roomFormData.kapasitas} onChange={e => setRoomFormData({...roomFormData, kapasitas: e.target.value})} required min="1" placeholder="Contoh: 15" style={{ width: '100%' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Deskripsi / Fasilitas (Opsional)</label>
                  <textarea className="form-input" rows="3" value={roomFormData.deskripsi} onChange={e => setRoomFormData({...roomFormData, deskripsi: e.target.value})} placeholder="Contoh: Proyektor, Smart TV, AC, Papan Tulis Glasstone" style={{ width: '100%', resize: 'vertical' }}></textarea>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn" onClick={() => setShowRoomModal(false)} style={{ flex: 1, padding: '0.75rem', fontWeight: 600 }}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.75rem', fontWeight: 700 }}>
                    {isEditingRoom ? 'Simpan Perubahan' : 'Tambahkan Ruang'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}