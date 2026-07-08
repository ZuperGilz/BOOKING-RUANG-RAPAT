import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export default function ManajemenUserPage() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ email: '', namaLengkap: '', noTelp: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // State untuk Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ namaLengkap: '', noTelp: '' });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // State untuk Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await api.post('/admin/users', newUser);
      setSuccess(res.data.message);
      setNewUser({ email: '', namaLengkap: '', noTelp: '' });
      fetchUsers();
    } catch (err) { setError(err.response?.data?.message || 'Gagal membuat user baru.'); }
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
      
      // Auto close modal after short delay
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingUser(null);
      }, 1500);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Gagal memperbarui data karyawan.');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/admin/users/${id}/status`, { status: nextStatus });
      fetchUsers();
    } catch (err) { alert('Gagal merubah status user.'); }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm('Reset password karyawan ini kembali ke default (Padang@2026)?')) return;
    try {
      const res = await api.put(`/admin/users/${id}/reset-password`);
      alert(res.data.message);
    } catch (err) { alert('Gagal reset password.'); }
  };

  return (
    <div>
      <form onSubmit={handleCreateUser} style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--border)' }}>
        <h4 style={{ marginBottom: '1rem' }}>➕ Daftarkan Akun Karyawan Baru</h4>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{success}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <input type="text" className="form-input" placeholder="Nama Lengkap" value={newUser.namaLengkap} onChange={e => setNewUser({ ...newUser, namaLengkap: e.target.value })} required />
          <input type="email" className="form-input" placeholder="Email Perusahaan" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
          <input type="text" className="form-input" placeholder="No. HP" value={newUser.noTelp} onChange={e => setNewUser({ ...newUser, noTelp: e.target.value })} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: 'auto' }}>Simpan Karyawan</button>
      </form>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>Daftar Karyawan Terdaftar</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="Cari nama, email, atau no HP..." 
            className="form-input" 
            style={{ width: '250px', marginBottom: 0 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select 
            className="form-input" 
            style={{ width: '130px', marginBottom: 0 }}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Semua Role</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
          <select 
            className="form-input" 
            style={{ width: '140px', marginBottom: 0 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
        </div>
      </div>

      <table className="custom-table">
        <thead><tr><th>Nama</th><th>Email</th><th>No. HP</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
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
            <tr key={u.id}>
              <td><strong>{u.nama_lengkap || u.namaLengkap}</strong></td>
              <td>{u.email}</td>
              <td>{u.no_telp || u.noTelp || '-'}</td>
              <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>{u.role}</span></td>
              <td><span className="badge" style={{ background: u.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: u.status === 'ACTIVE' ? '#15803d' : '#b91c1c' }}>{u.status}</span></td>
              <td>
                {u.id !== currentUser?.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Tombol Edit Terkunci Sempurna Di Sini */}
                    <button onClick={() => handleEditUser(u)} className="btn" style={{ background: '#e2e8f0', color: '#1e293b', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '600' }}>✏️ Edit</button>
                    <button onClick={() => handleToggleStatus(u.id, u.status)} className="btn" style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '600' }}>{u.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    <button onClick={() => handleResetPassword(u.id)} className="btn" style={{ background: '#f1f5f9', color: '#475569', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '600' }}>Reset</button>
                  </div>
                ) : <small style={{ color: 'var(--text-muted)' }}>Akun Anda (Aktif)</small>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL EDIT KARYAWAN */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => !editSuccess && setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ✏️ Edit Data Karyawan
                </h3>
              </div>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {editError && <div className="alert alert-error">{editError}</div>}
              {editSuccess && (
                <div className="alert" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                  {editSuccess}
                </div>
              )}
              
              <form onSubmit={handleSaveEdit}>
                <div className="form-group">
                  <label className="form-label">Email Karyawan (Read-only)</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={editingUser?.email} 
                    disabled 
                    style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} 
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Email digunakan untuk login dan tidak dapat diubah.
                  </small>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.namaLengkap} 
                    onChange={e => setEditForm({...editForm, namaLengkap: e.target.value})} 
                    required 
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">No. HP / WhatsApp</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.noTelp} 
                    onChange={e => setEditForm({...editForm, noTelp: e.target.value})} 
                    required 
                    placeholder="Contoh: 081234567890"
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ backgroundColor: '#f1f5f9', color: '#475569' }} 
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={editSuccess}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: 'auto' }}
                    disabled={editSuccess}
                  >
                    💾 Simpan Data
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