import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ApprovalPage() {
  const [allBookings, setAllBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('CREATED_DESC'); 
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
      setTimeout(() => setLoading(false), 300); 
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
    fetchApprovalData(); 
    fetchRooms();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await api.put(`/admin/bookings/${id}/approve`);
      alert(res.data.message);
      fetchApprovalData();
    } catch (err) { 
      alert('Gagal memproses approval.'); 
    }
  };

  const handleReject = async (id) => {
    const alasan = prompt('Masukkan alasan penolakan rapat:');
    if (!alasan) return;
    try {
      const res = await api.put(`/admin/bookings/${id}/reject`, { alasanReject: alasan });
      alert(res.data.message);
      fetchApprovalData();
    } catch (err) { 
      alert('Gagal menolak booking.'); 
    }
  };

  const handleCancel = async (id) => {
    const alasan = prompt('Masukkan alasan pembatalan rapat (Wajib untuk Admin):');
    if (!alasan) return;
    try {
      const res = await api.put(`/bookings/${id}/cancel`, { alasanCancel: alasan });
      alert(res.data.message);
      fetchApprovalData();
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
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', margin: 0 }}>Approval Reservasi</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Melihat seluruh riwayat booking. Antrean pending berada di posisi teratas.</p>
        </div>
        
        {/* FILTERS AND EXPORT */}
        <div className="glass-card" style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', borderRadius: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
             <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, display: 'flex' }}>
               <svg width="15" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="12" r="8"></circle><line x1="21" y1="22" x2="16.65" y2="17.65"></line></svg>
             </span>
             <input
               type="text"
               placeholder="Cari nama, ruangan, agenda..."
               className="form-input"
               style={{ width: '260px', marginBottom: 0, paddingLeft: '2.3rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.9rem' }}
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
          </div>
          <select
            className="form-input"
            style={{ width: '150px', marginBottom: 0, background: 'rgba(255,255,255,0.05)', fontSize: '0.9rem', fontWeight: 600 }}
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
            style={{ width: '180px', marginBottom: 0, background: 'rgba(255,255,255,0.05)', fontSize: '0.9rem', fontWeight: 600 }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="CREATED_DESC" style={{color: 'var(--text-inverse)'}}>Waktu Buat (Terbaru)</option>
            <option value="CREATED_ASC" style={{color: 'var(--text-inverse)'}}>Waktu Buat (Terlama)</option>
            <option value="DATE_DESC" style={{color: 'var(--text-inverse)'}}>Tanggal Jadwal (Terjauh)</option>
            <option value="DATE_ASC" style={{color: 'var(--text-inverse)'}}>Tanggal Jadwal (Terdekat)</option>
          </select>

          <button onClick={handleExportCSV} className="btn btn-outline-glass" style={{ padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 700, borderRadius: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div className="glass-card stagger-2" style={{ padding: '0', overflowX: 'auto', borderRadius: '12px' }}>
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {Array.from({length: 5}).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '60px', width: '100%' }}></div>
             ))}
          </div>
        ) : (
          <>
            <table className="custom-table" style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem' }}>Pemesan</th>
                  <th style={{ padding: '1rem' }}>Ruangan</th>
                  <th style={{ padding: '1rem' }}>Waktu Rapat</th>
                  <th style={{ padding: '1rem' }}>Agenda</th>
                  <th style={{ padding: '1rem' }}>Status / Kontrol Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'transparent' }}>
                      <div style={{ fontSize: '2.5rem', opacity: 0.2, marginBottom: '0.75rem' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Tidak ada riwayat reservasi yang cocok dengan kriteria.</div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map(p => {
                    const selesai = isCompleted(p.tanggal, p.jam_selesai);
                    const canEdit = (p.status === 'PENDING' || p.status === 'APPROVED') && !selesai;

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>
                          <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>{p.nama_lengkap}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{p.no_telp || '-'}</span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="brutal-badge" style={{ background: 'var(--bg-body)', boxShadow: 'none', border: '1px solid var(--border)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {p.nama_ruangan}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>
                            {p.tanggal ? new Date(p.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                          </span>
                          <br />
                          <small style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem' }}>{p.jam_mulai} - {p.jam_selesai}</small>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-main)', maxWidth: '250px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{p.agenda}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {p.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <button onClick={() => handleApprove(p.id)} className="brutal-card" style={{ background: '#E8F5E9', color: '#2E7D32', borderColor: '#C8E6C9', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', borderRadius: '6px' }}>Setujui</button>
                              <button onClick={() => handleReject(p.id)} className="brutal-card" style={{ background: '#FFF5F5', color: '#E53935', borderColor: '#FFCDD2', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', borderRadius: '6px' }}>Tolak</button>
                              <button onClick={() => handleEditClick(p)} className="brutal-card" style={{ background: '#EEF2FF', color: '#4F46E5', borderColor: '#E0E7FF', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', borderRadius: '6px' }}>Edit</button>
                            </div>
                          ) : (
                            /* SUSUNAN SEBARIS HORIZONTAL UNTUK APPROVED / ACTIONS */
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                              <span className="brutal-badge" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '0.35rem 0.7rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                boxShadow: 'none',
                                background: (selesai && p.status === 'APPROVED') ? '#F3F4F6' : p.status === 'APPROVED' ? '#E8F5E9' : '#FFF5F5',
                                color: (selesai && p.status === 'APPROVED') ? '#6B7280' : p.status === 'APPROVED' ? '#2E7D32' : '#E53935',
                                borderColor: (selesai && p.status === 'APPROVED') ? '#D1D5DB' : p.status === 'APPROVED' ? '#C8E6C9' : '#FFCDD2',
                              }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: (selesai && p.status === 'APPROVED') ? '#9CA3AF' : p.status === 'APPROVED' ? '#4CAF50' : '#F44336' }}></span>
                                {(selesai && p.status === 'APPROVED') ? 'SELESAI' : p.status}
                              </span>
                              
                              {canEdit && p.status === 'APPROVED' && (
                                <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                  <button onClick={() => handleEditClick(p)} className="btn" style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #E0E7FF', padding: '0.35rem 0.7rem', fontSize: '0.78rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}>Edit</button>
                                  <button onClick={() => handleCancel(p.id)} className="btn" style={{ background: '#FFF5F5', color: '#E53935', border: '1px solid #FFCDD2', padding: '0.35rem 0.7rem', fontSize: '0.78rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}>Batal</button>
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
            
            {/* PAGINATION */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                  Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBookings.length)} dari {filteredBookings.length} data
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="btn btn-outline-glass" 
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', fontWeight: 600, opacity: currentPage === 1 ? 0.4 : 1, borderRadius: '6px' }}
                  >
                    Sebelumnya
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                    className="btn btn-outline-glass" 
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', fontWeight: 600, opacity: currentPage === totalPages ? 0.4 : 1, borderRadius: '6px' }}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL EDIT DATA RESERVASI */}
      {showEditModal && editData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ color: 'var(--primary)', display: 'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>Edit Jadwal Rapat (Admin)</h3>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ruangan</label>
                <select className="form-input" value={editData.roomId} onChange={e => setEditData({...editData, roomId: e.target.value})} required style={{ width: '100%', fontWeight: 600 }}>
                  {roomsList.map(r => (
                    <option key={r.id} value={r.id}>{r.nama}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tanggal</label>
                <input type="date" className="form-input" value={editData.tanggal} onChange={e => setEditData({...editData, tanggal: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jam Mulai</label>
                  <input type="time" className="form-input" value={editData.jamMulai} onChange={e => setEditData({...editData, jamMulai: e.target.value})} required style={{ width: '100%' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jam Selesai</label>
                  <input type="time" className="form-input" value={editData.jamSelesai} onChange={e => setEditData({...editData, jamSelesai: e.target.value})} required style={{ width: '100%' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Agenda</label>
                <input type="text" className="form-input" value={editData.agenda} onChange={e => setEditData({...editData, agenda: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jumlah Peserta</label>
                <input type="number" className="form-input" value={editData.jumlahPeserta} onChange={e => setEditData({...editData, jumlahPeserta: e.target.value})} required min="1" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn" style={{ flex: 1, padding: '0.75rem', fontWeight: 600 }}>Tutup</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', fontWeight: 700 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}