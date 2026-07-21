import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import logoSP from '../../img/LOGO-PT-SEMEN-PADANG-HITAM.png';

// ─────────────────────────────────────────────────────────────
// BACKGROUND IMAGE PATH – ganti file ini untuk mengubah background
// File: client/public/img/background.png
// ─────────────────────────────────────────────────────────────
const BACKGROUND_IMAGE = '/img/background.jpeg';

export default function Screensaver({ roomInfo, schedule = [], upcoming = [], currentTime: externalTime }) {
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await api.get('/kiosk/active-media');
        if (res.data && res.data.length > 0) setMedia(res.data);
      } catch (err) {
        console.error('Failed to fetch kiosk media', err);
      }
    };
    fetchMedia();
  }, []);

  useEffect(() => {
    if (media.length === 0) return;
    const durationMs = (media[currentIndex].duration || 5) * 1000;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % media.length);
        setVisible(true);
      }, 600);
    }, durationMs);
    return () => clearTimeout(timer);
  }, [currentIndex, media]);

  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const isRoomBusy = () => {
    if (!schedule || !schedule.length) return false;
    const now = currentTime;
    return schedule.some(b => {
      if (b.status !== 'APPROVED') return false;
      const [hS, mS] = b.jam_mulai.split(':');
      const [hE, mE] = b.jam_selesai.split(':');
      const start = new Date(); start.setHours(hS, mS, 0);
      const end = new Date(); end.setHours(hE, mE, 0);
      return now >= start && now <= end;
    });
  };

  const busy = isRoomBusy();
  const nextMeeting = upcoming && upcoming.length > 0 ? upcoming[0] : null;

  const isYoutube = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const getYoutubeVideoId = (url) => {
    const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (m && m[2].length === 11) ? m[2] : '';
  };
  const getYoutubeThumbnail = (url) => `https://img.youtube.com/vi/${getYoutubeVideoId(url)}/maxresdefault.jpg`;

  if (media.length === 0) {
    return (
      <div className="ss-overlay">
        <img src={BACKGROUND_IMAGE} className="ss-bg-img" alt="" />
        <div className="ss-bg-overlay" />
        <div className="ss-glow ss-glow-left" />
        <div className="ss-glow ss-glow-right" />
        <div className="ss-layout ss-layout-empty">
          <div className="ss-header">
            <Logo />
            <div className="ss-header-clock">
              <div className="ss-clock-time">{timeStr}</div>
              <div className="ss-clock-divider" />
              <div className="ss-clock-date">{dateStr}</div>
            </div>
          </div>
          <div className="ss-portrait-clock">
            <div className="ss-clock-time">{timeStr}</div>
            <div className="ss-clock-date">{dateStr}</div>
          </div>
          <div style={{ flex: 1 }} />
          <RoomBar roomInfo={roomInfo} busy={busy} nextMeeting={nextMeeting} />
        </div>
        <style>{CSS}</style>
      </div>
    );
  }

  const item = media[currentIndex];
  const thumbSrc = isYoutube(item.url) ? getYoutubeThumbnail(item.url) : item.url;

  return (
    <div className="ss-overlay">
      <img src={BACKGROUND_IMAGE} className="ss-bg-img" alt="" />
      <div className="ss-bg-overlay" />
      <div className="ss-glow ss-glow-left" />
      <div className="ss-glow ss-glow-right" />

      <div className="ss-layout">
        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div className="ss-header">
          <Logo />
          <div className="ss-header-clock">
            <div className="ss-clock-time">{timeStr}</div>
            <div className="ss-clock-divider" />
            <div className="ss-clock-date">{dateStr}</div>
          </div>
        </div>

        {/* Jam besar di bawah header (portrait only) */}
        <div className="ss-portrait-clock">
          <div className="ss-clock-time">{timeStr}</div>
          <div className="ss-clock-date">{dateStr}</div>
        </div>

        {/* ══ MEDIA CARD ══════════════════════════════════════ */}
        <div className="ss-media-wrap">
          <div
            className="ss-media-card"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            {/* Foto / video (Kotak fleksibel mengikuti aspek rasio konten asli) */}
            <div className="ss-img-wrap">
              {item.type === 'IMAGE' || isYoutube(item.url) ? (
                <img src={thumbSrc} alt={item.title} className="ss-img" />
              ) : (
                <video src={item.url} className="ss-img" autoPlay muted loop playsInline />
              )}
            </div>

            {/* Teks */}
            <div className="ss-media-text">
              <span className="ss-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l18-5v12L3 13v-2z" />
                  <path d="M11.6 16.8 13 21h-3l-1-4" />
                </svg>
                INFO TERBARU
              </span>
              <h2 className="ss-title">{item.title}</h2>
              {item.caption && <p className="ss-caption">{item.caption}</p>}
            </div>
          </div>

          {/* Slide indicators */}
          {media.length > 1 && (
            <div className="ss-indicators">
              {media.map((_, i) => (
                <span key={i} className={`ss-dot-ind ${i === currentIndex ? 'active' : ''}`} />
              ))}
            </div>
          )}
        </div>

        {/* ══ ROOM BAR ════════════════════════════════════════ */}
        <RoomBar roomInfo={roomInfo} busy={busy} nextMeeting={nextMeeting} />
      </div>

      <style>{CSS}</style>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────
function Logo() {
  return (
    <div className="ss-logo-wrap">
      <span className="ss-logo-badge">
        <img src={logoSP} className="ss-logo-img" alt="Semen Padang" />
      </span>
      <div>
        <div className="ss-logo-name">SEMEN PADANG</div>
        <div className="ss-logo-sub">Sejak 1910</div>
      </div>
    </div>
  );
}

function RoomBar({ roomInfo, busy, nextMeeting }) {
  return (
    <div className="rb-bar">
      {/* Nama ruang + status */}
      <div className="rb-section">
        <div className="rb-icon" style={{ background: busy ? '#DC2626' : '#16a34a' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div className="rb-text">
          <div className="rb-room-name">{roomInfo?.roomName || 'RUANG RAPAT'}</div>
          <div className="rb-status" style={{ color: busy ? '#f87171' : '#4ade80' }}>
            {busy ? 'Sedang Digunakan' : 'Tersedia'}
          </div>
        </div>
      </div>

      <div className="rb-divider" />

      {/* Jadwal berikutnya */}
      <div className="rb-section">
        <div className="rb-icon" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div className="rb-text">
          <div className="rb-label">Jadwal berikutnya</div>
          <div className="rb-value">
            {nextMeeting
              ? `${nextMeeting.jam_mulai} - ${nextMeeting.jam_selesai}  ·  ${nextMeeting.agenda}`
              : 'Tidak ada jadwal berikutnya'}
          </div>
        </div>
      </div>

      <div className="rb-divider" />

      {/* Ketuk layar */}
      <div className="rb-section rb-tap">
        <div className="rb-icon rb-icon-tap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/>
            <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/>
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
          </svg>
        </div>
        <div className="rb-tap-text">Ketuk 2x layar untuk melihat informasi</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CSS (Telah dimodifikasi untuk membuat center point yang seimbang)
// ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

/* ═══ BASE ════════════════════════════════════════════════ */
.ss-overlay {
  position: fixed; inset: 0;
  width: 100vw; height: 100vh;
  z-index: 99999;
  overflow: hidden;
  cursor: none;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #fff;
  background: #0a0a0a;
}

.ss-bg-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  object-position: center top;
  z-index: 0;
}

.ss-bg-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    160deg,
    rgba(5,5,5,0.66) 0%,
    rgba(5,5,5,0.5) 40%,
    rgba(5,5,5,0.78) 100%
  );
  z-index: 1;
}

.ss-glow {
  position: absolute;
  width: 60vw; height: 60vw;
  max-width: 620px; max-height: 620px;
  border-radius: 50%;
  z-index: 1;
  pointer-events: none;
  filter: blur(4px);
  opacity: 0.55;
}
.ss-glow-left {
  left: -22vw; bottom: -30vw;
  background: radial-gradient(circle at 35% 35%, rgba(220,38,38,0.55), rgba(127,14,14,0.15) 55%, transparent 72%);
}
.ss-glow-right {
  right: -18vw; bottom: -34vw;
  background: radial-gradient(circle at 65% 30%, rgba(255,255,255,0.10), transparent 65%);
}

/* ═══ MAIN LAYOUT ══════════════════════════════════════════ */
.ss-layout {
  position: relative; z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1.75rem 2rem 1.5rem;
  box-sizing: border-box;
}

/* ═══ HEADER ROW ═══════════════════════════════════════════ */
.ss-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
  margin-bottom: auto; /* Mendorong konten di bawahnya ke area tengah vertikal */
}

.ss-logo-wrap {
  display: flex; align-items: center; gap: 0.75rem;
}
.ss-logo-badge {
  width: 46px; height: 46px; flex-shrink: 0;
  border-radius: 50%;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  padding: 6px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.4);
}
.ss-logo-img {
  width: 100%; height: 100%; object-fit: contain;
}
.ss-logo-name {
  font-weight: 800; font-size: 1rem; letter-spacing: 0.06em; line-height: 1.25;
}
.ss-logo-sub {
  font-size: 0.72rem; color: rgba(255,255,255,0.6); letter-spacing: 0.03em;
}

