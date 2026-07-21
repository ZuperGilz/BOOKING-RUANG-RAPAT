import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// ─── Sistem warna dinamis per ruangan (sama seperti LandingPage) ────────────
const ROOM_PALETTE = {
  1: { color: '#fca5a5', bg: 'rgba(220,38,38,0.1)',    border: '#dc2626', solid: '#dc2626', gradient: 'linear-gradient(135deg, var(--text-main) 0%, var(--text-muted) 100%)', chipClass: 'chip-ruang-a' },
  2: { color: '#6ee7b7', bg: 'rgba(16,185,129,0.1)',   border: '#10b981', solid: '#10b981', gradient: 'linear-gradient(135deg, #6ee7b7 0%, #10b981 100%)',                   chipClass: 'chip-ruang-b' },
  3: { color: '#93c5fd', bg: 'rgba(59,130,246,0.1)',   border: '#3b82f6', solid: '#3b82f6', gradient: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)',                   chipClass: 'chip-ruang-c' },
  4: { color: '#c4b5fd', bg: 'rgba(139,92,246,0.1)',   border: '#8b5cf6', solid: '#8b5cf6', gradient: 'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%)',                   chipClass: 'chip-ruang-d' },
};
const ROOM_PALETTE_DEFAULT = { color: '#fdba74', bg: 'rgba(249,115,22,0.1)', border: '#f97316', solid: '#f97316', gradient: 'linear-gradient(135deg, #fdba74 0%, #f97316 100%)', chipClass: 'chip-ruang-x' };
const getRoomPalette = (roomId) => ROOM_PALETTE[roomId] || ROOM_PALETTE_DEFAULT;
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  const getLocalDateString = (dateValue) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [monthlySchedules, setMonthlySchedules] = useState([]);
  const [allUpcoming, setAllUpcoming] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch rooms list
  useEffect(() => {
    api.get('/bookings/rooms')
      .then(res => setRoomsList(res.data))
      .catch(err => console.error(err));
  }, []);

  // Clock update
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Fetch schedules untuk bulan ini
  useEffect(() => {
    const fetchMonthlyData = async () => {
      setLoading(true);
      try {
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        const res = await api.get(`/bookings/schedule?bulan=${month}&tahun=${year}`);
        setMonthlySchedules(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetchMonthlyData();
  }, [currentMonth]);

  // Fetch upcoming dari public API untuk kartu upcoming user
  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await api.get('/bookings/schedule?bulan=' + (new Date().getMonth() + 1) + '&tahun=' + new Date().getFullYear());
        const now = new Date();
        const upcoming = res.data
          .map(item => {
            const dateOnly = getLocalDateString(item.tanggal);
            const startDT = new Date(`${dateOnly}T${item.jam_mulai}:00`);
            const endDT = new Date(`${dateOnly}T${item.jam_selesai}:00`);
            let status = 'UPCOMING';
            if (now >= startDT && now <= endDT) status = 'ONGOING';
            else if (now > endDT) status = 'FINISHED';
            return { ...item, startDateTime: startDT, endDateTime: endDT, status };
          })
          .filter(s => s.status !== 'FINISHED')
          .sort((a, b) => a.startDateTime - b.startDateTime);
        setAllUpcoming(upcoming);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUpcoming();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = Array(firstDay).fill(null).concat([...Array(daysInMonth).keys()].map(i => i + 1));

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const handleDateClick = (day) => {
    if (!day) return;
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(formattedDate);
    setIsModalOpen(true);
  };

  const handleBookFromCalendar = (dateStr) => {
    setIsModalOpen(false);
    navigate(`/dashboard/booking?tanggal=${dateStr}`);
  };

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const formatDateIndo = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateShort = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const dailySchedules = monthlySchedules.filter(s => getLocalDateString(s.tanggal) === selectedDate);
  const todayStr = getLocalDateString(new Date());

  const upcomingHero = allUpcoming.length > 0 ? allUpcoming[0] : null;
  const miniUpcoming = allUpcoming.slice(1, 11);

  const calculateDuration = (start, end) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let totalMins = (endH * 60 + endM) - (startH * 60 + startM);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours > 0 && mins > 0) return `${hours}j ${mins}m`;
    if (hours > 0) return `${hours} Jam`;
    return `${mins} Menit`;
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div>
      {/* WELCOME BANNER */}
      <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', padding: '2.5rem', marginBottom: '2.5rem', borderRadius: '16px', border: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(0,0,0,0.8) 100%)' }}>
        <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Selamat Datang, {user?.namaLengkap}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '0.5rem 0 0 0', fontWeight: 500 }}>
          {formatDateIndo(new Date())} — Anda berada di sistem reservasi Ruang Rapat Semen Padang.
        </p>
      </div>

      {/* === SECTION: RAPAT AKAN DATANG (hanya untuk USER biasa) === */}
      {!isAdmin && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '4px', height: '1.25rem', background: 'var(--primary)', borderRadius: '2px' }} />
            Rapat Akan Datang
          </h2>

          {/* Upcoming Hero Card */}
          {loading ? (
            <div className="skeleton" style={{ height: '140px', borderRadius: '12px', marginBottom: '1rem' }} />
          ) : upcomingHero ? (
            <div className="upcoming-hero-card" style={{ marginBottom: '1rem', borderRadius: '12px', borderColor: getRoomPalette(upcomingHero.room_id).glowBorder || 'rgba(220,38,38,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  {/* Status badge */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: upcomingHero.status === 'ONGOING' ? getRoomPalette(upcomingHero.room_id).bg : 'rgba(245,158,11,0.08)', border: `1px solid ${upcomingHero.status === 'ONGOING' ? getRoomPalette(upcomingHero.room_id).border + '88' : '#FFE066'}`, color: upcomingHero.status === 'ONGOING' ? getRoomPalette(upcomingHero.room_id).color : '#B45309', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.6rem' }}>
                    {upcomingHero.status === 'ONGOING' ? (
                      <>
                        <span style={{ width: '6px', height: '6px', background: getRoomPalette(upcomingHero.room_id).solid, borderRadius: '50%', animation: 'pulseGlow 2s infinite' }} />
                        Sedang Berlangsung
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Segera Datang
                      </>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem', lineHeight: 1.2 }}>{upcomingHero.agenda}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
                    {formatDateIndo(upcomingHero.tanggal)} • {upcomingHero.jam_mulai} – {upcomingHero.jam_selesai}
                    <span style={{ marginLeft: '0.5rem', background: 'var(--bg-body)', border: '1px solid var(--border)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {calculateDuration(upcomingHero.jam_mulai, upcomingHero.jam_selesai)}
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span style={{ background: getRoomPalette(upcomingHero.room_id).solid, color: 'white', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                    {upcomingHero.nama_ruangan}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>👤 {upcomingHero.pemesan}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <svg width="36" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Tidak ada rapat yang akan datang</span>
            </div>
          )}

          {/* Mini Upcoming Scroll */}
          {!loading && miniUpcoming.length > 0 && (
            <div className="mini-scroll-container">
              {miniUpcoming.map((item, idx) => {
                const p = getRoomPalette(item.room_id);
                return (
                  <div
                    key={item.id || idx}
                    className="mini-upcoming-card"
                    style={{ borderTop: `3px solid ${p.solid}`, borderRadius: '8px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: p.solid, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {item.nama_ruangan}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 5px', borderRadius: '4px', fontWeight: 600 }}>
                        {item.jam_mulai}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '0.25rem 0', lineHeight: 1.3 }}>
                      {item.agenda}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {formatDateShort(item.tanggal)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick action */}
          <div style={{ marginTop: '1.25rem' }}>
            <Link to="/dashboard/booking" style={{ fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Buat Reservasi Baru
            </Link>
          </div>
        </div>
      )}

      {/* === ADMIN: tampilkan stat cards biasa === */}
      {isAdmin && (
        <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="brutal-card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-surface)', boxShadow: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="flex-between">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>RAPAT HARI INI</div>
              <span style={{ padding: '0.5rem', background: '#EEF2FF', color: '#4F46E5', borderRadius: '8px', display: 'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--text-main)', lineHeight: 1 }}>
              {loading ? <div className="skeleton" style={{width: '60px', height: '40px'}} /> : monthlySchedules.filter(s => getLocalDateString(s.tanggal) === todayStr).length}
            </div>
            <Link to="/dashboard/booking" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '700', marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Buat Reservasi Baru
            </Link>
          </div>

          <div className="brutal-card" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.02)', boxShadow: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="flex-between">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' }}>TOTAL RAPAT BULAN INI</div>
              <span style={{ padding: '0.5rem', background: 'rgba(245,158,11,0.12)', color: '#D97706', borderRadius: '8px', display: 'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--text-main)', lineHeight: 1 }}>
              {loading ? <div className="skeleton" style={{width: '60px', height: '40px'}} /> : monthlySchedules.length}
            </div>
            <Link to="/dashboard/riwayat" style={{ fontSize: '0.85rem', color: '#D97706', textDecoration: 'none', fontWeight: '700', marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              Lihat Riwayat Saya →
            </Link>
          </div>
        </div>
      )}

      {/* CALENDAR HEADER / LEGEND ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Jadwal Ruangan</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            {isAdmin ? 'Pilih tanggal pada grid untuk melihat detail operasional.' : 'Ketuk tanggal untuk melihat jadwal atau langsung booking ruangan.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', fontWeight: '700', background: 'var(--bg-surface)', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {roomsList.length > 0 ? roomsList.map(r => (
            <span key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: getRoomPalette(r.id).solid }} /> {r.nama}
            </span>
          )) : <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Memuat ruang...</span>}
        </div>
      </div>

      {/* CALENDAR */}
      <div className="calendar-container" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div className="calendar-header" style={{ padding: '1rem 1.5rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={handlePrevMonth} className="calendar-nav-btn">❮</button>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{monthNames[month]} {year}</h3>
          <button onClick={handleNextMonth} className="calendar-nav-btn">❯</button>
        </div>

        {loading ? (
           <div className="calendar-grid">
              {Array.from({length: 35}).map((_, i) => (
                 <div key={i} className="calendar-cell skeleton" style={{ minHeight: '120px' }} />
              ))}
           </div>
        ) : (
          <div className="calendar-grid">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
              <div key={day} className="calendar-day-name" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{day}</div>
            ))}

            {days.map((day, index) => {
              const formattedDate = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const isActive = selectedDate === formattedDate;
              const isToday = todayStr === formattedDate;
              const dayEvents = monthlySchedules.filter(s => getLocalDateString(s.tanggal) === formattedDate);

              return (
                <div key={index} onClick={() => handleDateClick(day)} className={`calendar-cell ${!day ? 'empty' : ''} ${isActive ? 'active' : ''}`} style={isToday ? { borderColor: 'rgba(220,38,38,0.5)' } : {}}>
                  {day && (
                    <>
                      <div className="calendar-date-num" style={isToday ? { color: '#fca5a5', fontWeight: 700 } : { fontWeight: 600 }}>{day}</div>
                      {dayEvents.slice(0, 2).map(event => {
                        const pal = getRoomPalette(event.room_id);
                        return (
                          <div key={event.id} className="event-chip" style={{ background: pal.bg, color: pal.solid, borderLeft: `2px solid ${pal.solid}`, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {event.jam_mulai} {event.agenda}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px', paddingLeft: '4px' }}>+{dayEvents.length - 2} lagi</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div className="modal-header" style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Detail Rapat</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0', fontWeight: 500 }}>{formatDateIndo(new Date(selectedDate))}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => handleBookFromCalendar(selectedDate)}
                  style={{
                    background: 'var(--primary)', color: 'white', border: 'none',
                    padding: '0.45rem 0.9rem', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Booking Tanggal Ini
                </button>
                <button className="modal-close" onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.3rem', color: 'var(--text-muted)' }}>&times;</button>
              </div>
            </div>
            
            <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
              {dailySchedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Belum ada reservasi ruangan pada tanggal ini.</p>
                  <div style={{ marginTop: '1.25rem' }}>
                    <button
                      onClick={() => handleBookFromCalendar(selectedDate)}
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}
                    >
                      + Buat Reservasi
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {roomsList.map(room => {
                    const roomSchedules = dailySchedules.filter(s => s.room_id === room.id);
                    const pal = getRoomPalette(room.id);
                    return (
                      <div key={room.id}>
                        <h4 style={{ color: pal.color, fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: `1px solid ${pal.glowBorder}`, paddingBottom: '0.5rem', margin: 0 }}>
                          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', backgroundColor: pal.solid }} />
                          {room.nama} <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>(Maks {room.kapasitas} Orang)</span>
                        </h4>
                        {roomSchedules.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: '0.5rem 0 0 0', fontWeight: 500 }}>Belum ada reservasi.</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: roomSchedules.length > 0 ? '0.75rem' : 0 }}>
                          {roomSchedules.map(s => (
                            <div key={s.id} className="brutal-card" style={{ padding: '1rem', borderRadius: '8px', borderColor: pal.solid, boxShadow: 'none', background: pal.bg }}>
                              <div style={{ color: pal.color, fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                 <span style={{ background: pal.solid, color: '#fff', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                 </span> 
                                 {s.jam_mulai} - {s.jam_selesai}
                              </div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.4rem' }}>{s.agenda}</div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>👤 Pemesan: {s.nama_lengkap || s.pemesan}</div>
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
      )}
    </div>
  );
}