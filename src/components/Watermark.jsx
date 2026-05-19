import React from 'react';

// Use public folder path so it always loads reliably in Vite
const LOGO_URL = '/billgen-watermark.png';

// Logo stamp shown at a given position on the bill
function LogoStamp({ style }) {
  return (
    <img
      src={LOGO_URL}
      alt=""
      aria-hidden="true"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        userSelect: 'none',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}

export default function Watermark({ show = true }) {
  if (!show) return null;

  return (
    <div
      className="watermark-overlay"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none', zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Top-center logo */}
      <LogoStamp style={{ top: 10, left: '50%', transform: 'translateX(-50%)', width: 80, opacity: 0.22 }} />

      {/* Center logo — largest */}
      <LogoStamp style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 120, opacity: 0.15 }} />

      {/* Bottom-center logo */}
      <LogoStamp style={{ bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 80, opacity: 0.22 }} />

      {/* Subtle diagonal text watermarks */}
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', top: `${10 + i * 20}%`, left: '50%',
          transform: 'translateX(-50%) rotate(-35deg)',
          color: 'rgba(59, 130, 246, 0.06)', fontSize: '22px', fontWeight: '800',
          letterSpacing: '0.15em', whiteSpace: 'nowrap',
          fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', userSelect: 'none'
        }}>
          BILLGEN • FREE VERSION • BILLGEN • FREE VERSION
        </div>
      ))}
    </div>
  );
}
