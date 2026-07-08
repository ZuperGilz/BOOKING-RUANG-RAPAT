import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KioskContext } from '../context/KioskContext';
import api from '../services/api';

const ROOM_PALETTE = {
  1: { color: '#fca5a5', bg: 'rgba(220,38,38,0.1)',    border: '#dc2626', solid: '#dc2626', gradient: 'linear-gradient(135deg, var(--text-main) 0%, var(--text-muted) 100%)', chipClass: 'chip-ruang-a', glowBorder: 'rgba(220,38,38,0.2)', glowShadow: 'rgba(220,38,38,0.4)' },
  2: { color: '#6ee7b7', bg: 'rgba(16,185,129,0.1)',   border: '#10b981', solid: '#10b981', gradient: 'linear-gradient(135deg, #6ee7b7 0%, #10b981 100%)',                   chipClass: 'chip-ruang-b', glowBorder: 'rgba(16,185,129,0.2)', glowShadow: 'rgba(16,185,129,0.4)' },
  3: { color: '#93c5fd', bg: 'rgba(59,130,246,0.1)',   border: '#3b82f6', solid: '#3b82f6', gradient: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)',                   chipClass: 'chip-ruang-c', glowBorder: 'rgba(59,130,246,0.2)', glowShadow: 'rgba(59,130,246,0.4)' },
  4: { color: '#c4b5fd', bg: 'rgba(139,92,246,0.1)',   border: '#8b5cf6', solid: '#8b5cf6', gradient: 'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%)',                   chipClass: 'chip-ruang-d', glowBorder: 'rgba(139,92,246,0.2)', glowShadow: 'rgba(139,92,246,0.4)' },
};
const ROOM_PALETTE_DEFAULT = { color: '#fdba74', bg: 'rgba(249,115,22,0.1)', border: '#f97316', solid: '#f97316', gradient: 'linear-gradient(135deg, #fdba74 0%, #f97316 100%)', chipClass: 'chip-ruang-x', glowBorder: 'rgba(249,115,22,0.2)', glowShadow: 'rgba(249,115,22,0.4)' };
const getRoomPalette = (roomId) => ROOM_PALETTE[roomId] || ROOM_PALETTE_DEFAULT;

