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

  // Klik tanggal di kalender → navigate ke form booking dengan date preset
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

  // Upcoming hero = jadwal terdekat
  const upcomingHero = allUpcoming.length > 0 ? allUpcoming[0] : null;
  // Mini upcoming = sisanya (max 10)
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
      <div className="glass-card stagger-1" style={{ position: 'relative', overflow: 'hidden', padding: '2.5rem', marginBottom: '2.5rem', background: 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(0,0,0,0.8) 100%)' }}>
        <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '2rem' }}>Selamat Datang, {user?.namaLengkap} 👋</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', margin: 0 }}>
          {formatDateIndo(new Date())} — Anda berada di sistem reservasi Ruang Rapat Semen Padang.
        </p>
      </div>

      {/* === SECTION: RAPAT AKAN DATANG (hanya untuk USER biasa) === */}
      {!isAdmin && (
        <div className="stagger-2" style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'inline-block', width: '4px', height: '1.4rem', background: 'var(--primary)', borderRadius: '2px' }} />
            Rapat Akan Datang
          </h2>

          {/* Upcoming Hero Card */}
          {loading ? (
            <div className="skeleton" style={{ height: '140px', borderRadius: '20px', marginBottom: '1rem' }} />
          ) : upcomingHero ? (
            <div className="upcoming-hero-card" style={{ marginBottom: '1rem', borderColor: getRoomPalette(upcomingHero.room_id).glowBorder || 'rgba(220,38,38,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  {/* Status badge — warna sesuai status */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: upcomingHero.status === 'ONGOING' ? getRoomPalette(upcomingHero.room_id).bg : 'rgba(245,158,11,0.12)', border: `1px solid ${upcomingHero.status === 'ONGOING' ? getRoomPalette(upcomingHero.room_id).border + '88' : 'rgba(245,158,11,0.4)'}`, color: upcomingHero.status === 'ONGOING' ? getRoomPalette(upcomingHero.room_id).color : '#fcd34d', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                    {upcomingHero.status === 'ONGOING'
                      ? <><span style={{ width: '6px', height: '6px', background: getRoomPalette(upcomingHero.room_id).solid, borderRadius: '50%', animation: 'pulseGlow 2s infinite' }} />Sedang Berlangsung</>
                      : '⏱️ Segera Datang'
                    }
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '0.3rem', lineHeight: 1.2 }}>{upcomingHero.agenda}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {formatDateIndo(upcomingHero.tanggal)} • {upcomingHero.jam_mulai} – {upcomingHero.jam_selesai}
                    <span style={{ marginLeft: '0.5rem', background: 'rgba(255,255,255,0.07)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      {calculateDuration(upcomingHero.jam_mulai, upcomingHero.jam_selesai)}
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  {/* Room badge — warna dinamis */}
                  <span style={{ background: getRoomPalette(upcomingHero.room_id).solid, color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {upcomingHero.nama_ruangan}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>👤 {upcomingHero.pemesan}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <span style={{ display: 'block', fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>📭</span>
              Tidak ada rapat yang akan datang
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
                    style={{ borderTop: `3px solid ${p.solid}` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: p.solid, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {item.nama_ruangan}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>
                        {item.jam_mulai}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                      {item.agenda}
                    </p>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {formatDateShort(item.tanggal)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick action */}
          <div style={{ marginTop: '1rem' }}>
            <Link to="/dashboard/booking" style={{ fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              + Buat Reservasi Baru
            </Link>
          </div>
        </div>
      )}

      {/* === ADMIN: tampilkan stat cards biasa === */}
      {isAdmin && (
        <div className="bento-grid stagger-2" style={{ marginBottom: '3rem' }}>
          <div className="brutal-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="flex-between">
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>RAPAT HARI INI</div>
              <span style={{ padding: '0.5rem', background: 'var(--primary-light)', color: '#fca5a5', borderRadius: '8px' }}>📅</span>
            </div>
            <div style={{ fontSize: '3.5rem', fontWeight: '700', margin: '0.5rem 0', color: 'var(--text-main)', lineHeight: 1 }}>
              {loading ? <div className="skeleton" style={{width: '60px', height: '60px'}} /> : monthlySchedules.filter(s => getLocalDateString(s.tanggal) === todayStr).length}
            </div>
            <Link to="/dashboard/booking" style={{ fontSize: '0.9rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>+ Buat Reservasi Baru</Link>
          </div>

          <div className="brutal-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderColor: 'rgba(245,158,11,0.5)', boxShadow: '4px 4px 0px rgba(245,158,11,0.5)' }}>
            <div className="flex-between">
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>TOTAL RAPAT BULAN INI</div>
              <span style={{ padding: '0.5rem', background: 'rgba(245,158,11,0.15)', color: '#fcd34d', borderRadius: '8px' }}>📊</span>
            </div>
            <div style={{ fontSize: '3.5rem', fontWeight: '700', margin: '0.5rem 0', color: 'var(--text-main)', lineHeight: 1 }}>
              {loading ? <div className="skeleton" style={{width: '60px', height: '60px'}} /> : monthlySchedules.length}
            </div>
            <Link to="/dashboard/riwayat" style={{ fontSize: '0.9rem', color: '#fcd34d', textDecoration: 'none', fontWeight: '600', marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>Lihat Riwayat Saya →</Link>
          </div>
        </div>
      )}

      <div className="flex-between stagger-3" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>Jadwal Ruangan</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isAdmin ? 'Pilih tanggal pada grid untuk melihat detail operasional.' : 'Tap tanggal untuk melihat jadwal atau langsung booking ruangan.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', fontWeight: '600', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {roomsList.length > 0 ? roomsList.map(r => (
            <span key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: getRoomPalette(r.id).solid }} /> {r.nama}
            </span>
          )) : <span style={{ color: 'var(--text-muted)' }}>Memuat ruang...</span>}
        </div>
      </div>

      {/* CALENDAR */}
      <div className="calendar-container stagger-3">
        <div className="calendar-header">
          <button onClick={handlePrevMonth} className="calendar-nav-btn">❮</button>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{monthNames[month]} {year}</h3>
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
              <div key={day} className="calendar-day-name">{day}</div>
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
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Detail Rapat</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{formatDateIndo(new Date(selectedDate))}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                {/* Tombol booking dari kalender */}
                <button
                  onClick={() => handleBookFromCalendar(selectedDate)}
                  style={{
                    background: 'var(--primary)', color: 'white', border: 'none',
                    padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem',
                    transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--primary-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--primary)'}
                >
                  📋 Booking Tanggal Ini
                </button>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
              </div>
            </div>
            <div className="modal-body">
              {dailySchedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}>📭</span>
                  Belum ada reservasi ruangan pada tanggal ini.
                  <div style={{ marginTop: '1.5rem' }}>
                    <button
                      onClick={() => handleBookFromCalendar(selectedDate)}
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700 }}
                    >
                      + Buat Reservasi untuk Tanggal Ini
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  {roomsList.map(room => {
                    const roomSchedules = dailySchedules.filter(s => s.room_id === room.id);
                    const pal = getRoomPalette(room.id);
                    return (
                      <div key={room.id}>
                        <h4 style={{ color: pal.color, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: `1px solid ${pal.glowBorder}`, paddingBottom: '0.75rem' }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '4px', backgroundColor: pal.solid, boxShadow: `0 0 10px ${pal.glowShadow}` }} />
                          {room.nama} (Maks {room.kapasitas} Orang)
                        </h4>
                        {roomSchedules.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Kosong, belum ada reservasi.</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {roomSchedules.map(s => (
                            <div key={s.id} className="brutal-card" style={{ padding: '1.25rem', borderColor: pal.solid, boxShadow: `4px 4px 0px ${pal.glowBorder}`, background: pal.bg }}>
                              <div style={{ color: pal.color, fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                 <span style={{background: pal.solid, color:'#fff', padding:'0.1rem 0.4rem', borderRadius:'4px'}}>🕒</span> {s.jam_mulai} - {s.jam_selesai}
                              </div>
                              <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{s.agenda}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>👤 Pemesan: {s.nama_lengkap || s.pemesan}</div>
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