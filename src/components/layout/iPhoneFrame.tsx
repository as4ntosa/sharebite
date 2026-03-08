'use client';

import { useEffect, useState, useRef } from 'react';

// ─── Status Bar ────────────────────────────────────────────────────────────
function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex items-center justify-between shrink-0 select-none"
      style={{ padding: '14px 28px 6px' }}
    >
      {/* Time */}
      <span style={{ fontSize: 15, fontWeight: 700, color: '#111', letterSpacing: -0.3, width: 60 }}>
        {time}
      </span>

      {/* Dynamic Island */}
      <div
        style={{
          width: 126,
          height: 36,
          background: '#000',
          borderRadius: 20,
        }}
      />

      {/* Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 60, justifyContent: 'flex-end' }}>
        {/* Signal bars */}
        <svg width="17" height="12" viewBox="0 0 17 12">
          <rect x="0" y="6" width="3" height="6" rx="1" fill="#111" />
          <rect x="4.5" y="4" width="3" height="8" rx="1" fill="#111" />
          <rect x="9" y="2" width="3" height="10" rx="1" fill="#111" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#111" />
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 20 15">
          <circle cx="10" cy="13.5" r="1.8" fill="#111" />
          <path d="M5.5 9C7 7.4 8.4 6.6 10 6.6s3 .8 4.5 2.4" stroke="#111" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M2 5.5C4.2 3 6.9 1.5 10 1.5s5.8 1.5 8 4" stroke="#111" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <div style={{
            width: 25, height: 12, borderRadius: 3.5,
            border: '1.5px solid #333',
            display: 'flex', alignItems: 'center', padding: '1.5px',
          }}>
            <div style={{ width: '80%', height: '100%', background: '#22c55e', borderRadius: 2 }} />
          </div>
          <div style={{ width: 2, height: 5, background: '#555', borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Home Indicator ────────────────────────────────────────────────────────
function HomeIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 10px', flexShrink: 0 }}>
      <div style={{ width: 134, height: 5, background: '#111', borderRadius: 3, opacity: 0.18 }} />
    </div>
  );
}

// ─── Desktop Wallpaper ────────────────────────────────────────────────────
function Wallpaper() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 40%, #2c5364 100%)',
        zIndex: 0,
      }}
    >
      {/* Subtle blur circles */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)',
        top: -100, left: -100,
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        bottom: -80, right: -80,
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
        top: '40%', right: '20%',
      }} />
    </div>
  );
}

// ─── iPhone Frame ─────────────────────────────────────────────────────────
const DEVICE_W = 393;
const DEVICE_H = 852;
const BORDER = 12;
const CORNER = 54;

interface iPhoneFrameProps {
  children: React.ReactNode;
}

export function IPhoneFrame({ children }: iPhoneFrameProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const totalW = DEVICE_W + BORDER * 2 + 40; // device + border + padding
      const totalH = DEVICE_H + BORDER * 2 + 80;
      const s = Math.min((vh / totalH) * 0.96, (vw / totalW) * 0.96, 1);
      setScale(s);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return (
    <>
      {/* ── Desktop ── */}
      <div
        className="hidden md:flex"
        style={{
          position: 'fixed',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Wallpaper />

        {/* Label above */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.35)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          zIndex: 10,
          userSelect: 'none',
        }}>
          NibbleNet · iOS Preview
        </div>

        {/* Scaled phone wrapper */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            zIndex: 10,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            flexShrink: 0,
          }}
        >
          {/* Outer shell — the "case" */}
          <div
            style={{
              width: DEVICE_W + BORDER * 2,
              height: DEVICE_H + BORDER * 2,
              borderRadius: CORNER + BORDER,
              background: 'linear-gradient(160deg, #2a2a2a 0%, #1a1a1a 50%, #111 100%)',
              boxShadow: [
                '0 0 0 1px rgba(255,255,255,0.08)',
                'inset 0 1px 0 rgba(255,255,255,0.12)',
                '0 40px 100px rgba(0,0,0,0.8)',
                '0 0 60px rgba(0,0,0,0.4)',
              ].join(', '),
              padding: BORDER,
              position: 'relative',
            }}
          >
            {/* Volume up */}
            <div style={{
              position: 'absolute', left: -4, top: 160, width: 4, height: 32,
              background: 'linear-gradient(90deg, #222, #444)',
              borderRadius: '3px 0 0 3px',
            }} />
            {/* Volume down */}
            <div style={{
              position: 'absolute', left: -4, top: 204, width: 4, height: 64,
              background: 'linear-gradient(90deg, #222, #444)',
              borderRadius: '3px 0 0 3px',
            }} />
            <div style={{
              position: 'absolute', left: -4, top: 278, width: 4, height: 64,
              background: 'linear-gradient(90deg, #222, #444)',
              borderRadius: '3px 0 0 3px',
            }} />
            {/* Power button */}
            <div style={{
              position: 'absolute', right: -4, top: 190, width: 4, height: 80,
              background: 'linear-gradient(270deg, #222, #444)',
              borderRadius: '0 3px 3px 0',
            }} />

            {/* Screen */}
            <div
              style={{
                width: DEVICE_W,
                height: DEVICE_H,
                borderRadius: CORNER,
                background: '#f9fafb',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                // Subtle inner screen glow
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
              }}
            >
              <StatusBar />
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  position: 'relative',
                }}
              >
                {children}
              </div>
              <HomeIndicator />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: full screen ── */}
      <div className="md:hidden min-h-screen">
        {children}
      </div>
    </>
  );
}
