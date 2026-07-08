import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ApprovalPage() {
  const [allBookings, setAllBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('CREATED_DESC'); // default
  const [loading, setLoading] = useState(true);
  
  const [roomsList, setRoomsList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchApprovalData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bookings/all');
      setAllBookings(res.data);
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
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    fetchApprovalData(); 
    fetchRooms();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await api.put(`/admin/bookings/${id}/approve`);
      alert(res.data.message);
      fetchApprovalData();
    } catch (err) { alert('Gagal memproses approval.'); }
  };

  const handleReject = async (id) => {
    const alasan = prompt('Masukkan alasan penolakan rapat:');
    if (!alasan) return;
    try {
      const res = await api.put(`/admin/bookings/${id}/reject`, { alasanReject: alasan });
      alert(res.data.message);
      fetchApprovalData();
    } catch (err) { alert('Gagal menolak booking.'); }
  };

  const handleCancel = async (id) => {
    const alasan = prompt('Masukkan alasan pembatalan rapat (Wajib untuk Admin):');
    if (!alasan) return;
    try {
      const res = await api.put(`/bookings/${id}/cancel`, { alasanCancel: alasan });
      alert(res.data.message);
      fetchApprovalData();
    } catch (err) { alert(err.response?.data?.message || 'Gagal membatalkan booking.'); }
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
      fetchApprovalData();
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

  const filteredBookings = allBookings.filter(b => {
    const matchSearch =
      b.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nama_ruangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.agenda.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
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
  const currentItems = sortedBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);

  // Reset page when filter or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return alert('Tidak ada data untuk diexport.');
    
    const headers = ['ID', 'Pemesan', 'Departemen/No HP', 'Ruangan', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Agenda', 'Status'];
    const rows = filteredBookings.map(b => {
      const tanggal = b.tanggal ? b.tanggal.split('T')[0] : '';
      return [
        b.id,
        `"${b.nama_lengkap}"`,
        `"${b.no_telp || ''}"`,
        `"${b.nama_ruangan}"`,
        tanggal,
        b.jam_mulai,
        b.jam_selesai,
        `"${b.agenda}"`,
        b.status
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Booking_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex-between stagger-1" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Approval Reservasi</h2>
          <p style={{ color: 'var(--text-muted)' }}>Melihat seluruh riwayat booking. Antrean pending berada di posisi teratas.</p>
        </div>
        
        <div className="glass-card" style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
             <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
             <input
               type="text"
               placeholder="Cari nama, ruangan, agenda..."
               className="form-input"
               style={{ width: '280px', marginBottom: 0, paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.05)' }}
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
          </div>
          <select
            className="form-input"
            style={{ width: '160px', marginBottom: 0, background: 'rgba(255,255,255,0.05)' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL" style={{color: 'var(--text-inverse)'}}>Semua Status</option>
            <option value="PENDING" style={{color: 'var(--text-inverse)'}}>Pending</option>
            <option value="APPROVED" style={{color: 'var(--text-inverse)'}}>Disetujui</option>
            <option value="REJECTED" style={{color: 'var(--text-inverse)'}}>Ditolak</option>
            <option value="CANCELLED" style={{color: 'var(--text-inverse)'}}>Dibatalkan</option>
          </select>

          <select 
            className="form-input" 
            style={{ width: '190px', marginBottom: 0, background: 'rgba(255,255,255,0.05)' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="CREATED_DESC" style={{color: 'var(--text-inverse)'}}>Waktu Buat (Terbaru)</option>
            <option value="CREATED_ASC" style={{color: 'var(--text-inverse)'}}>Waktu Buat (Terlama)</option>
            <option value="DATE_DESC" style={{color: 'var(--text-inverse)'}}>Tanggal Jadwal (Terjauh)</option>
            <option value="DATE_ASC" style={{color: 'var(--text-inverse)'}}>Tanggal Jadwal (Terdekat)</option>
          </select>

          <button onClick={handleExportCSV} className="btn btn-outline-glass" style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📄</span> Export CSV
          </button>
        </div>
      </div>

      <div className="glass-card stagger-2" style={{ padding: '0', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {Array.from({length: 5}).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '60px', width: '100%' }}></div>
             ))}
          </div>
        ) : (
          <>
            <table className="custom-table" style={{ width: '100%', minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>Pemesan</th>
                  <th>Ruangan</th>
                  <th>Waktu</th>
                  <th>Agenda</th>
                  <th>Status / Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'transparent' }}>
                      <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}>📭</div>
                      <div style={{ color: 'var(--text-muted)' }}>Tidak ada riwayat reservasi yang cocok.</div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map(p => {
                    const selesai = isCompleted(p.tanggal, p.jam_selesai);
                    const canEdit = (p.status === 'PENDING' || p.status === 'APPROVED') && !selesai;

                    return (
                      <tr key={p.id}>
                        <td>
                          <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '1.05rem', marginBottom: '0.25rem' }}>{p.nama_lengkap}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.no_telp || '-'}</span>
                        </td>
                        <td>
                          <span className="brutal-badge" style={{ background: 'var(--badge-bg)', boxShadow: 'none', border: '1px solid var(--badge-border)' }}>
                            {p.nama_ruangan}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {p.tanggal ? new Date(p.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                          </span>
                          <br />
                          <small style={{ color: 'var(--primary)', fontWeight: 600 }}>{p.jam_mulai} - {p.jam_selesai}</small>
                        </td>
                        <td style={{ color: 'var(--text-main)', maxWidth: '250px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.agenda}</div>
                        </td>
                        <td>
                          {p.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button onClick={() => handleApprove(p.id)} className="brutal-card" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', borderColor: 'var(--success)', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '2px 2px 0px rgba(16,185,129,0.5)' }}>Setujui</button>
                              <button onClick={() => handleReject(p.id)} className="brutal-card" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderColor: 'var(--danger)', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '2px 2px 0px rgba(239,68,68,0.5)' }}>Tolak</button>
                              <button onClick={() => handleEditClick(p)} className="brutal-card" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', borderColor: 'var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '2px 2px 0px rgba(96,165,250,0.5)' }}>Edit</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                              <span className="brutal-badge" style={{
                                background: (selesai && p.status === 'APPROVED') ? 'rgba(156,163,175,0.1)' : p.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : (p.status === 'REJECTED' || p.status === 'CANCELLED' ? 'rgba(239,68,68,0.1)' : 'var(--badge-bg)'),
                                color: (selesai && p.status === 'APPROVED') ? '#9ca3af' : p.status === 'APPROVED' ? '#6ee7b7' : (p.status === 'REJECTED' || p.status === 'CANCELLED' ? '#fca5a5' : 'var(--text-muted)'),
                                borderColor: (selesai && p.status === 'APPROVED') ? '#6b7280' : p.status === 'APPROVED' ? 'var(--success)' : (p.status === 'REJECTED' || p.status === 'CANCELLED' ? 'var(--danger)' : 'var(--badge-border)'),
                                boxShadow: 'none'
                              }}>
                                {(selesai && p.status === 'APPROVED') ? 'SELESAI' : p.status}
                              </span>
                              {canEdit && p.status === 'APPROVED' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={() => handleEditClick(p)} className="btn btn-outline-glass" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)' }}>Edit</button>
                                  <button onClick={() => handleCancel(p.id)} className="btn btn-outline-glass" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}>Batal</button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBookings.length)} dari {filteredBookings.length} data
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
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Edit Jadwal Rapat (Admin)</h3>
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}