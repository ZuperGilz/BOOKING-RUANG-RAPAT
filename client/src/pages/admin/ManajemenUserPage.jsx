import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export default function ManajemenUserPage() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ email: '', namaLengkap: '', noTelp: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // State untuk Modal Edit Profil Karyawan
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ namaLengkap: '', noTelp: '' });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // ➕ State Baru untuk Modal Ganti Password Karyawan
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // State untuk Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(''); 
    setSuccess('');
    try {
      const res = await api.post('/admin/users', newUser);
      setSuccess(res.data.message);
      setNewUser({ email: '', namaLengkap: '', noTelp: '' });
      fetchUsers();
    } catch (err) { 
      setError(err.response?.data?.message || 'Gagal membuat user baru.'); 
    }
  };

  const handleEditUser = (u) => {
    setEditingUser(u);
    setEditForm({
      namaLengkap: u.nama_lengkap || u.namaLengkap || '',
      noTelp: u.no_telp || u.noTelp || ''
    });
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    
    if (!editForm.namaLengkap || !editForm.noTelp) {
      setEditError('Nama Lengkap dan No. HP wajib diisi.');
      return;
    }

    try {
      const res = await api.put(`/admin/users/${editingUser.id}`, {
        namaLengkap: editForm.namaLengkap,
        noTelp: editForm.noTelp
      });
      setEditSuccess(res.data.message);
      fetchUsers();
      
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingUser(null);
      }, 1500);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Gagal memperbarui data karyawan.');
    }
  };

  // ➕ Fungsi Baru untuk Membuka Modal Ganti Password
  const handleOpenPasswordModal = (u) => {
    setPasswordModalUser(u);
    setNewPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setIsPasswordModalOpen(true);
  };

  // ➕ Fungsi Baru untuk Menyimpan Password Baru ke Backend
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal harus terdiri dari 6 karakter.');
      return;
    }

    try {
      // Pastikan endpoint backend ini sesuai dengan router API Anda, 
      // misalnya mengirim { password: newPassword } ke endpoint /admin/users/:id/change-password
      const res = await api.put(`/admin/users/${passwordUser.id}/change-password`, { 
        password: newPassword 
      });
      
      setPasswordSuccess(res.data.message || 'Password sukses diubah oleh Admin.');
      
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordModalUser(null);
      }, 1500);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Gagal mengubah password karyawan.');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/admin/users/${id}/status`, { status: nextStatus });
      fetchUsers();
    } catch (err) { 
      alert('Gagal merubah status user.'); 
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm('Reset password karyawan ini kembali ke default (Padang@2026)?')) return;
    try {
      const res = await api.put(`/admin/users/${id}/reset-password`);
      alert(res.data.message);
    } catch (err) { 
      alert('Gagal reset password.'); 
    }
  };

  return (
    <div>
      {/* SECTION INPUT USER BARU */}
      <form onSubmit={handleCreateUser} style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div style={{ color: 'var(--primary)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          </div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Daftarkan Akun Karyawan Baru</h4>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && (
          <div className="alert" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {success}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input type="text" className="form-input" placeholder="Nama Lengkap" value={newUser.namaLengkap} onChange={e => setNewUser({ ...newUser, namaLengkap: e.target.value })} required style={{ width: '100%' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input type="email" className="form-input" placeholder="Email Perusahaan" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required style={{ width: '100%' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input type="text" className="form-input" placeholder="No. HP" value={newUser.noTelp} onChange={e => setNewUser({ ...newUser, noTelp: e.target.value })} required style={{ width: '100%' }} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '1.25rem', fontWeight: 700, borderRadius: '8px', padding: '0.6rem 1.2rem' }}>
          Simpan Karyawan
        </button>
      </form>

      {/* FILTER & PENCARIAN AREA */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>Daftar Karyawan Terdaftar</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Cari nama, email, atau no HP..." 
            className="form-input" 
            style={{ width: '250px', marginBottom: 0, fontSize: '0.9rem' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select 
            className="form-input" 
            style={{ width: '135px', marginBottom: 0, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Semua Role</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
          <select 
            className="form-input" 
            style={{ width: '145px', marginBottom: 0, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* TABEL DATA USER */}
      <div className="brutal-card" style={{ overflowX: 'auto', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-card)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nama</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Email</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>No. HP</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Role</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(u => {
                const matchSearch = 
                  (u.nama_lengkap || u.namaLengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (u.no_telp || u.noTelp || '').toLowerCase().includes(searchQuery.toLowerCase());
                const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
                const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
                return matchSearch && matchStatus && matchRole;
              })
              .map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}><strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{u.nama_lengkap || u.namaLengkap}</strong></td>
                  <td style={{ padding: '1rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{u.no_telp || u.noTelp || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span 
                      style={{ 
                        display: 'inline-block',
                        padding: '0.25rem 0.6rem', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: u.role === 'ADMIN' ? '#EDE9FE' : '#F3F4F6',
                        color: u.role === 'ADMIN' ? '#6D28D9' : '#4B5563'
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: u.status === 'ACTIVE' ? '#E8F5E9' : '#FFEBEE', 
                        color: u.status === 'ACTIVE' ? '#2E7D32' : '#C62828',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: u.status === 'ACTIVE' ? '#4CAF50' : '#F44336' }}></span>
                      {u.status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {u.id !== currentUser?.id ? (
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleEditUser(u)} 
                          className="btn" 
                          style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #E0E7FF', padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        {/* ➕ TOMBOL BARU: Password */}
                        <button 
                          onClick={() => handleOpenPasswordModal(u)} 
                          className="btn" 
                          style={{ background: '#FFF9DB', color: '#B45309', border: '1px solid #FFE066', padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Password
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(u.id, u.status)} 
                          className="btn" 
                          style={{ 
                            background: u.status === 'ACTIVE' ? '#FFF5F5' : '#E0F2FE', 
                            color: u.status === 'ACTIVE' ? '#E53935' : '#0369a1', 
                            border: u.status === 'ACTIVE' ? '1px solid #FFCDD2' : '1px solid #BAE6FD',
                            padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' 
                          }}
                        >
                          {u.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button 
                          onClick={() => handleResetPassword(u.id)} 
                          className="btn" 
                          style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB', padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Reset
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', fontWeight: 500 }}>Akun Anda (Aktif)</span>
                    )}
                  </td>
                </tr>
              ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Tidak ada data karyawan terdaftar yang cocok dengan filter pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT DATA KARYAWAN */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => !editSuccess && setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ color: 'var(--primary)', display: 'flex' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  Ubah Informasi Karyawan
                </h3>
              </div>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)} style={{ fontSize: '1.3rem', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              {editError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{editError}</div>}
              {editSuccess && (
                <div className="alert" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  {editSuccess}
                </div>
              )}
              
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Email Karyawan (Read-only)</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={editingUser?.email || ''} 
                    disabled 
                    style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)', cursor: 'not-allowed', width: '100%', borderColor: 'var(--border)' }} 
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block', lineHeight: 1.4 }}>
                    Email perusahaan digunakan sebagai pengenal unik masuk sistem dan tidak dapat diubah.
                  </small>
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.namaLengkap} 
                    onChange={e => setEditForm({...editForm, namaLengkap: e.target.value})} 
                    required 
                    placeholder="Masukkan nama lengkap karyawan"
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>No. HP / WhatsApp</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.noTelp} 
                    onChange={e => setEditForm({...editForm, noTelp: e.target.value})} 
                    required 
                    placeholder="Contoh: 081234567890"
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn" onClick={() => setIsEditModalOpen(false)} disabled={!!editSuccess} style={{ flex: 1, padding: '0.75rem', fontWeight: 600 }}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={!!editSuccess} style={{ flex: 2, padding: '0.75rem', fontWeight: 700 }}>Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ➕ MODAL BARU: GANTI PASSWORD KARYAWAN OLEH ADMIN */}
      {isPasswordModalOpen && (
        <div className="modal-overlay" onClick={() => !passwordSuccess && setIsPasswordModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ color: '#B45309', display: 'flex' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  Ganti Password Karyawan
                </h3>
              </div>
              <button className="modal-close" onClick={() => setIsPasswordModalOpen(false)} style={{ fontSize: '1.3rem', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              {passwordError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{passwordError}</div>}
              {passwordSuccess && (
                <div className="alert" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  {passwordSuccess}
                </div>
              )}
              
              <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ textAlign: 'left', background: 'var(--bg-body)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Target Akun</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{passwordUser?.nama_lengkap || passwordUser?.namaLengkap}</strong>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{passwordUser?.email}</span>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Password Baru</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                    placeholder="Masukkan password baru akun"
                    style={{ width: '100%' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                    Gunakan minimal 6 karakter kombinasi huruf dan angka yang aman.
                  </small>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn" onClick={() => setIsPasswordModalOpen(false)} disabled={!!passwordSuccess} style={{ flex: 1, padding: '0.75rem', fontWeight: 600 }}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={!!passwordSuccess} style={{ flex: 2, padding: '0.75rem', fontWeight: 700, background: '#D97706', borderColor: '#FFE066' }}>Update Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}