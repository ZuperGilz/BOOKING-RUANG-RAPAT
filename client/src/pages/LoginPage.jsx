import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from "../img/LOGO-PT-SEMEN-PADANG-HITAM.png";


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Purposeful delay to let background render first before card slides in
    setTimeout(() => setShowForm(true), 150);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const user = await login(email, password);
      
      // LOGIKA PEMISAHAN DASHBOARD
      if (user.mustChangePassword) {
        navigate('/change-password'); 
      } else if (user.role === 'ADMIN') {
        navigate('/admin'); 
      } else {
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>
      
      {showForm && (
        <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem', position: 'relative', overflow: 'visible' }}>
          
          <div style={{ position: 'absolute', top: -45, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '50%', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 10 }}>
              <img src={logo} alt="Logo Semen Padang" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
          </div>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '2rem' }}>
            <h2 className="text-gradient" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Portal Reservasi</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>PT Semen Padang</p>
          </div>
          
          {error && (
            <div className="alert alert-error animate-fade-in">
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Perusahaan</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="karyawan@sig.id"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={isLoading}>
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  Memproses...
                </div>
              ) : 'Akses Portal'}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </form>
        </div>
      )}
    </div>
  );
}