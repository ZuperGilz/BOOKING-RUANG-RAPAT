import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from "../img/LOGO-PT-SEMEN-PADANG-HITAM.png";
import { ThemeContext } from '../context/ThemeContext';

// ─── Palet warna dinamis per ruangan ────────────────────────────────────────
// Siap untuk ruang ke-3, ke-4, dst. Tambahkan saja entry baru di sini.
const ROOM_PALETTE = {
  1: {
    color:       '#fca5a5',          // teks
    bg:          'rgba(220,38,38,0.1)',
    border:      'var(--primary)',
    solid:       '#dc2626',          // latar badge
    gradient:    'linear-gradient(135deg, var(--text-main) 0%, var(--text-muted) 100%)', // judul
    accentLine:  'var(--primary)',
    glowBorder:  'rgba(220,38,38,0.25)',
    glowShadow:  'rgba(220,38,38,0.08)',
    chipClass:   'chip-ruang-a',
  },
  2: {
    color:       '#6ee7b7',
    bg:          'rgba(16,185,129,0.1)',
    border:      'var(--success)',
    solid:       '#10b981',
    gradient:    'linear-gradient(135deg, #6ee7b7 0%, var(--success) 100%)',
    accentLine:  'var(--success)',
    glowBorder:  'rgba(16,185,129,0.25)',
    glowShadow:  'rgba(16,185,129,0.08)',
    chipClass:   'chip-ruang-b',
  },
  3: {
    color:       '#93c5fd',
    bg:          'rgba(59,130,246,0.1)',
    border:      '#3b82f6',
    solid:       '#3b82f6',
    gradient:    'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)',
    accentLine:  '#3b82f6',
    glowBorder:  'rgba(59,130,246,0.25)',
    glowShadow:  'rgba(59,130,246,0.08)',
    chipClass:   'chip-ruang-c',
  },
  4: {
    color:       '#c4b5fd',
    bg:          'rgba(139,92,246,0.1)',
    border:      '#8b5cf6',
    solid:       '#8b5cf6',
    gradient:    'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%)',
    accentLine:  '#8b5cf6',
    glowBorder:  'rgba(139,92,246,0.25)',
    glowShadow:  'rgba(139,92,246,0.08)',
    chipClass:   'chip-ruang-d',
  },
};

// Fallback untuk ruang yang belum terdaftar di palet
const ROOM_PALETTE_DEFAULT = {
  color:      '#fdba74',
  bg:         'rgba(249,115,22,0.1)',
  border:     '#f97316',
  solid:      '#f97316',
  gradient:   'linear-gradient(135deg, #fdba74 0%, #f97316 100%)',
  accentLine: '#f97316',
  glowBorder: 'rgba(249,115,22,0.25)',
  glowShadow: 'rgba(249,115,22,0.08)',
  chipClass:  'chip-ruang-x',
};

const getRoomPalette = (roomId) => ROOM_PALETTE[roomId] || ROOM_PALETTE_DEFAULT;

// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [schedules, setSchedules]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [currentTime, setCurrentTime]   = useState(new Date());
  const [isHovered, setIsHovered]       = useState(false);
  const [flippedIdx, setFlippedIdx]     = useState(0); // indeks kartu yang aktif
  const scrollContainerRef              = useRef(null);
  const navigate                        = useNavigate();
  const { theme, toggleTheme }          = useContext(ThemeContext);

  // Auto-scroll untuk upcoming list
  useEffect(() => {
    if (isHovered || !scrollContainerRef.current) return;
    const id = setInterval(() => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 1) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(id);
  }, [isHovered, schedules]);

  // Fetch jadwal publik
  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await axios.get('http://localhost:5000/api/bookings/public/schedule');
        setSchedules(r.data);
      } catch (e) {
        console.error("Gagal mengambil jadwal:", e);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetch();
    const id = setInterval(fetch, 300000);
    return () => clearInterval(id);
  }, []);

  // Clock
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Auto flip-back ke kartu pertama setelah 8 detik
  useEffect(() => {
    if (flippedIdx === 0) return;
    const id = setTimeout(() => setFlippedIdx(0), 8000);
    return () => clearTimeout(id);
  }, [flippedIdx]);

  // Helper untuk mendapatkan tanggal lokal (menghindari bug UTC)
  const getLocalDateString = (dateValue) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // ── Proses jadwal ──────────────────────────────────────────────────────────
  const processSchedules = () => {
    const valid = [];
    schedules.forEach(item => {
      const dateOnly   = getLocalDateString(item.tanggal);
      const startDT    = new Date(`${dateOnly}T${item.jam_mulai}:00`);
      const endDT      = new Date(`${dateOnly}T${item.jam_selesai}:00`);
      let status = 'UPCOMING';
      if (currentTime >= startDT && currentTime <= endDT) status = 'ONGOING';
      else if (currentTime > endDT)                        status = 'FINISHED';
      if (status !== 'FINISHED') valid.push({ ...item, startDT, endDT, status });
    });
    // ONGOING lebih prioritas dari UPCOMING
    valid.sort((a, b) => {
      if (a.status === 'ONGOING' && b.status !== 'ONGOING') return -1;
      if (b.status === 'ONGOING' && a.status !== 'ONGOING') return  1;
      return a.startDT - b.startDT;
    });
    return valid;
  };

  const activeSchedules = processSchedules();

  // ── Kelompokkan per ruangan untuk flip ─────────────────────────────────────
  // Ambil satu jadwal terdekat per ruangan, urutkan: yang sedang berlangsung dulu
  const roomMap = {};
  activeSchedules.forEach(s => {
    if (!roomMap[s.room_id]) roomMap[s.room_id] = s; // hanya ambil yang pertama (terdekat)
  });
  // flipCards = array kartu per ruangan, diurutkan: ONGOING dulu, lalu by startDT
  const flipCards = Object.values(roomMap).sort((a, b) => {
    if (a.status === 'ONGOING' && b.status !== 'ONGOING') return -1;
    if (b.status === 'ONGOING' && a.status !== 'ONGOING') return  1;
    return a.startDT - b.startDT;
  });

  const heroMeeting  = activeSchedules.length > 0 ? activeSchedules[0] : null;
  const currentCard  = flipCards[flippedIdx] || flipCards[0];
  const nextCard     = flipCards[(flippedIdx + 1) % flipCards.length];

  // Upcoming = semua jadwal kecuali yang sudah tampil di flip cards (satu per ruang)
  const flipCardIds  = new Set(flipCards.map(s => s.id));
  const upcomingMeetings = activeSchedules.filter(s => !flipCardIds.has(s.id)).slice(0, 8);

  // ── Format helpers ─────────────────────────────────────────────────────────
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

  const calculateDuration = (start, end) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const total = (eH * 60 + eM) - (sH * 60 + sM);
    const h = Math.floor(total / 60), m = total % 60;
    if (h > 0 && m > 0) return `${h} J ${m} M`;
    if (h > 0) return `${h} Jam`;
    return `${m} Menit`;
  };

  // ── Render isi kartu (sepenuhnya dinamis berdasarkan room_id) ──────────────
  const renderCardContent = (meeting, cardIdx) => {
    const isActive = cardIdx === flippedIdx; // kartu ini yang sedang di depan?
    const pal      = getRoomPalette(meeting?.room_id);

    if (!meeting) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', padding: '2.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', opacity: 0.3 }}>🏢</span>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Tidak ada jadwal mendatang di ruangan ini</p>
          <button
            onClick={() => setFlippedIdx(0)}
            style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
          >
            ← Kembali
          </button>
        </div>
      );
    }

    const isOngoing   = meeting.status === 'ONGOING';
    const hasMultiple = flipCards.length > 1;
    // Ruangan berikutnya (untuk label hint)
    const nextRoomName = nextCard?.nama_ruangan ?? '';

    return (
      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

        {/* Accent line atas — selalu tampil (bukan hanya saat ONGOING) */}
        <div style={{
          position: 'absolute', top: '-1px', left: '-1px', right: '-1px', height: '4px',
          background: `linear-gradient(90deg, ${pal.accentLine}, transparent)`,
          borderRadius: '24px 24px 0 0'
        }} />

        <div className="flex-between" style={{ marginBottom: '2rem' }}>

          {/* Status badge */}
          {isOngoing ? (
            <div className="brutal-badge" style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              borderColor: pal.border, color: pal.color, background: pal.bg
            }}>
              <span style={{
                width: '8px', height: '8px', background: pal.solid,
                borderRadius: '50%', animation: 'pulseGlow 2s infinite'
              }} />
              SEDANG BERLANGSUNG
            </div>
          ) : (
            <div className="brutal-badge" style={{ borderColor: 'var(--warning)', color: '#fcd34d', background: 'rgba(245,158,11,0.1)' }}>
              ⏱️ SEGERA DATANG
            </div>
          )}

          {/* Room badge — flip trigger */}
          <div
            className={hasMultiple ? 'brutal-badge flip-trigger-badge' : 'brutal-badge'}
            onClick={() => {
              if (!hasMultiple) return;
              setFlippedIdx((flippedIdx + 1) % flipCards.length);
            }}
            title={hasMultiple ? `Tap untuk lihat ${nextRoomName}` : meeting.nama_ruangan}
            style={{
              background: pal.solid, color: 'white', borderColor: pal.solid,
              cursor: hasMultiple ? 'pointer' : 'default',
            }}
          >
            {hasMultiple && (
              <span className="flip-hint">↺ Lihat {nextRoomName}</span>
            )}
            {meeting.nama_ruangan}
          </div>
        </div>

        {/* Konten utama */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{
              fontSize: '2.5rem', marginBottom: '0.25rem', lineHeight: 1.1,
              fontFamily: 'Outfit, sans-serif', fontWeight: 600,
              background: pal.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {meeting.agenda}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              {formatDate(meeting.tanggal)} • {meeting.jam_mulai} - {meeting.jam_selesai}&nbsp;
              ({calculateDuration(meeting.jam_mulai, meeting.jam_selesai)})
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pemesan / PIC</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{meeting.pemesan}</strong>
            </div>
            {meeting.pemateri && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Narasumber</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{meeting.pemateri}</strong>
              </div>
            )}
          </div>

          {/* Hint flip di bawah */}
          {hasMultiple && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                ↺ TAP BADGE {meeting.nama_ruangan.toUpperCase()} UNTUK LIHAT {nextRoomName.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* HEADER */}
      <header className="glass-card animate-fade-in-up" style={{
        margin: '1rem', padding: '1rem 2rem', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'white', padding: '0.25rem', borderRadius: '8px' }}>
            <img src={logo} alt="Semen Padang" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Portal Ruang Rapat</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PT Semen Padang</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            className="btn-outline-glass"
            style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--badge-bg)' }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="btn btn-outline-glass" onClick={() => navigate('/login')}>
            Akses Sistem (Login)
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade-in-up stagger-1">
          <h2 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Jadwal Eksekutif</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Sistem informasi penggunaan ruang rapat real-time.</p>
        </div>

        <div style={{ width: '100%', maxWidth: '1200px' }}>
          {loading ? (
            <div className="bento-grid animate-fade-in stagger-2">
              <div className="glass-card bento-card-large skeleton" style={{ height: '400px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="brutal-card skeleton" style={{ height: '190px' }} />
                <div className="brutal-card skeleton" style={{ height: '190px' }} />
              </div>
            </div>
          ) : !heroMeeting ? (
            <div className="glass-card animate-fade-in-up stagger-2" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}>📭</span>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Tidak Ada Rapat Terjadwal</h3>
              <p style={{ color: 'var(--text-muted)' }}>Seluruh ruangan tersedia dan bebas digunakan saat ini.</p>
            </div>
          ) : (
            <>
              {/* BENTO GRID */}
              <div className="bento-grid animate-fade-in-up stagger-2" style={{ marginBottom: '3rem' }}>

                {/* KOLOM KIRI: FLIP CARD */}
                <div className="bento-card-large" style={{ position: 'relative' }}>

                  {/* Wrapper dengan perspective untuk 3D flip */}
                  <div style={{ perspective: '1200px', width: '100%', height: '100%', minHeight: '340px' }}>
                    <div style={{
                      position: 'relative', width: '100%', height: '100%', minHeight: '340px',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.75s cubic-bezier(0.4, 0.2, 0.2, 1)',
                      transform: flippedIdx % 2 === 0 ? 'rotateY(0deg)' : 'rotateY(180deg)',
                    }}>

                      {/* SISI DEPAN (0 deg) */}
                      {(() => {
                        // Tentukan kartu mana yang harus tampil di sisi depan
                        // Jika flippedIdx genap (0, 2, 4), maka sisi depan adalah kartu aktif.
                        // Jika flippedIdx ganjil (1, 3), sisi depan disiapkan untuk kartu berikutnya.
                        const frontIdx = flippedIdx % 2 === 0 ? flippedIdx : (flippedIdx + 1) % flipCards.length;
                        const card = flipCards[frontIdx];
                        const p = getRoomPalette(card?.room_id);
                        return (
                          <div style={{
                            position: 'absolute', inset: 0,
                            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                            borderRadius: '24px', overflow: 'hidden',
                            background: 'var(--glass-bg)',
                            backdropFilter: 'var(--glass-blur)',
                            WebkitBackdropFilter: 'var(--glass-blur)',
                            border: `1px solid ${card ? p.glowBorder : 'var(--glass-border)'}`,
                            boxShadow: `var(--glass-shadow), 0 0 40px ${card ? p.glowShadow : 'transparent'}`,
                          }}>
                            {renderCardContent(card, frontIdx)}
                          </div>
                        );
                      })()}

                      {/* SISI BELAKANG (180 deg) */}
                      {flipCards.length > 1 && (() => {
                        // Jika flippedIdx ganjil, sisi belakang adalah kartu aktif.
                        // Jika flippedIdx genap, sisi belakang disiapkan untuk kartu berikutnya.
                        const backIdx = flippedIdx % 2 === 1 ? flippedIdx : (flippedIdx + 1) % flipCards.length;
                        const card = flipCards[backIdx];
                        const p = getRoomPalette(card?.room_id);
                        return (
                          <div style={{
                            position: 'absolute', inset: 0,
                            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            borderRadius: '24px', overflow: 'hidden',
                            background: 'var(--glass-bg)',
                            backdropFilter: 'var(--glass-blur)',
                            WebkitBackdropFilter: 'var(--glass-blur)',
                            border: `1px solid ${card ? p.glowBorder : 'var(--glass-border)'}`,
                            boxShadow: `var(--glass-shadow), 0 0 40px ${card ? p.glowShadow : 'transparent'}`,
                          }}>
                            {renderCardContent(card, backIdx)}
                          </div>
                        );
                      })()}

                    </div>
                  </div>

                  {/* Dot indicator — satu dot per ruangan */}
                  {flipCards.length > 1 && (
                    <div style={{
                      position: 'absolute', bottom: '-20px', left: '50%',
                      transform: 'translateX(-50%)', display: 'flex', gap: '6px'
                    }}>
                      {flipCards.map((card, i) => {
                        const p = getRoomPalette(card.room_id);
                        return (
                          <div
                            key={card.room_id}
                            onClick={() => setFlippedIdx(i)}
                            style={{
                              width: '7px', height: '7px', borderRadius: '50%',
                              background: flippedIdx === i ? p.solid : 'var(--text-muted)',
                              transition: 'background 0.3s, transform 0.2s',
                              cursor: 'pointer',
                              transform: flippedIdx === i ? 'scale(1.3)' : 'scale(1)',
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* KOLOM KANAN: BRUTAL CARDS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="brutal-card" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--primary)' }}>✦</span> Fasilitas Utama
                    </h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <li style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--text-main)' }}>✓</span> Smart TV Interaktif / Proyektor</li>
                      <li style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--text-main)' }}>✓</span> Papan Tulis Kaca & Boardmarker</li>
                      <li style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--text-main)' }}>✓</span> AC & WiFi High-Speed</li>
                    </ul>
                  </div>

                  <div className="brutal-card" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--warning)' }}>⚠️</span> Tata Tertib
                    </h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <li style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--primary)' }}>•</span> Dilarang merokok/vaping di dalam</li>
                      <li style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--primary)' }}>•</span> Kembalikan kursi setelah selesai</li>
                      <li style={{ display: 'flex', gap: '0.75rem' }}><span style={{ color: 'var(--primary)' }}>•</span> Matikan perangkat elektronik</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* UPCOMING HORIZONTAL SCROLL */}
              {upcomingMeetings.length > 0 && (
                <div className="animate-fade-in-up stagger-3" style={{ width: '100%', position: 'relative' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', paddingLeft: '0.5rem', borderLeft: '4px solid var(--primary)' }}>
                    Rapat Mendatang
                  </h3>
                  <div
                    ref={scrollContainerRef}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                      display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem',
                      scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none'
                    }}
                  >
                    {upcomingMeetings.map((item, idx) => {
                      const p = getRoomPalette(item.room_id);
                      return (
                        <div
                          key={item.id || idx}
                          className="glass-card glass-card-hover"
                          style={{
                            minWidth: '320px', padding: '1.5rem', display: 'flex', flexDirection: 'column',
                            borderTop: `3px solid ${p.solid}`,
                          }}
                        >
                          <div className="flex-between" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: p.solid, letterSpacing: '0.05em' }}>
                              {item.nama_ruangan}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.jam_mulai}</span>
                          </div>
                          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.agenda}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                            👤 {item.pemesan} • {formatDate(item.tanggal)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
