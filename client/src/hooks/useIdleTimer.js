import { useState, useEffect, useRef } from 'react';

// Jarak maksimal antara tap pertama & kedua (ms) agar dihitung sebagai double-tap
const DOUBLE_TAP_DELAY = 400;

export default function useIdleTimer(timeoutMs = 300000) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef(null);
  const isIdleRef = useRef(false); // salinan sinkron dari isIdle, dibaca di dalam event listener
  const lastTapRef = useRef(0);

  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      isIdleRef.current = true;
      setIsIdle(true);
    }, timeoutMs);
  };

  const wakeUp = () => {
    isIdleRef.current = false;
    setIsIdle(false);
    startTimer();
  };

  useEffect(() => {
    // Setup awal
    startTimer();

    const handleActivity = (e) => {
      // ── Belum idle (dashboard sedang dipakai) ──
      // Aktivitas apa pun tetap memperpanjang waktu sebelum screensaver muncul,
      // seperti perilaku sebelumnya.
      if (!isIdleRef.current) {
        startTimer();
        return;
      }

      // ── Sedang idle (screensaver tampil) ──
      // Hanya tap/klik yang dihitung; mousemove & scroll diabaikan supaya
      // screensaver tidak langsung hilang hanya karena kursor lewat / layar tersenggol.
      const isTapEvent = e.type === 'touchstart' || e.type === 'mousedown';
      if (!isTapEvent) return;

      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        // Tap kedua datang tepat waktu -> keluar dari screensaver
        lastTapRef.current = 0;
        wakeUp();
      } else {
        // Tap pertama -> catat waktunya, tunggu tap kedua
        lastTapRef.current = now;
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [timeoutMs]);

  return isIdle;
}