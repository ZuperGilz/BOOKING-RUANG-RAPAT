import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KioskContext } from '../context/KioskContext';
import api from '../services/api';
import useIdleTimer from '../hooks/useIdleTimer';
import Screensaver from '../components/Kiosk/Screensaver';

const ROOM_PALETTE = {
  1: { color: '#fca5a5', bg: 'rgba(220,38,38,0.1)', border: '#dc2626', solid: '#dc2626', gradient: 'linear-gradient(135deg, var(--text-main) 0%, var(--text-muted) 100%)', chipClass: 'chip-ruang-a', glowBorder: 'rgba(220,38,38,0.2)', glowShadow: 'rgba(220,38,38,0.4)' },
  2: { color: '#6ee7b7', bg: 'rgba(16,185,129,0.1)', border: '#10b981', solid: '#10b981', gradient: 'linear-gradient(135deg, #6ee7b7 0%, #10b981 100%)', chipClass: 'chip-ruang-b', glowBorder: 'rgba(16,185,129,0.2)', glowShadow: 'rgba(16,185,129,0.4)' },
  3: { color: '#93c5fd', bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', solid: '#3b82f6', gradient: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)', chipClass: 'chip-ruang-c', glowBorder: 'rgba(59,130,246,0.2)', glowShadow: 'rgba(59,130,246,0.4)' },
  4: { color: '#c4b5fd', bg: 'rgba(139,92,246,0.1)', border: '#8b5cf6', solid: '#8b5cf6', gradient: 'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%)', chipClass: 'chip-ruang-d', glowBorder: 'rgba(139,92,246,0.2)', glowShadow: 'rgba(139,92,246,0.4)' },
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
  
  // State baru untuk menangkap error proteksi dari backend
  const [authError, setAuthError] = useState(null);

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

  const isIdle = useIdleTimer(30 * 1000); // 30 detik untuk demonstrasi/screensaver

  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState('');

  // 1. Ambil atau buat Device UUID lokal unik di browser ini
  const getDeviceUuid = () => {
    let uuid = localStorage.getItem('kiosk_device_uuid');
    if (!uuid) {
      uuid = 'UUID-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('kiosk_device_uuid', uuid);
    }
    return uuid;
  };

  // 2. Fungsi pembantu untuk menyusun custom header (Token + UUID)
  const getKioskHeaders = () => {
    return {
      'X-Device-Token': deviceToken,
      'X-Device-UUID': getDeviceUuid()
    };
  };

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
        headers: getKioskHeaders()
      });
      setSchedule(res.data);
      setAuthError(null);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setAuthError(err.response.data.message);
      }
    }
  };

  const fetchUpcoming = async () => {
    if (!deviceToken) return;
    try {
      const today = getLocalDateString(new Date());
      const res = await api.get(`/kiosk/upcoming?tanggal=${today}`, {
        headers: getKioskHeaders()
      });
      setUpcoming(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setAuthError(err.response.data.message);
      }
    }
  };

  const sendHeartbeat = async () => {
    if (!deviceToken) return;
    try {
      await api.post('/kiosk/heartbeat', {}, { 
        headers: getKioskHeaders() 
      });
    } catch (err) {
      if (err.response?.status === 403) {
        setAuthError(err.response.data.message);
      }
    }
  };

  const fetchRooms = async () => {
    if (!deviceToken) return;
    try {
      const res = await api.get('/kiosk/rooms', { 
        headers: getKioskHeaders() 
      });
      setRoomsList(res.data);
    } catch (err) { }
  };

  const fetchCalendar = async (roomIdToFetch) => {
    if (!deviceToken) return;
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      let url = `/kiosk/calendar?bulan=${month}&tahun=${year}`;
      if (roomIdToFetch) url += `&roomId=${roomIdToFetch}`;

      const res = await api.get(url, { 
        headers: getKioskHeaders() 
      });
      setMonthlySchedules(res.data);
    } catch (err) { }
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

  useEffect(() => {
    if (isIdle && showModal) {
      handleCloseModal();
    }
    if (isIdle && showDateModal) {
      setShowDateModal(false);
    }
  }, [isIdle, showModal, showDateModal]);

  const handleOpenModal = (presetDate) => {
    setShowModal(true);
    setModalStep(1);
    setTanggal(presetDate || getLocalDateString(new Date()));
    setShowDateModal(false);
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

  const handleVerifyUser = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingLoading(true);
    try {
      await api.post('/kiosk/verify-user', { email, password }, {
        headers: getKioskHeaders()
      });
      setModalStep(2);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Login gagal');
    } finally {
      setBookingLoading(false);
    }
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
        headers: getKioskHeaders()
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

  // 🔒 TAMPILAN BLOKIR UTAMA: Jika token ditolak oleh sistem penguncian multi-perangkat
  if (authError) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#fff', textAlign: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
        <div style={{ padding: '2.5rem 2rem', background: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" style={{ marginBottom: '1rem' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <h2 style={{ fontSize: '1.4rem', color: '#1E293B', margin: '0 0 0.5rem 0', fontWeight: 800 }}>Proteksi Keamanan Kiosk</h2>
          <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>{authError}</p>
          <button 
            onClick={() => { deactivate(); setAuthError(null); window.location.reload(); }}
            style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Keluar dari Sesi Kiosk
          </button>
        </div>
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
    <>
      {isIdle && <Screensaver roomInfo={roomInfo} schedule={schedule} upcoming={upcoming} currentTime={currentTime} />}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-body)', overflowY: 'auto', paddingBottom: '7rem' }}>

        {/* Header - baris atas: nama ruang & jam */}
        <div className="glass-card" style={{ padding: '1.5rem 1.75rem', margin: '1.25rem 1.25rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(0,0,0,0.8) 100%)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: '13px', height: '13px', borderRadius: '50%', backgroundColor: roomPal.solid, boxShadow: `0 0 15px ${roomPal.solid}`, animation: 'pulseGlow 2s infinite' }}></span>
              🏢 {roomInfo.roomName}
            </h1>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem', marginTop: '0.4rem', color: 'rgba(255,255,255,0.7)' }}>
              Kapasitas Maksimal: <strong style={{ color: '#fff' }}>{roomInfo.kapasitas} Orang</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right', color: '#fff' }}>
            <h2 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{timeStr}</h2>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{todayStr}</p>
          </div>
        </div>

        {/* Jadwal Rapat Hari Ini - full width */}
        <div style={{ padding: '0.75rem 1.25rem 0' }}>
          <div className="brutal-card" style={{ display: 'flex', flexDirection: 'column', borderColor: roomPal.solid, boxShadow: `6px 6px 0px ${roomPal.glowBorder}`, background: 'var(--bg-surface)', minHeight: '300px', maxHeight: '380px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '1.25rem', background: roomPal.solid, borderRadius: '3px' }} />
                Jadwal Rapat Hari Ini
              </h2>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: roomPal.solid, background: roomPal.bg, padding: '0.35rem 0.85rem', borderRadius: '20px' }}>
                🔄 Auto-refresh tiap 30 dtk
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {schedule.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.8 }}>🟢</div>
                  <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Ruangan Kosong Seharian</h3>
                  <p style={{ fontSize: '1rem' }}>Belum ada jadwal rapat untuk hari ini.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {schedule.map(b => {
                    const [hStart, mStart] = b.jam_mulai.split(':');
                    const [hEnd, mEnd] = b.jam_selesai.split(':');
                    const start = new Date(); start.setHours(hStart, mStart, 0);
                    const end = new Date(); end.setHours(hEnd, mEnd, 0);
                    const now = currentTime;

                    let statusCard = 'upcoming'; 
                    if (now >= start && now <= end) statusCard = 'ongoing';
                    else if (now > end) statusCard = 'past';

                    let bgCard = 'var(--bg-body)';
                    let borderLeft = '4px solid var(--border)';
                    if (statusCard === 'ongoing') { bgCard = roomPal.bg; borderLeft = `4px solid ${roomPal.solid}`; }
                    if (b.status === 'PENDING') { bgCard = 'rgba(245,158,11,0.1)'; borderLeft = '4px solid #f59e0b'; }

                    return (
                      <div key={b.id} className="upcoming-hero-card" style={{ background: bgCard, borderLeft, opacity: statusCard === 'past' ? 0.6 : 1, borderColor: statusCard === 'ongoing' ? roomPal.glowBorder : 'var(--border)' }}>
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: statusCard === 'ongoing' ? roomPal.solid : 'var(--primary)', minWidth: '120px' }}>
                            {b.jam_mulai} <br />
                            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>- {b.jam_selesai}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: '150px' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>{b.agenda}</h4>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                              <span>👤 {b.pemesan}</span>
                              <span>👥 {b.jumlah_peserta} peserta</span>
                            </p>
                          </div>
                          <div>
                            {b.status === 'PENDING' && <span className="badge" style={{ background: '#fef3c7', color: '#b45309', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>⏳ Menunggu Approval</span>}
                            {b.status === 'APPROVED' && statusCard === 'ongoing' && (
                              <span className="badge" style={{ background: roomPal.solid, color: 'white', padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', animation: 'pulseGlow 2s infinite' }} />
                                Sedang Berlangsung
                              </span>
                            )}
                            {b.status === 'APPROVED' && statusCard === 'upcoming' && <span className="badge" style={{ background: '#dcfce7', color: '#15803d', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>Akan Datang</span>}
                            {statusCard === 'past' && <span className="badge" style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>Selesai</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Jadwal Rapat Berikutnya */}
        <div style={{ padding: '1.25rem 1.25rem 0' }}>
          <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <span style={{ display: 'inline-block', width: '4px', height: '1rem', background: roomPal.solid, borderRadius: '2px' }} />
            Info Jadwal Rapat Berikutnya
          </h4>

          {upcoming.length === 0 ? (
            <div className="brutal-card" style={{ padding: '1.25rem', background: 'var(--bg-surface)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Tidak ada jadwal rapat berikutnya untuk hari ini.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
              {upcoming.map((item) => {
                const dateObj = new Date(item.tanggal);
                const dayStr = dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
                return (
                  <div key={item.id} className="brutal-card" style={{ minWidth: '150px', maxWidth: '150px', flexShrink: 0, background: roomPal.bg, borderColor: roomPal.solid, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ textAlign: 'center', minWidth: '42px', background: roomPal.solid, borderRadius: '8px', padding: '0.3rem' }}>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase' }}>{dayStr.split(' ')[0]}</div>
                        <div style={{ fontSize: '1rem', color: 'white', fontWeight: 'bold', lineHeight: 1 }}>{dateObj.getDate()}</div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.jam_mulai}–{item.jam_selesai}</div>
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.agenda}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar Section */}
        <div style={{ padding: '1.75rem 1.25rem 0', marginTop: '0.5rem', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between stagger-3" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.85rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem' }}>Kalender Ruangan</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Lihat jadwal rapat bulan ini pada ruangan yang dipilih.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cek Ruang Lain:</label>
              <select
                value={selectedRoomId || ''}
                onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                  fontSize: '0.95rem',
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
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>{monthNames[month]} {year}</h3>
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

        {/* Tombol Pesan Ruangan Sticky */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          marginTop: '1.75rem',
          padding: '1rem 1.25rem',
          background: 'linear-gradient(180deg, transparent 0%, var(--bg-body) 35%)',
          backdropFilter: 'blur(6px)',
          zIndex: 5
        }}>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '1.15rem',
              fontSize: '1.15rem',
              fontWeight: 'bold',
              background: roomPal.solid,
              boxShadow: `0 8px 20px ${roomPal.glowShadow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem'
            }}
          >
            📝 Pesan Ruangan Ini
          </button>
        </div>

        {/* Modal Detail Tanggal */}
        {showDateModal && selectedCalDate && (() => {
          const dateEvents = monthlySchedules.filter(s => getLocalDateString(s.tanggal) === selectedCalDate);
          const dateLabel = new Date(selectedCalDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
                <style>{`
                .form-input[type="date"]::-webkit-calendar-picker-indicator,
                .form-input[type="time"]::-webkit-calendar-picker-indicator {
                  filter: invert(1) brightness(1.8);
                  cursor: pointer;
                  opacity: 0.9;
                }
                .form-input[type="date"]::-webkit-calendar-picker-indicator:hover,
                .form-input[type="time"]::-webkit-calendar-picker-indicator:hover {
                  opacity: 1;
                }
              `}</style>
                {bookingSuccess ? (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>✅</div>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>{bookingSuccess}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '1rem' }}>Halaman ini akan tertutup otomatis dalam 3 detik...</p>
                  </div>
                ) : (
                  <form onSubmit={modalStep === 1 ? handleVerifyUser : handleBooking}>
                    {bookingError && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{bookingError}</div>}

                    {modalStep === 1 ? (
                      <div className="animate-fade-in-up">
                        <div className="form-group">
                          <label>Email Pengguna</label>
                          <input type="email" className="form-input" placeholder="Masukkan email Anda" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>

                        <div className="form-group">
                          <label>Password</label>
                          <input type="password" className="form-input" placeholder="Masukkan password Anda" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                          <button type="button" onClick={handleCloseModal} className="btn" style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 600 }}>Batal</button>
                          <button type="submit" className="btn btn-primary" disabled={bookingLoading} style={{ flex: 2, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 600, background: roomPal.solid, boxShadow: `0 4px 15px ${roomPal.glowShadow}` }}>
                            {bookingLoading ? 'Memverifikasi...' : 'Lanjut →'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-fade-in-up">
                        <div style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                          <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: roomPal.solid }}>✦</span> Jadwal
                          </h4>
                          <div className="form-group">
                            <label className="form-label">Tanggal Rapat</label>
                            <input type="date" className="form-input" value={tanggal} onChange={e => setTanggal(e.target.value)} required style={{ background: 'var(--badge-bg)' }} />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Jam Mulai</label>
                              <input type="time" className="form-input" value={jamMulai} onChange={e => setJamMulai(e.target.value)} required style={{ background: 'var(--badge-bg)' }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">Jam Selesai</label>
                              <input type="time" className="form-input" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} required style={{ background: 'var(--badge-bg)' }} />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: roomPal.solid }}>✦</span> Detail Acara
                          </h4>
                          <div className="form-group">
                            <label className="form-label">Agenda Utama</label>
                            <input type="text" className="form-input" placeholder="Contoh: Pembahasan Budget Q3" value={agenda} onChange={e => setAgenda(e.target.value)} required style={{ background: 'var(--badge-bg)' }} />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Nama Pemateri / Narasumber (Opsional)</label>
                            <input type="text" className="form-input" placeholder="Kosongkan jika tidak ada" value={pemateri} onChange={e => setPemateri(e.target.value)} style={{ background: 'var(--badge-bg)' }} />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Jumlah Peserta</label>
                            <input type="number" className="form-input" placeholder="Jml" value={jumlahPeserta} onChange={e => setJumlahPeserta(e.target.value)} max={roomInfo.kapasitas} required style={{ background: 'var(--badge-bg)' }} />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Catatan Tambahan (Opsional)</label>
                            <textarea className="form-input" rows="2" placeholder="Keperluan proyektor, konsumsi, dsb." value={catatan} onChange={e => setCatatan(e.target.value)} style={{ background: 'var(--badge-bg)', resize: 'vertical' }}></textarea>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                          <button type="button" onClick={() => setModalStep(1)} className="btn" style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 600 }}>← Kembali</button>
                          <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '1.2rem', fontSize: '1.1rem', fontWeight: 600, background: roomPal.solid, boxShadow: `0 4px 15px ${roomPal.glowShadow}` }} disabled={bookingLoading}>
                            {bookingLoading ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                                Memproses...
                              </div>
                            ) : 'Ajukan Reservasi'}
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
    </>
  );
}