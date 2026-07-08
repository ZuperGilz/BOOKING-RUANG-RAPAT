import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ManajemenRuanganPage() {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [newLabel, setNewLabel] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const fetchData = async () => {
    try {
      const [resRooms, resDevices] = await Promise.all([
        api.get('/admin/rooms'),
        api.get('/admin/devices')
      ]);
      setRooms(resRooms.data);
      setDevices(resDevices.data);
      if (resRooms.data.length > 0 && !selectedRoomId) {
        setSelectedRoomId(resRooms.data[0].id);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleRoomStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    try {
      await api.put(`/admin/rooms/${id}/status`, { status: nextStatus });
      fetchData();
    } catch (err) { alert('Gagal mengubah status ruangan.'); }
  };

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    try {
      const res = await api.post('/admin/devices/generate', {
        roomId: selectedRoomId,
        label: newLabel
      });
      alert(`Token berhasil dibuat: ${res.data.token}`);
      setNewLabel('');
      fetchData();
    } catch (err) { alert('Gagal membuat token device.'); }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Yakin ingin menonaktifkan token ini? Tablet akan ter-logout.')) return;
    try {
      await api.put(`/admin/devices/${id}/revoke`);
      fetchData();
    } catch (err) { alert('Gagal menonaktifkan token.'); }
  };

  const handleActivate = async (id) => {
    try {
      await api.put(`/admin/devices/${id}/activate`);
      fetchData();
    } catch (err) { alert('Gagal mengaktifkan token.'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('rooms')}
          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'rooms' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'rooms' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'rooms' ? '600' : '400', cursor: 'pointer' }}
        >
          🏢 Ruangan
        </button>
        <button 
          onClick={() => setActiveTab('devices')}
          style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'devices' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'devices' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'devices' ? '600' : '400', cursor: 'pointer' }}
        >
          📱 Tablet / Device Kiosk
        </button>
      </div>

      {activeTab === 'rooms' && (
        <>
          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>📢 Informasi Manajemen Aset</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Gedung ini secara permanen memiliki 2 Ruang Rapat Utama. Anda berhak menonaktifkan ruangan jika sedang dalam masa perbaikan (Maintenance).</p>
          </div>

          <h3 style={{ marginBottom: '1rem' }}>Status Operasional Ruang Rapat</h3>
          <table className="custom-table">
            <thead><tr><th>Nama Ruangan</th><th>Kapasitas</th><th>Deskripsi</th><th>Status</th><th>Kontrol Operasional</th></tr></thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.nama}</strong></td>
                  <td>{r.kapasitas} Orang</td>
                  <td>{r.deskripsi || '-'}</td>
                  <td>
                    <span className="badge" style={{ background: r.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: r.status === 'ACTIVE' ? '#15803d' : '#b91c1c' }}>
                      {r.status === 'ACTIVE' ? 'SIAP PAKAI' : 'MAINTENANCE'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleRoomStatus(r.id, r.status)} 
                      className="btn" 
                      style={{ background: r.status === 'ACTIVE' ? '#fee2e2' : '#dcfce7', color: r.status === 'ACTIVE' ? '#b91c1c' : '#15803d', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    >
                      {r.status === 'ACTIVE' ? '🚨 Set Perbaikan' : '✅ Aktifkan Kembali'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {activeTab === 'devices' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', height: 'fit-content' }}>
              <h4 style={{ marginBottom: '1rem' }}>🔑 Generate Token Baru</h4>
              <form onSubmit={handleGenerateToken}>
                <div className="form-group">
                  <label>Pilih Ruangan</label>
                  <select className="form-input" value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} required>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Label Device (Opsional)</label>
                  <input type="text" className="form-input" placeholder="Contoh: Tablet Samsung Ruang A" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Generate Token</button>
              </form>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem' }}>Daftar Device Kiosk</h3>
              <table className="custom-table">
                <thead><tr><th>Token</th><th>Ruangan</th><th>Label</th><th>IP Terakhir</th><th>Status</th><th>Terakhir Aktif</th><th>Aksi</th></tr></thead>
                <tbody>
                  {devices.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{d.token}</td>
                      <td>{d.roomName}</td>
                      <td>{d.label || '-'}</td>
                      <td>{d.last_ip || '-'}</td>
                      <td>
                        <span className="badge" style={{ background: d.is_active ? '#dcfce7' : '#fee2e2', color: d.is_active ? '#15803d' : '#b91c1c' }}>
                          {d.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString('id-ID') : 'Belum Pernah'}
                      </td>
                      <td>
                        {d.is_active ? (
                          <button onClick={() => handleRevoke(d.id)} className="btn" style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Revoke</button>
                        ) : (
                          <button onClick={() => handleActivate(d.id)} className="btn" style={{ background: '#dcfce7', color: '#15803d', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Aktifkan</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {devices.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Belum ada device token</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}