.ss-header-clock {
  display: flex; align-items: center; gap: 1rem;
}
.ss-clock-time {
  font-size: clamp(2rem, 3.4vw, 2.6rem);
  font-weight: 900; line-height: 1; letter-spacing: -0.02em;
  text-shadow: 0 3px 16px rgba(0,0,0,0.6);
}
.ss-clock-divider {
  width: 1.5px; height: 2.2rem;
  background: rgba(255,255,255,0.3); border-radius: 2px; flex-shrink: 0;
}
.ss-clock-date {
  font-size: 0.85rem;
  font-weight: 500; color: rgba(255,255,255,0.75);
  line-height: 1.35; max-width: 150px;
}

.ss-portrait-clock { display: none; flex-shrink: 0; }

/* ═══ MEDIA WRAP + CARD (CENTER POINT LAYOUT) ══════════════ */
.ss-media-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px; /* Batasi lebar maksimal agar teks dan gambar tidak terlalu jauh */
  margin: 0 auto; /* Tengah secara horizontal */
  margin-bottom: auto; /* Mengimbangi margin-bottom pada header agar pas di tengah layar */
}

.ss-media-card {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center; /* Membuat grup box gambar & teks rata tengah */
  gap: 3rem;
}

/* Kotak pembungkus gambar: fleksibel menyusut berdasarkan konten asli gambarnya */
.ss-img-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(0,0,0,0.4);
  border: 2px solid rgba(255,255,255,0.14);
  box-shadow: 0 14px 40px rgba(0,0,0,0.45);
  max-height: 60vh; /* DINAIKKAN dari 48vh agar gambar lebih tinggi */
  max-width: 65%;   /* DINAIKKAN dari 50% agar gambar mengambil porsi lebih lebar */
  flex-shrink: 0;   /* Mencegah kotak gambar menyusut dipaksa oleh teks */
}

