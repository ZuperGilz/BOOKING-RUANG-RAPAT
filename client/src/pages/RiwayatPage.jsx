import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function RiwayatPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsList, setRoomsList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('CREATED_DESC'); // default
  const itemsPerPage = 10;

  const fetchMyHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my-history');
      setHistory(res.data);
    } catch (err) { 
      console.error(err); 
    } finally {
      setTimeout(() => setLoading(false), 300); // Purposeful delay
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get('/bookings/rooms');
      setRoomsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyHistory();
    fetchRooms();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan jadwal rapat ini?')) return;
    try {
      const res = await api.put(`/bookings/${id}/cancel`);
      alert(res.data.message);
      fetchMyHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membatalkan booking.');
    }
  };

  const handleEditClick = (booking) => {
    setEditData({
      id: booking.id,
      roomId: booking.room_id,
      tanggal: booking.tanggal.split('T')[0],
      jamMulai: booking.jam_mulai.substring(0, 5),
      jamSelesai: booking.jam_selesai.substring(0, 5),
      agenda: booking.agenda,
      pemateri: booking.pemateri || '',
      jumlahPeserta: booking.jumlah_peserta,
      catatan: booking.catatan || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...editData, roomId: parseInt(editData.roomId), jumlahPeserta: parseInt(editData.jumlahPeserta) };
      const res = await api.put(`/bookings/${editData.id}`, payload);
      alert(res.data.message);
      setShowEditModal(false);
      fetchMyHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengedit booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCompleted = (tanggal, jamSelesai) => {
    if (!tanggal || !jamSelesai) return false;
    const datePart = tanggal.split('T')[0];
    const endDateTime = new Date(`${datePart}T${jamSelesai}`);
    return endDateTime < new Date();
  };

  const getStatusStyle = (status, isSelesai) => {
    if (isSelesai && (status === 'APPROVED' || status === 'PENDING')) {
      return { background: 'rgba(156,163,175,0.1)', color: '#9ca3af', borderColor: '#6b7280' };
    }
    const styles = {
      APPROVED: { background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', borderColor: 'var(--success)' },
      PENDING: { background: 'rgba(245,158,11,0.1)', color: '#fcd34d', borderColor: 'var(--warning)' },
      CANCELLED: { background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderColor: 'var(--danger)' },
      REJECTED: { background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderColor: 'var(--danger)' }
    };
    return styles[status] || { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', borderColor: 'rgba(255,255,255,0.2)' }; 
  };

  const sortedHistory = [...history].sort((a, b) => {
    if (sortBy === 'CREATED_DESC') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'CREATED_ASC') return new Date(a.created_at) - new Date(b.created_at);
    
    const dateA = new Date(`${a.tanggal?.split('T')[0]}T${a.jam_mulai}`);
    const dateB = new Date(`${b.tanggal?.split('T')[0]}T${b.jam_mulai}`);
    if (sortBy === 'DATE_DESC') return dateB - dateA;
    if (sortBy === 'DATE_ASC') return dateA - dateB;
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedHistory.length / itemsPerPage);

  // Reset page when sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  return (
    <div className="animate-fade-in-up stagger-1">
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Riwayat Reservasi Anda</h2>
          <p style={{ color: 'var(--text-muted)' }}>Pantau status persetujuan dari semua reservasi yang pernah Anda ajukan.</p>
        </div>
        
        <div className="glass-card" style={{ padding: '0.75rem', borderRadius: '12px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Urutkan:</span>
          <select 
            className="form-input" 
            style={{ width: '200px', marginBottom: 0, background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="CREATED_DESC" style={{color: 'var(--text-inverse)'}}>Waktu Buat (Terbaru)</option>
            <option value="CREATED_ASC" style={{color: 'var(--text-inverse)'}}>Waktu Buat (Terlama)</option>
            <option value="DATE_DESC" style={{color: 'var(--text-inverse)'}}>Tanggal Jadwal (Terjauh)</option>
            <option value="DATE_ASC" style={{color: 'var(--text-inverse)'}}>Tanggal Jadwal (Terdekat)</option>
          </select>
        </div>
      </div>

      <div className="glass-card stagger-2" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
           <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Array.from({length: 4}).map((_, i) => (
                 <div key={i} className="skeleton" style={{ height: '60px', width: '100%' }}></div>
              ))}
           </div>
        ) : (
          <>
            <table className="custom-table" style={{ width: '100%', minWidth: '800px' }}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Ruangan</th>
                  <th>Waktu</th>
                  <th>Agenda</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'transparent' }}>
                      <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}>📜</div>
                      <div style={{ color: 'var(--text-muted)' }}>Belum ada riwayat reservasi ruangan.</div>
                    </td>
                  </tr>
                ) : currentItems.map(h => {
                  const selesai = isCompleted(h.tanggal, h.jam_selesai);
                  const canEdit = (h.status === 'PENDING' || h.status === 'APPROVED') && !selesai;

                  return (
                    <tr key={h.id}>
                      <td style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                        {h.tanggal ? new Date(h.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                      </td>
                      <td>
                        <span className="brutal-badge" style={{ background: 'var(--badge-bg)', boxShadow: 'none', border: '1px solid var(--badge-border)' }}>
                          {h.nama_ruangan}
                        </span>
                      </td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{h.jam_mulai} - {h.jam_selesai}</td>
                      <td style={{ color: 'var(--text-main)', fontWeight: 600 }}>{h.agenda}</td>
                      <td>
                        <span className="brutal-badge" style={{ ...getStatusStyle(h.status, selesai), boxShadow: 'none' }}>
                          {selesai && (h.status === 'APPROVED' || h.status === 'PENDING') ? 'SELESAI' : h.status}
                        </span>
                      </td>
                      <td>
                        {canEdit ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEditClick(h)} className="btn btn-outline-glass" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.1)' }}>
                              Edit
                            </button>
                            <button onClick={() => handleCancelBooking(h.id)} className="btn btn-outline-glass" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)' }}>
                              Batalkan
                            </button>
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, history.length)} dari {history.length} data
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="btn btn-outline-glass" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    Sebelumnya
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                    className="btn btn-outline-glass" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showEditModal && editData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Edit Jadwal Rapat</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Ruangan</label>
                <select className="form-input" value={editData.roomId} onChange={e => setEditData({...editData, roomId: e.target.value})} required>
                  {roomsList.map(r => (
                    <option key={r.id} value={r.id}>{r.nama}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal</label>
                <input type="date" className="form-input" value={editData.tanggal} onChange={e => setEditData({...editData, tanggal: e.target.value})} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Jam Mulai</label>
                  <input type="time" className="form-input" value={editData.jamMulai} onChange={e => setEditData({...editData, jamMulai: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Selesai</label>
                  <input type="time" className="form-input" value={editData.jamSelesai} onChange={e => setEditData({...editData, jamSelesai: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Agenda</label>
                <input type="text" className="form-input" value={editData.agenda} onChange={e => setEditData({...editData, agenda: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah Peserta</label>
                <input type="number" className="form-input" value={editData.jumlahPeserta} onChange={e => setEditData({...editData, jumlahPeserta: e.target.value})} required min="1" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline-glass" style={{ flex: 1 }}>Tutup</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Jika Anda mengubah jadwal yang sudah APPROVED, statusnya akan kembali menjadi PENDING.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}