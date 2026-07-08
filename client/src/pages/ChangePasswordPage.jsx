import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('Konfirmasi password tidak cocok.');
    }

    setIsLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      setSuccess('Password berhasil diperbarui! Mengarahkan...');

      const storedUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...storedUser, mustChangePassword: 0 };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setTimeout(() => {
        if (updatedUser.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-body)' }}>
      <div className="auth-card" style={{ background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2>Keamanan Akun</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Anda wajib mengganti password default untuk melanjutkan.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Password Lama (Default)</label>
            <input type="password" className="form-input" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password Baru</label>
            <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength="6" />
          </div>
          <div className="form-group">
            <label className="form-label">Konfirmasi Password Baru</label>
            <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : 'Simpan & Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}