.ss-img {
  max-width: 100%;
  max-height: 60vh; /* Disamakan dengan tinggi pembungkus */
  object-fit: contain;
  display: block;
}

/* Teks Kanan */
.ss-media-text {
  flex: 1;
  max-width: 450px; 
  display: flex; 
  flex-direction: column;
  gap: 0.9rem;
}
.ss-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  align-self: flex-start;
  background: #DC2626; color: #fff;
  font-size: 0.68rem; font-weight: 800;
  letter-spacing: 0.09em; text-transform: uppercase;
  padding: 0.4rem 0.85rem; border-radius: 999px;
}
.ss-title {
  font-size: clamp(1.3rem, 2.4vw, 2rem);
  font-weight: 800; line-height: 1.3; color: #fff; margin: 0;
}
.ss-caption {
  font-size: clamp(0.85rem, 1.1vw, 0.95rem);
  font-weight: 400; color: rgba(255,255,255,0.7);
  line-height: 1.6; margin: 0;
}

/* ═══ SLIDE INDICATORS ════════════════════════════════════ */
.ss-indicators {
  display: flex; gap: 6px; justify-content: center;
  align-items: center; flex-shrink: 0;
}
.ss-dot-ind {
  display: block; width: 6px; height: 6px;
  border-radius: 50%; background: rgba(255,255,255,0.28);
  transition: all 0.3s ease;
}
.ss-dot-ind.active {
  width: 22px; border-radius: 3px; background: #DC2626;
}

