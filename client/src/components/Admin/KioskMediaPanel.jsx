import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function KioskMediaPanel() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [editId, setEditId] = useState(null);
  const [sourceType, setSourceType] = useState('UPLOAD');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [duration, setDuration] = useState(5);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/kiosk-media');
      setMediaList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/admin/kiosk-media/${id}`, { isActive: !currentStatus });
      fetchMedia();
    } catch (err) {
      alert('Gagal merubah status media');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus media ini?')) return;
    try {
      await api.delete(`/admin/kiosk-media/${id}`);
      fetchMedia();
    } catch (err) {
      alert('Gagal menghapus media');
    }
  };

  const handleOpenEdit = (media) => {
    setEditId(media.id);
    setTitle(media.title);
    setCaption(media.caption || '');
    setSourceType(media.sourceType);
    if (media.sourceType === 'LINK') {
      setLinkUrl(media.url);
    } else {
      setLinkUrl('');
    }
    setFile(null); // File won't be edited here easily, usually re-uploaded if needed
    setDuration(media.duration || 5);
    setOrder(media.order || 0);
    setIsActive(media.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        // Edit mode (only updating metadata, not file)
        await api.put(`/admin/kiosk-media/${editId}`, {
          title, caption, duration, order, isActive
        });
      } else {
        // Create mode
        let type = 'IMAGE';
        if (sourceType === 'UPLOAD') {
          if (!file) return alert('Pilih file terlebih dahulu');
          if (file.type.startsWith('video/')) type = 'VIDEO';
        } else {
          if (!linkUrl) return alert('Masukkan URL link');
          if (linkUrl.match(/\.(mp4|webm|ogg)$/i) || linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')) {
            type = 'VIDEO';
          }
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('caption', caption);
        formData.append('type', type);
        formData.append('sourceType', sourceType);
        formData.append('duration', duration);
        formData.append('order', order);
        formData.append('isActive', isActive);
        
        if (sourceType === 'UPLOAD') {
          formData.append('file', file);
        } else {
          formData.append('url', linkUrl);
        }

        await api.post('/admin/kiosk-media', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchMedia();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan media');
    }
  };

  const resetForm = () => {
    setEditId(null);
    setSourceType('UPLOAD');
    setTitle('');
    setCaption('');
    setFile(null);
    setLinkUrl('');
    setDuration(5);
    setOrder(0);
    setIsActive(true);
  };

  const getMediaUrl = (url) => {
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return url;
  };

  const isYoutube = (url) => url.includes('youtube.com') || url.includes('youtu.be');

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Daftar Konten Screensaver</h2>
        <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>+ Tambah Media</button>
      </div>

      {loading ? (
        <p>Memuat media...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {mediaList.map((media) => (
            <div key={media.id} className="brutal-card" style={{ padding: '1rem', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '150px', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem', position: 'relative' }}>
                {media.type === 'IMAGE' ? (
                  <img src={getMediaUrl(media.url)} alt={media.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : isYoutube(media.url) ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img 
                      src={`https://img.youtube.com/vi/${getYoutubeVideoId(media.url)}/hqdefault.jpg`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
                      alt="Youtube Thumbnail" 
                    />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ background: '#DC2626', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 'bold' }}>▶️ YouTube</span>
                    </div>
                  </div>
                ) : (
                  <video src={getMediaUrl(media.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {!media.isActive && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ background: '#EF4444', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>NONAKTIF</span>
                  </div>
                )}
              </div>
              <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{media.title}</h3>
              {media.caption && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.2rem 0', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>📝 {media.caption}</p>
              )}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.2rem 0' }}>Sumber: {media.sourceType} ({media.type})</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.2rem 0' }}>Urutan: {media.order} | Durasi: {media.duration}s</p>
              
              <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleToggleActive(media.id, media.isActive)}
                  className="btn" 
                  style={{ flex: 1, minWidth: '45%', padding: '0.5rem', fontSize: '0.85rem', background: media.isActive ? '#FEF2F2' : '#DCFCE7', color: media.isActive ? '#EF4444' : '#10B981', border: `1px solid ${media.isActive ? '#FCA5A5' : '#86EFAC'}` }}
                >
                  {media.isActive ? 'Matikan' : 'Aktifkan'}
                </button>
                <button 
                  onClick={() => handleOpenEdit(media)}
                  className="btn" 
                  style={{ flex: 1, minWidth: '45%', padding: '0.5rem', fontSize: '0.85rem', background: '#E0F2FE', color: '#0284C7', border: '1px solid #BAE6FD' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(media.id)}
                  className="btn" 
                  style={{ flex: '1 1 100%', padding: '0.5rem', fontSize: '0.85rem', background: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB' }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {mediaList.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Belum ada media promosi/screensaver yang diunggah.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsModalOpen(false); resetForm(); }}>
          <div className="modal-content animate-fade-in-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Media Screensaver' : 'Tambah Media Screensaver'}</h3>
              <button className="modal-close" onClick={() => { setIsModalOpen(false); resetForm(); }}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Judul Media <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Caption <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>(Opsional — ditampilkan di bawah judul pada screensaver)</span></label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Contoh: Kami berkomitmen menyediakan produk berkualitas tinggi..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                
                {!editId && (
                  <div className="form-group">
                    <label>Sumber Konten</label>
                    <select className="form-input" value={sourceType} onChange={e => setSourceType(e.target.value)}>
                      <option value="UPLOAD">Upload File Lokal</option>
                      <option value="LINK">Link URL Eksternal (Termasuk Youtube)</option>
                    </select>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Tipe media (Gambar/Video) akan terdeteksi otomatis.
                    </small>
                  </div>
                )}

                {!editId && (
                  <div className="form-group">
                    {sourceType === 'UPLOAD' ? (
                      <>
                        <label>Pilih File</label>
                        <input type="file" className="form-input" accept="image/*,video/*" onChange={e => setFile(e.target.files[0])} required />
                      </>
                    ) : (
                      <>
                        <label>URL / Link Eksternal</label>
                        <input type="url" className="form-input" placeholder="https://youtube.com/... atau https://.../img.jpg" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} required />
                      </>
                    )}
                  </div>
                )}

                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Durasi Tampil (detik)</label>
                    <input type="number" className="form-input" value={duration} onChange={e => setDuration(e.target.value)} min="1" required />
                    <small style={{ color: 'var(--text-muted)' }}>Waktu tampil sblm ganti</small>
                  </div>
                  <div>
                    <label>Urutan Tampil (Order)</label>
                    <input type="number" className="form-input" value={order} onChange={e => setOrder(e.target.value)} min="0" required />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                    Aktifkan penayangan media ini
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>Simpan Media</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
