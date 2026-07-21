import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import api from '../../services/api';
import KioskMediaPanel from '../../components/Admin/KioskMediaPanel';

export default function ManajemenKioskPage() {
  const [kiosks, setKiosks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('devices'); // 'devices' or 'media'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [kioskLabel, setKioskLabel] = useState('');
  
  // Magic Link & View QR State
  const [generatedToken, setGeneratedToken] = useState(null);
  const [magicLink, setMagicLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [modalKioskData, setModalKioskData] = useState(null); 

  useEffect(() => {
    fetchKiosks();
    fetchRooms();
  }, []);

  const fetchKiosks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/devices');
      setKiosks(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get('/bookings/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/devices/generate', { 
        roomId: selectedRoomId, 
        label: kioskLabel 
      });
      
      const data = res.data;
      setGeneratedToken(data.token);
      const link = `${window.location.origin}/kiosk?token=${data.token}`;
      setMagicLink(link);
      setModalKioskData(data); 
      fetchKiosks();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleOpenQRModal = (kiosk) => {
    setGeneratedToken(kiosk.token);
    const link = `${window.location.origin}/kiosk?token=${kiosk.token}`;
    setMagicLink(link);
    setModalKioskData(kiosk); 
    setIsModalOpen(true);
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Yakin ingin mencabut akses kiosk ini? Tablet akan otomatis ter-logout.')) return;
    try {
      await api.put(`/admin/devices/${id}/revoke`);
      fetchKiosks();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus permanen data kiosk ini?')) return;
    try {
      await api.delete(`/admin/devices/${id}`);
      fetchKiosks();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const copyToClipboard = () => {
    if (navigator.clipboard && window.isSecureContext) {
      // Jalur utama jika browser mendukung HTTPS / localhost
      navigator.clipboard.writeText(magicLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error('Gagal menggunakan navigator.clipboard: ', err);
          fallbackCopyToClipboard(magicLink);
        });
    } else {
      // Jalur cadangan untuk HTTP biasa / IP Address local network
      fallbackCopyToClipboard(magicLink);
    }
  };

  // Fungsi cadangan menggunakan elemen input sementara
  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Hindari scrolling saat elemen dimasukkan ke DOM
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert('Gagal menyalin teks, silakan blok dan salin link secara manual.');
      }
    } catch (err) {
      console.error('Fallback copy gagal: ', err);
      alert('Gagal menyalin teks secara otomatis.');
    }

    document.body.removeChild(textArea);
  };

  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const diffInSeconds = (new Date() - new Date(lastSeen)) / 1000;
    return diffInSeconds < 120; 
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Manajemen Kiosk</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pantau dan kelola tablet display untuk setiap ruangan rapat.</p>
        </div>
        <button 
          onClick={() => {
            setGeneratedToken(null);
            setMagicLink('');
            setModalKioskData(null);
            setKioskLabel('');
            setSelectedRoomId(rooms.length > 0 ? rooms[0].id : '');
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"></path></svg>
          Tambah Kiosk Baru
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('devices')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'devices' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'devices' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
        >
          Perangkat Kiosk
        </button>
        <button 
          onClick={() => setActiveTab('media')}
          style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'media' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'media' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
        >
          Konten Screensaver
        </button>
      </div>

      {activeTab === 'devices' ? (
        <>
          {loading ? (
            <div>Memuat data...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>{error}</div>
          ) : (
            <div className="brutal-card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-card)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Ruangan</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Label Tablet</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Token</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Terakhir Aktif</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {kiosks.map((k) => (
                    <tr key={k.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>
                        {k.is_active ? (
                          isOnline(k.last_seen_at) ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 600 }}>
                              <span style={{ width: 10, height: 10, background: '#10B981', borderRadius: '50%', boxShadow: '0 0 8px #10B981' }}></span> Online
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: 600 }}>
                              <span style={{ width: 10, height: 10, background: '#EF4444', borderRadius: '50%' }}></span> Offline
                            </span>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Dicabut (Revoked)</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>{k.roomName}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{k.label || '-'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{k.token}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {k.last_seen_at ? new Date(k.last_seen_at).toLocaleString('id-ID') : 'Belum Pernah'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          {k.is_active && (
                            <>
                              <button 
                                onClick={() => handleOpenQRModal(k)} 
                                className="btn" 
                                style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: 600 }}
                              >
                                Lihat QR / Link
                              </button>
                              <button onClick={() => handleRevoke(k.id)} className="btn" style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                Revoke Akses
                              </button>
                            </>
                          )}
                          {!k.is_active && (
                            <button onClick={() => handleDelete(k.id)} className="btn" style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {kiosks.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Belum ada perangkat Kiosk yang didaftarkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Generate & View Token */}
          {isModalOpen && createPortal(
            <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
              <div
                onClick={e => e.stopPropagation()}
                className="animate-fade-in-up"
                style={{
                  width: '100%', maxWidth: '480px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                  maxHeight: '90vh',
                  display: 'flex', flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header Modal */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    </div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      {generatedToken ? 'Informasi Akses Kiosk' : 'Tambah Kiosk Baru'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: '8px', width: 32, height: 32, cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >&times;</button>
                </div>

                {/* Body Modal */}
                <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
                  {!generatedToken ? (
                    <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pilih Ruangan *</label>
                        <select
                          className="form-input"
                          value={selectedRoomId}
                          onChange={e => setSelectedRoomId(e.target.value)}
                          required
                          style={{ width: '100%' }}
                        >
                          <option value="">-- Pilih Ruang --</option>
                          {rooms.map(r => (
                            <option key={r.id} value={r.id}>{r.nama}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Label Kiosk <span style={{ fontWeight: 400, textTransform: 'none' }}>(opsional)</span></label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Contoh: Tablet Dinding Lantai 2"
                          value={kioskLabel}
                          onChange={e => setKioskLabel(e.target.value)}
                          style={{ width: '100%' }}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Nama deskriptif untuk memudahkan identifikasi perangkat.</p>
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontWeight: 700, marginTop: '0.5rem' }}>
                        ✨ Generate Akses
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
                      
                      {/* Tanda Status Koneksi Dinamis */}
                      {modalKioskData?.last_seen_at ? (
                        <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f8fafc)', border: '2px solid #3b82f6', borderRadius: '12px', padding: '0.75rem 1.5rem', width: '100%' }}>
                          <p style={{ margin: 0, color: '#1d4ed8', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%' }}></span>
                            Sudah Terkoneksi ke Perangkat
                          </p>
                        </div>
                      ) : (
                        <div style={{ background: 'linear-gradient(135deg, #dcfce7, #f0fdf4)', border: '2px solid #86efac', borderRadius: '12px', padding: '0.75rem 1.5rem', width: '100%' }}>
                          <p style={{ margin: 0, color: '#166534', fontWeight: 600, fontSize: '0.9rem' }}>✅ Token Aktif! Pindai untuk menyambungkan perangkat.</p>
                        </div>
                      )}

                      {/* QR Code */}
                      <div style={{ padding: '1rem', background: '#ffffff', borderRadius: '12px', border: '3px solid var(--border)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                        <QRCode value={magicLink} size={160} />
                      </div>

                      {/* Magic Link */}
                      <div style={{ width: '100%' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', textAlign: 'left' }}>Magic Link:</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={magicLink}
                            readOnly
                            style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-body)' }}
                          />
                          <button
                            onClick={copyToClipboard}
                            className="btn"
                            style={{
                              padding: '0 1rem',
                              background: copied ? '#dcfce7' : 'var(--primary)',
                              color: copied ? '#166534' : '#fff',
                              border: 'none',
                              fontWeight: 700,
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {copied ? '✓ Tersalin' : '📋 Copy'}
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '8px', textAlign: 'left', lineHeight: 1.6 }}>
                        💡 {modalKioskData?.last_seen_at 
                          ? 'Token ini sudah digunakan oleh tablet terdaftar. Mengakses tautan ini menggunakan perangkat lain tidak akan merubah token registrasi utama.' 
                          : 'Buka link atau scan QR Code di browser tablet baru. Tablet akan langsung terkonfigurasi sebagai Kiosk ruangan ini.'}
                      </p>

                      <button onClick={() => setIsModalOpen(false)} className="btn" style={{ width: '100%', padding: '0.85rem', border: '1px solid var(--border)', fontWeight: 600 }}>
                        Selesai
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      ) : (
        <KioskMediaPanel />
      )}
    </div>
  );
}