/* ═══ ROOM BAR ════════════════════════════════════════════ */
.rb-bar {
  display: flex; align-items: center;
  background: rgba(8,8,8,0.62);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 999px;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 6px 26px rgba(0,0,0,0.35);
  flex-shrink: 0;
  overflow: hidden;
}
.rb-section { flex: 1; display: flex; align-items: center; gap: 0.65rem; min-width: 0; }
.rb-tap { flex: 0 0 auto; }
.rb-text { min-width: 0; flex: 1; overflow: hidden; }
.rb-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.14); margin: 0 1.25rem; flex-shrink: 0; }
.rb-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rb-icon-tap { background: transparent; border: 1.5px solid rgba(255,255,255,0.5); }
.rb-room-name { font-weight: 700; font-size: 0.9rem; letter-spacing: 0.04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rb-status { font-size: 0.78rem; font-weight: 600; margin-top: 1px; }
.rb-label { font-size: 0.68rem; color: rgba(255,255,255,0.48); font-weight: 500; line-height: 1.4; }
.rb-value { font-size: 0.82rem; color: rgba(255,255,255,0.88); font-weight: 600; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rb-tap-text { font-size: 0.85rem; color: rgba(255,255,255,0.85); font-weight: 600; white-space: nowrap; }

/* ═══════════════════════════════════════════════════════════
   PORTRAIT / MOBILE
   ═══════════════════════════════════════════════════════════ */
@media (orientation: portrait), (max-width: 640px) {
  .ss-layout { padding: 1.25rem 1.25rem 1rem; gap: 0.85rem; }
  .ss-header { margin-bottom: 0; }
  .ss-header-clock { display: none; }
  .ss-portrait-clock { display: block; }
  .ss-media-wrap { margin-bottom: auto; gap: 0.9rem; }
  .ss-media-card { flex-direction: column; gap: 1.1rem; }
  
  .ss-img-wrap {
    flex: 0 0 auto;
    width: auto;
    max-width: 100%;
    height: auto;
    max-height: 35vh;
  }
  .ss-img {
    max-height: 35vh;
  }

  .ss-media-text { align-items: center; text-align: center; max-width: 100%; }
  .ss-badge { align-self: center; }
  .ss-title { font-size: clamp(1.1rem, 5.5vw, 1.5rem); }
  .ss-caption { font-size: 0.85rem; }

  .rb-bar { flex-wrap: wrap; gap: 0.6rem; padding: 0.85rem 1.1rem; border-radius: 18px; }
  .rb-section { flex: 1 1 45%; min-width: 0; }
  .rb-tap { flex: 1 1 100%; justify-content: center; padding-top: 0.35rem; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 0.35rem; }
  .rb-divider { display: none; }
  .rb-room-name { font-size: 0.85rem; }
  .rb-value { font-size: 0.75rem; }
}
`;