export default function KioskDashboardPage() {
  const { isActivated, roomInfo, deviceToken, deactivate, activate, loading } = useContext(KioskContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenUrl = searchParams.get('token');
  
  const [schedule, setSchedule] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  
  const [roomsList, setRoomsList] = useState([]);
  const [monthlySchedules, setMonthlySchedules] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  
  const getLocalDateString = (dateValue) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tanggal, setTanggal] = useState(getLocalDateString(new Date()));
  const [jamMulai, setJamMulai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('');
  const [agenda, setAgenda] = useState('');
  const [pemateri, setPemateri] = useState('');
  const [jumlahPeserta, setJumlahPeserta] = useState('');
  const [catatan, setCatatan] = useState('');
  
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const inactivityTimerRef = useRef(null);
  
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (tokenUrl && !isActivated) {
      setActivating(true);
      setActivateError('');
      activate(tokenUrl)
        .then(() => {
          setActivating(false);
          navigate('/kiosk', { replace: true });
        })
        .catch(err => {
          setActivateError(err.response?.data?.message || 'Token tidak valid.');
          setActivating(false);
        });
    }
  }, [loading, isActivated, tokenUrl]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchSchedule = async () => {
    if (!deviceToken) return;
    try {
      const today = getLocalDateString(new Date());
      const res = await api.get(`/kiosk/schedule?tanggal=${today}`, {
        headers: { 'X-Device-Token': deviceToken }
      });
      setSchedule(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        alert(err.response.data.message);
        deactivate(); 
      }
    }
  };

  const fetchUpcoming = async () => {
    if (!deviceToken) return;
    try {
      const today = getLocalDateString(new Date());
      const res = await api.get(`/kiosk/upcoming?tanggal=${today}`, {
        headers: { 'X-Device-Token': deviceToken }
      });
      setUpcoming(res.data);
    } catch (err) {}
  };

  const sendHeartbeat = async () => {
    if (!deviceToken) return;
    try {
      await api.post('/kiosk/heartbeat', {}, { headers: { 'X-Device-Token': deviceToken } });
    } catch (e) {}
  };

  const fetchRooms = async () => {
    if (!deviceToken) return;
    try {
      const res = await api.get('/kiosk/rooms', { headers: { 'X-Device-Token': deviceToken } });
      setRoomsList(res.data);
    } catch (err) {}
  };

  const fetchCalendar = async (roomIdToFetch) => {
    if (!deviceToken) return;
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      let url = `/kiosk/calendar?bulan=${month}&tahun=${year}`;
      if (roomIdToFetch) url += `&roomId=${roomIdToFetch}`;
      
      const res = await api.get(url, { headers: { 'X-Device-Token': deviceToken } });
      setMonthlySchedules(res.data);
    } catch (err) {}
  };

  useEffect(() => {
    if (roomInfo && !selectedRoomId) {
      setSelectedRoomId(roomInfo.roomId);
    }
  }, [roomInfo]);

  useEffect(() => {
    fetchSchedule();
    fetchUpcoming();
    sendHeartbeat();
    fetchRooms();
    
    const refreshTimer = setInterval(() => {
      fetchSchedule();
      fetchUpcoming();
      sendHeartbeat();
      if (selectedRoomId) fetchCalendar(selectedRoomId);
    }, 30000); 
    return () => clearInterval(refreshTimer);
  }, [deviceToken, selectedRoomId]);

  useEffect(() => {
    if (selectedRoomId) fetchCalendar(selectedRoomId);
  }, [currentMonth, selectedRoomId]);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (showModal) {
      inactivityTimerRef.current = setTimeout(() => {
        handleCloseModal();
      }, 5 * 60 * 1000);
    }
  };

  useEffect(() => {
    resetInactivityTimer();
    const handleActivity = () => resetInactivityTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [showModal]);

  const handleOpenModal = (presetDate) => {
    setShowModal(true);
    setModalStep(1);
    setTanggal(presetDate || getLocalDateString(new Date()));
    setShowDateModal(false);
    resetInactivityTimer();
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedCalDate(dateStr);
    setShowDateModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setBookingError('');
    setBookingSuccess('');
    setEmail('');
    setPassword('');
    setJamMulai('');
    setJamSelesai('');
    setAgenda('');
    setPemateri('');
    setJumlahPeserta('');
    setCatatan('');
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingLoading(true);
    try {
      const payload = {
        roomId: roomInfo.roomId,
        tanggal,
        jamMulai,
        jamSelesai,
        agenda,
        pemateri,
        jumlahPeserta: Number(jumlahPeserta),
        email,
        password,
        catatan
      };
      
      await api.post('/kiosk/booking', payload, {
        headers: { 'X-Device-Token': deviceToken }
      });
      
      setBookingSuccess('Pemesanan berhasil diajukan!');
      fetchSchedule();
      if (selectedRoomId) fetchCalendar(selectedRoomId);
      
      setTimeout(() => {
        handleCloseModal();
      }, 3000);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Gagal memproses pemesanan');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || activating) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', color: 'var(--text-main)' }}>
        <h2 className="animate-fade-in-up" style={{ fontSize: '2rem', color: 'var(--primary)' }}>Memuat Konfigurasi Kiosk...</h2>
        <p className="animate-fade-in-up stagger-1" style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Harap tunggu sebentar</p>
      </div>
    );
  }

  if (activateError) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', color: 'var(--danger)', textAlign: 'center', padding: '2rem' }}>
        <div className="animate-fade-in-up" style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
        <h2 className="animate-fade-in-up stagger-1" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Gagal Mengaktifkan Kiosk</h2>
        <p className="animate-fade-in-up stagger-2" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px' }}>{activateError}</p>
      </div>
    );
  }

  if (!isActivated || !roomInfo) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', color: 'var(--text-main)', textAlign: 'center', padding: '2rem' }}>
        <div className="animate-fade-in-up" style={{ fontSize: '5rem', marginBottom: '1rem', opacity: 0.8 }}>⚙️</div>
        <h1 className="animate-fade-in-up stagger-1" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Perangkat Belum Dikonfigurasi</h1>
        <p className="animate-fade-in-up stagger-2" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', lineHeight: 1.6 }}>
          Tablet ini belum dihubungkan ke ruangan mana pun. Silakan buka <strong>Manajemen Kiosk</strong> di Dashboard Admin, lalu scan QR Code atau buka Magic Link di perangkat ini.
        </p>
      </div>
    );
  }

  const todayStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const roomPal = getRoomPalette(roomInfo.roomId);
  
  // Calendar variables
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array(firstDay).fill(null).concat([...Array(daysInMonth).keys()].map(i => i + 1));
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-body)', overflowY: 'auto' }}>
      
      {/* Header menggunakan glass-card */}
      <div className="glass-card" style={{ padding: '2.5rem', margin: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(0,0,0,0.8) 100%)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '3rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: roomPal.solid, boxShadow: `0 0 15px ${roomPal.solid}`, animation: 'pulseGlow 2s infinite' }}></span>
            🏢 {roomInfo.roomName}
          </h1>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '1.2rem', marginTop: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>
            Kapasitas Maksimal: <strong style={{color: '#fff'}}>{roomInfo.kapasitas} Orang</strong>
          </p>
        </div>
        <div style={{ textAlign: 'right', color: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: '3.5rem', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{timeStr}</h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)' }}>{todayStr}</p>
        </div>
      </div>

      {/* Content Top: Jadwal & Upcoming */}
      <div style={{ padding: '0 2rem', display: 'flex', gap: '2rem' }}>
        
        {/* Jadwal Panel (Kiri) */}
        <div className="brutal-card" style={{ flex: 2, display: 'flex', flexDirection: 'column', borderColor: roomPal.solid, boxShadow: `6px 6px 0px ${roomPal.glowBorder}`, background: 'var(--bg-surface)', minHeight: '400px', maxHeight: '500px' }}>
          <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '1.5rem', background: roomPal.solid, borderRadius: '3px' }} />
              Jadwal Rapat Hari Ini
            </h2>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: roomPal.solid, background: roomPal.bg, padding: '0.4rem 1rem', borderRadius: '20px' }}>
              🔄 Auto-refresh tiap 30 dtk
            </span>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {schedule.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.8 }}>🟢</div>
                <h3 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Ruangan Kosong Seharian</h3>
                <p style={{ fontSize: '1.1rem' }}>Belum ada jadwal rapat untuk hari ini.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {schedule.map(b => {
                  const [hStart, mStart] = b.jam_mulai.split(':');
                  const [hEnd, mEnd] = b.jam_selesai.split(':');
                  const start = new Date(); start.setHours(hStart, mStart, 0);
                  const end = new Date(); end.setHours(hEnd, mEnd, 0);
                  const now = currentTime;
                  
                  let statusCard = 'upcoming'; // default
                  if (now >= start && now <= end) statusCard = 'ongoing';
                  else if (now > end) statusCard = 'past';

                  let bgCard = 'var(--bg-body)';
                  let borderLeft = '4px solid var(--border)';
                  if (statusCard === 'ongoing') { bgCard = roomPal.bg; borderLeft = `4px solid ${roomPal.solid}`; }
                  if (b.status === 'PENDING') { bgCard = 'rgba(245,158,11,0.1)'; borderLeft = '4px solid #f59e0b'; }

                  return (
                    <div key={b.id} className="upcoming-hero-card" style={{ background: bgCard, borderLeft, opacity: statusCard === 'past' ? 0.6 : 1, borderColor: statusCard === 'ongoing' ? roomPal.glowBorder : 'var(--border)' }}>
                      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.8rem', color: statusCard === 'ongoing' ? roomPal.solid : 'var(--primary)', minWidth: '150px' }}>
                          {b.jam_mulai} <br/> 
                          <span style={{fontSize:'1rem', opacity: 0.7}}>- {b.jam_selesai}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: 'var(--text-main)' }}>{b.agenda}</h4>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', display: 'flex', gap: '1rem' }}>
                            <span>👤 {b.pemesan}</span>
                            <span>👥 {b.jumlah_peserta} peserta</span>
                          </p>
                        </div>
                        <div>
                          {b.status === 'PENDING' && <span className="badge" style={{ background: '#fef3c7', color: '#b45309', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>⏳ Menunggu Approval</span>}
                          {b.status === 'APPROVED' && statusCard === 'ongoing' && (
                             <span className="badge" style={{ background: roomPal.solid, color: 'white', padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               <span style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', animation: 'pulseGlow 2s infinite' }} />
                               Sedang Berlangsung
                             </span>
                          )}
                          {b.status === 'APPROVED' && statusCard === 'upcoming' && <span className="badge" style={{ background: '#dcfce7', color: '#15803d', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Akan Datang</span>}
                          {statusCard === 'past' && <span className="badge" style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Selesai</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel (Kanan) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '500px' }}>
          <div className="brutal-card" style={{ 
            padding: upcoming.length > 0 ? '1.5rem' : '3rem 2rem', 
            textAlign: upcoming.length > 0 ? 'left' : 'center', 
            background: 'var(--bg-surface)', 
            flexShrink: 0,
            display: 'flex',
            flexDirection: upcoming.length > 0 ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            {upcoming.length === 0 && <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📝</div>}
            
            <div style={{ flex: 1 }}>
              <h2 style={{ marginBottom: upcoming.length > 0 ? '0' : '1rem', fontSize: upcoming.length > 0 ? '1.4rem' : '2rem', color: 'var(--text-main)' }}>
                Butuh Ruangan Ini?
              </h2>
              {upcoming.length === 0 && (
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.2rem', lineHeight: '1.6' }}>
                  Anda dapat memesan {roomInfo.roomName} secara instan dari tablet ini.
                </p>
              )}
            </div>

            <button 
              onClick={handleOpenModal} 
              className="btn btn-primary" 
              style={{ 
                padding: upcoming.length > 0 ? '1rem 1.5rem' : '1.5rem', 
                fontSize: upcoming.length > 0 ? '1.1rem' : '1.4rem', 
                width: upcoming.length > 0 ? 'auto' : '100%', 
                fontWeight: 'bold', 
                background: roomPal.solid, 
                boxShadow: `0 8px 20px ${roomPal.glowShadow}`,
                whiteSpace: 'nowrap'
              }}
            >
              {upcoming.length > 0 ? '+ Pesan Sekarang' : '📝 Pesan Ruangan Ini'}
            </button>
          </div>

          {upcoming.length > 0 && (
            <div className="brutal-card" style={{ padding: '1.5rem', background: 'var(--bg-surface)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', flexShrink: 0 }}>
                <span style={{ display: 'inline-block', width: '4px', height: '1.1rem', background: roomPal.solid, borderRadius: '2px' }} />
                Jadwal Akan Datang
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                {upcoming.map((item) => {
                  const dateObj = new Date(item.tanggal);
                  const dayStr = dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
                  return (
                    <div key={item.id} style={{ background: roomPal.bg, borderLeft: `3px solid ${roomPal.solid}`, borderRadius: '0 8px 8px 0', padding: '0.75rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center', minWidth: '55px', background: roomPal.solid, borderRadius: '8px', padding: '0.4rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase' }}>{dayStr.split(' ')[0]}</div>
                        <div style={{ fontSize: '1.2rem', color: 'white', fontWeight: 'bold', lineHeight: 1 }}>{dateObj.getDate()}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}>{dayStr.split(' ').slice(2).join(' ')}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 0.2rem 0', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.agenda}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.jam_mulai} – {item.jam_selesai}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Section */}
      <div style={{ padding: '2rem', marginTop: '1rem', display: 'flex', flexDirection: 'column' }}>
        <div className="flex-between stagger-3" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>Kalender Ruangan</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Lihat jadwal rapat bulan ini pada ruangan yang dipilih.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cek Ruang Lain:</label>
            <select 
              value={selectedRoomId || ''} 
              onChange={(e) => setSelectedRoomId(Number(e.target.value))}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {roomsList.map(r => (
                <option key={r.id} value={r.id}>{r.nama}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="calendar-container stagger-3" style={{ background: 'var(--bg-surface)' }}>
          <div className="calendar-header">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="calendar-nav-btn">❮</button>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{monthNames[month]} {year}</h3>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="calendar-nav-btn">❯</button>
          </div>

          <div className="calendar-grid">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
              <div key={day} className="calendar-day-name">{day}</div>
            ))}

            {days.map((day, index) => {
              const formattedDate = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const isToday = getLocalDateString(new Date()) === formattedDate;
              const isSelected = selectedCalDate === formattedDate;
              const dayEvents = monthlySchedules.filter(s => getLocalDateString(s.tanggal) === formattedDate);
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`calendar-cell ${!day ? 'empty' : ''} ${isSelected ? 'active' : ''}`}
                  style={{
                    ...(isToday ? { borderColor: 'rgba(220,38,38,0.5)' } : {}),
                    cursor: day ? 'pointer' : 'default',
                    transition: 'background 0.2s'
                  }}
                >
                  {day && (
                    <>
                      <div className="calendar-date-num" style={isToday ? { color: '#fca5a5' } : {}}>{day}</div>
                      {dayEvents.slice(0, 2).map(event => {
                        const pal = getRoomPalette(event.room_id);
                        return (
                          <div key={event.id} className="event-chip" style={{ background: pal.bg, color: pal.solid, borderLeft: `2px solid ${pal.solid}` }}>
                            {event.jam_mulai} {event.agenda}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>+{dayEvents.length - 2} lagi</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Detail Tanggal */}
      {showDateModal && selectedCalDate && (() => {
        const dateEvents = monthlySchedules.filter(s => getLocalDateString(s.tanggal) === selectedCalDate);
        const dateLabel = new Date(selectedCalDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        // Group events by room
        const roomMap = {};
        dateEvents.forEach(ev => {
          if (!roomMap[ev.room_id]) roomMap[ev.room_id] = { nama_ruangan: ev.nama_ruangan, room_id: ev.room_id, events: [] };
          roomMap[ev.room_id].events.push(ev);
        });
        const roomGroups = Object.values(roomMap);

        return (
          <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
            <div className="modal-content" style={{ maxWidth: '620px', padding: 0 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ padding: '1.5rem 2rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-main)' }}>Detail Rapat</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>{dateLabel}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    onClick={() => handleOpenModal(selectedCalDate)}
                    style={{
                      background: 'var(--primary)', color: 'white', border: 'none',
                      padding: '0.55rem 1.1rem', borderRadius: '10px', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📋 Booking Tanggal Ini
                  </button>
                  <button className="modal-close" onClick={() => setShowDateModal(false)}>×</button>
                </div>
              </div>

              <div className="modal-body" style={{ padding: '1.5rem 2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                {dateEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
                    <p style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Belum ada reservasi ruangan pada tanggal ini.</p>
                    <button
                      onClick={() => handleOpenModal(selectedCalDate)}
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700 }}
                    >
                      + Buat Reservasi untuk Tanggal Ini
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {roomGroups.map(group => {
                      const pal = getRoomPalette(group.room_id);
                      const roomData = roomsList.find(r => r.id === group.room_id);
                      return (
                        <div key={group.room_id}>
                          <h4 style={{ color: pal.color, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: `1px solid ${pal.glowBorder}`, paddingBottom: '0.75rem' }}>
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: pal.solid, boxShadow: `0 0 10px ${pal.solid}` }} />
                            {group.nama_ruangan}{roomData ? ` (Maks ${roomData.kapasitas} Orang)` : ''}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {group.events.map(ev => (
                              <div
                                key={ev.id}
                                style={{
                                  background: pal.bg,
                                  border: `1.5px solid ${pal.solid}`,
                                  borderRadius: '12px',
                                  padding: '1rem 1.25rem',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: pal.solid, fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                  <span style={{ background: pal.solid, color: '#fff', borderRadius: '6px', padding: '0.15rem 0.5rem', fontSize: '0.85rem' }}>🕒</span>
                                  {ev.jam_mulai} - {ev.jam_selesai}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.3rem' }}>{ev.agenda}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  👤 Pemesan: {ev.pemesan || ev.nama_lengkap}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Booking */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" style={{ maxWidth: '650px', padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: roomPal.solid, color: 'white', padding: '1.5rem 2rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Reservasi {roomInfo.roomName}</h3>
                <p style={{ margin: 0, opacity: 0.9, marginTop: '0.3rem' }}>
                  {modalStep === 1 ? 'Login untuk melanjutkan pemesanan' : 'Lengkapi detail rapat'}
                </p>
              </div>
              <button className="modal-close" onClick={handleCloseModal} style={{ color: 'white' }}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ padding: '2rem' }}>
              {bookingSuccess ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>✅</div>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>{bookingSuccess}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '1rem' }}>Halaman ini akan tertutup otomatis dalam 3 detik...</p>
                </div>
              ) : (
                <form onSubmit={modalStep === 1 ? (e) => { e.preventDefault(); setModalStep(2); } : handleBooking}>
                  {bookingError && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{bookingError}</div>}

                  {modalStep === 1 ? (
                    <div className="animate-fade-in-up">
                      <div className="form-group">
                        <label>Email Pengguna</label>
                        <input type="email" className="form-input" placeholder="Masukkan email Anda" value={email} onChange={e=>setEmail(e.target.value)} required />
                      </div>
                      
                      <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-input" placeholder="Masukkan password Anda" value={password} onChange={e=>setPassword(e.target.value)} required />
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                        <button type="button" onClick={handleCloseModal} className="btn" style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 600 }}>Batal</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 600, background: roomPal.solid, boxShadow: `0 4px 15px ${roomPal.glowShadow}` }}>
                          Lanjut →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in-up">
                      <div className="form-group">
                        <label>Tanggal Rapat</label>
                        <input type="date" className="form-input" value={tanggal} onChange={e=>setTanggal(e.target.value)} required />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                          <label>Jam Mulai</label>
                          <input type="time" className="form-input" value={jamMulai} onChange={e=>setJamMulai(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label>Jam Selesai</label>
                          <input type="time" className="form-input" value={jamSelesai} onChange={e=>setJamSelesai(e.target.value)} required />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Agenda Utama</label>
                        <input type="text" className="form-input" placeholder="Contoh: Pembahasan Budget Q3" value={agenda} onChange={e=>setAgenda(e.target.value)} required />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                          <label>Pemateri (Opsional)</label>
                          <input type="text" className="form-input" placeholder="Nama pemateri" value={pemateri} onChange={e=>setPemateri(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Peserta</label>
                          <input type="number" className="form-input" placeholder="Jml" value={jumlahPeserta} onChange={e=>setJumlahPeserta(e.target.value)} max={roomInfo.kapasitas} required />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Catatan Tambahan (Opsional)</label>
                        <textarea className="form-input" rows="2" placeholder="Keperluan proyektor, konsumsi, dsb." value={catatan} onChange={e=>setCatatan(e.target.value)}></textarea>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                        <button type="button" onClick={() => setModalStep(1)} className="btn" style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 600 }}>← Kembali</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 600, background: roomPal.solid, boxShadow: `0 4px 15px ${roomPal.glowShadow}` }} disabled={bookingLoading}>
                          {bookingLoading ? 'Memproses...' : 'Kirim Booking'}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
